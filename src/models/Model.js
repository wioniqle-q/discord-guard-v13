const Mongoose = require("mongoose");

const ChannelSchema = new Mongoose.Schema(
  {
    id: { type: String, unique: true },
    type: String,
    parent: { type: String, default: undefined },
    permissionOverwrites: Array
  },
  { collection: "Channel", minimize: false }
);

const RoleSchema = new Mongoose.Schema(
  {
    id: String,
    members: Array,
  },
  { collection: "Role", minimize: false }
);

module.exports = {
  ChannelModel: Mongoose.model("Channel", ChannelSchema),
  RoleModel: Mongoose.model("Role", RoleSchema),
};
