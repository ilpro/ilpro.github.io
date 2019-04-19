var notificationsSvg = {
    PostLike: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="23" viewBox="0 0 14 13" class="message-type">\
	<path fill="#ccc" d="M14 4c-.2-2.4-1.8-4-3.8-4C9 0 7.6.7 7 2 6.3.6 5 0 3.8 0 1.8 0 .2 1.6 0 4v1.3c.4 1.3 1 2.4 2 3.3L7 13l5-4.4c1-1 1.6-2 2-3.3V4zm0 0"></path>\
</svg>', 
    Present: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="23" viewBox="0 0 20 23" class="message-type">\
	<g fill="#ccc">\
		<path d="M6.54 16.9l-.92-1.45-1.9.26 2.46-4.47H1.33V23H9.7V11.4l-3.15 5.5zM19.98 5.63h-5.45c.5\
		0 1-.47 1.34-.78.4-.36.73-.8.88-1.3.2-.7.14-1.57-.24-2.2C16 .5 15.18.03 14.2.03c-.76\
		0-1.45.26-2.05.66-.9.6-2.14 3-2.16 3.03-.2-.38-.4-1.15-.65-1.5-.42-.6-.93-1.13-1.52-1.53C7.23.3\
		6.53.04 5.8.04c-.75 0-1.43.32-1.94.8-.72.68-1.08 2.13-.72 3.05.3.72.98 1.73 1.87\
		1.73H0v5.04h9.15V5.63h1.68v5.04h9.16l-.02-5.04zM5.34 4.45c-.6-.38-1.15-1.1-.9-1.83.22-.67.92-1.03\
		1.6-.94.45.06.94.23 1.28.54.38.35.67.83.93 1.28.14.26.28.52.4.8.22.4.4.8.5\
		1.24-1.9-.2-3.1-.65-3.82-1.1zM11.7 3.4c.23-.4.5-.76.83-1.05.43-.4 1-.64 1.6-.63 1.06.02 1.76 1\
		1.07 1.9-.73 1-2.1 1.43-3.22 1.73-.12.03-1.15.2-1.17.27.18-.73.47-1.53.9-2.23zM16.3\
		15.7l-1.9-.3-.97 1.5-3.16-5.43V23h8.37V11.22h-4.82l2.47 4.46z"></path>\
	</g>\
</svg>', 
	UserFavorite: '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="20" viewBox="0 0 17 20" class="message-type">\
    <g fill="#ccc">\
          <path d="M3.67 1.27c.3-.3.3-.76 0-1.05-.3-.3-.76-.3-1.05 0-3.25 3.24-3.25 8.52 0 11.76.14.15.33.22.52.22.2 \
    0 .4-.07.53-.22.3-.3.3-.76 0-1.05-2.66-2.66-2.66-7 0-9.66zm0 0M14.38.22c-.3-.3-.76-.3-1.05 0-.3.3-.3.76 0 \
    1.05 1.3 1.3 2 3 2 4.83 0 1.82-.7 3.54-2 4.83-.3.3-.3.76 0 1.05.14.15.33.22.52.22.2 0 .4-.07.53-.22 \
    1.57-1.57 2.44-3.66 2.44-5.88s-.87-4.3-2.44-5.88zm0 0"></path> \
    <path d="M4.62 9.97c.15.15.34.22.53.22.2 0 .38-.08.53-.22.3-.3.3-.77 0-1.06-1.56-1.55-1.56-4.08 0-5.64.3-.3.3-.76 \
    0-1.05-.3-.3-.77-.3-1.06 0-2.13 2.13-2.13 5.6 0 7.74zm0 0M11.32 9.97c.14.15.33.22.52.22.2 0 .4-.08.53-.22 \
    1.04-1.04 1.6-2.42 1.6-3.88s-.56-2.84-1.6-3.87c-.3-.3-.76-.3-1.05 0-.3.3-.3.76 0 1.05.75.75 1.17 1.76 1.17 \
    2.82s-.43 2.07-1.18 2.82c-.3.3-.3.76 0 1.05zm0 0M8.5 8c1.04 0 1.9-.85 1.9-1.9 0-1.04-.86-1.9-1.9-1.9s-1.9.85-1.9 1.9c0 \
    1.05.85 1.9 1.9 1.9zm0 0M9.2 9.05c-.1-.3-.38-.52-.7-.52-.32 0-.6.2-.7.52l-3.24 9.97c-.13.4.08.82.48.94.07.03.15.04.23.04.3 \
    0 .6-.2.7-.52l.4-1.2h4.26l.4 1.2c.12.4.54.6.93.48.4-.12.6-.54.48-.94L9.2 9.05zm-.7 2.64l.62 \
    1.92H7.87l.63-1.92zm-1.65 5.08l.54-1.67h2.2l.54 1.68h-3.3zm0 0"></path> \
    </g> \
</svg>'}

setTimeout(function(){
	$('.notifications-ribbon .message-row.unreaded').removeClass("unreaded");
}, 5000);

$(".page-notifications").on("click", ".clear-all", function(){
	$(".notifications-ribbon .message-row.unreaded").removeClass("unreaded");
	dataSocket.emit('readAllNotifications',JSON.stringify({hash: userHash}));
});

dataSocket.on('newNotification', function(data) {
	data = JSON.parse(data);
	
	var html = '<div class="message-row unreaded">\
	<figure class="user-avatar" title="">\
		<img src="' + data.userPhoto + '" alt="user" class="" style="max-width: 100%;">\
	</figure>\
	<div class="message-text-controls-wrap">\
		<div class="message-text">' + data.notificationText + '</div>\
	</div>\
	' + notificationsSvg[data.notificationType] + '\
</div>';
	$(".notifications-ribbon").prepend(html);
});