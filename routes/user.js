const express = require('express');
const router = express.Router();
const user = require("../controller/user_controllers")
const cart = require('../controller/cart_controller')
const product = require('../controller/product_controllers');
const checkout = require('../controller/checkout_controllers');
const whishlist = require('../controller/whishlistController');
const paymentCheck = require('../Middleware/checkoutpage');
const { userAuth } = require('../Middleware/Auth');



/* GET home page. */
// 

router.get('/', userAuth, user.homepage);

router.get('/login', user.loginpage);

router.post('/login', user.loginpost);

router.get('/auth/google',user.googlelogin);

router.get('/auth/google/callback',user.googleLoginsuccess);

router.get('/googleSuccess',user.googleloginsuccess)


router.get('/signup', user.signuppage);

router.post('/signup', user.signuppost);

router.get('/Sendotp', user.sendotp);

router.get('/shop', userAuth, user.shoppage);

router.get('/profile', userAuth, user.userprofile);

router.post('/addAddress', user.addUserAddress);

router.post('/editaddress', user.editAddresspro);

router.post('/addAddress1', user.editAddressdata);

router.post('/editAddress1',user.editcheckoutaddress)

router.post('/deleteAddress', user.deleteAddressdata);

router.post('/editprofilepage', user.editprofile);

router.get('/forgotPassword', user.forgotPasswordpage);

router.post('/verifyEmail', user.emailverification);

router.get('/changePassword/:token', user.otpverfication)

router.post('/changePassword', user.passwordchange);

router.get('/contact',user.contactpage);

router.get('/wallet',user.walletpage)

router.get('/logout', user.logout);

// product route
// 

router.get('/productview', product.productsview);

router.get('/generateInvoice',user.userinvoices);

router.post('/productReview',product.reviewForproduct)

router.get('/pagination',user.paginationData)


// cart route
// 

router.get('/cart', userAuth, cart.usercart);

router.post('/addedcart', cart.addedtocart);

router.get('/incrementCart', cart.Quantitychanging);

router.get('/decrementCart', cart.Quantitydecrease);

router.get('/removeitem', cart.removecartitem);

router.get('/clearcartdata', cart.clearallcart);


// checkout route
// 

router.get('/checkout', userAuth, checkout.checkoutpage);

router.get('/confirmpage', checkout.confirmorderpage)

router.post('/placeorder', checkout.placeorders);

router.post('/cancelorder', checkout.ordercancellation);

router.get('/orderPage', checkout.userOrderData)

router.delete('/deleteOrder', checkout.deleteOrder)

router.post('/ordersuccess', paymentCheck.paymentChecking);

router.post('/couponverify', checkout.couponverification);

router.get('/removeCoupon', checkout.couponremove);

router.post('/returnorder', checkout.returnedOrders);

// whishlist route
// 

router.get('/whishlist', userAuth, whishlist.whishlistpage);

router.post('/addedwhishlist', whishlist.whishlistadding);

router.get('/deleteitems', whishlist.removewhishitem);


module.exports = router;
