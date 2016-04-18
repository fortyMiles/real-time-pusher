const MAX_OFFLINE_MESSAGE_NUM = 10;
const DEV = {
	PORT: 9876,
	TAG: 'dev',
	REDIS_DB: 2,
};

const DEPLOY = {
	PORT: 9877,
	TAG: 'book',
	REDIS_DB:2,
};

var ENV = {};

var in_server = function(){
  var host_address = '121.40.158.110';
  var os = require('os');
  var networkInterface = os.networkInterfaces();
  try{
    if(networkInterface.eth1[0].address == host_address){
      return true;
    }
  }catch(exception){
    return false;
  }
}

if(in_server()){
	ENV = DEPLOY;
}else{
	ENV = DEV;;
}

;

var VALID_PUB_CHANNLE = 
module.exports = {
	max_offline_message_num: MAX_OFFLINE_MESSAGE_NUM,
	env: ENV,
};
