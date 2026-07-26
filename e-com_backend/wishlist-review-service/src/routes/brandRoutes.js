const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const brandController = require('../controllers/brandController');

const router = express.Router();

// Public routes
router.get('/', brandController.getAllBrands);
router.get('/:brandId', brandController.getBrandById);

// Admin-only routes
router.post('/', authMiddleware, brandController.createBrand);
router.put('/:brandId', authMiddleware, brandController.updateBrand);
router.delete('/:brandId', authMiddleware, brandController.deleteBrand);

module.exports = router;
