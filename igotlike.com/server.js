const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const ioLib = require('socket.io');
const fs = require('fs');
const https = require('https');
/* const redis = require("ioredis");
const Redis = redis.createClient(6379, '127.0.0.1'); */

// Utils
const authenticate = require('./utils/middleware').authenticate;
const socketHandler = require('./models/socketHandlers');

// Models
const Helper = require('./models/helper');
const langEn = require('./models/langEn');
const Image = require('./models/image');
const Video = require('./models/video');
const Chat = require('./models/chat');
const oneSignal = require('./models/oneSignal');

// App settings
const app = express();
const port = 6050;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/js/onesignal'));
app.use("/views", express.static(__dirname + '/views'));
app.use(cookieParser());
app.use(fileUpload())

global.langParam = "paramEn";
global.lang = langEn;
global.langFile = "langEn.js";

// Main page
app.get('/', function (req, res) {
	/* res.locals.getPopularAll =  [];
	
	Redis.get("getPopularBoys", function (err, result) {
		if (err) {
			console.log("Error in / page #1\n" + err);
			res.render(__dirname + '/views/landing');
		}
		else {
			result = Helper.shuffleArray(JSON.parse(result));
			
			Redis.get("getPopularGirls", function (err, result2) {
				if (err) {
					console.log("Error in / page #2\n" + err);
					res.render(__dirname + '/views/landing');
				}
				else {
					result2 = Helper.shuffleArray(JSON.parse(result2));
					
					var result3 = result.concat(result2);
					res.locals.getPopularAll = Helper.shuffleArray(result3);

					res.render(__dirname + '/views/landing');
				}
			});
		}
	}); */

  res.render(__dirname + '/views/landing');
});

app.post('/feed/upload-image', (req, res) => {
  const userId = req.cookies.hash ? Helper.getIdByHash(req.cookies.hash) : false;
  const identifyResult = Image.identifyTypeAndGetExtension(req.files.image);

  if (!identifyResult.success) return res.send(identifyResult);

  if (identifyResult.type === 'video') {
    return Video.upload({ userId, image: identifyResult.file })
      .then(result => res.send(JSON.stringify({ img: result })))
      .catch(err => {
        if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
          console.log(err);
          return res.send(JSON.stringify({ success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error' }));
        }
        return res.send(JSON.stringify(err));
      })
  }

  if (identifyResult.type === 'image') {
    return Image.upload({ userId, image: identifyResult.file })
      .then(result => res.send(JSON.stringify({ img: result })))
      .catch(err => {
        if (err.status === STATUS.INTERNAL_ERROR || !err.status) {
          console.log(err);
          return res.send(JSON.stringify({ success: false, status: STATUS.INTERNAL_ERROR, message: 'Server error' }));
        }
        return res.send(JSON.stringify(err));
      })
  }
});

app.post('/chat/attachment', authenticate, (req, res) => {
  Chat.uploadChatAttachment((err, data) => {
    if (err) res.send("error");
    else res.send(data)
  }, {
      userId: req.params.userId,
      file: req.files.file
    });
});

// Push notification resend
app.post('/notifications/push', function (req, res, next) {
  return oneSignal({ ...req.body, header: 'igotlike' });
});

app.get("/faq", function (req, res) {
  var data = {};
  data.page = "faq";
  res.render(__dirname + '/views/faq', data);
});

app.get("/privacy", function (req, res) {
  var data = {};
  data.page = "privacy";
  res.render(__dirname + '/views/privacy', data);
});

app.get("/terms", function (req, res) {
  var data = {};
  data.page = "terms";
  res.render(__dirname + '/views/terms', data);
});

// -------------- Express server
const privateKey = fs.readFileSync('ssl/igotlike.com.key');
const certificate = fs.readFileSync('ssl/igotlike.com.crt');
const httpsServer = https.createServer({ key: privateKey, cert: certificate }, app);
const server = httpsServer.listen(port, function () {
  console.log(new Date());
  console.log('Server listening on port ' + port + '!');
});

// -------------- Local environment
// var server = app.listen(port, function () {
//   console.log(new Date());
//   console.log('Server listening on port ' + port + '!');
// });

// Socket
const io = ioLib(server);
io.on('connection', client => {
  socketHandler(io, client);
});