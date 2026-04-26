const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createBodySchema = Joi.object({
  role_name: Joi.string().trim().min(1).max(45).required(),
  status: Joi.number().integer().min(0).max(255).optional(),
});

const updateBodySchema = Joi.object({
  role_name: Joi.string().trim().min(1).max(45).optional(),
  status: Joi.number().integer().min(0).max(255).optional(),
}).or("role_name", "status");

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
