const fs = require('fs')

module.exports = {
  deleteFromDisk: (files) => {
    return new Promise((res, rej) => {
      if (!files || !files.length) {
        return res(true);
      }

      files.forEach((filePath, i) => {
        fs.unlink(filePath, err => {
          if (err) return rej(err);
        })

        if (i === (files.length - 1)) {
          res(true)
        }
      })
    })
  },
}