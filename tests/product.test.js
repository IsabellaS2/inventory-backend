import request from "supertest";
import app from "../app.js";
import jwt from "jsonwebtoken";
import Product from "../database/product.js";
import productRoutes from "../routes/user.js";

app.use("/", productRoutes);

let serverInstance;

function generateToken(user = { id: 5, email: "test@example.com" }) {
  return jwt.sign(user, process.env.JWT_SECRET || "secret", {
    expiresIn: "1h",
  });
}

beforeAll((done) => {
  const port = process.env.PRODUCT_TEST_PORT || 6000;
  serverInstance = app.listen(port, () => {
    console.log(`Product test server running on port ${port}`);
    done();
  });
});

afterAll((done) => {
  if (serverInstance) {
    serverInstance.close(done);
  } else {
    done();
  }
});

describe("GET /products", () => {
  it("should return a list of products", async () => {
    const token = generateToken();

    await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 100,
      quantity: 5,
    });

    const response = await request(app)
      .get("/products")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Test Product",
          description: "Test Description",
        }),
      ])
    );
  });
});

describe("GET /products/:id", () => {
  it("should return a product by its ID", async () => {
    const token = generateToken();

    const product = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 100,
      quantity: 5,
    });

    const response = await request(app)
      .get(`/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: product.id,
        name: "Test Product",
        description: "Test Description",
      })
    );
  });

  it("should return 404 if the product is not found", async () => {
    const token = generateToken();

    const response = await request(app)
      .get("/products/999999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Product not found");
  });
});

describe("POST /add-product", () => {
  it("should create a new product", async () => {
    const token = generateToken();

    const newProduct = {
      name: "New Product",
      description: "New Product Description",
      price: 150,
      quantity: 10,
    };

    const response = await request(app)
      .post("/add-product")
      .set("Authorization", `Bearer ${token}`)
      .send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: "New Product",
        description: "New Product Description",
        price: 150,
        quantity: 10,
      })
    );
  });

  it("should return 400 if required fields are missing", async () => {
    const token = generateToken();

    const response = await request(app)
      .post("/add-product")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Incomplete Product" }); // Missing other fields

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("All fields are required.");
  });
});

describe("PUT /products/:id", () => {
  it("should update an existing product", async () => {
    const token = generateToken();

    const product = await Product.create({
      name: "Old Product",
      description: "Old Description",
      price: 50,
      quantity: 5,
    });

    const updatedData = {
      name: "Updated Product",
      description: "Updated Description",
      price: 75,
      quantity: 10,
    };

    const response = await request(app)
      .put(`/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining(updatedData));
  });

  it("should return 404 if the product is not found", async () => {
    const token = generateToken();

    const updatedData = {
      name: "Non-existing Product",
    };

    const response = await request(app)
      .put("/products/999999")
      .set("Authorization", `Bearer ${token}`)
      .send(updatedData);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Product not found.");
  });

  it("should return 400 if no fields are provided for update", async () => {
    const token = generateToken();

    const product = await Product.create({
      name: "Product To Update",
      description: "Description",
      price: 100,
      quantity: 5,
    });

    const response = await request(app)
      .put(`/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "At least one field is required to update."
    );
  });
});

describe("DELETE /products/:id", () => {
  it("should delete a product by its ID", async () => {
    const token = generateToken();

    const product = await Product.create({
      name: "Product To Delete",
      description: "Description",
      price: 50,
      quantity: 5,
    });

    const response = await request(app)
      .delete(`/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Product deleted successfully.");
  });

  it("should return 404 if the product is not found", async () => {
    const token = generateToken();

    const response = await request(app)
      .delete("/products/999999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Product not found.");
  });
});
