
(() => {
'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const starCanvas = document.getElementById('starfield');
const starCtx = starCanvas.getContext('2d');
let starField = {stars:[], last: performance.now(), raf:0};
const field = document.getElementById('field');
const W = canvas.width;
const H = canvas.height;
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const STAR_LAYER_CONFIG = [
  {count:110, speedX:-1.8, speedY:.9, alpha:.34},
  {count:90, speedX:-4.2, speedY:1.7, alpha:.52},
  {count:70, speedX:-7.6, speedY:3.0, alpha:.76}
];

function resizeStarfield(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  starCanvas.width = Math.floor(w * dpr);
  starCanvas.height = Math.floor(h * dpr);
  starCanvas.style.width = w + 'px';
  starCanvas.style.height = h + 'px';
  starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildStarfield(w, h);
}

function buildStarfield(w, h){
  starField.stars = [];
  STAR_LAYER_CONFIG.forEach((layer, layerIndex) => {
    for(let i=0;i<layer.count;i++){
      starField.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 1.15,
        alpha: layer.alpha,
        layer: layerIndex,
        speedX: layer.speedX,
        speedY: layer.speedY,
        twinkle: Math.random() * TAU,
        twinkleSpeed: rand(.25, .85)
      });
    }
  });
}

function updateStarfield(dt){
  const w = window.innerWidth;
  const h = window.innerHeight;
  for(const s of starField.stars){
    s.x += s.speedX * dt;
    s.y += s.speedY * dt;
    s.twinkle += s.twinkleSpeed * dt;
    if(s.x < -8){ s.x = w + 8; s.y = Math.random() * h; }
    if(s.x > w + 8){ s.x = -8; s.y = Math.random() * h; }
    if(s.y < -8){ s.y = h + 8; s.x = Math.random() * w; }
    if(s.y > h + 8){ s.y = -8; s.x = Math.random() * w; }
  }
}

function drawStarfield(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  starCtx.clearRect(0, 0, w, h);
  for(const s of starField.stars){
    const glow = .55 + Math.sin(s.twinkle) * .28;
    const a = Math.max(.12, Math.min(1, s.alpha * glow));
    starCtx.globalAlpha = a;
    starCtx.fillStyle = '#ffffff';
    starCtx.shadowColor = 'rgba(255,255,255,.9)';
    starCtx.shadowBlur = s.layer === 2 ? 8 : 5;
    starCtx.beginPath();
    starCtx.arc(s.x, s.y, s.size, 0, TAU);
    starCtx.fill();
  }
  starCtx.globalAlpha = 1;
  starCtx.shadowBlur = 0;
}

function starLoop(now){
  const dt = Math.min((now - starField.last) / 1000, 0.05);
  starField.last = now;
  updateStarfield(dt);
  drawStarfield();
  starField.raf = requestAnimationFrame(starLoop);
}

const rand = (a,b)=>a+Math.random()*(b-a);


/* v106: screen-specific starfields reuse the exact battle star renderer values. */
const SCREEN_STAR_CANVAS_IDS = ['galaxyMapStarfield','stageMapStarfield','towerPopupStarfield'];
const screenStarFields = SCREEN_STAR_CANVAS_IDS.map(id => {
  const canvas = document.getElementById(id);
  return canvas ? { id, canvas, ctx: canvas.getContext('2d'), stars: [], lastW: 0, lastH: 0 } : null;
}).filter(Boolean);
let screenStarRaf = 0;
let screenStarLast = performance.now();

function buildScreenStarfield(sf, w, h){
  sf.stars = [];
  STAR_LAYER_CONFIG.forEach((layer, layerIndex) => {
    for(let i=0;i<layer.count;i++){
      sf.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 1.15,
        alpha: layer.alpha,
        layer: layerIndex,
        speedX: layer.speedX,
        speedY: layer.speedY,
        twinkle: Math.random() * TAU,
        twinkleSpeed: rand(.25, .85)
      });
    }
  });
}

function resizeScreenStarfield(sf){
  const rect = sf.canvas.getBoundingClientRect();
  const w = Math.max(0, Math.round(rect.width));
  const h = Math.max(0, Math.round(rect.height));
  if(w < 2 || h < 2) return false;
  if(sf.lastW === w && sf.lastH === h) return true;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  sf.canvas.width = Math.floor(w * dpr);
  sf.canvas.height = Math.floor(h * dpr);
  sf.canvas.style.width = w + 'px';
  sf.canvas.style.height = h + 'px';
  sf.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sf.lastW = w;
  sf.lastH = h;
  buildScreenStarfield(sf, w, h);
  return true;
}

function refreshScreenStarfields(){
  screenStarFields.forEach(resizeScreenStarfield);
}

function updateScreenStarfield(sf, dt){
  const w = sf.lastW;
  const h = sf.lastH;
  if(w < 2 || h < 2) return;
  for(const s of sf.stars){
    s.x += s.speedX * dt;
    s.y += s.speedY * dt;
    s.twinkle += s.twinkleSpeed * dt;
    if(s.x < -8){ s.x = w + 8; s.y = Math.random() * h; }
    if(s.x > w + 8){ s.x = -8; s.y = Math.random() * h; }
    if(s.y < -8){ s.y = h + 8; s.x = Math.random() * w; }
    if(s.y > h + 8){ s.y = -8; s.x = Math.random() * w; }
  }
}

function drawScreenStarfield(sf){
  const w = sf.lastW;
  const h = sf.lastH;
  if(w < 2 || h < 2) return;
  const ctx2 = sf.ctx;
  ctx2.clearRect(0, 0, w, h);
  for(const s of sf.stars){
    const glow = .55 + Math.sin(s.twinkle) * .28;
    const a = Math.max(.12, Math.min(1, s.alpha * glow));
    ctx2.globalAlpha = a;
    ctx2.fillStyle = '#ffffff';
    ctx2.shadowColor = 'rgba(255,255,255,.9)';
    ctx2.shadowBlur = s.layer === 2 ? 8 : 5;
    ctx2.beginPath();
    ctx2.arc(s.x, s.y, s.size, 0, TAU);
    ctx2.fill();
  }
  ctx2.globalAlpha = 1;
  ctx2.shadowBlur = 0;
}

function screenStarLoop(now){
  const dt = Math.min((now - screenStarLast) / 1000, 0.05);
  screenStarLast = now;
  for(const sf of screenStarFields){
    if(!resizeScreenStarfield(sf)) continue;
    updateScreenStarfield(sf, dt);
    drawScreenStarfield(sf);
  }
  screenStarRaf = requestAnimationFrame(screenStarLoop);
}

const THEMES = [
  {name:'COSMIC VOID', ko:'공허 성역', bg:'assets/images/backgrounds/bg_cosmic.webp', color:'#38bdf8', starSpeed:1.0},
  {name:'FROST EXPANSE', ko:'빙결 외곽', bg:'assets/images/backgrounds/bg_frost.webp', color:'#67e8f9', starSpeed:.82},
  {name:'LAVA NEBULA', ko:'용암 성운', bg:'assets/images/backgrounds/bg_lava.webp', color:'#fb923c', starSpeed:1.22},
  {name:'JUNGLE CORE', ko:'생체 정글', bg:'assets/images/backgrounds/bg_jungle.webp', color:'#22c55e', starSpeed:.95},
  {name:'SMOG WASTELAND', ko:'매연 폐역', bg:'assets/images/backgrounds/bg_smog.webp', color:'#9cab62', starSpeed:.72},
  {name:'CRYSTAL NEBULA', ko:'수정 성운', bg:'assets/images/backgrounds/bg_crystal.webp', color:'#c084fc', starSpeed:.88},
  {name:'MACHINE CORE', ko:'기계 핵성', bg:'assets/images/backgrounds/bg_machine.webp', color:'#60a5fa', starSpeed:.78}
];


const STAGE_MAP_DEFS = [
  {stage:1, key:'cosmic', name:'COSMIC VOID', ko:'공허 성역', theme:0, color:'#38bdf8', constellation:'orion', mood:'오로라 균열 · 첫 방어선 · 기본 화력 학습'},
  {stage:2, key:'frost', name:'FROST EXPANSE', ko:'빙결 외곽', theme:1, color:'#67e8f9', constellation:'orion', mood:'냉각 폭풍 · 감속/제어 학습 · 빠른 적 대응'},
  {stage:3, key:'lava', name:'LAVA NEBULA', ko:'용암 성운', theme:2, color:'#fb923c', constellation:'orion', mood:'태양 플레어 · 장갑형 적 · 광역 화력 요구'},
  {stage:4, key:'jungle', name:'JUNGLE CORE', ko:'생체 정글', theme:3, color:'#22c55e', constellation:'orion', mood:'포자 군체 · 재생형 적 · 장기전 운영'},
  {stage:5, key:'smog', name:'SMOG WASTELAND', ko:'매연 폐역', theme:4, color:'#9cab62', constellation:'orion', mood:'산업 매연 · 은폐 장갑 · 방어 약화/감속 활용'},
  {stage:6, key:'crystal', name:'CRYSTAL NEBULA', ko:'수정 성운', theme:5, color:'#c084fc', constellation:'orion', mood:'프리즘 공명 · 초과 피해 저장 · 장판 구조 변화'},
  {stage:7, key:'machine', name:'MACHINE CORE', ko:'기계 핵성', theme:6, color:'#60a5fa', constellation:'orion', mood:'폭주 방어망 · 실드 해체 · 코어 압박'},
  {stage:8, key:'gravity', name:'GRAVITY MAUSOLEUM', ko:'중력 무덤', theme:0, color:'#8b5cf6', constellation:'cygnus', mood:'붕괴 궤도 · 군중 제어 · 중력 왜곡'},
  {stage:9, key:'thunder', name:'THUNDER CORRIDOR', ko:'번개 회랑', theme:6, color:'#22d3ee', constellation:'cygnus', mood:'과전류 항로 · 고속 압박 · 연쇄 충격'},
  {stage:10, key:'time', name:'TIME SHARDS', ko:'시간 잔해', theme:5, color:'#a78bfa', constellation:'cygnus', mood:'반복 잔상 · 압박 웨이브 · 시간 역류'},
  {stage:11, key:'silent', name:'SILENT CONSTELLATION', ko:'침묵 성단', theme:4, color:'#64748b', constellation:'draco', mood:'감응 차단 · 정보 제한 · 암흑 추적전'},
  {stage:12, key:'throne', name:'RIFT THRONE', ko:'균열 왕좌', theme:6, color:'#ef4444', constellation:'draco', mood:'은하 중심핵 전초전 · 최종 패턴 복합전'}
];

const STAGE_PRESENTATION = {
  1:{risk:'LOW', tags:['AURORA','VOID MARK','ENTRY'], note:'기본 화력을 익히며 첫 균열을 정화합니다.'},
  2:{risk:'MEDIUM', tags:['BLIZZARD','FREEZE','CONTROL'], note:'감속과 제어를 익히며 빠른 적에 대응합니다.'},
  3:{risk:'HIGH', tags:['SOLAR FLARE','ARMOR','BURN'], note:'장갑형 적에게 광역 화력을 투입해야 합니다.'},
  4:{risk:'VERY HIGH', tags:['SPORE FIELD','HEAL','DECAY'], note:'재생 군체를 끊고 장기전 운영을 학습합니다.'},
  5:{risk:'EXTREME', tags:['SMOG','ARMOR DECAY','HAZE'], note:'시야 압박과 방어 약화를 동시에 버텨야 합니다.'},
  6:{risk:'EXTREME', tags:['PRISM','CHARGE','RESONANCE'], note:'초과 피해와 장판 공명을 활용하는 성역입니다.'},
  7:{risk:'EXTREME+', tags:['MACHINE','SHIELD','REPAIR'], note:'수리 드론과 실드 재가동을 끊어야 하는 기계 핵성입니다.'},
  8:{risk:'NIGHTMARE', tags:['GRAVITY','PULL','CONTROL'], note:'중력 왜곡으로 적의 밀집과 가속이 반복되는 제어전입니다.'},
  9:{risk:'NIGHTMARE', tags:['THUNDER','CHAIN','SPEED'], note:'과전류 항로에서 고속 적과 연쇄 충격을 버텨야 합니다.'},
  10:{risk:'NIGHTMARE+', tags:['TIME','ECHO','REWIND'], note:'시간 잔상이 화력을 분산시키는 압박 성역입니다.'},
  11:{risk:'ABYSS', tags:['SILENCE','NULL','STEALTH'], note:'감응 차단과 암흑 장갑으로 정보가 제한되는 성단입니다.'},
  12:{risk:'FINAL', tags:['RIFT KING','HYBRID','ENDGAME'], note:'이전 성역의 패턴이 합쳐지는 최종 복합전입니다.'}
};



const STAGE_DESCRIPTION_COPY = {
  1:{summary:'첫 번째 공허 성역입니다. 기본 행성 배치, 장판 활용, 병합 타이밍을 익히는 입문 전장입니다.', enemy:'공허 균열 적은 능력치가 균형형이라 초반 화력 곡선을 확인하기 좋습니다.', strategy:'레이저·블랙홀 계열로 길목을 안정화하고, 3웨이브부터 병합 준비를 시작하세요.', battle:'공허 성역 방어 · 기본 화력 학습'},
  2:{summary:'빙결 외곽은 빠른 적이 섞여 들어오는 제어형 전장입니다. 적을 늦추는 배치가 핵심입니다.', enemy:'빙결 선봉대는 속도 변화가 크고, 후반에는 감속 저항 적이 섞입니다.', strategy:'냉각·감속 장판 근처에 타워를 모아 빠른 적의 돌파를 막으세요.', battle:'빙결 외곽 방어 · 감속 제어전'},
  3:{summary:'용암 성운은 장갑형 적이 본격적으로 등장하는 화력 검증 스테이지입니다.', enemy:'용암 장갑 적은 단일 저레벨 화력을 오래 버티며 코어로 밀고 들어옵니다.', strategy:'광역 피해와 장갑 돌파 타워를 우선 병합하고, 화력 부족 구간을 장판으로 보완하세요.', battle:'용암 성운 방어 · 장갑 돌파전'},
  4:{summary:'생체 정글은 적이 회복과 증식을 반복하는 장기전 스테이지입니다.', enemy:'포자 군체는 주변 적을 회복시키기 때문에 처치 순서가 중요합니다.', strategy:'재생을 끊는 집중 화력과 지속 피해를 확보해 전선이 밀리지 않게 운영하세요.', battle:'생체 정글 방어 · 재생 차단전'},
  5:{summary:'매연 폐역은 시야와 방어 효율을 동시에 흔드는 디버프형 전장입니다.', enemy:'매연 은폐 적은 방어선을 흐트러뜨리고 장갑으로 피해를 흡수합니다.', strategy:'감속, 방어 약화, 지속 피해를 겹쳐 은폐 장갑 적을 빠르게 노출시키세요.', battle:'매연 폐역 방어 · 은폐 약화전'},
  6:{summary:'수정 성운은 피해가 저장되고 굴절되는 공명형 스테이지입니다.', enemy:'수정 공명체는 초과 피해와 장판 효과를 흔들어 배치 판단을 어렵게 만듭니다.', strategy:'공명 장판과 고레벨 타워를 연결해 한 번에 큰 피해를 넣는 구간을 만드세요.', battle:'수정 성운 방어 · 프리즘 공명전'},
  7:{summary:'기계 핵성은 실드와 수리 드론이 전선을 굳히는 방어망 스테이지입니다.', enemy:'기계 실드 유닛은 수리 드론과 함께 등장해 처치 시간을 크게 늘립니다.', strategy:'실드 해체 타워와 집중 화력을 먼저 확보하고, 보스 전에는 병합 레벨을 끌어올리세요.', battle:'기계 핵성 방어 · 실드 해체전'},
  8:{summary:'중력 무덤은 죽은 행성의 궤도가 적을 밀집시키고 전장을 왜곡하는 제어 스테이지입니다.', enemy:'중력 왜곡 적은 몰려오거나 갑자기 가속해 방어선의 빈틈을 찌릅니다.', strategy:'군중 제어와 범위 화력을 겹쳐 몰려오는 적을 한 번에 정리하세요.', battle:'중력 무덤 방어 · 군중 제어전'},
  9:{summary:'번개 회랑은 고속 적과 연쇄 충격이 이어지는 속도 압박 스테이지입니다.', enemy:'과전류 고속 적은 짧은 시간에 코어 근처까지 도달할 수 있습니다.', strategy:'초반부터 공격 속도와 연쇄 화력을 확보하고, 길목 앞쪽에 화력을 집중하세요.', battle:'번개 회랑 방어 · 고속 대응전'},
  10:{summary:'시간 잔해는 과거 웨이브의 잔상이 겹쳐 화력이 분산되는 반복 전장입니다.', enemy:'시간 잔상 적은 같은 구간에 반복 등장해 타워 타겟팅을 흔듭니다.', strategy:'잔상 처리용 범위 화력과 보스 집중 화력을 분리해서 배치하세요.', battle:'시간 잔해 방어 · 잔상 처리전'},
  11:{summary:'침묵 성단은 감응 신호가 끊겨 적 특성 파악이 늦어지는 암흑 스테이지입니다.', enemy:'침묵 잠행 적은 반응을 늦추고 암흑 장갑으로 초반 피해를 줄입니다.', strategy:'안정적인 중앙 배치와 범용 화력을 먼저 완성해 정보 제한 구간을 버티세요.', battle:'침묵 성단 방어 · 신호 차단전'},
  12:{summary:'균열 왕좌는 이전 성역의 패턴이 모두 합쳐지는 시즌 1 최종 복합전입니다.', enemy:'균열 왕좌 혼합군은 장갑, 재생, 실드, 고속, 잔상 패턴을 순차적으로 압박합니다.', strategy:'핵심 타워를 빠르게 고레벨로 병합하고, 장판·전역 스킬을 모두 활용해야 합니다.', battle:'균열 왕좌 방어 · 최종 복합전'}
};
function getStageDescriptionCopy(stageNo){
  const n = clamp(Number(stageNo || 1), 1, STAGE_MAP_DEFS.length);
  return STAGE_DESCRIPTION_COPY[n] || STAGE_DESCRIPTION_COPY[1];
}
function stageDescriptionLine(stageNo){
  const n = clamp(Number(stageNo || 1), 1, STAGE_MAP_DEFS.length);
  const def = getStageDef(n);
  const copy = getStageDescriptionCopy(n);
  return `${def.ko} 설명 · ${copy.summary} 추천 전략: ${copy.strategy}`;
}
function stageHintLine(stageNo, canEnter=true){
  const n = clamp(Number(stageNo || 1), 1, STAGE_MAP_DEFS.length);
  const def = getStageDef(n);
  const arc = getConstellationArcByStage(n);
  const copy = getStageDescriptionCopy(n);
  const state = canEnter ? '진입 가능' : '미개방 미리보기';
  return `${arc.ko} · ${def.stage}. ${def.name} / ${def.ko} — ${state}. ${copy.summary} 보상: ${stageTowerRewardText(def.stage)}`;
}
function stageTagHtml(stageNo){
  const presentation = getStagePresentation(stageNo);
  return presentation.tags.map(tag => `<span class="stageTag">${escapeHtml(tag)}</span>`).join('');
}

const STAGE_BOSS_DEFS = {
  1: {
    mid: {tier:'MID BOSS', name:'ASTRAL WARDEN', ko:'성운 감시자', title:'위상 수호체', color:'#bae6fd', aura:'#38bdf8', hpMul:1.58, speedMul:.96, size:34, rewardMul:2.05, expMul:1.95, armor:.06, coreDamage:1, ability:'위상 재생', desc:'짧은 주기로 잔여 위상 에너지를 회복합니다.', effect:'phaseRegen', interval:168},
    final: {tier:'FINAL BOSS', name:'OBLIVION HEART', ko:'공허 심핵', title:'최초 균열 군주', color:'#e0f2fe', aura:'#0ea5e9', hpMul:2.42, speedMul:.90, size:44, rewardMul:3.55, expMul:2.9, armor:.12, coreDamage:3, ability:'특이점 파동', desc:'전장 중앙에 공허 파동을 일으켜 방어선을 압박합니다.', effect:'voidSurge', interval:150}
  },
  2: {
    mid: {tier:'MID BOSS', name:'CRYO SENTINEL', ko:'빙결 파수병', title:'냉각 폭풍 감시자', color:'#cffafe', aura:'#67e8f9', hpMul:1.68, speedMul:.94, size:35, rewardMul:2.18, expMul:2.05, armor:.08, coreDamage:1, ability:'냉각 장막', desc:'차가운 장막으로 주변 적의 생존 시간을 늘립니다.', effect:'frostVeil', interval:162},
    final: {tier:'FINAL BOSS', name:'GLACIER MONARCH', ko:'빙하 군주', title:'결빙 외곽의 지배자', color:'#ecfeff', aura:'#06b6d4', hpMul:2.58, speedMul:.88, size:45, rewardMul:3.75, expMul:3.05, armor:.14, coreDamage:3, ability:'빙하 행진', desc:'방어선을 늦추는 한파를 전개하고 빠른 적을 뒤섞습니다.', effect:'frostVeil', interval:146}
  },
  3: {
    mid: {tier:'MID BOSS', name:'MAGMA COLOSSUS', ko:'마그마 거상', title:'장갑 파쇄 시험체', color:'#fed7aa', aura:'#fb923c', hpMul:1.82, speedMul:.93, size:37, rewardMul:2.32, expMul:2.18, armor:.13, coreDamage:2, ability:'용암 장갑', desc:'두꺼운 장갑으로 단일 화력을 버티며 전진합니다.', effect:'solarFlare', interval:156},
    final: {tier:'FINAL BOSS', name:'SOLAR RIFT TITAN', ko:'태양 균열 거인', title:'불타는 성운 군주', color:'#ffedd5', aura:'#f97316', hpMul:2.78, speedMul:.86, size:47, rewardMul:4.0, expMul:3.22, armor:.20, coreDamage:4, ability:'태양 플레어', desc:'플레어 폭주로 광역 피해와 장갑 돌파를 요구합니다.', effect:'solarFlare', interval:140}
  },
  4: {
    mid: {tier:'MID BOSS', name:'SPORE MATRIARCH', ko:'포자 모체', title:'생체 재생핵', color:'#bbf7d0', aura:'#22c55e', hpMul:1.92, speedMul:.94, size:37, rewardMul:2.45, expMul:2.28, armor:.11, coreDamage:2, ability:'포자 회복', desc:'재생 포자를 퍼뜨려 주변 군체를 회복시킵니다.', effect:'sporeHeal', interval:154},
    final: {tier:'FINAL BOSS', name:'VERDANT DEVOURER', ko:'녹빛 포식자', title:'생체 정글 군주', color:'#dcfce7', aura:'#16a34a', hpMul:2.92, speedMul:.88, size:48, rewardMul:4.25, expMul:3.38, armor:.19, coreDamage:4, ability:'군체 증식', desc:'장기전으로 갈수록 재생 군체를 증식시킵니다.', effect:'sporeHeal', interval:138}
  },
  5: {
    mid: {tier:'MID BOSS', name:'SMOG REAVER', ko:'매연 약탈자', title:'폐역 잠행체', color:'#d9f99d', aura:'#9cab62', hpMul:2.06, speedMul:.95, size:38, rewardMul:2.62, expMul:2.38, armor:.18, coreDamage:2, ability:'매연 은폐', desc:'짙은 매연으로 방어 효율을 낮추며 접근합니다.', effect:'sootScreen', interval:150},
    final: {tier:'FINAL BOSS', name:'INDUSTRIAL LEVIATHAN', ko:'산업 폐역의 거수', title:'중독 장갑 군주', color:'#ecfccb', aura:'#84cc16', hpMul:3.06, speedMul:.88, size:49, rewardMul:4.55, expMul:3.55, armor:.25, coreDamage:5, ability:'부식성 장갑', desc:'부식 안개와 장갑을 동시에 전개해 방어선을 갉아먹습니다.', effect:'industrialVeil', interval:134}
  },
  6: {
    mid: {tier:'MID BOSS', name:'PRISM GUARDIAN', ko:'프리즘 수호자', title:'수정 공명체', color:'#e9d5ff', aura:'#c084fc', hpMul:2.12, speedMul:.95, size:38, rewardMul:2.7, expMul:2.44, armor:.17, coreDamage:2, ability:'공명 저장', desc:'받은 충격 일부를 저장해 공명 파동으로 되돌립니다.', effect:'crystalOverload', interval:148},
    final: {tier:'FINAL BOSS', name:'CRYSTAL OVERMIND', ko:'수정 과부하 핵', title:'프리즘 성운 군주', color:'#f3e8ff', aura:'#a855f7', hpMul:3.16, speedMul:.89, size:49, rewardMul:4.75, expMul:3.68, armor:.24, coreDamage:5, ability:'프리즘 과부하', desc:'초과 피해와 장판 공명을 흔들어 배치 판단을 요구합니다.', effect:'crystalOverload', interval:132}
  },
  7: {
    mid: {tier:'MID BOSS', name:'REPAIR DRONE HIVE', ko:'수리 드론 군집', title:'폭주 보조 시스템', color:'#93c5fd', aura:'#60a5fa', hpMul:2.02, speedMul:.95, size:38, rewardMul:2.75, expMul:2.45, armor:.16, coreDamage:2, ability:'전장 수리', desc:'주변 기계 유닛을 수리하고 자신의 장갑을 재가동합니다.', effect:'fieldRepair', interval:148},
    final: {tier:'FINAL BOSS', name:'AUTOMATON CORE', ko:'오토마톤 코어', title:'폭주한 고대 방어망', color:'#bfdbfe', aura:'#ef4444', hpMul:3.16, speedMul:.90, size:48, rewardMul:4.8, expMul:3.7, armor:.24, coreDamage:5, ability:'코어 재부팅', desc:'코어 실드를 재부팅하고 수리 드론을 호출하며 마지막 구간에서 장갑을 전개합니다.', effect:'coreReboot', interval:132}
  },
  8: {
    mid: {tier:'MID BOSS', name:'ORBIT DEVOURER', ko:'궤도 포식자', title:'중력 선봉장', color:'#c4b5fd', aura:'#8b5cf6', hpMul:2.14, speedMul:.96, size:39, rewardMul:2.85, expMul:2.55, armor:.16, coreDamage:2, ability:'중력 붕괴', desc:'가장 앞선 행성 주위에 중력 파문을 일으켜 적을 끌어모읍니다.', effect:'voidSurge', interval:146},
    final: {tier:'FINAL BOSS', name:'DEAD STAR HEART', ko:'죽은 별의 심장', title:'붕괴 궤도 군주', color:'#ddd6fe', aura:'#8b5cf6', hpMul:3.28, speedMul:.89, size:49, rewardMul:5.0, expMul:3.8, armor:.25, coreDamage:5, ability:'특이점 함몰', desc:'중력장을 뒤틀어 자신을 재생시키고 주변 적을 가속합니다.', effect:'voidSurge', interval:128}
  },
  9: {
    mid: {tier:'MID BOSS', name:'ARC CHASER', ko:'뇌광 추적자', title:'과전류 사냥꾼', color:'#a5f3fc', aura:'#22d3ee', hpMul:2.22, speedMul:1.02, size:39, rewardMul:2.95, expMul:2.6, armor:.17, coreDamage:2, ability:'연쇄 과전류', desc:'연쇄 번개를 남기며 질주해 방어선을 흔듭니다.', effect:'cataclysmBurst', interval:142},
    final: {tier:'FINAL BOSS', name:'ZERO SPARK CORE', ko:'제로 스파크 코어', title:'초전도 군주', color:'#cffafe', aura:'#06b6d4', hpMul:3.36, speedMul:.94, size:50, rewardMul:5.2, expMul:3.95, armor:.26, coreDamage:5, ability:'초전도 폭주', desc:'에너지 선로를 과부하시켜 모든 하수인의 이동을 가속합니다.', effect:'cataclysmBurst', interval:126}
  },
  10: {
    mid: {tier:'MID BOSS', name:'ECHO WRAITH', ko:'시간 잔영체', title:'반복된 망령', color:'#ddd6fe', aura:'#a78bfa', hpMul:2.28, speedMul:.95, size:40, rewardMul:3.0, expMul:2.7, armor:.18, coreDamage:2, ability:'과거 잔상', desc:'자신의 분신 잔상을 남겨 화력을 분산시킵니다.', effect:'phaseRegen', interval:138},
    final: {tier:'FINAL BOSS', name:'CHRONO RIFT', ko:'크로노 리프트', title:'시간 역류 군주', color:'#ede9fe', aura:'#8b5cf6', hpMul:3.44, speedMul:.92, size:50, rewardMul:5.35, expMul:4.05, armor:.28, coreDamage:5, ability:'시간 역류', desc:'웨이브 압박을 되감아 순간적으로 적군을 증식시킵니다.', effect:'coreReboot', interval:124}
  },
  11: {
    mid: {tier:'MID BOSS', name:'MUTE HUNTER', ko:'무음 사냥꾼', title:'암흑 잠행체', color:'#cbd5e1', aura:'#64748b', hpMul:2.36, speedMul:.97, size:40, rewardMul:3.1, expMul:2.8, armor:.20, coreDamage:3, ability:'감응 차단', desc:'잠시 동안 행성 반응을 흐리게 만들어 화력을 떨어뜨립니다.', effect:'sootScreen', interval:136},
    final: {tier:'FINAL BOSS', name:'OBSERVER NULL', ko:'침묵의 관측자', title:'성단 심연 군주', color:'#e2e8f0', aura:'#94a3b8', hpMul:3.54, speedMul:.91, size:51, rewardMul:5.5, expMul:4.15, armor:.30, coreDamage:6, ability:'신호 소거', desc:'전장의 알림과 감응을 차단하며 자신에게 강한 장갑을 부여합니다.', effect:'industrialVeil', interval:122}
  },
  12: {
    mid: {tier:'MID BOSS', name:'SANCTUARY MIRROR', ko:'성역 복제체', title:'왕좌의 전령', color:'#fca5a5', aura:'#ef4444', hpMul:2.45, speedMul:.98, size:42, rewardMul:3.2, expMul:2.9, armor:.22, coreDamage:3, ability:'패턴 복제', desc:'이전 보스들의 패턴 일부를 혼합해 사용합니다.', effect:'coreReboot', interval:132},
    final: {tier:'FINAL BOSS', name:'RIFT KING', ko:'균열의 왕', title:'은하 중심핵 군주', color:'#fecaca', aura:'#dc2626', hpMul:3.70, speedMul:.93, size:54, rewardMul:6.0, expMul:4.5, armor:.34, coreDamage:6, ability:'왕좌 개문', desc:'균열 왕좌를 개문해 전장을 왜곡하고, 마지막 구간에서 모든 하수인을 강화합니다.', effect:'crystalOverload', interval:118}
  }
};

const LATE_STAGE_BOSS_BALANCE = {
  5: {
    mid:   { hp:.88, armor:-.03, speed:.98, interval:1.12, core:-1 },
    final: { hp:.82, armor:-.05, speed:.97, interval:1.16, core:-1 }
  },
  6: {
    mid:   { hp:.84, armor:-.04, speed:.98, interval:1.14, core:-1 },
    final: { hp:.78, armor:-.06, speed:.96, interval:1.18, core:-1 }
  },
  7: {
    mid:   { hp:.80, armor:-.06, speed:.97, interval:1.16, core:-1 },
    final: { hp:.74, armor:-.08, speed:.95, interval:1.22, core:-2 }
  }
};

const BOSS_GLOBAL_EASE_V210 = {
  /* v210: user feedback — boss difficulty is still too high.
     Apply a broad boss-only reduction after the existing stage table.
     Normal enemies, tower stats, income, and wave rules are untouched. */
  mid:   { hp:.72, armor:-.055, speed:.94, interval:1.28, core:-1 },
  final: { hp:.58, armor:-.115, speed:.90, interval:1.48, core:-2 }
};

function applyLateStageBossBalance(stageNo, tier, boss){
  const stage = Number(stageNo) || 1;
  const key = tier === 'final' ? 'final' : 'mid';
  const tune = LATE_STAGE_BOSS_BALANCE[stage]?.[key] || {hp:1, armor:0, speed:1, interval:1, core:0};
  const global = BOSS_GLOBAL_EASE_V210[key] || BOSS_GLOBAL_EASE_V210.mid;
  const hpFactor = tune.hp * global.hp;
  const speedFactor = tune.speed * global.speed;
  const intervalFactor = tune.interval * global.interval;
  const armorDelta = tune.armor + global.armor;
  const coreDelta = tune.core + global.core;
  return {
    ...boss,
    hpMul: Math.max(.72, Number((boss.hpMul * hpFactor).toFixed(3))),
    speedMul: Number((boss.speedMul * speedFactor).toFixed(3)),
    armor: Math.max(0, Number(((boss.armor || 0) + armorDelta).toFixed(3))),
    interval: Math.round((boss.interval || 140) * intervalFactor),
    coreDamage: Math.max(1, Math.round((boss.coreDamage || 1) + coreDelta))
  };
}

function getStageBossDef(stageNo, tier='mid'){
  const stage = Number(stageNo) || 1;
  const pack = STAGE_BOSS_DEFS[stage] || STAGE_BOSS_DEFS[1];
  const key = tier === 'final' ? 'final' : 'mid';
  return applyLateStageBossBalance(stage, key, {...(key === 'final' ? pack.final : pack.mid)});
}

const StageMapState = {
  unlocked: 1,
  selected: 1,
  current: 1
};


const TEST_MODE_CONFIG = {
  enabled:false,
  allTowers:[0,1,2,3,4,5,6,7,8]
};
function setTestModeEnabled(flag){
  TEST_MODE_CONFIG.enabled = !!flag;
  document.body.classList.toggle('test-mode-active', TEST_MODE_CONFIG.enabled);
}
function applyTestModeOverrides(){
  setTestModeEnabled(true);
  StageMapState.unlocked = STAGE_MAP_DEFS.length;
  StageMapState.selected = clamp(Number(StageMapState.selected || 1), 1, STAGE_MAP_DEFS.length);
  StageMapState.current = StageMapState.selected;
  if(!META) META = defaultOfflineMeta();
  META.unlockedTowers = TEST_MODE_CONFIG.allTowers.slice();
  if(!META.flags || typeof META.flags !== 'object') META.flags = {};
  META.flags.testMode = true;
}
function enterTestMode(){
  loadOfflineMeta();
  loadStageMapProgress();
  applyTestModeOverrides();
  renderOfflineMetaPanel();
  showStageMap();
  toast('TEST MODE 활성화 — 모든 성역과 기본 타워가 해금되었습니다');
}

const SAVE_SCHEMA_VERSION = 2;
const OFFLINE_META_KEY = 'planetRiftOfflineMetaV2';
const LEGACY_OFFLINE_META_KEYS = ['planetRiftOfflineMetaV1'];
const STAGE_MAP_PROGRESS_KEY = 'planetRiftStageProgressV3';
const LEGACY_STAGE_MAP_KEYS = ['planetRiftStageProgressV2'];
const OFFLINE_UPGRADE_CONFIG = {
  global_damage:{name:'공격력 연구', desc:'모든 행성 공격력 증가', max:12, base:5, step:5, unlockStage:1, catalog:'global_damage'},
  global_crit:{name:'치명타 연구', desc:'치명 확률과 치명 피해 증가', max:10, base:7, step:6, unlockStage:2, catalog:'global_crit'},
  global_speed:{name:'공격속도 연구', desc:'모든 행성 공격속도 증가', max:10, base:8, step:7, unlockStage:3, catalog:'global_speed'},
  global_boss:{name:'보스 대응 연구', desc:'보스 피해와 방어 관통 증가', max:10, base:10, step:8, unlockStage:4, catalog:'global_boss'},
  global_range:{name:'사거리 연구', desc:'모든 행성 사거리 증가', max:8, base:11, step:8, unlockStage:5, catalog:'global_range'},
  global_plate:{name:'장판 증폭 연구', desc:'장판 위 행성 추가 강화', max:8, base:12, step:9, unlockStage:6, catalog:'global_plate'},
  global_economy:{name:'전장 회수 연구', desc:'처치 보상 증가', max:8, base:12, step:9, unlockStage:7, catalog:'global_economy'}
};

const STARTER_PLANET_TYPES = [2, 5]; // 스톰 + 광자: 기본 전기/직선 화력, 솔라는 용암 성운 클리어 보상으로 지급
const STAGE_TOWER_REWARDS = {
  1:{type:4, name:'블랙홀 행성', theme:'공허 성역 기술', desc:'공허 균열을 끌어당기는 중력 병기. 군중 제어와 보스 지연에 강합니다.'},
  2:{type:1, name:'프로스트 행성', theme:'빙결 외곽 기술', desc:'냉각 폭풍을 제어하는 감속 병기. 빠른 적과 보스 패턴을 끊습니다.'},
  3:{type:0, name:'솔라 행성', theme:'용암 성운 기술', desc:'용암 성운의 태양핵 폭주를 안정화해 얻은 광역 연소 병기. 장갑형 적과 밀집 웨이브를 녹입니다.'},
  4:{type:3, name:'바이오 행성', theme:'생체 정글 기술', desc:'포자 생태계를 역이용하는 독성 병기. 재생 군체와 장기전에 강합니다.'},
  5:{type:6, name:'스모그 행성', theme:'매연 폐역 기술', desc:'오염 장판을 정화·응축·역류시켜 적의 항로를 제어합니다.'},
  6:{type:7, name:'크리스탈 행성', theme:'수정 성운 기술', desc:'초과 피해를 축전하고 프리즘 선로와 공명 장판으로 전장 구조를 바꿉니다.'},
  7:{type:8, name:'메카 행성', theme:'기계 핵성 기술', desc:'실드와 장갑을 해체하고 임시 위성포와 코어 방벽을 재가동합니다.'}
};


// v141: canonical progression manifest. Stage unlocks and planet rewards are derived from
// this single table, while still respecting already-saved stage progress.
const STAGE_UNLOCK_MANIFEST = STAGE_MAP_DEFS.map(def => ({
  stage: def.stage,
  opensNextStageOnClear: Math.min(STAGE_MAP_DEFS.length, def.stage + 1),
  towerReward: STAGE_TOWER_REWARDS[def.stage] || null
}));
function isTestModeActiveCanonical(){
  return !!(TEST_MODE_CONFIG && TEST_MODE_CONFIG.enabled);
}
function allTowerTypesFromManifest(){
  const set = new Set(STARTER_PLANET_TYPES);
  Object.values(STAGE_TOWER_REWARDS || {}).forEach(r => {
    if(r && Number.isInteger(Number(r.type))) set.add(Number(r.type));
  });
  return Array.from(set).sort((a,b)=>a-b);
}
function deriveProgressFromManifest(savedProgress=null){
  const max = STAGE_MAP_DEFS.length;
  if(isTestModeActiveCanonical()){
    return {
      unlocked:max,
      selected:clamp(Number(StageMapState.selected || 1), 1, max),
      current:clamp(Number(StageMapState.current || StageMapState.selected || 1), 1, max),
      towers:allTowerTypesFromManifest()
    };
  }
  const clears = META?.clears || {};
  const savedUnlocked = clamp(Number(savedProgress?.unlocked || StageMapState?.unlocked || 1), 1, max);
  let unlocked = savedUnlocked;
  const towerSet = new Set(normalizeUnlockedTowers(META?.unlockedTowers, clears));
  for(const row of STAGE_UNLOCK_MANIFEST){
    if(Number(clears[String(row.stage)] || clears[row.stage] || 0) > 0){
      unlocked = Math.max(unlocked, row.opensNextStageOnClear);
      if(row.towerReward) towerSet.add(Number(row.towerReward.type));
    }
  }
  return {
    unlocked:clamp(unlocked, 1, max),
    selected:clamp(Number(savedProgress?.selected || StageMapState.selected || unlocked), 1, max),
    current:clamp(Number(savedProgress?.current || StageMapState.current || StageMapState.selected || unlocked), 1, max),
    towers:Array.from(towerSet).filter(v => Number.isInteger(Number(v))).map(Number).sort((a,b)=>a-b)
  };
}
function applyCanonicalProgressToState(opts={}){
  const max = STAGE_MAP_DEFS.length;
  const progress = deriveProgressFromManifest(opts.savedProgress || null);
  const keepSelected = opts.keepSelected === true || opts.preferSelected === true;
  StageMapState.unlocked = progress.unlocked;
  if(opts.selectStage){
    StageMapState.selected = clamp(Number(opts.selectStage), 1, max);
  }else if(keepSelected){
    StageMapState.selected = clamp(Number(StageMapState.selected || progress.selected || 1), 1, max);
  }else{
    StageMapState.selected = clamp(Number(progress.selected || StageMapState.selected || 1), 1, max);
  }
  if(!opts.allowLockedPreview && !isTestModeActiveCanonical() && StageMapState.selected > StageMapState.unlocked){
    StageMapState.selected = StageMapState.unlocked;
  }
  StageMapState.current = clamp(Number(opts.currentStage || progress.current || StageMapState.selected || 1), 1, max);
  if(META) META.unlockedTowers = progress.towers.slice();
  if(opts.save !== false){
    saveOfflineMeta();
    saveStageMapProgress();
  }
  return progress;
}

function deriveUnlockedStageFromMeta(){
  if(typeof deriveProgressFromManifest === 'function') return deriveProgressFromManifest({unlocked:StageMapState?.unlocked || 1}).unlocked;
  return clamp(Number(StageMapState?.unlocked || 1), 1, STAGE_MAP_DEFS.length);
}
function syncStageUnlockFromClears(){
  if(typeof applyCanonicalProgressToState === 'function'){
    return applyCanonicalProgressToState({keepSelected:true, allowLockedPreview:true, save:!TEST_MODE_CONFIG.enabled});
  }
  return null;
}
const OFFLINE_CHAPTERS = {
  1:{title:'1장. 공허 성역 — 첫 균열', intro:'오리온 외곽 성좌의 입구에서 첫 균열이 열린다. 지휘관은 불안정한 장판 위에 행성 병기를 배치해 코어를 지켜야 한다.', mid:'성운 감시자가 방어선을 시험한다. 재생을 끊지 못하면 전선이 계속 밀린다.', final:'공허 심핵이 모습을 드러낸다. 이는 균열 너머 지휘체의 전조에 불과하다.', clear:'첫 성역이 안정화되며 오리온 성좌의 항로가 이어진다.'},
  2:{title:'2장. 빙결 외곽 — 멈춘 궤도', intro:'냉각 폭풍이 항로를 봉쇄한다. 배치와 병합 타이밍이 전투의 핵심이 된다.', mid:'빙하 포효체가 가장 강한 행성을 얼린다. 단일 화력만 믿으면 방어선이 무너진다.', final:'절대영도 핵은 복수의 행성을 봉쇄한다. 균형 잡힌 장판 운용이 필요하다.', clear:'얼어붙은 항로가 풀리며 다음 태양 플레어 구역 좌표가 열린다.'},
  3:{title:'3장. 용암 성운 — 폭주하는 태양핵', intro:'용암 성운의 적들은 장갑을 두르고 진입한다. 광역 연소 화력이 전투의 핵심이 된다.', mid:'화염 거신이 갑각을 덧입고 돌진한다. 화력이 모자라면 코어가 먼저 무너진다.', final:'태양 화옥은 과열된 균열의 심장이다. 고레벨 병합이 승부를 가른다.', clear:'태양핵의 폭주가 멈췄고, 오리온 성좌 깊은 곳의 생체 신호가 포착된다.'},
  4:{title:'4장. 생체 정글 — 살아있는 성역', intro:'성역 자체가 하나의 생명체처럼 반응한다. 포자와 재생 군체가 장기전을 강요한다.', mid:'포자 군체가 주변 적을 치유한다. 회복보다 빠른 화력 성장이 필요하다.', final:'월드루트 프라임은 행성 병기와 균열 생태계를 동시에 침식한다.', clear:'생체 정글의 코어가 정화되며 오염된 산업 궤도 좌표가 드러난다.'},
  5:{title:'5장. 매연 폐역 — 숨 막힌 궤도', intro:'정화된 생체 정글 뒤편에서 오래된 산업 궤도가 되살아난다. 짙은 매연이 시야와 센서를 막는다.', mid:'굴뚝 포식체가 검은 장막을 뿜어 방어선을 흐린다. 감속과 약화를 겹쳐 붙잡아야 한다.', final:'스모그 오메가는 폐기된 공장 행성 전체를 병기화한 존재다.', clear:'매연 폐역의 굴뚝이 멈추고 프리즘 파열 좌표가 열린다.'},
  6:{title:'6장. 수정 성운 — 굳어버린 균열', intro:'남은 균열 에너지가 차갑게 굳어 수정 성운을 형성했다. 장판은 빛과 에너지를 저장하고 굴절시킨다.', mid:'프리즘 가디언이 결정 장막을 펼친다. 초과 피해와 장판 공명을 관리해야 한다.', final:'수정 군주는 균열 에너지를 재결정화해 전장을 뒤틀고 있다.', clear:'수정 성운의 결정핵이 안정화되며 오리온 성좌의 마지막 핵성 좌표가 활성화된다.'},
  7:{title:'7장. 기계 핵성 — 폭주한 방어망', intro:'고대 행성 방어망의 중심부가 깨어났다. 균열 오염으로 폭주한 핵성은 모든 생명 신호를 침입자로 판단한다.', mid:'수리 드론 군집이 기계 유닛을 재가동한다. 적의 방어 구조를 해체하지 못하면 전선이 굳어진다.', final:'오토마톤 코어가 방어망 전체를 재부팅한다. 실드와 장갑을 해체하고 마지막 압박을 버텨야 한다.', clear:'오리온 외곽 성좌가 복원되었다. 멀리서 백조 균열 성좌가 붉게 흔들리기 시작한다.'},
  8:{title:'8장. 중력 무덤 — 죽은 행성의 궤도', intro:'백조 균열 성좌 초입. 죽은 행성들의 무덤이 중력의 울림으로 항로를 뒤틀고 있다.', mid:'궤도 포식자가 중력 고리를 넓혀 적을 끌어모은다. 군중 제어와 보스 지연이 중요하다.', final:'죽은 별의 심장은 주변 궤도를 붕괴시켜 전장의 위치 감각을 무너뜨린다.', clear:'중력 무덤이 진정되었지만, 과전류가 성좌 전체를 파고든다.'},
  9:{title:'9장. 번개 회랑 — 과전류 항로', intro:'붕괴된 에너지 선로가 전장을 가로지르며 적들을 가속시킨다. 빠른 대응과 연쇄 화력이 필요하다.', mid:'뇌광 추적자가 번개 꼬리를 남기며 질주한다. 한순간의 누수가 코어 붕괴로 이어진다.', final:'제로 스파크 코어는 회랑 전체를 과부하 상태로 전환한다.', clear:'전류의 회랑이 정리되자 시간 잔해가 드러난다.'},
  10:{title:'10장. 시간 잔해 — 반복되는 전장', intro:'과거 전투의 파편이 되감기며 같은 웨이브가 서로 겹친다. 템포를 놓치면 압박이 누적된다.', mid:'시간 잔영체가 과거의 적군 잔상을 다시 호출한다.', final:'크로노 리프트는 웨이브 순서를 교란하고 지연을 증폭시킨다.', clear:'백조 균열 성좌가 복원되며 용자리 심연 성좌로 향하는 암흑 항로가 열린다.'},
  11:{title:'11장. 침묵 성단 — 끊어진 신호', intro:'용자리 심연 성좌에서는 모든 신호가 약화된다. 적 특성을 완전히 파악하기 전까지 침묵이 지속된다.', mid:'무음 사냥꾼은 감응 차단막을 펼치며 타워들의 반응을 늦춘다.', final:'침묵의 관측자는 보이지 않는 신호 위에서 전장을 해체한다.', clear:'침묵 성단을 통과하자 균열 왕좌로 향하는 마지막 길이 보인다.'},
  12:{title:'12장. 균열 왕좌 — 은하수의 심장', intro:'모든 별자리의 항로가 하나로 겹치며 균열의 왕이 모습을 드러낸다. 지금까지의 모든 전술을 총동원해야 한다.', mid:'성역 복제체가 이전 보스들의 패턴을 조합해 압박한다.', final:'균열의 왕이 왕좌를 개문하며 은하 중심핵을 집어삼키려 한다. 이 전투가 은하수 방어전의 분기점이다.', clear:'균열 왕좌가 붕괴하고 은하 항로가 안정화된다. 이제 별자리 전체의 3성 숙련도와 재정화 루프가 시작된다.'}
};
let META = defaultOfflineMeta();

function defaultOfflineMeta(){
  return {saveVersion:SAVE_SCHEMA_VERSION,shards:0,totalClears:0,totalDefeats:0,bestWave:{},clears:{},story:{},upgrades:{},mastery:{},flags:{},settings:{bgm:true,sfx:true},unlockedTowers:STARTER_PLANET_TYPES.slice()};
}
function normalizeOfflineMeta(raw){
  const base = defaultOfflineMeta();
  const m = Object.assign(base, raw || {});
  m.saveVersion = Math.max(1, Math.floor(Number(raw?.saveVersion || 1)));
  m.bestWave = Object.assign({}, base.bestWave, raw?.bestWave || {});
  m.clears = Object.assign({}, base.clears, raw?.clears || {});
  m.story = Object.assign({}, base.story, raw?.story || {});
  m.upgrades = Object.assign({}, base.upgrades, raw?.upgrades || {});
  m.mastery = Object.assign({}, base.mastery, raw?.mastery || {});
  m.flags = Object.assign({}, base.flags, raw?.flags || {});
  m.settings = Object.assign({}, base.settings, raw?.settings || {});
  m.unlockedTowers = normalizeUnlockedTowers(raw?.unlockedTowers, m.clears);
  m.shards = Math.max(0, Math.floor(Number(m.shards) || 0));
  m.totalClears = Math.max(0, Math.floor(Number(m.totalClears) || 0));
  m.totalDefeats = Math.max(0, Math.floor(Number(m.totalDefeats) || 0));
  m.saveVersion = SAVE_SCHEMA_VERSION;
  return m;
}
function normalizeUnlockedTowers(rawUnlocks=null, clears={}){
  const set = new Set(STARTER_PLANET_TYPES);
  if(Array.isArray(rawUnlocks)) rawUnlocks.forEach(v => set.add(Number(v)));
  for(const [stageNo, count] of Object.entries(clears || {})){
    if(Number(count) > 0){
      const reward = STAGE_TOWER_REWARDS[Number(stageNo)];
      if(reward) set.add(reward.type);
    }
  }
  return Array.from(set).filter(v => Number.isInteger(v) && v >= 0 && v < BASE_PLANET_COUNT).sort((a,b)=>a-b);
}
function unlockedTowerSet(){
  const raw = Array.isArray(META?.unlockedTowers) ? META.unlockedTowers : STARTER_PLANET_TYPES;
  return new Set(normalizeUnlockedTowers(raw, META?.clears || {}));
}
function isTowerUnlocked(type){
  return unlockedTowerSet().has(Number(type));
}
function isHangarPlanetLocked(type){
  if(Number(type) === HIDDEN_PLANET_TYPE) return isHiddenLocked();
  return !isTowerUnlocked(type);
}
function availableSummonTypes(){
  const pool = Array.from(unlockedTowerSet()).filter(type => type >= 0 && type < BASE_PLANET_COUNT);
  return pool.length ? pool : STARTER_PLANET_TYPES.slice();
}
function stageTowerReward(stageNo){
  return STAGE_TOWER_REWARDS[Number(stageNo)] || null;
}
function stageTowerRewardText(stageNo){
  const reward = stageTowerReward(stageNo);
  if(!reward) return '추가 타워 보상 없음';
  const owned = isTowerUnlocked(reward.type);
  return `${owned ? '획득 완료' : '클리어 보상'}: ${reward.name} · ${reward.theme}`;
}
function towerUnlockRequirementText(type){
  const entry = Object.entries(STAGE_TOWER_REWARDS).find(([,reward]) => reward.type === Number(type));
  if(!entry) return '기본 지급';
  const [stageNo, reward] = entry;
  return `${stageNo}성역 클리어 보상`;
}
function unlockStageTower(stageNo){
  const reward = stageTowerReward(stageNo);
  if(!reward || !META) return false;
  const set = unlockedTowerSet();
  if(set.has(reward.type)) return false;
  set.add(reward.type);
  META.unlockedTowers = Array.from(set).sort((a,b)=>a-b);
  saveOfflineMeta();
  const msg = `신규 타워 획득 — ${reward.name}`;
  toast(msg);
  sound('unlock');
  log(`${msg}: ${reward.desc}`);
  return true;
}
function unlockedTowerCount(){
  return availableSummonTypes().length;
}
function nextTowerRewardText(){
  for(const stage of STAGE_MAP_DEFS){
    const reward = stageTowerReward(stage.stage);
    if(reward && !isTowerUnlocked(reward.type)) return `${stage.ko} 클리어 → ${reward.name}`;
  }
  return '모든 성역 타워 획득 완료';
}

function loadOfflineMeta(){
  try{
    let rawText = localStorage.getItem(OFFLINE_META_KEY);
    if(!rawText){
      for(const key of LEGACY_OFFLINE_META_KEYS){
        rawText = localStorage.getItem(key);
        if(rawText) break;
      }
    }
    META = normalizeOfflineMeta(JSON.parse(rawText || 'null'));
    if(typeof applyCanonicalProgressToState === 'function') applyCanonicalProgressToState({preferSelected:true, allowLockedPreview:true, save:false});
    if(!TEST_MODE_CONFIG.enabled) saveOfflineMeta();
  }
  catch(err){ META = defaultOfflineMeta(); }
  renderOfflineMetaPanel();
}
function saveOfflineMeta(){
  if(TEST_MODE_CONFIG.enabled) return;
  try{
    META.saveVersion = SAVE_SCHEMA_VERSION;
    localStorage.setItem(OFFLINE_META_KEY, JSON.stringify(META));
  }
  catch(err){}
}

function isOfflineUpgradeUnlocked(key){
  const cfg = OFFLINE_UPGRADE_CONFIG[key];
  if(!cfg) return false;
  if(TEST_MODE_CONFIG.enabled) return true;
  return Number(StageMapState?.unlocked || 1) >= Number(cfg.unlockStage || 1);
}
function unlockedGeneralSkillCount(){
  return Object.keys(OFFLINE_UPGRADE_CONFIG).filter(isOfflineUpgradeUnlocked).length;
}
function nextGeneralSkillUnlockText(){
  const next = Object.entries(OFFLINE_UPGRADE_CONFIG)
    .map(([key,cfg]) => ({key,cfg}))
    .filter(x => !isOfflineUpgradeUnlocked(x.key))
    .sort((a,b)=>Number(a.cfg.unlockStage||1)-Number(b.cfg.unlockStage||1))[0];
  return next ? `${next.cfg.unlockStage}성역 도달 → ${next.cfg.name}` : '모든 일반 스킬 오픈 완료';
}
function syncGlobalUpgradesFromMeta(){
  if(!S) return;
  const out = {};
  for(const u of GLOBAL_UPGRADE_CATALOG){
    out[u.id] = Math.max(0, Number(META?.upgrades?.[u.id] || 0));
  }
  S.globalUpgrades = out;
}
function globalSkillSummaryText(){
  const g = getGlobalUpgradeStats();
  const parts = [
    g.damage ? `공격 +${fmtPct2(g.damage)}` : '',
    g.critChance ? `치명 +${fmtPct2(g.critChance)}` : '',
    g.fireRate ? `공속 +${fmtPct2(g.fireRate)}` : '',
    g.bossDamage ? `보스 +${fmtPct2(g.bossDamage)}` : '',
    g.range ? `사거리 +${fmt2(g.range)}` : '',
    g.plateDamage ? `장판 +${fmtPct2(g.plateDamage)}` : '',
    g.reward ? `보상 +${fmtPct2(g.reward)}` : ''
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : '없음';
}
function globalSkillSummaryHtml(){
  const txt = globalSkillSummaryText();
  return `<span class="planetGlobalText"><b>전역 효과</b> ${escapeHtml(txt)}</span>`;
}

function offlineUpgradeCost(key){
  const cfg = OFFLINE_UPGRADE_CONFIG[key];
  const lv = Number(META.upgrades[key] || 0);
  return cfg ? cfg.base + cfg.step * lv : 9999;
}
function buyOfflineUpgrade(key){
  const cfg = OFFLINE_UPGRADE_CONFIG[key];
  if(!cfg) return;
  if(!isOfflineUpgradeUnlocked(key)){ toast(`${cfg.unlockStage}성역 도달 후 열립니다`); return; }
  const lv = Number(META.upgrades[key] || 0);
  if(lv >= cfg.max){ toast('이미 최대 강화입니다'); return; }
  const cost = offlineUpgradeCost(key);
  if(META.shards < cost){ toast(`성흔 조각이 부족합니다: ${fmt2(cost)} 필요`); return; }
  META.shards -= cost;
  META.upgrades[key] = lv + 1;
  saveOfflineMeta();
  renderOfflineMetaPanel();
  toast(`${cfg.name} Lv.${fmt2(lv+1)}`);
  if(S){ syncGlobalUpgradesFromMeta(); updateUI(); }
}
function currentSummonCost(){
  return 100;
}
function applyOfflineMetaToRun(resetHp=true){
  if(!S || !META) return;
  syncGlobalUpgradesFromMeta();
  S.maxHp = Math.max(S.maxHp || 22, 22);
  if(resetHp) S.hp = S.maxHp;
  S.gold = Math.max(S.gold || 0, 420);
  S.mods.reward = Math.max(S.mods.reward || 0, 0);
  S.mods.repair = Math.max(S.mods.repair || 0, 0);
  S.offline = {summonCost:currentSummonCost(), cooldownScale:1};
}
function getOfflineStoryLog(stageNo, phase='intro'){
  const st = OFFLINE_CHAPTERS[Number(stageNo)] || OFFLINE_CHAPTERS[1];
  return st[phase] || st.intro || '';
}
function markOfflineStory(stageNo, phase){
  META.story[`${stageNo}_${phase}`] = true;
  saveOfflineMeta();
}
function recordOfflineWaveProgress(){
  if(!S || !META) return;
  const stageNo = String(S.stageNo || StageMapState.current || 1);
  META.bestWave[stageNo] = Math.max(Number(META.bestWave[stageNo] || 0), Number(S.ogge || 1));
  saveOfflineMeta();
  renderOfflineMetaPanel();
}
function recordOfflineRunEnd(cleared=false, stageNoOverride=null){
  if(!S || !META || S.runEnded) return;
  S.runEnded = true;
  const stageNo = String(stageNoOverride || S.stageNo || StageMapState.current || 1);
  META.bestWave[stageNo] = Math.max(Number(META.bestWave[stageNo] || 0), Number(S.ogge || 1));
  if(cleared){
    META.totalClears += 1;
    META.clears[stageNo] = Number(META.clears[stageNo] || 0) + 1;
    const reward = 8 + Number(stageNo) * 4 + Math.min(12, Number(S.level || 1));
    META.shards += reward;
    markOfflineStory(stageNo, 'clear');
    toast(`성역 클리어 보상 — 성흔 조각 +${fmt2(reward)}`);
    unlockStageTower(stageNo);
    // Immediately persist stage + tower progression from the manifest.
    // This prevents the map from falling back to the previous unlock count if a later render runs first.
    const nextStageNo = Math.min(STAGE_MAP_DEFS.length, Number(stageNo) + 1);
    StageMapState.unlocked = Math.max(Number(StageMapState.unlocked || 1), nextStageNo);
    StageMapState.current = nextStageNo;
    if(Number(StageMapState.selected || 1) <= Number(stageNo)) StageMapState.selected = nextStageNo;
    if(typeof applyCanonicalProgressToState === 'function'){
      applyCanonicalProgressToState({selectStage:StageMapState.selected, currentStage:StageMapState.current, keepSelected:true, allowLockedPreview:true, save:true});
    }else{
      saveStageMapProgress();
    }
  }else{
    META.totalDefeats += 1;
    const consolation = Math.max(2, Math.floor((Number(S.ogge || 1) + Number(S.level || 1)) / 2));
    META.shards += consolation;
    toast(`전투 기록 회수 — 성흔 조각 +${fmt2(consolation)}`);
  }
  saveOfflineMeta();
  renderOfflineMetaPanel();
}

function gameOverTipText(){
  const g = getGlobalUpgradeStats();
  if(S.ogge >= 5 && !g.bossDamage) return '5웨이브 이후 보스가 부담스럽다면 성역 지도에서 보스 대응 연구를 먼저 올리는 편이 좋습니다.';
  if((S.runKills || 0) < Math.max(8, S.ogge * 8)) return '초반 처치 수가 낮습니다. 공격력 연구 또는 공격속도 연구를 올린 뒤 재도전해 보세요.';
  if((S.leakedEnemies || 0) >= 4) return '적이 많이 새어 나갔습니다. 병목 구간에 행성을 모으고 타워 합치기으로 핵심 타워 레벨을 먼저 올려보세요.';
  if(S.gold < currentSummonCost()) return '수정이 부족했던 판입니다. 전장 회수 연구가 열려 있다면 보상 증가를 올리면 운영이 안정됩니다.';
  return '실패 보상으로 얻은 성흔 조각을 성역 지도에서 일반 스킬에 투자한 뒤 같은 성역에 재도전하세요.';
}

function removeGameOverOverlay(){
  const existing = $('gameOverOverlay');
  if(existing) existing.remove();
}

function showGameOverOverlay(summary){
  try{
    removeGameOverOverlay();
    const safeSummary = summary || {};
    const stageNo = Number(safeSummary.stageNo || S?.stageNo || StageMapState.current || 1);
    const waveNo = Number(safeSummary.wave || safeSummary.ogge || S?.ogge || 1);
    const def = getStageDef(stageNo);
    const overlay = document.createElement('div');
    overlay.id = 'gameOverOverlay';
    overlay.className = 'gameOverOverlay';
    overlay.innerHTML = `<div class="gameOverCard" role="dialog" aria-modal="true" aria-labelledby="gameOverTitle">
      <div class="gameOverKicker">MISSION FAILED</div>
      <h2 id="gameOverTitle">${STORY_EVENT_TEXT.gameOverTitle}</h2>
      <p>${escapeHtml(def.name)} ${fmt2(stageNo)}성역에서 코어가 파괴되었습니다. ${escapeHtml(STORY_EVENT_TEXT.gameOverBody)} 획득한 성흔 조각으로 일반 스킬을 강화할 수 있습니다.</p>
      <div class="gameOverStats">
        <div class="gameOverStat"><span>STAGE</span><b>${fmt2(stageNo)}-${fmt2(waveNo)}</b></div>
        <div class="gameOverStat"><span>KILLS</span><b>${fmt2(safeSummary.kills || 0)}</b></div>
        <div class="gameOverStat"><span>BEST COMBO</span><b>x${fmt2(safeSummary.bestCombo || 0)}</b></div>
        <div class="gameOverStat"><span>SHARDS</span><b>+${fmt2(safeSummary.shardsGained || 0)}</b></div>
      </div>
      <div class="gameOverTip">추천: ${escapeHtml(gameOverTipText())}</div>
      <div class="gameOverActions">
        <button id="gameOverMapBtn" class="btnAlt">은하 지도에서 강화</button>
        <button id="gameOverRetryBtn" class="btnGreen">같은 성역 재도전</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    if(S) S.gameOverOverlayShown = true;
    const retry = overlay.querySelector('#gameOverRetryBtn');
    const mapBtn = overlay.querySelector('#gameOverMapBtn');
    if(retry){
      retry.onclick = () => {
        removeGameOverOverlay();
        StageMapState.selected = stageNo;
        startSelectedStageFromMap();
      };
    }
    if(mapBtn){
      mapBtn.onclick = () => {
        removeGameOverOverlay();
        cancelAnimationFrame(raf);
        $('game').style.display = 'none';
        $('stageMap').style.display = 'block';
        StageMapState.selected = stageNo;
        StageMapState.current = stageNo;
        stopAllGameAudio();
        reset();
        resetBattleUnitsForStageMap();
        renderStageMap();
        const hint = $('stageHint');
        if(hint) hint.textContent = `전투 실패 기록 회수 완료 — 성흔 조각으로 일반 스킬을 강화한 뒤 ${fmt2(stageNo)}성역에 재도전하세요.`;
      };
    }
    return overlay;
  }catch(err){
    console.error('game over overlay failed', err);
    showEmergencyGameOverOverlay(summary, err);
    return null;
  }
}

function showEmergencyGameOverOverlay(summary={}, err=null){
  removeGameOverOverlay();
  const stageNo = Number(summary.stageNo || S?.stageNo || StageMapState.current || 1);
  const overlay = document.createElement('div');
  overlay.id = 'gameOverOverlay';
  overlay.className = 'gameOverOverlay';
  overlay.innerHTML = `<div class="gameOverCard" role="dialog" aria-modal="true">
    <div class="gameOverKicker">MISSION FAILED</div>
    <h2>CORE COLLAPSE</h2>
    <p>코어가 파괴되어 전투가 종료되었습니다. 은하 지도에서 강화하거나 같은 성역에 재도전할 수 있습니다.</p>
    <div class="gameOverTip">${err ? '표시 오류를 복구했습니다. ' : ''}추천: 성흔 조각으로 전역 연구를 강화한 뒤 재도전하세요.</div>
    <div class="gameOverActions">
      <button id="gameOverMapBtn" class="btnAlt">은하 지도</button>
      <button id="gameOverRetryBtn" class="btnGreen">재도전</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  if(S) S.gameOverOverlayShown = true;
  const retry = overlay.querySelector('#gameOverRetryBtn');
  const mapBtn = overlay.querySelector('#gameOverMapBtn');
  if(retry) retry.onclick = () => { removeGameOverOverlay(); StageMapState.selected = stageNo; startSelectedStageFromMap(); };
  if(mapBtn) mapBtn.onclick = () => { removeGameOverOverlay(); stopAllGameAudio(); $('game').style.display='none'; $('stageMap').style.display='block'; StageMapState.selected=stageNo; StageMapState.current=stageNo; reset(); resetBattleUnitsForStageMap(); renderStageMap(); };
  return overlay;
}


function triggerGameOver(reason='core'){
  if(!S || S.gameOver) return;
  S.gameOver = true;
  S.active = false;
  S.paused = true;
  S.skillModalOpen = false;
  S.queue = [];
  S.hp = 0;
  S.gameOverOverlayShown = false;
  const beforeShards = Number(META?.shards || 0);
  try{ recordOfflineRunEnd(false); }
  catch(err){ console.error('game over record failed', err); }
  const afterShards = Number(META?.shards || 0);
  const summary = {
    reason,
    stageNo: Number(S.stageNo || StageMapState.current || 1),
    wave: Number(S.ogge || 1),
    kills: Number(S.runKills || 0),
    bestCombo: Number(S.combo?.best || 0),
    shardsGained: Math.max(0, afterShards - beforeShards)
  };
  S.lastGameOverSummary = summary;
  // 게임오버 직후에는 현재 재생 중인 BGM/SFX/합성음을 모두 중지한다.
  // 결과 BGM도 재생하지 않아 실패 화면이 정지 상태로 유지되게 한다.
  try{ stopAllGameAudio(); }catch(err){ console.warn('game over audio stop failed', err); }
  try{ toast('코어 파괴 — 전투 기록 회수 완료'); }catch(err){}
  try{ log(`게임 오버: ${fmt2(summary.stageNo)}성역 ${fmt2(summary.wave)}웨이브 / 처치 ${fmt2(summary.kills)} / 조각 +${fmt2(summary.shardsGained)}`); }catch(err){}
  try{ updateUI(); }catch(err){ console.error('game over ui update failed', err); }
  showGameOverOverlay(summary);
  setTimeout(() => {
    if(S?.gameOver && !$('gameOverOverlay')) showGameOverOverlay(S.lastGameOverSummary || summary);
  }, 300);
  setTimeout(() => {
    if(S?.gameOver && !$('gameOverOverlay')) showEmergencyGameOverOverlay(S.lastGameOverSummary || summary);
  }, 900);
}


function offlineUpgradeHtml(){
  const nextStage = Math.min(STAGE_MAP_DEFS.length, Number(StageMapState?.unlocked || 1) + 1);
  const entries = Object.entries(OFFLINE_UPGRADE_CONFIG).filter(([key,cfg]) => isOfflineUpgradeUnlocked(key) || Number(cfg.unlockStage || 1) <= nextStage);
  return `<div class="offlineUpgradeGrid">${entries.map(([key,cfg])=>{
    const lv = Number(META.upgrades[key] || 0);
    const maxed = lv >= cfg.max;
    const locked = !isOfflineUpgradeUnlocked(key);
    const cost = offlineUpgradeCost(key);
    const catalog = getGlobalUpgrade(cfg.catalog || key);
    const effect = catalog ? globalUpgradeText(catalog, Math.max(1, lv || 1)) : cfg.desc;
    return `<button class="offlineUpgradeBtn ${locked?'locked':''}" data-offline-upgrade="${key}" ${locked || maxed?'disabled':''}>
      <b>${cfg.name} Lv.${fmt2(lv)}/${fmt2(cfg.max)}</b><span>${locked ? `${fmt2(cfg.unlockStage)}성역 도달 시 오픈` : escapeHtml(effect)}</span><em>${locked?'LOCKED':(maxed?'MAX':`비용 ${fmt2(cost)}`)}</em>
    </button>`;
  }).join('')}</div>`;
}
function resolveStageInfoSelection(){
  const panelStage = Number($('stageInfoPanel')?.dataset?.stage || 0);
  const mapStage = Number($('stageMap')?.dataset?.selected || 0);
  const stateStage = Number(StageMapState?.selected || StageMapState?.current || 1);
  return clamp(panelStage || mapStage || stateStage || 1, 1, STAGE_MAP_DEFS.length);
}
function renderOfflineMetaPanel(){
  if(!META) return;
  const selectedStage = resolveStageInfoSelection();
  const story = OFFLINE_CHAPTERS[selectedStage] || OFFLINE_CHAPTERS[1];
  const copy = getStageDescriptionCopy(selectedStage);
  const clears = Number(META.clears[String(selectedStage)] || 0);
  const best = Number(META.bestWave[String(selectedStage)] || 0);
  const rewardText = stageTowerRewardText(selectedStage);
  const skillCount = unlockedGeneralSkillCount();
  const totalSkill = Object.keys(OFFLINE_UPGRADE_CONFIG).length;
  const globalLine = globalSkillSummaryText();
  const html = `<div class="offlineMetaTop"><div><div class="offlineMetaTitle">${story.title}</div><div class="offlineMetaStory">${escapeHtml(copy.summary)} 추천 전략: ${escapeHtml(copy.strategy)} 현재 전역 효과: ${escapeHtml(globalLine)}</div></div><div class="offlineMetaShard">성흔 조각 ${fmt2(META.shards)}</div></div>
    <div class="offlineStatRow"><span class="offlinePill">선택 성역 클리어 ${fmt2(clears)}</span><span class="offlinePill">최고 웨이브 ${fmt2(best)}</span><span class="offlinePill">일반 스킬 ${fmt2(skillCount)}/${fmt2(totalSkill)}</span><span class="offlinePill">다음 오픈: ${escapeHtml(nextGeneralSkillUnlockText())}</span><span class="offlinePill">${rewardText}</span></div>
    ${offlineUpgradeHtml()}`;
  const compact = `<div class="offlineMetaTop"><div><div class="offlineMetaTitle">${story.title}</div><div class="offlineMetaStory">${escapeHtml(copy.summary)} 추천: ${escapeHtml(copy.strategy)}</div></div><div class="offlineMetaShard">조각 ${fmt2(META.shards)}</div></div><div class="offlineStatRow"><span class="offlinePill">클리어 ${fmt2(clears)}</span><span class="offlinePill">최고 ${fmt2(best)}W</span><span class="offlinePill">일반 ${fmt2(skillCount)}/${fmt2(totalSkill)}</span><span class="offlinePill">${rewardText}</span></div>`;
  const side = $('offlinePanelBody'); if(side) side.innerHTML = html;
  const menu = $('offlineMenuPanel');
  if(menu){
    menu.innerHTML = `<div class="offlineMetaTop"><div><div class="offlineMetaTitle">COMMAND ARCHIVE</div><div class="offlineMetaStory">성흔 조각과 전역 효과만 요약합니다. 공통 연구 업그레이드는 강화 관리 창에서 진행합니다.</div></div><div class="offlineMetaShard">성흔 조각 ${fmt2(META.shards)}</div></div><div class="offlineStatRow"><span class="offlinePill">전역 효과: ${escapeHtml(globalLine)}</span><span class="offlinePill">공통 연구 ${fmt2(skillCount)}/${fmt2(totalSkill)}</span><span class="offlinePill">다음 오픈: ${escapeHtml(nextGeneralSkillUnlockText())}</span></div>`;
  }
  const stage = $('offlineStagePanel'); if(stage) stage.innerHTML = compact;
}


function getStageDef(stageNo){
  return STAGE_MAP_DEFS.find(s => s.stage === Number(stageNo)) || STAGE_MAP_DEFS[0];
}

function getStagePresentation(stageNo){
  return STAGE_PRESENTATION[Number(stageNo)] || STAGE_PRESENTATION[1];
}

function getConstellationArcByStage(stageNo){
  const n = Number(stageNo);
  return CONSTELLATION_ARCS.find(arc => n >= arc.start && n <= arc.end) || CONSTELLATION_ARCS[0];
}
function stageCountInArc(arc){
  return Math.max(0, arc.end - arc.start + 1);
}
function unlockedCountInArc(arc){
  const unlocked = Math.max(1, Math.floor(Number(StageMapState?.unlocked || 1)));
  return Math.max(0, Math.min(arc.end, unlocked) - arc.start + 1);
}
function isArcUnlocked(arc){
  return Number(StageMapState?.unlocked || 1) >= arc.start;
}
function renderConstellationDeck(){
  const host = $('constellationDeck');
  if(!host) return;
  const selectedArc = getConstellationArcByStage(StageMapState?.selected || 1);
  host.innerHTML = CONSTELLATION_ARCS.map(arc => {
    const unlocked = unlockedCountInArc(arc);
    const total = stageCountInArc(arc);
    const state = isArcUnlocked(arc) ? (selectedArc.id === arc.id ? 'active' : 'unlocked') : 'locked';
    return `<button class="constellationCard ${state}" data-constellation-jump="${arc.start}" type="button"><span class="constellationKicker">${isArcUnlocked(arc)?'CONSTELLATION OPEN':'LOCKED CONSTELLATION'}</span><b>${arc.ko}</b><small>${arc.name}</small><em>${arc.desc}</em><span class="constellationMeta">복원 ${unlocked} / ${total} 성역</span></button>`;
  }).join('');
}

function renderStageMapInfo(stageNo){
  const def = getStageDef(stageNo);
  const mid = getStageBossDef(stageNo, 'mid');
  const finalBoss = getStageBossDef(stageNo, 'final');
  const presentation = getStagePresentation(stageNo);
  const title = $('stageInfoTitle');
  const risk = $('stageInfoRisk');
  const mood = $('stageInfoMood');
  const tags = $('stageInfoTags');
  const midName = $('stageMidBossName');
  const midKo = $('stageMidBossKo');
  const midSkill = $('stageMidBossSkill');
  const finalName = $('stageFinalBossName');
  const finalKo = $('stageFinalBossKo');
  const finalSkill = $('stageFinalBossSkill');
  const arc = getConstellationArcByStage(stageNo);
  if(title) title.textContent = `${arc.ko} · ${def.stage}. ${def.name} / ${def.ko}`;
  if(risk) risk.textContent = presentation.risk;
  if(mood){
    const chapter = OFFLINE_CHAPTERS[Number(stageNo)] || OFFLINE_CHAPTERS[1];
    const audioCue = STAGE_AUDIO_CUES[Number(def.theme)] || STAGE_AUDIO_CUES[0];
    const copy = getStageDescriptionCopy(stageNo);
    mood.textContent = `${def.ko} 설명 · ${copy.summary} 적 특성: ${copy.enemy} 추천 전략: ${copy.strategy} · BGM: ${audioCue.mood} · ${stageTowerRewardText(stageNo)}`;
    mood.title = `${chapter.title} · ${chapter.intro}`;
  }
  if(tags){
    tags.innerHTML = stageTagHtml(stageNo);
  }
  if(midName) midName.textContent = mid.name;
  if(midKo) midKo.textContent = `${mid.ko} · ${mid.title}`;
  if(midSkill) midSkill.textContent = mid.ability;
  if(finalName) finalName.textContent = finalBoss.name;
  if(finalKo) finalKo.textContent = `${finalBoss.ko} · ${finalBoss.title}`;
  if(finalSkill) finalSkill.textContent = finalBoss.ability;
  const panel = $('stageInfoPanel');
  if(panel) panel.dataset.stage = String(stageNo);
  // V13 hard sync: whenever the visible stage information changes,
  // the lower offline/stage detail block must change with it.
  try{
    StageMapState.selected = clamp(Number(stageNo || 1), 1, STAGE_MAP_DEFS.length);
    const map = $('stageMap');
    if(map) map.dataset.selected = String(StageMapState.selected);
    renderOfflineMetaPanel();
  }catch(err){
    console.warn('stage lower info hard sync failed', err);
  }
}

function loadStageMapProgress(){
  try{
    let raw = localStorage.getItem(STAGE_MAP_PROGRESS_KEY);
    if(!raw){
      for(const key of LEGACY_STAGE_MAP_KEYS){
        raw = localStorage.getItem(key);
        if(raw) break;
      }
    }
    let saved = null;
    if(raw) saved = JSON.parse(raw);
    if(saved){
      StageMapState.unlocked = clamp(Number(saved.unlocked || 1), 1, STAGE_MAP_DEFS.length);
      StageMapState.selected = clamp(Number(saved.selected || StageMapState.unlocked), 1, STAGE_MAP_DEFS.length);
      StageMapState.current = clamp(Number(saved.current || Math.min(StageMapState.selected, StageMapState.unlocked)), 1, STAGE_MAP_DEFS.length);
    }
    // Saved map progress and META.clears can drift apart after previous patches.
    // Reconcile them here so a cleared stage always opens the next stage and its planet reward.
    if(typeof applyCanonicalProgressToState === 'function'){
      applyCanonicalProgressToState({savedProgress:saved, keepSelected:true, allowLockedPreview:true, save:!TEST_MODE_CONFIG.enabled});
    }else if(!TEST_MODE_CONFIG.enabled){
      saveStageMapProgress();
    }
  }catch(err){
    StageMapState.unlocked = 1;
    StageMapState.selected = 1;
    StageMapState.current = 1;
  }
}

function saveStageMapProgress(){
  if(TEST_MODE_CONFIG.enabled) return;
  try{
    localStorage.setItem(STAGE_MAP_PROGRESS_KEY, JSON.stringify({
      saveVersion: SAVE_SCHEMA_VERSION,
      unlocked: StageMapState.unlocked,
      selected: StageMapState.selected,
      current: StageMapState.current
    }));
  }catch(err){}
}

function resetBattleUnitsForStageMap(){
  grid = Array(GRID_COLS*GRID_ROWS).fill(null);
  terrain = Array(GRID_COLS*GRID_ROWS).fill('empty');
  enemies = [];
  bullets = [];
  particles = [];
  beams = [];
  floats = [];
  anomalies = [];
  selected = -1;
  dragging = null;
  spawnTimer = 0;
}

function renderStageMap(){
  const map = $('stageMap');
  if(!map) return;
  const unlocked = clamp(StageMapState.unlocked, 1, STAGE_MAP_DEFS.length);
  const selectedStage = clamp(StageMapState.selected, 1, STAGE_MAP_DEFS.length);
  const canEnterSelectedStage = selectedStage <= unlocked;
  StageMapState.unlocked = unlocked;
  StageMapState.selected = selectedStage;
  map.dataset.unlocked = String(unlocked);
  map.dataset.selected = String(selectedStage);
  map.classList.remove(...Array.from({length:12},(_,i)=>`stage-selected-${i+1}`));
  map.classList.add(`stage-selected-${selectedStage}`);

  document.querySelectorAll('#stageMap .stageNode').forEach(node => {
    const stage = Number(node.dataset.stage);
    const isUnlocked = stage <= unlocked;
    const isSelected = stage === selectedStage;
    node.classList.toggle('locked', !isUnlocked);
    node.classList.toggle('unlocked', isUnlocked);
    node.classList.toggle('active', isSelected);
    const lock = node.querySelector('.nodeLock');
    if(lock) lock.style.display = isUnlocked ? 'none' : 'block';
  });

  const def = getStageDef(selectedStage);
  const arc = getConstellationArcByStage(selectedStage);
  const label = $('stageProgressLabel');
  const sub = $('stageProgressSub');
  const enter = $('stageEnterBtn');
  const hint = $('stageHint');
  if(label) label.textContent = `${TEST_MODE_CONFIG.enabled ? 'TEST MODE · ' : ''}${arc.name} · OPEN ${unlocked} / ${STAGE_MAP_DEFS.length}`;
  if(sub) sub.textContent = `${arc.ko} · ${def.stage}. ${def.name} / ${def.ko} ${canEnterSelectedStage ? '선택됨' : '미개방 미리보기'}`;
  if(enter){
    enter.textContent = canEnterSelectedStage ? `ENTER ${def.stage}. ${def.name}` : `LOCKED · ${def.stage}. ${def.name}`;
    enter.disabled = !canEnterSelectedStage;
    enter.classList.toggle('locked', !canEnterSelectedStage);
  }
  if(hint) hint.textContent = TEST_MODE_CONFIG.enabled
    ? `TEST MODE — ${def.stage}. ${def.name} · ${def.ko} / ${getStageDescriptionCopy(def.stage).summary}`
    : stageHintLine(def.stage, canEnterSelectedStage);
  renderConstellationDeck();
  renderStageMapInfo(selectedStage);
  try { renderOfflineMetaPanel(); } catch(err) { console.warn('stage bottom panel sync failed', err); }
  const infoPanel = $('stageInfoPanel');
  if(infoPanel) infoPanel.scrollTop = 0;
}

function showStageMap(){
  const menu = $('menu');
  const map = $('stageMap');
  const game = $('game');
  if(menu) menu.style.display = 'none';
  if(game) game.style.display = 'none';
  if(map){ map.style.display = 'block'; map.classList.add('premiumStage'); }
  stopStageBgm();
  if(audio && audio.on) playMapBgm();
  renderStageMap();
}

function startSelectedStageFromMap(){
  const selectedStageNo = clamp(StageMapState.selected, 1, STAGE_MAP_DEFS.length);
  if(selectedStageNo > StageMapState.unlocked){
    const defLocked = getStageDef(selectedStageNo);
    const arcLocked = getConstellationArcByStage(selectedStageNo);
    toast(`${arcLocked.ko} · ${defLocked.ko}는 아직 미개방입니다.`);
    renderStageMap();
    return;
  }
  const stageNo = selectedStageNo;
  const def = getStageDef(stageNo);
  StageMapState.current = stageNo;
  StageMapState.selected = stageNo;
  saveStageMapProgress();

  const map = $('stageMap');
  if(map) map.style.display = 'none';
  const gameEl = $('game');
  if(gameEl){
    gameEl.style.display='flex';
    // v22: force the game layout to settle before reset/render begins.
    void gameEl.offsetHeight;
  }

  reset();
  S.stageNo = stageNo;
  S.stageMapKey = def.key;
  S.theme = def.theme;
  S.ogge = 1;
  resetBattleUnitsForStageMap();
  const logBox = $('log');
  if(logBox) logBox.innerHTML = '';
  try { renderHangar(); } catch(err) { console.error('renderHangar failed during stage entry', err); }
  log(`${def.stage}. ${def.name} / ${def.ko} 진입 — 10웨이브 클리어 시 다음 성역과 전용 타워가 해금됩니다`);
  log(`현재 소환 가능 타워: ${availableSummonTypes().map(t => PLANETS[t]?.name).filter(Boolean).join(' / ')} · 보상: ${stageTowerRewardText(stageNo)}`);
  markOfflineStory(stageNo, 'intro');
  log(`시나리오: ${getOfflineStoryLog(stageNo, 'intro')}`);
  renderOfflineMetaPanel();
  prepareWave();
  if(shouldShowBattleTutorial(stageNo)) setTimeout(() => showBattleTutorial(stageNo), 180);
  else setTimeout(() => showStageQuickTip(stageNo), 180);
  last=performance.now();
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(loop);
}


function removeStageClearOverlay(){
  const existing = $('stageClearOverlay');
  if(existing) existing.remove();
}

function showStageClearOverlay(summary){
  removeStageClearOverlay();
  const cleared = Number(summary.stageNo || StageMapState.current || 1);
  const nextNo = Math.min(STAGE_MAP_DEFS.length, cleared + 1);
  const def = getStageDef(cleared);
  const nextDef = getStageDef(nextNo);
  const reward = stageTowerReward(cleared);
  const isFinal = cleared >= STAGE_MAP_DEFS.length;
  const mastery = computeStageMastery(cleared);
  const masteryGoals = STAGE_MASTERY_GOALS[Number(cleared)] || STAGE_MASTERY_GOALS[1];
  const starText = '★★★'.slice(0, mastery.stars) + '☆☆☆'.slice(0, 3 - mastery.stars);
  const overlay = document.createElement('div');
  overlay.id = 'stageClearOverlay';
  overlay.className = 'stageClearOverlay';
  overlay.innerHTML = `<div class="stageClearCard" role="dialog" aria-modal="true" aria-labelledby="stageClearTitle">
    <div class="stageClearKicker">${escapeHtml(def.ko)} RESTORED</div>
    <h2 id="stageClearTitle">${STORY_EVENT_TEXT.clearTitle}</h2>
    <p>${escapeHtml(getOfflineStoryLog(cleared, 'clear'))}</p>
    <div class="stageClearStats">
      <div class="stageClearStat"><span>RESTORED</span><b>${fmt2(cleared)} / ${fmt2(STAGE_MAP_DEFS.length)}</b></div>
      <div class="stageClearStat"><span>SHARDS</span><b>+${fmt2(summary.shardsGained)}</b></div>
      <div class="stageClearStat"><span>REWARD</span><b>${reward ? escapeHtml(reward.name) : '완료'}</b></div>
    </div>
    <div class="stageClearMastery"><div class="meta"><span>성역 숙련도</span><b>${mastery.stars}성 달성 · 코어 보존 ${fmt2(mastery.hpRatio*100)}%</b><span>${escapeHtml(masteryGoals[Math.max(0, Math.min(masteryGoals.length-1, mastery.stars-1))] || masteryGoals[0])}</span></div><div class="stars">${starText}</div></div>
    <div class="stageClearReward">${escapeHtml(STORY_EVENT_TEXT.clearBody)} ${isFinal ? '모든 성역이 안정화되었습니다. 이제 각 성역의 3성 숙련도와 최고 웨이브 기록을 노려 재정화 루프를 이어갈 수 있습니다.' : `다음 항로: ${nextDef.name} / ${nextDef.ko}`}</div>
    <div class="stageClearActions">
      <button id="stageClearMapBtn" class="btnAlt">성역 지도에서 강화</button>
      <button id="stageClearNextBtn" class="btnGreen">${isFinal ? '은하 항로 재정화' : '다음 성역 진입'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const mapBtn = overlay.querySelector('#stageClearMapBtn');
  const nextBtn = overlay.querySelector('#stageClearNextBtn');
  if(mapBtn){
    mapBtn.onclick = () => {
      removeStageClearOverlay();
      if(audio && audio.on) playMapBgm();
      renderStageMap();
    };
  }
  if(nextBtn){
    nextBtn.onclick = () => {
      removeStageClearOverlay();
      StageMapState.selected = isFinal ? cleared : nextNo;
      StageMapState.current = StageMapState.selected;
      saveStageMapProgress();
      startSelectedStageFromMap();
    };
  }
}

function completeStageFromBattle(){
  const cleared = clamp(Number(S.stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const previousUnlocked = clamp(Number(StageMapState.unlocked || 1), 1, STAGE_MAP_DEFS.length);
  const finalUnlocked = Math.max(previousUnlocked, Math.min(STAGE_MAP_DEFS.length, cleared + 1));
  const finalSelected = Math.min(STAGE_MAP_DEFS.length, cleared + 1);
  const clearedDef = getStageDef(cleared);

  cancelAnimationFrame(raf);
  $('game').style.display = 'none';
  $('stageMap').style.display = 'block';
  stopStageBgm();

  // 먼저 클리어 직전 상태를 보여준 뒤 unlock 값을 갱신해서 SVG 선이 실제로 그려지도록 한다.
  StageMapState.current = cleared;
  StageMapState.unlocked = previousUnlocked;
  StageMapState.selected = cleared;
  renderStageMap();
  const firstHint = $('stageHint');
  if(firstHint) firstHint.textContent = `${clearedDef.stage}. ${clearedDef.name} 클리어! ${stageTowerRewardText(cleared)} · ${getOfflineStoryLog(cleared, 'clear')}`;
  const beforeShards = Number(META?.shards || 0);
  recordOfflineRunEnd(true, cleared);
  const afterShards = Number(META?.shards || 0);
  const clearSummary = {stageNo:cleared, shardsGained:Math.max(0, afterShards - beforeShards)};
  sound('clear');
  playResultBgm('clear');

  reset();
  resetBattleUnitsForStageMap();

  setTimeout(() => {
    StageMapState.current = finalSelected;
    StageMapState.unlocked = finalUnlocked;
    StageMapState.selected = finalSelected;
    if(typeof applyCanonicalProgressToState === 'function'){
      applyCanonicalProgressToState({selectStage:finalSelected, currentStage:finalSelected, keepSelected:true, allowLockedPreview:false, save:true});
    }else{
      saveStageMapProgress();
    }
    renderStageMap();
    const nextDef = getStageDef(finalSelected);
    const hint = $('stageHint');
    if(hint){
      hint.textContent = cleared >= STAGE_MAP_DEFS.length
        ? `모든 성역 클리어! 원하는 성역을 다시 선택해 재도전할 수 있습니다.`
        : `${nextDef.stage}. ${nextDef.name} / ${nextDef.ko} 해금 — ENTER로 진입하세요. 다음 보상: ${stageTowerRewardText(finalSelected)}`;
    }
    showStageClearOverlay(clearSummary);
  }, 90);
}

const STAGE_BGS = THEMES.map(t => {
  const img = new Image();
  img.src = t.bg;
  return img;
});

const PLANET_ICON_SHEET = new Image();
PLANET_ICON_SHEET.src = 'assets/images/towers/planet_units_planet_style_v15.webp?v=15';

const PLANET_EVOLUTION_FILES = {
  solar:'assets/images/towers/solar_levels.webp?v=1',
  frost:'assets/images/towers/frost_levels.webp?v=1',
  storm:'assets/images/towers/storm_levels.webp?v=1',
  toxic:'assets/images/towers/toxic_levels.webp?v=1',
  void:'assets/images/towers/void_levels.webp?v=1',
  laser:'assets/images/towers/laser_levels.webp?v=1',
  smog:'assets/images/towers/smog_levels.webp?v=2',
  crystal:'assets/images/towers/crystal_levels.webp?v=2',
  mecha:'assets/images/towers/mecha_levels.webp?v=1',
  starengine:'assets/images/towers/starengine_levels.webp?v=1'
};
const PLANET_EVOLUTION_COLS = 5;
const PLANET_EVOLUTION_SHEETS = Object.fromEntries(Object.entries(PLANET_EVOLUTION_FILES).map(([key, src]) => {
  const img = new Image();
  img.src = src;
  return [key, img];
}));

const STAGE_FX_IMAGES = ['assets/images/effects/fx_cosmic.webp?v=6','assets/images/effects/fx_frost.webp?v=6','assets/images/effects/fx_lava.webp?v=6','assets/images/effects/fx_jungle.webp?v=6','assets/images/effects/fx_smog.webp?v=1','assets/images/effects/fx_crystal.webp?v=1','assets/images/effects/fx_machine.webp?v=1'].map(src=>{
  const img = new Image();
  img.src = src;
  return img;
});

const PLANET_ICON_COLS = 4;
const PLANET_ICON_ROWS = 2;
const PLANET_BASE_SIZE = 34; // v39: tower visual size reduced
const PLANET_RENDER_SCALE = 0.76; // v39: icon sheet render scale reduced
const BASE_PLANET_COUNT = 9;
const HIDDEN_PLANET_TYPE = 9;
const TECH_BONUS_PER_POINT = 0.08;

function fmtInt(value){
  const n = Number(value);
  return Number.isFinite(n) ? String(Math.round(n)) : '0';
}
function fmt2(value){ return fmtInt(value); }
function fmtPct2(value){ return `${fmtInt(Number(value || 0) * 100)}%`; }
function fmtSigned2(value){
  const n = Number(value);
  if(!Number.isFinite(n)) return '0';
  const v = Math.round(n);
  return `${v >= 0 ? '+' : ''}${v}`;
}
function fmtWholeOr2(value){ return fmtInt(value); }

const PLANET_THUMB_IMAGE_CACHE = {};
function planetThumbLevel(level){
  return Math.max(1, Math.min(6, Math.round(Number(level) || 1)));
}
function planetThumbSrc(type, level=1){
  const p = PLANETS?.[Number(type)];
  if(!p?.id) return '';
  return `assets/images/thumbs/${p.id}_lv${planetThumbLevel(level)}.webp?v=align2`;
}
function planetThumbImage(type, level=1){
  const src = planetThumbSrc(type, level);
  if(!src) return null;
  if(!PLANET_THUMB_IMAGE_CACHE[src]){
    const img = new Image();
    img.src = src;
    PLANET_THUMB_IMAGE_CACHE[src] = img;
  }
  return PLANET_THUMB_IMAGE_CACHE[src];
}
function drawImageContainCentered(img, cx, cy, maxW, maxH){
  if(!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return false;
  const ir = img.naturalWidth / img.naturalHeight;
  const br = maxW / maxH;
  let dw = maxW, dh = maxH;
  if(ir > br){ dh = maxW / ir; }
  else { dw = maxH * ir; }
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  return true;
}

const AUDIO_URLS = {
  bgm: {
    main:'audio/bgm_general_glass_horizon.ogg',
    map:'audio/bgm_general_glass_horizon.ogg',
    boss:'audio/bgm_boss_beneath_the_iron_crust.ogg',
    clear:'audio/bgm_result_sanctuary_restored.ogg',
    gameover:'audio/bgm_result_core_collapse.ogg',
    stages:[
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg',
      'audio/bgm_battle_sentinels_of_the_ember.ogg'
    ]
  },
  sfx: {
    shot:'audio/sfx_shot.ogg', beam:'audio/sfx_beam.ogg', blackhole:'audio/sfx_blackhole.ogg',
    nova:'audio/sfx_nova.ogg', hit:'audio/sfx_hit.ogg', kill:'audio/sfx_kill.ogg',
    treasure:'audio/sfx_treasure.ogg', level:'audio/sfx_level.ogg', summon:'audio/sfx_summon.ogg', merge:'audio/sfx_merge.ogg',
    boss:'audio/sfx_boss_warning.ogg', clear:'audio/sfx_stage_clear.ogg', gameover:'audio/sfx_core_collapse.ogg', core:'audio/sfx_core_damage.ogg', unlock:'audio/sfx_unlock.ogg'
  }
};

let fieldStars = [];

function buildFieldStars(){
  fieldStars = [];
  const layers = [
    {count:92, speed:.18, alpha:.34},
    {count:72, speed:.34, alpha:.55},
    {count:42, speed:.58, alpha:.82}
  ];
  layers.forEach((layer, layerIndex) => {
    for(let i=0;i<layer.count;i++){
      fieldStars.push({
        x: Math.random()*W, y: Math.random()*H,
        size: 1.25,
        layer: layerIndex,
        alpha: layer.alpha,
        speed: layer.speed,
        angle: rand(-.38,.38),
        drift: rand(.12,.42),
        twinkle: Math.random()*TAU,
        twinkleSpeed: rand(.035,.09)
      });
    }
  });
}

function drawCoverImage(img){
  if(!img || !img.complete || !img.naturalWidth){
    const fallback = ctx.createLinearGradient(0,0,W,H);
    fallback.addColorStop(0,'#020617');
    fallback.addColorStop(1,theme().color);
    ctx.globalAlpha=.42;
    ctx.fillStyle=fallback;
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;
    return;
  }
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = W / H;
  let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
  if(ir > cr){ sw = img.naturalHeight * cr; sx = (img.naturalWidth - sw) / 2; }
  else { sh = img.naturalWidth / cr; sy = (img.naturalHeight - sh) / 2; }
  ctx.save();
  ctx.globalAlpha = .76;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  ctx.restore();
}

function buildDustClouds(){
  if(!S) return;
  const clouds = [];
  const count = S.theme === 0 ? 2 : 1 + (Math.random() < .45 ? 1 : 0);
  const colors = ['rgba(244,208,118,.18)','rgba(186,230,253,.15)','rgba(203,213,225,.13)'];
  for(let i=0;i<count;i++){
    clouds.push({
      x: rand(GX + 90, Math.min(CORE.x - 120, GX + GRID_COLS*CELL - 80)),
      y: rand(GY + 80, Math.min(H - 165, GY + GRID_ROWS*CELL - 80)),
      r: rand(52, 74),
      vx: rand(-.20, .20),
      vy: rand(-.12, .12),
      phase: Math.random()*TAU,
      strength: rand(.10, .18),
      color: colors[i % colors.length]
    });
  }
  S.dustClouds = clouds;
  if(!S.dustHintShown){
    S.dustHintShown = true;
    log('부유 먼지구름: 구름 안의 행성은 화력이 소폭 감소하고 재장전이 약간 느려집니다.');
  }
}

function updateDustClouds(dt){
  if(!S || !Array.isArray(S.dustClouds)) return;
  for(const c of S.dustClouds){
    c.phase += dt * .018;
    c.x += c.vx * dt + Math.sin(c.phase) * .035;
    c.y += c.vy * dt + Math.cos(c.phase * .9) * .025;
    const minX = GX + 50, maxX = GX + GRID_COLS*CELL - 50;
    const minY = GY + 50, maxY = GY + GRID_ROWS*CELL - 50;
    if(c.x < minX || c.x > maxX) c.vx *= -1;
    if(c.y < minY || c.y > maxY) c.vy *= -1;
    c.x = clamp(c.x, minX, maxX);
    c.y = clamp(c.y, minY, maxY);
  }
}

function getDustCloudPenalty(x,y){
  if(!S || !Array.isArray(S.dustClouds)) return {damageMul:1,cooldownMul:1,alpha:0};
  let strength = 0;
  for(const c of S.dustClouds){
    const d = dist(x,y,c.x,c.y);
    if(d < c.r) strength = Math.max(strength, (1-d/c.r) * c.strength);
  }
  return {
    damageMul: 1 - strength * .58,
    cooldownMul: 1 + strength * .42,
    alpha: strength
  };
}

function drawDustClouds(){
  if(!S || !Array.isArray(S.dustClouds) || !S.dustClouds.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for(const c of S.dustClouds){
    const wobble = 1 + Math.sin(c.phase) * .035;
    const r = c.r * wobble;
    const g = ctx.createRadialGradient(c.x - r*.18, c.y - r*.12, 2, c.x, c.y, r);
    g.addColorStop(0, 'rgba(255,248,220,.18)');
    g.addColorStop(.45, c.color);
    g.addColorStop(1, 'rgba(15,23,42,0)');
    ctx.globalAlpha = .62;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, r*1.18, r*.70, Math.sin(c.phase)*.32, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = .16;
    ctx.strokeStyle = 'rgba(253,230,138,.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6,10]);
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, r*1.03, r*.58, Math.sin(c.phase)*.32, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawElectricArc(x1,y1,x2,y2,options={}){
  const segments = options.segments || 8;
  const amplitude = options.amplitude || 8;
  const alpha = options.alpha ?? 1;
  const glow = options.glow || '#fde047';
  const main = options.main || '#fefce8';
  const dx=x2-x1, dy=y2-y1;
  const len=Math.max(1,Math.hypot(dx,dy));
  const nx=-dy/len, ny=dx/len;
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.strokeStyle=glow;
  ctx.lineWidth=options.outerWidth || 3;
  ctx.shadowColor=glow;
  ctx.shadowBlur=options.blur || 14;
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  for(let i=1;i<segments;i++){
    const t=i/segments;
    const wobble=Math.sin(performance.now()*.02+i*1.37)*.28;
    const offset=(Math.random()*2-1+wobble)*amplitude*(1-Math.abs(.5-t)*.65);
    ctx.lineTo(x1+dx*t+nx*offset,y1+dy*t+ny*offset);
  }
  ctx.lineTo(x2,y2);
  ctx.stroke();
  ctx.strokeStyle=main;
  ctx.lineWidth=options.innerWidth || 1.25;
  ctx.shadowBlur=7;
  ctx.stroke();
  ctx.restore();
}

function updateAndDrawFieldStars(raw){
  const th = theme();
  const t = performance.now() * .00032;
  ctx.save();
  for(const s of fieldStars){
    const speed = s.speed * th.starSpeed * raw;
    s.x += Math.cos(s.angle + t) * speed;
    s.y += Math.sin(s.angle + t) * speed + s.drift * raw * .08;
    s.twinkle += s.twinkleSpeed * raw;
    if(s.x < -10) s.x = W + 10;
    if(s.x > W + 10) s.x = -10;
    if(s.y < -10) s.y = H + 10;
    if(s.y > H + 10) s.y = -10;
    const glow = .62 + Math.sin(s.twinkle) * .30;
    ctx.globalAlpha = clamp(s.alpha * glow, .12, .95);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255,255,255,.95)';
    ctx.shadowBlur = s.layer === 2 ? 8 : 4;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}


const PLANETS = [
  {id:'solar', name:'솔라 행성', role:'보스 딜러 / 광역 연소', identity:'합류점에 쌓인 적을 태우고 보스에게 폭발 피해를 누적하는 화력 핵심입니다.', color:'#fb923c', range:132, dmg:48, cd:34, kind:'splash', cost:90, card:'광역 폭발 · 연소', tags:['광역','연소','합류점']},
  {id:'frost', name:'프로스트 행성', role:'감속 / 제어', identity:'빠른 적과 보스의 진행을 늦춰 다른 행성이 오래 공격할 시간을 벌어줍니다.', color:'#67e8f9', range:145, dmg:30, cd:30, kind:'slow', cost:95, card:'빙결 감속 · 제어', tags:['감속','빙결','제어']},
  {id:'storm', name:'스톰 행성', role:'연쇄 딜러 / 다중 타깃', identity:'적이 이어져 들어오는 라인에서 번개가 튕기며 웨이브 정리에 강합니다.', color:'#facc15', range:128, dmg:36, cd:32, kind:'chain', cost:100, card:'연쇄 번개 · 장갑 파괴', tags:['연쇄','장갑파괴','다중경로']},
  {id:'toxic', name:'바이오 행성', role:'지속 피해 / 회복 억제', identity:'체력이 높은 적에게 독성 피해를 누적해 장기전과 보스전 안정성을 올립니다.', color:'#22c55e', range:126, dmg:24, cd:27, kind:'poison', cost:100, card:'독성 침식 · 지속 피해', tags:['독','지속피해','보스']},
  {id:'void', name:'블랙홀 행성', role:'몰이 / 군중 제어', identity:'적을 끌어당겨 광역 타워의 효율을 높이고 코어 접근 시간을 늦춥니다.', color:'#c084fc', range:122, dmg:22, cd:48, kind:'gravity', cost:110, card:'소형 블랙홀 · 구속', tags:['끌어당김','디버프','군중제어']},
  {id:'laser', name:'광자 행성', role:'관통 저격 / 직선 화력', identity:'긴 직선 경로에서 여러 적을 한 번에 관통해 후방 화력을 담당합니다.', color:'#a78bfa', range:165, dmg:58, cd:44, kind:'beam', cost:120, card:'고출력 광자 빔', tags:['관통','저격','직선']},
  {id:'smog', name:'스모그 행성', role:'약화 / 장판 제어', identity:'매연 장막으로 적을 약화시키고 둔화시켜 후반 압박을 안정적으로 낮춥니다.', color:'#9cab62', range:138, dmg:28, cd:31, kind:'poison', cost:115, card:'정화 장막 · 응축/역류', tags:['정화','장판제어','역류']},
  {id:'crystal', name:'크리스탈 행성', role:'축전 / 공명 설계', identity:'초과 피해를 저장하고 장판 공명을 만들어 배치 설계의 보상을 키웁니다.', color:'#c084fc', range:142, dmg:34, cd:33, kind:'crystal', cost:125, card:'축전 · 프리즘 링크', tags:['축전','장판설계','공명']},
  {id:'mecha', name:'메카 행성', role:'실드 해체 / 후반 안정성', identity:'장갑과 실드를 해체하고 위성포/방벽으로 최종 성역 압박을 버팁니다.', color:'#60a5fa', range:134, dmg:42, cd:39, kind:'mecha', cost:135, card:'실드 해체 · 방어망', tags:['실드해체','위성','방벽']},
  {id:'starengine', name:'히든 스타 엔진', role:'최종 융합 병기', identity:'기본 9종의 고레벨 융합으로 열리는 초고출력 치명타 코어입니다.', color:'#f8fafc', range:230, dmg:220, cd:18, cost:0, kind:'crit', card:'히든 · 초고출력 크리티컬 코어', tags:['히든','치명타','융합','최종병기'], critChance:.68, critMul:3.6, explodeChance:.26, explodeRadius:126, bossMul:1.35}
];


const TERRAIN = {
  empty:{name:'공허판', desc:'출력 손실: 피해 -38%, 공속 저하', color:'rgba(148,163,184,.055)'},
  path:{name:'균열항로', desc:'적 이동 경로. 배치 불가', color:'rgba(56,189,248,.08)'},
  blocked:{name:'운석폐허', desc:'배치 불가', color:'rgba(15,23,42,.70)'},
  amp:{name:'증폭성운', desc:'핵심 장판: 피해 +65%', color:'rgba(251,191,36,.22)'},
  coil:{name:'가속궤도', desc:'핵심 장판: 공격속도 대폭 증가', color:'rgba(56,189,248,.21)'},
  lens:{name:'중력렌즈', desc:'핵심 장판: 사거리 +50', color:'rgba(125,211,252,.21)'},
  mine:{name:'수정광맥', desc:'보상 장판: 소량 추가 보상', color:'rgba(34,197,94,.18)'},
  rift:{name:'불안정균열', desc:'위험 장판: 피해 +95%, 과열', color:'rgba(244,114,182,.20)'}
};

function randomPlateAffinityType(){
  const pool = availableSummonTypes ? availableSummonTypes().filter(type => type >= 0 && type < BASE_PLANET_COUNT) : [];
  const fallback = Array.from({length: BASE_PLANET_COUNT}, (_, i) => i);
  const list = pool.length ? pool : fallback;
  return list[Math.floor(Math.random() * list.length)] ?? 0;
}
function specialPlateKeys(){ return new Set(['amp','coil','lens','mine','rift']); }
function isSpecialPlateKey(key){ return specialPlateKeys().has(key); }
function getPlateAffinity(idx){
  const a = plateAffinity && plateAffinity[idx];
  if(!a || !PLANETS[a.type]) return null;
  return a;
}
function getPlateColor(idx, terrainKey){
  const a = getPlateAffinity(idx);
  if(a && isSpecialPlateKey(terrainKey)) return a.color || PLANETS[a.type].color;
  return TERRAIN[terrainKey]?.color || 'rgba(148,163,184,.055)';
}
function isPlateAffinityMatched(tower){
  if(!tower || !terrain || !isSpecialPlateKey(terrain[tower.idx])) return false;
  const a = getPlateAffinity(tower.idx);
  return !!a && Number(a.type) === Number(tower.type);
}
function plateAffinityName(idx){
  const a = getPlateAffinity(idx);
  return a && PLANETS[a.type] ? PLANETS[a.type].name.replace(' 행성','') : '';
}

const UNIT_SKILL_TREES = {
  solar: [
    {id:'solar_core', name:'태양 핵융합로', text:l=>`해당 솔라 행성 공격력 +${fmt2(18*l)}%`, apply:(t)=>{ensureAug(t).damage+=.18}},
    {id:'solar_flare', name:'플레어 장판', text:l=>`폭발 반경 +${fmt2(22*l)}%`, apply:(t)=>{ensureAug(t).area+=.22}},
    {id:'solar_burn', name:'플레어 연소', text:l=>`연소 지속피해 +${fmt2(35*l)}%`, apply:(t)=>{ensureAug(t).dot+=.35}}
  ],
  frost: [
    {id:'frost_core', name:'극저온 냉각핵', text:l=>`해당 프로스트 행성 공격력 +${fmt2(16*l)}%`, apply:(t)=>{ensureAug(t).damage+=.16}},
    {id:'frost_lock', name:'절대영도 잠금', text:l=>`빙결 확률/지속 +${fmt2(20*l)}%`, apply:(t)=>{const a=ensureAug(t);a.freeze+=.20;a.freezeChance+=.05}},
    {id:'frost_range', name:'냉기 렌즈', text:l=>`사거리 +${fmt2(10*l)}`, apply:(t)=>{ensureAug(t).range+=10}}
  ],
  storm: [
    {id:'storm_coil', name:'플라즈마 유도 코일', text:l=>`해당 스톰 행성 공격력 +${fmt2(15*l)}%`, apply:(t)=>{ensureAug(t).damage+=.15}},
    {id:'storm_chain', name:'연쇄 회로 증폭', text:l=>`연쇄 대상 +${fmt2(l)}`, apply:(t)=>{ensureAug(t).chain+=1}},
    {id:'storm_break', name:'전하 표식', text:l=>`표식 피해 증폭 +${fmt2(8*l)}%`, apply:(t)=>{ensureAug(t).markAmp+=.08}}
  ],
  toxic: [
    {id:'toxic_reactor', name:'생체화학 반응로', text:l=>`독성 지속피해 +${fmt2(40*l)}%`, apply:(t)=>{ensureAug(t).dot+=.40}},
    {id:'toxic_spore', name:'포자 확산막', text:l=>`독성 공격력 +${fmt2(16*l)}%`, apply:(t)=>{ensureAug(t).damage+=.16}},
    {id:'toxic_slow', name:'마비 독성', text:l=>`중독 대상 둔화 +${fmt2(l)}`, apply:(t)=>{ensureAug(t).poisonSlow+=1}}
  ],
  void: [
    {id:'void_pull', name:'중력 우물 심화', text:l=>`블랙홀 흡입력 +${fmt2(25*l)}%`, apply:(t)=>{ensureAug(t).gravity+=.25}},
    {id:'void_radius', name:'사건지평 확장', text:l=>`블랙홀 반경 +${fmt2(18*l)}%`, apply:(t)=>{ensureAug(t).area+=.18}},
    {id:'void_decay', name:'공간 붕괴파', text:l=>`블랙홀 피해 +${fmt2(17*l)}%`, apply:(t)=>{ensureAug(t).damage+=.17}}
  ],
  laser: [
    {id:'laser_lens', name:'광자 렌즈 정렬', text:l=>`광자 행성 공격력 +${fmt2(17*l)}%`, apply:(t)=>{ensureAug(t).damage+=.17}},
    {id:'laser_width', name:'관통 빔 확장', text:l=>`빔 폭 +${fmt2(5*l)}`, apply:(t)=>{ensureAug(t).beamWidth+=5}},
    {id:'laser_cooler', name:'광자 냉각 채널', text:l=>`공격속도 +${fmt2(12*l)}%`, apply:(t)=>{ensureAug(t).fireRate+=.12}}
  ],
  smog: [
    {id:'smog_choke', name:'정화 장막', text:l=>`정화 장막 반경 +${fmt2(13*l)}% · 장판 둔화 +${fmt2(l)}`, apply:(t)=>{const a=ensureAug(t);a.area+=.13;a.poisonSlow+=1}},
    {id:'smog_catalyst', name:'스모그 응축', text:l=>`장판 체류 피해 +${fmt2(30*l)}% · 취약 표식 +${fmt2(4*l)}%`, apply:(t)=>{const a=ensureAug(t);a.dot+=.30;a.markAmp+=.04}},
    {id:'smog_front', name:'역류 기류', text:l=>`적 역류 확률 +${fmt2(5.5*l)}% · 짧은 밀어내기`, apply:(t)=>{const a=ensureAug(t);a.burstChance+=.055;a.fireRate+=.03}}
  ],
  crystal: [
    {id:'crystal_charge', name:'수정 축전', text:l=>`초과 피해 저장률 +${fmt2(18*l)}% · 다음 공격 방출`, apply:(t)=>{ensureAug(t).crystalCharge+=.18}},
    {id:'crystal_link', name:'프리즘 링크', text:l=>`장판 선로 지속 +${fmt2(2*l)}초 · 선로 피해 증가`, apply:(t)=>{ensureAug(t).prismLink+=1}},
    {id:'crystal_resonance', name:'공명 장판', text:l=>`주변 장판 공명률 +${fmt2(12*l)}%`, apply:(t)=>{ensureAug(t).resonancePlate+=.12}}
  ],
  mecha: [
    {id:'mecha_dismantle', name:'실드 해체', text:l=>`적 장갑 해체 +${fmt2(7*l)}% · 해체 시 수정 전환`, apply:(t)=>{ensureAug(t).shieldDismantle+=.07}},
    {id:'mecha_satellite', name:'위성 조립', text:l=>`보조 위성포 발동률 +${fmt2(8*l)}%`, apply:(t)=>{ensureAug(t).satelliteForge+=.08}},
    {id:'mecha_barrier', name:'비상 방벽', text:l=>`코어 근접 교전 시 보호막 +${fmt2(l)}`, apply:(t)=>{ensureAug(t).emergencyBarrier+=1}}
  ],
  starengine: [
    {id:'star_crit', name:'쌍성 임계점', text:l=>`치명타 확률 +${fmt2(9*l)}%`, apply:(t)=>{ensureAug(t).critChance+=.09}},
    {id:'star_burst', name:'STAR BURST 증폭', text:l=>`폭발 확률 +${fmt2(7*l)}%`, apply:(t)=>{ensureAug(t).burstChance+=.07}},
    {id:'star_nova', name:'백색왜성 방출', text:l=>`치명타 배율 +${fmt2(35*l)}%`, apply:(t)=>{ensureAug(t).critMul+=.35}}
  ]
};




const UNIT_SKILL_UNLOCK_LEVELS = [3, 6, 9];
function towerSkillTree(type){
  const id = PLANETS[type]?.id;
  return UNIT_SKILL_TREES[id] || [];
}
function towerSkillUnlockLevel(index){
  return UNIT_SKILL_UNLOCK_LEVELS[index] || (3 + index * 3);
}
function syncTowerSkillUnlocks(t){
  if(!t) return [];
  const skills = towerSkillTree(t.type);
  if(!skills.length) return [];
  ensureAug(t);
  const newly = [];
  for(let i=0;i<skills.length;i++){
    const skill = skills[i];
    const unlockLv = towerSkillUnlockLevel(i);
    if(Number(t.level || 1) >= unlockLv && !t.skillLevels[skill.id]){
      t.skillLevels[skill.id] = 1;
      if(typeof skill.apply === 'function') skill.apply(t);
      newly.push(skill);
    }
  }
  return newly;
}
function towerSkillSummaryHtml(type, currentLevel=0){
  const skills = towerSkillTree(type);
  if(!skills.length) return '<p>고유 스킬 정보가 없습니다.</p>';
  return `<div class="planetTowerSkillList">${skills.map((skill, idx)=>{
    const lv = towerSkillUnlockLevel(idx);
    const active = Number(currentLevel || 0) >= lv;
    return `<div class="towerSkillLine ${active?'':'locked'}"><b>Lv.${fmt2(lv)}</b><div><strong>${escapeHtml(skill.name)}</strong><span>${escapeHtml(skill.text(1))}${active?' · 활성':' · 대기'}</span></div></div>`;
  }).join('')}</div>`;
}
function towerSkillCompactText(t){
  if(!t) return '없음';
  const skills = towerSkillTree(t.type);
  const unlocked = skills.filter((s, idx)=>Number(t.level || 1) >= towerSkillUnlockLevel(idx));
  return unlocked.length ? unlocked.map(s=>s.name).join(' · ') : '아직 없음';
}

const GLOBAL_UPGRADE_MAX_LEVEL = 15;
const GLOBAL_UPGRADE_CATALOG = [
  {
    id:'global_damage', name:'공통 화력 증폭', type:'화력', color:'#fb923c', icon:'global_damage',
    desc:'배치된 모든 행성과 앞으로 소환될 행성의 기본 피해를 올립니다. 어느 조합에서도 가장 안정적인 선택입니다.',
    text:l=>`모든 행성 공격력 +${fmtPct2(.10*l)}`
  },
  {
    id:'global_speed', name:'공격속도 동기화', type:'속도', color:'#67e8f9', icon:'global_speed',
    desc:'모든 행성의 공격 주기를 줄입니다. 감속/독/연쇄처럼 자주 때릴수록 강한 조합에서 효율이 큽니다.',
    text:l=>`모든 행성 공격속도 +${fmtPct2(.08*l)}`
  },
  {
    id:'global_crit', name:'치명타 매트릭스', type:'폭발력', color:'#fde68a', icon:'global_crit',
    desc:'전체 화력에 치명타 기대값을 추가합니다. 보스 체력이 두꺼워지는 중후반에 가치가 커집니다.',
    text:l=>`치명 확률 +${fmtPct2(.035*l)} · 치명 배율 +${fmtPct2(.08*l)}`
  },
  {
    id:'global_range', name:'사거리 네트워크', type:'배치', color:'#a78bfa', icon:'global_range',
    desc:'모든 행성의 사거리를 늘려 같은 타워가 더 오래 공격하게 만듭니다. 배치 실수 보정과 병목 커버에 좋습니다.',
    text:l=>`모든 행성 사거리 +${fmt2(8*l)}`
  },
  {
    id:'global_plate', name:'장판 증폭 회로', type:'장판', color:'#22c55e', icon:'global_plate',
    desc:'증폭성운, 가속궤도, 중력렌즈, 수정광맥, 균열 장판 위 행성을 추가 강화합니다. 이 게임의 핵심 전략 업그레이드입니다.',
    text:l=>`장판 위 피해 +${fmtPct2(.08*l)} · 장판 위 공격속도 +${fmtPct2(.05*l)}`
  },
  {
    id:'global_boss', name:'보스 해체 프로토콜', type:'보스', color:'#f87171', icon:'global_boss',
    desc:'보스와 장갑 적에게 들어가는 실제 피해를 올립니다. 5성역 이후 보스전이 막힐 때 우선순위가 높습니다.',
    text:l=>`보스 피해 +${fmtPct2(.09*l)} · 방어 관통 +${fmtPct2(.02*l)}`
  },
  {
    id:'global_economy', name:'전장 회수 시스템', type:'경제', color:'#facc15', icon:'global_economy',
    desc:'처치 보상을 늘려 소환과 합성 속도를 빠르게 합니다. 초중반에 집으면 후반 성장 곡선이 좋아집니다.',
    text:l=>`처치 보상 +${fmtPct2(.06*l)}`
  }
];

function ensureGlobalUpgrades(){
  if(!S) return {};
  if(!S.globalUpgrades) S.globalUpgrades = {};
  return S.globalUpgrades;
}
function globalUpgradeLevel(id){
  const levels = S?.globalUpgrades || META?.upgrades || {};
  return Math.max(0, Number(levels[id] || 0));
}
function getGlobalUpgrade(id){
  return GLOBAL_UPGRADE_CATALOG.find(u => u.id === id) || null;
}
function getGlobalUpgradeStats(){
  const levels = S?.globalUpgrades || META?.upgrades || {};
  const lv = id => Math.max(0, Number(levels[id] || 0));
  return {
    damage: lv('global_damage') * .10,
    fireRate: lv('global_speed') * .08,
    critChance: lv('global_crit') * .035,
    critMul: lv('global_crit') * .08,
    range: lv('global_range') * 8,
    plateDamage: lv('global_plate') * .08,
    plateFireRate: lv('global_plate') * .05,
    bossDamage: lv('global_boss') * .09,
    armorBreak: lv('global_boss') * .02,
    reward: lv('global_economy') * .06
  };
}
function globalUpgradeText(upgrade, level){
  if(!upgrade) return '';
  return typeof upgrade.text === 'function' ? upgrade.text(level) : '';
}
function recommendedGlobalUpgradeIds(type){
  const id = PLANETS[type]?.id;
  const map = {
    solar:['global_damage','global_plate','global_crit'],
    frost:['global_speed','global_range','global_plate'],
    storm:['global_speed','global_crit','global_damage'],
    toxic:['global_speed','global_boss','global_plate'],
    void:['global_range','global_plate','global_speed'],
    laser:['global_damage','global_range','global_boss'],
    smog:['global_plate','global_speed','global_boss'],
    crystal:['global_plate','global_crit','global_damage'],
    mecha:['global_boss','global_speed','global_economy'],
    starengine:['global_crit','global_damage','global_boss']
  };
  return map[id] || ['global_damage','global_speed','global_plate'];
}

const TACTICAL_COOLDOWN_MAX = {blackhole:720, nova:820, repair:900};


let S, grid, terrain, enemies, bullets, particles, beams, floats, anomalies, route, selected, dragging;
let plateAffinity = {};
const PLATE_AFFINITY_DAMAGE_BONUS = 0.30;
const PLATE_AFFINITY_FIRE_RATE_BONUS = 0.08;
let raf = 0, last = performance.now(), spawnTimer = 0, shake = 0, flash = 0;
let hangarFrame = -1;
let nextPlanetUid = 1;
let mouse = {x:0,y:0};
let hoverIdx = -1;
let audio = null;
let audioCtx = null;
const towerSfxLimiter = {};
const audioBufferCache = {};
const htmlAudioCache = {};
const activeOneShotAudio = new Set();
const soundLimiter = {};
function isLowPowerAudioMode(){
  return window.matchMedia?.('(max-width: 768px)').matches || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
}

// Orientation-aware rectangular battle board.
// The visible board can expand horizontally in landscape and vertically in portrait.
const BOARD_IS_LANDSCAPE = (window.innerWidth || 0) >= (window.innerHeight || 0) * 1.04;
const IS_MOBILE_BOARD = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
const GRID_COLS = BOARD_IS_LANDSCAPE ? 12 : 8;
const GRID_ROWS = BOARD_IS_LANDSCAPE ? 8 : 12;
const GRID = Math.max(GRID_COLS, GRID_ROWS); // legacy fallback only
const maxCell = BOARD_IS_LANDSCAPE
  ? (IS_MOBILE_BOARD ? 72 : 86)
  : (IS_MOBILE_BOARD ? 56 : 74);
const minCell = BOARD_IS_LANDSCAPE
  ? (IS_MOBILE_BOARD ? 34 : 42)
  : (IS_MOBILE_BOARD ? 30 : 42);
const outerPadX = BOARD_IS_LANDSCAPE
  ? Math.max(14, Math.min(24, W * .018))
  : Math.max(12, Math.min(18, W * .02));
const rightCommandReserve = BOARD_IS_LANDSCAPE
  ? Math.max(168, Math.min(222, W * .165))
  : 0;
const availableBoardW = BOARD_IS_LANDSCAPE
  ? Math.max(260, W - outerPadX * 2 - rightCommandReserve)
  : Math.max(220, W - outerPadX * 2);
const topBottomReserve = BOARD_IS_LANDSCAPE
  ? Math.max(74, Math.min(104, H * .135))
  : Math.max(148, Math.min(210, H * .19));
const fitByExpandedW = Math.max(24, availableBoardW / GRID_COLS);
const fitByExpandedH = Math.max(24, (H - topBottomReserve) / GRID_ROWS);
const fixedAxisCell = BOARD_IS_LANDSCAPE ? fitByExpandedH : fitByExpandedW;
const landscapeWidthSafetyCell = BOARD_IS_LANDSCAPE
  ? Math.max(24, availableBoardW / (GRID_COLS + 1.05))
  : fitByExpandedW;
const rawCell = BOARD_IS_LANDSCAPE
  ? Math.min(maxCell, fixedAxisCell, landscapeWidthSafetyCell)
  : Math.min(maxCell, fixedAxisCell, fitByExpandedW, fitByExpandedH);
const CELL = Math.floor(clamp(rawCell, minCell, maxCell));
const coreGapX = BOARD_IS_LANDSCAPE ? Math.max(24, Math.min(38, CELL * .46)) : Math.max(16, Math.min(28, CELL * .36));
const totalWWithCore = GRID_COLS * CELL + coreGapX + Math.max(26, CELL * .56);
<<<<<<< HEAD
const boardShiftX = BOARD_IS_LANDSCAPE
  ? Math.max(42, Math.min(56, W * .040))
  : Math.max(20, Math.min(30, W * .026));
=======
const boardShiftX = (BOARD_IS_LANDSCAPE
  ? Math.max(78, Math.min(104, W * .070))
  : Math.max(38, Math.min(56, W * .045))) + CELL * .5; // v44: pull the tactical board left by half a block from v43
>>>>>>> 5988c15 (v004)
let GX = BOARD_IS_LANDSCAPE
  ? Math.round(outerPadX + boardShiftX)
  : Math.round(Math.max(outerPadX, (W - totalWWithCore) / 2) + boardShiftX);
if(BOARD_IS_LANDSCAPE){
<<<<<<< HEAD
  const maxLandscapeGX = Math.max(outerPadX, W - rightCommandReserve - totalWWithCore - Math.max(8, CELL * .10));
=======
  // v43: allow exactly one block worth of movement into the previously reserved right lane.
  const relaxedRightReserve = Math.max(0, rightCommandReserve - CELL);
  const maxLandscapeGX = Math.max(outerPadX, W - relaxedRightReserve - totalWWithCore - Math.max(4, CELL * .05));
>>>>>>> 5988c15 (v004)
  GX = Math.round(Math.min(GX, maxLandscapeGX));
}else{
  const maxPortraitGX = Math.max(outerPadX, W - totalWWithCore - outerPadX);
  GX = Math.round(Math.min(GX, maxPortraitGX));
}
const boardH = GRID_ROWS * CELL;
// v22: align the board with the visible tactical lane instead of centering it
// too low in portrait.  Cells remain square; only the top anchor changes.
const hudReserveY = BOARD_IS_LANDSCAPE
  ? Math.max(58, Math.min(86, H * .10))
  : Math.max(70, Math.min(96, H * .075));
const commandReserveY = BOARD_IS_LANDSCAPE
  ? Math.max(28, Math.min(46, H * .055))
  : Math.max(118, Math.min(166, H * .135));
const playableH = Math.max(boardH, H - hudReserveY - commandReserveY);
const naturalTop = hudReserveY + (playableH - boardH) * .5;
const upwardBias = BOARD_IS_LANDSCAPE
  ? Math.max(6, Math.min(14, CELL * .18))
  : Math.max(34, Math.min(64, CELL * .92));
const minTop = BOARD_IS_LANDSCAPE
  ? Math.max(48, Math.min(76, H * .08))
  : Math.max(62, Math.min(88, H * .06));
const maxTop = Math.max(minTop, H - commandReserveY - boardH - Math.max(10, CELL * .18));
const GY = Math.round(clamp(naturalTop - upwardBias, minTop, maxTop));
const coreMaxX = BOARD_IS_LANDSCAPE
  ? W - rightCommandReserve - Math.max(18, CELL * .18)
  : W - 42;
const CORE = {
  x: clamp(GX + GRID_COLS * CELL + coreGapX, 48, coreMaxX),
  y: clamp(GY + GRID_ROWS * CELL - CELL * .5, 48, H - Math.max(58, commandReserveY * .42))
};

function currentPlanetFrameIndex(){
  return 0;
}

function planetEvolutionColumn(level){
  return Math.max(0, Math.min(PLANET_EVOLUTION_COLS - 1, planetEvolutionTier(level)));
}

function planetSheetImage(type){
  const id = PLANETS[type]?.id;
  return PLANET_EVOLUTION_SHEETS[id] || null;
}

function livePlanetLevel(type){
  if(!Array.isArray(grid) || !grid.length) return 0;
  let max = 0;
  for(const tower of grid){
    if(tower && tower.type === type) max = Math.max(max, tower.level || 1);
  }
  return max || 0;
}

function planetThumbColumnForLevel(level){
  const lv = Math.max(1, Math.min(6, Number(level) || 1));
  return lv - 1;
}

function hangarVisualSignature(){
  if(!Array.isArray(PLANETS)) return '0';
  return PLANETS.map((_, idx)=>livePlanetLevel(idx)).join('|') + '::' + (selected >= 0 && grid[selected] ? `${grid[selected].type}:${grid[selected].level}` : 'none');
}

function applyLiveThumb(el, type, frameIndex){
  const forcedLevel = Number(el.dataset.level || 0);
  const level = forcedLevel > 0 ? forcedLevel : (livePlanetLevel(type) || 1);

  // 모든 유저 타워 썸네일은 동일한 중앙 정렬 PNG를 사용한다.
  // 선택 패널/하단 카드/모바일 카드가 서로 다른 스프라이트 크롭 규칙을 타지 않게 고정한다.
  const thumbSrc = planetThumbSrc(type, level);
  if(thumbSrc){
    const thumbLevel = planetThumbLevel(level);
    el.style.backgroundImage = `url("${thumbSrc}")`;
    el.style.backgroundSize = 'contain';
    el.style.backgroundPosition = 'center center';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.animationDelay = `${(type % 4) * .28}s`;
    el.dataset.renderedLevel = String(thumbLevel);
    el.classList.add('thumbPng');
    el.classList.remove('spriteHardCrop');
    return;
  }

  const img = planetSheetImage(type);
  const col = (type === HIDDEN_PLANET_TYPE && isHiddenLocked()) ? 0 : planetThumbColumnForLevel(level);
  if(img){
    el.style.backgroundImage = `url("${img.src}")`;
    el.style.backgroundSize = `${PLANET_EVOLUTION_COLS * 100}% 100%`;
    el.style.backgroundPosition = `${col * 100 / Math.max(1, PLANET_EVOLUTION_COLS - 1)}% 50%`;
    el.style.animationDelay = `${(type % 4) * .28}s`;
    el.dataset.renderedLevel = String(level);
    el.classList.remove('thumbPng');
    return;
  }
  const colIdx = type % PLANET_ICON_COLS;
  const rowIdx = Math.floor(type / PLANET_ICON_COLS);
  el.style.backgroundImage = `url("${PLANET_ICON_SHEET.src}")`;
  el.style.backgroundSize = `${PLANET_ICON_COLS * 100}% ${PLANET_ICON_ROWS * 100}%`;
  el.style.backgroundPosition = `${colIdx * 100 / (PLANET_ICON_COLS - 1)}% ${rowIdx * 100 / (PLANET_ICON_ROWS - 1)}%`;
  el.style.animationDelay = `${(type % 4) * .28}s`;
}



function isHiddenLocked(){
  return !S || !S.hiddenUnlocked;
}

function hangarCostText(type){
  const p = PLANETS[type];
  if(!p) return '-';
  if(type === HIDDEN_PLANET_TYPE && isHiddenLocked()) return 'LOCK';
  if(type === HIDDEN_PLANET_TYPE) return 'UNLOCKED';
  if(!isTowerUnlocked(type)) return towerUnlockRequirementText(type);
  return `COST ${fmt2(p.cost || 100)}`;
}

function hangarRoleText(type){
  const p = PLANETS[type];
  if(!p) return '';
  if(type === HIDDEN_PLANET_TYPE && isHiddenLocked()){
    return '기본 행성 9종 Lv.5 달성 시 각성';
  }
  if(!isTowerUnlocked(type)){
    const req = towerUnlockRequirementText(type);
    return `미해금 · ${req}`;
  }
  const tags = Array.isArray(p.tags) && p.tags.length ? p.tags.slice(0,3).join(' · ') : '';
  return `${p.card || p.kind || '전투 행성'}${tags ? `<span class="techHint">${tags}</span>` : ''}`;
}



function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}

function planetKindLabel(kind){
  return ({
    splash:'광역 폭발형', slow:'감속 제어형', chain:'연쇄 전격형', poison:'지속 피해형', gravity:'군중 제어형', beam:'관통 빔형', crystal:'축전 공명형', mecha:'방어 해체형', crit:'치명타 융합형'
  })[kind] || '전투 행성';
}

function planetPlayGuide(type){
  const p = PLANETS[type];
  if(!p) return '';
  const guides = {
    solar:'적이 많이 겹치는 합류점에 배치하면 폭발 피해와 연소 효율이 가장 좋습니다.',
    frost:'빠른 적과 보스의 진행 속도를 늦추는 제어 행성입니다. 코어 직전보다 중간 병목에 두는 편이 안정적입니다.',
    storm:'여러 적에게 번개가 이어지는 다중 타깃 행성입니다. 적 라인이 길게 이어지는 구간에서 효율이 좋습니다.',
    toxic:'보스와 고체력 적에게 누적 피해를 넣는 지속 피해 행성입니다. 오래 맞출 수 있는 경로 옆이 좋습니다.',
    void:'적을 묶고 이동 흐름을 흔드는 제어 행성입니다. 다른 광역 행성 주변에 두면 시너지가 큽니다.',
    laser:'직선 관통과 긴 사거리로 강한 단일 화력을 냅니다. 긴 직선 경로나 후방 저격 자리에 적합합니다.',
    smog:'장판 제어와 둔화, 지속 피해를 함께 쓰는 행성입니다. 5성역 이후 혼잡한 경로에서 안정성이 좋습니다.',
    crystal:'피해를 저장하고 공명시키는 설계형 행성입니다. 여러 장판 효과가 만나는 자리에 배치하면 성장 효율이 좋습니다.',
    mecha:'실드 해체와 방어 보조에 강한 행성입니다. 장갑/실드 적이 늘어나는 후반 성역에서 가치가 큽니다.',
    starengine:'기본 9종 Lv.5 달성 후 열리는 최종 병기입니다. 치명타와 폭발 피해로 후반 보스를 압박합니다.'
  };
  return guides[p.id] || `${p.card || p.kind || '전투 행성'} 역할을 담당합니다.`;
}

function planetDetailTowerSummary(type){
  const placed = Array.isArray(grid) ? grid.filter(t => t && t.type === type) : [];
  let highest = null;
  for(const t of placed){
    if(!highest || Number(t.level || 1) > Number(highest.level || 1)) highest = t;
  }
  return {placed, highest};
}

const PLANET_DETAIL_MAX_LEVEL = 12;
const PLANET_SKILL_PREVIEW_MAX_LEVEL = 5;

function planetBaseLevelStats(type, level){
  const p = PLANETS[type];
  const lv = Math.max(1, Math.min(PLANET_DETAIL_MAX_LEVEL, Number(level || 1)));
  if(!p) return {dmg:0, range:0, cd:0};
  return {
    dmg: p.dmg + lv * 15,
    range: Math.max(70, p.range + lv * 8),
    cd: Math.max(8, p.cd - lv * 1.7)
  };
}

function planetLevelNote(type, level){
  const p = PLANETS[type];
  if(!p) return '';
  if(level === 1) return '소환 시작';
  if(level === 3) return '1차 진화 외형';
  if(level === 5) return type < BASE_PLANET_COUNT ? '2차 진화 · 히든 융합 재료 가능' : '2차 진화';
  if(level === 7) return '3차 진화 외형';
  if(level === 10) return '최종 진화 외형';
  if(level === PLANET_DETAIL_MAX_LEVEL) return '최대 합성 레벨';
  return '동일 행성 합성 성장';
}

function planetLevelProgressHtml(type, currentLevel=0){
  const p = PLANETS[type];
  if(!p) return '<p>레벨 성장 정보를 찾을 수 없습니다.</p>';
  const rows = Array.from({length: PLANET_DETAIL_MAX_LEVEL}, (_, i) => i + 1).map(level => {
    const st = planetBaseLevelStats(type, level);
    const current = Number(currentLevel || 0) === level;
    return `<tr class="${current ? 'current' : ''}">
      <td>Lv.${fmt2(level)}</td>
      <td>${fmt2(st.dmg)}</td>
      <td>${fmt2(st.range)}</td>
      <td>${fmt2(st.cd)}</td>
      <td class="levelTier">${escapeHtml(planetEvolutionName(level))}</td>
      <td>${escapeHtml(planetLevelNote(type, level))}</td>
    </tr>`;
  }).join('');
  return `<div class="planetLevelTableWrap" style="--planet-color:${p.color}">
    <table class="planetLevelTable">
      <thead><tr><th>LEVEL</th><th>공격력</th><th>사거리</th><th>공격 주기</th><th>진화 단계</th><th>비고</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div class="planetDetailNote">장판 보너스, 전술 업그레이드, 전술 버프, 스모그/먼지 페널티는 제외한 기본 성장 기준입니다. 공격 주기는 숫자가 낮을수록 빠릅니다.</div>`;
}

function planetSkillLevelPreviewHtml(skill){
  if(!skill || typeof skill.text !== 'function') return '';
  return `<div class="planetSkillPreview">
    ${Array.from({length: PLANET_SKILL_PREVIEW_MAX_LEVEL}, (_, i) => i + 1).map(level => `<div><b>Lv.${fmt2(level)}</b><span>${escapeHtml(skill.text(level))}</span></div>`).join('')}
  </div>`;
}

function planetGlobalSummaryHtml(){
  return `<div class="planetGlobalText">${globalSkillSummaryHtml()}<br><span style="color:#94a3b8">일반 스킬은 성역 지도에서 강화되고, 전투 중에는 여기서 간략 표기만 됩니다.</span></div>`;
}

function showPlanetDetail(type){
  const p = PLANETS[type];
  const modal = $('planetDetailModal');
  const body = $('planetDetailBody');
  if(!p || !modal || !body) return;
  const locked = isHangarPlanetLocked(type);
  const unlocked = !locked && isTowerUnlocked(type);
  const {placed, highest} = planetDetailTowerSummary(type);
  const st = highest && typeof highest.stats === 'function' ? highest.stats() : null;
  const levelText = highest ? `MAX Lv.${fmt2(highest.level || 1)}` : '보유 없음';
  const statusText = locked ? `<span class="planetDetailLocked">${escapeHtml(hangarCostText(type))}</span>` : (unlocked ? escapeHtml(hangarCostText(type)) : escapeHtml(hangarCostText(type)));
  const tags = Array.isArray(p.tags) ? p.tags : [];
  body.innerHTML = `
    <div class="planetDetailHero" style="--planet-color:${p.color}">
      <div class="planetDetailThumb liveThumb" data-type="${type}" data-level="${highest ? fmt2(highest.level || 1) : 1}"></div>
      <div>
        <div class="planetDetailEyebrow">PLANET DETAIL</div>
        <h2 class="planetDetailTitle" id="planetDetailTitle" style="color:${p.color}">${escapeHtml(p.name)}</h2>
        <div class="planetDetailSubtitle">${escapeHtml(p.role || p.card || '')} · ${escapeHtml(planetKindLabel(p.kind))}</div>
        <div class="planetDetailTags">${tags.map(x=>`<span class="tag">${escapeHtml(x)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="planetDetailGrid">
      <div class="planetDetailStat"><small>상태</small><b>${statusText}</b></div>
      <div class="planetDetailStat"><small>필드 보유</small><b>${fmt2(placed.length)}개</b></div>
      <div class="planetDetailStat"><small>최고 레벨</small><b>${levelText}</b></div>
      <div class="planetDetailStat"><small>타입</small><b>${escapeHtml(planetKindLabel(p.kind))}</b></div>
      <div class="planetDetailStat"><small>기본 공격력</small><b>${fmt2(p.dmg)}</b></div>
      <div class="planetDetailStat"><small>기본 사거리</small><b>${fmt2(p.range)}</b></div>
      <div class="planetDetailStat"><small>공격 주기</small><b>${fmt2(p.cd)}</b></div>
      <div class="planetDetailStat"><small>소환 비용</small><b>${type === HIDDEN_PLANET_TYPE ? '융합' : fmt2(p.cost || 0)}</b></div>
      ${st ? `<div class="planetDetailStat"><small>현재 공격력</small><b>${fmt2(st.dmg)}</b></div>
      <div class="planetDetailStat"><small>현재 사거리</small><b>${fmt2(st.range)}</b></div>` : ''}
    </div>
    <div class="planetDetailSection">
      <h3>역할과 운용</h3>
      <p><b style="color:${p.color}">${escapeHtml(p.role || planetKindLabel(p.kind))}</b> — ${escapeHtml(p.identity || '')}</p>
      <p style="margin-top:6px">${escapeHtml(planetPlayGuide(type))}</p>
    </div>
    <div class="planetDetailSection">
      <h3>타워별 고유 스킬</h3>
      ${towerSkillSummaryHtml(type, highest ? Number(highest.level || 1) : 0)}
    </div>
    <div class="planetDetailSection">
      <h3>적용 중인 일반 스킬</h3>
      ${planetGlobalSummaryHtml()}
    </div>
    <details class="planetDetailDetails">
      <summary>레벨 성장표 보기</summary>
      ${planetLevelProgressHtml(type, highest ? Number(highest.level || 1) : 0)}
    </details>
  `;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  const thumb = body.querySelector('.liveThumb');
  if(thumb) applyLiveThumb(thumb, type, highest ? Number(highest.level || 1) : 1);
}

function hidePlanetDetail(){
  const modal = $('planetDetailModal');
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}

function bindHangarCardDetailEvents(){
  document.querySelectorAll('#hangar .planetCard').forEach(card => {
    card.setAttribute('tabindex','0');
    card.setAttribute('role','button');
    card.setAttribute('aria-label',`${card.querySelector('.planetCardName')?.textContent || '행성'} 상세 보기`);
    card.addEventListener('click', () => showPlanetDetail(Number(card.dataset.type)));
    card.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        showPlanetDetail(Number(card.dataset.type));
      }
    });
  });
}

function renderHangar(){
  const box = $('hangar');
  box.innerHTML = PLANETS.map((p, i) => {
    const locked = isHangarPlanetLocked(i);
    return `
    <div class="planetCard ${locked ? 'locked' : ''}" data-type="${i}" style="--planet-color:${p.color}">
      ${locked ? `<span class="lockTag">${i===HIDDEN_PLANET_TYPE ? 'LOCK' : '미해금'}</span>` : ''}
      <div class="planetThumb liveThumb" data-type="${i}"></div>
      <div class="planetCardInfo">
        <div class="planetCardName">${p.name}</div>
        <div class="planetCardRole">${hangarRoleText(i)}</div>
      </div>
      <div class="planetCardCost">${hangarCostText(i)}</div>
      <div class="planetCardLevel" data-level-badge="${i}">LV.1</div>
    </div>
  `;
  }).join('');
  bindHangarCardDetailEvents();
  updateHangarVisuals(true);
  updateHangarState();
  const bh=$('blackholeBtn'), nv=$('novaBtn'), rp=$('repairBtn');
  if(bh) bh.innerHTML = `Q<br>균열 포획 ${fmt2(Math.ceil(S.tacticalCd.blackhole/60)||70)}`;
  if(nv) nv.innerHTML = `W<br>궤도 포격 ${fmt2(Math.ceil(S.tacticalCd.nova/60)||75)}`;
  if(rp) rp.innerHTML = `E<br>코어 과충전 ${fmt2(Math.ceil(S.tacticalCd.repair/60)||65)}`;
}
function updateHangarVisuals(force=false){
  const signature = hangarVisualSignature();
  if(!force && signature === hangarFrame) return;
  hangarFrame = signature;
  document.querySelectorAll('.liveThumb').forEach(el => applyLiveThumb(el, Number(el.dataset.type), 0));
}
function updateHangarState(){
  if(!S || !grid) return;
  document.querySelectorAll('#hangar .planetCard').forEach(card => {
    const type = Number(card.dataset.type);
    const active = selected >= 0 && grid[selected] && grid[selected].type === type;
    const highest = livePlanetLevel(type);
    card.classList.toggle('active', active);
    card.classList.toggle('locked', isHangarPlanetLocked(type));
    card.classList.toggle('hasUnit', highest > 0);
    const cost = card.querySelector('.planetCardCost');
    if(cost) cost.textContent = hangarCostText(type);
    const role = card.querySelector('.planetCardRole');
    if(role) role.innerHTML = `${hangarRoleText(type)}`;
    const badge = card.querySelector('.planetCardLevel');
    if(badge) badge.textContent = highest > 0 ? `MAX Lv.${fmt2(highest)}` : 'LV.1';
  });
}

function drawBulletTrail(kind, x, y, color){
  if(kind === 'solar'){
    particles.push({x,y,vx:rand(-.18,.18),vy:rand(-.10,.12),r:rand(1.2,2.1),life:10,maxLife:16,color});
    particles.push({x,y,vx:rand(-.10,.10),vy:rand(-.10,.08),r:rand(.9,1.7),life:9,maxLife:14,color:'#fde68a'});
    if(Math.random() < .55) particles.push({x,y,vx:rand(-.08,.08),vy:rand(-.18,.04),r:rand(4,6),life:10,maxLife:18,color:'rgba(251,146,60,.18)',type:'smoke',core:'rgba(255,244,214,.18)'});
  }else if(kind === 'frost'){
    particles.push({x,y,vx:rand(-.16,.16),vy:rand(-.16,.16),r:1.1,life:11,maxLife:18,color:'#e0f2fe',type:'shard',len:rand(4,7),w:rand(1.8,3.0),rot:Math.random()*TAU,spin:rand(-.22,.22),glow:'#bfdbfe'});
  }else if(kind === 'storm'){
    particles.push({x,y,vx:rand(-.20,.20),vy:rand(-.20,.20),r:1.0,life:8,maxLife:14,color:'#fde047',type:'spark',len:rand(4,8),w:rand(1.1,1.9),rot:Math.random()*TAU,spin:rand(-.30,.30),glow:'#fde047'});
  }else if(kind === 'toxic'){
    particles.push({x,y,vx:rand(-.12,.12),vy:rand(-.10,.08),r:rand(4.5,6.8),life:12,maxLife:20,color:'rgba(34,197,94,.20)',type:'smoke',core:'rgba(187,247,208,.18)',blur:5});
  }else if(kind === 'laser'){
    particles.push({x,y,vx:rand(-.18,.18),vy:rand(-.18,.18),r:1.0,life:8,maxLife:14,color:'#fff7ed',type:'spark',len:rand(4,7),w:1.4,rot:Math.random()*TAU,spin:rand(-.16,.16),glow:color});
  }else{
    particles.push({x,y,vx:rand(-.24,.24),vy:rand(-.24,.24),r:rand(1.5,2.6),life:14,maxLife:22,color});
  }
}
function spawnImpactSparks(x,y,color,count=8,spread=1){
  for(let i=0;i<count;i++) particles.push({x,y,vx:rand(-.42,.42)*spread,vy:rand(-.34,.34)*spread,r:1.2,life:12+Math.random()*10,maxLife:20,color,type:'spark',len:rand(5,10),w:rand(1.2,2.2),rot:Math.random()*TAU,spin:rand(-.18,.18),glow:color,blur:10});
}
function spawnImpactShards(x,y,color='#dbeafe',count=7){
  for(let i=0;i<count;i++) particles.push({x,y,vx:rand(-.30,.30),vy:rand(-.30,.30),r:1.2,life:13+Math.random()*8,maxLife:24,color,type:'shard',len:rand(5,10),w:rand(2.1,4.2),rot:Math.random()*TAU,spin:rand(-.2,.2),glow:color,blur:8});
}
function spawnImpactMist(x,y,color='rgba(74,222,128,.24)',count=5){
  for(let i=0;i<count;i++) particles.push({x:x+rand(-5,5),y:y+rand(-5,5),vx:rand(-.12,.12),vy:rand(-.22,.06),r:rand(7,11),life:20+Math.random()*10,maxLife:30,color,type:'smoke',core:'rgba(220,252,231,.20)',blur:6});
}
const SKILL_ICON_THEME = {
  global_damage:['#fb923c','#fdba74','solarCore'], global_speed:['#67e8f9','#dbeafe','laserCooler'], global_crit:['#fde68a','#fff7cc','starCrit'], global_range:['#a78bfa','#ede9fe','frostRange'], global_plate:['#22c55e','#bbf7d0','stormBreak'], global_boss:['#f87171','#fecaca','starBurst'], global_economy:['#facc15','#fef3c7','toxicSpore'],
  solar_core:['#fb923c','#fdba74','solarCore'], solar_flare:['#f97316','#fbbf24','solarFlare'], solar_burn:['#ef4444','#fb923c','solarBurn'],
  frost_core:['#67e8f9','#dbeafe','frostCore'], frost_lock:['#93c5fd','#dbeafe','frostLock'], frost_range:['#38bdf8','#e0f2fe','frostRange'],
  storm_coil:['#facc15','#fde68a','stormCoil'], storm_chain:['#f59e0b','#fde047','stormChain'], storm_break:['#fcd34d','#fff7cc','stormBreak'],
  toxic_reactor:['#22c55e','#86efac','toxicReactor'], toxic_spore:['#4ade80','#dcfce7','toxicSpore'], toxic_slow:['#84cc16','#bef264','toxicSlow'],
  void_pull:['#a855f7','#e9d5ff','voidPull'], void_radius:['#c084fc','#f3e8ff','voidRadius'], void_decay:['#8b5cf6','#ddd6fe','voidDecay'],
  laser_lens:['#a78bfa','#ede9fe','laserLens'], laser_width:['#8b5cf6','#c4b5fd','laserWidth'], laser_cooler:['#7c3aed','#ddd6fe','laserCooler'],
  smog_choke:['#9cab62','#e9f5b5','smogVeil'], smog_catalyst:['#6ee7b7','#d9f99d','smogCondense'], smog_front:['#f59e0b','#e5e7eb','smogReverse'],
  star_crit:['#f8fafc','#fde68a','starCrit'], star_burst:['#fbbf24','#fff7cc','starBurst'], star_nova:['#f8fafc','#ffffff','starNova']
};

function svgDataUri(svg){ return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`; }

function skillIconSvg(skillId){
  const theme = SKILL_ICON_THEME[skillId] || ['#38bdf8','#e2e8f0','generic'];
  const [c1,c2,kind] = theme;
  let body = '';
  switch(kind){
    case 'solarCore': body = `<circle cx="32" cy="32" r="12" fill="${c2}" opacity=".95"/><path d="M32 8 L36 18 L48 16 L42 26 L52 32 L42 38 L48 48 L36 46 L32 56 L28 46 L16 48 L22 38 L12 32 L22 26 L16 16 L28 18 Z" fill="${c1}" opacity=".88"/>`; break;
    case 'solarFlare': body = `<circle cx="32" cy="32" r="10" fill="${c2}"/><path d="M14 40 C22 26, 24 14, 34 10 C30 18, 42 20, 46 28 C52 38, 44 50, 30 50 C20 50, 14 46, 14 40 Z" fill="${c1}"/><path d="M26 28 L34 18 L33 28 L42 28 L30 42 L31 33 L22 33 Z" fill="rgba(255,255,255,.9)"/>`; break;
    case 'solarBurn': body = `<path d="M32 12 C40 22, 46 28, 46 38 C46 47, 40 54, 32 54 C24 54, 18 47, 18 38 C18 31, 22 24, 32 12 Z" fill="${c1}"/><path d="M31 24 C36 30, 38 33, 38 38 C38 43, 35 46, 31 46 C27 46, 24 43, 24 38 C24 34, 26 30, 31 24 Z" fill="${c2}"/>`; break;
    case 'frostCore': body = `<path d="M32 10 L35 22 L46 18 L40 28 L52 32 L40 36 L46 46 L35 42 L32 54 L29 42 L18 46 L24 36 L12 32 L24 28 L18 18 L29 22 Z" fill="${c1}"/><circle cx="32" cy="32" r="8" fill="${c2}" opacity=".85"/>`; break;
    case 'frostLock': body = `<path d="M32 10 L35 22 L46 18 L40 28 L52 32 L40 36 L46 46 L35 42 L32 54 L29 42 L18 46 L24 36 L12 32 L24 28 L18 18 L29 22 Z" fill="${c1}" opacity=".95"/><rect x="25" y="30" width="14" height="13" rx="3" fill="${c2}"/><path d="M28 30 v-3 a4 4 0 0 1 8 0 v3" stroke="${c1}" stroke-width="3" fill="none"/>`; break;
    case 'frostRange': body = `<circle cx="32" cy="32" r="18" stroke="${c1}" stroke-width="4" fill="none"/><circle cx="32" cy="32" r="8" stroke="${c2}" stroke-width="3" fill="none"/><circle cx="32" cy="32" r="3" fill="${c2}"/>`; break;
    case 'stormCoil': body = `<circle cx="32" cy="32" r="18" stroke="${c1}" stroke-width="4" fill="none" opacity=".7"/><path d="M35 12 L24 31 H32 L29 52 L42 29 H34 Z" fill="${c2}"/>`; break;
    case 'stormChain': body = `<path d="M18 24 L28 32 L18 40" stroke="${c1}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 24 L38 32 L28 40" stroke="${c2}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 24 L48 32 L38 40" stroke="${c1}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; break;
    case 'stormBreak': body = `<circle cx="32" cy="32" r="18" stroke="${c1}" stroke-width="3" fill="none"/><path d="M32 16 v32 M16 32 h32" stroke="${c2}" stroke-width="3"/><path d="M40 24 L24 40" stroke="${c1}" stroke-width="4"/>`; break;
    case 'toxicReactor': body = `<path d="M32 12 C40 22, 44 29, 44 37 C44 46, 38 52, 32 52 C26 52, 20 46, 20 37 C20 29, 24 22, 32 12 Z" fill="${c1}"/><circle cx="27" cy="31" r="3" fill="${c2}"/><circle cx="35" cy="37" r="4" fill="${c2}" opacity=".92"/>`; break;
    case 'toxicSpore': body = `<circle cx="24" cy="28" r="8" fill="${c1}"/><circle cx="38" cy="24" r="7" fill="${c2}"/><circle cx="40" cy="38" r="9" fill="${c1}" opacity=".88"/><circle cx="24" cy="42" r="5" fill="${c2}"/>`; break;
    case 'toxicSlow': body = `<path d="M16 38 C22 32, 26 32, 32 38 C38 44, 42 44, 48 38" stroke="${c1}" stroke-width="4" fill="none"/><path d="M16 28 C22 22, 26 22, 32 28 C38 34, 42 34, 48 28" stroke="${c2}" stroke-width="4" fill="none"/><circle cx="18" cy="46" r="3" fill="${c1}"/><circle cx="46" cy="20" r="3" fill="${c2}"/>`; break;
    case 'voidPull': body = `<path d="M32 14 C42 14, 50 22, 50 32 C50 42, 42 50, 32 50 C24 50, 18 44, 18 36 C18 28, 24 24, 31 24 C36 24, 40 28, 40 33 C40 37, 37 40, 33 40 C30 40, 28 38, 28 35" stroke="${c1}" stroke-width="4" fill="none" stroke-linecap="round"/>`; break;
    case 'voidRadius': body = `<circle cx="32" cy="32" r="10" fill="${c1}" opacity=".85"/><circle cx="32" cy="32" r="18" stroke="${c2}" stroke-width="3" fill="none" opacity=".9"/><circle cx="32" cy="32" r="24" stroke="${c1}" stroke-width="2" fill="none" opacity=".5"/>`; break;
    case 'voidDecay': body = `<circle cx="32" cy="32" r="11" fill="${c1}" opacity=".9"/><path d="M20 18 L26 24 M42 20 L36 26 M44 44 L38 38 M18 42 L24 36" stroke="${c2}" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="20" stroke="${c1}" stroke-width="2" fill="none" opacity=".5"/>`; break;
    case 'laserLens': body = `<path d="M32 14 L48 32 L32 50 L16 32 Z" fill="none" stroke="${c1}" stroke-width="4"/><path d="M14 32 H50" stroke="${c2}" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="4" fill="${c2}"/>`; break;
    case 'laserWidth': body = `<path d="M14 26 H50" stroke="${c1}" stroke-width="6" stroke-linecap="round"/><path d="M18 38 H46" stroke="${c2}" stroke-width="10" stroke-linecap="round" opacity=".8"/>`; break;
    case 'laserCooler': body = `<path d="M32 14 L35 22 L44 20 L39 28 L48 32 L39 36 L44 44 L35 42 L32 50 L29 42 L20 44 L25 36 L16 32 L25 28 L20 20 L29 22 Z" fill="${c2}"/><circle cx="32" cy="32" r="17" stroke="${c1}" stroke-width="3" fill="none"/>`; break;
    case 'smogVeil': body = `<circle cx="32" cy="32" r="18" fill="${c1}" opacity=".22"/><path d="M15 35 C22 25, 29 25, 36 34 C42 42, 48 39, 52 31" stroke="${c2}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M13 45 C22 38, 29 39, 35 45 C41 51, 48 49, 52 43" stroke="${c1}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="32" cy="32" r="23" stroke="${c2}" stroke-width="2" fill="none" opacity=".55"/>`; break;
    case 'smogCondense': body = `<circle cx="32" cy="32" r="20" stroke="${c1}" stroke-width="4" fill="none" opacity=".72"/><circle cx="32" cy="32" r="10" fill="${c2}" opacity=".92"/><path d="M18 24 C25 20, 39 20, 46 24 M17 40 C25 45, 39 45, 47 40" stroke="${c1}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M32 17 V47" stroke="${c2}" stroke-width="3" opacity=".75"/>`; break;
    case 'smogReverse': body = `<path d="M47 20 C36 12, 21 15, 17 28 C13 42, 25 52, 39 48" stroke="${c1}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M41 16 L48 20 L43 27" stroke="${c2}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 44 C26 35, 37 35, 47 42" stroke="${c2}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="32" cy="32" r="5" fill="${c2}" opacity=".86"/>`; break;
    case 'starCrit': body = `<path d="M32 12 L36 26 L50 26 L38 34 L42 48 L32 39 L22 48 L26 34 L14 26 L28 26 Z" fill="${c2}"/><path d="M18 18 L46 46" stroke="${c1}" stroke-width="4" opacity=".85"/>`; break;
    case 'starBurst': body = `<circle cx="32" cy="32" r="9" fill="${c2}"/><path d="M32 10 V18 M32 46 V54 M10 32 H18 M46 32 H54 M18 18 L23 23 M41 41 L46 46 M18 46 L23 41 M41 23 L46 18" stroke="${c1}" stroke-width="4" stroke-linecap="round"/>`; break;
    case 'starNova': body = `<circle cx="32" cy="32" r="8" fill="${c2}"/><circle cx="32" cy="32" r="18" stroke="${c1}" stroke-width="3" fill="none"/><path d="M32 8 L35 22 L49 25 L37 32 L40 46 L32 38 L24 46 L27 32 L15 25 L29 22 Z" fill="${c1}" opacity=".88"/>`; break;
    default: body = `<circle cx="32" cy="32" r="14" fill="${c1}"/><circle cx="32" cy="32" r="22" stroke="${c2}" stroke-width="3" fill="none" opacity=".7"/>`;
  }
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="rgba(255,255,255,.22)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
    <rect x="4" y="4" width="56" height="56" rx="18" fill="rgba(3,7,18,.96)" stroke="${c1}" stroke-opacity=".5"/>
    <circle cx="32" cy="32" r="24" fill="url(#g)"/>${body}</svg>`);
}

function bossSkillGlyph(effect){
  return ({phaseRegen:'✦', voidSurge:'◎', frostLock:'❄', blizzardPrison:'❄', magmaShell:'✹', cataclysmBurst:'☄', sporeBloom:'✿', overgrowth:'❋'})[effect] || '◆';
}

let bossTelegraphs = [];
function pushBossTelegraph(enemy, label, color){
  bossTelegraphs.push({x:enemy.x, y:enemy.y, size:enemy.size + 16, color, label, glyph:bossSkillGlyph(enemy.bossEffect), life:40, maxLife:40, tier:enemy.bossTier || 'mid'});
}

function updateBossTelegraphs(dt){
  bossTelegraphs = bossTelegraphs.filter(t => { t.life -= dt; return t.life > 0; });
}

function drawBossTelegraphs(){
  if(!bossTelegraphs.length) return;
  ctx.save();
  bossTelegraphs.forEach(t => {
    const p = 1 - t.life / t.maxLife;
    const alpha = Math.max(0, t.life / t.maxLife);
    const r = t.size + p * 46;
    ctx.globalAlpha = alpha * .38;
    ctx.strokeStyle = t.color;
    ctx.lineWidth = t.tier === 'final' ? 3.6 : 2.8;
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, TAU); ctx.stroke();
    ctx.globalAlpha = alpha * .22;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.size + p * 24, 0, TAU); ctx.stroke();
    ctx.globalAlpha = alpha * .92;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f8fafc';
    ctx.font = `900 ${t.tier === 'final' ? 22 : 18}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.fillText(t.glyph, t.x, t.y + 6);
    const pillW = Math.max(120, Math.min(230, 48 + t.label.length * 8));
    const pillX = t.x - pillW/2, pillY = t.y - r - 24;
    ctx.globalAlpha = alpha * .86;
    roundRect(pillX, pillY, pillW, 22, 11, 'rgba(2,6,23,.82)', 'rgba(255,255,255,.14)');
    ctx.fillStyle = t.color;
    ctx.font = '900 10px Noto Sans KR';
    ctx.fillText(t.label, t.x, pillY + 15);
  });
  ctx.restore();
}


const BOSS_SKILL_KO = {
  '위상 재생':'위상 재생',
  '특이점 폭주':'특이점 폭주',
  '빙결 구속':'빙결 구속',
  '눈보라 감옥':'눈보라 감옥',
  '용암 장갑':'용암 장갑',
  '대폭발':'대폭발',
  '포자 증식':'포자 증식',
  '과성장':'과성장',
  '매연 차폐':'매연 차폐',
  '산업 장막':'산업 장막',
  '굴절 장막':'굴절 장막',
  '수정 과부하':'수정 과부하',
  '전장 수리':'전장 수리',
  '코어 재부팅':'코어 재부팅',
  '보스 폭발':'보스 폭발',
  '성흔 폭발':'성흔 폭발',
  '치명타':'치명타',
  '치명타':'치명타',
  '과열':'과열'
};
function bossSkillKo(label){
  const key = String(label || '').trim().toUpperCase();
  return BOSS_SKILL_KO[key] || String(label || '보스 스킬');
}

function bossWarning(enemy,label,color){
  const labelKo = bossSkillKo(label);
  pushBossTelegraph(enemy, labelKo, color);
  const node = $('stageFxLabel');
  if(node){
    const tierKo = enemy.bossTier === 'final' ? '최종 보스' : '중간 보스';
    node.textContent = `${tierKo} 스킬 · ${labelKo}`;
    node.style.opacity = 1;
    node.style.color = '#f8fafc';
    node.style.borderColor = 'rgba(248,113,113,.38)';
    node.style.boxShadow = `0 0 24px ${color}35`;
    clearTimeout(node._hideTimer);
    node._hideTimer = setTimeout(()=>{ if(node){ node.style.opacity = 0; node.style.borderColor='rgba(255,255,255,.08)'; node.style.boxShadow=''; } }, 900);
  }
  ring(enemy.x, enemy.y, enemy.size + 22, color);
  ring(enemy.x, enemy.y, enemy.size + 42, 'rgba(255,255,255,.75)');
}

function impactEffect(kind, x, y, color, level){
  if(kind === 'solar'){
    burst(x,y,color,10,20); ring(x,y,30+level*1.2,color); spawnImpactSparks(x,y,'#fdba74',10,1.2);
  } else if(kind === 'frost'){
    burst(x,y,'#dbeafe',6,14); ring(x,y,24+level*1.0,'#67e8f9'); spawnImpactShards(x,y,'#dbeafe',9);
  } else if(kind === 'storm'){
    burst(x,y,'#fde047',6,12); ring(x,y,21+level*1.1,'#facc15'); spawnImpactSparks(x,y,'#fde047',12,1.28);
  } else if(kind === 'toxic'){
    burst(x,y,'#4ade80',6,11); ring(x,y,22+level*1.0,'#22c55e'); spawnImpactMist(x,y,'rgba(34,197,94,.28)',6);
  } else if(kind === 'smog'){
    burst(x,y,'#d9f99d',5,12); ring(x,y,27+level*1.15,'#9cab62'); spawnImpactMist(x,y,'rgba(156,171,98,.28)',8);
  } else if(kind === 'starengine'){
    burst(x,y,'#fff7ed',10,18); ring(x,y,28+level*1.15,'#f8fafc'); spawnImpactSparks(x,y,'#fff7ed',12,1.2);
  } else { burst(x,y,color,5,14); }
}
function drawProjectileVisual(b){
  ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.rot);
  if(b.kind === 'solar'){
    ctx.shadowColor=b.color;ctx.shadowBlur=24;
    const g=ctx.createRadialGradient(1,-1,1,0,0,10); g.addColorStop(0,'#fff7ed'); g.addColorStop(.42,'#fdba74'); g.addColorStop(1,b.color);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,6.0,0,TAU); ctx.fill();
    ctx.globalAlpha=1; ctx.fillStyle='rgba(255,244,214,.8)'; ctx.beginPath(); ctx.ellipse(-4.6,0,4.5,2.4,0,0,TAU); ctx.fill();
  }else if(b.kind === 'frost'){
    ctx.shadowColor='#67e8f9';ctx.shadowBlur=24;ctx.fillStyle='#e0f2fe';
    ctx.beginPath(); ctx.moveTo(0,-7.4); ctx.lineTo(3.8,-1.8); ctx.lineTo(6.2,0); ctx.lineTo(3.8,1.8); ctx.lineTo(0,7.4); ctx.lineTo(-3.6,1.8); ctx.lineTo(-5.4,0); ctx.lineTo(-3.6,-1.8); ctx.closePath(); ctx.fill();
  }else if(b.kind === 'storm'){
    ctx.shadowColor='#fde047';ctx.shadowBlur=24;ctx.strokeStyle='#facc15';ctx.lineWidth=3.1;
    ctx.beginPath(); ctx.moveTo(-5.2,-6.5); ctx.lineTo(-.8,-1.4); ctx.lineTo(-2.5,1.1); ctx.lineTo(5.8,6.2); ctx.stroke();
    ctx.strokeStyle='#fff7cc';ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-5.2,-6.5); ctx.lineTo(-.8,-1.4); ctx.lineTo(-2.5,1.1); ctx.lineTo(5.8,6.2); ctx.stroke();
  }else if(b.kind === 'toxic'){
    ctx.shadowColor='#4ade80';ctx.shadowBlur=20;ctx.fillStyle='#22c55e'; ctx.beginPath(); ctx.arc(0,0,5.4,0,TAU); ctx.fill();
    ctx.globalAlpha=.92; ctx.fillStyle='rgba(187,247,208,.72)'; ctx.beginPath(); ctx.ellipse(-5,0,4.6,2.6,0,0,TAU); ctx.fill();
  }else if(b.kind === 'crystal'){
    ctx.shadowColor='#d8b4fe';ctx.shadowBlur=24;
    ctx.fillStyle='#e9d5ff';
    ctx.beginPath(); ctx.moveTo(0,-7.8); ctx.lineTo(6.6,0); ctx.lineTo(0,7.8); ctx.lineTo(-6.6,0); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=.74; ctx.strokeStyle='#c084fc'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.ellipse(0,0,9.2,3.4,.4,0,TAU); ctx.stroke();
  }else if(b.kind === 'mecha'){
    ctx.shadowColor='#60a5fa';ctx.shadowBlur=22;
    ctx.fillStyle='#93c5fd'; ctx.fillRect(-5.8,-4.2,11.6,8.4);
    ctx.fillStyle='#eff6ff'; ctx.fillRect(-1.8,-1.8,3.6,3.6);
    ctx.strokeStyle='#f87171'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.stroke();
  }else if(b.kind === 'smog'){
    ctx.shadowColor='#d9f99d';ctx.shadowBlur=22;ctx.fillStyle='#9cab62'; ctx.beginPath(); ctx.arc(0,0,5.8,0,TAU); ctx.fill();
    ctx.globalAlpha=.72; ctx.fillStyle='rgba(229,231,235,.62)'; ctx.beginPath(); ctx.ellipse(-5.4,0,5.6,2.5,0,0,TAU); ctx.fill();
    ctx.globalAlpha=.52; ctx.strokeStyle='rgba(245,158,11,.75)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,8.5,Math.PI*.15,Math.PI*1.25); ctx.stroke();
  }else{
    ctx.fillStyle='#f3e8ff';ctx.shadowColor=b.color;ctx.shadowBlur=20; ctx.beginPath();ctx.arc(0,0,5.8,0,TAU);ctx.fill(); ctx.fillStyle=b.color; ctx.beginPath(); ctx.arc(0,0,4.0,0,TAU); ctx.fill();
  }
  ctx.restore();
}
function reset(){
  S = {
    theme:0,wave:1,gold:420,hp:22,maxHp:22,exp:0,level:1,nextExp:140,
    speed:1,paused:false,active:false,spawned:0,total:0,skillQueue:0,skillModalOpen:false,
    globalUpgrades:{},
    hazardTimer:0,stageFx:null,stageArmorBonus:0,globalCooldownPenalty:0,
    hiddenUnlocked:false,
    tacticalCd:{blackhole:0,nova:0,repair:0},
    tacticalBoost:0,
    mods:{reward:0,repair:0,treasure:0}, coreShield:0,
    queue:[],
    currentBossInfo:null,
    dustClouds:[],
    dustHintShown:false,
    combo:{kills:0,timer:0,best:0},
    mergeCombo:{count:0,timer:0},
    runKills:0,
    runSummons:0,
    runMerges:0,
    leakedEnemies:0,
    coreDamageTaken:0,
    gameOver:false,
    gameOverOverlayShown:false,
    gameOverOverlayRequested:false,
    lastGameOverSummary:null,
    runEnded:false,
    offline:{summonCost:100,cooldownScale:1}
  };
  grid = Array(GRID_COLS*GRID_ROWS).fill(null);
  terrain = Array(GRID_COLS*GRID_ROWS).fill('empty');
  enemies = [];
  bullets = [];
  particles = [];
  beams = [];
  floats = [];
  anomalies = [];
  selected = -1;
  dragging = null;
  nextPlanetUid = 1;
  applyOfflineMetaToRun(true);
  buildFieldStars();
}

function theme(){return THEMES[S.theme]}
function center(i){return {x:GX+(i%GRID_COLS)*CELL+CELL/2,y:GY+Math.floor(i/GRID_COLS)*CELL+CELL/2}}
function gridPoint(col,row){return {x:GX+col*CELL+CELL/2,y:GY+row*CELL+CELL/2}}
function idxAt(x,y){
  // v22: exact grid hit-test.  Padded/clamped hit-testing made focus snap
  // to a neighboring cell near the board edge and looked one cell off.
  if(x < GX || y < GY || x >= GX + GRID_COLS * CELL || y >= GY + GRID_ROWS * CELL) return -1;
  const gx = Math.floor((x - GX) / CELL);
  const gy = Math.floor((y - GY) / CELL);
  if(gx < 0 || gx >= GRID_COLS || gy < 0 || gy >= GRID_ROWS) return -1;
  return gy * GRID_COLS + gx;
}
function dist(a,b,c,d){return Math.hypot(a-c,b-d)}
function canBuild(i){return i>=0 && terrain[i]!=='path' && terrain[i]!=='blocked'}
function defaultAug(){
  return {damage:0,fireRate:0,range:0,area:0,dot:0,freeze:0,freezeChance:0,chain:0,gravity:0,beamWidth:0,markAmp:0,poisonSlow:0,critChance:0,critMul:0,burstChance:0,crystalCharge:0,prismLink:0,resonancePlate:0,shieldDismantle:0,satelliteForge:0,emergencyBarrier:0};
}
function ensureAug(t){
  if(!t.aug) t.aug = defaultAug();
  if(!t.skillLevels) t.skillLevels = {};
  return t.aug;
}
function combineAugments(a,b){
  const out = defaultAug();
  for(const k of Object.keys(out)) out[k] = ((a?.aug?.[k]||0) + (b?.aug?.[k]||0)) * .75;
  return out;
}
function combineSkillLevels(a,b){
  const out = {};
  for(const src of [a?.skillLevels||{}, b?.skillLevels||{}]){
    for(const [k,v] of Object.entries(src)) out[k] = Math.max(out[k]||0, v);
  }
  return out;
}
function createMergedPlanet(a,b,idx){
  const p = new Planet(a.type, a.level+1, idx);
  p.aug = combineAugments(a,b);
  p.skillLevels = combineSkillLevels(a,b);
  const unlocked = syncTowerSkillUnlocks(p);
  if(unlocked.length && S){ log(`${p.def.name} Lv.${fmt2(p.level)} 고유 스킬 해금: ${unlocked.map(s=>s.name).join(' · ')}`); }
  return p;
}
function pointSeg(px,py,x1,y1,x2,y2){
  const dx=x2-x1,dy=y2-y1;
  const t=clamp(((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy),0,1);
  return dist(px,py,x1+t*dx,y1+t*dy);
}

function applyRouteChamfers(points){
  if(!Array.isArray(points) || points.length < 3) return Array.isArray(points) ? points.slice() : [];
  const out = [points[0]];
  const bevel = Math.max(22, Math.min(40, CELL * .34));
  const minDotForStraight = .985;

  function unit(a, b){
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return {x: dx / len, y: dy / len, len};
  }

  for(let i=1;i<points.length-1;i++){
    const prev = points[i-1], p = points[i], next = points[i+1];
    const from = unit(p, prev);
    const to = unit(p, next);
    const dot = from.x * to.x + from.y * to.y;

    // Straight or near-180-degree points stay untouched. Real turns become
    // short diagonal bevels so enemies glide through 90-degree corners without
    // a hard square corner. This is intentionally a straight chamfer, not a curve.
    if(Math.abs(dot) > minDotForStraight){
      out.push(p);
      continue;
    }

    const d = Math.min(bevel, from.len * .42, to.len * .42);
    out.push({ x: p.x + from.x * d, y: p.y + from.y * d, chamfer:true });
    out.push({ x: p.x + to.x * d, y: p.y + to.y * d, chamfer:true });
  }
  out.push(points[points.length-1]);
  return out;
}

function makeRoute(){
  // v18: more tower-defense-like route catalog.
  // Each stage now has a distinct map path, and the early / mid / late wave bands
  // rotate through different lane shapes instead of reusing only four route groups.
  const maxC = Math.max(1, GRID_COLS - 1);
  const maxR = Math.max(1, GRID_ROWS - 1);
  const bound = (v,min,max)=>Math.max(min, Math.min(max, v));
  const col = pct => bound(Math.round(maxC * pct), 0, maxC);
  const row = pct => bound(Math.round(maxR * pct), 0, maxR);
  const gp = (colPct,rowPct)=>gridPoint(col(colPct), row(rowPct));
  const stageNo = bound(Number(S?.stageNo || StageMapState?.current || 1) || 1, 1, 12);
  const wave = Number(S?.ogge || 1) || 1;
  const waveBand = wave < 4 ? 0 : (wave < 8 ? 1 : 2);

  // Normalized orthogonal waypoint templates. Consecutive points intentionally share
  // either X or Y so the road reads like a real TD lane, not a stretched polyline.
  const routeTemplates = [
    [[.08,.24],[.30,.24],[.30,.46],[.62,.46],[.62,.70],[.86,.70]],
    [[.08,.18],[.44,.18],[.44,.34],[.18,.34],[.18,.62],[.70,.62],[.70,.84],[.92,.84]],
    [[.10,.70],[.32,.70],[.32,.28],[.58,.28],[.58,.56],[.86,.56]],
    [[.08,.40],[.38,.40],[.38,.18],[.72,.18],[.72,.48],[.28,.48],[.28,.78],[.82,.78]],
    [[.10,.22],[.56,.22],[.56,.42],[.26,.42],[.26,.64],[.76,.64],[.76,.84]],
    [[.12,.50],[.26,.50],[.26,.24],[.74,.24],[.74,.70],[.42,.70],[.42,.86],[.90,.86]],
    [[.08,.12],[.32,.12],[.32,.36],[.56,.36],[.56,.20],[.84,.20],[.84,.58],[.64,.58],[.64,.82],[.90,.82]],
    [[.08,.82],[.34,.82],[.34,.60],[.18,.60],[.18,.34],[.58,.34],[.58,.72],[.88,.72]],
    [[.08,.32],[.22,.32],[.22,.16],[.48,.16],[.48,.48],[.72,.48],[.72,.28],[.92,.28]],
    [[.12,.18],[.12,.78],[.36,.78],[.36,.26],[.62,.26],[.62,.86],[.88,.86]],
    [[.10,.58],[.30,.58],[.30,.22],[.54,.22],[.54,.46],[.22,.46],[.22,.76],[.80,.76]],
    [[.08,.26],[.36,.26],[.36,.14],[.74,.14],[.74,.42],[.48,.42],[.48,.70],[.88,.70],[.88,.86]]
  ];

  // Stable but varied: every stage gets its own base path, and mid/late waves
  // rotate into other templates so repeated play does not feel identical.
  const templateIndex = ((stageNo - 1) + waveBand * 4) % routeTemplates.length;
  const plan = routeTemplates[templateIndex];
  // v26: spawn from the top-left entrance of the board.
  // Monsters now always enter from just outside the left side of the first
  // top-row block, then move through the top-left block before following
  // the stage/wave-specific route template. This keeps the start point
  // consistent without flattening the existing route variety.
  const entryRow = plan[0]?.[1] ?? 0;
<<<<<<< HEAD
  const startX = GX - Math.max(42, CELL * .88);
=======
  const startX = BOARD_IS_LANDSCAPE ? -Math.max(28, CELL * .72) : GX - Math.max(42, CELL * .88);
>>>>>>> 5988c15 (v004)
  const topLeftEntry = gridPoint(0, 0);
  const leftLaneEntry = gridPoint(0, row(entryRow));
  const baseRoute = [{x:startX, y:topLeftEntry.y}, topLeftEntry];

  if(Math.abs(leftLaneEntry.y - topLeftEntry.y) > 2){
    baseRoute.push(leftLaneEntry);
  }

  for(const [c,r] of plan){
    baseRoute.push(gp(c,r));
  }

  // Exit through a short service lane just outside the board before entering CORE.
  // This makes the final bend readable in both portrait and landscape layouts.
  const last = baseRoute[baseRoute.length - 1];
  const boardRight = GX + GRID_COLS * CELL;
  const exitX = bound(
    Math.max(last.x + CELL * .42, boardRight + CELL * .18),
    last.x,
    Math.max(last.x, CORE.x - Math.max(12, CELL * .18))
  );
  if(Math.abs(exitX - last.x) > 2){
    baseRoute.push({x:exitX, y:last.y});
  }
  if(Math.abs(last.y - CORE.y) > 2){
    baseRoute.push({x:exitX, y:CORE.y});
  }
  baseRoute.push({x:CORE.x, y:CORE.y});

  // Guard against accidental duplicate points after rounding on compact screens.
  const deduped = baseRoute.filter((pt, idx, arr)=>{
    if(idx === 0) return true;
    const prev = arr[idx-1];
    return Math.abs(pt.x - prev.x) > 1 || Math.abs(pt.y - prev.y) > 1;
  });

  route = applyRouteChamfers(deduped);
}

function makeTerrain(){
  terrain.fill('empty');
  plateAffinity = {};
  const pathWidth = CELL * .38;
  for(let i=0;i<terrain.length;i++){
    const c=center(i);
    for(let j=0;j<route.length-1;j++){
      if(pointSeg(c.x,c.y,route[j].x,route[j].y,route[j+1].x,route[j+1].y)<pathWidth) terrain[i]='path';
    }
  }
  const pool = [];
  for(let i=0;i<terrain.length;i++) if(terrain[i]==='empty') pool.push(i);
  const blockedCount = Math.min(6, Math.floor(pool.length * .12));
  for(let n=0;n<blockedCount;n++){
    const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    if(k!==undefined) terrain[k]='blocked';
  }
  for(const t of ['amp','coil','lens','mine','rift','amp','coil','lens','mine','amp']){
    const free=pool.filter(i=>terrain[i]==='empty');
    if(!free.length) break;
    const pick = free[Math.floor(Math.random()*free.length)];
    terrain[pick]=t;
    const affinityType = randomPlateAffinityType();
    plateAffinity[pick] = {type: affinityType, color: PLANETS[affinityType]?.color || '#67e8f9'};
    const pidx = pool.indexOf(pick);
    if(pidx>=0) pool.splice(pidx,1);
  }
}


const STAGE_BATTLE_DESCRIPTIONS = Object.fromEntries(
  Object.entries(STAGE_DESCRIPTION_COPY).map(([stage, copy]) => [Number(stage), copy.battle])
);
const STAGE_WAVE_LINES = {
  1:'공허 균열 적',
  2:'빙결 선봉대',
  3:'용암 장갑 적',
  4:'재생 포자 군체',
  5:'매연 은폐 적',
  6:'수정 공명체',
  7:'기계 실드 유닛',
  8:'중력 왜곡 적',
  9:'과전류 고속 적',
  10:'시간 잔상 적',
  11:'침묵 잠행 적',
  12:'균열 왕좌 혼합군'
};
const STAGE_WAVE_TIPS = {
  1:'균형 배치',
  2:'감속 / 제어',
  3:'장갑 돌파 / 광역',
  4:'재생 차단 / 집중 화력',
  5:'방어 약화 / 감속',
  6:'공명 장판 / 초과 피해',
  7:'실드 해체 / 수리 차단',
  8:'군중 제어 / 밀집 처리',
  9:'고속 대응 / 연쇄 화력',
  10:'잔상 처리 / 화력 분산 방지',
  11:'암흑 장갑 / 안정 배치',
  12:'복합 패턴 / 핵심 타워 병합'
};
function getStageBattleDescription(stageNo, waveNo){
  const n = clamp(Number(stageNo || S?.stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const wave = Number(waveNo || S?.ogge || 1);
  const base = STAGE_BATTLE_DESCRIPTIONS[n] || getStageDef(n).ko || '성역 방어';
  if(wave === 5) return `${base} · 중간 보스`;
  if(wave === 10) return `${base} · 최종 보스`;
  if(wave % 4 === 0) return `${base} · 압박 웨이브`;
  return base;
}
function getStageBattleFullDescription(stageNo, waveNo){
  const n = clamp(Number(stageNo || S?.stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const def = getStageDef(n);
  const presentation = getStagePresentation(n);
  const preview = getWavePreviewInfo(waveNo || S?.ogge || 1, n);
  const copy = getStageDescriptionCopy(n);
  return `${def.stage}. ${def.name} / ${def.ko} · ${copy.summary} · ${copy.enemy} · ${preview.title} · ${preview.detail}`;
}


function getWavePreviewInfo(waveNo, stageNo){
  const stage = clamp(Number(stageNo || S?.stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const wave = Number(waveNo || 1);
  const enemyLine = STAGE_WAVE_LINES[stage] || '기본 적 웨이브';
  const stageTip = STAGE_WAVE_TIPS[stage] || '균형 배치';
  const parts = [];
  const tips = [];
  if(wave === 5){
    parts.push(`${enemyLine} · 중간 보스 출현`);
    tips.push('보스 피해');
    tips.push(stageTip);
  }else if(wave === 10){
    parts.push(`${enemyLine} · 최종 보스 출현`);
    tips.push('핵심 타워 병합');
    tips.push(stageTip);
  }else if(wave % 4 === 0){
    parts.push(`${enemyLine} · 압박 웨이브`);
    tips.push('범위 화력');
    tips.push(stageTip);
  }else{
    if(wave >= 6) parts.push(`${enemyLine} · 강화 적 증가`);
    else if(wave >= 3) parts.push(`${enemyLine} · 특수 적 증가`);
    else parts.push(`${enemyLine} · 기본 웨이브`);
    tips.push(stageTip);
    if(wave >= 3) tips.push('병합 준비');
  }
  return {
    title: parts.join(' · '),
    detail: `추천: ${tips.filter(Boolean).join(' / ')}`
  };
}
function renderWavePreview(){
  const el = $('wavePreviewText');
  if(!el || !S) return;
  const info = getWavePreviewInfo(S.ogge || 1, S.stageNo || StageMapState.current || 1);
  el.textContent = `${info.title} · ${info.detail}`;
}

function prepareWave(){
  makeRoute();
  makeTerrain();
  relocateInvalidPlanets();
  enemies.length=0;bullets.length=0;particles.length=0;beams.length=0;floats.length=0;anomalies.length=0;
  S.stageArmorBonus=0;
  S.globalCooldownPenalty=0;
  S.hazardTimer=150;
  buildDustClouds();
  S.queue.length=0;
  const count = 28 + S.ogge*6 + S.theme*6;
  for(let i=0;i<count;i++){
    let type='grunt';
    if(i%4===1) type='runner';
    if(i%6===3) type='brute';
    if(S.ogge>=2 && i%8===5) type='regen';
    if(S.ogge>=3 && i%5===0) type='brute';
    if(S.ogge>=6 && i%7===2) type='regen';
    if(Math.random()<.02+S.mods.treasure) type='treasure';
    S.queue.push(type);
  }
  S.currentBossInfo = null;
  if(S.ogge===5){
    const bossData = getStageBossDef(S.stageNo || StageMapState.current || 1, 'mid');
    S.queue.push({type:'midboss', bossTier:'mid', bossData});
    S.currentBossInfo = bossData;
  }else if(S.ogge===10){
    const bossData = getStageBossDef(S.stageNo || StageMapState.current || 1, 'final');
    S.queue.push({type:'finalboss', bossTier:'final', bossData});
    S.currentBossInfo = bossData;
  }else if(S.ogge%4===0){
    S.queue.push('boss');
  }
  S.total=S.queue.length;
  S.spawned=0;
  S.active=true;
  spawnTimer=13;
  document.getElementById('bg').style.backgroundImage=`url("${theme().bg}")`;
  triggerStageFx('enter');
  if(audio && audio.on) playStageBgm();
  toast(`${theme().ko} 진입 — 장판 활용이 필수입니다`);
  if(S.currentBossInfo){
    const storyPhase = S.ogge===10 ? 'final' : 'mid';
    markOfflineStory(S.stageNo || StageMapState.current || 1, storyPhase);
    sound('boss', { intensity: storyPhase === 'final' ? 1.2 : 1 });
    playStageBgm();
    toast(`${STORY_EVENT_TEXT.boss} ${S.currentBossInfo.name} / ${S.currentBossInfo.ko}`);
    log(`보스 경보: ${S.currentBossInfo.name} / ${S.currentBossInfo.ability} — ${S.currentBossInfo.desc}`);
    log(`시나리오: ${getOfflineStoryLog(S.stageNo || StageMapState.current || 1, storyPhase)}`);
  }
  const preview = getWavePreviewInfo(S.ogge, S.stageNo || StageMapState.current || 1);
  log(`웨이브 ${S.ogge}: ${theme().ko} / 장판 없이 방어 어려움 / 적 ${S.total}체 접근`);
  toast(`웨이브 ${S.ogge} · ${preview.title} · ${preview.detail}`, S.currentBossInfo ? 'important' : 'normal');
  updateUI();
}



function roundRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r);
  if(fill){ ctx.fillStyle = fill; ctx.fill(); }
  if(stroke){ ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawSpriteCover(img, sx, sy, sw, sh, dx, dy, dw, dh){
  const ir = sw / sh;
  const cr = dw / dh;
  let cropW = sw, cropH = sh, cropX = sx, cropY = sy;
  if(ir > cr){
    cropW = sh * cr;
    cropX = sx + (sw - cropW) / 2;
  }else{
    cropH = sw / cr;
    cropY = sy + (sh - cropH) / 2;
  }
  ctx.drawImage(img, cropX, cropY, cropW, cropH, dx, dy, dw, dh);
}

function planetEvolutionTier(level){
  if(level >= 10) return 4;
  if(level >= 7) return 3;
  if(level >= 5) return 2;
  if(level >= 3) return 1;
  return 0;
}

function planetEvolutionName(level){
  return ['SEED','AWAKENED','ASCENDED','TRANSCENDENT','COSMIC'][planetEvolutionTier(level)] || 'SEED';
}

function drawPlanetEvolutionFx(tower, x, y){
  const tier = planetEvolutionTier(tower.level);
  if(tier <= 0) return;
  const color = tower.def.color;
  const pulse = 1 + Math.sin(performance.now() / (260 - tier * 20) + tower.phase) * 0.05;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.globalCompositeOperation = 'screen';
  if(tier >= 1){
    ctx.globalAlpha = .48;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 25 + tier * 2, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 31 + tier * 2, -Math.PI * .45, Math.PI * .28);
    ctx.stroke();
  }
  if(tier >= 2){
    ctx.globalAlpha = 1;
    for(let i=0;i<2;i++){
      const a = tower.phase + performance.now() * .0012 * (i ? -1 : 1) + i * Math.PI;
      const sx = Math.cos(a) * (18 + tier * 2);
      const sy = Math.sin(a) * (10 + tier);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.1 + tier * .16, 0, TAU);
      ctx.fill();
    }
  }
  if(tier >= 3){
    ctx.globalAlpha = .56;
    ctx.strokeStyle = 'rgba(255,255,255,.82)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a = -Math.PI/2 + i * TAU / 6 + performance.now() * .0004;
      const r1 = 34 + tier * 2;
      const r2 = 40 + tier * 2;
      const x1 = Math.cos(a) * r1, y1 = Math.sin(a) * r1;
      const x2 = Math.cos(a) * r2, y2 = Math.sin(a) * r2;
      ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    }
    ctx.stroke();
  }
  if(tier >= 4){
    ctx.globalAlpha = .66;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 43, 14, .22, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 35, 34, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.shadowBlur = 14;
    for(let i=0;i<5;i++){
      const a = performance.now() * .0012 + i * TAU / 5;
      const sx = Math.cos(a) * 28;
      const sy = Math.sin(a) * 28;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function nearestPointOnSegment(px, py, x1, y1, x2, y2){
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx*dx + dy*dy || 1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
  const x = x1 + dx * t;
  const y = y1 + dy * t;
  const distVal = Math.hypot(px - x, py - y);
  return {x, y, t, dist:distVal};
}

function nearestRoutePoint(px, py, preferredSeg=0){
  let best = null;
  const start = Math.max(0, preferredSeg - 1);
  const end = Math.min(route.length - 2, preferredSeg + 1);
  for(let seg=start; seg<=end; seg++){
    const a = route[seg], b = route[seg+1];
    const hit = nearestPointOnSegment(px, py, a.x, a.y, b.x, b.y);
    // 코너에서는 이전 segment와 현재 segment의 거리가 동시에 0이 될 수 있다.
    // 이때 이전 segment를 고르면 적이 첫 꺾임 지점에서 되돌아가는 것처럼 멈춘다.
    // 따라서 현재 진행 segment를 우선하고, 동일 거리에서는 뒤쪽 segment보다 현재/앞쪽 segment를 우선한다.
    const tiePenalty = Math.abs(seg - preferredSeg) * .001 + (seg < preferredSeg ? .002 : 0);
    const score = hit.dist + tiePenalty;
    if(!best || score < best.score) best = {...hit, seg, score};
  }
  return best;
}

function confineEnemyToRoute(enemy, maxOffset=12){
  if(!route || route.length < 2) return;
  const currentSeg = Math.max(0, Math.min(route.length - 2, enemy.seg || 0));
  const hit = nearestRoutePoint(enemy.x, enemy.y, currentSeg);
  if(!hit) return;
  const d = hit.dist;
  if(d > maxOffset){
    const dx = enemy.x - hit.x;
    const dy = enemy.y - hit.y;
    const inv = d > 0 ? 1 / d : 0;
    enemy.x = hit.x + dx * inv * maxOffset;
    enemy.y = hit.y + dy * inv * maxOffset;
  }
  // 중요: 경로 이탈 보정은 위치만 보정한다.
  // segment 진행은 Enemy.update()에서만 바뀌어야 코너에서 멈춤/왕복 현상이 없다.
}

function drawPlanetSprite(type, x, y, size, frameIndex, level=1){
  const thumbImg = planetThumbImage(type, level);
  if(thumbImg && thumbImg.complete && thumbImg.naturalWidth){
    const drawSize = size * (type === HIDDEN_PLANET_TYPE ? 1.20 : 1.14);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = type === HIDDEN_PLANET_TYPE ? 'rgba(255,250,230,.48)' : 'rgba(255,255,255,.30)';
    ctx.shadowBlur = type === HIDDEN_PLANET_TYPE ? 24 : 16;
    ctx.filter = 'brightness(1.10) saturate(1.15)';
    drawImageContainCentered(thumbImg, x, y, drawSize, drawSize);
    ctx.filter = 'none';
    ctx.restore();
    return true;
  }

  const evoImg = planetSheetImage(type);
  const evoCol = planetEvolutionColumn(level);
  if(evoImg && evoImg.complete && evoImg.naturalWidth){
    const cellW = evoImg.naturalWidth / PLANET_EVOLUTION_COLS;
    const cellH = evoImg.naturalHeight;
    const sx = evoCol * cellW;
    const sy = 0;
    const drawSize = size * (type === HIDDEN_PLANET_TYPE ? 1.12 : 1.00);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = type === HIDDEN_PLANET_TYPE ? 'rgba(255,250,230,.48)' : 'rgba(255,255,255,.30)';
    ctx.shadowBlur = type === HIDDEN_PLANET_TYPE ? 24 : 16;
    ctx.filter = 'brightness(1.10) saturate(1.15)';
    drawSpriteCover(evoImg, sx, sy, cellW, cellH, x - drawSize/2, y - drawSize/2, drawSize, drawSize);
    ctx.filter = 'none';
    ctx.restore();
    return true;
  }
  const img = PLANET_ICON_SHEET;
  if(!img || !img.complete || !img.naturalWidth) return false;
  const cellW = img.naturalWidth / PLANET_ICON_COLS;
  const cellH = img.naturalHeight / PLANET_ICON_ROWS;
  const col = type % PLANET_ICON_COLS;
  const row = Math.floor(type / PLANET_ICON_COLS);
  const sx = col * cellW;
  const sy = row * cellH;
  const drawSize = size * (type === HIDDEN_PLANET_TYPE ? 1.08 : PLANET_RENDER_SCALE);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.shadowColor = type === HIDDEN_PLANET_TYPE ? 'rgba(255,250,230,.44)' : 'rgba(255,255,255,.32)';
  ctx.shadowBlur = type === HIDDEN_PLANET_TYPE ? 26 : 17;
  ctx.filter = 'brightness(1.10) saturate(1.15)';
  ctx.drawImage(img, sx, sy, cellW, cellH, x - drawSize/2, y - drawSize/2, drawSize, drawSize);
  ctx.filter = 'none';
  ctx.restore();
  return true;
}

function drawPlanetOrbitAsteroids(type, x, y, level, phase){
  const d = PLANETS[type];
  const t = performance.now() * 0.001;
  const count = type === HIDDEN_PLANET_TYPE ? 3 : 2;
  const baseR = type === HIDDEN_PLANET_TYPE ? 26 : 20;
  const major = baseR + level * .68;
  const minor = (type === HIDDEN_PLANET_TYPE ? 9.5 : 7) + level * .16;
  ctx.save();
  ctx.strokeStyle = type === HIDDEN_PLANET_TYPE ? 'rgba(255,248,220,.48)' : 'rgba(255,255,255,.30)';
  ctx.lineWidth = type === HIDDEN_PLANET_TYPE ? 1.4 : 1.0;
  ctx.beginPath(); ctx.ellipse(x, y, major+4, minor+3, .18, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y, major-6, minor-1, -.42, 0, TAU); ctx.stroke();
  for(let i=0;i<count;i++){
    const dir = i % 2 === 0 ? 1 : -1;
    const ang = phase + t * (.9 + i*.14) * dir + i * (TAU / count);
    const orx = x + Math.cos(ang) * (major + i * 5);
    const ory = y + Math.sin(ang) * (minor + i * 2) + Math.sin(t * 2.1 + phase + i) * 2.2;
    const r = (type === HIDDEN_PLANET_TYPE ? 3.8 : 2.6) + i * .55;
    ctx.save();
    ctx.globalAlpha = .95;
    ctx.shadowColor = i === 0 ? '#ffffff' : d.color;
    ctx.shadowBlur = type === HIDDEN_PLANET_TYPE ? 10 : 6;
    const g = ctx.createRadialGradient(orx-r*.4, ory-r*.5, 0, orx, ory, r*1.8);
    g.addColorStop(0, 'rgba(255,255,255,.96)');
    g.addColorStop(.28, i === 0 ? 'rgba(241,245,249,.95)' : d.color);
    g.addColorStop(1, i === 0 ? 'rgba(71,85,105,.75)' : 'rgba(15,23,42,.86)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(orx, ory, r, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}


function drawTowerPedestalFx(tower, x, y, size){
  if(!isPlateAffinityMatched(tower)) return;
  const d = tower.def || { color:'#67e8f9', id:'unknown' };
  const t = performance.now() * 0.001;
  const tier = planetEvolutionTier ? planetEvolutionTier(tower.level || 1) : 0;
  const baseY = y + Math.max(17, size * 0.40);
  const rx = Math.max(26, size * 0.72 + tier * 3.8);
  const ry = Math.max(7.5, size * 0.22 + tier * 0.9);
  const pulse = 1 + Math.sin(t * 1.8 + tower.phase * 1.3) * 0.028;
  const accent = d.color || '#67e8f9';

  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(pulse, pulse);

  // soft underglow disk
  const floorGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, rx * 1.34);
  floorGlow.addColorStop(0, 'rgba(255,255,255,.16)');
  floorGlow.addColorStop(.18, accent);
  floorGlow.addColorStop(.55, 'rgba(15,23,42,.14)');
  floorGlow.addColorStop(1, 'rgba(15,23,42,0)');
  ctx.globalAlpha = .18 + tier * .03;
  ctx.fillStyle = floorGlow;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 1.26, ry * 2.55, 0, 0, TAU);
  ctx.fill();

  // subtle center pad
  const coreGlow = ctx.createRadialGradient(0, -1, 0, 0, 0, rx * .74);
  coreGlow.addColorStop(0, 'rgba(255,255,255,.36)');
  coreGlow.addColorStop(.25, accent);
  coreGlow.addColorStop(1, 'rgba(15,23,42,0)');
  ctx.globalAlpha = .24;
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * .78, ry * 1.22, 0, 0, TAU);
  ctx.fill();

  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';

  // multiple elegant oval rings
  const ringCount = 4;
  for(let i=0;i<ringCount;i++){
    const prog = i / (ringCount - 1 || 1);
    const rrX = rx * (0.74 + prog * 0.56);
    const rrY = ry * (0.84 + prog * 0.72);
    const alpha = 0.52 - prog * 0.11 + tier * 0.018;
    ctx.save();
    ctx.rotate(Math.sin(t * (.45 + i * .12) + tower.phase + i * .9) * .06 + (i % 2 ? .18 : -.12));
    ctx.globalAlpha = alpha;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8 + i * 2;
    ctx.lineWidth = Math.max(.95, 1.55 - i * .16 + tier * .06);
    ctx.strokeStyle = accent;
    ctx.beginPath();
    const start = .22 + i * .28;
    const span = TAU * (.76 - prog * .12);
    ctx.ellipse(0, 0, rrX, rrY, 0, start, start + span);
    ctx.stroke();
    ctx.restore();
  }

  // tiny segmented HUD marks for a premium sci-fi look
  ctx.globalAlpha = .48;
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,.46)';
  ctx.lineWidth = 1.1;
  for(let i=0;i<12;i++){
    const a = (TAU / 12) * i + t * .28;
    const ex = Math.cos(a) * rx * 1.03;
    const ey = Math.sin(a) * ry * 1.32;
    const ix = Math.cos(a) * rx * .91;
    const iy = Math.sin(a) * ry * 1.16;
    if(i % 2 === 0){
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }

  // front bright ring for crispness
  ctx.globalAlpha = .86;
  ctx.strokeStyle = 'rgba(255,255,255,.40)';
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * .94, ry * 1.06, 0, .1, TAU - .18);
  ctx.stroke();

  // matched plate: short vertical energy columns under the tower
  ctx.globalCompositeOperation = 'lighter';
  for(let i=0;i<5;i++){
    const a = t * 1.9 + tower.phase + i * TAU / 5;
    const px = Math.cos(a) * rx * .58;
    const py = Math.sin(a) * ry * .72;
    const h = (size * .28) * (0.70 + 0.30 * Math.sin(t * 3.1 + i));
    ctx.globalAlpha = .35;
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px * .72, py - h);
    ctx.stroke();
  }

  ctx.restore();
}

function drawProceduralPlanetBody(tower, x, y){
  const d = tower.def;
  ctx.save();
  ctx.shadowColor=d.color;ctx.shadowBlur=20;
  const g=ctx.createRadialGradient(x-8,y-8,4,x,y,25);
  g.addColorStop(0,'#fff');g.addColorStop(.35,d.color);g.addColorStop(1,'#020617');
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(x,y,23+tower.level*.7,0,TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.42)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.ellipse(x,y,34+tower.level,10,Math.sin(tower.phase)*.5,0,TAU);ctx.stroke();
  if(d.id==='void'){
    ctx.strokeStyle=d.color;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(x,y,13+Math.sin(performance.now()/220)*3,0,TAU);ctx.stroke();
  }
  ctx.restore();
}

function relocateInvalidPlanets(){
  const available = [];
  for(let i=0;i<grid.length;i++) if(!grid[i] && canBuild(i)) available.push(i);
  const sortByDistance = (origin) => available.sort((a,b)=>{
    const ca = center(a), cb = center(b), co = center(origin);
    return dist(ca.x,ca.y,co.x,co.y) - dist(cb.x,cb.y,co.x,co.y);
  });
  for(let i=0;i<grid.length;i++){
    const tower = grid[i];
    if(!tower || canBuild(i)) continue;
    sortByDistance(i);
    const next = available.shift();
    if(next == null) continue;
    grid[i] = null;
    tower.idx = next;
    grid[next] = tower;
    if(selected === i) selected = next;
    burst(center(next).x, center(next).y, tower.def.color, 14, 22);
  }
}

function updateAnomalies(dt){
  for(let i=anomalies.length-1;i>=0;i--){
    const a = anomalies[i];
    a.life -= dt;
    a.tick -= dt;
    if(a.target && !a.target.dead){
      a.x += (a.target.x - a.x) * .06 * dt;
      a.y += (a.target.y - a.y) * .06 * dt;
    }
    if(a.tick <= 0){
      a.tick = 3.5;
      for(const e of enemies){
        if(e.dead) continue;
        const d = dist(e.x,e.y,a.x,a.y);
        if(d < a.radius){
          const pull = (1 - d / a.radius) * a.pull;
          e.x += (a.x - e.x) * .05 * pull;
          e.y += (a.y - e.y) * .05 * pull;
          confineEnemyToRoute(e, e.stageBoss ? 22 : 16);
          e.slow = Math.max(e.slow, 45);
          e.mark = Math.max(e.mark, 70);
          e.damage(a.damage, 'void', a.color);
        }
      }
    }
    if(a.life <= 0) anomalies.splice(i,1);
  }
}

function drawAnomalies(){
  for(const a of anomalies){
    const age = (a.maxLife || 1) - a.life;
    const lifeRatio = clamp(a.life / (a.maxLife || 1), 0, 1);
    const isTactical = a.kind === 'tactical' || a.radius > 150;
    const pulse = 1 + Math.sin(age * .36) * (isTactical ? .05 : .085);
    const r = (a.visualRadius || (isTactical ? a.radius * .30 : Math.min(24, a.radius * .32))) * pulse;
    const rim = r * (isTactical ? 1.2 : 1.12);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(age * (isTactical ? .025 : .075));

    // 바깥쪽 렌즈 왜곡: 기존 큰 보라 원반보다 훨씬 얇게 보이도록 처리
    const lens = ctx.createRadialGradient(0, 0, 1, 0, 0, rim * 1.8);
    lens.addColorStop(0, 'rgba(2,6,23,.88)');
    lens.addColorStop(.22, 'rgba(15,23,42,.72)');
    lens.addColorStop(.44, 'rgba(88,28,135,.34)');
    lens.addColorStop(.72, 'rgba(192,132,252,.10)');
    lens.addColorStop(1, 'rgba(192,132,252,0)');
    ctx.globalAlpha = isTactical ? .94 : .88;
    ctx.fillStyle = lens;
    ctx.shadowColor = a.color || '#c084fc';
    ctx.shadowBlur = isTactical ? 26 : 15;
    ctx.beginPath();
    ctx.arc(0, 0, rim * 1.55, 0, TAU);
    ctx.fill();

    // 검은 중심부
    const core = ctx.createRadialGradient(-r*.22, -r*.2, 0, 0, 0, r);
    core.addColorStop(0, 'rgba(255,255,255,.55)');
    core.addColorStop(.10, 'rgba(124,58,237,.38)');
    core.addColorStop(.32, 'rgba(17,24,39,.98)');
    core.addColorStop(.70, 'rgba(2,6,23,.98)');
    core.addColorStop(1, 'rgba(2,6,23,.12)');
    ctx.globalAlpha = Math.max(.25, lifeRatio);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    // 고리/흡입선: 큰 원 대신 얇은 비대칭 타원으로 퀄리티 보강
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for(let j=0;j<4;j++){
      const k = 1 + j * .20;
      const alpha = (.39 - j * .055) * lifeRatio;
      ctx.rotate(.48 + j * .22 + age * .002);
      ctx.strokeStyle = `rgba(233,213,255,${alpha})`;
      ctx.lineWidth = Math.max(.85, (isTactical ? 1.65 : 1.18) - j*.08);
      ctx.beginPath();
      ctx.ellipse(0, 0, rim * k, rim * (.36 + j*.045), 0, .18, TAU * .92);
      ctx.stroke();
    }

    // 중심 흰색 림 포인트
    ctx.globalAlpha = .65 * lifeRatio;
    ctx.strokeStyle = 'rgba(255,255,255,.72)';
    ctx.lineWidth = isTactical ? 1.5 : 1.08;
    ctx.beginPath();
    ctx.arc(0, 0, r * .48, age * .03, age * .03 + TAU * .72);
    ctx.stroke();
    ctx.restore();
  }
}

class Planet{
  constructor(type,level,idx){
    this.type=type;this.level=level;this.idx=idx;this.cool=rand(0,20);this.phase=Math.random()*TAU;this.frozen=0;this.uid=nextPlanetUid++;this.aug=defaultAug();this.skillLevels={};syncTowerSkillUnlocks(this);
  }
  get def(){return PLANETS[this.type]}
  get pos(){return center(this.idx)}
  terrainBonus(){
    const t=terrain[this.idx];
    const b={dmg:.72,cd:1.16,range:-3,gold:0,over:false,plate:false};
    if(t==='amp'){b.dmg=1.55;b.cd=.96;b.range=0;b.plate=true}
    if(t==='coil'){b.dmg=1.02;b.cd=.62;b.range=4;b.plate=true}
    if(t==='lens'){b.dmg=.92;b.cd=.96;b.range=50;b.plate=true}
    if(t==='mine'){b.dmg=.82;b.cd=1.08;b.range=0;b.gold=1;b.plate=true}
    if(t==='rift'){b.dmg=1.82;b.cd=1.10;b.range=8;b.over=true;b.plate=true}
    return b;
  }
  stats(){
    const b=this.terrainBonus();
    const a=ensureAug(this);
    const g=getGlobalUpgradeStats();
    const ambient = getDustCloudPenalty(this.pos.x, this.pos.y);
    const affinityMatched = isPlateAffinityMatched(this);
    const plateDamage = b.plate ? g.plateDamage + (affinityMatched ? PLATE_AFFINITY_DAMAGE_BONUS : 0) : 0;
    const plateFireRate = b.plate ? g.plateFireRate + (affinityMatched ? PLATE_AFFINITY_FIRE_RATE_BONUS : 0) : 0;
    const globalCritExpected = g.critChance * Math.max(0, (1.8 + g.critMul) - 1);
    return {
      dmg:(this.def.dmg+this.level*15)*b.dmg*(1+a.damage+g.damage+plateDamage+globalCritExpected) * ambient.damageMul,
      range:Math.max(70,this.def.range+this.level*8+b.range+a.range+g.range),
      cd:Math.max(8,(this.def.cd-this.level*1.7)*b.cd*(1+S.globalCooldownPenalty) * ambient.cooldownMul/(1+a.fireRate+g.fireRate+plateFireRate+S.tacticalBoost)),
      gold:b.gold, over:b.over, plateMatched: affinityMatched,
      critChance:(this.def.critChance||0)+a.critChance+g.critChance,
      critMul:(this.def.critMul||1.8)+a.critMul+g.critMul,
      area:a.area, dot:a.dot, freeze:a.freeze, freezeChance:a.freezeChance,
      chain:a.chain, gravity:a.gravity, beamWidth:a.beamWidth, markAmp:a.markAmp,
      poisonSlow:a.poisonSlow, burstChance:a.burstChance,
      crystalCharge:a.crystalCharge, prismLink:a.prismLink, resonancePlate:a.resonancePlate,
      shieldDismantle:a.shieldDismantle, satelliteForge:a.satelliteForge, emergencyBarrier:a.emergencyBarrier,
      dustPenalty: ambient.alpha
    };
  }
  target(){
    const p=this.pos, st=this.stats();
    const list=enemies.filter(e=>!e.dead && dist(e.x,e.y,p.x,p.y)<=st.range);
    if(!list.length)return null;
    list.sort((a,b)=>b.progress-a.progress);
    return list[0];
  }
  update(dt){
    if(this.frozen>0){this.frozen-=dt;return;}
    this.cool-=dt;
    if(this.cool>0)return;
    const target=this.target();
    if(!target)return;
    const st=this.stats();
    this.cool=st.cd;
    if(st.over && Math.random()<.08){this.cool+=24;floatText(this.pos.x,this.pos.y-30,'과열','#fb7185')}
    if(this.def.kind==='beam') fireBeam(this,target,st);
    else if(this.def.kind==='gravity') blackholePulse(this,target,st);
    else bullets.push(new Bullet(this,target,st));
  }

  draw(){
    const p=this.pos,d=this.def;
    const frameIndex = currentPlanetFrameIndex();
    const tier = planetEvolutionTier(this.level);
    const baseSize = (IS_MOBILE_BOARD ? PLANET_BASE_SIZE + 2 : PLANET_BASE_SIZE) + this.level * 2.05 + tier * 1.45;
    const bobY = Math.sin(performance.now()/420 + this.phase * 1.7 + this.level * .42) * (1.6 + Math.min(3.2, this.level * .12));
    const bobX = Math.cos(performance.now()/620 + this.phase * .9) * .9;
    const rx = p.x + bobX, ry = p.y + bobY;
    const st = this.stats();
    ctx.save();
    ctx.globalAlpha = 1;
    drawTowerPedestalFx(this, rx, ry, baseSize);
    const coreGlow = ctx.createRadialGradient(rx - 4, ry - 6, 2, rx, ry, Math.max(18, baseSize * .56));
    coreGlow.addColorStop(0, 'rgba(255,255,255,.96)');
    coreGlow.addColorStop(.22, 'rgba(255,255,255,.88)');
    coreGlow.addColorStop(.55, d.color);
    coreGlow.addColorStop(1, 'rgba(2,6,23,.92)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath(); ctx.arc(rx, ry, Math.max(13, baseSize * .30), 0, TAU); ctx.fill();
    ctx.globalAlpha = .34;
    ctx.fillStyle = 'rgba(2,6,23,.52)';
    ctx.beginPath(); ctx.ellipse(rx, ry + 16 + tier * .45, 14 + this.level*.24, 4.8 + tier*.18, 0, 0, TAU); ctx.fill();
    if(tier >= 1){
      ctx.globalAlpha = .28 + tier * .06;
      const halo = ctx.createRadialGradient(rx, ry, 10, rx, ry, 34 + tier * 8 + this.level * .6);
      halo.addColorStop(0, 'rgba(255,255,255,.16)');
      halo.addColorStop(.45, d.color);
      halo.addColorStop(1, 'rgba(2,6,23,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(rx, ry, 26 + tier * 6, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    drawPlanetOrbitAsteroids(this.type, rx, ry, this.level, this.phase);
    const ok = drawPlanetSprite(this.type, rx, ry, baseSize, frameIndex, this.level);
    if(!ok) drawProceduralPlanetBody(this, rx, ry);
    drawPlanetEvolutionFx(this, rx, ry);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.4 + tier * .3;
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 18 + tier * 4;
    ctx.beginPath(); ctx.arc(rx, ry, Math.max(16, baseSize * .42), 0, TAU); ctx.stroke();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    ctx.strokeStyle='rgba(255,255,255,.55)';
    ctx.lineWidth=1.2;
    ctx.beginPath();ctx.ellipse(rx,ry,21+this.level*.42+tier*.7,6.2+tier*.16,0.18,0,TAU);ctx.stroke();
    if(st.dustPenalty > 0.02){
      ctx.globalAlpha = .22 + st.dustPenalty * .8;
      const mist = ctx.createRadialGradient(rx - 5, ry - 7, 1, rx, ry, 26 + tier * 4);
      mist.addColorStop(0, 'rgba(255,244,214,.35)');
      mist.addColorStop(.5, 'rgba(255,214,102,.16)');
      mist.addColorStop(1, 'rgba(255,214,102,0)');
      ctx.fillStyle = mist;
      ctx.beginPath(); ctx.arc(rx, ry, 28 + tier * 4, 0, TAU); ctx.fill();
      ctx.globalAlpha = .75;
      ctx.strokeStyle = 'rgba(253,230,138,.58)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(rx, ry, 21 + tier * 1.2, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if(this.frozen>0){
      ctx.globalAlpha=.72;ctx.strokeStyle='#bfdbfe';ctx.lineWidth=3;ctx.shadowColor='#93c5fd';ctx.shadowBlur=12;
      ctx.beginPath();ctx.arc(rx,ry,20+this.level*1.1,0,TAU);ctx.stroke();
      ctx.globalAlpha=1;ctx.shadowBlur=0;
    }
    if(d.id==='void'){
      ctx.globalAlpha = 1;
      ctx.strokeStyle='rgba(216,180,254,.78)';
      ctx.lineWidth=2.1;
      ctx.beginPath();ctx.arc(rx,ry,12+tier,0,TAU);ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if(d.id==='starengine'){
      ctx.globalAlpha = 1;
      ctx.strokeStyle='rgba(255,248,220,.88)';
      ctx.lineWidth=2.2;
      ctx.beginPath();ctx.ellipse(rx,ry,32+tier*2,10,.18,0,TAU);ctx.stroke();
      ctx.beginPath();ctx.ellipse(rx,ry,23+tier*2,22+tier*2,0,0,TAU);ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle='#fff';ctx.font='900 10px Orbitron';ctx.textAlign='center';
    ctx.fillText('Lv.'+this.level,rx,ry+26);
    if(tier >= 2){
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.font = '900 8px Orbitron';
      ctx.fillText(planetEvolutionName(this.level), rx, ry - 23 - tier * 2.2);
      ctx.globalAlpha = 1;
    }
    if(selected===this.idx){
      ctx.globalAlpha=.13;ctx.strokeStyle=d.color;ctx.lineWidth=1.8;
      ctx.beginPath();ctx.arc(rx,ry,st.range,0,TAU);ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

}

class Enemy{
  constructor(entry){
    const payload = (entry && typeof entry === 'object') ? entry : {type: entry};
    const type = payload.type || 'grunt';
    this.type=type;
    const baseMap = {
      grunt:{hp:1.62,spd:1.08,size:13,color:'#e2e8f0',reward:.50,exp:3},
      runner:{hp:1.05,spd:1.82,size:11,color:'#7dd3fc',reward:.50,exp:3},
      brute:{hp:4.10,spd:.84,size:18,color:'#fbbf24',reward:.90,exp:5,armor:.23},
      regen:{hp:2.65,spd:.98,size:15,color:'#22c55e',reward:.80,exp:5,regen:true},
      treasure:{hp:3.75,spd:1.00,size:18,color:'#facc15',reward:2.2,exp:8,treasure:true},
      boss:{hp:16,spd:.58,size:30,color:'#fb7185',reward:3.5,exp:18,armor:.18,boss:true},
      midboss:{hp:21,spd:.62,size:34,color:'#f8fafc',reward:5.0,exp:26,armor:.22,boss:true},
      finalboss:{hp:28,spd:.64,size:41,color:'#f8fafc',reward:8.0,exp:38,armor:.26,boss:true}
    };
    const m = {...baseMap[type]};
    const bossData = payload.bossData || null;
    if(bossData){
      this.stageBoss = true;
      this.bossTier = payload.bossTier || (type === 'finalboss' ? 'final' : 'mid');
      this.bossName = bossData.name;
      this.bossKo = bossData.ko;
      this.abilityName = bossData.ability;
      this.bossTitle = bossData.title;
      this.bossDesc = bossData.desc;
      this.auraColor = bossData.aura || bossData.color;
      m.color = bossData.color || m.color;
      m.size = bossData.size || m.size;
      m.spd *= bossData.speedMul || 1;
      m.reward *= bossData.rewardMul || 1;
      m.exp *= bossData.expMul || 1;
      m.armor = (m.armor || 0) + (bossData.armor || 0);
      this.hpScale = bossData.hpMul || 1;
      this.coreDamage = bossData.coreDamage || (type === 'finalboss' ? 5 : 2);
      this.bossEffect = bossData.effect;
      this.skillInterval = bossData.interval || 128;
      this.skillCd = this.skillInterval * .75;
    }
    Object.assign(this,m);
    this.x=route[0].x;this.y=route[0].y;this.seg=0;this.progress=0;
    const hpScale = this.hpScale || 1;
    const bossRunEase = this.stageBoss ? (this.bossTier === 'final' ? .72 : .80) : 1;
    this.maxHp=Math.floor(295*m.hp*(1+S.ogge*.30+S.theme*.38) * hpScale * bossRunEase);
    this.hp=this.maxHp;
    this.dead=false;this.slow=0;this.freeze=0;this.dot=0;this.dotTime=0;this.mark=0;
  }
  update(dt){
    if(this.dotTime>0){this.hp-=this.dot*dt;this.dotTime-=dt}
    if(this.regen)this.hp=Math.min(this.maxHp,this.hp+.18*dt*(1+S.ogge*.045));
    if(this.slow>0)this.slow-=dt;
    if(this.freeze>0)this.freeze-=dt;
    if(this.mark>0)this.mark-=dt;
    if(this.stageBoss){
      this.skillCd -= dt;
      if(this.skillCd <= 0){
        this.skillCd = this.skillInterval;
        triggerBossSkill(this);
      }
    }
    if(this.hp<=0){this.kill();return}
    let speed=this.spd*(1+S.ogge*.032+S.theme*.028);
    if(this.slow>0)speed*=.55;
    if(this.freeze>0)speed*=.12;
    const to=route[this.seg+1];
    if(!to){this.reachCore();return}
    const dx=to.x-this.x,dy=to.y-this.y;
    const step=speed*dt;
    if(Math.abs(dx) > 0.001 && Math.abs(dy) <= 0.001){
      const dir = Math.sign(dx);
      if(Math.abs(dx) <= step){ this.x = to.x; this.y = to.y; this.seg++; }
      else this.x += dir * step;
    }else if(Math.abs(dy) > 0.001 && Math.abs(dx) <= 0.001){
      const dir = Math.sign(dy);
      if(Math.abs(dy) <= step){ this.x = to.x; this.y = to.y; this.seg++; }
      else this.y += dir * step;
    }else{
      const d=Math.hypot(dx,dy);
      if(d <= step){ this.x = to.x; this.y = to.y; this.seg++; }
      else{ this.x += dx/d*step; this.y += dy/d*step; }
    }
    this.progress += step;
    confineEnemyToRoute(this, this.stageBoss ? 18 : 12);
  }
  damage(v,source,color){
    const g = getGlobalUpgradeStats();
    const armorValue = Math.max(0, (this.armor||0) + S.stageArmorBonus - (g.armorBreak||0));
    let final=v*(1-clamp(armorValue,0,.72));
    if(this.boss || this.stageBoss) final*=1+(g.bossDamage||0);
    if(this.mark>0) final*=1.22;
    this.hp-=final;
    if(final>18)floatText(this.x+rand(-5,5),this.y-this.size-rand(0,4),final,color||'#fff', Math.min(15, 10 + final * .05), 50);
  }
  kill(){
    if(this.dead)return;
    this.dead=true;
    S.runKills = (S.runKills || 0) + 1;
    const g = getGlobalUpgradeStats();
    const reward=Math.max(1,Math.floor((6+S.ogge*.9)*this.reward*(1+S.mods.reward+(g.reward||0))));
    S.gold+=reward;
    gainExp(this.exp);
    burst(this.x,this.y,this.color,22,38);
    registerKillCombo(this);
    if(this.treasure){
      triggerTreasureImpact(this);
      if(Math.random()<.55){
        const bonus=45+S.ogge*8;
        S.gold+=bonus;
        toast(`황금 보물성 파괴! 수정 +${fmt2(bonus)}`);
        impactLabel(this.x,this.y-this.size-34,`+${fmt2(bonus)} CRYSTAL`,'#fde68a',18,78);
        sound('treasure');
      }else{
        const shardBonus = Math.max(2, Math.floor(2 + S.ogge / 3));
        if(META){ META.shards += shardBonus; saveOfflineMeta(); renderOfflineMetaPanel(); }
        toast(`황금 보물성 파괴! 성흔 조각 +${fmt2(shardBonus)}`);
        impactLabel(this.x,this.y-this.size-34,`+${fmt2(shardBonus)} SHARD`,'#fde68a',18,78);
        sound('treasure');
      }
    }else{
      sound('kill');
    }
    updateUI();
  }
  reachCore(){
    this.dead=true;
    let coreHit = this.coreDamage || (this.boss?4:1);
    if(S.coreShield && S.coreShield > 0){
      const block = Math.min(S.coreShield, coreHit);
      S.coreShield -= block;
      coreHit -= block;
      impactLabel(CORE.x, CORE.y - 54, `SHIELD -${fmt2(block)}`, '#bfdbfe', 15, 66);
    }
    S.hp-=coreHit;
    S.leakedEnemies = (S.leakedEnemies || 0) + 1;
    S.coreDamageTaken = (S.coreDamageTaken || 0) + coreHit;
    shake=24;flash=.25;
    burst(CORE.x,CORE.y,'#fb7185',34,52);
    sound('hit');
    if(S.hp<=0){
      triggerGameOver('core');
      return;
    }
    updateUI();
  }
  draw(){
    let c=this.color;
    if(this.freeze>0)c='#bae6fd';
    else if(this.dotTime>0)c='#86efac';
    ctx.save();
    ctx.shadowColor=c;ctx.shadowBlur=this.boss?24:13;
    ctx.fillStyle=c;
    ctx.beginPath();
    if(this.boss){
      for(let i=0;i<9;i++){
        const a=i*TAU/9+performance.now()/1000;
        const r=this.size*(i%2?.72:1.08);
        const x=this.x+Math.cos(a)*r,y=this.y+Math.sin(a)*r;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.closePath();
    }else{
      ctx.arc(this.x,this.y,this.size,0,TAU);
    }
    ctx.fill();
    if(this.treasure){
      ctx.strokeStyle='#fde68a';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(this.x,this.y,this.size+6,0,TAU);ctx.stroke();
    }
    if(this.stageBoss){
      ctx.strokeStyle=this.auraColor || this.color;ctx.lineWidth=2.4;ctx.globalAlpha=.9;
      ctx.beginPath();ctx.arc(this.x,this.y,this.size+9+Math.sin(performance.now()/180)*2,0,TAU);ctx.stroke();
      ctx.globalAlpha=1;
    }
    const r=clamp(this.hp/this.maxHp,0,1);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(2,6,23,.9)';
    ctx.fillRect(this.x-20,this.y-this.size-14,40,5);
    ctx.fillStyle=r>.45?'#22c55e':'#fb7185';
    ctx.fillRect(this.x-20,this.y-this.size-14,40*r,5);
    if(this.mark>0){
      ctx.strokeStyle='#60a5fa';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(this.x,this.y,this.size+7,0,TAU);ctx.stroke();
    }
    if(this.stageBoss){
      ctx.fillStyle='#f8fafc';ctx.font='900 10px Orbitron';ctx.textAlign='center';
      ctx.fillText(this.bossKo || this.bossName, this.x, this.y - this.size - 22);
    }
    ctx.restore();
  }
}


function pushEnemyBack(enemy, amount){
  if(!enemy || enemy.dead || !Array.isArray(route) || route.length < 2) return false;
  let remaining = Math.max(0, amount || 0);
  while(remaining > 0 && enemy.seg >= 0){
    const start = route[enemy.seg] || route[0];
    const dx = enemy.x - start.x;
    const dy = enemy.y - start.y;
    const d = Math.hypot(dx, dy);
    if(d > remaining || enemy.seg <= 0){
      if(d > 0.001){
        enemy.x -= dx / d * remaining;
        enemy.y -= dy / d * remaining;
      }
      enemy.progress = Math.max(0, enemy.progress - remaining);
      break;
    }
    enemy.x = start.x;
    enemy.y = start.y;
    remaining -= d;
    enemy.seg -= 1;
    const prevEnd = route[enemy.seg + 1] || route[enemy.seg] || route[0];
    enemy.x = prevEnd.x;
    enemy.y = prevEnd.y;
  }
  confineEnemyToRoute(enemy, enemy.stageBoss ? 18 : 12);
  return true;
}




function nearestEnemyExcept(source, x, y, range){
  const list = enemies.filter(e => !e.dead && e !== source && dist(e.x,e.y,x,y) <= range);
  if(!list.length) return null;
  list.sort((a,b)=>b.progress-a.progress);
  return list[0];
}
function nearestBuildPlate(fromIdx, radius=2){
  const from = center(fromIdx);
  let best = null, bestD = 9999;
  for(let i=0;i<terrain.length;i++){
    if(i === fromIdx || !canBuild(i)) continue;
    const c = center(i);
    const d = dist(from.x, from.y, c.x, c.y);
    if(d < bestD && d <= CELL * radius){ best = {idx:i, x:c.x, y:c.y}; bestD = d; }
  }
  return best;
}
function triggerPrismLink(tower, target, st, baseDamage){
  const p = tower.pos;
  const plate = nearestBuildPlate(tower.idx, 2.4);
  const end = plate || {x:target.x, y:target.y};
  const life = 34 + st.prismLink * 22;
  beams.push({x1:p.x,y1:p.y,x2:end.x,y2:end.y,color:'#c084fc',life,style:'prism',width:3.2});
  const width = 18 + st.prismLink * 4;
  let hits = 0;
  for(const e of enemies){
    if(e.dead) continue;
    if(pointSeg(e.x,e.y,p.x,p.y,end.x,end.y) < width){
      e.damage(baseDamage * (.18 + st.prismLink * .055), 'prism_link', '#d8b4fe');
      e.mark = Math.max(e.mark, 34 + st.prismLink * 12);
      hits++;
    }
  }
  if(hits){
    impactLabel((p.x+end.x)/2, (p.y+end.y)/2 - 10, 'PRISM LINK', '#e9d5ff', 12, 52);
  }
}
function triggerResonancePlate(tower, st){
  if(!st.resonancePlate || Math.random() > clamp(.12 + st.resonancePlate, 0, .68)) return;
  const plate = nearestBuildPlate(tower.idx, 1.85);
  if(!plate) return;
  const bonusGold = Math.max(1, Math.floor(1 + st.resonancePlate * 3));
  S.gold += bonusGold;
  ring(plate.x, plate.y, CELL * .48, '#c084fc');
  impactLabel(plate.x, plate.y - 22, '공명 장판', '#e9d5ff', 12, 56);
}
function triggerMechaSatellite(tower, target, st, baseDamage){
  const chance = clamp(.10 + st.satelliteForge, 0, .72);
  if(Math.random() > chance) return;
  const p = tower.pos;
  const angle = performance.now() * .003 + tower.phase;
  const sx = p.x + Math.cos(angle) * 34;
  const sy = p.y + Math.sin(angle) * 22;
  const alt = nearestEnemyExcept(target, p.x, p.y, tower.stats().range + 52) || target;
  beams.push({x1:sx,y1:sy,x2:alt.x,y2:alt.y,color:'#60a5fa',life:18,style:'satellite',width:2.2});
  alt.damage(baseDamage * (.24 + st.satelliteForge * .24), 'satellite', '#93c5fd');
  burst(sx, sy, '#60a5fa', 7, 15);
}
function applyEmergencyBarrier(tower, target, st){
  if(!st.emergencyBarrier) return;
  if(dist(target.x,target.y,CORE.x,CORE.y) > 172) return;
  const add = Math.max(1, Math.floor(st.emergencyBarrier));
  S.coreShield = Math.min(12, (S.coreShield || 0) + add);
  ring(CORE.x, CORE.y, 42 + S.coreShield * 2, '#93c5fd');
  impactLabel(CORE.x, CORE.y - 42, `BARRIER +${fmt2(add)}`, '#bfdbfe', 13, 58);
  updateUI();
}

class Bullet{
  constructor(tower,target,st){
    const p=tower.pos;
    this.x=p.x;this.y=p.y;this.tower=tower;this.target=target;this.st=st;
    this.speed=18;this.dead=false;this.color=tower.def.color;this.kind=tower.def.id;this.rot=Math.random()*TAU;
  }
  update(dt){
    if(!this.target||this.target.dead){this.dead=true;return}
    const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy);
    if(d<this.speed*dt){this.hit();this.dead=true;return}
    this.x+=dx/d*this.speed*dt;this.y+=dy/d*this.speed*dt;this.rot += .16*dt;
    drawBulletTrail(this.kind,this.x,this.y,this.color);
  }
  hit(){
    const id=this.tower.def.id,dmg=this.st.dmg;
    if(id==='solar'){
      areaDamage(this.target.x,this.target.y,(58+this.tower.level*3)*(1+this.st.area),dmg,'solar',this.color);
      for(const e of enemies) if(dist(e.x,e.y,this.target.x,this.target.y)<70*(1+this.st.area)){e.dot=(1.4+this.tower.level*.2)*(1+this.st.dot);e.dotTime=120}
      if(signatureChance(this.tower,.10,.016)) triggerSolarNova(this.tower,this.target,this.st,dmg);
    }else if(id==='frost'){
      this.target.damage(dmg,'frost',this.color);this.target.slow=120*(1+this.st.freeze);
      if(Math.random()<.18+this.tower.level*.015+this.st.freezeChance)this.target.freeze=42*(1+this.st.freeze);
      if(this.target.freeze>0 && signatureChance(this.tower,.12,.014)) triggerFrostShatter(this.tower,this.target,this.st,dmg);
    }else if(id==='storm'){
      const chainCount = 2+Math.floor(this.tower.level/4)+Math.floor(this.st.chain);
      chain(this.target,dmg,chainCount,this.color,this.st.markAmp);
      if(signatureChance(this.tower,.11,.014)) triggerStormOverload(this.tower,this.target,this.st,dmg,chainCount);
    }else if(id==='toxic'){
      this.target.damage(dmg*.75,'toxic',this.color);
      this.target.dot+=(.9+this.tower.level*.16)*(1+this.st.dot);
      this.target.dotTime=190;
      if(this.st.poisonSlow>0)this.target.slow=Math.max(this.target.slow,60+this.st.poisonSlow*25);
      if(signatureChance(this.tower,.13,.013)) triggerSporeCloud(this.tower,this.target,this.st,dmg);
    }else if(id==='crystal'){
      const charge = this.tower.crystalCharge || 0;
      const release = Math.min(charge, dmg * (1.25 + this.st.crystalCharge));
      this.tower.crystalCharge = Math.max(0, charge - release);
      const before = this.target.hp;
      const finalDmg = dmg * .92 + release;
      this.target.damage(finalDmg, 'crystal', this.color);
      const over = Math.max(0, finalDmg - before);
      if(this.st.crystalCharge > 0 && over > 0){
        const cap = dmg * (1.1 + this.tower.level * .10 + this.st.crystalCharge * 2.2);
        this.tower.crystalCharge = Math.min(cap, (this.tower.crystalCharge || 0) + over * (.35 + this.st.crystalCharge));
        impactLabel(this.target.x, this.target.y - this.target.size - 20, '축전', '#e9d5ff', 12, 54);
      }
      if(this.st.prismLink > 0) triggerPrismLink(this.tower, this.target, this.st, dmg);
      triggerResonancePlate(this.tower, this.st);
      burst(this.target.x, this.target.y, '#c084fc', 12, 24);
    }else if(id==='mecha'){
      let finalDmg = dmg * .95;
      const armorBefore = this.target.armor || 0;
      if(this.st.shieldDismantle > 0 && armorBefore > 0){
        const dismantle = Math.min(armorBefore, .035 + this.st.shieldDismantle);
        this.target.armor = Math.max(0, armorBefore - dismantle);
        const gain = Math.max(1, Math.floor(dismantle * 36));
        S.gold += gain;
        finalDmg *= 1 + dismantle * 2.8;
        impactLabel(this.target.x, this.target.y - this.target.size - 20, `실드 해체 +${fmt2(gain)}`, '#bfdbfe', 12, 58);
      }
      this.target.damage(finalDmg, 'mecha', this.color);
      triggerMechaSatellite(this.tower, this.target, this.st, dmg);
      applyEmergencyBarrier(this.tower, this.target, this.st);
      burst(this.target.x, this.target.y, '#60a5fa', 10, 20);
    }else if(id==='smog'){
      const fieldRadius = (48 + this.tower.level * 2.8) * (1 + this.st.area);
      this.target.damage(dmg * .64, 'smog', this.color);
      let reversed = false;
      for(const e of enemies){
        if(e.dead || dist(e.x,e.y,this.target.x,this.target.y) > fieldRadius) continue;
        e.slow = Math.max(e.slow, 76 + this.st.poisonSlow * 28);
        e.mark = Math.max(e.mark, 86 + this.st.markAmp * 220);
        if(this.st.dot > 0){
          e.dot += (.34 + this.tower.level * .07) * (1 + this.st.dot);
          e.dotTime = Math.max(e.dotTime, 138 + this.st.dot * 60);
        }
        e.damage(dmg * (.13 + this.st.markAmp * .32), 'smog_field', this.color);
        const reverseChance = clamp(.045 + this.tower.level * .006 + this.st.burstChance, 0, .42);
        if(Math.random() < reverseChance){
          if(pushEnemyBack(e, 18 + this.tower.level * 2.6)){
            reversed = true;
            e.slow = Math.max(e.slow, 110);
          }
        }
      }
      ring(this.target.x, this.target.y, fieldRadius, 'rgba(217,249,157,.72)');
      spawnImpactMist(this.target.x, this.target.y, 'rgba(156,171,98,.30)', 10);
      if(reversed){
        impactLabel(this.target.x, this.target.y - this.target.size - 22, '역류', '#fde68a', 16, 70);
        shake = Math.max(shake, 5);
      }else if(signatureChance(this.tower,.11,.012)){
        impactLabel(this.target.x, this.target.y - this.target.size - 18, '정화 장막', '#d9f99d', 14, 62);
      }
    }else if(id==='starengine'){
      const critChance = clamp(this.st.critChance + this.tower.level * 0.04, 0, 0.96);
      const crit = Math.random() < critChance;
      const bossMul = this.target.stageBoss ? (this.tower.def.bossMul || 1.35) : 1;
      const finalDmg = (crit ? dmg * this.st.critMul : dmg) * bossMul;
      this.target.damage(finalDmg,'starengine',this.color);
      if(crit){
        floatText(this.target.x, this.target.y - this.target.size - 10, this.target.stageBoss ? '치명타' : '치명타', '#fef3c7');
        ring(this.target.x, this.target.y, 50 + this.tower.level * 3, '#f8fafc');
        this.target.mark = Math.max(this.target.mark, 150);
      }
      const explodeChance = clamp((this.tower.def.explodeChance || 0.1) + this.st.burstChance + this.tower.level * 0.015, 0, 0.72);
      if(Math.random() < explodeChance){
        const blast = dmg * (this.target.stageBoss ? 4.8 : 3.8);
        areaDamage(this.target.x, this.target.y, this.tower.def.explodeRadius || 126, blast, 'starengine_burst', '#fff8dc');
        burst(this.target.x, this.target.y, '#fff8dc', 56, 76);
        ring(this.target.x, this.target.y, this.tower.def.explodeRadius || 126, '#fff8dc');
        impactLabel(this.target.x, this.target.y - this.target.size - 24, this.target.stageBoss ? '보스 폭발' : '성흔 폭발', '#fff7cc', 20, 88);
        shake = Math.max(shake, 18);
        flash = Math.max(flash, .16);
      }
    }else{
      this.target.damage(dmg,id,this.color);
    }
    impactEffect(id,this.target.x,this.target.y,this.color,this.tower.level);
    playTowerSfx(id, id==='starengine' ? 1.08 : 1);
    sound('shot');
  }
  draw(){ drawProjectileVisual(this); }
}

function fireBeam(tower,target,st){
  const p=tower.pos,color=tower.def.color;
  const overcharge = signatureChance(tower,.10,.012);
  const width = 23 + tower.level * 1.1 + st.beamWidth + (overcharge ? 12 : 0);
  beams.push({x1:p.x,y1:p.y,x2:target.x,y2:target.y,color,life:overcharge?26:18,style:'laser',width:overcharge?6:4});
  for(const e of enemies){
    if(!e.dead && pointSeg(e.x,e.y,p.x,p.y,target.x,target.y)<width) e.damage(st.dmg*(overcharge?1.34:1),'laser',color);
  }
  burst(target.x,target.y,color,overcharge?22:10,overcharge?44:25);
  if(overcharge){
    impactLabel(target.x,target.y-target.size-18,'OVERCHARGE',color,18,78);
    ring(target.x,target.y,72,color);
    shake=Math.max(shake,6);
    flash=Math.max(flash,.06);
  }
  playTowerSfx('laser', overcharge ? 1.08 : 1);
  sound('beam');
}


function choosePlacedPlanets(count=1){
  const placed = grid.filter(Boolean);
  if(!placed.length) return [];
  const copy = [...placed];
  const picks = [];
  for(let i=0;i<count && copy.length;i++){
    const idx = Math.floor(Math.random()*copy.length);
    picks.push(copy.splice(idx,1)[0]);
  }
  return picks;
}

function triggerBossSkill(enemy){
  if(!enemy || !enemy.stageBoss) return;
  const labelColor = enemy.auraColor || enemy.color;
  const healPct = pct => {
    const gain = Math.floor(enemy.maxHp * pct);
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + gain);
    impactLabel(enemy.x, enemy.y - enemy.size - 40, `+${fmt2(gain)} HP`, '#bbf7d0', 14, 64);
  };
  switch(enemy.bossEffect){
    case 'phaseRegen':
      bossWarning(enemy,'위상 재생', labelColor);
      healPct(.06);
      enemy.spd *= 1.06;
      ring(enemy.x, enemy.y, enemy.size + 28, labelColor);
      spawnImpactSparks(enemy.x, enemy.y, labelColor, 8, 1.0);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '위상 재생', labelColor, 16, 74);
      break;
    case 'voidSurge':
      bossWarning(enemy,'특이점 폭주', labelColor);
      healPct(.09);
      enemy.armor = Math.min(.46, (enemy.armor || 0) + .012);
      burst(enemy.x, enemy.y, labelColor, 22, 42);
      ring(enemy.x, enemy.y, enemy.size + 34, labelColor);
      anomalies.push({x:enemy.x,y:enemy.y,target:null,kind:'bossSurge',radius:122,visualRadius:28,damage:0,pull:0,color:labelColor,life:18,maxLife:18,tick:999});
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '특이점 폭주', labelColor, 16, 80);
      break;
    case 'frostLock':
      bossWarning(enemy,'빙결 구속', labelColor);{
      const targets = choosePlacedPlanets(1);
      targets.forEach(t => t.frozen = Math.max(t.frozen, 70));
      burst(enemy.x, enemy.y, '#dbeafe', 18, 24); spawnImpactShards(enemy.x, enemy.y, '#dbeafe', 10);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '빙결 구속', '#dbeafe', 16, 76);
      break;
    }
    case 'blizzardPrison':
      bossWarning(enemy,'눈보라 감옥', labelColor);{
      const targets = choosePlacedPlanets(2);
      targets.forEach(t => t.frozen = Math.max(t.frozen, 96));
      burst(enemy.x, enemy.y, '#bfdbfe', 18, 24); spawnImpactShards(enemy.x, enemy.y, '#dbeafe', 14);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '눈보라 감옥', '#dbeafe', 16, 78);
      break;
    }
    case 'magmaShell':
      bossWarning(enemy,'용암 장갑', labelColor);
      enemy.armor = Math.min(.46, (enemy.armor || 0) + .018);
      enemy.spd *= 1.05;
      burst(enemy.x, enemy.y, '#fb923c', 18, 26); spawnImpactSparks(enemy.x, enemy.y, '#fdba74', 12, 1.15);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '용암 장갑', '#fdba74', 16, 76);
      break;
    case 'cataclysmBurst':
      bossWarning(enemy,'대폭발', labelColor);
      enemy.armor = Math.min(.48, (enemy.armor || 0) + .020);
      enemy.spd *= 1.08;
      ring(enemy.x, enemy.y, enemy.size + 42, '#fb923c');
      burst(enemy.x, enemy.y, '#fb923c', 24, 36);
      spawnImpactSparks(enemy.x, enemy.y, '#fdba74', 16, 1.28);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '대폭발', '#fdba74', 16, 80);
      break;
    case 'sporeBloom':
      bossWarning(enemy,'포자 증식', labelColor);
      for(const e of enemies){
        if(!e.dead && e !== enemy && dist(e.x,e.y,enemy.x,enemy.y) < 120){
          e.hp = Math.min(e.maxHp, e.hp + Math.floor(e.maxHp * .08));
          e.slow = Math.max(0, e.slow - 24);
        }
      }
      healPct(.05);
      ring(enemy.x, enemy.y, enemy.size + 34, '#4ade80'); spawnImpactMist(enemy.x, enemy.y, 'rgba(34,197,94,.24)', 7);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '포자 증식', '#bbf7d0', 16, 76);
      break;
    case 'overgrowth':
      bossWarning(enemy,'과성장', labelColor);
      for(const e of enemies){
        if(!e.dead && dist(e.x,e.y,enemy.x,enemy.y) < 150){
          e.hp = Math.min(e.maxHp, e.hp + Math.floor(e.maxHp * .10));
        }
      }
      healPct(.08);
      enemy.armor = Math.min(.47, (enemy.armor || 0) + .016);
      burst(enemy.x, enemy.y, '#4ade80', 22, 34); spawnImpactMist(enemy.x, enemy.y, 'rgba(34,197,94,.26)', 9);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '과성장', '#86efac', 16, 80);
      break;
    case 'sootScreen':
      bossWarning(enemy,'매연 차폐', labelColor);
      enemy.armor = Math.min(.46, (enemy.armor || 0) + .016);
      enemy.slow = Math.max(0, (enemy.slow || 0) - 18);
      ring(enemy.x, enemy.y, enemy.size + 38, '#a3a86a');
      spawnImpactMist(enemy.x, enemy.y, 'rgba(156,171,98,.26)', 9);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '매연 차폐', '#d9f99d', 16, 76);
      break;
    case 'industrialVeil':
      bossWarning(enemy,'산업 장막', labelColor);
      healPct(.06);
      enemy.armor = Math.min(.48, (enemy.armor || 0) + .018);
      for(const e of enemies){
        if(!e.dead && dist(e.x,e.y,enemy.x,enemy.y) < 170){
          e.armor = Math.min(.42, (e.armor || 0) + .010);
          e.slow = Math.max(0, (e.slow || 0) - 14);
        }
      }
      burst(enemy.x, enemy.y, '#a3a86a', 24, 40);
      spawnImpactMist(enemy.x, enemy.y, 'rgba(92,100,58,.32)', 12);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '산업 장막', '#d9f99d', 16, 80);
      break;
    case 'refractionVeil':
      bossWarning(enemy,'굴절 장막', labelColor);
      enemy.armor = Math.min(.48, (enemy.armor || 0) + .016);
      ring(enemy.x, enemy.y, enemy.size + 42, '#c084fc');
      spawnImpactShards(enemy.x, enemy.y, '#e9d5ff', 12);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '굴절 장막', '#e9d5ff', 16, 76);
      break;
    case 'crystalOverload':
      bossWarning(enemy,'수정 과부하', labelColor);
      healPct(.055);
      enemy.armor = Math.min(.49, (enemy.armor || 0) + .018);
      for(const e of enemies){
        if(!e.dead && dist(e.x,e.y,enemy.x,enemy.y) < 145) e.armor = Math.min(.44, (e.armor || 0) + .012);
      }
      ring(enemy.x, enemy.y, enemy.size + 48, '#a78bfa');
      spawnImpactShards(enemy.x, enemy.y, '#ddd6fe', 16);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '수정 과부하', '#e9d5ff', 16, 82);
      break;
    case 'fieldRepair':
      bossWarning(enemy,'전장 수리', labelColor);
      for(const e of enemies){
        if(!e.dead && dist(e.x,e.y,enemy.x,enemy.y) < 132){
          e.hp = Math.min(e.maxHp, e.hp + Math.floor(e.maxHp * .055));
          e.armor = Math.min(.42, (e.armor || 0) + .008);
        }
      }
      ring(enemy.x, enemy.y, enemy.size + 40, '#60a5fa');
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '전장 수리', '#bfdbfe', 16, 78);
      break;
    case 'coreReboot':
      bossWarning(enemy,'코어 재부팅', labelColor);
      healPct(.06);
      enemy.armor = Math.min(.50, (enemy.armor || 0) + .020);
      for(const e of enemies){
        if(!e.dead && dist(e.x,e.y,enemy.x,enemy.y) < 160) e.armor = Math.min(.44, (e.armor || 0) + .012);
      }
      burst(enemy.x, enemy.y, '#60a5fa', 24, 38);
      ring(enemy.x, enemy.y, enemy.size + 52, '#ef4444');
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '코어 재부팅', '#bfdbfe', 16, 84);
      break;
  }
  sound('boss', { intensity: enemy.bossTier === 'final' ? 1.2 : .95 });
  shake = Math.max(shake, enemy.bossTier === 'final' ? 7 : 4);
}

function blackholePulse(tower,target,st){
  const color=tower.def.color;
  const p = tower.pos;
  const hx = target.x;
  const hy = target.y;
  const dx = hx - p.x;
  const dy = hy - p.y;
  const distToTarget = Math.max(1, Math.hypot(dx,dy));
  // 발사 이펙트는 작고 얇게, 실제 블랙홀은 피격 지점에 생성한다.
  const muzzleDist = Math.min(18 + tower.level * .8, distToTarget * .28);
  const mx = p.x + dx / distToTarget * muzzleDist;
  const my = p.y + dy / distToTarget * muzzleDist;
  const gameRadius = (56 + tower.level * 3.2) * (1 + st.area * .70);
  anomalies.push({
    x: hx,
    y: hy,
    target,
    kind: 'towerHit',
    radius: gameRadius,
    visualRadius: Math.min(40, 24 + tower.level * 1.6 + st.area * 6.0),
    damage: st.dmg * .30 * (1 + st.gravity * .85),
    pull: .82 + st.gravity * .82,
    color,
    life: 21,
    maxLife: 21,
    tick: 0
  });
  beams.push({x1:p.x,y1:p.y,x2:mx,y2:my,color,life:9,style:'voidShot',width:1.15});
  ring(hx,hy,28 + tower.level * 1.8,color);
  burst(hx,hy,color,14,24);
  if(signatureChance(tower,.10,.012)) triggerVoidCollapse(tower,hx,hy,st);
  playTowerSfx('void', .82);
}

function areaDamage(x,y,r,dmg,source,color){
  for(const e of enemies) if(!e.dead && dist(e.x,e.y,x,y)<=r)e.damage(dmg,source,color);
  ring(x,y,r,color);
}
function chain(start,dmg,count,color,markAmp=0){
  let cur=start;
  const hit=new Set();
  for(let i=0;i<count;i++){
    if(!cur||hit.has(cur))break;
    hit.add(cur);cur.damage(dmg*(1-i*.16)*(1+markAmp),'storm',color);cur.slow=Math.max(cur.slow,25);
    let next=null,best=9999;
    for(const e of enemies){
      if(e.dead||hit.has(e))continue;
      const d=dist(e.x,e.y,cur.x,cur.y);
      if(d<115&&d<best){best=d;next=e}
    }
    if(next)beams.push({x1:cur.x,y1:cur.y,x2:next.x,y2:next.y,color,life:14,style:'chain'});
    cur=next;
  }
}
function gainExp(v){
  S.exp += v;
  let leveled = 0;
  while(S.exp >= S.nextExp){
    S.exp -= S.nextExp;
    S.level++;
    S.nextExp = Math.floor(S.nextExp * 1.24 + 24);
    leveled++;
  }
  if(leveled>0) log(`전투 레벨 ${fmt2(S.level)} 도달 — 전술 에너지 안정화`);
  updateUI();
}


function liveTowers(){
  return grid.map((t,idx)=>t?{t,idx}:null).filter(Boolean);
}
function rollSkillRarity(rare=false){
  const r = Math.random();
  if(rare) return r < .22 ? 'legendary' : 'epic';
  if(r < .055) return 'epic';
  if(r < .22) return 'rare';
  return 'common';
}
function rarityLabel(r){
  return ({common:'COMMON',rare:'RARE',epic:'EPIC',legendary:'LEGENDARY'})[r] || 'COMMON';
}
function rarityApplyCount(c){
  if(c.rarity === 'legendary') return 3;
  if(c.rarity === 'epic' || c.rarity === 'rare' || c.rare) return 2;
  return 1;
}
function makeGlobalUpgradeCandidate(rare=false, usedIds=new Set()){
  const pool = GLOBAL_UPGRADE_CATALOG.filter(u => !usedIds.has(u.id) && globalUpgradeLevel(u.id) < GLOBAL_UPGRADE_MAX_LEVEL);
  if(!pool.length) return null;
  const upgrade = pool[Math.floor(Math.random()*pool.length)];
  const current = globalUpgradeLevel(upgrade.id);
  const rarity = rollSkillRarity(rare);
  const rawStep = rarity === 'legendary' ? 3 : (rarity === 'epic' || rarity === 'rare' || rare ? 2 : 1);
  const step = Math.max(1, Math.min(rawStep, GLOBAL_UPGRADE_MAX_LEVEL - current));
  return {
    upgrade,
    key:upgrade.id,
    currentLevel:current,
    nextLevel:current + step,
    rare,
    rarity,
    color:upgrade.color || '#67e8f9'
  };
}
function applyGlobalUpgradeCandidate(c){
  if(!c || !c.upgrade) return false;
  const levels = ensureGlobalUpgrades();
  const prev = Math.max(0, Number(levels[c.upgrade.id] || 0));
  const count = Math.max(1, Math.min(GLOBAL_UPGRADE_MAX_LEVEL - prev, Number(c.nextLevel || prev + rarityApplyCount(c)) - prev));
  if(count <= 0) return false;
  levels[c.upgrade.id] = prev + count;
  const color = c.upgrade.color || '#67e8f9';
  for(const t of grid){
    if(!t) continue;
    const p = t.pos;
    burst(p.x,p.y,color,12 + count*5,22 + count*5);
  }
  ring(CORE.x, CORE.y, 72 + count*8, color);
  impactLabel(CORE.x, CORE.y - 58, `${rarityLabel(c.rarity)} GLOBAL`, color, 16 + count, 82);
  shake = Math.max(shake, 4 + count*2);
  return true;
}
function applyUnitSkillCandidate(c){
  return applyGlobalUpgradeCandidate(c);
}
function openSkillChoice(rare){
  // RELEASE CLEANUP: 전투 중 랜덤/일반 스킬 선택 모달은 최종 UX에서 제거되었습니다.
  // 일반 스킬은 성역 지도에서만 관리하고, 전투 화면에서는 전역 효과 한 줄만 표시합니다.
  if(S){
    S.skillModalOpen = false;
    S.skillQueue = 0;
    S.paused = false;
  }
  return false;
}

function updateTacticalCooldowns(dt){
  for(const k of Object.keys(S.tacticalCd||{})) S.tacticalCd[k]=Math.max(0,S.tacticalCd[k]-dt);
  if(S.tacticalBoost>0) S.tacticalBoost=Math.max(0,S.tacticalBoost-.004*dt);
}
function canUseTactical(type,cost){
  if(S.exp<cost){toast('EXP가 부족합니다');return false}
  if((S.tacticalCd?.[type]||0)>0){toast('전술판 재충전 중입니다');return false}
  S.exp-=cost;
  S.tacticalCd[type]=Math.floor((TACTICAL_COOLDOWN_MAX[type]||700) * (S.offline?.cooldownScale || 1));
  return true;
}
function useSkill(type){
  if(type==='blackhole'){
    if(!canUseTactical('blackhole',70))return;
    const target=enemies.length?enemies.slice().sort((a,b)=>b.progress-a.progress)[0]:{x:W/2,y:H/2};
    const x=target.x,y=target.y,r=230;
    anomalies.push({x,y,target:null,kind:'tactical',radius:210,damage:28,pull:2.1,color:'#c084fc',life:130,maxLife:130,tick:0});
    for(const e of enemies){
      const d=dist(e.x,e.y,x,y);
      if(d<r){
        e.x+=(x-e.x)*.36;e.y+=(y-e.y)*.36;
        confineEnemyToRoute(e, e.stageBoss ? 24 : 18);
        e.slow=210;e.mark=240;e.damage(180,'skill','#c084fc');
      }
    }
    ring(x,y,r,'#c084fc');shake=24;toast('균열 포획 — 선두 적군을 강제 구속');sound('blackhole');
  }
  if(type==='nova'){
    if(!canUseTactical('nova',75))return;
    const targets=enemies.slice().sort((a,b)=>b.progress-a.progress).slice(0,5);
    if(!targets.length){toast('포격 대상이 없습니다');S.exp+=75;S.tacticalCd.nova=0;return}
    targets.forEach((e,i)=>{
      setTimeout(()=>{
        areaDamage(e.x,e.y,86,230+S.ogge*12,'orbital','#fb923c');
        burst(e.x,e.y,'#fb923c',30,46);
        ring(e.x,e.y,92,'#f97316');
      },i*90);
    });
    flash=.22;shake=28;toast('궤도 포격 — 위험 목표 연속 타격');sound('nova');
  }
  if(type==='repair'){
    if(!canUseTactical('repair',65))return;
    S.hp=Math.min(S.maxHp,S.hp+3);
    S.tacticalBoost=Math.max(S.tacticalBoost,.28);
    grid.forEach(t=>{ if(t){ const p=t.pos; burst(p.x,p.y,t.def.color,10,22); } });
    burst(CORE.x,CORE.y,'#22c55e',34,52);
    toast('코어 과충전 — 소량 수리 + 행성 공격속도 일시 증가');sound('level');
  }
  updateUI();
}

function summon(typeOverride=null){
  if(S.gameOver) return;
  const pool = availableSummonTypes();
  const preferred = Number(typeOverride);
  const type = pool.includes(preferred) ? preferred : pool[Math.floor(Math.random()*pool.length)];
  const cost = currentSummonCost();
  if(S.gold<cost)return toast('수정이 부족합니다');
  const free=[];
  for(let i=0;i<grid.length;i++) if(!grid[i]&&canBuild(i)) free.push(i);
  if(!free.length)return toast('배치 가능한 장판이 없습니다');
  const idx=free[Math.floor(Math.random()*free.length)];
  grid[idx]=new Planet(type,1,idx);
  S.runSummons = (S.runSummons || 0) + 1;
  S.gold-=cost;selected=idx;
  burst(center(idx).x,center(idx).y,PLANETS[type].color,24,42);
  toast(`랜덤 소환 — ${PLANETS[type].name} 착지 완료`);
  sound('summon');
  updateSelected();updateUI();
}
const MERGE_TERRAIN_PRIORITY = {
  rift:60, amp:52, coil:46, lens:42, mine:34, empty:20, blocked:-100, path:-100
};
let mergeFocusSession = null;
function mergeAnchorScore(idx, tower){
  if(!tower) return -Infinity;
  const selectedBonus = idx === selected ? 120 : 0;
  const terrainBonus = MERGE_TERRAIN_PRIORITY[terrain[idx] || 'empty'] ?? 20;
  return tower.level * 1000 + selectedBonus + terrainBonus;
}
function canEventuallyFeedAnchor(anchorIdx){
  const anchor = grid[anchorIdx];
  if(!anchor || anchor.level >= 12) return false;
  const counts = Array(13).fill(0);
  for(let i=0;i<grid.length;i++){
    const t = grid[i];
    if(!t || i === anchorIdx || t.type !== anchor.type || t.level >= 12) continue;
    counts[t.level]++;
  }
  if(counts[anchor.level] > 0) return true;
  for(let lv=1; lv<anchor.level; lv++){
    const carry = Math.floor(counts[lv] / 2);
    if(carry > 0) counts[lv+1] += carry;
  }
  return counts[anchor.level] > 0;
}
function chooseMergeFocusAnchor(){
  let bestAnchor = null;
  for(let i=0;i<grid.length;i++){
    const t = grid[i];
    if(!t || t.level >= 12) continue;
    if(!canEventuallyFeedAnchor(i)) continue;
    const score = t.level * 100000 + mergeAnchorScore(i,t);
    if(!bestAnchor || score > bestAnchor.score) bestAnchor = {anchor:i, type:t.type, score};
  }
  if(bestAnchor) return bestAnchor;

  const pair = findBestMergePair();
  if(!pair) return null;
  const t = grid[pair.anchor];
  return t ? {anchor:pair.anchor, type:t.type, score:pair.pairScore || 0} : null;
}
function findBestMergePair(typeFilter=null, maxLevel=Infinity, excludeIdx=-1, preferIdx=-1){
  let best = null;
  for(let i=0;i<grid.length;i++){
    const a=grid[i]; if(!a || i===excludeIdx) continue;
    if(typeFilter !== null && a.type !== typeFilter) continue;
    for(let j=i+1;j<grid.length;j++){
      const b=grid[j]; if(!b || j===excludeIdx) continue;
      if(a.type!==b.type || a.level!==b.level || a.level>=12 || a.level>maxLevel) continue;

      const scoreI = mergeAnchorScore(i,a);
      const scoreJ = mergeAnchorScore(j,b);
      let anchor = scoreJ > scoreI ? j : i;
      if(preferIdx === i || preferIdx === j) anchor = preferIdx;
      const consume = anchor === i ? j : i;
      const anchorScore = Math.max(scoreI, scoreJ);
      const selectedPairBonus = (i === selected || j === selected) ? 80 : 0;
      const focusBonus = (preferIdx === i || preferIdx === j) ? 1000000 : 0;
      const pairScore = focusBonus + a.level * 10000 + selectedPairBonus + anchorScore;

      if(!best || pairScore > best.pairScore){
        best = {anchor, consume, pairScore, level:a.level, type:a.type};
      }
    }
  }
  return best;
}
function findFocusedMergeStep(){
  if(!mergeFocusSession) return null;
  const anchorIdx = mergeFocusSession.anchor;
  const anchor = grid[anchorIdx];
  if(!anchor || anchor.type !== mergeFocusSession.type || anchor.level >= 12) return null;

  let consume = -1;
  let bestScore = -Infinity;
  for(let i=0;i<grid.length;i++){
    const t = grid[i];
    if(!t || i === anchorIdx) continue;
    if(t.type !== anchor.type || t.level !== anchor.level) continue;
    const score = mergeAnchorScore(i,t);
    if(score > bestScore){ bestScore = score; consume = i; }
  }
  if(consume >= 0) return {anchor:anchorIdx, consume, type:anchor.type, level:anchor.level};

  // No tower can merge into the focus yet. Build the highest same-type feeder first,
  // then keep feeding the result into the original highest-level anchor.
  return findBestMergePair(anchor.type, anchor.level - 1, anchorIdx, -1);
}
let mergeAutoRunId = 0;
function autoMerge(continueSession=false, runId=null){
  // onclick handlers pass a MouseEvent as the first argument. Treat only the
  // internal recursive call `autoMerge(true, runId)` as a continuation; every
  // user click must start a fresh merge focus session.
  continueSession = continueSession === true;
  if(S.gameOver) return;

  if(!continueSession){
    mergeAutoRunId++;
    runId = mergeAutoRunId;
    mergeFocusSession = chooseMergeFocusAnchor();
    if(!mergeFocusSession){
      toast('병합 가능한 행성이 없습니다');
      return;
    }
  }else if(runId !== mergeAutoRunId){
    return;
  }

  let pair = findFocusedMergeStep();

  // 기존에는 최초 기준 타워 쪽으로 몇 번 합친 뒤 그 기준 타워에 더 이상
  // 먹일 수 없으면 자동 병합이 끝나버렸다. 이제는 그 시점마다 남은 보드를
  // 다시 검사해서, 병합 가능한 다음 최고 레벨 기준점을 잡고 계속 진행한다.
  // 그래서 버튼 한 번으로 현재 가능한 병합이 끝까지 이어진다.
  while(!pair){
    mergeFocusSession = chooseMergeFocusAnchor();
    if(!mergeFocusSession){
      if(!continueSession) toast('병합 가능한 행성이 없습니다');
      return;
    }
    pair = findFocusedMergeStep();
    if(!pair){
      mergeFocusSession = null;
      if(!continueSession) toast('병합 가능한 행성이 없습니다');
      return;
    }
  }

  const a = grid[pair.anchor];
  const b = grid[pair.consume];
  if(!a || !b){ mergeFocusSession = null; return; }

  grid[pair.anchor] = createMergedPlanet(a,b,pair.anchor);
  grid[pair.consume] = null;
  selected = mergeFocusSession?.anchor ?? pair.anchor;
  triggerMergeImpact(pair.anchor,a.def.color,a.level+1);
  S.runMerges = (S.runMerges || 0) + 1;
  updateSelected();updateUI();
  setTimeout(()=>autoMerge(true, runId),80);
}


function tryCreateHiddenPlanet(){
  if(grid.some(t => t && t.type === HIDDEN_PLANET_TYPE)) return false;
  const recipe = [];
  for(let type=0; type<BASE_PLANET_COUNT; type++) {
    const idx = grid.findIndex(t => t && t.type === type && t.level >= 5);
    if(idx < 0) return false;
    recipe.push(idx);
  }
  const avg = recipe.reduce((acc, idx) => { const c = center(idx); acc.x += c.x; acc.y += c.y; return acc; }, {x:0,y:0});
  avg.x /= recipe.length; avg.y /= recipe.length;
  let anchor = recipe[0], best = Infinity;
  recipe.forEach(idx => { const c = center(idx); const d = dist(c.x,c.y,avg.x,avg.y); if(d < best){ best = d; anchor = idx; } });
  recipe.forEach(idx => { if(idx !== anchor) grid[idx] = null; });
  grid[anchor] = new Planet(HIDDEN_PLANET_TYPE, 1, anchor);
  S.hiddenUnlocked = true;
  selected = anchor;
  const c = center(anchor);
  burst(c.x,c.y,'#f8fafc',44,56);
  ring(c.x,c.y,92,'#f8fafc');
  toast('히든 행성 각성 — 스타 엔진이 출현했습니다');
  log('히든 행성 해금: 모든 기본 행성 Lv.5 융합 성공 / 스타 엔진 활성화');
  sound('merge');
  renderHangar();
  updateSelected();
  updateUI();
  return true;
}

function spawn(entry){
  const enemy = new Enemy(entry);
  enemies.push(enemy);
  if(enemy.stageBoss){
    impactLabel(enemy.x + 56, enemy.y - 26, enemy.bossTier === 'final' ? 'FINAL BOSS' : 'MID BOSS', enemy.auraColor || enemy.color, 16, 120);
    toast(`${enemy.bossKo || enemy.bossName} 출현`, 'important');
    log(`보스 출현: ${enemy.bossKo || enemy.bossName} / ${bossSkillKo(enemy.abilityName)}`);
    shake = Math.max(shake, 7);
  }
  S.spawned++;
}

function triggerStageFx(reason){
  const th = theme();
  const kind = ['cosmic','ice','lava','jungle','smog','crystal','machine'][S.theme] || 'cosmic';
  S.stageFx = {kind, life:150, maxLife:150, reason};
  const label=$('stageFxLabel');
  if(label){
    const names={cosmic:'AURORA SHIFT', ice:'FROST BLIZZARD', lava:'SOLAR FLARE', jungle:'BIO SPORE FIELD', smog:'SMOG VEIL', crystal:'PRISM RESONANCE', machine:'코어 재부팅'};
    label.textContent=names[kind] || 'STAGE EFFECT';
    label.style.opacity=1;
    setTimeout(()=>{ if(label) label.style.opacity=0; }, 1400);
  }

  if(kind==='ice'){
    const towers=grid.filter(Boolean);
    const freezeCount=Math.min(3, Math.max(1, Math.ceil(towers.length*.22)));
    for(let i=0;i<freezeCount;i++){
      const t=towers[Math.floor(Math.random()*towers.length)];
      if(t) t.frozen=Math.max(t.frozen||0, 130+S.ogge*5);
    }
    toast('눈보라 발생 — 일부 행성이 잠시 빙결됩니다');
    log('스테이지 효과: 눈보라 / 일부 행성 공격 정지');
  }else if(kind==='lava'){
    S.stageArmorBonus=.18;
    setTimeout(()=>{ if(S) S.stageArmorBonus=0; }, 5200);
    toast('태양 플레어 — 적 방어력이 잠시 상승합니다');
    log('스테이지 효과: 플레어 / 적 방어력 상승');
  }else if(kind==='jungle'){
    S.globalCooldownPenalty=.28;
    setTimeout(()=>{ if(S) S.globalCooldownPenalty=0; }, 5600);
    toast('생체 포자장 — 행성 공격속도가 잠시 느려집니다');
    log('스테이지 효과: 포자장 / 공격속도 감소');
  }else{
    for(const e of enemies){ if(!e.dead) e.mark=Math.max(e.mark,90); }
    toast('오로라 균열 — 전장 전체가 흔들립니다');
    log('스테이지 효과: 오로라 균열');
  }
}

function updateStageHazards(dt){
  if(S.stageFx){
    S.stageFx.life-=dt;
    if(S.stageFx.life<=0) S.stageFx=null;
  }
  S.hazardTimer-=dt;
  if(S.hazardTimer<=0){
    S.hazardTimer=620+rand(0,260);
    triggerStageFx('hazard');
  }
}

function drawStageFx(){
  if(!S.stageFx) return;
  const fx = S.stageFx;
  const img = STAGE_FX_IMAGES[S.theme];
  const lifeRatio = fx.life / fx.maxLife;
  const fade = lifeRatio > .5 ? (1-lifeRatio)*2 : lifeRatio*2;
  ctx.save();
  ctx.globalAlpha = clamp(fade*.34,0,.34);
  if(img && img.complete && img.naturalWidth){
    ctx.drawImage(img,0,0,W,H);
  }else{
    ctx.fillStyle = theme().color;
    ctx.fillRect(0,0,W,H);
  }
  ctx.restore();
}

function waveDone(){
  S.active=false;
  const bonus=150+S.ogge*24+S.theme*55;
  S.gold+=bonus;
  S.hp=Math.min(S.maxHp,S.hp+S.mods.repair);
  toast(`웨이브 클리어! 수정 +${fmt2(bonus)}`);
  log(`웨이브 클리어 보상: 수정 ${fmt2(bonus)}`);
  recordOfflineWaveProgress();

  if(S.ogge >= 10){
    log(`성역 ${S.stageNo || StageMapState.current || 1} 클리어 — 유닛 초기화 및 다음 항로 개방`);
    completeStageFromBattle();
    return;
  }

  S.ogge++;
  prepareWave();
}

function drawBackground(raw=1){
  const th=theme();
  drawCoverImage(STAGE_BGS[S.theme]);

  // 배경 이미지가 너무 선명하면 유닛/경로 가독성이 떨어져서, 얇은 우주 안개 레이어를 얹습니다.
  ctx.fillStyle='rgba(2,6,23,.28)';
  ctx.fillRect(0,0,W,H);

  // 게임판 내부 전용 별 레이어. 실제 캔버스 안에서 움직이므로 스크린샷처럼 검게 비는 문제가 없습니다.
  updateAndDrawFieldStars(raw);

  const g=ctx.createRadialGradient(W/2,H+120,40,W/2,H+120,380);
  g.addColorStop(0,th.color);
  g.addColorStop(.45,'rgba(56,189,248,.08)');
  g.addColorStop(1,'transparent');
  ctx.globalAlpha=.26;
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.arc(W/2,H+120,380,0,TAU);
  ctx.fill();
  ctx.globalAlpha=1;
}
function drawRouteChevron(x, y, angle, size, color, alpha=.48){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-size * .62, -size * .42);
  ctx.lineTo(size * .14, 0);
  ctx.lineTo(-size * .62, size * .42);
  ctx.stroke();
  ctx.globalAlpha = alpha * .30;
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.lineWidth = 1.05;
  ctx.beginPath();
  ctx.moveTo(-size * .48, -size * .30);
  ctx.lineTo(size * .04, 0);
  ctx.lineTo(-size * .48, size * .30);
  ctx.stroke();
  ctx.restore();
}

function traceRoutePath(){
  ctx.beginPath();
  ctx.moveTo(route[0].x, route[0].y);
  for(let i=1;i<route.length;i++) ctx.lineTo(route[i].x, route[i].y);
}

function lineCross(ax, ay, bx, by){ return ax * by - ay * bx; }

function offsetRoutePoints(offset){
  const pts = route || [];
  if(pts.length < 2) return pts.slice();

  function unit(a, b){
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }
  function normal(d){ return { x: -d.y, y: d.x }; }
  function addNormal(p, n){ return { x: p.x + n.x * offset, y: p.y + n.y * offset }; }
  function intersect(p1, d1, p2, d2){
    const denom = lineCross(d1.x, d1.y, d2.x, d2.y);
    if(Math.abs(denom) < 0.0001) return null;
    const qx = p2.x - p1.x, qy = p2.y - p1.y;
    const t = lineCross(qx, qy, d2.x, d2.y) / denom;
    return { x: p1.x + d1.x * t, y: p1.y + d1.y * t };
  }

  const out = [];
  for(let i=0;i<pts.length;i++){
    const p = pts[i];
    if(i === 0){
      const d = unit(pts[0], pts[1]);
      out.push(addNormal(p, normal(d)));
      continue;
    }
    if(i === pts.length - 1){
      const d = unit(pts[i-1], pts[i]);
      out.push(addNormal(p, normal(d)));
      continue;
    }

    const dPrev = unit(pts[i-1], p);
    const dNext = unit(p, pts[i+1]);
    const nPrev = normal(dPrev);
    const nNext = normal(dNext);
    const pPrev = addNormal(p, nPrev);
    const pNext = addNormal(p, nNext);
    let m = intersect(pPrev, dPrev, pNext, dNext);

    // Guard against long miters on tiny/mobile layouts. A clean bevel is better than
    // the old overlapped rail caps at ninety-degree corners.
    if(!m || Math.hypot(m.x - p.x, m.y - p.y) > Math.abs(offset) * 2.35){
      const ax = nPrev.x + nNext.x;
      const ay = nPrev.y + nNext.y;
      const alen = Math.hypot(ax, ay) || 1;
      m = { x: p.x + (ax / alen) * Math.abs(offset) * 1.12 * Math.sign(offset || 1),
            y: p.y + (ay / alen) * Math.abs(offset) * 1.12 * Math.sign(offset || 1) };
    }
    out.push(m);
  }
  return out;
}

function drawPolyline(points){
  if(!points || points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x, points[i].y);
}

function drawRouteRail(offset, width, stroke, alpha=.8, blur=8){
  const pts = offsetRoutePoints(offset);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.shadowColor = stroke;
  ctx.shadowBlur = blur;
  ctx.lineWidth = width;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 2.8;
  drawPolyline(pts);
  ctx.stroke();
  ctx.restore();
}

function drawRouteSegmentMarkers(){
  const tNow = performance.now();
  const pulse = .44 + Math.sin(tNow / 520) * .12;
  for(let i=0;i<route.length-1;i++){
    const a = route[i], b = route[i+1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx);
    const count = Math.max(1, Math.floor(len / 82));
    for(let j=1;j<=count;j++){
      const t = (j / (count + 1) + (tNow % 2100) / 2100 * .06) % 1;
      const x = a.x + dx * t;
      const y = a.y + dy * t;
      drawRouteChevron(x, y, angle, 13.5, '#c9fbff', pulse);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .30;
    ctx.fillStyle = '#67e8f9';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawRoute(){
  ctx.save();
  ctx.lineCap='round';ctx.lineJoin='round';
  const color = theme().color || '#22d3ee';
  const glowWidth = Math.max(22, CELL*.34);
  const glassWidth = Math.max(13, CELL*.205);
  const railOffset = Math.max(9, CELL*.155);

  // premium HUD glow: no more heavy black road fill.
  ctx.globalCompositeOperation = 'screen';
  ctx.shadowColor = 'rgba(34,211,238,.46)';
  ctx.shadowBlur = 24;
  ctx.strokeStyle = 'rgba(34,211,238,.075)';
  ctx.lineWidth = glowWidth;
  traceRoutePath();
  ctx.stroke();

  // very light transparent glass body so the board remains visible under the route.
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  const glass = ctx.createLinearGradient(0,0,W,H);
  glass.addColorStop(0,'rgba(8,145,178,.042)');
  glass.addColorStop(.45,'rgba(56,189,248,.068)');
  glass.addColorStop(1,'rgba(168,85,247,.035)');
  ctx.strokeStyle = glass;
  ctx.lineWidth = glassWidth;
  traceRoutePath();
  ctx.stroke();

  // twin neon rails matching the reference: mostly line + arrow, not a filled road.
  ctx.globalCompositeOperation = 'lighter';
  drawRouteRail( railOffset, 2.6, 'rgba(103,232,249,.82)', .86, 13);
  drawRouteRail(-railOffset, 2.6, 'rgba(103,232,249,.82)', .86, 13);
  drawRouteRail( railOffset*.62, 1.0, 'rgba(255,255,255,.70)', .42, 6);
  drawRouteRail(-railOffset*.62, 1.0, 'rgba(255,255,255,.70)', .42, 6);

  // animated dotted center guide.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .32;
  ctx.strokeStyle = 'rgba(207,250,254,.78)';
  ctx.lineWidth = 1.25;
  ctx.setLineDash([3, 18]);
  ctx.lineDashOffset = -performance.now() / 42;
  traceRoutePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // subtle corner nodes. Small circular dots keep turns clean instead of creating
  // boxy artifacts on the neon rail corners.
  ctx.globalCompositeOperation = 'lighter';
  for(let i=1;i<route.length-1;i++){
    const p = route[i];
    ctx.save();
    ctx.globalAlpha = .28;
    ctx.fillStyle = '#9ff8ff';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.35, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawRouteSegmentMarkers();
  ctx.restore();
}

function drawTerrain(){
  ctx.save();
  const dragType = dragging ? (Number.isFinite(dragging.dragPreviewType) ? dragging.dragPreviewType : dragging.type) : null;
  const dragLevel = dragging ? Math.max(1, Number(dragging.dragPreviewLevel ?? dragging.level ?? 1)) : 1;
  const dragActive = !!dragging;
  for(let i=0;i<terrain.length;i++){
    const c=center(i), key=terrain[i], t=TERRAIN[key];
    const plateColor = getPlateColor(i, key);
    const x = c.x-CELL/2+3, y = c.y-CELL/2+3, w = CELL-6, h = CELL-6;
    ctx.fillStyle=plateColor;
    ctx.fillRect(x,y,w,h);
    if(terrain[i]==='path'){
      const grad = ctx.createLinearGradient(c.x-CELL/2+3, c.y, c.x+CELL/2-3, c.y);
      grad.addColorStop(0, 'rgba(255,255,255,.01)');
      grad.addColorStop(.5, 'rgba(255,255,255,.024)');
      grad.addColorStop(1, 'rgba(255,255,255,.01)');
      ctx.fillStyle = grad;
      ctx.fillRect(c.x-CELL/2+6,c.y-CELL/2+6,CELL-12,CELL-12);
    }
    ctx.strokeStyle='rgba(255,255,255,.04)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x,y,w,h);

    if(dragActive){
      const occupied = !!grid[i];
      const buildable = canBuild(i) && !occupied;
      const mergeable = !!(occupied && grid[i] && grid[i].type === dragType && grid[i].level === dragLevel && grid[i].level < 12);
      let overlayFill = 'rgba(125,211,252,.05)';
      let overlayStroke = 'rgba(125,211,252,.20)';
      let overlayWidth = 1.15;
      if(mergeable){
        overlayFill = 'rgba(250,204,21,.12)';
        overlayStroke = 'rgba(250,204,21,.42)';
        overlayWidth = 1.5;
      }else if(!buildable){
        overlayFill = 'rgba(248,113,113,.12)';
        overlayStroke = 'rgba(248,113,113,.28)';
      }else{
        overlayFill = 'rgba(56,189,248,.09)';
        overlayStroke = 'rgba(103,232,249,.30)';
      }
      ctx.save();
      ctx.fillStyle = overlayFill;
      ctx.fillRect(x+1, y+1, w-2, h-2);
      ctx.strokeStyle = overlayStroke;
      ctx.lineWidth = overlayWidth;
      ctx.strokeRect(x+1.5, y+1.5, w-3, h-3);
      ctx.restore();
    }

    if(key!=='empty'&&key!=='path'){
      ctx.fillStyle=key==='blocked'?'#475569':(getPlateAffinity(i)?.color || theme().color);
      ctx.font='900 22px Orbitron';ctx.textAlign='center';ctx.textBaseline='middle';
      const s={blocked:'×',amp:'▲',coil:'»',lens:'◇',mine:'◆',rift:'!'}[key];
      ctx.fillText(s,c.x,c.y);
      if(isSpecialPlateKey(key)){
        ctx.font='900 12px Orbitron';
        ctx.fillStyle='rgba(255,255,255,.96)';
        const label = plateAffinityName(i).slice(0,4).toUpperCase();
        if(label) ctx.fillText(label, c.x, c.y + CELL * .33);
      }
    }
  }
  const idx = dragActive ? idxAt(mouse.x, mouse.y) : hoverIdx;
  if(idx>=0){
    const c=center(idx);
    const tower = grid[idx];
    const buildable = canBuild(idx) && !tower;
    const mergeable = !!(dragActive && tower && tower.type === dragType && tower.level === dragLevel && tower.level < 12);
    let stroke = buildable ? 'rgba(56,189,248,.92)' : 'rgba(251,113,133,.90)';
    let fill = buildable ? 'rgba(34,211,238,.16)' : 'rgba(248,113,113,.18)';
    if(mergeable){
      stroke = 'rgba(250,204,21,.96)';
      fill = 'rgba(250,204,21,.18)';
    }
    ctx.save();
    ctx.fillStyle = fill;
    ctx.fillRect(c.x-CELL/2+2, c.y-CELL/2+2, CELL-4, CELL-4);
    ctx.strokeStyle=stroke;
    ctx.shadowColor=stroke;
    ctx.shadowBlur=dragActive ? 14 : 8;
    ctx.lineWidth=dragActive ? 2.6 : 2;
    ctx.strokeRect(c.x-CELL/2+2,c.y-CELL/2+2,CELL-4,CELL-4);
    if(dragActive){
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6,4]);
      ctx.strokeRect(c.x-CELL/2+6,c.y-CELL/2+6,CELL-12,CELL-12);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
  ctx.restore();
}
function drawCore(){
  ctx.save();
  ctx.translate(CORE.x,CORE.y);
  ctx.shadowColor=theme().color;ctx.shadowBlur=24;
  ctx.strokeStyle=theme().color;ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(0,0,38,0,TAU);ctx.stroke();
  ctx.beginPath();
  for(let i=0;i<6;i++){
    const a=-Math.PI/2+i*TAU/6+performance.now()/2400;
    const x=Math.cos(a)*34,y=Math.sin(a)*34;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.arc(0,0,24,0,TAU);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='900 10px Orbitron';ctx.textAlign='center';ctx.fillText('CORE',0,4);
  ctx.restore();
}
function drawParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.life-=dt;
    if(p.life<=0){particles.splice(i,1);continue}
    ctx.save();
    if(p.ring){
      p.r+=(p.max-p.r)*.12+dt*.4;
      ctx.globalAlpha=clamp(p.life/(p.maxLife||26),0,1);
      ctx.strokeStyle=p.color;ctx.lineWidth=1.7;ctx.shadowColor=p.color;ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.stroke();
    }else{
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy*=.98;
      p.rot = (p.rot || 0) + (p.spin || 0) * dt;
      ctx.globalAlpha=clamp(p.life/(p.maxLife||40),0,1);
      ctx.fillStyle=p.color;ctx.strokeStyle=p.color;ctx.shadowColor=p.glow || p.color;ctx.shadowBlur=p.blur || 8;
      if(p.type==='spark'){
        ctx.translate(p.x,p.y);ctx.rotate(p.rot || 0);
        const len = p.len || 8;
        ctx.lineCap='round';ctx.lineWidth=p.w || 1.6;
        ctx.beginPath();ctx.moveTo(-len*.55,0);ctx.lineTo(len*.55,0);ctx.stroke();
      }else if(p.type==='shard'){
        ctx.translate(p.x,p.y);ctx.rotate(p.rot || 0);
        const len = p.len || 8, wide = p.w || 3.4;
        ctx.beginPath();
        ctx.moveTo(0,-len*.62);ctx.lineTo(wide,0);ctx.lineTo(0,len*.62);ctx.lineTo(-wide,0);ctx.closePath();
        ctx.fill();
      }else if(p.type==='smoke'){
        const rr = p.r * (1 + (1 - clamp(p.life/(p.maxLife||30),0,1)) * .65);
        ctx.globalAlpha *= .62;
        const g = ctx.createRadialGradient(p.x - rr*.25, p.y - rr*.25, 1, p.x, p.y, rr);
        g.addColorStop(0, p.core || 'rgba(255,255,255,.30)');
        g.addColorStop(.55, p.color);
        g.addColorStop(1, 'rgba(15,23,42,0)');
        ctx.fillStyle = g;
        ctx.beginPath();ctx.arc(p.x,p.y,rr,0,TAU);ctx.fill();
      }else{
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();
      }
    }
    ctx.restore();
  }
}

function drawBeams(dt){
  for(let i=beams.length-1;i>=0;i--){
    const b=beams[i];b.life-=dt;
    if(b.life<=0){beams.splice(i,1);continue}
    ctx.save();
    const alpha = clamp(b.life/18,0,1);
    if(b.style==='laser'){
      const beamWidth = b.width || 4;
      ctx.globalAlpha=alpha;
      ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(1.8,beamWidth*.38);ctx.shadowColor=b.color;ctx.shadowBlur=20 + beamWidth*1.6;
      ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
      ctx.strokeStyle=b.color;ctx.lineWidth=beamWidth+1;ctx.globalAlpha=alpha*.72;
      ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
    }else if(b.style==='chain'){
      drawElectricArc(b.x1, b.y1, b.x2, b.y2, { amplitude: 12, segments: 10, alpha, glow: b.color, main: '#fefce8', outerWidth: 4.2, innerWidth: 2.0, blur: 22 });
      ctx.save();
      ctx.globalAlpha = alpha * .8;
      ctx.fillStyle = '#fefce8';
      ctx.shadowColor = b.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(b.x2, b.y2, 2.4, 0, TAU); ctx.fill();
      ctx.restore();
    }else if(b.style==='voidShot'){
      ctx.globalAlpha=alpha*.88;
      ctx.strokeStyle='rgba(255,255,255,.76)';ctx.lineWidth=Math.max(1.1,b.width||1.2);ctx.shadowColor=b.color;ctx.shadowBlur=11;
      ctx.setLineDash([2,5]);
      ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha=alpha*.76;
      ctx.strokeStyle=b.color;ctx.lineWidth=Math.max(1.5,(b.width||1)*1.8);
      ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.96)';ctx.shadowBlur=12;
      ctx.beginPath();ctx.arc(b.x2,b.y2,2.1,0,TAU);ctx.fill();
    }else{
      ctx.globalAlpha=alpha;
      ctx.strokeStyle=b.color;ctx.lineWidth=b.style==='void'?3.4:4;ctx.shadowColor=b.color;ctx.shadowBlur=18;
      ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
    }
    ctx.restore();
  }
}

function drawFloats(dt){
  for(let i=floats.length-1;i>=0;i--){
    const f=floats[i];f.life-=dt;f.y+=f.vy*dt;
    if(f.life<=0){floats.splice(i,1);continue}
    const maxLife = f.maxLife || 70;
    const alpha = clamp(f.life/maxLife,0,1);
    const size = f.size || 12;
    ctx.save();ctx.globalAlpha=alpha;
    ctx.fillStyle=f.color;ctx.strokeStyle='rgba(0,0,0,.72)';ctx.lineWidth=Math.max(2.2, size*.18);
    ctx.shadowColor='rgba(0,0,0,.18)';ctx.shadowBlur=4;
    ctx.font=`900 ${size}px Orbitron`;ctx.textAlign='center';
    ctx.strokeText(f.text,f.x,f.y);ctx.fillText(f.text,f.x,f.y);
    ctx.restore();
  }
}
function drawDragging(){
  if(!dragging)return;
  ctx.save();
  ctx.globalAlpha=.84;
  const previewLevel = Math.max(1, Number(dragging.dragPreviewLevel ?? dragging.level ?? 1));
  const previewType = Number.isFinite(dragging.dragPreviewType) ? dragging.dragPreviewType : dragging.type;
  const ok = drawPlanetSprite(previewType, mouse.x, mouse.y, (IS_MOBILE_BOARD ? 46 : 39) + previewLevel*1.65, currentPlanetFrameIndex(), previewLevel);
  if(!ok) drawProceduralPlanetBody({...dragging, type:previewType, level:previewLevel}, mouse.x, mouse.y);
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(mouse.x,mouse.y,36,11,0,0,TAU);ctx.stroke();
  ctx.restore();
}

function loop(now){
  raf=requestAnimationFrame(loop);
  const raw=clamp((now-last)/16.666,0,3);last=now;
  const dt=S.paused?0:raw*S.speed;
  if(S && S.hp <= 0 && !S.gameOver) triggerGameOver('core');
  if(S && S.gameOver && !$('gameOverOverlay') && !S.gameOverOverlayRequested){
    S.gameOverOverlayRequested = true;
    setTimeout(() => showGameOverOverlay(S.lastGameOverSummary || {stageNo:S.stageNo,wave:S.ogge,kills:S.runKills||0,bestCombo:S.combo?.best||0,shardsGained:0}), 0);
  }

  if(!Array.isArray(route) || route.length < 2){
    try { makeRoute(); makeTerrain(); }
    catch(err) { console.error('battle field route recovery failed', err); }
  }

  ctx.save();
  if(shake>0){ctx.translate(rand(-shake,shake),rand(-shake,shake));shake*=.88;if(shake<.3)shake=0}
  ctx.clearRect(0,0,W,H);

  drawBackground(raw);drawStageFx();drawDustClouds();drawRoute();drawTerrain();drawCore();

  if(dt>0 && S.hp>0){
    spawnTimer-=dt;
    const interval=Math.max(18,54-S.ogge*1.8-S.theme*3);
    if(S.active&&S.queue.length&&spawnTimer<=0){spawn(S.queue.shift());spawnTimer=interval}
    grid.forEach(t=>t&&t.update(dt));
    tryCreateHiddenPlanet();
    bullets.forEach(b=>b.update(dt));bullets=bullets.filter(b=>!b.dead);
    enemies.forEach(e=>e.update(dt));enemies=enemies.filter(e=>!e.dead);
    updateAnomalies(dt);
    updateDustClouds(dt);
    updateStageHazards(dt);
    updateTacticalCooldowns(dt);
    updateComboTimers(dt);
    updateBossTelegraphs(dt);
    if(S.active&&S.queue.length===0&&enemies.length===0)waveDone();
  }

  updateHangarVisuals();
  drawAnomalies();
  grid.forEach(t=>t&&t.draw());
  enemies.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
  drawBossTelegraphs();
  bullets.forEach(b=>b.draw());
  drawBeams(raw);drawParticles(raw);drawFloats(raw);drawDragging();

  if(flash>0){ctx.globalAlpha=flash;ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);flash=Math.max(0,flash-.035*raw);ctx.globalAlpha=1}
  if(S.paused && !S.gameOver){
    ctx.globalAlpha=.16;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.font='900 32px Orbitron';ctx.textAlign='center';
    ctx.fillText('PAUSED',W/2,90);
  }
  if(S.gameOver){
    ctx.globalAlpha=.28;ctx.fillStyle='#020617';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;ctx.textAlign='center';
    ctx.fillStyle='#fecaca';ctx.font='900 30px Orbitron';ctx.fillText('CORE COLLAPSE',W/2,82);
    ctx.fillStyle='#e5e7eb';ctx.font='800 14px Pretendard';ctx.fillText('전투 종료 — 결과 창을 확인하세요',W/2,112);
    if(!$('gameOverOverlay') && !S.gameOverOverlayRequested){
      S.gameOverOverlayRequested = true;
      setTimeout(() => showGameOverOverlay(S.lastGameOverSummary || {stageNo:S.stageNo,wave:S.ogge,kills:S.runKills||0,bestCombo:S.combo?.best||0,shardsGained:0}), 0);
    }
  }
  ctx.restore();
}

function updateUI(){
  const currentStageDef = getStageDef(S.stageNo || StageMapState.current || (S.theme + 1));
  $('themeName').textContent=currentStageDef.ko || currentStageDef.name || theme().ko || theme().name;
  $('themeName').title=`${currentStageDef.stage}. ${currentStageDef.name} / ${currentStageDef.ko}`;
  $('stageLabel').textContent=`${currentStageDef.stage}‑${S.ogge}`;
  const stageType = $('stageType');
  const waveLabel = getStageBattleDescription(S.stageNo || StageMapState.current || 1, S.ogge);
  if(stageType){
    stageType.textContent = waveLabel;
    stageType.title = getStageBattleFullDescription(currentStageDef.stage, S.ogge);
  }
  renderWavePreview();
  $('gold').textContent=fmt2(S.gold);
  $('hp').textContent=S.coreShield ? `${fmt2(S.hp)}+${fmt2(S.coreShield)}` : fmt2(S.hp);
  $('exp').textContent=`${fmt2(S.exp)}/${fmt2(S.nextExp)}`;
  const expBar=$('expBar'); if(expBar) expBar.style.width=clamp(S.exp/S.nextExp*100,0,100)+'%';
  $('level').textContent=fmt2(S.level);
  $('waveBar').style.width=S.total?Math.floor(S.spawned/S.total*100)+'%':'0%';
  $('speedBtn').textContent=`${fmt2(S.speed)}x`;
  $('pauseBtn').textContent='정지';
  $('summonBtn').textContent='소환';
  const globalLine = $('globalEffectLine');
  if(globalLine) globalLine.innerHTML = `<b>전역</b>${escapeHtml(globalSkillSummaryText())}`;
  renderOfflineMetaPanel();
  updateHangarState();
}

function updateSelected(){
  const box=$('selectedText');
  if(!box) return;
  if(selected<0){
    box.innerHTML=`장판을 선택하면 배치 가능 여부와 행성 정보만 표시됩니다.<br><span class="compactHint">일반 스킬은 성역 지도에서 관리됩니다.</span>`;
    updateHangarState();
    return;
  }
  const t=grid[selected], tr=TERRAIN[terrain[selected]];
  if(!t){
    box.innerHTML=`<b>선택 장판</b> ${tr.name}<br><span class="compactHint">${canBuild(selected)?'배치 가능':'배치 불가'} · ${tr.desc}</span>`;
    updateHangarState();
    return;
  }
  const st=t.stats();
  const critText = t.def.id==='starengine' ? ` · 치명 ${fmtPct2(st.critChance + t.level*0.03)}` : '';
  box.innerHTML=`<div class="selectedCompactHead">
      <div class="planetThumb liveThumb" data-type="${t.type}" data-level="${t.level}"></div>
      <div>
        <div class="towerName" style="color:${t.def.color}">${t.def.name} Lv.${fmt2(t.level)}</div>
        <div class="compactHint">${t.def.card} · ${planetEvolutionName(t.level)}</div>
      </div>
    </div>
    <div class="selectedCompactStats">공격 ${fmt2(st.dmg)} · 사거리 ${fmt2(st.range)}${critText}<br>장판 ${tr.name}${st.plateMatched ? ' · 공명 +30%' : ''} · ${escapeHtml(towerSkillCompactText(t))}</div>`;
  updateHangarVisuals(true);
  updateHangarState();
}
function log(t){
  const box=$('log');
  if(!box) return;
  const line=document.createElement('div');
  line.textContent='• '+t;box.prepend(line);
  while(box.children.length>6)box.lastChild.remove();
}
let lastToastAt = 0;
let lastToastText = '';
function compactNoticeText(t){
  let text = String(t || '').trim();
  if(!text) return '';
  text = text.replace(/—/g, '·');
  Object.entries(BOSS_SKILL_KO || {}).forEach(([en, ko]) => { text = text.replaceAll(en, ko); });
  text = text.replace(/FINAL BOSS/g, '최종 보스').replace(/MID BOSS/g, '중간 보스');
  text = text.replace(/HP/g, '체력');
  return text.length > 34 ? `${text.slice(0, 33)}…` : text;
}
function toast(t, priority='normal'){
  const layer = $('toastLayer');
  if(!layer) return;
  const now = performance.now();
  const text = compactNoticeText(t);
  if(!text) return;
  if(priority !== 'important' && (now - lastToastAt < 950 || text === lastToastText)) return;
  lastToastAt = now;
  lastToastText = text;
  while(layer.firstChild) layer.firstChild.remove();
  const div=document.createElement('div');
  div.className='toast';
  div.textContent=text;
  layer.appendChild(div);
  setTimeout(()=>div.remove(),2200);
}
function floatText(x,y,text,color,size=12,life=54){floats.push({x,y,text:(typeof text === 'number' ? fmt2(text) : String(text)),color,life,maxLife:life,vy:-.52,size})}
function burst(x,y,color,count,force){
  for(let i=0;i<count;i++){
    const a=Math.random()*TAU,s=rand(.5,force/22);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:rand(1.5,3.0),life:rand(16,38),maxLife:38,color});
  }
}
function ring(x,y,r,color){particles.push({x,y,r:2,max:r,color,life:26,maxLife:26,ring:true})}

function impactLabel(x,y,text,color='#fff',size=18,life=76){
  floats.push({x,y,text:(typeof text === 'number' ? fmt2(text) : String(text)),color,life:Math.round(life*.86),maxLife:Math.round(life*.86),vy:-.48,size:Math.round(size*.92)});
}
function signatureChance(tower,base=.10,perLevel=.012){
  return Math.random() < Math.min(.38, base + tower.level * perLevel);
}
function updateComboTimers(dt){
  if(!S.combo) S.combo={kills:0,timer:0,best:0};
  if(!S.mergeCombo) S.mergeCombo={count:0,timer:0};
  if(S.combo.timer>0){
    S.combo.timer-=dt;
    if(S.combo.timer<=0) S.combo.kills=0;
  }
  if(S.mergeCombo.timer>0){
    S.mergeCombo.timer-=dt;
    if(S.mergeCombo.timer<=0) S.mergeCombo.count=0;
  }
}
function registerKillCombo(enemy){
  if(!S.combo) S.combo={kills:0,timer:0,best:0};
  S.combo.kills = (S.combo.timer>0 ? S.combo.kills : 0) + 1;
  S.combo.timer = 120;
  S.combo.best = Math.max(S.combo.best||0, S.combo.kills);
  if(S.combo.kills >= 3){
    const color = S.combo.kills >= 12 ? '#fde68a' : S.combo.kills >= 7 ? '#d8b4fe' : '#7dd3fc';
    impactLabel(enemy.x, enemy.y-enemy.size-18, `KILL x${fmt2(S.combo.kills)}`, color, Math.min(21, 13 + S.combo.kills*.55), 62);
    if(S.combo.kills % 5 === 0){
      const bonus = Math.min(38, 5 + Math.floor(S.combo.kills * 1.35));
      S.gold += bonus;
      impactLabel(enemy.x, enemy.y-enemy.size-34, `COMBO +${fmt2(bonus)}`, '#facc15', 13, 62);
      log(`킬 콤보 보너스: x${fmt2(S.combo.kills)} / 수정 +${fmt2(bonus)}`);
    }
  }
}
function triggerMergeImpact(idx,color,level){
  if(!S.mergeCombo) S.mergeCombo={count:0,timer:0};
  S.mergeCombo.count = (S.mergeCombo.timer>0 ? S.mergeCombo.count : 0) + 1;
  S.mergeCombo.timer = 165;
  const p = center(idx);
  burst(p.x,p.y,color,20 + S.mergeCombo.count*5,30 + S.mergeCombo.count*3);
  ring(p.x,p.y,42 + level*3 + S.mergeCombo.count*3,color);
  ring(p.x,p.y,20 + S.mergeCombo.count*3,'#ffffff');
  impactLabel(p.x,p.y-38,S.mergeCombo.count>=2?`MERGE x${fmt2(S.mergeCombo.count)}`:'MERGE',color,16+Math.min(5,S.mergeCombo.count*1.4),66);
  if(S.mergeCombo.count>=3){
    const bonus=Math.min(60,8*S.mergeCombo.count);
    S.gold+=bonus;
    impactLabel(p.x,p.y-56,`+${fmt2(bonus)} CRYSTAL`,'#fde68a',13,62);
    log(`병합 콤보: x${fmt2(S.mergeCombo.count)} / 수정 +${fmt2(bonus)}`);
  }
  shake=Math.max(shake,6 + Math.min(10,S.mergeCombo.count*2));
  flash=Math.max(flash,.055);
  sound('merge');
}
function triggerTreasureImpact(enemy){
  burst(enemy.x,enemy.y,'#facc15',30,42);
  ring(enemy.x,enemy.y,62,'#fde68a');
  impactLabel(enemy.x,enemy.y-enemy.size-18,'TREASURE','#fde68a',17,68);
  shake=Math.max(shake,9);
  flash=Math.max(flash,.08);
}
function triggerSolarNova(tower,target,st,dmg){
  const r=(76+tower.level*4)*(1+st.area);
  areaDamage(target.x,target.y,r,dmg*.55,'solar_nova','#fb923c');
  burst(target.x,target.y,'#fb923c',9,18);
  spawnImpactSparks(target.x,target.y,'#fdba74',10,1.15);
  impactLabel(target.x,target.y-target.size-16,'NOVA SPLASH','#fed7aa',15,62);
  shake=Math.max(shake,6);
}
function triggerFrostShatter(tower,target,st,dmg){
  areaDamage(target.x,target.y,42+tower.level*2.0,dmg*.42,'frost_shatter','#bfdbfe');
  burst(target.x,target.y,'#bfdbfe',7,12); spawnImpactShards(target.x,target.y,'#dbeafe',9);
  impactLabel(target.x,target.y-target.size-16,'SHATTER','#dbeafe',14,60);
  flash=Math.max(flash,.045);
}
function triggerStormOverload(tower,target,st,dmg,chainCount){
  chain(target,dmg*.52,Math.max(2,Math.floor(chainCount*.7)),tower.def.color,st.markAmp);
  ring(target.x,target.y,34+tower.level*1.0,tower.def.color);
  spawnImpactSparks(target.x,target.y,'#fde047',11,1.1);
  impactLabel(target.x,target.y-target.size-16,'OVERLOAD','#fde047',14,60);
  shake=Math.max(shake,5);
}
function triggerSporeCloud(tower,target,st,dmg){
  const r=68+tower.level*1.6;
  for(const e of enemies){
    if(e.dead) continue;
    if(dist(e.x,e.y,target.x,target.y)<r){
      e.dot += (.42+tower.level*.06)*(1+st.dot);
      e.dotTime = Math.max(e.dotTime,155);
      e.slow = Math.max(e.slow,35);
    }
  }
  ring(target.x,target.y,r*.68,'#86efac');
  burst(target.x,target.y,'#22c55e',6,12); spawnImpactMist(target.x,target.y,'rgba(34,197,94,.22)',7);
  impactLabel(target.x,target.y-target.size-16,'SPORE CLOUD','#bbf7d0',14,60);
}
function triggerVoidCollapse(tower,x,y,st){
  const r=58+tower.level*2.2;
  areaDamage(x,y,r,st.dmg*.48,'void_collapse',tower.def.color);
  burst(x,y,tower.def.color,18,34);
  ring(x,y,r,tower.def.color);
  impactLabel(x,y-18,'COLLAPSE','#d8b4fe',14,62);
  shake=Math.max(shake,8);
}

function pos(e){
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;

  // Pointer calibration for the battle canvas.
  // In the current battle UI the canvas is rendered with object-fit:fill, so
  // client coordinates must map directly to the full canvas rect.  Preserve
  // aspect only when CSS explicitly uses contain/scale-down; otherwise the
  // hover focus drifts farther away from center on the vertical axis.
  const cw = Number(canvas.width) || W || 748;
  const ch = Number(canvas.height) || H || 708;
  const canvasAspect = cw / Math.max(1, ch);
  const rectAspect = r.width / Math.max(1, r.height);

  let contentLeft = r.left;
  let contentTop = r.top;
  let contentWidth = r.width;
  let contentHeight = r.height;

  const objectFit = getComputedStyle(canvas).objectFit;
  const shouldPreserveAspect = objectFit === 'contain' || objectFit === 'scale-down';

  if (shouldPreserveAspect) {
    if (rectAspect > canvasAspect) {
      contentHeight = r.height;
      contentWidth = contentHeight * canvasAspect;
      contentLeft = r.left + (r.width - contentWidth) / 2;
    } else {
      contentWidth = r.width;
      contentHeight = contentWidth / canvasAspect;
      contentTop = r.top + (r.height - contentHeight) / 2;
    }
  }

  return {
    x: clamp((p.clientX - contentLeft) * cw / Math.max(1, contentWidth), 0, cw),
    y: clamp((p.clientY - contentTop) * ch / Math.max(1, contentHeight), 0, ch)
  };
}
function isCanvasClientPoint(e){
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  if(!p || !r) return false;
  return p.clientX >= r.left && p.clientX <= r.right && p.clientY >= r.top && p.clientY <= r.bottom;
}
function syncHoverFromPointer(e){
  if(!isCanvasClientPoint(e)){ hoverIdx = -1; return -1; }
  mouse = pos(e);
  hoverIdx = idxAt(mouse.x, mouse.y);
  return hoverIdx;
}
function clearHover(){ hoverIdx = -1; }
function onDown(e){
  e.preventDefault();
  const idx=syncHoverFromPointer(e);
  if(idx>=0&&grid[idx]){
    dragging=grid[idx];
    dragging.original=idx;
    dragging.dragPreviewType=dragging.type;
    dragging.dragPreviewLevel=Math.max(1, Number(dragging.level||1));
    grid[idx]=null;
    selected=idx;
  }else if(idx>=0){selected=idx}
  updateSelected();
}
function onMove(e){
  if(e.cancelable)e.preventDefault();
  syncHoverFromPointer(e);
}
function onUp(e){
  if(!dragging)return;
  const p=mouse, idx=idxAt(p.x,p.y), original=dragging.original;
  if(idx>=0&&canBuild(idx)){
    const target=grid[idx];
    if(target&&target.type===dragging.type&&target.level===dragging.level&&target.level<12){
      grid[idx]=createMergedPlanet(target,dragging,idx);
      selected=idx;triggerMergeImpact(idx,target.def.color,target.level+1);
    }else if(!target){
      dragging.idx=idx;grid[idx]=dragging;selected=idx;
    }else{
      grid[original]=dragging;selected=original;
    }
  }else{
    grid[original]=dragging;selected=original;
  }
  delete dragging.original;
  delete dragging.dragPreviewType;
  delete dragging.dragPreviewLevel;
  dragging=null;updateSelected();updateUI();
}
canvas.addEventListener('mousedown',onDown);
canvas.addEventListener('mousemove',onMove);
canvas.addEventListener('mouseleave',clearHover);
canvas.addEventListener('pointerleave',clearHover);
window.addEventListener('blur',clearHover);
window.addEventListener('mouseup',onUp);
canvas.addEventListener('touchstart',onDown,{passive:false});
canvas.addEventListener('touchmove',onMove,{passive:false});
canvas.addEventListener('touchcancel',clearHover,{passive:true});
window.addEventListener('touchend',onUp,{passive:false});
['combatHudTopLine','combatHudCommands','combatHudOverlay'].forEach(id=>{
  const el = $(id);
  if(el){
    el.addEventListener('mouseenter', clearHover, true);
    el.addEventListener('pointerenter', clearHover, true);
  }
});

function initAudio(){
  if(audio)return;
  audio = {on:true, bgm:null, bgmSrc:null, unlocked:true, perfMode:isLowPowerAudioMode()};
  ensureAudioContext();
  // 브라우저 자동재생 정책 때문에 사용자가 BGM 버튼을 누른 뒤부터 재생됩니다.
  playStageBgm();
}

function ensureAudioContext(){
  if(audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

function synthShot(kind='solar', intensity=1){
  if(!audio || !audio.on) return;
  const ctx = ensureAudioContext();
  if(!ctx) return;
  if(ctx.state === 'suspended') ctx.resume().catch(()=>{});
  const now = ctx.currentTime;
  const presets = {
    solar:{type:'triangle',freq:210,end:82,gain:.041,duration:.085},
    frost:{type:'sine',freq:690,end:260,gain:.029,duration:.072},
    storm:{type:'square',freq:360,end:120,gain:.030,duration:.05},
    toxic:{type:'sawtooth',freq:170,end:86,gain:.024,duration:.082},
    void:{type:'sine',freq:102,end:44,gain:.032,duration:.10},
    laser:{type:'triangle',freq:820,end:300,gain:.026,duration:.055},
    starengine:{type:'triangle',freq:300,end:560,gain:.036,duration:.09},
    boss:{type:'sawtooth',freq:90,end:52,gain:.055,duration:.16}
  };
  const p = presets[kind] || presets.solar;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, p.end), now + p.duration);
  filter.type = kind === 'frost' ? 'bandpass' : kind === 'storm' ? 'highpass' : 'lowpass';
  filter.frequency.setValueAtTime(kind === 'storm' ? 1800 : 1200, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, p.gain * intensity), now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + p.duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + p.duration + 0.02);
}

function playTowerSfx(kind='solar', intensity=1){
  if(audio?.perfMode && kind !== 'boss') return;
  const stamp = performance.now();
  const last = towerSfxLimiter[kind] || 0;
  const gap = audio?.perfMode ? 360 : 135;
  if(stamp - last < gap) return;
  towerSfxLimiter[kind] = stamp;
  synthShot(kind, Math.min(1, intensity));
}

function playBgmSrc(src, volume=.30){
  if(!audio || !audio.on || !src) return;
  if(audio.bgm && audio.bgmSrc === src){
    audio.bgm.volume = volume;
    audio.bgm.play().catch(()=>{});
    return;
  }
  if(audio.bgm){
    audio.bgm.pause();
  }
  const bgm = htmlAudioCache[src] || new Audio(src);
  htmlAudioCache[src] = bgm;
  bgm.loop = true;
  bgm.volume = volume;
  bgm.preload = 'metadata';
  try{ bgm.currentTime = 0; }catch(_){ }
  audio.bgm = bgm;
  audio.bgmSrc = src;
  bgm.play().catch(()=>{});
}

function playStageBgm(){
  const stageList = AUDIO_URLS.bgm?.stages || [];
  const fallbackList = Array.isArray(AUDIO_URLS.bgm) ? AUDIO_URLS.bgm : [];
  const baseSrc = stageList[S.theme % stageList.length] || fallbackList[S.theme % fallbackList.length];
  const bossWave = !!S.currentBossInfo && (S.ogge === 5 || S.ogge === 10);
  const src = bossWave ? (AUDIO_URLS.bgm?.boss || baseSrc) : baseSrc;
  playBgmSrc(src, bossWave ? .40 : .34);
}

function playMapBgm(){
  playBgmSrc(AUDIO_URLS.bgm?.map, .30);
}

function playResultBgm(kind){
  const src = kind === 'gameover' ? AUDIO_URLS.bgm?.gameover : AUDIO_URLS.bgm?.clear;
  playBgmSrc(src, kind === 'gameover' ? .38 : .34);
}

function stopStageBgm(){
  if(audio && audio.bgm) audio.bgm.pause();
}

function trackOneShotAudio(a){
  if(!a) return a;
  activeOneShotAudio.add(a);
  const cleanup = () => activeOneShotAudio.delete(a);
  a.addEventListener('ended', cleanup, {once:true});
  a.addEventListener('pause', () => {
    if(a.currentTime === 0 || a.ended) cleanup();
  }, {once:true});
  return a;
}

function stopAllGameAudio(){
  try{
    if(audio && audio.bgm){
      audio.bgm.pause();
      try{ audio.bgm.currentTime = 0; }catch(_){}
      audio.bgm = null;
      audio.bgmSrc = null;
    }
    Object.values(htmlAudioCache || {}).forEach(a => {
      if(!a || typeof a.pause !== 'function') return;
      try{ a.pause(); }catch(_){}
      try{ a.currentTime = 0; }catch(_){}
    });
    activeOneShotAudio.forEach(a => {
      try{ a.pause(); }catch(_){}
      try{ a.currentTime = 0; }catch(_){}
    });
    activeOneShotAudio.clear();
    if(audioCtx && audioCtx.state === 'running'){
      audioCtx.suspend().catch(()=>{});
    }
  }catch(err){
    console.warn('stopAllGameAudio failed', err);
  }
}

function sound(type, opts={}){
  if(!audio || !audio.on)return;
  const now = performance.now();
  const important = new Set(['boss','core','clear','gameover','summon','merge','unlock','level','treasure']);
  const minGap = {shot:240, beam:280, hit:260, kill:320, boss:900, core:520, summon:180, merge:220, treasure:360, level:420, clear:1000, gameover:1000, unlock:600}[type] || 260;
  if(audio.perfMode && !important.has(type)) return;
  if(now - (soundLimiter[type] || 0) < minGap) return;
  soundLimiter[type] = now;
  if(type === 'boss'){
    const srcBoss = AUDIO_URLS.sfx?.boss;
    if(srcBoss){
      const a = trackOneShotAudio((htmlAudioCache[srcBoss] || new Audio(srcBoss)).cloneNode(true));
      htmlAudioCache[srcBoss] = htmlAudioCache[srcBoss] || new Audio(srcBoss);
      a.volume = .34 * (opts.intensity || 1);
      a.play().catch(()=>{});
    }
    playTowerSfx('boss', opts.intensity || 1);
    return;
  }
  const src = AUDIO_URLS.sfx[type];
  if(!src)return;
  const base = htmlAudioCache[src] || new Audio(src);
  htmlAudioCache[src] = base;
  base.preload = 'metadata';
  const a = trackOneShotAudio(base.cloneNode(true));
  const volume = {shot:.16, beam:.16, blackhole:.34, nova:.38, treasure:.38, level:.34, hit:.18, kill:.16, summon:.22, merge:.26, clear:.42, gameover:.42, core:.38, unlock:.36}[type] || .22;
  a.volume = volume * (opts.volumeMul || 1);
  a.play().catch(()=>{});
}

function showGalaxyMapClean(){
  const galaxy = document.getElementById('galaxyMap');
  const stage = $('stageMap');
  const menu = $('menu');
  const game = $('game');
  if(menu) menu.style.display='none';
  if(game) game.style.display='none';
  if(stage) stage.style.display='none';
  if(galaxy){
    galaxy.style.display='block';
    galaxy.classList.add('cleanVisible');
    requestAnimationFrame(refreshScreenStarfields);
    galaxy.dataset.selectedGalaxy='milky-rift';
  }
  const label = document.getElementById('galaxyProgressLabel');
  const sub = document.getElementById('galaxyProgressSub');
  if(label) label.textContent = TEST_MODE_CONFIG.enabled ? 'TEST MODE · MILKY RIFT · 1 / 4 GALAXIES' : 'MILKY RIFT · 1 / 4 GALAXIES';
  if(sub) sub.textContent = TEST_MODE_CONFIG.enabled ? '테스트 모드로 은하수 균열 은하에 진입합니다.' : '현재는 은하수 균열 은하만 개방되어 있습니다.';
  try{ stopStageBgm(); if(audio && audio.on) playMapBgm(); }catch(err){}
}
function hideGalaxyMapClean(){
  const galaxy = document.getElementById('galaxyMap');
  if(galaxy){
    galaxy.classList.remove('cleanVisible');
    galaxy.style.display='none';
  }
}
function enterMilkyRiftClean(){
  hideGalaxyMapClean();
  showStageMap();
  requestAnimationFrame(refreshScreenStarfields);
  const back = $('stageMapBack');
  if(back) back.textContent = '← GALAXY';
  const title = document.querySelector('#stageMap .stageTopTitle');
  if(title) title.textContent = 'CONSTELLATION MAP';
}
function returnMainFromGalaxyClean(){
  hideGalaxyMapClean();
  $('stageMap').style.display='none';
  $('game').style.display='none';
  $('menu').style.display='flex';
  if(TEST_MODE_CONFIG.enabled){
    setTestModeEnabled(false);
    loadOfflineMeta();
    loadStageMapProgress();
    renderOfflineMetaPanel();
  }
}
function bindGalaxyMapClean(){
  const gEnter = document.getElementById('galaxyEnterBtn');
  const gBack = document.getElementById('galaxyMapBack');
  if(gEnter) gEnter.onclick = enterMilkyRiftClean;
  if(gBack) gBack.onclick = returnMainFromGalaxyClean;
  document.querySelectorAll('#galaxyNodeLayer .galaxyNode[data-galaxy-id]').forEach(node=>{
    node.onclick = () => {
      if(node.dataset.galaxyId === 'milky-rift') return false;
      toast('아직 미개방 은하입니다. 현재는 MILKY RIFT만 입장 가능합니다.');
      return false;
    };
  });
}

$('startBtn').onclick=()=>{
  setTestModeEnabled(false);
  loadOfflineMeta();
  loadStageMapProgress();
  bindGalaxyMapClean();
  showGalaxyMapClean();
};

$('testModeBtn').onclick=()=>{
  loadOfflineMeta();
  loadStageMapProgress();
  applyTestModeOverrides();
  renderOfflineMetaPanel();
  bindGalaxyMapClean();
  showGalaxyMapClean();
  toast('TEST MODE 활성화 — 모든 성역과 기본 타워가 해금되었습니다');
};

$('stageMapBack').onclick=()=>{
  $('stageMap').style.display='none';
  bindGalaxyMapClean();
  showGalaxyMapClean();
};

bindGalaxyMapClean();



/* =========================================================
   Release UX Patch v2
   - First-run tutorial, battle run logs, lean export flow.
   ========================================================= */
const RELEASE_TUTORIAL_KEY = 'planetRiftTutorialSeenV2';
const RELEASE_RUN_LOG_KEY = 'planetRiftBattleRunLogsV2';
const RELEASE_RUN_LOG_LIMIT = 80;

function shouldShowBattleTutorial(stageNo){
  try{ return !localStorage.getItem(RELEASE_TUTORIAL_KEY); }
  catch(err){ return Number(stageNo || 1) === 1; }
}

function closeBattleTutorial(skipSave=false){
  const overlay = $('tutorialOverlay');
  if(overlay) overlay.remove();
  if(!skipSave){
    try{ localStorage.setItem(RELEASE_TUTORIAL_KEY, '1'); }catch(err){}
  }
  if(S && !S.gameOver) S.paused = false;
  updateUI();
}

function showBattleTutorial(stageNo){
  if($('tutorialOverlay')) return;
  if(S) S.paused = true;
  const def = getStageDef(stageNo || StageMapState.current || 1);
  const overlay = document.createElement('div');
  overlay.id = 'tutorialOverlay';
  overlay.className = 'tutorialOverlay';
  overlay.innerHTML = `<div class="tutorialCard" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle">
    <div class="tutorialKicker">FIRST DEFENSE BRIEFING</div>
    <h2 id="tutorialTitle">${escapeHtml(def.ko)} 방어 시작</h2>
    <p>전투 화면은 일부러 단순하게 유지했습니다. 지금 필요한 판단만 보면 됩니다.</p>
    <div class="tutorialSteps">
      <div class="tutorialStep"><b>01</b><span><strong>랜덤 소환</strong>으로 행성을 배치하세요. 배치 가능한 장판에 자동 착지합니다.</span></div>
      <div class="tutorialStep"><b>02</b><span><strong>같은 행성 + 같은 레벨</strong>은 타워 합치기으로 성장합니다. 고유 스킬은 Lv.3 / Lv.6 / Lv.9에 자동 해금됩니다.</span></div>
      <div class="tutorialStep"><b>03</b><span><strong>일반 스킬</strong>은 전투 중에 고르지 않습니다. 실패/클리어 보상인 성흔 조각으로 성역 지도에서 강화합니다.</span></div>
      <div class="tutorialStep"><b>04</b><span><strong>10웨이브와 보스</strong>를 막으면 다음 성역과 신규 행성이 열립니다. 실패해도 조각과 기록은 남습니다.</span></div>
    </div>
    <div class="tutorialActions">
      <button class="releaseTinyLink" id="tutorialNeverBtn">다시 보지 않기</button>
      <button class="btnGreen" id="tutorialStartBtn">방어 시작</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const start = overlay.querySelector('#tutorialStartBtn');
  const never = overlay.querySelector('#tutorialNeverBtn');
  if(start) start.onclick = () => closeBattleTutorial(false);
  if(never) never.onclick = () => closeBattleTutorial(false);
}

function showStageQuickTip(stageNo){
  if(!S || S.gameOver) return;
  const def = getStageDef(stageNo || StageMapState.current || 1);
  toast(`${def.ko} 진입`, 'important');
}

function currentTowerUsageSummary(){
  const usage = {};
  if(Array.isArray(grid)){
    grid.forEach(t => {
      if(!t) return;
      const id = PLANETS[t.type]?.id || `type_${t.type}`;
      if(!usage[id]) usage[id] = {count:0,maxLevel:0};
      usage[id].count += 1;
      usage[id].maxLevel = Math.max(usage[id].maxLevel, Number(t.level || 1));
    });
  }
  let topTower = 'none';
  let topScore = -1;
  Object.entries(usage).forEach(([id, v]) => {
    const score = v.count * 100 + v.maxLevel;
    if(score > topScore){ topScore = score; topTower = id; }
  });
  return {usage, topTower};
}

function buildBattleRunLog(cleared=false, stageNoOverride=null){
  const stageNo = Number(stageNoOverride || S?.stageNo || StageMapState.current || 1);
  const def = getStageDef(stageNo);
  const towers = currentTowerUsageSummary();
  const hp = Number(S?.hp || 0);
  const maxHp = Math.max(1, Number(S?.maxHp || 1));
  const now = new Date();
  return {
    id: `${now.toISOString()}_${Math.random().toString(36).slice(2,8)}`,
    at: now.toISOString(),
    stage: stageNo,
    stageKey: def.key,
    stageName: def.ko,
    result: cleared ? 'clear' : 'defeat',
    wave: Number(S?.ogge || 0),
    kills: Number(S?.runKills || 0),
    summons: Number(S?.runSummons || 0),
    merges: Number(S?.runMerges || 0),
    leaked: Number(S?.leakedEnemies || 0),
    coreHp: hp,
    coreHpRatio: Number((hp / maxHp).toFixed(4)),
    bestCombo: Number(S?.combo?.best || 0),
    gold: Number(S?.gold || 0),
    battleLevel: Number(S?.level || 1),
    topTower: towers.topTower,
    towerUsage: towers.usage,
    globalEffects: globalSkillSummaryText ? globalSkillSummaryText() : ''
  };
}

function appendBattleRunLog(entry){
  if(!entry) return;
  try{
    const prev = JSON.parse(localStorage.getItem(RELEASE_RUN_LOG_KEY) || '[]');
    const logs = Array.isArray(prev) ? prev : [];
    logs.unshift(entry);
    localStorage.setItem(RELEASE_RUN_LOG_KEY, JSON.stringify(logs.slice(0, RELEASE_RUN_LOG_LIMIT)));
    if(typeof console !== 'undefined') console.table([entry]);
  }catch(err){
    console.warn('battle run log save failed', err);
  }
}

function battleRunLogsToCsv(logs){
  const cols = ['at','stage','stageKey','stageName','result','wave','kills','summons','merges','leaked','coreHp','coreHpRatio','bestCombo','gold','battleLevel','topTower','globalEffects','towerUsage'];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [cols.join(',')];
  logs.forEach(log => {
    rows.push(cols.map(c => esc(c === 'towerUsage' ? JSON.stringify(log[c] || {}) : log[c])).join(','));
  });
  return rows.join('\n');
}

function exportBattleLogs(){
  let logs = [];
  try{ logs = JSON.parse(localStorage.getItem(RELEASE_RUN_LOG_KEY) || '[]'); }catch(err){ logs = []; }
  if(!Array.isArray(logs) || !logs.length){
    toast('아직 저장된 전투 로그가 없습니다');
    return;
  }
  const csv = battleRunLogsToCsv(logs);
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planet_rift_run_logs_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 300);
  toast(`${logs.length}개 전투 로그 CSV 저장`);
}

function showBattleLogSummary(){
  let logs = [];
  try{ logs = JSON.parse(localStorage.getItem(RELEASE_RUN_LOG_KEY) || '[]'); }catch(err){ logs = []; }
  if(!logs.length){ toast('아직 저장된 전투 로그가 없습니다'); return; }
  const recent = logs.slice(0, 5).map(x => `${x.stageName} ${x.result} · ${x.ogge}W · 처치 ${x.kills}`).join('<br>');
  const overlay = document.createElement('div');
  overlay.className = 'releaseModalOverlay';
  overlay.innerHTML = `<div class="releaseModalCard" role="dialog" aria-modal="true">
    <h2>RUN LOG</h2>
    <p>최근 기록 ${fmt2(logs.length)}개가 로컬 브라우저에 저장되어 있습니다.</p>
    <p style="margin-top:12px">${recent}</p>
    <div class="releaseModalActions">
      <button class="btnAlt" id="runLogCloseBtn">닫기</button>
      <button class="btnGreen" id="runLogExportBtn">CSV 다운로드</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#runLogCloseBtn').onclick = () => overlay.remove();
  overlay.querySelector('#runLogExportBtn').onclick = () => { exportBattleLogs(); overlay.remove(); };
}

const _recordOfflineRunEndRelease = recordOfflineRunEnd;
recordOfflineRunEnd = function(cleared=false, stageNoOverride=null){
  const entry = buildBattleRunLog(cleared, stageNoOverride);
  const result = _recordOfflineRunEndRelease(cleared, stageNoOverride);
  appendBattleRunLog(entry);
  return result;
};

if($('stageGalaxyBtn')) $('stageGalaxyBtn').onclick=()=>{
  $('stageMap').style.display='none';
  bindGalaxyMapClean();
  showGalaxyMapClean();
};

$('stageEnterBtn').onclick=()=>{
  startSelectedStageFromMap();
};
if($('runLogBtn')) $('runLogBtn').onclick = showBattleLogSummary;

document.querySelectorAll('#stageMap .stageNode').forEach(node => {
  node.addEventListener('click', () => {
    const stageNo = clamp(Number(node.dataset.stage || 1), 1, STAGE_MAP_DEFS.length);
    StageMapState.selected = stageNo;
    saveStageMapProgress();
    renderStageMap();
    if(stageNo > StageMapState.unlocked){
      const def = getStageDef(stageNo);
      const arc = getConstellationArcByStage(stageNo);
      const hint = $('stageHint');
      if(hint) hint.textContent = `${arc.ko} · ${def.ko} 미리보기 — 이전 성역을 클리어하면 진입할 수 있습니다.`;
    }
  });
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-constellation-jump]');
  if(!btn) return;
  const stageNo = clamp(Number(btn.dataset.constellationJump || 1), 1, STAGE_MAP_DEFS.length);
  StageMapState.selected = stageNo;
  saveStageMapProgress();
  renderStageMap();
  if(stageNo > StageMapState.unlocked){
    const arc = getConstellationArcByStage(stageNo);
    toast(`${arc.ko}는 이전 별자리 복원 후 열립니다. 하단 정보는 미리보기로 표시됩니다.`);
  }
});

$('summonBtn').onclick=summon;
$('mergeBtn').onclick=()=>autoMerge();
$('speedBtn').onclick=()=>{S.speed=S.speed===1?2:S.speed===2?3:1;updateUI()};
$('pauseBtn').onclick=()=>{if(S.gameOver)return;S.paused=!S.paused;updateUI()};
function syncAudioControl(){
  const btn = $('audioBtn');
  if(!btn) return;
  const on = !!(audio && audio.on);
  btn.classList.toggle('is-off', !on);
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.setAttribute('aria-label', on ? 'BGM 끄기' : 'BGM 켜기');
  btn.title = on ? 'BGM ON' : 'BGM OFF';
}
$('audioBtn').onclick=()=>{
  if(!audio){
    initAudio();
    syncAudioControl();
    toast('BGM 활성화');
    return;
  }
  audio.on=!audio.on;
  if(audio.on) playStageBgm();
  else stopStageBgm();
  syncAudioControl();
  toast(audio.on?'BGM 활성화':'BGM 비활성화');
};
syncAudioControl();
// 전투 화면 미니멀화: 액티브 스킬 버튼은 숨김 처리하고 직접 조작은 비활성화합니다.

document.addEventListener('click', e=>{
  const btn = e.target.closest('[data-offline-upgrade]');
  if(!btn) return;
  buyOfflineUpgrade(btn.dataset.offlineUpgrade);
});



document.addEventListener('click', e=>{
  if(e.target.closest('[data-planet-detail-close]')) hidePlanetDetail();
  const modal = $('planetDetailModal');
  if(modal && modal.classList.contains('open') && e.target === modal) hidePlanetDetail();
});

window.addEventListener('keydown', e=>{
  if(e.key === 'Escape') hidePlanetDetail();
});

window.addEventListener('resize', () => { resizeStarfield(); refreshScreenStarfields(); });

window.addEventListener('keydown',e=>{
  if(e.repeat)return;
  if(e.code==='Space'){e.preventDefault();if(!S.gameOver){S.paused=!S.paused;updateUI()}}
  if(e.key==='1')summon();
  if(e.key==='2'){S.speed=S.speed===1?2:S.speed===2?3:1;updateUI()}
  if(e.key.toLowerCase()==='m')autoMerge();
  // Q/W/E 액티브 스킬 단축키는 전투 UI 단순화를 위해 비활성화
});



/* =========================================================
   Offline Mastery Patch v2
   - 3-star stage mastery and offline ending loop.
   ========================================================= */
const STAGE_MASTERY_GOALS = {
  1:['성역 10웨이브 클리어','코어 HP 50% 이상으로 클리어','코어 HP 80% 이상으로 클리어'],
  2:['성역 10웨이브 클리어','코어 HP 50% 이상으로 클리어','코어 HP 80% 이상으로 클리어'],
  3:['성역 10웨이브 클리어','코어 HP 45% 이상으로 클리어','코어 HP 75% 이상으로 클리어'],
  4:['성역 10웨이브 클리어','코어 HP 40% 이상으로 클리어','코어 HP 70% 이상으로 클리어'],
  5:['성역 10웨이브 클리어','코어 HP 40% 이상으로 클리어','코어 HP 68% 이상으로 클리어'],
  6:['성역 10웨이브 클리어','코어 HP 38% 이상으로 클리어','코어 HP 66% 이상으로 클리어'],
  7:['성역 10웨이브 클리어','코어 HP 35% 이상으로 클리어','코어 HP 62% 이상으로 클리어'],
  8:['성역 10웨이브 클리어','코어 HP 34% 이상으로 클리어','코어 HP 60% 이상으로 클리어'],
  9:['성역 10웨이브 클리어','코어 HP 33% 이상으로 클리어','코어 HP 58% 이상으로 클리어'],
  10:['성역 10웨이브 클리어','코어 HP 32% 이상으로 클리어','코어 HP 56% 이상으로 클리어'],
  11:['성역 10웨이브 클리어','코어 HP 30% 이상으로 클리어','코어 HP 54% 이상으로 클리어'],
  12:['성역 10웨이브 클리어','코어 HP 28% 이상으로 클리어','코어 HP 52% 이상으로 클리어']
};
const OFFLINE_MASTER_REWARD = [0, 3, 7, 12];

function ensureOfflineMetaMastery(){
  if(!META) return;
  if(!META.mastery || typeof META.mastery !== 'object') META.mastery = {};
  if(!META.flags || typeof META.flags !== 'object') META.flags = {};
  for(const def of STAGE_MAP_DEFS){
    const key = String(def.stage);
    const cur = META.mastery[key] || {};
    META.mastery[key] = {
      stars: Math.max(0, Math.min(3, Math.floor(Number(cur.stars || 0)))),
      bestHpRatio: Math.max(0, Math.min(1, Number(cur.bestHpRatio || 0))),
      clears: Math.max(0, Math.floor(Number(cur.clears || 0)))
    };
  }
}

const _normalizeOfflineMetaMastery = normalizeOfflineMeta;
normalizeOfflineMeta = function(raw){
  const m = _normalizeOfflineMetaMastery(raw);
  const prev = META;
  META = m;
  ensureOfflineMetaMastery();
  const normalized = META;
  META = prev;
  return normalized;
};

function stageMasteryStars(stageNo){
  ensureOfflineMetaMastery();
  const rec = META?.mastery?.[String(stageNo)] || {stars:0};
  return Math.max(0, Math.min(3, Number(rec.stars || 0)));
}

function stageMasteryHpRatio(stageNo){
  ensureOfflineMetaMastery();
  const rec = META?.mastery?.[String(stageNo)] || {bestHpRatio:0};
  return Math.max(0, Math.min(1, Number(rec.bestHpRatio || 0)));
}

function computeStageMastery(stageNo){
  const hpRatio = S && S.maxHp ? Math.max(0, Math.min(1, S.hp / S.maxHp)) : 0;
  const n = Number(stageNo);
  const thresholds = n >= 12 ? [.01, .28, .52]
    : n >= 11 ? [.01, .30, .54]
    : n >= 10 ? [.01, .32, .56]
    : n >= 9 ? [.01, .33, .58]
    : n >= 8 ? [.01, .34, .60]
    : n >= 7 ? [.01, .35, .62]
    : n === 6 ? [.01, .38, .66]
    : n === 5 ? [.01, .40, .68]
    : n === 4 ? [.01, .40, .70]
    : n === 3 ? [.01, .45, .75]
    : [.01, .50, .80];
  let stars = 0;
  if(hpRatio >= thresholds[0]) stars = 1;
  if(hpRatio >= thresholds[1]) stars = 2;
  if(hpRatio >= thresholds[2]) stars = 3;
  return {stars, hpRatio};
}

function stageMasteryHtml(stageNo){
  ensureOfflineMetaMastery();
  const stars = stageMasteryStars(stageNo);
  const ratio = fmt2(stageMasteryHpRatio(stageNo) * 100);
  const goals = STAGE_MASTERY_GOALS[Number(stageNo)] || STAGE_MASTERY_GOALS[1];
  const starText = '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars);
  return `<div class="stageMasteryBox"><div class="stageMasteryTitle">STAGE MASTERY · 최고 코어 ${ratio}%</div><div class="stageMasteryStars">${starText}</div><div class="stageMasteryGoals">${goals.map((g,i)=>`<div class="stageMasteryGoal ${stars>i?'done':''}">${stars>i?'✓':'○'} ${g}</div>`).join('')}</div></div>`;
}

const _renderOfflineMetaPanelMastery = renderOfflineMetaPanel;
renderOfflineMetaPanel = function(){
  ensureOfflineMetaMastery();
  _renderOfflineMetaPanelMastery();
  const selectedStage = resolveStageInfoSelection();
  const html = stageMasteryHtml(selectedStage);
  const side = $('offlinePanelBody'); if(side) side.insertAdjacentHTML('beforeend', html);
  const menu = $('offlineMenuPanel'); if(menu) menu.insertAdjacentHTML('beforeend', `<div class="offlineStatRow"><span class="offlinePill">다음 목표: ${nextMasteryTargetText()}</span></div>`);
  const stage = $('offlineStagePanel'); if(stage) stage.insertAdjacentHTML('beforeend', html);
};

function nextMasteryTargetText(){
  ensureOfflineMetaMastery();
  for(const def of STAGE_MAP_DEFS){
    const s = stageMasteryStars(def.stage);
    if(s < 3) return `${def.ko} ${s+1}성 도전`;
  }
  return '모든 성역 3성 완료';
}

const _renderStageMapMastery = renderStageMap;
renderStageMap = function(){
  _renderStageMapMastery();
  ensureOfflineMetaMastery();
  document.querySelectorAll('#stageMap .stageNode').forEach(node => {
    const stageNo = Number(node.dataset.stage || 1);
    let badge = node.querySelector('.nodeStarRow');
    if(!badge){
      badge = document.createElement('span');
      badge.className = 'nodeStarRow';
      node.appendChild(badge);
    }
    const stars = stageMasteryStars(stageNo);
    badge.textContent = stars ? '★'.repeat(stars) + '☆'.repeat(3-stars) : '☆☆☆';
  });
};

const _recordOfflineRunEndMastery = recordOfflineRunEnd;
recordOfflineRunEnd = function(cleared=false, stageNoOverride=null){
  const stageNo = clamp(Number(stageNoOverride || S?.stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const result = cleared ? computeStageMastery(stageNo) : null;
  const beforeStars = stageMasteryStars(stageNo);
  _recordOfflineRunEndMastery(cleared, stageNoOverride);
  ensureOfflineMetaMastery();
  if(cleared && result){
    const rec = META.mastery[String(stageNo)] || {stars:0,bestHpRatio:0,clears:0};
    rec.clears = Math.max(Number(rec.clears || 0), Number(META.clears?.[String(stageNo)] || 0));
    rec.bestHpRatio = Math.max(Number(rec.bestHpRatio || 0), result.hpRatio);
    rec.stars = Math.max(Number(rec.stars || 0), result.stars);
    META.mastery[String(stageNo)] = rec;
    const gainedStars = Math.max(0, rec.stars - beforeStars);
    if(gainedStars > 0){
      const reward = OFFLINE_MASTER_REWARD[rec.stars] || 0;
      META.shards += reward;
      toast(`성역 숙련도 ${fmt2(rec.stars)}성 달성 — 성흔 조각 +${fmt2(reward)}`);
      log(`숙련도 갱신: ${stageNo}성역 ${fmt2(rec.stars)}성 / 최고 코어 ${fmt2(rec.bestHpRatio*100)}%`);
    }else{
      log(`숙련도 유지: ${stageNo}성역 최고 ${fmt2(rec.stars)}성 / 이번 코어 ${fmt2(result.hpRatio*100)}%`);
    }
    if(stageNo >= STAGE_MAP_DEFS.length){
      META.flags.seasonOneCleared = true;
      setTimeout(showOfflineEndingPanel, 450);
    }
    saveOfflineMeta();
    renderOfflineMetaPanel();
  }
};

function showOfflineGuidePanel(){
  ensureOfflineMetaMastery();
  if(META.flags.firstGuideSeen) return;
  META.flags.firstGuideSeen = true;
  saveOfflineMeta();
  const overlay = document.createElement('div');
  overlay.className = 'offlineGuideOverlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `<div class="offlineGuideCard"><h2>COMMAND BRIEFING</h2><p>이 게임은 온라인 과금형이 아니라, 성역을 깨며 타워와 영구 강화를 모으는 오프라인 로그라이트 디펜스입니다.</p><div class="offlineGuideGrid"><div class="offlineGuideItem"><b>1. 스테이지 보상</b><span>성역을 클리어하면 그 성역의 전용 타워가 해금됩니다.</span></div><div class="offlineGuideItem"><b>2. 실패 보상</b><span>실패해도 성흔 조각을 얻고, 조각으로 영구 강화를 올립니다.</span></div><div class="offlineGuideItem"><b>3. 3성 숙련도</b><span>코어 HP를 많이 남기고 클리어할수록 별이 올라갑니다.</span></div><div class="offlineGuideItem"><b>4. 최종 목표</b><span>12개 성역을 정화하고 모든 별자리 성역 3성을 노리는 것이 1차 목표입니다.</span></div></div><div class="offlineGuideActions"><button id="offlineGuideClose" class="btnGreen">시작하기</button></div></div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  const btn = overlay.querySelector('#offlineGuideClose');
  if(btn) btn.onclick = close;
}

function showOfflineEndingPanel(){
  ensureOfflineMetaMastery();
  if(META.flags.endingPanelShown) return;
  META.flags.endingPanelShown = true;
  saveOfflineMeta();
  const totalStars = STAGE_MAP_DEFS.reduce((sum, def) => sum + stageMasteryStars(def.stage), 0);
  const overlay = document.createElement('div');
  overlay.className = 'offlineGuideOverlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `<div class="offlineGuideCard"><h2>SEASON 1 CLEAR</h2><p>균열 왕좌가 붕괴했습니다. 균열은 완전히 사라지지 않았지만, 지휘관은 이제 은하수 전역의 병기를 묶은 별자리 연합 함대를 완성했습니다.</p><p><b>현재 성역 숙련도:</b> ${fmt2(totalStars)}/${fmt2(STAGE_MAP_DEFS.length * 3)}성</p><div class="offlineGuideGrid"><div class="offlineGuideItem"><b>다음 목표</b><span>각 별자리 성역을 다시 클리어해 3성 숙련도를 완성하세요.</span></div><div class="offlineGuideItem"><b>남은 성장</b><span>성흔 조각으로 코어, 보급, 소환 교리를 강화하세요.</span></div></div><div class="offlineGuideActions"><button id="offlineEndingClose" class="btnGreen">계속하기</button></div></div>`;
  document.body.appendChild(overlay);
  const btn = overlay.querySelector('#offlineEndingClose');
  if(btn) btn.onclick = () => overlay.remove();
}

const _startSelectedStageMastery = startSelectedStageFromMap;
startSelectedStageFromMap = function(){
  _startSelectedStageMastery();
  setTimeout(showOfflineGuidePanel, 180);
};



/* =========================================================
   V12 STAGE CLICK FULL INFO SYNC PATCH
   - Integrated inside main game scope so stage data functions are accessible.
   - Any stage node click updates the full lower information panel.
   ========================================================= */
function stageSyncSafeNum(v, fallback=1){
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function stageSyncClampStage(stageNo){
  return clamp(stageSyncSafeNum(stageNo, 1), 1, STAGE_MAP_DEFS.length);
}
function buildStageBottomInfoHtml(stageNo){
  const n = stageSyncClampStage(stageNo);
  const def = getStageDef(n);
  const arc = getConstellationArcByStage(n);
  const story = OFFLINE_CHAPTERS[n] || OFFLINE_CHAPTERS[1];
  const presentation = getStagePresentation(n);
  const mid = getStageBossDef(n, 'mid');
  const finalBoss = getStageBossDef(n, 'final');
  const clears = Number(META?.clears?.[String(n)] || 0);
  const best = Number(META?.bestWave?.[String(n)] || 0);
  const rewardText = stageTowerRewardText(n);
  const globalLine = globalSkillSummaryText();
  const mastery = typeof stageMasteryHtml === 'function' ? stageMasteryHtml(n) : '';
  const copy = getStageDescriptionCopy(n);
  const storyLine = `${copy.summary} 적 특성: ${copy.enemy} 추천 전략: ${copy.strategy}`;
  return `<div class="stageFocusedNarrative" data-focused-stage="${n}">
    <div class="stageFocusedTop">
      <div>
        <div class="stageFocusedTitle">${escapeHtml(story.title || `${n}장. ${def.ko}`)}</div>
        <div class="stageFocusedStory"><b>${escapeHtml(def.name)} / ${escapeHtml(def.ko)}</b> · ${escapeHtml(arc.ko)} · ${escapeHtml(storyLine)}</div>
      </div>
      <div class="stageFocusedShard">조각 ${fmt2(META?.shards || 0)}</div>
    </div>
    <div class="stageFocusedMeta">
      <span class="stageFocusedPill">위험도 ${escapeHtml(presentation.risk)}</span>
      <span class="stageFocusedPill">클리어 ${fmt2(clears)}</span>
      <span class="stageFocusedPill">최고 ${fmt2(best)}W</span>
      <span class="stageFocusedPill">${escapeHtml(rewardText)}</span>
      <span class="stageFocusedPill">전역 효과: ${escapeHtml(globalLine)}</span>
    </div>
    <div class="stageFocusedBoss">
      <div><small>MID BOSS</small><b>${escapeHtml(mid.name)}</b><span>${escapeHtml(mid.ko)} · ${escapeHtml(mid.ability)} · ${escapeHtml(mid.desc || mid.title || '')}</span></div>
      <div><small>FINAL BOSS</small><b>${escapeHtml(finalBoss.name)}</b><span>${escapeHtml(finalBoss.ko)} · ${escapeHtml(finalBoss.ability)} · ${escapeHtml(finalBoss.desc || finalBoss.title || '')}</span></div>
    </div>
    ${mastery}
  </div>`;
}
function syncStageBottomInfo(stageNo){
  const n = stageSyncClampStage(stageNo);
  const stage = $('offlineStagePanel');
  if(stage){
    stage.dataset.stage = String(n);
    stage.innerHTML = buildStageBottomInfoHtml(n);
  }
  const info = $('stageInfoPanel');
  if(info){
    info.dataset.stage = String(n);
    info.scrollTop = 0;
  }
  const map = $('stageMap');
  if(map) map.dataset.selected = String(n);
}
function syncStageMapNodeStates(stageNo){
  const n = stageSyncClampStage(stageNo);
  const unlocked = clamp(stageSyncSafeNum(StageMapState?.unlocked, 1), 1, STAGE_MAP_DEFS.length);
  const map = $('stageMap');
  if(map){
    map.dataset.unlocked = String(unlocked);
    map.dataset.selected = String(n);
    map.classList.remove(...Array.from({length:STAGE_MAP_DEFS.length},(_,i)=>`stage-selected-${i+1}`));
    map.classList.add(`stage-selected-${n}`);
  }
  document.querySelectorAll('#stageMap .stageNode').forEach(node => {
    const stage = stageSyncClampStage(node.dataset.stage || 1);
    const isUnlocked = stage <= unlocked;
    const isSelected = stage === n;
    node.classList.toggle('locked', !isUnlocked);
    node.classList.toggle('unlocked', isUnlocked);
    node.classList.toggle('active', isSelected);
    const lock = node.querySelector('.nodeLock');
    if(lock) lock.style.display = isUnlocked ? 'none' : 'block';
    let badge = node.querySelector('.nodeStarRow');
    if(!badge){
      badge = document.createElement('span');
      badge.className = 'nodeStarRow';
      node.appendChild(badge);
    }
    const stars = typeof stageMasteryStars === 'function' ? stageMasteryStars(stage) : 0;
    badge.textContent = stars ? '★'.repeat(stars) + '☆'.repeat(3-stars) : '☆☆☆';
  });
}
function syncStageMapSelectionAndInfo(stageNo, opts={}){
  const n = stageSyncClampStage(stageNo);
  const unlocked = clamp(stageSyncSafeNum(StageMapState?.unlocked, 1), 1, STAGE_MAP_DEFS.length);
  const canEnter = n <= unlocked;
  StageMapState.selected = n;
  if(opts.save !== false) saveStageMapProgress();
  syncStageMapNodeStates(n);
  const def = getStageDef(n);
  const arc = getConstellationArcByStage(n);
  const label = $('stageProgressLabel');
  const sub = $('stageProgressSub');
  const enter = $('stageEnterBtn');
  const hint = $('stageHint');
  if(label) label.textContent = `${TEST_MODE_CONFIG.enabled ? 'TEST MODE · ' : ''}${arc.name} · OPEN ${unlocked} / ${STAGE_MAP_DEFS.length}`;
  if(sub) sub.textContent = `${arc.ko} · ${def.stage}. ${def.name} / ${def.ko} ${canEnter ? '선택됨' : '미개방 미리보기'}`;
  if(enter){
    enter.textContent = canEnter ? `ENTER ${def.stage}. ${def.name}` : `LOCKED · ${def.stage}. ${def.name}`;
    enter.disabled = !canEnter;
    enter.classList.toggle('locked', !canEnter);
  }
  if(hint){
    hint.textContent = stageHintLine(def.stage, canEnter);
  }
  renderStageMapInfo(n);
  syncStageBottomInfo(n);
  if(opts.deck !== false && typeof renderConstellationDeck === 'function') renderConstellationDeck();
  if(typeof window.scheduleStageRouteSync === 'function') window.scheduleStageRouteSync();
}

const _renderStageMapV12FullSync = renderStageMap;
renderStageMap = function(){
  const ret = _renderStageMapV12FullSync.apply(this, arguments);
  syncStageMapSelectionAndInfo(StageMapState.selected, {save:false, deck:false});
  return ret;
};

document.addEventListener('click', function(e){
  const node = e.target.closest && e.target.closest('#stageMap .stageNode');
  if(!node) return;
  e.preventDefault();
  e.stopPropagation();
  if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  const stageNo = stageSyncClampStage(node.dataset.stage || 1);
  syncStageMapSelectionAndInfo(stageNo, {save:true});
}, true);

document.addEventListener('click', function(e){
  const card = e.target.closest && e.target.closest('#stageMap [data-constellation-jump]');
  if(!card) return;
  e.preventDefault();
  e.stopPropagation();
  if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  const stageNo = stageSyncClampStage(card.dataset.constellationJump || 1);
  syncStageMapSelectionAndInfo(stageNo, {save:true});
  if(stageNo > StageMapState.unlocked){
    const arc = getConstellationArcByStage(stageNo);
    toast(`${arc.ko}는 이전 별자리 복원 후 열립니다. 하단 정보는 미리보기로 표시됩니다.`);
  }
}, true);


/* =========================================================
   V14 STAGE MAP POINTER FALLBACK
   - Some route/svg/fog layers can sit above the buttons visually.
   - Any pointer/click inside the map now resolves the nearest stage node.
   - This guarantees the lower panel changes even when the direct button
     event is intercepted by an overlay layer.
   ========================================================= */
function nearestStageNodeFromPoint(clientX, clientY){
  const nodes = Array.from(document.querySelectorAll('#stageMap .stageNode'));
  let best = null;
  let bestDist = Infinity;
  nodes.forEach(node => {
    const rect = node.getBoundingClientRect();
    if(!rect.width || !rect.height) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const d = Math.hypot(dx, dy);
    const radius = Math.max(rect.width, rect.height) * 0.74;
    if(d <= radius && d < bestDist){
      best = node;
      bestDist = d;
    }
  });
  return best;
}
function shouldIgnoreStageMapPointer(e){
  const target = e.target;
  if(!target || !target.closest) return false;
  return !!target.closest('#stageInfoPanel, #stageEnterBtn, #stageMapBack, #constellationDeck, [data-constellation-jump], #stageHint');
}
function handleStageMapPointerSelection(e){
  const map = $('stageMap');
  if(!map || map.style.display === 'none') return;
  if(!e || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
  if(shouldIgnoreStageMapPointer(e)) return;
  if(!e.target.closest || !e.target.closest('#stageMap')) return;
  const direct = e.target.closest('#stageMap .stageNode');
  const node = direct || nearestStageNodeFromPoint(e.clientX, e.clientY);
  if(!node) return;
  e.preventDefault();
  e.stopPropagation();
  if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  const stageNo = stageSyncClampStage(node.dataset.stage || 1);
  syncStageMapSelectionAndInfo(stageNo, {save:true});
}
document.addEventListener('pointerdown', handleStageMapPointerSelection, true);
document.addEventListener('click', handleStageMapPointerSelection, true);

const _showStageMapV12FullSync = showStageMap;
showStageMap = function(){
  const ret = _showStageMapV12FullSync.apply(this, arguments);
  setTimeout(() => syncStageMapSelectionAndInfo(StageMapState.selected, {save:false}), 0);
  return ret;
};

/* V15: keep the lower text block synchronized with the selected stage only. */
function forceLowerTextToSelectedStage(stageNo){
  const n = stageSyncClampStage(stageNo || $('stageMap')?.dataset?.selected || StageMapState?.selected || 1);
  const stage = $('offlineStagePanel');
  if(stage && stage.dataset.stage !== String(n)){
    syncStageBottomInfo(n);
  }else if(stage && !stage.querySelector(`[data-focused-stage="${n}"]`)){
    syncStageBottomInfo(n);
  }
}
function forceSelectStageFromEvent(e){
  const node = e?.target?.closest && e.target.closest('#stageMap .stageNode');
  if(!node) return;
  const n = stageSyncClampStage(node.dataset.stage || 1);
  syncStageMapSelectionAndInfo(n, {save:true});
  forceLowerTextToSelectedStage(n);
}
document.addEventListener('pointerup', forceSelectStageFromEvent, true);
document.addEventListener('touchend', forceSelectStageFromEvent, true);
try{
  const mapForLowerText = $('stageMap');
  if(mapForLowerText){
    new MutationObserver(() => forceLowerTextToSelectedStage()).observe(mapForLowerText, {attributes:true, attributeFilter:['data-selected','class']});
  }
}catch(err){}



window.TowerDefenseGrowth = {
  getSummary(){ return globalSkillSummaryText(); },
  getShards(){ return Math.max(0, Number(META?.shards || 0)); },
  getNextUnlockText(){ return nextGeneralSkillUnlockText(); },
  getUpgrades(){
    return Object.entries(OFFLINE_UPGRADE_CONFIG).map(([key,cfg]) => {
      const lv = Math.max(0, Number(META?.upgrades?.[key] || 0));
      const catalog = getGlobalUpgrade(cfg.catalog || key);
      const unlockStage = Number(cfg.unlockStage || 1);
      const unlocked = isOfflineUpgradeUnlocked(key);
      const max = Number(cfg.max || GLOBAL_UPGRADE_MAX_LEVEL);
      const maxed = lv >= max;
      const cost = offlineUpgradeCost(key);
      return {
        key,
        name: cfg.name,
        desc: cfg.desc,
        type: catalog?.type || '공통',
        color: catalog?.color || '#67e8f9',
        level: lv,
        max,
        cost,
        unlockStage,
        unlocked,
        maxed,
        effect: catalog ? globalUpgradeText(catalog, Math.max(1, lv || 1)) : cfg.desc,
        nextEffect: catalog && !maxed ? globalUpgradeText(catalog, lv + 1) : '',
        icon: catalog?.icon || key
      };
    });
  },
  buy(key){
    const before = Math.max(0, Number(META?.upgrades?.[key] || 0));
    buyOfflineUpgrade(key);
    const after = Math.max(0, Number(META?.upgrades?.[key] || 0));
    return {changed: after > before, before, after, shards: Math.max(0, Number(META?.shards || 0)), summary: globalSkillSummaryText()};
  },
  refresh(){
    renderOfflineMetaPanel();
    if(S){ syncGlobalUpgradesFromMeta(); updateUI(); }
    return {shards: Math.max(0, Number(META?.shards || 0)), summary: globalSkillSummaryText()};
  }
};


window.TowerDefenseCatalog = {
  getTowers(){
    return PLANETS.map((planet, type) => {
      let unlockText = '기본 지급';
      let rewardStage = null;
      if(type === HIDDEN_PLANET_TYPE){
        unlockText = '히든 융합 조건 달성 후 공개';
      }else{
        const rewardEntry = Object.entries(STAGE_TOWER_REWARDS).find(([, reward]) => Number(reward.type) === Number(type));
        if(rewardEntry){
          rewardStage = Number(rewardEntry[0]);
          unlockText = `${rewardStage}성역 클리어 보상`;
        }
      }
      return {
        type,
        id: planet.id,
        name: planet.name,
        role: planet.role,
        identity: planet.identity,
        color: planet.color,
        range: planet.range,
        dmg: planet.dmg,
        cd: planet.cd,
        kind: planet.kind,
        cost: planet.cost,
        card: planet.card,
        tags: Array.isArray(planet.tags) ? planet.tags.slice() : [],
        rewardStage,
        unlockText,
        unlocked: type === HIDDEN_PLANET_TYPE ? !isHiddenLocked() : isTowerUnlocked(type),
        thumb: planetThumbSrc(type, 1)
      };
    });
  },
  getTower(type){
    return this.getTowers().find(t => Number(t.type) === Number(type)) || this.getTowers()[0] || null;
  },
  getTowerSkills(type){
    return towerSkillTree(Number(type)).map((skill, index) => ({
      id: skill.id,
      name: skill.name,
      text: skill.text(1),
      unlockLevel: towerSkillUnlockLevel(index)
    }));
  },
  getGlobalUpgrade(key){
    return getGlobalUpgrade(key);
  },
  getUnlockSummary(){
    return nextTowerRewardText();
  }
};

/* v116: expose the real in-closure navigation/runtime functions to later navigation patches.
   The v111 navigation recovery script lives outside this main game closure. Without these exports,
   its stage-enter handler could only reveal #game and could not call the actual battle initializer,
   leaving the canvas blank. */
window.startSelectedStageFromMap = startSelectedStageFromMap;
window.renderStageMap = renderStageMap;
window.showGalaxyMapClean = (typeof showGalaxyMapClean === 'function') ? showGalaxyMapClean : undefined;
window.bindGalaxyMapClean = (typeof bindGalaxyMapClean === 'function') ? bindGalaxyMapClean : undefined;
window.loadOfflineMeta = loadOfflineMeta;
window.loadStageMapProgress = loadStageMapProgress;
window.applyCanonicalProgressToState = (typeof applyCanonicalProgressToState === 'function') ? applyCanonicalProgressToState : undefined;
window.deriveUnlockedStageFromMeta = (typeof deriveUnlockedStageFromMeta === 'function') ? deriveUnlockedStageFromMeta : undefined;
window.syncStageUnlockFromClears = (typeof syncStageUnlockFromClears === 'function') ? syncStageUnlockFromClears : undefined;
window.refreshScreenStarfields = refreshScreenStarfields;
window.setTestModeEnabled = setTestModeEnabled;
window.applyTestModeOverrides = applyTestModeOverrides;
window.toast = toast;
window.PRD_BATTLE = {
  startSelectedStageFromMap,
  prepareWave,
  reset,
  renderHangar,
  updateUI,
  loop
};

resizeStarfield();
refreshScreenStarfields();
starField.last = performance.now();
starField.raf = requestAnimationFrame(starLoop);
screenStarRaf = requestAnimationFrame(screenStarLoop);
loadOfflineMeta();
reset();
try { renderHangar(); } catch(err) { console.error('renderHangar failed during init', err); }
})();


/* =========================================================
   V17 HARD STAGE DESCRIPTION SYNC
   - This DOM-level guard updates the actually visible stage description area.
   - It runs after the legacy stage-map patches, so older render functions cannot
     leave the description text looking identical between stages.
   ========================================================= */
(function(){
  const STAGE_UI_COPY = {
    1:{name:'COSMIC VOID',ko:'공허 성역',arc:'오리온 외곽 성좌',risk:'LOW',tags:['AURORA','VOID','ENTRY'],summary:'첫 번째 공허 성역입니다. 기본 행성 배치, 장판 활용, 병합 타이밍을 익히는 입문 전장입니다.',enemy:'공허 균열 적은 능력치가 균형형이라 초반 화력 곡선을 확인하기 좋습니다.',strategy:'레이저·블랙홀 계열로 길목을 안정화하고, 3웨이브부터 병합 준비를 시작하세요.',battle:'공허 성역 방어 · 기본 화력 학습',reward:'블랙홀 행성 해금'},
    2:{name:'FROST EXPANSE',ko:'빙결 외곽',arc:'오리온 외곽 성좌',risk:'MEDIUM',tags:['BLIZZARD','FREEZE','CONTROL'],summary:'빙결 외곽은 빠른 적이 섞여 들어오는 제어형 전장입니다. 적을 늦추는 배치가 핵심입니다.',enemy:'빙결 선봉대는 속도 변화가 크고, 후반에는 감속 저항 적이 섞입니다.',strategy:'냉각·감속 장판 근처에 타워를 모아 빠른 적의 돌파를 막으세요.',battle:'빙결 외곽 방어 · 감속 제어전',reward:'서리 행성 해금'},
    3:{name:'LAVA NEBULA',ko:'용암 성운',arc:'오리온 외곽 성좌',risk:'HIGH',tags:['SOLAR','ARMOR','BURN'],summary:'용암 성운은 장갑형 적이 본격적으로 등장하는 화력 검증 스테이지입니다.',enemy:'용암 장갑 적은 단일 저레벨 화력을 오래 버티며 코어로 밀고 들어옵니다.',strategy:'광역 피해와 장갑 돌파 타워를 우선 병합하고, 화력 부족 구간을 장판으로 보완하세요.',battle:'용암 성운 방어 · 장갑 돌파전',reward:'태양 행성 해금'},
    4:{name:'JUNGLE CORE',ko:'생체 정글',arc:'오리온 외곽 성좌',risk:'VERY HIGH',tags:['SPORE','HEAL','DECAY'],summary:'생체 정글은 적이 회복과 증식을 반복하는 장기전 스테이지입니다.',enemy:'포자 군체는 주변 적을 회복시키기 때문에 처치 순서가 중요합니다.',strategy:'재생을 끊는 집중 화력과 지속 피해를 확보해 전선이 밀리지 않게 운영하세요.',battle:'생체 정글 방어 · 재생 차단전',reward:'독성 행성 해금'},
    5:{name:'SMOG WASTELAND',ko:'매연 폐역',arc:'오리온 외곽 성좌',risk:'EXTREME',tags:['SMOG','ARMOR','HAZE'],summary:'매연 폐역은 시야와 방어 효율을 동시에 흔드는 디버프형 전장입니다.',enemy:'매연 은폐 적은 방어선을 흐트러뜨리고 장갑으로 피해를 흡수합니다.',strategy:'감속, 방어 약화, 지속 피해를 겹쳐 은폐 장갑 적을 빠르게 노출시키세요.',battle:'매연 폐역 방어 · 은폐 약화전',reward:'스모그 행성 해금'},
    6:{name:'CRYSTAL NEBULA',ko:'수정 성운',arc:'오리온 외곽 성좌',risk:'EXTREME',tags:['PRISM','CHARGE','RESONANCE'],summary:'수정 성운은 피해가 저장되고 굴절되는 공명형 스테이지입니다.',enemy:'수정 공명체는 초과 피해와 장판 효과를 흔들어 배치 판단을 어렵게 만듭니다.',strategy:'공명 장판과 고레벨 타워를 연결해 한 번에 큰 피해를 넣는 구간을 만드세요.',battle:'수정 성운 방어 · 프리즘 공명전',reward:'수정 행성 해금'},
    7:{name:'MACHINE CORE',ko:'기계 핵성',arc:'오리온 외곽 성좌',risk:'EXTREME+',tags:['MACHINE','SHIELD','REPAIR'],summary:'기계 핵성은 실드와 수리 드론이 전선을 굳히는 방어망 스테이지입니다.',enemy:'기계 실드 유닛은 수리 드론과 함께 등장해 처치 시간을 크게 늘립니다.',strategy:'실드 해체 타워와 집중 화력을 먼저 확보하고, 보스 전에는 병합 레벨을 끌어올리세요.',battle:'기계 핵성 방어 · 실드 해체전',reward:'기계 행성 해금'},
    8:{name:'GRAVITY MAUSOLEUM',ko:'중력 무덤',arc:'백조 균열 성좌',risk:'NIGHTMARE',tags:['GRAVITY','PULL','CONTROL'],summary:'중력 무덤은 죽은 행성의 궤도가 적을 밀집시키고 전장을 왜곡하는 제어 스테이지입니다.',enemy:'중력 왜곡 적은 몰려오거나 갑자기 가속해 방어선의 빈틈을 찌릅니다.',strategy:'군중 제어와 범위 화력을 겹쳐 몰려오는 적을 한 번에 정리하세요.',battle:'중력 무덤 방어 · 군중 제어전',reward:'중력 제어 숙련'},
    9:{name:'THUNDER CORRIDOR',ko:'번개 회랑',arc:'백조 균열 성좌',risk:'NIGHTMARE',tags:['THUNDER','CHAIN','SPEED'],summary:'번개 회랑은 고속 적과 연쇄 충격이 이어지는 속도 압박 스테이지입니다.',enemy:'과전류 고속 적은 짧은 시간에 코어 근처까지 도달할 수 있습니다.',strategy:'초반부터 공격 속도와 연쇄 화력을 확보하고, 길목 앞쪽에 화력을 집중하세요.',battle:'번개 회랑 방어 · 고속 대응전',reward:'과전류 대응 숙련'},
    10:{name:'TIME SHARDS',ko:'시간 잔해',arc:'백조 균열 성좌',risk:'NIGHTMARE+',tags:['TIME','ECHO','REWIND'],summary:'시간 잔해는 과거 웨이브의 잔상이 겹쳐 화력이 분산되는 반복 전장입니다.',enemy:'시간 잔상 적은 같은 구간에 반복 등장해 타워 타겟팅을 흔듭니다.',strategy:'잔상 처리용 범위 화력과 보스 집중 화력을 분리해서 배치하세요.',battle:'시간 잔해 방어 · 잔상 처리전',reward:'시간 역류 대응'},
    11:{name:'SILENT CONSTELLATION',ko:'침묵 성단',arc:'용자리 심연 성좌',risk:'ABYSS',tags:['SILENCE','NULL','STEALTH'],summary:'침묵 성단은 감응 신호가 끊겨 적 특성 파악이 늦어지는 암흑 스테이지입니다.',enemy:'침묵 잠행 적은 반응을 늦추고 암흑 장갑으로 초반 피해를 줄입니다.',strategy:'안정적인 중앙 배치와 범용 화력을 먼저 완성해 정보 제한 구간을 버티세요.',battle:'침묵 성단 방어 · 신호 차단전',reward:'신호 차단 대응'},
    12:{name:'RIFT THRONE',ko:'균열 왕좌',arc:'용자리 심연 성좌',risk:'FINAL',tags:['RIFT KING','HYBRID','ENDGAME'],summary:'균열 왕좌는 이전 성역의 패턴이 모두 합쳐지는 시즌 1 최종 복합전입니다.',enemy:'균열 왕좌 혼합군은 장갑, 재생, 실드, 고속, 잔상 패턴을 순차적으로 압박합니다.',strategy:'핵심 타워를 빠르게 고레벨로 병합하고, 장판·전역 스킬을 모두 활용해야 합니다.',battle:'균열 왕좌 방어 · 최종 복합전',reward:'시즌 1 최종 정화'}
  };
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const clampStage = value => Math.max(1, Math.min(12, Number(value) || 1));
  function selectedStage(){
    const map = $('stageMap');
    const active = document.querySelector('#stageMap .stageNode.active');
    return clampStage(map?.dataset?.selected || active?.dataset?.stage || 1);
  }
  function unlockedStage(){
    const map = $('stageMap');
    return clampStage(map?.dataset?.unlocked || 1);
  }
  function renderTags(copy){
    return copy.tags.map(tag => `<span class="stageTag">${esc(tag)}</span>`).join('');
  }
  function applyStageDescription(stageNo){
    const n = clampStage(stageNo || selectedStage());
    const copy = STAGE_UI_COPY[n] || STAGE_UI_COPY[1];
    const canEnter = n <= unlockedStage();
    const title = $('stageInfoTitle');
    const risk = $('stageInfoRisk');
    const mood = $('stageInfoMood');
    const tags = $('stageInfoTags');
    const hint = $('stageHint');
    const panel = $('stageInfoPanel');
    if(panel) panel.dataset.stage = String(n);
    if(title) title.textContent = `${copy.arc} · ${n}. ${copy.name} / ${copy.ko}`;
    if(risk) risk.textContent = copy.risk;
    if(mood){
      mood.textContent = `${copy.ko} 설명 · ${copy.summary} 적 특성: ${copy.enemy} 추천 전략: ${copy.strategy} 보상: ${copy.reward}`;
      mood.title = mood.textContent;
    }
    if(tags) tags.innerHTML = renderTags(copy);
    if(hint) hint.textContent = `${copy.arc} · ${n}. ${copy.name} / ${copy.ko} — ${canEnter ? '진입 가능' : '미개방 미리보기'}. ${copy.summary} 보상: ${copy.reward}`;
    const bottom = $('offlineStagePanel');
    if(bottom){
      bottom.dataset.stage = String(n);
      bottom.innerHTML = `<div class="stageFocusedNarrative" data-focused-stage="${n}">
        <div class="stageFocusedTop"><div><div class="stageFocusedTitle">${n}장. ${esc(copy.ko)} — 스테이지 설명</div>
        <div class="stageFocusedStory"><b>${esc(copy.name)} / ${esc(copy.ko)}</b> · ${esc(copy.summary)}</div></div></div>
        <div class="stageFocusedMeta"><span class="stageFocusedPill">위험도 ${esc(copy.risk)}</span><span class="stageFocusedPill">${esc(copy.reward)}</span><span class="stageFocusedPill">${esc(copy.battle)}</span></div>
        <div class="stageFocusedBoss"><div><small>ENEMY TRAIT</small><b>${esc(copy.enemy)}</b><span>${esc(copy.strategy)}</span></div></div>
      </div>`;
    }
    const game = $('game');
    if(game && getComputedStyle(game).display !== 'none'){
      const label = $('stageLabel');
      const labelStage = clampStage((label?.textContent || '').split(/[‑-]/)[0] || n);
      const battleCopy = STAGE_UI_COPY[labelStage] || copy;
      const stageType = $('stageType');
      if(stageType){
        stageType.textContent = battleCopy.battle;
        stageType.title = `${battleCopy.summary} ${battleCopy.strategy}`;
      }
    }
  }
  function applyFromEvent(e){
    const node = e?.target?.closest && e.target.closest('#stageMap .stageNode');
    const jump = e?.target?.closest && e.target.closest('#stageMap [data-constellation-jump]');
    const stageNo = node?.dataset?.stage || jump?.dataset?.constellationJump || selectedStage();
    setTimeout(() => applyStageDescription(stageNo), 0);
    setTimeout(() => applyStageDescription(stageNo), 80);
  }
  document.addEventListener('click', applyFromEvent, true);
  document.addEventListener('pointerup', applyFromEvent, true);
  document.addEventListener('touchend', applyFromEvent, true);
  try{
    const map = $('stageMap');
    if(map){
      new MutationObserver(() => setTimeout(() => applyStageDescription(), 0)).observe(map, {attributes:true, attributeFilter:['data-selected','data-unlocked','class']});
    }
  }catch(err){}
  document.addEventListener('DOMContentLoaded', () => {
    applyStageDescription();
    setTimeout(() => applyStageDescription(), 100);
    setTimeout(() => applyStageDescription(), 500);
  });
  setInterval(() => {
    const map = $('stageMap');
    const game = $('game');
    if((map && getComputedStyle(map).display !== 'none') || (game && getComputedStyle(game).display !== 'none')) applyStageDescription();
  }, 700);
})();


/* =========================================================
   V62 clean: fixed route layout
   - Dynamic route recalculation removed to prevent line drift on click.
   - Static SVG paths and CSS gradient are used instead.
   ========================================================= */





/* V18 Stage node caption sync: keep map captions short and non-overlapping. */
const STAGE_NODE_SHORT_LABELS_V18 = {
  1:'COSMIC', 2:'FROST', 3:'LAVA', 4:'JUNGLE',
  5:'SMOG', 6:'CRYSTAL', 7:'MACHINE', 8:'GRAVITY',
  9:'THUNDER', 10:'TIME', 11:'SILENT', 12:'RIFT'
};
function syncStageNodeCaptionsV18(){
  document.querySelectorAll('#stageMap .stageNode').forEach(node => {
    const stageNo = Number(node.dataset.stage || 1);
    const def = typeof getStageDef === 'function' ? getStageDef(stageNo) : null;
    const label = node.querySelector('.nodeLabel');
    if(label){
      label.textContent = STAGE_NODE_SHORT_LABELS_V18[stageNo] || (def?.name || label.textContent || '').split(/\s+/)[0];
      if(def?.name) label.title = def.name;
    }
    const badge = node.querySelector('.nodeStarRow');
    if(badge){
      badge.setAttribute('aria-label', `Stage ${stageNo} mastery stars`);
    }
  });
}
try{
  const _renderStageMapCaptionFixV18 = renderStageMap;
  if(typeof _renderStageMapCaptionFixV18 === 'function'){
    renderStageMap = function(){
      const ret = _renderStageMapCaptionFixV18.apply(this, arguments);
      syncStageNodeCaptionsV18();
      return ret;
    };
  }
}catch(err){
  console.warn('stage node caption sync patch skipped', err);
}
window.addEventListener('DOMContentLoaded', () => {
  syncStageNodeCaptionsV18();
  setTimeout(syncStageNodeCaptionsV18, 80);
  setTimeout(syncStageNodeCaptionsV18, 260);
});


/* V22 Game Over Audio Stop Patch
   - Game over stops current BGM, result BGM, active one-shot SFX, cached HTMLAudio, and WebAudio synth output.
   - Retry starts battle BGM again through the existing stage-entry path.
*/



(function(){
  const $ = (id) => document.getElementById(id);
  const popup = $('towerPopup');
  const list = $('towerPopupList');
  const detail = $('towerPopupDetail');
  const fieldBtn = $('towerMenuBtn');
  const stageBtn = $('stageTowerManageBtn');
  const closeBtn = $('towerPopupClose');
  const wallet = $('towerPopupWallet');
  const tabs = Array.from(document.querySelectorAll('[data-tower-popup-tab]'));
  if(!popup || !list || !detail) return;

  let selectedTowerType = 0;
  let selectedCommonKey = 'global_damage';
  let activeTab = 'tower';

  const COMMON_ICON_DIR = 'assets/images/common_skill_icons';
  const COMMON_DISPLAY_TITLES = {
    global_damage:'전역 공격력 증폭',
    global_crit:'치명타 매트릭스',
    global_speed:'공격속도 동기화',
    global_boss:'보스 해체 프로토콜',
    global_range:'사거리 네트워크',
    global_plate:'장판 증폭 회로',
    global_economy:'전장 회수 시스템'
  };
  const COMMON_SUBTITLES = {
    global_damage:'전체 화력 강화 / 공용 패시브',
    global_crit:'치명 기대값 강화 / 공용 패시브',
    global_speed:'공격 템포 강화 / 공용 패시브',
    global_boss:'보스전 대응 강화 / 공용 패시브',
    global_range:'전장 커버리지 강화 / 공용 패시브',
    global_plate:'장판 운용 강화 / 공용 패시브',
    global_economy:'성장 자원 회수 / 공용 패시브'
  };
  const COMMON_TAGS = {
    global_damage:['공용','패시브','전역 효과'],
    global_crit:['치명','폭발력','전역 효과'],
    global_speed:['공속','템포','전역 효과'],
    global_boss:['보스','관통','후반'],
    global_range:['사거리','배치','커버'],
    global_plate:['장판','전략','증폭'],
    global_economy:['보상','성장','경제']
  };
  const SKILL_ICONS = ['☀','✹','♨'];

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function fmt(v){
    const n = Number(v);
    return Number.isFinite(n) ? String(Math.round(n)) : String(v ?? '-');
  }
  function commonDisplayTitle(u){ return COMMON_DISPLAY_TITLES[u?.key] || u?.name || '공통 연구'; }
  function commonSubtitle(u){ return COMMON_SUBTITLES[u?.key] || `${u?.type || '공통'} 강화 / 공용 패시브`; }
  function commonTags(u){ return COMMON_TAGS[u?.key] || ['공용','패시브']; }
  function commonUnlockText(u){
    const stage = Math.max(1, Number(u?.unlockStage || 1));
    return stage <= 1 ? '기본 연구' : `${stage - 1}성역 클리어 후`;
  }
  function commonIconImg(icon, extra=''){
    const safeIcon = esc(icon || 'global_damage');
    return `<img class="commonResearchImg ${extra}" src="${COMMON_ICON_DIR}/${safeIcon}.svg" alt="" aria-hidden="true" draggable="false" onerror="if(!this.dataset.fallback){this.dataset.fallback=1;this.src=\'common_skill_icons/${safeIcon}.svg\';}">`;
  }
  function renderWallet(){
    if(!wallet) return;
    const api = window.TowerDefenseGrowth;
    const shards = Math.max(0, Number(api?.getShards ? api.getShards() : 0) || 0);
    wallet.innerHTML = `
      <div class="towerWalletItem shard">
        <span>성흔 조각</span>
        <b>${esc(shards.toLocaleString('ko-KR'))}</b>
      </div>`;
  }
  function towerImg(t, cls=''){
    const src = t?.thumb || `assets/images/thumbs/${esc(t?.id || 'solar')}_lv1.webp?v=align2`;
    return `<img class="${cls}" src="${esc(src)}" alt="" aria-hidden="true" draggable="false">`;
  }
  function tagsHtml(tags){
    return (Array.isArray(tags) ? tags : []).map(tag => `<span class="tag">${esc(tag)}</span>`).join('');
  }
  function kindText(kind){
    const map = {splash:'광역 폭발형', slow:'감속 제어형', chain:'연쇄 공격형', poison:'지속 피해형', gravity:'군중 제어형', beam:'관통 저격형', crystal:'축전 공명형', mecha:'실드 해체형', crit:'치명 폭발형'};
    return map[kind] || kind || '전투형';
  }
  function getCatalog(){ return window.TowerDefenseCatalog; }
  function getTowers(){
    const api = getCatalog();
    if(api && typeof api.getTowers === 'function') return api.getTowers();
    return [];
  }
  function getTower(type){
    return getTowers().find(t => Number(t.type) === Number(type)) || getTowers()[0] || null;
  }
  function getTowerSkills(type){
    const api = getCatalog();
    if(api && typeof api.getTowerSkills === 'function') return api.getTowerSkills(type);
    return [];
  }
  function commonEffectFor(u, level){
    const lv = Math.max(1, Number(level || 1));
    try{
      const catalog = getCatalog()?.getGlobalUpgrade?.(u?.key || u?.icon);
      if(catalog && typeof catalog.text === 'function') return catalog.text(lv);
    }catch(err){}
    if(lv <= Number(u?.level || 0)) return u?.effect || '';
    if(lv === Number(u?.level || 0) + 1) return u?.nextEffect || '';
    return `${commonDisplayTitle(u)} Lv.${lv}`;
  }
  function commonTimelineHtml(u){
    const max = Math.max(1, Number(u?.max || 1));
    const current = Math.max(0, Number(u?.level || 0));
    const activeLv = Math.min(max, current > 0 ? current : 1);
    let start = Math.max(1, activeLv - 2);
    start = Math.min(start, Math.max(1, max - 3));
    const rows = [];
    for(let lv=start; lv<=Math.min(max, start+3); lv++){
      const done = current >= lv;
      const now = current === lv || (!current && lv === 1);
      const next = current + 1 === lv;
      const cls = done ? 'done' : (now || next ? 'current' : 'locked');
      const state = done ? '완료' : (next || now ? (u?.unlocked ? '연구 가능' : '잠금') : '대기');
      rows.push(`<div class="commonTimelineRow ${cls}"><b>Lv.${esc(lv)}</b><span>${esc(commonEffectFor(u, lv))}</span><em>${state}</em></div>`);
    }
    return `<div class="commonTimeline"><h3 class="commonTimelineTitle">연구 단계</h3><div class="commonTimelineList">${rows.join('')}</div></div>`;
  }
  function lockShell(inner, title, reason){
    return `<div class="armoryLockedShell"><div class="armoryMasked">${inner}</div><div class="armoryLockOverlay"><div class="armoryLockBox"><div class="armoryLockIcon">🔒</div><b>${esc(title)}</b><span>${esc(reason)}</span></div></div></div>`;
  }
  function genericLockedTowerDetail(t){
    const unlock = t?.unlockText || '성역 클리어 후 공개';
    const masked = `
      <div class="armoryTowerHero" style="--planet-color:#7dd3fc">
        <div class="armoryTowerThumb">${towerImg(t)}</div>
        <div><h2 class="armoryTowerTitle">미개방 행성</h2><div class="armoryTowerRole">??? / ??? / ???</div><div class="armoryTags"><span class="tag">정보 잠금</span><span class="tag">성역 보상</span></div></div>
      </div>
      <div class="armoryStatGrid"><div class="armoryStat"><small>활성 조건</small><b>${esc(unlock)}</b></div><div class="armoryStat"><small>전투 역할</small><b>???</b></div><div class="armoryStat"><small>스킬 정보</small><b>???</b></div></div>
      <div class="armorySection"><h3>스킬 정보</h3><p>성역을 클리어하기 전까지 이 행성의 상세 스킬 정보는 표시되지 않습니다.</p></div>`;
    return lockShell(masked, '행성 정보 잠금', `${unlock} 달성 후 행성 스킬 정보가 공개됩니다.`);
  }
  function towerSkillRows(t){
    const skills = getTowerSkills(t.type);
    if(!skills.length) return `<p>등록된 고유 스킬 정보가 없습니다.</p>`;
    return `<div class="armorySkillList">${skills.map((skill, idx) => `
      <div class="armorySkillRow">
        <b>Lv.${esc(skill.unlockLevel)}</b>
        <span class="skillIcon" style="color:${esc(t.color)};text-shadow:0 0 14px ${esc(t.color)}66">${SKILL_ICONS[idx] || '✦'}</span>
        <div><strong>${esc(skill.name)}</strong><span>${esc(skill.text)} · 해금 스킬</span></div>
      </div>`).join('')}</div>`;
  }
  function renderTowerDetail(type){
    const t = getTower(type);
    if(!t){
      detail.innerHTML = '<div class="towerPopupEmpty">타워 데이터를 불러오지 못했습니다.</div>';
      return;
    }
    selectedTowerType = Number(t.type);
    Array.from(list.querySelectorAll('[data-tower-type]')).forEach(el => el.classList.toggle('active', Number(el.dataset.towerType) === selectedTowerType));
    if(!t.unlocked){
      detail.innerHTML = genericLockedTowerDetail(t);
      return;
    }
    const activeText = t.unlocked ? '활성화됨' : '잠금';
    detail.innerHTML = `
      <div class="armoryTowerHero v82Hero" style="--planet-color:${esc(t.color)}">
        <div class="armoryTowerThumb">${towerImg(t)}</div>
        <div>
          <h2 class="armoryTowerTitle">${esc(t.name)}</h2>
          <div class="armoryTowerRole">${esc(t.role)} / ${esc(kindText(t.kind))}</div>
          <div class="armoryTags">${tagsHtml(t.tags)}</div>
        </div>
      </div>
      <div class="armoryQuickGrid towerQuickGrid">
        <div class="armoryQuickCard highlight"><small>활성</small><b>${esc(activeText)}</b></div>
        <div class="armoryQuickCard"><small>조건</small><b>${esc(t.unlockText || '기본 지급')}</b></div>
        <div class="armoryQuickCard"><small>타입</small><b>${esc(kindText(t.kind))}</b></div>
        <div class="armoryQuickCard"><small>공격</small><b>${esc(fmt(t.dmg))}</b></div>
        <div class="armoryQuickCard"><small>사거리</small><b>${esc(fmt(t.range))}</b></div>
        <div class="armoryQuickCard"><small>주기/비용</small><b>${esc(fmt(t.cd))} / ${esc(fmt(t.cost))}</b></div>
      </div>
      <div class="armorySection compact"><h3>역할과 운용</h3><p><b style="color:${esc(t.color)}">${esc(t.role)}</b> — ${esc(t.identity)}</p></div>
      <div class="armorySection compact"><h3>타워별 고유 스킬</h3>${towerSkillRows(t)}</div>`;
  }
  function buildTowerList(){
    list.classList.remove('commonList');
    const towers = getTowers();
    if(!towers.length){
      list.innerHTML = '<div class="towerPopupEmpty">타워 데이터를 불러오지 못했습니다.</div>';
      detail.innerHTML = '<div class="towerPopupEmpty">게임 데이터를 초기화한 뒤 다시 열어주세요.</div>';
      return;
    }
    if(!towers.some(t => Number(t.type) === Number(selectedTowerType))) selectedTowerType = towers[0].type;
    list.innerHTML = towers.map(t => `
      <button class="towerPopupItem ${Number(t.type) === Number(selectedTowerType) ? 'active' : ''} ${t.unlocked ? '' : 'locked'}" type="button" data-tower-type="${esc(t.type)}" aria-label="${esc(t.unlocked ? t.name : '미개방 행성')}" title="${esc(t.unlocked ? t.name : t.unlockText)}">
        <div class="towerPopupThumb">${towerImg(t, 'towerPopupThumbImg')}</div>
      </button>`).join('');
    const selected = towers.find(t => Number(t.type) === Number(selectedTowerType));
    const preferred = (selected && selected.unlocked) ? selected : (towers.find(t => t.unlocked) || selected || towers[0]);
    selectedTowerType = Number(preferred.type);
    renderTowerDetail(preferred.type);
  }
  function buildCommonResearch(){
    list.classList.add('commonList');
    const api = window.TowerDefenseGrowth;
    if(!api || typeof api.getUpgrades !== 'function'){
      list.innerHTML = '<div class="towerPopupEmpty">공통 연구 데이터를 불러오지 못했습니다.</div>';
      detail.innerHTML = '<div class="towerPopupEmpty">게임 데이터를 초기화한 뒤 다시 열어주세요.</div>';
      return;
    }
    const upgrades = api.getUpgrades();
    if(!upgrades.length){
      list.innerHTML = '<div class="towerPopupEmpty">공통 연구가 없습니다.</div>';
      detail.innerHTML = '<div class="towerPopupEmpty">표시할 연구 정보가 없습니다.</div>';
      return;
    }
    if(!upgrades.some(u => u.key === selectedCommonKey)) selectedCommonKey = upgrades[0].key;
    list.innerHTML = upgrades.map(u => `
      <button class="commonResearchItem ${u.key === selectedCommonKey ? 'active' : ''} ${u.unlocked ? '' : 'locked'} ${u.maxed ? 'maxed' : ''}" style="--skill-color:${esc(u.color)}" type="button" data-common-research-select="${esc(u.key)}" aria-label="${esc(u.unlocked ? commonDisplayTitle(u) : '미개방 공통 연구')}" title="${esc(u.unlocked ? commonDisplayTitle(u) : `${commonUnlockText(u)} 열림`)}">
        ${commonIconImg(u.icon)}
      </button>`).join('');
    const preferred = upgrades.find(u => u.key === selectedCommonKey) || upgrades.find(u => u.unlocked && !u.maxed) || upgrades.find(u => u.unlocked) || upgrades[0];
    renderCommonDetail(preferred.key);
  }
  function renderLockedCommonDetail(u){
    const unlockText = commonUnlockText(u);
    const title = commonDisplayTitle(u);
    const subtitle = commonSubtitle(u);
    const tags = commonTags(u);
    detail.innerHTML = `
      <div class="lockedResearchPolish" style="--skill-color:${esc(u.color)}">
        <div class="lockedResearchHero">
          <div class="lockedResearchIconWrap">
            ${commonIconImg(u.icon, 'hero')}
            <span class="lockedResearchLock" aria-hidden="true">🔒</span>
          </div>
          <div class="lockedResearchCopy">
            <div class="lockedResearchKicker">LOCKED COMMON RESEARCH</div>
            <h2 class="lockedResearchTitle">${esc(title)}</h2>
            <p class="lockedResearchDesc">${esc(unlockText)} 연구 정보와 업그레이드가 열립니다.</p>
            <div class="armoryTags lockedResearchTags">${tagsHtml(tags)}</div>
          </div>
        </div>
        <div class="lockedResearchInfoGrid">
          <div><small>해금 조건</small><b>${esc(unlockText)}</b></div>
          <div><small>현재 상태</small><b>잠금</b></div>
          <div><small>연구 타입</small><b>${esc(subtitle)}</b></div>
        </div>
        <div class="lockedResearchNotice">성역을 진행하면 이 슬롯의 상세 효과와 업그레이드 버튼이 자동으로 활성화됩니다.</div>
      </div>`;
  }
  function renderCommonDetail(key){
    const api = window.TowerDefenseGrowth;
    const upgrades = api?.getUpgrades ? api.getUpgrades() : [];
    const u = upgrades.find(x => x.key === key) || upgrades[0];
    if(!u){
      detail.innerHTML = '<div class="towerPopupEmpty">표시할 공통 연구가 없습니다.</div>';
      return;
    }
    selectedCommonKey = u.key;
    renderWallet();
    Array.from(list.querySelectorAll('[data-common-research-select]')).forEach(el => el.classList.toggle('active', el.dataset.commonResearchSelect === u.key));
    if(!u.unlocked){
      renderLockedCommonDetail(u);
      return;
    }
    const shards = Number(api.getShards ? api.getShards() : 0) || 0;
    const cost = Number(u.cost || 0) || 0;
    const canBuy = u.unlocked && !u.maxed && shards >= cost;
    const need = Math.max(0, cost - shards);
    const tags = commonTags(u);
    const costText = u.maxed ? 'MAX' : `${esc(cost.toLocaleString('ko-KR'))} 조각`;
    detail.innerHTML = `
      <div class="armoryCommonHero v82Hero" style="--skill-color:${esc(u.color)}">
        <div class="armoryCommonIcon">${commonIconImg(u.icon, 'hero')}</div>
        <div>
          <h2 class="armoryCommonTitle">${esc(commonDisplayTitle(u))}</h2>
          <div class="armoryCommonSubtitle">${esc(commonSubtitle(u))}</div>
          <div class="armoryTags">${tagsHtml(tags)}</div>
        </div>
      </div>
      <div class="armoryUpgradeDock" style="--skill-color:${esc(u.color)}">
        <div><small>NEXT UPGRADE</small><b>${u.maxed ? '최대 연구 완료' : esc(u.nextEffect)}</b><span>${u.maxed ? '해당 연구의 모든 보너스가 적용 중입니다.' : `비용 ${costText} · 보유 ${esc(shards.toLocaleString('ko-KR'))} 조각`}</span></div>
        <button class="commonResearchBuy" type="button" data-common-research-buy="${esc(u.key)}" ${canBuy ? '' : 'disabled'}>${u.maxed ? 'MAX' : (canBuy ? `업그레이드` : `조각 부족`)}</button>
      </div>
      <div class="commonInfoPanel">
        <div class="commonInfoGrid">
          <div class="commonInfoItem highlight"><small>현재 레벨</small><b>Lv.${esc(u.level)}</b></div>
          <div class="commonInfoItem"><small>현재 효과</small><b>${esc(u.level > 0 ? u.effect : '아직 연구 없음')}</b></div>
          <div class="commonInfoItem"><small>다음 효과</small><b>${esc(u.maxed ? '최대 연구 완료' : u.nextEffect)}</b></div>
          <div class="commonInfoItem"><small>업그레이드 비용</small><b>${costText}</b></div>
        </div>
      </div>
      <div class="armorySection compact"><h3>스킬 정보</h3><p>${esc(u.desc)}</p></div>
      ${commonTimelineHtml(u)}`;
  }
  function setActiveTab(tab){
    renderWallet();
    activeTab = tab === 'common' ? 'common' : 'tower';
    popup.dataset.activeTab = activeTab;
    tabs.forEach(btn => {
      const on = btn.dataset.towerPopupTab === activeTab;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if(activeTab === 'common') buildCommonResearch();
    else buildTowerList();
  }
  function openPopup(tab='common'){
    renderWallet();
    popup.classList.add('open');
    requestAnimationFrame(refreshScreenStarfields);
    popup.setAttribute('aria-hidden','false');
    setActiveTab(tab);
  }
  function closePopup(){
    popup.classList.remove('open');
    popup.setAttribute('aria-hidden','true');
  }

  fieldBtn?.addEventListener('click', () => openPopup('common'));
  stageBtn?.addEventListener('click', () => openPopup('common'));
  tabs.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn.dataset.towerPopupTab)));
  closeBtn?.addEventListener('click', closePopup);
  popup.addEventListener('click', (e) => {
    if(e.target && e.target.matches('[data-tower-popup-close]')) closePopup();
    const tower = e.target.closest?.('[data-tower-type]');
    if(tower && activeTab === 'tower'){
      e.preventDefault();
      renderTowerDetail(tower.dataset.towerType);
      return;
    }
    const select = e.target.closest?.('[data-common-research-select]');
    if(select && activeTab === 'common'){
      e.preventDefault();
      renderCommonDetail(select.dataset.commonResearchSelect);
      return;
    }
    const buy = e.target.closest?.('[data-common-research-buy]');
    if(buy && activeTab === 'common'){
      e.preventDefault();
      e.stopPropagation();
      if(buy.disabled) return;
      const key = buy.dataset.commonResearchBuy;
      const api = window.TowerDefenseGrowth;
      if(api && typeof api.buy === 'function') api.buy(key);
      if(api && typeof api.refresh === 'function') api.refresh();
      renderWallet();
      selectedCommonKey = key;
      buildCommonResearch();
      renderCommonDetail(key);
    }
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && popup.classList.contains('open')) closePopup();
  });

  // 전투/맵 저장 상태가 바뀌어도 열린 탭의 활성/잠금 상태를 갱신한다.
  let refreshTimer = null;
  const scheduleRefresh = () => {
    if(!popup.classList.contains('open')) return;
    // v167: when the rebuilt armory controller is active, the legacy refresh
    // must not overwrite the user's current tab/content during gameplay ticks.
    if(window.__armoryControllerRebuildV164) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => activeTab === 'common' ? buildCommonResearch() : buildTowerList(), 120);
  };
  const hangar = $('hangar');
  if(hangar){
    new MutationObserver(scheduleRefresh).observe(hangar, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style','data-level']});
  }
  window.addEventListener('storage', scheduleRefresh);
})();


(function(){
  const popup=document.getElementById('towerPopup');
  const detail=document.getElementById('towerPopupDetail');
  const list=document.getElementById('towerPopupList');
  if(!popup||!detail||!list) return;
  function resetScroll(){ requestAnimationFrame(()=>{ detail.scrollTop=0; }); }
  popup.addEventListener('click', (e)=>{
    if(e.target.closest('[data-tower-type],[data-common-research-select],[data-tower-popup-tab]')) resetScroll();
  }, true);
  // v99: no MutationObserver scroll reset; game-loop DOM refresh must not jump the user's scroll.
})();


(function(){
  const popup=document.getElementById('towerPopup');
  const detail=document.getElementById('towerPopupDetail');
  if(!popup||!detail) return;
  function reset(){requestAnimationFrame(()=>{detail.scrollTop=0;});}
  popup.addEventListener('click',e=>{if(e.target.closest('[data-tower-type],[data-common-research-select],[data-tower-popup-tab]')) reset();},true);
  // v99: no MutationObserver scroll reset; preserve manual scroll during active gameplay.
})();


(function(){
  const popup = document.getElementById('towerPopup');
  const detail = document.getElementById('towerPopupDetail');
  if(!popup || !detail || detail.dataset.v96ScrollGuard === '1') return;
  detail.dataset.v96ScrollGuard = '1';
  detail.addEventListener('wheel', function(e){
    const max = detail.scrollHeight - detail.clientHeight;
    if(max <= 0) return;
    const next = Math.max(0, Math.min(max, detail.scrollTop + e.deltaY));
    if(next !== detail.scrollTop){
      detail.scrollTop = next;
      e.preventDefault();
      e.stopPropagation();
    }
  }, {passive:false});
  detail.addEventListener('keydown', function(e){
    const max = detail.scrollHeight - detail.clientHeight;
    if(max <= 0) return;
    const step = 72;
    if(e.key === 'PageDown'){ detail.scrollTop = Math.min(max, detail.scrollTop + detail.clientHeight * .86); e.preventDefault(); }
    if(e.key === 'PageUp'){ detail.scrollTop = Math.max(0, detail.scrollTop - detail.clientHeight * .86); e.preventDefault(); }
    if(e.key === 'End'){ detail.scrollTop = max; e.preventDefault(); }
    if(e.key === 'Home'){ detail.scrollTop = 0; e.preventDefault(); }
    if(e.key === 'ArrowDown'){ detail.scrollTop = Math.min(max, detail.scrollTop + step); e.preventDefault(); }
    if(e.key === 'ArrowUp'){ detail.scrollTop = Math.max(0, detail.scrollTop - step); e.preventDefault(); }
  });
  const oldSet = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHTML');
  // no monkey patch: simply make detail focusable for keyboard scroll when popup opens/clicks
  detail.setAttribute('tabindex','0');
})();


(function(){
  const popup = document.getElementById('towerPopup');
  const detail = document.getElementById('towerPopupDetail');
  const list = document.getElementById('towerPopupList');
  if(!popup || !detail || detail.dataset.v99ScrollStability === '1') return;
  detail.dataset.v99ScrollStability = '1';

  let explicitSwitch = false;
  let lastDetailTop = 0;
  let lastListTop = 0;
  let restoreRaf = 0;

  function maxScroll(el){ return Math.max(0, el.scrollHeight - el.clientHeight); }
  function remember(){
    if(detail) lastDetailTop = detail.scrollTop || 0;
    if(list) lastListTop = list.scrollTop || 0;
  }
  function restore(){
    cancelAnimationFrame(restoreRaf);
    restoreRaf = requestAnimationFrame(() => {
      if(explicitSwitch){
        detail.scrollTop = 0;
        if(list) list.scrollTop = lastListTop;
        explicitSwitch = false;
        lastDetailTop = 0;
        return;
      }
      detail.scrollTop = Math.min(lastDetailTop, maxScroll(detail));
      if(list) list.scrollTop = Math.min(lastListTop, maxScroll(list));
    });
  }

  detail.addEventListener('scroll', remember, {passive:true});
  if(list) list.addEventListener('scroll', remember, {passive:true});

  popup.addEventListener('pointerdown', (e) => {
    if(e.target.closest('[data-tower-type],[data-common-research-select],[data-tower-popup-tab]')){
      explicitSwitch = true;
      lastDetailTop = 0;
      lastListTop = list ? list.scrollTop : 0;
    }
  }, true);

  // Some runtime HUD/tick updates rebuild the detail DOM while the popup is open.
  // Preserve scroll unless the user explicitly selected another tower/research/tab.
  new MutationObserver(restore).observe(detail, {childList:true, subtree:false});

  // Expose a safe reset API for explicit open/selection flows only.
  window.__armoryResetDetailScroll = function(){ explicitSwitch = true; restore(); };
})();


(function(){
  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }
  ready(function(){
    const stageBtn = document.getElementById('stageTowerManageBtn');
    const fieldBtn = document.getElementById('towerMenuBtn');
    if(stageBtn){
      stageBtn.setAttribute('aria-label','강화 관리');
      stageBtn.setAttribute('title','강화 관리');
      const txt = stageBtn.querySelector('span');
      if(txt) txt.setAttribute('aria-hidden','true');
      // 기존 핸들러가 common 탭으로 열더라도, 성좌 지도 우측 타워 버튼은 타워 탭으로 통일한다.
      stageBtn.addEventListener('click', function(){
        setTimeout(function(){
          const towerTab = document.querySelector('[data-tower-popup-tab="tower"]');
          if(towerTab) towerTab.click();
        }, 0);
      }, true);
    }
    if(fieldBtn){
      fieldBtn.setAttribute('aria-label','강화 관리');
      fieldBtn.setAttribute('title','강화 관리');
    }
  });
})();


(function(){
  const popup = document.getElementById('towerPopup');
  const detail = document.getElementById('towerPopupDetail');
  if(!popup || !detail) return;
  // 전투 루프 중 팝업 콘텐츠가 갱신되어 스크롤이 튀는 현상을 줄이기 위해,
  // 실제 탭/아이템 선택 때만 스크롤을 위로 돌린다.
  let userScrolling = false;
  detail.addEventListener('scroll', () => {
    userScrolling = true;
    clearTimeout(detail.__scrollStableTimer);
    detail.__scrollStableTimer = setTimeout(() => { userScrolling = false; }, 180);
  }, {passive:true});
  popup.addEventListener('click', (e)=>{
    const changed = e.target.closest('[data-tower-popup-tab], [data-tower-type], [data-common-research-select]');
    if(changed){ requestAnimationFrame(()=>{ detail.scrollTop = 0; }); }
  }, true);
})();


(function(){
  function goGalaxy(e){
    if(e){ e.preventDefault(); e.stopImmediatePropagation(); }
    if(window.PRD_NAV && typeof window.PRD_NAV.showGalaxy === 'function'){
      window.PRD_NAV.showGalaxy();
      return;
    }
    var stage=document.getElementById('stageMap');
    var galaxy=document.getElementById('galaxyMap');
    var game=document.getElementById('game');
    var menu=document.getElementById('menu');
    if(stage) stage.style.display='none';
    if(game) game.style.display='none';
    if(menu) menu.style.display='none';
    if(galaxy){
      galaxy.style.display='block';
      galaxy.classList.add('cleanVisible');
      galaxy.dataset.selectedGalaxy='milky-rift';
    }
    try{ if(typeof refreshScreenStarfields === 'function') refreshScreenStarfields(); }catch(_){}
  }
  function bind(){
    var back=document.getElementById('stageMapBack');
    if(!back) return;
    back.textContent='← 갤럭시 맵';
    back.setAttribute('type','button');
    back.setAttribute('aria-label','갤럭시 맵으로 돌아가기');
    back.style.display='inline-flex';
    back.style.visibility='visible';
    back.style.opacity='1';
    back.style.pointerEvents='auto';
    if(back.dataset.v117GalaxyBackBound !== '1'){
      back.dataset.v117GalaxyBackBound='1';
      back.addEventListener('click', goGalaxy, true);
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
  window.addEventListener('load', bind, {once:true});
  document.addEventListener('click', function(){ setTimeout(bind,0); }, true);
})();


(function(){
  function apply(){
    var stageTower=document.getElementById('stageTowerManageBtn');
    if(stageTower){
      stageTower.setAttribute('aria-hidden','true');
      stageTower.tabIndex=-1;
      stageTower.style.display='none';
      stageTower.style.pointerEvents='none';
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', apply, {once:true}); else apply();
  window.addEventListener('load', apply, {once:true});
})();


(function(){
  function bindStageTowerButton(){
    var towerBtn = document.getElementById('stageTowerManageBtn');
    if(!towerBtn || towerBtn.dataset.v101TowerBound === '1') return;
    towerBtn.dataset.v101TowerBound = '1';
    towerBtn.setAttribute('aria-label','강화 관리');
    towerBtn.setAttribute('title','강화 관리');
    towerBtn.addEventListener('click', function(){
      window.setTimeout(function(){
        var towerTab = document.querySelector('[data-tower-popup-tab="tower"]');
        if(towerTab) towerTab.click();
      }, 0);
    }, true);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindStageTowerButton, {once:true});
  }else{
    bindStageTowerButton();
  }
  window.addEventListener('load', bindStageTowerButton, {once:true});
})();


(function(){
  const popup = document.getElementById('towerPopup');
  const detail = document.getElementById('towerPopupDetail');
  if(!popup || !detail) return;
  // 전투 루프 중 팝업 콘텐츠가 갱신되어 스크롤이 튀는 현상을 줄이기 위해,
  // 실제 탭/아이템 선택 때만 스크롤을 위로 돌린다.
  let userScrolling = false;
  detail.addEventListener('scroll', () => {
    userScrolling = true;
    clearTimeout(detail.__scrollStableTimer);
    detail.__scrollStableTimer = setTimeout(() => { userScrolling = false; }, 180);
  }, {passive:true});
  popup.addEventListener('click', (e)=>{
    const changed = e.target.closest('[data-tower-popup-tab], [data-tower-type], [data-common-research-select]');
    if(changed){ requestAnimationFrame(()=>{ detail.scrollTop = 0; }); }
  }, true);
})();


(function(){
  'use strict';
  const byId = (id) => document.getElementById(id);
  let userNavigated = false;

  function safe(fn){ try { return fn && fn(); } catch(err){ console.warn('[v111 nav]', err); } }
  function refreshStars(){ safe(() => typeof refreshScreenStarfields === 'function' && refreshScreenStarfields()); }

  function setScreen(name){
    const menu = byId('menu');
    const galaxy = byId('galaxyMap');
    const stage = byId('stageMap');
    const game = byId('game');
    if(menu) menu.style.display = name === 'menu' ? 'flex' : 'none';
    if(galaxy){
      galaxy.style.display = name === 'galaxy' ? 'block' : 'none';
      galaxy.classList.toggle('cleanVisible', name === 'galaxy');
    }
    if(stage) stage.style.display = name === 'stage' ? 'block' : 'none';
    if(game) game.style.display = name === 'game' ? 'flex' : 'none';
    if(name !== 'game') safe(() => typeof stopAllGameAudio === 'function' && stopAllGameAudio());
    requestAnimationFrame(refreshStars);
  }

  function showMenu(){
    userNavigated = true;
    safe(() => typeof setTestModeEnabled === 'function' && setTestModeEnabled(false));
    setScreen('menu');
  }

  function showGalaxy(){
    userNavigated = true;
    safe(() => typeof loadOfflineMeta === 'function' && loadOfflineMeta());
    safe(() => typeof loadStageMapProgress === 'function' && loadStageMapProgress());
    const galaxy = byId('galaxyMap');
    if(galaxy) galaxy.dataset.selectedGalaxy = 'milky-rift';
    const label = byId('galaxyProgressLabel');
    const sub = byId('galaxyProgressSub');
    if(label) label.textContent = 'MILKY RIFT · 1 / 4 GALAXIES';
    if(sub) sub.textContent = '현재는 은하수 균열 은하만 개방되어 있습니다.';
    setScreen('galaxy');
    safe(() => typeof playMapBgm === 'function' && audio && audio.on && playMapBgm());
  }

  function showStage(){
    userNavigated = true;
    safe(() => typeof loadOfflineMeta === 'function' && loadOfflineMeta());
    safe(() => typeof loadStageMapProgress === 'function' && loadStageMapProgress());
    const back = byId('stageMapBack');
    if(back) back.textContent = '← GALAXY';
    setScreen('stage');
    safe(() => typeof renderStageMap === 'function' && renderStageMap());
    safe(() => typeof playMapBgm === 'function' && audio && audio.on && playMapBgm());
  }

  function enterStageOnly(){
    userNavigated = true;
    if(typeof startSelectedStageFromMap === 'function'){
      startSelectedStageFromMap();
      requestAnimationFrame(refreshStars);
      return;
    }
    setScreen('game');
  }

  function bindClick(id, fn){
    const el = byId(id);
    if(!el) return;
    el.onclick = null;
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      fn();
    }, true);
  }

  function bindNavigation(){
    bindClick('startBtn', function(){
      safe(() => typeof setTestModeEnabled === 'function' && setTestModeEnabled(false));
      showGalaxy();
    });
    bindClick('testModeBtn', function(){
      safe(() => typeof applyTestModeOverrides === 'function' && applyTestModeOverrides());
      showGalaxy();
      safe(() => typeof toast === 'function' && toast('TEST MODE 활성화 — 모든 성역과 기본 타워가 해금되었습니다'));
    });
    bindClick('galaxyEnterBtn', showStage);
    bindClick('galaxyMapBack', showMenu);
    bindClick('stageMapBack', showGalaxy);
    bindClick('stageGalaxyBtn', showGalaxy);
    bindClick('stageEnterBtn', enterStageOnly);

    document.querySelectorAll('#galaxyNodeLayer .galaxyNode[data-galaxy-id]').forEach(node => {
      node.addEventListener('click', function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        if(node.dataset.galaxyId === 'milky-rift') return;
        safe(() => typeof toast === 'function' && toast('아직 미개방 은하입니다. 현재는 MILKY RIFT만 입장 가능합니다.'));
      }, true);
    });

    const towerBtn = byId('stageTowerManageBtn');
    if(towerBtn){
      towerBtn.addEventListener('click', function(){
        setTimeout(function(){
          const towerTab = document.querySelector('[data-tower-popup-tab="tower"]');
          if(towerTab) towerTab.click();
        }, 0);
      }, true);
    }
  }

  function boot(){
    bindNavigation();
    // 최초 진입은 기존 메인 화면 유지. 전투 화면 자동 진입만 차단한다.
    if(!userNavigated) setScreen('menu');
    refreshStars();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  window.addEventListener('load', function(){ if(!userNavigated) setScreen('menu'); refreshStars(); }, {once:true});

  window.PRD_NAV = {showMenu, showGalaxy, showStage, enterStageOnly};
})();


(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{ return fn && fn(); }catch(err){ console.warn('[v116 battle enter]', err); } }
  function hardStartBattle(e){
    if(e){ e.preventDefault(); e.stopImmediatePropagation(); }
    if(typeof window.startSelectedStageFromMap === 'function'){
      window.startSelectedStageFromMap();
      setTimeout(function(){ safe(function(){ if(typeof window.PRD_BATTLE?.updateUI === 'function') window.PRD_BATTLE.updateUI(); }); }, 0);
      return;
    }
    var stage = byId('stageMap');
    var game = byId('game');
    if(stage) stage.style.display = 'none';
    if(game) game.style.display = 'flex';
  }
  function bind(){
    var enter = byId('stageEnterBtn');
    if(enter && enter.dataset.v116BattleEnterBound !== '1'){
      enter.dataset.v116BattleEnterBound = '1';
      enter.addEventListener('click', hardStartBattle, true);
    }
    var back = byId('stageMapBack');
    if(back) back.textContent = '← 갤럭시 맵';
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
  window.addEventListener('load', bind, {once:true});
  document.addEventListener('click', function(){ setTimeout(bind, 0); }, true);
})();


(function(){
  function applyStageBackLabel(){
    var back = document.getElementById('stageMapBack');
    if(back) back.textContent = '← 갤럭시 맵';
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyStageBackLabel, {once:true});
  else applyStageBackLabel();
  window.addEventListener('load', applyStageBackLabel, {once:true});
  document.addEventListener('click', function(){ setTimeout(applyStageBackLabel, 0); }, true);
})();


(function(){
  function goGalaxy(e){
    if(e){ e.preventDefault(); e.stopImmediatePropagation(); }
    if(window.PRD_NAV && typeof window.PRD_NAV.showGalaxy === 'function'){
      window.PRD_NAV.showGalaxy();
      return;
    }
    var stage=document.getElementById('stageMap');
    var galaxy=document.getElementById('galaxyMap');
    var game=document.getElementById('game');
    var menu=document.getElementById('menu');
    if(stage) stage.style.display='none';
    if(game) game.style.display='none';
    if(menu) menu.style.display='none';
    if(galaxy){
      galaxy.style.display='block';
      galaxy.classList.add('cleanVisible');
      galaxy.dataset.selectedGalaxy='milky-rift';
    }
    try{ if(typeof refreshScreenStarfields === 'function') refreshScreenStarfields(); }catch(_){}
  }
  function bind(){
    var back=document.getElementById('stageMapBack');
    if(!back) return;
    back.textContent='← 갤럭시 맵';
    back.setAttribute('type','button');
    back.setAttribute('aria-label','갤럭시 맵으로 돌아가기');
    back.style.display='inline-flex';
    back.style.visibility='visible';
    back.style.opacity='1';
    back.style.pointerEvents='auto';
    if(back.dataset.v117GalaxyBackBound !== '1'){
      back.dataset.v117GalaxyBackBound='1';
      back.addEventListener('click', goGalaxy, true);
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
  window.addEventListener('load', bind, {once:true});
  document.addEventListener('click', function(){ setTimeout(bind,0); }, true);
})();


(function(){
  function apply(){
    var back=document.getElementById('stageMapBack');
    if(!back) return;
    back.textContent='← 갤럭시 맵';
    back.classList.add('stageBackBtn');
    back.setAttribute('type','button');
    back.setAttribute('aria-label','갤럭시 맵으로 돌아가기');
    back.style.display='inline-flex';
    back.style.visibility='visible';
    back.style.opacity='1';
    back.style.pointerEvents='auto';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', apply, {once:true}); else apply();
  window.addEventListener('load', apply, {once:true});
  document.addEventListener('click', function(){ setTimeout(apply,0); }, true);
})();


(function(){
  function apply(){
    var stageTower=document.getElementById('stageTowerManageBtn');
    if(stageTower){
      stageTower.setAttribute('aria-hidden','true');
      stageTower.tabIndex=-1;
      stageTower.style.display='none';
      stageTower.style.pointerEvents='none';
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', apply, {once:true}); else apply();
  window.addEventListener('load', apply, {once:true});
})();


(function(){
  'use strict';
  function apply(){
    var back=document.getElementById('stageMapBack');
    if(!back) return;
    back.textContent='← GALAXY MAP';
    back.classList.add('stageBackBtn');
    back.setAttribute('type','button');
    back.setAttribute('aria-label','Back to Galaxy Map');
    back.style.display='inline-flex';
    back.style.visibility='visible';
    back.style.opacity='1';
    back.style.pointerEvents='auto';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', apply, {once:true}); else apply();
  window.addEventListener('load', apply, {once:true});
  document.addEventListener('click', function(){ setTimeout(apply,0); }, true);
  document.addEventListener('keyup', function(){ setTimeout(apply,0); }, true);
})();


(function(){
  function apply(){
    var back=document.getElementById('stageMapBack');
    if(back){
      back.textContent='← GALAXY MAP';
      back.setAttribute('aria-label','Back to Galaxy Map');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', apply, {once:true}); else apply();
  window.addEventListener('load', apply, {once:true});
})();




/* v21: safe combat-only controls. Keep stage/map navigation untouched. */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function ensureStyle(){
    if(document.getElementById('v21-safe-combat-only-controls')) return;
    var style=document.createElement('style');
    style.id='v21-safe-combat-only-controls';
    style.textContent="body:not(.prd-combat-ui-active) #combatHudOverlay,body:not(.prd-combat-ui-active) #combatHudTopLine,body:not(.prd-combat-ui-active) #combatHudCommands,body:not(.prd-combat-ui-active) #battleHud,body:not(.prd-combat-ui-active) #side > .battleActions,body:not(.prd-combat-ui-active) #field > .fieldTopControls,body:not(.prd-combat-ui-active) #pauseDecisionOverlay,body.prd-map-ui-active #combatHudOverlay,body.prd-map-ui-active #combatHudTopLine,body.prd-map-ui-active #combatHudCommands,body.prd-map-ui-active #battleHud,body.prd-map-ui-active #side > .battleActions,body.prd-map-ui-active #field > .fieldTopControls,body.prd-map-ui-active #pauseDecisionOverlay{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudTopLine,body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands,body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudOverlay,body.prd-combat-ui-active:not(.prd-map-ui-active) #field > .fieldTopControls{visibility:visible!important;opacity:1!important;pointer-events:auto!important;}";
    document.head.appendChild(style);
  }
  function visible(el){
    if(!el) return false;
    var cs = window.getComputedStyle ? getComputedStyle(el) : null;
    if(cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    return !!(r && r.width > 4 && r.height > 4);
  }
  function setCombatUi(active){
    ensureStyle();
    var menuVisible = visible(byId('menu')) || visible(byId('galaxyMap')) || visible(byId('stageMap')) || visible(byId('stageClearOverlay'));
    var finalActive = !!active && !menuVisible;
    document.body.classList.toggle('prd-combat-ui-active', finalActive);
    document.body.classList.toggle('prd-map-ui-active', !finalActive);
    document.body.classList.toggle('prd-battle-active', finalActive);
    document.body.classList.toggle('prd-combat-screen-active', finalActive);
    document.body.classList.remove('prd-non-combat-screen');
    var game=byId('game');
    if(game){
      game.classList.toggle('prd-combat-ui-active', finalActive);
      game.classList.toggle('prd-battle-active', finalActive);
      game.classList.toggle('prd-combat-screen-active', finalActive);
      game.dataset.combatScreenActive = finalActive ? '1' : '0';
    }
    var field=byId('field'); if(field) field.dataset.battleActive = finalActive ? '1':'0';
    var pause=byId('pauseDecisionOverlay');
    if(pause && !finalActive){ pause.hidden=true; pause.setAttribute('aria-hidden','true'); pause.classList.remove('open'); }
  }
  function computeCombatActive(){
    return visible(byId('game')) && !(visible(byId('menu')) || visible(byId('galaxyMap')) || visible(byId('stageMap')) || visible(byId('stageClearOverlay')));
  }
  function sync(){ setCombatUi(computeCombatActive()); }
  function deferSync(){ sync(); if(window.requestAnimationFrame) requestAnimationFrame(sync); setTimeout(sync,60); setTimeout(sync,180); }
  function wrapFunction(name, mode){
    var fn=window[name];
    if(typeof fn !== 'function' || fn.__prdCombatUiWrapped) return;
    var wrapped=function(){
      if(mode === 'beforeOff') setCombatUi(false);
      var ret=fn.apply(this, arguments);
      if(mode === 'battleOn'){ setTimeout(function(){ setCombatUi(true); },0); setTimeout(sync,80); setTimeout(sync,220); }
      else { setTimeout(function(){ setCombatUi(false); },0); setTimeout(sync,80); }
      return ret;
    };
    wrapped.__prdCombatUiWrapped=true;
    window[name]=wrapped;
    try{ eval(name + ' = window[name]'); }catch(_){ }
  }
  function install(){
    ensureStyle();
    wrapFunction('startSelectedStageFromMap','battleOn');
    wrapFunction('showStageMap','beforeOff');
    wrapFunction('showGalaxyMapClean','beforeOff');
    wrapFunction('returnMainFromGalaxyClean','beforeOff');
    wrapFunction('enterMilkyRiftClean','beforeOff');
    wrapFunction('completeStageFromBattle','beforeOff');
    if(window.PauseDecisionMenu && typeof window.PauseDecisionMenu.quit === 'function' && !window.PauseDecisionMenu.quit.__prdCombatUiWrapped){
      var quit=window.PauseDecisionMenu.quit;
      window.PauseDecisionMenu.quit=function(){ var ret=quit.apply(this,arguments); setTimeout(function(){ setCombatUi(false); },0); setTimeout(sync,80); return ret; };
      window.PauseDecisionMenu.quit.__prdCombatUiWrapped=true;
    }
    deferSync();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install, {once:true}); else install();
  window.addEventListener('load', install, {once:true});
  window.addEventListener('resize', deferSync, {passive:true});
  window.addEventListener('orientationchange', deferSync, {passive:true});
  document.addEventListener('click', function(){ setTimeout(deferSync,0); }, true);
  document.addEventListener('keyup', function(){ setTimeout(deferSync,0); }, true);
  window.PRD_SET_COMBAT_UI_ACTIVE=setCombatUi;
  window.PRD_SYNC_BATTLE_HUD_VISIBILITY=sync;
  window.PRD_SYNC_STRICT_COMBAT_UI=sync;
})();

// v24: restore canvas pointer hit-test while keeping combat HUD/buttons visible.
(function(){
  if(document.getElementById('v24-canvas-pointer-through-combat-hud')) return;
  var style=document.createElement('style');
  style.id='v24-canvas-pointer-through-combat-hud';
  style.textContent="body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudOverlay{visibility:visible!important;opacity:1!important;pointer-events:none!important;}body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudTopLine{visibility:visible!important;opacity:1!important;pointer-events:none!important;}body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands,body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands *,body.prd-combat-ui-active:not(.prd-map-ui-active) #field > .fieldTopControls,body.prd-combat-ui-active:not(.prd-map-ui-active) #field > .fieldTopControls *,body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudTopLine .fieldTopControls,body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudTopLine .fieldTopControls *,body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudTopLine #combatHudButtons,body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudTopLine #combatHudButtons *{pointer-events:auto!important;}#canvas,canvas#canvas{pointer-events:auto!important;touch-action:none!important;}";
  document.head.appendChild(style);
})();


// v227: final pause decision menu. Battle-only, does not touch map/stage navigation buttons.
(function(){
  if(!document.getElementById('v227-pause-decision-menu-final')){
    var st=document.createElement('style');
    st.id='v227-pause-decision-menu-final';
    st.textContent="\nbody.prd-v27-pause-installed #pauseDecisionOverlay{display:none!important;visibility:hidden!important;pointer-events:none!important;}\n#pauseDecisionOverlayV27{\n  position:fixed!important;\n  inset:0!important;\n  z-index:2147483000!important;\n  display:flex!important;\n  align-items:center!important;\n  justify-content:center!important;\n  padding:18px!important;\n  background:radial-gradient(circle at 50% 38%, rgba(103,232,249,.16), transparent 36%), rgba(2,6,23,.72)!important;\n  backdrop-filter:blur(10px)!important;\n  pointer-events:auto!important;\n}\n#pauseDecisionOverlayV27[hidden]{display:none!important;}\n#pauseDecisionOverlayV27 .pauseV27Card{\n  width:min(440px, calc(100vw - 36px))!important;\n  padding:24px 24px 22px!important;\n  border-radius:24px!important;\n  border:1px solid rgba(103,232,249,.3)!important;\n  background:linear-gradient(180deg, rgba(8,18,38,.98), rgba(3,7,21,.94))!important;\n  box-shadow:0 28px 90px rgba(0,0,0,.62), inset 0 0 26px rgba(56,189,248,.08)!important;\n  color:#f8fafc!important;\n  text-align:center!important;\n  font-family:Pretendard,system-ui,sans-serif!important;\n}\n#pauseDecisionOverlayV27 .pauseV27Kicker{\n  margin-bottom:8px!important;\n  color:#67e8f9!important;\n  font-family:'Orbitron',Pretendard,system-ui,sans-serif!important;\n  font-size:11px!important;\n  letter-spacing:.2em!important;\n}\n#pauseDecisionOverlayV27 h2{\n  margin:0!important;\n  font-family:'Orbitron',Pretendard,system-ui,sans-serif!important;\n  font-size:clamp(24px, 4vw, 36px)!important;\n  letter-spacing:.06em!important;\n  color:#fff!important;\n  text-shadow:0 0 18px rgba(103,232,249,.34)!important;\n}\n#pauseDecisionOverlayV27 p{\n  margin:12px auto 0!important;\n  max-width:360px!important;\n  color:#cbd5e1!important;\n  font-size:13px!important;\n  line-height:1.62!important;\n  word-break:keep-all!important;\n}\n#pauseDecisionOverlayV27 .pauseV27Actions{\n  display:grid!important;\n  grid-template-columns:1fr 1fr!important;\n  gap:10px!important;\n  margin-top:22px!important;\n}\n#pauseDecisionOverlayV27 button{\n  min-height:48px!important;\n  border-radius:16px!important;\n  border:1px solid rgba(103,232,249,.26)!important;\n  font-family:'Orbitron',Pretendard,system-ui,sans-serif!important;\n  font-size:12px!important;\n  font-weight:900!important;\n  cursor:pointer!important;\n  color:#f8fafc!important;\n  background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(2,6,23,.86))!important;\n  box-shadow:inset 0 0 14px rgba(56,189,248,.07), 0 8px 24px rgba(0,0,0,.28)!important;\n}\n#pauseDecisionOverlayV27 #pauseQuitBtnV27{\n  border-color:rgba(248,113,113,.36)!important;\n  background:linear-gradient(180deg,rgba(127,29,29,.40),rgba(30,7,12,.90))!important;\n}\n#pauseDecisionOverlayV27 #pauseResumeBtnV27{\n  border-color:rgba(34,197,94,.42)!important;\n  background:linear-gradient(180deg,rgba(16,185,129,.30),rgba(5,46,22,.90))!important;\n}\n#pauseDecisionOverlayV27 button:hover{transform:translateY(-1px)!important;filter:brightness(1.08)!important;}\n@media (orientation:portrait){\n  #pauseDecisionOverlayV27 .pauseV27Card{width:min(360px, calc(100vw - 28px))!important;padding:22px 18px 18px!important;}\n  #pauseDecisionOverlayV27 .pauseV27Actions{grid-template-columns:1fr!important;gap:8px!important;}\n  #pauseDecisionOverlayV27 button{min-height:44px!important;}\n}\n";
    document.head.appendChild(st);
  }
})();

(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{ return fn && fn(); }catch(err){ console.warn('[v227 pause]', err); return null; } }
  function isVisible(el){
    if(!el) return false;
    var st = window.getComputedStyle ? getComputedStyle(el) : null;
    if(st && (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0)) return false;
    var rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    return !rect || (rect.width > 2 && rect.height > 2);
  }
  function isBattleVisible(){
    var game = byId('game');
    if(!isVisible(game)) return false;
    if(isVisible(byId('stageMap')) || isVisible(byId('galaxyMap')) || isVisible(byId('menu')) || isVisible(byId('stageClearOverlay'))) return false;
    return true;
  }
  function hideLegacyPauseOverlay(){
    var legacy = byId('pauseDecisionOverlay');
    if(legacy){ legacy.setAttribute('hidden',''); legacy.classList.remove('open'); }
  }
  function ensureOverlay(){
    document.body.classList.add('prd-v27-pause-installed');
    hideLegacyPauseOverlay();
    var overlay = byId('pauseDecisionOverlayV27');
    if(overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'pauseDecisionOverlayV27';
    overlay.setAttribute('hidden','');
    overlay.innerHTML = '<div class="pauseV27Card" role="dialog" aria-modal="true" aria-labelledby="pauseDecisionTitleV27">'
      + '<div class="pauseV27Kicker">BATTLE PAUSED</div>'
      + '<h2 id="pauseDecisionTitleV27">일시정지</h2>'
      + '<p>전투가 멈춰 있습니다. 현재 전투를 종료하고 이전 스테이지 화면으로 돌아가거나, 그대로 이어서 진행할 수 있습니다.</p>'
      + '<div class="pauseV27Actions">'
      + '<button id="pauseQuitBtnV27" type="button">게임 종료하기</button>'
      + '<button id="pauseResumeBtnV27" type="button">계속 이어서하기</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){ if(e.target === overlay) e.preventDefault(); }, true);
    var resume = byId('pauseResumeBtnV27');
    var quit = byId('pauseQuitBtnV27');
    if(resume) resume.addEventListener('click', resumeBattle, true);
    if(quit) quit.addEventListener('click', quitBattle, true);
    return overlay;
  }
  function showPauseMenu(e){
    if(e){ e.preventDefault(); e.stopImmediatePropagation(); }
    if(!isBattleVisible() || !window.S || S.gameOver) return;
    var overlay = ensureOverlay();
    S.paused = true;
    overlay.removeAttribute('hidden');
    document.body.classList.add('prd-pause-menu-open');
    safe(function(){ if(typeof updateUI === 'function') updateUI(); });
    var resume = byId('pauseResumeBtnV27');
    if(resume) setTimeout(function(){ safe(function(){ resume.focus({preventScroll:true}); }); }, 20);
  }
  function hidePauseMenu(){
    var overlay = byId('pauseDecisionOverlayV27');
    if(overlay) overlay.setAttribute('hidden','');
    document.body.classList.remove('prd-pause-menu-open');
    hideLegacyPauseOverlay();
  }
  function resumeBattle(e){
    if(e){ e.preventDefault(); e.stopImmediatePropagation(); }
    hidePauseMenu();
    if(window.S && !S.gameOver){
      S.paused = false;
      safe(function(){ if(typeof updateUI === 'function') updateUI(); });
      safe(function(){ if(typeof toast === 'function') toast('전투 재개'); });
    }
  }
  function cleanupBattleState(){
    safe(function(){ if(typeof cancelAnimationFrame === 'function' && typeof raf !== 'undefined') cancelAnimationFrame(raf); });
    safe(function(){ if(typeof removeGameOverOverlay === 'function') removeGameOverOverlay(); });
    safe(function(){ if(typeof stopAllGameAudio === 'function') stopAllGameAudio(); else if(typeof stopStageBgm === 'function') stopStageBgm(); });
    if(window.S){
      S.paused = true;
      S.active = false;
      S.skillModalOpen = false;
      S.gameOver = true;
      S.runEnded = true;
    }
    safe(function(){ if(typeof resetBattleUnitsForStageMap === 'function') resetBattleUnitsForStageMap(); });
    safe(function(){ selected = -1; dragging = null; });
  }
  function showPreviousStagePage(){
    document.body.classList.remove('prd-combat-ui-active','prd-battle-active','prd-pause-menu-open');
    document.body.classList.add('prd-map-ui-active');
    if(window.PRD_NAV && typeof PRD_NAV.showStage === 'function'){
      PRD_NAV.showStage();
      return;
    }
    var game = byId('game');
    var menu = byId('menu');
    var galaxy = byId('galaxyMap');
    var stage = byId('stageMap');
    if(game) game.style.display = 'none';
    if(menu) menu.style.display = 'none';
    if(galaxy) galaxy.style.display = 'none';
    if(stage){ stage.style.display = 'block'; stage.classList.add('premiumStage'); }
    safe(function(){ if(typeof renderStageMap === 'function') renderStageMap(); });
    safe(function(){ if(typeof playMapBgm === 'function' && window.audio && audio.on) playMapBgm(); });
  }
  function quitBattle(e){
    if(e){ e.preventDefault(); e.stopImmediatePropagation(); }
    hidePauseMenu();
    cleanupBattleState();
    showPreviousStagePage();
    safe(function(){ if(typeof toast === 'function') toast('전투 종료 — 스테이지 화면으로 이동'); });
  }
  function bindPauseButton(){
    var pauseBtn = byId('pauseBtn');
    if(!pauseBtn || pauseBtn.dataset.pauseDecisionFinal === '1') return;
    pauseBtn.dataset.pauseDecisionFinal = '1';
    pauseBtn.addEventListener('click', showPauseMenu, true);
    pauseBtn.onclick = function(ev){ showPauseMenu(ev); };
  }
  function bind(){
    ensureOverlay();
    bindPauseButton();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
  window.addEventListener('load', bind, {once:true});
  setTimeout(bind, 300);
  setTimeout(bind, 1200);
  document.addEventListener('click', function(){ setTimeout(bind, 0); }, true);
  document.addEventListener('keydown', function(e){
    if(e.repeat || e.code !== 'Space' || !isBattleVisible() || !window.S || S.gameOver) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    showPauseMenu(e);
  }, true);
  window.PauseDecisionMenuV27 = {show:showPauseMenu, hide:hidePauseMenu, resume:resumeBattle, quit:quitBattle};
})();



// v32 landscape short command labels

(function(){
  if(window.PRD_V32_LANDSCAPE_SHORT_COMMAND_LABELS) return;
  window.PRD_V32_LANDSCAPE_SHORT_COMMAND_LABELS = true;

  function injectStyle(){
    if(document.getElementById('v32-landscape-short-command-label-css')) return;
    var style=document.createElement('style');
    style.id='v32-landscape-short-command-label-css';
    style.textContent = `
@media (orientation: landscape){
  #combatHudCommandsLandscapeDock .hudProxyBtn{
    font-size:9px !important;
    letter-spacing:-.035em !important;
    padding-left:8px !important;
    padding-right:8px !important;
    white-space:nowrap !important;
    text-overflow:ellipsis !important;
  }
  #combatHudCommandsLandscapeDock #hudProxy_landscape_summon{
    font-size:8.5px !important;
  }
}`;
    (document.head || document.documentElement).appendChild(style);
  }

  function textOf(id){
    var el=document.getElementById(id);
    return el ? (el.textContent || '').replace(/\s+/g,' ').trim() : '';
  }
  function setProxy(action, shortText, fullText){
    var btn=document.getElementById('hudProxy_landscape_' + action);
    if(!btn || !shortText) return;
    if(btn.textContent !== shortText) btn.textContent = shortText;
    if(fullText){
      btn.title = fullText;
      btn.setAttribute('aria-label', fullText);
    }
  }
  function summonShort(full){
<<<<<<< HEAD
    if(!full) return '';
    var cost = full.replace(/^\s*랜덤\s*소환\s*/,'').trim();
    return cost ? ('소환 ' + cost) : '소환';
=======
    // v46: button label is fixed to a single word. Prevent "소환 소환" when source text is already "소환".
    return '소환';
>>>>>>> 5988c15 (v004)
  }
  function applyShortLandscapeLabels(){
    injectStyle();
    var summonFull=textOf('summonBtn');
<<<<<<< HEAD
    var mergeFull=textOf('mergeBtn') || '타워 합치기';
    var speedFull=textOf('speedBtn') || '1x';
    var pauseFull=textOf('pauseBtn') || '일시정지';

    setProxy('summon', summonShort(summonFull), summonFull || '랜덤 소환');
    setProxy('merge', '합치기', mergeFull);
    setProxy('speed', speedFull, speedFull);
    setProxy('pause', /재개/.test(pauseFull) ? '재개' : '정지', pauseFull);
=======
    var mergeFull=textOf('mergeBtn') || '합치기';
    var speedFull=textOf('speedBtn') || '1x';
    var pauseFull=textOf('pauseBtn') || '정지';

    setProxy('summon', '소환', summonFull || '소환');
    setProxy('merge', '합치기', mergeFull || '합치기');
    setProxy('speed', speedFull, speedFull);
    setProxy('pause', '정지', pauseFull || '정지');
>>>>>>> 5988c15 (v004)
  }

  var raf=0;
  function schedule(){
    if(raf) cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){ raf=0; applyShortLandscapeLabels(); });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', schedule, {once:true});
  }else{
    schedule();
  }
  window.addEventListener('load', schedule, {once:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('orientationchange', schedule, {passive:true});
  document.addEventListener('click', function(){ setTimeout(schedule, 0); }, true);

  try{
    var mo = new MutationObserver(schedule);
    mo.observe(document.documentElement, {childList:true, subtree:true, characterData:true});
  }catch(_e){}

  setTimeout(schedule, 100);
  setTimeout(schedule, 500);
  setInterval(applyShortLandscapeLabels, 250);
})();



// v33 landscape right-edge tighten
(function(){
  if(window.PRD_V33_LANDSCAPE_RIGHT_EDGE_TIGHTEN) return;
  window.PRD_V33_LANDSCAPE_RIGHT_EDGE_TIGHTEN = true;
  function inject(){
    if(document.getElementById('v33-landscape-right-edge-tighten-css')) return;
    var style=document.createElement('style');
    style.id='v33-landscape-right-edge-tighten-css';
    style.textContent = `
@media (orientation: landscape){
  #combatHudTopLine{
    right:8px !important;
    left:12px !important;
  }
  #combatHudCommands{
    right:4px !important;
    bottom:8px !important;
  }
}`;
    (document.head || document.documentElement).appendChild(style);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject, {once:true});
  else inject();
  window.addEventListener('load', inject, {once:true});
  setTimeout(inject, 200);
})();


// v34 compact top HUD and no selection block
(function(){
  if(window.PRD_V34_COMPACT_TOP_HUD_NO_SELECTION_BLOCK) return;
  window.PRD_V34_COMPACT_TOP_HUD_NO_SELECTION_BLOCK = true;
  function inject(){
    if(document.getElementById('v34-compact-top-hud-no-selection-block')) return;
    var style=document.createElement('style');
    style.id='v34-compact-top-hud-no-selection-block';
    style.textContent = `/* v34: shrink battle top HUD so grid/tower selection remains visible and clickable. */
#combatHudTopLine,
#combatHudTopLine #combatHudLeft,
#combatHudTopLine #combatHudRight,
#combatHudTopLine #combatHudMeta,
#combatHudTopLine #combatHudStatsWrap,
#combatHudTopLine .battleStageLine,
#combatHudTopLine .battleStatLine,
#combatHudTopLine .battleStatLine .stat,
#combatHudTopLine .compactWave,
#combatHudTopLine .bar.compactWave{
  pointer-events:none !important;
}
#combatHudTopLine #combatHudButtons,
#combatHudTopLine .fieldTopControls,
#combatHudTopLine .fieldTopControls *,
#combatHudTopLine #combatHudButtons *{
  pointer-events:auto !important;
}
@media (orientation: landscape){
  #field{
    --hud-edge-y:5px !important;
    --hud-edge-x:8px !important;
    --hud-top-gap:clamp(4px,.7vw,8px) !important;
    --hud-item-gap:clamp(3px,.5vw,6px) !important;
  }
  #combatHudTopLine{
    top:5px !important;
    left:8px !important;
    right:6px !important;
    gap:clamp(4px,.7vw,8px) !important;
    align-items:flex-start !important;
    max-height:26px !important;
  }
  #combatHudTopLine #combatHudLeft{
    flex:0 0 clamp(104px, 12vw, 152px) !important;
    max-width:clamp(104px, 12vw, 152px) !important;
    gap:3px !important;
  }
  #combatHudTopLine .battleStageLine{
    height:22px !important;
    min-height:22px !important;
    max-height:22px !important;
    padding:0 8px !important;
    border-radius:999px !important;
  }
  #combatHudTopLine .battleStageLine .value{
    font-size:clamp(10px,1.05vw,14px) !important;
    letter-spacing:-.055em !important;
  }
  #combatHudTopLine .compactWave,
  #combatHudTopLine .bar.compactWave{
    height:2px !important;
    min-height:2px !important;
    margin-top:2px !important;
    border-width:0 !important;
    opacity:.78 !important;
  }
  #combatHudTopLine .battleStatLine.statGrid{
    gap:clamp(3px,.45vw,6px) !important;
  }
  #combatHudTopLine .battleStatLine .stat{
    height:22px !important;
    min-height:22px !important;
    max-height:22px !important;
    min-width:clamp(30px,3.8vw,50px) !important;
    max-width:clamp(38px,5.4vw,68px) !important;
    padding:0 6px !important;
    gap:2px !important;
  }
  #combatHudTopLine .battleStatLine .value,
  #combatHudTopLine .battleStatLine #exp{
    font-size:clamp(9px,1vw,12px) !important;
    letter-spacing:-.055em !important;
  }
  #combatHudTopLine .battleStatLine .miniBar{
    flex-basis:16px !important;
    width:16px !important;
    height:2px !important;
  }
  #combatHudTopLine .fieldTopControls .fieldIconBtn,
  #combatHudTopLine .fieldTopControls #towerMenuBtn,
  #combatHudTopLine .fieldTopControls #audioBtn{
    width:26px !important;
    height:26px !important;
    min-width:26px !important;
    min-height:26px !important;
    max-width:26px !important;
    max-height:26px !important;
    flex:0 0 26px !important;
  }
  #combatHudTopLine .fieldTopControls .fieldIconBtn img,
  #combatHudTopLine .fieldTopControls #towerMenuBtn img,
  #combatHudTopLine .fieldTopControls #audioBtn img{
    width:13px !important;
    height:13px !important;
  }
}
@media (orientation: portrait){
  #combatHudTopLine{
    top:8px !important;
  }
  #combatHudTopLine .battleStageLine{
    height:28px !important;
    min-height:28px !important;
    max-height:28px !important;
  }
  #combatHudTopLine .battleStatLine .stat{
    height:28px !important;
    min-height:28px !important;
    max-height:28px !important;
  }
  #combatHudTopLine .fieldTopControls .fieldIconBtn,
  #combatHudTopLine .fieldTopControls #towerMenuBtn,
  #combatHudTopLine .fieldTopControls #audioBtn{
    width:34px !important;
    height:34px !important;
    min-width:34px !important;
    min-height:34px !important;
    max-width:34px !important;
    max-height:34px !important;
    flex-basis:34px !important;
  }
}`;
    (document.head || document.documentElement).appendChild(style);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject, {once:true});
  else inject();
  window.addEventListener('load', inject, {once:true});
  setTimeout(inject, 200);
  setTimeout(inject, 1000);
})();


/* v35: field pointer bridge + hit-test guard for bundled script builds. */
(function(){
  'use strict';
  if(window.__PRD_V35_FIELD_POINTER_BRIDGE__) return;
  window.__PRD_V35_FIELD_POINTER_BRIDGE__ = true;
  var bridging = false;
  var fieldActive = false;
  function byId(id){ return document.getElementById(id); }
  function visible(el){
    if(!el) return false;
    var cs = window.getComputedStyle ? getComputedStyle(el) : null;
    if(cs && (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0)) return false;
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    return !!(r && r.width > 4 && r.height > 4);
  }
  function isCombatScreen(){
    var body = document.body;
    if(body && body.classList && body.classList.contains('prd-map-ui-active')) return false;
    if(body && body.classList && body.classList.contains('prd-combat-ui-active')) return true;
    return visible(byId('game')) && visible(byId('field')) && !visible(byId('menu')) && !visible(byId('galaxyMap')) && !visible(byId('stageMap'));
  }
  function pointFromEvent(e){
    if(!e) return null;
    var t = e.touches && e.touches.length ? e.touches[0] : (e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e);
    if(typeof t.clientX !== 'number' || typeof t.clientY !== 'number') return null;
    return {x:t.clientX, y:t.clientY};
  }
  function insideField(p){
    var field = byId('field');
    if(!field || !p) return false;
    var r = field.getBoundingClientRect();
    return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
  }
  function isRealControlTarget(target){
    if(!target || !target.closest) return false;
    return !!target.closest('#combatHudCommands,#combatHudButtons,.fieldTopControls,#towerPopup,#pauseDecisionOverlay,#pauseDecisionOverlayV27,#pauseDecisionOverlayV29,#gameOverOverlay,button,a,input,select,textarea,[role="button"]');
  }
  function dispatchCanvasMouse(type, source){
    var canvas = byId('canvas');
    var p = pointFromEvent(source);
    if(!canvas || !p) return false;
    var ev = new MouseEvent(type, {bubbles:true,cancelable:true,view:window,clientX:p.x,clientY:p.y,screenX:source.screenX||p.x,screenY:source.screenY||p.y,button:source.button||0,buttons:type==='mouseup'?0:(source.buttons||1),ctrlKey:!!source.ctrlKey,shiftKey:!!source.shiftKey,altKey:!!source.altKey,metaKey:!!source.metaKey});
    try{ Object.defineProperty(ev, '__prdFieldBridgeSynthetic', {value:true}); }catch(_){ ev.__prdFieldBridgeSynthetic = true; }
    bridging = true;
    try{ canvas.dispatchEvent(ev); } finally{ bridging = false; }
    return true;
  }
  function shouldBridge(e){
    if(bridging || e.__prdFieldBridgeSynthetic) return false;
    if(!isCombatScreen()) return false;
    var canvas = byId('canvas');
    if(!canvas) return false;
    var p = pointFromEvent(e);
    if(!insideField(p)) return false;
    if(e.target === canvas) return false;
    if(isRealControlTarget(e.target)) return false;
    return true;
  }
  function begin(e){
    if(!isCombatScreen()) return;
    var p = pointFromEvent(e);
    if(!insideField(p)) return;
    fieldActive = true;
    if(shouldBridge(e)){
      dispatchCanvasMouse('mousedown', e);
      if(e.cancelable) e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
  }
  function move(e){
    if(!fieldActive || !isCombatScreen()) return;
    var p = pointFromEvent(e);
    if(!insideField(p)) return;
    if(e.target && e.target.id === 'canvas') return;
    if(isRealControlTarget(e.target)) return;
    dispatchCanvasMouse('mousemove', e);
    if(e.cancelable) e.preventDefault();
  }
  function end(e){
    if(!fieldActive) return;
    fieldActive = false;
    if(!isCombatScreen()) return;
    var p = pointFromEvent(e);
    if(insideField(p) && !isRealControlTarget(e.target)) dispatchCanvasMouse('mousemove', e);
  }
  document.addEventListener('mousedown', begin, true);
  document.addEventListener('mousemove', move, true);
  window.addEventListener('mouseup', end, true);
  document.addEventListener('touchstart', begin, {capture:true, passive:false});
  document.addEventListener('touchmove', move, {capture:true, passive:false});
  window.addEventListener('touchend', end, {capture:true, passive:false});
  window.addEventListener('blur', function(){ fieldActive = false; }, true);
})();


// v37: shield battlefield from stale invisible original command buttons.
(function(){
  'use strict';
  if(window.PRD_V37_ORIGINAL_COMMAND_HITBOX_FIX) return;
  window.PRD_V37_ORIGINAL_COMMAND_HITBOX_FIX = true;

  function byId(id){ return document.getElementById(id); }
  function injectCss(){
    if(document.getElementById('v37-fix-original-command-hitbox-runtime')) return;
    var st=document.createElement('style');
    st.id='v37-fix-original-command-hitbox-runtime';
    st.textContent = `
#combatHudCommands,#combatHudCommands .battleActions,#combatHudCommands .battleActions .row,#combatHudCommands .battleActions .row3{position:fixed!important;left:-10000px!important;top:-10000px!important;right:auto!important;bottom:auto!important;width:1px!important;height:1px!important;min-width:1px!important;min-height:1px!important;max-width:1px!important;max-height:1px!important;margin:0!important;padding:0!important;overflow:hidden!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;z-index:-1!important;transform:none!important;clip-path:inset(50%)!important;}
#combatHudCommands *,#combatHudCommands #summonBtn,#combatHudCommands #mergeBtn,#combatHudCommands #speedBtn,#combatHudCommands #pauseBtn{opacity:0!important;visibility:hidden!important;pointer-events:none!important;}
#combatHudCommandsLandscapeDock,#combatHudCommandsPortraitDock,#combatHudCommandsLandscapeDock *,#combatHudCommandsPortraitDock *{opacity:1!important;visibility:visible!important;pointer-events:auto!important;clip-path:none!important;}
@media (orientation:landscape){#combatHudCommandsLandscapeDock{display:block!important;right:4px!important;bottom:8px!important;z-index:80!important;}#combatHudCommandsPortraitDock{display:none!important;}}
@media (orientation:portrait){#combatHudCommandsPortraitDock{display:block!important;z-index:80!important;}#combatHudCommandsLandscapeDock{display:none!important;}}`;
    (document.head||document.documentElement).appendChild(st);
  }
  function visible(el){
    if(!el) return false;
    var cs=getComputedStyle(el);
    if(cs.display==='none' || cs.visibility==='hidden' || Number(cs.opacity)===0) return false;
    var r=el.getBoundingClientRect();
    return r.width>3 && r.height>3;
  }
  function fieldActive(){
    var b=document.body;
    if(!b || !b.classList || b.classList.contains('prd-map-ui-active')) return false;
    return b.classList.contains('prd-combat-ui-active') || (visible(byId('game')) && visible(byId('field')) && visible(byId('canvas')));
  }
  function point(e){
    var t=e && e.touches && e.touches.length ? e.touches[0] : (e && e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e);
    if(!t || typeof t.clientX!=='number') return null;
    return {x:t.clientX,y:t.clientY,screenX:t.screenX||t.clientX,screenY:t.screenY||t.clientY};
  }
  function inside(el,p){
    if(!el || !p) return false;
    var r=el.getBoundingClientRect();
    return p.x>=r.left && p.x<=r.right && p.y>=r.top && p.y<=r.bottom;
  }
  function isProxyOrRealVisibleControl(target){
    if(!target || !target.closest) return false;
    return !!target.closest('#combatHudCommandsLandscapeDock,#combatHudCommandsPortraitDock,#combatHudButtons,.fieldTopControls,#towerPopup,#pauseDecisionOverlay,#pauseDecisionOverlayV27,#pauseDecisionOverlayV29,#gameOverOverlay,button:not(#summonBtn):not(#mergeBtn):not(#speedBtn):not(#pauseBtn),a,input,select,textarea,[role="button"]');
  }
  function isStaleOriginalCommand(target){
    return !!(target && target.closest && target.closest('#combatHudCommands'));
  }
  function dispatchToCanvas(type,e){
    var c=byId('canvas'), p=point(e);
    if(!c || !p) return false;
    var ev=new MouseEvent(type,{bubbles:true,cancelable:true,view:window,clientX:p.x,clientY:p.y,screenX:p.screenX,screenY:p.screenY,button:e.button||0,buttons:type==='mouseup'?0:(e.buttons||1),ctrlKey:!!e.ctrlKey,shiftKey:!!e.shiftKey,altKey:!!e.altKey,metaKey:!!e.metaKey});
    try{Object.defineProperty(ev,'__prdV37Synthetic',{value:true});}catch(_){ev.__prdV37Synthetic=true;}
    c.dispatchEvent(ev);
    return true;
  }
  function bridgeIfStale(e,type){
    if(!fieldActive() || e.__prdV37Synthetic) return false;
    var p=point(e), field=byId('field');
    if(!inside(field,p)) return false;
    var top=document.elementFromPoint(p.x,p.y);
    var stale=isStaleOriginalCommand(e.target) || isStaleOriginalCommand(top);
    if(!stale) return false;
    // When the visible proxy dock is really clicked, keep button behavior.
    if((e.target && e.target.closest && e.target.closest('#combatHudCommandsLandscapeDock,#combatHudCommandsPortraitDock')) ||
       (top && top.closest && top.closest('#combatHudCommandsLandscapeDock,#combatHudCommandsPortraitDock'))) return false;
    dispatchToCanvas(type,e);
    if(type==='mousedown' || type==='mousemove'){
      if(e.cancelable) e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    return true;
  }
  function onDown(e){ bridgeIfStale(e,'mousedown'); }
  function onMove(e){ bridgeIfStale(e,'mousemove'); }
  function onUp(e){ if(bridgeIfStale(e,'mousemove')){} }
  function onClick(e){
    if(!fieldActive()) return;
    var p=point(e), field=byId('field');
    if(!inside(field,p)) return;
    var top=document.elementFromPoint(p.x,p.y);
    if(isStaleOriginalCommand(e.target) || isStaleOriginalCommand(top)){
      if(e.cancelable) e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
  }
  function install(){ injectCss(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
  window.addEventListener('load',install,{once:true});
  setTimeout(install,200); setTimeout(install,1000);
  document.addEventListener('mousedown',onDown,true);
  document.addEventListener('mousemove',onMove,true);
  window.addEventListener('mouseup',onUp,true);
  document.addEventListener('touchstart',function(e){bridgeIfStale(e,'mousedown');},{capture:true,passive:false});
  document.addEventListener('touchmove',function(e){bridgeIfStale(e,'mousemove');},{capture:true,passive:false});
  window.addEventListener('touchend',function(e){bridgeIfStale(e,'mousemove');},{capture:true,passive:false});
  document.addEventListener('click',onClick,true);
})();
