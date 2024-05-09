const { default: mongoose } = require("mongoose");
const Chat = require("../Models/chat.model.js");
const User = require("../Models/user.model.js");
const ApiError = require("../Utils/ApiError.js");
const ApiResponse = require("../Utils/ApiResponse.js");
const asyncHandler = require("../Utils/asyncHandler.js");
const { ChatEventEnum } = require("../constants.js");
const { emitSocketEvent } = require("../socket/index.js");

const chatCommonAggregation = () => {
  return [
    {
      // lookup fr participants
      $lookup: {
        from: "users",
        foreignFeild: "_id",
        localFeild: "participants",
        as: "participants",
        pipeline: [
          {
            $project: {
              password: 0,
              refreshToken: 0,
              emailVerificationToken: 0,
              emailVerificationExpiry: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "messages",
        foreignFeild: "_id",
        localFeild: "lastMessage",
        as: "lastMessage",
        pipeline: [
          {
            $lookup: {
              from: "users",
              foreignFeild: "_id",
              localFeild: "sender",
              as: "sender",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                    email: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              sender: { $first: "$sender" },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        lastMessage: { $first: "$lastMessage" },
      },
    },
  ];
};

const searchAvailableUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search;

  const users = await User.aggregate([
    {
      $match: {
        _id: {
          $ne: req.user._id, // avoid logged in user
        },
        $or: [
          { username: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      },
    },
    {
      $project: {
        avatar: 1,
        username: 1,
        email: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const createOrGetOneOnOneChat = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;

  // check if id is valid
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new ApiError(404, "Receiver does not exist");
  }
  // check is receiver is not the user requesting the chat
  if (receiver._id.toString() == req.user._id.toString()) {
    throw new ApiError(400, "You cannot chat with yourself");
  }

  const chat = await Chat.aggregate([
    {
      $match: {
        isGroupChat: false,
        $and: [
          {
            participants: { $elemMatch: { $eq: req.user._id } },
          },
          {
            participants: { $elemMatch: { $eq: receiver._id } },
          },
        ],
      },
    },
    ...chatCommonAggregation(),
  ]);

  if (chat.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, chat[0], "Chat retrieved successfully"));
  }

  const newChatInstance = await Chat.create({
    name: "one on one chat",
    participants: [req.user._id, reciever._id],
    admin: req.user._id,
  });

  // structure the chat as per the common aggregation to keep the consistency
  const createdChat = await Chat.aggregate([
    {
      $match: {
        _id: newChatInstance._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = createdChat[0]; // store the aggregation result

  if (!payload) {
    throw new ApiError(500, "Internal server error");
  }

  // logic to emit socket event about the new chat added to the participants
  payload?.participants?.forEach((participant) => {
    if (participant._id.toString() === req.user._id.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat

    // emit event to other participants with new chat as a payload
    emitSocketEvent(
      req,
      participant._id?.toString(),
      ChatEventEnum.NEW_CHAT_EVENT,
      payload
    );
  });

  return res
    .status(201)
    .json(new ApiResponse(201, payload, "Chat retrieved successfully"));
});

const createAGroupChat = asyncHandler(async (req, res) => {
  const { name, participants } = req.body;
  // Check if user is not sending himself as a participant. This will be done manually
  if (participants.includes(req.user._id.toString())) {
    throw new ApiError(
      400,
      "Participants array should not contain the group creator"
    );
  }

  const members = [...new Set([...participants, req.user._id.toString()])]; // check for duplicates

  if (members.length < 3) {
    // check after removing the duplicate
    // We want group chat to have minimum 3 members including admin
    throw new ApiError(
      400,
      "Group chat should have atleast 2 members other unique members."
    );
  }

  // Create a group chat with provided members
  const groupChat = await Chat.create({
    name,
    isGroupChat: true,
    participants: members,
    admin: req.user._id,
  });

  // structure the chat
  const chat = await Chat.aggregate([
    {
      $match: {
        _id: groupChat._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server error");
  }

  // logic to emit socket event about the new group chat added to the participants
  payload?.participants?.forEach((participant) => {
    if (participant._id.toString() === req.user._id.toString()) return; // don't emit the event for the logged in use as he is the one who is initiating the chat
    // emit event to other participants with new chat as a payload
    emitSocketEvent(
      req,
      participant._id?.toString(),
      ChatEventEnum.NEW_CHAT_EVENT,
      payload
    );
  });

  return res
    .status(201)
    .json(new ApiResponse(201, payload, "Group chat created successfully"));
});

const getGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const groupChat = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
        isGroupChat: true,
      },
    },
    ...chatCommonAggregation(),
  ]);
  const chat = groupChat[0];

  if (!chat) {
    throw new ApiError(404, "Group chat does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chat, "Group chat retrieved successfully"));
});

const renameGroupChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { name } = req.body;
  // find Chat
  const groupChat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    isGroupChat: false,
  });
  if (!groupChat) {
    throw new ApiError(404, "Group chat does not exist");
  }
  // check if user is admin for this chat
  if (req.user._id.toString() != groupChat.admin?.toString()) {
    throw new ApiError(400, "You are not admin for this group chat");
  }
  const updatedGroupChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: {
        name: name,
      },
    },
    { new: true }
  );

  const chat = await Chat.aggregate([
    {
      $match: {
        _id: updatedGroupChat._id,
      },
    },
    ...chatCommonAggregation(),
  ]);

  const payload = chat[0];

  if (!payload) {
    throw new ApiError(500, "Internal server error");
  }
  payload.participants.forEach((participant) => {
    emitSocketEvent(
      req,
      participant._id.toString(),
      ChatEventEnum.UPDATE_GROUP_NAME_EVENT,
      payload
    );
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, payload, "Group chat name updated successfully")
    );
});

const getAllChats = asyncHandler(async (req, res) => {
  const chats = await Chat.aggregate([
    {
      $match: {
        participants: { $elemMatch: { $eq: req.user._id } }, // get all chats that have logged in user as a participant
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
    ...chatCommonAggregation(),
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, chats || [], "User chats fetched successfully!")
    );
});

module.exports = {
  createOrGetOneOnOneChat,
  createAGroupChat,
  getGroupChat,
  getAllChats,
  renameGroupChat,
  searchAvailableUsers,
};
