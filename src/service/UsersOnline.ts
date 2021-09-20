import { userOnline } from "../types/userOnline";

const usersOnline: userOnline[] = [];

export default class UsersOnline {
  static getAll(): userOnline[] {
    return usersOnline;
  }

  static getRoot(): userOnline | undefined {
    return usersOnline.find((u) => u.username === "root");
  }

  static getByName(username: string): userOnline | undefined {
    return usersOnline.find((u) => u.username === username);
  }

  static includes(username: string): boolean {
    return !!usersOnline.find((u) => u.username === username);
  }

  static add(user: userOnline): void {
    usersOnline.push(user);
  }

  static removeById(id: number): void {
    const userIdx = usersOnline.findIndex((u) => u.id === id);
    usersOnline.splice(userIdx, 1);
  }

  static map(): {
    name: string;
    email: string;
    isMuted: boolean;
    isBanned: boolean;
  }[] {
    const mappedUsers = usersOnline.map((user) => {
      return {
        name: user.username,
        email: user.email,
        isMuted: user.muted,
        isBanned: user.banned,
      };
    });

    return mappedUsers;
  }

  static toggleMuteByName(username: string, isMuted: boolean): void {
    const onlineUser = this.getByName(username);

    if (onlineUser) {
      onlineUser.muted = isMuted;
    }
  }
}
