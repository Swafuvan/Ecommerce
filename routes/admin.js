const express = require('express');
const router = express.Router();
const admin=require("../controller/admin_controllers");
const product=require('../controller/product_controllers');
const coupon =require('../controller/coupoController')
const {upload,multiupload}=require('../controller/multer');
const { route } = require('./user');
 

/* GET users listing. */

// admin route
//    

router.get('/',admin.adminhome);

router.get('/login',admin.adminlogin);

router.post('/login',admin.adminlogpost);

router.get('/usermanagement',admin.usermanagement);

router.post("/userblock",admin.blockuser);

router.get('/pagination',admin.adminPagination)

router.get('/usrpagination',admin.adminPaginationusr);

router.post('/salesReport',admin.salesreporting);

router.get('/logout',admin.adminlogout);

// product route
// 

router.get('/category',product.categorymanagement);
  
router.post('/category',product.categorypost);

router.get('/editcategory',product.categoryedit);

router.post('/editcategory',product.categoryeditpost);

router.get('/product',product.adminproduct);

router.get('/editProduct',product.editproductpage);

router.post('/updateproduct',upload.fields([{name:'coverImages',maxCount:1},{name:'images'}]), product.productupdate); 

router.get('/addproduct',product.adminaddproduct);

router.post('/addproduct',multiupload.fields([{name:'coverImages',maxCount:1},{name:'images'}]),product.adminaddpost);

router.post('/productpublish',product.publishproduct);

router.post('/publishcategory',product.categorypublish);

router.delete('/imageRemove',product.deleteimages);

router.get('/pdtpagination',product.adminPaginationpdt)

// Order routes
// 

router.get('/orders',admin.orderdetails);

router.get('/orderDetails',admin.orderdetailpage);

router.post('/orderData/:productid',admin.editorderdetails);

router.get('/cancellRequest',admin.cancelOrder);

router.get('/returnRequest',admin.returnorders)

// Coupon routes
// 

router.get('/coupon',coupon.couponpage);

router.get('/addCoupon',coupon.createcoupon);

router.post('/addCoupon',coupon.couponadding);

router.post('/couponList',coupon.listCoupon)

// banner routes
// 

router.get('/banner',admin.bannerManagement)

router.get('/addBanner',admin.addbannerManagement);

router.post('/addBanner',upload.fields([{name:'images'}]),admin.bannerManagementpost)


module.exports = router;
