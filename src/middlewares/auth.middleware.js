const jwtService = require("../services/jwt.service");

/**
 * Requires `Authorization: Bearer <access_token>`.
 * Sets `req.user` to `{ id, email, role_id }` from the token payload.
 */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const payload = jwtService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role_id: payload.role_id,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = {
  auth,
};
