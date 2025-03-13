import express from "express";
import bcrypt from "bcryptjs";
import validator from "validator";
import jwt from "jsonwebtoken";
import User from "../database/user.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    let { firstName, lastName, email, password } = req.body;

    firstName = firstName?.trim();
    lastName = lastName?.trim();
    email = email?.trim();
    password = password?.trim();

    // Input validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required to register.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Your email is in an invalid format.",
      });
    }

    if (!validator.isLength(password, { min: 6 })) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await User.findOne({
      where: { email },
      attributes: ["id"],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered. Redirecting to login...",
        redirectUrl: "/login",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "user",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Redirecting to login...",
      redirectUrl: "/login",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
});

router.post("/login", async (req, res) => {
   try {
     const { email, password } = req.body;
 
     if (!email || !password) {
       return res.status(400).json({
         success: false,
         message: "Email and password are required.",
       });
     }
 
     const user = await User.findOne({
       where: { email },
     });
 
     if (!user) {
       return res.status(400).json({
         success: false,
         message: "User does not exist.",
       });
     }
 
     const isMatch = await bcrypt.compare(password, user.password);
 
     if (!isMatch) {
       return res.status(400).json({
         success: false,
         message: "Incorrect password.",
       });
     }
 
     // Create JWT token
     const token = jwt.sign(
       { id: user.id, email: user.email, role: user.role },
       process.env.JWT_SECRET,
       { expiresIn: "1h" }
     );
 
     return res.status(200).json({
       success: true,
       message: "Login successful.",
       token,
     });
   } catch (error) {
     console.error("Error during login:", error);
     return res.status(500).json({
       success: false,
       message: "An error occurred. Please try again.",
     });
   }
 });

export default router;
