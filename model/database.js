const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/firstProject', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.log("Connection Failed" + err);
    })

