const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

const PLATFORM_X = 170;
const FINAL_CROSSING_SECONDS = 3.2;
const CABLE_POINTS = [[108, 291], [170, 291], [293, 256], [455, 238],
  [640, 218], [785, 202]];
const STAGES = [
  { city: 'SANTIAGO', subtitle: 'CANAL SAN CARLOS → HUECHURABA', goal: 5,
    seconds: 40, speed: 245, leftChance: 0, track: 0, width: 26, center: 246, swing: 0, rate: 0, sky: 0x0e182d },
  { city: 'CIUDAD DE MÉXICO', subtitle: 'ANDÉN EN MOVIMIENTO', goal: 5,
    seconds: 45, speed: 270, leftChance: 0.35, track: 1, width: 22, center: 327, swing: 83, rate: 1.4, sky: 0x291b38 },
  { city: 'BUENOS AIRES', subtitle: 'RUMBO AL OBELISCO', goal: 5,
    seconds: 45, speed: 280, leftChance: 0.5, track: 3, width: 22, center: 350, swing: 55, rate: 1.3, sky: 0x29233d },
  { city: 'BOGOTÁ', subtitle: 'ASCENSO A MONSERRATE', goal: 5,
    seconds: 50, speed: 290, leftChance: 0.5, track: 4, width: 21, center: 335, swing: 67, rate: 1.5, sky: 0x1c393b },
  { city: 'CARACAS', subtitle: 'CRUCE SOBRE EL ÁVILA', goal: 5,
    seconds: 50, speed: 300, leftChance: 0.5, track: 5, width: 20, center: 336, swing: 86, rate: 1.5, sky: 0x332742 },
  { city: 'SAN FRANCISCO', subtitle: 'GOLDEN GATE · 3 CABINAS SEGUIDAS', goal: 3,
    seconds: 50, speed: 305, leftChance: 0.5, track: 2, width: 19, center: 330, swing: 95, rate: 1.2, sky: 0x163042 }
];
const FINAL_STAGE_INDEX = STAGES.length - 1;
const EVENT_NAME = 'PLATANUS HACK 26';
const EXPRESS = { ...STAGES[FINAL_STAGE_INDEX], seconds: 45, width: 24, rate: 1.4 };
const RECORD_KEYS = {
  gira: 'cabina-a-tiempo.gira.record.v1',
  express: 'cabina-a-tiempo.express.record.v1'
};

const GENERATOR = { center: 370, width: 36, speed: 165, restoreSeconds: 1.2 };
const INCIDENTS = [
  { trigger: 3, leftChance: 0, hits: 5, title: 'CORTE DE LUZ', task: 'Sincroniza el generador de emergencia.',
    terminal: '> CORTE DE LUZ', action: 'ACTIVA GENERADOR', done: 'VOLVIENDO LA LUZ' },
  { trigger: 2, leftChance: 0.35, hits: 5, title: 'DÍA DE MUERTOS', task: 'Envía cinco cabinas con flores a la ofrenda.',
    terminal: '> OFRENDA', action: 'ENVÍA LAS FLORES', done: 'OFRENDA LISTA' },
  null, null, null,
  { trigger: 1, leftChance: 0.5, hits: 5, title: 'OVNI EN EL GOLDEN GATE', task: 'Espera la ventana verde y cruza el haz.',
    terminal: '> OVNI DETECTADO', action: 'CRUZA EL HAZ', done: 'CABLE LIBRE' }
];
const SOUNDS = {
  dispatch: [{ wave: 'triangle', from: 440, to: 520, delay: 0, length: 0.115, volume: 0.065 }],
  perfect: [{ wave: 'sine', from: 659, to: 659, delay: 0, length: 0.13, volume: 0.085 },
    { wave: 'triangle', from: 988, to: 988, delay: 0.085, length: 0.19, volume: 0.06 }],
  blocked: [{ wave: 'square', from: 157, to: 77, delay: 0, length: 0.09, volume: 0.038 },
    { wave: 'triangle', from: 95, to: 60, delay: 0.045, length: 0.11, volume: 0.08 }],
  generator: [{ wave: 'triangle', from: 43, to: 103, delay: 0, length: 1.2, volume: 0.13 },
    { wave: 'triangle', from: 72, to: 113, delay: 0.15, length: 0.96, volume: 0.06 },
    { wave: 'sine', from: 440, to: 523, delay: 0.99, length: 0.19, volume: 0.075 }]
};
const POINTS = { perfect: 150, onTime: 100, blocked: -50, missed: -20 };
const OPERATOR_NAMES = ['VOLANTÍN', 'ÁNGEL', 'OBELISCO', 'MONSERRATE', 'ÁVILA', 'GOLDEN'];
const keys = Object.fromEntries(Object.entries(CABINET_KEYS).flatMap(
  ([code, names]) => names.map((name) => [name.toLowerCase(), code])
));

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-root',
  backgroundColor: '#0e182d',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: { create, update }
});

function newRound() {
  return { elapsed: 0, windClock: 0, marker: 763, origin: 763, direction: -1, passengers: 0, combo: 0,
    skipped: 0, consecutiveMisses: 0, perfects: 0, blocks: 0, score: 0, pause: 0, power: 'normal', powerTime: 0, generatorMiss: 0, incidentHits: 0, incident: null, feedback: '', feedbackTime: 0, trips: [] };
}

