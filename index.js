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
var log = require('./log.js');

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
 	log.save(log.ACTION.NEW_CONNECT, actor=socket.id);
  log.save("current_sockets", "list", socket_table.get_sockets_desc());
  log.save("current_stash_sockets", "list", socket_table.get_stash_sockets_desc());
 	handle_event(socket);
});

http.listen(conf.env.PORT, function(){
 	log.save(log.ACTION.START_ON, message=conf.env.PORT);
});
