const Joi = require("joi");

const contentStatusValues = ["pending", "approved", "rejected"];

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createBodySchema = Joi.object({
  title: Joi.string().trim().max(100).allow(null, "").optional(),
  description: Joi.string().allow("").optional(),
  subject: Joi.string().trim().min(1).max(100).required(),
  file_url: Joi.string().allow(null, "").optional(),
  file_type: Joi.string().trim().max(45).allow(null, "").optional(),
  file_size: Joi.number().optional(),
  start_time: Joi.alternatives().try(Joi.date(), Joi.string().isoDate()).required(),
  end_time: Joi.alternatives().try(Joi.date(), Joi.string().isoDate()).required(),
  status: Joi.string()
    .valid(...contentStatusValues)
    .optional(),
});

const updateBodySchema = Joi.object({
  title: Joi.string().trim().max(100).allow(null, "").optional(),
  description: Joi.string().allow("").optional(),
  subject: Joi.string().trim().min(1).max(100).optional(),
  file_url: Joi.string().allow(null, "").optional(),
  file_type: Joi.string().trim().max(45).allow(null, "").optional(),
  file_size: Joi.number().optional(),
  start_time: Joi.alternatives().try(Joi.date(), Joi.string().isoDate()).allow(null).optional(),
  end_time: Joi.alternatives().try(Joi.date(), Joi.string().isoDate()).allow(null).optional(),
  uploaded_by: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string()
    .valid(...contentStatusValues)
    .optional(),
  rejection_reason: Joi.string().allow(null, "").optional(),
  approved_by: Joi.number().integer().positive().allow(null).optional(),
  approved_at: Joi.alternatives()
    .try(Joi.date(), Joi.string().isoDate())
    .allow(null)
    .optional(),
}).or(
  "title",
  "description",
  "subject",
  "file_url",
  "file_type",
  "file_size",
  "start_time",
  "end_time",
  "uploaded_by",
  "status",
  "rejection_reason",
  "approved_by",
  "approved_at"
);

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
