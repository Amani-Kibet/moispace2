import { userModel, interests } from "./models.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
const salt = Number(process.env.saltRounds) || 10;

const validate = async (username, password, phone) => {
  let isExisting = false;
  try {
    // Check if the username exists
    isExisting = await userModel.findOne({ username: username });

    if (isExisting) {
      console.log(`User "${username}" already exists.`);
      return {
        statusCode: 409,
        success: false,
        isExisting: true,
        message: "Username is already taken.",
      };
    }

    // Save new user
    const hashedPassword = await bcrypt.hash(password, salt);
    const savedUser = await userModel.create({
      username,
      password: hashedPassword,
      phone,
    });
    await interests.create({
      from: username,
      to: "Admin Control",
      status: "interested",
    });
    return {
      statusCode: 200,
      success: true,
      isExisting: false,
      data: savedUser,
    };
  } catch (error) {
    if (error.code === 11000) {
      return {
        statusCode: 409,
        success: false,
        isExisting: true,
        message: "User already exists",
      };
    } else {
      console.error("Validation error:", error);
      return { success: false, error };
    }
  }
};

const findUser = async (username, password) => {
  const User = await userModel.findOne({ username: username });
  if (User) {
    const correctPassword = await bcrypt.compare(password, User.password);
    if (correctPassword) {
      return {
        statusCode: 200,
        status: "success",
        message: "Valid credentials",
        user: {
          id: User._id,
          username: User.username,
          phone: User.phone,
          profileLink: User.profileLink,
        },
      };
    } else {
      return {
        statusCode: 401,
        status: "failed",
        message: "Invalid credentials",
      };
    }
  } else {
    return {
      statusCode: 401,
      status: "failed",
      message: "Invalid user",
    };
  }
};
export { validate, findUser };
