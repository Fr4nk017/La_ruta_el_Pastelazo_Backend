// Test simple para verificar que Vercel funciona
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Vercel Serverless Function is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
    }
  });
};
