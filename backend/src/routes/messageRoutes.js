import express from "express";
import {
  sendMessage,
  getMessages,
  markDelivered,
  markRead,
  markConversationRead,
  getUnreadCounts,
  getChatPreviews,
  toggleReaction,
  toggleStar,
  getStarredMessages,
  deleteForMe,
  deleteForEveryone,
  forwardMessages,
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/", sendMessage);

router.get("/unread/:userId", getUnreadCounts);

router.get("/chats/:userId", getChatPreviews);

router.get("/starred/:userId", getStarredMessages);

router.put("/delivered/:messageId", markDelivered);

router.put("/read/:messageId", markRead);

router.put("/read-conversation", markConversationRead);

router.post("/react/:messageId", toggleReaction);

router.post("/star/:messageId", toggleStar);

router.post("/delete-for-me/:messageId", deleteForMe);

router.post("/delete-for-everyone/:messageId", deleteForEveryone);

router.post("/forward", forwardMessages);

/* Keep generic routes LAST */
router.get("/:senderId/:receiverId", getMessages);
export default router;
