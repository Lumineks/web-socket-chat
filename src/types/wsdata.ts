type wsdata = {
  event: string;
  text?: string;
  date?: string;
  color?: string;
  isMuted?: boolean;
  isBanned?: boolean;
  userToMuteName?: string;
  userToBanName?: string;
};

export default wsdata;