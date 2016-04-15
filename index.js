/*
 * Main file for handle real time communication.
 *
 * @author: Minchiuan Gao (2016-4-13)
 */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var handle_event = require('./event.js').handle_event;
var socket_table = require('./socket.js');

var configuration = {
	PORT: 9876,
	TAG: 'dev',
	REDIS_DB: 2
}

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	handle_event(socket);
});

http.listen(configuration.PORT, function(){
	console.log('listening on *:' + configuration.PORT);
});
