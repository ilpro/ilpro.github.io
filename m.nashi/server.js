/** third-party modules */
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const config = require('./config/config');

const Contacts = require('./models/Contacts');

/** middleware and settings */
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'ejs');

/** Requests */
app.get('/', (req, res) => {
  res.render(__dirname + '/views/main');
});

app.post('/contacts', (req, res) => {
  Contacts.save(req.body)
    .then(() => res.sendStatus(200))
    .catch(err => res.sendStatus(500));
});

/** startup message */
app.listen(config.PORT, () => console.log('Example app listening on port ' + config.PORT));

