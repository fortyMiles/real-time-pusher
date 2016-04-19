/*
 * Define message data structure
 * @ Author: Minchiuan 2016-4-11
 */

var conf = require('./configuration.js');
var log = require('./log.js');

var messages = {};

var save_to_cache = function(receiver_id, msg){
	if(messages.hasOwnProperty(receiver_id)){
		if(messages[receiver_id].length >= conf.max_offline_message_num){
			messages[receiver_id].shift(); 
			// if length larger than max length, delete first element.
		}
		messages[receiver_id].push(msg);
	}else{
		messages[receiver_id] = [msg];
	}
	log.save(log.ACTION.SAVE,'offline', message=JSON.stringify(msg));
};

var get_cached_messages = function(receiver_id){
	var results = [];
	if(messages[receiver_id]){
	     results = messages[receiver_id].map(e=>e)
	}
    return results;
};

var delete_cached_messages = function(receiver_id, mid){
    if(messages[receiver_id]){
		for(var i = 0; i < messages[receiver_id].length; i++){
			if(messages[receiver_id][i].mid == mid){
			    messages[receiver_id].splice(i, 1);
			}
		};
	}
};


module.exports = {
	save_to_cache: save_to_cache,
	get_cached_messages: get_cached_messages,
	delete_cached_messages: delete_cached_messages,
}