function create() {
  this.phase = 'ready';
  this.operator = '';
  this.express = false;
  this.expressUnlocked = false;
  this.records = { gira: null, express: null };
  this.recordWrites = loadRecords(this);
  this.round = newRound();
  this.stageIndex = 0;
  this.total = 0;
  this.completed = { perfects: 0, blocks: 0, score: 0, elapsed: 0 };
  this.fixed = this.add.graphics();
  drawStage(this);
  this.scenery = this.add.graphics().setDepth(0.5);
  this.sceneryTime = 0;

  const label = (x, y, value, size, color = '#f6eadb') =>
    this.add.text(x, y, value, { fontFamily: 'monospace', fontSize: size, color });
  label(36, 24, 'CABINA A TIEMPO', '42px');
  label(762, 30, EVENT_NAME, '15px', '#ffdc97').setOrigin(1, 0);
  label(762, 51, 'ARCADE CHALLENGE', '11px', '#8ccdc3').setOrigin(1, 0);
  this.route = label(38, 79, '', '19px', '#77e9c9');
  this.hud = label(38, 115, '', '19px');
  label(194, 470, 'SINCRONÍA DEL CABLE', '12px', '#a7c3ce').setDepth(2);
  label(319, 535, 'ESTADO DE LÍNEA', '10px', '#8fb8c6').setDepth(2);
  this.statusText = label(319, 552, '', '12px', '#9ef4cb').setDepth(2);
  this.startText = label(244, 554, '', '11px').setOrigin(0.5).setDepth(2);
  label(547, 549, 'DESPACHAR', '15px', '#fff1dc').setOrigin(0.5).setDepth(2);
  label(547, 567, 'B1 / U', '11px', '#fff1dc').setOrigin(0.5).setDepth(2);
  this.consoleStart = this.add.zone(244, 554, 100, 40).setInteractive({ useHandCursor: true })
    .on('pointerdown', () => startStage(this));
  this.add.zone(547, 555, 112, 48).setInteractive({ useHandCursor: true })
    .on('pointerdown', () => pressDispatch(this));
  label(45, 470, 'CÓDIGO DE LÍNEA', '10px', '#a7c3ce').setDepth(2);
  this.codeScreen = label(46, 492, '', '11px', '#79d9a4').setDepth(2);
  label(637, 470, 'MANDOS', '10px', '#a7c3ce').setDepth(2);
  label(688, 553, 'AUX', '9px', '#a7c3ce').setDepth(2);
  this.panel = this.add.graphics().setDepth(3);
  this.panelEvent = label(400, 449, EVENT_NAME + '  /  LATAM TOUR', '10px', '#8ccdc3')
    .setOrigin(0.5).setDepth(4).setVisible(false);
  this.panelRoute = label(400, 227, '', '11px', '#8ccdc3').setOrigin(0.5).setDepth(4).setVisible(false);
  this.panelClose = label(400, 423, 'CERRAR  /  B3 · O · ESC', '14px', '#e0edf0')
    .setOrigin(0.5).setPadding(10).setBackgroundColor('#273c50').setDepth(4)
    .setInteractive({ useHandCursor: true }).setVisible(false)
    .on('pointerdown', () => closeResults(this));
  this.panelHeading = label(400, 156, '', '14px', '#8ccdc3').setOrigin(0.5).setDepth(4);
  this.panelTitle = label(400, 199, '', '32px', '#ffdc97').setOrigin(0.5).setDepth(4);
  this.panelDetail = label(400, 252, '', '19px').setOrigin(0.5).setDepth(4);
  this.panelStats = label(400, 295, '', '14px', '#a7f2d0').setOrigin(0.5).setDepth(4);
  this.panelRecord = label(400, 326, '', '13px', '#c1d5e0').setOrigin(0.5).setDepth(4);
  this.panelStart = label(400, 378, '', '16px', '#ecfffa')
    .setOrigin(0.5).setPadding(12).setBackgroundColor('#294e58').setDepth(4)
    .setInteractive({ useHandCursor: true }).setVisible(false)
    .on('pointerdown', () => confirmPanel(this));
  this.expressButton = label(400, 425, '', '15px', '#ffdc97')
    .setOrigin(0.5).setPadding(10).setBackgroundColor('#273c50').setDepth(4)
    .setInteractive({ useHandCursor: true }).setVisible(false)
    .on('pointerdown', () => startExpress(this));
  this.tutorial = label(600, 474, '', '11px', '#ffdc97').setOrigin(1, 0).setDepth(2);
  this.dynamic = this.add.graphics().setDepth(1);

  const keydown = (event) => {
    const code = keys[event.key.toLowerCase()];
    if (event.repeat) return;
    if (code === 'START1') confirmPanel(this);
    if (code === 'P1_3' || event.key === 'Escape') closeResults(this);
    if (code === 'P1_2') startExpress(this);
    if (code === 'P1_1') pressDispatch(this);
  };
  window.addEventListener('keydown', keydown);
  this.events.once('shutdown', () => {
    window.removeEventListener('keydown', keydown);
    this.soundContext?.close().catch(() => {});
  });
}

function assignOperator(scene) {
  const name = OPERATOR_NAMES[Math.floor(Math.random() * OPERATOR_NAMES.length)];
  const number = String(1 + Math.floor(Math.random() * 99)).padStart(2, '0');
  scene.operator = `${name}-${number}`;
}

function confirmPanel(scene) {
  if (scene.round.power === 'intro') openIncident(scene.round);
  else if (scene.express && scene.phase === 'finished') startExpress(scene);
  else startStage(scene);
}

function closeResults(scene) {
  if (scene.phase !== 'won' && scene.phase !== 'finished') return;
  scene.phase = 'ready';
  scene.express = false;
  scene.stageIndex = 0;
  scene.operator = '';
  scene.total = 0;
  scene.completed = { perfects: 0, blocks: 0, score: 0, elapsed: 0 };
  scene.round = newRound();
  scene.buttonPulse = 0;
  drawStage(scene);
}

function startStage(scene) {
  if (scene.phase === 'playing' || scene.phase === 'crossing') return;
  scene.express = false;
  if (scene.phase === 'cleared') {
    scene.stageIndex++;
  } else if (scene.phase !== 'ready') {
    scene.stageIndex = 0;
    scene.total = 0;
    scene.completed = { perfects: 0, blocks: 0, score: 0, elapsed: 0 };
  }
  if (scene.phase !== 'cleared') assignOperator(scene);
  scene.round = newRound();
  launchForStage(scene.round, scene.express ? EXPRESS : STAGES[scene.stageIndex]);
  scene.phase = 'playing';
  scene.buttonPulse = 0;
  drawStage(scene);
}

function canStartExpress(scene) {
  return scene.expressUnlocked && ['ready', 'won', 'finished'].includes(scene.phase);
}

function startExpress(scene) {
  if (!canStartExpress(scene)) return;
  scene.express = true;
  scene.stageIndex = FINAL_STAGE_INDEX;
  assignOperator(scene);
  scene.round = newRound();
  launchForStage(scene.round, scene.express ? EXPRESS : STAGES[scene.stageIndex]);
  scene.phase = 'playing';
  scene.buttonPulse = 0;
  drawStage(scene);
}

function validRecord(value) {
  return value && Number.isSafeInteger(value.score)
    && Number.isSafeInteger(value.blocks) && value.blocks >= 0
    && typeof value.operator === 'string'
    && OPERATOR_NAMES.includes(value.operator.slice(0, -3))
    && /-(0[1-9]|[1-9][0-9])$/.test(value.operator);
}

async function loadRecords(scene) {
  const storage = window.platanusArcadeStorage;
  if (!storage) return;
  await Promise.all(Object.entries(RECORD_KEYS).map(async ([mode, key]) => {
    try {
      const result = await storage.get(key);
      if (result?.found && validRecord(result.value)) {
        scene.records[mode] = result.value;
        if (mode === 'gira') scene.expressUnlocked = true;
      }
    } catch {
      // Keep the session playable if the arcade storage bridge is unavailable.
    }
  }));
}

function submitRecord(scene, mode, score, blocks) {
  const round = scene.round;
  const candidate = { score, blocks, operator: scene.operator };
  scene.recordWrites = scene.recordWrites.then(async () => {
    const best = scene.records[mode];
    if (best && (score < best.score || (score === best.score && blocks >= best.blocks))) return;
    scene.records[mode] = candidate;
    round.newRecord = true;
    try {
      await window.platanusArcadeStorage?.set(RECORD_KEYS[mode], candidate);
    } catch {
      // The record remains available in this session if saving fails.
    }
  });
}

function pressDispatch(scene) {
  const round = scene.round;
  if (scene.phase !== 'playing' || round.pause > 0 || round.generatorMiss > 0 || round.power === 'restoring') return;
  if (round.power === 'intro') {
    openIncident(round);
    return;
  }
  scene.buttonPulse = 0.16;
  if (round.power === 'offline') {
    if (Math.abs(round.marker - GENERATOR.center) <= activationWidth(round, GENERATOR.width)) {
      round.consecutiveMisses = 0;
      round.incidentHits++;
      if (scene.stageIndex === 1) round.trips.push(0);
      if (round.incidentHits >= round.incident.hits) {
        round.power = 'restoring';
        round.powerTime = GENERATOR.restoreSeconds;
      } else {
        launchMarker(round, round.incident.leftChance);
      }
      const restoredPower = round.power === 'restoring' && scene.stageIndex === 0;
      playCue(scene, restoredPower ? 'generator' : 'dispatch');
    } else {
      resetGenerator(round);
      playCue(scene, 'blocked');
    }
    return;
  }

  const cue = dispatch(round, scene.express ? EXPRESS : STAGES[scene.stageIndex]);
  playCue(scene, cue);
  if (cue !== 'blocked') {
    const incident = INCIDENTS[scene.stageIndex];
    if (incident && !scene.express && round.power === 'normal' && round.passengers === incident.trigger * 10) {
      round.incident = incident;
      round.consecutiveMisses = 0;
      round.power = 'intro';
      round.feedbackTime = 0;
    }
  }
}

