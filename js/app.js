//Declare constants
const PADDING = 22;
const SCREENWIDTH = 768;
const SCREENHEIGHT = 512;
const PADDLESPEED = 10;
const BALLSPEED = 10;
const AIBALLSPEED = 1.5;
const MAXBOUNCEANGLE = 5 * Math.PI / 12; //In radians

//Create a Pixi Application
let app = new PIXI.Application({
    width: SCREENWIDTH + PADDING * 2,
    height: SCREENHEIGHT + PADDING * 2
});

//Add the canvas to the HTML document
document.body.appendChild(app.view);

//loads images and runs setup
PIXI.loader
    .add([
        "img/ball.png",
        "img/paddle.png",
        "img/line.png"
    ])
    .load(setup);

//Global variables needed for game
let ball, aiBall, paddleLeft, paddleRight, state, leftScore, leftScoreText, rightScore, rightScoreText, titleScene, ruleScene, mainScene, gameOverScene, winMessage, ruleMessage;
let twoPlayer = false;
let winningPlayerText = "";
let onePlayerRuleText = "Right player uses:  Up and Down Arrow";
let twoPlayerRuleText = "Left player uses:  W and S\nRight player uses:  Up and Down Arrow";

//Runs after the images are loaded and sets up the game
function setup() {
    //Create the img sprites
    ball = new PIXI.Sprite(PIXI.loader.resources["img/ball.png"].texture);
    aiBall = new PIXI.Sprite(PIXI.loader.resources["img/ball.png"].texture);
    paddleLeft = new PIXI.Sprite(PIXI.loader.resources["img/paddle.png"].texture);
    paddleRight = new PIXI.Sprite(PIXI.loader.resources["img/paddle.png"].texture);
    let line = new PIXI.Sprite(PIXI.loader.resources["img/line.png"].texture);

    //Draw game border
    let border = new PIXI.Graphics();
    border.lineStyle(4, 0xFFFFFF, 1);
    border.drawRect(PADDING, PADDING, SCREENWIDTH, SCREENHEIGHT);
    border.endFill();

    //Setup ball
    ball.position.set(app.view.width / 2, app.view.height / 2);
    ball.anchor.set(0.5, 0.5);
    ball.scale.set(0.15, 0.15);
    ball.vx = 0;
    ball.vy = 0;

    //Setup AI ball
    aiBall.visible = false;
    aiBall.position.set(app.view.width / 2, app.view.height / 2);
    aiBall.anchor.set(0.5, 0.5);
    aiBall.scale.set(0.15, 0.15)
    aiBall.vx = 0;
    aiBall.vy = 0;

    //Setup paddleLeft
    paddleLeft.position.set(paddleLeft.width + PADDING, app.view.height / 4 * 3);
    paddleLeft.anchor.set(0.5, 0.5);
    paddleLeft.scale.x = 0.5;
    paddleLeft.scale.y = 0.65;
    paddleLeft.vx = 0;
    paddleLeft.vy = 0;

    //Setup paddleRight
    paddleRight.position.set(app.view.width - paddleRight.width - PADDING, app.view.height / 4);
    paddleRight.anchor.set(0.5, 0.5);
    paddleRight.scale.x = 0.5;
    paddleRight.scale.y = 0.65;
    paddleRight.vx = 0;
    paddleRight.vy = 0;

    //Setup middle line
    line.position.set(app.view.width / 2, app.view.height / 2);
    line.anchor.set(0.5, 0.5);
    line.scale.set(0.35, 0.35);

    //Setup title message
    let titleStyle = new PIXI.TextStyle({
        fontFamily: "ArcadeClassic",
        fontSize: app.view.width / 3,
        fill: "white"
    });
    let titleMessage = new PIXI.Text("PONG", titleStyle);
    titleMessage.position.set(app.view.width / 2, (app.view.height / 4) * 1.5);
    titleMessage.anchor.set(0.5, 0.5);

    //Setup start buttons that will allow players to begin game
    let startStyle = new PIXI.TextStyle({
        fontFamily: "ArcadeClassic",
        fontSize: app.view.width / 10,
        fill: "white"
    });
    let onePlayerText = new PIXI.Text("1 Player", startStyle);
    let twoPlayerText = new PIXI.Text("2 Players", startStyle);
    let onePlayerButton = new PIXI.Sprite(onePlayerText.generateTexture(app.renderer));
    let twoPlayerButton = new PIXI.Sprite(twoPlayerText.generateTexture(app.renderer));
    onePlayerButton.position.set(app.view.width / 2, (app.view.height / 4 * 2.75));
    twoPlayerButton.position.set(app.view.width / 2, (app.view.height / 4 * 3.5));
    onePlayerButton.anchor.set(0.5, 0.5);
    twoPlayerButton.anchor.set(0.5, 0.5);
    onePlayerButton.interactive = true;
    twoPlayerButton.interactive = true;
    onePlayerButton.buttonMode = true;
    twoPlayerButton.buttonMode = true;
    onePlayerButton
        .on('pointerdown', onOneButtonDown)
        .on('pointerup', onButtonUp)
        .on('pointerupoutside', onButtonUp)
        .on('pointerover', onButtonOver)
        .on('pointerout', onButtonOut);
    twoPlayerButton
        .on('pointerdown', onTwoButtonDown)
        .on('pointerup', onButtonUp)
        .on('pointerupoutside', onButtonUp)
        .on('pointerover', onButtonOver)
        .on('pointerout', onButtonOut);

    function onOneButtonDown() {
        this.isDown = true;
        twoPlayer = false;
        state = rules;
        titleScene.visible = false;
        ruleScene.visible = true;
    }

    function onTwoButtonDown() {
        this.isDown = true;
        twoPlayer = true;
        state = rules;
        titleScene.visible = false;
        ruleScene.visible = true;
    }

    function onButtonUp() {
        this.isdown = false;
    }

    function onButtonOver() {
        this.isOver = true;
    }

    function onButtonOut() {
        this.isOver = false;
    }

    //Set up rules message
    let ruleStyle = new PIXI.TextStyle({
        fontFamily: "ArcadeClassic",
        fontSize: app.view.width / 20,
        fill: "white"
    });
    ruleMessage = new PIXI.Text("", ruleStyle);
    let beginButtonText = new PIXI.Text("Begin", ruleStyle);
    let beginButton = new PIXI.Sprite(beginButtonText.generateTexture(app.renderer));
    ruleMessage.position.set(app.view.width / 2, app.view.height / 3);
    beginButton.position.set(app.view.width / 2, app.view.height / 3 * 2);
    ruleMessage.anchor.set(0.5, 0.5);
    beginButton.anchor.set(0.5, 0.5);
    beginButton.interactive = true;
    beginButton.buttonMode = true;

    beginButton
        .on('pointerdown', onBeginButtonDown)
        .on('pointerup', onButtonUp)
        .on('pointerupoutside', onButtonUp)
        .on('pointerover', onButtonOver)
        .on('pointerout', onButtonOut);

    function onBeginButtonDown() {
        this.isDown = true;
        state = play;
        chooseStartingPlayer();
        ruleScene.visible = false;
        mainScene.visible = true;
    }

    //Set up score counters
    leftScore = 0;
    rightScore = 0;
    let scoreStyle = new PIXI.TextStyle({
        fontFamily: "ArcadeClassic",
        fontSize: app.view.width / 5,
        fill: "white"
    });
    leftScoreText = new PIXI.Text(leftScore, scoreStyle);
    rightScoreText = new PIXI.Text(rightScore, scoreStyle);
    leftScoreText.position.set(app.view.width / 8 * 3, (app.view.height / 6));
    rightScoreText.position.set(app.view.width / 8 * 5, (app.view.height / 6));
    leftScoreText.anchor.set(0.5, 0.5);
    rightScoreText.anchor.set(0.5, 0.5);

    //Setup game over text
    let gameOverStyle = new PIXI.TextStyle({
        fontFamily: "ArcadeClassic",
        fontSize: app.view.width / 7,
        fill: "white"
    });
    let winStyle = new PIXI.TextStyle({
        fontFamily: "ArcadeClassic",
        fontSize: app.view.width / 11,
        fill: "white"
    });
    let gameOverMessage = new PIXI.Text("Game\nOver", gameOverStyle);
    winMessage = new PIXI.Text("Winner: " + winningPlayerText, winStyle);
    gameOverMessage.position.set(app.view.width / 2, (app.view.height / 4) * 1.5);
    winMessage.position.set(app.view.width / 2, (app.view.height / 4) * 3);
    gameOverMessage.anchor.set(0.5, 0.5);
    winMessage.anchor.set(0.5, 0.5);

    //Create containers for each scene
    titleScene = new PIXI.Container();
    ruleScene = new PIXI.Container();
    mainScene = new PIXI.Container();
    gameOverScene = new PIXI.Container();

    //Sets main and game over scenes as inactive until later
    ruleScene.visible = false;
    mainScene.visible = false;
    gameOverScene.visible = false;

    //Set up titleScene
    titleScene.addChild(titleMessage);
    titleScene.addChild(onePlayerButton);
    titleScene.addChild(twoPlayerButton);

    //Set up ruleScene
    ruleScene.addChild(ruleMessage);
    ruleScene.addChild(beginButton);

    //Setup mainScene
    mainScene.addChild(ball);
    mainScene.addChild(aiBall);
    mainScene.addChild(paddleLeft);
    mainScene.addChild(paddleRight);
    mainScene.addChild(border);
    mainScene.addChild(leftScoreText);
    mainScene.addChild(rightScoreText);
    mainScene.addChild(line);

    //Setup gameOverScene
    gameOverScene.addChild(gameOverMessage);
    gameOverScene.addChild(winMessage);

    //Add all scenes to the app
    app.stage.addChild(titleScene);
    app.stage.addChild(ruleScene);
    app.stage.addChild(mainScene);
    app.stage.addChild(gameOverScene);

    //Capture the keyboard keys
    let up = keyboard(38),
        down = keyboard(40),
        w = keyboard(87),
        s = keyboard(83);

    //W
    w.press = () => {
        if (twoPlayer) {
            paddleLeft.vy = -PADDLESPEED;
        }
    };
    w.release = () => {
        if (twoPlayer) {
            if (!s.isDown) {
                paddleLeft.vy = 0;
            }
        }
    };

    //S
    s.press = () => {
        if (twoPlayer) {
            paddleLeft.vy = PADDLESPEED;
        }
    };
    s.release = () => {
        if (twoPlayer) {
            if (!w.isDown) {
                paddleLeft.vy = 0;
            }
        }
    };

    //W
    up.press = () => {
        paddleRight.vy = -PADDLESPEED;
    };
    up.release = () => {
        if (!down.isDown) {
            paddleRight.vy = 0;
        }
    };

    //S
    down.press = () => {
        paddleRight.vy = PADDLESPEED;
    };
    down.release = () => {
        if (!up.isDown) {
            paddleRight.vy = 0;
        }
    };

    //Set the game state to start with the title scene
    state = title;

    //Begins the game loop
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    //Calls the state function to act on the current state
    state(delta);
}

