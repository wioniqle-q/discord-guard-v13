const Mongoose = require("mongoose");

const RoleSchema = new Mongoose.Schema({
  Id: String,
  Members: { type: Array, default: [] }
});

const ChannelSchema = new Mongoose.Schema({
  Id: { type: String, default: null },
  Name: { type: String, default: null },
  Type: { type: String, default: null },
  Topic: { type: String, default : null },
  Nsfw: { type: Boolean, default: false },
  Bitrate: { type: Number, default: 64 },
  UserLimit: { type: Number, min: 0, max: 99 },
  Permissions: { type: Array, default: [] },
  Position: Number,
  Parent: { type: String, default: null },
  RateLimitPerUser: { type: Number, default: 0 },
  RtcRegion: { type: String, default: "russia" }
});

module.exports = {
  RoleModel: Mongoose.model("Roles", RoleSchema),
  ChannelModel: Mongoose.model("Channels", ChannelSchema)
};
