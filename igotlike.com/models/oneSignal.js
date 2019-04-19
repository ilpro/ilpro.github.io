/** Created by alex on 09.06.2017 **/
'use strict';
const https = require('https');

// igotlike keys
const appId = "efd2b898-127a-4b96-9bf5-5a85e6db65c6";
const restApiKey = "YzIwNzcwNGEtMDcyNy00OWIwLTlhMzAtOWVlOWE0ZjJjNjdl";

const oneSignal = function (sendData) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": `Basic ${restApiKey}`
  };

  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };

  var req = https.request(options, function (res) {
    res.on('data', function (data) { });
  });

  req.on('error', function (e) {
    console.log("ERROR:");
    console.log(e);
  });

  // sending
  let data = {
    app_id: appId
  };

  if (!sendData.userId) {
    return console.log('Error occurs in oneSignal: userId not specified!');
  } else {
    data.filters = [{ field: "tag", key: "userId", value: sendData.userId }];
  }

  if (!sendData.header && !sendData.message) {
    return console.log('Error occurs in oneSignal: message and header not specified');
  } else {
    if (sendData.message) data.contents = { en: sendData.message };
    if (sendData.header) data.headings = { en: sendData.header };
  }

  if (sendData.ios_attachments) data.ios_attachments = sendData.ios_attachments;
  if (sendData.url) data.url = sendData.url;
  if (sendData.ios_badgeType) data.ios_badgeType = sendData.ios_badgeType;
  if (sendData.ios_badgeCount) data.ios_badgeCount = sendData.ios_badgeCount;
  if (sendData.data) data.data = sendData.data;
  if (sendData.android_group) data.android_group = sendData.android_group;

  req.write(JSON.stringify(data));
  req.end();
};

module.exports = oneSignal;