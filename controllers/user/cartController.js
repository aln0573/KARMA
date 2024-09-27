const userModel = require('../../models/userModel');
const cartModel = require('../../models/cartModel');
const productModel = require('../../models/productModel');
const addressModel = require('../../models/addressModel');
const couponModel = require('../../models/couponModel');
const walletModel = require('../../models/walletModel');

// Calculate total
function calculateCartTotal(cart) {
    if (!cart || cart.items.length === 0) {
        return 0;
    }
    let total = 0;
    cart.items.forEach(item => {
        const price = item.productId.offerPrice || item.productId.price;
        total += price * item.quantity;
    });
    return total;
}


// Render Cart
const loadCart = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const cartData = await cartModel.findOne({ userId: req.session.user_id })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category',
                    model: 'Category'
                }
            });

        let cartCount = 0;
        if (cartData) {
            cartCount = cartData.items.length;
        }
        res.render('cart', {
            user: userData,
            cartCount: cartCount,
            cart: cartData,
            calculateCartTotal: calculateCartTotal
        });
    } catch (error) {
        console.log(error);
    }
}

// Add to cart
const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        if (product.stock === 0) {
            return res.status(400).send('Product is out of stock');
        }

        const already = await cartModel.findOne({ userId: req.session.user_id });

        if (!already) {
            const cartItem = new cartModel({
                userId: req.session.user_id,
                items: [{ productId: productId }],
            });
            await cartItem.save();
            return res.status(200).send('Added to cart successfully');
        } else {
            let flag = 0;
            already.items.forEach((item) => {
                if (item.productId == productId) {
                    flag = 1;
                }
            });

            if (flag == 0) {
                await cartModel.updateOne(
                    { userId: req.session.user_id },
                    {
                        $push: {
                            items: { productId: productId },
                        },
                    }
                );
                return res.status(200).send('Added to cart successfully');
            } else {
                return res.status(400).send('Product already exists in cart');
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).send('Internal server error');
    }
}



const incrementCart = async (req, res, next) => {
    try {
        const { index } = req.body;
        const cart = await cartModel.findOne({ userId: req.session.user_id }).populate('items.productId');

        const item = cart.items[index];
        const product = item.productId;

        if (item.quantity < 5) {
            if (item.quantity >= product.stock) {
                return res.json({
                    success: false,
                    message: 'No more stock available'
                });
            }
            item.quantity++;
            await cart.save();
            const total = calculateCartTotal(cart);
            const itemTotal = item.quantity * (product.offerPrice || product.price);
            res.json({ success: true, cartTotal: total, itemQuantity: item.quantity, index, itemTotal });
        } else {
            res.json({ success: false, message: "You can't buy more than 5 quantities" });
        }
    } catch (error) {
        console.log(error)
    }
};



// Reduce cart quantity
const decrementCart = async (req, res, next) => {
    try {
        const { index } = req.body;
        const cart = await cartModel.findOne({ userId: req.session.user_id }).populate('items.productId');

        const item = cart.items[index];
        const product = item.productId;

        if (item.quantity > 1) {
            item.quantity--;
            await cart.save();
            const total = calculateCartTotal(cart);
            const itemTotal = item.quantity * (product.offerPrice || product.price);
            res.json({ success: true, cartTotal: total, itemQuantity: item.quantity, index, itemTotal });
        } else {
            res.json({ success: false, message: 'Quantity cannot be less than 1' });
        }
    } catch (error) {
        console.log(error)
    }
}


const removeFromCart = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const cart = await cartModel.findOne({ userId: req.session.user_id });

        if (cart) {
            const index = cart.items.findIndex(item => item.productId.toString() === productId);

            if (index !== -1) {
                cart.items.splice(index, 1);
                await cart.save();

                const total = calculateCartTotal(cart);

                res.json({ success: true, cartTotal: total });
            } else {
                res.json({ success: false, message: 'Item not found in cart' });
            }
        } else {
            res.json({ success: false, message: 'Cart not found' });
        }
    } catch (error) {
        next(error);
    }
};


// Load checkout
const loadCheckout = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const couponData = await couponModel.find();
        const walletData = await walletModel.find();
        const addressData = await addressModel.findOne({ userId: req.session.user_id });
        const cartData = await cartModel.findOne({ userId: req.session.user_id })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category',
                    model: 'Category'
                }
            })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'brand',
                    model: 'brands'
                }
            })


        if (!cartData || !cartData.items || cartData.items.length === 0) {
            return res.redirect('/shop');
        }

        res.render('checkout', {
            user: userData,
            cart: cartData,
            walletBalance: walletData,
            coupons: couponData,
            addresses: addressData ? addressData.address : []
        });
    } catch (error) {
        console.log(error);
    }
};

// Checkout
const addNewAddress = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        let address = await addressModel.findOne({ userId: userData._id });

        if (!address) {
            address = new addressModel({
                userId: userData._id,
                address: [],
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
        res.status(200).json({ msg: 'Address added successfully', address });

    } catch (error) {
        console.error(error);
    }
};



module.exports = {
    loadCart,
    addToCart,
    decrementCart,
    incrementCart,
    removeFromCart,
    loadCheckout,
    addNewAddress
}
