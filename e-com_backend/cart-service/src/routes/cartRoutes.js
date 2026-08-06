const router = require('express').Router();
const controller = require('../controllers/cartController');
const { addToCartRules, updateCartRules } = require('../validations/cartValidation');

const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

// Customer and Admin can access Cart APIs
router.post(
  '/add',
  authMiddleware,
  authorize('Customer', 'Admin'),
  addToCartRules,
  controller.addToCart
);

router.put(
  '/update',
  authMiddleware,
  authorize('Customer', 'Admin'),
  updateCartRules,
  controller.updateQuantity
);

router.delete(
  '/remove/:productId',
  authMiddleware,
  authorize('Customer', 'Admin'),
  controller.removeItem
);

router.delete(
  '/clear',
  authMiddleware,
  authorize('Customer', 'Admin'),
  controller.clearCart
);

router.get(
  '/',
  authMiddleware,
  authorize('Customer', 'Admin'),
  controller.getCart
);

module.exports = router;

// Testing SonarQube create