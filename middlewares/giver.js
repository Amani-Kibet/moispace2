import { userModel, Messages, interests } from "../models/models.js";
import jwt from "jsonwebtoken";

const findContacts = async (req, res) => {
  try {
    const username = req.user.username;

    const interestsList = await interests.find({
      status: "interested",
      $or: [{ from: username }, { to: username }],
    });

    const contactNames = interestsList.map((item) =>
      item.from === username ? item.to : item.from
    );

    const contacts = await userModel.find(
      { username: { $in: contactNames } },
      { _id: 0, username: 1, profileLink: 1, slogan: 1 }
    );

    return { contacts };
  } catch (error) {
    console.error("Error in findContacts:", error);
  }
};

const issueData = async (req, res) => {
  try {
    const getUnread = async () => {
      try {
        const notread = await Messages.find({
          to: req.user.username,
          read: false,
        });
        return {
          status: "success",
          fromUsers: notread.map((user) => ({
            from: user.from,
            message: user.text,
          })),
        };
      } catch {
        return { status: "failed", error: "Couldn't load new messages" };
      }
    };

    const [userData, unread] = await Promise.all([
      findContacts(req, res),
      getUnread(),
    ]);
    let count = {};
    unread.fromUsers.forEach((item) => {
      if (!count[item.from]) {
        count[item.from] = { value: 1, message: item.message };
      } else {
        count[item.from].value += 1;
        count[item.from].message = item.message;
      }
    });

    res.json({ status: "success", userData, count });
  } catch (err) {
    console.error(err);
  }
};

const giveMainUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
  } else {
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      return res.status(200).json({ userDetails: user });
    } catch (error) {
      return res.status(401).json({ error: "an error loading your details" });
    }
  }
};

const obtainHistory = async (req, res) => {
  let arr1 = await Messages.find({
    from: req.body.name2,
    to: req.body.name1,
  });
  let arr2 = await Messages.find({
    from: req.body.name1,
    to: req.body.name2,
  });
  res.json({ msgReceivedH: arr1, msgSentH: arr2 });
};
const markAsRead = async (req, res) => {
  const { mainUser, receiver } = req.body;

  await Messages.updateMany(
    { from: receiver, to: mainUser, read: false },
    { $set: { read: true } }
  );
};

const unreadFinder = async (req, res) => {
  try {
    let unread = await Messages.find({
      to: req.user.username,
      read: false,
    }).countDocuments();
    return res.render("home", { user: req.user, unread });
  } catch (error) {
    return res.render("login", {
      errors: ["The server experienced an error", "Please try again"],
    });
  }
};
const giveUserPage = async (req, res) => {
  let username = req.body.username;
  try {
    const userInfo = await userModel
      .findOne({ username })
      .select("username profileLink aboutMe aboutYou course year gallaryLinks");
    let links = [];
    if (userInfo.gallaryLinks) {
      links = userInfo.gallaryLinks.split(",");
    } else {
      links = [];
    }
    res.render("foreignUser", { user: userInfo, links });
  } catch (error) {
    console.log(error);
    return { error };
  }
};
const giveUserProfile = async (req, res) => {
  let username = req.user.username;
  try {
    const userInfo = await userModel
      .findOne({ username })
      .select(
        "username profileLink aboutMe aboutYou course year gallaryLinks slogan"
      );
    let links = [];
    if (userInfo.gallaryLinks) {
      links = userInfo.gallaryLinks.split(",");
    } else {
      links = [];
    }
    res.render("userProfile", { user: userInfo, links });
  } catch (error) {
    console.log(error);
    return { error };
  }
};
const interestGiver = async (req, res) => {
  const received = await interests.find({ to: req.body.mainUser });
  const sent = await interests.find({ from: req.body.mainUser }).select("-_id");
  return res.json({ received: received, sent: sent });
};
export {
  issueData,
  giveMainUser,
  unreadFinder,
  obtainHistory,
  markAsRead,
  giveUserPage,
  giveUserProfile,
  interestGiver,
  findContacts,
};
