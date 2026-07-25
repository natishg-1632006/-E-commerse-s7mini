const wishlistService = require('../services/wishlistService');

const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.sub !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own wishlist.' });
    }

    const wishlist = await wishlistService.getWishlist(userId);
    return res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'ProductId is required.' });
    }

    const wishlist = await wishlistService.addToWishlist(userId, productId);
    return res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'ProductId is required.' });
    }

    const wishlist = await wishlistService.removeFromWishlist(userId, productId);
    return res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
