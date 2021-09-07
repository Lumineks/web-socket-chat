module.exports = (dbUser, token) => {
    console.log(dbUser);
  return {
    token: token,
    name: dbUser.username,
    email: dbUser.email,
    isAdmin: dbUser.admin,
    isMuted: dbUser.muted,
    isBanned: dbUser.banned,
  };
};
