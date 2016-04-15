/*
 * Manipulates different events, and how to process
 * different events.
 *
 * @Author Minchiuan Gao (2016-4-14)
 *
 */

var account = require('./account.js');
var Socket = require('./socket.js').Socket;
var utility = require('./utility.js');
var _ = require('ramda');

/*********** Event Configration **************/
const EVENTS_FUNC = [
	//['echo', login], 
    //['chat', login],
	['login', account.login],
];

var VALID_EVENTS = ['login', 'invitation', 'book', 'moment'];

function check_event_is_valid(event){
	return VALID_EVENTS.filter(e => e == event).length > 0;
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
		var data = utility.json2object(data);
		process_func(self_socket, data);
	});
}

var handle_event = function(socket){
	USER_SOCKET = socket;
	var check_if_event_be_called_on_this_socekt = _.curry(_check_if_be_called)(USER_SOCKET);
	EVENTS_FUNC.forEach(check_if_event_be_called_on_this_socekt);
	// check each event if has been called.
};

module.exports = {
	handle_event: handle_event,
	check_event_is_valid: check_event_is_valid,
};
