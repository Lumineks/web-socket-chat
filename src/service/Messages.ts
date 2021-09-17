import { message } from "../types/message";

const messages: message[] = [];

const delay: number = 15;

export class Messages {
  static add(message: message): void {
    messages.push(message);
  }

  static checkDelay(name: string, date: string): boolean {
    if (!messages.length) return true;

    const lastMessage = messages.filter((msg) => msg.name === name).pop();

    if(!lastMessage) return true;

    const lastMessageTime: number = new Date(lastMessage.date).getTime();
    const newMessageTime: number = new Date(date).getTime();

    const msgDelay = (newMessageTime - lastMessageTime) / 1000;

    if (msgDelay >= delay) return true;

    return false;
  }
}
