const axios = require('axios');
const reviewService = require('../services/reviewService');

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'ProductId is required.' });
    }

    const reviews = await reviewService.getProductReviews(productId);
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { productId, rating, comment, username: bodyUsername } = req.body;
    const username = bodyUsername || req.user.username || req.user.email || 'Verified Buyer';

    if (!productId || !rating) {
      return res.status(400).json({ success: false, message: 'ProductId and Rating are required.' });
    }

    // Call order-service to verify purchase status
    const orderUrl = `${process.env.ORDER_SERVICE_URL || 'https://ptmx1zxx9i.execute-api.ap-southeast-1.amazonaws.com'}/api/v1/orders/user/${userId}`;
    const token = req.headers.authorization;

    let orders = [];
    try {
      const response = await axios.get(orderUrl, {
        headers: { Authorization: token },
      });
      const data = response.data;
      if (Array.isArray(data)) orders = data;
      else if (data && Array.isArray(data.data)) orders = data.data;
      else if (data && Array.isArray(data.orders)) orders = data.orders;
    } catch (orderErr) {
      console.error('Error fetching orders from order-service:', orderErr.message);
    }

    // Verify if there is a completed/delivered order containing the product
    const hasCompletedOrder = orders.some((order) => {
      const isDeliveredOrCompleted =
        order.orderStatus === 'DELIVERED' ||
        order.orderStatus === 'COMPLETED' ||
        order.order_status === 'DELIVERED' ||
        order.order_status === 'COMPLETED' ||
        order.status === 'DELIVERED' ||
        order.status === 'COMPLETED' ||
        String(order.orderStatus).toUpperCase() === 'DELIVERED' ||
        String(order.orderStatus).toUpperCase() === 'COMPLETED' ||
        String(order.status).toUpperCase() === 'DELIVERED' ||
        String(order.status).toUpperCase() === 'COMPLETED';

      if (!isDeliveredOrCompleted) return false;

      const orderItems = order.items || [];
      return orderItems.some(
        (item) =>
          item.productId === productId ||
          item.product_id === productId ||
          item.id === productId
      );
    });

    if (!hasCompletedOrder) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased and received.',
      });
    }

    const review = await reviewService.createReview({
      productId,
      userId,
      username,
      rating,
      comment,
    });

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ success: false, message: 'Rating is required.' });
    }

    const updated = await reviewService.updateReview(userId, reviewId, { rating, comment });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating review:', error);
    if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const userId = req.user.sub;
    const userRoles = req.user['cognito:groups'] || [];
    const { reviewId } = req.params;

    const result = await reviewService.deleteReview(userId, reviewId, userRoles);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error deleting review:', error);
    if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const userRoles = req.user['cognito:groups'] || [];
    if (!userRoles.includes('Admin')) {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }
    const reviews = await reviewService.getAllReviews();
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error('Error getting all reviews:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProductReviews, createReview, updateReview, deleteReview, getAllReviews };


