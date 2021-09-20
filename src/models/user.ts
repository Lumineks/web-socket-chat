import { Model, Optional, DataTypes } from "sequelize";
import { sequelize } from ".";

interface userAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  admin: boolean;
  banned: boolean;
  muted: boolean;
}

interface UserCreationAttributes extends Optional<userAttributes, "id"> {}

class User
  extends Model<userAttributes, UserCreationAttributes>
  implements userAttributes
{
  id!: number;
  username!: string;
  email!: string;
  password!: string;
  admin!: boolean;
  banned!: boolean;
  muted!: boolean;
}

User.init(
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 36],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    banned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    muted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    timestamps: false,
    createdAt: false,
    updatedAt: false,
  }
);

// const User = sequelize.define<UserInstance>("User", {

// });

export default User;
