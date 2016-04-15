/*;
 * Let socket do jobs.
 *
 *
 */


var offline = require('./offline.js');

var Socket = function(socket){
	this.socket = socket;
	this.login = false;
};

Socket.prototype.send_error_msg = function(msg){
	this.emit('err', {message: msg});
};

Socket.prototype.emit = function(event, message){
	if(this.connected() && this.login ){
		this.socket.emit(event, JSON.stringify(message));
		return true;
	}else{
		offline.add_an_offline_msg(
			id=message.uid,
			content=message,
			receiver_id=message.receiver_id,
			event=event
		);
		return false;
	}
};

Socket.prototype.connected = function(){
	return this.socket.connected;
};

Socket.prototype.set_login = function(){
    this.login = true;
};

Socket.prototype.set_logout = function(){
	this.login = false;
};

var sockets = {}; // static var shared with all LoginSocketTable instances.

var add_socket = function(receiver_id, socket){
	sockets[receiver_id] = {};
	sockets[receiver_id] = socket;
};

var get_socket = function(receiver_id){
    return sockets[receiver_id];
};

var del_socket = function(receiver_id){
	delete sockets[receiver_id];
};

var set_socket_offline = function(receiver_id){
	sockets[receiver_id].set_logout();
	//del_socket(receiver_id);
};

var set_socket_online = function(receiver_id){
	if(sockets.hasOwnProperty(receiver_id)){
		sockets[receiver_id].set_login();
	}else{
		throw "No this socket";
	}
};

var send_message_to_socket = function(receiver_id, event, message){
	var client_socket = get_socket(receiver_id);
	if(client_socket){ // if sockt in register table.
		client_socket.emit(event, message);
	}else{ // not in, save message into offline.
		console.log('this socket is not registered in system: ' + receiver_id);
		offline.add_an_offline_msg(message.uid, message, message.receiver_id, event);
	}
};

const LOGIN = 'login';

var login_socket = function(message){
    if(message[LOGIN]){
	    set_socket_online(message.receiver_id);
		return true;
	}else{
		return false;
	}
};


var echo_login = function(receiver_id, event, message, send_func){
	if(login_socket(message)){
		send_func(receiver_id, event, message);
		offline.send_offline_message(receiver_id, send_func);
	}else{
       send_error_message_socket(
		   receiver_id,
		   message='login faild, please check your token.');

	   del_socket(message.receiver_id);
	}
};

var send_error_message_socket = function(receiver_id, msg){
    get_socket(receiver_id).send_error_msg(msg);
};

var send_message = function(message, event){
    var check_event_is_valid = require('./event.js').check_event_is_valid;
	if(event==LOGIN){
		echo_login(message.receiver_id, message.event, message, send_message_to_socket);
	}else{
		if(check_event_is_valid(message.event)){
			send_message_to_socket(message.receiver_id, message.event, message);
		}else{
			console.log('event is invalid');
		}
	}
};

module.exports = {
	Socket: Socket,
	send_message: send_message,
	add_socket: add_socket,
};
