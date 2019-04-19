'use strict';

var nodemailer = require('nodemailer');

module.exports = {
	// transporter: nodemailer.createTransport('smtps://service.pickbride.com@gmail.com:yyyyyyyy1@smtp.gmail.com'), 
	// from: 'Pickbride <service.pickbride.com@gmail.com>', 
	transporter: nodemailer.createTransport({
		host: '37.252.15.159',
		port: 25,
		auth: {
			user: 'noreply@pickbride.com',
			pass: '123456qwe!'
		},
		secure: false,
		ignoreTLS: true
	}), 
	from: 'Pickbride <noreply@pickbride.com>', 
	sendMessage: function(data){
		var mailOptions = {
			from: this.from, 
			to: data.to, 
			subject: data.subject
		};
		if(data.text)
			mailOptions.text = data.text;
		else
			mailOptions.html = data.html;
		
		this.transporter.sendMail(mailOptions, function(err, info){
			if(err)
				console.log("Error in Mailer.sendMessage(" + new Date() + ")\n" + err);
		});
	}
};