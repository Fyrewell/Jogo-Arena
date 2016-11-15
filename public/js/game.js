
var game
var skin_shot = 0
var skin_char = 0

function loadGame() {
  game = new Phaser.Game(800, 600, Phaser.AUTO, 'main', { preload: preload, create: create, update: update, render: render })
}

function preload () {
  game.load.image('earth', 'assets/light_sand.png')
  game.load.spritesheet('char0', 'assets/sprite_char0.png', 64, 64)
  game.load.spritesheet('char3', 'assets/sprite_char3.png', 64, 64)
  game.load.spritesheet('char4', 'assets/sprite_char4.png', 64, 64)
  game.load.spritesheet('char5', 'assets/sprite_char5.png', 64, 64)
  game.load.spritesheet('char6', 'assets/sprite_char6.png', 64, 64)
  game.load.spritesheet('char7', 'assets/sprite_char7.png', 64, 64)
  game.load.spritesheet('char8', 'assets/sprite_char8.png', 64, 64)
  game.load.spritesheet('char9', 'assets/sprite_char9.png', 64, 64)
  game.load.image('shot', 'assets/shot.png')
  game.load.image('shot0', 'assets/shot0.png')
  game.load.image('shot1', 'assets/shot1.png')
  game.load.image('shot2', 'assets/shot2.png')
  game.load.image('shot3', 'assets/shot3.png')
  game.load.image('hearth', 'assets/hearth.png')
  game.load.image('game_over', 'assets/game_over.png');
  game.load.spritesheet('kaboom', 'assets/explosion.png', 64, 64, 23);
}

var socket // Socket connection

var land

var player

var enemies

var currentSpeed = 0
var cursors

var uid
var myName
var objName

var shots
var fireRate = 600
var nextFire = 0
var playerLife = 5

var explosions

var hearths = []

function create () {
  socket = io.connect()

  // Resize our game world to be a 2000 x 2000 square
  game.world.setBounds(-500, -500, 1000, 1000)

  // Our tiled scrolling background
  land = game.add.tileSprite(0, 0, 800, 600, 'earth')
  land.fixedToCamera = true

  // The base of our player
  var startX = Math.round(Math.random() * (1000) - 500)
  var startY = Math.round(Math.random() * (1000) - 500)
  player = game.add.sprite(startX, startY, 'char' + skin_char)
  player.angle += 90;
  player.anchor.setTo(0.5, 0.5)
  player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true)
  player.animations.add('stop', [3], 20, true)

  // This will force it to decelerate and limit its speed
  // player.body.drag.setTo(200, 200)
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.maxVelocity.setTo(400, 400)
  player.body.collideWorldBounds = true

  for (var i=0;i<playerLife;i++){
    var hearth = game.add.sprite(10 + i*40, 10, 'hearth')
    hearth.fixedToCamera = true
    hearths.push(hearth)
  }
  
  // Create some baddies to waste :)
  enemies = []

  player.bringToTop()

  game.camera.follow(player)
  game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300)
  game.camera.focusOnXY(0, 0)

  cursors = game.input.keyboard.createCursorKeys()

  // Our shots group
  shots = game.add.group();
  shots.enableBody = true;
  shots.physicsBodyType = Phaser.Physics.ARCADE;
  shots.createMultiple(2, 'shot' + skin_shot, 0, false);
  shots.setAll('anchor.x', 0.5);
  shots.setAll('anchor.y', 0.5);
  shots.setAll('outOfBoundsKill', true);
  shots.setAll('checkWorldBounds', true);
  
  //  Explosion pool
  explosions = game.add.group();

  for (var i = 0; i < 10; i++)
  {
      var explosionAnimation = explosions.create(0, 0, 'kaboom', [0], false);
      explosionAnimation.anchor.setTo(0.5, 0.5);
      explosionAnimation.animations.add('kaboom');
  }
  
  // Start listening for events
  setEventHandlers()
}

var setEventHandlers = function () {
  // Socket connection successful
  socket.on('connect', onSocketConnected)

  // Socket disconnection
  socket.on('disconnect', onSocketDisconnect)

  // New player message received
  socket.on('new player', onNewPlayer)

  // Player move message received
  socket.on('move player', onMovePlayer)

  // Player removed message received
  socket.on('remove player', onRemovePlayer)
  
  // Player shot message received
  socket.on('shot player', onShotPlayer)

}

// Socket connected
function onSocketConnected () {
  console.log('Connected to socket server')

  // Reset enemies on reconnect
  enemies.forEach(function (enemy) {
    enemy.player.kill()
  })
  enemies = []

  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y, angle: player.angle, pname:myName, uid:uid, skin_shot: skin_shot, skin_char: skin_char})
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server')
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id)

  // Avoid possible duplicate players
  var duplicate = playerById(data.id)
  if (duplicate) {
    console.log('Duplicate player!')
    return
  }
