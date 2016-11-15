/* global game */

var RemotePlayer = function (index, game, player, startX, startY, startAngle, inppname, uid, skin_shot, skin_char) {
  var x = startX
  var y = startY
  var angle = startAngle

  this.game = game
  this.health = 5
  this.player = player
  this.alive = true

  this.fireRate = 600
  this.nextFire = 0

  this.shot = {}
  this.pname = inppname
  this.uid = uid;
  this.skin_shot = skin_shot
  this.skin_char = skin_char
  console.log(skin_char, skin_shot)
  this.player = game.add.sprite(x, y, 'char' + skin_char)

  this.player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true)
  this.player.animations.add('stop', [3], 20, true)

  this.player.anchor.setTo(0.5, 0.5)

  this.player.name = index.toString()
  game.physics.enable(this.player, Phaser.Physics.ARCADE)
  this.player.body.immovable = true
  this.player.body.collideWorldBounds = true

  this.player.angle = angle

  this.lastPosition = { x: x, y: y, angle: angle }
  
  this.textStyle = { font: "16px Arial", fill: "#000" };
  
  this.shots = game.add.group();
  this.shots.enableBody = true;
  this.shots.physicsBodyType = Phaser.Physics.ARCADE;
  this.shots.createMultiple(2, 'shot' + skin_shot, 0, false);
  this.shots.setAll('anchor.x', 0.5);
  this.shots.setAll('anchor.y', 0.5);
  this.shots.setAll('outOfBoundsKill', true);
  this.shots.setAll('checkWorldBounds', true);
  
  this.drawName()
}

RemotePlayer.prototype.update = function () {
  if (this.player.x !== this.lastPosition.x || this.player.y !== this.lastPosition.y || this.player.angle != this.lastPosition.angle) {
    this.player.play('move')
    this.player.rotation = Math.PI + game.physics.arcade.angleToXY(this.player, this.lastPosition.x, this.lastPosition.y)
    this.drawName()
  } else {
    this.player.play('stop')
  }

  this.lastPosition.x = this.player.x
  this.lastPosition.y = this.player.y
  this.lastPosition.angle = this.player.angle

  if (!isEmpty(this.shot) && this.shot != null) {
    var shot = this.shots.getFirstExists(false);
    if (shot != null) {
      shot.reset(this.player.x, this.player.y);
      shot.rotation = game.physics.arcade.moveToXY(shot, this.shot.xDest, this.shot.yDest, this.fireRate);
      this.shot = {};
    }
  }
}

RemotePlayer.prototype.damage = function() {
    this.health -= 1
    if (this.health <= 0)
    {
        this.alive = false
        this.player.kill()
        return true
    }
    return false
}

RemotePlayer.prototype.drawName = function() {
  if (this.objName) this.objName.destroy()
  this.objName = game.add.text(0, 0, this.pname, this.textStyle)
  this.objName.alignTo(this.player, Phaser.LEFT, -6)
}

function isEmpty(myObject) {
    for(var key in myObject) {
        if (myObject.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

window.RemotePlayer = RemotePlayer
