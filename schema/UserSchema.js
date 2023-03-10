import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema({
  name: String,
  email: String,
  password: String,
  profileImg: { type: String, default: "user.jpg" },
});

export default UserSchema;
