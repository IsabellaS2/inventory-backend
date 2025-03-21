import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import productRoutes from "./routes/product.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000", // For local development
      "https://inventory-frontend-rj3w.onrender.com", // For production
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/", productRoutes);
app.use("/", userRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Product API!");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});


export default app;
