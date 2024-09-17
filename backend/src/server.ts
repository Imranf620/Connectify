import express from "express";
import dotenv from "dotenv";
import connectDb from "./utils/connectDb.js";

dotenv.config();

const app = express();

// Ensure environment variables are defined
const port = Number(process.env.PORT) || 8000;
const mongoUrl = process.env.MONGODB_URL;

if (!mongoUrl) {
  throw new Error("MONGODB_URL is not defined in the environment variables.");
}

app.use(express.json());

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  connectDb();
});
