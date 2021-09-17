const Mongoose = require("mongoose");

const RoleSchema = new Mongoose.Schema({
  Id: String,
  Members: { type: Array, default: [] }
});

const ChannelSchema = new Mongoose.Schema({
  Id: String,
  Type: String,
  Permissions: { type: Array, default: [] },
  Parent: { type: String, default: null }
});

module.exports = {
  RoleModel: Mongoose.model("Roles", RoleSchema),
  ChannelModel: Mongoose.model("Channels", ChannelSchema)
};
