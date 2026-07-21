// Vercel serverless entry point. Requiring index.js (rather than running it
// directly) skips the app.listen() call there - see the require.main check
// in index.js - and just hands the Express app to Vercel's Node runtime,
// which treats it as a standard (req, res) request handler.
module.exports = require("../index");
