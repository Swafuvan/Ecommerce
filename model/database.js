const mongoose = require('mongoose');

    mongoose.connect('mongodb+srv://cpswafuvan:W7KUk9tSMJiJk6F9@cluster0.rixzbgg.mongodb.net/ColoursPardhaPalace',{
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.log("Connection Failed" + err);
    })