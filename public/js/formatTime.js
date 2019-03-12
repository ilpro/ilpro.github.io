var formatTime = {
  chat: function (msgDate){
    var date;
    var isToday = moment(msgDate).isSame(moment().startOf('day'), 'd');
    if(isToday){
      date = moment.utc(msgDate).local().format('[Today at] HH:mm');
    } else {
      date = moment.utc(msgDate).local().format('DD.MM.YYYY [at] HH:mm');
    }
    return date;
  }
};