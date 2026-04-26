const User = require("../models/user.model");
const Role = require("../models/role.model");
const { hashPassword } = require("../utils/password.util");

function toPublic(userInstance) {
  if (!userInstance) return null;
  const row = userInstance.get ? userInstance.get({ plain: true }) : userInstance;
  if (row && row.password !== undefined) delete row.password;
  return row;
}

async function create(req, res) {
  try {
    const role = await Role.findByPk(req.body.role_id);
    if (!role) {
      return res.status(400).json({ message: "role_id does not reference an existing role" });
    }
    const hashed = await hashPassword(req.body.password);
    const row = await User.create({
      name: req.body.name,
      email: req.body.email.toLowerCase(),
      password: hashed,
      role_id: req.body.role_id,
    });
    const withRole = await User.findByPk(row.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "role", attributes: ["id", "role_name", "status"] }],
    });
    return res.status(201).json(toPublic(withRole));
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Email is already registered" });
    }
    console.error(err);
    return res.status(500).json({ message: "Could not create user" });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const existing = await User.findByPk(id);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }
    if (req.body.role_id !== undefined) {
      const role = await Role.findByPk(req.body.role_id);
      if (!role) {
        return res.status(400).json({ message: "role_id does not reference an existing role" });
      }
    }
    const payload = {};
    if (req.body.name !== undefined) payload.name = req.body.name;
    if (req.body.email !== undefined) payload.email = req.body.email.toLowerCase();
    if (req.body.password !== undefined) payload.password = await hashPassword(req.body.password);
    if (req.body.role_id !== undefined) payload.role_id = req.body.role_id;

    const [count] = await User.update(payload, { where: { id } });
    if (count === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const row = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "role", attributes: ["id", "role_name", "status"] }],
    });
    return res.json(toPublic(row));
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Email is already registered" });
    }
    console.error(err);
    return res.status(500).json({ message: "Could not update user" });
  }
}

async function remove(req, res) {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete user" });
  }
}

async function getById(req, res) {
  try {
    const row = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "role", attributes: ["id", "role_name", "status"] }],
    });
    if (!row) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(toPublic(row));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not load user" });
  }
}

async function getAll(req, res) {
  try {
    const rows = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "role", attributes: ["id", "role_name", "status"] }],
      order: [["id", "ASC"]],
    });
    return res.json(rows.map((r) => toPublic(r)));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not list users" });
  }
}

module.exports = {
  create,
  update,
  remove,
  getById,
  getAll,
};
