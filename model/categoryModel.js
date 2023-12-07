const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const ObjectID = mongoose.Schema.Types.ObjectId;


const categorySchema = new mongoose.Schema({
    category: String,
    Name: {
        type:String,
        unique:true,
        required:true
    },
    image: String,
    description:{ 
        type:String,
        required:true
    },
    publish: Boolean,
    featured: {
        type: [String],
    },
    popular: {
        type: [String]
    },

});

const categories = mongoose.model('categories', categorySchema);

module.exports=categories