function title(delta) {

}

function rules(delta) {
    if (twoPlayer) {
        ruleMessage.text = twoPlayerRuleText;
    } else {
        ruleMessage.text = onePlayerRuleText;
    }
}

function play(delta) {
    //Paddle control
    if (notHittingWall(paddleLeft)) {
        paddleLeft.y += paddleLeft.vy;
    }
    if (notHittingWall(paddleRight)) {
        paddleRight.y += paddleRight.vy;
    }

    //Ball control
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (!twoPlayer) {
        //AI Ball control
        aiBall.x += aiBall.vx;
        aiBall.y += aiBall.vy;

        //Checks where AI Ball is moving to move AI paddle
        if (aiBall.x - aiBall.width / 2 <= paddleLeft.x + paddleLeft.width / 2) {
            aiBall.vx = 0;
            aiBall.vy = 0;
            if (paddleLeft.y >= aiBall.y - aiBall.height / 2 && paddleLeft.y <= aiBall.y + aiBall.height / 2) {
                paddleLeft.vy = 0;
            } else if (aiBall.y < paddleLeft.y) {
                paddleLeft.vy = -PADDLESPEED;
            } else if (aiBall.y > paddleLeft.y){
                paddleLeft.vy = PADDLESPEED;
            }
        }
    }
    //Checks if someone scored
    if (checkIfScored()) {
        ball.vx *= -1;
        ball.position.set(app.view.width / 2, app.view.height / 2);
        adjustAI();
    }
    //Tests for collision with paddles
    calculateCollision(ball, paddleLeft);
    calculateCollision(ball, paddleRight);

    //Tests for collision with walls
    checkWallCollision(ball);
    checkWallCollision(aiBall);

    //Checks to see if the game has ended
    checkIfGameIsOver();
}

