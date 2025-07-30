const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const connectDB = require("./utils/db");
const contactRouter = require("./routes/contact");
const contactAllRouter = require("./routes/contactRoutes");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/api/contact", contactRouter);
app.use("/api/contact", contactAllRouter);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Hello, VRETA-WATER Backend is live!");
});

connectDB().then(() => {
  console.log("Database connection is established");
  app.listen(4000, () => {
    console.log("Server is running on port 4000");
  });
});
