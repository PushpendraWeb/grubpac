const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "config.env"),
});

const { Sequelize } = require("sequelize");

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

async function connectDB() {
  if (ORM_TYPE !== "sequelize") {
    console.warn(
      `DB_ORM="${ORM_TYPE}" is set; this project wires MySQL through Sequelize. Using Sequelize anyway.`
    );
  }
  await sequelize.authenticate();
  console.log("MySQL connected");
}

module.exports = {
  sequelize,
  connectDB,
  ORM_TYPE,
};
