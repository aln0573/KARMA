const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    brandsName: {
        type: String,
        required: true,
        unique: true // Ensure unique brand names
    },
    status: {
        type: String,
        required: true,
        default: "active"  
    }
});

module.exports = mongoose.model('brands', brandSchema);
