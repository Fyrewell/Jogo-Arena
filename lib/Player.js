/* ************************************************
** GAME PLAYER CLASS
************************************************ */
var Player = function (startX, startY, startAngle, pname, uid, skin_shot, skin_char) {
  var x = startX
  var y = startY
  var angle = startAngle
  var id
  var pname = pname
  var shot = {}
  var uid = uid
  var skin_shot = skin_shot
  var skin_char = skin_char

  // Getters and setters
  var getX = function () {
    return x
  }

  var getY = function () {
    return y
  }

  var getAngle = function () {
    return angle
  }

  var setX = function (newX) {
    x = newX
  }

  var setY = function (newY) {
    y = newY
  }

  var setAngle = function (newAngle) {
    angle = newAngle
  }

  // Define which variables and methods can be accessed
  return {
    getX: getX,
    getY: getY,
    getAngle: getAngle,
    setX: setX,
    setY: setY,
    setAngle: setAngle,
    id: id,
    shot: shot,
    pname: pname,
    uid: uid,
    skin_shot: skin_shot,
    skin_char: skin_char
  }
}

// Export the Player class so you can use it in
// other files by using require("Player")
module.exports = Player
