'use strict';

module.exports = {
  getHashById: function (str) {
    var reg = /^[0-9]+$/gim;
    if (reg.test(str)) {
      var n = Math.floor(Math.random() * (999999999 - 100000000)) + 100000000;
      str = str * n;
      str = n.toString().substr(5) + str + n.toString().substr(0, 5);
      var strLen = str.length;

      n = Math.floor(Math.random() * (strLen - (strLen - 7))) + (strLen - 7);
      var abc = "abcdefghijklmnopqrstuvwxyz";
      var abcLen = abc.length;
      for (var i = 0; i < n; i++) {
        var abcN = Math.floor(Math.random() * abcLen);
        var pos = Math.floor(Math.random() * strLen);
        str = str.substr(0, pos) + abc[abcN] + str.substr(pos);
      }
      return str;
    }
    else
      return false;
  },

  getIdByHash: function (str) {
    if (str) {
      str = str.replace(/[^0-9]+/ig, "");
      var l = str.length;
      var n = str.substr(l - 5) + str.substr(0, 4);
      str = str.substr(4, (l - 9));
      str = str / n;

      var reg = /^[0-9]+$/gim;
      if (reg.test(str))
        return str;
      else
        return false;
    }
    else
      return false;
  },

  getDateTimeSince: function (target) {
    // check if time exists
    if ((typeof target === 'string' && target.includes('0000-00-00')) || target === null || target === undefined) {
      return global.lang.lHelpOffline
    }

    var now = new Date(), diff, yd, md, dd, hd, nd, sd, out, str;

    diff = Math.floor((now.getTime() - target.getTime()) / 1000);

    if (diff > 31536000) {
      yd = Math.floor(diff / 31536000);
      diff = diff - (yd * 31536000);
    }

    if (diff > 86400) {
      dd = Math.floor(diff / 86400);
      diff = diff - (dd * 86400);
    }

    if (diff > 3600) {
      hd = Math.floor(diff / 3600);
      diff = diff - (hd * 3600);
    }

    if (diff > 60) {
      nd = Math.floor(diff / 60);
      diff = diff - (nd * 60);
    }

    if (yd > 0) {
      var k = yd % 10;
      if (k === 1 && yd !== 11)
        str = global.lang.lHelpYear;
      else if (k > 1 && k < 5)
        str = global.lang.lHelpYear14;
      else
        str = global.lang.lHelpYearMany;
      out = yd + " " + str;
    }
    else if (md > 0) {
      var k = md % 10;
      if (k === 1 && md !== 11)
        str = global.lang.lHelpMonth;
      else if (k > 1 && k < 5)
        str = global.lang.lHelpMonth14;
      else
        str = global.lang.lHelpMonthMany;
      out = md + " " + str;
    }
    else if (dd > 0) {
      var k = dd % 10;
      if (k === 1 && dd !== 11)
        str = global.lang.lHelpDay;
      else if (k > 1 && k < 5)
        str = global.lang.lHelpDay14;
      else
        str = global.lang.lHelpDayMany;
      out = dd + " " + str;
    }
    else if (hd > 0) {
      var k = hd % 10;
      if (k === 1 && hd !== 11)
        str = global.lang.lHelpHour;
      else if (k > 1 && k < 5)
        str = global.lang.lHelpHour14;
      else
        str = global.lang.lHelpHourMany;
      out = hd + " " + str;
    }
    else if (nd > 10) {
      var k = nd % 10;
      if (k === 1 && nd !== 11)
        str = global.lang.lHelpMinute;
      else if (k > 1 && k < 5)
        str = global.lang.lHelpMinute14;
      else
        str = global.lang.lHelpMinuteMany;
      out = nd + " " + str;
    }
    else
      out = "online";

    return (out != "online") ? out + global.lang.lHelpAgo : global.lang.lHelpOnline;
  },

  getAge: function (birthDate) {
    var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
      age--;
    return age;
  },

  getStringDate: function (target) {
    var month = global.lang.lHelpMonths;
    var dateObj = new Date(target);
    var date = [dateObj.getDate(), (dateObj.getMonth() + 1), dateObj.getFullYear()];
    return date[0] + " " + month[(date[1] - 1)] + " " + date[2];
  },

  getStringDateTime: function (target) {
    var month = global.lang.lHelpMonths;
    var dateObj = new Date(target);
    var date = [dateObj.getDate(), (dateObj.getMonth() + 1), dateObj.getFullYear()];
    return date[0] + " " + month[(date[1] - 1)] + " " + date[2] + ", " + dateObj.getHours() + ":" + dateObj.getMinutes();
  },

  getTrueUserName: function (obj) {
    if ((typeof obj.useNickname === 'number' || typeof obj.useNickname === 'string') && typeof obj.userNickname === 'string' && typeof obj.userName === 'string' && typeof obj.userLastName === 'string') {
      if (obj.useNickname == 1) {
        if (obj.userNickname.length > 1)
          obj.userName = obj.userNickname;
        else
          obj.userName = "Unknown";
      }
      else if (obj.userName.length > 1 || obj.userLastName.length > 1)
        obj.userName = obj.userName + ' ' + obj.userLastName;
      else
        obj.userName = "Unknown";

      obj.useNickname = undefined;
      obj.userNickname = undefined;
      obj.userLastName = undefined;
    }
    else {
      console.log("----------------------");
      console.log("Helper.getTrueUserName type error");
      if (!(typeof obj.useNickname === 'number' || typeof obj.useNickname === 'string'))
        console.log("typeof obj.useNickname = " + typeof obj.useNickname);
      if (!(typeof obj.userNickname === 'string'))
        console.log("typeof obj.userName = " + typeof obj.userNickname);
      if (!(typeof obj.userName === 'string'))
        console.log("typeof obj.userName = " + typeof obj.userName);
      if (!(typeof obj.userLastName === 'string'))
        console.log("typeof obj.userLastName = " + typeof obj.userLastName);
      console.log("Caller func \n" + new Error().stack);
      console.log("----------------------");
    }

    return obj;
  },

  getTrueSenderReceiverName: function (obj) {
    if ((typeof obj.senderUseNickname === 'number' || typeof obj.senderUseNickname === 'string') &&
      typeof obj.senderNickname === 'string' &&
      typeof obj.senderName === 'string' &&
      typeof obj.senderLastName === 'string' &&
      (typeof obj.receiverUseNickname === 'number' || typeof obj.receiverUseNickname === 'string') &&
      typeof obj.receiverNickname === 'string' &&
      typeof obj.receiverName === 'string' &&
      typeof obj.receiverLastName === 'string'
    ) {
      if (obj.senderUseNickname == 1) {
        if (obj.senderNickname.length > 1)
          obj.senderName = obj.senderNickname;
        else
          obj.senderName = "Unknown";
      }
      else if (obj.senderName.length > 1 || obj.senderLastName.length > 1)
        obj.senderName = obj.senderName + ' ' + obj.senderLastName;
      else
        obj.senderName = "Unknown";

      obj.senderUseNickname = undefined;
      obj.senderNickname = undefined;
      obj.senderLastName = undefined;

      if (obj.receiverUseNickname == 1) {
        if (obj.receiverNickname.length > 1)
          obj.receiverName = obj.receiverNickname;
        else
          obj.receiverName = "Unknown";
      }
      else if (obj.receiverName.length > 1 || obj.receiverLastName.length > 1)
        obj.receiverName = obj.receiverName + ' ' + obj.receiverLastName;
      else
        obj.receiverName = "Unknown";

      obj.receiverUseNickname = undefined;
      obj.receiverNickname = undefined;
      obj.receiverLastName = undefined;
    }

    var re = /^https?:/g;
    if (typeof obj.senderPhoto === 'string')
      obj.senderPhoto = (re.test(obj.senderPhoto) ? obj.senderPhoto : 'https://m.airybay.com' + obj.senderPhoto);
    if (typeof obj.receiverPhoto === 'string')
      obj.receiverPhoto = (re.test(obj.receiverPhoto) ? obj.receiverPhoto : 'https://m.airybay.com' + obj.receiverPhoto);

    return obj;
  },

  capitalizeStringInit: function () {
    String.prototype.capitalize = function () {
      return this.charAt(0).toUpperCase() + this.slice(1);
    }
  },

  formatDate: function (date) {
    var newsDate = new Date(date),
      todayDate = new Date();
    var day1 = newsDate.getDate(),
      day2 = todayDate.getDate();
    var month1 = newsDate.getMonth(),
      month2 = todayDate.getMonth();
    var month = parseInt(newsDate.getMonth()) + 1;
    var day = parseInt(newsDate.getDate());
    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    var dayFull = (day1 == day2 && month1 == month2) ? 'Today' : day + "." + month + "." + newsDate.getFullYear();
    var hours = parseInt(newsDate.getHours()) < 10 ? '0' + newsDate.getHours() : newsDate.getHours();
    var minute = parseInt(newsDate.getMinutes()) < 10 ? '0' + newsDate.getMinutes() : newsDate.getMinutes();
    var time = hours + ":" + minute;
    return {day: dayFull, time: time};
  },

  isNumber: function (obj) {
    return obj !== undefined && typeof(obj) === 'number' && !isNaN(obj);
  },

  correctPostTextBeforeShow: function (text) {
    var hashTagsMatch = text.match(/#[a-zA-Zа-яА-Я0-9]+[^+#,=\s\n]/img);
    if (hashTagsMatch != null) {
      for (var i = 0; i < hashTagsMatch.length; i++) {
        text = text.replace(hashTagsMatch[i], '<a class="htl" target="_blank" href="/hashtag-search/' + hashTagsMatch[i].substr(1) + '"><s>#</s><b>' + hashTagsMatch[i].substr(1) + '</b></a>');
      }
    }

    return text;
  },

  cropLinks: function (string) {
    var reLinks = new RegExp('(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)', "g");
    var reMails = new RegExp('([a-z0-9_\\.-]+)@([\\da-z\\.-]+)\\.([a-z\\.]{2,6})', "g");
    var foundLinks = string.match(reLinks);
    var foundMails = string.match(reMails);

    if (foundLinks != null) {
      for (var i = 0; i < foundLinks.length; i++) {
        string = string.replace(foundLinks[i], '-link-');
      }
    }

    if (foundMails != null) {
      for (var i = 0; i < foundMails.length; i++) {
        string = string.replace(foundMails[i], '-mail-');
      }
    }

    return string;
  },

  htmlEscapeBack: function (str) {
    return String(str)
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ');
  },

  escapeRegExp: function (str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  },

  stringReplaceAll: function (string, find, replace) {
    var self = this;
    return string.replace(new RegExp(self.escapeRegExp(find), 'g'), replace);
  },

  handleUserName(obj){
    obj.userName = (obj.userNickname) ? '@' + obj.userNickname.toLowerCase() : "unknown";

	delete obj.useNickname;
    delete obj.userNickname;
    delete obj.userLastName;

    return obj;
  },

  handleSenderAndReceiverName(obj) {
    // change sender name
    obj.senderName = '@' + obj.senderNickname;
    obj.senderUseNickname = undefined;
    obj.senderNickname = undefined;
    obj.senderLastName = undefined;

    // change receiver name
    obj.receiverName = '@' + obj.receiverNickname;
    obj.senderUseNickname = undefined;
    obj.senderNickname = undefined;
    obj.senderLastName = undefined;

    return obj;
  }, 
  
  shuffleArray(array) {
	  var currentIndex = array.length, temporaryValue, randomIndex;

	  // While there remain elements to shuffle...
	  while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	  }

	  return array;
	},

  checkSubscriptionActive(timestamp) {
    if(!timestamp) return console.log('Helper.checkSubscriptionActive: timestamp is not defined');
    const subscriptionTimeRemaining = new Date(timestamp) - new Date();
    return subscriptionTimeRemaining > 0;
  },
};