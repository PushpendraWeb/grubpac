const Role = require("../models/role.model");

async function create(req, res) {
  try {
    const row = await Role.create({
      role_name: req.body.role_name,
      status: req.body.status !== undefined ? req.body.status : 1,
    });
    return res.status(201).json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not create role" });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const [count] = await Role.update(
      {
        ...(req.body.role_name !== undefined && {
          role_name: req.body.role_name,
        }),
        ...(req.body.status !== undefined && { status: req.body.status }),
      },
      { where: { id } }
    );
    if (count === 0) {
      return res.status(404).json({ message: "Role not found" });
    }
    const row = await Role.findByPk(id);
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not update role" });
  }
}

async function remove(req, res) {
  try {
    const deleted = await Role.destroy({ where: { id: req.params.id } });
    if (deleted === 0) {
      return res.status(404).json({ message: "Role not found" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete role" });
  }
}

async function getById(req, res) {
  try {
    const row = await Role.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Role not found" });
    }
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not load role" });
  }
}

async function getAll(req, res) {
  try {
    const rows = await Role.findAll({ order: [["id", "ASC"]] });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not list roles" });
  }
}

module.exports = {
  create,
  update,
  remove,
  getById,
  getAll,
};
