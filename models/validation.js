import { profile } from "console";
import { findUser } from "./saveFunctions.js";
import { validate } from "./saveFunctions.js";
import jwt from "jsonwebtoken";
let errors = [];
import bcrypt from "bcrypt";
import upload from "../multer.js";
import { uploadToImgBB } from "../index.js";

import fs from "fs";
import { userModel } from "./models.js";

const validateUser = async (req, res) => {
  console.log(req.body);
  const { usernameS, passwordS, passwordCS, phoneS } = req.body;
  let errors = [];
  const saltRounds = Number(process.env.saltRounds) || 10;

  let username = usernameS?.trim() || "";
  let password = passwordS;
  let phone = phoneS?.trim() || "";

  if (!username) errors.push("You must provide a username");
  else if (!username.match(/^[a-zA-Z0-9_-]+$/))
    errors.push("Username can only contain letters, numbers, - or _");
  else if (username.length < 4)
    errors.push("Username must be at least 4 characters");
  else if (username.length > 12)
    errors.push("Username must not exceed 12 characters");

  if (!phone) errors.push("You must enter phone number");
  else if (!phone.match(/^[0-9]+$/)) errors.push("Invalid phone number");
  else if (phone.length !== 9 && phone.length !== 10)
    errors.push("Phone must have 10 digits");

  if (!password) errors.push("You must provide a password");
  else if (password.length > 12)
    errors.push("Password cannot exceed 12 characters");

  if (!passwordCS) errors.push("You must confirm your password");
  else if (password !== passwordCS) errors.push("Passwords do not match");

  if (errors.length) return res.render("index", { errors });

  let profileLink = "/mediafiles/defaultProfile.png";
  if (req.file) {
    try {
      profileLink = await uploadToImgBB(req.file.path);
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error("ImgBB upload failed:", err);
      errors.push("Profile picture upload failed");
      return res.render("index", { errors });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await userModel.create({
      username,
      password: hashedPassword,
      phone,
      profileLink,
    });

    res.render("login", { errors: ["Your Account has been created"] });
  } catch (err) {
    console.error(err);
    res.render("index", { errors: ["Something went wrong during signup"] });
  }
};

const validateLogin = async (userData) => {
  errors = [];
  let { usernameL, passwordL } = userData;
  let username = usernameL;
  let password = passwordL;
  if (!username) {
    errors.push("Please provide a username");
  } else if (username.length < 3) {
    errors.push("Invalid username (<3 char)");
  } else if (username.length > 12) {
    errors.push("invalid username (>12 char)");
  }

  if (!password) {
    errors.push("Please provide a password");
  }

  if (errors.length) {
    return { status: "failed", errors };
  } else {
    const findResults = await findUser(username, password);

    if (findResults.status == "success") {
      let user = findResults.user;
      // Convert timestamps to local time
      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username,
          profileLink: user.profileLink,
        },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );
      return { status: "success", token, user };
    } else {
      return {
        status: "failed",
        errors: ["401 Unauthorized", "invalid username or password"],
      };
    }
  }
};

export { validateUser, validateLogin, errors };
