import mongoose from "mongoose";

const { Schema } = mongoose;

const FlagSchema = new Schema({
  latitude: Number,
  longitude: Number,
  img: String,
  flaggerEmail: String,
  title: String,
  description: String,
  isEmergency: Boolean,
  time: Number,
});

export default FlagSchema;
