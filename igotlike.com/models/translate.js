/** Created by alex on 12.10.2017 **/
'use strict';
const translate = require('google-translate-api');
const db = require('./db');

module.exports = {
  /** Translate chat message **/
  translateChat(send, data){
    translate(data.text, {from: data.from, to: data.to}).then(res => {
      send(null, 'translatedChat', JSON.stringify(res.text));
    }).catch(err => {
      console.error(err);
    });
  }
}