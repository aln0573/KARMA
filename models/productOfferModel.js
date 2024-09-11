const mongoose = require('mongoose');
const { ObjectId } = require('mongoose');

const productOfferSchema = new mongoose.Schema({
    productId: {
        type: ObjectId,
        ref: "product"
    },
    offerPercentage: {
        type: Number
    },
    expiryDate: {
        type: Date,
        index: {
            expires: 0
        }
    }
});

module.exports = mongoose.model("ProductOffer",productOfferSchema);