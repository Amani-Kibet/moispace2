// import express from "express";
// import multer from "multer";
// import fs from "fs";
// import path from "path";
// let app = express();
// app.use("/css", express.static("CSS"));

// let ensureDir = (dir) => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// };
// ensureDir("./uploads/profile");
// ensureDir("./uploads/gallery");

// let storage1 = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname.startsWith("prof")) {
//       cb(null, "./uploads/profile");
//     } else {
//       cb(null, "./uploads/gallery");
//     }
//   },
//   filename: (req, file, cb) => {
//     let prefix = file.fieldname.startsWith("prof") ? "prof_" : "gal_";
//     cb(null, prefix + file.originalname);
//   },
// });

// let upload = multer({ storage: storage1 });

// app.post("/profile/update/Pics", upload.any(), (req, res) =>
// {
//   moispace.updaeOne({ username: username }, {
//     $set{profilePiclink: "", galaryPiclinks: ""}
//   });

//     let uploadedFiles = req.files.map((u) => ({
//       field: u.fieldname,
//       filename: u.filename,
//       path: u.path,
//     }));

//     res.json({
//       message: "Files uploaded successfully",
//       files: uploadedFiles,
//     });
// });

// app.post("/profile/update/Text", (req, res) => {
//   moispace.updaeOne({ username: username }, {
//     $set{aboutMe: "", aboutYou: ""}
//   });

// res.json({
//     message: "Bio Updated Successfully"
//   })
// });
// app.listen(30000, () => console.log(` Server running on port ${PORT}`));
