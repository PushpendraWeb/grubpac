const ContentSchedule = require("../models/content_schedule.model");
const Content = require("../models/content.model");
const ContentSlot = require("../models/content_slots.model");
const User = require("../models/user.model");

const contentAttrs = ["id", "title", "subject", "status", "file_url", "file_type"];
const slotAttrs = ["id", "subject"];
const userAttrs = ["id", "name", "email"];

const scheduleInclude = [
  { model: Content, as: "content", attributes: contentAttrs, required: false },
  { model: ContentSlot, as: "slot", attributes: slotAttrs, required: false },
  { model: User, as: "creator", attributes: userAttrs, required: false },
];

async function assertContentId(res, value) {
  if (value === null || value === undefined) return true;
  const row = await Content.findByPk(value);
  if (!row) {
    res.status(400).json({ message: "content_id does not reference existing content" });
    return false;
  }
  return true;
}

async function assertSlotId(res, value) {
  if (value === null || value === undefined) return true;
  const row = await ContentSlot.findByPk(value);
  if (!row) {
    res.status(400).json({ message: "slot_id does not reference an existing content slot" });
    return false;
  }
  return true;
}

async function create(req, res) {
  try {
    if (!(await assertContentId(res, req.body.content_id))) return;
    if (!(await assertSlotId(res, req.body.slot_id))) return;
    const row = await ContentSchedule.create({
      content_id: req.body.content_id,
      slot_id: req.body.slot_id,
      rotation_order: req.body.rotation_order,
      duration: req.body.duration,
      created_by: req.user.id,
    });
    const full = await ContentSchedule.findByPk(row.id, { include: scheduleInclude });
    return res.status(201).json(full);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not create content schedule" });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const existing = await ContentSchedule.findByPk(id);
    if (!existing) {
      return res.status(404).json({ message: "Content schedule not found" });
    }
    if (req.body.content_id !== undefined && !(await assertContentId(res, req.body.content_id))) {
      return;
    }
    if (req.body.slot_id !== undefined && !(await assertSlotId(res, req.body.slot_id))) {
      return;
    }
    const payload = {};
    if (req.body.content_id !== undefined) payload.content_id = req.body.content_id;
    if (req.body.slot_id !== undefined) payload.slot_id = req.body.slot_id;
    if (req.body.rotation_order !== undefined) payload.rotation_order = req.body.rotation_order;
    if (req.body.duration !== undefined) payload.duration = req.body.duration;

    const [count] = await ContentSchedule.update(payload, { where: { id } });
    if (count === 0) {
      return res.status(404).json({ message: "Content schedule not found" });
    }
    const row = await ContentSchedule.findByPk(id, { include: scheduleInclude });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not update content schedule" });
  }
}

async function remove(req, res) {
  try {
    const deleted = await ContentSchedule.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
      return res.status(404).json({ message: "Content schedule not found" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete content schedule" });
  }
}

async function getById(req, res) {
  try {
    const row = await ContentSchedule.findByPk(req.params.id, { include: scheduleInclude });
    if (!row) {
      return res.status(404).json({ message: "Content schedule not found" });
    }
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not load content schedule" });
  }
}

async function getAll(req, res) {
  try {
    const rows = await ContentSchedule.findAll({
      include: scheduleInclude,
      order: [["id", "ASC"]],
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not list content schedules" });
  }
}

module.exports = {
  create,
  update,
  remove,
  getById,
  getAll,
};
