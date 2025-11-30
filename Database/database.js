import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectionDb = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Database connected");
  } catch (error) {
    console.log(error);
  }
};
export default connectionDb;
