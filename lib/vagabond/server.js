var ws     = require('ws'),
    events = require('events')
    sys    = require('sys');

module.exports = function(options, onConnection){
  return new Server(options, onConnection);
}

var Server = function Server(options, onConnection){
  server = new ws.Server(options)
  server.on('connection', handleConnection.bind(this));
  if (onConnection) this.on('connection', onConnection);
}

sys.inherits(Server, events.EventEmitter);

var handleConnection = function handleConnection(socket){
  console.log('client connected');
  // do we kill idle messages?
  var session = new Session(socket);
  this.emit('connection', session);
}

var Session = function Session(socket){
  this.socket = socket;
  socket.on('message', handleMessage.bind(this));
  socket.on('close', handleClose.bind(this));
}
sys.inherits(Session, events.EventEmitter);

Session.prototype.send = function(command, payload){
  var message = ":" + command + "::";
  if (payload) message += JSON.stringify(payload);
  this.socket.send(message);
}

var handleMessage = function handleMessage(message){
  message = message.toString();
  // parse out the command
  if(message.indexOf(':') != 0){
    console.log("invalid message: %s", message);
    return;
  }
  var delimiter = message.indexOf('::'),
      command = message.substr(1, message.indexOf('::')-1);
  if(command == ''){
    console.log("invalid command: %s", message);
    return
  }

  payload_str = message.substr(delimiter + 2)
  try {
    payload = JSON.parse(payload_str);
    this.emit(command, payload);
    console.log("received command", command);
  } catch(error){
    console.log("invalid payload: %s", payload_str);
  }
}

var handleClose = function handleClose(){
  this.emit('close');
}



