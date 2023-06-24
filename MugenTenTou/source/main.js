
"push title MicoJS Demo1";
"push author FManga";
"push description A MicoJS game";
"set version v0.0.1";
"set category demo";
"set url https://micojs.github.com";

"include /source/RandWord.js"

let CAMERA_Z = 0;
const MAX_CORRIDOR = 10;
const CORRIDOR_SCALE = 8;
const CORRIDOR_WIDTH = 1024 * 2;
const MAX_CAMERA_X = CORRIDOR_WIDTH / 2 - 200;

const DEFAULT_AGILITY = 40;
const DEFAULT_MAXHP = 50;
const DEFAULT_LUCK = 25;
const DEFAULT_SPEED = 1;
let score = 0;
let agility = DEFAULT_AGILITY;
let speed = DEFAULT_SPEED;;
let maxhp = DEFAULT_MAXHP;
let luck = DEFAULT_LUCK;
let hp = 0;
let lastDMG = 0;
let pupMagnet = 5;

// let flashColor = rand(1, 220, true);
// debug("Flash color ", flashColor);
const flashColor = 55;
let flashShip = 0;
let player = createShip();
let activePUP;

const GREEN = setPen(0, 230, 100);
const RED = setPen(200, 0, 0);
const SCORE_COLOR = setPen(200, 180, 80);
const BAR_WIDTH = 10;

const MIN_ROID_SIZE = 3;
const MAX_ROID_SIZE = 20;
const MAX_ROIDS = 3;
const roids = new Array(MAX_ROIDS);

const DEFAULT_SHOT_COLOR = 99;
let SHOT_COLOR = DEFAULT_SHOT_COLOR;
const SHOT_SIZE = 50;
let SHOT_SPEED = 1;
const DEFAULT_SHOT_RATE = 400;
let SHOT_RATE = DEFAULT_SHOT_RATE;
let SHOT_DMG = 4;
const MAX_SHOTS = 7;
const shots = new Array(MAX_SHOTS);
let nextShot = 0;

const MAX_SPLODES = 4;
const splodes = new Array(MAX_SPLODES);
let nextSplode = 0;

const PUP_TYPES = [
    {
        name:"Rate UP",
        start:0,
        limit:10000,
        init:function(){
            this.start = getTime();
            SHOT_RATE *= 0.5;
        },
        update:timeLimitedPUP,
        remove:function(){
            SHOT_RATE *= 2;
        }
    },

    {
        name:"DMG UP",
        start:0,
        limit:10000,
        init:function(){
            this.start = getTime();
            SHOT_DMG *= 2;
            SHOT_COLOR = 101;
        },
        update:timeLimitedPUP,
        remove:function(){
            SHOT_DMG *= 0.5;
            SHOT_COLOR = DEFAULT_SHOT_COLOR;
        }
    },

    {
        name:"AGI UP",
        init:function(){
            agility = DEFAULT_AGILITY * 1.2;
        }
    },

    {
        name:"HP UP 30%",
        init:function(){
            hp = clamp(hp + maxhp * 0.3, 0, maxhp);
        }
    },

    {
        name:"LUCK UP",
        init:function(){
            luck = clamp(luck * 1.1, 0, 100);
        }
    },

    {
        name:"MAXHP UP 10%",
        init:function(){
            let d = maxhp + 0.1;
            maxhp += d;
            hp += d;
        }
    },

    {
        name:"MAGNET",
        start:0,
        limit:10000,
        init:function(){
            this.start = getTime();
            pupMagnet = 20;
        },
        update:timeLimitedPUP,
        remove:function(){
            pupMagnet = 5;
        }
    }
];

const MAX_PUPS = 3;
const pups = new Array(MAX_PUPS);
let nextPUP = 0;

const MAX_NODES = MAX_ROIDS + MAX_SPLODES + MAX_SHOTS + MAX_PUPS + 1;
const nodes = new Array(MAX_NODES);
const fastShipLayers = [
    null,//R.ship1,
    null,//R.ship2,
    null,//R.ship3,
    null,//R.ship4,
    R.ship5,
    null,//R.ship6,
    R.ship7,
    null,//R.ship8,
    R.ship9,
    null,//R.ship10,
    R.ship11,
    null,//R.ship12,
    R.ship13,
    null,//R.ship14,
    R.ship15,
    null,//R.ship16,
    R.ship17,
    //R.ship18
];
const fullShipLayers = [
    R.ship1, R.ship2, R.ship3, R.ship4, R.ship5, R.ship6, R.ship7, R.ship8, R.ship9, R.ship10, R.ship11, R.ship12, R.ship13, R.ship14, R.ship15, R.ship16, R.ship17, R.ship18
];
let shipLayers = fastShipLayers;

