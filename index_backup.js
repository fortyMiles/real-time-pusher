var PORT = 9876;
var TAG = 'dev';
var REDIS_DB = 2;

var Message = require('./message.js').Message;

process.argv.forEach(function (val, index, array) {
	if (index == 2) {
		PORT = val;
	}
	else if (index == 3) {
		TAG = val;
	}
	else if (index == 4) {
		REDIS_DB = val;
	}
});
console.log('PORT: ' + PORT);
console.log('TAG: ' + TAG);


/*********************
 * utility functions 
 *********************/
function json2object(data) {
	if (typeof data === 'string' || data instanceof String) {
		data = JSON.parse(data);  // string to object
	}
	return data;
}


/*********************
 * redis pubsub handlers 
 *********************/
var redis = require("redis");
var chatSubClient = redis.createClient();
var chatPubClient = redis.createClient();
chatSubClient.select(REDIS_DB, function() { /* ... */ });
chatPubClient.select(REDIS_DB, function() { /* ... */ });
chatSubClient.on("subscribe", function (channel, count) { /* ... */ });
chatSubClient.on("message", function (channel, data) {
	var message = json2object(data);
	console.log("chatSubClient channel " + channel + ": " + JSON.stringify(data));
	if (message['event'] == 'chat') {
		sendChatMessage2Client(message);  // 发送消息给receiver
		echoChatMessage2Client(message);  // 回复sender消息已接收到
	}
	else if (message['event'] == 'get_unreceived_messages') {
		sendChatUnreceiveMessages2Client(message);
	}
});
chatSubClient.subscribe(TAG + ":chat->");
function pubChatMessage2Server(message) {
	chatPubClient.publish(TAG + ":->chat", JSON.stringify(message));
}
function echoChatMessage2Client(message) {
	var socket = getSocketByUserID(message['sender_id']);
	if (socket != null) {
		socket.emit('chat', JSON.stringify(message));
	}
}
function sendChatMessage2Client(message) {
	var socket = getSocketByUserID(message['receiver_id']);
	if (socket != null) {
		socket.emit('chat', JSON.stringify(message));
		if (message['sub_event'] == 'p2p') {
			var newMessage = {
				'event': 'receive_messages',
				'p2p_message_ids': [message['id']]
			};
			pubChatMessage2Server(newMessage);
		}
		else if (message['sub_event'] == 'p2g') {
			var newMessage = {
				'event': 'receive_messages',
				'p2g_message_ids': [message['id']]
			};
			pubChatMessage2Server(newMessage);
		}
	}
}
function sendChatUnreceiveMessages2Client(message) {
	var socket = getSocketByUserID(message['receiver_id']);
	if (socket != null) {
		socket.emit('chat', JSON.stringify(message));
		var p2p_ids = [];
		var p2g_ids = [];
		for (i in message['p2p_messages']) { 
			var m = message['p2p_messages'][i];
			p2p_ids.push(m['id']);
		}
		for (i in message['p2g_messages']) { 
			var m = message['p2g_messages'][i];
			p2g_ids.push(m['id']);
		}
		var newMessage = {
			'event': 'receive_messages',
			'p2p_message_ids': p2p_ids,
			'p2g_message_ids': p2g_ids
		};
		pubChatMessage2Server(newMessage);
	}
}


/************* Refactoring of Send Message By Different Events *************/

/*
 * Test if this message is should be sent.
 *
 * Returns {Boolean} if message if valid.
 *
 */
var valid_message = function(message, receiver_id){
	const UUID_LEN = 32;
	var valid = false;
	if(receiver_id.length == UUID_LEN){
		valid = true;
	}

	return valid;
}

/*
 * Saves this message to first class cache -> memory dict.
 */

var MESSAGES_DICT = {};
var _save_message_to_memory = function(message_id, message, receiver_id){
	var message = new Message(message_id, message, receiver_id);
	MESSAGES_DICT[message_id] = message;
	debugger;
}

var check_message_if_need_save_to_redis = function(messages){
	for(var key in messages){
		var current_messsage = messages[key];
		const DELTA_TIME = 10;
		if((Date.now() - current_messsage.createdDate > DELTA_TIME) || 
		   current_messsage.read){
			if(!current_messsage.read){
				_save_message_to_redis(current_messsage.receiver_id, current_messsage.id);
			}
			delete messages[key];
		}
	}
}


