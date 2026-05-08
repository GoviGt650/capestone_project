const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

let db;
let isConnected = false;
let isConnecting = false;

// 🔥 DB CONNECT WITH SAFE RETRY
function connectDB() {
  if (isConnecting) return;
  isConnecting = true;

  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  db.connect((err) => {
    if (err) {
      console.error("❌ DB not ready:", err.message);
      isConnected = false;
      isConnecting = false;
      setTimeout(connectDB, 3000);
    } else {
      console.log("✅ MySQL Connected (Node)");
      isConnected = true;
      isConnecting = false;
    }
  });

  db.on("error", (err) => {
    console.error("⚠️ DB error:", err.message);
    isConnected = false;
    isConnecting = false;
    setTimeout(connectDB, 3000);
  });
}

connectDB();

// ✅ HEALTH
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "Node.js" });
});

// ✅ GET USERS
app.get("/users", (req, res) => {
  if (!isConnected) {
    return res.status(503).json({ error: "DB not ready" });
  }

  db.query("SELECT * FROM users", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// ✅ ADD USER
app.post("/users", (req, res) => {
  if (!isConnected) {
    return res.status(503).json({ error: "DB not ready" });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name required" });
  }

  db.query("INSERT INTO users (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, name });
  });
});

// ✅ DELETE USER
app.delete("/users/:id", (req, res) => {
  if (!isConnected) {
    return res.status(503).json({ error: "DB not ready" });
  }

  const id = req.params.id;

  db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Deleted" });
  });
});

app.listen(8003, "0.0.0.0", () => {
  console.log("🚀 Node is running on port 8003");
});