{"ifeq platform pico"; shipLayers = fullShipLayers;}
{"ifeq platform espboy"; shipLayers = fullShipLayers;}
{"ifeq platform blit"; shipLayers = fullShipLayers;}

const explosionAnim = [
    R.explosion1,
    R.explosion2,
    R.explosion3,
    R.explosion4,
    R.explosion5,
    R.explosion6,
    R.explosion7,
    R.explosion8,
    R.explosion9,
    R.explosion10,
    R.explosion11,
    R.explosion12,
    R.explosion13,
    R.explosion14,
    R.explosion15,
    R.explosion16
];

const humanNames = [
    ["$1$2$2", "$1$2", "$6$2$2", "$6$2$2$2"],
    "$3$4",
    ["$5$4", "$5$4", "$5$4n"],
    "*KGHBRNMD",
    "*2*a*i*u*e*ooueiaiueao",
    "*kghbrnmd",
    "*1AIUEO"
];

let bgColor = 1; // setPen(9, 10, 20);
const txtColor = setPen(64, 128, 255);
let screenWidth, screenHeight;
let spriteScale;
let halfWidth, halfHeight;
let name, seq = 0;

function reset() {
    score = 0;
    agility = DEFAULT_AGILITY;
    speed = DEFAULT_SPEED;;
    maxhp = DEFAULT_MAXHP;
    luck = DEFAULT_LUCK;
    hp = maxhp;
    lastDMG = 0;
    pupMagnet = 5;
    flashShip = 0;
    activePUP = null;
    player.x = 0;
    player.y = CORRIDOR_WIDTH/2;
    player.z = 7;
    CAMERA_X = 0;
    CAMERA_Y = 0;
    CAMERA_Z = 0;
    for (let i = 0; i < MAX_ROIDS; ++i)
        initRoid(roids[i], rand(0.5, 1.5) * MAX_CORRIDOR * CORRIDOR_SCALE);
}

function hitShip(dmg) {
    if (flashShip > 0)
        return;
    flashShip = 30;
    hp -= dmg;
    lastDMG = "-" + (dmg | 0);
    if (hp <= 0)
        initSplode(player.x, player.y, player.z, 1);
}

function createShip() {
    return {
        x:0, y:CORRIDOR_WIDTH/2, z:7, dx:0, dy:0, r:0, f:0, c:0,
        draw:drawShip,
        update:updateShip
    };
}

function updateShip() {
    if (hp <= 0) {
        speed = max(speed - 0.01, -0.05);
        CAMERA_Z += speed;
        if (B)
            reset();
        return;
    }
    score += 0.01;
    flashShip -= 1;
    speed += 0.0001;
    let rot = RIGHT - LEFT;
    this.r = (this.r * 10 - rot * 0.3) / 11;
    this.dx = (this.dx * 3 + rot * agility) * 0.25;
    this.x += this.dx;
    this.x = clamp(this.x, -CORRIDOR_WIDTH/2, CORRIDOR_WIDTH/2);
    this.dy = (this.dy * 3 + (DOWN - UP) * agility) * 0.25;
    this.y += this.dy;
    this.y = clamp(this.y, -CORRIDOR_WIDTH/2, CORRIDOR_WIDTH/2);
    this.z += speed;
    if (A) {
        let now = getTime();
        if (now - this.f > SHOT_RATE) {
            this.f = now;
            initShot(this.x, this.y, this.z + SHOT_SPEED, this.dx * 1.25, this.dy * 1.25, SHOT_SPEED + speed);
        }
    }
    /*
    if (B) {
        if (shipLayers == fastShipLayers) shipLayers = fullShipLayers;
        else shipLayers = fastShipLayers;
    }
    */
    CAMERA_X = (CAMERA_X * 3 + this.x) / 4;
    CAMERA_Y = (CAMERA_Y * 3 + (this.y - 150)) / 4;
    CAMERA_Z = this.z - 5;
    CAMERA_X = clamp(CAMERA_X, -MAX_CAMERA_X, MAX_CAMERA_X);
    CAMERA_Y = clamp(CAMERA_Y, -MAX_CAMERA_X, MAX_CAMERA_X);
    if (flashShip > 0) {
        CAMERA_X += rand(-flashShip, flashShip);
        CAMERA_Y += rand(-flashShip, flashShip);
    }
}

