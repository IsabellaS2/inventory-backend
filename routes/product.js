import express from "express";
import Product from "../database/product.js";
import authenticateToken from "../middleware/authenticate-token.js";

const router = express.Router();

// Get all products
router.get("/products", authenticateToken, async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get a product by its ID
router.get("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a product
router.post("/add-product", async (req, res) => {
  const { name, price, quantity, description } = req.body;

  if (!name || !price || !quantity || !description) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const newProduct = await Product.create({
      name,
      price,
      quantity,
      description,
    });

    return res.status(201).json(newProduct);
  } catch (error) {
    console.error("❌ Error creating product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a product by ID
router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity, description } = req.body;

  if (!name && !price && !quantity && !description) {
    return res
      .status(400)
      .json({ error: "At least one field is required to update." });
  }

  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (quantity) product.quantity = quantity;
    if (description) product.description = description;

    await product.save();

    return res.status(200).json(product);
  } catch (error) {
    console.error("❌ Error updating product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to delete a product by ID
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    await product.destroy();

    return res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
