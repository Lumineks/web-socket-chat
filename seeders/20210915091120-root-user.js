'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    
     return queryInterface.bulkInsert('Users', [{
      username: 'root',
      password: await bcrypt.hash('root', 10),
      email: 'root@root',
      banned: false,
      admin: true,
      muted: false,
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