function drawShip() {
    if (hp <= 0) {
        image(R.title, halfWidth, halfHeight);
        return;
    }
    let dz = this.z - CAMERA_Z;
    let x = this.x - CAMERA_X;
    let y = this.y - CAMERA_Y;
    const s = 6 * spriteScale;
    const sd = s / 100;
    setPen(flashColor * (flashShip & 2) * (flashShip > 0));
    let sx, sy;
    for (let layer of shipLayers) {
        if (layer) {
            let idz = 1 / dz;
            sx = halfWidth + x * idz;
            sy = halfHeight + y * idz;
            image(layer, sx, sy, this.r, s * idz);
        }
        dz -= sd;
    }
    if (flashShip > 0) {
        setPen(RED);
        text(lastDMG, sx, sy - 30 + flashShip);
    }
    if (hp != maxhp) {
        drawBar(sx, sy + 20, hp, maxhp, 3);
    }
}

function createSplode() {
    return {
        x:0, y:0, z:0, f:0, s:0,
        draw:drawSplode
    }
}

function initSplode(x, y, z, s) {
    if (nextSplode >= MAX_SPLODES) nextSplode = 0;
    let splode = splodes[nextSplode++];
    splode.x = x;
    splode.y = y;
    splode.z = z;
    splode.s = s * 20 * spriteScale;
    splode.f = 0;
}

function drawSplode() {
    let dz = this.z - CAMERA_Z;
    if (dz <= 1) {
        return;
    }
    ++this.f;
    let frame = explosionAnim[floor(this.f)];
    if (frame) {
        let sx = halfWidth + (this.x - CAMERA_X) / dz;
        let sy = halfHeight + (this.y - CAMERA_Y) / dz;
        setPen(0);
        image(frame, sx, sy, this.z, this.s / dz);
    }
}

function drawBar(sx, sy, hp, maxhp, s) {
    if (maxhp <= 0) return;
    if (hp <= 0) return;
    const W = s * BAR_WIDTH;
    sx -= W / 2;
    setPen(GREEN);
    let w = hp * W / maxhp;
    rect(sx, sy, w, s);
    setPen(RED);
    rect(sx + w, sy, W - w, s);
}

function updateMine() {
    this.z += speed * 0.5;
    if (this.z - CAMERA_Z < 20) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let mineSpeed = 20 * speed;
        this.x += sign(dx) * min(abs(dx), mineSpeed);
        this.y += sign(dy) * min(abs(dy), mineSpeed);
    }
}

function updateZigH() {
    this.x += this.c;
    if (abs(this.x) > MAX_CAMERA_X) {
        let s = sign(this.c);
        this.x = MAX_CAMERA_X * s;
        this.c *= -1;
    }
}

function updateZigV() {
    this.y += this.c;
    if (abs(this.y) > MAX_CAMERA_X) {
        let s = sign(this.c);
        this.y = MAX_CAMERA_X * s;
        this.c *= -1;
    }
}

function drawRoid() {
    let dz = this.z - CAMERA_Z;
    this.s = (this.s + this.ts) / 2;
    if (dz <= 5) {
        let dx = this.x - player.x;
        let dy = this.y - player.y;
        let d = dx*dx + dy*dy;
        let s = this.s * 25;
        if (d < s*s) {
            if (this.update) {
                hitShip(DEFAULT_MAXHP);
            } else {
                hitShip(this.s);
            }
            dz = 0;
        }
    }
    if (dz <= 1) {
        initRoid(this, CAMERA_Z + MAX_CORRIDOR * CORRIDOR_SCALE);
    } else if (this.s > 0.5) {
        let sx = halfWidth + (this.x - CAMERA_X) / dz;
        let sy = halfHeight + (this.y - CAMERA_Y) / dz;
        setPen(0);
        image(this.img, sx, sy, 0, this.s / dz);

        if (this.hp != this.maxhp) {
            drawBar(sx, sy, this.hp, this.maxhp, 1);
        }
    }
}

