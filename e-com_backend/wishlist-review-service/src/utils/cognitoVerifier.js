const { CognitoJwtVerifier } = require("aws-jwt-verify");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

const verifyAccessToken = async (token) => {
  try {
    const payload = await verifier.verify(token);
    return payload;
  } catch (error) {
    console.error("JWT Verification failed:", error.message);
    const err = new Error("Unauthorized: " + error.message);
    err.statusCode = 401;
    throw err;
  }
};

const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
};

module.exports = { verifyAccessToken, extractTokenFromHeader };
