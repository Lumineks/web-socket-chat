import { userOnline } from "../types/userOnline";

const usersOnline: userOnline[] = [];

export class UsersOnline {
  static getAll() {
    return usersOnline;
  }

  static getRoot() {
    return usersOnline.find((u) => u.username === "root");
  }

  static getByName(username: string) {
    return usersOnline.find((u) => u.username === username);
  }

  static includes(username: string) {
    return !!usersOnline.find((u) => u.username === username);
  }

  static add(user: userOnline) {
    usersOnline.push(user);
  }

  static removeById(id: number) {
    const userIdx = usersOnline.findIndex((u) => u.id === id);
    usersOnline.splice(userIdx, 1);
  }

  static map() {
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

  static toggleMuteByName(username: string, isMuted: boolean) {
    const onlineUser = this.getByName(username);

    if(onlineUser) {
      onlineUser.muted = isMuted;
    }
  }
}
