const express = require("express");
const controller = require("../../controllers/approval.controller");
const { auth } = require("../../middlewares/auth.middleware");
const { requireRoleNames } = require("../../middlewares/rbac.middleware");
const {
  validate,
  idParamSchema,
  approveBodySchema,
  rejectBodySchema,
} = require("../../validation/approval.validation");

const router = express.Router();

router.get("/content", auth, requireRoleNames(["principal"]), controller.list);
router.patch("/content/:id/approve", auth, validate("params", idParamSchema), validate("body", approveBodySchema), requireRoleNames(["principal"]), controller.approve);
router.patch("/content/:id/reject", auth, validate("params", idParamSchema), validate("body", rejectBodySchema), requireRoleNames(["principal"]), controller.reject);

module.exports = router;

