const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { testConnection } = require("./database/db");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "SwapSphere API is running!" });
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
app.use("/api/auth", require("./auth/routes"));
app.use("/api/profile", require("./profile/routes"));
app.use("/api/listing", require("./listing/routes"));
app.use("/api/chat", require("./chat/routes"));
app.use("/api/notification", require("./notification/routes"));
app.use("/api/offer", require("./offer/routes"));
app.use("/api/order", require("./order/routes"));
app.use("/api/payment", require("./payment/routes"));
app.use("/api/review", require("./review/routes"));
app.use("/api/support", require("./support/routes"));
app.use("/api/user", require("./user/routes"));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  testConnection();
  console.log("Server is running on port", PORT);
});
