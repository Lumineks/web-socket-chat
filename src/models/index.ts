import { Dialect, Sequelize } from "sequelize";

// Require.main can be undefined - question
// const config = require(__dirname + '/../../config/config.json')[env];

import config from '../config/config.json';

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {dialect: config.development.dialect as Dialect});

export { Sequelize, sequelize };
