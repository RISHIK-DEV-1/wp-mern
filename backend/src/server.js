import "./config/env.js";
import express from "express";
import cors from "cors";
import http from "http";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { initSocket } from "./config/socket.js";

/* ================= DB ================= */
connectDB();

const app = express();

/* ================= HTTP SERVER ================= */
const server = http.createServer(app);

/* ================= SOCKET.IO ================= */
initSocket(server);

/* ================= MIDDLEWARE ================= */
app.use(cors());

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/contacts", contactRoutes);
/* ================= BASIC TEST ================= */
app.get("/", (req, res) => {
  res.send("API Running...");
});

/* ================= START SERVER ================= */
const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
