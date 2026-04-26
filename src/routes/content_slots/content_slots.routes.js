const express = require("express");
const controller = require("../../controllers/content_slots.controller");
const { auth } = require("../../middlewares/auth.middleware");
const {
  validate,
  idParamSchema,
  createBodySchema,
  updateBodySchema,
} = require("../../validation/content_slots.validation");

const router = express.Router();

router.get("/getAll", controller.getAll);
router.get("/getById/:id", auth, validate("params", idParamSchema), controller.getById);
router.post("/create", auth, validate("body", createBodySchema), controller.create);
router.put("/update/:id", auth, validate("params", idParamSchema), validate("body", updateBodySchema), controller.update);
router.delete("/delete/:id", auth, validate("params", idParamSchema), controller.remove);

module.exports = router;