function gameOver(delta) {
    winMessage.text = "Winner: " + winningPlayerText;
}

//Setup AI Ball
function adjustAI() {
    aiBall.x = ball.x;
    aiBall.y = ball.y;
    aiBall.vx = ball.vx * AIBALLSPEED;
    aiBall.vy = ball.vy * AIBALLSPEED;
}

//Randomly selects which player with start with the ball,
//unless it is one player mode in which case the player always starts
function chooseStartingPlayer() {
    let player;
    if (twoPlayer){
        player = Math.floor(Math.random() * 2);
    } else {
        player = 0;
    }
    if (player == 0) {
        calculateBounceAngle(paddleLeft);
        ball.vx *= -1;
    } else {
        calculateBounceAngle(paddleRight);
    }
}

//Checks to see if either paddle is hitting the top or bottom wall
function notHittingWall(p) {
    return (p.y + p.vy > PADDING + p.height / 2 && p.y + p.vy < app.view.height - PADDING - p.height / 2)
}

//Checks if either player has just scored
function checkIfScored() {
    if (ball.x <= paddleLeft.x) {
        rightScoreText.text = ++rightScore;
        return true;
    } else if (ball.x >= paddleRight.x) {
        leftScoreText.text = ++leftScore;
        return true;
    }
    return false;

}

