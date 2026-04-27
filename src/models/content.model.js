const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnection");
const User = require("./user.model");

const CONTENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const Content = sequelize.define(
  "Content",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    file_url: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    file_type: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    file_size: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: CONTENT_STATUS.PENDING,
    },
    rejection_reason: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: "content",
    timestamps: false,
    underscored: false,
  }
);

Content.belongsTo(User, { foreignKey: "created_by", as: "creator" });
Content.belongsTo(User, { foreignKey: "uploaded_by", as: "uploader" });
Content.belongsTo(User, { foreignKey: "approved_by", as: "approver" });

module.exports = Content;
module.exports.CONTENT_STATUS = CONTENT_STATUS;
