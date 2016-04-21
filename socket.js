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
		if (event != 'login') {
			offline.add_an_offline_message(
				receiver_id=message.receiver_id,
				content=message
			);
			log.save(log.ACTION.SAVE, this.socket2str(), JSON.stringify(message));
		}
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
var stash_sockets = {};

function get_receiver_socket_dict(the_sockets) {
	var desc = {};
	for (var receiver_id in the_sockets) {
		desc[receiver_id] = the_sockets[receiver_id].socket.id;
	}
    return desc;
}

var get_sockets_desc = function() {
	return get_receiver_socket_dict(sockets);
};

var get_stash_sockets_desc = function() {
	return get_receiver_socket_dict(stash_sockets);
};

var add_stash_socket = function(receiver_id, socket) {
	stash_sockets[receiver_id] = socket;
};

var add_socket = function(receiver_id, socket){
	sockets[receiver_id] = socket;
};

var get_stash_socket = function(receiver_id) {
	return stash_sockets[receiver_id];
};

var get_socket = function(receiver_id){
    return sockets[receiver_id];
};

var del_stash_socket_by_receiver_id = function(receiver_id){
	delete stash_sockets[receiver_id];
};

var del_socket_by_receiver_id = function(receiver_id){
	delete sockets[receiver_id];
};

var del_stash_socket = function(socket, data) {
	for (var i in stash_sockets) {
		if (stash_sockets.hasOwnProperty(i) && stash_sockets[i].socket == socket) {
			log.save("delete_stash_socket", socket.socket2str());
			delete stash_sockets[i];
			break;
		}
	}
};

var del_socket = function(socket, data) {
	for (var i in sockets) {
		if (sockets.hasOwnProperty(i) && sockets[i].socket == socket) {
			log.save("delete_socket", socket.socket2str());
			delete sockets[i];
			break;
		}
	}
};

var set_socket_offline = function(receiver_id){
	sockets[receiver_id].set_logout();
	del_socket_by_receiver_id(receiver_id);
};

const LOGOUT_MESSAGE = {
	"event": "login",
	"login": false,
	"message" :"logout because another device has logined"
};

var set_socket_online = function(receiver_id){
	// delete socket from stash_sockets and add it to sockets, 
	// if sockets has another socket for the same receiver_id, logout it
	var socket = get_stash_socket(receiver_id);
	if (socket) {
		del_stash_socket_by_receiver_id(receiver_id);
		var old_socket = get_socket(receiver_id);
		if(old_socket && old_socket != socket){
			old_socket.emit("login", LOGOUT_MESSAGE);
			del_socket_by_receiver_id(receiver_id);
		}
		socket.set_login();
		add_socket(socket);
		return true;
	}
	return false;
};

var send_message_to_socket = function(receiver_id, event, message){
	var client_socket = get_socket(receiver_id);
	if(client_socket){ // if socket in register table.
		client_socket.emit(event, message);
	}else{ // not in, save message into offline.
		if (event != 'login') {
			offline.add_an_offline_message(
				receiver_id=message.receiver_id,
				content=message
			);
			log.save(log.ACTION.WITHOUT, receiver_id, message);
		}
	}
};

const LOGIN = 'login';

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
	    del_stash_socket_by_receiver_id(message.receiver_id);
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
	add_stash_socket: add_stash_socket,
	del_socket: del_socket,
	get_sockets_desc: get_sockets_desc,
	get_stash_sockets_desc: get_stash_sockets_desc
};
