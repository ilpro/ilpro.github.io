const STATUS = require('./status');
const Logger = require('./logger');

const ErrorHandler = err => {
  // error object can be overwritten in switch statements
  const errorForClient = {
    success: false,
    message: "Server error",
    status: STATUS.INTERNAL_ERROR
  };

  if(!err.status){
    Logger.createLog(err);
    return errorForClient;
  }

  if(
    err.status === STATUS.INVALID_INPUT_PARAMETERS ||
    err.status === STATUS.NOT_FOUND ||
    err.status === STATUS.USER_IN_BLACKLIST ||
    err.status === STATUS.DO_NOT_DISTURB_SENDER ||
    err.status === STATUS.DO_NOT_DISTURB_RECEIVER ||
    err.status === STATUS.ONLY_FAVORITES_RECEIVER ||
    err.status === STATUS.SUBSCRIPTION_NEEDED
  ){
    errorForClient.status = err.status;
    errorForClient.message = err.message;
    return errorForClient;
  }

  Logger.createLog(err);
  return errorForClient;
};

module.exports = ErrorHandler;