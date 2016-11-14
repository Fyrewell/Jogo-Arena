var util = require('util')
var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')
var io = require('socket.io')
var firebase = require("firebase");

firebase.initializeApp({
  serviceAccount: 'lib/JogoArena-1ee1e4640507.json',
  databaseURL: "https://jogoarena-c089b.firebaseio.com"
});

var Player = require('./Player')

var port = process.env.PORT || 8080

var db = firebase.database()

/* ************************************************
** GAME VARIABLES
************************************************ */
var socket	// Socket controller
var players	// Array of connected players

/* ************************************************
** GAME INITIALISATION
************************************************ */

// Create and start the http server
var server = http.createServer(
  ecstatic({ root: path.resolve(__dirname, '../public') })
).listen(port, function (err) {
  if (err) {
    throw err
  }

  init()
})

function init () {
  // Create an empty array to store players
  players = []

  // Attach Socket.IO to server
  socket = io.listen(server)

  // Start listening for events
  setEventHandlers()
}

/* ************************************************
** GAME EVENT HANDLERS
************************************************ */
var setEventHandlers = function () {
  // Socket.IO
  socket.sockets.on('connection', onSocketConnection)
}

// New socket connection
function onSocketConnection (client) {
  util.log('New player has connected: ' + client.id)

  // Listen for client disconnected
  client.on('disconnect', onClientDisconnect)

  // Listen for new player message
  client.on('new player', onNewPlayer)

  // Listen for move player message
  client.on('move player', onMovePlayer)
  
  // Listen for shot player message
  client.on('shot player', onShotPlayer)
  
  // Listen for hit player message
  client.on('hit player', onHitPlayer)

  // Listen for remove player message
  client.on('remove player', onRemovePlayer)

}

// Socket client has disconnected
function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id)

  var removePlayer = playerById(this.id)

  // Player not found
  if (!removePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }

  // Remove player from players array
  delete players[this.id]

  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id})
}

// New player has joined
function onNewPlayer (data) {
  //console.log(data)
  // Create a new player
  var newPlayer = new Player(data.x, data.y, data.angle, data.pname, data.uid, data.skin_shot, data.skin_char)
  newPlayer.id = this.id

  // Broadcast new player to connected socket clients
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), angle: newPlayer.getAngle(), pname: newPlayer.pname, 
                                      uid: newPlayer.uid, skin_shot: newPlayer.skin_shot, skin_char: newPlayer.skin_char})

  // Send existing players to the new player
  var existingPlayer
  for (var i in players) {
    existingPlayer = players[i]
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY(), angle: existingPlayer.getAngle(), 
                              pname: existingPlayer.pname, skin_shot: existingPlayer.skin_shot, skin_char: existingPlayer.skin_char})
  }

  // Add new player to the players array
  players[newPlayer.id] = newPlayer
}

// Player has moved
function onMovePlayer (data) {
  // Find player in array
  var movePlayer = playerById(this.id)

  // Player not found
  if (!movePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }

  // Update player position
  movePlayer.setX(data.x)
  movePlayer.setY(data.y)
  movePlayer.setAngle(data.angle)
  movePlayer.pname = data.pname
  //util.log('fk' + data.pname);
  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), angle: movePlayer.getAngle(), pname: movePlayer.pname})
}

// Player has shoted
function onShotPlayer (data) {
  // Find player in array
  var shoterPlayer = playerById(this.id)
  
  // Player not found
  if (!shoterPlayer) {
    util.log('Player not found: ' + this.id)
    return
  }

  shoterPlayer.shot.xDest = data.xDest
  shoterPlayer.shot.yDest = data.yDest
  this.broadcast.emit('shot player', {id: shoterPlayer.id, xDest:data.xDest, yDest:data.yDest})
}

function onHitPlayer (data) {

  this.broadcast.emit('hit player', {id: data.id})

}

function onRemovePlayer (data) {
  //console.log(data.id)
  this.broadcast.emit('remove player', {id: data.id})
  if (data.killer_uid) {
    writePlayerKill(data.killer_uid)
    writePlayerDead(data.dead_uid)
  }
}

/* ************************************************
** GAME HELPER FUNCTIONS
************************************************ */
// Find player by ID
function playerById (id) {
  if (typeof players[id] !== 'undefined') {
    return players[id]
  }

  return false
}

function writePlayerKill(userId) {
  var ref = db.ref('users/' + userId)
  ref.once("value", function(snapshot) {
    var kills = snapshot.val().kills
    kills++
    ref.set({
      username: snapshot.val().username,
      email: snapshot.val().email,
      profile_picture : snapshot.val().profile_picture,
      kills: kills,
      deads: snapshot.val().deads,
      skin_shot: snapshot.val().skin_shot,
      skin_char: snapshot.val().skin_char
    });
  });
}

function writePlayerDead(userId) {
  var ref = db.ref('users/' + userId)
  ref.once("value", function(snapshot) {
    var deads = snapshot.val().deads
    deads++
    ref.set({
      username: snapshot.val().username,
      email: snapshot.val().email,
      profile_picture : snapshot.val().profile_picture,
      kills: snapshot.val().kills,
      deads: deads,
      skin_shot: snapshot.val().skin_shot,
      skin_char: snapshot.val().skin_char
    });
  });
}