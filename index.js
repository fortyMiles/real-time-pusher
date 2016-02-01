var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var sockets = {};


function addSocket(socket) {
  if (!sockets[socket.id]) {
    sockets[socket.id] = {};
    return true;
  }
  return false;
}

function loginSocket(socket, data) {
  socketInfo = sockets[socket.id];
  if (!socketInfo) {
    sockets[socket.id] = {};
  }
  if (socketInfo) {
    socketInfo['login'] = 'success';
  }
}

function hasLogined(socket) {
  socketInfo = sockets[socket.id];
  if (socketInfo && socketInfo['login'] == 'success') {
    return true;
  }
  return false;
}

function addChannel2Socket(socket, channel) {
  socketInfo = sockets[socket.id];
  if (!socketInfo) {
    sockets[socket.id] = {};
  }
  if (socketInfo) {
    if (!socketInfo['channels']) {
      socketInfo['channels'] = [];
    }
    socketInfo['channels'].push(channel);
  }
  console.log('all sockets: ' + JSON.stringify(sockets));
}

function hasChannel(socket, channel) {
  socketInfo = sockets[socket.id];
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
  // TODO:
  data['login'] = 'success';
  loginSocket(socket);
  socket.emit(channel, JSON.stringify(data));
  if (data['login'] == 'success') {
    listenOnP2P(socket, channel)
  }
}

function handleP2P(socket, channel, data) {
  console.log('[handleP2P] socket ' + socket.id + ' on channel ' + 
    channel + ' receive data:' + JSON.stringify(data));
  // TODO:
  io.emit(channel, 'echo ' + JSON.stringify(data));
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

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
  if (addSocket(socket)) {
    socket.on('unite', function(data) {
      data = JSON.parse(data);
      console.log('socket ' + socket.id + ' data:' + JSON.stringify(data));
      if (data.event == 'login') {
        handleLogin(socket, 'unite', data);
      }
      else if (hasLogined(socket)) {
        if (data.event == 'p2p') {
          handleP2P(socket, 'unite', data);
        }
      }
      else {
        socket.emit('unite', 'Login first');
      }
    });
    addChannel2Socket(socket, 'unite');
  }
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
