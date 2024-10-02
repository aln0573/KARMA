const userModel = require('../../models/userModel');
const wishlistModel = require('../../models/wishlistModel');



const wishlist = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const wishlist = await wishlistModel.findOne({ userId: req.session.user_id }).populate({
            path: "items.productId",
            model: "product"
        });

        console.log(wishlist)
        res.render('wishlist', { user: userData, wishlist: wishlist });
    } catch (error) {
        console.log(error)
    }
};

const addToWishlist = async (req, res) => {
    try {
        if (!req.session.user_id) {
            // User is not logged in, send redirect response
            return res.json({ success: false, redirect: '/login', message: 'User not logged in' });
        }

        const productId = req.body.productId;
        const already = await wishlistModel.findOne({ userId: req.session.user_id });

        if (!already) {
            const wishlistItem = new wishlistModel({
                userId: req.session.user_id,
                items: [{ productId: productId }]
            });
            await wishlistItem.save();
            return res.json({ success: true, message: 'Product added to wishlist' });
        } else {
            let flag = false;
            already.items.forEach((item) => {
                if (item.productId == productId) {
                    flag = true;
                }
            });
            if (!flag) {
                await wishlistModel.updateOne(
                    { userId: req.session.user_id },
                    { $push: { items: { productId: productId } } }
                );
                return res.json({ success: true, message: "Product added to wishlist" });
            } else {
                return res.json({ success: false, message: "Product already in wishlist" });
            }
        }
    } catch (error) {
        console.log(error, 'Error adding product to wishlist');
        return res.json({ success: false, message: 'Error adding to wishlist' });
    }
};


const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.query.productId
        const wishlist = await wishlistModel.findOne({ userId: req.session.user_id });
        if (wishlist) {
            const itemIndex = wishlist.items.findIndex(item => item.productId == productId);

            if (itemIndex > -1) {
                wishlist.items.splice(itemIndex, 1);
                await wishlist.save();
                return res.json({ success: true, message: 'Product removed from wishlist' });
            } else {
                return res.json({ success: false, message: 'Product not found in wishlist' });
            }
        } else {
            return res.json({ success: false, message: 'Wishlist not found' });
        }
    } catch (error) {
        console.log(error);
    }
};



module.exports = {
    wishlist,
    addToWishlist,
    removeFromWishlist
}