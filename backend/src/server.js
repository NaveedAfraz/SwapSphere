const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { testConnection } = require("./database/db");
const { serve } = require("inngest/express");

// Import Inngest client and workflows
const { inngest } = require("./services/inngest");
const { workflows } = require("./workflows");

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
app.use(express.json({ limit: "50mb", extended: true }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Increase timeout for large requests
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

// Rate limiting (temporarily disabled for testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for testing
  message: "Too many requests from this IP, please try again later.",
});
// app.use(limiter); // Temporarily disabled for testing

app.get("/health", (req, res) => {
  res.json({ message: "SwapSphere API is running!" });
});

// Inngest webhook endpoint
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: workflows,
    signingKey: process.env.INNGEST_SIGNING_KEY,
    dev: process.env.NODE_ENV !== "production",
  })
);

console.log(
  "[SERVER] Webhook URL should be:",
  process.env.NGROK_URL ||
    `${
      process.env.FRONTEND_URL?.replace("3000", "5000") ||
      "http://localhost:5000"
    }/api/inngest`
);

io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

app.use("/api/auth", require("./auth/routes"));
app.use("/api/profile", require("./profile/routes"));
app.use("/api/listing", require("./listing/routes"));
app.use("/api/chat", require("./chat/routes"));
app.use("/api/deal-rooms", require("./dealRooms/routes"));
app.use("/api/messages", require("./messages/routes"));
app.use("/api/notification", require("./notification/routes"));
app.use("/api/offer", require("./offer/routes"));
app.use("/api/order", require("./order/routes"));
app.use("/api/payment", require("./payment/routes"));
app.use("/api/review", require("./review/routes"));
app.use("/api/support", require("./support/routes"));
app.use("/api/user", require("./user/routes"));
app.use("/api/intents", require("./intents/routes"));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  testConnection();
  console.log("Server is running on port", PORT);
});
