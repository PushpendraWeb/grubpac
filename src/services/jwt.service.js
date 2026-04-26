const jwt = require("jsonwebtoken");

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment");
  }
  return secret;
}

/**
 * @param {{ userId: number, email: string, role_id: number }} payload
 */
function signAccessToken(payload) {
  return jwt.sign(
    {
      sub: payload.userId,
      email: payload.email,
      role_id: payload.role_id,
      typ: "access",
    },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, getSecret());
  if (decoded.typ !== "access") {
    const err = new Error("Invalid token type");
    err.name = "JsonWebTokenError";
    throw err;
  }
  return decoded;
}

function signPasswordResetToken(userId) {
  return jwt.sign(
    { sub: userId, typ: "password_reset" },
    getSecret(),
    { expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m" }
  );
}

function verifyPasswordResetToken(token) {
  const decoded = jwt.verify(token, getSecret());
  if (decoded.typ !== "password_reset") {
    const err = new Error("Invalid token type");
    err.name = "JsonWebTokenError";
    throw err;
  }
  return decoded;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
};
