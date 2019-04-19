const config = require('../config/config');
const mysql = require('mysql');

const DB = mysql.createPool({
  host: config.DB_URI,
  user: config.DB_user,
  password: config.DB_password,
  database: config.DB_name,
  multipleStatements: true
});

module.exports = DB;
