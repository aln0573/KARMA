const mongooose = require('mongoose');
const { ObjectId } = require("mongodb");

const productSchema = mongooose.Schema({

    productName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    offerPrice : {
        type: Number,
        
    },
    image: {
        type: [String]
    },
    category: {
        type: mongooose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    gender: {
        type: String,
        // enum: ["Men" , "Women"]
    },
    productDec: {
        type: String
    },
    status: {
        type: String,
        required: true,
        default: "active"
    },
    brand: {
        type: mongooose.Schema.Types.ObjectId,
        ref: "brands",
        required: true
    },
    stock: {
        type: Number
    },
    productDetails: {
        type: String
    },
    is_delete: {
        type: Boolean,
        default: false
    }

});

module.exports = mongooose.model('product',productSchema);
