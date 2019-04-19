/** Created by alex on 28.02.2017 **/
'use strict';
const db = require('./db');
const request = require('request');
const Mailer = require('./mailer3');
const STATUS = require('./status');

const Cash = {
  monetizationOff: false,

	getNumber: function (data, send){
		var userId = data.userId;

		db.query("SELECT `userCash` FROM `tbl_user` WHERE `userId` = ?", [userId], function(err, rows) {
			if(err)
				console.log('Error occurs in Cash.getNumber', err);
			else
				send(null, 'userCash', JSON.stringify({userCash: rows[0].userCash}));
		});
	},

	increase: function (userId, number){
		
	},

	getPaymentForm(data) {
		return new Promise((resolve, reject) => {
			request.post({
				url: 'http://php.airybay.com/getRefillForm_Ca1Jottw9UBoMLLTuZT9eq7iHwCfFDn5.php', 
				form: {userId:data.userId}
			}, 
			function (err, res, body) {
				if (err) {
					return reject({
						success: false,
						status: STATUS.REQUEST_ERROR,
						paymentForm: false,
						message: err
					});
				}
				else {
					return resolve({
						success: true, 
						status: STATUS.OK, 
						paymentForm: body
					});
				}
			});
		});
	}, 
	
	_isValidJson: function(json) {
		try {
			JSON.parse(json);
			return true;
		} catch (e) {
			return false;
		}
	}, 
	
	checkRefill(data) {
		var self = this;
		
		return new Promise((resolve, reject) => {
			request.post({url:"http://php.airybay.com/getResponseData_Bc8KwEjwn2MUrYiq259UrQuDGaQYCzd3.php", form:data}, function(err, res, body){
				if(err) {
					reject({
						success: false,
						status: STATUS.REQUEST_ERROR,
						message: err
					});
				}
				else if(!self._isValidJson(body)) {
					reject({
						success: false,
						status: 'INVALID_RESULT_DATA',
						message: 'Not valid json'
					});
				}
				else {
					var res = JSON.parse(body);
/* { AutoDeposit: 'true',
  Payment:
   { ID: '59598409',
     State: '6',
     Mode: '5',
     StartDate: '2018-12-21 17:05:39',
     LastDate: '2018-12-21 17:05:52' },
  Recurring: { ID: '410623', Frequency: '30', EndDate: '20191231' },
  Order:
   { ID: '2007',
     Amount: '2500',
     DepositAmount: '2500',
     ReversalAmount: '0',
     Currency: 'USD',
     Description: 'Monthly subscription' },
  Card: { Name: 'test', Number: '401200XXXXXX3335' },
  D3D: { Enrolled: 'N', ECI: '6' },
  Auth:
   { ApprovalCode: '635819',
     ActionCode: '000',
     Description: 'approved' },
  Notification: {},
  RemoteAddress: '159.224.217.6' } */
					resolve(res);
				}
			});
			// resolve({Payment:{State:6}, Order:{ID:29}});
		}).then(res => {
			return new Promise((resolve, reject) => {
				if(parseInt(res.Payment.State) == 6) {
					db.query('SELECT * FROM `tbl_refill` WHERE `refillId` = ?;', [res.Order.ID], (err, rows) => {
						if (err) {
							reject({
								success: false,
								status: STATUS.REQUEST_ERROR,
								message: err
							});
						}
						else if(!rows.length){
							reject({
								success: false,
								status: 'NOT_ORDER_ID',
								message: res.Order.ID
							});
						}
						else if(rows[0].refillStatus != "wait") {
							reject({
								success: false,
								status: 'ORDER_ID_ALREADY_COMPLETE',
								message: res.Order.ID
							});
						}
						else
							resolve({row:rows[0], recurring_id:(res.Recurring.ID), recurring_ip:(res.RemoteAddress)});
					})
				}
				else {
					reject({
						success: false,
						status: 'INVALID_PAYMENT_STATE',
						message: "Payment state = " + res.Payment.State
					});
				}
			});
		}).then(res => {
			return new Promise((resolve, reject) => {
				Mailer.sendMessage({
				  "to": "partners@pickbride.com",
				  "subject": "AB: refill user Id #" + res.row.userId,
				  "html": "#ID" + data.userId + " - subscribe"
				});
				
				db.query("UPDATE `tbl_refill` SET `refillStatus` = 'complete' WHERE `refillId` = ?;\
					UPDATE `tbl_user` SET `subscriptionEndDate` = DATE_ADD(NOW(), INTERVAL 30 DAY), paymentRecurringId = ?, paymentRecurringIP = ? WHERE `userId` = ?;\
					SELECT `subscriptionEndDate` FROM `tbl_user` WHERE `userId` = ?;", 
					[res.row.refillId, res.recurring_id, res.recurring_ip, res.row.userId, res.row.userId], 
				(err, rows) => {
					if (err) {
						reject({
							success: false,
							status: STATUS.REQUEST_ERROR,
							message: err
						});
					}
					else {
						resolve({
							success: true, 
							status: STATUS.OK, 
							subscription: rows[2][0].subscriptionEndDate
						});
					}
				});
			});
		});
	}, 

  /**
   * Insert purchased cash equivalent to DB
   * @param userId
   * @returns {Promise}
   *   {success, status, refilled}
   */
  _insertCashIntoDb(userId) {
    return new Promise((res, rej) => {
      if (!userId) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          refilled: false,
          message: `Cash.insertCashIntoDb: userId is not specified`
        })
      }

      db.query(
        'UPDATE tbl_user SET subscriptionEndDate = (NOW() + INTERVAL 30 DAY) WHERE userId = ?',
        [userId],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Cash.insertCashIntoDb: " + err
          });

          if (!rows.affectedRows) {
            return res({success: true, status: STATUS.NOT_FOUND, refilled: false, message: `User ${userId} not found`});
          }

          return res({success: true, status: STATUS.OK, refilled: true});
        })
    })
  },


  /**
   * TODO: delete on production
   * @param userId
   * @returns {Promise<any>}
   */
  testCancelPurchase(userId) {
    return new Promise((res, rej) => {
      if (!userId) {
        return rej({
          success: false,
          status: STATUS.INVALID_PARAMETERS,
          refilled: false,
          message: `Cash.testPurchase: userId is not specified`
        })
      }

      db.query("UPDATE tbl_user SET paymentRecurringId = '' WHERE userId = ?", [userId],
        (err, rows) => {
          if (err) return rej({
            success: false,
            status: STATUS.INTERNAL_ERROR,
            message: "Error in Cash.purchase: " + err
          });

          if (!rows.affectedRows) {
            return res({success: true, status: STATUS.NOT_FOUND, refilled: false, message: `User ${userId} not found`});
          }

          return res({success: true, status: STATUS.OK, refilled: true});
        })
    })
  },
};

module.exports = Cash;