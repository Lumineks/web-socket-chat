module.exports = (dbUser, token) => {
  return {
    token: token,
    name: dbUser.username,
    email: dbUser.email,
    isAdmin: dbUser.admin,
    isMuted: dbUser.muted,
    isBanned: dbUser.banned,
  };
};