console.log(data)
  // Add new player to the remote players array
  enemies[data.id] = new RemotePlayer(data.id, game, player, data.x, data.y, data.angle, data.pname, data.uid, data.skin_shot, data.skin_char)
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id)

  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  // Update player position
  movePlayer.player.x = data.x
  movePlayer.player.y = data.y
  movePlayer.player.angle = data.angle
  movePlayer.pname = data.pname

}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id)

  if (data.id == this.id) {
    player.kill();
    
    var explosionAnimation = explosions.getFirstExists(false);
    explosionAnimation.reset(player.x, player.y);
    explosionAnimation.play('kaboom', 30, false, true);
    
    game_over = game.add.sprite(160, 120, 'game_over');
    game_over.fixedToCamera = true;

    while (playerLife>0) {
      hearths[playerLife-1].kill();
      playerLife--;
    }
    
    return
  }else if (!removePlayer) { // Player not found
    console.log('Player not found: ', data.id)
    return
  }else{
    return
  }

  removePlayer.objName.destroy()
  removePlayer.player.kill()

  // Remove player from array
  delete enemies[data.id]
}

function onShotPlayer (data) {
  var shoterPlayer = playerById(data.id)

  if (!shoterPlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  shoterPlayer.shot.xDest = data.xDest
  shoterPlayer.shot.yDest = data.yDest
}

function update () {
  
  for (i in enemies) {
    if (enemies[i].alive) {
      game.physics.arcade.overlap(enemies[i].shots, player, shotHitPlayer, null, this);
      game.physics.arcade.collide(player, enemies[i].player)
      game.physics.arcade.overlap(shots, enemies[i].player, shotHitEnemy, null, this);
      enemies[i].update()
    }
  }

  if (cursors.left.isDown) {
    player.angle -= 4
  } else if (cursors.right.isDown) {
    player.angle += 4
  }

  if (cursors.up.isDown) {

    currentSpeed = 300

  } else {
    if (currentSpeed > 0) {
      currentSpeed -= 4
    }
  }

  game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity)

  if (currentSpeed > 0) {
    player.animations.play('move')
  } else {
    player.animations.play('stop')
  }

  land.tilePosition.x = -game.camera.x
  land.tilePosition.y = -game.camera.y

  if (player.alive) {
    if (game.input.activePointer.isDown) {
      fire();
    }
  }
  
  if (objName) objName.destroy();
  
  var style = { font: "16px Arial", fill: "#000" };
  objName = game.add.text(0, 0, myName, style);
  objName.alignTo(player, Phaser.LEFT, -6);
  
  socket.emit('move player', { x: player.x, y: player.y, angle: player.angle, pname: myName});
}

function fire () {

    if (game.time.now > nextFire && shots.countDead() > 0)
    {
        nextFire = game.time.now + fireRate;

        var shot = shots.getFirstExists(false);

        shot.reset(player.x, player.y);

        shot.rotation = game.physics.arcade.moveToXY(shot, game.input.activePointer.worldX,game.input.activePointer.worldY, fireRate);
        
        socket.emit('shot player', {xDest:game.input.activePointer.worldX, yDest:game.input.activePointer.worldY});
    }

}

function shotHitPlayer (player, shot) {

  shot.kill();
  playerLife--;

  hearths[playerLife].kill();
  
  if (playerLife == 0){
    player.kill();
    
    var explosionAnimation = explosions.getFirstExists(false);
    explosionAnimation.reset(player.x, player.y);
    explosionAnimation.play('kaboom', 30, false, true);
    
    game_over = game.add.sprite(160, 120, 'game_over');
    game_over.fixedToCamera = true;
    
    socket.emit('dead player', {id: player.id});
  }
}

function shotHitEnemy (enemy, shot) {

  shot.kill();

  var destroyed = enemies[enemy.name].damage();
  
  if (destroyed){
    enemies[enemy.name].objName.destroy()
    var explosionAnimation = explosions.getFirstExists(false);
    explosionAnimation.reset(enemy.x, enemy.y);
    explosionAnimation.play('kaboom', 30, false, true);

    socket.emit('remove player', {id: enemy.name, killer_uid: uid, dead_uid: enemies[enemy.name].uid});
  }

}

function render () {

}

// Find player by ID
function playerById (id) {
  if (typeof enemies[id] !== 'undefined') {
    return enemies[id]
  }

  return false
}
