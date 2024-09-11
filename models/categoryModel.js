const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true  
    },
    status: {
        type: String,
        required: true,
        default: "active"  
    }
});

const categoryModel = mongoose.model('Category', categorySchema);

module.exports = categoryModel;
