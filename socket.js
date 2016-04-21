/*;
 * Let socket do jobs.
 *
 *
 */


var offline = require('./offline.js');
var log = require('./log.js');

const ERROR_EVENT = 'error';

var Socket = function(socket){
	this.socket = socket;
	this.login = false;
};

Socket.prototype.socket2str = function() {
	return 'socket(' + this.socket.id + ')';
};

Socket.prototype.send_error_message = function(message){
	this.emit(ERROR_EVENT, message);
};

Socket.prototype.emit = function(event, message){
	if(!message){
		throw 'message is empty';
	}

	if(this.connected()){
		this.socket.emit(event, JSON.stringify(message));
		// remove this message from offline, if it in.
		offline.delete_offline_message(message.receiver_id, message.mid);
		log.save(log.ACTION.SEND, this.socket2str(), JSON.stringify(message));
		return true;
	}else{
		offline.add_an_offline_message(
			receiver_id=message.receiver_id,
			content=message
		);
		log.save(log.ACTION.SAVE, this.socket2str(), JSON.stringify(message));
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
	// sockets[receiver_id] = {};
	sockets[receiver_id] = socket;
};

var get_socket = function(receiver_id){
    return sockets[receiver_id];
};

var del_socket_by_receiver_id = function(receiver_id){
	delete sockets[receiver_id];
};

var del_socket = function(socket, data) {
	for (var i in sockets) {
		if (sockets.hasOwnProperty(i) && sockets[i].socket == socket) {
			delete sockets[i];
			break;
		}
	}
}

var set_socket_offline = function(receiver_id){
	sockets[receiver_id].set_logout();
	//del_socket_by_receiver_id(receiver_id);
};

var set_socket_online = function(receiver_id){
	if(sockets.hasOwnProperty(receiver_id)){
		sockets[receiver_id].set_login();
		return true;
	}else{
		// throw "No this socket";
		return false;
	}
};

var send_message_to_socket = function(receiver_id, event, message){
	var client_socket = get_socket(receiver_id);
	if(client_socket){ // if socket in register table.
		client_socket.emit(event, message);
	}else{ // not in, save message into offline.
		log.save(log.ACTION.WITHOUT, receiver_id, message);
		offline.add_an_offline_message(
			receiver_id=message.receiver_id,
			content=message
		);
	}
};

const LOGIN = 'login';
const LOGIN_ERROR_MESSAGE = {
	"event": "login",
	"login": false,
	"message": "login fail, please check your token."
};

var login_socket = function(message){
    if(message[LOGIN]){
	    return set_socket_online(message.receiver_id);
	}else{
		return false;
	}
};


var echo_login = function(receiver_id, event, message){
	send_message_to_socket(receiver_id, event, message);
	if(login_socket(message)){
		offline.send_offline_message(receiver_id, send_message_to_socket);
	}else{
	    del_socket_by_receiver_id(message.receiver_id);
	}
};


var send_message = function(message, event){
	var is_valid_event = require('./event.js').is_valid_event;
	if(event == LOGIN){
		echo_login(message.receiver_id, message.event, message);
	}else if(is_valid_event(event)){
		send_message_to_socket(message.receiver_id, event, message);
	}else{
		log.save(log.ACTION.ERROR, 'event is invalid', message);
	}
};

module.exports = {
	Socket: Socket,
	send_message: send_message,
	add_socket: add_socket,
	del_socket: del_socket
};
