/**
 * Init values
 */
// Canvas
const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");
const canvasContainer = document.getElementById("canvas-container");

// Tile
const Branches = [
  [[0, 0], 90, 90, 90, 90, 90, 90],
]; // [position, ...tilePointer]
let TilePos = []; // Computed Tile positions
const BranchBin = []; // The place deleted branch goes

// Screen
let screenPos = [0, 0];
let screenScale = 50; // scale: 1 -> 1 tile per 1 px

// Draw
let drawing = false;
let drawingBranch = null;
let lastDrawingPos = [null, null];
let drawingPos = [null, null];

// Status
const statusEle = {
  branches: document.getElementById("branch-count"),
  tiles: document.getElementById("tile-count"),
  tickRate: document.getElementById("tick-rate"),
};
let prevTime = new Date().getTime();
let tickRecords = new Array(10).fill(1000/60);


/**
 * Tick Function
 */
function tick() {
  // Record time
  const curTime = new Date().getTime();
  tickRecords = tickRecords.slice(1).concat([curTime - prevTime]);
  prevTime = curTime;

  // Dusplay Status
  statusEle.branches.innerText = Branches.length;
  statusEle.tiles.innerText = Branches.reduce((a, b) => a + b.length-1, 0);
  statusEle.tickRate.innerText = (1000/(tickRecords.reduce((a, b) => a + b, 0)/tickRecords.length)).toFixed(1) + "/s";

  // Set canvas variables
  canvas.width = canvasContainer.offsetWidth * (1 - 0.025 * 3);
  canvas.height = canvasContainer.offsetHeight * (1 - 0.025 * 4);
  canvasContainer.setAttribute("w", (canvas.width/screenScale).toFixed(1));
  canvasContainer.setAttribute("h", (canvas.height/screenScale).toFixed(1));
  ctx.strokeStyle = "#debb7b";
  ctx.fillStyle = "#debb7b";
  ctx.lineWidth = screenScale/2;

  // Add Tiles
  const diff = [
    drawingPos[0] - lastDrawingPos[0],
    drawingPos[1] - lastDrawingPos[1]
  ];
  if (
    drawing &&
    Math.sqrt(diff[0]**2 + diff[1]**2) >= 1
  ) {
    const length = Math.floor(Math.sqrt(diff[0]**2 + diff[1]**2));
    const deg = (Math.atan2(diff[1], diff[0])/Math.PI*180 + 720 + 90)%360;
    Branches[drawingBranch].push(...new Array(length).fill(deg));
    lastDrawingPos[0] += Math.sin(deg/180*Math.PI) * length;
    lastDrawingPos[1] -= Math.cos(deg/180*Math.PI) * length
  }

  // Draw Tiles on canvas
  TilePos = [];
  for (let i = 0; i < Branches.length; i++) {
    const Branch = Branches[i];
    TilePos.push([]);
    const Pos = [...Branch[0]].map(e => e*screenScale);
    for (let j = 1; j < Branch.length; j++) {
      const curDeg = Branch[j];
      const nextDeg = Branch[j + 1] ?? curDeg;
      TilePos[i].push(Pos.map(e => e/screenScale));
      Pos[0] += Math.sin(curDeg/180*Math.PI) * screenScale;
      Pos[1] -= Math.cos(curDeg/180*Math.PI) * screenScale;


      const startPos = [
        Pos[0] - screenPos[0] + canvas.offsetWidth/2,
        Pos[1] - screenPos[1] + canvas.offsetHeight/2
      ];
      const backPos = [
        startPos[0] - Math.sin(curDeg/180*Math.PI) * screenScale / 2.1,
        startPos[1] + Math.cos(curDeg/180*Math.PI) * screenScale / 2.1
      ]
      const forwardPos = [
        startPos[0] + Math.sin(nextDeg/180*Math.PI) * screenScale / 2.1,
        startPos[1] - Math.cos(nextDeg/180*Math.PI) * screenScale / 2.1
      ]
      ctx.beginPath();
      ctx.moveTo(...startPos);
      ctx.lineTo(...backPos);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(...startPos);
      ctx.lineTo(...forwardPos);
      ctx.stroke();

      if (curDeg % 90 !== 0 || nextDeg % 90 !== 0) {
        ctx.arc(...startPos, screenScale/4, 0, Math.PI * 2);
      } else {
        ctx.rect(
          startPos[0] - screenScale/4,
          startPos[1] - screenScale/4,
          screenScale/2,
          screenScale/2
        );
      }
      ctx.fill();
    }
  }

  requestAnimationFrame(tick);
}
// Start Loop
requestAnimationFrame(tick);

/**
 * Events
 */
