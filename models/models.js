import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gallaryLinks: {
      type: String,
    },
    profileLink: {
      type: String,
    },
    aboutMe: {
      type: String,
    },
    aboutYou: {
      type: String,
    },
    course: {
      type: String,
    },
    year: {
      type: String,
    },
    slogan: {
      type: String,
    },
    online: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const messageL = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  time: String,
  read: { type: Boolean, default: false },
});

const Messages = mongoose.model("Messages", messageL);

const userModel = mongoose.model("Users", userSchema);

const interestSchema = new mongoose.Schema({
  from: String,
  to: String,
  status: String,
  time: String,
});
const interests = mongoose.model("Interests", interestSchema);

const commentsLbl = new mongoose.Schema({
  from: String,
  to: String,
  comment: String,
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  time: String,
});

let comments = mongoose.model("Comments", commentsLbl);

const followersLbl = new mongoose.Schema({
  from: String,
  to: String,
});

let followers = mongoose.model("Followers", followersLbl);

let viewsLbl = new mongoose.Schema({
  viewedUser: { type: String, required: true },
  whoViewed: { type: [String], default: [] },
  viewsCount: { type: Number, default: 0 },
});
let views = mongoose.model("Views", viewsLbl);

let settingsL = new mongoose.Schema({
  totalOnline: { type: Number, default: 0 },
  appState: { type: Boolean, default: true },
});
let settings = mongoose.model("criticalSettings", settingsL);

export { userModel, Messages, interests, comments, followers, views, settings };
