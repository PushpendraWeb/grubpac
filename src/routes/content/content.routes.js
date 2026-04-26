const express = require("express");
const controller = require("../../controllers/content.controller");
const { auth } = require("../../middlewares/auth.middleware");
const {
  validate,
  idParamSchema,
  createBodySchema,
  updateBodySchema,
} = require("../../validation/content.validation");

const router = express.Router();

router.get("/getAll", controller.getAll);
router.get("/live/:teacherId", controller.liveByTeacher);
router.get("/live/teacher-:teacherId", controller.liveByTeacher);
router.get("/getById/:id", auth, validate("params", idParamSchema), controller.getById);
router.post("/create", auth, validate("body", createBodySchema), controller.create);
router.put("/update/:id", validate("params", idParamSchema), validate("body", updateBodySchema), auth,controller.update);
router.delete("/delete/:id", validate("params", idParamSchema), auth, controller.remove);

module.exports = router;
