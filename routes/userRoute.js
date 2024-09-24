const express = require("express");
const user_route = express();
const UserController = require('../controllers/user/UserController');
const cartController = require('../controllers/user/cartController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController')
const walletController = require('../controllers/user/walletController');
const couponController = require('../controllers/admin/couponController');
const userAuth = require('../middleware/userAuth');
const path = require('path');
const { captureRejectionSymbol } = require("nodemailer/lib/xoauth2");
const passport = require('passport')
user_route.use(passport.initialize());
user_route.use(passport.session());


user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

//Google auth
user_route.get('/auth/google', passport.authenticate("google", { scope: ["profile", "email"] }));
user_route.get("/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "/auth/google/googleSuccess",
        failureRedirect: "/login"
    })
);
user_route.get("/auth/google/googleSuccess", UserController.googleSuccess);

user_route.use(express.static(path.join(__dirname, '../public')));

user_route.get('/', UserController.Loadhome);

user_route.get('/login', UserController.LoadLogin);
user_route.get('/register', UserController.LoadRegister);
user_route.post('/register', UserController.insertUser);
user_route.get('/otp', UserController.OTP);
user_route.post('/login', UserController.loginUser);
user_route.post('/verify-otp', UserController.verifyOTP);
user_route.post('/resend-otp', UserController.resendOTP);
user_route.get('/logout', UserController.userLogout);


//product
user_route.get('/productDetails', UserController.productDetails);
user_route.get('/shop', UserController.shop);

//cart
user_route.get('/cart', userAuth.isLogin, cartController.loadCart);
user_route.post('/addcart', userAuth.isLogin, cartController.addToCart);
user_route.post('/cart/decrement', userAuth.isLogin, cartController.decrementCart);
user_route.post('/cart/increment', userAuth.isLogin, cartController.incrementCart);
user_route.post('/cart/remove', userAuth.isLogin, cartController.removeFromCart);

//coupon
user_route.get('/check-coupon', userAuth.isLogin, couponController.checkCoupon);

//checkout
user_route.get('/checkout', userAuth.isLogin, cartController.loadCheckout);
user_route.post('/checkout/add-new-address', userAuth.isLogin, cartController.addNewAddress);

//address
user_route.get('/address', userAuth.isLogin, UserController.addressLoad);
user_route.post('/addAddress', userAuth.isLogin, UserController.addAddress);
user_route.get('/loadEditAddress', userAuth.isLogin, UserController.loadEditAddress);
user_route.post('/editAddress', userAuth.isLogin, UserController.editAddress);
user_route.post('/deleteAddress', userAuth.isLogin, UserController.deleteAddress);


//profile
user_route.get('/account', userAuth.isLogin, UserController.profile);
user_route.post('/editProfile', userAuth.isLogin, UserController.editProfile);

//orders
user_route.post('/checkout/place-order', userAuth.isLogin, orderController.createOrder);
user_route.get('/order-success', userAuth.isLogin, orderController.orderSuccess);
user_route.get('/view-orders', userAuth.isLogin, orderController.viewOrders);
user_route.post('/cancel-order', userAuth.isLogin, orderController.cancelOrder);
user_route.post('/payNow', userAuth.isLogin, orderController.payNow);
user_route.post('/update-orderstatus', userAuth.isLogin, orderController.updateOrderStatus);
user_route.post('/return-product', userAuth.isLogin, orderController.returnProduct);
user_route.get('/order-failure', userAuth.isLogin, orderController.orderFailed);

//password
user_route.get('/forgot-password', userAuth.isLogout, UserController.loadForgetPassword);
user_route.post('/send-password-link', userAuth.isLogout, UserController.sendPasswordLink);
user_route.get('/reset-password', UserController.renderResetPasswordForm);
user_route.post('/reset-password', UserController.handleResetPassword);

//wishlist
user_route.get('/wishlist', userAuth.isLogin, wishlistController.wishlist);
user_route.post('/wishlist/add', userAuth.isLogin, wishlistController.addToWishlist);
user_route.delete('/wishlist/remove', userAuth.isLogin, wishlistController.removeFromWishlist);

//wallet
user_route.get('/wallet', userAuth.isLogin, walletController.loadWallet);

module.exports = user_route;



