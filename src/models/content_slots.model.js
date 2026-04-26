const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnection");
const User = require("./user.model");

const ContentSlot = sequelize.define(
  "ContentSlot",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    tableName: "content_slots",
    timestamps: false,
    underscored: false,
  }
);

ContentSlot.belongsTo(User, { foreignKey: "created_by", as: "creator" });

module.exports = ContentSlot;
