const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection
// Fix for querySrv ETIMEOUT: Use Google and Cloudflare DNS to bypass local ISP DNS issues
require('dns').setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch(err => console.log("❌ Error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/circuits", require("./routes/circuit"));
app.use("/api/classrooms", require("./routes/classroom"));
app.use("/api/submissions", require("./routes/submission"));

// Test Route
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});