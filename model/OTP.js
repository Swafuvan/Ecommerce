const randomstring = require('randomstring')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
require('dotenv').config()

function generateOtp() {
    return randomstring.generate({
        length: 6,
        charset: 'numeric'
    })
}


// Create a transporter
const sendOtp = async (senderEmail) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.emailSender, // Your email address
            pass: process.env.emailPasskey // Your email password
        }
    });
    let otp = generateOtp()
    // Setup email data
    let mailOptions = {
        from: process.env.emailSender,
        to: senderEmail, // Receiver's email address
        subject: 'Email verification',
        text: `Your OTP is ${otp}`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
    console.log(otp);
    return otp;
}


 function createToken(senderEmail) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.emailSender, // Your email address
            pass: process.env.emailPasskey // Your email password
        }
    });
    const otp = generateOtp()
    let token = generateToken() + otp 

    token = token.trim()
    console.log(`Your URL for verification is : http://localhost:5000/changePassword/${token}`);
    let mailOptions = {
        from: process.env.emailSender,
        to: senderEmail, // Receiver's email address
        subject: 'Email verification',
        text: `Your URL for verification is : http://localhost:5000/changePassword/${token}`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
    return token;
}

function generateToken() {
    return randomstring.generate({
        length: 15,
        charset: 'alphabet'
    })
}


module.exports = {sendOtp, createToken};