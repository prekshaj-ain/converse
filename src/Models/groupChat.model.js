const mongoose = require("mongoose");

const groupChatSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupImage: {
      type: String, // URL of the group image
      default: "default-group-image.jpg", // Default image if not provided
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const GroupChat = mongoose.model("GroupChat", groupChatSchema);

module.exports = GroupChat;
