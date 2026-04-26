const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const nullableId = Joi.number().integer().positive().allow(null);
const nullableNonNegInt = Joi.number().integer().min(0).allow(null);

const createBodySchema = Joi.object({
  content_id: nullableId.optional(),
  slot_id: nullableId.optional(),
  rotation_order: nullableNonNegInt.optional(),
  duration: nullableNonNegInt.optional(),
});

const updateBodySchema = Joi.object({
  content_id: nullableId.optional(),
  slot_id: nullableId.optional(),
  rotation_order: nullableNonNegInt.optional(),
  duration: nullableNonNegInt.optional(),
}).or("content_id", "slot_id", "rotation_order", "duration");

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
