// Serverless handler for Vercel: reuse the main Express app
const app = require('../src/server');
module.exports = app;
