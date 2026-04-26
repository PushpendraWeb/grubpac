const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createBodySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(100).required(),
  password: Joi.string().min(8).max(128).required(),
  role_id: Joi.number().integer().positive().required(),
});

const updateBodySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().trim().email().max(100).optional(),
  password: Joi.string().min(8).max(128).optional(),
  role_id: Joi.number().integer().positive().optional(),
}).or("name", "email", "password", "role_id");

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
  idParamSchema,
  createBodySchema,
  updateBodySchema,
  validate,
};
