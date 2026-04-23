const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// DB connection
const db = mysql.createConnection({
  host: "mysql",
  user: "govi",
  password: "admin",
  database: "users_db",
});

db.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err);
  } else {
    console.log("✅ MySQL Connected (Node)");
  }
});

// health
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "Node.js" });
});

// get users
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// add user
app.post("/users", (req, res) => {
  const { name } = req.body;

  db.query("INSERT INTO users (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, name });
  });
});

// delete user
app.delete("/users/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Deleted" });
  });
});

// start server
app.listen(8003, () => {
  console.log("🚀 Node running on http://localhost:8003");
});