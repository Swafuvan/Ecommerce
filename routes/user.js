const express = require('express');
const router = express.Router();
const user=require("../controller/user_controllers")

/* GET home page. */


router.get('/', user.homepage);

router.get('/login',user.loginpage);

router.post('/login',user.loginpost)

router.get('/signup',user.signuppage)

router.post('/signup',user.signuppost);

router.get('/Sendotp',user.sendotp);

router.get('/shop',user.shoppage);

router.get('/profile',user.userprofile);

router.get('/cart',user.usercart);

router.get('/logout',user.logout)

module.exports = router;
