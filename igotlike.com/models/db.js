'use strict';
const mysql = require('mysql');

module.exports = mysql.createPool({
  host: '148.251.140.242',
  user: 'root',
  password: 'Gh6M54Bk',
  database: 'airybay.com',
  multipleStatements: true
});

// // local environment
// module.exports = mysql.createConnection({
//   host: '0.0.0.0',
//   user: 'root',
//   password: 'password',
//   database: 'airybay',
//   multipleStatements: true
// });