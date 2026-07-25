const { verifyAccessToken, extractTokenFromHeader } = require('../utils/cognitoVerifier');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing',
      });
    }

    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Authorization header format. Expected Bearer <token>',
      });
    }

    const decoded = await verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || 'Unauthorized',
    });
  }
};

module.exports = authMiddleware;
