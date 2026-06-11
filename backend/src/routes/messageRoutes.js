import express from "express";

import {
  sendMessage,
  getMessages,
  markDelivered,
  markRead,
  getUnreadCounts,
  getChatPreviews,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", sendMessage);
router.get(
  "/unread/:userId",
  getUnreadCounts
);

router.get(
  "/chats/:userId",
  getChatPreviews
);
router.get(
  "/:senderId/:receiverId",
  getMessages
);

router.put(
  "/delivered/:messageId",
  markDelivered
);

router.put(
  "/read/:messageId",
  markRead
);

export default router;
