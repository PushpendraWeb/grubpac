const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const approveBodySchema = Joi.object({}).unknown(false);

const rejectBodySchema = Joi.object({
  reason: Joi.string().trim().min(1).required(),
}).unknown(false);

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
  approveBodySchema,
  rejectBodySchema,
  validate,
};

