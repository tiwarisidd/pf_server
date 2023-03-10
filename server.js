import express, { json } from "express";
import { print } from "./helpers/common.js";
import mongoose from "mongoose";
import UserSchema from "./schema/UserSchema.js";
import FlagSchema from "./schema/FlagSchema.js";
import { dbUri, dbName } from "./db_scripts/DBConfigs.js";
import resMessages from "./helpers/resMessages.js";
import fs from "fs-extra";
import { convertExtension } from "./helpers/convertExtension.js";
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.static("uploads"));

const PORT = process.env.PORT || 6969;

mongoose.connect(dbUri, {
  dbName: dbName,
  autoIndex: false,
});

let User = mongoose.model("User", UserSchema);
let Flags = mongoose.model("Flag", FlagSchema);

app.get("/", async (req, res) => {
  let { email, password } = req.query;
  if (!email || !password) {
    res.json({ msg: resMessages.ACCESS_DENIED });
  } else {
    let user = await User.find({ email, password });
    if (user.length > 0) {
      res.json({ data: await Flags.find() });
    } else {
      res.json({ msg: resMessages.USER_DOES_NOT_EXIST });
    }
  }
});
app.get("/profile", async (req, res) => {
  let { email, password } = req.query;
  if (!email || !password) {
    res.json({ msg: resMessages.ACCESS_DENIED });
  } else {
    let user = await User.find({ email, password });
    if (user.length > 0) {
      res.json({ data: user[0] });
    } else {
      res.json({ msg: resMessages.USER_DOES_NOT_EXIST });
    }
  }
});
app.post("/updateProfile", async (req, res) => {
  let { email, password, img, ext } = req.body;
  if (!email || !password || !img || !ext) {
    res.json({ msg: resMessages.INSUFFICIENT_DATA });
  } else {
    let imgName = Date.now();
    await fs.writeFile(`./uploads/${imgName}${ext}`, img, {
      encoding: "base64",
    });
    let user = await User.findOneAndUpdate(
      { email, password },
      { profileImg: `${imgName}${ext}` },
      { new: true }
    );
    if (user) {
      res.json({ msg: "UPDATED_PROFILE_IMG" });
    } else {
      res.json({ msg: resMessages.USER_DOES_NOT_EXIST });
    }
  }
});
app.get("/search", async (req, res) => {
  if (!req.query["query"]) {
    res.json({ msg: resMessages.INSUFFICIENT_DATA });
  } else {
    var searchQuery = new RegExp(req.query["query"], "i");
    let queryRes1 = await Flags.find({
      title: searchQuery,
    });
    let queryRes2 = await Flags.find({
      description: searchQuery,
    });
    res.json({
      results: [
        ...new Set(queryRes1.concat(queryRes2).map((v) => JSON.stringify(v))),
      ].map((v) => JSON.parse(v)),
    });
  }
});
app.get("/login", async (req, res) => {
  let { email, password } = req.query;
  if (!email || !password) {
    res.json({ msg: resMessages.INSUFFICIENT_DATA });
  } else {
    let users = await User.find({ email: email });
    if (users.length > 0) {
      if (users[0]["password"] == password) {
        res.json({ msg: resMessages.USER_EXISTS });
      } else {
        res.json({ msg: resMessages.INCORRECT_PASSWORD });
      }
    } else {
      res.json({ msg: resMessages.USER_DOES_NOT_EXIST });
    }
  }
});

app.get("/signup", async (req, res) => {
  let { name, email, password } = req.query;
  if (!name || !email || !password) {
    res.json({ msg: resMessages.INSUFFICIENT_DATA });
  } else {
    let users = await User.find({ email: email });
    if (users.length > 0) {
      res.json({ msg: resMessages.USER_ALREADY_EXISTS });
    } else {
      let user = await User.create({
        name,
        email,
        password,
      });
      if (user) {
        res.json({ msg: resMessages.NEW_USER_CREATED });
      } else {
        res.json({ msg: resMessages.COULD_NOT_CREATE_USER });
      }
    }
  }
});

app.post("/addflag", async (req, res) => {
  let {
    email,
    latitude,
    longitude,
    title,
    description,
    img,
    emergency,
    password,
    ext,
  } = req.body;
  if (
    !(
      email &&
      password &&
      title &&
      description &&
      latitude &&
      longitude &&
      img &&
      ext &&
      emergency !== undefined
    )
  ) {
    res.json({ msg: resMessages.INSUFFICIENT_DATA });
  } else {
    let user = await User.find({ email, password });
    if (user.length > 0) {
      let imgName = Date.now();
      await fs.writeFile(`./uploads/${imgName}${ext}`, img, {
        encoding: "base64",
      });
      let createdFlag = await Flags.create({
        flaggerEmail: email,
        latitude,
        longitude,
        img: `${imgName}${ext}`,
        title,
        description,
        isEmergency: emergency,
        time: Date.now(),
      });
      if (createdFlag) {
        res.json({ msg: "ADDED_NEW_FLAG" });
      } else {
        res.json({ msg: "COULD_NOT_ADD_FLAG" });
      }
    } else {
      res.json({ msg: resMessages.USER_DOES_NOT_EXIST });
    }
  }
});

app.get("/removeflag", async (req, res) => {
  let { email, password, flagid } = req.query;
  let user = await User.find({ email, password });
  let userExist = user.length > 0;
  if (userExist) {
    let deleted = await Flags.findOneAndDelete({
      flaggerEmail: email,
      _id: flagid,
    });
    await fs.unlink(`uploads/${deleted["img"]}`);
    if (deleted) {
      res.json({ msg: "FLAG_DELETED" });
    } else {
      res.json({ msg: "FLAG_NOT_DELETED" });
    }
  } else {
    res.json({ msg: resMessages.USER_DOES_NOT_EXIST });
  }
});
app.listen(PORT, () => {
  print(`Server Running At Port : ${PORT}`);
});
