module.exports = (sequelize, DataTypes) => {
    const Item = sequelize.define('Item', {
      name: DataTypes.STRING,
      value: DataTypes.STRING
    });
    return Item;
  };
  