# Vagabond

A service that uses WordPress.com jabber connection and REST API to hobble
together a reading experience with a streaming API.

## Definitions

- jabber( client): the client that connects to im.wordpress.com with XMPP
- service: the app built by this project
- app: client that connects to this service

# User Flow

## Authentication

Until jabber supports oauth tokens we'll need the user's username and password.
We'll also need to use Oauth to obtain a token that has full access to the REST
API similar to how the iOS app does.

1. User enters username/password and sends HTTP request to server
2. Server attempts to get a OAuth token
  - if unsuccessfull reports error
3. Server stores username/password and opens xmpp client connection
4. Need a way to add remove blogs
5. When message comes in parse the trailing URL to see if it's a comment or post
6. Request via REST API the resource represented by the url in #5
7. Send a push notification 
  