function openIncident(round) {
  round.power = 'offline';
  launchMarker(round, round.incident.leftChance);
}

function resetGenerator(round) {
  round.consecutiveMisses++;
  round.incidentHits = Math.max(0, round.incidentHits - 1);
  launchMarker(round, round.incident.leftChance);
  round.generatorMiss = 0.55;
}

function advanceGenerator(round, stage, seconds) {
  if (round.power === 'restoring') {
    round.powerTime -= seconds;
    if (round.powerTime <= 0) {
      round.power = 'restored';
      launchForStage(round, stage);
      round.feedbackTime = 0;
    }
    return;
  }
  if (round.generatorMiss > 0) {
    round.generatorMiss -= seconds;
    return;
  }
  round.marker += round.direction * GENERATOR.speed * trackSpeed(stage, round) * seconds;
  if (passedWindow(round, GENERATOR.center, activationWidth(round, GENERATOR.width))) resetGenerator(round);
}

function drawStage(scene) {
  const art = scene.fixed;
  art.clear();
  art.fillStyle(STAGES[scene.stageIndex].sky).fillRect(0, 0, 800, 600);
  if (scene.stageIndex === 0) drawSantiago(art);
  if (scene.stageIndex === 1) drawMexico(art);
  if (scene.stageIndex === FINAL_STAGE_INDEX) drawSanFrancisco(art);
  if (scene.stageIndex >= 2 && scene.stageIndex < FINAL_STAGE_INDEX) drawTourCity(art, scene.stageIndex);

  art.fillStyle(0x152232).fillRect(52, 331, 230, 115);
  art.fillStyle(0x41596a).fillRect(52, 326, 230, 8);
  art.fillStyle(0x75dfbe).fillRect(56, 428, 220, 5);
  art.fillStyle(0x263b4a).fillRect(66, 346, 13, 76);
  art.fillStyle(0x263b4a).fillRect(250, 346, 13, 76);
  drawCable(art);
  for (const [x, width] of [[34, 136], [178, 444], [630, 136]]) {
    art.fillStyle(0x080f1e).fillRoundedRect(x, 460, width, 126, 7);
    art.fillStyle(0x35495c).fillRoundedRect(x + 3, 461, width - 6, 120, 6);
    art.fillStyle(0x202e42).fillRect(x + 7, 466, width - 14, 110);
  }
  art.fillStyle(0x0b1523).fillRect(190, 486, 420, 37);
  art.fillStyle(0x0b1924).fillRect(304, 531, 180, 44);
  art.fillStyle(0x486273).fillRect(304, 531, 180, 2);

  art.fillStyle(0x446174).fillRect(40, 485, 124, 82);
  art.fillStyle(0x0a1b22).fillRect(43, 488, 118, 76);
  art.fillStyle(0x152738).fillRect(637, 489, 122, 78);
  for (const x of [647, 674]) {
    art.fillStyle(0x091420).fillRect(x, 501, 10, 59);
    art.fillStyle(0x536677).fillRect(x + 4, 503, 2, 55);
  }
  for (const x of [39, 164, 183, 612, 635, 757]) {
    art.fillStyle(0x8093a5).fillRect(x, 570, 4, 4);
  }
}

function cableHeight(x) {
  for (let i = 1; i < CABLE_POINTS.length; i++) {
    const [rightX, rightY] = CABLE_POINTS[i];
    if (x <= rightX) {
      const [leftX, leftY] = CABLE_POINTS[i - 1];
      return leftY + (rightY - leftY) * ((x - leftX) / (rightX - leftX));
    }
  }
  return CABLE_POINTS[CABLE_POINTS.length - 1][1];
}

function drawCable(art) {
  for (const [x, footing] of [[108, 331], [293, 447], [455, 425], [640, 414], [785, 436]]) {
    const head = Math.round(cableHeight(x));
    art.fillStyle(0x354c60).fillRect(x - 4, head, 9, footing - head);
    art.fillStyle(0x5d788a).fillRect(x - 4, head + 7, 3, footing - head - 7);
    art.fillStyle(0x6b8999).fillRect(x - 11, head - 3, 23, 7);
    art.fillStyle(0x91aab6).fillRect(x - 7, head + 5, 15, 4);
  }
  art.lineStyle(3, 0xc0cbd8);
  for (let i = 1; i < CABLE_POINTS.length; i++) {
    art.lineBetween(...CABLE_POINTS[i - 1], ...CABLE_POINTS[i]);
  }
}

function drawScenery(scene) {
  const art = scene.scenery;
  const time = scene.sceneryTime;
  art.clear();
  if (scene.stageIndex === 0) {
    // Volantines over Santiago.
    for (const [origin, offset, color] of [[343, 0, 0xe6ae6f], [550, 2.1, 0x85c5c3]]) {
      const sway = time * 0.85 + offset;
      const x = Math.round(origin + Math.sin(sway) * 23);
      const y = Math.round(176 + Math.cos(sway * 1.15) * 13);
      art.fillStyle(color, 0.84);
      art.fillRect(x - 2, y - 8, 4, 16);
      art.fillRect(x - 6, y - 4, 12, 8);
      art.fillStyle(0xdac4a3, 0.65);
      for (let i = 1; i <= 4; i++) {
        art.fillRect(x + Math.round(Math.sin(sway - i * 0.5) * i * 2), y + 6 + i * 4, 3, 4);
      }
    }
  } else if (scene.stageIndex === 1) {
    // Papel picado across a street below the cable.
    art.lineStyle(1, 0xcd9b97, 0.65).lineBetween(329, 330, 566, 318);
    const colors = [0xd586b4, 0xf3bd73, 0x8ac9b5, 0xcc9de4];
    for (let i = 0; i < 10; i++) {
      const x = 338 + i * 22;
      const y = 329 - Math.floor(i * 1.1);
      const length = 9 + Math.round(Math.sin(time * 4 + i * 0.8) * 2);
      art.fillStyle(colors[i % colors.length], 0.82).fillRect(x, y, 13, length);
      art.fillStyle(0x634465).fillRect(x + 3, y + 2, 2, 2).fillRect(x + 8, y + 3, 2, 2);
    }
  } else if (scene.stageIndex === FINAL_STAGE_INDEX) {
    // Ferry and wake in the San Francisco Bay.
    const x = 287 + Math.floor((time * 32) % 548);
    art.fillStyle(0x76a5ae, 0.48).fillRect(x - 26, 443, 22, 2);
    art.fillRect(x - 13, 449, 31, 2);
    art.fillStyle(0xcbc7af).fillRect(x + 5, 432, 24, 7);
    art.fillStyle(0x526d7b).fillRect(x + 12, 434, 12, 2);
    art.fillStyle(0x934c4a).fillRect(x, 439, 35, 5);
    art.fillStyle(0xb5d0d5, 0.17);
    for (let i = 0; i < 3; i++) {
      const fog = 343 + (time * 13 + i * 151) % 353;
      art.fillRect(fog, 371 + i * 9, 62, 3);
    }
  }
  if (scene.stageIndex >= 2 && scene.stageIndex < FINAL_STAGE_INDEX) {
    const x = 295 + Math.floor((time * 43) % 490);
    if (scene.stageIndex === 2) {
      art.fillStyle(0x90c4e0).fillRect(x, 423, 25, 8);
      art.fillStyle(0xffd5a1).fillRect(x + 20, 425, 5, 3);
    } else {
      for (let i = 0; i < 3; i++) {
        const y = 180 + i * 9 + Math.round(Math.sin(time * 3 + i) * 4);
        art.fillStyle(0xced9db, 0.6).fillRect(x - i * 14, y, 7, 2);
        art.fillRect(x - i * 14 + 3, y + 2, 3, 2);
      }
    }
  }
}

