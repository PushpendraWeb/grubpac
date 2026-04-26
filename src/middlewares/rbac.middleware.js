const Role = require("../models/role.model");

const roleNameCache = new Map();

async function resolveRoleName(roleId) {
  if (!roleId) return null;
  if (roleNameCache.has(roleId)) return roleNameCache.get(roleId);
  const row = await Role.findByPk(roleId);
  const name = row?.role_name ? String(row.role_name).toLowerCase() : null;
  roleNameCache.set(roleId, name);
  return name;
}

/**
 * Ensures logged-in user has one of the allowed role names.
 * @param {string[]} allowedNames e.g. ['principal']
 */
function requireRoleNames(allowedNames) {
  const allowed = (allowedNames || []).map((n) => String(n).toLowerCase());
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role_id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const roleName = await resolveRoleName(req.user.role_id);
      if (!roleName || !allowed.includes(roleName)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user.role_name = roleName;
      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Could not authorize request" });
    }
  };
}

module.exports = {
  requireRoleNames,
};

