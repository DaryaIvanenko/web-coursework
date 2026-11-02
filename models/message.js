module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    room: {
      type: DataTypes.STRING,
      allowNull: false
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  return Message;
};