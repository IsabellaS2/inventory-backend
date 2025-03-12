// app.js
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import productRoutes from "./routes/product.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(
   cors({
     origin: ["http://localhost:3000"],
     methods: ["GET", "POST", "PUT", "DELETE"],
   })
 );

app.use("/", productRoutes);


app.get("/", (req, res) => {
  res.send("Welcome to the Product API!");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
