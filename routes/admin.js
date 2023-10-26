const express = require('express');
const router = express.Router();
const admin=require("../controller/admin_controllers");
const product=require('../controller/product_controllers');
const {upload,multiupload}=require('../controller/multer')
 

/* GET users listing. */

// admin route
// 

router.get('/',admin.adminhome);

router.get('/login',admin.adminlogin);

router.post('/login',admin.adminlogpost);

router.get('/usermanagement',admin.usermanagement);

router.post("/userblock",admin.blockuser);

router.get('/orders',admin.orderdetails);

router.get('/logout',admin.adminlogout);

// product route
// 

router.get('/category',product.categorymanagement);
  
router.post('/category',product.categorypost);

router.get('/editcategory',product.categoryedit);

router.get('/product',product.adminproduct);

router.post('/updateproduct',multiupload.fields([{name:'coverImages',maxCount:1},{name:'images'}]), product.productupdate); 

router.get('/addproduct',product.adminaddproduct);

router.post('/addproduct',multiupload.fields([{name:'coverImages',maxCount:1},{name:'images'}]),product.adminaddpost);

router.post('/productpublish',product.publishproduct);

router.post('/publishcategory',product.categorypublish);



module.exports = router;
