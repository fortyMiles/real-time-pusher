var actions = {
    START_ON: 'start-on',
    NEW_CONNECT: 'new-connect',
    SAVE: 'save',
    RECEIVE: 'receive',
    SEND: 'send',
    DELETE: 'delete',
    WITHOUT: 'without',
    ERROR: 'error'
};

var print_log = function(action, actor, message){
  action = action || 'test';
  actor = actor || 'system';
  message = message || '';
  if (typeof(message) != 'string') {
     message = JSON.stringify(message);
  }
  console.log('[' + new Date() + '] ' + action + ' ' + actor + ': ' + message);
};

module.exports = {
  save: print_log,
  ACTION: actions,
}

if(require.main == module){
  print_log();
}
