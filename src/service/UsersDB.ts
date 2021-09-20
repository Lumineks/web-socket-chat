import User from "../models/user";
import { Op } from "sequelize";

export default class UsersService {
  static async mapAllUsers(): Promise<
    {
      name: string;
      email: string;
      isMuted: boolean;
      isBanned: boolean;
    }[]
  > {
    let usersFromDb: User[] = await User.findAll();

    return usersFromDb.map((user) => {
      return {
        name: user.username,
        email: user.email,
        isMuted: user.muted,
        isBanned: user.banned,
      };
    });
  }

  static async findByLoginData(email: string, username: string): Promise<User | null> {
    return await User.findOne({
      where: {
        [Op.or]: [{ email: email }, { username: username }],
      },
    });
  }

  static async findById(userId: number): Promise<User | null> {
    return await User.findByPk(userId);
  }

  static async updateByName(name: string, value: { muted?: boolean; banned?: boolean }): Promise<void> {
    try {
      await User.update(value, {
        where: {
          username: name,
        },
      });
    } catch (e) {
      console.log("UpdateByName error: ", e);
    }
  }

  static async create(username: string, encryptedPassword: string, email: string): Promise<User> {
    return await User.create({
      username: username,
      password: encryptedPassword,
      email: email,
      banned: false,
      admin: false,
      muted: false,
    });
  }
}
