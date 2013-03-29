url      = require 'url'
mongo    = require 'mongodb'
ws       = require 'ws'
a8c      = require './lib/a8c'
vagabond = require './lib/vagabond'

manager = vagabond.stream( oauth:{
  client_id: process.env.A8C_OAUTH_CLIENT_ID,
  client_secret: process.env.A8C_OAUTH_CLIENT_SECRET,
  redirect_uri: process.env.A8C_OAUTH_REDIRECT_URI
} );

server = vagabond.server port:5001, path:'/client', (session)->
  session.on 'auth', (auth)->
    manager.authenticateUser auth, (stream)->
      console.log 'authenticated'
      listener = new StreamListener(stream, session)

class StreamListener
  constructor:(@stream, @session)->
    @stream.on 'comment', @onComment
    @stream.on 'post', @onPost
    @session.once 'close', @onClose
    @session.send 'auth', access_token:stream.rest.access_token
    console.log "Sending token", stream.rest.access_token
  onClose:()=>
    console.log 'closing socket'
    @stream.removeListener 'comment', @onComment
    @stream.removeListener 'post', @onPost
  onComment:(comment)=>
    @session.send 'comment', comment
  onPost:(post)=>
    @session.send 'post', post
    
# TODO: These will be provided by a client
# USERNAME = process.env.A8C_USERNAME
# PASSWORD = process.env.A8C_PASSWORD

# Configure the Oauth client with our client id and secret
# oauth= manager.oauth
#   client_id: process.env.A8C_OAUTH_CLIENT_ID,
#   client_secret: process.env.A8C_OAUTH_CLIENT_SECRET,
#   redirect_uri: process.env.A8C_OAUTH_REDIRECT_URI
# 

# user = manager.authenticateUser username: USERNAME, password: PASSWORD, (stream)->
#   console.log "We have a stream", stream
  
# var WebSocketServer = require('ws').Server
#   , wss = new WebSocketServer({port: 8080});
# wss.on('connection', function(ws) {
#     ws.on('message', function(message) {
#         console.log('received: %s', message);
#     });
#     ws.send('something');
# });
# 

