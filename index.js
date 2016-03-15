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
chatSubClient.select(2, function() { /* ... */ });
chatPubClient.select(2, function() { /* ... */ });
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
chatSubClient.subscribe("chat->");
function pubChatMessage2Server(message) {
  chatPubClient.publish("->chat", JSON.stringify(message));
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


var _send_event_message_to_client = function(event, message, receiver_id){
  var socket = getSocketByUserID(receiver_id);
  if(socket != null && hasLogined(socket)){
    socket.emit(event, JSON.stringify(message));
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

eventSubClient.select(2, function() { /* ... */ });
eventSubClient.select(2, function() { /* ... */ });

eventSubClient.on("subscribe", function (channel, count) { /* ... */ });
eventSubClient.on("message", function (channel, data) {
    var message = json2object(data);
    EVENT_LIST.map(_send_event_to_client(message));
});

EVENT_LIST.map(event => eventSubClient.subscribe(event + "->"));


/******************** login ********************/
var loginSubClient = redis.createClient();
var loginPubClient = redis.createClient();
loginSubClient.select(2, function() { /* ... */ });
loginPubClient.select(2, function() { /* ... */ });
loginSubClient.on("subscribe", function (channel, count) { /* ... */ });
loginSubClient.on("message", function (channel, data) {
    var message = json2object(data);
    console.log("loginSubClient channel " + channel + ": " + data);
    if (message['event'] == 'login' && message['login']) {
      var socket = getSocketByUserID(message['receiver_id']);
      loginSocket(socket, message['receiver_id']);
      sendLoginMessage2Client(message);
    }
    else {
      sendLoginMessage2Client(message);
    }
});
loginSubClient.subscribe("login->");
function sendLoginMessage2Client(message) {
  var socket = getSocketByUserID(message['receiver_id']);
  if (socket != null) {
    socket.emit('login', JSON.stringify(message));
  }
}
function pubLoginMessage2Server(message) {
  loginPubClient.publish("->login", JSON.stringify(message));
}
/*********************
* socketIO handlers 
*********************/
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socketDicts = {};  // 通过socket.id来索引socket信息
var userSockets = {};  // 通过user_id来索引socket.id
function addSocket(socket) {
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
function clearSocket(socket) {
  var socketInfo = socketDicts[socket.id];
  if (socketInfo) {
    delete userSockets[socketInfo['user_id']];
  }
  socketDicts[socket.id] = {'socket': socket};
  console.log('all userSockets: ' + JSON.stringify(userSockets));
}
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
function trackUserSocket(socket, userID) {
  var oldSocket = getSocketByUserID(userID);
  if (oldSocket && oldSocket != socket) {
    delSocket(oldSocket);
  }
  userSockets[userID] = socket.id;
}
function loginSocket(socket, userID) {
  if (!socket)
    return;
  var socketInfo = socketDicts[socket.id];
  if (!socketInfo) {
    socketDicts[socket.id] = {'socket': socket};
  }
  if (socketInfo) {
    socketInfo['login'] = true;
    socketInfo['user_id'] = userID;
    // 获取未读消息
    getUnreceivedMessages(socket, userID);
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
  clearSocket(socket);
  if (data['user_id']) {
    trackUserSocket(socket, data['user_id']);
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
http.listen(9876, function(){
  console.log('listening on *:9876');
});
