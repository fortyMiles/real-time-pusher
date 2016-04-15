const MAX_OFFLINE_MESSAGE_NUM = 10;
const DEV = {
	PORT: 9876,
	TAG: 'dev',
	REDIS_DB: 2,
};

const DEPLOY = {
	PORT: 9875,
	TAG: '',
	REDIS_DB:2,
};

var ENV = {};

const test = true;

if(test){
	ENV = DEV;
}else{
	ENV = DEPLOY;
}


var VALID_PUB_CHANNLE = 
module.exports = {
	max_offline_message_num: MAX_OFFLINE_MESSAGE_NUM,
	env: ENV,
};
