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
    message = JSON.parse(data);
    console.log("chatSubClient channel " + channel + ": " + data);
    if (message['event'] == 'chat') {
      sendChatMessage2Socket(message);
      echoChatMessage2Socket(message);
    }
    else if (message['event'] == 'get_unreceived_messages') {
      emitChatUnreceiveMessages2Socket(message);
    }
});
chatSubClient.subscribe("chat<");

function pubChatMessage2Redis(message) {
  chatPubClient.publish(">chat", JSON.stringify(message));
}

function echoChatMessage2Socket(message) {
  socket = getSocketByUserID(message['sender_id']);
  if (socket != null) {
    socket.emit('chat', JSON.stringify(message));
  }
}

function sendChatMessage2Socket(message) {
  socket = getSocketByUserID(message['receiver_id']);
  if (socket != null) {
    socket.emit('chat', JSON.stringify(message));
    if (message['sub_event'] == 'p2p') {
      message = {
        'event': 'receive_messages',
        'p2p_message_ids': [message['id']]
      };
      pubChatMessage2Redis(message);
    }
    else if (message['sub_event'] == 'p2g') {
      message = {
        'event': 'receive_messages',
        'p2g_message_ids': [message['id']]
      };
      pubChatMessage2Redis(message);
    }
  }
}

function emitChatUnreceiveMessages2Socket(message) {
  socket = getSocketByUserID(message['receiver_id']);
  if (socket != null) {
    socket.emit('chat', JSON.stringify(message));
    var p2p_ids = [];
    var p2g_ids = [];
    for (i in message['p2p_messages']) { 
      m = message['p2p_messages'][i];
      p2p_ids.push(m['id']);
    }
    for (i in message['p2g_messages']) { 
      m = message['p2g_messages'][i];
      p2g_ids.push(m['id']);
    }
    message = {
      'event': 'receive_messages',
      'p2p_message_ids': p2p_ids,
      'p2g_message_ids': p2g_ids
    };
    pubChatMessage2Redis(message);
  }
}

/******************** invitation ********************/

var invSubClient = redis.createClient();
var invPubClient = redis.createClient();

invSubClient.select(2, function() { /* ... */ });
invPubClient.select(2, function() { /* ... */ });

invSubClient.on("subscribe", function (channel, count) { /* ... */ });
invSubClient.on("message", function (channel, data) {
    message = JSON.parse(data);
    console.log("invSubClient channel " + channel + ": " + data);
    if (message['event'] == 'invitation') {
      sendInvMessage2Socket(message);
    }
});
invSubClient.subscribe("invitation<");

function sendInvMessage2Socket(message) {
  socket = getSocketByUserID(message['receiver_id']);
  if (socket != null) {
    socket.emit('invitation', JSON.stringify(message));
  }
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
  socketInfo = socketDicts[socket.id];
  if (socketInfo) {
    delete userSockets[socketInfo['user_id']];
    delete socketDicts[socket.id];
  }
  console.log('all userSockets: ' + JSON.stringify(userSockets));
}

function getSocketBySocketID(socketID) {
  socketInfo = socketDicts[socketID];
  if (socketInfo) {
    return socketInfo['socket'];
  }
  return null;
}

function getSocketByUserID(userID) {
  socketID = userSockets[userID];
  if (socketID) {
    return getSocketBySocketID(socketID);
  }
  return null;
}

function loginSocket(socket, data) {
  socketInfo = socketDicts[socket.id];
  if (!socketInfo) {
    socketDicts[socket.id] = {'socket': socket};
  }
  if (socketInfo) {
    socketInfo['login'] = true;
    socketInfo['user_id'] = data['user_id'];
    userSockets[data['user_id']] = socket.id;
    // 获取未读消息
    getUnreceivedMessages(socket, data['user_id']);
  }
  console.log('all userSockets: ' + JSON.stringify(userSockets));
}

function hasLogined(socket) {
  socketInfo = socketDicts[socket.id];
  if (socketInfo && socketInfo['login']) {
    return true;
  }
  return false;
}

function addChannel2Socket(socket, channel) {
  socketInfo = socketDicts[socket.id];
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
  socketInfo = socketDicts[socket.id];
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
  // TODO: login handlers
  if (data['user_id']) {
    data['login'] = true;
    loginSocket(socket, data);
    socket.emit(channel, JSON.stringify(data));
  }
  else {
    data['login'] = false;
    socket.emit(channel, JSON.stringify(data));
  }
}

function handleChat(socket, channel, data) {
  console.log('[handleChat] socket ' + socket.id + ' on channel ' + 
    channel + ' receive data:' + JSON.stringify(data));
  pubChatMessage2Redis(data);
}

function getUnreceivedMessages(socket, receiver_id) {
  message = {
    'event': 'get_unreceived_messages',
    'receiver_id': receiver_id 
  };
  pubChatMessage2Redis(message);
}

/* setup socketIO */
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  console.log('socket ' + socket.id + ' connected')
  if (addSocket(socket)) {
    socket.on('login', function(data) {
      console.log('socket ' + socket.id + ' login event data:' + data);
      data = JSON.parse(data);  // string to object
      handleLogin(socket, 'login', data);
    });
    socket.on('chat', function(data) {
      console.log('socket ' + socket.id + ' chat event data:' + data);
      if (hasLogined(socket)) {
        data = JSON.parse(data);  // string to object
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

http.listen(3000, function(){
  console.log('listening on *:3000');
});
