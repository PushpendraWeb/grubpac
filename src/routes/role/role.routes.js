const express = require("express");
const controller = require("../../controllers/role.controller");
const {
  validate,
  idParamSchema,
  createBodySchema,
  updateBodySchema,
} = require("../../validation/role.validation");

const router = express.Router();
router.get("/getAll", controller.getAll);
router.get("/getById/:id", validate("params", idParamSchema), controller.getById);
router.post("/create", validate("body", createBodySchema), controller.create);
router.put("/update/:id", validate("params", idParamSchema), controller.update);
router.delete("/delete/:id", validate("params", idParamSchema), controller.remove);

module.exports = router;
