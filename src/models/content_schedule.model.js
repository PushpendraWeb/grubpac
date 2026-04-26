const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnection");
const User = require("./user.model");
const Content = require("./content.model");
const ContentSlot = require("./content_slots.model");

const ContentSchedule = sequelize.define(
  "ContentSchedule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Content,
        key: "id",
      },
    },
    slot_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: ContentSlot,
        key: "id",
      },
    },
    rotation_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "in minutes",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "content_schedule",
    timestamps: false,
    underscored: false,
  }
);

ContentSchedule.belongsTo(Content, { foreignKey: "content_id", as: "content" });
ContentSchedule.belongsTo(ContentSlot, { foreignKey: "slot_id", as: "slot" });
ContentSchedule.belongsTo(User, { foreignKey: "created_by", as: "creator" });

module.exports = ContentSchedule;
