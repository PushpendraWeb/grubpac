const roleRouter = require("./role/role.routes");
const userRouter = require("./user/user.routes");
const authRouter = require("./auth/auth.routes");
const contentRouter = require("./content/content.routes");
const contentSlotsRouter = require("./content_slots/content_slots.routes");
const contentScheduleRouter = require("./content_schedule/content_schedule.routes");
const fileUploaderRouter = require("./upload/fileuploader.js");  
const approvalRouter = require("./approval/approval.routes");

function routes(app) {
  app.use("/api/auth", authRouter);
  app.use("/api/roles", roleRouter);
  app.use("/api/users", userRouter);
  app.use("/api/content", contentRouter);
  app.use("/api/content_slots", contentSlotsRouter);
  app.use("/api/content_schedule", contentScheduleRouter);
  app.use("/api/file_uploader", fileUploaderRouter);
  app.use("/api/approval", approvalRouter);
}

module.exports = routes;
