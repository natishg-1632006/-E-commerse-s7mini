const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const wishlistController = require('../controllers/wishlistController');

const router = express.Router();

router.get('/:userId', authMiddleware, wishlistController.getWishlist);
router.post('/', authMiddleware, wishlistController.addToWishlist);
router.delete('/:productId', authMiddleware, wishlistController.removeFromWishlist);

module.exports = router;
