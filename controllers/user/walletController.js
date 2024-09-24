const userModel = require('../../models/userModel');
const walletModel = require('../../models/walletModel');
const wallet = require('../../models/walletModel');


const loadWallet = async (req, res) => {
    try {
        const userData = await userModel.findOne({ _id: req.session.user_id });
        const wallet = await walletModel.findOne({ userId: req.session.user_id }).lean();

        if (!wallet) {
            return res.render('wallet', { user: userData, balance: 0, history: [], currentPage: 1, totalPages: 1 });
        }

        const page = Number(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const sortedHistory = wallet.history.sort((a, b) => new Date(b.date) - new Date(a.date));
        const paginatedHistory = sortedHistory.slice(skip, skip + limit);

        const totalItems = sortedHistory.length;
        const totalPages = Math.ceil(totalItems / limit);

        res.render('wallet', {
            user: userData,
            balance: wallet.balance,
            history: paginatedHistory,
            currentPage: page,
            totalPages: totalPages
        })
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    loadWallet
}