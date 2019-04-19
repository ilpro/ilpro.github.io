const db = require('./db');

module.exports = {
	getConfirmMessage: function (data, send) {
		var self = this;
		
		send(self.htmlHeader + '<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
		<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
			<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;float: left;">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="line-height:20px;font-size:1px">&nbsp;</div>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="margin-top: 0;margin-bottom: 10px;font-size: 16px;line-height: 26px;" lang="x-size-18"><span style="color:#333333">Hi, ' + data.receiverName + '!</span></p>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="margin-top: 0;margin-bottom: 20px;font-size: 15px;line-height: 26px;" lang="x-size-18"><span style="color:#333333"><strong>In order to confirm your email, follow the link:</strong><br>' + url + '</span></p>\
				</div>\
			</div>\
		</div>\
	</div>\
	<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
	<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
	<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
		<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
			<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="text-align:center;">\
						<a style="border-radius: 4px;display: inline-block;font-size: 20px;font-weight: bold;line-height: 24px;padding: 12px 24px;text-align: center;text-decoration: none !important;transition: opacity 0.1s ease-in;color: #ffffff !important;background-color: #ea6a6a;font-family: sans-serif;width: 230px;" href="' + data.url + '" target="_blank" rel="noopener">Confirm my email</a>\
					</div>\
				</div>\
			</div>\
		</div>\
</div>' + self.htmlFooter);
	}, 
	
	getResetPasswordMessage: function (data, send) {
		var self = this;
		
		send(self.htmlHeader + '<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
		<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
			<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;float: left;">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="line-height:20px;font-size:1px">&nbsp;</div>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="margin-top: 0;margin-bottom: 10px;font-size: 16px;line-height: 26px;" lang="x-size-18"><span style="color:#333333">Hello, @' + data.receiverName + '!</span></p>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="margin-top: 0;margin-bottom: 20px;font-size: 15px;line-height: 26px;" lang="x-size-18"><span style="color:#333333">You have requested reset of the password.<br>\
Please copy following code into the app:<br>\
<strong>' + data.code + '</strong><br>\
If you didn\'t request the password reset, ignore the message.<br><br>\
Thank you.</span></p>\
				</div>\
			</div>\
		</div>\
	</div>\
	<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
	<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
	<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
		<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
			<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="text-align:center;">\
						<a style="border-radius: 4px;display: inline-block;font-size: 20px;font-weight: bold;line-height: 24px;padding: 12px 24px;text-align: center;text-decoration: none !important;transition: opacity 0.1s ease-in;color: #ffffff !important;background-color: #ea6a6a;font-family: sans-serif;width: 230px;" href="' + data.url + '" target="_blank" rel="noopener">Confirm my email</a>\
					</div>\
				</div>\
			</div>\
		</div>\
</div>' + self.htmlFooter);
	},
	
	getChatMessage: function (data, send) {
		var self = this;
		
		send(self.htmlHeader + '<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
		<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
			<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;float: left;max-width: 320px;min-width: 300px;width: 320px;width: calc(12300px - 2000%);">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="line-height:20px;font-size:1px">&nbsp;</div>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="margin-top: 0;margin-bottom: 10px;font-size: 16px;line-height: 26px;" lang="x-size-18"><span style="color:#333333">Hi, ' + data.receiverName + '!</span></p>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="margin-top: 0;margin-bottom: 20px;font-size: 15px;line-height: 26px;" lang="x-size-18"><span style="color:#333333"><strong>You have received a new message from:</strong></span></p>\
				</div>\
			</div>\
			<div style="text-align: left;color: #8e959c;font-size: 20px;line-height: 21px;font-family: sans-serif;float: left;max-width: 320px;min-width: 300px;width: 320px;width: calc(12300px - 2000%);">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="line-height:20px;font-size:1px">&nbsp;</div>\
				</div>\
				<div style="font-size: 12px;font-style: normal;font-weight: normal;height: 100px;" align="center">\
					<a href="https://m.airybay.com/profile/' + data.senderId + '"><img style="border: 0;display: block;height: auto;width: 100%;max-width: 100px;" alt="" width="120" src="' + data.senderPhoto + '" alt="user photo"></a>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="font-weight:bold;margin-top: 0;margin-bottom: 0;text-align: center;text-decoration: underline;font-size: 16px;"><a href="https://m.airybay.com/profile/' + data.senderId + '">' + data.senderName + '</a></p>\
				</div>\
			</div>\
		</div>\
	</div>\
	<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
	<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
	<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
		<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
			<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="text-align:center;">\
						<a style="border-radius: 4px;display: inline-block;font-size: 20px;font-weight: bold;line-height: 24px;padding: 12px 24px;text-align: center;text-decoration: none !important;transition: opacity 0.1s ease-in;color: #ffffff !important;background-color: #ea6a6a;font-family: sans-serif;width: 230px;" href="https://m.airybay.com/chat#id=' + data.senderId + '" target="_blank" rel="noopener">My messages</a>\
					</div>\
				</div>\
			</div>\
		</div>\
</div>' + self.htmlFooter);
	},
	
	getLikeMessage: function(data, send) {
		var self = this;
		
		send(self.htmlHeader + '<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
	<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
		<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;float: left;max-width: 320px;min-width: 300px;width: 320px;width: calc(12300px - 2000%);">\
			<div style="margin-left: 20px;margin-right: 20px;">\
				<div style="line-height:20px;font-size:1px">&nbsp;</div>\
			</div>\
			<div style="margin-left: 20px;margin-right: 20px;">\
				<p style="margin-top: 0;margin-bottom: 10px;font-size: 16px;line-height: 26px;" lang="x-size-18"><span style="color:#333333">Hi, '+ data.receiverName +'!</span></p>\
			</div>\
			<div style="margin-left: 20px;margin-right: 20px;">\
				<p style="margin-top: 0;margin-bottom: 20px;font-size: 15px;line-height: 26px;" lang="x-size-18"><span style="color:#333333"><strong>This person liked your photo:</strong></span></p>\
			</div>\
		</div>\
		<div style="text-align: left;color: #8e959c;font-size: 20px;line-height: 21px;font-family: sans-serif;float: left;max-width: 320px;min-width: 300px;width: 320px;width: calc(12300px - 2000%);text-align: center;">\
			<div style=" display: inline-block; vertical-align: top; ">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="line-height: 45px;font-size:1px;">&nbsp;</div>\
				</div>\
				<div style="font-size: 12px;font-style: normal;font-weight: normal;" align="center">\
					<img style="border: 0;display: block;height: auto;width: 100%;max-width: 80px;" alt="" width="80" src="https://www.airybay.com/img/for_html_email/like.png" alt="heart">\
				</div>\
			</div>\
			<div style=" display: inline-block; padding-left: 20px; ">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="line-height:20px;font-size:1px">&nbsp;</div>\
				</div>\
				<div style="font-size: 12px;font-style: normal;font-weight: normal;height: 100px;" align="center">\
					<a href="https://m.airybay.com/profile/'+ data.senderId +'"><img style="border: 0;display: block;height: auto;width: 100%;max-width: 100px;" alt="" width="120" src="'+ data.senderPhoto +'" alt="user photo"></a>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="font-weight:bold;margin-top: 0;margin-bottom: 0;text-align: center;text-decoration: underline;font-size: 16px;">\
						<a href="https://m.airybay.com/profile/'+ data.senderId +'">'+ data.senderName +'</a>\
					</p>\
				</div>\
			</div>\
		</div>\
	</div>\
</div>\
<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
	<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
		<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);">\
			<div style="margin-left: 20px;margin-right: 20px;">\
				<div style="text-align:center;">\
					<a style="border-radius: 4px;display: inline-block;font-size: 20px;font-weight: bold;line-height: 24px;padding: 12px 24px;text-align: center;text-decoration: none !important;transition: opacity 0.1s ease-in;color: #ffffff !important;background-color: #ea6a6a;font-family: sans-serif;width: 230px;" href="https://m.airybay.com/profile/' + data.receiverId + '#' + data.postId + '" target="_blank" rel="noopener">Check post</a>\
				</div>\
			</div>\
		</div>\
	</div>\
</div>' + self.htmlFooter);
	},

	getFavoriteMessage: function (data, send) {
		var self = this;
		
		send(self.htmlHeader + '<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
		<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
			<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;float: left;max-width: 320px;min-width: 300px;width: 320px;width: calc(12300px - 2000%);">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="line-height:20px;font-size:1px">&nbsp;</div>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="margin-top: 0;margin-bottom: 10px;font-size: 16px;line-height: 26px;" lang="x-size-18"><span style="color:#333333">Hi, ' + data.receiverName + '!</span></p>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="margin-top: 0;margin-bottom: 20px;font-size: 15px;line-height: 26px;" lang="x-size-18"><span style="color:#333333"><strong>You have been added to favorites by user:</strong></span></p>\
				</div>\
			</div>\
			<div style="text-align: left;color: #8e959c;font-size: 20px;line-height: 21px;font-family: sans-serif;float: left;max-width: 320px;min-width: 300px;width: 320px;width: calc(12300px - 2000%);">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="line-height:20px;font-size:1px">&nbsp;</div>\
				</div>\
				<div style="font-size: 12px;font-style: normal;font-weight: normal;height: 100px;" align="center">\
					<a href="https://m.airybay.com/profile/' + data.senderId + '"><img style="border: 0;display: block;height: auto;width: 100%;max-width: 100px;" alt="" width="120" src="' + data.senderPhoto + '" alt="user photo"></a>\
				</div>\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<p style="font-weight:bold;margin-top: 0;margin-bottom: 0;text-align: center;text-decoration: underline;font-size: 16px;"><a href="https://m.airybay.com/profile/' + data.senderId + '">' + data.senderName + '</a></p>\
				</div>\
			</div>\
		</div>\
	</div>\
	<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
	<div style="line-height:20px;font-size:20px;">&nbsp;</div>\
	<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
		<div style="border-collapse: collapse;display: table;width: 100%;background-color: #fff;">\
			<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);">\
				<div style="margin-left: 20px;margin-right: 20px;">\
					<div style="text-align:center;">\
						<a style="border-radius: 4px;display: inline-block;font-size: 20px;font-weight: bold;line-height: 24px;padding: 12px 24px;text-align: center;text-decoration: none !important;transition: opacity 0.1s ease-in;color: #ffffff !important;background-color: #ea6a6a;font-family: sans-serif;width: 230px;" href="https://m.airybay.com/subscribe" target="_blank" rel="noopener">My fans</a>\
					</div>\
				</div>\
			</div>\
		</div>\
</div>' + self.htmlFooter);
	},
	
	htmlHeader: '<html lang="en">\
<head>\
	<meta charset="UTF-8">\
</head>\
<body>\
<table style="border-collapse: collapse;table-layout: fixed;min-width: 320px;width: 100%;background-color: #fff;" cellpadding="0" cellspacing="0" role="presentation">\
	<tbody>\
		<tr>\
			<td>\
				<div role="section">\
					<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
						<div style="border-collapse: collapse;display: table;width: 100%;">\
							<div style="text-align: left;color: #8e959c;font-size: 14px;line-height: 21px;font-family: sans-serif;max-width: 600px;min-width: 320px;width: 320px;width: calc(28000% - 167400px);">\
								<div style="margin-left: 20px;margin-right: 20px;">\
									<div style="font-size: 12px;font-style: normal;font-weight: normal;margin-bottom: 5px;margin-top: 5px;" align="left">\
										<img style="border: 0;display: block;height: auto;width: 100%;max-width: 200px;" alt="" width="200" src="https://www.airybay.com/img/for_html_email/logo.png" alt="logo">\
									</div>\
									<div align="center">\
										<table cellpadding="0" cellspacing="0" align="center" style="background-color:#e5e5e5;max-width:100%;padding:0px">\
											<tbody>\
												<tr>\
													<td align="center" style="background-color:#e5e5e5;max-width:100%;padding:0px" height="1px" width="720px"></td>\
												</tr>\
											</tbody>\
										</table>\
									</div>\
								</div>\
							</div>\
						</div>\
					</div>',
	
	htmlFooter: '<div style="line-height:10px;font-size:10px;">&nbsp;</div>\
					<div role="contentinfo">\
						<div style="margin: 0 auto;max-width: 600px;min-width: 320px;width: 100%;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;">\
							<div style="border-collapse: collapse;display: table;width: 100%;">\
								<div style="text-align: center;font-size: 12px;line-height: 19px;color: #adb3b9;font-family: sans-serif">\
									<div style="margin-left: 20px;margin-right: 20px;margin-top: 10px;margin-bottom: 10px;">\
										<div style="font-size: 12px;line-height: 19px;">\
											<div>© 2018 All rights reserved <a href="https://www.airybay.com" target="_blank" rel="noopener">www.airybay.com</a></div>\
										</div>\
										<div style="font-size: 12px;line-height: 19px;margin-top: 18px;"></div>\
									</div>\
								</div>\
							</div>\
						</div>\
					</div>\
				</div>\
			</td>\
		</tr>\
	</tbody>\
</table>\
</body>\
</html>'
};