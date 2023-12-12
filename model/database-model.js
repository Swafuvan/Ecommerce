const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const ObjectID = mongoose.Schema.Types.ObjectId;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    phone: {
        type: Number,
        unique: true,
        required: true,

    },
    password: {
        type: String,
        required: true,
    },
    confirmpassword: {
        type: String,
        required: true,
    },
    admin: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    },
    joinDate: {
        type: Date,
        default: new Date()
    },
    Image: String,
    coupon:[],
});

const userandadminModel = mongoose.model('users', userSchema);


module.exports =  userandadminModel  