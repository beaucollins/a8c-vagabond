var https = require('https'),
    url = require('url'),
    querystring = require('querystring'),
    events = require('events'),
    sys = require('sys'),
    util = require('./util');

var WORDPRESS_API_HOST = 'public-api.wordpress.com',
    AUTHORIZE_PATH = 'oauth2/authorize',
    TOKEN_PATH = 'oauth2/token';

var merge = util.merge;

var createClient = module.exports.createClient = module.exports = function(options){
  return new Client(options);
};

var TokenRequest = module.exports.TokenRequest = function(options, requestURL, callback){
  this.options = options;
  // makes an http request to the 
  /*
    $curl = curl_init( "https://public-api.wordpress.com/oauth2/token" );
    curl_setopt( $curl, CURLOPT_POST, true );
    curl_setopt( $curl, CURLOPT_POSTFIELDS, array(
      'client_id' => your_client_id,
      'redirect_uri' => your_redirect_url,
      'client_secret' => your_client_secret_key,
      'code' => $_GET['code'], // The code from the previous request
      'grant_type' => 'authorization_code'
    ) );
    curl_setopt( $curl, CURLOPT_RETURNTRANSFER, 1);
    $auth = curl_exec( $curl );
    $secret = json_decode($auth);
    $access_key = $secret->access_token;
  */
  var request_options = url.parse(requestURL),
    body = querystring.stringify(merge({
      client_id: this.options.client_id,
      redirect_uri: this.options.redirect_uri || 'http://example.com',
      client_secret: this.options.client_secret,
      grant_type: 'password'
    }, options));
  // prepare the request options with method and headers
  request_options.method = 'POST';
  request_options.headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': body.length
  };
  // create the request
  var self = this,
      req = https.request(request_options, function(res){
        var body = '';
        res.on('data', function(data){
          body += data.toString();
        });
        res.on('end', function(){
          // callback(null, JSON.parse(body));
          self.emit('token', JSON.parse(body));
        });
    });
  
  if(callback) this.on('token', callback);

  req.write(body);
  req.end();
};

sys.inherits(TokenRequest, events.EventEmitter);

// app_id and secret
var Client = module.exports.Client = function(options){
  this.options = options;
}

Client.prototype.getURL = function(path, query){
  return url.format({
    protocol: 'https',
    hostname: WORDPRESS_API_HOST,
    pathname: path,
    query: query
  });
}

// https://public-api.wordpress.com/oauth2/authorize?client_id=
// URL to send the user to
Client.prototype.getAuthURL = function(){
  return this.getURL(AUTHORIZE_PATH, {
    client_id:    this.options.client_id,
    redirect_uri: this.options.redirect_uri,
    type:         'code'
  });
}

Client.prototype.getTokenURL = function(){
  return this.getURL(TOKEN_PATH);
}

// Redirect URI is provided with a code querystring parameter used
// to exchange for an auth token
Client.prototype.parseCode = function(redirect_url){
  var parsed = url.parse(redirect_url, true); // true parses querystring
  return parsed.query.code;
}

// Grant type is password
Client.prototype.requestToken = function(options, callback){
  return new TokenRequest(merge(this.options, options), this.getTokenURL(), callback);
}