const Content = require("../models/content.model");
const { CONTENT_STATUS } = Content;
const User = require("../models/user.model");

const userInclude = [
  { model: User, as: "creator", attributes: ["id", "name", "email"], required: false },
  { model: User, as: "uploader", attributes: ["id", "name", "email"], required: false },
  { model: User, as: "approver", attributes: ["id", "name", "email"], required: false },
];

async function list(req, res) {
  try {
    const statusRaw = req.query.status ? String(req.query.status).toLowerCase() : null;
    const where = {};

    if (statusRaw) {
      if (statusRaw === "pending") where.status = CONTENT_STATUS.PENDING;
      else if (statusRaw === "approved") where.status = CONTENT_STATUS.APPROVED;
      else if (statusRaw === "rejected") where.status = CONTENT_STATUS.REJECTED;
      else {
        return res.json([]);
      }
    }

    const rows = await Content.findAll({
      where,
      include: userInclude,
      order: [["id", "DESC"]],
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not list content" });
  }
}

async function approve(req, res) {
  try {
    const id = req.params.id;
    const existing = await Content.findByPk(id);
    if (!existing) return res.status(404).json({ message: "Content not found" });

    await Content.update(
      {
        status: CONTENT_STATUS.APPROVED,
        rejection_reason: null,
        approved_by: req.user.id,
        approved_at: new Date(),
      },
      { where: { id } }
    );
    const row = await Content.findByPk(id, { include: userInclude });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not approve content" });
  }
}

async function reject(req, res) {
  try {
    const id = req.params.id;
    const existing = await Content.findByPk(id);
    if (!existing) return res.status(404).json({ message: "Content not found" });

    const reason = String(req.body.reason || "").trim();
    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    await Content.update(
      {
        status: CONTENT_STATUS.REJECTED,
        rejection_reason: reason,
        approved_by: req.user.id,
        approved_at: new Date(),
      },
      { where: { id } }
    );
    const row = await Content.findByPk(id, { include: userInclude });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not reject content" });
  }
}

module.exports = {
  CONTENT_STATUS,
  list,
  approve,
  reject,
};
