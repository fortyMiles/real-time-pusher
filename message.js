/*
 * Define message data structure
 * @ Author: Minchiuan 2016-4-11
 */

var Message = function(id, content, receiver_id, event){
    this.id = id;
    this.createdDate = Date.now();
    this.read = false;
    this.content = content;
    this.receiver_id = receiver_id;
	this.event = event;
}

Message.prototype.set_read = function(){
    this.read = true;
}

Message.prototype.is_overdate = function(){
    const DELTA_TIME = 10;
	return Number(Date.now() - this.createDate) > DELTA_TIME;
}

var messages = {};
var save_to_cache = function(id, content, receiver_id, event){
	var msg = new Message(id, content, receiver_id, event);
	if(messages.hasOwnProperty(receiver_id)){
		messages[receiver_id].push(msg);
	}else{
		messages[receiver_id] = [msg];
	}
	console.log(receiver_id + ' get an offline msg ' +  event);
};

var get_cached_messages = function(receiver_id){
    return messages[receiver_id] || [];
};

module.exports = {
	Message: Message,
	save_to_cache: save_to_cache,
	get_cached_messages: get_cached_messages,
}


