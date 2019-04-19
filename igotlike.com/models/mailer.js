'use strict';

var nodemailer = require('nodemailer');

module.exports = {
	transporter: nodemailer.createTransport({
		host: '37.1.219.81',
		port: 25,
		auth: {
			user: 'admin@airybay.com',
			pass: '4C6q2D8e'
		},
		secure: false,
		ignoreTLS: true
	}), 
	from: 'Airybay <admin@airybay.com>', 
	sendMessage: function(data){
		var mailOptions = {
			from: this.from, 
			to: data.to, 
			subject: data.subject
		};
		if(data.text)
			mailOptions.text = data.text;
		if(data.html)
			mailOptions.html = data.html;
		
		this.transporter.sendMail(mailOptions, function(err, info){
			if(err)
				console.log("Error in Mailer.sendMessage(" + new Date() + ")\n" + err);
		});
	}
};