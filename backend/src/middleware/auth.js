async function apiKeyAuth(req, res, next) {
  req.userId = "dev-user-id";
  next();
}

module.exports = { apiKeyAuth };
