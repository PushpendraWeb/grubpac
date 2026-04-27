const Joi = require("joi");

const loginBodySchema = Joi.object({
  email: Joi.string().trim().email().max(100).required(),
  password: Joi.string().min(1).max(128).required(),
});

const forgotPasswordBodySchema = Joi.object({
  email: Joi.string().trim().email().max(100).required(),
});

const resetPasswordBodySchema = Joi.object({
  newPassword: Joi.string().min(8).max(128).required(),
});

const changePasswordBodySchema = Joi.object({
  oldPassword: Joi.string().min(1).max(128).required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

function validate(source, schema) {
  return (req, res, next) => {
    const payload =
      source === "body"
        ? req.body
        : source === "params"
          ? req.params
          : req.query;
    const { error, value } = schema.validate(payload, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }
    if (source === "body") req.body = value;
    if (source === "params") Object.assign(req.params, value);
    next();
  };
}

module.exports = {
  loginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changePasswordBodySchema,
  validate,
};
