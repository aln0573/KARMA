const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
    },
    password: {
        type: String,
    },
    isGoogleAuth: {
        type: Boolean,
        default: false,
    },
    is_admin: {
        type: Number,
    },
    is_varified: {
        type: Number,
        default: 0,
    },
    is_blocked: {
        type: Boolean,
        required: true,
        default: false,
    },
    referralCode: {
        type: String,
        // Unique referral code for the user
        unique: true,
        sparse: true,  // Allows unique constraint with null values
    },
    referredBy: {
        type: String,
        // The referral code used by the user during registration
        default: null,
    },
});

module.exports = mongoose.model("user", UserSchema);
