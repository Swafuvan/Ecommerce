const randomstring = require('randomstring')
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')

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
            user: 'swafuvancp@gmail.com', // Your email address
            pass: 'lfpm chhw wvbl qytc' // Your email password
        }
    });
    let otp = generateOtp()
    // Setup email data
    let mailOptions = {
        from: 'swafuvancp@gmail.com',
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
            user: 'swafuvancp@gmail.com', // Your email address
            pass: 'lfpm chhw wvbl qytc' // Your email password
        }
    });
    const otp = generateOtp()
    let token = generateToken() + otp 

    token = token.trim()
    console.log(`Your URL for verification is : http://localhost:5000/changePassword/${token}`);
    let mailOptions = {
        from: 'swafuvancp@gmail.com',
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