const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const ObjectID = mongoose.Schema.Types.ObjectId;

const addressSchema = new mongoose.Schema({
    user:{
        type:ObjectID,
        ref:'User',
        
    },
    userAddress:[{
        addressType: {
            type: String, // This will store the address type, e.g., 'home' or 'work'
            enum: ['home', 'work','temp'], // Define the allowed values for address type
        },
        Firstname:String,
        Lastname:String,
        Address:String,
        HouseNo:{
            type:String,
        },
        Street:{
            type:String,
        },
        Landmark:{
            type:String,
        },
        Pincode:{
            type:Number,
        },
        City:{
            type:String,
        },
        district:{
            type:String,
        },
        State:{
            type:String,
        },
        Country:{
            type:String,
        },
        phone:Number,
        email:String
 
    }],
 
 })

 const Address = mongoose.model('userAddresses', addressSchema);

 module.exports= Address