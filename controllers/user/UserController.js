const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userModel = require("../../models/userModel");
const nodemailer = require('nodemailer');
const passport = require("passport");
const productModel = require('../../models/productModel');
const categoryModel = require('../../models/categoryModel');
const brandModel = require('../../models/brandModel')

const User = require('../../models/userModel');
const Wallet = require('../../models/walletModel');

const addressModel = require('../../models/addressModel');
const { updateSearchIndex } = require('../../models/adminModel');
const productOfferModel = require('../../models/productOfferModel');
const categoryOfferModel = require('../../models/categoryOfferModel')
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const offerPrice = async (products) => {
    try {
        let updatedProducts = [];
        const productOffer = await productOfferModel.find().populate('productId');
        const categoryOffer = await categoryOfferModel.find().populate('categoryId');

        for (let product of products) {
            let productOfferMatch = 0;
            let categoryOfferMatch = 0;
            let productOfferPercentage;
            let categoryOfferPercentage;

            for (let offer of productOffer) {
                if (offer.productId._id.toString() === product._id.toString()) {
                    productOfferMatch = 1;
                    productOfferPercentage = offer.offerPercentage;
                    break;
                }
            }

            for (let offer of categoryOffer) {
                if (offer.categoryId._id.toString() === product.category._id.toString()) {
                    categoryOfferMatch = 1;
                    categoryOfferPercentage = offer.offerPercentage;
                    break;
                }
            }

            if (categoryOfferMatch === 1 && productOfferMatch === 1) {
                if (categoryOfferPercentage > productOfferPercentage) {
                    await productModel.updateOne(
                        { _id: product._id },
                        {
                            offerPrice:
                                product.price -
                                Math.ceil((product.price * categoryOfferPercentage) / 100),
                        }
                    );
                } else {
                    await productModel.updateOne(
                        { _id: product._id },
                        {
                            offerPrice:
                                product.price -
                                Math.ceil((product.price * productOfferPercentage) / 100),
                        }
                    );
                }
            } else if (categoryOfferMatch === 1) {
                await productModel.updateOne(
                    { _id: product._id },
                    {
                        offerPrice:
                            product.price -
                            Math.ceil((product.price * categoryOfferPercentage) / 100),
                    }
                );
            } else if (productOfferMatch === 1) {
                await productModel.updateOne(
                    { _id: product._id },
                    {
                        offerPrice:
                            product.price -
                            Math.ceil((product.price * productOfferPercentage) / 100),
                    }
                );
            } else {
                if (product.offerPrice) {
                    await productModel.updateOne(
                        { _id: product._id },
                        { $unset: { offerPrice: "" } }
                    );
                }
            }
            const updatedProduct = await productModel.findOne({ _id: product._id });
            updatedProducts.push(updatedProduct);
        }
        return updatedProducts;
    } catch (error) {
        console.log(error);
        return [];
    }
};



const Loadhome = async (req, res) => {
    try {
        const userData = req.session.user_id ? await userModel.findOne({ _id: req.session.user_id }) : null;
        let activeProducts = await productModel.find({ status: "active" }).limit(4).populate('category');

        activeProducts = await offerPrice(activeProducts);

        res.render('home', { user: userData, products: activeProducts });
    } catch (error) {
        console.log(error);
    }
};




const LoadLogin = async (req, res) => {
    try {

        if (req.session.user_id) {
            res.redirect('/');
        } else {

            const blockMessage = req.query.blockMessage ? req.query.blockMessage : '';
            return res.render('login', { blockMessage });

        }
    } catch (error) {
        console.log(error);
    }
};

const userLogout = async (req, res) => {
    try {
        delete req.session.user_id;
        res.redirect('/login');
    } catch (error) {
        console.log(error);
    }
};

const LoadRegister = async (req, res) => {
    try {
        res.render('register');
    } catch (error) {
        console.log(error);
    }
};

const LoadOtp = async (req, res) => {
    try {
        res.render('otp');
    } catch (error) {
        console.log(error);
    }
};

// Function to generate a random referral code
function generateReferralCode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
    let referralCode = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referralCode += characters[randomIndex];
    }
    return referralCode;
}

