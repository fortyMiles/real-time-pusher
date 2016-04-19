var actions = {
    START_ON: 'start-on',
    NEW_CONNECT: 'new-connect',
    SAVE: 'save',
	RECEIVE: 'receive',
	SEND: 'send',
	DELETE: 'delete',
	WITHOUT: 'without',
};

var print_log = function(action, actor,  message){
  action = action || 'test';
  actor = actor || 'system';
  message = message || '';
  console.log(action + '\t' + actor + '\t' + message + '\t' + new Date().toISOString());
};

module.exports = {
  save: print_log,
  ACTION: actions,
}

if(require.main == module){
  print_log();
}
