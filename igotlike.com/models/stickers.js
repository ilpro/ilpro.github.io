/** Created by alex on 20.03.2017 **/
'use strict';
const request = require('request');
const db = require('./db');
const Helper = require('./helper');
const Cash = require('./cash');

const favoritePacks = [11, 143, 117, 53];


class Stickers {
  /** Class properties must be here **/
  constructor() {

  }

  getAll(send, data) {
    let userId = data.userId;

    request({
      url: 'https://emosmile.com/stickers?domain=pickbride&stickers=all&type=stickers&smiles=1',
      json: true, 
	  timeout: 5000
    }, (error, response, body) => {
      // error means internal error, not status code (like 404). E.g. wrong address
      // response - response with status code and headers
      // body - results array with response and info
      if (error) {
        console.log('Unable to connect to Emosmiles server');
      } else {
        // get user favorite sticker packs and sticker pack price
        db.query(
          'SELECT `favoritePacks` FROM `cbl_stickerpack_favorite` WHERE `userId` = ?;\
           SELECT `stickerPackId` FROM `cbl_user_buy_stickerpack` WHERE `userId` = ?;',
          [userId, userId],
          function (err, rows) { 
            if (err) {
              console.log('Error occurs in Stickers.getAll, second query', err);
            } else {
              
              // if user has favorite sticker packs
              body.data.favorites = favoritePacks;
              if (rows[0].length > 0 && rows[0][0].favoritePacks.length > 0) {
                body.data.favorites = rows[0][0].favoritePacks;
              }

              // if user has bought sticker packs
              if(rows[1].length > 0){
                body.data.purchasedPacks =  rows[1];
              }

              // price for packs
              body.data.stickerPackPrice = 0;

              send(null, 'stickersAll', JSON.stringify(body.data));
            }
          }
        );
      }
    });
  }

  /** Get user favorites stickers, if favorites not exists, get most popular **/
  getUserStickers(send, data) {
    const self = this;

    // if user hasn't favorite stickers, this will be stickers by default
    let favorites = false;
    let userId = false;
    let userFavoritePacks = favoritePacks;

    //=============
    // If user is anonymous - get stickers and exit
    if (!data.hash) {
      request({
        // url:
        // `https://emosmile.com/stickers?domain=pickbride&stickers=${favorites}&type=stickers&smiles=1`,
        url: `https://emosmile.com/stickers?domain=pickbride&stickers=all&type=stickers&smiles=1`,
        json: true,
        timeout: 5000
      }, (error, response, body) => {
        // error means internal error, not status code (like 404). E.g. wrong address
        // response - response with status code and headers
        // body - results array with response and info
        if (error) {
          console.log('Unable to connect to Emosmiles server');
        } else {
          // 4. after response send  to client
          send(null, 'userStickers', JSON.stringify({stickers: body.data, favoritePacks: userFavoritePacks, favorites}));
        }
      });

      return;
    }

    //=============
    // Or get stickers with user's favorite packs
    // get user ID
    userId = Helper.getIdByHash(data.hash);

    // 1. get user favorite packs
    db.query(
      'SELECT `favoritePacks` FROM `cbl_stickerpack_favorite` WHERE `userId` = ?',
      [userId],
      function (err, rows) {
        if (err) {
          console.log('Error occurs in Stickers.getUserStickers, favoritePacks func', err);
        } else {
          if (rows[0] && rows[0].favoritePacks) {
            userFavoritePacks = rows[0].favoritePacks.split(',');
          }

          // 2. get user favorite single stickers
          db.query(
            'SELECT `imgCode`, `img`, `type` FROM `cbl_sticker_favorite` WHERE `userId` = ? ORDER BY `time` DESC LIMIT 30',
            [userId],
            function (err, rows) {
              if (err) {
                console.log('Error occurs in Stickers.getUserStickers, favoriteStickers func ', err);
              } else {
                if (rows.length > 0) {
                  favorites = rows;
                }

                // 3. then make request to emosmile server for all sticker packs
                request({
                  // url:
                  // `https://emosmile.com/stickers?domain=pickbride&stickers=${favorites}&type=stickers&smiles=1`,
                  url: `https://emosmile.com/stickers?domain=pickbride&stickers=all&type=stickers&smiles=1`,
                  json: true,
                  timeout: 5000
                }, (error, response, body) => {
                  // error means internal error, not status code (like 404). E.g. wrong address
                  // response - response with status code and headers
                  // body - results array with response and info
                  if (error) {
                    console.log('Unable to connect to Emosmiles server');
                  } else {
                    // 4. after response send  to client
                    send(null, 'userStickers', JSON.stringify({stickers: body.data, favoritePacks: userFavoritePacks, favorites}));
                  }
                });
              }
            }
          )
        }
      }
    );
  }