function pixelRidge(art, heights, color, floor) {
  const width = 800 / heights.length;
  art.fillStyle(color);
  heights.forEach((y, index) => art.fillRect(index * width, y, width, floor - y));
}

function drawTourCity(art, index) {
  if (index === 2) {
    art.fillStyle(0x54435e).fillRect(0, 381, 800, 70);
    for (let i = 0; i < 24; i++) {
      const height = 18 + (i * 17 % 53);
      art.fillStyle(0x372f4a).fillRect(i * 34, 411 - height, 29, height);
      art.fillStyle(0xc79e7b).fillRect(i * 34 + 10, 420 - height, 5, 4);
    }
    art.fillStyle(0xded5c8).fillRect(493, 273, 20, 149);
    art.fillStyle(0xded5c8).fillTriangle(493, 273, 503, 247, 513, 273);
    art.fillStyle(0xa497b2).fillRect(509, 275, 4, 147);
    art.fillStyle(0x5182a0).fillRect(280, 435, 505, 3);
  } else if (index === 3) {
    pixelRidge(art, [392, 373, 366, 354, 333, 326, 298, 280, 265, 248,
      237, 242, 264, 278, 300, 319, 335, 346, 366, 376], 0x345a4b, 447);
    art.fillStyle(0xd9d8bd).fillRect(414, 219, 58, 25);
    art.fillStyle(0xa88479).fillRect(414, 216, 58, 5);
    art.fillStyle(0xe4dec4).fillRect(435, 201, 16, 27);
    art.fillStyle(0x9b756f).fillTriangle(432, 202, 443, 191, 454, 202);
    art.fillStyle(0xe4dec4).fillRect(442, 185, 2, 8).fillRect(438, 187, 10, 2);
    for (let i = 0; i < 24; i++) {
      const y = 429 - (i * 13 % 30);
      art.fillStyle(0x9c6c60).fillRect(i * 34, y, 23, 447 - y);
    }
  } else {
    art.fillStyle(0xe5a77c).fillCircle(645, 190, 32);
    pixelRidge(art, [364, 355, 344, 321, 319, 299, 292, 269, 257, 238,
      222, 226, 237, 255, 269, 286, 312, 319, 339, 354], 0x3c5457, 448);
    pixelRidge(art, [405, 390, 378, 384, 372, 363, 353, 337, 321, 329,
      345, 351, 363, 370, 376, 381, 390, 398, 405, 416], 0x2c444a, 448);
    for (let i = 0; i < 24; i++) {
      const y = 438 - (i * 19 % 45);
      art.fillStyle(0x574760).fillRect(i * 34, y, 27, 448 - y);
      art.fillStyle(0xe3a47e).fillRect(i * 34 + 7, y + 5, 4, 4);
    }
  }
}

function drawSantiago(art) {
  pixelRidge(art, [300, 291, 278, 251, 225, 207, 223, 250, 228, 190,
    214, 241, 216, 231, 269, 260, 281, 295, 286, 300], 0x324361, 447);
  pixelRidge(art, [390, 369, 357, 341, 326, 322, 337, 357, 370, 383,
    369, 356, 354, 371, 385, 395, 407, 413, 420, 425], 0x253b4b, 447);
  for (let i = 0; i < 29; i++) {
    const x = i * 28;
    const height = 19 + (i * 23 % 57);
    art.fillStyle(0x172a3d).fillRect(x, 451 - height, 23, height);
    art.fillStyle(0xb58b62).fillRect(x + 7, 460 - height, 4, 4);
  }
  art.fillStyle(0x426580).fillRect(540, 272, 41, 169);
  art.fillStyle(0x75a7bd).fillRect(546, 259, 30, 13);
  art.fillStyle(0x9ed2d8).fillRect(546, 272, 5, 164);
  for (let y = 285; y < 431; y += 12) {
    art.fillStyle(0x568097).fillRect(553, y, 25, 3);
  }
  art.fillStyle(0xd2bda1).fillRect(192, 299, 5, 23);
  art.fillRect(186, 305, 17, 4);
}

function drawMexico(art) {
  art.fillStyle(0xe49879).fillCircle(655, 193, 34);
  pixelRidge(art, [392, 380, 384, 371, 365, 358, 347, 352, 337, 310,
    293, 276, 290, 312, 329, 341, 357, 357, 368, 374], 0x634465, 451);
  art.fillStyle(0x9d6f82).fillRect(430, 291, 45, 7);
  art.fillStyle(0x50344e).fillRect(0, 411, 800, 40);
  for (const [x, width, height, color] of [
    [274, 69, 69, 0x895377], [352, 83, 48, 0xa96d6a],
    [510, 71, 59, 0x925d72], [654, 74, 78, 0xb47771],
    [735, 52, 45, 0x855772]
  ]) {
    art.fillStyle(color).fillRect(x, 430 - height, width, height);
    for (let window = x + 9; window < x + width - 8; window += 14) {
      art.fillStyle(0xffc882).fillRect(window, 444 - height, 5, 7);
    }
  }
  art.fillStyle(0xd5a37a).fillRect(603, 294, 12, 136);
  art.fillStyle(0xf5c37a).fillRect(608, 276, 6, 18);
  art.fillRect(598, 281, 15, 5);
  art.fillRect(604, 273, 7, 6);
  art.fillStyle(0xa7756c).fillRect(585, 419, 48, 12);
}

function drawSanFrancisco(art) {
  pixelRidge(art, [359, 350, 342, 336, 342, 350, 359, 369, 364, 351,
    340, 333, 347, 350, 358, 342, 334, 351, 363, 369], 0x365566, 451);
  art.fillStyle(0x244c65).fillRect(0, 365, 800, 88);
  for (let i = 0; i < 32; i++) {
    art.fillStyle(0x3d6a79).fillRect(i * 25 + 4, 380 + (i * 19 % 65), 14, 2);
  }
  const bridge = 0xe27659;
  art.fillStyle(bridge).fillRect(284, 388, 509, 7);
  art.fillRect(284, 399, 509, 3);
  for (const tower of [422, 654]) {
    art.fillRect(tower, 302, 9, 125);
    art.fillRect(tower + 23, 302, 9, 125);
    art.fillRect(tower, 339, 32, 5);
    art.fillRect(tower, 361, 32, 5);
  }
  const cable = [[287, 386], [343, 368], [386, 341], [438, 304], [490, 354],
    [550, 372], [605, 355], [670, 304], [720, 343], [789, 386]];
  art.lineStyle(3, bridge);
  for (let i = 1; i < cable.length; i++) {
    art.lineBetween(...cable[i - 1], ...cable[i]);
  }
  art.fillStyle(0xc96453);
  for (const [x, y] of cable.slice(1, -1)) art.fillRect(x, y, 2, 388 - y);
}

function playCue(scene, cue) {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    const context = scene.soundContext ??= new Audio();
    if (context.state === 'suspended') context.resume().catch(() => {});
    const start = context.currentTime;
    for (const note of SOUNDS[cue]) {
      const time = start + note.delay;
      const end = time + note.length;
      const voice = context.createOscillator();
      const level = context.createGain();
      voice.type = note.wave;
      voice.frequency.setValueAtTime(note.from, time);
      voice.frequency.exponentialRampToValueAtTime(note.to, end);
      level.gain.setValueAtTime(0.0001, time);
      level.gain.exponentialRampToValueAtTime(note.volume, time + Math.min(0.025, note.length / 4));
      level.gain.exponentialRampToValueAtTime(0.0001, end);
      voice.connect(level).connect(context.destination);
      voice.onended = () => {
        voice.disconnect();
        level.disconnect();
      };
      voice.start(time);
      voice.stop(end);
    }
  } catch {
    // Audio is optional in the arcade iframe.
  }
}

