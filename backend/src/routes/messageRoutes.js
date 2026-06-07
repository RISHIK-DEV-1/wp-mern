import express from "express";

import {
  sendMessage,
  getMessages,
  markDelivered,
  markRead,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", sendMessage);

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
