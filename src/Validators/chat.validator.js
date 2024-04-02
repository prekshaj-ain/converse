const { body } = require("express-validator");

const createGroupChatValidator = () => {
  return [
    body("name").trim().notEmpty().withMessage("Group name is required"),
    body("participants")
      .isArray({
        min: 2,
        max: 100,
      })
      .withMessage(
        "participants should be an array with more that 2 members and less than 100 members"
      ),
  ];
};

const updateGroupChatNameValidator = () => {
  return [body("name").trim().notEmpty().withMessage("Group name is required")];
};

module.exports = { createGroupChatValidator, updateGroupChatNameValidator };