//Checks if the ball has collided with a wall
function checkWallCollision(b) {
    if(b.y + b.height / 2 >= PADDING + SCREENHEIGHT){
        b.vy *= -1;
    } else if (b.y - b.height / 2 <= PADDING) {
        b.vy *= -1;
    }
}

//Checks if either plqyer has won the game
function checkIfGameIsOver() {
    if (leftScore == 10 || rightScore == 10) {
        state = gameOver;
        mainScene.visible = false;
        gameOverScene.visible = true;
        if (leftScore == 10) {
            winningPlayerText = "Left Player";
        } else {
            winningPlayerText = "Right Player";
        }
    }
}

//Tests if two objects are colliding
function calculateCollision(object1, object2) {
    //Define the variables we'll need to calculate
    let combinedHalfWidths, combinedHalfHeights, vx, vy;

    //Calculate the distance vector between the sprites
    vx = object1.x - object2.x;
    vy = object1.y - object2.y;

    //Figure out the combined half-widths and half-heights
    combinedHalfWidths = object1.width / 2 + object2.width / 2;
    combinedHalfHeights = object1.height / 2 + object2.height / 2;

    //Check for a collision on the x axis
    if (Math.abs(vx) < combinedHalfWidths) {
        //A collision might be occuring. Check for a collision on the y axis
        if (Math.abs(vy) < combinedHalfHeights) {
            //There's definitely a collision happening
            calculateBounceAngle(object2);
        }
    }
}

//Calculates what angle to return the ball at based on where it collided with the paddle
function calculateBounceAngle(paddle) {
    let relativeIntersectY = paddle.y - ball.y;

    let normalizedRelativeIntersectionY = (relativeIntersectY / (paddleRight.height / 2));
    let bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
    if (ball.vx > 0) {
        ball.vx = BALLSPEED * -Math.cos(bounceAngle);
    } else {
        ball.vx = BALLSPEED * Math.cos(bounceAngle);
    }
    ball.vy = BALLSPEED * -Math.sin(bounceAngle);
    adjustAI();
}

//Handles keyboard input
function keyboard(keyCode) {
    let key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;

    //The `downHandler`
    key.downHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}