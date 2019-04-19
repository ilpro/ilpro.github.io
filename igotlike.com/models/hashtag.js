const db = require('./db');
const Helper = require('./helper');
const STATUS = require('./status');

const Hashtag = {

  /**
   * Insert hashtags into hashtag table and return array with their ids
   *
   * @param hashtagsArray - ['hashtag1', 'hashtag2']
   * @returns {Promise} which returns array: [{id, hashtag}, {id, hashtag}]
   */
  save(hashtagsArray){
    return new Promise((res, rej) => {
      if (!hashtagsArray || !hashtagsArray.length) {
        return res({
          success: true,
          status: STATUS.INTERNAL_ERROR,
          message: 'Hashtag.save: no hashtags array specified'
        });
      }

      // delete # symbol if it exists
      hashtagsArray.forEach((hashtag, i) => {
        hashtagsArray[i] = hashtag.toString().replace(/#+/, '').trim()
      });

      const bulk = hashtagsArray.map(hashtag => [hashtag]);
      db.query(
        'INSERT INTO tbl_hashtag (hashtag) VALUES ? ON DUPLICATE KEY UPDATE hashtag = hashtag; \
         SELECT id, hashtag FROM tbl_hashtag WHERE hashtag IN (?)',
        [bulk, hashtagsArray],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Hashtag.save: \n" + err
          });

          return res({success: true, status: STATUS.OK, hashtags: rows[1]});
        });
    });
  },

  /**
   * Get id for provided hashtag
   *
   * @param hashtagStr
   * @returns {Promise} which retirns
   */
  get(hashtagStr){
    return new Promise((res, rej) => {
      if(!hashtagStr || typeof hashtagStr !== 'string'){
        rej({
          success: false,
          status: STATUS.INTERNAL_ERROR,
          message: 'Hashtag.get error: no hashtag string provided'
        });
      }

      hashtagStr = hashtagStr.replace(/#+/, '').trim();

      db.query(
        'SELECT id, hashtag FROM tbl_hashtag WHERE hashtag = ?;',
        [hashtagStr],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Hashtag.get error: \n" + err
          });

          if (rows.length === 0) return res({
            success: true,
            status: STATUS.NOT_FOUND,
            message: `Hashtag.get error:: hashtag ${hashtagStr} not found`
          });

          return res({success: true, status: STATUS.OK, hashtag: rows[0]});
        });
    })
  },

  /**
   * Search hashtags that looks like specified string
   *
   * @param hashtag - {String}
   */
  search(hashtag){
    return new Promise((res, rej) => {
      if (!hashtag) {
        return rej({
          success: false,
          status: STATUS.INVALID_INPUT_PARAMETERS,
          message: 'Hashtag.search error: No hashtag provided. Request must includes object like {hashtag}'
        });
      }

      hashtag = hashtag.toString().replace(/#+/, '').trim();

      db.query(
        'SELECT hashtag FROM tbl_hashtag WHERE hashtag LIKE ?;',
        [hashtag +'%'],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Hashtag.get error: \n" + err
          });

          if (rows.length === 0) return res({
            success: true,
            status: STATUS.NOT_FOUND,
            message: `Matches for hashtag #${hashtag} not found`
          });

          return res({success: true, status: STATUS.OK, hashtags: rows});
        });
    });
  },
};

module.exports = Hashtag;