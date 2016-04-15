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

var check_format_okay = function(data){
	const USER_ID = 'user_id';
	return data.hasOwnProperty(USER_ID);
};

var login = function(socket, data){
	if(check_format_okay(data)){ 
		redis.pub_login_message_to_server(data);
		SOCKETS.add_socket(data.user_id, socket, logined=false);
	}else{
		socket.send_error_msg(msg='msg unformatted');
	}
};

module.exports = {
	has_login: has_login,
	login: login,
}
