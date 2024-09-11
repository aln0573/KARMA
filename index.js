require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const session = require('express-session');
const nocache = require('nocache')


const app = express();
const user_route = require("./routes/userRoute");
const admin_route = require("./routes/adminRoute");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((error) => {
    console.error("Error connecting to MongoDB:", error);
});

// Middleware
app.use("/static", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use('/admin/dashboard',nocache())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Routes
app.use("/", user_route);
app.use("/admin", admin_route);


// Set view engine
app.set('view engine', 'ejs');
app.set('views', './views/user');


 
// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});