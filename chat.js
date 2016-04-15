/*
 * Manipulates chat.
 *
 * @Author Minchuian Gaon (2016-4-15)
 *
 */

var redis = require('./redis.js');

var chat = function(socket, data){
	redis.pub_chat_message_to_server(data);
}

module.exports = {
	chat: chat,
}
