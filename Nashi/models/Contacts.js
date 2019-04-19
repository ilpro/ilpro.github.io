const db = require('./db');

const Contacts = {
  save(contacts) {
    return new Promise((res, rej) => {
      db.query('INSERT INTO t_users (email,fullName, phone, birthDate) VALUES(?, ?, ?, ?)',
        [contacts.email, contacts.fullName, contacts.phone, contacts.birthDate],
        (err, result) => {
          if (err) return rej(err);
          return res(result.insertId);
        })
    });
  }
};

module.exports = Contacts;