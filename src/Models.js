const Mongoose = require("mongoose");

const RoleSchema = new Mongoose.Schema({
  Id: { type: String, unique: true },
  Members: { type: Array, default: [], unique: true }
});

const ChannelSchema = new Mongoose.Schema({
  Id: { type: String, default: null, unique: true },
  Name: { type: String, default: null, unique: true },
  Type: { type: String, default: null, unique: true },
  Topic: { type: String, default : null, unique: true },
  Nsfw: { type: Boolean, default: false, unique: true },
  Bitrate: { type: Number, default: 64, unique: true },
  UserLimit: { type: Number, min: 0, max: 99, unique: true },
  Permissions: { type: Array, default: [], unique: true },
  Position: { type: Number, unique: true },
  Parent: { type: String, default: null, unique: true },
  RateLimitPerUser: { type: Number, default: 0, unique: true },
  RtcRegion: { type: String, default: "russia", unique: true }
});

module.exports = {
  RoleModel: Mongoose.model("Roles", RoleSchema),
  ChannelModel: Mongoose.model("Channels", ChannelSchema)
};