canvas.addEventListener("wheel", e => {
  screenScale *= e.deltaY < 0 ? 1.05 : 1/1.05;
  screenScale = Math.max(1, Math.min(300, screenScale));
});
canvas.addEventListener("mousedown", _ => {
  drawing = true;
  drawingBranch = Branches.length;
  lastDrawingPos = [...drawingPos];
  Branches.push([[...drawingPos], 90]);
  BranchBin.splice(0);
});
document.addEventListener("mouseup", _ => {
  drawing = false;
  drawingBranch = null;
});
canvas.addEventListener("mousemove", e => {
  const canvasPos = canvas.getBoundingClientRect();
  drawingPos = [
    e.clientX - canvasPos.left + screenPos[0] - canvas.offsetWidth / 2 - screenScale,
    e.clientY - canvasPos.top + screenPos[1] - canvas.offsetHeight / 2
  ].map(e => e/screenScale);
});
document.addEventListener("keydown", e => {
  const dL = screenScale/5;

  switch (e.key) {
    case "ArrowUp":
      screenPos[1] -= dL;
      break;
    case "ArrowDown":
      screenPos[1] += dL;
      break;
    case "ArrowLeft":
      screenPos[0] -= dL;
      break;
    case "ArrowRight":
      screenPos[0] += dL;
      break;
    case "z":
      if (e.ctrlKey) BranchBin.push(...Branches.splice(-1, 1));
      break;
    case "y":
      if (e.ctrlKey) Branches.push(...BranchBin.splice(0, 1));
      break;
    case "p":
      exportMap();
      break;
  }
});

/**
 * Export Function
 */
function exportMap() {
  const data = {
    "angleData": Branches.map(e => e.slice(1).map(e => (720+90-e)%360)).flat(), 
    "settings": {
      "version": 5, 
      "artist": "작곡가", 
      "specialArtistType": "None", 
      "artistPermission": "", 
      "song": "곡", 
      "author": "만든이", 
      "separateCountdownTime": "Enabled", 
      "previewImage": "", 
      "previewIcon": "", 
      "previewIconColor": "003f52", 
      "previewSongStart": 0, 
      "previewSongDuration": 10, 
      "seizureWarning": "Disabled", 
      "levelDesc": "레벨에 대해 말해보세요!", 
      "levelTags": "", 
      "artistLinks": "", 
      "difficulty": 1,
      "songFilename": "", 
      "bpm": 100, 
      "volume": 100, 
      "offset": 0, 
      "pitch": 100, 
      "hitsound": "Kick", 
      "hitsoundVolume": 100, 
      "countdownTicks": 4,
      "trackColorType": "Single", 
      "trackColor": "debb7b", 
      "secondaryTrackColor": "ffffff", 
      "trackColorAnimDuration": 2, 
      "trackColorPulse": "None", 
      "trackPulseLength": 10, 
      "trackStyle": "Standard", 
      "trackAnimation": "None", 
      "beatsAhead": 3, 
      "trackDisappearAnimation": "None", 
      "beatsBehind": 4,
      "backgroundColor": "000000", 
      "showDefaultBGIfNoImage": "Enabled", 
      "bgImage": "", 
      "bgImageColor": "ffffff", 
      "parallax": [100, 100], 
      "bgDisplayMode": "FitToScreen", 
      "lockRot": "Disabled", 
      "loopBG": "Disabled", 
      "unscaledSize": 100,
      "relativeTo": "Player", 
      "position": [0, 0], 
      "rotation": 0, 
      "zoom": 100,
      "bgVideo": "", 
      "loopVideo": "Disabled", 
      "vidOffset": 0, 
      "floorIconOutlines": "Disabled", 
      "stickToFloors": "Disabled", 
      "planetEase": "Linear", 
      "planetEaseParts": 1,
      "legacyFlash": false ,
      "legacySpriteTiles": false 
    },
    "actions": []
  };

  let tileCur = 0;
  for (let i = 1; i < Branches.length; i++) {
    tileCur += TilePos[i-1].length;
    const lastTile = TilePos[i-1].slice(-1)[0];
    const startTile = TilePos[i][0];
    const lastTileDeg = Branches[i-1].slice(-1)[0];
    const diff = [
      startTile[0] - lastTile[0] - Math.sin(lastTileDeg/180*Math.PI),
      -(startTile[1] - lastTile[1] + Math.cos(lastTileDeg/180*Math.PI))
    ];
    data.actions.push({
      "floor": tileCur+1,
      "eventType": "PositionTrack",
      "positionOffset": diff,
      "editorOnly": "Disabled"
    });
  }

  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
  pom.setAttribute('download', `ADOFAI_Paintbrush_${new Date().getTime()}.adofai`);
  if (document.createEvent) {
    var event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    pom.dispatchEvent(event);
  } else {
    pom.click();
  }
}
