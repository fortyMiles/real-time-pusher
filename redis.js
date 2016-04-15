/*
 * Manipulats all operations with redis.
 *
 * @Author Minchiuan Gao (2016-4-14)
 */

var redis = require('redis');
var SOCKETS = require('./socket.js');
var utility = require('./utility.js');
const REDIS_DB = 2;
var TAG = 'dev';

var event_sub_client = redis.createClient();
var event_pub_client = redis.createClient();

event_sub_client.select(REDIS_DB, function() { /* ... */ });

event_pub_client.select(REDIS_DB, function() { /* ... */ });

event_sub_client.on("subscribe", function (channel, count) { /* ... */ });
event_sub_client.on("message", function (channel, data) {
	var message = utility.json2object(data);
	SOCKETS.send_message(message, message.event);
});

var EVENTS = ['login', 'invitation', 'book', 'moment'];
EVENTS.forEach(event => event_sub_client.subscribe(TAG + ':' + event + "->"));  
// subscribe those events.
// just sub those events, so when receive redis messages, needn't to check if this event is valid.

const PUB_EVENTS = {
	LOGIN: 'login',
}; // define which events could be pub.

var pub_an_event = function(event){
	return message => event_pub_client.publish(TAG + ":->" + event, JSON.stringify(message));
};

var pub_login_message_to_server = function(data){
	pub_an_event(PUB_EVENTS.LOGIN)(data);
};

module.exports = {
	pub_login_message_to_server: pub_login_message_to_server,
};
