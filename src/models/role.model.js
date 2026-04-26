const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnection");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role_name: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "role",
    timestamps: false,
    underscored: false,
  }
);

module.exports = Role;
