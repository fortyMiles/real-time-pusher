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
var conf = require('./configuration.js');

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('connected new socket : ' + socket.id);
	handle_event(socket);
});

http.listen(conf.env.PORT, function(){
	console.log('listening on *:' + conf.env.PORT);
});
