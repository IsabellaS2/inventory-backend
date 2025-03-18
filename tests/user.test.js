import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { sequelize } from "../database/user.js";
import User from "../database/user.js";

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

let adminToken;
let userToken;

beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("Database synced successfully.");

    const admin = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "admin",
    });
    adminToken = generateToken(admin);

    const user = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "user@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "user",
    });
    userToken = generateToken(user);
  } catch (error) {
    console.error("Error syncing database:", error);
  }
});

afterAll(async () => {
  await sequelize.close();
});

describe("General API", () => {
  it("should return 200 and a welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Welcome to the Product API!");
  });
});

describe("POST /register", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/register").send({
      firstName: "isabella",
      lastName: "test",
      email: "isabella@test.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("should return 400 for missing fields", async () => {
    const res = await request(app).post("/register").send({
      email: "missing@fields.com",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("All fields are required to register.");
  });

  it("should return 400 for duplicate email", async () => {
    await User.create({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "password123",
    });
    const res = await request(app).post("/register").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "This email is already registered. Redirecting to login..."
    );
  });

  it("should return 400 for invalid email format", async () => {
    const res = await request(app).post("/register").send({
      firstName: "Invalid",
      lastName: "Email",
      email: "not-an-email",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Your email is in an invalid format.");
  });

  it("should return 400 for short password", async () => {
    const res = await request(app).post("/register").send({
      firstName: "Short",
      lastName: "Password",
      email: "short@test.com",
      password: "123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Password must be at least 6 characters long."
    );
  });
});

describe("POST /login", () => {
  beforeAll(async () => {
    await User.create({
      firstName: "bella",
      lastName: "testy",
      email: "bella@testy.com",
      password: await bcrypt.hash("password123", 10),
    });
  });

  it("should login successfully with valid credentials", async () => {
    const res = await request(app).post("/login").send({
      email: "bella@testy.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("should return 400 for incorrect password", async () => {
    const res = await request(app).post("/login").send({
      email: "bella@testy.com",
      password: "wrongpassword",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Incorrect password.");
  });

  it("should return 400 for missing email or password", async () => {
    const res = await request(app).post("/login").send({
      email: "",
      password: "",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email and password are required.");
  });

  it("should return 400 for non-existent user", async () => {
    const res = await request(app).post("/login").send({
      email: "nonexistent@test.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("User does not exist.");
  });
});

describe("POST /logout", () => {
  let token;
  beforeAll(async () => {
    const user = await User.create({
      firstName: "Logout",
      lastName: "User",
      email: "logout@example.com",
      password: await bcrypt.hash("password123", 10),
    });
    token = generateToken(user);
  });

  it("should log out successfully", async () => {
    const res = await request(app)
      .post("/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged out successfully.");
  });

  it("should return 401 if no token is provided", async () => {
    const res = await request(app).post("/logout");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("No token provided. Please log in.");
  });
});

describe("GET /profile", () => {
  let token;
  beforeAll(async () => {
    const user = await User.create({
      firstName: "Profile",
      lastName: "User",
      email: "profile@test.com",
      password: await bcrypt.hash("password123", 10),
    });
    token = generateToken(user);
  });

  it("should fetch user profile with valid token", async () => {
    const res = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe("profile@test.com");
  });

  it("should return 401 if token is missing", async () => {
    const res = await request(app).get("/profile");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("No token provided. Please log in.");
  });
});

describe("GET /users", () => {
  it("should return 200 and a list of users for admin", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should return 403 if a non-admin accesses", async () => {
    const userToken = generateToken({ id: 2, role: "user" });
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Unauthorized: Admins only");
  });
});

describe("PUT /users/:id/role", () => {
  let targetUser;

  beforeAll(async () => {
    targetUser = await User.create({
      firstName: "Target",
      lastName: "User",
      email: "target@test.com",
      password: await bcrypt.hash("password123", 10),
      role: "user",
    });
  });

  it("should successfully update user role", async () => {
    const res = await request(app)
      .put(`/users/${targetUser.id}/role`)
      .send({ role: "manager" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User role updated to manager");
  });

  it("should return 400 for invalid role", async () => {
    const res = await request(app)
      .put(`/users/${targetUser.id}/role`)
      .send({ role: "invalidRole" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid role");
  });

  it("should return 404 if user not found", async () => {
    const res = await request(app)
      .put("/users/9999/role")
      .send({ role: "manager" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});
