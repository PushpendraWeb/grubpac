const ContentSlot = require("../models/content_slots.model");
const User = require("../models/user.model");

const userInclude = [
  {
    model: User,
    as: "creator",
    attributes: ["id", "name", "email"],
    required: false,
  },
];

async function create(req, res) {
  try {
    const row = await ContentSlot.create({
      subject: req.body.subject,
      created_by: req.user.id,
    });
    const full = await ContentSlot.findByPk(row.id, { include: userInclude });
    return res.status(201).json(full);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not create content slot" });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const existing = await ContentSlot.findByPk(id);
    if (!existing) {
      return res.status(404).json({ message: "Content slot not found" });
    }
    const [count] = await ContentSlot.update(
      { subject: req.body.subject },
      { where: { id } }
    );
    if (count === 0) {
      return res.status(404).json({ message: "Content slot not found" });
    }
    const row = await ContentSlot.findByPk(id, { include: userInclude });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not update content slot" });
  }
}

async function remove(req, res) {
  try {
    const deleted = await ContentSlot.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
      return res.status(404).json({ message: "Content slot not found" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete content slot" });
  }
}

async function getById(req, res) {
  try {
    const row = await ContentSlot.findByPk(req.params.id, { include: userInclude });
    if (!row) {
      return res.status(404).json({ message: "Content slot not found" });
    }
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not load content slot" });
  }
}

async function getAll(req, res) {
  try {
    const rows = await ContentSlot.findAll({
      include: userInclude,
      order: [["id", "ASC"]],
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not list content slots" });
  }
}

module.exports = {
  create,
  update,
  remove,
  getById,
  getAll,
};
