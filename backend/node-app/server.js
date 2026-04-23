const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

let db;
let isConnected = false;

// 🔥 Retry connection logic
function connectDB() {
  db = mysql.createConnection({
    host: "mysql",
    user: "govi",
    password: "admin",
    database: "users_db",
  });

  db.connect((err) => {
    if (err) {
      console.error("❌ DB not ready, retrying in 3s...", err.message);
      isConnected = false;
      setTimeout(connectDB, 3000);
    } else {
      console.log("✅ MySQL Connected (Node)");
      isConnected = true;
    }
  });

  db.on("error", (err) => {
    console.error("⚠️ DB error:", err.message);
    isConnected = false;

    console.log("🔄 Reconnecting DB...");
    setTimeout(connectDB, 3000);
  });
}

// start DB connection
connectDB();

// health
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "Node.js" });
});

// get users
app.get("/users", (req, res) => {
  if (!isConnected) {
    return res.status(500).json({ error: "DB not connected yet" });
  }

  db.query("SELECT * FROM users", (err, result) => {
    if (err) {
      console.error("❌ Query error:", err);
      return res.status(500).json(err);
    }
    res.json(result);
  });
});

// add user
app.post("/users", (req, res) => {
  if (!isConnected) {
    return res.status(500).json({ error: "DB not connected yet" });
  }

  const { name } = req.body;

  db.query("INSERT INTO users (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, name });
  });
});

// delete user
app.delete("/users/:id", (req, res) => {
  if (!isConnected) {
    return res.status(500).json({ error: "DB not connected yet" });
  }

  const id = req.params.id;

  db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "User deleted" });
  });
});

// start server
app.listen(8003, () => {
  console.log("🚀 Node running on http://localhost:8003");
});