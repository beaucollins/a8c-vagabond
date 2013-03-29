var xmpp_client = require('xmpp-client'),
    events      = require('events'),
    sys         = require('sys');

var config = module.exports = function(options){
  return new Client(options);
};

var BOT = module.exports.bot = "bot@im.wordpress.com";

var Client = module.exports.Client = function(options){
  if (!options.username) throw('a8c.jabber.Client requires a username');
  if (!options.password) throw('a8c.jabber.Client requires a password');
  this.connection = new xmpp_client.Client({
    jid: options.username + '@im.wordpress.com',
    password: options.password,
    port: 5222
  });
  this.connection.debug = false;
  var client = this, forwardedEvents = ['online', 'roster'];
  forwardedEvents.forEach(function(evt){
    client.connection.on(evt, function(){
      var args = [evt].concat([].slice.call(arguments));
      client.emit.apply(client, args);
    })
  });
  this.connection.on('message', function(from, message){
    if (from == BOT) {
      client.emit('command', message);
    } else {
      client.emit('message', from, message);
    }
  });
  this.on('roster', this.onRoster.bind(this));
  
};

sys.inherits(Client, events.EventEmitter);

Client.prototype.onRoster = function(roster){
  console.log("Roster", roster);
}

Client.prototype.wpCommand = function(msg){
  this.connection.message(BOT, msg);
};

Client.prototype.sub = function(blog){
  this.wpCommand('sub ' + blog);
};

Client.prototype.subs = function(){
  this.wpCommand('subs');
}

