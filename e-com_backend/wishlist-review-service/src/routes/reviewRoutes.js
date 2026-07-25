const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', authMiddleware, reviewController.createReview);

module.exports = router;
