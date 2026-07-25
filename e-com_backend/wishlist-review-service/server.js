const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`[Service] wishlist-review-service started on port ${PORT}`);
});