function inGust(round) {
  return round.elapsed % 7 >= 4.8;
}

function targetAt(round, stage) {
  return stage.center + stage.swing * Math.sin(round.windClock);
}

function launchMarker(round, leftChance, fixed = false) {
  const fromLeft = !fixed && leftChance > 0 && Math.random() < leftChance;
  const origin = fixed ? 763
    : fromLeft ? 70 + Math.floor(Math.random() * 61)
    : 555 + Math.floor(Math.random() * 209);
  round.marker = origin;
  round.origin = origin;
  round.direction = fromLeft ? 1 : -1;
}

function launchForStage(round, stage) {
  launchMarker(round, stage.leftChance, needsTutorial(round, stage));
}

function passedWindow(round, target, width) {
  return (round.marker - target) * round.direction > width;
}

function activationWidth(round, width, stage) {
  return round.consecutiveMisses >= 3 && stage !== EXPRESS ? width + 12 : width;
}

function trackY(stage, x) {
  const t = Math.max(0, Math.min(1, (x - 196) / 407));
  if (stage.track === 1) return 496 + 16 * t;
  if (stage.track === 2) return 504 + 8 * Math.sin(t * Math.PI * 2);
  if (stage.track === 3) return 504 + 7 * Math.sin(t * Math.PI);
  if (stage.track === 4) return 512 - 17 * t + 3 * Math.sin(t * Math.PI * 2);
  if (stage.track === 5) return 504 + 7 * Math.sin(t * Math.PI * 3);
  return 505;
}

function trackSpeed(stage, round) {
  if (stage === EXPRESS) return 1;
  const x = 196 + (round.marker - 64) * 0.575;
  const rise = trackY(stage, x + round.direction * 8) - trackY(stage, x);
  return 1 + Math.max(-0.1, Math.min(0.1, rise * 0.085));
}

function dispatch(round, stage) {
  const error = round.marker - targetAt(round, stage);
  const perfect = Math.abs(error) <= 8;
  const inWindow = Math.abs(error) <= activationWidth(round, stage.width, stage);
  if (inWindow) {
    round.consecutiveMisses = 0;
    if (perfect) round.perfects++;
    round.score += perfect ? POINTS.perfect : POINTS.onTime;
    round.passengers += 10;
    round.combo++;
    round.trips.push(0);
    launchForStage(round, stage);
    round.feedback = perfect ? '¡PERFECTO! +10 pasajeros' : '¡A tiempo! +10 pasajeros';
  } else {
    round.combo = 0;
    round.skipped++;
    round.consecutiveMisses++;
    round.blocks++;
    round.score += POINTS.blocked;
    round.pause = 0.65;
    launchForStage(round, stage);
    round.feedback = 'Salida bloqueada · espera la marca';
  }
  round.feedbackTime = 0.85;
  return inWindow ? perfect ? 'perfect' : 'dispatch' : 'blocked';
}

function needsTutorial(round, stage) {
  return stage === STAGES[0] && round.passengers === 0;
}

function advance(round, stage, seconds) {
  round.elapsed += seconds;
  round.feedbackTime -= seconds;
  if (round.pause > 0) {
    round.pause -= seconds;
    return;
  }
  const gustMultiplier = (stage === STAGES[FINAL_STAGE_INDEX] || stage === EXPRESS) && inGust(round) ? 1.85 : 1;
  round.windClock += stage.rate * gustMultiplier * seconds;
  const learning = needsTutorial(round, stage);
  const speed = stage === EXPRESS ? 245 + 4.5 * round.elapsed
    : learning && round.marker < stage.center + 112 ? 105 : stage.speed;
  round.marker += round.direction * speed * trackSpeed(stage, round) * seconds;
  if (passedWindow(round, targetAt(round, stage), activationWidth(round, stage.width, stage))) {
    launchForStage(round, stage);
    round.combo = 0;
    round.skipped++;
    round.consecutiveMisses++;
    round.score += POINTS.missed;
    round.feedback = 'Espacio perdido · espera el siguiente';
    round.feedbackTime = 0.85;
  }
}

function drawCabin(art, x, y, scale, doorsOpen = false) {
  const pixel = (dx, dy, w, h, color) => {
    art.fillStyle(color).fillRect(
      Math.round(x + dx * scale), Math.round(y + dy * scale),
      Math.ceil(w * scale), Math.ceil(h * scale)
    );
  };
  pixel(-5, 0, 10, 5, 0xd6e4ea);
  pixel(-2, 4, 4, 15, 0x8ca8bb);
  pixel(-45, 16, 90, 57, 0x482d35);
  pixel(-39, 13, 78, 6, 0xffce84);
  pixel(-47, 22, 94, 43, 0xffa14f);
  pixel(-40, 65, 80, 8, 0xed733b);
  pixel(-37, 27, 74, 33, 0x16334b);

  const clothing = [0x76d9ce, 0xead17d, 0xbb9de6, 0x86afd7];
  const skin = [0xdca37c, 0xf1c59b, 0xad704f, 0xf3ccad];
  for (let i = 0; i < clothing.length; i++) {
    const seat = -33 + i * 17;
    const top = 36 - (i % 2) * 3;
    pixel(seat, top + 9, 12, 15, clothing[i]);
    pixel(seat + 2, top, 8, 9, skin[i]);
    pixel(seat + 2, top - 2, 7, 3, 0x352739);
  }

  if (doorsOpen) {
    pixel(-6, 28, 12, 39, 0x121f33);
    pixel(-11, 26, 4, 42, 0xffcb81);
    pixel(7, 26, 4, 42, 0xffcb81);
  } else {
    pixel(-2, 25, 4, 42, 0xffbe72);
  }
  pixel(-42, 67, 7, 3, 0xffe1a8);
  pixel(35, 67, 7, 3, 0xffe1a8);
}

function drawDepartures(art, round, crossing) {
  const newest = round.trips[round.trips.length - 1];
  if (!crossing && (newest === undefined || newest >= 0.95)) {
    drawCabin(art, PLATFORM_X, cableHeight(PLATFORM_X), 1.16, true);
  }

  round.trips.forEach((tripAge, index) => {
    const finalCabin = crossing && index === round.trips.length - 1;
    const age = finalCabin ? tripAge * 2.25 : tripAge;
    const launch = Math.min(age / 0.9, 1);
    const cruise = Math.max(0, age - 0.9);
    const x = Math.min(785, PLATFORM_X + launch * 123 + cruise * 80);
    const y = cableHeight(x);
    const scale = 1.16 - 0.48 * launch - Math.min(cruise * 0.027, 0.16);
    drawCabin(art, x, y, scale);
    if (age < 0.36) {
      const spread = age * 100;
      art.fillStyle(0xffdc97, 1 - age / 0.36);
      art.fillRect(x + 31 + spread, y + 26, 7, 4);
      art.fillRect(x + 37 + spread, y + 42, 5, 4);
      art.fillRect(x - 27 - spread, y + 53, 6, 4);
    }
  });
}