const insertUser = async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.json({ success: false, message: 'Email already in use' });
        }
        const hashedPassword = await hashPassword(req.body.password);
        const newReferralCode = generateReferralCode();

        const referredUser = await User.findOne({ referralCode: req.body.referral });

        if (referredUser) {
            const refAmount = 100;
            let wallet = await Wallet.findOne({ userId: referredUser._id });

            if (!wallet) {
                wallet = new Wallet({
                    userId: referredUser._id,
                    balance: refAmount,
                    history: [
                        {
                            date: new Date(),
                            amount: refAmount,
                            transactionType: 'Credit',
                            newBalance: refAmount,
                        },
                    ],
                });
            } else {
                wallet.balance += refAmount;
                wallet.history.push({
                    date: new Date(),
                    amount: refAmount,
                    transactionType: 'Credit',
                    newBalance: wallet.balance,
                });
            }

            await wallet.save();
        }

        req.session.newUser = {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: hashedPassword,
            is_admin: 0,
            referralCode: newReferralCode,
            referredBy: req.body.refferal || null,
        };

        console.log(req.session.newUser);

        if (req.session.newUser) {
            const otp = generateOTP();
            req.session.otp = otp;
            console.log(otp);
            sendOTP(req.session.newUser.email, otp);
            return res.json({ success: true, redirectUrl: '/otp' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};


// Generate OTP
const generateOTP = () => {
    let otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};

const sendOTP = (recipientEmail, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        port: 587,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: 'Karma Perfume OTP Registration',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h3>OTP for account verification is</h3>
                    <h1 style="font-weight: bold;">${otp}</h1>
                    <p>Please enter this OTP to complete your registration process.</p>
                    <p>Thanks for choosing kira perfume!</p>
                    <p>Best regards,<br>The kira team</p>
                </div>
            </div>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error occurred:', error.message);
        } else {
            console.log('OTP sent:', info.response);
        }
    });
};

const OTP = async (req, res, next) => {
    try {
        let userdata = null;
        if (req.session.user_id) {
            userdata = await userModel.findOne({ _id: req.session.user_id });
        }
        const recipientEmail = req.session.newUser ? req.session.newUser.email : null;

        if (userdata || recipientEmail) {
            res.render('otp', { user: userdata, email: recipientEmail });
        } else {
            res.status(400).send('User session not found.');
        }
    } catch (error) {
        console.log(error);
    }
};


const verifyOTP = async (req, res) => {
    try {
        if (req.body.otp === req.session.otp) {
            const user = new userModel({
                name: req.session.newUser.name,
                mobile: req.session.newUser.mobile,
                email: req.session.newUser.email,
                password: req.session.newUser.password,
                referralCode: req.session.newUser.referralCode,
                referredBy: req.session.newUser.referredBy,
            });

            const savedUser = await user.save();

            if (savedUser) {
                req.session.user_id = savedUser._id;
                const referredBy = savedUser.referredBy;
                let initialBalance = 0.00;
                if (referredBy) {
                    const referringUser = await userModel.findOne({ referralCode: referredBy });

                    if (referringUser) {
                        const referralReward = 100;
                        let referrerWallet = await Wallet.findOne({ userId: referringUser._id });

                        if (!referrerWallet) {
                            referrerWallet = new Wallet({
                                userId: referringUser._id,
                                balance: referralReward,
                                history: [
                                    {
                                        date: new Date(),
                                        amount: referralReward,
                                        transactionType: 'Credit',
                                        newBalance: referralReward,
                                    },
                                ],
                            });
                        } else {
                            referrerWallet.balance += referralReward;
                            referrerWallet.history.push({
                                date: new Date(),
                                amount: referralReward,
                                transactionType: 'Credit',
                                newBalance: referrerWallet.balance,
                            });
                        }

                        await referrerWallet.save();
                        initialBalance = 50.00;
                    }
                }

                let userWallet = new Wallet({
                    userId: savedUser._id,
                    balance: initialBalance,
                    history: [
                        {
                            date: new Date(),
                            amount: initialBalance,
                            transactionType: 'Credit',
                            newBalance: initialBalance,
                        },
                    ],
                });

                await userWallet.save();
                delete req.session.otp;
                return res.json({ success: true });
            } else {
                return res.json({ success: false, message: 'User registration failed' });
            }
        } else {
            return res.json({ success: false, message: 'Invalid OTP' });
        }
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: 'An error occurred' });
    }
};



const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;


        const userData = await userModel.findOne({ email });

        if (userData) {

            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (!userData.is_blocked) {
                    req.session.user_id = userData._id;
                    return res.json({ success: true, message: "Login successful", render: "home" });
                } else {
                    return res.json({ success: false, message: "User is blocked" });
                }
            } else {

                return res.json({ success: false, message: "Incorrect password" });
            }
        } else {

            return res.json({ success: false, message: "Email not found" });
        }
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "An error occurred. Please try again later." });
    }
};

