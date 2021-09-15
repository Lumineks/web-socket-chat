const messages = [];

const delay = 15;

class Messages {
  static add(message) {
    messages.push(message);
  }

  static checkDelay(name, date) {
    if (!messages.length) return true;

    const lastMessage = messages.filter((msg) => msg.name === name).pop();

    if(!lastMessage) return true;

    const lastMessageTime = new Date(lastMessage.date).getTime();
    const newMessageTime = new Date(date).getTime();

    const msgDelay = (newMessageTime - lastMessageTime) / 1000;

    if (msgDelay >= 15) return true;

    return false;
  }
}

module.exports = Messages;
