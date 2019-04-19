/** third-party modules */
const express = require('express');
const bodyParser = require('body-parser');
const MobileDetect = require('mobile-detect');

const app = express();
const config = require('./config/config');

const Contacts = require('./models/Contacts');

/** middleware and settings */
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'ejs');

app.use((req, res, next) => {
  const md = new MobileDetect(req.headers['user-agent']);
  if(md.mobile() || md.phone() || md.tablet()){
    return res.redirect('http://m.partiyanashi.com/');
  }
  return next();
});

/** Requests */
app.get('/', (req, res) => {
  res.render(__dirname + '/views/main');
});

app.get('/petition', (req, res) => {
  res.render(__dirname + '/views/petition');
});

app.post('/contacts', (req, res) => {
  Contacts.save(req.body)
    .then(() => res.sendStatus(200))
    .catch(err => res.sendStatus(500));
});


/** startup message */
app.listen(config.PORT, () => console.log('Example app listening on port ' + config.PORT));

