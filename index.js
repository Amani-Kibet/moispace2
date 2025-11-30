import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import connectionDb from "./Database/database.js";
import {
  interests,
  Messages,
  userModel,
  comments,
  followers,
  views,
  settings,
} from "./models/models.js";
import { Router } from "./Routes/routes.js";
import { authenticate } from "./middlewares/validations.js";
import upload from "./multer.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const IMGBB_API_KEY = "60674b27502af3f803a73df6524b810e";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use("/", Router);
app.use(express.static("public"));
app.use("/", express.static("html"));
app.use("/mediafiles", express.static("mediafiles"));
app.use("/uploads", express.static("uploads"));
app.set("view engine", "ejs");

connectionDb();

let settingsState = "";
let settingsStateF = async () => {
  let data = await settings.find();
  if (data.length > 0) {
    settingsState = true;
  } else {
    settingsState = false;
  }
};
settingsStateF();
setTimeout(() => {
  if (settingsState) {
    return;
  } else {
    settings.create({
      totalOnline: 0,
      appState: true,
    });
  }
}, 1000);

io.on("connection", async (socket) => {
  console.log("Device Connected:", socket.id);

  // INCREMENT totalOnline (+1)
  await settings.updateOne({}, { $inc: { totalOnline: 1 } }, { upsert: true });

  socket.on("message", async (msg) => {
    io.emit("serverReply", {
      from: msg.from,
      to: msg.to,
      text: msg.text,
    });

    await Messages.create({
      from: msg.from,
      to: msg.to,
      text: msg.text,
      time: `${new Date().getHours()}:${new Date().getMinutes()}`,
    });
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    socket.to(room).emit("user-joined", socket.id);
  });

  socket.on("video-offer", ({ room, offer }) => {
    socket.to(room).emit("video-offer", { offer, from: socket.id });
  });

  socket.on("video-answer", ({ room, answer }) => {
    socket.to(room).emit("video-answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ room, candidate }) => {
    socket.to(room).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("disconnect", async () => {
    console.log("Device Disconnected:", socket.id);

    // DECREMENT totalOnline (–1), but make sure it never goes below zero
    await settings.updateOne(
      {},
      { $inc: { totalOnline: -1 } },
      { upsert: true }
    );
  });
});

async function uploadToImgBB(filePath) {
  const image = fs.readFileSync(filePath, { encoding: "base64" });
  const res = await axios.post(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    new URLSearchParams({ image })
  );
  return res.data.data.url;
}

app.post("/profile/update/pics", upload.any(), async (req, res) => {
  const username = JSON.parse(req.body.username || null);
  if (!username) return res.status(400).json({ message: "username required" });

  const user = await userModel.findOne({ username });
  if (!user) return res.status(404).json({ message: "User not found" });

  let existingGallery = [];
  if (user.gallaryLinks) {
    existingGallery = Array.isArray(user.gallaryLinks)
      ? [...user.gallaryLinks]
      : user.gallaryLinks.split(",").filter(Boolean);
  }

  const updateObj = {};

  for (const f of req.files) {
    const localPath = f.fieldname.startsWith("prof")
      ? `./uploads/profile/${f.filename}`
      : `./uploads/gallery/${f.filename}`;

    const imgUrl = (await uploadToImgBB(localPath)) || localPath;
    if (f.fieldname.startsWith("prof")) updateObj.profileLink = imgUrl;
    else {
      const idx = f.fieldname.startsWith("gallery_")
        ? parseInt(f.fieldname.split("_")[1], 10)
        : NaN;
      if (!isNaN(idx)) {
        while (existingGallery.length <= idx) existingGallery.push("");
        existingGallery[idx] = imgUrl;
      } else existingGallery.push(imgUrl);
    }
    fs.unlinkSync(localPath);
  }

  if (existingGallery.length > 0)
    updateObj.gallaryLinks = existingGallery.join(",");
  if (!Object.keys(updateObj).length)
    return res.json({ message: "No files updated" });

  await userModel.updateOne({ username }, { $set: updateObj });

  res.json({ message: "Profile updated", update: updateObj });
});

app.post("/profile/update/text", authenticate, async (req, res) => {
  const username = req.user.username;
  const { course, year, aboutMe, aboutYou, slogan } = req.body;

  const updateObj = {};
  const setIf = (k, v) => {
    if (v !== undefined && v !== null && String(v).trim()) updateObj[k] = v;
  };
  setIf("course", course);
  setIf("year", year);
  setIf("aboutMe", aboutMe);
  setIf("aboutYou", aboutYou);
  setIf("slogan", slogan);

  if (!Object.keys(updateObj).length)
    return res.json({ message: "No valid fields" });

  await userModel.updateOne({ username }, { $set: updateObj });
  res.json({ message: "Profile updated", update: updateObj });
});

app.post("/interest/info/sent", async (req, res) => {
  const info = await userModel
    .find({ username: req.body.username })
    .select("username profileLink");
  res.json({ info });
});

app.post("/interest/info/received", async (req, res) => {
  const info = await userModel
    .find({ username: req.body.username })
    .select("username profileLink");
  res.json({ info });
});

app.post("/interests/accept", async (req, res) => {
  const { to, from } = req.body;
  try {
    await interests.updateMany(
      { to, from },
      { $set: { status: "interested" } }
    );
    res.json({ status: true });
  } catch (err) {
    res.json({ status: false, error: err });
  }
});

app.post("/interests/decline", async (req, res) => {
  const { to, from } = req.body;
  try {
    await interests.updateMany({ to, from }, { $set: { status: "declined" } });
    res.json({ status: true });
  } catch (err) {
    res.json({ status: false, error: err });
  }
});

app.post("/post/comments", async (req, res) => {
  const { from, to, comment } = req.body;
  if (!from || !to || !comment) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const time = `${new Date().getHours()}:${new Date().getMinutes()}`;

  const newComment = await comments.create({
    from,
    to,
    comment,
    likes: 0,
    time,
  });

  return res.json({ success: true, comment: newComment });
});

app.post("/obtainComments", async (req, res) => {
  const { currentCommentUser } = req.body;
  if (!currentCommentUser)
    return res.status(400).json({ message: "User is required" });

  const userComments = await comments
    .find({ to: currentCommentUser })
    .sort({ _id: 1 });

  res.json({ success: true, comments: userComments });
});

app.post("/toggleLike", async (req, res) => {
  const { commentId, username } = req.body;

  if (!commentId || !username) {
    return res.status(400).json({ error: "Missing commentId or username" });
  }

  const comment = await comments.findById(commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  if (comment.likedBy.includes(username)) {
    comment.likedBy = comment.likedBy.filter((u) => u !== username);
    comment.likes -= 1;
  } else {
    comment.likedBy.push(username);
    comment.likes += 1;
  }

  await comment.save();

  res.json({
    likes: comment.likes,
    liked: comment.likedBy.includes(username),
  });
});

app.post("/getFollowStatus", async (req, res) => {
  const { from, to } = req.body;
  const followDoc = await followers.findOne({ from, to });
  const isFollowing = !!followDoc;
  const followersCount = await followers.countDocuments({ to });

  res.json({ isFollowing, followersCount });
});

app.post("/toggleFollow", async (req, res) => {
  const { from, to } = req.body;
  try {
    const existing = await followers.findOne({ from, to });
    if (existing) {
      await followers.deleteOne({ from, to });
    } else {
      await followers.create({ from, to });
    }

    const followersCount = await followers.countDocuments({ to });
    res.json({ followersCount });
  } catch (err) {
    console.error(err);
    res.json({ error: "Server error" });
  }
});

app.post("/viewProfile", async (req, res) => {
  const { viewedUser, whoViewed } = req.body;

  let record = await views.findOne({ viewedUser });

  if (!record) {
    record = new views({ viewedUser, whoViewed: [whoViewed], viewsCount: 1 });
  } else if (!record.whoViewed.includes(whoViewed)) {
    record.whoViewed.push(whoViewed);
    record.viewsCount += 1;
  }
  await record.save();

  res.json({
    viewsCount: record.viewsCount,
    hasViewed: record.whoViewed.includes(whoViewed),
  });
});

app.get("/sysInfo", async (req, res) => {
  let data = await settings.find();
  res.json(data);
});

server.listen(3000, console.log("Server Started"));
export { uploadToImgBB };
