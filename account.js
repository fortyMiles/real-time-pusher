/*
 * Manipulate account for a socket.
 *
 * + Test if is logined.
 * + Login a socket.
 *
 * @Author Minchiuan Gao (2016-4-14)
 */

var redis = require('./redis.js');
var SOCKETS = require('./socket.js');

var has_login = function(socket){
	return true;
}

const LOGIN_FORMAT_ERROR_MESSAGE = {"event": "login", "login": false, "message": "wrong format"}
const USER_ID = 'user_id';

var check_format_okay = function(data){
	return data.hasOwnProperty(USER_ID);
};

var login = function(socket, data){
	if(check_format_okay(data)){ 
		redis.pub_login_message_to_server(data);
		SOCKETS.add_stash_socket(data.user_id, socket);
	}else{
		socket.send_error_message(message=LOGIN_FORMAT_ERROR_MESSAGE);
	}
};

module.exports = {
	has_login: has_login,
	login: login,
}