function drawWaitingPassengers(art, round, time) {
  const boarding = round.trips.at(-1);
  const boardingTime = 0.35;
  if (boarding !== undefined && boarding >= boardingTime && boarding < 0.95) return;
  const checkingTime = round.feedbackTime > 0 && !round.feedback.startsWith('¡');
  const step = boarding !== undefined && boarding < boardingTime ? boarding / boardingTime : 0;
  for (const [index, shirt] of [0x77d8bf, 0xe4b374, 0xbb9de6].entries()) {
    const x = Math.round(87 + index * 18 + step * (56 - index * 10));
    const y = 404 - Math.round(step * 25) + (Math.floor(time * 5 + index) % 2);
    art.fillStyle(0x0d1827).fillRect(x - 2, y + 19, 12, 3);
    art.fillStyle(0x30334a).fillRect(x, y + 14, 3, 6).fillRect(x + 5, y + 14, 3, 6);
    art.fillStyle(shirt).fillRect(x - 1, y + 5, 10, 10);
    art.fillStyle([0xe8ba98, 0xae7552, 0xd99672][index]).fillRect(x + 1, y, 6, 6);
    art.fillStyle(0x33243a).fillRect(x + 1, y - 2, 6, 2);
    if (checkingTime && index === 2) {
      art.fillStyle(shirt).fillRect(x + 7, y + 6, 6, 3);
      art.fillStyle(0xffdc97).fillRect(x + 11, y + 5, 3, 3);
    }
  }
}

function update(_time, delta) {
  const round = this.round;
  const stage = this.express ? EXPRESS : STAGES[this.stageIndex];
  const isFinal = this.stageIndex === FINAL_STAGE_INDEX;
  const seconds = Math.min(delta / 1000, 0.05);
  this.sceneryTime += seconds;
  drawScenery(this);
  const briefing = round.power === 'intro';
  const emergency = round.power === 'offline' || round.power === 'restoring';
  if ((!briefing && !emergency) || (this.stageIndex === 1 && !briefing)) {
    round.trips = round.trips.map((age) => age + seconds).filter((age) => age < 7);
  }
  if (this.phase === 'playing' && !briefing) {
    const progress = isFinal ? round.combo : round.passengers / 10;
    if (emergency) {
      advanceGenerator(round, stage, seconds);
    } else if (!this.express && progress >= stage.goal) {
      this.total += round.passengers;
      this.completed.perfects += round.perfects;
      this.completed.blocks += round.blocks;
      this.completed.score += round.score;
      this.completed.elapsed += round.elapsed;
      this.phase = isFinal ? 'crossing' : 'cleared';
    } else {
      advance(round, stage, seconds);
      if (round.elapsed >= stage.seconds) {
        this.phase = 'finished';
        if (this.express) submitRecord(this, 'express', round.score, round.blocks);
      }
    }
  }
  if (this.phase === 'crossing' && round.trips.at(-1) >= FINAL_CROSSING_SECONDS) {
    this.phase = 'won';
    this.expressUnlocked = true;
    submitRecord(this, 'gira', this.completed.score, this.completed.blocks);
  }
  const remaining = Math.max(0, Math.ceil(stage.seconds - round.elapsed));
  const progress = isFinal ? round.combo : round.passengers / 10;
  const progressLabel = isFinal ? 'RACHA' : 'CABINAS';
  this.route.setText(this.express ? 'TURNO EXPRESS · GOLDEN GATE'
    : `${this.stageIndex + 1}/${STAGES.length}  ${stage.city} · ${stage.subtitle}`);
  const stageCounted = ['cleared', 'crossing', 'won'].includes(this.phase);
  const passengers = this.total + (stageCounted ? 0 : round.passengers);
  const score = this.express ? round.score : this.completed.score + (stageCounted ? 0 : round.score);
  this.hud.setText(this.express
    ? `${remaining}s   ${score} PTS   PERFECTOS ${round.perfects}   BLOQUEOS ${round.blocks}`
    : `${remaining}s   ${progressLabel} ${progress}/${stage.goal}   PASAJEROS ${passengers}   ${score} PTS`);
  drawRunPanel(this, score);
  this.tutorial.setText(round.power === 'offline' ? `INCIDENTE ${round.incidentHits}/${round.incident.hits} · B1 / U EN VERDE`
    : this.phase === 'playing' && needsTutorial(round, stage) ? 'Pulsa B1 / U al entrar en verde' : '');

  this.dynamic.clear();
  if (this.phase === 'playing') drawWaitingPassengers(this.dynamic, round, this.sceneryTime);
  drawDepartures(this.dynamic, round, this.phase === 'crossing' || this.phase === 'won');

  if (emergency && this.stageIndex === 0) drawBlackout(this.dynamic, round);
  if (emergency && this.stageIndex === 1) {
    this.dynamic.fillStyle(0xffba69, 0.22).fillCircle(705, 387, 30 + round.incidentHits * 9);
    this.dynamic.fillStyle(0xf3b66b).fillRect(685, 403, 42, 6);
    for (let i = 0; i < round.incidentHits; i++) {
      this.dynamic.fillStyle(0xffda83).fillRect(689 + i * 7, 391, 5, 12);
    }
  }
  if (emergency && this.stageIndex === FINAL_STAGE_INDEX) {
    const x = 594 + Math.sin(this.sceneryTime * 2) * 42;
    this.dynamic.fillStyle(0x83dfab, 0.22).fillTriangle(x, 235, x - 38, 320, x + 38, 320);
    this.dynamic.fillStyle(0xa594df).fillRect(x - 28, 221, 56, 12);
    this.dynamic.fillStyle(0x83dfab).fillRect(x - 12, 214, 24, 8);
  }
  drawConsole(this, round, stage, seconds);
  if (this.phase === 'playing' && isFinal) {
    const gustPhase = round.elapsed % 7;
    const flagX = 685;
    const flagY = 282;
    const flagSpan = gustPhase >= 4 ? 27 : 13;
    this.dynamic.fillStyle(0xb5c9d0).fillRect(flagX, flagY, 2, 24);
    this.dynamic.fillStyle(0xe8a276).fillRect(flagX + 2, flagY, flagSpan, 4);
    this.dynamic.fillRect(flagX + 2, flagY + 4, flagSpan - 4, 4);
    if (gustPhase >= 4) {
      const gust = inGust(round);
      const drift = (round.elapsed * 90) % 100;
      this.dynamic.lineStyle(2, 0xd7e9ef, gust ? 0.75 : 0.32);
      for (let i = 0; i < 4; i++) {
        const x = 370 + i * 80 + drift;
        this.dynamic.lineBetween(x, 175 + i * 15, x + 32, 175 + i * 15);
      }
    }
  }
}

function drawBlackout(art, round) {
  const litSectors = round.power === 'restoring'
    ? Math.floor(5 * (1 - round.powerTime / GENERATOR.restoreSeconds)) : 0;
  for (let sector = litSectors; sector < 5; sector++) {
    art.fillStyle(0x050a16, 0.85).fillRect(sector * 160, 149, 160, 309);
  }
  art.fillStyle(0xffac61).fillRect(81, 340, 8, 5).fillRect(244, 340, 8, 5);
  art.fillStyle(0xffac61, 0.2).fillRect(77, 337, 16, 11).fillRect(240, 337, 16, 11);
}

