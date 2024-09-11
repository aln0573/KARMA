const mongoose = require('mongoose');
const { ObjectId } = require("mongodb");

const wishlistSchema = mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true,
    },
    items: [
        {
            productId: {
                type: ObjectId,
                ref: "product",
                required: true,
            }
        }
    ]
});

module.exports = mongoose.model("Wishlist", wishlistSchema);