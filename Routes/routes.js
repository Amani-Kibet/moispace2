import express from "express";
import { userModel, Messages, interests } from "../models/models.js";
import { validateLogin, validateUser } from "../models/validation.js";
import { authenticate, sanity } from "../middlewares/validations.js";
import upload from "../multer.js";
import {
  findContacts,
  giveMainUser,
  giveUserPage,
  giveUserProfile,
  interestGiver,
  issueData,
  markAsRead,
  obtainHistory,
  unreadFinder,
} from "../middlewares/giver.js";
import { stat } from "fs";
const Router = express.Router();
let errors = [];

Router.get("/", (req, res) => {
  res.render("login", { errors });
}); //hello
Router.get("/login", (req, res) => {
  res.render("login", { errors });
});
Router.get("/chats", authenticate, (req, res) => {
  res.render("chats", { user: req.user });
});
Router.get("/chats/contacts", authenticate, issueData);
Router.get("/chats/main", authenticate, giveMainUser);

Router.get("/chatspage", authenticate, (req, res) => {
  res.render("chatspage", { user: req.user });
});
Router.get("/interests", authenticate, (req, res) => {
  res.render("interests", { user: req.user });
});
Router.get("/home", authenticate, sanity, unreadFinder);
Router.post("/signup", upload.single("profilePic"), (req, res) => {
  validateUser(req, res);
});

Router.get("/signup", (req, res) => {
  res.render("index", { errors: [] });
});
Router.get("/user", authenticate, (req, res) => {
  res.render("foreignUser", { user: req.user });
});
Router.get("/userProfile", authenticate, giveUserProfile);
Router.post("/user", authenticate, sanity, giveUserPage);
Router.get("/logout", authenticate, (req, res) => {
  res.cookie("token", "Logged out User", {
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.render("login", { errors: ["You Logged Out"] });
});
Router.post("/login", async (req, res) => {
  const Login = await validateLogin(req.body, res);
  if (Login.status == "success") {
    const { token, user } = Login;
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect("home");
  } else {
    const { errors } = Login;
    res.render("login", { errors });
  }
});
Router.post("/sendInterest", authenticate, async (req, res) => {
  const save = await interests.create({
    from: req.body.mainUser,
    to: req.body.foreignUser,
    status: "pending",
  });
});
Router.post("/getStatus", authenticate, async (req, res) => {
  const status = await interests.find({
    from: req.body.mainUser,
    to: req.body.foreignUser,
  });
  if (status.length == 0) {
    return res.json({ state: false });
  }
  return res.json({ state: true });
});
Router.post("/markAsRead", markAsRead);

Router.post("/interests", authenticate, interestGiver);

Router.post("/chat/path4", obtainHistory);
export { Router };
Router.get("/homepage", authenticate, async (req, res) => {
  const data = await userModel.aggregate([
    { $sample: { size: 20 } },
    {
      $project: {
        password: 0,
        _id: 0,
        phone: 0,
        updatedAt: 0,
        createdAt: 0,
      },
    },
  ]);
  res.json({ data });
});

Router.get("/everyone", authenticate, async (req, res) => {
  let data = await userModel.find();
  console.log(data);
  res.json({ data });
});
