/*
 * Manipulats the offline message.
 *
 */

var message = require('./message.js');

var get_offline_messages = function(receiver_id){
	return message.get_cached_messages(receiver_id);
}

var add_an_offline_msg = function(id, content, receiver_id, event){
	message.save_to_cache(id, content, receiver_id, event);
};

var send_offline_message = function(receiver_id, send_func){
	var offline_messages = get_offline_messages(receiver_id);
	offline_messages.map(m => send_func(m.receiver_id, m.event, m.content));
}

module.exports = {
	send_offline_message: send_offline_message,
	add_an_offline_msg: add_an_offline_msg,
};
