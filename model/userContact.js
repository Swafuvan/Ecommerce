const { ObjectId } = require('mongodb')
const mongoose =require('mongoose')

const contactSchema = new mongoose.Schema({
    userId:ObjectId,
    Name:String,
    email:String,
    phone:Number,
    subject:String,
    message:String
})

const Contact = mongoose.model('contact',contactSchema)

module.exports = Contact