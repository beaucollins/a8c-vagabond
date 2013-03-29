var events = require('events'),
    sys = require('sys'),
    url = require('url'),
    a8c = require('../a8c');

module.exports.createManager = module.exports = function(options){
  return new Manager(options);
};

var createUserStream = function createUserStream(options){
  return new UserStream(options);
};

var Manager = module.exports.Manager = function(options){
  this.options = options;
  // create an oauth client to be used for authenticating users
  this.oauth = a8c.oauth(options.oauth);
  // for storing active user streams
  this.streams = {};
}

sys.inherits(Manager, events.EventEmitter);

Manager.prototype.authenticateUser = function(credentials, callback){
  var stream;
  // if we already have an active userstream, use it
  if (stream = this.streams[credentials.username.toLowerCase()]){
    if(stream.isValidCredentials(credentials)){
      callback(stream);      
    } else {
      console.log("Credentials are not valid");
    }
    return;
  }
  // otherwise let's authenticate with oauth
  this.oauth.requestToken(credentials, (function(token_data){
    // on successfull authentication, start the XMPP client
    stream = new UserStream({
      jabber: a8c.jabber(credentials),
      rest: a8c.rest(token_data.access_token)
    });
    this.streams[credentials.username.toLowerCase()] = stream;
    callback(stream);
  }).bind(this));
}

/*
Options:
  rest: rest client
  xmpp: jabber client
*/
var UserStream = module.exports.UserStream = function(options){
  this.options = options;
  this.jabber = options.jabber;
  this.rest = options.rest;
  this.jabber
    .on('online', this.online.bind(this))
    .on('message', this.message.bind(this));
}

sys.inherits(UserStream, events.EventEmitter);

UserStream.prototype.online = function(){
  this.options.jabber.subs();
  this.options.jabber.once('command', (function(msg){
    this.emit("subs", msg.split("\n"));
  }).bind(this));
}

UserStream.prototype.message = function(from, message){
  console.log("Parse message!");
  console.log("=>", from);
  console.log(message);
  // pull out the URL from the last line of the message
  var lines = message.split("\n"),
      message_url = lines[lines.length-1],
      u = url.parse(message_url),
      rest = this.options.rest;
      
  // if there's a hash it's a comment
  if(u.hash){
    // comment id is the int from the hash e.g. #comment-5 becomes 5
    var comment_id = u.hash.match(/[\d]+/)[0];
    // request /sites/host/comments/comment_id
    rest.site_comment(u.host, comment_id, (function(status, data){
      this.emit('comment', data);
    }).bind(this));
  } else {
    // since it's not a comment it's a post so we want to get the slug
    // split the path into parts and reverse /2013/03/15/hello-world/ becomes:
    // ['', 'hello-world', '15', '03', '2013, '']
    var paths = u.path.split('/').reverse();
    // remove any blank path segments from trailing slashes
    while(paths[0].trim() == '') paths.shift();
    // request the post using the slug REST call
    // /sites/host/posts/slug:slug-from-url
    // TODO: some permalinks could just have the post id
    rest.site_post_by_slug(u.host, paths[0], (function(status, data){
      this.emit("post", data);
    }).bind(this));
      
  }
}