function drawRunPanel(scene, score) {
  const { phase, round } = scene;
  const transfer = phase === 'cleared';
  const finished = phase === 'finished';
  const results = phase === 'won' || finished;
  const briefing = round.power === 'intro';
  const open = briefing || transfer || results;
  scene.panel.clear();
  scene.consoleStart.setVisible(!open);
  for (const field of [scene.panelHeading, scene.panelTitle, scene.panelDetail, scene.panelStats,
    scene.panelRecord, scene.panelStart, scene.panelEvent]) {
    field.setVisible(open);
  }
  const showExpress = canStartExpress(scene) && !scene.express;
  scene.panelRoute.setVisible(results);
  scene.panelClose.setVisible(results).setX(showExpress ? 523 : 400);
  scene.expressButton.setVisible(showExpress);
  scene.expressButton.setX(results ? 282 : 400).setY(open ? 423 : 178);
  if (!open) scene.expressButton.setText('TURNO EXPRESS  /  B2 · I');
  if (!open) return;

  scene.panel.fillStyle(0x08111f, 0.73).fillRect(0, 0, 800, 600);
  scene.panel.fillStyle(0x0e1d2e).fillRoundedRect(116, 125, 568, 337, 10);
  scene.panel.lineStyle(2, 0x528687).strokeRoundedRect(116, 125, 568, 337, 10);
  scene.panel.fillStyle(0x31495d).fillRect(150, 347, 500, 1);

  if (briefing) {
    scene.panelHeading.setText('INCIDENTE DE RUTA  /  RELOJ EN PAUSA').setY(146);
    scene.panelTitle.setText(round.incident.title).setY(179);
    scene.panelDetail.setText(round.incident.task).setY(304);
    scene.panelStats.setText('5 ACIERTOS · CADA FALLO RESTA 1').setY(328);
    scene.panelRecord.setText('');
    scene.panelStart.setText('EMPEZAR  /  B1 · U · ENTER');
    drawIncidentArt(scene.panel, scene.stageIndex === FINAL_STAGE_INDEX ? 2 : scene.stageIndex);
    return;
  }
  scene.panelHeading.setY(156);
  scene.panelTitle.setY(199);
  scene.panelDetail.setY(252);
  scene.panelStats.setY(295);

  if (transfer) {
    const next = STAGES[scene.stageIndex + 1];
    scene.panelHeading.setText(`TRAMO ${scene.stageIndex + 1} COMPLETADO  /  PRÓXIMA PARADA`);
    scene.panelTitle.setText(next.city);
    const trackNotes = [
      '', 'Pendiente · banda móvil desde ambos lados', 'Arco sobre la avenida · ambos sentidos',
      'Ascenso a Monserrate · ritmo más rápido', 'Ondas sobre el Ávila · ventana más estrecha',
      'Curvas · ventana estrecha · ráfagas'
    ];
    scene.panelDetail.setText(trackNotes[scene.stageIndex + 1]);
    scene.panelStats.setText(next === STAGES[FINAL_STAGE_INDEX]
      ? `ENLAZA ${next.goal} DESPACHOS SEGUIDOS EN ${next.seconds} SEGUNDOS`
      : `DESPACHA ${next.goal} CABINAS EN ${next.seconds} SEGUNDOS`);
    scene.panelRecord.setText(`${scene.operator}  ·  ${score} PTS ACUMULADOS`);
    scene.panelStart.setText('CONTINUAR  /  ENTER');
    return;
  }

  const perfects = scene.express ? round.perfects
    : scene.completed.perfects + (finished ? round.perfects : 0);
  const blocks = scene.express ? round.blocks
    : scene.completed.blocks + (finished ? round.blocks : 0);
  const time = scene.express ? EXPRESS.seconds
    : scene.completed.elapsed + (finished ? STAGES[scene.stageIndex].seconds : 0);
  const best = scene.records[scene.express ? 'express' : 'gira'];
  scene.panelHeading.setText(EVENT_NAME + '  /  ARCADE CHALLENGE');
  scene.panelRoute.setText(scene.express ? 'TURNO EXPRESS · GOLDEN GATE'
    : finished ? 'FIN DE TURNO · ' + STAGES[scene.stageIndex].city
      : 'SANTIAGO → CDMX → BUENOS AIRES → BOGOTÁ → CARACAS → GOLDEN GATE');
  scene.panelTitle.setText(scene.operator);
  scene.panelDetail.setText(`${score} PUNTOS`);
  scene.panelStats.setText(`PERFECTOS ${perfects}  ·  BLOQUEOS ${blocks}  ·  TIEMPO ${time.toFixed(1)} s`);
  scene.panelRecord.setText(best
    ? `${round.newRecord ? '¡NUEVO RÉCORD!' : 'RÉCORD'}  ·  ${best.score} PTS  ·  ${best.operator}`
    : '');
  scene.panelStart.setText(scene.express ? 'REINICIAR EXPRESS  /  ENTER' : 'REINICIAR GIRA  /  ENTER');
  scene.expressButton.setText('TURNO EXPRESS  /  B2 · I');
}

function drawIncidentArt(art, index) {
  art.fillStyle(0x101829).fillRect(310, 204, 180, 80);
  if (index === 0) {
    art.fillStyle(0x52697b).fillRect(344, 221, 112, 47);
    art.fillStyle(0xf3ae52).fillRect(348, 225, 104, 36);
    art.fillStyle(0x253447).fillRect(357, 232, 33, 23).fillRect(406, 232, 34, 23);
    art.fillStyle(0x88e4b2).fillRect(414, 237, 18, 8);
    art.fillStyle(0x53697a);
    for (let i = 0; i < 4; i++) art.fillRect(361, 235 + 5 * i, 25, 2);
    art.fillStyle(0x263447).fillRect(350, 268, 14, 6).fillRect(435, 268, 14, 6);
  } else if (index === 1) {
    art.fillStyle(0x8c416b).fillRect(345, 247, 110, 25);
    art.fillStyle(0xde7357).fillRect(357, 239, 86, 13);
    art.fillStyle(0x413153).fillRect(388, 216, 24, 25);
    art.fillStyle(0xede4c7).fillRect(392, 220, 16, 13).fillRect(395, 233, 10, 5);
    art.fillStyle(0x413153).fillRect(394, 224, 4, 4).fillRect(402, 224, 4, 4);
    for (const x of [356, 376, 422, 442]) {
      art.fillStyle(0xffcf80).fillRect(x, 220, 5, 7);
      art.fillStyle(0xf0dabe).fillRect(x, 228, 5, 11);
      art.fillStyle(0xf3a64d).fillRect(x - 3, 249, 11, 6);
    }
  } else {
    art.fillStyle(0x7de0a4, 0.32).fillTriangle(400, 250, 361, 277, 439, 277);
    art.fillStyle(0x71d2b4).fillRect(382, 217, 36, 20);
    art.fillStyle(0xa58fd4).fillRect(360, 231, 80, 16).fillRect(371, 247, 58, 7);
    art.fillStyle(0xf3d390).fillRect(371, 237, 7, 4).fillRect(396, 237, 7, 4).fillRect(421, 237, 7, 4);
  }
}

