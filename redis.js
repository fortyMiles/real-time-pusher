/*
 * Manipulats all operations with redis.
 *
 * @Author Minchiuan Gao (2016-4-14)
 */

var redis = require('redis');
var SOCKETS = require('./socket.js');
var utility = require('./utility.js');
var conf = require('./configuration.js');
var log = require('./log.js');
const REDIS_DB = conf.env.REDIS_DB || 1;
const REDIS_SUB_EVENTS = conf.redis_sub_event;

var event_sub_client = redis.createClient();
var event_pub_client = redis.createClient();

event_sub_client.select(REDIS_DB, function() { /* ... */ });

event_pub_client.select(REDIS_DB, function() { /* ... */ });

event_sub_client.on("subscribe", function (channel, count) { /* ... */ });
event_sub_client.on("message", function (channel, data) {
	var message = utility.json2object(data);
	log.save(log.ACTION.RECEIVE, 'redis', message);
	SOCKETS.send_message(message, message.event);
});

var SUB_EVENTS = [REDIS_SUB_EVENTS];

var TAG = conf.env.TAG || '';
SUB_EVENTS.forEach(event => event_sub_client.subscribe(TAG + ':' + event + "->"));  
// subscribe those events.
// just sub those events, so when receive redis messages, needn't to check if this event is valid.

const PUB_EVENTS = {
	LOGIN: 'login',
	CHAT: 'chat',
};

var pub_an_event = function(event){
	return message => event_pub_client.publish(TAG + ":->" + event, JSON.stringify(message));
};

var pub_login_message_to_server = function(data){
	pub_an_event(PUB_EVENTS.LOGIN)(data);
	log.save(log.ACTION.SEND, 'redis', data);
};

var pub_chat_message_to_server = function(data){
	pub_an_event(PUB_EVENTS.CHAT)(data);
	log.save(log.ACTION.SEND, 'redis', data);
};

module.exports = {
	pub_login_message_to_server: pub_login_message_to_server,
	pub_chat_message_to_server: pub_chat_message_to_server,
};
