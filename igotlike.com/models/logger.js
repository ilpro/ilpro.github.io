
const Logger = {
  createLog(message, ...args) {
    const time = new Date().toGMTString();
    console.log(time, message, args);
  }
};

module.exports = Logger;