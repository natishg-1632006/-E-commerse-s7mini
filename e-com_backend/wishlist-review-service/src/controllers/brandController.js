const brandService = require('../services/brandService');

const getAllBrands = async (req, res) => {
  try {
    const brands = await brandService.getAllBrands();
    return res.status(200).json({ success: true, data: brands });
  } catch (error) {
    console.error('Error in getAllBrands controller:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getBrandById = async (req, res) => {
  try {
    const { brandId } = req.params;
    const brand = await brandService.getBrandById(brandId);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }
    return res.status(200).json({ success: true, data: brand });
  } catch (error) {
    console.error('Error in getBrandById controller:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createBrand = async (req, res) => {
  try {
    const userRoles = req.user['cognito:groups'] || [];
    if (!userRoles.includes('Admin')) {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const { name, logoUrl, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Brand name is required.' });
    }

    const newBrand = await brandService.createBrand({ name, logoUrl, description });
    return res.status(201).json({ success: true, data: newBrand });
  } catch (error) {
    console.error('Error in createBrand controller:', error);
    return res.status(error.message.includes('required') ? 400 : 500).json({ success: false, message: error.message });
  }
};

const updateBrand = async (req, res) => {
  try {
    const userRoles = req.user['cognito:groups'] || [];
    if (!userRoles.includes('Admin')) {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const { brandId } = req.params;
    const { name, logoUrl, description } = req.body;

    const updatedBrand = await brandService.updateBrand(brandId, { name, logoUrl, description });
    return res.status(200).json({ success: true, data: updatedBrand });
  } catch (error) {
    console.error('Error in updateBrand controller:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const userRoles = req.user['cognito:groups'] || [];
    if (!userRoles.includes('Admin')) {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const { brandId } = req.params;
    const result = await brandService.deleteBrand(brandId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error in deleteBrand controller:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