function createRoid(z) {
    return initRoid({
        x: 0,
        y: 0,
        z: 0,
        s: 0,
        c: 0,
        hp:0,
        img:null,
        maxhp:0,
        update: null,
        draw: drawRoid
    }, z);
}

function initRoid(roid, z) {
    let hp = MIN_ROID_SIZE;
    if (rand(0, speed * 26) < luck) {
        if (rand(0, speed * 100) < 25) {
            roid.c = rand(-50, 50);
            if (rand(0, 100) < 50) {
                roid.update = updateZigV;
            } else {
                roid.update = updateZigH;
            }
            roid.img = R.station;
        } else {
            roid.update = null;
            roid.img = R.asteroid;
            hp = (MIN_ROID_SIZE + (MAX_ROID_SIZE - MIN_ROID_SIZE) * rand(0, 1) * rand(0, 1));
        }
    } else {
        roid.update = updateMine;
        roid.img = R.mine;
    }

    let s = hp * spriteScale;
    roid.z = z;
    roid.x = rand(-MIN_ROID_SIZE, MIN_ROID_SIZE) * CORRIDOR_WIDTH / 2 / ((s - MIN_ROID_SIZE) * 0.1 + MIN_ROID_SIZE);
    roid.y = rand(-MIN_ROID_SIZE, MIN_ROID_SIZE) * CORRIDOR_WIDTH / 2 / ((s - MIN_ROID_SIZE) * 0.1 + MIN_ROID_SIZE);
    roid.s = s;
    roid.ts = s;
    roid.hp = hp;
    roid.maxhp = hp;
    return roid;
}

function createShot() {
    return {
        x:0, y:0, z:0,
        dx:0, dy:0, dz:0,
        ttl:0,
        update: updateShot,
        draw: drawShot
    };
}

function initShot(x, y, z, dx, dy, dz) {
    if (nextShot >= MAX_SHOTS) nextShot = 0;
    let shot = shots[nextShot++];
    shot.ttl = 300;
    shot.x = x;
    shot.y = y;
    shot.z = z;
    shot.dx = dx;
    shot.dy = dy;
    shot.dz = dz;
    return shot;
}

function updateShot() {
    if (this.ttl <= 0)
        return;
    for (let roid of roids) {
        let dz = roid.z - this.z;
        if (dz * dz > 10)
            continue;
        let dx = roid.x - this.x;
        let dy = roid.y - this.y;
        let d = dx*dx + dy*dy;
        let s = 25 * roid.s;
        if (d < s*s) {
            this.ttl = 0;
            roid.hp -= SHOT_DMG;
            if (roid.hp <= 0) {
                score += roid.s;
                roid.ts = 0;
                initSplode(this.x, this.y, roid.z, 1.5);
                if (rand(0, 120) < luck)
                    initPUP(this.x, this.y, roid.z);
            } else {
                initSplode(this.x, this.y, this.z, 0.3);
            }
            return;
        }
    }
    this.x += this.dx;
    this.y += this.dy;
    this.z += this.dz;

    if (max(abs(this.x), abs(this.y)) > CORRIDOR_WIDTH/2) {
        initSplode(this.x, this.y, this.z, 0.3);
        this.ttl = 0;
    } else {
        --this.ttl;
    }
}

function drawShot() {
    if (this.ttl <= 0)
        return;
    let dz = this.z - CAMERA_Z;
    if (dz <= 1) {
        return;
    } else {
        let idz = 1 / dz;
        let sx = halfWidth + (this.x - CAMERA_X) * idz;
        let sy = halfHeight + (this.y - CAMERA_Y) * idz;
        idz *= 50 * spriteScale;
        let hidz = idz / 2;
        setPen(SHOT_COLOR);
        rect(sx - hidz, sy - hidz, idz, idz);
        // image(R.shot, sx, sy, 0, idz);
    }
}

function activatePUP(id) {
    if (activePUP)
        deactivatePUP();
    activePUP = PUP_TYPES[id];
    if (activePUP && activePUP.init)
        activePUP.init();
}

