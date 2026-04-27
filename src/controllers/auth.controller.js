const User = require("../models/user.model");
const Role = require("../models/role.model");
const jwtService = require("../services/jwt.service");
const { comparePassword, hashPassword } = require("../utils/password.util");

function toPublicUser(instance) {
  if (!instance) return null;
  const row = instance.get ? instance.get({ plain: true }) : instance;
  if (row && row.password !== undefined) delete row.password;
  return row;
}

async function login(req, res) {
  try {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({
      where: { email },
      attributes: ["id", "name", "email", "password", "role_id", "create_at"],
    });
    if (!user || !(await comparePassword(req.body.password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwtService.signAccessToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
    });
    const withRole = await User.findByPk(user.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "role", attributes: ["id", "role_name", "status"] }],
    });
    return res.json({
      token,
      user: toPublicUser(withRole),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not sign in" });
  }
}

async function forgotPassword(req, res) {
  try {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ where: { email } });
    const body = {
      message:
        "If that email is registered, password reset instructions have been issued.",
    };
    if (!user) {
      return res.json(body);
    }
    const resetToken = jwtService.signPasswordResetToken(user.id);
    if (process.env.JWT_RESET_TOKEN_IN_RESPONSE === "true") {
      body.resetToken = resetToken;
    }
    return res.json(body);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not process request" });
  }
}

async function resetPassword(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const hashed = await hashPassword(req.body.newPassword);
    await user.update({ password: hashed });
    return res.json({ message: "Password has been reset" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not reset password" });
  }
}

async function changePassword(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "password"],
    });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!(await comparePassword(req.body.oldPassword, user.password))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    await user.update({ password: await hashPassword(req.body.newPassword) });
    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not change password" });
  }
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  changePassword,
};
