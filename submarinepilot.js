var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var lastTime = 0;
const PLAYER_IMAGE = new Image();
PLAYER_IMAGE.src = 'submarine.png';
const MINE_IMAGE = new Image();
MINE_IMAGE.src = 'mine.png';
const SCALE = 4
const GAME_WIDTH = 64 * SCALE;
const GAME_HEIGHT = 64 * SCALE;
const PLAYER_WIDTH = 8 * SCALE;
const PLAYER_HEIGHT = 8 * SCALE;
const PLAYER_SPEED = 3;
const PLATFORM_WIDTH = 8 * SCALE;
const PLATFORM_HEIGHT = 8 * SCALE;
const PROJECTILE_WIDTH = 1 * SCALE;
const PROJECTILE_HEIGHT = 1 * SCALE;
const PROJECTILE_SPEED = 6;
const MINE_COLOR = 'rgb(77,110,243)';
const MINE_SPEED = 1;
var playerSpeed = 0;
var shootTimer = 0;
var movR = 0;
var movL = 0;
var score = 0;
var paused = false;
var pauseReady = true;
var gameOver = false;
var spawnTimer = 0;
var spawnMax = 0;

var player = {
    sprite: PLAYER_IMAGE,
    x: (GAME_WIDTH / 2) - (PLAYER_WIDTH / 2),
    y: GAME_HEIGHT - PLAYER_HEIGHT,
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT
}

function projectile(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

function mine(x, y, w, h, sprite) {
    this.sprite = sprite;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

var mines = [];
var projectiles = [];
draw();

function draw() {
    ctx.fillStyle = 'rgb(150, 168, 140)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = 'rgb(60,62,59)';
    if (movR > 0 && player.x >= GAME_WIDTH - PLAYER_WIDTH) {
        movR = 0;
    }
    if (movL < 0 && player.x <= 0) {
        movL = 0;
    }
    player.x += movR + movL;
    
    ctx.drawImage(player.sprite, player.x, player.y);

    // Draw projectiles
    for (const proj of projectiles) {
        ctx.fillRect(proj.x, proj.y, proj.w, proj.h);
    }

    for (const mine of mines) {
        ctx.drawImage(MINE_IMAGE, mine.x, mine.y);
    }

    if (paused) {
        ctx.fillRect(GAME_WIDTH/4, GAME_HEIGHT/4, GAME_WIDTH/2, GAME_HEIGHT/2);
        document.getElementById('pause-text').innerHTML = 'PAUSED<br><br>Press Enter <br>To Resume';
    } else if (gameOver) {
        ctx.fillRect(GAME_WIDTH/4, GAME_HEIGHT/4, GAME_WIDTH/2, GAME_HEIGHT/2);
        document.getElementById('game-over-text').innerHTML = 'GAME OVER<br><br>Press Enter <br>To Restart';
    } else {
        document.getElementById('pause-text').innerHTML = '';
        document.getElementById('game-over-text').innerHTML = '';
    }
}

function reset() {
    gameOver = false;
    paused = false;
    score = 0;
    movR = 0;
    movL = 0;
    player.x = GAME_WIDTH/2- player.w/2;
    while (mines.length > 0) {
        mines.shift();
    }
    document.getElementById('score').innerHTML = 'Score: ' + score;
}

function input() {
    document.addEventListener("keydown", (event)=> {
        playerSpeed = 0;

        if (!gameOver && !paused) {
            if (event.key == 'ArrowRight') {
                movR = PLAYER_SPEED;
            }
            if (event.key == 'ArrowLeft') {
                movL = -PLAYER_SPEED;
            }
            if (event.key == ' ' && shootTimer > 100) {
                shootTimer = 0;
                var newProj = new projectile(player.x + player.w / 2, player.y + PROJECTILE_HEIGHT, PROJECTILE_WIDTH, PROJECTILE_HEIGHT);
                projectiles.push(newProj);
            }
        } else {
            movR = 0;
            movL = 0;
        }

        if (event.key == 'Enter') {
            if (pauseReady && !gameOver) {
                paused = !paused;
                pauseReady = false;
            } else if (gameOver) {
                pauseReady = false;
                reset();
            }
        }
    })
    document.addEventListener("keyup", (event)=> {
        if (event.key == 'ArrowRight') {
            movR = 0;
        }
        if (event.key == 'ArrowLeft') {
            movL = 0;
        }
        if (event.key == 'Enter') {
            pauseReady = true;
        }
    })
}
function projectileMovement() {
    if (projectiles.length > 0) {
        var i = 0;
        while (i < projectiles.length) {
            projectiles[i].y -= PROJECTILE_SPEED;
            if (projectiles[i].y < -projectiles[i].h) {
                projectiles.splice(i, 1);
            } else {
                i++;
            }
        }
    }
}
function SpawnMine() {
    var xPos = Math.floor(Math.random() * 8) * 32;
    var obj = new mine(xPos, -5 * SCALE, 5 * SCALE, 5 * SCALE, MINE_IMAGE);
    mines.push(obj);
    spawnTimer = 0;
    spawnMax = Math.floor(Math.random() * 1000) + 500;
}
function mineMovement() {
    if (mines.length > 0) {
        var i = 0;
        while (i < mines.length) {
            mines[i].y += MINE_SPEED;
            if (mines[i].y > GAME_HEIGHT + mines[i].h) {
                mines.splice(i, 1);
            } else {
                i++;
            }
        }
    }
}
function collisionMine() {
    var i = 0;
    while (i < mines.length) {
        if ((collisionCheck(player, mines[i])) && (player.y + player.h - mines[i].y) > 0.05) {
            gameOver = true;
            movR = 0;
            movL = 0;
        }
        var j = 0;
        while (j < projectiles.length) {
            if ((collisionCheck(projectiles[j], mines[i], i))) {
                score++;
                projectiles.splice(j, 1);
                mines.splice(i, 1);
                document.getElementById('score').innerHTML = 'Score: ' + score;
                break;
            }
            j++;
        }
        i++;
    }
}
function collisionCheck(ob1, ob2, j) {
    var x1 = ob1.x + ob1.w - ob2.x;
    var x2 = ob2.x + ob2.w - ob1.x;
    var y1 = ob1.y + ob1.h - ob2.y;
    var y2 = ob2.y + ob2.h - ob1.y;
    if (((x1 > 0 && x1 <= ob1.w) || (x2 > 0 && x2 <= ob2.w))
    && ((y1 > 0 && y1 <= ob1.h)|| (y2 > 0 && y2 <= ob2.h))) 
    {
        return true;
    }
}

function gameLoop(timestamp) {
    var deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    input();
    if (!paused && !gameOver) {
        shootTimer += deltaTime;
        spawnTimer += deltaTime;
        if (spawnTimer > spawnMax) {
            SpawnMine();
        }
        projectileMovement();
        mineMovement();
        collisionMine();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);