import express from "express";
import Product from "../database/product.js";

const router = express.Router();

router.get("/products", async (req, res) => {
   try {
     const products = await Product.findAll();
     res.json(products);
   } catch (error) {
     console.error("❌ Error fetching products:", error);
     res.status(500).json({ error: "Internal Server Error" });
   }
 });

export default router;
