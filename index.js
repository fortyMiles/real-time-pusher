/*********************
* redis pubsub handlers 
*********************/

var redis = require("redis");
var subClient = redis.createClient();
var pubClient = redis.createClient();

subClient.select(2, function() { /* ... */ });
pubClient.select(2, function() { /* ... */ });

subClient.on("subscribe", function (channel, count) { /* ... */ });
subClient.on("message", function (channel, data) {
    message = JSON.parse(data);
    console.log("subClient channel " + channel + ": " + data);
    if (message['event'] == 'p2p') {
      emitP2PMessage2Socket(message);
      echoP2PMessage2Socket(message);
    }
    else if (message['event'] == 'get_unreceived_messages') {
      emitP2PUnreceiveMessages2Socket(message);
    }
});
subClient.subscribe("p2p<");

function pushP2PMessage2Redis(message) {
  pubClient.publish(">p2p", JSON.stringify(message));
}

function echoP2PMessage2Socket(message) {
  socket = getSocketByUserID(message['sender_id']);
  if (socket != null) {
    socket.emit('p2p', JSON.stringify(message));
  }
}

function emitP2PMessage2Socket(message) {
  socket = getSocketByUserID(message['receiver_id']);
  if (socket != null) {
    socket.emit('p2p', JSON.stringify(message));
    message = {
      'event': 'receive_messages',
      'message_ids': [message['id']]
    };
    pushP2PMessage2Redis(message);
  }
}

function emitP2PUnreceiveMessages2Socket(message) {
  socket = getSocketByUserID(message['receiver_id']);
  if (socket != null) {
    socket.emit('p2p', JSON.stringify(message));
    var ids = [];
    for (i in message['messages']) { 
      m = message['messages'][i];
      ids.push(m['id']);
    }
    message = {
      'event': 'receive_messages',
      'message_ids': ids
    };
    pushP2PMessage2Redis(message);
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
    listenOnP2P(socket, channel)
  }
  else {
    data['login'] = false;
    socket.emit(channel, JSON.stringify(data));
  }
}

function handleP2P(socket, channel, data) {
  console.log('[handleP2P] socket ' + socket.id + ' on channel ' + 
    channel + ' receive data:' + JSON.stringify(data));
  pushP2PMessage2Redis(data);
}

function listenOnP2P(socket, channel) {
  if (!hasChannel(socket, channel)) {
    console.log('[handleLogin] socket ' + socket.id + ' listen on channel ' + channel);
    socket.on(channel, function(data) {
      data = JSON.parse(data);
      handleP2P(socket, channel, data);
    });
  }
}

function getUnreceivedMessages(socket, receiver_id) {
  message = {
    'event': 'get_unreceived_messages',
    'receiver_id': receiver_id 
  };
  pushP2PMessage2Redis(message);
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
    socket.on('p2p', function(data) {
      console.log('socket ' + socket.id + ' p2p event data:' + data);
      if (hasLogined(socket)) {
        data = JSON.parse(data);  // string to object
        handleP2P(socket, 'p2p', data);
      }
      else {
        socket.emit('login', 'Login first');
      }
    });
    addChannel2Socket(socket, 'login');
    addChannel2Socket(socket, 'p2p');
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