// Password Hashing
const hashPassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};

//Google authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    function (accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user)
})

const googleSuccess = async (req, res) => {
    try {
        if (req.user && req.user.emails && req.user.emails.length > 0) {
            const userEmail = req.user.emails[0].value;
            let userData = await userModel.findOne({ email: userEmail });

            if (!userData) {
                userData = new userModel({
                    name: req.user.displayName,
                    email: userEmail,
                    isGoogleAuth: true
                });
                await userData.save();
            }

            req.session.user_id = userData._id;

            req.session.save((err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('An error occurred');
                }
                res.redirect('/');
            });
        } else {
            console.log('Google profile email not found or is empty');
            res.status(400).send('Google profile email not found or is empty');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred');
    }
};

const resendOTP = async (req, res) => {
    try {
        if (!req.session.newUser) {
            return res.status(400).json({ success: false, message: 'User session not found' });
        }

        const otp = generateOTP();
        req.session.otp = otp;
        sendOTP(req.session.newUser.email, otp);
        console.log('resent otp:', otp);


        res.json({ success: true, message: 'OTP resent successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'An error occurred while resending the OTP' });
    }
};

const productDetails = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.query.productId;

        const userData = await userModel.findOne({ _id: userId });
        const product = await productModel.findOne({ _id: productId, status: "active" }).populate('category').populate('brand')

        if (product) {
            const relatedProducts = await productModel.find({
                category: product.category._id,
                _id: { $ne: productId },
                status: "active"
            });

            res.render('productDetails', { user: userData, product, relatedProducts });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


const addressLoad = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });

        const addressData = await addressModel.findOne({ userId: userData._id });
        console.log(addressData)
        if (addressData) {
            res.render('address', { user: userData, addresses: addressData });
        } else {
            res.render('address', { user: userData, addresses: [] });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const addAddress = async (req, res) => {
    try {
        console.log('Adding address for user:', req.session.user_id);
        const userData = await userModel.findOne({ _id: req.session.user_id });
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        let address = await addressModel.findOne({ userId: userData._id });
        if (!address) {
            address = new addressModel({
                userId: userData._id,
                address: []
            });
        }

        const { name, phone, district, city, house, state, pincode } = req.body;
        address.address.push({
            name,
            phone,
            district,
            city,
            house,
            state,
            pincode
        });

        await address.save();
        res.status(200).json({ message: 'Address added successfully', address });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const loadEditAddress = async (req, res, next) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        if (!userData) {
            return res.status(404).send('User not found');
        }

        const addressId = req.query.addressId;
        if (!addressId) {
            return res.status(400).send('Address ID is missing');
        }


        const addressDocument = await addressModel.findOne({ userId: userData._id });
        if (!addressDocument) {
            return res.status(404).send('Address document not found');
        }


        const address = addressDocument.address.find(a => a._id.toString() === addressId);
        if (!address) {
            return res.status(404).send('Address not found');
        }

        res.render('editAddress', { user: userData, address });
    } catch (error) {
        next(error);
    }
};






const editAddress = async (req, res, next) => {
    try {
        const addressId = req.body.addressId;
        let address = await addressModel.findOne({ 'address._id': addressId });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        const index = address.address.findIndex(a => a._id.toString() === addressId);
        const { name, phone, district, city, house, state, pincode } = req.body;
        address.address[index].name = name;
        address.address[index].district = district;
        address.address[index].phone = phone;
        address.address[index].city = city;
        address.address[index].house = house;
        address.address[index].state = state;
        address.address[index].pincode = pincode;

        await address.save();
        res.status(200).json({ message: "Address updated successfully", address: address.address[index] });
    } catch (error) {
        next(error)
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.body;
        const result = await addressModel.updateOne(
            { 'address._id': addressId },
            { $pull: { address: { _id: addressId } } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ error: "Address not found" });
        }
        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.log(error);
    }
};


const profile = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('profile', { user: userData });
    } catch (error) {
        console.log(error);
    }
};

const editProfile = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { name, phone } = req.body;

        const updatedUser = await userModel.findByIdAndUpdate(userId, { name, phone }, { new: true });
        if (!updatedUser) {
            res.status(404).json({ message: 'user not fount' });
        }
        return res.redirect('/account');
    } catch (error) {
        console.error('Error updating profile', error);
        res.status(500).json({ error: 'Server Error' })
    }
};



