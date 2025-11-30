import jwt from "jsonwebtoken";
import sanitize from "sanitize-html";
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.render("login", { errors: ["Please log in, session expired"] });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.render("login", { errors: ["Expired login token"] });
  }
};
const sanity = (req, res, next) => {
  let errors;
  let body = req.user.username;
  const sanitized = sanitize(body);
  sanitized
    ? next()
    : res.render("login", { errors: ["violations have been detected"] });
};

export { authenticate, sanity };