  /** Update sticker packs **/
  updateFavoriteStickerPacks(send, data) {
    let userId = data.userId;
    let packs = data.packs.join(',');

    db.query(
      'INSERT INTO `cbl_stickerpack_favorite` (`userId`, `favoritePacks`) \
       VALUES(?, ?) ON DUPLICATE KEY UPDATE `favoritePacks` = ?',
      [userId, packs, packs],
      function (err) {
        if (err) {
          console.log('Error occurs in Stickers.updateFavoriteStickerPacks', err);
        }
      }
    );
  }

  /** Get all user single favorite stickers **/
  getStickersFavorites(send, data) {
    let userId = data.userId;

    db.query(
      'SELECT `imgCode`, `img`, `type` FROM `cbl_sticker_favorite` WHERE `userId` = ? ORDER BY `time` DESC LIMIT 30',
      [userId],
      function (err, rows) {
        if (err) {
          console.log('error occurs in Chat.getStickersFavorites ', err);
        } else {
          send(null, 'stickersFavorites', JSON.stringify(rows));
        }
      }
    )
  }

  /** Update single sticker's favorites **/
  updateStickersFavorites(send, data) {
    var self = this;

    let userId = data.userId;
    let imgCode = data.imgCode;
    let img = data.img;
    let type = data.type;

    db.query(
      'INSERT INTO `cbl_sticker_favorite`(`userId`, `imgCode`, `img`, `type`) VALUES (?, ?, ?, ?)\
       ON DUPLICATE KEY UPDATE `time` = NOW()',
      [userId, imgCode, img, type],
      function (err, rows) {
        if (err) {
          console.log('Error occurs in Stickers.updateStickersFavorites ', err);
        } else {
          // send to client updated favorites if sticker was clicked
          // self.getStickersFavorites(send, data);
        }
      }
    )
  }

  getAllGifts(send, data) {
    let userId = data.userId;

    request({
      url: 'https://emosmile.com/gifts?domain=pickbride',
      json: true, 
	  timeout: 5000
    }, (error, response, body) => {
      // error means internal error, not status code (like 404). E.g. wrong address
      // response - response with status code and headers
      // body - results array with response and info
      if (error) {
        console.log('Unable to connect to Emosmiles server');
      } else {
        send(null, 'giftsAll', JSON.stringify(body.data));
      }
    });
  }

  buyStickerPack(send, data) {
    var self = this;

    db.query(
      "SELECT `userCash`, `userRole` FROM `tbl_user` WHERE `userId` = ?;\
	     SELECT `id` FROM `cbl_user_buy_stickerpack` WHERE `userId` = ? AND `stickerPackId` = ?;",
      [data.userId, data.userId, data.stickerPackId],
      function (err, rows) {
        if (err)
          console.log("Error occurs in Sticker.buyStickerPack" + err);
        else {
          let alreadyBought = rows[1];
          let price = 0;
          let userRole = rows[0][0].userRole;
          let userCash = rows[0][0].userCash;

          if(alreadyBought.length > 0){
            console.log(`Stickers.buyStickerPack: user ID${data.userId} already bought pack ID${data.stickerPackId}`)
          }

          // if sticker pack in default
          for(var i = 0; i < favoritePacks.length; i++){
            if(favoritePacks[i] === +data.stickerPackId){
              db.query(
                "INSERT INTO `cbl_user_buy_stickerpack` (`userId`, `stickerPackId`) VALUES (?, ?);",
                [data.userId, data.stickerPackId],
                function (err, res) {
                  if (err)
                    console.log("Error occurs in Sticker.buyStickerPack, 'INSERT into `cbl_user_buy_stickerpack`' clause" + err);
                  else {
                    send(null, 'buyStickerPack', JSON.stringify({result: true, stickerPackId: data.stickerPackId}));
                  }
                });
              return;
            }
          }

          // check if userCash > price or user is admin
          if(userRole >= 19 || userCash >= price){
            db.query(
              "INSERT INTO `cbl_user_buy_stickerpack` (`userId`, `stickerPackId`) VALUES (?, ?);",
              [data.userId, data.stickerPackId],
              function (err, res) {
                if (err)
                  console.log("Error occurs in Sticker.buyStickerPack, 'INSERT into `cbl_user_buy_stickerpack`' clause" + err);
                else {
                  // if user admin or model - buy stickerpack without payment
                  if (userRole < 19) {
                    Cash.addTransaction({
                      userId: data.userId,
                      profileId: data.userId,
                      typeId: 11,
                      sum: (price * -1),
                      comment: ""
                    }, function () {
                      Cash.getNumber({userId: data.userId}, send);
                    });
                  }

                  send(null, 'buyStickerPack', JSON.stringify({result: true, stickerPackId: data.stickerPackId}));
                }
              })
          } else {
            send(null, 'showRefillForm', JSON.stringify("Sorry, you don't have enough coins on your account"));
          }
        }
      })
  }
}

module.exports = Stickers;