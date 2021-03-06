/*
 * Manipulats the offline message.
 *
 */

var message = require('./message.js');

var get_offline_messages = function(receiver_id){
	return message.get_cached_messages(receiver_id);
};

var add_an_offline_message = function(receiver_id, content){
	if(!receiver_id){
		//throw 'no recever id';
	}
	else {
		message.save_to_cache(receiver_id, content);
	}
};

var send_offline_message = function(receiver_id, send_func){
	var offline_messages = get_offline_messages(receiver_id);
	//offline_messages.forEach( m=> send_func(m.receiver_id, m.event, m));
	for(var i = 0; i < offline_messages.length; i++){
		var m = offline_messages[i];
		if(!m){
			throw 'message is empty!';
		}else{
			send_func(m.receiver_id, m.event, m);
		}
	}
	//offline_messages.forEach(m => send_func(m.receiver_id, m.event, m));
};

module.exports = {
	send_offline_message: send_offline_message,
	add_an_offline_message: add_an_offline_message,
	delete_offline_message: message.delete_cached_messages,
};