var _save_message_to_redis = function(receiver_id, message_id){
	console.log('save into redis, receiver_id is :' + receiver_id);
	console.log('save into redis, message_id is :' + message_id);
}

/*
 * Send Message to client socket by receiver id.
 * If message is valid, send to receiver, or ignore it.
 * After each message being sent to receiver, save it to memory dict.
 */

var _send_event_message_to_client = function(event, message, receiver_id, retry_time){
	retry_time = retry_time || 10;

	if(retry_time>0){
		if(valid_message(message, receiver_id)){
			var socket = getSocketByUserID(receiver_id);
			_save_message_to_memory(message.uid, message, receiver_id);
			if(socket != null && hasLogined(socket)){
				socket.emit(event, JSON.stringify(message));
			}else{
				// retry to send this message in N time.
				_send_event_to_client(event, message, receiver_id, retry_time);
			}
		}
	}else{
		return;
	}
}

function _send_event_to_client(message){
	return function(event){
		if(message.event == event){
			console.log(event + " message: " + JSON.stringify(message));
			_send_event_message_to_client(event, message, message.receiver_id);
		}
	}
}

var EVENT_LIST = ['invitation', 'book', 'moment'];

var eventSubClient = redis.createClient();
var eventPubClient = redis.createClient();

eventSubClient.select(REDIS_DB, function() { /* ... */ });
eventSubClient.select(REDIS_DB, function() { /* ... */ });

eventSubClient.on("subscribe", function (channel, count) { /* ... */ });
eventSubClient.on("message", function (channel, data) {
	var message = json2object(data);
	EVENT_LIST.map(_send_event_to_client(message));
});

EVENT_LIST.map(event => eventSubClient.subscribe(TAG + ':' + event + "->"));

setInterval(function(){
	check_message_if_need_save_to_redis(MESSAGES_DICT)
}, 100);

