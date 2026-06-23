const express = require("express");
const router = express.Router();

router.post("/signup", (req, res) => {
  const { email, password, name } = req.body;
  res.status(201).json({
    message: "Signup successful",
    user: { id: "mock-user-id", email, name },
  });
});

router.post("/login", (req, res) => {
  const { email } = req.body;
  res.status(200).json({
    message: "Login successful",
    accessToken: "mock_jwt_access_token_4082",
    user: { id: "mock-user-id", email },
  });
});

router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logout successful" });
});

router.post("/refresh", (req, res) => {
  res.status(200).json({
    accessToken: "mock_jwt_new_access_token_4082",
  });
});

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  res.status(200).json({
    message: `Password reset email dispatched via Resend to ${email}`,
  });
});

module.exports = router;
