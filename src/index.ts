import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { app } from "./app";
import { environment } from "./environment";

if (
  !process.env.DB_URI ||
  !process.env.SALT_ROUND ||
  !process.env.JWT_SECRET ||
  !process.env.STRIPE_KEY
) {
  throw new Error("Missing Configuration!");
}

mongoose
  .connect(environment.DB_URI)
  .then(() => {
    console.log("Connected!!");
    app.listen(process.env.PORT || 3000);
    console.log("Started!!");
  })
  .catch((err) => {
    console.error("Error in connecting!!");
  });