/******************** login ********************/
var loginSubClient = redis.createClient();
var loginPubClient = redis.createClient();
loginSubClient.select(REDIS_DB, function() { /* ... */ });
loginPubClient.select(REDIS_DB, function() { /* ... */ });
loginSubClient.on("subscribe", function (channel, count) { /* ... */ });
loginSubClient.on("message", function (channel, data) {
	var message = json2object(data);
	console.log("loginSubClient channel " + channel + ": " + data);
	if (message['event'] == 'login' && message['login']) {
		var socket = popStashSocketByUserID(message['receiver_id']);
		loginSocket(socket, message['receiver_id']);
		sendLoginMessage2Client(message);
	}
	else {
		sendLoginMessage2Client(message);
	}
});
loginSubClient.subscribe(TAG + ":login->");
function sendLoginMessage2Client(message) {
	var socket = getSocketByUserID(message['receiver_id']);
	if (socket != null) {
		socket.emit('login', JSON.stringify(message));
	}
}
function pubLoginMessage2Server(message) {
	loginPubClient.publish(TAG + ":->login", JSON.stringify(message));
}
/*********************
 * socketIO handlers 
 *********************/
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socketDicts = {};  // 通过socket.id来索引socket信息
var userSockets = {};  // 通过user_id来索引socket.id
var userStashSockets = {};
function addSocket(socket) {
	debugger;
	if (!socketDicts[socket.id]) {
		socketDicts[socket.id] = {'socket': socket};
		return true;
	}
	return false;
}
function delSocket(socket) {
	var socketInfo = socketDicts[socket.id];
	if (socketInfo) {
		delete userSockets[socketInfo['user_id']];
		delete socketDicts[socket.id];
	}
	console.log('all userSockets: ' + JSON.stringify(userSockets));
}
function delStashSocket(socket) {
	var socketInfo = socketDicts[socket.id];
	if (socketInfo) {
		delete userStashSockets[socketInfo['user_id']];
		delete socketDicts[socket.id];
	}
	console.log('all userStashSockets: ' + JSON.stringify(userSockets));
}
// function clearSocket(socket) {
//   var socketInfo = socketDicts[socket.id];
//   if (socketInfo) {
//     delete userSockets[socketInfo['user_id']];
//   }
//   socketDicts[socket.id] = {'socket': socket};
//   console.log('all userSockets: ' + JSON.stringify(userSockets));
// }
function getSocketBySocketID(socketID) {
	var socketInfo = socketDicts[socketID];
	if (socketInfo) {
		return socketInfo['socket'];
	}
	return null;
}
function getSocketByUserID(userID) {
	var socketID = userSockets[userID];
	if (socketID) {
		return getSocketBySocketID(socketID);
	}
	return null;
}
function getStashSocketByUserID(userID) {
	var socketID = userStashSockets[userID];
	if (socketID) {
		return getSocketBySocketID(socketID);
	}
	return null;
}
function popStashSocketByUserID(userID) {
	var socketID = userStashSockets[userID];
	if (socketID) {
		delete userStashSockets[userID];
		return getSocketBySocketID(socketID);
	}
	return null;
}
function stashUserSocket(socket, userID) {
	var oldSocket = getStashSocketByUserID(userID);
	if (oldSocket && oldSocket != socket) {
		delStashSocket(oldSocket);
	}
	userStashSockets[userID] = socket.id;
	socketDicts[socket.id] = {'socket': socket};
}
function loginSocket(socket, userID) {
	if (!socket)
		return;
	var oldSocket = getSocketByUserID(userID);
	if (oldSocket && oldSocket != socket) {
		// 使其他socket退出登录
		console.log('delete old socket ' + oldSocket.id + ' of user ' + userID);
		oldSocket.emit('login', JSON.stringify({'event':'login', 'login':false, 'receiver_id':userID}));
		delSocket(oldSocket);
	}
	userSockets[userID] = socket.id;
	var socketInfo = socketDicts[socket.id];
	if (!socketInfo) {
		socketDicts[socket.id] = {'socket': socket, 'login': true, 'user_id': userID};
	}
	if (socketInfo) {
		socketInfo['login'] = true;
		socketInfo['user_id'] = userID;
		// 获取未读消息
		// getUnreceivedMessages(socket, userID);
	}
	console.log('all userSockets: ' + JSON.stringify(userSockets));
}
function hasLogined(socket) {
	var socketInfo = socketDicts[socket.id];
	if (socketInfo && socketInfo['login']) {
		return true;
	}
	return false;
}
function addChannel2Socket(socket, channel) {
	var socketInfo = socketDicts[socket.id];
	if (!socketInfo) {
		socketDicts[socket.id] = {'socket': socket};
	}
	if (socketInfo) {
		if (!socketInfo['channels']) {
			socketInfo['channels'] = [];
		}
		socketInfo['channels'].push(channel);
	}
}
function hasChannel(socket, channel) {
	var socketInfo = socketDicts[socket.id];
	if (socketInfo) {
		if (socketInfo['channels'] && socketInfo['channels'].indexOf(channel) != -1) {
			return true;
		}
	}
	return false;
}
function handleLogin(socket, channel, data) {
	console.log('[handleLogin] socket ' + socket.id + ' on channel ' + 
				channel + ' receive data:' + JSON.stringify(data));
				if (data['user_id']) {
					stashUserSocket(socket, data['user_id']);
					pubLoginMessage2Server(data);
				}
				else {
					data['login'] = false;
					socket.emit(channel, JSON.stringify(data));
				}
}
function handleChat(socket, channel, data) {
	console.log('[handleChat] socket ' + socket.id + ' on channel ' + 
				channel + ' receive data:' + JSON.stringify(data));
				pubChatMessage2Server(data);
}
function getUnreceivedMessages(socket, receiver_id) {
	var message = {
		'event': 'get_unreceived_messages',
		'receiver_id': receiver_id 
	};
	pubChatMessage2Server(message);
}
/********** setup socketIO **********/
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});
io.on('connection', function(socket) {
	console.log('socket ' + socket.id + ' connected')
	if (addSocket(socket)) {
		socket.on('login', function(data) {
			data = json2object(data);  // string to object
			console.log('socket ' + socket.id + ' login event data:' + JSON.stringify(data));
			handleLogin(socket, 'login', data);
		});
		socket.on('chat', function(data) {
			console.log('socket ' + socket.id + ' chat event data:' + JSON.stringify(data));
			if (hasLogined(socket)) {
				data = json2object(data);  // string to object
				handleChat(socket, 'chat', data);
			}
			else {
				socket.emit('login', 'Login first');
			}
		});
		addChannel2Socket(socket, 'login');
		addChannel2Socket(socket, 'chat');
		/* handler disconnection */
		socket.on('disconnect', function() {
			console.log('socket ' + socket.id + ' disconnected');
			delSocket(socket);
		});
	}
});
http.listen(PORT, function(){
	console.log('listening on *:' + PORT);
});


