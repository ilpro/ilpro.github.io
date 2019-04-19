const db = require('./db');
const Helper = require('./helper');
const ErrorHandler = require('./errorHandler');

module.exports = {
  getPlaces(sendOnce){
    db.query('SELECT * FROM tbl_places_popular',
      (err, rows) => {
        if (err) {
          return ErrorHandler(err);
        }

        sendOnce(null, "popularPlaces", JSON.stringify(rows));
      });
  },

  addPlace(sendOnce, data){
    const self = this;

    self._addPlace(data.city)
      .then(() => self.getPlaces(sendOnce))
      .catch(err => ErrorHandler(err));
  },

  _addPlace(city){
    // remove space after comma
    const formattedPlace = city.toLowerCase().replace(/\s*,\s*/g, ",");

    return new Promise((res, rej) => {
      db.query('INSERT INTO tbl_places_popular (place) VALUES (?)',
        [formattedPlace],
        (err) => {
          if (err) {
            return rej({code: 1, message: `occurs in PopularPlaces._addPlace: ${err}`});
          }
          else {
            return res();
          }
        })
    });
  },

  // delete desired places
  removePlace(data){
    db.query('DELETE FROM tbl_places_popular WHERE id = ?',
      [data.id],
      (err, rows) => {
        if (err) {
          return ErrorHandler(err);
        }
      });
  },
};