const express = require('express');
const admin_route = express();
const adminController = require('../controllers/admin/adminController');
const adminAuth = require('../middleware/adminAuth');
const categoryController = require('../controllers/admin/categoryController');
const brandController = require('../controllers/admin/brandController');
const productController = require('../controllers/admin/productContoller');
const offerController = require('../controllers/admin/offerController');
const couponController = require('../controllers/admin/couponController')
const upload = require('../middleware/multer');
const { isLogin } = require('../middleware/userAuth');



// Set view engine and views path for admin route
admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');

// Login Page
admin_route.get('/login', adminController.adminLogin);
admin_route.post('/login', adminAuth.isLogout, adminController.adminPostLogin);
admin_route.get('/users', adminController.loadUser);
admin_route.patch('/blockUser', adminController.blockUser);
admin_route.patch('/unblockUser', adminController.unblockUser);
admin_route.get('/logout', adminAuth.isLogin, adminController.adminLogout);


//Category page
admin_route.get('/category', adminAuth.isLogin, categoryController.loadCategory);
admin_route.get('/addCategory', adminAuth.isLogin, categoryController.addCategory);
admin_route.post('/addNewCategory', adminAuth.isLogin, categoryController.addNewCategory);
admin_route.patch('/listCategory', adminAuth.isLogin, categoryController.listCategory);
admin_route.patch('/unlistCategory', adminAuth.isLogin, categoryController.unlistCategory);
admin_route.put('/editCategory', adminAuth.isLogin, categoryController.updateCategory);

//Brand  page
admin_route.get('/brands', adminAuth.isLogin, brandController.loadBrands);
admin_route.get('/addBrands', adminAuth.isLogin, brandController.addBrands);
admin_route.post('/addNewBrands', adminAuth.isLogin, brandController.addNewBrands);
admin_route.put('/editBrands', adminAuth.isLogin, brandController.updateBrands);
admin_route.post('/listBrands', adminAuth.isLogin, brandController.listBrands);
admin_route.post('/unlistBrands', adminAuth.isLogin, brandController.unlistBrands);

//product page
admin_route.get('/products', adminAuth.isLogin, productController.loadProduct),
  admin_route.get('/addProducts', adminAuth.isLogin, productController.loadAddProducts);
admin_route.post('/addProducts', adminAuth.isLogin, upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 }
]), productController.addProducts);
admin_route.post('/listProducts', adminAuth.isLogin, productController.listProducts);
admin_route.post('/unlistproducts', adminAuth.isLogin, productController.unlistProducts);
admin_route.get('/editProducts', adminAuth.isLogin, productController.loadEditProducts);
admin_route.post('/editProducts', adminAuth.isLogin, upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 }
]), productController.editProducts);


//orders
admin_route.get('/orderList', adminAuth.isLogin, adminController.loadOrdersList);
admin_route.get('/orderDetails', adminAuth.isLogin, adminController.adminOrderDetails);
admin_route.post('/updateOrderStatus', adminAuth.isLogin, adminController.updateOrderStatus);
admin_route.post('/returnApproval', adminAuth.isLogin, adminController.returnApproval);

//product Offer
admin_route.get('/productOffers', adminAuth.isLogin, offerController.loadproductOffer);
admin_route.post('/addProductOffer', adminAuth.isLogin, offerController.addProductOffer);
admin_route.put('/editProductOffer', adminAuth.isLogin, offerController.editProductOffer);
admin_route.delete('/removeProductOffer', adminAuth.isLogin, offerController.removeProductOffer);
admin_route.get('/offers/searchProducts', adminAuth.isLogin, offerController.loadproductOffer)

//category offer
admin_route.get('/categoryOffers', adminAuth.isLogin, offerController.loadCategoryOffer);
admin_route.post('/addCategoryOffer', adminAuth.isLogin, offerController.addCategoryOffer);
admin_route.put('/editCategoryOffer', adminAuth.isLogin, offerController.editCategoryOffer);
admin_route.delete('/removeCategoryOffer', adminAuth.isLogin, offerController.removeCategoryOffer);

//coupons
admin_route.get('/coupons', adminAuth.isLogin, couponController.loadCoupons);
admin_route.post('/coupons/add', adminAuth.isLogin, couponController.addCoupon);
admin_route.put('/coupons/edit', adminAuth.isLogin, couponController.editCoupon);
admin_route.delete('/coupons/delete', adminAuth.isLogin, couponController.deleteCoupon);

//Dashboard
admin_route.get('/dashboard', adminAuth.isLogin, adminController.loadDashboard);

//Sales Report
admin_route.get('/salesReport', adminAuth.isLogin, adminController.loadSalesReport);
admin_route.get('/filterInterval', adminAuth.isLogin, adminController.filterInterval);
admin_route.get('/filter', adminAuth.isLogin, adminController.filterReport);

module.exports = admin_route;
