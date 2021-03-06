/*
 * Manipulates different events, and how to process
 * different events.
 *
 * @Author Minchiuan Gao (2016-4-14)
 *
 */

var account = require('./account.js');
var Socket = require('./socket.js').Socket;
var del_socket = require('./socket.js').del_socket;
var utility = require('./utility.js');
var chat = require('./chat.js');
var _ = require('ramda');
var log = require('./log.js');

/*********** Event Configration **************/

const LOGIN = 'login';
const CHAT = 'chat';
const DISCONNECT = 'disconnect';

const CLIENT_EVENTS_FUNC = [ // client send to server, the func to process.
	[LOGIN, account.login], 
	[CHAT, chat.chat],
	[DISCONNECT, del_socket]
];

var VALID_EVENTS = [LOGIN, CHAT, 'invitation', 'book', 'moment', 'delete'];

function is_valid_event(event){
	// return VALID_EVENTS.filter(e => e == event).length > 0;
	return VALID_EVENTS.indexOf(event) != -1;
};

var get_event = function(event_func_map){
	return event_func_map[0];
};

var get_func = function(event_func_map){
	return event_func_map[1];
};

/************* Event Configuration End ******/

function _check_if_be_called(socket, event_func){
	var event = get_event(event_func);
	var process_func = get_func(event_func);
	var self_socket = new Socket(socket);
	
	socket.on(event, function(data){
		log.save(log.ACTION.RECEIVE, self_socket.socket2str(), data);
		var data = utility.json2object(data);
		process_func(self_socket, data);
	});
}

var handle_event = function(socket){
	USER_SOCKET = socket;
	var check_if_event_be_called_on_this_socekt = _.curry(_check_if_be_called)(USER_SOCKET);
	CLIENT_EVENTS_FUNC.forEach(check_if_event_be_called_on_this_socekt);
	// check each event if has been called.
};

module.exports = {
	handle_event: handle_event,
	is_valid_event: is_valid_event,
};
