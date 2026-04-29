const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "config.env"),
});

const { Sequelize, DataTypes } = require("sequelize");

/** @type {'sequelize' | string} */
const ORM_TYPE = (process.env.DB_ORM || "sequelize").toLowerCase();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    dialectModule: require("mysql2"),
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
  }
);

let modelsInitialized = false;

function initModels() {
  if (modelsInitialized) return;
  // Register all Sequelize models before sync.
  require("../models/role.model");
  require("../models/user.model");
  require("../models/content.model");
  require("../models/content_slots.model");
  require("../models/content_schedule.model");
  modelsInitialized = true;
}

async function connectDB() {
  if (ORM_TYPE !== "sequelize") {
    console.warn(
      `DB_ORM="${ORM_TYPE}" is set; this project wires MySQL through Sequelize. Using Sequelize anyway.`
    );
  }
  await sequelize.authenticate();
  console.log("MySQL connected");
  initModels();
  await sequelize.sync();
  console.log("MySQL tables verified (created if missing)");

  // If the DB schema was created with the wrong type for `content.subject` (INT),
  // Sequelize inserts will fail when we send string subjects like "maths".
  // We auto-heal this column on startup for dev environments.
  try {
    const qi = sequelize.getQueryInterface();
    const table = await qi.describeTable("content");
    const subject = table?.subject;
    const subjectType = subject?.type ? String(subject.type).toLowerCase() : "";
    const looksInteger =
      subjectType.includes("int") || subjectType.includes("integer") || subjectType.includes("bigint");
    const looksEnum = subjectType.includes("enum(");
    if (looksInteger || looksEnum) {
      await qi.changeColumn("content", "subject", {
        type: DataTypes.STRING(100),
        allowNull: false,
      });
      console.log("Auto-migrated `content.subject` to VARCHAR");
    }
  } catch (err) {
    // Don't block server start if introspection/migration fails.
    console.warn("Skipped auto-migration for `content.subject`:", err.message || err);
  }
}

module.exports = {
  sequelize,
  connectDB,
  ORM_TYPE,
};