function deactivatePUP() {
    if (!activePUP)
        return;
    if (activePUP.remove)
        activePUP.remove();
    activePUP = null;
}

function initPUP(x, y, z) {
    if (nextPUP >= MAX_PUPS) nextPUP = 0;
    let pup = pups[nextPUP++];
    pup.x = x;
    pup.y = y;
    pup.z = z - 1;
    pup.i = rand(0, PUP_TYPES.length, true);
    pup.draw = drawPUP;
    pup.update = updatePUP;
}

function nop(){}

function timeLimitedPUP() {
    if (getTime() - this.start > this.limit) {
        deactivatePUP();
    }
}

function createPUP() {
    return {
        x:0, y:0, z:0, i:0,
        draw:nop,
        update:nop
    };
}

function updatePUP() {
    this.z += speed * 0.5;
    let dx = player.x - this.x;
    let dy = player.y - this.y;
    this.x += sign(dx) * min(abs(dx), pupMagnet);
    this.y += sign(dy) * min(abs(dy), pupMagnet);
}

function drawPUP() {
    let dz = this.z - CAMERA_Z;
    if (dz <= 5) {
        let dx = this.x - player.x;
        let dy = this.y - player.y;
        let d = dx*dx + dy*dy;
        let s = 8 * spriteScale;
        if (d < s*s) {
            dz = 0;
            activatePUP(this.i);
        }
    }
    if (dz <= 1) {
        this.draw = nop;
        this.update = nop;
    } else {
        let idz = 1 / dz;
        let sx = halfWidth + (this.x - CAMERA_X) * idz;
        let sy = halfHeight + (this.y - CAMERA_Y) * idz;
        idz *= 4 * spriteScale;
        setPen(this.i);
        image(R.pup, sx, sy, this.z + this.i, idz);
    }
}

function init() {
    screenWidth = getWidth();
    screenHeight = getHeight();
    spriteScale = screenWidth / 128;
    halfWidth = screenWidth / 2;
    halfHeight = screenHeight / 2;
    setFPS(30);

    let j = 0;
    for (let i = 0; i < MAX_ROIDS; ++i)
        nodes[j++] = roids[i] = createRoid(rand(0.5, 1.5) * MAX_CORRIDOR * CORRIDOR_SCALE);
    for (let i = 0; i < MAX_SHOTS; ++i)
        nodes[j++] = shots[i] = createShot();
    for (let i = 0; i < MAX_SPLODES; ++i)
        nodes[j++] = splodes[i] = createSplode();
    for (let i = 0; i < MAX_PUPS; ++i)
        nodes[j++] = pups[i] = createPUP();
    nodes[j++] = player;
}

function update(time) {
    if (activePUP && activePUP.update)
        activePUP.update();
    for (let node of nodes) {
        if (node && node.update)
            node.update();
    }
}

function render() {
    setPen(0);
    setFont(R.fontTiny);
    clear();

    const z = -(CAMERA_Z % CORRIDOR_SCALE);
    let bgc = CAMERA_Z / CORRIDOR_SCALE;
    let invert = floor(CAMERA_Z / CORRIDOR_SCALE) & 1;
    const count = (MAX_CORRIDOR - invert) * CORRIDOR_SCALE;
    for (let i = -CORRIDOR_SCALE, j = 0; i < count; i += CORRIDOR_SCALE) {
        const iz = max(1, i + z);
        let s = CORRIDOR_WIDTH / iz;
        let halfS = s / 2;
        setPen(((bgc + j++) / 128 & 0xFF) + bgColor + invert);
        invert = !invert;
        rect(halfWidth - CAMERA_X / iz - halfS, halfHeight - CAMERA_Y / iz - halfS, s, s);
    }

    let pz = nodes[0].z;
    for (let i = 0; i < MAX_NODES; ++i) {
        const node = nodes[i];
        node.draw();
        const z = node.z;
        if (i * (pz < z)) {
            nodes[i] = nodes[i - 1];
            nodes[i - 1] = node;
        } else {
            pz = z;
        }
    }

    if (activePUP) {
        setPen(txtColor);
        text(activePUP.name, 10, screenHeight - 10);
    }

    setPen(SCORE_COLOR);
    setFont(R.fontDonut);
    text(score|0, screenWidth/2 - 20, 10);
}