const shop = async (req, res) => {
    try {
        const userData = req.session.user_id ? await userModel.findOne({ _id: req.session.user_id }) : null;
        const searchTerm = req.query.search || '';
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;
        const categoryFilter = req.query.category || '*';
        const brandFilter = req.query.brand || '*';
        const sortOption = req.query.sort || 'default';


        let query = { status: 'active' };


        if (searchTerm) {
            query['productName'] = { $regex: searchTerm, $options: 'i' };
        }


        if (categoryFilter !== '*') {
            query['category'] = categoryFilter;
        }


        if (brandFilter !== '*') {
            query['brand'] = brandFilter;
        }


        let products = await productModel.find(query)
            .populate('category')
            .populate('brand')
            .skip(skip)
            .limit(limit);


        switch (sortOption) {
            case 'price-asc':
                products = products.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                products = products.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                products = products.sort((a, b) => a.productName.localeCompare(b.productName));
                break;
            case 'name-desc':
                products = products.sort((a, b) => b.productName.localeCompare(a.productName));
                break;
            default:
                break;
        }

        const productsWithOffers = await offerPrice(products);


        const totalProducts = await productModel.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);


        const categories = await categoryModel.find({});
        const brands = await brandModel.find({});

        res.render('shop', {
            user: userData,
            products: productsWithOffers,
            categories: categories,
            brand: brands,
            currentPage: page,
            totalPages: totalPages,
            searchTerm: searchTerm,
            currentCategory: categoryFilter,
            currentBrand: brandFilter,
            currentSort: sortOption,
        });
    } catch (error) {
        console.error("Error fetching shop data:", error);
        res.status(500).send("Internal Server Error");
    }
};



const loadForgetPassword = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        res.render('forgetPassword', { user: userData, });
    } catch (error) {
        console.log(error);
    }
};

const sendPasswordLink = async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.body.email });
        if (user) {
            if (user.isGoogleAuth) {
                return res.status(400).json({ message: 'Unable to change password. Your account is linked with Google.' });
            }

            const token = crypto.randomBytes(20).toString('hex');
            req.session.token = token;
            req.session.email = req.body.email;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: req.body.email,
                subject: 'Your Password Reset Link',
                html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <h3>Reset Your Password</h3>
                        <p>Click the link below to reset your password:</p>
                        <a href="http://localhost:3000/reset-password?token=${token}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                        <p>Thanks for using our service!</p>
                        <p>Best regards,<br>The Kira Perfume Team</p>
                    </div>
                </div>`
            };

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                port: 587,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    res.status(500).json({ message: 'Error sending email' });
                } else {
                    res.status(200).json({ message: 'Password reset link has been sent to your email' });
                }
            });
        } else {
            res.status(400).json({ message: 'No such email exists. Please create an account.' });
        }
    } catch (error) {
        console.log(error)
    }
};

const renderResetPasswordForm = async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            return res.redirect('/login');
        }

        const userData = userModel.findOne({ email: req.session.email });
        res.render('resetPassword', { token, user: userData })
    } catch (error) {
        console.log(error)
    }
};


const handleResetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        if (token !== req.session.token) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        const hashedPassword = await hashPassword(password);
        await userModel.findOneAndUpdate(
            { email: req.session.email },
            { password: hashedPassword }
        );
        delete req.session.token;
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

const loadEditPassword = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        if (!userData) {
            return res.status(404).render('404', { message: 'User not found.' });
        }
        res.render('editPassword', { user: userData });
    } catch (error) {
        console.log(error);
        res.status(500).render('500', { message: 'Internal Server Error.' });
    }
};

const changePassword = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        if (!userData) {
            return res.status(404).json({ message: "User not found." });
        }
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New passwords do not match." });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, userData.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Entered old password is wrong." });
        }
        const hashedNewPassword = await hashPassword(newPassword);
        userData.password = hashedNewPassword;
        await userData.save();

        return res.json({ success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};






module.exports = {
    Loadhome,
    LoadLogin,
    LoadRegister,
    LoadOtp,
    insertUser,
    OTP,
    verifyOTP,
    loginUser,
    hashPassword,
    googleSuccess,
    resendOTP,
    userLogout,
    productDetails,
    addressLoad,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    profile,
    editProfile,
    shop,
    loadForgetPassword,
    sendPasswordLink,
    renderResetPasswordForm,
    handleResetPassword,
    offerPrice,
    loadEditPassword,
    changePassword
};
