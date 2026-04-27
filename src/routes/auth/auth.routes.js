const express = require("express");
const controller = require("../../controllers/auth.controller");
const { auth } = require("../../middlewares/auth.middleware");
const {
  validate,
  loginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changePasswordBodySchema,
} = require("../../validation/auth.validation");

const router = express.Router();

router.post("/login", validate("body", loginBodySchema), controller.login);
router.post("/forgotPassword", validate("body", forgotPasswordBodySchema), controller.forgotPassword);
router.post("/resetPassword", auth, validate("body", resetPasswordBodySchema), controller.resetPassword);
router.post("/changePassword", auth, validate("body", changePasswordBodySchema), controller.changePassword);


module.exports = router;
