var https = require('https'),
    util = require('./util'),
    url = require('url'),
    querystring = require('querystring');

var createClient = module.exports.createClient = module.exports = function(token, options){
  return new Client(token, options);
};

var REST_ENDPOINT = 'https://public-api.wordpress.com/rest/v1/'

// Options should include an auth token and app id
var Client = module.exports.Client = function(access_token, options){
  var endpoint = url.parse(REST_ENDPOINT);
  this.access_token = access_token;
  this.options = util.merge({
    hostname: endpoint.host,
    protocol: endpoint.protocol,
    path: endpoint.pathname,
    headers: {
      'Authorization' : 'Bearer ' + access_token
    }
  }, options);
}

Client.prototype.request = function(method, options, body, callback){
  // create an https request and send body if necessary
  if (typeof(options) == 'string' || options.constructor == String) {
    options = {
      path: options
    };
  }
  if (typeof(body) == 'function'){
    callback = body;
    body = null;
  }
  if (options.path.indexOf('/') != 1) options.path = '/' + options.path;
  if (options.path.indexOf(this.options.path)) options.path = this.options.path + options.path.slice(1);
  var options = util.merge(this.options, options);
  if(body) options.headers['Content-Length'] = body.length;
  // collect the request data and try to parse it
  // if there's a query, stringify and append
  if (options.query) {
    var query = querystring.stringify(options.query);
    delete options.query;
    options.path += options.path.indexOf("?") == -1 ? '?' : '&';
    options.path += query;
  };
  req = https.request(options, function(res){
    var body = "";
    res.on('data', function(d){
      body += d.toString();
    });
    res.on('end', function(){
      callback(res.statusCode, JSON.parse(body));
    });
  });
  req.end(body);
  return req;
}

Client.prototype.get = function(options, callback){
  var req = this.request.apply(this, ['GET'].concat([].slice.call(arguments)));
  return req;
}

Client.prototype.post = function(options, body, callback){
  var req = this.request.apply(this, ['POST'].concat([].slice.call(arguments)));
  return req;
}

var METHODS = [
  ['me',         'GET', 'me'],
  ['likes',      'GET', 'me/likes'],
  ['site',       'GET', 'sites/:site_id'],
  ['site_posts', 'GET', 'sites/:site_id/posts'],
  ['site_post',  'GET', 'sites/:site_id/posts:post_id'],
  ['site_post_by_slug', 'GET', 'sites/$site/posts/slug:$post_slug'],
  ['site_comment', 'GET', 'sites/:site_id/comments/:comment_id']
];

METHODS.forEach(function(settings){
  var name = settings[0],
      method = settings[1],
      url = settings[2];
  // parse arguments out of url
  
  Client.prototype[settings[0]] = function(){
    // last argument should always be the callback
    var args = [].slice.call(arguments),
        callback,
        body;
    if (typeof(args[args.length-1]) == 'function') callback = args.pop();
    if (method == 'POST') body = args.pop();
    var path = url.replace(/(:|\$)[a-z_]{1,}/gi, function(found){
      if (args.length == 0) throw("Missing url parameter " + found + " in " + url);
      return args.shift();
    });
    var options = args.length > 0 ? args.shift() : {};
    options.path = path;
    body = options.body;
    delete options.body;
    this.request(method, options, body, callback);
  };
});