function drawConsole(scene, round, stage, seconds) {
  const art = scene.dynamic;
  const playing = scene.phase === 'playing';
  const generator = round.power === 'offline';
  const restoring = round.power === 'restoring';
  const blocked = round.pause > 0 || (generator && round.generatorMiss > 0);
  const target = generator ? GENERATOR.center : targetAt(round, stage);
  const baseWidth = generator ? GENERATOR.width : stage.width;
  const width = activationWidth(round, baseWidth, stage);
  const assisted = playing && width > baseWidth;
  const aligned = playing && !blocked && !restoring && Math.abs(round.marker - target) <= width;
  scene.buttonPulse = Math.max(0, (scene.buttonPulse ?? 0) - seconds);

  const screenTarget = Math.round(196 + (target - 64) * 0.575);
  const screenWidth = Math.round(width * 0.575);
  const marker = Math.round(196 + (round.marker - 64) * 0.575);
  art.lineStyle(2, 0x477187);
  for (let x = 196; x < 603; x += 8) {
    const nextX = Math.min(603, x + 8);
    art.lineBetween(x, trackY(stage, x), nextX, trackY(stage, nextX));
  }
  const targetY = trackY(stage, screenTarget);
  art.fillStyle(0x70eac4, assisted ? 0.46 : 0.32);
  for (let x = screenTarget - screenWidth; x < screenTarget + screenWidth; x += 2) {
    art.fillRect(x, Math.round(trackY(stage, x)) - 8, 2, 16);
  }
  art.fillStyle(0x70eac4).fillRect(screenTarget - 1, targetY - 10, 2, 20);
  if (playing && !blocked && !restoring) {
    const markerY = trackY(stage, marker);
    if (aligned) art.fillStyle(0x70eac4, 0.27).fillCircle(marker, markerY, 8);
    const tail = Math.max(191, Math.min(608, marker - round.direction * 14));
    art.lineStyle(2, aligned ? 0x70eac4 : 0xffc77b, 0.4)
      .lineBetween(tail, trackY(stage, tail), marker, markerY);
    art.fillStyle(aligned ? 0x70eac4 : 0xffc77b);
    art.fillTriangle(marker, markerY - 7, marker - 7, markerY, marker, markerY + 7);
    art.fillTriangle(marker, markerY - 7, marker + 7, markerY, marker, markerY + 7);
  }

  const startLabels = {
    ready: 'START / ENTER',
    playing: 'EN SERVICIO',
    cleared: 'SIGUIENTE ↵',
    crossing: 'EN TRÁNSITO',
    won: 'SANTIAGO ↵',
    finished: scene.express ? 'SANTIAGO ↵' : 'REINTENTO ↵'
  };
  scene.startText.setText(startLabels[scene.phase]).setAlpha(playing ? 0.55 : 1);
  art.fillStyle(0x172433).fillRect(194, 535, 100, 40);
  art.fillStyle(playing ? 0x314151 : 0x4d687a).fillRect(197, 538, 94, 32);

  let status = 'ANDÉN EN ESPERA';
  let signal = 0xb3c5c8;
  if (playing) {
    status = 'ESPERA LA MARCA';
    signal = 0xffc77b;
    if (aligned) {
      status = 'DESPACHA AHORA';
      signal = 0x70eac4;
    } else if (blocked) {
      status = 'SALIDA BLOQUEADA';
      signal = 0xfe8877;
    } else if (round.feedbackTime > 0 && round.feedback.startsWith('¡')) {
      status = 'CABINA EN CAMINO';
      signal = 0x70eac4;
    }
  } else if (scene.phase === 'crossing') {
    status = 'CRUZANDO EL PUENTE';
    signal = 0x70eac4;
  } else if (scene.phase === 'cleared' || scene.phase === 'won') {
    status = 'TRAMO COMPLETADO';
    signal = 0x70eac4;
  } else if (scene.phase === 'finished') {
    status = 'TIEMPO AGOTADO';
    signal = 0xfe8877;
  }
  if (generator) {
    status = aligned ? round.incident.action : blocked ? 'REINTENTA' : 'ESPERA LA MARCA';
    signal = aligned ? 0x70eac4 : 0xffc77b;
  } else if (restoring) {
    status = round.incident.done;
    signal = 0x70eac4;
  }
  if (assisted && !restoring && !aligned && !blocked) {
    status = 'AYUDA · ZONA AMPLIA';
    signal = 0x70eac4;
  }
  scene.statusText.setText(status);
  art.fillStyle(signal).fillRect(467, 542, 8, 8);

  const cap = aligned ? 0x39866d : playing && !blocked ? 0x9b5141 : 0x614d50;
  const top = scene.buttonPulse > 0 ? 538 : 532;
  art.fillStyle(0x101824).fillRect(491, 531, 112, 48);
  art.fillStyle(cap).fillRect(495, top, 104, 575 - top);
  art.fillStyle(signal, 0.8).fillRect(498, top + 2, 98, 3);
  drawSideControls(scene, round, signal, playing, blocked, aligned);
}

function drawSideControls(scene, round, signal, playing, blocked, aligned) {
  const art = scene.dynamic;
  const mode = aligned ? 'SYNC' : blocked ? 'HOLD' : playing ? 'SCAN' : 'IDLE';
  const wind = scene.stageIndex === FINAL_STAGE_INDEX && playing && inGust(round);
  const warning = scene.stageIndex === FINAL_STAGE_INDEX && playing && !wind && round.elapsed % 7 >= 4;
  const cursor = Math.floor(scene.sceneryTime * 2) % 2 ? '_' : ' ';
  let terminal = [
    scene.operator || '> LINE_0' + (scene.stageIndex + 1),
    'slot: ' + mode,
    'cabs: ' + round.passengers / 10,
    'wind: ' + (wind ? 'GUST' : warning ? 'ALERT' : 'OK'),
    '> ' + cursor
  ].join('\n');
  if (round.power === 'offline') {
    terminal = `${round.incident.terminal}\nReloj en pausa\nAvance ${round.incidentHits}/${round.incident.hits}\nB1 / U en verde`;
  } else if (round.power === 'restoring') {
    terminal = `> INCIDENTE OK\n${round.incident.done}`;
  } else if (scene.phase === 'ready') {
    terminal = '> ANDÉN LISTO\nDespacha 5\ncabinas para\navanzar';
  } else if (scene.phase === 'cleared') {
    const city = STAGES[scene.stageIndex + 1].city.replace('CIUDAD DE MÉXICO', 'CIUDAD DE\nMÉXICO');
    terminal = `> PRÓXIMA\n${city}\nSTART / ENTER`;
  } else if (scene.phase === 'crossing') {
    terminal = '> GOLDEN GATE\nÚltima cabina\ncruzando…';
  } else if (scene.phase === 'won') {
    terminal = `> GOLDEN GATE\n¡Puente cruzado!\n${scene.total} pasajeros`;
  } else if (scene.phase === 'finished') {
    terminal = scene.express
      ? '> TURNO EXPRESS\nRonda completa'
      : '> FIN DE TURNO\nTiempo agotado';
  } else if (round.feedbackTime > 0) {
    if (round.feedback.startsWith('¡PERFECTO')) {
      terminal = `> ¡PERFECTO!\n+${POINTS.perfect} PTS\n+10 pasajeros`;
    } else if (round.feedback.startsWith('¡')) {
      terminal = `> ¡A TIEMPO!\n+${POINTS.onTime} PTS\n+10 pasajeros`;
    } else if (round.feedback.startsWith('Salida')) {
      terminal = `> BLOQUEO\n${POINTS.blocked} PTS\nEspera la marca`;
    } else {
      terminal = `> TURNO PERDIDO\n${POINTS.missed} PTS\nEspera la marca`;
    }
    if (wind || warning) terminal += wind ? '\nwind: GUST' : '\nwind: ALERT';
  }
  scene.codeScreen.setText(terminal);

  const phase = playing ? Math.min(1, Math.max(0, Math.abs(round.origin - round.marker) / 540)) : 0;
  for (const [x, y] of [[652, 548 - Math.round(phase * 35)], [679, wind ? 510 : 537]]) {
    art.fillStyle(0x7891a0).fillRect(x - 2, y, 4, 9);
    art.fillStyle(0xd5aa76).fillRect(x - 6, y - 4, 12, 8);
  }
  for (const [x, y, color] of [
    [702, 501, signal], [722, 501, blocked ? 0xef796a : 0x734b50],
    [702, 521, wind || warning ? 0xf6c677 : 0x806642], [722, 521, playing ? 0x70a7c3 : 0x41596b]
  ]) {
    art.fillStyle(0x0b1523).fillRect(x - 2, y - 2, 16, 15);
    art.fillStyle(color).fillRect(x, y, 12, 10);
    art.fillStyle(0xe8eff0, 0.24).fillRect(x + 1, y + 1, 10, 2);
  }
}
