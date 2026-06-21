import express from "express";
import {
  sendMessage,
  getMessages,
  markDelivered,
  markRead,
  getUnreadCounts,
  getChatPreviews,
  toggleReaction,
  deleteForMe,
  deleteForEveryone,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", sendMessage);

router.get("/unread/:userId", getUnreadCounts);

router.get("/chats/:userId", getChatPreviews);

router.get("/:senderId/:receiverId", getMessages);

router.put("/delivered/:messageId", markDelivered);

router.put("/read/:messageId", markRead);

/* ================= REACTIONS ================= */
router.post("/react/:messageId", toggleReaction);
router.post(
  "/delete-for-me/:messageId",
  deleteForMe
);

router.post(
  "/delete-for-everyone/:messageId",
  deleteForEveryone
);
export default router;
