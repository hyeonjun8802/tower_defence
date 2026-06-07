/* Extracted from first inline <script> block. */

(() => {
'use strict';

const canvas = document.getElementById('canvas');
const field = document.getElementById('field');
function configureBattleCanvasBackingStore(){
  const landscape = window.matchMedia ? window.matchMedia('(orientation: landscape)').matches : (window.innerWidth >= window.innerHeight);
  const rect = field ? field.getBoundingClientRect() : {width:0,height:0};
  const fallbackW = landscape ? 1120 : 748;
  const fallbackH = landscape ? 640 : 1060;

  // v219: keep the canvas backing-store ratio identical to the rendered field.
  // The previous mobile minimum width/height could make object-fit:fill scale X/Y
  // differently, so square tactical blocks looked squeezed.  Only use fallbacks
  // while the field is still hidden and has no measurable size.
  const measuredW = Math.round(rect.width || 0);
  const measuredH = Math.round(rect.height || 0);
  const w = Math.max(320, measuredW || fallbackW);
  const h = Math.max(320, measuredH || fallbackH);
  // v87: use a higher backing-store resolution while keeping game math in CSS pixels.
  // This fixes blurry plate/tile labels on retina displays without changing coordinates.
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  canvas.__logicalWidth = w;
  canvas.__logicalHeight = h;
  canvas.width = Math.max(320, Math.floor(w * dpr));
  canvas.height = Math.max(320, Math.floor(h * dpr));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
configureBattleCanvasBackingStore();
let ctx = canvas.getContext('2d');
function syncBattleCanvasTransform(){
  const logicalW = Number(canvas.__logicalWidth || canvas.dataset.logicalWidth || canvas.clientWidth || 748);
  const logicalH = Number(canvas.__logicalHeight || canvas.dataset.logicalHeight || canvas.clientHeight || 708);
  const sx = (Number(canvas.width) || logicalW) / Math.max(1, logicalW);
  const sy = (Number(canvas.height) || logicalH) / Math.max(1, logicalH);
  ctx.setTransform(sx, 0, 0, sy, 0, 0);
  return {w: logicalW, h: logicalH};
}
syncBattleCanvasTransform();
const starCanvas = document.getElementById('starfield');
const starCtx = starCanvas.getContext('2d');
let starField = {stars:[], last: performance.now(), raf:0};
let W = Number(canvas.__logicalWidth || canvas.clientWidth || 748);
let H = Number(canvas.__logicalHeight || canvas.clientHeight || 708);
const DOM_NODE_CACHE = Object.create(null);
const $ = id => {
  const cached = DOM_NODE_CACHE[id];
  if(cached && cached.isConnected) return cached;
  const node = document.getElementById(id);
  if(node) DOM_NODE_CACHE[id] = node;
  else delete DOM_NODE_CACHE[id];
  return node;
};
function setTextIfChanged(el, value){
  if(!el) return;
  const text = String(value ?? '');
  if(el.textContent !== text) el.textContent = text;
}
function setHtmlIfChanged(el, value){
  if(!el) return;
  const html = String(value ?? '');
  if(el.innerHTML !== html) el.innerHTML = html;
}
function setTitleIfChanged(el, value){
  if(!el) return;
  const title = String(value ?? '');
  if(el.title !== title) el.title = title;
}
function setStyleWidthIfChanged(el, value){
  if(!el) return;
  const width = String(value ?? '');
  if(el.style.width !== width) el.style.width = width;
}
const TAU = Math.PI * 2;
const ENEMY_DRAW_SORT_BY_Y = (a,b)=>a.y-b.y;
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

// v99: iPhone/Expo safe top offset for the battle screen.
// The WebView can render behind the status/notch area even when the desktop browser looks fine.
// Keep the command buttons in their current dock, but move the tactical world + top HUD down.
function measureCssSafeAreaTopV99(){
  try{
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top, 0px);';
    (document.body || document.documentElement).appendChild(probe);
    const v = parseFloat(getComputedStyle(probe).paddingTop) || 0;
    probe.remove();
    return v;
  }catch(_err){ return 0; }
}
function getBattleStatusTopOffsetV99(){
  const vv = window.visualViewport || null;
  const vvTop = Math.max(0, Math.round((vv && vv.offsetTop) || 0));
  const envTop = Math.max(0, Math.round(measureCssSafeAreaTopV99() || 0));
  const vw = Math.max(1, Math.round((vv && vv.width) || window.innerWidth || document.documentElement.clientWidth || 0));
  const vh = Math.max(1, Math.round((vv && vv.height) || window.innerHeight || document.documentElement.clientHeight || 0));
  const ua = navigator.userAgent || '';
  const isIOS = /iP(hone|ad|od)/.test(ua) || ((navigator.platform || '') === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
  const isTouch = (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && window.matchMedia('(hover:none), (pointer:coarse)').matches);
  const landscape = vw >= vh;
  // v100: portrait iPhone/Expo WebView can still draw under the notch even when
  // env(safe-area-inset-top) and visualViewport.offsetTop report too small.
  // Force a stronger portrait combat-safe top, but keep landscape almost unchanged.
  const mobilePortrait = isTouch && !landscape && vw <= 900;
  const iosFallback = (isIOS && isTouch && envTop < 4 && vvTop < 4) ? (landscape ? 18 : 44) : 0;
  const portraitForce = mobilePortrait ? 72 : 0;
  const maxCap = mobilePortrait ? 96 : 64;
  return Math.round(clamp(Math.max(envTop, vvTop, iosFallback, portraitForce), 0, maxCap));
}
function syncBattleStatusTopOffsetV99(reason='sync'){
  const px = getBattleStatusTopOffsetV99();
  try{
    document.documentElement.style.setProperty('--prd-status-top-offset', px + 'px');
    document.documentElement.style.setProperty('--prd-battle-safe-top', px + 'px');
    document.body && (document.body.dataset.prdStatusTop = String(px));
    window.PRD_STATUS_TOP_OFFSET_V99 = {px, reason, ts:Date.now()};
    window.PRD_STATUS_TOP_OFFSET_V100 = {px, reason, forcedPortrait: px >= 72, ts:Date.now()};
  }catch(_err){}
  return px;
}
syncBattleStatusTopOffsetV99('boot');
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
  for(let i=0;i<starField.stars.length;i++){
    const s = starField.stars[i];
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
  for(let i=0;i<starField.stars.length;i++){
    const s = starField.stars[i];
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


/* v101-final: stable shared screen starfield renderer for galaxy / stage / popup screens.
   Root cause guard: stage-map refresh observers can call refreshScreenStarfields()
   repeatedly. The old code rebuilt Math.random() stars whenever the measured canvas
   size jittered, which looked like the background was being re-created every frame.
   This renderer keeps one shared motion path for galaxyMapStarfield and
   stageMapStarfield, but preserves/scales the existing stars instead of random
   rebuilding during observer/layout refreshes. */
const SCREEN_STAR_CANVAS_IDS = ['galaxyMapStarfield','stageMapStarfield','towerPopupStarfield'];
const SCREEN_STAR_SIZE_EPSILON = 3;
const screenStarFields = SCREEN_STAR_CANVAS_IDS.map(id => {
  const canvas = document.getElementById(id);
  return canvas ? {
    id,
    canvas,
    ctx: canvas.getContext('2d'),
    stars: [],
    lastW: 0,
    lastH: 0,
    rebuilds: 0,
    resizes: 0
  } : null;
}).filter(Boolean);
let screenStarRaf = 0;
let screenStarLast = performance.now();
let screenStarFrame = 0;

function screenStarHash(seedText){
  let h = 2166136261;
  for(let i=0;i<seedText.length;i++){
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function screenStarRand(seed){
  let t = seed >>> 0;
  return function(){
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildScreenStarfield(sf, w, h){
  sf.stars = [];
  sf.rebuilds = (sf.rebuilds || 0) + 1;
  const baseSeed = screenStarHash(sf.id + ':' + Math.round(w) + 'x' + Math.round(h));
  STAR_LAYER_CONFIG.forEach((layer, layerIndex) => {
    const rnd = screenStarRand(baseSeed + layerIndex * 4099);
    for(let i=0;i<layer.count;i++){
      sf.stars.push({
        x: rnd() * w,
        y: rnd() * h,
        size: 1.15,
        alpha: layer.alpha,
        layer: layerIndex,
        speedX: layer.speedX,
        speedY: layer.speedY,
        twinkle: rnd() * TAU,
        twinkleSpeed: .25 + rnd() * .60
      });
    }
  });
}

function scaleScreenStarfield(sf, w, h){
  const oldW = Math.max(1, Number(sf.lastW || w || 1));
  const oldH = Math.max(1, Number(sf.lastH || h || 1));
  const sx = w / oldW;
  const sy = h / oldH;
  for(let i=0;i<sf.stars.length;i++){
    const s = sf.stars[i];
    s.x *= sx;
    s.y *= sy;
  }
}

function resizeScreenStarfield(sf, measuredRect=null){
  // Guard against accidental callback arguments such as Array.forEach index.
  // measuredRect must be a DOMRect-like object; otherwise use the canvas rect.
  const rect = (measuredRect && typeof measuredRect === 'object' &&
    Number.isFinite(measuredRect.width) && Number.isFinite(measuredRect.height))
      ? measuredRect
      : sf.canvas.getBoundingClientRect();
  const w = Math.max(0, Math.round(rect.width));
  const h = Math.max(0, Math.round(rect.height));
  if(w < 2 || h < 2) return false;

  // Observer/layout refreshes can report 1~3px jitter on mobile WebView.
  // Treat that as the same canvas so the stars are not rebuilt/re-randomized.
  if(sf.lastW > 0 && sf.lastH > 0 &&
     Math.abs(sf.lastW - w) <= SCREEN_STAR_SIZE_EPSILON &&
     Math.abs(sf.lastH - h) <= SCREEN_STAR_SIZE_EPSILON){
    return true;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  sf.canvas.width = Math.floor(w * dpr);
  sf.canvas.height = Math.floor(h * dpr);
  sf.canvas.style.width = w + 'px';
  sf.canvas.style.height = h + 'px';
  sf.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sf.resizes = (sf.resizes || 0) + 1;

  if(sf.stars.length && sf.lastW > 1 && sf.lastH > 1) scaleScreenStarfield(sf, w, h);
  else buildScreenStarfield(sf, w, h);

  sf.lastW = w;
  sf.lastH = h;
  return true;
}

function refreshScreenStarfields(){
  // v101-final: do not pass resizeScreenStarfield directly to forEach.
  // forEach supplies (item, index, array); the numeric index was being treated as
  // measuredRect for the 2nd/3rd canvases, producing NaN sizes and forcing
  // stageMapStarfield/towerPopupStarfield to rebuild on later RAF frames.
  screenStarFields.forEach(function(sf){ resizeScreenStarfield(sf); });
}

function updateScreenStarfield(sf, dt){
  const w = sf.lastW;
  const h = sf.lastH;
  if(w < 2 || h < 2) return;
  for(let i=0;i<sf.stars.length;i++){
    const s = sf.stars[i];
    s.x += s.speedX * dt;
    s.y += s.speedY * dt;
    s.twinkle += s.twinkleSpeed * dt;
    // Keep the same diagonal motion style as the galaxy map, but do not randomize
    // the opposite axis on wrap. Random edge re-entry looked like repeated reset.
    if(s.x < -8){ s.x = w + 8; s.y = (s.y + h * .173 + (s.layer + 1) * 11) % h; }
    if(s.x > w + 8){ s.x = -8; s.y = (s.y + h * .173 + (s.layer + 1) * 11) % h; }
    if(s.y < -8){ s.y = h + 8; s.x = (s.x + w * .217 + (s.layer + 1) * 13) % w; }
    if(s.y > h + 8){ s.y = -8; s.x = (s.x + w * .217 + (s.layer + 1) * 13) % w; }
  }
}

function drawScreenStarfield(sf){
  const w = sf.lastW;
  const h = sf.lastH;
  if(w < 2 || h < 2) return;
  const ctx2 = sf.ctx;
  ctx2.clearRect(0, 0, w, h);
  for(let i=0;i<sf.stars.length;i++){
    const s = sf.stars[i];
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
  screenStarFrame += 1;
  for(let i=0;i<screenStarFields.length;i++){
    const sf = screenStarFields[i];
    const el = sf.canvas;
    if(!el || !el.isConnected) continue;
    const rect = el.getBoundingClientRect();
    if(rect.width < 2 || rect.height < 2) continue;
    // Avoid coupling this renderer to the battle perfFrameId. This is a map/popup
    // renderer and must not be affected by battle-loop timing or observer refreshes.
    if((screenStarFrame & 31) === 0){
      const st = getComputedStyle(el);
      if(st.display === 'none' || st.visibility === 'hidden') continue;
    }
    if(!resizeScreenStarfield(sf, rect)) continue;
    updateScreenStarfield(sf, dt);
    drawScreenStarfield(sf);
  }
  screenStarRaf = requestAnimationFrame(screenStarLoop);
  try{ window.__PRD_SCREEN_STAR_RAF_V101_FINAL = screenStarRaf; }catch(_err){}
}

try{
  window.PRD_SCREEN_STARFIELD_V101_FINAL_DEBUG = function(){
    return screenStarFields.map(function(sf){
      return {id:sf.id, stars:sf.stars.length, w:sf.lastW, h:sf.lastH, rebuilds:sf.rebuilds||0, resizes:sf.resizes||0};
    });
  };
}catch(_err){}

const THEMES = [
  {name:'COSMIC VOID', ko:'공허 성역', bg:'assets/images/backgrounds/bg_cosmic.webp', color:'#38bdf8', starSpeed:1.0},
  {name:'FROST EXPANSE', ko:'빙결 외곽', bg:'assets/images/backgrounds/bg_frost.webp', color:'#67e8f9', starSpeed:.82},
  {name:'LAVA NEBULA', ko:'용암 성운', bg:'assets/images/backgrounds/bg_lava.webp', color:'#fb923c', starSpeed:1.22},
  {name:'JUNGLE CORE', ko:'생체 정글', bg:'assets/images/backgrounds/bg_jungle.webp', color:'#22c55e', starSpeed:.95},
  {name:'SMOG WASTELAND', ko:'매연 폐역', bg:'assets/images/backgrounds/bg_smog.webp', color:'#9cab62', starSpeed:.72},
  {name:'CRYSTAL NEBULA', ko:'수정 성운', bg:'assets/images/backgrounds/bg_crystal.webp', color:'#c084fc', starSpeed:.88},
  {name:'MACHINE CORE', ko:'기계 핵성', bg:'assets/images/backgrounds/bg_machine.webp', color:'#60a5fa', starSpeed:.78}
];


const CONSTELLATION_ARCS = [{"id":"silent","name":"SILENT NEBULA","ko":"침묵의 성운","start":1,"end":5,"desc":"안드로메다 외곽 잔향을 추적하는 입문권역"},{"id":"gravity","name":"GRAVITY CORRIDOR","ko":"중력 회랑","start":6,"end":10,"desc":"포탈과 중력으로 항로가 뒤틀리는 중반권역"},{"id":"core","name":"FORGOTTEN CORE","ko":"잊힌 코어","start":11,"end":15,"desc":"고대 코어와 최종 수호자가 깨어나는 심층권역"}];

const STAGE_MAP_DEFS = [{"stage":1,"key":"and_4_1","name":"SILENT ENTRY","ko":"침묵의 진입로","theme":0,"color":"#38bdf8","mood":"잔향 신호 추적 · 안드로메다 진입 · 기본 화력 확인","constellation":"silent","stageId":"4-1","nodeType":"normal"},{"stage":2,"key":"and_4_2","name":"ECHO NEBULA","ko":"잔향 성운","theme":0,"color":"#67e8f9","mood":"잔향 분기 · 공명 흔적 · 초반 병합 준비","constellation":"silent","stageId":"4-2","nodeType":"normal"},{"stage":3,"key":"and_4_3","name":"RESONANT SHARD","ko":"공명 파편","theme":1,"color":"#c084fc","mood":"공명 표식 · 보호막 약화 · 공명 타워 학습","constellation":"silent","stageId":"4-3","nodeType":"resonance"},{"stage":4,"key":"and_4_4","name":"MARKED FIELD","ko":"표식의 전장","theme":1,"color":"#22d3ee","mood":"표식 분산 · 분기처럼 보이는 합류 경로 · 화력 분배","constellation":"silent","stageId":"4-4","nodeType":"split"},{"stage":5,"key":"and_4_5","name":"OUTER WARDEN","ko":"외곽 수호체","theme":2,"color":"#f59e0b","mood":"외곽 장갑 보스 · 공명 보호막 대응 · 4장 마무리","constellation":"silent","stageId":"4-5","nodeType":"miniBoss"},{"stage":6,"key":"and_5_1","name":"TWISTED ROUTE","ko":"뒤틀린 항로","theme":2,"color":"#f472b6","mood":"고정 포탈 · 빠른 적 압박 · 출구 화력 배치","constellation":"gravity","stageId":"5-1","nodeType":"portal"},{"stage":7,"key":"and_5_2","name":"GRAVITY LENS","ko":"중력 렌즈","theme":3,"color":"#8b5cf6","mood":"중력 렌즈 · 둔화 학습 · 속도 압박 제어","constellation":"gravity","stageId":"5-2","nodeType":"gravity"},{"stage":8,"key":"and_5_3","name":"SLOWED STARLIGHT","ko":"느려진 별빛","theme":3,"color":"#60a5fa","mood":"느린 별빛 · 병합 효율 검증 · 제어 화력 운영","constellation":"gravity","stageId":"5-3","nodeType":"gravity"},{"stage":9,"key":"and_5_4","name":"RIFT MATRIX","ko":"균열의 행렬","theme":4,"color":"#ec4899","mood":"균열 행렬 · 포탈 출구 대응 · 관통/범위 가치 상승","constellation":"gravity","stageId":"5-4","nodeType":"splitPortal"},{"stage":10,"key":"and_5_5","name":"GRAVITY RIFT","ko":"중력 균열체","theme":4,"color":"#a78bfa","mood":"중력 보스 · 속도 버프 오라 · 회랑 결전","constellation":"gravity","stageId":"5-5","nodeType":"boss"},{"stage":11,"key":"and_6_1","name":"RUINED CORE","ko":"폐허 코어","theme":5,"color":"#64748b","mood":"폐허 코어 · 직선 경로 대응 · 프리즘 학습","constellation":"core","stageId":"6-1","nodeType":"core"},{"stage":12,"key":"and_6_2","name":"PRISM GRID","ko":"프리즘 방어망","theme":5,"color":"#e879f9","mood":"프리즘 방어망 · 직선 관통 · 행렬 처리","constellation":"core","stageId":"6-2","nodeType":"prism"},{"stage":13,"key":"and_6_3","name":"CORRUPTED PROTOCOL","ko":"오염된 방어 프로토콜","theme":6,"color":"#fb7185","mood":"오염된 프로토콜 · 포탈/중력/행렬 종합 테스트","constellation":"core","stageId":"6-3","nodeType":"danger"},{"stage":14,"key":"and_6_4","name":"WARDEN HEART","ko":"수호자의 심장","theme":6,"color":"#facc15","mood":"수호자 심장 · wave 시작 랜덤 버프 · 최종 관문","constellation":"core","stageId":"6-4","nodeType":"randomBuff"},{"stage":15,"key":"and_6_5","name":"ANDROMEDA ECHO","ko":"안드로메다의 잔향","theme":6,"color":"#ef4444","mood":"중앙 코어 · 최종 보스 · 핵심 배치 칸 공략","constellation":"core","stageId":"6-5","nodeType":"finalBoss"}];



const COMMERCIAL_STAGE_BALANCE = [{"stage":1,"key":"and_4_1","name":"SILENT ENTRY","concept":"basic_trace","general_hp_multiplier":1.0,"general_speed_multiplier":1.0,"wave_count_multiplier":1.0,"boss_multiplier":1.05,"reward_multiplier":1.05,"plate_budget":{"amp":1,"coil":1,"lens":0,"mine":0,"rift":0},"forbidden_budget":0,"minimum_usable_placements":24,"target_winrate":0.8},{"stage":2,"key":"and_4_2","name":"ECHO NEBULA","concept":"echo_split","general_hp_multiplier":1.05,"general_speed_multiplier":1.01,"wave_count_multiplier":1.05,"boss_multiplier":1.1,"reward_multiplier":1.07,"plate_budget":{"amp":1,"coil":1,"lens":0,"mine":0,"rift":0},"forbidden_budget":0,"minimum_usable_placements":24,"target_winrate":0.76},{"stage":3,"key":"and_4_3","name":"RESONANT SHARD","concept":"resonance_mark","general_hp_multiplier":1.12,"general_speed_multiplier":1.01,"wave_count_multiplier":1.08,"boss_multiplier":1.18,"reward_multiplier":1.09,"plate_budget":{"amp":1,"coil":1,"lens":1,"mine":0,"rift":0},"forbidden_budget":1,"minimum_usable_placements":22,"target_winrate":0.72},{"stage":4,"key":"and_4_4","name":"MARKED FIELD","concept":"marked_split","general_hp_multiplier":1.18,"general_speed_multiplier":1.02,"wave_count_multiplier":1.1,"boss_multiplier":1.24,"reward_multiplier":1.12,"plate_budget":{"amp":1,"coil":1,"lens":1,"mine":0,"rift":0},"forbidden_budget":1,"minimum_usable_placements":22,"target_winrate":0.68},{"stage":5,"key":"and_4_5","name":"OUTER WARDEN","concept":"outer_boss","general_hp_multiplier":1.28,"general_speed_multiplier":1.0,"wave_count_multiplier":1.05,"boss_multiplier":1.34,"reward_multiplier":1.15,"plate_budget":{"amp":1,"coil":1,"lens":1,"mine":0,"rift":0},"forbidden_budget":1,"minimum_usable_placements":22,"target_winrate":0.64},{"stage":6,"key":"and_5_1","name":"TWISTED ROUTE","concept":"portal_speed","general_hp_multiplier":1.25,"general_speed_multiplier":1.06,"wave_count_multiplier":1.12,"boss_multiplier":1.31,"reward_multiplier":1.17,"plate_budget":{"amp":1,"coil":1,"lens":1,"mine":1,"rift":1},"forbidden_budget":2,"minimum_usable_placements":20,"target_winrate":0.62},{"stage":7,"key":"and_5_2","name":"GRAVITY LENS","concept":"gravity_slow","general_hp_multiplier":1.32,"general_speed_multiplier":1.07,"wave_count_multiplier":1.14,"boss_multiplier":1.39,"reward_multiplier":1.2,"plate_budget":{"amp":1,"coil":1,"lens":1,"mine":1,"rift":1},"forbidden_budget":2,"minimum_usable_placements":20,"target_winrate":0.58},{"stage":8,"key":"and_5_3","name":"SLOWED STARLIGHT","concept":"slow_starlight","general_hp_multiplier":1.38,"general_speed_multiplier":1.05,"wave_count_multiplier":1.16,"boss_multiplier":1.45,"reward_multiplier":1.22,"plate_budget":{"amp":1,"coil":1,"lens":1,"mine":1,"rift":1},"forbidden_budget":2,"minimum_usable_placements":20,"target_winrate":0.55},{"stage":9,"key":"and_5_4","name":"RIFT MATRIX","concept":"rift_matrix","general_hp_multiplier":1.48,"general_speed_multiplier":1.06,"wave_count_multiplier":1.18,"boss_multiplier":1.55,"reward_multiplier":1.25,"plate_budget":{"amp":1,"coil":1,"lens":1,"mine":0,"rift":1},"forbidden_budget":3,"minimum_usable_placements":19,"target_winrate":0.51},{"stage":10,"key":"and_5_5","name":"GRAVITY RIFT","concept":"gravity_boss","general_hp_multiplier":1.62,"general_speed_multiplier":1.08,"wave_count_multiplier":1.12,"boss_multiplier":1.7,"reward_multiplier":1.3,"plate_budget":{"amp":1,"coil":1,"lens":1,"mine":0,"rift":1},"forbidden_budget":3,"minimum_usable_placements":19,"target_winrate":0.48},{"stage":11,"key":"and_6_1","name":"RUINED CORE","concept":"ruined_core","general_hp_multiplier":1.52,"general_speed_multiplier":1.03,"wave_count_multiplier":1.16,"boss_multiplier":1.6,"reward_multiplier":1.27,"plate_budget":{"amp":1,"coil":1,"lens":1,"mine":1,"rift":1},"forbidden_budget":3,"minimum_usable_placements":19,"target_winrate":0.52},{"stage":12,"key":"and_6_2","name":"PRISM GRID","concept":"prism_grid","general_hp_multiplier":1.58,"general_speed_multiplier":1.04,"wave_count_multiplier":1.18,"boss_multiplier":1.66,"reward_multiplier":1.3,"plate_budget":{"amp":1,"coil":1,"lens":2,"mine":1,"rift":1},"forbidden_budget":3,"minimum_usable_placements":19,"target_winrate":0.5},{"stage":13,"key":"and_6_3","name":"CORRUPTED PROTOCOL","concept":"corrupted_protocol","general_hp_multiplier":1.7,"general_speed_multiplier":1.06,"wave_count_multiplier":1.22,"boss_multiplier":1.78,"reward_multiplier":1.35,"plate_budget":{"amp":1,"coil":1,"lens":2,"mine":0,"rift":1},"forbidden_budget":4,"minimum_usable_placements":18,"target_winrate":0.46},{"stage":14,"key":"and_6_4","name":"WARDEN HEART","concept":"random_buff_gate","general_hp_multiplier":1.82,"general_speed_multiplier":1.07,"wave_count_multiplier":1.24,"boss_multiplier":1.91,"reward_multiplier":1.4,"plate_budget":{"amp":2,"coil":1,"lens":2,"mine":0,"rift":2},"forbidden_budget":4,"minimum_usable_placements":18,"target_winrate":0.43},{"stage":15,"key":"and_6_5","name":"ANDROMEDA ECHO","concept":"andromeda_final","general_hp_multiplier":2.05,"general_speed_multiplier":1.09,"wave_count_multiplier":1.18,"boss_multiplier":2.15,"reward_multiplier":1.45,"plate_budget":{"amp":2,"coil":1,"lens":2,"mine":0,"rift":2},"forbidden_budget":4,"minimum_usable_placements":18,"target_winrate":0.4}];
const COMMERCIAL_STAGE_BALANCE_BY_STAGE = Object.freeze(Object.fromEntries(COMMERCIAL_STAGE_BALANCE.map(row => [Number(row.stage), Object.freeze(row)])));
const COMMERCIAL_STAGE_BALANCE_DEFAULT = Object.freeze({
  general_hp_multiplier:1,
  general_speed_multiplier:1,
  wave_count_multiplier:1,
  boss_multiplier:1,
  reward_multiplier:1,
  plate_budget:{amp:1,coil:1,lens:1,mine:0,rift:0},
  forbidden_budget:0,
  minimum_usable_placements:18
});
function getCommercialStageBalance(stageNo){
  const n = clamp(Number(stageNo || 1), 1, STAGE_MAP_DEFS.length);
  return COMMERCIAL_STAGE_BALANCE_BY_STAGE[n] || COMMERCIAL_STAGE_BALANCE_DEFAULT;
}

const STAGE_PRESENTATION = {"1":{"risk":"LOW","tags":["BASIC","TRACE","INTRO"],"note":"잔향 신호 추적 · 안드로메다 진입 · 기본 화력 확인"},"2":{"risk":"MEDIUM","tags":["ECHO","SPLIT"],"note":"잔향 분기 · 공명 흔적 · 초반 병합 준비"},"3":{"risk":"MEDIUM","tags":["RESONANCE","UNLOCK"],"note":"공명 표식 · 보호막 약화 · 공명 타워 학습"},"4":{"risk":"MEDIUM","tags":["SPLIT","MARK"],"note":"표식 분산 · 분기처럼 보이는 합류 경로 · 화력 분배"},"5":{"risk":"HIGH","tags":["MINI BOSS","ARMOR"],"note":"외곽 장갑 보스 · 공명 보호막 대응 · 4장 마무리"},"6":{"risk":"MEDIUM","tags":["PORTAL","SPEED"],"note":"고정 포탈 · 빠른 적 압박 · 출구 화력 배치"},"7":{"risk":"MEDIUM","tags":["GRAVITY","UNLOCK"],"note":"중력 렌즈 · 둔화 학습 · 속도 압박 제어"},"8":{"risk":"HIGH","tags":["CONTROL","MERGE"],"note":"느린 별빛 · 병합 효율 검증 · 제어 화력 운영"},"9":{"risk":"HIGH","tags":["SPLIT","PORTAL"],"note":"균열 행렬 · 포탈 출구 대응 · 관통/범위 가치 상승"},"10":{"risk":"HIGH","tags":["BOSS","GRAVITY"],"note":"중력 보스 · 속도 버프 오라 · 회랑 결전"},"11":{"risk":"HIGH","tags":["CORE","UNLOCK"],"note":"폐허 코어 · 직선 경로 대응 · 프리즘 학습"},"12":{"risk":"HIGH","tags":["PRISM","PIERCE"],"note":"프리즘 방어망 · 직선 관통 · 행렬 처리"},"13":{"risk":"VERY HIGH","tags":["MIXED","TEST"],"note":"오염된 프로토콜 · 포탈/중력/행렬 종합 테스트"},"14":{"risk":"VERY HIGH","tags":["RANDOM BUFF","CORE"],"note":"수호자 심장 · wave 시작 랜덤 버프 · 최종 관문"},"15":{"risk":"EXTREME","tags":["FINAL","CORE","KEY TILE"],"note":"중앙 코어 · 최종 보스 · 핵심 배치 칸 공략"}};



const STAGE_DESCRIPTION_COPY = {"1":{"summary":"4-1 침묵의 진입로 전장입니다. 잔향 신호 추적 · 안드로메다 진입 · 기본 화력 확인.","enemy":"M01/M02 기본군","strategy":"기본 화력과 병합 타이밍을 안정화하세요.","battle":"침묵의 진입로 방어 · basic trace"},"2":{"summary":"4-2 잔향 성운 전장입니다. 잔향 분기 · 공명 흔적 · 초반 병합 준비.","enemy":"M01/M02 기본군","strategy":"기본 화력과 병합 타이밍을 안정화하세요.","battle":"잔향 성운 방어 · echo split"},"3":{"summary":"4-3 공명 파편 전장입니다. 공명 표식 · 보호막 약화 · 공명 타워 학습.","enemy":"M01/M02 기본군","strategy":"공명 표식과 집중 화력으로 보호막형 적을 처리하세요.","battle":"공명 파편 방어 · resonance mark"},"4":{"summary":"4-4 표식의 전장 전장입니다. 표식 분산 · 분기처럼 보이는 합류 경로 · 화력 분배.","enemy":"M02/M04/M07 혼합군","strategy":"공명 표식과 집중 화력으로 보호막형 적을 처리하세요.","battle":"표식의 전장 방어 · marked split"},"5":{"summary":"4-5 외곽 수호체 전장입니다. 외곽 장갑 보스 · 공명 보호막 대응 · 4장 마무리.","enemy":"M02/M04/M07 혼합군","strategy":"공명 표식과 집중 화력으로 보호막형 적을 처리하세요.","battle":"외곽 수호체 방어 · outer boss"},"6":{"summary":"5-1 뒤틀린 항로 전장입니다. 고정 포탈 · 빠른 적 압박 · 출구 화력 배치.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"뒤틀린 항로 방어 · portal speed"},"7":{"summary":"5-2 중력 렌즈 전장입니다. 중력 렌즈 · 둔화 학습 · 속도 압박 제어.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"중력 렌즈 방어 · gravity slow"},"8":{"summary":"5-3 느려진 별빛 전장입니다. 느린 별빛 · 병합 효율 검증 · 제어 화력 운영.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"느려진 별빛 방어 · slow starlight"},"9":{"summary":"5-4 균열의 행렬 전장입니다. 균열 행렬 · 포탈 출구 대응 · 관통/범위 가치 상승.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"균열의 행렬 방어 · rift matrix"},"10":{"summary":"5-5 중력 균열체 전장입니다. 중력 보스 · 속도 버프 오라 · 회랑 결전.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"중력 균열체 방어 · gravity boss"},"11":{"summary":"6-1 폐허 코어 전장입니다. 폐허 코어 · 직선 경로 대응 · 프리즘 학습.","enemy":"M07/M10 중심의 코어 방어망","strategy":"프리즘 관통과 핵심 배치 칸을 활용해 후반 물량을 정리하세요.","battle":"폐허 코어 방어 · ruined core"},"12":{"summary":"6-2 프리즘 방어망 전장입니다. 프리즘 방어망 · 직선 관통 · 행렬 처리.","enemy":"M07/M10 중심의 코어 방어망","strategy":"프리즘 관통과 핵심 배치 칸을 활용해 후반 물량을 정리하세요.","battle":"프리즘 방어망 방어 · prism grid"},"13":{"summary":"6-3 오염된 방어 프로토콜 전장입니다. 오염된 프로토콜 · 포탈/중력/행렬/허상 교란 종합 테스트.","enemy":"M03/M08/M09가 섞인 고급 교란 방어망","strategy":"허상은 광역/관통으로 정리하고 견인체는 우선 제거하세요.","battle":"오염된 방어 프로토콜 방어 · corrupted protocol"},"14":{"summary":"6-4 수호자의 심장 전장입니다. wave 시작 랜덤 버프와 역장 견인 압박이 함께 들어옵니다.","enemy":"M09 견인체와 M10 성흔 포식체 중심 관문 방어망","strategy":"U 칸 주력 배치와 동시에 견인체를 먼저 끊어 물량 압축을 막으세요.","battle":"수호자의 심장 방어 · random buff gate"},"15":{"summary":"6-5 안드로메다의 잔향 전장입니다. 중앙 코어 · 최종 보스 · 핵심 배치 칸 공략.","enemy":"B03 공명 수호자 아스트라와 M10 성흔 포식체가 최종 코어를 압박합니다.","strategy":"중앙 핵심 칸에 최고 레벨 타워를 두고 장판·공명·프리즘 화력을 모두 연결하세요.","battle":"안드로메다의 잔향 방어 · andromeda final"}};
function getStageDescriptionCopy(stageNo){
  const n = clamp(Number(stageNo || 1), 1, STAGE_MAP_DEFS.length);
  return STAGE_DESCRIPTION_COPY[n] || STAGE_DESCRIPTION_COPY[1];
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

const STAGE_BOSS_DEFS = {"1":{"mid":{"tier":"MID BOSS","name":"OUTER SHIELDER","ko":"공명 장갑 수호체","title":"외곽 장갑 감시자","color":"#bae6fd","aura":"#38bdf8","hpMul":1.74,"speedMul":0.95,"size":38,"rewardMul":2.2600000000000002,"expMul":2.16,"armor":0.08,"coreDamage":2,"ability":"공명 보호막","desc":"공명 보호막으로 피해를 줄이며 전진합니다.","effect":"frostVeil","interval":158},"final":{"tier":"FINAL BOSS","name":"B01 OUTER WARDEN","ko":"외곽 수호체","title":"안드로메다 외곽 보스","color":"#fef3c7","aura":"#f59e0b","hpMul":2.63,"speedMul":0.88,"size":46,"rewardMul":3.75,"expMul":3.1,"armor":0.18,"coreDamage":5,"ability":"보호막 소환","desc":"공명 장갑체를 호출하며 보호막을 전개합니다.","effect":"crystalOverload","interval":146}},"2":{"mid":{"tier":"MID BOSS","name":"OUTER SHIELDER","ko":"공명 장갑 수호체","title":"외곽 장갑 감시자","color":"#bae6fd","aura":"#38bdf8","hpMul":1.78,"speedMul":0.95,"size":38,"rewardMul":2.3200000000000003,"expMul":2.22,"armor":0.08,"coreDamage":2,"ability":"공명 보호막","desc":"공명 보호막으로 피해를 줄이며 전진합니다.","effect":"frostVeil","interval":156},"final":{"tier":"FINAL BOSS","name":"B01 OUTER WARDEN","ko":"외곽 수호체","title":"안드로메다 외곽 보스","color":"#fef3c7","aura":"#f59e0b","hpMul":2.71,"speedMul":0.88,"size":47,"rewardMul":3.9,"expMul":3.2,"armor":0.18,"coreDamage":5,"ability":"보호막 소환","desc":"공명 장갑체를 호출하며 보호막을 전개합니다.","effect":"crystalOverload","interval":144}},"3":{"mid":{"tier":"MID BOSS","name":"OUTER SHIELDER","ko":"공명 장갑 수호체","title":"외곽 장갑 감시자","color":"#bae6fd","aura":"#38bdf8","hpMul":1.82,"speedMul":0.95,"size":38,"rewardMul":2.3800000000000003,"expMul":2.2800000000000002,"armor":0.08,"coreDamage":2,"ability":"공명 보호막","desc":"공명 보호막으로 피해를 줄이며 전진합니다.","effect":"frostVeil","interval":154},"final":{"tier":"FINAL BOSS","name":"B01 OUTER WARDEN","ko":"외곽 수호체","title":"안드로메다 외곽 보스","color":"#fef3c7","aura":"#f59e0b","hpMul":2.79,"speedMul":0.88,"size":47,"rewardMul":4.05,"expMul":3.3,"armor":0.18,"coreDamage":5,"ability":"보호막 소환","desc":"공명 장갑체를 호출하며 보호막을 전개합니다.","effect":"crystalOverload","interval":142}},"4":{"mid":{"tier":"MID BOSS","name":"OUTER SHIELDER","ko":"공명 장갑 수호체","title":"외곽 장갑 감시자","color":"#bae6fd","aura":"#38bdf8","hpMul":1.86,"speedMul":0.95,"size":39,"rewardMul":2.4400000000000004,"expMul":2.34,"armor":0.08,"coreDamage":2,"ability":"공명 보호막","desc":"공명 보호막으로 피해를 줄이며 전진합니다.","effect":"frostVeil","interval":152},"final":{"tier":"FINAL BOSS","name":"B01 OUTER WARDEN","ko":"외곽 수호체","title":"안드로메다 외곽 보스","color":"#fef3c7","aura":"#f59e0b","hpMul":2.87,"speedMul":0.88,"size":48,"rewardMul":4.2,"expMul":3.4,"armor":0.18,"coreDamage":5,"ability":"보호막 소환","desc":"공명 장갑체를 호출하며 보호막을 전개합니다.","effect":"crystalOverload","interval":140}},"5":{"mid":{"tier":"MID BOSS","name":"OUTER SHIELDER","ko":"공명 장갑 수호체","title":"외곽 장갑 감시자","color":"#bae6fd","aura":"#38bdf8","hpMul":1.9,"speedMul":0.95,"size":39,"rewardMul":2.5,"expMul":2.4,"armor":0.08,"coreDamage":2,"ability":"공명 보호막","desc":"공명 보호막으로 피해를 줄이며 전진합니다.","effect":"frostVeil","interval":150},"final":{"tier":"FINAL BOSS","name":"B01 OUTER WARDEN","ko":"외곽 수호체","title":"안드로메다 외곽 보스","color":"#fef3c7","aura":"#f59e0b","hpMul":2.95,"speedMul":0.88,"size":48,"rewardMul":4.35,"expMul":3.5,"armor":0.18,"coreDamage":5,"ability":"보호막 소환","desc":"공명 장갑체를 호출하며 보호막을 전개합니다.","effect":"crystalOverload","interval":138}},"6":{"mid":{"tier":"MID BOSS","name":"GRAVITY DEVOURER","ko":"중력 포식체","title":"중력 회랑 감시자","color":"#ddd6fe","aura":"#8b5cf6","hpMul":2.05,"speedMul":0.94,"size":39,"rewardMul":2.56,"expMul":2.46,"armor":0.14,"coreDamage":2,"ability":"중력 파동","desc":"주변 적을 밀집시키고 일부 적을 가속합니다.","effect":"voidSurge","interval":148},"final":{"tier":"FINAL BOSS","name":"B02 GRAVITY RIFT","ko":"중력 균열체","title":"중력 회랑 보스","color":"#ede9fe","aura":"#a855f7","hpMul":3.05,"speedMul":0.9,"size":49,"rewardMul":4.5,"expMul":3.6,"armor":0.24,"coreDamage":5,"ability":"중력 균열","desc":"체력 구간마다 오라 압박이 강해집니다.","effect":"voidSurge","interval":136}},"7":{"mid":{"tier":"MID BOSS","name":"GRAVITY DEVOURER","ko":"중력 포식체","title":"중력 회랑 감시자","color":"#ddd6fe","aura":"#8b5cf6","hpMul":2.11,"speedMul":0.94,"size":39,"rewardMul":2.62,"expMul":2.52,"armor":0.14,"coreDamage":2,"ability":"중력 파동","desc":"주변 적을 밀집시키고 일부 적을 가속합니다.","effect":"voidSurge","interval":146},"final":{"tier":"FINAL BOSS","name":"B02 GRAVITY RIFT","ko":"중력 균열체","title":"중력 회랑 보스","color":"#ede9fe","aura":"#a855f7","hpMul":3.14,"speedMul":0.9,"size":49,"rewardMul":4.65,"expMul":3.7,"armor":0.24,"coreDamage":5,"ability":"중력 균열","desc":"체력 구간마다 오라 압박이 강해집니다.","effect":"voidSurge","interval":134}},"8":{"mid":{"tier":"MID BOSS","name":"GRAVITY DEVOURER","ko":"중력 포식체","title":"중력 회랑 감시자","color":"#ddd6fe","aura":"#8b5cf6","hpMul":2.17,"speedMul":0.94,"size":40,"rewardMul":2.68,"expMul":2.58,"armor":0.14,"coreDamage":2,"ability":"중력 파동","desc":"주변 적을 밀집시키고 일부 적을 가속합니다.","effect":"voidSurge","interval":144},"final":{"tier":"FINAL BOSS","name":"B02 GRAVITY RIFT","ko":"중력 균열체","title":"중력 회랑 보스","color":"#ede9fe","aura":"#a855f7","hpMul":3.23,"speedMul":0.9,"size":50,"rewardMul":4.8,"expMul":3.8,"armor":0.24,"coreDamage":5,"ability":"중력 균열","desc":"체력 구간마다 오라 압박이 강해집니다.","effect":"voidSurge","interval":132}},"9":{"mid":{"tier":"MID BOSS","name":"GRAVITY DEVOURER","ko":"중력 포식체","title":"중력 회랑 감시자","color":"#ddd6fe","aura":"#8b5cf6","hpMul":2.23,"speedMul":0.94,"size":40,"rewardMul":2.74,"expMul":2.64,"armor":0.14,"coreDamage":2,"ability":"중력 파동","desc":"주변 적을 밀집시키고 일부 적을 가속합니다.","effect":"voidSurge","interval":142},"final":{"tier":"FINAL BOSS","name":"B02 GRAVITY RIFT","ko":"중력 균열체","title":"중력 회랑 보스","color":"#ede9fe","aura":"#a855f7","hpMul":3.32,"speedMul":0.9,"size":50,"rewardMul":4.95,"expMul":3.9,"armor":0.24,"coreDamage":5,"ability":"중력 균열","desc":"체력 구간마다 오라 압박이 강해집니다.","effect":"voidSurge","interval":130}},"10":{"mid":{"tier":"MID BOSS","name":"GRAVITY DEVOURER","ko":"중력 포식체","title":"중력 회랑 감시자","color":"#ddd6fe","aura":"#8b5cf6","hpMul":2.29,"speedMul":0.94,"size":40,"rewardMul":2.8000000000000003,"expMul":2.7,"armor":0.14,"coreDamage":2,"ability":"중력 파동","desc":"주변 적을 밀집시키고 일부 적을 가속합니다.","effect":"voidSurge","interval":140},"final":{"tier":"FINAL BOSS","name":"B02 GRAVITY RIFT","ko":"중력 균열체","title":"중력 회랑 보스","color":"#ede9fe","aura":"#a855f7","hpMul":3.41,"speedMul":0.9,"size":51,"rewardMul":5.1,"expMul":4.0,"armor":0.24,"coreDamage":5,"ability":"중력 균열","desc":"체력 구간마다 오라 압박이 강해집니다.","effect":"voidSurge","interval":128}},"11":{"mid":{"tier":"MID BOSS","name":"PRISM WARDEN","ko":"프리즘 수호체","title":"잊힌 코어 감시자","color":"#f5d0fe","aura":"#e879f9","hpMul":2.35,"speedMul":0.92,"size":40,"rewardMul":2.8600000000000003,"expMul":2.76,"armor":0.18,"coreDamage":3,"ability":"프리즘 방어망","desc":"직선 경로와 행렬 물량으로 방어선을 시험합니다.","effect":"cataclysmBurst","interval":138},"final":{"tier":"FINAL BOSS","name":"B03 ASTRA","ko":"공명 수호자 아스트라","title":"안드로메다 최종 수호자","color":"#fecaca","aura":"#ef4444","hpMul":3.45,"speedMul":0.86,"size":51,"rewardMul":5.25,"expMul":4.1,"armor":0.3,"coreDamage":5,"ability":"코어 공명","desc":"보호막, 중력 폭주, 코어 공명으로 3단계 압박을 가합니다.","effect":"coreReboot","interval":126}},"12":{"mid":{"tier":"MID BOSS","name":"PRISM WARDEN","ko":"프리즘 수호체","title":"잊힌 코어 감시자","color":"#f5d0fe","aura":"#e879f9","hpMul":2.43,"speedMul":0.92,"size":41,"rewardMul":2.92,"expMul":2.8200000000000003,"armor":0.18,"coreDamage":3,"ability":"프리즘 방어망","desc":"직선 경로와 행렬 물량으로 방어선을 시험합니다.","effect":"cataclysmBurst","interval":136},"final":{"tier":"FINAL BOSS","name":"B03 ASTRA","ko":"공명 수호자 아스트라","title":"안드로메다 최종 수호자","color":"#fecaca","aura":"#ef4444","hpMul":3.59,"speedMul":0.86,"size":52,"rewardMul":5.4,"expMul":4.2,"armor":0.3,"coreDamage":5,"ability":"코어 공명","desc":"보호막, 중력 폭주, 코어 공명으로 3단계 압박을 가합니다.","effect":"coreReboot","interval":124}},"13":{"mid":{"tier":"MID BOSS","name":"PRISM WARDEN","ko":"프리즘 수호체","title":"잊힌 코어 감시자","color":"#f5d0fe","aura":"#e879f9","hpMul":2.51,"speedMul":0.92,"size":41,"rewardMul":2.9800000000000004,"expMul":2.88,"armor":0.18,"coreDamage":3,"ability":"프리즘 방어망","desc":"직선 경로와 행렬 물량으로 방어선을 시험합니다.","effect":"cataclysmBurst","interval":134},"final":{"tier":"FINAL BOSS","name":"B03 ASTRA","ko":"공명 수호자 아스트라","title":"안드로메다 최종 수호자","color":"#fecaca","aura":"#ef4444","hpMul":3.73,"speedMul":0.86,"size":52,"rewardMul":5.55,"expMul":4.3,"armor":0.3,"coreDamage":5,"ability":"코어 공명","desc":"보호막, 중력 폭주, 코어 공명으로 3단계 압박을 가합니다.","effect":"coreReboot","interval":122}},"14":{"mid":{"tier":"MID BOSS","name":"PRISM WARDEN","ko":"프리즘 수호체","title":"잊힌 코어 감시자","color":"#f5d0fe","aura":"#e879f9","hpMul":2.59,"speedMul":0.92,"size":41,"rewardMul":3.04,"expMul":2.94,"armor":0.18,"coreDamage":3,"ability":"프리즘 방어망","desc":"직선 경로와 행렬 물량으로 방어선을 시험합니다.","effect":"cataclysmBurst","interval":132},"final":{"tier":"FINAL BOSS","name":"B03 ASTRA","ko":"공명 수호자 아스트라","title":"안드로메다 최종 수호자","color":"#fecaca","aura":"#ef4444","hpMul":3.87,"speedMul":0.86,"size":53,"rewardMul":5.7,"expMul":4.4,"armor":0.3,"coreDamage":5,"ability":"코어 공명","desc":"보호막, 중력 폭주, 코어 공명으로 3단계 압박을 가합니다.","effect":"coreReboot","interval":120}},"15":{"mid":{"tier":"MID BOSS","name":"PRISM WARDEN","ko":"프리즘 수호체","title":"잊힌 코어 감시자","color":"#f5d0fe","aura":"#e879f9","hpMul":2.67,"speedMul":0.92,"size":41,"rewardMul":3.1,"expMul":3.0,"armor":0.18,"coreDamage":3,"ability":"프리즘 방어망","desc":"직선 경로와 행렬 물량으로 방어선을 시험합니다.","effect":"cataclysmBurst","interval":130},"final":{"tier":"FINAL BOSS","name":"B03 ASTRA","ko":"공명 수호자 아스트라","title":"안드로메다 최종 수호자","color":"#fecaca","aura":"#ef4444","hpMul":4.01,"speedMul":0.86,"size":53,"rewardMul":5.85,"expMul":4.5,"armor":0.3,"coreDamage":6,"ability":"코어 공명","desc":"보호막, 중력 폭주, 코어 공명으로 3단계 압박을 가합니다.","effect":"coreReboot","interval":118}}};


const COMMERCIAL_BOSS_BALANCE = Object.freeze({
  /* Single-axis boss easing from balance_package_v1.
     Base stage boss definitions stay concept-specific; only HP scale is eased here.
     Stage pressure is applied later through COMMERCIAL_STAGE_BALANCE.boss_multiplier. */
  hpEase: 0.348
});

function applyLateStageBossBalance(stageNo, tier, boss){
  const baseHpMul = Number(boss?.hpMul || 1);
  return {
    ...boss,
    hpMul: Math.max(.34, Number((baseHpMul * COMMERCIAL_BOSS_BALANCE.hpEase).toFixed(3)))
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
  allTowers:[0,1,2,3,4,5,6,7,8,10,11,12]
};
function setTestModeEnabled(flag){
  TEST_MODE_CONFIG.enabled = !!flag;
  document.body.classList.toggle('test-mode-active', TEST_MODE_CONFIG.enabled);
  try{
    window.TEST_MODE_CONFIG = TEST_MODE_CONFIG;
    window.PRD_FORCE_TEST_MODE_ACTIVE = TEST_MODE_CONFIG.enabled;
    window.__PRD_TEST_MODE_ACTIVE = TEST_MODE_CONFIG.enabled;
    if(TEST_MODE_CONFIG.enabled){
      sessionStorage.setItem('PRD_ENTRY_MODE','test');
      sessionStorage.setItem('PRD_TEST_ENTRY_ACTIVE','1');
      sessionStorage.setItem('PLANET_RIFT_TEST_MODE','1');
    }else{
      sessionStorage.removeItem('PRD_ENTRY_MODE');
      sessionStorage.removeItem('PRD_TEST_ENTRY_ACTIVE');
      sessionStorage.removeItem('PLANET_RIFT_TEST_MODE');
      sessionStorage.removeItem('PRD_FORCE_TEST_MODE_ACTIVE');
      sessionStorage.removeItem('PRD_TEST_MODE');
      localStorage.removeItem('PRD_TEST_ENTRY_ACTIVE');
      localStorage.removeItem('PLANET_RIFT_TEST_MODE');
      localStorage.removeItem('PRD_FORCE_TEST_MODE_ACTIVE');
      localStorage.removeItem('PRD_TEST_MODE');
    }
  }catch(_){ }
  if(TEST_MODE_CONFIG.enabled){
    StageMapState.unlocked = STAGE_MAP_DEFS.length;
    StageMapState.selected = clamp(Number(StageMapState.selected || 1), 1, STAGE_MAP_DEFS.length);
    StageMapState.current = StageMapState.selected;
  }else if(META && META.flags){
    META.flags.testMode = false;
  }
}
function applyTestModeOverrides(){
  if(!META) META = defaultOfflineMeta();
  setTestModeEnabled(true);
  StageMapState.unlocked = STAGE_MAP_DEFS.length;
  StageMapState.selected = clamp(Number(StageMapState.selected || 1), 1, STAGE_MAP_DEFS.length);
  StageMapState.current = StageMapState.selected;
  META.unlockedTowers = allTowerTypesFromManifest();
  if(!META.flags || typeof META.flags !== 'object') META.flags = {};
  META.flags.testMode = true;
  try{ window.META = META; window.StageMapState = StageMapState; window.TEST_MODE_CONFIG = TEST_MODE_CONFIG; sessionStorage.setItem('PRD_TEST_ENTRY_ACTIVE','1'); sessionStorage.setItem('PLANET_RIFT_TEST_MODE','1'); }catch(_){ }
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
const STAGE_TOWER_REWARDS_EXTRA = {
  3:[{type:10, name:'공명 타워', theme:'안드로메다 공명 기술', desc:'M02/B01/B03의 보호막과 공명 장갑을 약화시키는 안드로메다 대응 타워입니다.'}],
  7:[{type:11, name:'중력 렌즈 타워', theme:'안드로메다 중력 기술', desc:'빠른 균열 질주체와 중력 포식체 러시를 늦추는 제어 타워입니다.'}],
  11:[{type:12, name:'성흔 프리즘 타워', theme:'고대 프리즘 방어망', desc:'직선 구간과 행렬형 적을 관통하는 프리즘 빔 타워입니다.'}]
};
function stageTowerRewards(stageNo){
  const list = [];
  const base = STAGE_TOWER_REWARDS[Number(stageNo)];
  if(base) list.push(base);
  const extra = STAGE_TOWER_REWARDS_EXTRA[Number(stageNo)];
  if(Array.isArray(extra)) extra.forEach(r => { if(r) list.push(r); });
  return list;
}


// v128: progression manifest. Stage and tower unlocks are now derived from one canonical table,
// not from scattered CSS/script overrides. This keeps normal mode, test mode, map UI and hangar in sync.
const STAGE_UNLOCK_MANIFEST = STAGE_MAP_DEFS.map(def => ({
  stage: def.stage,
  opensNextStageOnClear: Math.min(STAGE_MAP_DEFS.length, def.stage + 1),
  towerReward: STAGE_TOWER_REWARDS[def.stage] || null,
  towerRewards: stageTowerRewards(def.stage)
}));
function isTestModeActiveCanonical(){
  return !!(TEST_MODE_CONFIG && TEST_MODE_CONFIG.enabled);
}
function allTowerTypesFromManifest(){
  const set = new Set(STARTER_PLANET_TYPES);
  Object.values(STAGE_TOWER_REWARDS || {}).forEach(r => { if(r && Number.isInteger(Number(r.type))) set.add(Number(r.type)); });
  Object.values(STAGE_TOWER_REWARDS_EXTRA || {}).forEach(list => {
    if(Array.isArray(list)) list.forEach(r => { if(r && Number.isInteger(Number(r.type))) set.add(Number(r.type)); });
  });
  return Array.from(set).sort((a,b)=>a-b);
}
function deriveProgressFromManifest(savedProgress=null){
  const max = STAGE_MAP_DEFS.length;
  if(isTestModeActiveCanonical()){
    return {unlocked:max, selected:clamp(Number(StageMapState.selected || 1), 1, max), current:clamp(Number(StageMapState.current || StageMapState.selected || 1), 1, max), towers:allTowerTypesFromManifest()};
  }
  const clears = META?.clears || {};
  const savedUnlocked = clamp(Number(savedProgress?.unlocked || StageMapState?.unlocked || 1), 1, max);
  let unlocked = savedUnlocked;
  const towerSet = new Set(normalizeUnlockedTowers(META?.unlockedTowers, clears));
  for(const row of STAGE_UNLOCK_MANIFEST){
    if(Number(clears[String(row.stage)] || clears[row.stage] || 0) > 0){
      unlocked = Math.max(unlocked, row.opensNextStageOnClear);
      const rewards = Array.isArray(row.towerRewards) ? row.towerRewards : (row.towerReward ? [row.towerReward] : []);
      rewards.forEach(reward => { if(reward) towerSet.add(Number(reward.type)); });
    }
  }
  return {unlocked:clamp(unlocked,1,max), selected:clamp(Number(savedProgress?.selected || StageMapState.selected || unlocked), 1, max), current:clamp(Number(savedProgress?.current || StageMapState.current || StageMapState.selected || unlocked), 1, max), towers:Array.from(towerSet).filter(v=>Number.isInteger(Number(v))).map(Number).sort((a,b)=>a-b)};
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
  if(!opts.allowLockedPreview && !isTestModeActiveCanonical() && StageMapState.selected > StageMapState.unlocked) StageMapState.selected = StageMapState.unlocked;
  StageMapState.current = clamp(Number(opts.currentStage || progress.current || StageMapState.selected || 1), 1, max);
  if(META){ META.unlockedTowers = progress.towers.slice(); }
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


/* v77: in-closure runtime bridge for stage progression and battle chrome visibility.
   Later DOM-only patches cannot directly mutate StageMapState because the main game runs inside this closure.
   Keep the source of truth here: META.clears -> unlocked stage, and hide battle HUD outside battle. */
function computeUnlockedStageFromClears(baseUnlocked=1){
  const max = STAGE_MAP_DEFS.length;
  if(TEST_MODE_CONFIG.enabled) return max;
  const clears = META?.clears || {};
  let unlocked = clamp(Number(baseUnlocked || 1), 1, max);
  for(let stage=1; stage<=max; stage++){
    if(Number(clears[String(stage)] || clears[stage] || 0) > 0){
      unlocked = Math.max(unlocked, Math.min(max, stage + 1));
    }
  }
  return clamp(unlocked, 1, max);
}
function hardSyncStageProgressFromClears(opts={}){
  const max = STAGE_MAP_DEFS.length;
  if(!META) META = defaultOfflineMeta();
  if(TEST_MODE_CONFIG.enabled){
    StageMapState.unlocked = max;
    StageMapState.selected = clamp(Number(opts.selectStage || StageMapState.selected || 1), 1, max);
    StageMapState.current = clamp(Number(opts.currentStage || StageMapState.current || StageMapState.selected || 1), 1, max);
    META.unlockedTowers = allTowerTypesFromManifest();
    return StageMapState.unlocked;
  }
  const unlocked = computeUnlockedStageFromClears(1);
  StageMapState.unlocked = unlocked;
  if(opts.selectStage){
    StageMapState.selected = clamp(Number(opts.selectStage), 1, max);
  }else if(opts.keepSelected || opts.allowLockedPreview){
    StageMapState.selected = clamp(Number(StageMapState.selected || unlocked), 1, max);
  }else{
    StageMapState.selected = clamp(Number(StageMapState.selected || unlocked), 1, unlocked);
  }
  if(!opts.allowLockedPreview && StageMapState.selected > StageMapState.unlocked){
    StageMapState.selected = StageMapState.unlocked;
  }
  StageMapState.current = clamp(Number(opts.currentStage || StageMapState.current || StageMapState.selected || unlocked), 1, max);
  META.unlockedTowers = normalizeUnlockedTowers(META.unlockedTowers, META.clears || {});
  if(opts.save !== false){
    saveOfflineMeta();
    saveStageMapProgress();
  }
  return StageMapState.unlocked;
}
function setBattleChromeVisible(visible){
  const active = !!visible;
  const body = document.body;
  if(body){
    body.classList.toggle('prd-combat-ui-active', active);
    body.classList.toggle('prd-map-ui-active', !active);
    body.classList.toggle('prd-battle-active', active);
    body.classList.toggle('prd-combat-screen-active', active);
  }
  const combatSelectors = [
    '#combatHudOverlay', '#combatHudTopLine', '#combatHudCommands',
    '#combatHudCommandsLandscapeDock', '#combatHudCommandsPortraitDock',
    '#battleHud', '#side > .battleActions', '#field > .fieldTopControls',
    '#combatHudTopLine .fieldTopControls', '#combatHudOverlay .fieldTopControls'
  ];
  document.querySelectorAll(combatSelectors.join(',')).forEach(el => {
    if(!el) return;
    if(active){
      if(el.dataset.v77Hidden === '1'){
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.style.removeProperty('opacity');
        el.style.removeProperty('pointer-events');
        delete el.dataset.v77Hidden;
      }
    }else{
      el.dataset.v77Hidden = '1';
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('opacity', '0', 'important');
      el.style.setProperty('pointer-events', 'none', 'important');
    }
  });
}
function syncNonBattleChrome(){ setBattleChromeVisible(false); }
const OFFLINE_CHAPTERS = {"1":{"title":"4-1 침묵의 진입로 — 침묵의 성운","intro":"잔향 신호 추적 · 안드로메다 진입 · 기본 화력 확인. 안드로메다 소용돌이 항로의 1번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"외곽 수호체가 보호막과 보조 소환으로 안드로메다 외곽을 닫으려 합니다.","clear":"침묵의 진입로 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"2":{"title":"4-2 잔향 성운 — 침묵의 성운","intro":"잔향 분기 · 공명 흔적 · 초반 병합 준비. 안드로메다 소용돌이 항로의 2번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"외곽 수호체가 보호막과 보조 소환으로 안드로메다 외곽을 닫으려 합니다.","clear":"잔향 성운 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"3":{"title":"4-3 공명 파편 — 침묵의 성운","intro":"공명 표식 · 보호막 약화 · 공명 타워 학습. 안드로메다 소용돌이 항로의 3번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"외곽 수호체가 보호막과 보조 소환으로 안드로메다 외곽을 닫으려 합니다.","clear":"공명 파편 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"4":{"title":"4-4 표식의 전장 — 침묵의 성운","intro":"표식 분산 · 분기처럼 보이는 합류 경로 · 화력 분배. 안드로메다 소용돌이 항로의 4번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"외곽 수호체가 보호막과 보조 소환으로 안드로메다 외곽을 닫으려 합니다.","clear":"표식의 전장 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"5":{"title":"4-5 외곽 수호체 — 침묵의 성운","intro":"외곽 장갑 보스 · 공명 보호막 대응 · 4장 마무리. 안드로메다 소용돌이 항로의 5번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"외곽 수호체가 보호막과 보조 소환으로 안드로메다 외곽을 닫으려 합니다.","clear":"외곽 수호체 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"6":{"title":"5-1 뒤틀린 항로 — 중력 회랑","intro":"고정 포탈 · 빠른 적 압박 · 출구 화력 배치. 안드로메다 소용돌이 항로의 6번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"중력 균열체가 회랑 전체를 뒤틀어 적의 전진을 가속합니다.","clear":"뒤틀린 항로 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"7":{"title":"5-2 중력 렌즈 — 중력 회랑","intro":"중력 렌즈 · 둔화 학습 · 속도 압박 제어. 안드로메다 소용돌이 항로의 7번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"중력 균열체가 회랑 전체를 뒤틀어 적의 전진을 가속합니다.","clear":"중력 렌즈 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"8":{"title":"5-3 느려진 별빛 — 중력 회랑","intro":"느린 별빛 · 병합 효율 검증 · 제어 화력 운영. 안드로메다 소용돌이 항로의 8번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"중력 균열체가 회랑 전체를 뒤틀어 적의 전진을 가속합니다.","clear":"느려진 별빛 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"9":{"title":"5-4 균열의 행렬 — 중력 회랑","intro":"균열 행렬 · 포탈 출구 대응 · 관통/범위 가치 상승. 안드로메다 소용돌이 항로의 9번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"중력 균열체가 회랑 전체를 뒤틀어 적의 전진을 가속합니다.","clear":"균열의 행렬 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"10":{"title":"5-5 중력 균열체 — 중력 회랑","intro":"중력 보스 · 속도 버프 오라 · 회랑 결전. 안드로메다 소용돌이 항로의 10번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"중력 균열체가 회랑 전체를 뒤틀어 적의 전진을 가속합니다.","clear":"중력 균열체 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"11":{"title":"6-1 폐허 코어 — 잊힌 코어","intro":"폐허 코어 · 직선 경로 대응 · 프리즘 학습. 안드로메다 소용돌이 항로의 11번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"공명 수호자 아스트라가 코어 공명을 열며 최종 방어망을 가동합니다.","clear":"폐허 코어 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"12":{"title":"6-2 프리즘 방어망 — 잊힌 코어","intro":"프리즘 방어망 · 직선 관통 · 행렬 처리. 안드로메다 소용돌이 항로의 12번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"공명 수호자 아스트라가 코어 공명을 열며 최종 방어망을 가동합니다.","clear":"프리즘 방어망 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"13":{"title":"6-3 오염된 방어 프로토콜 — 잊힌 코어","intro":"오염된 프로토콜 · 포탈/중력/행렬 종합 테스트. 안드로메다 소용돌이 항로의 13번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"공명 수호자 아스트라가 코어 공명을 열며 최종 방어망을 가동합니다.","clear":"오염된 방어 프로토콜 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"14":{"title":"6-4 수호자의 심장 — 잊힌 코어","intro":"수호자 심장 · wave 시작 랜덤 버프 · 최종 관문. 안드로메다 소용돌이 항로의 14번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"공명 수호자 아스트라가 코어 공명을 열며 최종 방어망을 가동합니다.","clear":"수호자의 심장 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."},"15":{"title":"6-5 안드로메다의 잔향 — 잊힌 코어","intro":"중앙 코어 · 최종 보스 · 핵심 배치 칸 공략. 안드로메다 소용돌이 항로의 15번째 성역입니다.","mid":"중간 보스가 방어선의 약점을 시험합니다.","final":"공명 수호자 아스트라가 코어 공명을 열며 최종 방어망을 가동합니다.","clear":"안드로메다의 잔향 정화 완료. 다음 소용돌이 노드 좌표가 활성화됩니다."}};
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
  // Runtime-only mode: persisted save data must never reactivate TEST MODE.
  // TEST MODE is enabled only by the current entry flow (TEST MODE button or explicit URL flag).
  m.flags.testMode = false;
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
      stageTowerRewards(Number(stageNo)).forEach(reward => { if(reward) set.add(Number(reward.type)); });
    }
  }
  return Array.from(set)
    .filter(v => Number.isInteger(v) && v >= 0 && v < PLANETS.length && v !== HIDDEN_PLANET_TYPE)
    .sort((a,b)=>a-b);
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
  const pool = Array.from(unlockedTowerSet()).filter(type => type >= 0 && type < PLANETS.length && type !== HIDDEN_PLANET_TYPE);
  return pool.length ? pool : STARTER_PLANET_TYPES.slice();
}
function stageTowerReward(stageNo){
  return stageTowerRewards(stageNo)[0] || null;
}
function stageTowerRewardText(stageNo){
  const rewards = stageTowerRewards(stageNo);
  if(!rewards.length) return '추가 타워 보상 없음';
  return rewards.map(reward => {
    const owned = isTowerUnlocked(reward.type);
    return `${owned ? '획득 완료' : '클리어 보상'}: ${reward.name} · ${reward.theme}`;
  }).join(' / ');
}
function towerUnlockRequirementText(type){
  type = Number(type);
  for(const [stageNo, reward] of Object.entries(STAGE_TOWER_REWARDS || {})){
    if(Number(reward.type) === type) return `${stageNo}성역 클리어 보상`;
  }
  for(const [stageNo, rewards] of Object.entries(STAGE_TOWER_REWARDS_EXTRA || {})){
    if(Array.isArray(rewards) && rewards.some(r => Number(r.type) === type)) return `${stageNo}성역 클리어 보상`;
  }
  return '기본 지급';
}
function unlockStageTower(stageNo){
  const rewards = stageTowerRewards(stageNo);
  if(!rewards.length || !META) return false;
  const set = unlockedTowerSet();
  const newly = [];
  for(const reward of rewards){
    if(!set.has(Number(reward.type))){
      set.add(Number(reward.type));
      newly.push(reward);
    }
  }
  if(!newly.length) return false;
  META.unlockedTowers = Array.from(set).sort((a,b)=>a-b);
  saveOfflineMeta();
  const msg = `신규 타워 획득 — ${newly.map(r => r.name).join(' · ')}`;
  toast(msg);
  sound('unlock');
  newly.forEach(r => log(`신규 타워 획득 — ${r.name}: ${r.desc}`));
  return true;
}
function nextTowerRewardText(){
  for(const stage of STAGE_MAP_DEFS){
    const pending = stageTowerRewards(stage.stage).filter(reward => !isTowerUnlocked(reward.type));
    if(pending.length) return `${stage.ko} 클리어 → ${pending.map(r => r.name).join(' · ')}`;
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
    applyCanonicalProgressToState({preferSelected:true});
    if(!TEST_MODE_CONFIG.enabled) saveOfflineMeta();
  }
  catch(err){ META = defaultOfflineMeta(); try{ window.META = META; window.StageMapState = StageMapState; window.TEST_MODE_CONFIG = TEST_MODE_CONFIG; }catch(_){ } }
  renderOfflineMetaPanel();
}
function saveOfflineMeta(){
  if(TEST_MODE_CONFIG.enabled) return;
  try{
    if(META && META.flags) META.flags.testMode = false;
    META.saveVersion = SAVE_SCHEMA_VERSION;
    window.META = META;
    window.StageMapState = StageMapState;
    window.TEST_MODE_CONFIG = TEST_MODE_CONFIG;
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
  invalidateGlobalUpgradeStatsCache();
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
  invalidateGlobalUpgradeStatsCache();
  saveOfflineMeta();
  renderOfflineMetaPanel();
  toast(`${cfg.name} Lv.${fmt2(lv+1)}`);
  if(S){ syncGlobalUpgradesFromMeta(); updateUI(); }
}
// v-economy-balance: stage-wide economy tuning.
// Keep early 1-1~1-3 close to the original 100-cost tutorial feel,
// then make late waves/stages pay for extra tower density instead of snowballing for free.
const ECONOMY_STAGE_KILL_SCALE = Object.freeze([1.00,.96,.92,.88,.84,.80,.76,.72,.68,.64,.60,.56,.52,.49,.46]);
const ECONOMY_STAGE_WAVE_SCALE = Object.freeze([1.00,.96,.92,.88,.84,.80,.76,.72,.68,.64,.60,.56,.52,.49,.46]);
const ECONOMY_STAGE_COMBO_SCALE = Object.freeze([1.00,.84,.72,.62,.54,.46,.40,.35,.30,.26,.22,.19,.16,.14,.12]);
const ECONOMY_TREASURE_GOLD_SCALE = Object.freeze([1.00,.94,.88,.80,.74,.68,.63,.58,.54,.50,.47,.44,.41,.39,.37]);
const ECONOMY_TREASURE_SHARD_CHANCE = Object.freeze([.45,.40,.35,.30,.28,.26,.24,.22,.20,.19,.18,.17,.16,.15,.14]);
const ECONOMY_TREASURE_SHARD_SCALE = Object.freeze([1.00,.92,.84,.76,.68,.60,.54,.50,.46,.42,.38,.35,.32,.30,.28]);
function economyClampInt(v,min,max){
  v = Math.floor(Number(v || 0));
  if(!Number.isFinite(v)) v = min;
  return Math.max(min, Math.min(max, v));
}
function economyStageNo(stageNo=null){
  const raw = stageNo ?? ((typeof S !== 'undefined' && S && S.stageNo) || (typeof StageMapState !== 'undefined' && StageMapState.current) || 1);
  return economyClampInt(raw, 1, STAGE_MAP_DEFS.length);
}
function economyWaveNo(waveNo=null){
  const raw = waveNo ?? ((typeof S !== 'undefined' && S && S.ogge) || 1);
  return economyClampInt(raw, 1, 10);
}
function economyScaleFrom(table, stageNo){
  const idx = economyStageNo(stageNo) - 1;
  return Number(table[idx] ?? table[table.length - 1] ?? 1) || 1;
}
function economyLateWaveScale(waveNo, floor=.86, perWave=.02){
  const late = Math.max(0, economyWaveNo(waveNo) - 3);
  return Math.max(floor, 1 - late * perWave);
}
function economyKillRewardScale(stageNo=null, waveNo=null){
  return economyScaleFrom(ECONOMY_STAGE_KILL_SCALE, stageNo) * economyLateWaveScale(waveNo, .88, .018);
}
function economyWaveClearRewardScale(stageNo=null, waveNo=null){
  return economyScaleFrom(ECONOMY_STAGE_WAVE_SCALE, stageNo) * economyLateWaveScale(waveNo, .84, .024);
}
function economyComboRewardScale(stageNo=null, waveNo=null){
  return economyScaleFrom(ECONOMY_STAGE_COMBO_SCALE, stageNo) * economyLateWaveScale(waveNo, .78, .030);
}
function economyTreasureGoldScale(stageNo=null, waveNo=null){
  return economyScaleFrom(ECONOMY_TREASURE_GOLD_SCALE, stageNo) * economyLateWaveScale(waveNo, .86, .018);
}
function economyTreasureShardChance(stageNo=null){
  return economyScaleFrom(ECONOMY_TREASURE_SHARD_CHANCE, stageNo);
}
function economyTreasureShardAmount(baseAmount, stageNo=null, waveNo=null){
  const scaled = Number(baseAmount || 0) * economyScaleFrom(ECONOMY_TREASURE_SHARD_SCALE, stageNo) * economyLateWaveScale(waveNo, .88, .016);
  return Math.max(1, Math.floor(scaled));
}
function currentSummonCost(){
  const stage = economyStageNo();
  const wave = economyWaveNo();
  const stageAdd = Math.max(0, stage - 1) * 4;
  const waveAdd = Math.max(0, wave - 3) * 8;
  const lateStageAdd = Math.max(0, stage - 6) * 3;
  const raw = 100 + stageAdd + waveAdd + lateStageAdd;
  return Math.max(100, Math.round(raw / 5) * 5);
}

// v-wave-defense-balance-v3: sub-stage 4+ durability tuning.
// Scope: monster durability only. Economy, terrain pressure, tower numbers and UI stay unchanged.
// The previous v2 curve still allowed Lv.1 tower swarms to clear mid/late waves too easily,
// so v3 adds a moderate armor-first bump while keeping the 1~3 tutorial waves intact.
const WAVE_DEFENSE_ARMOR_BONUS = Object.freeze([0, 0, 0, .100, .135, .170, .205, .240, .275, .310]);
const WAVE_DEFENSE_HP_MULTIPLIER = Object.freeze([1, 1, 1, 1.18, 1.30, 1.43, 1.57, 1.73, 1.90, 2.10]);
function waveDefenseTuning(stageNo=null, waveNo=null, isBoss=false){
  const stage = economyStageNo(stageNo);
  const wave = economyWaveNo(waveNo);
  if(wave < 4) return {armor:0, hpMul:1};
  const idx = Math.max(0, Math.min(WAVE_DEFENSE_ARMOR_BONUS.length - 1, wave - 1));
  const stagePressure = Math.max(0, stage - 1);
  const bossArmorScale = isBoss ? .45 : 1;
  const bossHpScale = isBoss ? .45 : 1;
  const armorCap = isBoss ? .26 : .52;
  const armor = Math.min(armorCap, (Number(WAVE_DEFENSE_ARMOR_BONUS[idx] || 0) + stagePressure * .012) * bossArmorScale);
  const hpMul = 1 + ((Number(WAVE_DEFENSE_HP_MULTIPLIER[idx] || 1) - 1) + stagePressure * .020) * bossHpScale;
  return {armor, hpMul};
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
    const nextStageNo = Math.min(STAGE_MAP_DEFS.length, Number(stageNo) + 1);
    StageMapState.unlocked = Math.max(Number(StageMapState.unlocked || 1), nextStageNo);
    StageMapState.current = nextStageNo;
    if(Number(StageMapState.selected || 1) <= Number(stageNo)) StageMapState.selected = nextStageNo;
    if(typeof hardSyncStageProgressFromClears === 'function'){
      hardSyncStageProgressFromClears({selectStage:StageMapState.selected, currentStage:StageMapState.current, keepSelected:true, allowLockedPreview:true, save:true});
    }else if(typeof applyCanonicalProgressToState === 'function'){
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
  clearStageResultPendingFlag();
}

function showGameOverOverlay(summary){
  try{
    const safeSummary = summary || {};
    const stageNo = Number(safeSummary.stageNo || S?.stageNo || StageMapState.current || 1);
    const waveNo = Number(safeSummary.wave || safeSummary.ogge || S?.ogge || 1);
    const def = getStageDef(stageNo);
    const overlay = createStageResultOverlay({
      kind:'defeat',
      stageNo,
      wave:waveNo,
      kicker:'MISSION FAILED',
      title:'게임 오버',
      body:`${def.name} / ${def.ko} ${fmt2(waveNo)}웨이브에서 코어가 붕괴되었습니다. 획득한 성흔 조각으로 업그레이드한 뒤 다시 도전할 수 있습니다.`,
      coreLoss:Number(safeSummary.coreLoss || coreLossValue(S?.resultStageStartHp || S?.maxHp || 0, S?.hp || 0)),
      shardsGained:Number(safeSummary.shardsGained || 0),
      kills:Number(safeSummary.kills || 0),
      nextText:nextResultSummaryText('defeat', stageNo, waveNo),
      continueText:'계속하기'
    });
    if(S) S.gameOverOverlayShown = true;
    const continueBtn = overlay.querySelector('#stageResultContinueBtn');
    const mapBtn = overlay.querySelector('#stageResultMapBtn');
    const upgradeBtn = overlay.querySelector('#stageResultUpgradeBtn');
    if(continueBtn){
      continueBtn.onclick = () => {
        removeGameOverOverlay();
        StageMapState.selected = stageNo;
        startSelectedStageFromMap();
      };
    }
    if(mapBtn){
      mapBtn.onclick = () => {
        goStageMapFromResult(stageNo, `전투 실패 기록 회수 완료 — 성흔 조각으로 일반 스킬을 강화한 뒤 ${fmt2(stageNo)}성역에 재도전하세요.`);
      };
    }
    if(upgradeBtn) upgradeBtn.onclick = () => openUpgradeFromResult(stageNo);
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
  overlay.className = 'gameOverOverlay stageResultOverlay stageResultOverlay--defeat';
  overlay.innerHTML = `<div class="stageResultCard" role="dialog" aria-modal="true">
    <div class="stageResultKicker">MISSION FAILED</div>
    <h2>게임 오버</h2>
    <p class="stageResultBody">코어가 파괴되어 전투가 종료되었습니다. 업그레이드하거나 같은 성역에 재도전할 수 있습니다.</p>
    <div class="stageResultNext"><span>NEXT</span><b>${err ? '표시 오류를 복구했습니다. ' : ''}성흔 조각으로 전역 연구를 강화한 뒤 재도전하세요.</b></div>
    ${resultButtonHtml('계속하기')}
  </div>`;
  document.body.appendChild(overlay);
  if(S) S.gameOverOverlayShown = true;
  const continueBtn = overlay.querySelector('#stageResultContinueBtn');
  const mapBtn = overlay.querySelector('#stageResultMapBtn');
  const upgradeBtn = overlay.querySelector('#stageResultUpgradeBtn');
  if(continueBtn) continueBtn.onclick = () => { removeGameOverOverlay(); StageMapState.selected = stageNo; startSelectedStageFromMap(); };
  if(mapBtn) mapBtn.onclick = () => goStageMapFromResult(stageNo);
  if(upgradeBtn) upgradeBtn.onclick = () => openUpgradeFromResult(stageNo);
  return overlay;
}


function triggerGameOver(reason='core'){
  if(!S || S.gameOver) return;
  syncNonBattleChrome();
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
    coreLoss: coreLossValue(S.resultStageStartHp || S.maxHp || 0, S.hp || 0),
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
    const audioCues = (typeof STAGE_AUDIO_CUES !== 'undefined' && STAGE_AUDIO_CUES) ? STAGE_AUDIO_CUES : [{mood:'기본 전투 루프'}];
    const audioCue = audioCues[Number(def.theme)] || audioCues[0] || {mood:'기본 전투 루프'};
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
  terrainHazards = Array(GRID_COLS*GRID_ROWS).fill('');
  invalidateTerrainRenderCache();
  recycleAllEnemies();
  recycleAllBullets();
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
  syncStageUnlockFromClears();
  const unlocked = TEST_MODE_CONFIG.enabled ? STAGE_MAP_DEFS.length : clamp(StageMapState.unlocked, 1, STAGE_MAP_DEFS.length);
  const selectedStage = clamp(StageMapState.selected, 1, STAGE_MAP_DEFS.length);
  const canEnterSelectedStage = TEST_MODE_CONFIG.enabled || selectedStage <= unlocked;
  StageMapState.unlocked = unlocked;
  StageMapState.selected = selectedStage;
  map.dataset.unlocked = String(unlocked);
  map.dataset.selected = String(selectedStage);
  map.classList.remove(...Array.from({length:STAGE_MAP_DEFS.length},(_,i)=>`stage-selected-${i+1}`));
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
  syncNonBattleChrome();
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

function visibleStageResultOverlay(){
  const overlay = getActiveStageResultOverlay();
  if(!overlay) return null;
  try{
    const cs = window.getComputedStyle(overlay);
    if(cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || 1) === 0) return null;
  }catch(_){ }
  return overlay;
}
function isStageResultPendingBlocking(){
  if(visibleStageResultOverlay()) return true;
  const pendingAt = Number(window.PRD_STAGE_RESULT_PENDING_AT || 0);
  if(window.PRD_STAGE_RESULT_PENDING && pendingAt && Date.now() - pendingAt < 1200) return true;
  if(window.PRD_STAGE_RESULT_PENDING){
    clearStageResultPendingFlag();
    return false;
  }
  return false;
}
function startSelectedStageFromMap(){
  try{ if(typeof clearResultStageMapDirectV116 === 'function') clearResultStageMapDirectV116(); }catch(_err){}
  if(isStageResultPendingBlocking()){
    // Stage clear/game-over result is still being mounted or displayed.
    // Do not consume the map ENTER click here; otherwise landscape dock buttons can hide
    // via prd-stage-entering even though battle entry is intentionally blocked.
    window.PRD_STAGE_ENTERING = false;
    if(document.body) document.body.classList.remove('prd-stage-entering');
    try{ renderStageMap(); }catch(_){ }
    return false;
  }
  const selectedStageNo = clamp(StageMapState.selected, 1, STAGE_MAP_DEFS.length);
  if(!TEST_MODE_CONFIG.enabled && selectedStageNo > StageMapState.unlocked){
    // v85: do not wake battle HUD when the selected stage is locked.
    // Older code turned the combat chrome on before this guard, which caused
    // the lower/right combat UI to flash and occasionally intercept the map enter flow.
    setBattleChromeVisible(false);
    const defLocked = getStageDef(selectedStageNo);
    const arcLocked = getConstellationArcByStage(selectedStageNo);
    toast(`${arcLocked.ko} · ${defLocked.ko}는 아직 미개방입니다.`);
    renderStageMap();
    return;
  }
  // v85: mark the short map→battle transition so map HUD sync timers do not
  // immediately hide the combat HUD while the game screen is being mounted.
  window.PRD_STAGE_ENTERING = true;
  if(document.body) document.body.classList.add('prd-stage-entering');
  setBattleChromeVisible(true);
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
    // v96: Expo WebView can report the old portrait/landscape size for one frame.
    // Apply the measured visual viewport before the board/canvas reads its rect.
    try{ if(window.PRD_APPLY_EXPO_VIEWPORT_V96) window.PRD_APPLY_EXPO_VIEWPORT_V96('before-stage-start'); }catch(err){ console.warn('v96 viewport pre-sync failed', err); }
    // v22: force layout before measuring field/canvas. Without this reflow,
    // some mobile/portrait browsers used the previous screen's rect and the
    // tactical grid appeared about one cell lower than the visible focus area.
    void gameEl.offsetHeight;
    void gameEl.getBoundingClientRect();
  }

  // Board size/orientation is locked when the battle actually starts.
  // This avoids using the hidden menu/stage-map canvas size and ensures
  // landscape adds columns while portrait adds rows.
  configureBattleBoardForCurrentLayout('stage-start');

  reset();
  S.stageNo = stageNo;
  S.stageMapKey = def.key;
  S.theme = def.theme;
  S.ogge = 1;
  S.resultStageStartHp = Number(S.hp || S.maxHp || 0);
  S.resultStageStartMaxHp = Number(S.maxHp || S.hp || 0);
  S.resultWaveStartHp = Number(S.hp || S.maxHp || 0);
  S.resultWaveStartMaxHp = Number(S.maxHp || S.hp || 0);
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
  setTimeout(() => {
    window.PRD_STAGE_ENTERING = false;
    if(document.body) document.body.classList.remove('prd-stage-entering');
  }, 900);
}


function clearStageResultPendingFlag(){
  try{ window.PRD_STAGE_RESULT_PENDING = false; }catch(_){ }
  try{ window.PRD_STAGE_RESULT_PENDING_AT = 0; }catch(_){ }
}

function removeStageClearOverlay(){
  const existing = $('stageClearOverlay');
  if(existing) existing.remove();
  clearStageResultPendingFlag();
}

function removeStageResultOverlay(){
  removeStageClearOverlay();
  removeGameOverOverlay();
  clearStageResultPendingFlag();
}

function resultStageTheme(stageNo){
  const def = getStageDef(stageNo || StageMapState.current || 1);
  const themeDef = THEMES[Number(def.theme || 0)] || THEMES[0];
  return {stage:def, theme:themeDef, bg:themeDef.bg, color:def.color || themeDef.color || '#38bdf8'};
}

function coreLossValue(startHp, endHp){
  return Math.max(0, Math.round(Number(startHp || 0) - Number(endHp || 0)));
}

function nextResultSummaryText(kind, stageNo, waveNo){
  const stage = clamp(Number(stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const wave = Number(waveNo || 1);
  if(kind === 'sub-clear'){
    const nextWave = Math.min(10, wave + 1);
    const preview = getWavePreviewInfo(nextWave, stage);
    return `다음 서브 스테이지 ${fmt2(stage)}-${fmt2(nextWave)} · ${preview.title}. ${preview.detail}`;
  }
  if(kind === 'defeat'){
    const copy = getStageDescriptionCopy(stage);
    return `다음 도전: ${fmt2(stage)}성역 재정비. ${copy.strategy || gameOverTipText()}`;
  }
  const nextStage = Math.min(STAGE_MAP_DEFS.length, stage + 1);
  const nextDef = getStageDef(nextStage);
  const copy = getStageDescriptionCopy(nextStage);
  if(stage >= STAGE_MAP_DEFS.length) return '다음 목표: 모든 성역의 3성 숙련도와 최고 웨이브 기록을 갱신하세요.';
  return `다음 메인 스테이지: ${nextDef.stage}. ${nextDef.name} / ${nextDef.ko}. ${copy.summary}`;
}

function goStageMapFromResult(stageNo, hintText=''){
  return resultStageMapNavigateV116(null, stageNo, hintText);
}

function getActiveStageResultOverlay(){
  return $('stageClearOverlay') || $('gameOverOverlay');
}

function setStageResultArmoryStack(open){
  const on = !!open;
  if(document.body) document.body.classList.toggle('stage-result-armory-stack-open', on);
  const overlay = getActiveStageResultOverlay();
  if(overlay){
    overlay.classList.toggle('stageResultOverlay--underArmory', on);
    overlay.setAttribute('aria-hidden', on ? 'true' : 'false');
  }
}

window.__closeStageResultArmoryStack = function(){
  if(!window.__stageResultArmoryStackActive) return;
  window.__stageResultArmoryStackActive = false;
  setStageResultArmoryStack(false);
};

function openUpgradeFromResult(stageNo){
  const targetStage = clamp(Number(stageNo || StageMapState.selected || 1), 1, STAGE_MAP_DEFS.length);
  const resultOverlay = getActiveStageResultOverlay();

  if(resultOverlay && typeof window.openTowerArmoryPopup === 'function'){
    StageMapState.selected = targetStage;
    StageMapState.current = targetStage;
    window.__stageResultArmoryStackActive = true;
    setStageResultArmoryStack(true);
    requestAnimationFrame(() => {
      try{
        window.openTowerArmoryPopup('common');
      }catch(err){
        console.warn('upgrade popup open failed', err);
        window.__closeStageResultArmoryStack && window.__closeStageResultArmoryStack();
      }
    });
    return;
  }

  goStageMapFromResult(targetStage, '성흔 조각으로 공통 연구를 강화한 뒤 다시 도전하세요.');
  setTimeout(() => {
    try{
      if(typeof window.openTowerArmoryPopup === 'function') window.openTowerArmoryPopup('common');
      else $('stageTowerManageBtn')?.click();
    }catch(err){ console.warn('upgrade popup open failed', err); }
  }, 80);
}



/* ===== v116-core-result-stage-map-return =====
   Result overlay "스테이지 맵으로 이동" must leave battle lifecycle and show
   the real CONSTELLATION MAP immediately. This is the only result-navigation fix
   applied on top of v110. */
function clearResultStageMapDirectV116(){
  try{
    if(document.body) document.body.classList.remove('prd-result-stage-map-direct-v116');
    const game = $('game');
    if(game){
      game.hidden = false;
      ['display','visibility','opacity','pointer-events','z-index'].forEach(function(prop){ game.style.removeProperty(prop); });
    }
    const map = $('stageMap');
    if(map){ ['visibility','opacity','pointer-events','z-index'].forEach(function(prop){ map.style.removeProperty(prop); }); }
  }catch(_err){}
}

function resultStageMapTargetV116(explicitStage, source){
  let stage = Number(explicitStage || 0);
  try{
    const overlay = source && source.closest ? source.closest('.stageResultOverlay,#stageClearOverlay,#gameOverOverlay') : null;
    if(!stage && overlay && overlay.dataset && overlay.dataset.resultStageNo) stage = Number(overlay.dataset.resultStageNo || 0);
    if(!stage && overlay){
      const stat = overlay.querySelector('.stageResultStat b');
      const m = String((stat && stat.textContent) || '').match(/(\d+)/);
      if(m) stage = Number(m[1] || 0);
    }
    if(!stage) stage = Number((S && S.stageNo) || StageMapState.current || StageMapState.selected || 1);
    if(overlay && overlay.classList && overlay.classList.contains('stageResultOverlay--main-clear')){
      stage = Math.min(STAGE_MAP_DEFS.length, stage + 1);
    }
  }catch(_err){
    stage = Number((S && S.stageNo) || StageMapState.current || StageMapState.selected || 1);
  }
  return clamp(stage || 1, 1, STAGE_MAP_DEFS.length);
}

function ensureResultStageMapDirectStyleV116(){
  if(!document || document.getElementById('prd-result-stage-map-direct-v116-style')) return;
  const style = document.createElement('style');
  style.id = 'prd-result-stage-map-direct-v116-style';
  style.textContent = `
html body.prd-result-stage-map-direct-v116 #game,
html body.prd-result-stage-map-direct-v116 #combatHudOverlay,
html body.prd-result-stage-map-direct-v116 #combatHudTopLine,
html body.prd-result-stage-map-direct-v116 #combatHudCommands,
html body.prd-result-stage-map-direct-v116 #combatHudCommandsLandscapeDock,
html body.prd-result-stage-map-direct-v116 #combatHudCommandsPortraitDock,
html body.prd-result-stage-map-direct-v116 #battleHud,
html body.prd-result-stage-map-direct-v116 #side > .battleActions,
html body.prd-result-stage-map-direct-v116 #field > .fieldTopControls,
html body.prd-result-stage-map-direct-v116 #combatHudTopLine .fieldTopControls,
html body.prd-result-stage-map-direct-v116 #combatHudOverlay .fieldTopControls{
  display:none!important;
  visibility:hidden!important;
  opacity:0!important;
  pointer-events:none!important;
}
html body.prd-result-stage-map-direct-v116 #stageMap{
  display:block!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  z-index:45!important;
}
html body .stageResultOverlay,
html body #stageClearOverlay,
html body #gameOverOverlay{
  z-index:2147483000!important;
  pointer-events:auto!important;
}
html body .stageResultOverlay *,
html body #stageClearOverlay *,
html body #gameOverOverlay *{
  pointer-events:auto!important;
}
`;
  document.head.appendChild(style);
}

function forceStageMapScreenDirectV116(targetStage, reason){
  ensureResultStageMapDirectStyleV116();
  try{
    if(document.body){
      document.body.classList.add('prd-map-ui-active','prd-result-stage-map-direct-v116');
      document.body.classList.remove('prd-stage-entering','prd-combat-ui-active','prd-battle-active','prd-combat-screen-active');
    }
    window.PRD_STAGE_ENTERING = false;
  }catch(_err){}

  const menu = $('menu');
  const galaxy = $('galaxyMap');
  const game = $('game');
  const map = $('stageMap');
  if(menu){ menu.style.setProperty('display','none','important'); menu.style.setProperty('visibility','hidden','important'); menu.style.setProperty('opacity','0','important'); menu.style.setProperty('pointer-events','none','important'); }
  if(galaxy){ galaxy.style.setProperty('display','none','important'); galaxy.style.setProperty('visibility','hidden','important'); galaxy.style.setProperty('opacity','0','important'); galaxy.style.setProperty('pointer-events','none','important'); }
  if(game){
    game.hidden = false;
    game.style.setProperty('display','none','important');
    game.style.setProperty('visibility','hidden','important');
    game.style.setProperty('opacity','0','important');
    game.style.setProperty('pointer-events','none','important');
  }
  if(map){
    map.hidden = false;
    map.style.setProperty('display','block','important');
    map.style.setProperty('visibility','visible','important');
    map.style.setProperty('opacity','1','important');
    map.style.setProperty('pointer-events','auto','important');
    map.style.setProperty('z-index','45','important');
    map.classList.add('premiumStage');
  }
  ['combatHudOverlay','combatHudTopLine','combatHudCommands','combatHudCommandsLandscapeDock','combatHudCommandsPortraitDock','battleHud'].forEach(function(id){
    const node = $(id);
    if(!node) return;
    node.style.setProperty('display','none','important');
    node.style.setProperty('visibility','hidden','important');
    node.style.setProperty('opacity','0','important');
    node.style.setProperty('pointer-events','none','important');
  });

  try{ StageMapState.selected = targetStage; StageMapState.current = targetStage; saveStageMapProgress(); }catch(_err){}
  try{
    if(window.PRD_STAGE_FLOW_CONTROLLER_V46_API && typeof window.PRD_STAGE_FLOW_CONTROLLER_V46_API.showStageMap === 'function') window.PRD_STAGE_FLOW_CONTROLLER_V46_API.showStageMap(targetStage);
    else {
      if(window.PRD_STAGE_FLOW && typeof window.PRD_STAGE_FLOW.selectStage === 'function') window.PRD_STAGE_FLOW.selectStage(targetStage);
      if(window.PRD_STAGE_FLOW && typeof window.PRD_STAGE_FLOW.renderStageMap === 'function') window.PRD_STAGE_FLOW.renderStageMap();
      else if(typeof renderStageMap === 'function') renderStageMap();
    }
  }catch(err){
    console.warn('v116 direct stage-map render failed', err);
    try{ if(typeof renderStageMap === 'function') renderStageMap(); }catch(_innerErr){}
  }
  try{ StageMapState.selected = targetStage; StageMapState.current = targetStage; }catch(_err){}
  if(map){
    map.hidden = false;
    map.style.setProperty('display','block','important');
    map.style.setProperty('visibility','visible','important');
    map.style.setProperty('opacity','1','important');
    map.style.setProperty('pointer-events','auto','important');
    map.style.setProperty('z-index','45','important');
  }
  try{ if(typeof refreshScreenStarfields === 'function') refreshScreenStarfields(); }catch(_err){}
  try{ window.PRD_RESULT_STAGE_MAP_DIRECT_V116_LAST = {stage:targetStage, reason:reason || 'direct', ts:Date.now()}; }catch(_err){}
}

function resultStageMapNavigateV116(ev, explicitStage, hintText=''){
  try{
    if(ev){
      if(ev.preventDefault) ev.preventDefault();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      else if(ev.stopPropagation) ev.stopPropagation();
    }
  }catch(_err){}
  const btn = ev && (ev.currentTarget || ev.target);
  const targetStage = resultStageMapTargetV116(explicitStage, btn);
  try{ stopStageClearAutoContinueTimer(); }catch(_err){}
  try{ clearStageResultPendingFlag(); }catch(_err){}
  try{ cancelAnimationFrame(raf); }catch(_err){}
  try{ stopAllGameAudio(); }catch(_err){}
  try{ if(typeof setBattleChromeVisible === 'function') setBattleChromeVisible(false); }catch(_err){}
  try{ if(S){ S.active = false; S.paused = true; S.skillModalOpen = false; S.queue = []; S.gameOver = false; S.gameOverOverlayShown = false; S.gameOverOverlayRequested = false; S.runEnded = true; } }catch(_err){}
  try{ removeStageResultOverlay(); }catch(_err){}
  try{ resetBattleUnitsForStageMap(); }catch(_err){}
  try{
    sessionStorage.setItem('PRD_RESULT_STAGE_MAP_RETURN_STAGE_V116', String(targetStage));
    sessionStorage.setItem('PRD_RESULT_STAGE_MAP_RETURN_TS_V116', String(Date.now()));
  }catch(_err){}

  forceStageMapScreenDirectV116(targetStage, 'primary');
  [0, 80, 220, 520].forEach(function(delay){
    setTimeout(function(){ forceStageMapScreenDirectV116(targetStage, 'verify-' + delay); }, delay);
  });
  setTimeout(function(){
    try{
      const map = $('stageMap');
      const game = $('game');
      const mapVisible = !!map && getComputedStyle(map).display !== 'none' && getComputedStyle(map).visibility !== 'hidden' && map.getBoundingClientRect().width > 1 && map.getBoundingClientRect().height > 1;
      const gameVisible = !!game && getComputedStyle(game).display !== 'none' && getComputedStyle(game).visibility !== 'hidden' && game.getBoundingClientRect().width > 1 && game.getBoundingClientRect().height > 1;
      if(mapVisible && !gameVisible) return;
      const url = new URL(location.href);
      url.searchParams.set('resultStageMap', '1');
      url.searchParams.set('screen', 'stage');
      url.searchParams.set('stage', String(targetStage));
      url.searchParams.set('prdReturn', String(Date.now()));
      if(TEST_MODE_CONFIG && TEST_MODE_CONFIG.enabled) url.searchParams.set('test', '1');
      location.replace(url.href);
    }catch(err){ console.warn('v116 result stage-map reload fallback skipped', err); }
  }, 700);
  return false;
}
window.PRD_RESULT_STAGE_MAP_NAVIGATE_V116 = resultStageMapNavigateV116;
window.PRD_RESULT_STAGE_MAP_NAVIGATE_V115 = resultStageMapNavigateV116;
window.PRD_ENSURE_RESULT_STAGE_MAP_DIRECT_STYLE_V116 = ensureResultStageMapDirectStyleV116;

function resultButtonHtml(continueText='계속하기', swapMapUpgradeButtons=false){
  try{ ensureResultStageMapDirectStyleV116(); }catch(_err){}
  const mapButton = '<button id="stageResultMapBtn" class="btnAlt" data-result-action="stage-map" onclick="return window.PRD_RESULT_STAGE_MAP_NAVIGATE_V116 ? window.PRD_RESULT_STAGE_MAP_NAVIGATE_V116(event) : true;">스테이지 맵으로 이동</button>';
  const upgradeButton = '<button id="stageResultUpgradeBtn" class="btnAlt stageResultUpgradeBtn">업그레이드</button>';
  return `<div class="stageResultActions">
    <button id="stageResultContinueBtn" class="btnGreen">${escapeHtml(continueText)}</button>
    ${swapMapUpgradeButtons ? upgradeButton + mapButton : mapButton + upgradeButton}
  </div>`;
}

function createStageResultOverlay(options){
  const opt = options || {};
  const kind = opt.kind || 'sub-clear';
  const stageNo = clamp(Number(opt.stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const waveNo = clamp(Number(opt.wave || S?.ogge || 1), 1, 10);
  const stageTheme = resultStageTheme(stageNo);
  const id = kind === 'defeat' ? 'gameOverOverlay' : 'stageClearOverlay';
  removeStageResultOverlay();
  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = `${kind === 'defeat' ? 'gameOverOverlay' : 'stageClearOverlay'} stageResultOverlay stageResultOverlay--${kind}`;
  overlay.style.setProperty('--stage-result-bg', `url("${stageTheme.bg}")`);
  overlay.style.setProperty('--stage-result-accent', stageTheme.color);
  overlay.innerHTML = `<div class="stageResultCard" role="dialog" aria-modal="true" aria-labelledby="stageResultTitle">
    <div class="stageResultBgLabel">${escapeHtml(stageTheme.stage.name)} / ${escapeHtml(stageTheme.stage.ko)}</div>
    <div class="stageResultKicker">${escapeHtml(opt.kicker || 'STAGE RESULT')}</div>
    <h2 id="stageResultTitle">${escapeHtml(opt.title || '스테이지 결과')}</h2>
    <p class="stageResultBody">${escapeHtml(opt.body || '')}</p>
    <div class="stageResultStats">
      <div class="stageResultStat"><span>STAGE</span><b>${fmt2(stageNo)}-${fmt2(waveNo)}</b></div>
      <div class="stageResultStat danger"><span>CORE LOSS</span><b>-${fmt2(opt.coreLoss || 0)}</b></div>
      <div class="stageResultStat shard"><span>성흔 조각</span><b>+${fmt2(opt.shardsGained || 0)}</b></div>
      <div class="stageResultStat"><span>KILLS</span><b>${fmt2(opt.kills || S?.runKills || 0)}</b></div>
    </div>
    <div class="stageResultNext"><span>NEXT</span><b>${escapeHtml(opt.nextText || nextResultSummaryText(kind, stageNo, waveNo))}</b></div>
    ${opt.extraHtml || ''}
    ${resultButtonHtml(opt.continueText || '계속하기', !!opt.swapMapUpgradeButtons)}
  </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

function showSubStageResultOverlay(summary){
  const safe = summary || {};
  const stageNo = clamp(Number(safe.stageNo || S?.stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const waveNo = clamp(Number(safe.wave || S?.ogge || 1), 1, 10);
  const def = getStageDef(stageNo);
  const overlay = createStageResultOverlay({
    kind:'sub-clear',
    stageNo,
    wave:waveNo,
    kicker:'SUB STAGE CLEAR',
    title:'서브 스테이지 클리어',
    body:`${def.ko} ${fmt2(waveNo)}웨이브를 방어했습니다. 다음 웨이브는 적 조합과 압박이 조금 더 강해집니다.`,
    coreLoss:Number(safe.coreLoss || 0),
    shardsGained:Number(safe.shardsGained || 0),
    kills:Number(safe.kills || S?.runKills || 0),
    nextText:nextResultSummaryText('sub-clear', stageNo, waveNo),
    continueText:'계속하기',
    swapMapUpgradeButtons:true
  });
  overlay.querySelector('#stageResultContinueBtn').onclick = () => {
    removeStageClearOverlay();
    if(!S || S.gameOver) return;
    S.ogge = Math.min(10, waveNo + 1);
    prepareWave();
  };
  overlay.querySelector('#stageResultMapBtn').onclick = () => {
    goStageMapFromResult(stageNo, `${fmt2(stageNo)}성역 ${fmt2(waveNo)}웨이브까지 기록했습니다. 다시 진입하면 1웨이브부터 재도전합니다.`);
  };
  overlay.querySelector('#stageResultUpgradeBtn').onclick = () => openUpgradeFromResult(stageNo);
  return overlay;
}

function showStageClearOverlay(summary){
  const safe = summary || {};
  const cleared = Number(safe.stageNo || StageMapState.current || 1);
  const nextNo = Math.min(STAGE_MAP_DEFS.length, cleared + 1);
  const def = getStageDef(cleared);
  const reward = stageTowerReward(cleared);
  const isFinal = cleared >= STAGE_MAP_DEFS.length;
  const mastery = computeStageMastery(cleared);
  const starText = '★★★'.slice(0, mastery.stars) + '☆☆☆'.slice(0, 3 - mastery.stars);
  const overlay = createStageResultOverlay({
    kind:'main-clear',
    stageNo:cleared,
    wave:10,
    kicker:'MAIN STAGE CLEAR',
    title:'메인 스테이지 클리어',
    body:`${def.name} / ${def.ko} 정화 완료. ${getOfflineStoryLog(cleared, 'clear')}`,
    coreLoss:Number(safe.coreLoss || 0),
    shardsGained:Number(safe.shardsGained || 0),
    kills:Number(safe.kills || S?.runKills || 0),
    nextText:nextResultSummaryText('main-clear', cleared, 10),
    continueText:'계속하기',
    extraHtml:`<div class="stageResultMastery"><span>성역 숙련도</span><b>${mastery.stars}성 · 코어 보존 ${fmt2(mastery.hpRatio*100)}%</b><em>${starText}</em></div><div class="stageResultReward">${escapeHtml(STORY_EVENT_TEXT.clearBody)} 보상: ${reward ? escapeHtml(reward.name) : '완료'}</div>`
  });
  const continueBtn = overlay.querySelector('#stageResultContinueBtn');
  const mapBtn = overlay.querySelector('#stageResultMapBtn');
  const upgradeBtn = overlay.querySelector('#stageResultUpgradeBtn');
  if(continueBtn){
    continueBtn.onclick = () => {
      removeStageClearOverlay();
      StageMapState.selected = isFinal ? cleared : nextNo;
      StageMapState.current = StageMapState.selected;
      saveStageMapProgress();
      startSelectedStageFromMap();
    };
  }
  if(mapBtn){
    mapBtn.onclick = (ev) => resultStageMapNavigateV116(ev, isFinal ? cleared : nextNo);
  }
  if(upgradeBtn) upgradeBtn.onclick = () => openUpgradeFromResult(isFinal ? cleared : nextNo);
  return overlay;
}


function forceStageClearUnlockAfterBattle(stageNo, opts={}){
  const max = STAGE_MAP_DEFS.length;
  const cleared = clamp(Number(stageNo || 1), 1, max);
  const nextStage = Math.min(max, cleared + 1);
  if(!META) META = defaultOfflineMeta();
  if(!META.clears || typeof META.clears !== 'object') META.clears = {};
  if(!META.story || typeof META.story !== 'object') META.story = {};

  if(!TEST_MODE_CONFIG.enabled){
    const key = String(cleared);
    // v98: stage unlock must never depend on a delayed overlay/render pass.
    // If an old wrapper returned early because S.runEnded was already true, still
    // persist the clear marker once so deriveProgressFromManifest can open the next planet.
    if(Number(META.clears[key] || 0) <= 0 && opts.recordClear !== false){
      META.clears[key] = 1;
      META.totalClears = Math.max(Number(META.totalClears || 0), 0) + 1;
      META.story[`${cleared}_clear`] = true;
    }
    try{ unlockStageTower(cleared); }catch(err){ console.warn('[v98 stage unlock] tower reward repair failed', err); }
  }

  StageMapState.unlocked = TEST_MODE_CONFIG.enabled ? max : Math.max(clamp(Number(StageMapState.unlocked || 1), 1, max), nextStage, deriveUnlockedStageFromMeta());
  StageMapState.selected = clamp(Number(opts.selectStage || nextStage), 1, max);
  StageMapState.current = clamp(Number(opts.currentStage || StageMapState.selected), 1, max);
  saveOfflineMeta();
  saveStageMapProgress();
  return {cleared, nextStage, unlocked:StageMapState.unlocked, selected:StageMapState.selected, current:StageMapState.current};
}

function completeStageFromBattle(){
  window.PRD_STAGE_RESULT_PENDING = true;
  window.PRD_STAGE_RESULT_PENDING_AT = Date.now();
  window.PRD_STAGE_ENTERING = false;
  if(document.body) document.body.classList.remove('prd-stage-entering');
  const cleared = clamp(Number(S.stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const finalSelected = Math.min(STAGE_MAP_DEFS.length, cleared + 1);
  const nextDef = getStageDef(finalSelected);

  cancelAnimationFrame(raf);
  syncNonBattleChrome();
  $('game').style.display = 'none';
  $('stageMap').style.display = 'block';
  stopStageBgm();

  const beforeShards = Number(META?.shards || 0);

  // v98: 이전 버전은 여기서 '클리어 직전 상태'를 먼저 renderStageMap()으로 보여주면서
  // renderStageMap -> syncStageUnlockFromClears가 잠긴 진행 상태를 다시 저장할 수 있었다.
  // Expo/WebView에서는 그 타이밍이 더 자주 드러나서 1성역 클리어 후 2성역이 잠긴 채 남았다.
  // 따라서 클리어 기록과 다음 성역 해금을 먼저 확정 저장한 뒤 맵을 렌더링한다.
  recordOfflineRunEnd(true, cleared);
  const repaired = forceStageClearUnlockAfterBattle(cleared, {
    recordClear:true,
    selectStage:finalSelected,
    currentStage:finalSelected
  });

  const afterShards = Number(META?.shards || 0);
  const clearSummary = {
    stageNo:cleared,
    wave:10,
    kills:Number(S?.runKills || 0),
    coreLoss:coreLossValue(S.resultStageStartHp || S.maxHp || 0, S.hp || 0),
    shardsGained:Math.max(0, afterShards - beforeShards)
  };
  window.PRD_LAST_STAGE_CLEAR_V98 = Object.assign({ts:Date.now()}, repaired, clearSummary);

  sound('clear');
  playResultBgm('clear');

  reset();
  resetBattleUnitsForStageMap();

  setTimeout(() => {
    forceStageClearUnlockAfterBattle(cleared, {
      recordClear:false,
      selectStage:finalSelected,
      currentStage:finalSelected
    });
    renderStageMap();
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

const PLANET_ICON_COLS = 4;
const PLANET_ICON_ROWS = 2;
const PLANET_BASE_SIZE = 34; // v39: tower visual size reduced
const PLANET_RENDER_SCALE = 0.76; // v39: icon sheet render scale reduced
const BASE_PLANET_COUNT = 9;
const HIDDEN_PLANET_TYPE = 9;

function fmtInt(value){
  const n = Number(value);
  return Number.isFinite(n) ? String(Math.round(n)) : '0';
}
function fmt2(value){ return fmtInt(value); }
function fmtPct2(value){ return `${fmtInt(Number(value || 0) * 100)}%`; }

const PLANET_THUMB_IMAGE_CACHE = {};
function planetThumbLevel(level){
  return Math.max(1, Math.min(6, Math.round(Number(level) || 1)));
}
function planetThumbSrc(type, level=1){
  const p = PLANETS?.[Number(type)];
  if(!p?.id) return '';
  const assetId = PLACEHOLDER_PLANET_THUMB_ALIAS[p.id] || p.id;
  return `assets/images/thumbs/${assetId}_lv${planetThumbLevel(level)}.webp?v=align2`;
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
    main:'audio/public_bgm.ogg',
    map:'audio/public_bgm.ogg',
    boss:'audio/bgm_boss_beneath_the_iron_crust.ogg',
    clear:'audio/public_bgm.ogg',
    gameover:'audio/public_bgm.ogg',
    // v32: use the existing lightweight stage loops for normal battle BGM.
    // The previous config reused the 148kbps battle track for every stage.
    // These stage loops are about 47-49kbps, so background music stays on while
    // reducing continuous decode pressure during combat.
    stages:[
      'audio/public_bgm.ogg',
      'audio/public_bgm.ogg',
      'audio/public_bgm.ogg',
      'audio/public_bgm.ogg',
      'audio/public_bgm.ogg',
      'audio/public_bgm.ogg',
      'audio/public_bgm.ogg'
    ]
  },
  sfx: {
    shot:'audio/sfx_shot.ogg', beam:'audio/sfx_beam.ogg', blackhole:'audio/sfx_blackhole.ogg',
    nova:'audio/sfx_nova.ogg', hit:'audio/sfx_hit.ogg', kill:'audio/sfx_kill.ogg',
    treasure:'audio/sfx_treasure.ogg', level:'audio/sfx_level.ogg', summon:'audio/sfx_summon.ogg', merge:'audio/sfx_merge.ogg',
    boss:'audio/sfx_boss_warning.ogg', clear:'audio/sfx_stage_clear.ogg', gameover:'audio/sfx_core_collapse.ogg', core:'audio/sfx_core_damage.ogg', unlock:'audio/sfx_unlock.ogg'
  }
};

/* v242-native-audio-bridge: Expo WebView에서는 HTMLAudio/WebAudio를 직접 재생하지 않고
   React Native(expo-audio) 쪽으로 오디오 요청만 전달한다. UI/밸런스/전투 로직은 변경하지 않는다. */
const NATIVE_AUDIO_BGM_KEY_BY_SRC = {
  'audio/public_bgm.ogg':'public_bgm',
  'audio/bgm_stage_01_cosmic_void.ogg':'bgm_stage_01_cosmic_void',
  'audio/bgm_stage_02_frost_expanse.ogg':'bgm_stage_02_frost_expanse',
  'audio/bgm_stage_03_lava_nebula.ogg':'bgm_stage_03_lava_nebula',
  'audio/bgm_stage_04_jungle_core.ogg':'bgm_stage_04_jungle_core',
  'audio/bgm_stage_05_smog_wasteland.ogg':'bgm_stage_05_smog_wasteland',
  'audio/bgm_stage_06_crystal_nebula.ogg':'bgm_stage_06_crystal_nebula',
  'audio/bgm_stage_07_machine_core.ogg':'bgm_stage_07_machine_core',
  'audio/bgm_battle_sentinels_of_the_ember.ogg':'bgm_battle_sentinels_of_the_ember',
  'audio/bgm_boss_beneath_the_iron_crust.ogg':'bgm_boss_beneath_the_iron_crust',
  'audio/bgm_general_glass_horizon.ogg':'bgm_general_glass_horizon',
  'audio/bgm_result_core_collapse.ogg':'bgm_result_core_collapse',
  'audio/bgm_result_sanctuary_restored.ogg':'bgm_result_sanctuary_restored'
};
const NATIVE_AUDIO_SFX_KEY_BY_TYPE = {
  shot:'sfx_shot',
  beam:'sfx_beam',
  blackhole:'sfx_blackhole',
  nova:'sfx_nova',
  hit:'sfx_hit',
  kill:'sfx_kill',
  treasure:'sfx_treasure',
  level:'sfx_level',
  summon:'sfx_summon',
  merge:'sfx_merge',
  boss:'sfx_boss_warning',
  clear:'sfx_stage_clear',
  gameover:'sfx_core_collapse',
  core:'sfx_core_damage',
  unlock:'sfx_unlock'
};
const NATIVE_AUDIO_PRIORITY_BY_TYPE = {
  shot:'low',
  beam:'low',
  hit:'low',
  kill:'low',
  blackhole:'normal',
  nova:'normal',
  treasure:'normal',
  level:'normal',
  summon:'normal',
  merge:'normal',
  unlock:'normal',
  boss:'high',
  clear:'high',
  gameover:'high',
  core:'high'
};
const NATIVE_AUDIO_VOLUME_BY_TYPE = {shot:.16, beam:.16, blackhole:.34, nova:.38, treasure:.38, level:.34, hit:.18, kill:.16, summon:.22, merge:.26, clear:.42, gameover:.42, core:.38, unlock:.36, boss:.34};
const NATIVE_AUDIO_PRELOAD_KEYS = Array.from(new Set([
  ...Object.values(NATIVE_AUDIO_BGM_KEY_BY_SRC),
  ...Object.values(NATIVE_AUDIO_SFX_KEY_BY_TYPE)
]));
function nativeAudioBridgeAvailable(){
  return !!(window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function');
}
function nativeAudioPost(payload){
  if(!nativeAudioBridgeAvailable()) return false;
  try{
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    return true;
  }catch(err){
    if(window.__DEV_NATIVE_AUDIO_LOG__) console.warn('[NativeAudioBridge] post failed', err);
    return false;
  }
}
window.NativeAudioBridge = Object.assign(window.NativeAudioBridge || {}, {
  isAvailable: nativeAudioBridgeAvailable,
  post: nativeAudioPost,
  preload(keys){ return nativeAudioPost({type:'AUDIO_PRELOAD', keys:Array.isArray(keys) ? keys : NATIVE_AUDIO_PRELOAD_KEYS}); },
  play(key, options={}){
    return nativeAudioPost({
      type:'AUDIO_PLAY',
      key,
      category:options.category || 'sfx',
      loop:!!options.loop,
      volume:options.volume,
      priority:options.priority || 'normal'
    });
  },
  stop(key, options={}){ return nativeAudioPost({type:'AUDIO_STOP', key, category:options.category}); },
  pause(key, options={}){ return nativeAudioPost({type:'AUDIO_PAUSE', key, category:options.category}); },
  resume(key, options={}){ return nativeAudioPost({type:'AUDIO_RESUME', key, category:options.category}); },
  setMuted(muted){ return nativeAudioPost({type:'AUDIO_SET_MUTED', muted:!!muted}); },
  setVolume(category, volume){ return nativeAudioPost({type:'AUDIO_SET_VOLUME', category, volume}); }
});
window.__NATIVE_AUDIO_ON_MESSAGE__ = window.__NATIVE_AUDIO_ON_MESSAGE__ || function(payload){
  try{
    if(payload && payload.type === 'AUDIO_READY' && window.NativeAudioBridge?.isAvailable?.()){
      window.NativeAudioBridge.preload(NATIVE_AUDIO_PRELOAD_KEYS);
      if(audio) window.NativeAudioBridge.setMuted(!audio.on);
    }
  }catch(err){
    if(window.__DEV_NATIVE_AUDIO_LOG__) console.warn('[NativeAudioBridge] message failed', err);
  }
};
function requestNativeAudioReady(){
  if(!nativeAudioBridgeAvailable()) return false;
  return nativeAudioPost({type:'AUDIO_READY_REQUEST'});
}
function nativeBgmKeyFromSrc(src){
  return NATIVE_AUDIO_BGM_KEY_BY_SRC[String(src || '')] || '';
}
function stopHtmlAudioOnly(){
  try{
    if(audio && audio.bgm && typeof audio.bgm.pause === 'function'){
      audio.bgm.pause();
      try{ audio.bgm.currentTime = 0; }catch(_){ }
    }
    Object.values(htmlAudioCache || {}).forEach(a => {
      if(!a || typeof a.pause !== 'function') return;
      try{ a.pause(); }catch(_){ }
      try{ a.currentTime = 0; }catch(_){ }
    });
    activeOneShotAudio.forEach(a => {
      try{ a.pause(); }catch(_){ }
      try{ a.currentTime = 0; }catch(_){ }
    });
    activeOneShotAudio.clear();
  }catch(err){
    if(window.__DEV_NATIVE_AUDIO_LOG__) console.warn('[NativeAudioBridge] stop html fallback failed', err);
  }
}
function playNativeBgmBySrc(src, volume=.30){
  const key = nativeBgmKeyFromSrc(src);
  if(!key || !window.NativeAudioBridge?.isAvailable?.()) return false;
  stopHtmlAudioOnly();
  if(audio){
    audio.bgm = null;
    audio.bgmSrc = src;
  }
  window.NativeAudioBridge.setMuted(!(audio && audio.on));
  return window.NativeAudioBridge.play(key, {category:'bgm', loop:true, volume});
}
function playNativeSfx(type, opts={}){
  const key = NATIVE_AUDIO_SFX_KEY_BY_TYPE[type];
  if(!key || !window.NativeAudioBridge?.isAvailable?.()) return false;
  const baseVolume = NATIVE_AUDIO_VOLUME_BY_TYPE[type] || .22;
  const volumeMul = Number.isFinite(Number(opts.volumeMul)) ? Number(opts.volumeMul) : 1;
  const intensity = Number.isFinite(Number(opts.intensity)) ? Number(opts.intensity) : 1;
  const volume = Math.max(0, Math.min(1, baseVolume * volumeMul * intensity));
  return window.NativeAudioBridge.play(key, {
    category:'sfx',
    volume,
    priority:opts.priority || NATIVE_AUDIO_PRIORITY_BY_TYPE[type] || 'normal'
  });
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', requestNativeAudioReady, {once:true});
}else{
  requestNativeAudioReady();
}

let fieldStars = [];

/* v207: battle starfield now matches the galaxy / stage map direction too.
   The battle stars drift on the same diagonal axis as the map starfields
   (leftward with a gentle downward pull), just much slower so gameplay stays calm. */
function buildFieldStars(){
  fieldStars = [];
  const layers = [
    {count:92, speedX:-0.10, speedY:0.05, alpha:.26},
    {count:72, speedX:-0.22, speedY:0.09, alpha:.40},
    {count:42, speedX:-0.38, speedY:0.15, alpha:.58}
  ];
  layers.forEach((layer, layerIndex) => {
    for(let i=0;i<layer.count;i++){
      fieldStars.push({
        x: Math.random()*W, y: Math.random()*H,
        size: 1.2,
        layer: layerIndex,
        alpha: layer.alpha,
        speedX: layer.speedX,
        speedY: layer.speedY,
        twinkle: Math.random()*TAU,
        twinkleSpeed: rand(.02,.055)
      });
    }
  });
}

let coverImageCropCacheKey = '';
let coverImageCropCache = null;
let coverFallbackGradient = null;
let coverFallbackGradientKey = '';
function drawCoverImage(img){
  if(!img || !img.complete || !img.naturalWidth){
    const thColor = theme().color;
    const fallbackKey = `${W}|${H}|${thColor}`;
    if(!coverFallbackGradient || coverFallbackGradientKey !== fallbackKey){
      const fallback = ctx.createLinearGradient(0,0,W,H);
      fallback.addColorStop(0,'#020617');
      fallback.addColorStop(1,thColor);
      coverFallbackGradient = fallback;
      coverFallbackGradientKey = fallbackKey;
    }
    ctx.globalAlpha=.42;
    ctx.fillStyle=coverFallbackGradient;
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;
    return;
  }
  const key = `${img.currentSrc || img.src || 'img'}|${img.naturalWidth}x${img.naturalHeight}|${W}x${H}`;
  let crop = coverImageCropCache;
  if(!crop || coverImageCropCacheKey !== key){
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = W / H;
    let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if(ir > cr){ sw = img.naturalHeight * cr; sx = (img.naturalWidth - sw) / 2; }
    else { sh = img.naturalWidth / cr; sy = (img.naturalHeight - sh) / 2; }
    crop = coverImageCropCache = {sx, sy, sw, sh};
    coverImageCropCacheKey = key;
  }
  ctx.globalAlpha = .76;
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, W, H);
  ctx.globalAlpha = 1;
}

function buildDustClouds(){
  // v87: cloud/fog gameplay overlay removed per UI polish request.
  if(!DUST_CLOUDS_ACTIVE) return;
  if(S) S.dustClouds = [];
}

function updateDustClouds(dt){
  // v11: dust clouds are disabled; avoid allocating a fresh [] every frame.
  if(!DUST_CLOUDS_ACTIVE) return;
  if(S) S.dustClouds = [];
}

const DUST_CLOUDS_ACTIVE = false;
const DUST_NO_PENALTY = {damageMul:1,cooldownMul:1,alpha:0};
function getDustCloudPenalty(x,y){
  return DUST_NO_PENALTY;
}

function drawDustClouds(){
  // v87: cloud visual removed.
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
    const wobble=Math.sin((visualNowMs || (performance.now ? performance.now() : Date.now()))*.02+i*1.37)*.28;
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
  const themeStarFactor = 0.72 + (th.starSpeed * 0.18);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255,255,255,.95)';
  let lastLayer = -1;
  for(let i=0;i<fieldStars.length;i++){
    const s = fieldStars[i];
    s.x += s.speedX * themeStarFactor * raw;
    s.y += s.speedY * themeStarFactor * raw;
    s.twinkle += s.twinkleSpeed * raw;
    if(s.x < -10) s.x = W + 10;
    else if(s.x > W + 10) s.x = -10;
    if(s.y < -10) s.y = H + 10;
    else if(s.y > H + 10) s.y = -10;
    if(s.layer !== lastLayer){
      lastLayer = s.layer;
      ctx.shadowBlur = s.layer === 2 ? 8 : 4;
    }
    const glow = .62 + Math.sin(s.twinkle) * .30;
    ctx.globalAlpha = clamp(s.alpha * glow, .12, .95);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}


const PLANETS = [
  {id:'solar', name:'솔라 행성', role:'보스 딜러 / 광역 연소', identity:'합류점에 쌓인 적을 태우고 보스에게 폭발 피해를 누적하는 화력 핵심입니다.', color:'#fb923c', range:132, dmg:46, cd:34, kind:'splash', cost:90, card:'광역 폭발 · 연소', tags:['광역','연소','합류점']},
  {id:'frost', name:'프로스트 행성', role:'감속 / 제어', identity:'빠른 적과 보스의 진행을 늦춰 다른 행성이 오래 공격할 시간을 벌어줍니다.', color:'#67e8f9', range:145, dmg:29, cd:30, kind:'slow', cost:95, card:'빙결 감속 · 제어', tags:['감속','빙결','제어']},
  {id:'storm', name:'스톰 행성', role:'연쇄 딜러 / 다중 타깃', identity:'적이 이어져 들어오는 라인에서 번개가 튕기며 웨이브 정리에 강합니다.', color:'#facc15', range:128, dmg:35, cd:32, kind:'chain', cost:100, card:'연쇄 번개 · 장갑 파괴', tags:['연쇄','장갑파괴','다중경로']},
  {id:'toxic', name:'바이오 행성', role:'지속 피해 / 회복 억제', identity:'체력이 높은 적에게 독성 피해를 누적해 장기전과 보스전 안정성을 올립니다.', color:'#22c55e', range:126, dmg:26, cd:27, kind:'poison', cost:100, card:'독성 침식 · 지속 피해', tags:['독','지속피해','보스']},
  {id:'void', name:'블랙홀 행성', role:'몰이 / 군중 제어', identity:'적을 끌어당겨 광역 타워의 효율을 높이고 코어 접근 시간을 늦춥니다.', color:'#c084fc', range:122, dmg:21, cd:46, kind:'gravity', cost:110, card:'소형 블랙홀 · 구속', tags:['끌어당김','디버프','군중제어']},
  {id:'laser', name:'광자 행성', role:'관통 저격 / 직선 화력', identity:'긴 직선 경로에서 여러 적을 한 번에 관통해 후방 화력을 담당합니다.', color:'#a78bfa', range:162, dmg:56, cd:44, kind:'beam', cost:120, card:'고출력 광자 빔', tags:['관통','저격','직선']},
  {id:'smog', name:'스모그 행성', role:'약화 / 장판 제어', identity:'매연 장막으로 적을 약화시키고 둔화시켜 후반 압박을 안정적으로 낮춥니다.', color:'#9cab62', range:138, dmg:30, cd:31, kind:'poison', cost:115, card:'정화 장막 · 응축/역류', tags:['정화','장판제어','역류']},
  {id:'crystal', name:'크리스탈 행성', role:'축전 / 공명 설계', identity:'초과 피해를 저장하고 장판 공명을 만들어 배치 설계의 보상을 키웁니다.', color:'#c084fc', range:144, dmg:33, cd:33, kind:'crystal', cost:125, card:'축전 · 프리즘 링크', tags:['축전','장판설계','공명']},
  {id:'mecha', name:'메카 행성', role:'실드 해체 / 후반 안정성', identity:'장갑과 실드를 해체하고 위성포/방벽으로 최종 성역 압박을 버팁니다.', color:'#60a5fa', range:136, dmg:41, cd:38, kind:'mecha', cost:135, card:'실드 해체 · 방어망', tags:['실드해체','위성','방벽']},
  {id:'starengine', name:'히든 스타 엔진', role:'최종 융합 병기', identity:'기본 9종의 고레벨 융합으로 열리는 초고출력 치명타 코어입니다.', color:'#f8fafc', range:220, dmg:205, cd:20, cost:0, kind:'crit', card:'히든 · 초고출력 크리티컬 코어', tags:['히든','치명타','융합','최종병기'], critChance:.68, critMul:3.6, explodeChance:.26, explodeRadius:126, bossMul:1.35},
  {id:'resonance', name:'공명 타워', role:'보호막 약화 / 공명 표식', identity:'안드로메다 공명 장갑과 보스 보호막을 흔들어 후속 화력을 증폭시키는 대응 타워입니다.', color:'#38bdf8', range:140, dmg:31, cd:34, kind:'resonance', cost:125, card:'공명 표식 · 보호막 약화', tags:['공명','보호막약화','안드로메다']},
  {id:'gravity_lens', name:'중력 렌즈 타워', role:'감속 / 속도 러시 대응', identity:'균열 질주체와 중력 포식체가 만드는 속도 압박을 늦추고 경로 체류 시간을 늘립니다.', color:'#818cf8', range:150, dmg:24, cd:38, kind:'gravity_lens', cost:130, card:'중력 렌즈 · 속도 제어', tags:['중력','감속','속도대응']},
  {id:'stigma_prism', name:'성흔 프리즘 타워', role:'직선 관통 / 행렬 대응', identity:'고대 방어망의 성흔 빛을 직선으로 투사해 프리즘 행렬과 긴 직선 경로를 관통합니다.', color:'#e879f9', range:168, dmg:48, cd:46, kind:'stigma_prism', cost:145, card:'성흔 프리즘 · 직선 관통', tags:['프리즘','관통','행렬대응']}
];


const PLACEHOLDER_PLANET_THUMB_ALIAS = Object.freeze({
  resonance:'crystal',
  gravity_lens:'void',
  stigma_prism:'laser'
});

const TERRAIN = {
  empty:{name:'공허판', desc:'출력 손실: 피해 -14%, 공격 주기 +6%', color:'rgba(148,163,184,.055)'},
  path:{name:'균열항로', desc:'적 이동 경로. 배치 불가', color:'rgba(56,189,248,.08)'},
  blocked:{name:'균열 봉쇄 장판', desc:'배치 불가. 경로 주변의 좋은 자리를 봉쇄합니다.', color:'rgba(15,23,42,.70)'},
  amp:{name:'증폭성운', desc:'핵심 장판: 피해 +38%', color:'rgba(251,191,36,.22)'},
  coil:{name:'가속궤도', desc:'핵심 장판: 공격 주기 -30%', color:'rgba(56,189,248,.21)'},
  lens:{name:'중력렌즈', desc:'핵심 장판: 사거리 +38', color:'rgba(125,211,252,.21)'},
  mine:{name:'수정광맥', desc:'보상 장판: 보상 +16%', color:'rgba(34,197,94,.18)'},
  rift:{name:'불안정균열', desc:'위험 장판: 피해 +62%, 과열', color:'rgba(244,114,182,.20)'},
  hazard_overheat:{name:'과열 균열', desc:'3x3 위험 구역: 배치 가능 · 공격 주기 +18%', color:'rgba(239,68,68,.13)'},
  hazard_weaken:{name:'약화 균열', desc:'3x3 위험 구역: 배치 가능 · 공격력 -18%', color:'rgba(248,113,113,.13)'},
  hazard_disrupt:{name:'교란 균열', desc:'3x3 위험 구역: 배치 가능 · 사거리 -14%', color:'rgba(251,146,60,.13)'},
  hazard_unstable:{name:'불안정 위험 균열', desc:'3x3 위험 구역: 배치 가능 · 특수/치명 확률 -25%', color:'rgba(244,63,94,.13)'}
};

function randomPlateAffinityType(){
  const pool = availableSummonTypes ? availableSummonTypes().filter(type => type >= 0 && type < BASE_PLANET_COUNT) : [];
  const fallback = Array.from({length: BASE_PLANET_COUNT}, (_, i) => i);
  const list = pool.length ? pool : fallback;
  return list[Math.floor(Math.random() * list.length)] ?? 0;
}
const SPECIAL_PLATE_KEY_SET = new Set(['amp','coil','lens','mine','rift']);
const HAZARD_PLATE_KEYS = ['hazard_overheat','hazard_weaken','hazard_disrupt','hazard_unstable'];
const HAZARD_PLATE_KEY_SET = new Set(HAZARD_PLATE_KEYS);
function isSpecialPlateKey(key){ return SPECIAL_PLATE_KEY_SET.has(key); }
function isHazardPlateKey(key){ return HAZARD_PLATE_KEY_SET.has(key); }
function ensureTerrainHazards(){
  const size = GRID_COLS * GRID_ROWS;
  if(!Array.isArray(terrainHazards) || terrainHazards.length !== size) terrainHazards = Array(size).fill('');
  return terrainHazards;
}
function getTerrainHazardKey(idx){
  if(!Array.isArray(terrainHazards) || idx < 0 || idx >= terrainHazards.length) return '';
  return isHazardPlateKey(terrainHazards[idx]) ? terrainHazards[idx] : '';
}
function effectiveTerrainKey(idx){
  const hazardKey = getTerrainHazardKey(idx);
  return hazardKey || (terrain && terrain[idx]) || 'empty';
}
function getPlateAffinity(idx){
  const a = plateAffinity && plateAffinity[idx];
  if(!a || !PLANETS[a.type]) return null;
  return a;
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
  resonance: [
    {id:'resonance_mark', name:'공명 표식', text:l=>`표식 지속/증폭 +${fmt2(7*l)}%`, apply:(t)=>{ensureAug(t).markAmp+=.07}},
    {id:'resonance_crack', name:'보호막 균열', text:l=>`보호막/장갑 약화 +${fmt2(5*l)}%`, apply:(t)=>{ensureAug(t).shieldDismantle+=.05}},
    {id:'resonance_plate', name:'공명장 연동', text:l=>`장판 공명 발동률 +${fmt2(10*l)}%`, apply:(t)=>{ensureAug(t).resonancePlate+=.10}}
  ],
  gravity_lens: [
    {id:'lens_focus', name:'중력 초점', text:l=>`감속 지속 +${fmt2(18*l)}%`, apply:(t)=>{ensureAug(t).freeze+=.18}},
    {id:'lens_well', name:'렌즈 우물', text:l=>`소형 중력장 +${fmt2(16*l)}%`, apply:(t)=>{ensureAug(t).gravity+=.16}},
    {id:'lens_range', name:'사건선 확대', text:l=>`사거리 +${fmt2(9*l)}`, apply:(t)=>{ensureAug(t).range+=9}}
  ],
  stigma_prism: [
    {id:'prism_align', name:'성흔 정렬', text:l=>`프리즘 빔 폭 +${fmt2(4*l)}`, apply:(t)=>{ensureAug(t).beamWidth+=4}},
    {id:'prism_link', name:'프리즘 잔광', text:l=>`직선 잔광 피해 +${fmt2(16*l)}%`, apply:(t)=>{ensureAug(t).prismLink+=1}},
    {id:'prism_overload', name:'성흔 과충전', text:l=>`공격력 +${fmt2(14*l)}%`, apply:(t)=>{ensureAug(t).damage+=.14}}
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
      if(typeof skill.apply === 'function'){
        skill.apply(t);
        touchAug(t);
      }
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
const COMMERCIAL_RESEARCH_CURVES = {"global_damage":{"unlock_stage":1,"max":12,"damage_curve":[0.06,0.06,0.06,0.05,0.05,0.05,0.04,0.04,0.04,0.03,0.03,0.03]},"global_crit":{"unlock_stage":2,"max":10,"crit_chance_curve":[0.015,0.015,0.015,0.015,0.01,0.01,0.01,0.01,0.008,0.008],"crit_multiplier_curve":[0.04,0.04,0.04,0.04,0.03,0.03,0.03,0.03,0.025,0.025]},"global_speed":{"unlock_stage":3,"max":10,"fire_rate_curve":[0.04,0.04,0.03,0.03,0.03,0.02,0.02,0.02,0.02,0.01]},"global_boss":{"unlock_stage":4,"max":10,"boss_damage_curve":[0.05,0.05,0.05,0.05,0.04,0.04,0.04,0.04,0.03,0.03],"armor_break_curve":[0.012,0.012,0.012,0.012,0.008,0.008,0.008,0.008,0.006,0.006]},"global_range":{"unlock_stage":5,"max":8,"range_curve":[5,5,5,5,4,4,4,4]},"global_plate":{"unlock_stage":6,"max":8,"plate_damage_curve":[0.05,0.05,0.05,0.04,0.04,0.04,0.03,0.03],"plate_fire_rate_curve":[0.03,0.03,0.03,0.02,0.02,0.02,0.015,0.015]},"global_economy":{"unlock_stage":7,"max":8,"reward_curve":[0.04,0.04,0.04,0.04,0.03,0.03,0.03,0.03]}};
function sumCommercialCurve(curve, level){
  const n = Math.max(0, Math.floor(Number(level || 0)));
  if(!Array.isArray(curve) || n <= 0) return 0;
  let total = 0;
  const max = Math.min(n, curve.length);
  for(let i=0;i<max;i++) total += Number(curve[i] || 0);
  return total;
}
function commercialResearchValue(id, field, level){
  const row = COMMERCIAL_RESEARCH_CURVES[id];
  return row ? sumCommercialCurve(row[field], level) : 0;
}
const GLOBAL_UPGRADE_CATALOG = [
  {
    id:'global_damage', name:'공통 화력 증폭', type:'화력', color:'#fb923c', icon:'global_damage',
    desc:'배치된 모든 행성과 앞으로 소환될 행성의 기본 피해를 올립니다. 어느 조합에서도 가장 안정적인 선택입니다.',
    text:l=>`모든 행성 공격력 +${fmtPct2(commercialResearchValue('global_damage','damage_curve',l))}`
  },
  {
    id:'global_speed', name:'공격속도 동기화', type:'속도', color:'#67e8f9', icon:'global_speed',
    desc:'모든 행성의 공격 주기를 줄입니다. 감속/독/연쇄처럼 자주 때릴수록 강한 조합에서 효율이 큽니다.',
    text:l=>`모든 행성 공격속도 +${fmtPct2(commercialResearchValue('global_speed','fire_rate_curve',l))}`
  },
  {
    id:'global_crit', name:'치명타 매트릭스', type:'폭발력', color:'#fde68a', icon:'global_crit',
    desc:'전체 화력에 치명타 기대값을 추가합니다. 보스 체력이 두꺼워지는 중후반에 가치가 커집니다.',
    text:l=>`치명 확률 +${fmtPct2(commercialResearchValue('global_crit','crit_chance_curve',l))} · 치명 배율 +${fmtPct2(commercialResearchValue('global_crit','crit_multiplier_curve',l))}`
  },
  {
    id:'global_range', name:'사거리 네트워크', type:'배치', color:'#a78bfa', icon:'global_range',
    desc:'모든 행성의 사거리를 늘려 같은 타워가 더 오래 공격하게 만듭니다. 배치 실수 보정과 병목 커버에 좋습니다.',
    text:l=>`모든 행성 사거리 +${fmt2(commercialResearchValue('global_range','range_curve',l))}`
  },
  {
    id:'global_plate', name:'장판 증폭 회로', type:'장판', color:'#22c55e', icon:'global_plate',
    desc:'증폭성운, 가속궤도, 중력렌즈, 수정광맥, 균열 장판 위 행성을 추가 강화합니다. 이 게임의 핵심 전략 업그레이드입니다.',
    text:l=>`장판 위 피해 +${fmtPct2(commercialResearchValue('global_plate','plate_damage_curve',l))} · 장판 위 공격속도 +${fmtPct2(commercialResearchValue('global_plate','plate_fire_rate_curve',l))}`
  },
  {
    id:'global_boss', name:'보스 해체 프로토콜', type:'보스', color:'#f87171', icon:'global_boss',
    desc:'보스와 장갑 적에게 들어가는 실제 피해를 올립니다. 5성역 이후 보스전이 막힐 때 우선순위가 높습니다.',
    text:l=>`보스 피해 +${fmtPct2(commercialResearchValue('global_boss','boss_damage_curve',l))} · 방어 관통 +${fmtPct2(commercialResearchValue('global_boss','armor_break_curve',l))}`
  },
  {
    id:'global_economy', name:'전장 회수 시스템', type:'경제', color:'#facc15', icon:'global_economy',
    desc:'처치 보상을 늘려 소환과 합성 속도를 빠르게 합니다. 초중반에 집으면 후반 성장 곡선이 좋아집니다.',
    text:l=>`처치 보상 +${fmtPct2(commercialResearchValue('global_economy','reward_curve',l))}`
  }
];

function getGlobalUpgrade(id){
  return GLOBAL_UPGRADE_CATALOG.find(u => u.id === id) || null;
}
function getGlobalUpgradeStats(){
  const levels = S?.globalUpgrades || META?.upgrades || {};
  if(globalUpgradeStatsCache && globalUpgradeStatsCacheOwner === levels && globalUpgradeStatsCacheRevision === globalUpgradeStatsRevision){
    return globalUpgradeStatsCache;
  }
  const damageLv = Math.max(0, Number(levels.global_damage || 0));
  const speedLv = Math.max(0, Number(levels.global_speed || 0));
  const critLv = Math.max(0, Number(levels.global_crit || 0));
  const rangeLv = Math.max(0, Number(levels.global_range || 0));
  const plateLv = Math.max(0, Number(levels.global_plate || 0));
  const bossLv = Math.max(0, Number(levels.global_boss || 0));
  const economyLv = Math.max(0, Number(levels.global_economy || 0));
  globalUpgradeStatsCache = {
    damage: commercialResearchValue('global_damage','damage_curve',damageLv),
    fireRate: commercialResearchValue('global_speed','fire_rate_curve',speedLv),
    critChance: commercialResearchValue('global_crit','crit_chance_curve',critLv),
    critMul: commercialResearchValue('global_crit','crit_multiplier_curve',critLv),
    range: commercialResearchValue('global_range','range_curve',rangeLv),
    plateDamage: commercialResearchValue('global_plate','plate_damage_curve',plateLv),
    plateFireRate: commercialResearchValue('global_plate','plate_fire_rate_curve',plateLv),
    bossDamage: commercialResearchValue('global_boss','boss_damage_curve',bossLv),
    armorBreak: commercialResearchValue('global_boss','armor_break_curve',bossLv),
    reward: commercialResearchValue('global_economy','reward_curve',economyLv)
  };
  globalUpgradeStatsCacheOwner = levels;
  globalUpgradeStatsCacheRevision = globalUpgradeStatsRevision;
  return globalUpgradeStatsCache;
}
function globalUpgradeText(upgrade, level){
  if(!upgrade) return '';
  return typeof upgrade.text === 'function' ? upgrade.text(level) : '';
}



let S, grid, terrain, terrainHazards, enemies, bullets, particles, beams, floats, anomalies, route, routeVariants, routeTeleportBreaks, selected, dragging;

// v004-perf-memory: gameplay state is left intact, but purely visual FX arrays are
// bounded and pooled so tower-heavy battles do not allocate thousands of short-lived objects.
const PERF_MAX_PARTICLES = 900;
const PERF_MAX_FLOATS = 120;
const PERF_MAX_BEAMS = 160;
const PERF_MAX_TRAIL_PARTICLES_PER_FRAME = 90;
const PERF_MAX_BURST_PARTICLES_PER_FRAME = 220;
const PERF_BULLET_POOL_MAX = 420;
const PERF_ENEMY_POOL_MAX = 260;
const PERF_PARTICLE_POOL_MAX = 1100;
const PERF_FLOAT_POOL_MAX = 180;
const PERF_BEAM_POOL_MAX = 220;
let perfTrailParticlesThisFrame = 0;
let perfBurstParticlesThisFrame = 0;
let perfFrameId = 0;
let chainHitStamp = 1;
let enemyDrawSortLastFrame = -1;
let visualNowMs = 0;
let visualNowSec = 0;
let perfActiveTowerCount = 0;
let perfActiveTowerCountCached = 0;
let perfActiveTowerCountDirty = true;
let hiddenPlanetCheckDirty = true;
let hiddenPlanetCheckLastFrame = -9999;
const HIDDEN_PLANET_CHECK_INTERVAL_FRAMES = 18;
let globalUpgradeStatsCache = null;
let globalUpgradeStatsCacheOwner = null;
let globalUpgradeStatsRevision = 0;
let globalUpgradeStatsCacheRevision = -1;
const bulletPool = [];
const enemyPool = [];
const particlePool = [];
const floatPool = [];
const beamPool = [];
function countActiveTowersFast(){
  if(!Array.isArray(grid)){
    perfActiveTowerCountCached = 0;
    perfActiveTowerCountDirty = false;
    return 0;
  }
  // v12: active tower count only changes when the board composition changes.
  // Reuse the cached value in normal frames to avoid scanning the whole grid before every render.
  if(!perfActiveTowerCountDirty && (perfFrameId % 8) !== 0) return perfActiveTowerCountCached;
  let count = 0;
  for(let i=0;i<grid.length;i++) if(grid[i]) count++;
  perfActiveTowerCountCached = count;
  perfActiveTowerCountDirty = false;
  return count;
}
function invalidateGlobalUpgradeStatsCache(){
  globalUpgradeStatsRevision++;
  globalUpgradeStatsCache = null;
  globalUpgradeStatsCacheOwner = null;
}
function beginVisualFxFrame(){
  perfFrameId++;
  perfActiveTowerCount = countActiveTowersFast();
  perfTrailParticlesThisFrame = 0;
  perfBurstParticlesThisFrame = 0;
}
function currentTrailParticleBudget(){
  if(perfActiveTowerCount >= 46) return 42;
  if(perfActiveTowerCount >= 32) return 58;
  if(perfActiveTowerCount >= 22) return 74;
  return PERF_MAX_TRAIL_PARTICLES_PER_FRAME;
}
function currentBurstParticleBudget(){
  if(perfActiveTowerCount >= 46) return 130;
  if(perfActiveTowerCount >= 32) return 160;
  return PERF_MAX_BURST_PARTICLES_PER_FRAME;
}
function projectileTrailStride(){
  if(perfActiveTowerCount >= 46) return 4;
  if(perfActiveTowerCount >= 30) return 3;
  if(perfActiveTowerCount >= 18) return 2;
  return 1;
}
function addBullet(tower,target,st){
  const b = bulletPool.pop() || new Bullet();
  b.init(tower,target,st);
  bullets.push(b);
  return b;
}
function recycleBullet(b){
  if(b && bulletPool.length < PERF_BULLET_POOL_MAX){
    b.target=null;b.tower=null;b.st=null;b.dead=true;
    bulletPool.push(b);
  }
}
function recycleAllBullets(){
  if(!Array.isArray(bullets)) return;
  for(let i=0;i<bullets.length;i++) recycleBullet(bullets[i]);
  bullets.length = 0;
}
function acquireEnemy(entry){
  const e = enemyPool.pop() || new Enemy();
  return e.init(entry);
}
function recycleEnemy(e){
  if(!e) return;
  e.dead = true;
  e._chainHitStamp = 0;
  if(enemyPool.length < PERF_ENEMY_POOL_MAX) enemyPool.push(e);
}
function recycleAllEnemies(){
  if(!Array.isArray(enemies)) return;
  for(let i=0;i<enemies.length;i++) recycleEnemy(enemies[i]);
  enemies.length = 0;
}
function recycleFxItem(item, arr){
  if(!item) return;
  if(arr === particles){ if(particlePool.length < PERF_PARTICLE_POOL_MAX) particlePool.push(item); return; }
  if(arr === floats){ if(floatPool.length < PERF_FLOAT_POOL_MAX) floatPool.push(item); return; }
  if(arr === beams){ if(beamPool.length < PERF_BEAM_POOL_MAX) beamPool.push(item); }
}
function trimFxArray(arr, max){
  if(!Array.isArray(arr) || arr.length <= max) return;
  const drop = arr.length - max;
  for(let i=0;i<drop;i++) recycleFxItem(arr[i], arr);
  arr.copyWithin(0, drop);
  arr.length = max;
}
function canAddParticle(kind='burst', count=1){
  if(!Array.isArray(particles)) particles = [];
  if(particles.length + count > PERF_MAX_PARTICLES) return false;
  if(kind === 'trail'){
    if(perfTrailParticlesThisFrame + count > currentTrailParticleBudget()) return false;
    perfTrailParticlesThisFrame += count;
  }else{
    if(perfBurstParticlesThisFrame + count > currentBurstParticleBudget()) return false;
    perfBurstParticlesThisFrame += count;
  }
  return true;
}
function acquireParticle(){ return particlePool.pop() || {}; }
function pushParticle(x,y,vx,vy,r,life,maxLife,color,kind='burst', extra=null){
  if(!canAddParticle(kind, 1)) return false;
  const p = acquireParticle();
  p.x=x; p.y=y; p.vx=vx||0; p.vy=vy||0; p.r=r||0; p.life=life||0; p.maxLife=maxLife||life||0; p.color=color||'#fff';
  p.type=extra?.type || ''; p.len=extra?.len || 0; p.w=extra?.w || 0; p.rot=extra?.rot || 0; p.spin=extra?.spin || 0;
  p.glow=extra?.glow || ''; p.blur=extra?.blur || 0; p.ring=!!extra?.ring; p.max=extra?.max || 0; p.core=extra?.core || '';
  particles.push(p);
  return true;
}
function pushFloat(x,y,text,color='#fff',size=12,life=54,vy=-.52){
  if(!Array.isArray(floats)) floats = [];
  if(floats.length >= PERF_MAX_FLOATS) return false;
  const f = floatPool.pop() || {};
  f.x=x; f.y=y; f.text=text; f.color=color || '#fff';
  f.life=life || 0; f.maxLife=life || 0; f.vy=vy || 0; f.size=size || 12;
  floats.push(f);
  return true;
}
function pushBeam(x1,y1,x2,y2,color,life,style='',width=0){
  if(!Array.isArray(beams)) beams = [];
  if(beams.length >= PERF_MAX_BEAMS) return false;
  const b = beamPool.pop() || {};
  b.x1=x1; b.y1=y1; b.x2=x2; b.y2=y2; b.color=color || '#fff';
  b.life=life || 0; b.style=style || ''; b.width=width || 0;
  beams.push(b);
  return true;
}
function trimVisualFxBuffers(){
  trimFxArray(particles, PERF_MAX_PARTICLES);
  trimFxArray(floats, PERF_MAX_FLOATS);
  trimFxArray(beams, PERF_MAX_BEAMS);
}
let offlineMetaPanelLastRenderAt = 0;
function renderOfflineMetaPanelThrottled(){
  const now = performance.now ? performance.now() : Date.now();
  if(now - offlineMetaPanelLastRenderAt < 700) return;
  offlineMetaPanelLastRenderAt = now;
  renderOfflineMetaPanel();
}
let hangarVisualLastCheckAt = 0;
let dragHoverTargetIdx = -1;
let dragHoverTargetStartedAt = 0;
let plateAffinity = {};
const PLATE_AFFINITY_DAMAGE_BONUS = 0.12;
const PLATE_AFFINITY_FIRE_RATE_BONUS = 0.04;
let raf = 0, last = performance.now(), spawnTimer = 0, shake = 0, flash = 0;
let hangarFrame = -1;
let nextPlanetUid = 1;
let mouse = {x:0,y:0};
let hoverIdx = -1;
let audio = null;
let audioCtx = null;
const towerSfxLimiter = {};
const htmlAudioCache = {};
const activeOneShotAudio = new Set();
const soundLimiter = {};
const SOUND_IMPORTANT_TYPES = new Set(['boss','core','clear','gameover','summon','merge','unlock','level','treasure']);
const SOUND_MIN_GAP = {shot:240, beam:280, hit:260, kill:320, boss:900, core:520, summon:180, merge:220, treasure:360, level:420, clear:1000, gameover:1000, unlock:600};
const AUDIO_PERF_POLICY = {
  // v32: BGM must not enable hundreds of tiny attack sounds during combat.
  // Keeping normal battle BGM but suppressing high-frequency combat SFX avoids
  // AudioContext/HTMLAudio churn when many towers fire at once.
  combatBgmSafeMode:true,
  maxActiveOneShots:6,
  maxOneShotAgeMs:2600
};
let lastOneShotPruneAt = 0;
function isCombatAudioSafeMode(){
  return !!(audio && audio.on && AUDIO_PERF_POLICY.combatBgmSafeMode && S && S.active && !S.gameOver);
}
function pruneActiveOneShotAudio(force=false){
  const now = performance.now();
  if(!force && now - lastOneShotPruneAt < 350) return;
  lastOneShotPruneAt = now;
  activeOneShotAudio.forEach(a => {
    try{
      if(!a || a.ended || a.paused || (Number.isFinite(a.duration) && a.currentTime > Math.min(a.duration, AUDIO_PERF_POLICY.maxOneShotAgeMs / 1000))){
        activeOneShotAudio.delete(a);
      }
    }catch(_){ activeOneShotAudio.delete(a); }
  });
}
function isLowPowerAudioMode(){
  return window.matchMedia?.('(max-width: 768px)').matches || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
}

// Orientation-aware battle board.
// v15: decide the board shape from the actual battle field at battle start, not from
// the hidden initial canvas. This keeps the old path rules but makes the extended
// axis visibly longer: landscape = more columns, portrait = more rows.
let IS_MOBILE_BOARD = false;
let BOARD_IS_LANDSCAPE = false;
let GRID_COLS = 8;
let GRID_ROWS = 8;
let GRID = 8; // legacy upper bound only; actual board uses GRID_COLS x GRID_ROWS.
let CELL = 74;
let GX = 0;
let GY = 0;
let CORE = {x:0, y:0};
let CELL_CENTER_CACHE = [];
let CELL_CENTER_LAYOUT_KEY = '';

function battleViewportSize(){
  const vw = Math.max(320, Math.round(window.innerWidth || document.documentElement.clientWidth || canvas.clientWidth || 748));
  const vh = Math.max(320, Math.round(window.innerHeight || document.documentElement.clientHeight || canvas.clientHeight || 708));
  const rect = field ? field.getBoundingClientRect() : null;
  const visibleRect = rect && rect.width > 120 && rect.height > 120;
  return {
    visualW: visibleRect ? Math.round(rect.width) : Math.max(320, vw - 12),
    visualH: visibleRect ? Math.round(rect.height) : Math.max(320, vh - 12),
    viewportW: vw,
    viewportH: vh,
    hasVisibleField: !!visibleRect
  };
}

function configureBattleBoardForCurrentLayout(reason='boot'){
  configureBattleCanvasBackingStore();
  const logicalSize = syncBattleCanvasTransform();
  W = Number(logicalSize.w) || W || 748;
  H = Number(logicalSize.h) || H || 708;

  const statusTopOffsetV99 = syncBattleStatusTopOffsetV99('board-' + reason);
  const size = battleViewportSize();
  IS_MOBILE_BOARD = size.viewportW <= 768 || size.viewportH <= 520;

  // Field ratio is the source of truth once the battle field is visible.
  // While hidden, fall back to viewport ratio. The small hysteresis prevents
  // near-square browser windows from flipping unexpectedly.
  const fieldLandscape = size.visualW >= size.visualH * 1.04;
  const viewportLandscape = size.viewportW >= size.viewportH * 1.04;
  BOARD_IS_LANDSCAPE = size.hasVisibleField ? fieldLandscape : viewportLandscape;

  GRID_COLS = BOARD_IS_LANDSCAPE ? 12 : 8;
  GRID_ROWS = BOARD_IS_LANDSCAPE ? 8 : 12;
  GRID = Math.max(GRID_COLS, GRID_ROWS);

  const maxCell = BOARD_IS_LANDSCAPE
    ? (IS_MOBILE_BOARD ? 92 : 104)
    : (IS_MOBILE_BOARD ? 56 : 74);
  const minCell = BOARD_IS_LANDSCAPE
    ? (IS_MOBILE_BOARD ? 42 : 48)
    : (IS_MOBILE_BOARD ? 30 : 42);

  // Important: calculate the cell from the non-expanded axis first.
  // Landscape keeps the 8-row height and grows columns; portrait keeps the
  // 8-column width and grows rows. Only if it cannot fit do we shrink.
  // v31: landscape cells are driven primarily by the visible vertical size,
  // so the tactical grid remains square and does not feel compressed into the
  // center. Width is used only as a safety limit to avoid the right command lane.
  const outerPadX = BOARD_IS_LANDSCAPE
    ? Math.max(14, Math.min(24, W * .018))
    : Math.max(12, Math.min(18, W * .02));
  const rightCommandReserve = BOARD_IS_LANDSCAPE
    ? Math.max(108, Math.min(148, W * .112))
    : 0;
  const availableBoardW = BOARD_IS_LANDSCAPE
    ? Math.max(260, W - outerPadX * 2 - rightCommandReserve)
    : Math.max(220, W - outerPadX * 2);
  const statusReserveYV99 = Math.max(0, Number(statusTopOffsetV99 || 0));
  const topBottomReserve = (BOARD_IS_LANDSCAPE
    ? Math.max(12, Math.min(28, H * .035))
    : Math.max(148, Math.min(210, H * .19))) + statusReserveYV99;
  const fitByExpandedW = Math.max(24, availableBoardW / GRID_COLS);
  const fitByExpandedH = Math.max(24, (H - topBottomReserve) / GRID_ROWS);
  const fixedAxisCell = BOARD_IS_LANDSCAPE ? fitByExpandedH : fitByExpandedW;
  const landscapeWidthSafetyCell = BOARD_IS_LANDSCAPE
    ? Math.max(24, availableBoardW / (GRID_COLS + 0.42))
    : fitByExpandedW;
  const rawCell = BOARD_IS_LANDSCAPE
    ? Math.min(maxCell, fixedAxisCell, landscapeWidthSafetyCell)
    : Math.min(maxCell, fixedAxisCell, fitByExpandedW, fitByExpandedH);
  CELL = Math.floor(clamp(rawCell, minCell, maxCell));

  const coreGapX = BOARD_IS_LANDSCAPE ? Math.max(24, Math.min(38, CELL * .46)) : Math.max(16, Math.min(28, CELL * .36));
  const totalWWithCore = GRID_COLS * CELL + coreGapX + Math.max(26, CELL * .56);
  const boardShiftX = (BOARD_IS_LANDSCAPE
    ? Math.max(78, Math.min(104, W * .070))
    : Math.max(38, Math.min(56, W * .045))) + CELL * .5; // v44: pull the tactical board left by half a block from v43
  if(BOARD_IS_LANDSCAPE){
    // Keep the map naturally expanded from the left, but nudge the whole field
    // a full block to the right so the tactical blocks feel more centered visually.
    GX = Math.round(outerPadX + boardShiftX);
    const relaxedRightReserve = Math.max(0, rightCommandReserve - CELL);
    const maxLandscapeGX = Math.max(outerPadX, W - relaxedRightReserve - totalWWithCore - Math.max(4, CELL * .05));
    GX = Math.round(Math.min(GX, maxLandscapeGX));
  }else{
    GX = Math.round(Math.max(outerPadX, (W - totalWWithCore) / 2) + boardShiftX);
    const maxPortraitGX = Math.max(outerPadX, W - totalWWithCore - outerPadX);
    GX = Math.round(Math.min(GX, maxPortraitGX));
  }

  const boardH = GRID_ROWS * CELL;

  // v22: keep the board visually aligned with the actual combat play lane.
  // The previous centering pushed the portrait board about one cell downward,
  // which also made hover/focus feel offset because the tactical area was not
  // where the player expected it to be.  Reserve only the real HUD/command
  // lanes, then bias the board slightly upward while keeping square cells.
  const hudReserveY = (BOARD_IS_LANDSCAPE
    ? Math.max(30, Math.min(48, H * .055))
    : Math.max(70, Math.min(96, H * .075))) + statusReserveYV99;
  const commandReserveY = BOARD_IS_LANDSCAPE
    ? Math.max(14, Math.min(28, H * .034))
    : Math.max(118, Math.min(166, H * .135));
  const playableH = Math.max(boardH, H - hudReserveY - commandReserveY);
  const naturalTop = hudReserveY + (playableH - boardH) * .5;
  const upwardBias = BOARD_IS_LANDSCAPE
    ? Math.max(22, Math.min(38, CELL * .46))
    : Math.max(34, Math.min(64, CELL * .92));
  const minTop = (BOARD_IS_LANDSCAPE
    ? Math.max(12, Math.min(26, H * .032))
    : Math.max(62, Math.min(88, H * .06))) + statusReserveYV99;
  const maxTop = Math.max(minTop, H - commandReserveY - boardH - Math.max(10, CELL * .18));
  GY = Math.round(clamp(naturalTop - upwardBias, minTop, maxTop));

  const coreMaxX = BOARD_IS_LANDSCAPE
    ? W - rightCommandReserve - Math.max(18, CELL * .18)
    : W - 42;
  // v47: shift only the CORE anchor by one tactical block.
  // Landscape moves the core one cell to the right; portrait moves it one cell down.
  // The route endpoint uses CORE, so enemies and the visual core stay aligned.
  const coreShiftX = BOARD_IS_LANDSCAPE ? CELL : 0;
  const coreShiftY = BOARD_IS_LANDSCAPE ? 0 : CELL;
  CORE = {
    x: clamp(GX + GRID_COLS * CELL + coreGapX + coreShiftX, 48, coreMaxX),
    y: clamp(GY + GRID_ROWS * CELL - CELL * .5 + coreShiftY, 48, H - Math.max(58, commandReserveY * .42))
  };

  // v12: Andromeda final boss stage uses a true center-core layout so the
  // final route can spiral inward instead of ending at the legacy edge core.
  // Legacy/Milky stages keep the old core anchor untouched.
  try{
    const coreStageNo = clamp(Number(S?.stageNo || StageMapState?.current || 1), 1, STAGE_MAP_DEFS.length);
    if(isAndromedaRouteStage(coreStageNo) && coreStageNo >= 15){
      CORE = {
        x: clamp(GX + GRID_COLS * CELL * .5, 48, W - Math.max(48, rightCommandReserve * .72)),
        y: clamp(GY + GRID_ROWS * CELL * .5, 48, H - Math.max(70, commandReserveY * .72))
      };
    }
  }catch(_){ }

  rebuildCellCenterCache();

  if(window.__DEBUG_BATTLE_BOARD__){
    console.info('[battle-board]', reason, {W,H,GRID_COLS,GRID_ROWS,CELL,GX,GY,CORE,BOARD_IS_LANDSCAPE,statusTopOffsetV99,size});
  }
}

configureBattleBoardForCurrentLayout('boot');


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

const LIVE_PLANET_LEVELS_CACHE = [];
function fillLivePlanetLevels(out=LIVE_PLANET_LEVELS_CACHE){
  const count = Array.isArray(PLANETS) ? PLANETS.length : 0;
  out.length = count;
  for(let i=0;i<count;i++) out[i] = 0;
  if(Array.isArray(grid)){
    for(let i=0;i<grid.length;i++){
      const tower = grid[i];
      if(tower){
        const type = tower.type;
        const level = tower.level || 1;
        if(type >= 0 && type < out.length && level > out[type]) out[type] = level;
      }
    }
  }
  return out;
}
function livePlanetLevel(type){
  if(!Array.isArray(grid) || !grid.length) return 0;
  let max = 0;
  for(let i=0;i<grid.length;i++){
    const tower = grid[i];
    if(tower && tower.type === type && (tower.level || 1) > max) max = tower.level || 1;
  }
  return max || 0;
}

function planetThumbColumnForLevel(level){
  const lv = Math.max(1, Math.min(6, Number(level) || 1));
  return lv - 1;
}

function hangarVisualSignature(){
  if(!Array.isArray(PLANETS)) return '0';
  const levels = fillLivePlanetLevels();
  return levels.join('|') + '::' + (selected >= 0 && grid[selected] ? `${grid[selected].type}:${grid[selected].level}` : 'none');
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
    splash:'광역 폭발형', slow:'감속 제어형', chain:'연쇄 전격형', poison:'지속 피해형', gravity:'군중 제어형', beam:'관통 빔형', crystal:'축전 공명형', mecha:'방어 해체형', resonance:'공명 표식형', gravity_lens:'중력 제어형', stigma_prism:'성흔 관통형', crit:'치명타 융합형'
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
    starengine:'기본 9종 Lv.5 달성 후 열리는 최종 병기입니다. 치명타와 폭발 피해로 후반 보스를 압박합니다.',
    resonance:'보호막과 장갑 적에게 공명 표식을 남겨 후속 피해를 키우는 안드로메다 대응 타워입니다.',
    gravity_lens:'빠른 적의 이동을 늦추고 소형 중력장으로 러시 압박을 완화하는 제어 타워입니다.',
    stigma_prism:'긴 직선 경로에서 적을 관통하고 성흔 잔광으로 행렬형 적을 정리하는 타워입니다.'
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
  const now = performance.now ? performance.now() : Date.now();
  if(!force && now - hangarVisualLastCheckAt < 250) return;
  hangarVisualLastCheckAt = now;
  const signature = hangarVisualSignature();
  if(!force && signature === hangarFrame) return;
  hangarFrame = signature;
  document.querySelectorAll('.liveThumb').forEach(el => applyLiveThumb(el, Number(el.dataset.type), 0));
}
function updateHangarState(){
  if(!S || !grid) return;
  const levels = fillLivePlanetLevels();
  document.querySelectorAll('#hangar .planetCard').forEach(card => {
    const type = Number(card.dataset.type);
    const active = selected >= 0 && grid[selected] && grid[selected].type === type;
    const highest = levels[type] || 0;
    card.classList.toggle('active', active);
    card.classList.toggle('locked', isHangarPlanetLocked(type));
    card.classList.toggle('hasUnit', highest > 0);
    setTextIfChanged(card.querySelector('.planetCardCost'), hangarCostText(type));
    setHtmlIfChanged(card.querySelector('.planetCardRole'), `${hangarRoleText(type)}`);
    setTextIfChanged(card.querySelector('.planetCardLevel'), highest > 0 ? `MAX Lv.${fmt2(highest)}` : 'LV.1');
  });
}

function drawBulletTrail(kind, x, y, color){
  // Purely visual trail objects are the hottest allocation path when many towers fire.
  // Keep the same projectile logic, but budget trail creation per frame.
  if(kind === 'solar'){
    if(!canAddParticle('trail', 2)) return;
    pushParticle(x,y,rand(-.18,.18),rand(-.10,.12),rand(1.2,2.1),10,16,color,'trail');
    pushParticle(x,y,rand(-.10,.10),rand(-.10,.08),rand(.9,1.7),9,14,'#fde68a','trail');
  }else if(kind === 'frost'){
    pushParticle(x,y,rand(-.16,.16),rand(-.16,.16),1.1,11,18,'#e0f2fe','trail',{type:'shard',len:rand(4,7),w:rand(1.8,3.0),rot:Math.random()*TAU,spin:rand(-.22,.22),glow:'#bfdbfe'});
  }else if(kind === 'storm'){
    pushParticle(x,y,rand(-.20,.20),rand(-.20,.20),1.0,8,14,'#fde047','trail',{type:'spark',len:rand(4,8),w:rand(1.1,1.9),rot:Math.random()*TAU,spin:rand(-.30,.30),glow:'#fde047'});
  }else if(kind === 'toxic'){
    pushParticle(x,y,rand(-.12,.12),rand(-.10,.08),rand(1.2,2.0),10,16,'#86efac','trail');
  }else if(kind === 'laser'){
    pushParticle(x,y,rand(-.18,.18),rand(-.18,.18),1.0,8,14,'#fff7ed','trail',{type:'spark',len:rand(4,7),w:1.4,rot:Math.random()*TAU,spin:rand(-.16,.16),glow:color});
  }else{
    pushParticle(x,y,rand(-.24,.24),rand(-.24,.24),rand(1.5,2.6),14,22,color,'trail');
  }
}
function spawnImpactSparks(x,y,color,count=8,spread=1){
  for(let i=0;i<count;i++){
    if(!pushParticle(x,y,rand(-.42,.42)*spread,rand(-.34,.34)*spread,1.2,12+Math.random()*10,20,color,'burst',{type:'spark',len:rand(5,10),w:rand(1.2,2.2),rot:Math.random()*TAU,spin:rand(-.18,.18),glow:color,blur:10})) break;
  }
}
function spawnImpactShards(x,y,color='#dbeafe',count=7){
  for(let i=0;i<count;i++){
    if(!pushParticle(x,y,rand(-.30,.30),rand(-.30,.30),1.2,13+Math.random()*8,24,color,'burst',{type:'shard',len:rand(5,10),w:rand(2.1,4.2),rot:Math.random()*TAU,spin:rand(-.2,.2),glow:color,blur:8})) break;
  }
}
function spawnImpactMist(x,y,color='rgba(74,222,128,.24)',count=5){
  // v87: remove cloudy/misty particles for clearer battle view.
}
function bossSkillGlyph(effect){
  return ({phaseRegen:'✦', voidSurge:'◎', frostLock:'❄', blizzardPrison:'❄', magmaShell:'✹', cataclysmBurst:'☄', sporeBloom:'✿', overgrowth:'❋'})[effect] || '◆';
}

let bossTelegraphs = [];
function pushBossTelegraph(enemy, label, color){
  bossTelegraphs.push({x:enemy.x, y:enemy.y, size:enemy.size + 16, color, label, glyph:bossSkillGlyph(enemy.bossEffect), life:40, maxLife:40, tier:enemy.bossTier || 'mid'});
}

function updateBossTelegraphs(dt){
  let write = 0;
  for(let i=0;i<bossTelegraphs.length;i++){
    const t = bossTelegraphs[i];
    t.life -= dt;
    if(t.life > 0) bossTelegraphs[write++] = t;
  }
  bossTelegraphs.length = write;
}

function drawBossTelegraphs(){
  if(!bossTelegraphs.length) return;
  ctx.save();
  for(let i=0;i<bossTelegraphs.length;i++){
    const t = bossTelegraphs[i];
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
  }
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
const PROJECTILE_SPRITE_RENDER_CACHE = new Map();
const PROJECTILE_SPRITE_RENDER_CACHE_MAX = 32;
const PROJECTILE_SPRITE_RENDER_CACHE_MAX_PIXELS = 180000;
function drawProjectileVisualShape(targetCtx, kind, color){
  if(kind === 'solar'){
    targetCtx.shadowColor=color;targetCtx.shadowBlur=24;
    const g=targetCtx.createRadialGradient(1,-1,1,0,0,10); g.addColorStop(0,'#fff7ed'); g.addColorStop(.42,'#fdba74'); g.addColorStop(1,color);
    targetCtx.fillStyle=g; targetCtx.beginPath(); targetCtx.arc(0,0,6.0,0,TAU); targetCtx.fill();
    targetCtx.globalAlpha=1; targetCtx.fillStyle='rgba(255,244,214,.8)'; targetCtx.beginPath(); targetCtx.ellipse(-4.6,0,4.5,2.4,0,0,TAU); targetCtx.fill();
  }else if(kind === 'frost'){
    targetCtx.shadowColor='#67e8f9';targetCtx.shadowBlur=24;targetCtx.fillStyle='#e0f2fe';
    targetCtx.beginPath(); targetCtx.moveTo(0,-7.4); targetCtx.lineTo(3.8,-1.8); targetCtx.lineTo(6.2,0); targetCtx.lineTo(3.8,1.8); targetCtx.lineTo(0,7.4); targetCtx.lineTo(-3.6,1.8); targetCtx.lineTo(-5.4,0); targetCtx.lineTo(-3.6,-1.8); targetCtx.closePath(); targetCtx.fill();
  }else if(kind === 'storm'){
    targetCtx.shadowColor='#fde047';targetCtx.shadowBlur=24;targetCtx.strokeStyle='#facc15';targetCtx.lineWidth=3.1;
    targetCtx.beginPath(); targetCtx.moveTo(-5.2,-6.5); targetCtx.lineTo(-.8,-1.4); targetCtx.lineTo(-2.5,1.1); targetCtx.lineTo(5.8,6.2); targetCtx.stroke();
    targetCtx.strokeStyle='#fff7cc';targetCtx.lineWidth=1.6; targetCtx.beginPath(); targetCtx.moveTo(-5.2,-6.5); targetCtx.lineTo(-.8,-1.4); targetCtx.lineTo(-2.5,1.1); targetCtx.lineTo(5.8,6.2); targetCtx.stroke();
  }else if(kind === 'toxic'){
    targetCtx.shadowColor='#4ade80';targetCtx.shadowBlur=20;targetCtx.fillStyle='#22c55e'; targetCtx.beginPath(); targetCtx.arc(0,0,5.4,0,TAU); targetCtx.fill();
    targetCtx.globalAlpha=.92; targetCtx.fillStyle='rgba(187,247,208,.72)'; targetCtx.beginPath(); targetCtx.ellipse(-5,0,4.6,2.6,0,0,TAU); targetCtx.fill();
  }else if(kind === 'crystal'){
    targetCtx.shadowColor='#d8b4fe';targetCtx.shadowBlur=24;
    targetCtx.fillStyle='#e9d5ff';
    targetCtx.beginPath(); targetCtx.moveTo(0,-7.8); targetCtx.lineTo(6.6,0); targetCtx.lineTo(0,7.8); targetCtx.lineTo(-6.6,0); targetCtx.closePath(); targetCtx.fill();
    targetCtx.globalAlpha=.74; targetCtx.strokeStyle='#c084fc'; targetCtx.lineWidth=1.8; targetCtx.beginPath(); targetCtx.ellipse(0,0,9.2,3.4,.4,0,TAU); targetCtx.stroke();
  }else if(kind === 'mecha'){
    targetCtx.shadowColor='#60a5fa';targetCtx.shadowBlur=22;
    targetCtx.fillStyle='#93c5fd'; targetCtx.fillRect(-5.8,-4.2,11.6,8.4);
    targetCtx.fillStyle='#eff6ff'; targetCtx.fillRect(-1.8,-1.8,3.6,3.6);
    targetCtx.strokeStyle='#f87171'; targetCtx.lineWidth=1.6; targetCtx.beginPath(); targetCtx.moveTo(-8,0); targetCtx.lineTo(8,0); targetCtx.stroke();
  }else if(kind === 'smog'){
    targetCtx.shadowColor='#d9f99d';targetCtx.shadowBlur=22;targetCtx.fillStyle='#9cab62'; targetCtx.beginPath(); targetCtx.arc(0,0,5.8,0,TAU); targetCtx.fill();
    targetCtx.globalAlpha=.72; targetCtx.fillStyle='rgba(229,231,235,.62)'; targetCtx.beginPath(); targetCtx.ellipse(-5.4,0,5.6,2.5,0,0,TAU); targetCtx.fill();
    targetCtx.globalAlpha=.52; targetCtx.strokeStyle='rgba(245,158,11,.75)'; targetCtx.lineWidth=1.5; targetCtx.beginPath(); targetCtx.arc(0,0,8.5,Math.PI*.15,Math.PI*1.25); targetCtx.stroke();
  }else{
    targetCtx.fillStyle='#f3e8ff';targetCtx.shadowColor=color;targetCtx.shadowBlur=20; targetCtx.beginPath();targetCtx.arc(0,0,5.8,0,TAU);targetCtx.fill(); targetCtx.fillStyle=color; targetCtx.beginPath(); targetCtx.arc(0,0,4.0,0,TAU); targetCtx.fill();
  }
}
function getCachedProjectileSprite(kind, color){
  const key = `${kind}|${color}`;
  const cached = PROJECTILE_SPRITE_RENDER_CACHE.get(key);
  if(cached){
    PROJECTILE_SPRITE_RENDER_CACHE.delete(key);
    PROJECTILE_SPRITE_RENDER_CACHE.set(key, cached);
    return cached;
  }
  try{
    const canvasSize = 72;
    const canvasEl = makeRenderCanvas(canvasSize, canvasSize);
    const spriteCtx = canvasEl.getContext('2d');
    if(!spriteCtx) return null;
    spriteCtx.save();
    spriteCtx.translate(canvasSize / 2, canvasSize / 2);
    drawProjectileVisualShape(spriteCtx, kind, color);
    spriteCtx.restore();
    const entry = {canvas: canvasEl, w: canvasSize, h: canvasSize};
    PROJECTILE_SPRITE_RENDER_CACHE.set(key, entry);
    trimRenderCache(PROJECTILE_SPRITE_RENDER_CACHE, PROJECTILE_SPRITE_RENDER_CACHE_MAX, PROJECTILE_SPRITE_RENDER_CACHE_MAX_PIXELS);
    return entry;
  }catch(_err){
    return null;
  }
}
function drawProjectileVisual(b){
  ctx.save();
  ctx.translate(b.x,b.y);
  ctx.rotate(b.rot);
  const cachedProjectile = getCachedProjectileSprite(b.kind, b.color);
  if(cachedProjectile){
    ctx.drawImage(cachedProjectile.canvas, -cachedProjectile.w / 2, -cachedProjectile.h / 2, cachedProjectile.w, cachedProjectile.h);
  }else{
    drawProjectileVisualShape(ctx, b.kind, b.color);
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
  invalidateGlobalUpgradeStatsCache();
  grid = Array(GRID_COLS*GRID_ROWS).fill(null);
  terrain = Array(GRID_COLS*GRID_ROWS).fill('empty');
  terrainHazards = Array(GRID_COLS*GRID_ROWS).fill('');
  invalidateTerrainRenderCache();
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
function rebuildCellCenterCache(){
  const key = `${GRID_COLS}|${GRID_ROWS}|${CELL}|${GX}|${GY}`;
  const total = GRID_COLS * GRID_ROWS;
  if(CELL_CENTER_LAYOUT_KEY === key && CELL_CENTER_CACHE.length === total) return;
  CELL_CENTER_LAYOUT_KEY = key;
  CELL_CENTER_CACHE.length = total;
  const half = CELL * .5;
  for(let i=0;i<total;i++){
    const c = CELL_CENTER_CACHE[i] || (CELL_CENTER_CACHE[i] = {x:0,y:0});
    c.x = GX + (i % GRID_COLS) * CELL + half;
    c.y = GY + Math.floor(i / GRID_COLS) * CELL + half;
  }
}
function center(i){
  return CELL_CENTER_CACHE[i] || {x:GX+(i%GRID_COLS)*CELL+CELL/2,y:GY+Math.floor(i/GRID_COLS)*CELL+CELL/2};
}
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
function distSq(a,b,c,d){const dx=a-c,dy=b-d;return dx*dx+dy*dy}
function canBuild(i){return i>=0 && terrain[i]!=='path' && terrain[i]!=='blocked'}
function defaultAug(){
  return {damage:0,fireRate:0,range:0,area:0,dot:0,freeze:0,freezeChance:0,chain:0,gravity:0,beamWidth:0,markAmp:0,poisonSlow:0,critChance:0,critMul:0,burstChance:0,crystalCharge:0,prismLink:0,resonancePlate:0,shieldDismantle:0,satelliteForge:0,emergencyBarrier:0};
}
let augRevisionSeq = 1;
function touchAug(t){
  if(!t) return;
  t._augRevision = augRevisionSeq++;
  t._statsCache = null;
  t._statsTerrainKey = '';
}
function ensureAug(t){
  if(!t.aug){
    t.aug = defaultAug();
    touchAug(t);
  }
  if(!t.skillLevels) t.skillLevels = {};
  return t.aug;
}
const AUG_KEYS = Object.freeze(Object.keys(defaultAug()));
function combineAugments(a,b){
  const out = defaultAug();
  for(let i=0;i<AUG_KEYS.length;i++){
    const k = AUG_KEYS[i];
    out[k] = ((a?.aug?.[k]||0) + (b?.aug?.[k]||0)) * .75;
  }
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
  touchAug(p);
  p.skillLevels = combineSkillLevels(a,b);
  const unlocked = syncTowerSkillUnlocks(p);
  if(unlocked.length && S){ log(`${p.def.name} Lv.${fmt2(p.level)} 고유 스킬 해금: ${unlocked.map(s=>s.name).join(' · ')}`); }
  return p;
}
function pointSeg(px,py,x1,y1,x2,y2){
  return Math.sqrt(pointSegSq(px,py,x1,y1,x2,y2));
}
function pointSegSq(px,py,x1,y1,x2,y2){
  const dx=x2-x1,dy=y2-y1;
  const lenSq = dx*dx+dy*dy || 1;
  const t=clamp(((px-x1)*dx+(py-y1)*dy)/lenSq,0,1);
  const nx = x1 + t*dx, ny = y1 + t*dy;
  const ox = px - nx, oy = py - ny;
  return ox*ox + oy*oy;
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

function isAndromedaRouteStage(stageNo=null){
  const stage = Number(stageNo ?? (S?.stageNo || StageMapState?.current || 1)) || 1;
  const def = STAGE_MAP_DEFS[Math.max(0, Math.min(STAGE_MAP_DEFS.length - 1, stage - 1))] || {};
  return String(def.key || '').startsWith('and_') || String(def.stageId || '').startsWith('4-') || String(def.stageId || '').startsWith('5-') || String(def.stageId || '').startsWith('6-');
}
function activeRouteVariants(){
  if(Array.isArray(routeVariants) && routeVariants.length){
    return routeVariants.filter(v => v && Array.isArray(v.points) && v.points.length >= 2);
  }
  return Array.isArray(route) && route.length >= 2 ? [{kind:'single', name:'primary', points:route, breaks:new Set()}] : [];
}
function enemyRoute(enemy){
  return enemy && Array.isArray(enemy.route) && enemy.route.length >= 2 ? enemy.route : route;
}
function enemyRouteBreaks(enemy){
  return enemy && enemy.routeBreaks instanceof Set ? enemy.routeBreaks : (routeTeleportBreaks instanceof Set ? routeTeleportBreaks : new Set());
}
function isEnemyTeleportBreak(enemy, seg){
  const breaks = enemyRouteBreaks(enemy);
  return !!(breaks && breaks.has && breaks.has(Number(seg)));
}
function selectEnemyRouteVariant(payload=null){
  const variants = activeRouteVariants();
  if(!variants.length) return {index:0, variant:{kind:'single', name:'primary', points:route, breaks:new Set()}};
  const forced = Number(payload?.routeVariantIndex);
  if(Number.isFinite(forced) && variants[forced]) return {index:forced, variant:variants[forced]};
  if(variants.length === 1) return {index:0, variant:variants[0]};
  const seed = Math.max(0, Number(S?.spawned || 0));
  return {index:seed % variants.length, variant:variants[seed % variants.length]};
}

function makeRoute(){
  // Andromeda-only route evolution.
  // Stage 1~2: single lane.
  // Stage 3~4: one gate -> split into two lanes -> merge before core.
  // Stage 5~9: two starting gates -> converge into a shared corridor.
  // Stage 10~14: dimensional jump lane with instant teleport.
  // Stage 15: final boss spiral route into the center core.
  const maxC = Math.max(1, GRID_COLS - 1);
  const maxR = Math.max(1, GRID_ROWS - 1);
  const bound = (v,min,max)=>Math.max(min, Math.min(max, v));
  const col = pct => bound(Math.round(maxC * pct), 0, maxC);
  const row = pct => bound(Math.round(maxR * pct), 0, maxR);
  const gp = (colPct,rowPct)=>gridPoint(col(colPct), row(rowPct));
  const stageNo = bound(Number(S?.stageNo || StageMapState?.current || 1) || 1, 1, STAGE_MAP_DEFS.length);
  const wave = Number(S?.ogge || 1) || 1;
  const waveBand = wave < 4 ? 0 : (wave < 8 ? 1 : 2);

  const legacyRouteTemplates = [
    [[.08,.24],[.30,.24],[.30,.46],[.62,.46],[.62,.70],[.86,.70]],
    [[.08,.18],[.44,.18],[.44,.34],[.18,.34],[.18,.62],[.70,.62],[.70,.84],[.92,.84]],
    [[.10,.70],[.32,.70],[.32,.28],[.58,.28],[.58,.56],[.86,.56]],
    [[.08,.40],[.38,.40],[.38,.18],[.72,.18],[.72,.48],[.28,.48],[.28,.78],[.82,.78]]
  ];

  function buildRouteFromPlan(plan, options={}){
    const entryRow = plan[0]?.[1] ?? 0;
    const startX = BOARD_IS_LANDSCAPE ? -Math.max(28, CELL * .72) : GX - Math.max(42, CELL * .88);
    const topLeftEntry = gridPoint(0, 0);
    const leftLaneEntry = gridPoint(0, row(entryRow));
    const baseRoute = [{x:startX, y:leftLaneEntry.y}, leftLaneEntry];
    for(const [c,r] of plan) baseRoute.push(gp(c,r));
    const last = baseRoute[baseRoute.length - 1];
    const boardRight = GX + GRID_COLS * CELL;
    const exitX = bound(Math.max(last.x + CELL * .42, boardRight + CELL * .18), last.x, Math.max(last.x, CORE.x - Math.max(12, CELL * .18)));
    if(Math.abs(exitX - last.x) > 2) baseRoute.push({x:exitX, y:last.y});
    if(Math.abs(last.y - CORE.y) > 2) baseRoute.push({x:exitX, y:CORE.y});
    baseRoute.push({x:CORE.x, y:CORE.y});
    const deduped = baseRoute.filter((pt, idx, arr)=>{
      if(idx === 0) return true;
      const prev = arr[idx-1];
      return Math.abs(pt.x - prev.x) > 1 || Math.abs(pt.y - prev.y) > 1;
    });
    const rawBreaks = new Set((options.teleportBreaks || []).map(Number).filter(n=>Number.isFinite(n)));
    const points = options.noChamfer ? deduped : applyRouteChamfers(deduped);
    const breaks = options.noChamfer ? rawBreaks : new Set();
    return {kind:options.kind || 'single', name:options.name || 'route', points, breaks};
  }

  function setRoutes(variants){
    const valid = variants.filter(v => v && Array.isArray(v.points) && v.points.length >= 2);
    routeVariants = valid.length ? valid : [buildRouteFromPlan(legacyRouteTemplates[0], {kind:'single', name:'fallback'})];
    route = routeVariants[0].points;
    routeTeleportBreaks = routeVariants[0].breaks || new Set();
    clearRouteOffsetCache();
    invalidateTerrainRenderCache();
  }

  if(!isAndromedaRouteStage(stageNo)){
    const plan = legacyRouteTemplates[((stageNo - 1) + waveBand) % legacyRouteTemplates.length];
    setRoutes([buildRouteFromPlan(plan, {kind:'legacy', name:'milky-route'})]);
    return;
  }

  if(stageNo >= 15){
    // v17: Stage 15 uses a simple circular vortex that visibly converges into
    // a small center core. This replaces the angular wide path so the final map
    // reads as: large circle -> smaller circle -> tiny core pull-in.
    const cx = CORE.x;
    const cy = CORE.y;
    const boardLeft = GX;
    const boardRight = GX + GRID_COLS * CELL;
    const boardTop = GY;
    const boardBottom = GY + GRID_ROWS * CELL;
    const safeX = Math.max(18, CELL * .36);
    const safeY = Math.max(18, CELL * .36);
    const outerR = Math.max(CELL * 2.15, Math.min((boardRight - boardLeft) * .42, (boardBottom - boardTop) * .43));
    const innerR = Math.max(CELL * .48, Math.min(CELL * .86, outerR * .18));
    const clampPoint = (x,y)=>({
      x:clamp(x, boardLeft + safeX, boardRight - safeX),
      y:clamp(y, boardTop + safeY, boardBottom - safeY)
    });
    const points = [];
    points.push({x:boardLeft - Math.max(36, CELL * .95), y:cy});
    points.push(clampPoint(cx - outerR, cy));
    const turns = 2.18;
    const steps = 54;
    for(let i=0;i<=steps;i++){
      const t = i / steps;
      const a = Math.PI + t * TAU * turns;
      const easeIn = t * t * (3 - 2 * t);
      const r = outerR + (innerR - outerR) * easeIn;
      points.push(clampPoint(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    points.push({x:CORE.x, y:CORE.y});
    const deduped = points.filter((pt, idx, arr)=>{
      if(idx === 0) return true;
      const prev = arr[idx-1];
      return Math.abs(pt.x - prev.x) > 2 || Math.abs(pt.y - prev.y) > 2;
    });
    setRoutes([{kind:'final-circular-center-core-v17', name:'FINAL CIRCULAR CORE', points:deduped, breaks:new Set()}]);
    return;
  }

  if(stageNo >= 10){
    const plans = [
      {name:'DIMENSIONAL JUMP A', plan:[[.08,.22],[.30,.22],[.30,.42],[.46,.42],[.46,.16],[.70,.16],[.70,.48],[.54,.48],[.54,.76],[.90,.76]], breaks:[5]},
      {name:'DIMENSIONAL JUMP B', plan:[[.08,.72],[.24,.72],[.24,.44],[.42,.44],[.42,.84],[.70,.84],[.70,.56],[.52,.56],[.52,.30],[.88,.30]], breaks:[5]}
    ];
    setRoutes(plans.map(p=>buildRouteFromPlan(p.plan, {kind:'teleport', name:p.name, teleportBreaks:p.breaks, noChamfer:true})));
    return;
  }

  if(stageNo >= 5){
    const dualGate = [
      [[.08,.18],[.34,.18],[.34,.34],[.56,.34],[.56,.50],[.72,.50],[.72,.72],[.90,.72]],
      [[.08,.78],[.28,.78],[.28,.58],[.48,.58],[.48,.50],[.72,.50],[.72,.72],[.90,.72]]
    ];
    setRoutes(dualGate.map((plan,i)=>buildRouteFromPlan(plan, {kind:'dual-gate', name:i===0?'NORTH GATE':'SOUTH GATE'})));
    return;
  }

  if(stageNo >= 3){
    const splitMerge = [
      [[.08,.42],[.28,.42],[.28,.22],[.54,.22],[.54,.42],[.74,.42],[.74,.62],[.90,.62]],
      [[.08,.42],[.28,.42],[.28,.62],[.54,.62],[.54,.42],[.74,.42],[.74,.62],[.90,.62]]
    ];
    setRoutes(splitMerge.map((plan,i)=>buildRouteFromPlan(plan, {kind:'split-merge', name:i===0?'UPPER SPLIT':'LOWER SPLIT'})));
    return;
  }

  const single = [
    [[.08,.26],[.24,.26],[.24,.48],[.46,.48],[.46,.34],[.70,.34],[.70,.58],[.88,.58]],
    [[.08,.60],[.30,.60],[.30,.30],[.56,.30],[.56,.52],[.82,.52]]
  ];
  setRoutes([buildRouteFromPlan(single[(stageNo + waveBand) % single.length], {kind:'single', name:'ANDROMEDA SINGLE'})]);
}

// v12: Andromeda route pocket cells.
// Multi-lane/spiral routes need buildable cells inside the lane gaps; otherwise
// the new path visuals look tactical but the player cannot place towers there.
// These cells are Andromeda-only and are protected from random blocked plates.
function currentAndromedaRouteStageNo(){
  return clamp(Number(S?.stageNo || StageMapState?.current || 1), 1, STAGE_MAP_DEFS.length);
}
function andromedaCellFromPct(cPct, rPct){
  const c = clamp(Math.round((GRID_COLS - 1) * Number(cPct || 0)), 0, GRID_COLS - 1);
  const r = clamp(Math.round((GRID_ROWS - 1) * Number(rPct || 0)), 0, GRID_ROWS - 1);
  return r * GRID_COLS + c;
}
function andromedaTacticalPocketSpecs(stageNo=null){
  const stage = clamp(Number(stageNo || currentAndromedaRouteStageNo()), 1, STAGE_MAP_DEFS.length);
  if(!isAndromedaRouteStage(stage)) return [];
  if(stage >= 15){
    // v14: build islands are placed between the enlarged spiral rings.
    // Keep the exact core center closed, but open wide-ring gaps where the player
    // naturally wants to place towers between monster lanes.
    return [
      [.50,.34,'amp'], [.34,.34,'empty'], [.66,.34,'empty'],
      [.28,.58,'empty'], [.72,.58,'empty'], [.42,.74,'empty'], [.58,.74,'empty']
    ];
  }
  if(stage >= 10){
    return [
      [.42,.44,'empty'], [.50,.56,'empty'], [.58,.42,'empty'], [.66,.64,'empty'], [.34,.70,'empty']
    ];
  }
  if(stage >= 5){
    return [
      [.38,.42,'empty'], [.46,.50,'empty'], [.54,.50,'empty'], [.62,.58,'empty'], [.72,.60,'empty']
    ];
  }
  if(stage >= 3){
    return [
      [.38,.42,'empty'], [.46,.42,'empty'], [.54,.42,'empty'], [.62,.52,'empty']
    ];
  }
  return [];
}
function andromedaTacticalPocketIndexes(stageNo=null){
  return andromedaTacticalPocketSpecs(stageNo).map(spec=>andromedaCellFromPct(spec[0], spec[1]));
}
function isAndromedaTacticalPocketCell(idx, stageNo=null){
  return andromedaTacticalPocketIndexes(stageNo).includes(Number(idx));
}
function openAndromedaTacticalPocketCells(){
  const stage = currentAndromedaRouteStageNo();
  if(!isAndromedaRouteStage(stage) || !Array.isArray(terrain)) return;
  const specs = andromedaTacticalPocketSpecs(stage);
  for(let i=0;i<specs.length;i++){
    const spec = specs[i];
    const idx = andromedaCellFromPct(spec[0], spec[1]);
    if(idx < 0 || idx >= terrain.length) continue;
    const desired = spec[2] || 'empty';
    // Open only intentional tactical islands; the actual Stage 15 center CORE
    // remains a route/core anchor, not a build tile.
    terrain[idx] = isSpecialPlateKey(desired) ? desired : 'empty';
    terrainHazards[idx] = '';
    if(isSpecialPlateKey(desired)){
      plateAffinity[idx] = {type: 8, color: PLANETS[8]?.color || '#60a5fa'};
    }
  }
}

function commercialCellHash(idx, salt){
  let h = 2166136261;
  h = Math.imul(h ^ (Number(idx) + 101), 16777619);
  h = Math.imul(h ^ (Number(S?.stageNo || StageMapState?.current || 1) * 1009), 16777619);
  h = Math.imul(h ^ (Number(S?.ogge || 1) * 9176), 16777619);
  h = Math.imul(h ^ Number(salt || 0), 16777619);
  return h >>> 0;
}
function commercialOrderedCells(cells, salt){
  return cells.slice().sort((a,b)=>commercialCellHash(a,salt)-commercialCellHash(b,salt));
}
function commercialNeighborIndexes(idx){
  const col = idx % GRID_COLS;
  const row = Math.floor(idx / GRID_COLS);
  const out = [];
  if(col > 0) out.push(idx - 1);
  if(col < GRID_COLS - 1) out.push(idx + 1);
  if(row > 0) out.push(idx - GRID_COLS);
  if(row < GRID_ROWS - 1) out.push(idx + GRID_COLS);
  return out;
}
function commercialHasAdjacentSamePlate(idx, key){
  const list = commercialNeighborIndexes(idx);
  for(let i=0;i<list.length;i++) if(terrain[list[i]] === key) return true;
  return false;
}
function commercialPathDistanceBuckets(){
  const pathCells = [];
  const buckets = {r1:[], r2:[], fallback:[]};
  for(let i=0;i<terrain.length;i++){
    if(terrain[i] === 'path') pathCells.push({c:i % GRID_COLS, r:Math.floor(i / GRID_COLS)});
  }
  for(let i=0;i<terrain.length;i++){
    if(terrain[i] !== 'empty') continue;
    const c = i % GRID_COLS;
    const r = Math.floor(i / GRID_COLS);
    let best = 999;
    for(let p=0;p<pathCells.length;p++){
      const d = Math.abs(c - pathCells[p].c) + Math.abs(r - pathCells[p].r);
      if(d < best) best = d;
      if(best <= 1) break;
    }
    if(best === 1) buckets.r1.push(i);
    else if(best === 2) buckets.r2.push(i);
    else buckets.fallback.push(i);
  }
  return buckets;
}
function commercialPickCell(candidates, key, salt){
  const ordered = commercialOrderedCells(candidates, salt);
  for(let i=0;i<ordered.length;i++){
    const idx = ordered[i];
    if(key === 'blocked' && isAndromedaTacticalPocketCell(idx)) continue;
    if(terrain[idx] === 'empty' && !commercialHasAdjacentSamePlate(idx, key)) return idx;
  }
  return -1;
}
function commercialAffinityTypeForPlate(idx, salt){
  const pool = availableSummonTypes ? availableSummonTypes().filter(type => type >= 0 && type < BASE_PLANET_COUNT) : [];
  const fallback = Array.from({length: BASE_PLANET_COUNT}, (_, i) => i);
  const list = pool.length ? pool : fallback;
  const pick = commercialCellHash(idx, salt) % list.length;
  return list[pick] ?? 0;
}
function commercialUsablePlacementCount(){
  let count = 0;
  for(let i=0;i<terrain.length;i++) if(terrain[i] !== 'path' && terrain[i] !== 'blocked') count++;
  return count;
}
function stagePressurePlateContext(){
  const stage = economyStageNo(S?.stageNo || StageMapState?.current || 1);
  const wave = economyWaveNo(S?.ogge || 1);
  return {stage, wave};
}
function dynamicBlockedPlateTarget(stageNo=null, waveNo=null){
  const stage = economyStageNo(stageNo);
  const wave = economyWaveNo(waveNo);
  // v-stage-pressure-carry: only the absolute tutorial steps 1-1~1-3 are free.
  // After that, pressure is based on cumulative main-stage progress so 2-1,
  // 3-1, 5-1... do not reset back to an empty board.
  if(stage <= 1 && wave < 4) return 0;
  const mainCarry = Math.floor(Math.max(0, stage - 1) * 1.6)
    + (stage >= 2 ? 2 : 0)
    + (stage >= 4 ? 2 : 0)
    + (stage >= 7 ? 1 : 0);
  const subRamp = wave >= 4 ? Math.floor(Math.max(0, wave - 3) * 2.2) : 0;
  return Math.max(0, Math.min(24, mainCarry + subRamp));
}
function dynamicHazardClusterPlan(stageNo=null, waveNo=null){
  const stage = economyStageNo(stageNo);
  const wave = economyWaveNo(waveNo);
  // v-stage-pressure-carry: hazard pressure also carries across main stages.
  // 1-1~1-6 remain readable for onboarding, but from 2-1 onward each main
  // stage keeps its baseline pressure instead of resetting on sub-stage 1.
  if(stage <= 1 && wave < 7) return [];
  if(stage >= 4 && wave >= 7) return [{size:3, offset:0}, {size:2, offset:1}];
  if(stage >= 4 || (stage >= 3 && wave >= 8)) return [{size:3, offset:0}];
  if(stage >= 2 || wave >= 7) return [{size:2, offset:0}];
  return [];
}
function dynamicHazardPlateTarget(stageNo=null, waveNo=null){
  return dynamicHazardClusterPlan(stageNo, waveNo).length;
}
function hazardPlateKeyForStage(stageNo=null, waveNo=null, offset=0){
  const stage = economyStageNo(stageNo);
  const wave = economyWaveNo(waveNo);
  const idx = Math.abs((stage * 3 + wave + Number(offset || 0))) % HAZARD_PLATE_KEYS.length;
  return HAZARD_PLATE_KEYS[idx] || HAZARD_PLATE_KEYS[0];
}
function minimumPlacementForPressure(stageNo=null, waveNo=null){
  const stage = economyStageNo(stageNo);
  const wave = economyWaveNo(waveNo);
  return stage >= 10 && wave >= 8 ? 38 : 42;
}
function commercialHazardClusterIndexes(anchorIdx, size=3){
  const clusterSize = Math.max(2, Math.min(3, Math.floor(Number(size || 3))));
  const col = anchorIdx % GRID_COLS;
  const row = Math.floor(anchorIdx / GRID_COLS);
  const out = [];
  if(clusterSize === 2){
    // 2x2 clusters use the anchor as the top-left cell.
    if(col < 0 || col >= GRID_COLS - 1 || row < 0 || row >= GRID_ROWS - 1) return null;
    for(let dy=0; dy<2; dy++){
      for(let dx=0; dx<2; dx++) out.push((row + dy) * GRID_COLS + (col + dx));
    }
    return out;
  }
  // 3x3 clusters use the anchor as the center cell.
  if(col <= 0 || col >= GRID_COLS - 1 || row <= 0 || row >= GRID_ROWS - 1) return null;
  for(let dy=-1; dy<=1; dy++){
    for(let dx=-1; dx<=1; dx++) out.push((row + dy) * GRID_COLS + (col + dx));
  }
  return out;
}
function commercialHazardClusterHasNearbyHazard(indexes){
  if(!indexes || !indexes.length) return false;
  const set = new Set(indexes);
  for(let i=0;i<indexes.length;i++){
    const idx = indexes[i];
    const col = idx % GRID_COLS;
    const row = Math.floor(idx / GRID_COLS);
    for(let dy=-1; dy<=1; dy++){
      for(let dx=-1; dx<=1; dx++){
        if(dx === 0 && dy === 0) continue;
        const nc = col + dx;
        const nr = row + dy;
        if(nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;
        const ni = nr * GRID_COLS + nc;
        if(set.has(ni)) continue;
        if(isHazardPlateKey(getTerrainHazardKey(ni))) return true;
      }
    }
  }
  return false;
}
function commercialCanPlaceHazardCluster(centerIdx, size=3){
  const indexes = commercialHazardClusterIndexes(centerIdx, size);
  if(!indexes) return null;
  ensureTerrainHazards();
  for(let i=0;i<indexes.length;i++){
    const idx = indexes[i];
    const baseKey = terrain[idx] || 'empty';
    // Hazard zones are allowed to run across monster routes and X/blocked plates,
    // but they must not cover positive special plates or another hazard cluster.
    if(isSpecialPlateKey(baseKey)) return null;
    if(isHazardPlateKey(getTerrainHazardKey(idx))) return null;
  }
  return indexes;
}
function commercialHazardPressureCandidates(){
  const out = [];
  for(let i=0;i<terrain.length;i++){
    const key = terrain[i] || 'empty';
    if(isSpecialPlateKey(key)) continue;
    if(isAndromedaTacticalPocketCell(i)) continue;
    out.push(i);
  }
  return out;
}
function commercialHazardClusterRoutePressureScore(indexes, salt){
  if(!indexes || !indexes.length) return -Infinity;
  const pathCells = [];
  for(let i=0;i<terrain.length;i++){
    if(terrain[i] === 'path') pathCells.push({c:i % GRID_COLS, r:Math.floor(i / GRID_COLS)});
  }
  let near1 = 0, near2 = 0, near3 = 0, bestTotal = 0;
  for(let i=0;i<indexes.length;i++){
    const c = indexes[i] % GRID_COLS;
    const r = Math.floor(indexes[i] / GRID_COLS);
    let best = 999;
    for(let p=0;p<pathCells.length;p++){
      const d = Math.abs(c - pathCells[p].c) + Math.abs(r - pathCells[p].r);
      if(d < best) best = d;
      if(best <= 1) break;
    }
    if(best === 1) near1++;
    else if(best === 2) near2++;
    else if(best === 3) near3++;
    bestTotal += Math.max(0, 6 - Math.min(best, 6));
  }
  // Large 3x3 hazards should pressure high-value tower seats: cells directly beside
  // the monster route are weighted highest, then route-distance 2 and 3.
  // The hash is only a tiny deterministic tie-breaker so repeated layouts stay stable.
  const tie = (commercialCellHash(indexes[Math.floor(indexes.length / 2)] || 0, salt) % 997) / 997;
  return near1 * 120 + near2 * 42 + near3 * 10 + bestTotal * 2 + tie;
}
function commercialPickHazardCluster(candidates, salt, size=3){
  const ordered = commercialOrderedCells(candidates, salt);
  for(let pass=0; pass<2; pass++){
    let bestCluster = null;
    let bestScore = -Infinity;
    for(let i=0;i<ordered.length;i++){
      const indexes = commercialCanPlaceHazardCluster(ordered[i], size);
      if(!indexes) continue;
      if(pass === 0 && commercialHazardClusterHasNearbyHazard(indexes)) continue;
      const score = commercialHazardClusterRoutePressureScore(indexes, salt + i * 31);
      if(score > bestScore){
        bestScore = score;
        bestCluster = indexes;
      }
    }
    if(bestCluster) return bestCluster;
  }
  return null;
}
function hazardClusterCenterForCell(idx, key){
  if(!isHazardPlateKey(key)) return -1;
  const col = idx % GRID_COLS;
  const row = Math.floor(idx / GRID_COLS);
  const sizes = [3, 2];
  for(let s=0; s<sizes.length; s++){
    const size = sizes[s];
    if(size === 3){
      for(let dy=-1; dy<=1; dy++){
        for(let dx=-1; dx<=1; dx++){
          const cc = col - dx;
          const rr = row - dy;
          if(cc <= 0 || cc >= GRID_COLS - 1 || rr <= 0 || rr >= GRID_ROWS - 1) continue;
          const centerIdx = rr * GRID_COLS + cc;
          const indexes = commercialHazardClusterIndexes(centerIdx, 3);
          if(!indexes || !indexes.includes(idx)) continue;
          let same = true;
          for(let i=0;i<indexes.length;i++){
            if(getTerrainHazardKey(indexes[i]) !== key){ same = false; break; }
          }
          if(same) return centerIdx;
        }
      }
    }else{
      for(let dy=0; dy<=1; dy++){
        for(let dx=0; dx<=1; dx++){
          const cc = col - dx;
          const rr = row - dy;
          if(cc < 0 || cc >= GRID_COLS - 1 || rr < 0 || rr >= GRID_ROWS - 1) continue;
          const anchorIdx = rr * GRID_COLS + cc;
          const indexes = commercialHazardClusterIndexes(anchorIdx, 2);
          if(!indexes || !indexes.includes(idx)) continue;
          let same = true;
          for(let i=0;i<indexes.length;i++){
            if(getTerrainHazardKey(indexes[i]) !== key){ same = false; break; }
          }
          if(same) return anchorIdx;
        }
      }
    }
  }
  return idx;
}
function isHazardClusterLabelCell(idx, key){
  if(!isHazardPlateKey(key)) return false;
  return hazardClusterCenterForCell(idx, key) === idx;
}

function andromedaScenarioCandidateCells(){
  const out = [];
  if(!Array.isArray(terrain)) return out;
  const centerCol = (GRID_COLS - 1) / 2;
  const centerRow = (GRID_ROWS - 1) / 2;
  for(let i=0;i<terrain.length;i++){
    if(terrain[i] !== 'empty') continue;
    const c = i % GRID_COLS;
    const r = Math.floor(i / GRID_COLS);
    const dist = Math.abs(c - centerCol) + Math.abs(r - centerRow);
    out.push({idx:i, dist});
  }
  return out.sort((a,b)=>a.dist-b.dist || commercialCellHash(a.idx, 24000)-commercialCellHash(b.idx, 24000)).map(x=>x.idx);
}
function applyAndromedaScenarioTerrain(){
  const stage = Number(S?.stageNo || StageMapState?.current || 1);
  const wave = Number(S?.ogge || 1);
  if(stage !== 14 && stage !== 15) return;
  const candidates = andromedaScenarioCandidateCells();
  if(!candidates.length) return;
  if(stage === 14){
    const keys = ['amp','coil','lens','mine'];
    const key = keys[commercialCellHash(wave + 13, 26000) % keys.length] || 'amp';
    const idx = candidates[0];
    terrain[idx] = key;
    plateAffinity[idx] = {type: commercialAffinityTypeForPlate(idx, 26010 + wave), color: PLANETS[commercialAffinityTypeForPlate(idx, 26010 + wave)]?.color || '#67e8f9'};
    const noteKey = `andromeda-u-${stage}-${wave}-${key}`;
    if(S && S.andromedaScenarioNoteKey !== noteKey){
      S.andromedaScenarioNoteKey = noteKey;
      log(`수호자의 심장: 이번 웨이브 U 칸은 ${TERRAIN[key]?.name || key}로 안정화됩니다.`);
    }
  }
  if(stage === 15){
    const idx = candidates[0];
    terrain[idx] = 'amp';
    plateAffinity[idx] = {type: 8, color: PLANETS[8]?.color || '#60a5fa'};
    const cc = idx % GRID_COLS;
    const rr = Math.floor(idx / GRID_COLS);
    for(let dy=-1; dy<=1; dy++){
      for(let dx=-1; dx<=1; dx++){
        if(dx === 0 && dy === 0) continue;
        const nc = cc + dx, nr = rr + dy;
        if(nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;
        const ni = nr * GRID_COLS + nc;
        if(terrain[ni] === 'empty') terrain[ni] = 'blocked';
      }
    }
    const noteKey = `andromeda-k-${stage}-${wave}`;
    if(S && S.andromedaScenarioNoteKey !== noteKey){
      S.andromedaScenarioNoteKey = noteKey;
      log('안드로메다의 잔향: 중앙 K 핵심 칸 하나만 열렸습니다. 최고 레벨 타워를 중심부에 배치하세요.');
    }
  }
}

function makeTerrain(){
  terrain.fill('empty');
  ensureTerrainHazards().fill('');
  plateAffinity = {};
  const stageBalance = getCommercialStageBalance(S?.stageNo || StageMapState?.current || 1);
  const pathWidth = CELL * .38;
  const terrainRoutes = activeRouteVariants();
  for(let i=0;i<terrain.length;i++){
    const c=center(i);
    for(let r=0;r<terrainRoutes.length;r++){
      const rv = terrainRoutes[r];
      const pts = rv.points || [];
      const breaks = rv.breaks instanceof Set ? rv.breaks : new Set();
      for(let j=0;j<pts.length-1;j++){
        if(breaks.has(j)) continue;
        if(pointSeg(c.x,c.y,pts[j].x,pts[j].y,pts[j+1].x,pts[j+1].y)<pathWidth) terrain[i]='path';
      }
    }
  }

  openAndromedaTacticalPocketCells();
  const buckets = commercialPathDistanceBuckets();
  const blockedPlaced = [];
  const {stage:pressureStage, wave:pressureWave} = stagePressurePlateContext();
  const forbiddenBudget = Math.max(0, Math.floor(Number(stageBalance.forbidden_budget || 0)));
  const dynamicBlockedTarget = dynamicBlockedPlateTarget(pressureStage, pressureWave);
  const totalBlockedTarget = Math.max(forbiddenBudget, dynamicBlockedTarget);
  for(let n=0;n<totalBlockedTarget;n++){
    const candidates = n % 2 === 0 ? buckets.r1.concat(buckets.r2) : buckets.r2.concat(buckets.r1);
    const pick = commercialPickCell(candidates, 'blocked', 7000 + n);
    if(pick < 0) break;
    terrain[pick] = 'blocked';
    blockedPlaced.push(pick);
  }

  const plateBudget = stageBalance.plate_budget || COMMERCIAL_STAGE_BALANCE_DEFAULT.plate_budget;
  const specialPlateOrder = [];
  ['amp','coil','lens','mine','rift'].forEach(key=>{
    const count = Math.max(0, Math.floor(Number(plateBudget[key] || 0)));
    for(let i=0;i<count;i++) specialPlateOrder.push(key);
  });
  for(let n=0;n<specialPlateOrder.length;n++){
    const key = specialPlateOrder[n];
    let pick = commercialPickCell(buckets.r1, key, 11000 + n * 17);
    if(pick < 0) pick = commercialPickCell(buckets.r2, key, 12000 + n * 17);
    if(pick < 0) pick = commercialPickCell(buckets.fallback, key, 13000 + n * 17);
    if(pick < 0) continue;
    terrain[pick] = key;
    const affinityType = commercialAffinityTypeForPlate(pick, 14000 + n * 19);
    plateAffinity[pick] = {type: affinityType, color: PLANETS[affinityType]?.color || '#67e8f9'};
  }

  applyAndromedaScenarioTerrain();
  openAndromedaTacticalPocketCells();

  const hazardPlan = dynamicHazardClusterPlan(pressureStage, pressureWave);
  const hazardRoutePressureCandidates = commercialHazardPressureCandidates();
  for(let n=0;n<hazardPlan.length;n++){
    const plan = hazardPlan[n] || {size:3, offset:n};
    const size = Math.max(2, Math.min(3, Math.floor(Number(plan.size || 3))));
    const key = hazardPlateKeyForStage(pressureStage, pressureWave, plan.offset ?? n);
    let cluster = commercialPickHazardCluster(hazardRoutePressureCandidates, 16000 + n * 37, size);
    if(!cluster) cluster = commercialPickHazardCluster(buckets.fallback, 17000 + n * 37, size);
    if(!cluster) continue;
    for(let i=0;i<cluster.length;i++) terrainHazards[cluster[i]] = key;
  }

  const minimumUsable = Math.max(
    Math.floor(Number(stageBalance.minimum_usable_placements || 0)),
    minimumPlacementForPressure(pressureStage, pressureWave)
  );
  while(blockedPlaced.length && commercialUsablePlacementCount() < minimumUsable){
    const idx = blockedPlaced.pop();
    if(terrain[idx] === 'blocked') terrain[idx] = 'empty';
  }
  openAndromedaTacticalPocketCells();
  invalidateTerrainRenderCache();
}


const STAGE_BATTLE_DESCRIPTIONS = Object.fromEntries(
  Object.entries(STAGE_DESCRIPTION_COPY).map(([stage, copy]) => [Number(stage), copy.battle])
);
const STAGE_WAVE_LINES = {"1":"M01 성운 주자와 M02 공명 장갑체 입문 웨이브","2":"잔향 분기와 M02 보호막 예고 웨이브","3":"M02 보호막 대응과 공명 표식 학습 웨이브","4":"M02/M07 분산 표식과 행렬 압박 웨이브","5":"B01 외곽 수호체 대비 보호막·장갑 웨이브","6":"M04/M06 고속·포탈 출구 압박 웨이브","7":"M05 중력 오라와 질주체 제어 웨이브","8":"중력 둔화와 병합 효율 검증 웨이브","9":"균열 행렬과 포탈 출구 방어 웨이브","10":"B02 중력 균열체 대비 오라·포탈 복합 웨이브","11":"폐허 코어 직선 경로와 프리즘 학습 웨이브","12":"프리즘 방어망과 M07 행렬 처리 웨이브","13":"오염 프로토콜 종합 테스트 웨이브","14":"U 랜덤 버프 관문과 M10 성흔 포식체 압박 웨이브","15":"K 핵심 칸과 B03 아스트라 최종 공명 웨이브"};
const STAGE_WAVE_TIPS = {"1":"기본 화력 / 초반 병합","2":"합류점 집중 / 보호막 대비","3":"공명 표식 / 보호막 약화","4":"분산 경로 / 행렬 정리","5":"보스 대응 / 보호막 처리","6":"포탈 출구 / 빠른 적 차단","7":"중력 둔화 / 오라 몬스터 우선 제거","8":"제어 화력 / 병합 효율","9":"출구 방어 / 범위·관통 가치","10":"중력 보스 / 오라 차단","11":"직선 경로 / 프리즘 관통","12":"행렬 처리 / 프리즘 배치","13":"복합 기믹 / 안정 배치","14":"U 칸 활용 / M10 우선 처치","15":"K 핵심 칸 / 최종 보스 집중"};
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


let wavePreviewInfoCacheKey = '';
let wavePreviewInfoCacheValue = null;
function getWavePreviewInfo(waveNo, stageNo){
  const stage = clamp(Number(stageNo || S?.stageNo || StageMapState.current || 1), 1, STAGE_MAP_DEFS.length);
  const wave = Number(waveNo || 1);
  const cacheKey = `${stage}|${wave}`;
  if(wavePreviewInfoCacheValue && wavePreviewInfoCacheKey === cacheKey) return wavePreviewInfoCacheValue;
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
  const monsters = monsterPoolSummary(stage, wave);
  const result = {
    title: parts.join(' · '),
    detail: `등장: ${monsters} · 추천: ${tips.filter(Boolean).join(' / ')}`
  };
  wavePreviewInfoCacheKey = cacheKey;
  wavePreviewInfoCacheValue = result;
  return result;
}
function renderWavePreview(){
  const el = $('wavePreviewText');
  if(!el || !S) return;
  const info = getWavePreviewInfo(S.ogge || 1, S.stageNo || StageMapState.current || 1);
  setTextIfChanged(el, `${info.title} · ${info.detail}`);
}

function prepareWave(){
  makeRoute();
  makeTerrain();
  relocateInvalidPlanets();
  recycleAllEnemies();recycleAllBullets();particles.length=0;beams.length=0;floats.length=0;anomalies.length=0;
  S.stageArmorBonus=0;
  S.globalCooldownPenalty=0;
  S.hazardTimer=150;
  buildDustClouds();
  S.queue.length=0;
  const stageBalance = getCommercialStageBalance(S.stageNo || StageMapState.current || 1);
  const baseCount = 28 + S.ogge*6 + S.theme*6;
  const count = Math.max(10, Math.round(baseCount * Number(stageBalance.wave_count_multiplier || 1)));
  const monsterPool = getStageMonsterPool(S.stageNo || StageMapState.current || 1, S.ogge || 1);
  for(let i=0;i<count;i++){
    let type = pickWeightedMonster(monsterPool);
    // Reward monsters remain rare and intentional; use the new SF id instead of the old treasure id.
    if(Math.random()<.018+S.mods.treasure) type='stigma_carrier';
    S.queue.push({type, monsterWave:S.ogge || 1, monsterStage:S.stageNo || StageMapState.current || 1});
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
  S.resultWaveStartHp = Number(S.hp || S.maxHp || 0);
  S.resultWaveStartMaxHp = Number(S.maxHp || S.hp || 0);
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
  log(`웨이브 ${S.ogge}: ${theme().ko} / 몬스터 구성 ${monsterPoolSummary(S.stageNo || StageMapState.current || 1, S.ogge)} / 적 ${S.total}체 접근`);
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


// v8: cache expensive planet sprite draws. The main battle loop keeps all
// orbit/glow/evolution effects, but avoids repeating image filter + shadowBlur +
// sprite crop work for every placed planet on every frame.
const PLANET_SPRITE_RENDER_CACHE = new Map();
const PLANET_SPRITE_RENDER_CACHE_MAX = 180;
const PLANET_SPRITE_RENDER_CACHE_MAX_PIXELS = 1800000;
function renderCacheEntryPixels(entry){
  if(!entry) return 0;
  const canvas = entry.canvas;
  if(canvas) return (canvas.width || entry.w || 0) * (canvas.height || entry.h || 0);
  return (entry.w || 0) * (entry.h || 0);
}
function renderCachePixelTotal(cache){
  let total = 0;
  for(const entry of cache.values()) total += renderCacheEntryPixels(entry);
  return total;
}
function trimRenderCache(cache, maxEntries, maxPixels=0){
  while(cache.size > maxEntries){
    const first = cache.keys().next().value;
    if(first === undefined) break;
    cache.delete(first);
  }
  if(maxPixels > 0){
    let totalPixels = renderCachePixelTotal(cache);
    while(totalPixels > maxPixels && cache.size > 1){
      const first = cache.keys().next().value;
      if(first === undefined) break;
      const entry = cache.get(first);
      totalPixels -= renderCacheEntryPixels(entry);
      cache.delete(first);
    }
  }
}
function makeRenderCanvas(w, h){
  const canvasEl = document.createElement('canvas');
  canvasEl.width = Math.max(1, Math.ceil(w));
  canvasEl.height = Math.max(1, Math.ceil(h));
  return canvasEl;
}
function imageRenderKey(img){
  return `${img.currentSrc || img.src || 'img'}|${img.naturalWidth || 0}x${img.naturalHeight || 0}`;
}
function drawImageContainCenteredOn(targetCtx, img, cx, cy, maxW, maxH){
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if(!iw || !ih) return;
  const scale = Math.min(maxW / iw, maxH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  targetCtx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}
function drawSpriteCoverOn(targetCtx, img, sx, sy, sw, sh, dx, dy, dw, dh){
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
  targetCtx.drawImage(img, cropX, cropY, cropW, cropH, dx, dy, dw, dh);
}
function getCachedPlanetSprite(type, size, level=1){
  let img = null, mode = '', sx = 0, sy = 0, sw = 0, sh = 0, drawSize = 0;
  const thumbImg = planetThumbImage(type, level);
  if(thumbImg && thumbImg.complete && thumbImg.naturalWidth){
    img = thumbImg;
    mode = 'thumb';
    drawSize = size * (type === HIDDEN_PLANET_TYPE ? 1.20 : 1.14);
  }else{
    const evoImg = planetSheetImage(type);
    const evoCol = planetEvolutionColumn(level);
    if(evoImg && evoImg.complete && evoImg.naturalWidth){
      img = evoImg;
      mode = 'evo';
      sw = evoImg.naturalWidth / PLANET_EVOLUTION_COLS;
      sh = evoImg.naturalHeight;
      sx = evoCol * sw;
      sy = 0;
      drawSize = size * (type === HIDDEN_PLANET_TYPE ? 1.12 : 1.00);
    }else if(PLANET_ICON_SHEET && PLANET_ICON_SHEET.complete && PLANET_ICON_SHEET.naturalWidth){
      img = PLANET_ICON_SHEET;
      mode = 'icon';
      sw = img.naturalWidth / PLANET_ICON_COLS;
      sh = img.naturalHeight / PLANET_ICON_ROWS;
      sx = (type % PLANET_ICON_COLS) * sw;
      sy = Math.floor(type / PLANET_ICON_COLS) * sh;
      drawSize = size * (type === HIDDEN_PLANET_TYPE ? 1.08 : PLANET_RENDER_SCALE);
    }
  }
  if(!img || !drawSize) return null;

  // Rounded size prevents drag/settle animation from creating a new canvas for
  // every tiny sub-pixel change while keeping the rendered size visually equal.
  const roundedDrawSize = Math.max(8, Math.round(drawSize * 2) / 2);
  const hidden = type === HIDDEN_PLANET_TYPE;
  const shadowBlur = hidden ? (mode === 'icon' ? 26 : 24) : (mode === 'icon' ? 17 : 16);
  const shadowColor = hidden ? (mode === 'icon' ? 'rgba(255,250,230,.44)' : 'rgba(255,250,230,.48)') : (mode === 'icon' ? 'rgba(255,255,255,.32)' : 'rgba(255,255,255,.30)');
  const key = `${mode}|${type}|${level}|${roundedDrawSize}|${imageRenderKey(img)}`;
  const cached = PLANET_SPRITE_RENDER_CACHE.get(key);
  if(cached){
    PLANET_SPRITE_RENDER_CACHE.delete(key);
    PLANET_SPRITE_RENDER_CACHE.set(key, cached);
    return cached;
  }

  try{
    const pad = Math.ceil(shadowBlur * 2.2 + 6);
    const canvasSize = Math.ceil(roundedDrawSize + pad * 2);
    const canvasEl = makeRenderCanvas(canvasSize, canvasSize);
    const spriteCtx = canvasEl.getContext('2d');
    if(!spriteCtx) return null;
    const cx = canvasSize / 2;
    const cy = canvasSize / 2;
    spriteCtx.save();
    spriteCtx.imageSmoothingEnabled = true;
    spriteCtx.shadowColor = shadowColor;
    spriteCtx.shadowBlur = shadowBlur;
    spriteCtx.filter = 'brightness(1.10) saturate(1.15)';
    if(mode === 'thumb'){
      drawImageContainCenteredOn(spriteCtx, img, cx, cy, roundedDrawSize, roundedDrawSize);
    }else{
      drawSpriteCoverOn(spriteCtx, img, sx, sy, sw, sh, cx - roundedDrawSize / 2, cy - roundedDrawSize / 2, roundedDrawSize, roundedDrawSize);
    }
    spriteCtx.restore();
    const entry = {canvas: canvasEl, w: canvasSize, h: canvasSize};
    PLANET_SPRITE_RENDER_CACHE.set(key, entry);
    trimRenderCache(PLANET_SPRITE_RENDER_CACHE, PLANET_SPRITE_RENDER_CACHE_MAX, PLANET_SPRITE_RENDER_CACHE_MAX_PIXELS);
    return entry;
  }catch(_err){
    return null;
  }
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
  const nowMs = visualNowMs || (performance.now ? performance.now() : Date.now());
  const pulse = 1 + Math.sin(nowMs / (260 - tier * 20) + tower.phase) * 0.05;
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
      const a = tower.phase + nowMs * .0012 * (i ? -1 : 1) + i * Math.PI;
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
      const a = -Math.PI/2 + i * TAU / 6 + nowMs * .0004;
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
      const a = nowMs * .0012 + i * TAU / 5;
      const sx = Math.cos(a) * 28;
      const sy = Math.sin(a) * 28;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

const NEAREST_ROUTE_HIT = {x:0,y:0,t:0,dist:0,seg:0,score:0};

function nearestRoutePoint(px, py, preferredSeg=0, routePoints=null){
  const pts = Array.isArray(routePoints) && routePoints.length >= 2 ? routePoints : route;
  if(!Array.isArray(pts) || pts.length < 2) return null;
  const start = Math.max(0, preferredSeg - 1);
  const end = Math.min(pts.length - 2, preferredSeg + 1);
  let bestScore = Infinity, bestX = px, bestY = py, bestT = 0, bestDistSq = 0, bestSeg = preferredSeg;
  for(let seg=start; seg<=end; seg++){
    const a = pts[seg], b = pts[seg+1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx*dx + dy*dy || 1;
    const t = clamp(((px - a.x) * dx + (py - a.y) * dy) / lenSq, 0, 1);
    const x = a.x + dx * t;
    const y = a.y + dy * t;
    const ddx = px - x, ddy = py - y;
    const distSqVal = ddx*ddx + ddy*ddy;
    // v11: compare squared distance in the hot path and take sqrt once only for the winning segment.
    // Tiny tie penalty keeps the original corner preference without paying sqrt for every candidate.
    const tiePenalty = Math.abs(seg - preferredSeg) * .000001 + (seg < preferredSeg ? .000002 : 0);
    const score = distSqVal + tiePenalty;
    if(score < bestScore){ bestScore = score; bestX = x; bestY = y; bestT = t; bestDistSq = distSqVal; bestSeg = seg; }
  }
  NEAREST_ROUTE_HIT.x = bestX;
  NEAREST_ROUTE_HIT.y = bestY;
  NEAREST_ROUTE_HIT.t = bestT;
  NEAREST_ROUTE_HIT.dist = Math.sqrt(bestDistSq);
  NEAREST_ROUTE_HIT.seg = bestSeg;
  NEAREST_ROUTE_HIT.score = bestScore;
  return NEAREST_ROUTE_HIT;
}

function confineEnemyToRoute(enemy, maxOffset=12){
  const er = enemyRoute(enemy);
  if(!er || er.length < 2 || !enemy) return;
  const currentSeg = Math.max(0, Math.min(er.length - 2, enemy.seg || 0));
  const a = er[currentSeg], b = er[currentSeg + 1];
  if(a && b){
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy || 1;
    const t = clamp(((enemy.x - a.x) * dx + (enemy.y - a.y) * dy) / lenSq, 0, 1);
    const nx = a.x + dx * t, ny = a.y + dy * t;
    const ox = enemy.x - nx, oy = enemy.y - ny;
    const limitSq = maxOffset * maxOffset;
    const ds = ox * ox + oy * oy;
    // Most enemies are already exactly on their current segment. Avoid the older
    // neighbor-segment scan and sqrt in that hot path; fall back only for real drift.
    if(ds <= limitSq) return;
  }
  const hit = nearestRoutePoint(enemy.x, enemy.y, currentSeg, er);
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


function prewarmPlanetSpriteCacheV120(){
  // Decode/cache the level-1 tower sprites before the player taps summon.
  // This avoids a first-use offscreen-canvas render during gameplay.
  try{
    const sizes = [PLANET_BASE_SIZE, IS_MOBILE_BOARD ? 46 : 39, 52];
    const maxType = Math.min(BASE_PLANET_COUNT, Array.isArray(PLANETS) ? PLANETS.length : BASE_PLANET_COUNT);
    for(let type=0; type<maxType; type++){
      for(let i=0;i<sizes.length;i++) getCachedPlanetSprite(type, sizes[i], 1);
    }
  }catch(_err){}
}
function schedulePlanetSpritePrewarmV120(attempt=0){
  const run = function(){
    prewarmPlanetSpriteCacheV120();
    if(attempt < 5 && PLANET_SPRITE_RENDER_CACHE.size < Math.min(BASE_PLANET_COUNT, 9)){
      setTimeout(function(){ schedulePlanetSpritePrewarmV120(attempt + 1); }, 520);
    }
  };
  if(window.requestIdleCallback) window.requestIdleCallback(run, {timeout:1200});
  else setTimeout(run, 240);
}
try{
  if(document.readyState === 'complete') schedulePlanetSpritePrewarmV120();
  else window.addEventListener('load', function(){ schedulePlanetSpritePrewarmV120(); }, {once:true});
}catch(_err){}

function drawPlanetSprite(type, x, y, size, frameIndex, level=1){
  const cachedSprite = getCachedPlanetSprite(type, size, level);
  if(cachedSprite){
    ctx.drawImage(cachedSprite.canvas, x - cachedSprite.w / 2, y - cachedSprite.h / 2, cachedSprite.w, cachedSprite.h);
    return true;
  }
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

const ORBIT_ASTEROID_RENDER_CACHE = new Map();
const ORBIT_ASTEROID_RENDER_CACHE_MAX = 48;
const ORBIT_ASTEROID_RENDER_CACHE_MAX_PIXELS = 180000;
function getCachedOrbitAsteroidSprite(type, color, index){
  const hidden = type === HIDDEN_PLANET_TYPE;
  const r = (hidden ? 3.8 : 2.6) + index * .55;
  const blur = hidden ? 10 : 6;
  const key = `${hidden ? 'h' : 'n'}|${index}|${color}|${r}`;
  const cached = ORBIT_ASTEROID_RENDER_CACHE.get(key);
  if(cached){
    ORBIT_ASTEROID_RENDER_CACHE.delete(key);
    ORBIT_ASTEROID_RENDER_CACHE.set(key, cached);
    return cached;
  }
  try{
    const pad = Math.ceil(blur * 2 + 5);
    const canvasSize = Math.ceil(r * 4 + pad * 2);
    const canvasEl = makeRenderCanvas(canvasSize, canvasSize);
    const spriteCtx = canvasEl.getContext('2d');
    if(!spriteCtx) return null;
    const cx = canvasSize / 2, cy = canvasSize / 2;
    spriteCtx.save();
    spriteCtx.globalAlpha = .95;
    spriteCtx.shadowColor = index === 0 ? '#ffffff' : color;
    spriteCtx.shadowBlur = blur;
    const g = spriteCtx.createRadialGradient(cx-r*.4, cy-r*.5, 0, cx, cy, r*1.8);
    g.addColorStop(0, 'rgba(255,255,255,.96)');
    g.addColorStop(.28, index === 0 ? 'rgba(241,245,249,.95)' : color);
    g.addColorStop(1, index === 0 ? 'rgba(71,85,105,.75)' : 'rgba(15,23,42,.86)');
    spriteCtx.fillStyle = g;
    spriteCtx.beginPath(); spriteCtx.arc(cx, cy, r, 0, TAU); spriteCtx.fill();
    spriteCtx.restore();
    const entry = {canvas: canvasEl, w: canvasSize, h: canvasSize};
    ORBIT_ASTEROID_RENDER_CACHE.set(key, entry);
    trimRenderCache(ORBIT_ASTEROID_RENDER_CACHE, ORBIT_ASTEROID_RENDER_CACHE_MAX, ORBIT_ASTEROID_RENDER_CACHE_MAX_PIXELS);
    return entry;
  }catch(_err){
    return null;
  }
}

function drawPlanetOrbitAsteroids(type, x, y, level, phase){
  const d = PLANETS[type];
  const t = visualNowSec || ((performance.now ? performance.now() : Date.now()) * 0.001);
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
    const asteroidSprite = getCachedOrbitAsteroidSprite(type, d.color, i);
    if(asteroidSprite){
      ctx.drawImage(asteroidSprite.canvas, orx - asteroidSprite.w / 2, ory - asteroidSprite.h / 2, asteroidSprite.w, asteroidSprite.h);
    }else{
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
  }
  ctx.restore();
}


const PEDESTAL_BASE_RENDER_CACHE = new Map();
const PEDESTAL_BASE_RENDER_CACHE_MAX = 96;
const PEDESTAL_BASE_RENDER_CACHE_MAX_PIXELS = 720000;
function getCachedPedestalBase(accent, rx, ry, tier){
  const qx = Math.round(rx * 2) / 2;
  const qy = Math.round(ry * 2) / 2;
  const key = `${accent}|${qx}|${qy}|${tier}`;
  const cached = PEDESTAL_BASE_RENDER_CACHE.get(key);
  if(cached){
    PEDESTAL_BASE_RENDER_CACHE.delete(key);
    PEDESTAL_BASE_RENDER_CACHE.set(key, cached);
    return cached;
  }
  try{
    const pad = 8;
    const canvasW = Math.ceil(qx * 2.72 + pad * 2);
    const canvasH = Math.ceil(qy * 5.24 + pad * 2);
    const canvasEl = makeRenderCanvas(canvasW, canvasH);
    const baseCtx = canvasEl.getContext('2d');
    if(!baseCtx) return null;
    const cx = canvasW / 2, cy = canvasH / 2;
    baseCtx.save();
    const floorGlow = baseCtx.createRadialGradient(cx, cy, 1, cx, cy, qx * 1.34);
    floorGlow.addColorStop(0, 'rgba(255,255,255,.16)');
    floorGlow.addColorStop(.18, accent);
    floorGlow.addColorStop(.55, 'rgba(15,23,42,.14)');
    floorGlow.addColorStop(1, 'rgba(15,23,42,0)');
    baseCtx.globalAlpha = .18 + tier * .03;
    baseCtx.fillStyle = floorGlow;
    baseCtx.beginPath();
    baseCtx.ellipse(cx, cy, qx * 1.26, qy * 2.55, 0, 0, TAU);
    baseCtx.fill();

    const coreGlow = baseCtx.createRadialGradient(cx, cy - 1, 0, cx, cy, qx * .74);
    coreGlow.addColorStop(0, 'rgba(255,255,255,.36)');
    coreGlow.addColorStop(.25, accent);
    coreGlow.addColorStop(1, 'rgba(15,23,42,0)');
    baseCtx.globalAlpha = .24;
    baseCtx.fillStyle = coreGlow;
    baseCtx.beginPath();
    baseCtx.ellipse(cx, cy, qx * .78, qy * 1.22, 0, 0, TAU);
    baseCtx.fill();
    baseCtx.restore();
    const entry = {canvas: canvasEl, w: canvasW, h: canvasH, cx, cy};
    PEDESTAL_BASE_RENDER_CACHE.set(key, entry);
    trimRenderCache(PEDESTAL_BASE_RENDER_CACHE, PEDESTAL_BASE_RENDER_CACHE_MAX, PEDESTAL_BASE_RENDER_CACHE_MAX_PIXELS);
    return entry;
  }catch(_err){
    return null;
  }
}
function drawCachedPedestalBase(accent, rx, ry, tier){
  const base = getCachedPedestalBase(accent, rx, ry, tier);
  if(base){
    ctx.drawImage(base.canvas, -base.cx, -base.cy, base.w, base.h);
    return true;
  }
  return false;
}

function drawTowerPedestalFx(tower, x, y, size){
  if(!isPlateAffinityMatched(tower)) return;
  const d = tower.def || { color:'#67e8f9', id:'unknown' };
  const t = visualNowSec || ((performance.now ? performance.now() : Date.now()) * 0.001);
  const tier = planetEvolutionTier ? planetEvolutionTier(tower.level || 1) : 0;
  const baseY = y + Math.max(17, size * 0.40);
  const rx = Math.max(26, size * 0.72 + tier * 3.8);
  const ry = Math.max(7.5, size * 0.22 + tier * 0.9);
  const pulse = 1 + Math.sin(t * 1.8 + tower.phase * 1.3) * 0.028;
  const accent = d.color || '#67e8f9';

  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(pulse, pulse);

  // soft underglow disk + subtle center pad are static for a given
  // color/size/tier, so render them from cache and keep the animated rings below.
  if(!drawCachedPedestalBase(accent, rx, ry, tier)){
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

    const coreGlow = ctx.createRadialGradient(0, -1, 0, 0, 0, rx * .74);
    coreGlow.addColorStop(0, 'rgba(255,255,255,.36)');
    coreGlow.addColorStop(.25, accent);
    coreGlow.addColorStop(1, 'rgba(15,23,42,0)');
    ctx.globalAlpha = .24;
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * .78, ry * 1.22, 0, 0, TAU);
    ctx.fill();
  }

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


function hazardTowerFxPalette(hazardKey){
  switch(hazardKey){
    case 'hazard_weaken':
      return { tint:'rgba(127,29,29,.50)', glow:'rgba(248,113,113,.34)', ring:'rgba(252,165,165,.78)', mote:'rgba(254,202,202,.88)' };
    case 'hazard_disrupt':
      return { tint:'rgba(120,22,22,.48)', glow:'rgba(251,113,133,.30)', ring:'rgba(253,164,175,.76)', mote:'rgba(254,205,211,.86)' };
    case 'hazard_unstable':
      return { tint:'rgba(136,19,55,.52)', glow:'rgba(244,63,94,.30)', ring:'rgba(251,113,133,.78)', mote:'rgba(254,205,211,.90)' };
    case 'hazard_overheat':
    default:
      return { tint:'rgba(127,29,29,.52)', glow:'rgba(239,68,68,.34)', ring:'rgba(248,113,113,.80)', mote:'rgba(254,202,202,.88)' };
  }
}

function drawTowerHazardCorruptionFx(tower, x, y, size, hazardKey){
  if(!isHazardPlateKey(hazardKey)) return;
  const palette = hazardTowerFxPalette(hazardKey);
  const t = visualNowSec || ((performance.now ? performance.now() : Date.now()) * .001);
  const pulse = .5 + .5 * Math.sin(t * 2.8 + tower.phase * 1.7 + tower.level * .2);
  const coreR = Math.max(15, size * .34);
  const auraR = Math.max(26, size * .56);
  const ringR = auraR * (0.92 + pulse * .04);

  ctx.save();

  // cursed halo around the planet so hazard-mounted towers never look healthy.
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = .18 + pulse * .12;
  let halo = ctx.createRadialGradient(x - 3, y - 4, 2, x, y, auraR * 1.45);
  halo.addColorStop(0, 'rgba(255,255,255,.20)');
  halo.addColorStop(.18, palette.glow);
  halo.addColorStop(.56, 'rgba(127,29,29,.18)');
  halo.addColorStop(1, 'rgba(127,29,29,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, auraR * 1.24, 0, TAU);
  ctx.fill();

  // red poisoned tint on the planet body itself.
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = .36;
  ctx.fillStyle = palette.tint;
  ctx.beginPath();
  ctx.arc(x, y, coreR * 1.24, 0, TAU);
  ctx.fill();

  // soft cursed sheen so the body feels infected, not just darkened.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .14 + pulse * .08;
  let stain = ctx.createRadialGradient(x - coreR * .26, y - coreR * .34, 1, x, y, coreR * 1.48);
  stain.addColorStop(0, 'rgba(254,202,202,.42)');
  stain.addColorStop(.35, palette.glow);
  stain.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = stain;
  ctx.beginPath();
  ctx.arc(x, y, coreR * 1.34, 0, TAU);
  ctx.fill();

  // ominous red ring + broken arc to signal debuff clearly.
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = .42 + pulse * .14;
  ctx.strokeStyle = palette.ring;
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = 11;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = .62;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.arc(x, y, ringR * 1.10, .42 + tower.phase * .18, 2.55 + tower.phase * .18);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // poison-like motes floating around the orbit.
  ctx.globalCompositeOperation = 'lighter';
  for(let i=0;i<5;i++){
    const a = t * (1.2 + i * .06) + tower.phase * .9 + i * TAU / 5;
    const rr = ringR * (.88 + (i % 2) * .08);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * (ringR * .44) - 1.4;
    const pr = 2.1 + (i % 3) * .45;
    const mote = ctx.createRadialGradient(px - .4, py - .4, .4, px, py, pr * 2.8);
    mote.addColorStop(0, palette.mote);
    mote.addColorStop(.38, palette.glow);
    mote.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.globalAlpha = .22 + ((i % 2) ? .10 : .04) + pulse * .08;
    ctx.fillStyle = mote;
    ctx.beginPath();
    ctx.arc(px, py, pr * 1.9, 0, TAU);
    ctx.fill();
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
    const nowMs = visualNowMs || (performance.now ? performance.now() : Date.now());
    ctx.beginPath();ctx.arc(x,y,13+Math.sin(nowMs/220)*3,0,TAU);ctx.stroke();
  }
  ctx.restore();
}

function relocateInvalidPlanets(){
  let moved = false;
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
    moved = true;
    if(selected === i) selected = next;
    burst(center(next).x, center(next).y, tower.def.color, 14, 22);
  }
  if(moved) invalidateTerrainRenderCache();
}

function updateAnomalies(dt){
  let write = 0;
  for(let i=0;i<anomalies.length;i++){
    const a = anomalies[i];
    a.life -= dt;
    a.tick -= dt;
    if(a.target && !a.target.dead){
      a.x += (a.target.x - a.x) * .06 * dt;
      a.y += (a.target.y - a.y) * .06 * dt;
    }
    if(a.tick <= 0){
      a.tick = 3.5;
      const rr = a.radius * a.radius;
      for(let j=0;j<enemies.length;j++){
        const e = enemies[j];
        if(e.dead) continue;
        const ds = distSq(e.x,e.y,a.x,a.y);
        if(ds < rr){
          const d = Math.sqrt(ds);
          const pull = (1 - d / a.radius) * a.pull;
          e.x += (a.x - e.x) * .05 * pull;
          e.y += (a.y - e.y) * .05 * pull;
          confineEnemyToRoute(e, e.stageBoss ? 22 : 16);
          e.slow = Math.max(e.slow, 45);
          e.mark = Math.max(e.mark, 70);
          e.damage(a.damage, 'void', a.color, a.rewardBonus || 0);
        }
      }
    }
    if(a.life > 0) anomalies[write++] = a;
  }
  anomalies.length = write;
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

const TERRAIN_BONUS_DEFAULT = {dmg:.86,cd:1.06,range:0,rangeMul:1,gold:0,over:false,overChance:0,plate:false,specialChanceMul:1};
const TERRAIN_BONUS_BY_KEY = {
  amp:{dmg:1.38,cd:.96,range:0,rangeMul:1,gold:0,over:false,overChance:0,plate:true,specialChanceMul:1},
  coil:{dmg:1.00,cd:.70,range:0,rangeMul:1,gold:0,over:false,overChance:0,plate:true,specialChanceMul:1},
  lens:{dmg:.94,cd:.98,range:38,rangeMul:1,gold:0,over:false,overChance:0,plate:true,specialChanceMul:1},
  mine:{dmg:.92,cd:1.02,range:0,rangeMul:1,gold:.16,over:false,overChance:0,plate:true,specialChanceMul:1},
  rift:{dmg:1.62,cd:1.06,range:8,rangeMul:1,gold:0,over:true,overChance:.06,plate:true,specialChanceMul:1},
  hazard_overheat:{dmg:1.00,cd:1.18,range:0,rangeMul:1,gold:0,over:false,overChance:0,plate:false,hazard:true,specialChanceMul:1},
  hazard_weaken:{dmg:.82,cd:1.00,range:0,rangeMul:1,gold:0,over:false,overChance:0,plate:false,hazard:true,specialChanceMul:1},
  hazard_disrupt:{dmg:.96,cd:1.02,range:0,rangeMul:.86,gold:0,over:false,overChance:0,plate:false,hazard:true,specialChanceMul:1},
  hazard_unstable:{dmg:.98,cd:1.02,range:0,rangeMul:1,gold:0,over:false,overChance:0,plate:false,hazard:true,specialChanceMul:.75}
};

const PLANET_CORE_GLOW_RENDER_CACHE = new Map();
const PLANET_CORE_GLOW_RENDER_CACHE_MAX = 128;
const PLANET_CORE_GLOW_RENDER_CACHE_MAX_PIXELS = 1250000;
function getCachedPlanetCoreGlow(color, baseSize, tier, level){
  const qSize = Math.round(baseSize * 2) / 2;
  const key = `${color}|${qSize}|${tier}|${level}`;
  const cached = PLANET_CORE_GLOW_RENDER_CACHE.get(key);
  if(cached){
    PLANET_CORE_GLOW_RENDER_CACHE.delete(key);
    PLANET_CORE_GLOW_RENDER_CACHE.set(key, cached);
    return cached;
  }
  try{
    const coreR = Math.max(13, qSize * .30);
    const haloDrawR = tier >= 1 ? (26 + tier * 6) : 0;
    const haloGradientR = tier >= 1 ? (34 + tier * 8 + level * .6) : 0;
    const shadowY = 16 + tier * .45;
    const shadowRx = 14 + level * .24;
    const shadowRy = 4.8 + tier * .18;
    const radiusX = Math.max(coreR, haloGradientR, shadowRx) + 8;
    const radiusTop = Math.max(coreR, haloGradientR) + 8;
    const radiusBottom = Math.max(coreR, haloGradientR, shadowY + shadowRy) + 8;
    const canvasW = Math.ceil(radiusX * 2);
    const canvasH = Math.ceil(radiusTop + radiusBottom);
    const canvasEl = makeRenderCanvas(canvasW, canvasH);
    const glowCtx = canvasEl.getContext('2d');
    if(!glowCtx) return null;
    const cx = canvasW / 2;
    const cy = radiusTop;
    glowCtx.save();
    const coreGlow = glowCtx.createRadialGradient(cx - 4, cy - 6, 2, cx, cy, Math.max(18, qSize * .56));
    coreGlow.addColorStop(0, 'rgba(255,255,255,.96)');
    coreGlow.addColorStop(.22, 'rgba(255,255,255,.88)');
    coreGlow.addColorStop(.55, color);
    coreGlow.addColorStop(1, 'rgba(2,6,23,.92)');
    glowCtx.fillStyle = coreGlow;
    glowCtx.beginPath(); glowCtx.arc(cx, cy, coreR, 0, TAU); glowCtx.fill();
    glowCtx.globalAlpha = .34;
    glowCtx.fillStyle = 'rgba(2,6,23,.52)';
    glowCtx.beginPath(); glowCtx.ellipse(cx, cy + shadowY, shadowRx, shadowRy, 0, 0, TAU); glowCtx.fill();
    if(tier >= 1){
      glowCtx.globalAlpha = .28 + tier * .06;
      const halo = glowCtx.createRadialGradient(cx, cy, 10, cx, cy, haloGradientR);
      halo.addColorStop(0, 'rgba(255,255,255,.16)');
      halo.addColorStop(.45, color);
      halo.addColorStop(1, 'rgba(2,6,23,0)');
      glowCtx.fillStyle = halo;
      glowCtx.beginPath();
      glowCtx.arc(cx, cy, haloDrawR, 0, TAU);
      glowCtx.fill();
    }
    glowCtx.restore();
    const entry = {canvas: canvasEl, w: canvasW, h: canvasH, cx, cy};
    PLANET_CORE_GLOW_RENDER_CACHE.set(key, entry);
    trimRenderCache(PLANET_CORE_GLOW_RENDER_CACHE, PLANET_CORE_GLOW_RENDER_CACHE_MAX, PLANET_CORE_GLOW_RENDER_CACHE_MAX_PIXELS);
    return entry;
  }catch(_err){
    return null;
  }
}
function drawCachedPlanetCoreGlow(x, y, color, baseSize, tier, level){
  const core = getCachedPlanetCoreGlow(color, baseSize, tier, level);
  if(core){
    ctx.drawImage(core.canvas, x - core.cx, y - core.cy, core.w, core.h);
    return true;
  }
  return false;
}

function trimAllRenderCachesForPressure(force=false){
  if(!force && (perfFrameId % 240) !== 0) return;
  const pressureScale = perfActiveTowerCount >= 44 ? .72 : (perfActiveTowerCount >= 32 ? .86 : 1);
  const scaleEntries = (n) => Math.max(16, Math.floor(n * pressureScale));
  const scalePixels = (n) => Math.max(120000, Math.floor(n * pressureScale));
  trimRenderCache(PROJECTILE_SPRITE_RENDER_CACHE, PROJECTILE_SPRITE_RENDER_CACHE_MAX, PROJECTILE_SPRITE_RENDER_CACHE_MAX_PIXELS);
  if(typeof ENEMY_BODY_RENDER_CACHE !== 'undefined') trimRenderCache(ENEMY_BODY_RENDER_CACHE, scaleEntries(ENEMY_BODY_RENDER_CACHE_MAX), scalePixels(ENEMY_BODY_RENDER_CACHE_MAX_PIXELS));
  trimRenderCache(PLANET_SPRITE_RENDER_CACHE, scaleEntries(PLANET_SPRITE_RENDER_CACHE_MAX), scalePixels(PLANET_SPRITE_RENDER_CACHE_MAX_PIXELS));
  trimRenderCache(ORBIT_ASTEROID_RENDER_CACHE, scaleEntries(ORBIT_ASTEROID_RENDER_CACHE_MAX), scalePixels(ORBIT_ASTEROID_RENDER_CACHE_MAX_PIXELS));
  trimRenderCache(PEDESTAL_BASE_RENDER_CACHE, scaleEntries(PEDESTAL_BASE_RENDER_CACHE_MAX), scalePixels(PEDESTAL_BASE_RENDER_CACHE_MAX_PIXELS));
  trimRenderCache(PLANET_CORE_GLOW_RENDER_CACHE, scaleEntries(PLANET_CORE_GLOW_RENDER_CACHE_MAX), scalePixels(PLANET_CORE_GLOW_RENDER_CACHE_MAX_PIXELS));
}

class Planet{
  constructor(type,level,idx){
    this.type=type;this.level=level;this.idx=idx;this.cool=rand(0,20);this.phase=Math.random()*TAU;this.frozen=0;this.uid=nextPlanetUid++;this.aug=defaultAug();this.skillLevels={};syncTowerSkillUnlocks(this);
  }
  get def(){return PLANETS[this.type]}
  get pos(){
    return center(this.idx);
  }
  terrainBonus(){
    return TERRAIN_BONUS_BY_KEY[effectiveTerrainKey(this.idx)] || TERRAIN_BONUS_DEFAULT;
  }
  stats(){
    const terrainKey = terrain ? effectiveTerrainKey(this.idx) : 'empty';
    const a=ensureAug(this);
    const augRevision = this._augRevision || 0;
    const cooldownPenalty = S.globalCooldownPenalty || 0;
    const tacticalBoost = S.tacticalBoost || 0;
    const dustSig = DUST_CLOUDS_ACTIVE ? perfFrameId : 0;
    if(this._statsCache
      && this._statsType === this.type
      && this._statsLevel === this.level
      && this._statsTerrainKey === terrainKey
      && this._statsGlobalRevision === globalUpgradeStatsRevision
      && this._statsCooldownPenalty === cooldownPenalty
      && this._statsTacticalBoost === tacticalBoost
      && this._statsAugRevision === augRevision
      && this._statsDustSig === dustSig){
      return this._statsCache;
    }
    const b=TERRAIN_BONUS_BY_KEY[terrainKey] || TERRAIN_BONUS_DEFAULT;
    const g=getGlobalUpgradeStats();
    const d=this.def;
    const pos = DUST_CLOUDS_ACTIVE ? this.pos : null;
    const ambient = DUST_CLOUDS_ACTIVE ? getDustCloudPenalty(pos.x, pos.y) : DUST_NO_PENALTY;
    const affinityMatched = isPlateAffinityMatched(this);
    const plateDamage = b.plate ? g.plateDamage + (affinityMatched ? PLATE_AFFINITY_DAMAGE_BONUS : 0) : 0;
    const plateFireRate = b.plate ? g.plateFireRate + (affinityMatched ? PLATE_AFFINITY_FIRE_RATE_BONUS : 0) : 0;
    const globalCritExpected = g.critChance * Math.max(0, (1.8 + g.critMul) - 1);
    const rangeMul = Number(b.rangeMul || 1) || 1;
    const specialChanceMul = Number(b.specialChanceMul || 1) || 1;
    const baseRange = Math.max(70,d.range+this.level*8+b.range+a.range+g.range);
    const stats = {
      dmg:(d.dmg+this.level*15)*b.dmg*(1+a.damage+g.damage+plateDamage+globalCritExpected) * ambient.damageMul,
      range:Math.max(70,baseRange * rangeMul),
      cd:Math.max(8,(d.cd-this.level*1.7)*b.cd*(1+S.globalCooldownPenalty) * ambient.cooldownMul/(1+a.fireRate+g.fireRate+plateFireRate+S.tacticalBoost)),
      gold:b.gold, over:b.over, overChance:(b.overChance || 0) * specialChanceMul, plateMatched: affinityMatched, specialChanceMul,
      critChance:((d.critChance||0)+a.critChance+g.critChance) * specialChanceMul,
      critMul:(d.critMul||1.8)+a.critMul+g.critMul,
      area:a.area, dot:a.dot, freeze:a.freeze, freezeChance:a.freezeChance * specialChanceMul,
      chain:a.chain, gravity:a.gravity, beamWidth:a.beamWidth, markAmp:a.markAmp,
      poisonSlow:a.poisonSlow, burstChance:a.burstChance * specialChanceMul,
      crystalCharge:a.crystalCharge, prismLink:a.prismLink, resonancePlate:a.resonancePlate,
      shieldDismantle:a.shieldDismantle, satelliteForge:a.satelliteForge, emergencyBarrier:a.emergencyBarrier,
      dustPenalty: ambient.alpha
    };
    this._statsCache = stats;
    this._statsType = this.type;
    this._statsLevel = this.level;
    this._statsTerrainKey = terrainKey;
    this._statsGlobalRevision = globalUpgradeStatsRevision;
    this._statsCooldownPenalty = cooldownPenalty;
    this._statsTacticalBoost = tacticalBoost;
    this._statsAugRevision = augRevision;
    this._statsDustSig = dustSig;
    return stats;
  }
  target(stOverride=null){
    const p=this.pos, st=stOverride || this.stats();
    let best = null;
    let bestProgress = -Infinity;
    const rangeSq = st.range * st.range;
    for(let i=0;i<enemies.length;i++){
      const e = enemies[i];
      if(e.dead) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      if(dx*dx + dy*dy > rangeSq) continue;
      if(e.progress > bestProgress){ best = e; bestProgress = e.progress; }
    }
    return best;
  }
  update(dt){
    if(this.frozen>0){this.frozen-=dt;return;}
    this.cool-=dt;
    if(this.cool>0)return;
    const st=this.stats();
    const target=this.target(st);
    if(!target)return;
    this.cool=st.cd;
    if(st.over && Math.random() < (st.overChance || .06)){this.cool+=24;floatText(this.pos.x,this.pos.y-30,'과열','#fb7185')}
    if(this.def.kind==='beam') fireBeam(this,target,st);
    else if(this.def.kind==='gravity') blackholePulse(this,target,st);
    else addBullet(this,target,st);
  }

  draw(){
    const p=this.pos,d=this.def;
    const frameIndex = currentPlanetFrameIndex();
    const tier = planetEvolutionTier(this.level);
    const nowMs = visualNowMs || (performance.now ? performance.now() : Date.now());
    const isDragTarget = !!(dragging && dragHoverTargetIdx === this.idx);
    const targetAge = isDragTarget ? Math.max(0, nowMs - (dragHoverTargetStartedAt || nowMs)) : 0;
    const targetEase = isDragTarget ? (1 - Math.pow(1 - clamp(targetAge / 150, 0, 1), 3)) : 0;
    const settleAge = Number.isFinite(this.dragSettleAt) ? Math.max(0, nowMs - this.dragSettleAt) : 9999;
    let settleScale = 1;
    if(settleAge < 280){
      const t = clamp(settleAge / 280, 0, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      settleScale = .86 + .14 * ease + Math.sin(Math.min(1, t) * Math.PI) * .035;
    }
    const dragTargetScale = isDragTarget ? (1 - .13 * targetEase) : 1;
    const baseSize = ((IS_MOBILE_BOARD ? PLANET_BASE_SIZE + 2 : PLANET_BASE_SIZE) + this.level * 2.05 + tier * 1.45) * settleScale * dragTargetScale;
    const bobY = Math.sin(nowMs/420 + this.phase * 1.7 + this.level * .42) * (1.6 + Math.min(3.2, this.level * .12));
    const bobX = Math.cos(nowMs/620 + this.phase * .9) * .9;
    const rx = p.x + bobX, ry = p.y + bobY;
    const selectedTower = selected===this.idx;
    const st = selectedTower ? this.stats() : null;
    const hazardKey = getTerrainHazardKey(this.idx);
    ctx.save();
    if(isDragTarget){
      ctx.globalAlpha = .62 + .18 * (1 - targetEase);
      ctx.filter = 'saturate(.66) brightness(.78) contrast(.90)';
    }else{
      ctx.globalAlpha = 1;
    }
    drawTowerPedestalFx(this, rx, ry, baseSize);
    if(!drawCachedPlanetCoreGlow(rx, ry, d.color, baseSize, tier, this.level)){
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
      }
    }
    ctx.globalAlpha = tier >= 1 ? 1 : .34;
    drawPlanetOrbitAsteroids(this.type, rx, ry, this.level, this.phase);
    const ok = drawPlanetSprite(this.type, rx, ry, baseSize, frameIndex, this.level);
    if(!ok) drawProceduralPlanetBody(this, rx, ry);
    drawPlanetEvolutionFx(this, rx, ry);
    if(hazardKey) drawTowerHazardCorruptionFx(this, rx, ry, baseSize, hazardKey);
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
    if(DUST_CLOUDS_ACTIVE && st && st.dustPenalty > 0.02){
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
    if(selectedTower){
      const rangeStats = st || this.stats();
      ctx.globalAlpha=.13;ctx.strokeStyle=d.color;ctx.lineWidth=1.8;
      ctx.beginPath();ctx.arc(rx,ry,rangeStats.range,0,TAU);ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

}

const ENEMY_BODY_RENDER_CACHE = new Map();
const ENEMY_BODY_RENDER_CACHE_MAX = 64;
const ENEMY_BODY_RENDER_CACHE_MAX_PIXELS = 360000;
function getCachedEnemyBodySprite(color, size, boss){
  const qSize = Math.max(4, Math.round(size * 2) / 2);
  const key = `${boss ? 'boss' : 'normal'}|${color}|${qSize}`;
  const cached = ENEMY_BODY_RENDER_CACHE.get(key);
  if(cached){
    ENEMY_BODY_RENDER_CACHE.delete(key);
    ENEMY_BODY_RENDER_CACHE.set(key, cached);
    return cached;
  }
  try{
    const blur = boss ? 24 : 13;
    const pad = Math.ceil(blur * 2 + qSize * .35 + 8);
    const canvasSize = Math.ceil(qSize * 2.4 + pad * 2);
    const canvasEl = makeRenderCanvas(canvasSize, canvasSize);
    const bodyCtx = canvasEl.getContext('2d');
    if(!bodyCtx) return null;
    const cx = canvasSize / 2, cy = canvasSize / 2;
    bodyCtx.save();
    bodyCtx.shadowColor = color;
    bodyCtx.shadowBlur = blur;
    bodyCtx.fillStyle = color;
    bodyCtx.beginPath();
    if(boss){
      for(let i=0;i<9;i++){
        const a = i * TAU / 9;
        const r = qSize * (i % 2 ? .72 : 1.08);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if(i === 0) bodyCtx.moveTo(x, y); else bodyCtx.lineTo(x, y);
      }
      bodyCtx.closePath();
    }else{
      bodyCtx.arc(cx, cy, qSize, 0, TAU);
    }
    bodyCtx.fill();
    bodyCtx.restore();
    const entry = {canvas: canvasEl, w: canvasSize, h: canvasSize, cx, cy, boss};
    ENEMY_BODY_RENDER_CACHE.set(key, entry);
    trimRenderCache(ENEMY_BODY_RENDER_CACHE, ENEMY_BODY_RENDER_CACHE_MAX, ENEMY_BODY_RENDER_CACHE_MAX_PIXELS);
    return entry;
  }catch(_err){
    return null;
  }
}
function drawCachedEnemyBody(enemy, color){
  const body = getCachedEnemyBodySprite(color, enemy.size, !!enemy.boss);
  if(!body) return false;
  if(body.boss){
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(visualNowSec);
    ctx.drawImage(body.canvas, -body.cx, -body.cy, body.w, body.h);
    ctx.restore();
  }else{
    ctx.drawImage(body.canvas, enemy.x - body.cx, enemy.y - body.cy, body.w, body.h);
  }
  return true;
}

const ENEMY_BASE_MAP = {
  // Legacy ids remain for save/test compatibility. New stage waves use the SF monster ids below.
  grunt:{hp:1.62,spd:1.08,size:13,color:'#e2e8f0',reward:.50,exp:3,armor:0,regen:false,treasure:false,boss:false, displayName:'공허 파수병'},
  runner:{hp:1.05,spd:1.82,size:11,color:'#7dd3fc',reward:.50,exp:3,armor:0,regen:false,treasure:false,boss:false, displayName:'유성 돌격체'},
  brute:{hp:4.10,spd:.84,size:18,color:'#fbbf24',reward:.90,exp:5,armor:.23,regen:false,treasure:false,boss:false, displayName:'철갑 수호체'},
  regen:{hp:2.65,spd:.98,size:15,color:'#22c55e',reward:.80,exp:5,armor:0,regen:true,treasure:false,boss:false, displayName:'성흔 운반체'},
  treasure:{hp:3.75,spd:1.00,size:18,color:'#facc15',reward:2.2,exp:8,armor:0,regen:false,treasure:true,boss:false, displayName:'성흔 운반체'},

  void_sentry:{hp:1.62,spd:1.08,size:13,color:'#dbeafe',reward:.50,exp:3,armor:0,regen:false,treasure:false,boss:false, displayName:'공허 파수병', role:'기본형', skillName:'없음', intro:'가장 기본적인 침입자입니다. 체력과 속도가 모두 평범해서 초반 방어 흐름을 익히기 좋습니다.'},
  meteor_charger:{hp:1.22,spd:1.54,size:11,color:'#67e8f9',reward:.47,exp:3,armor:0,regen:false,treasure:false,boss:false, displayName:'유성 돌격체', role:'속도형', skillName:'고속 돌파', intro:'체력은 낮지만 빠르게 코어로 돌진합니다. 경로 앞쪽에 타워를 배치해 일찍 공격하는 것이 좋습니다.'},
  iron_guardian:{hp:2.35,spd:.84,size:17,color:'#fbbf24',reward:.58,exp:5,armor:.20,regen:false,treasure:false,boss:false, displayName:'철갑 수호체', role:'방어형', skillName:'철갑 장갑', intro:'두꺼운 장갑으로 피해를 줄여 받습니다. 느리지만 오래 버티기 때문에 집중 화력이 필요합니다.'},
  stigma_carrier:{hp:1.94,spd:.97,size:16,color:'#facc15',reward:.82,exp:7,armor:0,regen:false,treasure:true,boss:false, displayName:'성흔 운반체', role:'보상형', skillName:'성흔 보급', intro:'처치하면 일반 적보다 보상이 큽니다. 보이면 놓치지 말고 우선적으로 잡는 것이 좋습니다.'},
  crystal_barrier:{hp:1.78,spd:.92,size:16,color:'#a78bfa',reward:.62,exp:6,armor:.04,regen:false,treasure:false,boss:false, shieldRatio:.35, displayName:'수정 방벽체', role:'보호막형', skillName:'수정 보호막', intro:'수정 보호막을 두르고 접근합니다. 보호막을 먼저 부숴야 본체 체력을 빠르게 깎을 수 있습니다.'},
  rift_splitter:{hp:2.10,spd:.89,size:16,color:'#fb7185',reward:.64,exp:6,armor:0,regen:false,treasure:false,boss:false, splitId:'rift_shard', splitCount:2, displayName:'균열 분열체', role:'분열형', skillName:'균열 분열', intro:'처치되면 작은 분열체로 나뉩니다. 경로 후반에도 마무리 화력이 있어야 안전합니다.'},
  rift_shard:{hp:.56,spd:1.30,size:9,color:'#fda4af',reward:.18,exp:1,armor:0,regen:false,treasure:false,boss:false, splitChild:true, displayName:'균열 파편', role:'분열체', skillName:'분열 잔해', intro:''},
  core_overdrive:{hp:2.43,spd:.81,size:17,color:'#f97316',reward:.68,exp:6,armor:.03,regen:false,treasure:false,boss:false, coreDamage:2, displayName:'코어 폭주체', role:'위험형', skillName:'코어 과부하', intro:'코어에 도달하면 일반 몬스터보다 큰 피해를 줍니다. 느리지만 반드시 도착 전에 처치해야 합니다.'},
  phase_ghost:{hp:1.54,spd:1.24,size:13,color:'#c4b5fd',reward:.63,exp:5,armor:0,regen:false,treasure:false,boss:false, dodgeChance:.12, displayName:'차원 유령체', role:'회피형', skillName:'차원 회피', intro:'차원 사이를 흔들리며 일부 공격을 회피합니다. 여러 타워로 공격 횟수를 늘리면 안정적으로 막을 수 있습니다.'},
  abyss_knight:{hp:3.55,spd:.74,size:19,color:'#94a3b8',reward:1.05,exp:9,armor:.15,regen:false,treasure:false,boss:false, displayName:'심연 기사', role:'정예형', skillName:'심연 장갑', intro:'체력과 방어력이 모두 높은 정예 몬스터입니다. 보스 전 화력 검증용 위협으로 등장합니다.'},
  void_colossus:{hp:4.65,spd:.60,size:22,color:'#e0f2fe',reward:1.28,exp:12,armor:.05,regen:false,treasure:false,boss:false, displayName:'공허 거신', role:'대형형', skillName:'거신 육체', intro:'매우 느리지만 체력이 압도적으로 높습니다. 경로 전체에서 오래 공격할 수 있게 배치해야 합니다.'},

  // Andromeda 1차 구현 몬스터 ID. 이미지/실루엣 리소스는 기존 원형 렌더러를 임시 재사용합니다.
  m01_runner:{hp:1.00,spd:1.08,size:13,color:'#bae6fd',reward:.50,exp:3,armor:0,regen:false,treasure:false,boss:false,boostInterval:4,boostDuration:.45,boostMul:1.25, displayName:'M01 성운 주자', role:'기본형', skillName:'짧은 추진', intro:'안드로메다 기본 전진 몬스터입니다. 짧은 추진으로 초반 전선을 확인합니다.'},
  m02_armor:{hp:2.70,spd:.72,size:18,color:'#fbbf24',reward:.72,exp:6,armor:.16,regen:false,treasure:false,boss:false, shieldRatio:.35, displayName:'M02 공명 장갑체', role:'탱커/보호막', skillName:'공명 보호막', intro:'공명 보호막으로 피해를 줄여 받습니다. 공명 계열 타워로 빠르게 처리해야 합니다.'},
  m04_charger:{hp:.82,spd:1.65,size:11,color:'#67e8f9',reward:.48,exp:3,armor:0,regen:false,treasure:false,boss:false,boostInterval:5,boostDuration:.55,boostMul:1.60, displayName:'M04 균열 질주체', role:'속도형', skillName:'직선 가속', intro:'체력은 낮지만 빠르게 파고듭니다. 경로 앞쪽 화력이 중요합니다.'},
  m05_gravity:{hp:1.75,spd:.78,size:16,color:'#8b5cf6',reward:.72,exp:6,armor:.04,regen:false,treasure:false,boss:false, coreDamage:2,auraRadius:90,auraSpeedMul:1.12,auraSpeedCap:1.20, displayName:'M05 중력 포식체', role:'지원/위험형', skillName:'중력 파동', intro:'주변 적의 전진 압박을 높이는 지원형 몬스터입니다.'},
  m06_jumper:{hp:1.10,spd:1.15,size:12,color:'#f0abfc',reward:.55,exp:5,armor:0,regen:false,treasure:false,boss:false, dodgeChance:.10, displayName:'M06 차원 도약체', role:'포탈형', skillName:'차원 점프', intro:'포탈 잔상처럼 흔들리며 일부 공격을 회피합니다. 출구 쪽 배치를 보강하세요.'},
  m07_matrix:{hp:.70,spd:1.10,size:10,color:'#e9d5ff',reward:.42,exp:3,armor:0,regen:false,treasure:true,boss:false,packRadius:76,packMin:3,packSpeedMul:1.10, displayName:'M07 프리즘 행렬체', role:'물량형', skillName:'행렬 유지', intro:'작지만 많이 등장하는 행렬형 몬스터입니다. 관통/범위 화력이 효과적입니다.'},
  m03_phase:{hp:1.35,spd:1.00,size:14,color:'#c4b5fd',reward:.58,exp:5,armor:0,regen:false,treasure:false,boss:false,dodgeChance:.06,phaseInterval:6,phaseDuration:1.2,phaseReduction:.25, displayName:'M03 위상 편이체', role:'교란형', skillName:'위상 전환', intro:'짧은 시간 피해를 줄여 받는 교란형 몬스터입니다. 단일 강타보다 지속 화력과 표식이 안정적입니다.'},
  m08_echo:{hp:1.30,spd:.95,size:13,color:'#e0f2fe',reward:.66,exp:6,armor:.02,regen:false,treasure:false,boss:false,echoThreshold:.45,echoMin:1,echoMax:2,echoId:'m08_echo_illusion', displayName:'M08 잔향 복제체', role:'허상 생성', skillName:'잔향 분열', intro:'체력이 낮아지면 약한 허상을 만들어 타겟을 흔듭니다. 광역/관통 화력이 있으면 대응하기 쉽습니다.'},
  m08_echo_illusion:{hp:.36,spd:1.18,size:10,color:'#bae6fd',reward:.08,exp:1,armor:0,regen:false,treasure:false,boss:false,echoIllusion:true,coreDamage:0, displayName:'M08 잔향 허상', role:'허상', skillName:'잔향 허상', intro:'복제체가 만든 약한 허상입니다. 코어 피해는 없지만 타겟을 잠시 분산시킵니다.'},
  m09_tractor:{hp:1.60,spd:.85,size:14,color:'#f0abfc',reward:.74,exp:6,armor:.04,regen:false,treasure:false,boss:false,tractorRadius:132,tractorCount:2,tractorInterval:5.4,tractorPull:24, displayName:'M09 역장 견인체', role:'전진 보조', skillName:'역장 추진', intro:'뒤쪽 적을 짧게 당겨 전선을 압축합니다. 견인체를 늦게 잡으면 물량이 한 번에 밀려옵니다.'},
  m10_devourer:{hp:3.00,spd:.65,size:19,color:'#a21caf',reward:1.05,exp:9,armor:.12,regen:false,treasure:false,boss:false,stigmaAbsorb:.85, displayName:'M10 성흔 포식체', role:'후반 탱커', skillName:'에너지 흡수', intro:'후반 버프 칸과 핵심 배치를 흔드는 고체력 몬스터입니다.'},


  boss:{hp:16,spd:.58,size:30,color:'#fb7185',reward:3.5,exp:18,armor:.18,regen:false,treasure:false,boss:true, displayName:'균열 감시자'},
  midboss:{hp:21,spd:.62,size:34,color:'#f8fafc',reward:5.0,exp:26,armor:.22,regen:false,treasure:false,boss:true, displayName:'수정 심장체'},
  finalboss:{hp:28,spd:.64,size:41,color:'#f8fafc',reward:8.0,exp:38,armor:.26,regen:false,treasure:false,boss:true, displayName:'코어 포식자'}
};

const STAGE_MONSTER_POOLS = {"1":{"theme":"침묵의 진입로","intro":"M01 기본 전진과 M04 소량 돌파를 학습하는 입문 전장","early":[["m01_runner",86],["m04_charger",14]],"mid":[["m01_runner",70],["m04_charger",20],["m07_matrix",10]],"late":[["m01_runner",58],["m02_armor",24],["m04_charger",18]]},"2":{"theme":"잔향 성운","intro":"잔향과 기초 물량이 늘어나는 초반 전장","early":[["m01_runner",68],["m04_charger",22],["m07_matrix",10]],"mid":[["m01_runner",48],["m02_armor",26],["m04_charger",18],["m07_matrix",8]],"late":[["m02_armor",30],["m01_runner",30],["m04_charger",18],["m07_matrix",12],["m03_phase",10]]},"3":{"theme":"공명 파편","intro":"공명 보호막 대응을 시작하는 전장","early":[["m02_armor",34],["m01_runner",44],["m04_charger",22]],"mid":[["m02_armor",46],["m07_matrix",18],["m01_runner",22],["m04_charger",14]],"late":[["m02_armor",46],["m07_matrix",20],["m10_devourer",8],["m04_charger",20],["m03_phase",6]]},"4":{"theme":"표식의 전장","intro":"분산 표식과 행렬 물량으로 화력 분배를 시험","early":[["m01_runner",34],["m02_armor",30],["m07_matrix",24],["m04_charger",12]],"mid":[["m02_armor",34],["m07_matrix",30],["m05_gravity",10],["m04_charger",18],["m03_phase",8]],"late":[["m02_armor",30],["m07_matrix",31],["m05_gravity",15],["m10_devourer",8],["m04_charger",8],["m03_phase",8]]},"5":{"theme":"외곽 수호체","intro":"B01 전 준비용 보호막/장갑 복합 전장","early":[["m02_armor",42],["m07_matrix",26],["m01_runner",20],["m04_charger",12]],"mid":[["m02_armor",44],["m05_gravity",18],["m07_matrix",24],["m10_devourer",14]],"late":[["m02_armor",38],["m05_gravity",20],["m10_devourer",18],["m07_matrix",24]]},"6":{"theme":"뒤틀린 항로","intro":"포탈 대응과 고속 적 압박 전장","early":[["m04_charger",42],["m06_jumper",20],["m01_runner",26],["m07_matrix",12]],"mid":[["m04_charger",38],["m06_jumper",26],["m05_gravity",14],["m07_matrix",22]],"late":[["m04_charger",34],["m06_jumper",28],["m05_gravity",20],["m10_devourer",8],["m07_matrix",10]]},"7":{"theme":"중력 렌즈","intro":"중력 렌즈와 속도 제어를 학습하는 전장","early":[["m05_gravity",28],["m04_charger",34],["m06_jumper",20],["m01_runner",18]],"mid":[["m05_gravity",34],["m04_charger",28],["m06_jumper",24],["m07_matrix",14]],"late":[["m05_gravity",38],["m06_jumper",26],["m10_devourer",12],["m04_charger",24]]},"8":{"theme":"느려진 별빛","intro":"둔화와 병합 효율을 시험하는 제어 전장","early":[["m05_gravity",30],["m02_armor",24],["m06_jumper",22],["m07_matrix",24]],"mid":[["m05_gravity",36],["m02_armor",22],["m07_matrix",26],["m10_devourer",16]],"late":[["m05_gravity",34],["m10_devourer",22],["m07_matrix",28],["m06_jumper",16]]},"9":{"theme":"균열의 행렬","intro":"행렬 물량과 포탈 출구 방어가 핵심인 전장","early":[["m07_matrix",38],["m06_jumper",24],["m04_charger",22],["m02_armor",16]],"mid":[["m07_matrix",42],["m06_jumper",26],["m05_gravity",14],["m10_devourer",18]],"late":[["m07_matrix",38],["m10_devourer",24],["m06_jumper",24],["m05_gravity",14]]},"10":{"theme":"중력 균열체","intro":"B02 전용 중력/포탈/장갑 복합 전장","early":[["m05_gravity",32],["m06_jumper",26],["m10_devourer",18],["m07_matrix",24]],"mid":[["m05_gravity",36],["m10_devourer",24],["m06_jumper",22],["m02_armor",18]],"late":[["m10_devourer",28],["m05_gravity",27],["m07_matrix",20],["m06_jumper",12],["m09_tractor",13]]},"11":{"theme":"폐허 코어","intro":"직선 경로 대응과 코어 압박을 시작하는 전장","early":[["m07_matrix",34],["m10_devourer",20],["m02_armor",24],["m01_runner",22]],"mid":[["m07_matrix",38],["m10_devourer",24],["m05_gravity",18],["m02_armor",20]],"late":[["m10_devourer",30],["m07_matrix",32],["m05_gravity",22],["m06_jumper",16]]},"12":{"theme":"프리즘 방어망","intro":"프리즘 관통과 행렬 물량 처리 전장","early":[["m07_matrix",42],["m02_armor",20],["m10_devourer",18],["m06_jumper",20]],"mid":[["m07_matrix",42],["m10_devourer",24],["m05_gravity",18],["m06_jumper",16]],"late":[["m07_matrix",36],["m10_devourer",30],["m05_gravity",20],["m02_armor",14]]},"13":{"theme":"오염된 방어 프로토콜","intro":"모든 안드로메다 기본 기믹 종합 테스트","early":[["m02_armor",20],["m05_gravity",21],["m07_matrix",28],["m10_devourer",17],["m03_phase",8],["m08_echo",6]],"mid":[["m07_matrix",30],["m10_devourer",24],["m06_jumper",18],["m05_gravity",16],["m08_echo",7],["m09_tractor",5]],"late":[["m10_devourer",30],["m07_matrix",24],["m05_gravity",21],["m06_jumper",12],["m08_echo",7],["m09_tractor",6]]},"14":{"theme":"수호자의 심장","intro":"랜덤 버프 관문과 M10 카운터 압박 전장","early":[["m10_devourer",24],["m07_matrix",28],["m05_gravity",20],["m02_armor",18],["m03_phase",5],["m09_tractor",5]],"mid":[["m10_devourer",31],["m05_gravity",22],["m07_matrix",22],["m06_jumper",14],["m09_tractor",7],["m08_echo",4]],"late":[["m10_devourer",34],["m05_gravity",21],["m07_matrix",20],["m02_armor",12],["m09_tractor",8],["m08_echo",5]]},"15":{"theme":"안드로메다의 잔향","intro":"B03 최종 수호자와 모든 1차 기믹이 합쳐지는 최종 전장","early":[["m10_devourer",30],["m07_matrix",28],["m05_gravity",24],["m06_jumper",18]],"mid":[["m10_devourer",38],["m05_gravity",26],["m07_matrix",22],["m02_armor",14]],"late":[["m10_devourer",42],["m05_gravity",26],["m07_matrix",20],["m06_jumper",12]]}};

const MONSTER_INTRO_STORAGE_KEY = 'planetRiftMonsterIntroSeenV1';
function loadMonsterIntroShownSet(){
  try{
    const raw = localStorage.getItem(MONSTER_INTRO_STORAGE_KEY);
    const arr = JSON.parse(raw || '[]');
    if(Array.isArray(arr)) return new Set(arr.filter(x => typeof x === 'string' && x.length > 0));
  }catch(_err){}
  return new Set();
}
const MONSTER_INTRO_SHOWN = loadMonsterIntroShownSet();
function saveMonsterIntroShownSet(){
  try{
    localStorage.setItem(MONSTER_INTRO_STORAGE_KEY, JSON.stringify(Array.from(MONSTER_INTRO_SHOWN).slice(-96)));
  }catch(_err){}
}
function hasMonsterIntroShown(key){
  return !!key && MONSTER_INTRO_SHOWN.has(String(key));
}
function markMonsterIntroShown(key){
  if(!key) return;
  MONSTER_INTRO_SHOWN.add(String(key));
  saveMonsterIntroShownSet();
}
const MONSTER_INTRO_PAUSE_STATE = {active:false, wasPaused:false, token:0};
function monsterDef(id){ return ENEMY_BASE_MAP[id] || ENEMY_BASE_MAP.void_sentry || ENEMY_BASE_MAP.grunt; }
function monsterWaveBand(wave){ return wave < 4 ? 'early' : (wave < 8 ? 'mid' : 'late'); }
function sanitizeMonsterCssValue(value, fallback){
  const raw = String(value || fallback || '').trim();
  const safe = raw.replace(/[^#(),.%a-zA-Z0-9\s-]/g, '');
  return safe || String(fallback || '#67e8f9');
}
function sanitizeMonsterClass(value){
  return String(value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
}
function monsterIntroPreviewMarkup(id, def){
  const cls = sanitizeMonsterClass(id);
  const role = sanitizeMonsterClass(def?.role || 'basic');
  return `<div class="monsterIntroPreview monsterIntroType_${cls} monsterIntroRole_${role}" aria-hidden="true">
    <canvas class="monsterIntroPreviewCanvas" width="200" height="200"></canvas>
  </div>`;
}
function renderMonsterIntroPreviewCanvas(canvas, id, def){
  if(!canvas || !def) return;
  try{
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(96, Math.round(rect.width || 104));
    const cssH = Math.max(96, Math.round(rect.height || 104));
    const pxW = Math.max(120, Math.round(cssW * dpr));
    const pxH = Math.max(120, Math.round(cssH * dpr));
    if(canvas.width !== pxW) canvas.width = pxW;
    if(canvas.height !== pxH) canvas.height = pxH;
    const pctx = canvas.getContext('2d');
    if(!pctx) return;
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.clearRect(0, 0, cssW, cssH);

    const laneY = Math.round(cssH * 0.73);
    const cx = cssW * 0.5;
    const cy = cssH * 0.46;
    const size = Math.max(10, Math.min(28, Number(def.size || 14) * 1.08));
    const enemy = {
      x: cx,
      y: cy,
      size,
      color: def.color || '#dbeafe',
      boss: !!def.boss,
      treasure: !!def.treasure,
      shield: def.shieldRatio > 0 ? 100 : 0,
      maxShield: def.shieldRatio > 0 ? 100 : 0,
      dodgeChance: Math.max(0, Number(def.dodgeChance || 0)),
      stageBoss: !!def.stageBoss,
      auraColor: def.aura || def.color || '#dbeafe',
      hp: 1,
      maxHp: 1,
      mark: 0,
      freeze: 0,
      dotTime: 0,
      bossKo: def.displayName || ''
    };

    pctx.fillStyle = 'rgba(7, 18, 33, 0.96)';
    pctx.fillRect(0, 0, cssW, cssH);

    pctx.strokeStyle = 'rgba(125,211,252,0.12)';
    pctx.lineWidth = 1;
    for(let x = 8; x < cssW - 7; x += 16){
      pctx.beginPath();
      pctx.moveTo(x + 0.5, 8);
      pctx.lineTo(x + 0.5, cssH - 8);
      pctx.stroke();
    }
    for(let y = 8; y < cssH - 7; y += 16){
      pctx.beginPath();
      pctx.moveTo(8, y + 0.5);
      pctx.lineTo(cssW - 8, y + 0.5);
      pctx.stroke();
    }

    pctx.fillStyle = 'rgba(18, 74, 107, 0.26)';
    pctx.strokeStyle = 'rgba(103,232,249,0.35)';
    pctx.lineWidth = 1.2;
    const laneX = 10;
    const laneW = cssW - 20;
    const laneH = Math.max(10, Math.round(cssH * 0.12));
    const laneR = laneH * 0.5;
    pctx.beginPath();
    pctx.moveTo(laneX + laneR, laneY);
    pctx.arcTo(laneX + laneW, laneY, laneX + laneW, laneY + laneH, laneR);
    pctx.arcTo(laneX + laneW, laneY + laneH, laneX, laneY + laneH, laneR);
    pctx.arcTo(laneX, laneY + laneH, laneX, laneY, laneR);
    pctx.arcTo(laneX, laneY, laneX + laneW, laneY, laneR);
    pctx.closePath();
    pctx.fill();
    pctx.stroke();
    pctx.shadowColor = 'rgba(34,211,238,0.28)';
    pctx.shadowBlur = 12;
    pctx.strokeStyle = 'rgba(34,211,238,0.22)';
    pctx.stroke();
    pctx.shadowBlur = 0;

    const body = getCachedEnemyBodySprite(enemy.color, enemy.size, !!enemy.boss);
    if(body){
      pctx.drawImage(body.canvas, enemy.x - body.cx, enemy.y - body.cy, body.w, body.h);
    }else{
      pctx.fillStyle = enemy.color;
      pctx.beginPath();
      pctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
      pctx.fill();
    }

    if(enemy.stageBoss){
      pctx.strokeStyle = enemy.auraColor || enemy.color;
      pctx.lineWidth = 2.2;
      pctx.globalAlpha = .9;
      pctx.beginPath();
      pctx.arc(enemy.x, enemy.y, enemy.size + 9, 0, Math.PI * 2);
      pctx.stroke();
      pctx.globalAlpha = 1;
    }
    if(enemy.treasure){
      pctx.strokeStyle = '#fde68a';
      pctx.lineWidth = 2.5;
      pctx.beginPath();
      pctx.arc(enemy.x, enemy.y, enemy.size + 5, 0, Math.PI * 2);
      pctx.stroke();
    }
    if(enemy.maxShield > 0 && enemy.shield > 0){
      pctx.strokeStyle = 'rgba(191,219,254,.92)';
      pctx.lineWidth = 2;
      pctx.globalAlpha = .9;
      pctx.beginPath();
      pctx.arc(enemy.x, enemy.y, enemy.size + 5, 0, Math.PI * 2);
      pctx.stroke();
      pctx.globalAlpha = 1;
    }
    if(enemy.dodgeChance > 0){
      pctx.strokeStyle = 'rgba(196,181,253,.76)';
      pctx.lineWidth = 1.5;
      pctx.globalAlpha = .78;
      pctx.beginPath();
      pctx.arc(enemy.x, enemy.y, enemy.size + 4, 0, Math.PI * 2);
      pctx.stroke();
      pctx.globalAlpha = 1;
    }

    const barW = enemy.boss ? 54 : 44;
    const barX = enemy.x - barW / 2;
    const barY = enemy.y - enemy.size - 16;
    pctx.fillStyle = 'rgba(2,6,23,.92)';
    pctx.fillRect(barX, barY, barW, 6);
    pctx.fillStyle = '#22c55e';
    pctx.fillRect(barX, barY, barW, 6);
    if(enemy.maxShield > 0 && enemy.shield > 0){
      pctx.fillStyle = '#93c5fd';
      pctx.fillRect(barX, barY - 5, barW, 3);
    }
  }catch(err){
    console.warn('monster intro preview render failed', err);
  }
}
function pauseForMonsterIntro(){
  if(!S || !S.active || S.gameOver) return;
  MONSTER_INTRO_PAUSE_STATE.token += 1;
  MONSTER_INTRO_PAUSE_STATE.active = true;
  MONSTER_INTRO_PAUSE_STATE.wasPaused = !!S.paused;
  S.paused = true;
  try{ document.body.classList.add('monster-intro-open'); }catch(_){ }
  try{ updateUI(); }catch(err){ console.warn('monster intro pause ui failed', err); }
}
function resumeFromMonsterIntro(){
  if(!MONSTER_INTRO_PAUSE_STATE.active) return;
  const shouldResume = !MONSTER_INTRO_PAUSE_STATE.wasPaused;
  MONSTER_INTRO_PAUSE_STATE.active = false;
  try{ document.body.classList.remove('monster-intro-open'); }catch(_){ }
  if(S && S.active && !S.gameOver && shouldResume) S.paused = false;
  try{ updateUI(); }catch(err){ console.warn('monster intro resume ui failed', err); }
}
function getStageMonsterPool(stageNo, waveNo){
  const stage = clamp(Number(stageNo || 1), 1, STAGE_MAP_DEFS.length);
  const wave = Math.max(1, Number(waveNo || 1));
  const cfg = STAGE_MONSTER_POOLS[stage] || STAGE_MONSTER_POOLS[1];
  return cfg[monsterWaveBand(wave)] || cfg.early || [['void_sentry', 100]];
}
function pickWeightedMonster(pool){
  let total = 0;
  for(let i=0;i<pool.length;i++) total += Math.max(0, Number(pool[i][1] || 0));
  if(total <= 0) return 'void_sentry';
  let r = Math.random() * total;
  for(let i=0;i<pool.length;i++){
    r -= Math.max(0, Number(pool[i][1] || 0));
    if(r <= 0) return pool[i][0];
  }
  return pool[pool.length - 1][0] || 'void_sentry';
}
function monsterPoolSummary(stageNo, waveNo){
  const pool = getStageMonsterPool(stageNo, waveNo);
  return pool.slice(0, 4).map(([id]) => monsterDef(id).displayName || id).join(' / ');
}


function andromedaEnemySupportSpeedMultiplier(enemy){
  if(!enemy || !Array.isArray(enemies)) return 1;
  let mul = 1;
  let auraMul = 1;
  for(let i=0;i<enemies.length;i++){
    const other = enemies[i];
    if(!other || other.dead || other === enemy) continue;
    if(other.auraRadius > 0 && other.auraSpeedMul > 1){
      const dx = other.x - enemy.x, dy = other.y - enemy.y;
      if(dx*dx + dy*dy <= other.auraRadius * other.auraRadius){
        auraMul = Math.max(auraMul, other.auraSpeedMul);
      }
    }
  }
  if(auraMul > 1) mul *= Math.min(auraMul, 1.20);
  if(enemy.packRadius > 0 && enemy.packMin > 1){
    let count = 1;
    for(let i=0;i<enemies.length;i++){
      const other = enemies[i];
      if(!other || other.dead || other === enemy || other.type !== enemy.type) continue;
      const dx = other.x - enemy.x, dy = other.y - enemy.y;
      if(dx*dx + dy*dy <= enemy.packRadius * enemy.packRadius) count++;
      if(count >= enemy.packMin) break;
    }
    if(count >= enemy.packMin) mul *= enemy.packSpeedMul || 1;
  }
  return Math.min(mul, 1.32);
}
function andromedaEnemyAbsorbActive(enemy){
  if(!enemy || enemy.type !== 'm10_devourer' || !Array.isArray(terrain) || !terrain.length) return false;
  const stage = Number(S?.stageNo || StageMapState?.current || 1);
  if(stage < 14) return false;
  const radius = Math.max(26, CELL * .86);
  for(let i=0;i<terrain.length;i++){
    const key = terrain[i];
    if(!isSpecialPlateKey(key)) continue;
    const c = center(i);
    const dx = c.x - enemy.x, dy = c.y - enemy.y;
    if(dx*dx + dy*dy <= radius * radius) return true;
  }
  return false;
}

function advanceEnemyAlongRoute(enemy, amount){
  const er = enemyRoute(enemy);
  if(!enemy || enemy.dead || !Array.isArray(er) || er.length < 2) return false;
  let remaining = Math.max(0, amount || 0);
  while(remaining > 0 && enemy.seg < er.length - 1){
    if(isEnemyTeleportBreak(enemy, enemy.seg)){ const jump = er[enemy.seg + 1]; if(jump){ enemy.x = jump.x; enemy.y = jump.y; enemy.seg++; } continue; }
    const to = er[enemy.seg + 1];
    const dx = to.x - enemy.x;
    const dy = to.y - enemy.y;
    const d = Math.hypot(dx, dy);
    if(d <= 0.001){ enemy.seg++; continue; }
    if(d <= remaining){
      enemy.x = to.x; enemy.y = to.y; enemy.seg++; enemy.progress += d; remaining -= d;
    }else{
      enemy.x += dx / d * remaining;
      enemy.y += dy / d * remaining;
      enemy.progress += remaining;
      remaining = 0;
    }
  }
  confineEnemyToRoute(enemy, enemy.stageBoss ? 18 : 12);
  return true;
}
function spawnEchoIllusions(source){
  if(!source || source.echoSpawned || !source.echoId || !Array.isArray(enemies)) return false;
  source.echoSpawned = true;
  const count = Math.max(1, Math.min(2, Math.floor(source.echoMin + Math.random() * (source.echoMax - source.echoMin + 1))));
  for(let i=0;i<count;i++){
    const echo = acquireEnemy({type:source.echoId, echoIllusion:true, echoSpawned:true, x:source.x + rand(-10,10), y:source.y + rand(-10,10), seg:source.seg, progress:source.progress, routeVariantIndex:source.routeVariantIndex});
    echo.hp = Math.max(1, Math.floor(echo.maxHp * (.55 + Math.random() * .12)));
    echo.slow = Math.max(echo.slow || 0, 8 + i * 3);
    enemies.push(echo);
    S.total = Number(S.total || 0) + 1;
    S.spawned = Number(S.spawned || 0) + 1;
  }
  ring(source.x, source.y, Math.max(34, source.size * 3), 'rgba(186,230,253,.78)');
  impactLabel(source.x, source.y - source.size - 24, 'ECHO', '#bae6fd', 13, 54);
  return true;
}
function triggerTractorPulse(source){
  if(!source || source.dead || source.tractorRadius <= 0 || source.tractorCount <= 0) return false;
  const candidates = [];
  const r2 = source.tractorRadius * source.tractorRadius;
  for(let i=0;i<enemies.length;i++){
    const e = enemies[i];
    if(!e || e.dead || e === source || e.stageBoss || e.echoIllusion) continue;
    if(e.progress >= source.progress - 4) continue;
    const dx = e.x - source.x, dy = e.y - source.y;
    if(dx*dx + dy*dy > r2) continue;
    candidates.push(e);
  }
  candidates.sort((a,b)=>b.progress-a.progress);
  const count = Math.min(source.tractorCount, candidates.length);
  for(let i=0;i<count;i++){
    const e = candidates[i];
    advanceEnemyAlongRoute(e, source.tractorPull * (.82 + i * .08));
    e.slow = Math.max(0, e.slow - 18);
  }
  if(count){
    pushBeam(source.x, source.y, candidates[0].x, candidates[0].y, '#f0abfc', 18, 'tractor', 2.8);
    ring(source.x, source.y, Math.min(source.tractorRadius, CELL * 1.8), 'rgba(240,171,252,.60)');
    impactLabel(source.x, source.y - source.size - 20, `TRACTOR x${count}`, '#f0abfc', 11, 42);
  }
  return count > 0;
}
function andromedaEnemyRuntimeTick(enemy, dt){
  if(!enemy || enemy.dead) return;
  if(enemy.phaseTime > 0) enemy.phaseTime -= dt;
  if(enemy.phaseInterval > 0){
    enemy.phaseCd -= dt;
    if(enemy.phaseCd <= 0){
      enemy.phaseTime = enemy.phaseDuration || 1;
      enemy.phaseCd = enemy.phaseInterval;
      if(Math.random() < .34) impactLabel(enemy.x, enemy.y - enemy.size - 18, 'PHASE', enemy.color || '#c4b5fd', 10, 34);
    }
  }
  if(enemy.echoThreshold > 0 && !enemy.echoSpawned && enemy.hp <= enemy.maxHp * enemy.echoThreshold) spawnEchoIllusions(enemy);
  if(enemy.tractorInterval > 0){
    enemy.tractorCd -= dt;
    if(enemy.tractorCd <= 0){
      enemy.tractorCd = enemy.tractorInterval;
      triggerTractorPulse(enemy);
    }
  }
}

class Enemy{
  constructor(entry){
    if(entry !== undefined) this.init(entry);
  }
  init(entry){
    const payload = (entry && typeof entry === 'object') ? entry : null;
    const type = payload ? (payload.type || 'grunt') : (entry || 'grunt');
    this.type=type;
    this.stageBoss=false;this.bossTier='';this.bossName='';this.bossKo='';this.abilityName='';this.bossTitle='';this.bossDesc='';this.auraColor='';
    this.hpScale=1;this.coreDamage=0;this.bossEffect='';this.skillInterval=0;this.skillCd=0;this.rewardBonus=0;
    const base = ENEMY_BASE_MAP[type] || ENEMY_BASE_MAP.grunt;
    let hpBase = base.hp, spd = base.spd, size = base.size, color = base.color;
    let reward = base.reward, exp = base.exp, armor = base.armor || 0;
    this.displayName = base.displayName || type;
    this.monsterRole = base.role || '';
    this.skillName = base.skillName || '';
    this.intro = base.intro || '';
    this.dodgeChance = Math.max(0, Number(base.dodgeChance || 0));
    this.shieldRatio = Math.max(0, Number(base.shieldRatio || 0));
    this.shield = 0; this.maxShield = 0;
    this.splitId = base.splitId || '';
    this.splitCount = Math.max(0, Number(base.splitCount || 0));
    this.splitChild = !!(base.splitChild || payload?.splitChild);
    this.boostInterval = Math.max(0, Number(base.boostInterval || 0));
    this.boostDuration = Math.max(0, Number(base.boostDuration || 0));
    this.boostMul = Math.max(1, Number(base.boostMul || 1));
    this.boostCd = this.boostInterval > 0 ? this.boostInterval : 0;
    this.boostTime = 0;
    this.auraRadius = Math.max(0, Number(base.auraRadius || 0));
    this.auraSpeedMul = Math.max(1, Number(base.auraSpeedMul || 1));
    this.auraSpeedCap = Math.max(this.auraSpeedMul, Number(base.auraSpeedCap || this.auraSpeedMul || 1));
    this.packRadius = Math.max(0, Number(base.packRadius || 0));
    this.packMin = Math.max(0, Number(base.packMin || 0));
    this.packSpeedMul = Math.max(1, Number(base.packSpeedMul || 1));
    this.phaseInterval = Math.max(0, Number(base.phaseInterval || 0));
    this.phaseDuration = Math.max(0, Number(base.phaseDuration || 0));
    this.phaseReduction = Math.max(0, Math.min(.75, Number(base.phaseReduction || 0)));
    this.phaseCd = this.phaseInterval > 0 ? this.phaseInterval * .72 : 0;
    this.phaseTime = 0;
    this.echoThreshold = Math.max(0, Math.min(1, Number(base.echoThreshold || 0)));
    this.echoMin = Math.max(0, Number(base.echoMin || 0));
    this.echoMax = Math.max(this.echoMin, Number(base.echoMax || this.echoMin || 0));
    this.echoId = base.echoId || '';
    this.echoSpawned = !!payload?.echoSpawned;
    this.echoIllusion = !!(base.echoIllusion || payload?.echoIllusion);
    this.tractorRadius = Math.max(0, Number(base.tractorRadius || 0));
    this.tractorCount = Math.max(0, Number(base.tractorCount || 0));
    this.tractorInterval = Math.max(0, Number(base.tractorInterval || 0));
    this.tractorPull = Math.max(0, Number(base.tractorPull || 0));
    this.tractorCd = this.tractorInterval > 0 ? this.tractorInterval * (.62 + Math.random() * .28) : 0;
    this.stigmaAbsorb = Math.max(0, Math.min(1, Number(base.stigmaAbsorb || 1)));
    this.regen=!!base.regen;this.treasure=!!base.treasure;this.boss=!!base.boss;
    this.coreDamage = base.coreDamage || 0;
    const bossData = payload?.bossData || null;
    if(bossData){
      this.stageBoss = true;
      this.bossTier = payload.bossTier || (type === 'finalboss' ? 'final' : 'mid');
      this.bossName = bossData.name;
      this.bossKo = bossData.ko;
      this.displayName = bossData.ko || bossData.name || this.displayName;
      this.abilityName = bossData.ability;
      this.bossTitle = bossData.title;
      this.bossDesc = bossData.desc;
      this.auraColor = bossData.aura || bossData.color;
      color = bossData.color || color;
      size = bossData.size || size;
      spd *= bossData.speedMul || 1;
      reward *= bossData.rewardMul || 1;
      exp *= bossData.expMul || 1;
      armor += bossData.armor || 0;
      this.hpScale = bossData.hpMul || 1;
      // Boss core damage is normalized for clarity and predictable balance:
      // mid boss = -3 core, final boss = -5 core.
      this.coreDamage = this.bossTier === 'final' ? 5 : 3;
      this.bossEffect = bossData.effect;
      this.skillInterval = bossData.interval || 128;
      this.skillCd = this.skillInterval * .75;
    }
    const waveDefense = waveDefenseTuning(S.stageNo || StageMapState.current || 1, S.ogge || 1, !!(base.boss || this.stageBoss));
    armor += Number(waveDefense.armor || 0);
    this.spd=spd;this.size=size;this.color=color;this.reward=reward;this.exp=exp;this.armor=armor;
    const routePick = selectEnemyRouteVariant(payload);
    this.routeVariantIndex = routePick.index;
    this.routeKind = routePick.variant?.kind || 'single';
    this.routeName = routePick.variant?.name || 'route';
    this.route = routePick.variant?.points || route;
    this.routeBreaks = routePick.variant?.breaks instanceof Set ? routePick.variant.breaks : new Set();
    const startPoint = this.route?.[0] || route?.[0] || {x:0,y:0};
    this.x=startPoint.x;this.y=startPoint.y;this.seg=0;this.progress=0;
    if(payload && Number.isFinite(payload.x) && Number.isFinite(payload.y)){
      this.x = payload.x; this.y = payload.y;
      this.seg = Math.max(0, Number(payload.seg || 0));
      this.progress = Math.max(0, Number(payload.progress || 0));
    }
    const hpScale = this.hpScale || 1;
    const stageBalance = getCommercialStageBalance(S.stageNo || StageMapState.current || 1);
    const stageHpMultiplier = (this.boss || this.stageBoss)
      ? Number(stageBalance.boss_multiplier || 1)
      : Number(stageBalance.general_hp_multiplier || 1);
    const waveHpMultiplier = Number(waveDefense.hpMul || 1);
    this.maxHp=Math.floor(295*hpBase*(1+S.ogge*.30+S.theme*.38) * hpScale * stageHpMultiplier * waveHpMultiplier);
    this.hp=this.maxHp;
    if(this.shieldRatio > 0){
      this.maxShield = Math.max(1, Math.floor(this.maxHp * this.shieldRatio));
      this.shield = this.maxShield;
    }
    this.dead=false;this.slow=0;this.freeze=0;this.dot=0;this.dotTime=0;this.dotColor='';this.mark=0;this._chainHitStamp=0;
    return this;
  }
  update(dt){
    if(this.dotTime>0){this.hp-=this.dot*dt;this.dotTime-=dt}else if(this.dotColor){this.dotColor=''}
    if(this.regen)this.hp=Math.min(this.maxHp,this.hp+.18*dt*(1+S.ogge*.045));
    if(this.slow>0)this.slow-=dt;
    if(this.freeze>0)this.freeze-=dt;
    if(this.mark>0)this.mark-=dt;
    andromedaEnemyRuntimeTick(this, dt);
    if(this.boostTime > 0){
      this.boostTime -= dt;
    }else if(this.boostInterval > 0){
      this.boostCd -= dt;
      if(this.boostCd <= 0){
        this.boostTime = this.boostDuration || .35;
        this.boostCd = this.boostInterval;
        if(Math.random() < .24) impactLabel(this.x, this.y - this.size - 18, 'BOOST', this.color || '#67e8f9', 10, 30);
      }
    }
    if(this.stageBoss){
      this.skillCd -= dt;
      if(this.skillCd <= 0){
        this.skillCd = this.skillInterval;
        triggerBossSkill(this);
      }
    }
    if(this.hp<=0){this.kill();return}
    const stageBalance = getCommercialStageBalance(S.stageNo || StageMapState.current || 1);
    let speed=this.spd*Number(stageBalance.general_speed_multiplier || 1)*(1+S.ogge*.032+S.theme*.028);
    if(this.boostTime > 0) speed *= this.boostMul || 1;
    speed *= andromedaEnemySupportSpeedMultiplier(this);
    if(this.slow>0)speed*=.55;
    if(this.freeze>0)speed*=.12;
    const er = enemyRoute(this);
    const to=er?.[this.seg+1];
    if(!to){this.reachCore();return}
    if(isEnemyTeleportBreak(this, this.seg)){
      if(!this.teleportFlashUntil || this.teleportFlashUntil < performance.now()){
        impactLabel(this.x, this.y - this.size - 18, 'SHIFT', '#f0abfc', 11, 34);
        this.teleportFlashUntil = performance.now() + 450;
      }
      this.x = to.x; this.y = to.y; this.seg++; this.progress += Math.max(CELL * 1.5, 60);
      confineEnemyToRoute(this, this.stageBoss ? 18 : 12);
      return;
    }
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
  damage(v,source,color,rewardBonus=0){
    this.rewardBonus = Math.max(0, Number(rewardBonus || 0));
    if(this.dodgeChance > 0 && Math.random() < this.dodgeChance){
      if(Math.random() < .20) impactLabel(this.x, this.y - this.size - 20, 'EVADE', this.color || '#c4b5fd', 11, 34);
      return;
    }
    const g = getGlobalUpgradeStats();
    const armorValue = Math.max(0, (this.armor||0) + S.stageArmorBonus - (g.armorBreak||0));
    let final=v*(1-clamp(armorValue,0,.72));
    if(this.phaseTime > 0 && this.phaseReduction > 0) final *= (1 - this.phaseReduction);
    if(this.stigmaAbsorb < 1 && andromedaEnemyAbsorbActive(this)) final *= this.stigmaAbsorb;
    if(this.boss || this.stageBoss) final*=1+(g.bossDamage||0);
    if(this.mark>0) final*=1.22;
    if(this.shield > 0){
      const block = Math.min(this.shield, final);
      this.shield -= block;
      final -= block;
      if(block > 20 && Math.random() < .14) impactLabel(this.x, this.y - this.size - 24, 'SHIELD', '#bfdbfe', 11, 36);
    }
    if(final > 0) this.hp-=final;
    // v35: hide enemy damage number labels.
    // Damage calculation and HP reduction stay unchanged; only the floating numeric text is suppressed.
    // This also avoids extra float objects during heavy combat/audio playback.
    // if(final>18)floatText(this.x+rand(-5,5),this.y-this.size-rand(0,4),final,color||'#fff', Math.min(15, 10 + final * .05), 50);
  }
  kill(){
    if(this.dead)return;
    this.dead=true;
    S.runKills = (S.runKills || 0) + 1;
    const g = getGlobalUpgradeStats();
    const stageBalance = getCommercialStageBalance(S.stageNo || StageMapState.current || 1);
    const rewardBonus = Math.max(0, Number(this.rewardBonus || 0));
    const killScale = economyKillRewardScale(S.stageNo || StageMapState.current || 1, S.ogge || 1);
    const reward=Math.max(1,Math.floor((6+S.ogge*.9)*this.reward*Number(stageBalance.reward_multiplier || 1)*(1+S.mods.reward+(g.reward||0)+rewardBonus)*killScale));
    S.gold+=reward;
    gainExp(this.exp);
    burst(this.x,this.y,this.color,22,38);
    registerKillCombo(this);
    if(this.splitId && this.splitCount > 0 && !this.splitChild){
      spawnSplitChildren(this);
    }
    if(this.treasure){
      const treasureName = this.displayName || '성흔 운반체';
      triggerTreasureImpact(this);
      const treasureShardChance = economyTreasureShardChance(S.stageNo || StageMapState.current || 1);
      if(Math.random() >= treasureShardChance){
        const bonus=Math.max(1, Math.floor((45+S.ogge*8)*economyTreasureGoldScale(S.stageNo || StageMapState.current || 1, S.ogge || 1)));
        S.gold+=bonus;
        toast(`${treasureName} 파괴! 수정 +${fmt2(bonus)}`);
        impactLabel(this.x,this.y-this.size-34,`+${fmt2(bonus)} CRYSTAL`,'#fde68a',18,78);
        sound('treasure');
      }else{
        const shardBonus = economyTreasureShardAmount(Math.max(2, Math.floor(2 + S.ogge / 3)), S.stageNo || StageMapState.current || 1, S.ogge || 1);
        if(META){ META.shards += shardBonus; saveOfflineMeta(); renderOfflineMetaPanel(); }
        toast(`${treasureName} 파괴! 성흔 조각 +${fmt2(shardBonus)}`);
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
    let coreHit = this.echoIllusion ? 0 : (this.coreDamage || (this.boss?4:1));
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
    else if(this.dotTime>0)c=this.dotColor || '#86efac';
    // v13: enemy draw does not need a full canvas state stack. All modified state is
    // either overwritten below or reset before returning; boss body rotation remains
    // isolated inside drawCachedEnemyBody().
    if(!drawCachedEnemyBody(this, c)){
      ctx.shadowColor=c;ctx.shadowBlur=this.boss?24:13;
      ctx.fillStyle=c;
      ctx.beginPath();
      if(this.boss){
        for(let i=0;i<9;i++){
          const a=i*TAU/9+visualNowSec;
          const r=this.size*(i%2?.72:1.08);
          const x=this.x+Math.cos(a)*r,y=this.y+Math.sin(a)*r;
          if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.closePath();
      }else{
        ctx.arc(this.x,this.y,this.size,0,TAU);
      }
      ctx.fill();
    }
    if(this.treasure){
      ctx.strokeStyle='#fde68a';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(this.x,this.y,this.size+6,0,TAU);ctx.stroke();
    }
    if(this.shield > 0){
      ctx.strokeStyle='rgba(191,219,254,.92)';ctx.lineWidth=2.2;ctx.globalAlpha=.86;
      ctx.beginPath();ctx.arc(this.x,this.y,this.size+5+Math.sin((visualNowMs || 0)/150)*1.5,0,TAU);ctx.stroke();
      ctx.globalAlpha=1;
    }
    if(this.dodgeChance > 0){
      ctx.strokeStyle='rgba(196,181,253,.70)';ctx.lineWidth=1.5;ctx.globalAlpha=.72;
      ctx.beginPath();ctx.arc(this.x,this.y,this.size+4,0,TAU);ctx.stroke();
      ctx.globalAlpha=1;
    }
    if(this.stageBoss){
      ctx.strokeStyle=this.auraColor || this.color;ctx.lineWidth=2.4;ctx.globalAlpha=.9;
      ctx.beginPath();ctx.arc(this.x,this.y,this.size+9+Math.sin((visualNowMs || 0)/180)*2,0,TAU);ctx.stroke();
      ctx.globalAlpha=1;
    }
    const r=clamp(this.hp/this.maxHp,0,1);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(2,6,23,.9)';
    ctx.fillRect(this.x-20,this.y-this.size-14,40,5);
    ctx.fillStyle=r>.45?'#22c55e':'#fb7185';
    ctx.fillRect(this.x-20,this.y-this.size-14,40*r,5);
    if(this.maxShield > 0 && this.shield > 0){
      const sr = clamp(this.shield / this.maxShield, 0, 1);
      ctx.fillStyle='#93c5fd';
      ctx.fillRect(this.x-20,this.y-this.size-19,40*sr,3);
    }
    if(this.mark>0){
      ctx.strokeStyle='#60a5fa';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(this.x,this.y,this.size+7,0,TAU);ctx.stroke();
    }
    if(this.stageBoss){
      ctx.fillStyle='#f8fafc';ctx.font='900 10px Orbitron';ctx.textAlign='center';
      ctx.fillText(this.bossKo || this.bossName, this.x, this.y - this.size - 22);
    }
    ctx.globalAlpha=1;
    ctx.shadowBlur=0;
  }
}



function spawnSplitChildren(source){
  if(!source || !source.splitId || !Array.isArray(enemies)) return;
  const count = Math.max(0, Math.min(4, Number(source.splitCount || 0)));
  for(let i=0;i<count;i++){
    const child = acquireEnemy({
      type: source.splitId,
      splitChild: true,
      x: source.x + rand(-7, 7),
      y: source.y + rand(-7, 7),
      seg: source.seg,
      progress: source.progress
    });
    child.slow = Math.max(child.slow || 0, 6 + i * 2);
    enemies.push(child);
    S.total = Number(S.total || 0) + 1;
    S.spawned = Number(S.spawned || 0) + 1;
  }
  impactLabel(source.x, source.y - source.size - 28, 'SPLIT', source.color || '#fb7185', 12, 48);
}

function pushEnemyBack(enemy, amount){
  const er = enemyRoute(enemy);
  if(!enemy || enemy.dead || !Array.isArray(er) || er.length < 2) return false;
  let remaining = Math.max(0, amount || 0);
  while(remaining > 0 && enemy.seg >= 0){
    const start = er[enemy.seg] || er[0];
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
    const prevEnd = er[enemy.seg + 1] || er[enemy.seg] || er[0];
    enemy.x = prevEnd.x;
    enemy.y = prevEnd.y;
  }
  confineEnemyToRoute(enemy, enemy.stageBoss ? 18 : 12);
  return true;
}




function nearestEnemyExcept(source, x, y, range){
  let best = null;
  let bestProgress = -Infinity;
  const r2 = range * range;
  for(let i=0;i<enemies.length;i++){
    const e = enemies[i];
    if(e.dead || e === source) continue;
    const dx = e.x - x, dy = e.y - y;
    if(dx*dx + dy*dy > r2) continue;
    if(e.progress > bestProgress){ best = e; bestProgress = e.progress; }
  }
  return best;
}
const NEAREST_BUILD_PLATE_HIT = {idx:-1,x:0,y:0};
function nearestBuildPlate(fromIdx, radius=2){
  const from = center(fromIdx);
  const limitSq = CELL * radius * CELL * radius;
  let bestIdx = -1, bestX = 0, bestY = 0, bestD = limitSq;
  for(let i=0;i<terrain.length;i++){
    if(i === fromIdx || !canBuild(i)) continue;
    const c = center(i);
    const dx = from.x - c.x, dy = from.y - c.y;
    const d = dx*dx + dy*dy;
    if(d < bestD){ bestIdx = i; bestX = c.x; bestY = c.y; bestD = d; }
  }
  if(bestIdx < 0) return null;
  NEAREST_BUILD_PLATE_HIT.idx = bestIdx;
  NEAREST_BUILD_PLATE_HIT.x = bestX;
  NEAREST_BUILD_PLATE_HIT.y = bestY;
  return NEAREST_BUILD_PLATE_HIT;
}
function triggerPrismLink(tower, target, st, baseDamage){
  const p = tower.pos;
  const plate = nearestBuildPlate(tower.idx, 2.4);
  const endX = plate ? plate.x : target.x;
  const endY = plate ? plate.y : target.y;
  const life = 34 + st.prismLink * 22;
  pushBeam(p.x,p.y,endX,endY,'#c084fc',life,'prism',3.2);
  const width = 18 + st.prismLink * 4;
  const widthSq = width * width;
  let hits = 0;
  for(let i=0;i<enemies.length;i++){
    const e = enemies[i];
    if(e.dead) continue;
    if(pointSegSq(e.x,e.y,p.x,p.y,endX,endY) < widthSq){
      e.damage(baseDamage * (.18 + st.prismLink * .055), 'prism_link', '#d8b4fe', st.gold);
      e.mark = Math.max(e.mark, 34 + st.prismLink * 12);
      hits++;
    }
  }
  if(hits){
    impactLabel((p.x+endX)/2, (p.y+endY)/2 - 10, 'PRISM LINK', '#e9d5ff', 12, 52);
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
  const angle = (visualNowMs || 0) * .003 + tower.phase;
  const sx = p.x + Math.cos(angle) * 34;
  const sy = p.y + Math.sin(angle) * 22;
  const alt = nearestEnemyExcept(target, p.x, p.y, st.range + 52) || target;
  pushBeam(sx,sy,alt.x,alt.y,'#60a5fa',18,'satellite',2.2);
  alt.damage(baseDamage * (.24 + st.satelliteForge * .24), 'satellite', '#93c5fd', st.gold);
  burst(sx, sy, '#60a5fa', 7, 15);
}
function applyEmergencyBarrier(tower, target, st){
  if(!st.emergencyBarrier) return;
  if(distSq(target.x,target.y,CORE.x,CORE.y) > 172 * 172) return;
  const add = Math.max(1, Math.floor(st.emergencyBarrier));
  S.coreShield = Math.min(12, (S.coreShield || 0) + add);
  ring(CORE.x, CORE.y, 42 + S.coreShield * 2, '#93c5fd');
  impactLabel(CORE.x, CORE.y - 42, `BARRIER +${fmt2(add)}`, '#bfdbfe', 13, 58);
  updateUI();
}

class Bullet{
  constructor(tower=null,target=null,st=null){
    if(tower) this.init(tower,target,st);
  }
  init(tower,target,st){
    const p=tower.pos;
    this.x=p.x;this.y=p.y;this.tower=tower;this.target=target;this.st=st;
    this.speed=18;this.dead=false;this.color=tower.def.color;this.kind=tower.def.id;this.rot=Math.random()*TAU;this.trailPhase=(Math.random()*4)|0;
    return this;
  }
  update(dt){
    const target = this.target;
    if(!target||target.dead){this.dead=true;return}
    const dx=target.x-this.x,dy=target.y-this.y;
    const step=this.speed*dt;
    const dSq=dx*dx+dy*dy;
    if(dSq<=step*step){this.hit();this.dead=true;return}
    const inv=step/Math.sqrt(dSq);
    this.x+=dx*inv;this.y+=dy*inv;this.rot += .16*dt;
    const stride = projectileTrailStride();
    if(stride <= 1 || ((perfFrameId + this.trailPhase) % stride) === 0) drawBulletTrail(this.kind,this.x,this.y,this.color);
  }
  hit(){
    const id=this.tower.def.id,dmg=this.st.dmg;
    if(id==='solar'){
      const tx=this.target.x, ty=this.target.y;
      areaDamage(tx,ty,(58+this.tower.level*3)*(1+this.st.area),dmg,'solar',this.color,this.st.gold);
      const dotRadius=70*(1+this.st.area), dotRadiusSq=dotRadius*dotRadius;
      for(let i=0;i<enemies.length;i++){
        const e = enemies[i];
        if(distSq(e.x,e.y,tx,ty)<dotRadiusSq){e.dot=(1.4+this.tower.level*.2)*(1+this.st.dot);e.dotTime=120;e.dotColor='#7f1d1d'}
      }
      if(signatureChance(this.tower,.10,.016)) triggerSolarNova(this.tower,this.target,this.st,dmg);
    }else if(id==='frost'){
      this.target.damage(dmg,'frost',this.color,this.st.gold);this.target.slow=120*(1+this.st.freeze);
      if(Math.random()<.18+this.tower.level*.015+this.st.freezeChance)this.target.freeze=42*(1+this.st.freeze);
      if(this.target.freeze>0 && signatureChance(this.tower,.12,.014)) triggerFrostShatter(this.tower,this.target,this.st,dmg);
    }else if(id==='storm'){
      const chainCount = 2+Math.floor(this.tower.level/4)+Math.floor(this.st.chain);
      chain(this.target,dmg,chainCount,this.color,this.st.markAmp,this.st.gold);
      if(signatureChance(this.tower,.11,.014)) triggerStormOverload(this.tower,this.target,this.st,dmg,chainCount);
    }else if(id==='toxic'){
      this.target.damage(dmg*.75,'toxic',this.color,this.st.gold);
      this.target.dot+=(.9+this.tower.level*.16)*(1+this.st.dot);
      this.target.dotTime=190;
      if(this.st.poisonSlow>0)this.target.slow=Math.max(this.target.slow,60+this.st.poisonSlow*25);
      if(signatureChance(this.tower,.13,.013)) triggerSporeCloud(this.tower,this.target,this.st,dmg);
    }else if(id==='resonance'){
      const shieldBefore = this.target.shield || 0;
      if(shieldBefore > 0){
        const crack = Math.min(shieldBefore, dmg * (.52 + this.st.markAmp));
        this.target.shield = Math.max(0, shieldBefore - crack);
        impactLabel(this.target.x, this.target.y - this.target.size - 22, '공명 균열', '#7dd3fc', 12, 48);
      }
      if((this.target.armor || 0) > 0 && this.st.shieldDismantle > 0){
        this.target.armor = Math.max(0, this.target.armor - (.018 + this.st.shieldDismantle * .55));
      }
      this.target.mark = Math.max(this.target.mark, 96 + this.st.markAmp * 160);
      this.target.damage(dmg * (.72 + this.st.markAmp * .45), 'resonance', this.color, this.st.gold);
      triggerResonancePlate(this.tower, this.st);
      ring(this.target.x, this.target.y, 42 + this.tower.level * 2, '#38bdf8');
    }else if(id==='gravity_lens'){
      this.target.damage(dmg * .62, 'gravity_lens', this.color, this.st.gold);
      this.target.slow = Math.max(this.target.slow, 122 + this.st.freeze * 80);
      const well = 46 + this.st.gravity * 22;
      for(let i=0;i<enemies.length;i++){
        const e = enemies[i];
        if(e.dead || distSq(e.x,e.y,this.target.x,this.target.y) > well*well) continue;
        e.slow = Math.max(e.slow, 72 + this.st.freeze * 36);
        e.damage(dmg * (.10 + this.st.gravity * .18), 'gravity_lens_field', this.color, this.st.gold);
      }
      ring(this.target.x, this.target.y, well, '#818cf8');
    }else if(id==='stigma_prism'){
      this.target.damage(dmg, 'stigma_prism', this.color, this.st.gold);
      this.target.mark = Math.max(this.target.mark, 80 + this.st.prismLink * 28);
      if(this.st.prismLink > 0) triggerPrismLink(this.tower, this.target, this.st, dmg * .82);
      if(signatureChance(this.tower,.10,.012)){
        areaDamage(this.target.x,this.target.y,42 + this.st.beamWidth,dmg*.55,'stigma_prism_burst','#f0abfc',this.st.gold);
        ring(this.target.x,this.target.y,58 + this.st.beamWidth,'#e879f9');
      }
    }else if(id==='crystal'){
      const charge = this.tower.crystalCharge || 0;
      const release = Math.min(charge, dmg * (1.25 + this.st.crystalCharge));
      this.tower.crystalCharge = Math.max(0, charge - release);
      const before = this.target.hp;
      const finalDmg = dmg * .92 + release;
      this.target.damage(finalDmg, 'crystal', this.color, this.st.gold);
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
      this.target.damage(finalDmg, 'mecha', this.color, this.st.gold);
      triggerMechaSatellite(this.tower, this.target, this.st, dmg);
      applyEmergencyBarrier(this.tower, this.target, this.st);
      burst(this.target.x, this.target.y, '#60a5fa', 10, 20);
    }else if(id==='smog'){
      const fieldRadius = (48 + this.tower.level * 2.8) * (1 + this.st.area);
      this.target.damage(dmg * .64, 'smog', this.color, this.st.gold);
      let reversed = false;
      const fieldRadiusSq = fieldRadius * fieldRadius;
      for(let i=0;i<enemies.length;i++){
        const e = enemies[i];
        if(e.dead || distSq(e.x,e.y,this.target.x,this.target.y) > fieldRadiusSq) continue;
        e.slow = Math.max(e.slow, 76 + this.st.poisonSlow * 28);
        e.mark = Math.max(e.mark, 86 + this.st.markAmp * 220);
        if(this.st.dot > 0){
          e.dot += (.34 + this.tower.level * .07) * (1 + this.st.dot);
          e.dotTime = Math.max(e.dotTime, 138 + this.st.dot * 60);
        }
        e.damage(dmg * (.13 + this.st.markAmp * .32), 'smog_field', this.color, this.st.gold);
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
      this.target.damage(finalDmg,'starengine',this.color,this.st.gold);
      if(crit){
        floatText(this.target.x, this.target.y - this.target.size - 10, this.target.stageBoss ? '치명타' : '치명타', '#fef3c7');
        ring(this.target.x, this.target.y, 50 + this.tower.level * 3, '#f8fafc');
        this.target.mark = Math.max(this.target.mark, 150);
      }
      const explodeChance = clamp((this.tower.def.explodeChance || 0.1) + this.st.burstChance + this.tower.level * 0.015, 0, 0.72);
      if(Math.random() < explodeChance){
        const blast = dmg * (this.target.stageBoss ? 4.8 : 3.8);
        areaDamage(this.target.x, this.target.y, this.tower.def.explodeRadius || 126, blast, 'starengine_burst', '#fff8dc', this.st.gold);
        burst(this.target.x, this.target.y, '#fff8dc', 56, 76);
        ring(this.target.x, this.target.y, this.tower.def.explodeRadius || 126, '#fff8dc');
        impactLabel(this.target.x, this.target.y - this.target.size - 24, this.target.stageBoss ? '보스 폭발' : '성흔 폭발', '#fff7cc', 20, 88);
        shake = Math.max(shake, 18);
        flash = Math.max(flash, .16);
      }
    }else{
      this.target.damage(dmg,id,this.color,this.st.gold);
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
  pushBeam(p.x,p.y,target.x,target.y,color,overcharge?26:18,'laser',overcharge?6:4);
  const widthSq = width * width;
  const beamDamage = st.dmg * (overcharge ? 1.34 : 1);
  for(let i=0;i<enemies.length;i++){
    const e = enemies[i];
    if(!e.dead && pointSegSq(e.x,e.y,p.x,p.y,target.x,target.y)<widthSq) e.damage(beamDamage,'laser',color,st.gold);
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
  const picks = [];
  let placedCount = 0;
  for(let i=0;i<grid.length;i++) if(grid[i]) placedCount++;
  if(!placedCount) return picks;
  const targetCount = Math.min(count, placedCount);
  while(picks.length < targetCount){
    let nth = Math.floor(Math.random() * placedCount);
    let chosen = null;
    for(let i=0;i<grid.length;i++){
      const t = grid[i];
      if(!t) continue;
      if(nth-- === 0){ chosen = t; break; }
    }
    if(chosen && !picks.includes(chosen)) picks.push(chosen);
  }
  return picks;
}

function spawnBossSupportEnemy(type, enemy, options={}){
  if(!type || !enemy || !Array.isArray(route) || route.length < 2) return null;
  const e = acquireEnemy({
    type,
    x: enemy.x,
    y: enemy.y,
    seg: Math.max(0, Number(enemy.seg || 0)),
    progress: Math.max(0, Number(enemy.progress || 0)),
    splitChild:true
  });
  e.hp = Math.max(1, Math.floor(e.maxHp * Number(options.hpMul || .42)));
  e.maxHp = Math.max(e.hp, Math.floor(e.maxHp * Number(options.maxHpMul || .48)));
  e.reward *= Number(options.rewardMul || .45);
  e.exp *= Number(options.expMul || .45);
  e.coreDamage = Math.max(0, Number(options.coreDamage ?? e.coreDamage ?? 1));
  enemies.push(e);
  burst(e.x, e.y, e.color || '#f0abfc', 12, 20);
  return e;
}

function triggerBossSkill(enemy){
  if(!enemy || !enemy.stageBoss) return;
  const labelColor = enemy.auraColor || enemy.color;
  const healPct = pct => {
    const healFactor = enemy.bossTier === 'final' ? .32 : .42;
    const gain = Math.floor(enemy.maxHp * pct * healFactor);
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
      for(let i=0;i<enemies.length;i++){
        const e = enemies[i];
        if(!e.dead && e !== enemy && distSq(e.x,e.y,enemy.x,enemy.y) < 120*120){
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
      for(let i=0;i<enemies.length;i++){
        const e = enemies[i];
        if(!e.dead && distSq(e.x,e.y,enemy.x,enemy.y) < 150*150){
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
      for(let i=0;i<enemies.length;i++){
        const e = enemies[i];
        if(!e.dead && distSq(e.x,e.y,enemy.x,enemy.y) < 170*170){
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
      for(let i=0;i<enemies.length;i++){
        const e = enemies[i];
        if(!e.dead && distSq(e.x,e.y,enemy.x,enemy.y) < 145*145) e.armor = Math.min(.44, (e.armor || 0) + .012);
      }
      ring(enemy.x, enemy.y, enemy.size + 48, '#a78bfa');
      spawnImpactShards(enemy.x, enemy.y, '#ddd6fe', 16);
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '수정 과부하', '#e9d5ff', 16, 82);
      break;
    case 'fieldRepair':
      bossWarning(enemy,'전장 수리', labelColor);
      for(let i=0;i<enemies.length;i++){
        const e = enemies[i];
        if(!e.dead && distSq(e.x,e.y,enemy.x,enemy.y) < 132*132){
          e.hp = Math.min(e.maxHp, e.hp + Math.floor(e.maxHp * .055));
          e.armor = Math.min(.42, (e.armor || 0) + .008);
        }
      }
      ring(enemy.x, enemy.y, enemy.size + 40, '#60a5fa');
      impactLabel(enemy.x, enemy.y - enemy.size - 18, '전장 수리', '#bfdbfe', 16, 78);
      break;
    case 'coreReboot':{
      const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
      const finalAstra = Number(S?.stageNo || StageMapState.current || 1) >= 15 && enemy.bossTier === 'final';
      if(finalAstra && hpRatio > .66){
        bossWarning(enemy,'1페이즈 · 공명 보호막', labelColor);
        healPct(.045);
        enemy.armor = Math.min(.48, (enemy.armor || 0) + .018);
        spawnBossSupportEnemy('m02_armor', enemy, {hpMul:.46, coreDamage:1});
        ring(enemy.x, enemy.y, enemy.size + 46, '#38bdf8');
        impactLabel(enemy.x, enemy.y - enemy.size - 18, '공명 보호막', '#bae6fd', 16, 82);
      }else if(finalAstra && hpRatio > .33){
        bossWarning(enemy,'2페이즈 · 중력 폭주', labelColor);
        enemy.spd *= 1.035;
        enemy.armor = Math.min(.49, (enemy.armor || 0) + .014);
        anomalies.push({x:enemy.x,y:enemy.y,target:null,kind:'bossSurge',radius:132,visualRadius:30,damage:0,pull:0,color:'#a855f7',life:22,maxLife:22,tick:999});
        spawnBossSupportEnemy('m05_gravity', enemy, {hpMul:.40, coreDamage:1});
        ring(enemy.x, enemy.y, enemy.size + 52, '#a855f7');
        impactLabel(enemy.x, enemy.y - enemy.size - 18, '중력 폭주', '#ddd6fe', 16, 86);
      }else if(finalAstra){
        bossWarning(enemy,'3페이즈 · 코어 공명', labelColor);
        healPct(.035);
        enemy.armor = Math.min(.50, (enemy.armor || 0) + .012);
        spawnBossSupportEnemy('m10_devourer', enemy, {hpMul:.34, coreDamage:1});
        if(Math.random() < .62) spawnBossSupportEnemy('m08_echo', enemy, {hpMul:.30, coreDamage:0});
        burst(enemy.x, enemy.y, '#fca5a5', 30, 46);
        ring(enemy.x, enemy.y, enemy.size + 58, '#ef4444');
        impactLabel(enemy.x, enemy.y - enemy.size - 18, '코어 공명', '#fecaca', 16, 88);
      }else{
        bossWarning(enemy,'코어 재부팅', labelColor);
        healPct(.06);
        enemy.armor = Math.min(.50, (enemy.armor || 0) + .020);
        for(let i=0;i<enemies.length;i++){
          const e = enemies[i];
          if(!e.dead && distSq(e.x,e.y,enemy.x,enemy.y) < 160*160) e.armor = Math.min(.44, (e.armor || 0) + .012);
        }
        burst(enemy.x, enemy.y, '#60a5fa', 24, 38);
        ring(enemy.x, enemy.y, enemy.size + 52, '#ef4444');
        impactLabel(enemy.x, enemy.y - enemy.size - 18, '코어 재부팅', '#bfdbfe', 16, 84);
      }
      break;
    }
  }
  if(enemy.stageBoss){
    const armorCap = enemy.bossTier === 'final' ? .42 : .34;
    enemy.armor = Math.min(armorCap, Math.max(0, enemy.armor || 0));
  }
  sound('boss', { intensity: enemy.bossTier === 'final' ? 1.08 : .9 });
  shake = Math.max(shake, enemy.bossTier === 'final' ? 3.2 : 2.4);
}

function blackholePulse(tower,target,st){
  const color=tower.def.color;
  const p = tower.pos;
  const hx = target.x;
  const hy = target.y;
  const dx = hx - p.x;
  const dy = hy - p.y;
  const distToTarget = Math.max(1, Math.sqrt(dx*dx + dy*dy));
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
    tick: 0,
    rewardBonus: st.gold || 0
  });
  pushBeam(p.x,p.y,mx,my,color,9,'voidShot',1.15);
  ring(hx,hy,28 + tower.level * 1.8,color);
  burst(hx,hy,color,14,24);
  if(signatureChance(tower,.10,.012)) triggerVoidCollapse(tower,hx,hy,st);
  playTowerSfx('void', .82);
}

function areaDamage(x,y,r,dmg,source,color,rewardBonus=0){
  const rr = r * r;
  for(let i=0;i<enemies.length;i++){
    const e = enemies[i];
    if(!e.dead && distSq(e.x,e.y,x,y)<=rr) e.damage(dmg,source,color,rewardBonus);
  }
  ring(x,y,r,color);
}
function chain(start,dmg,count,color,markAmp=0,rewardBonus=0){
  let cur=start;
  const stamp = ++chainHitStamp;
  if(chainHitStamp > 1000000000) chainHitStamp = 1;
  const maxChainDistSq = 115 * 115;
  for(let i=0;i<count;i++){
    if(!cur||cur._chainHitStamp===stamp)break;
    cur._chainHitStamp=stamp;cur.damage(dmg*(1-i*.16)*(1+markAmp),'storm',color,rewardBonus);cur.slow=Math.max(cur.slow,25);
    let next=null,best=maxChainDistSq;
    for(let j=0;j<enemies.length;j++){
      const e = enemies[j];
      if(e.dead||e._chainHitStamp===stamp)continue;
      const d=distSq(e.x,e.y,cur.x,cur.y);
      if(d<best){best=d;next=e}
    }
    if(next)pushBeam(cur.x,cur.y,next.x,next.y,color,14,'chain');
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



function updateTacticalCooldowns(dt){
  const cd = S.tacticalCd;
  if(cd){
    if(cd.blackhole>0) cd.blackhole=Math.max(0,cd.blackhole-dt);
    if(cd.nova>0) cd.nova=Math.max(0,cd.nova-dt);
    if(cd.repair>0) cd.repair=Math.max(0,cd.repair-dt);
  }
  if(S.tacticalBoost>0) S.tacticalBoost=Math.max(0,S.tacticalBoost-.004*dt);
}

let summonLastFxAt = 0;
const SUMMON_RAPID_FX_GAP_MS = 260;
const V120_SUMMON_UI_REFRESH_DELAY_MS = 42;
let v120SummonUiRefreshTimer = 0;
function requestSummonUiRefreshV120(){
  // Keep summon input responsive. updateSelected()/updateUI() can touch DOM, hangar
  // state and live thumbnails; doing it inside the pointer/click event can block
  // the next battle RAF frame, which looks like the star layer freezes briefly.
  if(v120SummonUiRefreshTimer) return;
  v120SummonUiRefreshTimer = setTimeout(function(){
    v120SummonUiRefreshTimer = 0;
    requestMergeUiRefresh(false);
  }, V120_SUMMON_UI_REFRESH_DELAY_MS);
}
function summon(typeOverride=null){
  if(S.gameOver) return false;
  const pool = availableSummonTypes();
  // v117: Only honor an explicit tower override. The summon button calls
  // summon() with no argument, and Number(null) becomes 0, which made every
  // normal random summon turn into type 0 (Solar) once Solar was unlocked.
  const hasExplicitTypeOverride = typeOverride !== null && typeOverride !== undefined && typeOverride !== '';
  const preferred = hasExplicitTypeOverride ? Number(typeOverride) : NaN;
  const type = (hasExplicitTypeOverride && Number.isFinite(preferred) && pool.includes(preferred))
    ? preferred
    : pool[Math.floor(Math.random()*pool.length)];
  const cost = currentSummonCost();
  if(S.gold<cost){ toast('수정이 부족합니다'); return false; }

  // v23: rapid tapping the summon button used to allocate a temporary `free[]`
  // array and immediately refresh the side UI every tap.  Pick a random free
  // slot with two cheap scans instead, and batch UI refreshes below.
  let freeCount = 0;
  for(let i=0;i<grid.length;i++) if(!grid[i]&&canBuild(i)) freeCount++;
  if(!freeCount){ toast('배치 가능한 장판이 없습니다'); return false; }
  let pick = Math.floor(Math.random()*freeCount);
  let idx = -1;
  for(let i=0;i<grid.length;i++){
    if(!grid[i]&&canBuild(i)){
      if(pick-- === 0){ idx = i; break; }
    }
  }
  if(idx < 0){ toast('배치 가능한 장판이 없습니다'); return false; }

  grid[idx]=new Planet(type,1,idx);
  invalidateTerrainRenderCache();
  S.runSummons = (S.runSummons || 0) + 1;
  S.gold-=cost;selected=idx;

  const p = center(idx);
  const now = nowForMergeMs();
  const rapid = now - summonLastFxAt < SUMMON_RAPID_FX_GAP_MS;
  summonLastFxAt = now;
  burst(p.x,p.y,PLANETS[type].color,rapid ? 7 : 12,rapid ? 22 : 30);
  if(!rapid) toast(`랜덤 소환 — ${PLANETS[type].name} 착지 완료`);
  // v-summon-audio-off: tower creation can happen rapidly on hold-repeat.
  // Keep the visual feedback/toast, but skip the summon SFX to reduce WebView audio overhead.
  requestSummonUiRefreshV120();
  return true;
}
const MERGE_TERRAIN_PRIORITY = {
  rift:60, amp:52, coil:46, lens:42, mine:34, empty:20,
  hazard_overheat:-12, hazard_weaken:-14, hazard_disrupt:-10, hazard_unstable:-10,
  blocked:-100, path:-100
};
let mergeFocusSession = null;
function mergeAnchorScore(idx, tower){
  if(!tower) return -Infinity;
  const selectedBonus = idx === selected ? 120 : 0;
  const terrainBonus = MERGE_TERRAIN_PRIORITY[effectiveTerrainKey(idx)] ?? 20;
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
let mergeAutoRunActive = false;
const MERGE_VISUAL_COMBO_CAP = 3;
const MERGE_FX_BURST_CAP = 34;
const MERGE_LABEL_EVERY = 4;
const MERGE_UI_REFRESH_INTERVAL_MS = 130;
const MERGE_SOUND_INTERVAL_MS = 120;
let mergeUiRefreshTimer = null;
let mergeLastUiRefreshAt = 0;
let mergeLastSoundAt = 0;
function nowForMergeMs(){ return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
function flushMergeUiRefresh(){
  mergeUiRefreshTimer = null;
  mergeLastUiRefreshAt = nowForMergeMs();
  updateSelected();
  updateUI();
}
function requestMergeUiRefresh(force=false){
  const now = nowForMergeMs();
  const elapsed = now - mergeLastUiRefreshAt;
  if(force || elapsed >= MERGE_UI_REFRESH_INTERVAL_MS){
    if(mergeUiRefreshTimer){ clearTimeout(mergeUiRefreshTimer); mergeUiRefreshTimer = null; }
    flushMergeUiRefresh();
    return;
  }
  if(!mergeUiRefreshTimer){
    mergeUiRefreshTimer = setTimeout(flushMergeUiRefresh, Math.max(16, MERGE_UI_REFRESH_INTERVAL_MS - elapsed));
  }
}
function autoMerge(continueSession=false, runId=null){
  // onclick handlers pass a MouseEvent as the first argument. Treat only the
  // internal recursive call `autoMerge(true, runId)` as a continuation; every
  // user click must start a fresh merge focus session.
  continueSession = continueSession === true;
  if(S.gameOver){ if(!continueSession) mergeAutoRunActive = false; return; }

  if(!continueSession){
    // v23: while the 80ms auto-merge chain is already running, extra rapid taps
    // should not cancel/restart the chain and rescan the whole board.  Absorb
    // those duplicate inputs; the current chain will keep merging normally.
    if(mergeAutoRunActive) return;
    mergeAutoRunActive = true;
    mergeAutoRunId++;
    runId = mergeAutoRunId;
    mergeFocusSession = chooseMergeFocusAnchor();
    if(!mergeFocusSession){
      mergeAutoRunActive = false;
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
      mergeAutoRunActive = false;
      if(!continueSession) toast('병합 가능한 행성이 없습니다');
      return;
    }
    pair = findFocusedMergeStep();
    if(!pair){
      mergeFocusSession = null;
      mergeAutoRunActive = false;
      if(!continueSession) toast('병합 가능한 행성이 없습니다');
      return;
    }
  }

  const a = grid[pair.anchor];
  const b = grid[pair.consume];
  if(!a || !b){ mergeFocusSession = null; mergeAutoRunActive = false; return; }

  grid[pair.anchor] = createMergedPlanet(a,b,pair.anchor);
  grid[pair.consume] = null;
  invalidateTerrainRenderCache();
  selected = mergeFocusSession?.anchor ?? pair.anchor;
  triggerMergeImpact(pair.anchor,a.def.color,a.level+1);
  S.runMerges = (S.runMerges || 0) + 1;
  requestMergeUiRefresh(!continueSession);
  setTimeout(()=>autoMerge(true, runId),80);
}


function tryCreateHiddenPlanet(){
  // v14 safety-pass: keep the exact hidden-planet recipe, but avoid scanning the
  // full grid once per base type. This only runs after board changes / fallback.
  if(S?.hiddenUnlocked) return false;
  if(!hiddenPlanetCheckDirty && (perfFrameId - hiddenPlanetCheckLastFrame) < HIDDEN_PLANET_CHECK_INTERVAL_FRAMES) return false;
  hiddenPlanetCheckDirty = false;
  hiddenPlanetCheckLastFrame = perfFrameId;

  const recipe = new Array(BASE_PLANET_COUNT);
  let matched = 0;
  for(let i=0;i<grid.length;i++){
    const t = grid[i];
    if(!t) continue;
    if(t.type === HIDDEN_PLANET_TYPE) return false;
    const type = Number(t.type);
    if(type >= 0 && type < BASE_PLANET_COUNT && t.level >= 5 && recipe[type] == null){
      recipe[type] = i;
      matched++;
    }
  }
  if(matched < BASE_PLANET_COUNT) return false;

  let sumX = 0, sumY = 0;
  for(let i=0;i<recipe.length;i++){ const c = center(recipe[i]); sumX += c.x; sumY += c.y; }
  const avgX = sumX / recipe.length, avgY = sumY / recipe.length;
  let anchor = recipe[0], best = Infinity;
  for(let i=0;i<recipe.length;i++){
    const idx = recipe[i], c = center(idx);
    const dx = c.x - avgX, dy = c.y - avgY, d = dx*dx + dy*dy;
    if(d < best){ best = d; anchor = idx; }
  }
  for(let i=0;i<recipe.length;i++){ const idx = recipe[i]; if(idx !== anchor) grid[idx] = null; }
  grid[anchor] = new Planet(HIDDEN_PLANET_TYPE, 1, anchor);
  invalidateTerrainRenderCache();
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


function buildEnemyIntroPresentation(enemy){
  if(!enemy || enemy.splitChild) return null;
  const id = enemy.type || '';
  const base = monsterDef(id);
  const stageNo = Number(S?.stageNo || StageMapState.current || 1);
  if(enemy.stageBoss){
    const tierKo = enemy.bossTier === 'final' ? '최종 보스' : '중간 보스';
    const name = enemy.bossKo || enemy.bossName || base.displayName || '보스';
    const skill = bossSkillKo(enemy.abilityName || base.skillName || '보스 스킬');
    const desc = enemy.bossDesc || base.intro || '일반 몬스터보다 체력과 방어력이 높은 강력한 적입니다. 방어선을 길게 활용해 집중 공격해야 합니다.';
    const title = enemy.bossTitle ? `${enemy.bossTitle}입니다. ` : '';
    return {
      key: `stageBoss:${stageNo}:${enemy.bossTier || id}:${name}`,
      id,
      title: `${name} 등장`,
      displayName: name,
      role: tierKo,
      skillName: skill,
      intro: `${title}${desc}`,
      def: {
        color: enemy.auraColor || enemy.color || base.color || '#f8fafc',
        aura: enemy.auraColor || enemy.color || base.color || '#f8fafc',
        size: Math.max(30, Number(enemy.size || base.size || 34)),
        boss: true,
        stageBoss: true,
        treasure: false,
        shieldRatio: enemy.maxShield > 0 ? .25 : 0,
        dodgeChance: 0,
        displayName: name
      }
    };
  }
  if(enemy.boss || base.boss){
    const name = enemy.displayName || base.displayName || '균열 감시자';
    return {
      key: `boss:${id}:${name}`,
      id,
      title: `${name} 등장`,
      displayName: name,
      role: base.role || '보스형',
      skillName: base.skillName || '강화 장갑',
      intro: base.intro || '일반 몬스터보다 체력과 방어력이 높은 보스입니다. 경로 전체에서 오래 공격할 수 있도록 타워를 배치해야 합니다.',
      def: {
        color: enemy.auraColor || enemy.color || base.color || '#fb7185',
        aura: enemy.auraColor || enemy.color || base.color || '#fb7185',
        size: Math.max(28, Number(enemy.size || base.size || 30)),
        boss: true,
        stageBoss: false,
        treasure: !!enemy.treasure,
        shieldRatio: enemy.maxShield > 0 ? .25 : 0,
        dodgeChance: Math.max(0, Number(enemy.dodgeChance || base.dodgeChance || 0)),
        displayName: name
      }
    };
  }
  const def = base;
  if(!def || !def.intro) return null;
  return {
    key: `monster:${id}`,
    id,
    title: `${def.displayName || id} 등장`,
    displayName: def.displayName || id,
    role: def.role || '특수형',
    skillName: def.skillName || '특성 없음',
    intro: def.intro,
    def
  };
}

function showMonsterIntroOnce(enemy){
  const intro = buildEnemyIntroPresentation(enemy);
  if(!intro || !intro.intro || hasMonsterIntroShown(intro.key)) return;
  markMonsterIntroShown(intro.key);
  try{
    const old = document.getElementById('monsterIntroPopup');
    if(old) old.remove();
    const stageNo = Number(S?.stageNo || StageMapState.current || 1);
    const stageCfg = STAGE_MONSTER_POOLS[stageNo] || STAGE_MONSTER_POOLS[1];
    const popup = document.createElement('div');
    popup.id = 'monsterIntroPopup';
    popup.className = intro.def?.stageBoss ? 'monsterIntroPopup monsterIntroBossPopup' : 'monsterIntroPopup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-label', `${intro.displayName || intro.id} 설명`);
    popup.innerHTML = `<div class="monsterIntroCard">
      <div class="monsterIntroKicker">${intro.def?.stageBoss ? 'BOSS SCAN' : 'ENEMY SCAN'} · ${escapeHtml(stageCfg.theme || '성역')}</div>
      <div class="monsterIntroTitle">${escapeHtml(intro.title || `${intro.displayName || intro.id} 등장`)}</div>
      <div class="monsterIntroBody">
        ${monsterIntroPreviewMarkup(intro.id, intro.def)}
        <div class="monsterIntroText">
          <div class="monsterIntroMeta"><span>${escapeHtml(intro.role || '특수형')}</span><span>${escapeHtml(intro.skillName || '특성 없음')}</span></div>
          <p>${escapeHtml(intro.intro)}</p>
        </div>
      </div>
      <button type="button" class="monsterIntroClose" aria-label="몬스터 설명 확인 후 전투 재개">확인</button>
    </div>`;
    document.body.appendChild(popup);
    const previewCanvas = popup.querySelector('.monsterIntroPreviewCanvas');
    if(previewCanvas) renderMonsterIntroPreviewCanvas(previewCanvas, intro.id, intro.def);
    pauseForMonsterIntro();
    const close = () => {
      if(popup && popup.parentNode) popup.remove();
      resumeFromMonsterIntro();
    };
    const btn = popup.querySelector('.monsterIntroClose');
    if(btn){
      btn.onclick = close;
      setTimeout(() => { try{ btn.focus({preventScroll:true}); }catch(_){ try{ btn.focus(); }catch(__){} } }, 0);
    }
  }catch(err){
    try{ resumeFromMonsterIntro(); }catch(_){ }
    console.warn('monster intro popup failed', err);
  }
}

function spawn(entry){
  const enemy = acquireEnemy(entry);
  enemies.push(enemy);
  showMonsterIntroOnce(enemy);
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
    let towerCount = 0;
    for(let i=0;i<grid.length;i++) if(grid[i]) towerCount++;
    const freezeCount=Math.min(3, Math.max(1, Math.ceil(towerCount*.22)));
    for(let i=0;i<freezeCount;i++){
      if(!towerCount) break;
      let nth = Math.floor(Math.random()*towerCount);
      let t = null;
      for(let j=0;j<grid.length;j++){
        if(!grid[j]) continue;
        if(nth-- === 0){ t = grid[j]; break; }
      }
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
    for(let i=0;i<enemies.length;i++){ const e = enemies[i]; if(!e.dead) e.mark=Math.max(e.mark,90); }
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
  // v87: stage-wide cloud/fog overlay removed. Stage effects still apply through gameplay logic.
}

function waveDone(){
  S.active=false;
  const stageBalance = getCommercialStageBalance(S.stageNo || StageMapState.current || 1);
  const waveNo = Number(S.ogge || 1);
  const stageNo = Number(S.stageNo || StageMapState.current || 1);
  const waveRewardScale = economyWaveClearRewardScale(stageNo, waveNo);
  const bonus=Math.max(20, Math.floor((150+S.ogge*24+S.theme*55)*Number(stageBalance.reward_multiplier || 1)*waveRewardScale));
  const hpBeforeRepair = Number(S.hp || 0);
  const waveCoreLoss = coreLossValue(S.resultWaveStartHp || S.maxHp || 0, hpBeforeRepair);
  S.gold+=bonus;
  S.hp=Math.min(S.maxHp,S.hp+S.mods.repair);
  toast(`웨이브 클리어! 수정 +${fmt2(bonus)}`);
  log(`웨이브 클리어 보상: 수정 ${fmt2(bonus)}`);
  recordOfflineWaveProgress();

  if(waveNo >= 10){
    log(`성역 ${stageNo} 클리어 — 유닛 초기화 및 다음 항로 개방`);
    completeStageFromBattle();
    return;
  }

  showSubStageResultOverlay({
    stageNo,
    wave:waveNo,
    kills:Number(S.runKills || 0),
    coreLoss:waveCoreLoss,
    shardsGained:0
  });
}


let backgroundGlowGradient = null;
let backgroundGlowGradientKey = '';
function getBackgroundGlowGradient(color){
  const key = `${W}|${H}|${color}`;
  if(backgroundGlowGradient && backgroundGlowGradientKey === key) return backgroundGlowGradient;
  const g = ctx.createRadialGradient(W/2,H+120,40,W/2,H+120,380);
  g.addColorStop(0,color);
  g.addColorStop(.45,'rgba(56,189,248,.08)');
  g.addColorStop(1,'transparent');
  backgroundGlowGradient = g;
  backgroundGlowGradientKey = key;
  return g;
}
function drawBackground(raw=1){
  const th=theme();
  drawCoverImage(STAGE_BGS[S.theme]);

  // 배경 이미지가 너무 선명하면 유닛/경로 가독성이 떨어져서, 얇은 우주 안개 레이어를 얹습니다.
  ctx.fillStyle='rgba(2,6,23,.10)';
  ctx.fillRect(0,0,W,H);

  // 게임판 내부 전용 별 레이어. 실제 캔버스 안에서 움직이므로 스크린샷처럼 검게 비는 문제가 없습니다.
  updateAndDrawFieldStars(raw);

  ctx.globalAlpha=.12;
  ctx.fillStyle=getBackgroundGlowGradient(th.color);
  ctx.beginPath();
  ctx.arc(W/2,H+120,380,0,TAU);
  ctx.fill();
  ctx.globalAlpha=1;
}
function drawRouteChevron(x, y, angle, size, color, alpha=.48){
  // v13: hot animated route markers no longer use ctx.save/translate/rotate per chevron.
  // Rotate the three local points manually so the visual stays identical while avoiding
  // dozens of canvas state-stack operations per frame on mobile browsers.
  const c = Math.cos(angle), s = Math.sin(angle);
  const ax = -size * .62, ay = -size * .42;
  const bx =  size * .14, by = 0;
  const cx = -size * .62, cy =  size * .42;
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + ax * c - ay * s, y + ax * s + ay * c);
  ctx.lineTo(x + bx * c - by * s, y + bx * s + by * c);
  ctx.lineTo(x + cx * c - cy * s, y + cx * s + cy * c);
  ctx.stroke();

  const iax = -size * .48, iay = -size * .30;
  const ibx =  size * .04, iby = 0;
  const icx = -size * .48, icy =  size * .30;
  ctx.globalAlpha = alpha * .30;
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.lineWidth = 1.05;
  ctx.beginPath();
  ctx.moveTo(x + iax * c - iay * s, y + iax * s + iay * c);
  ctx.lineTo(x + ibx * c - iby * s, y + ibx * s + iby * c);
  ctx.lineTo(x + icx * c - icy * s, y + icx * s + icy * c);
  ctx.stroke();
}

function traceRoutePath(points=null, breaks=null){
  const pts = Array.isArray(points) && points.length >= 2 ? points : route;
  const skip = breaks instanceof Set ? breaks : new Set();
  if(!Array.isArray(pts) || pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for(let i=1;i<pts.length;i++){
    if(skip.has(i-1)) ctx.moveTo(pts[i].x, pts[i].y);
    else ctx.lineTo(pts[i].x, pts[i].y);
  }
}

function lineCross(ax, ay, bx, by){ return ax * by - ay * bx; }

const ROUTE_OFFSET_POINTS_CACHE = new Map();
const ROUTE_SEGMENT_MARKER_CACHE = [];
let routeStaticCacheCanvas = null;
let routeStaticCacheCtx = null;
let routeStaticCacheSig = -1;
let routeStaticCacheDirty = true;
function routeOffsetCacheKey(offset){
  return offset;
}
function clearRouteOffsetCache(){
  ROUTE_OFFSET_POINTS_CACHE.clear();
  ROUTE_SEGMENT_MARKER_CACHE.length = 0;
  routeStaticCacheSig = -1;
  routeStaticCacheDirty = true;
}
function getRouteStaticSignature(){
  let h = 2166136261;
  h = Math.imul(h ^ (W|0), 16777619);
  h = Math.imul(h ^ (H|0), 16777619);
  h = Math.imul(h ^ ((canvas.width || 0)|0), 16777619);
  h = Math.imul(h ^ ((canvas.height || 0)|0), 16777619);
  h = Math.imul(h ^ ((CELL * 100)|0), 16777619);
  h = Math.imul(h ^ ((S?.theme || 0)|0), 16777619);
  h = Math.imul(h ^ ((S?.stageNo || StageMapState?.current || 0)|0), 16777619);
  const paletteCore = (typeof andromedaCombatPalette === 'function' ? andromedaCombatPalette().core : '') || '';
  const color = (theme().color || '#22d3ee') + paletteCore;
  for(let i=0;i<color.length;i++) h = Math.imul(h ^ color.charCodeAt(i), 16777619);
  if(Array.isArray(route)){
    h = Math.imul(h ^ route.length, 16777619);
    for(let i=0;i<route.length;i++){
      const p = route[i] || {x:0,y:0};
      h = Math.imul(h ^ ((p.x * 10)|0), 16777619);
      h = Math.imul(h ^ ((p.y * 10)|0), 16777619);
    }
  }
  return h >>> 0;
}
function ensureRouteMarkerCache(){
  if(ROUTE_SEGMENT_MARKER_CACHE.length || !Array.isArray(route) || route.length < 2) return ROUTE_SEGMENT_MARKER_CACHE;
  const breaks = routeTeleportBreaks instanceof Set ? routeTeleportBreaks : new Set();
  for(let i=0;i<route.length-1;i++){
    if(breaks.has(i)) continue;
    const a = route[i], b = route[i+1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    ROUTE_SEGMENT_MARKER_CACHE.push({a,b,dx,dy,len,angle:Math.atan2(dy, dx),count:Math.max(1, Math.floor(len / 82))});
  }
  return ROUTE_SEGMENT_MARKER_CACHE;
}

function offsetRoutePoints(offset){
  const pts = route || [];
  if(pts.length < 2) return pts.slice();
  const cacheKey = routeOffsetCacheKey(offset);
  const cached = ROUTE_OFFSET_POINTS_CACHE.get(cacheKey);
  if(cached) return cached;

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
  ROUTE_OFFSET_POINTS_CACHE.set(cacheKey, out);
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
  const tNow = visualNowMs || (performance.now ? performance.now() : Date.now());
  const pulse = .44 + Math.sin(tNow / 520) * .12;
  const segments = ensureRouteMarkerCache();
  const drift = (tNow % 2100) / 2100 * .06;
  const markerColor = andromedaCombatPalette().marker;
  for(let i=0;i<segments.length;i++){
    const seg = segments[i];
    const a = seg.a, b = seg.b, count = seg.count;
    for(let j=1;j<=count;j++){
      const t = (j / (count + 1) + drift) % 1;
      drawRouteChevron(a.x + seg.dx * t, a.y + seg.dy * t, seg.angle, 13.5, markerColor, pulse);
    }
  }
}

function andromedaCombatPalette(){
  const st = Number(S?.stageNo || StageMapState?.current || 1);
  // v35 campaign color guard:
  // - Milky Rift battle road remains blue/cyan in the root campaign code.
  // - Andromeda battle road must always read as red/pink so it is never confused with Milky.
  // Stage progression still shifts tone, but stays inside the red/magenta family.
  if(st >= 14){
    return {
      glow:'rgba(255,45,117,.64)', glass0:'rgba(244,63,94,.092)', glass1:'rgba(236,72,153,.126)', glass2:'rgba(168,85,247,.070)',
      rail:'rgba(255,58,137,.94)', railSoft:'rgba(255,236,246,.78)', dash:'rgba(255,225,244,.88)', marker:'#ffe4f7', core:'#ff2f85'
    };
  }
  if(st >= 10){
    return {
      glow:'rgba(236,72,153,.58)', glass0:'rgba(190,24,93,.072)', glass1:'rgba(236,72,153,.108)', glass2:'rgba(168,85,247,.060)',
      rail:'rgba(255,82,170,.90)', railSoft:'rgba(255,232,246,.72)', dash:'rgba(255,218,242,.84)', marker:'#fce7f3', core:'#ec4899'
    };
  }
  if(st >= 6){
    return {
      glow:'rgba(217,70,239,.52)', glass0:'rgba(157,23,77,.058)', glass1:'rgba(217,70,239,.094)', glass2:'rgba(236,72,153,.060)',
      rail:'rgba(232,96,206,.88)', railSoft:'rgba(253,231,255,.70)', dash:'rgba(250,218,255,.84)', marker:'#fae8ff', core:'#d946ef'
    };
  }
  return {
    glow:'rgba(244,63,94,.54)', glass0:'rgba(127,29,29,.054)', glass1:'rgba(244,63,94,.090)', glass2:'rgba(236,72,153,.056)',
    rail:'rgba(255,94,130,.88)', railSoft:'rgba(255,235,239,.70)', dash:'rgba(255,223,230,.84)', marker:'#ffe4e6', core:'#fb4669'
  };
}

function renderStaticRouteLayer(){
  ctx.save();
  ctx.lineCap='round';ctx.lineJoin='round';
  const glowWidth = Math.max(22, CELL*.34);
  const glassWidth = Math.max(13, CELL*.205);
  const railOffset = Math.max(9, CELL*.155);
  const pal = andromedaCombatPalette();
  const variants = activeRouteVariants();
  if(variants.length > 1){
    for(let v=1; v<variants.length; v++){
      const rv = variants[v];
      const pts = rv.points || [];
      const breaks = rv.breaks instanceof Set ? rv.breaks : new Set();
      if(pts.length < 2) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = .56;
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = pal.glow.replace(/,[^)]+\)/, ',.105)');
      ctx.lineWidth = Math.max(17, CELL*.27);
      traceRoutePath(pts, breaks);
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .78;
      ctx.strokeStyle = pal.rail;
      ctx.lineWidth = 2.1;
      traceRoutePath(pts, breaks);
      ctx.stroke();
      ctx.restore();
      if(breaks.size){
        breaks.forEach(function(seg){
          const a = pts[seg], b = pts[seg+1];
          if(!a || !b) return;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = '#f0abfc';
          ctx.shadowColor = '#f0abfc';
          ctx.shadowBlur = 18;
          ctx.lineWidth = 2.2;
          ctx.globalAlpha = .82;
          ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(12, CELL*.22), 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(12, CELL*.22), 0, TAU); ctx.stroke();
          ctx.setLineDash([5, 9]);
          ctx.globalAlpha = .36;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        });
      }
    }
  }

  // premium HUD glow: no more heavy black road fill.
  ctx.globalCompositeOperation = 'screen';
  ctx.shadowColor = pal.glow;
  ctx.shadowBlur = 24;
  ctx.strokeStyle = pal.glow.replace(/,[^)]+\)/, ',.090)');
  ctx.lineWidth = glowWidth;
  traceRoutePath();
  ctx.stroke();

  // very light transparent glass body so the board remains visible under the route.
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  const glass = ctx.createLinearGradient(0,0,W,H);
  glass.addColorStop(0,pal.glass0);
  glass.addColorStop(.45,pal.glass1);
  glass.addColorStop(1,pal.glass2);
  ctx.strokeStyle = glass;
  ctx.lineWidth = glassWidth;
  traceRoutePath();
  ctx.stroke();

  // twin neon rails matching the reference: mostly line + arrow, not a filled road.
  ctx.globalCompositeOperation = 'lighter';
  const primaryHasTeleport = routeTeleportBreaks instanceof Set && routeTeleportBreaks.size > 0;
  if(!primaryHasTeleport){
    drawRouteRail( railOffset, 2.6, pal.rail, .86, 13);
    drawRouteRail(-railOffset, 2.6, pal.rail, .86, 13);
    drawRouteRail( railOffset*.62, 1.0, pal.railSoft, .42, 6);
    drawRouteRail(-railOffset*.62, 1.0, pal.railSoft, .42, 6);
  }else{
    ctx.save();
    ctx.strokeStyle = pal.rail;
    ctx.shadowColor = pal.rail;
    ctx.shadowBlur = 13;
    ctx.lineWidth = 3.2;
    ctx.globalAlpha = .86;
    traceRoutePath(route, routeTeleportBreaks);
    ctx.stroke();
    ctx.restore();
    routeTeleportBreaks.forEach(function(seg){
      const a = route[seg], b = route[seg+1];
      if(!a || !b) return;
      ctx.save();
      ctx.strokeStyle = '#f0abfc';
      ctx.shadowColor = '#f0abfc';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = .92;
      ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(13, CELL*.23), 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(13, CELL*.23), 0, TAU); ctx.stroke();
      ctx.setLineDash([5,10]);
      ctx.globalAlpha = .30;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });
  }

  // subtle corner nodes. Small circular dots keep turns clean instead of creating
  // boxy artifacts on the neon rail corners.
  ctx.globalCompositeOperation = 'lighter';
  for(let i=1;i<route.length-1;i++){
    const p = route[i];
    ctx.save();
    ctx.globalAlpha = .28;
    ctx.fillStyle = pal.marker;
    ctx.shadowColor = pal.core;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.35, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  for(let i=1;i<route.length;i++){
    const p = route[i];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .30;
    ctx.fillStyle = pal.rail;
    ctx.shadowColor = pal.core;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function ensureRouteStaticCache(){
  if(!routeStaticCacheCanvas){
    routeStaticCacheCanvas = document.createElement('canvas');
    routeStaticCacheCtx = routeStaticCacheCanvas.getContext('2d');
  }
  if(routeStaticCacheCanvas.width !== canvas.width || routeStaticCacheCanvas.height !== canvas.height){
    routeStaticCacheCanvas.width = canvas.width;
    routeStaticCacheCanvas.height = canvas.height;
    routeStaticCacheSig = -1;
    routeStaticCacheDirty = true;
  }
  if(!routeStaticCacheDirty && routeStaticCacheSig !== -1) return routeStaticCacheCanvas;
  const sig = getRouteStaticSignature();
  if(sig !== routeStaticCacheSig){
    const oldCtx = ctx;
    ctx = routeStaticCacheCtx;
    ctx.setTransform((canvas.width || W) / Math.max(1, W), 0, 0, (canvas.height || H) / Math.max(1, H), 0, 0);
    ctx.clearRect(0,0,W,H);
    renderStaticRouteLayer();
    ctx = oldCtx;
    routeStaticCacheSig = sig;
  }
  routeStaticCacheDirty = false;
  return routeStaticCacheCanvas;
}
function drawRoute(){
  ctx.save();
  const cached = ensureRouteStaticCache();
  // v20: cached route layer is rendered at backing-store resolution (DPR-scaled).
  // Draw it back into the logical canvas bounds; otherwise mobile/retina browsers
  // display the monster road larger than the live enemies/towers/hover grid.
  if(cached) ctx.drawImage(cached, 0, 0, W, H);

  // animated dotted center guide.
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .34;
  ctx.strokeStyle = andromedaCombatPalette().dash;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([3, 18]);
  ctx.lineDashOffset = -(visualNowMs || 0) / 42;
  traceRoutePath();
  ctx.stroke();
  const dashVariants = activeRouteVariants();
  if(dashVariants.length > 1){
    ctx.globalAlpha = .20;
    for(let v=1; v<dashVariants.length; v++){
      const rv = dashVariants[v];
      traceRoutePath(rv.points, rv.breaks instanceof Set ? rv.breaks : new Set());
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = 'lighter';
  drawRouteSegmentMarkers();
  ctx.restore();
}



function plateColorWithAlpha(raw, alpha){
  if(!raw) return `rgba(103,232,249,${alpha})`;
  const str = String(raw).trim();
  if(str.startsWith('#')){
    let hex = str.slice(1);
    if(hex.length === 3) hex = hex.split('').map(ch=>ch+ch).join('');
    const n = parseInt(hex.slice(0,6), 16);
    if(Number.isFinite(n)){
      const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
  if(str.startsWith('rgba(')) return str.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1,${alpha})`);
  if(str.startsWith('rgb(')) return str.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  return str;
}
function mixColorHex(raw, target, amount){
  function parse(str){
    if(!str) return null;
    str=String(str).trim();
    if(str.startsWith('#')){
      let h=str.slice(1);
      if(h.length===3) h=h.split('').map(ch=>ch+ch).join('');
      const n=parseInt(h.slice(0,6),16);
      if(Number.isFinite(n)) return [(n>>16)&255,(n>>8)&255,n&255];
    }
    const m=str.match(/rgba?\(([^)]+)\)/);
    if(m){
      const parts=m[1].split(',').map(v=>parseFloat(v.trim())).slice(0,3);
      if(parts.length===3 && parts.every(Number.isFinite)) return parts;
    }
    return null;
  }
  const a=parse(raw), b=parse(target || '#67e8f9');
  if(!a||!b) return raw || target || '#67e8f9';
  const t=clamp(Number(amount)||0,0,1);
  const out=a.map((v,i)=>Math.round(v+(b[i]-v)*t));
  return `rgb(${out[0]},${out[1]},${out[2]})`;
}
function neonPlateAccent(raw){
  // Keep the gameplay plate hue, but reduce the solid fill feel and pull it slightly toward route-neon.
  return mixColorHex(raw, '#7deeff', .18);
}
function drawPlateShapePath(x, y, w, h, cut){
  ctx.beginPath();
  ctx.moveTo(x + cut, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + cut);
  ctx.lineTo(x + w, y + h - cut);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h - cut);
  ctx.lineTo(x, y + cut);
  ctx.closePath();
}
function drawPremiumTileBase(c, i, key){
  const pad = Math.max(3, CELL * .04);
  const x = c.x - CELL/2 + pad;
  const y = c.y - CELL/2 + pad;
  const w = CELL - pad*2;
  const h = CELL - pad*2;
  const cut = Math.max(7, CELL * .105);
  const special = isSpecialPlateKey(key);
  const hazard = isHazardPlateKey(key);
  const blocked = key === 'blocked';
  const path = key === 'path';
  const dragActive = !!dragging;
  const occupied = !!(grid && grid[i]);
  if(!dragActive && !occupied && !special && !hazard && !blocked && !path) return;

  const affinity = getPlateAffinity(i);
  const hazardAccent = key === 'hazard_disrupt' ? '#fb923c' : (key === 'hazard_unstable' ? '#f43f5e' : '#ef4444');
  const rawAccent = hazard ? hazardAccent : (special && affinity ? (affinity.color || theme().color) : (key === 'mine' ? '#86efac' : theme().color));
  const accent = special ? neonPlateAccent(rawAccent) : rawAccent;

  ctx.save();
  drawPlateShapePath(x, y, w, h, cut);

  if(path){
    ctx.fillStyle = dragActive ? 'rgba(14,165,233,.070)' : 'rgba(14,165,233,.025)';
  }else if(blocked){
    ctx.fillStyle = 'rgba(2,6,23,.72)';
  }else if(hazard){
    const g = ctx.createLinearGradient(x, y, x+w, y+h);
    g.addColorStop(0, plateColorWithAlpha(rawAccent, .12));
    g.addColorStop(.45, 'rgba(24,8,13,.50)');
    g.addColorStop(1, 'rgba(7,10,24,.68)');
    ctx.fillStyle = g;
  }else if(special){
    // v88: skill plates keep their rule color, but visually move from heavy solid fill
    // to a dimmer monster-route-like neon frame so the board looks cleaner.
    const g = ctx.createLinearGradient(x, y, x+w, y+h);
    g.addColorStop(0, plateColorWithAlpha(rawAccent, .16));
    g.addColorStop(.45, 'rgba(5,14,34,.70)');
    g.addColorStop(.72, plateColorWithAlpha(accent, .075));
    g.addColorStop(1, 'rgba(4,11,28,.78)');
    ctx.fillStyle = g;
  }else{
    ctx.fillStyle = dragActive ? 'rgba(15,23,42,.18)' : 'rgba(15,23,42,.08)';
  }
  ctx.fill();

  // v87: crisp plate frame. Avoid heavy blur/diagonal glass haze so plate text stays sharp.
  drawPlateShapePath(x + .5, y + .5, w - 1, h - 1, Math.max(5, cut - 1));
  ctx.lineWidth = (special || hazard) ? Math.max(1.1, CELL * .015) : (dragActive ? 1 : .6);
  ctx.strokeStyle = (special || hazard) ? plateColorWithAlpha(accent, hazard ? .46 : .58) : (blocked ? 'rgba(148,163,184,.16)' : 'rgba(125,211,252,.10)');
  ctx.shadowColor = (special || hazard) ? plateColorWithAlpha(accent, hazard ? .15 : .30) : 'rgba(0,0,0,0)';
  ctx.shadowBlur = hazard ? 3 : ((special || hazard) ? 8 : 0);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // inner neon route-like line for clarity without changing the rule color.
  if(special || hazard){
    drawPlateShapePath(x + CELL*.08, y + CELL*.08, w - CELL*.16, h - CELL*.16, Math.max(4, cut*.72));
    ctx.lineWidth = Math.max(.85, CELL*.010);
    ctx.strokeStyle = plateColorWithAlpha(accent, hazard ? .24 : .34);
    ctx.stroke();
    ctx.globalAlpha = hazard ? .22 : .36;
    ctx.strokeStyle = hazard ? plateColorWithAlpha('#fecaca', .25) : 'rgba(190,247,255,.46)';
    ctx.setLineDash([Math.max(4,CELL*.08), Math.max(7,CELL*.13)]);
    drawPlateShapePath(x + CELL*.14, y + CELL*.14, w - CELL*.28, h - CELL*.28, Math.max(3, cut*.52));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  if(special){
    const label = plateAffinityName(i).slice(0,4).toUpperCase();
    const symbol = {amp:'DMG',coil:'SPD',lens:'RNG',mine:'ORE',rift:'RFT'}[key] || 'FX';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font=`900 ${Math.max(12.5, CELL*.158)}px Orbitron`;
    ctx.fillStyle=plateColorWithAlpha(accent, .74);
    ctx.shadowColor=plateColorWithAlpha(accent, .34);
    ctx.shadowBlur=7;
    ctx.fillText(symbol, c.x, c.y - CELL*.085);
    ctx.font=`900 ${Math.max(9.8, CELL*.108)}px Orbitron`;
    ctx.fillStyle='rgba(226,246,255,.82)';
    ctx.shadowColor='rgba(2,6,23,.78)';
    ctx.shadowBlur=3;
    if(label) ctx.fillText(label, c.x, c.y + CELL*.17);
    ctx.shadowBlur=0;
  }else if(hazard){
    const symbol = {hazard_overheat:'SPD',hazard_weaken:'DMG',hazard_disrupt:'RNG',hazard_unstable:'CRT'}[key] || '!';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font=`800 ${Math.max(9.2, CELL*.118)}px Orbitron`;
    ctx.fillStyle=plateColorWithAlpha('#fecaca', .58);
    ctx.shadowColor=plateColorWithAlpha(accent, .18);
    ctx.shadowBlur=3;
    ctx.fillText(symbol, c.x, c.y - CELL*.055);
    ctx.font=`800 ${Math.max(7.1, CELL*.076)}px Orbitron`;
    ctx.fillStyle='rgba(254,202,202,.48)';
    ctx.shadowBlur=3;
    ctx.fillText('위험', c.x, c.y + CELL*.18);
    ctx.shadowBlur=0;
  }else if(blocked){
    ctx.fillStyle='rgba(148,163,184,.42)';
    ctx.font=`900 ${Math.max(10, CELL*.14)}px Orbitron`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('×', c.x, c.y);
  }
  ctx.restore();
}

let terrainRenderCacheCanvas = null;
let terrainRenderCacheCtx = null;
let terrainRenderCacheSig = -1;
let terrainRenderCacheDirty = true;
const TERRAIN_RENDER_KEY_HASH = {empty:1,path:2,blocked:3,amp:4,coil:5,lens:6,mine:7,rift:8,hazard_overheat:9,hazard_weaken:10,hazard_disrupt:11,hazard_unstable:12};
function invalidateTerrainRenderCache(){
  terrainRenderCacheSig = -1;
  terrainRenderCacheDirty = true;
  perfActiveTowerCountDirty = true;
  hiddenPlanetCheckDirty = true;
}
function getTerrainRenderSignature(){
  let h = 2166136261;
  h = Math.imul(h ^ (W|0), 16777619);
  h = Math.imul(h ^ (H|0), 16777619);
  h = Math.imul(h ^ ((canvas.width || 0)|0), 16777619);
  h = Math.imul(h ^ ((canvas.height || 0)|0), 16777619);
  h = Math.imul(h ^ (GRID_COLS|0), 16777619);
  h = Math.imul(h ^ (GRID_ROWS|0), 16777619);
  h = Math.imul(h ^ (CELL|0), 16777619);
  h = Math.imul(h ^ (GX|0), 16777619);
  h = Math.imul(h ^ (GY|0), 16777619);
  h = Math.imul(h ^ ((S?.theme || 0)|0), 16777619);
  if(Array.isArray(terrain)){
    h = Math.imul(h ^ terrain.length, 16777619);
    for(let i=0;i<terrain.length;i++) h = Math.imul(h ^ (TERRAIN_RENDER_KEY_HASH[terrain[i]] || 0), 16777619);
  }
  if(Array.isArray(terrainHazards)){
    h = Math.imul(h ^ terrainHazards.length, 16777619);
    for(let i=0;i<terrainHazards.length;i++) h = Math.imul(h ^ ((TERRAIN_RENDER_KEY_HASH[terrainHazards[i]] || 0) + 31), 16777619);
  }
  if(Array.isArray(grid)){
    h = Math.imul(h ^ grid.length, 16777619);
    for(let i=0;i<grid.length;i++){
      const t = grid[i];
      h = Math.imul(h ^ (t ? (((t.type + 1) * 131 + (t.level + 1))|0) : 0), 16777619);
    }
  }
  return h >>> 0;
}
function ensureTerrainRenderCache(){
  if(!terrainRenderCacheCanvas){
    terrainRenderCacheCanvas = document.createElement('canvas');
    terrainRenderCacheCtx = terrainRenderCacheCanvas.getContext('2d');
  }
  if(terrainRenderCacheCanvas.width !== canvas.width || terrainRenderCacheCanvas.height !== canvas.height){
    terrainRenderCacheCanvas.width = canvas.width;
    terrainRenderCacheCanvas.height = canvas.height;
    terrainRenderCacheSig = '';
    terrainRenderCacheDirty = true;
  }
  if(!terrainRenderCacheDirty && terrainRenderCacheSig !== -1) return terrainRenderCacheCanvas;
  const sig = getTerrainRenderSignature();
  if(sig !== terrainRenderCacheSig){
    const oldCtx = ctx;
    ctx = terrainRenderCacheCtx;
    ctx.setTransform((canvas.width || W) / Math.max(1, W), 0, 0, (canvas.height || H) / Math.max(1, H), 0, 0);
    ctx.clearRect(0,0,W,H);
    ctx.save();
    for(let i=0;i<terrain.length;i++){
      const c=center(i), key=terrain[i];
      drawPremiumTileBase(c, i, key);
      const hz = getTerrainHazardKey(i);
      if(hz) drawPremiumTileBase(c, i, hz);
    }
    ctx.restore();
    ctx = oldCtx;
    terrainRenderCacheSig = sig;
  }
  terrainRenderCacheDirty = false;
  return terrainRenderCacheCanvas;
}
function drawTerrain(){
  ctx.save();
  const dragActive = !!dragging;
  if(dragActive){
    for(let i=0;i<terrain.length;i++){
      const c=center(i), key=terrain[i];
      drawPremiumTileBase(c, i, key);
      const hz = getTerrainHazardKey(i);
      if(hz) drawPremiumTileBase(c, i, hz);
    }
  }else{
    const cached = ensureTerrainRenderCache();
    // v20: terrain/plate cache is also DPR-scaled. Keep it in logical W/H
    // coordinates so plates, monster route, enemies and drag hit grid share one scale.
    if(cached) ctx.drawImage(cached, 0, 0, W, H);
  }
  const idx = dragActive ? hoverIdx : -1;
  if(idx>=0){
    const c=center(idx);
    const pad = Math.max(3, CELL * .045);
    const x=c.x-CELL/2+pad, y=c.y-CELL/2+pad, w=CELL-pad*2, h=CELL-pad*2, cut=Math.max(8,CELL*.12);
    ctx.save();
    ctx.lineWidth=2.2;
    ctx.strokeStyle=canBuild(idx)?'rgba(103,232,249,.82)':'rgba(251,113,133,.84)';
    ctx.shadowColor=canBuild(idx)?'rgba(103,232,249,.70)':'rgba(251,113,133,.70)';
    ctx.shadowBlur=14;
    drawPlateShapePath(x,y,w,h,cut);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawCore(){
  const th = theme();
  const color = th.color;
  const nowMs = visualNowMs || 0;
  const stageNo = Number(S?.stageNo || StageMapState?.current || 1) || 1;
  const andromedaFinalCore = isAndromedaRouteStage(stageNo) && stageNo >= 15;
  // v17: final core is intentionally small. The route creates the scale;
  // the core itself should feel like a compact gravity point pulling enemies in.
  const outerR = andromedaFinalCore ? Math.max(28, Math.min(44, CELL * .58)) : 38;
  const innerPolyR = andromedaFinalCore ? outerR * .70 : 34;
  const fillR = andromedaFinalCore ? outerR * .34 : 24;
  ctx.save();
  ctx.translate(CORE.x,CORE.y);
  ctx.shadowColor=color;ctx.shadowBlur=andromedaFinalCore ? 20 : 24;
  if(andromedaFinalCore){
    const pulse = .5 + Math.sin(nowMs / 680) * .5;
    ctx.globalCompositeOperation='screen';
    ctx.strokeStyle='rgba(96,165,250,.34)';
    ctx.lineWidth=3.2;
    ctx.beginPath();ctx.arc(0,0,outerR * 1.92,0,TAU);ctx.stroke();
    ctx.strokeStyle='rgba(236,72,153,.46)';
    ctx.lineWidth=2.2;
    ctx.setLineDash([Math.max(6, CELL*.10), Math.max(9, CELL*.15)]);
    ctx.beginPath();ctx.arc(0,0,outerR * (1.36 + pulse*.045),0,TAU);ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation='source-over';
  }
  ctx.strokeStyle=color;ctx.lineWidth=andromedaFinalCore ? 2.8 : 3;
  ctx.beginPath();ctx.arc(0,0,outerR,0,TAU);ctx.stroke();
  ctx.beginPath();
  for(let i=0;i<6;i++){
    const a=-Math.PI/2+i*TAU/6+nowMs/(andromedaFinalCore ? 1800 : 2400);
    const x=Math.cos(a)*innerPolyR,y=Math.sin(a)*innerPolyR;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();ctx.stroke();
  ctx.fillStyle=andromedaFinalCore ? 'rgba(168,85,247,.13)' : 'rgba(255,255,255,.08)';
  ctx.beginPath();ctx.arc(0,0,fillR,0,TAU);ctx.fill();
  ctx.fillStyle='#fff';
  ctx.font=`900 ${andromedaFinalCore ? Math.max(9, Math.min(12, CELL*.15)) : 10}px Orbitron`;
  ctx.textAlign='center';ctx.fillText('CORE',0,andromedaFinalCore ? 5 : 4);
  ctx.restore();
}
function drawParticles(dt){
  trimFxArray(particles, PERF_MAX_PARTICLES);
  let write = 0;
  for(let i=0;i<particles.length;i++){
    const p=particles[i];
    p.life-=dt;
    if(p.life<=0){ recycleFxItem(p, particles); continue; }
    if(p.ring){
      p.r+=(p.max-p.r)*.12+dt*.4;
      ctx.globalAlpha=clamp(p.life/(p.maxLife||26),0,1);
      ctx.strokeStyle=p.color;ctx.lineWidth=1.7;ctx.shadowColor=p.color;ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.stroke();
      particles[write++] = p;
      continue;
    }
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy*=.98;
    p.rot = (p.rot || 0) + (p.spin || 0) * dt;
    const alpha = clamp(p.life/(p.maxLife||40),0,1);
    const glow = p.glow || p.color;
    const blur = p.blur || 8;
    if(p.type==='spark'){
      // v13: draw rotated spark line by coordinates instead of save/translate/rotate.
      ctx.globalAlpha=alpha;
      ctx.strokeStyle=p.color;ctx.shadowColor=glow;ctx.shadowBlur=blur;
      const len = p.len || 8;
      const half = len * .55;
      const rot = p.rot || 0;
      const c = Math.cos(rot), s = Math.sin(rot);
      ctx.lineCap='round';ctx.lineWidth=p.w || 1.6;
      ctx.beginPath();ctx.moveTo(p.x - c * half, p.y - s * half);ctx.lineTo(p.x + c * half, p.y + s * half);ctx.stroke();
    }else if(p.type==='shard'){
      // v13: manual four-point rotation avoids canvas state-stack churn for impact shards.
      ctx.globalAlpha=alpha;
      ctx.fillStyle=p.color;ctx.shadowColor=glow;ctx.shadowBlur=blur;
      const len = p.len || 8, wide = p.w || 3.4;
      const rot = p.rot || 0;
      const c = Math.cos(rot), s = Math.sin(rot);
      const top = -len*.62, bottom = len*.62;
      ctx.beginPath();
      ctx.moveTo(p.x - top * s, p.y + top * c);
      ctx.lineTo(p.x + wide * c, p.y + wide * s);
      ctx.lineTo(p.x - bottom * s, p.y + bottom * c);
      ctx.lineTo(p.x - wide * c, p.y - wide * s);
      ctx.closePath();
      ctx.fill();
    }else if(p.type==='smoke'){
      ctx.globalAlpha=alpha*.62;
      ctx.shadowColor=glow;ctx.shadowBlur=blur;
      const rr = p.r * (1 + (1 - clamp(p.life/(p.maxLife||30),0,1)) * .65);
      const g = ctx.createRadialGradient(p.x - rr*.25, p.y - rr*.25, 1, p.x, p.y, rr);
      g.addColorStop(0, p.core || 'rgba(255,255,255,.30)');
      g.addColorStop(.55, p.color);
      g.addColorStop(1, 'rgba(15,23,42,0)');
      ctx.fillStyle = g;
      ctx.beginPath();ctx.arc(p.x,p.y,rr,0,TAU);ctx.fill();
    }else{
      ctx.globalAlpha=alpha;
      ctx.fillStyle=p.color;ctx.shadowColor=glow;ctx.shadowBlur=blur;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();
    }
    particles[write++] = p;
  }
  particles.length = write;
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

const ELECTRIC_ARC_CHAIN_OPTIONS = { amplitude: 12, segments: 10, alpha: 1, glow: '#fde047', main: '#fefce8', outerWidth: 4.2, innerWidth: 2.0, blur: 22 };
function drawBeams(dt){
  trimFxArray(beams, PERF_MAX_BEAMS);
  let write = 0;
  for(let i=0;i<beams.length;i++){
    const b=beams[i];b.life-=dt;
    if(b.life<=0){ recycleFxItem(b, beams); continue; }
    // v13: beam rendering sets all state it needs; avoid save/restore per beam.
    const alpha = clamp(b.life/18,0,1);
    if(b.style==='laser'){
      const beamWidth = b.width || 4;
      ctx.globalAlpha=alpha;
      ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(1.8,beamWidth*.38);ctx.shadowColor=b.color;ctx.shadowBlur=20 + beamWidth*1.6;
      ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
      ctx.strokeStyle=b.color;ctx.lineWidth=beamWidth+1;ctx.globalAlpha=alpha*.72;
      ctx.beginPath();ctx.moveTo(b.x1,b.y1);ctx.lineTo(b.x2,b.y2);ctx.stroke();
    }else if(b.style==='chain'){
      ELECTRIC_ARC_CHAIN_OPTIONS.alpha = alpha;
      ELECTRIC_ARC_CHAIN_OPTIONS.glow = b.color;
      drawElectricArc(b.x1, b.y1, b.x2, b.y2, ELECTRIC_ARC_CHAIN_OPTIONS);
      ctx.globalAlpha = alpha * .8;
      ctx.fillStyle = '#fefce8';
      ctx.shadowColor = b.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(b.x2, b.y2, 2.4, 0, TAU); ctx.fill();
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
    beams[write++] = b;
  }
  beams.length = write;
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
}

function drawFloats(dt){
  trimFxArray(floats, PERF_MAX_FLOATS);
  let write = 0;
  ctx.textAlign='center';
  ctx.strokeStyle='rgba(0,0,0,.72)';
  ctx.shadowColor='rgba(0,0,0,.18)';
  ctx.shadowBlur=4;
  for(let i=0;i<floats.length;i++){
    const f=floats[i];f.life-=dt;f.y+=f.vy*dt;
    if(f.life<=0){ recycleFxItem(f, floats); continue; }
    const maxLife = f.maxLife || 70;
    const alpha = clamp(f.life/maxLife,0,1);
    const size = f.size || 12;
    // v13: no transform/composite is used here, so avoid save/restore per floating label.
    ctx.globalAlpha=alpha;
    ctx.fillStyle=f.color;ctx.lineWidth=Math.max(2.2, size*.18);
    ctx.font=`900 ${size}px Orbitron`;
    ctx.strokeText(f.text,f.x,f.y);ctx.fillText(f.text,f.x,f.y);
    floats[write++] = f;
  }
  floats.length = write;
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}
function drawDragging(){
  if(!dragging)return;
  ctx.save();
  const nowMs = visualNowMs || (performance.now ? performance.now() : Date.now());
  const dragAge = Math.max(0, nowMs - (dragging.dragStartedAt || nowMs));
  const ease = 1 - Math.pow(1 - clamp(dragAge / 170, 0, 1), 3);
  const shrink = 1 - .15 * ease;
  ctx.globalAlpha=.58;
  ctx.filter = 'saturate(.62) brightness(.78) contrast(.90)';
  const previewLevel = Math.max(1, Number(dragging.dragPreviewLevel ?? dragging.level ?? 1));
  const previewType = Number.isFinite(dragging.dragPreviewType) ? dragging.dragPreviewType : dragging.type;
  const size = ((IS_MOBILE_BOARD ? 46 : 39) + previewLevel*1.65) * shrink;
  const ok = drawPlanetSprite(previewType, mouse.x, mouse.y, size, currentPlanetFrameIndex(), previewLevel);
  if(!ok){
    const oldType = dragging.type, oldLevel = dragging.level;
    dragging.type = previewType; dragging.level = previewLevel;
    drawProceduralPlanetBody(dragging, mouse.x, mouse.y);
    dragging.type = oldType; dragging.level = oldLevel;
  }
  ctx.filter = 'none';
  ctx.globalAlpha=.28;
  ctx.strokeStyle='rgba(219,234,254,.58)';
  ctx.lineWidth=1.4;
  ctx.beginPath();ctx.ellipse(mouse.x,mouse.y,32*shrink,9*shrink,0,0,TAU);ctx.stroke();
  ctx.restore();
}

function loop(now){
  raf=requestAnimationFrame(loop);
  const raw=clamp((now-last)/16.666,0,3);last=now;
  visualNowMs = now || (performance.now ? performance.now() : Date.now());
  visualNowSec = visualNowMs * 0.001;
  const dt=S.paused?0:raw*S.speed;
  beginVisualFxFrame();
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
  // v25: clear the full logical frame before applying the stage shake transform.
  // Clearing after translate only cleared the shifted rectangle, so thin strips on
  // the opposite edges could keep pixels from the previous frame during shake.
  ctx.clearRect(0,0,W,H);
  if(shake>0){
    // Paint a cheap unshifted backdrop behind the shaking world. This prevents
    // transparent edge gaps while preserving the existing full-map shake effect.
    drawCoverImage(STAGE_BGS[S.theme]);
    ctx.fillStyle='rgba(2,6,23,.10)';
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;
    ctx.shadowBlur=0;
    ctx.setLineDash([]);
    ctx.translate(rand(-shake,shake),rand(-shake,shake));
    shake*=.88;
    if(shake<.3)shake=0;
  }

  drawBackground(raw);drawStageFx();drawDustClouds();drawRoute();drawTerrain();drawCore();

  if(dt>0 && S.hp>0){
    spawnTimer-=dt;
    const interval=Math.max(18,54-S.ogge*1.8-S.theme*3);
    if(S.active&&S.queue.length&&spawnTimer<=0){spawn(S.queue.shift());spawnTimer=interval}
    for(let i=0;i<grid.length;i++){ const t = grid[i]; if(t) t.update(dt); }
    tryCreateHiddenPlanet();
    for(let i=0;i<bullets.length;i++) bullets[i].update(dt);
    let bulletWrite = 0;
    for(let i=0;i<bullets.length;i++){
      const b = bullets[i];
      if(!b.dead) bullets[bulletWrite++] = b;
      else recycleBullet(b);
    }
    bullets.length = bulletWrite;
    for(let i=0;i<enemies.length;i++) enemies[i].update(dt);
    let enemyWrite = 0;
    for(let i=0;i<enemies.length;i++){
      const e = enemies[i];
      if(!e.dead) enemies[enemyWrite++] = e;
      else recycleEnemy(e);
    }
    enemies.length = enemyWrite;
    updateAnomalies(dt);
    updateDustClouds(dt);
    updateStageHazards(dt);
    updateTacticalCooldowns(dt);
    updateComboTimers(dt);
    updateBossTelegraphs(dt);
    if(S.active&&S.queue.length===0&&enemies.length===0)waveDone();
  }

  updateHangarVisuals();
  trimVisualFxBuffers();
  trimAllRenderCachesForPressure(false);
  drawAnomalies();
  for(let i=0;i<grid.length;i++){ const t = grid[i]; if(t) t.draw(); }
  if(enemies.length > 1){
    const sortInterval = enemies.length > 96 ? 3 : (enemies.length > 48 ? 2 : 1);
    if(sortInterval === 1 || enemyDrawSortLastFrame < 0 || (perfFrameId - enemyDrawSortLastFrame) >= sortInterval){
      enemies.sort(ENEMY_DRAW_SORT_BY_Y);
      enemyDrawSortLastFrame = perfFrameId;
    }
  }
  for(let i=0;i<enemies.length;i++) enemies[i].draw();
  drawBossTelegraphs();
  for(let i=0;i<bullets.length;i++) bullets[i].draw();
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

let updateUiLastHangarStateAt = 0;
function updateUI(){
  const currentStageDef = getStageDef(S.stageNo || StageMapState.current || (S.theme + 1));
  const themeName = $('themeName');
  setTextIfChanged(themeName, currentStageDef.ko || currentStageDef.name || theme().ko || theme().name);
  setTitleIfChanged(themeName, `${currentStageDef.stage}. ${currentStageDef.name} / ${currentStageDef.ko}`);
  setTextIfChanged($('stageLabel'), `${currentStageDef.stage}‑${S.ogge}`);
  const stageType = $('stageType');
  const waveLabel = getStageBattleDescription(S.stageNo || StageMapState.current || 1, S.ogge);
  if(stageType){
    setTextIfChanged(stageType, waveLabel);
    setTitleIfChanged(stageType, getStageBattleFullDescription(currentStageDef.stage, S.ogge));
  }
  renderWavePreview();
  setTextIfChanged($('gold'), fmt2(S.gold));
  setTextIfChanged($('hp'), S.coreShield ? `${fmt2(S.hp)}+${fmt2(S.coreShield)}` : fmt2(S.hp));
  setTextIfChanged($('exp'), `${fmt2(S.exp)}/${fmt2(S.nextExp)}`);
  setStyleWidthIfChanged($('expBar'), clamp(S.exp/S.nextExp*100,0,100)+'%');
  setTextIfChanged($('level'), fmt2(S.level));
  setStyleWidthIfChanged($('waveBar'), S.total?Math.floor(S.spawned/S.total*100)+'%':'0%');
  setTextIfChanged($('speedBtn'), `${fmt2(S.speed)}x`);
  setTextIfChanged($('pauseBtn'), '정지');
  setTextIfChanged($('summonBtn'), '소환');
  const globalLine = $('globalEffectLine');
  if(globalLine) setHtmlIfChanged(globalLine, `<b>전역</b>${escapeHtml(globalSkillSummaryText())}`);
  renderOfflineMetaPanelThrottled();
  const now = performance.now ? performance.now() : Date.now();
  if(now - updateUiLastHangarStateAt > 160){
    updateUiLastHangarStateAt = now;
    updateHangarState();
  }
}

function updateSelected(){
  const box=$('selectedText');
  if(!box) return;
  if(selected<0){
    box.innerHTML=`장판을 선택하면 배치 가능 여부와 행성 정보만 표시됩니다.<br><span class="compactHint">일반 스킬은 성역 지도에서 관리됩니다.</span>`;
    updateHangarState();
    return;
  }
  const selectedTerrainKey = effectiveTerrainKey(selected);
  const t=grid[selected], tr=TERRAIN[selectedTerrainKey] || TERRAIN.empty;
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
function floatText(x,y,text,color,size=12,life=54){pushFloat(x,y,(typeof text === 'number' ? fmt2(text) : String(text)),color,size,life,-.52)}
function burst(x,y,color,count,force){
  for(let i=0;i<count;i++){
    const a=Math.random()*TAU,s=rand(.5,force/22);
    if(!pushParticle(x,y,Math.cos(a)*s,Math.sin(a)*s,rand(1.5,3.0),rand(16,38),38,color,'burst')) break;
  }
}
function ring(x,y,r,color){pushParticle(x,y,0,0,2,26,26,color,'burst',{ring:true,max:r})}

function impactLabel(x,y,text,color='#fff',size=18,life=76){
  const adjustedLife = Math.round(life*.86);
  pushFloat(x,y,(typeof text === 'number' ? fmt2(text) : String(text)),color,Math.round(size*.92),adjustedLife,-.48);
}
function terrainSpecialChanceMultiplier(tower){
  if(!tower || !terrain) return 1;
  const b = TERRAIN_BONUS_BY_KEY[terrain[tower.idx]] || TERRAIN_BONUS_DEFAULT;
  return Number(b.specialChanceMul || 1) || 1;
}
function signatureChance(tower,base=.10,perLevel=.012){
  const specialMul = terrainSpecialChanceMultiplier(tower);
  return Math.random() < Math.min(.38, (base + tower.level * perLevel) * specialMul);
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
    // v36: hide the floating `KILL xN` combo text. Combo tracking/rewards remain unchanged.
    if(S.combo.kills % 5 === 0){
      const rawBonus = Math.min(38, 5 + Math.floor(S.combo.kills * 1.35));
      const bonus = Math.floor(rawBonus * economyComboRewardScale(S.stageNo || StageMapState.current || 1, S.ogge || 1));
      if(bonus > 0){
        S.gold += bonus;
        impactLabel(enemy.x, enemy.y-enemy.size-34, `COMBO +${fmt2(bonus)}`, '#facc15', 13, 62);
        log(`킬 콤보 보너스: x${fmt2(S.combo.kills)} / 수정 +${fmt2(bonus)}`);
      }
    }
  }
}
function triggerMergeImpact(idx,color,level){
  if(!S.mergeCombo) S.mergeCombo={count:0,timer:0};
  S.mergeCombo.count = (S.mergeCombo.timer>0 ? S.mergeCombo.count : 0) + 1;
  S.mergeCombo.timer = 165;
  const combo = S.mergeCombo.count;
  const visualCombo = Math.min(MERGE_VISUAL_COMBO_CAP, combo);
  const p = center(idx);

  // v22: rapid auto-merge can fire every 80ms.  Keep the same merge reward and
  // feedback, but cap the visual burst/labels so floating texts and particles do
  // not pile up across dozens of merges and stall mobile browsers.
  burst(p.x,p.y,color,Math.min(MERGE_FX_BURST_CAP, 18 + visualCombo*5),28 + visualCombo*3);
  ring(p.x,p.y,42 + level*3 + visualCombo*3,color);
  ring(p.x,p.y,20 + visualCombo*3,'#ffffff');

  const showMergeLabel = combo <= 2 || combo % MERGE_LABEL_EVERY === 0;
  if(showMergeLabel){
    impactLabel(p.x,p.y-38,combo>=2?`MERGE x${fmt2(combo)}`:'MERGE',color,15+Math.min(4,visualCombo*1.2),48);
  }

  if(combo>=3){
    // v-economy-balance: merging already upgrades firepower and compresses the board.
    // Do not return crystal here; otherwise late-game summon/merge loops snowball too easily.
    if(combo === 3 || combo % 5 === 0){
      log(`병합 콤보: x${fmt2(combo)} / 보상 없음`);
    }
  }
  shake=Math.max(shake,6 + Math.min(10,visualCombo*2));
  flash=Math.max(flash,.045);
  const now = nowForMergeMs();
  if(now - mergeLastSoundAt >= MERGE_SOUND_INTERVAL_MS){
    mergeLastSoundAt = now;
    sound('merge');
  }
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
  areaDamage(target.x,target.y,r,dmg*.55,'solar_nova','#fb923c',st.gold);
  burst(target.x,target.y,'#fb923c',9,18);
  spawnImpactSparks(target.x,target.y,'#fdba74',10,1.15);
  impactLabel(target.x,target.y-target.size-16,'NOVA SPLASH','#fed7aa',15,62);
  shake=Math.max(shake,6);
}
function triggerFrostShatter(tower,target,st,dmg){
  areaDamage(target.x,target.y,42+tower.level*2.0,dmg*.42,'frost_shatter','#bfdbfe',st.gold);
  burst(target.x,target.y,'#bfdbfe',7,12); spawnImpactShards(target.x,target.y,'#dbeafe',9);
  impactLabel(target.x,target.y-target.size-16,'SHATTER','#dbeafe',14,60);
  flash=Math.max(flash,.045);
}
function triggerStormOverload(tower,target,st,dmg,chainCount){
  chain(target,dmg*.52,Math.max(2,Math.floor(chainCount*.7)),tower.def.color,st.markAmp,st.gold);
  ring(target.x,target.y,34+tower.level*1.0,tower.def.color);
  spawnImpactSparks(target.x,target.y,'#fde047',11,1.1);
  impactLabel(target.x,target.y-target.size-16,'OVERLOAD','#fde047',14,60);
  shake=Math.max(shake,5);
}
function triggerSporeCloud(tower,target,st,dmg){
  const r=68+tower.level*1.6;
  const rSq = r * r;
  for(let i=0;i<enemies.length;i++){
    const e = enemies[i];
    if(e.dead) continue;
    if(distSq(e.x,e.y,target.x,target.y)<rSq){
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
  areaDamage(x,y,r,st.dmg*.48,'void_collapse',tower.def.color,st.gold);
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
  const cw = Number(canvas.__logicalWidth || W) || 748;
  const ch = Number(canvas.__logicalHeight || H) || 708;
  const canvasAspect = cw / Math.max(1, ch);
  const rectAspect = r.width / Math.max(1, r.height);

  let contentLeft = r.left;
  let contentTop = r.top;
  let contentWidth = r.width;
  let contentHeight = r.height;

  const objectFit = getComputedStyle(canvas).objectFit;
  const shouldPreserveAspect = objectFit === 'contain' || objectFit === 'scale-down';

  if(shouldPreserveAspect){
    if(rectAspect > canvasAspect){
      contentHeight = r.height;
      contentWidth = contentHeight * canvasAspect;
      contentLeft = r.left + (r.width - contentWidth) / 2;
    }else{
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
  if(!isCanvasClientPoint(e)){
    hoverIdx = -1;
    dragHoverTargetIdx = -1;
    dragHoverTargetStartedAt = 0;
    return -1;
  }
  mouse = pos(e);
  hoverIdx = idxAt(mouse.x, mouse.y);
  if(dragging && hoverIdx >= 0 && grid && grid[hoverIdx]){
    if(dragHoverTargetIdx !== hoverIdx){
      dragHoverTargetIdx = hoverIdx;
      dragHoverTargetStartedAt = performance.now();
    }
  }else{
    dragHoverTargetIdx = -1;
    dragHoverTargetStartedAt = 0;
  }
  return hoverIdx;
}
function clearHover(){ hoverIdx = -1; dragHoverTargetIdx = -1; dragHoverTargetStartedAt = 0; }
function onDown(e){
  e.preventDefault();
  const idx=syncHoverFromPointer(e);
  if(idx>=0&&grid[idx]){
    dragging=grid[idx];
    dragging.original=idx;
    dragging.dragPreviewType=dragging.type;
    dragging.dragPreviewLevel=Math.max(1, Number(dragging.level||1));
    dragging.dragStartedAt=performance.now();
    grid[idx]=null;
    invalidateTerrainRenderCache();
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
  let settleIdx = original;
  if(idx>=0&&canBuild(idx)){
    const target=grid[idx];
    if(target&&target.type===dragging.type&&target.level===dragging.level&&target.level<12){
      grid[idx]=createMergedPlanet(target,dragging,idx);
      selected=idx;settleIdx=idx;triggerMergeImpact(idx,target.def.color,target.level+1);
    }else if(!target){
      dragging.idx=idx;grid[idx]=dragging;selected=idx;settleIdx=idx;
    }else{
      grid[original]=dragging;selected=original;settleIdx=original;
    }
  }else{
    grid[original]=dragging;selected=original;settleIdx=original;
  }
  invalidateTerrainRenderCache();
  if(grid[settleIdx]) grid[settleIdx].dragSettleAt = performance.now();
  delete dragging.original;
  delete dragging.dragPreviewType;
  delete dragging.dragPreviewLevel;
  delete dragging.dragStartedAt;
  dragging=null;
  dragHoverTargetIdx = -1;
  dragHoverTargetStartedAt = 0;
  updateSelected();updateUI();
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
  if(window.NativeAudioBridge?.isAvailable?.()){
    requestNativeAudioReady();
    window.NativeAudioBridge.preload(NATIVE_AUDIO_PRELOAD_KEYS);
    window.NativeAudioBridge.setMuted(false);
  }
  // v32: do not create/resume AudioContext just to play BGM.
  // WebAudio is kept lazy and only used for rare important cues.
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
  if(window.NativeAudioBridge?.isAvailable?.()) return;
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
  // Expo WebView에서는 tower synth(WebAudio) 생성 자체를 막고, 호출부의 sound('shot'/'beam'/'boss')가 native SFX로 전달되게 둔다.
  if(window.NativeAudioBridge?.isAvailable?.()) return;
  // v32: the visible slowdown was triggered when BGM enabled all high-frequency
  // tower attack synth sounds. Normal attack SFX are cosmetic, so combat keeps
  // BGM and important cues while skipping repeated synth creation.
  if((audio?.perfMode || isCombatAudioSafeMode()) && kind !== 'boss') return;
  const stamp = performance.now();
  const last = towerSfxLimiter[kind] || 0;
  const gap = (audio?.perfMode || isCombatAudioSafeMode()) ? 420 : 180;
  if(stamp - last < gap) return;
  towerSfxLimiter[kind] = stamp;
  synthShot(kind, Math.min(1, intensity));
}

function playBgmSrc(src, volume=.30){
  if(!audio || !audio.on || !src) return;
  if(playNativeBgmBySrc(src, volume)) return;
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
  if(window.NativeAudioBridge?.isAvailable?.()) window.NativeAudioBridge.pause(undefined, {category:'bgm'});
  if(audio && audio.bgm) audio.bgm.pause();
}

function trackOneShotAudio(a){
  if(!a) return a;
  pruneActiveOneShotAudio(true);
  if(activeOneShotAudio.size >= AUDIO_PERF_POLICY.maxActiveOneShots){
    // Drop the oldest cosmetic sound clone instead of letting audio nodes pile up.
    const first = activeOneShotAudio.values().next().value;
    if(first){
      try{ first.pause(); first.currentTime = 0; }catch(_){}
      activeOneShotAudio.delete(first);
    }
  }
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
    if(window.NativeAudioBridge?.isAvailable?.()) window.NativeAudioBridge.stop(undefined, {category:'all'});
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
  const minGap = SOUND_MIN_GAP[type] || 260;
  pruneActiveOneShotAudio();
  if(now - (soundLimiter[type] || 0) < minGap) return;
  soundLimiter[type] = now;
  if(playNativeSfx(type, opts)) return;
  if((audio.perfMode || isCombatAudioSafeMode()) && !SOUND_IMPORTANT_TYPES.has(type)) return;
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
  if(label) label.textContent = TEST_MODE_CONFIG.enabled ? 'TEST MODE · ANDROMEDA TRACE · ACTIVE CAMPAIGN' : 'ANDROMEDA TRACE · ACTIVE CAMPAIGN';
  if(sub) sub.textContent = TEST_MODE_CONFIG.enabled ? '테스트 모드로 안드로메다 균열 은하에 진입합니다.' : '현재는 안드로메다 소용돌이 항로만 개방되어 있습니다.';
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
  if(title) title.textContent = 'ANDROMEDA TRACE';
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
      toast('아직 미개방 은하입니다. 현재는 ANDROMEDA TRACE만 입장 가능합니다.');
      return false;
    };
  });
}

function stageFlowOwnsMapEvents(){
  return !!(window.PRD_STAGE_FLOW_CONTROLLER_ACTIVE || window.PRD_DISABLE_LEGACY_FLOW_HANDLERS || window.PRD_STAGE_FLOW);
}
window.PRD_STAGE_FLOW_OWNS_MAP_EVENTS = stageFlowOwnsMapEvents;

$('startBtn').onclick=()=>{
  if(stageFlowOwnsMapEvents()) return;
  setTestModeEnabled(false);
  loadOfflineMeta();
  loadStageMapProgress();
  bindGalaxyMapClean();
  showGalaxyMapClean();
};

$('testModeBtn').onclick=()=>{
  if(stageFlowOwnsMapEvents()) return;
  loadOfflineMeta();
  loadStageMapProgress();
  applyTestModeOverrides();
  renderOfflineMetaPanel();
  bindGalaxyMapClean();
  showGalaxyMapClean();
  toast('TEST MODE 활성화 — 모든 성역과 기본 타워가 해금되었습니다');
};

$('stageMapBack').onclick=()=>{
  if(stageFlowOwnsMapEvents()) return;
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
  if(stageFlowOwnsMapEvents()) return;
  $('stageMap').style.display='none';
  bindGalaxyMapClean();
  showGalaxyMapClean();
};

$('stageEnterBtn').onclick=()=>{
  if(stageFlowOwnsMapEvents()) return;
  startSelectedStageFromMap();
};
if($('runLogBtn')) $('runLogBtn').onclick = showBattleLogSummary;

document.querySelectorAll('#stageMap .stageNode').forEach(node => {
  node.addEventListener('click', () => {
    if(stageFlowOwnsMapEvents()) return;
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
  if(stageFlowOwnsMapEvents()) return;
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


/* v230: Native pause dialog inside the main game script.
   Previous pause patches were appended outside this script, so they could not access
   the lexical battle state object `S`. This one is intentionally placed here. */
function ensureNativePauseDialog(){
  let overlay = $('pauseDecisionOverlayNative');
  if(overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'pauseDecisionOverlayNative';
  overlay.setAttribute('aria-hidden','true');
  overlay.style.cssText = [
    'position:fixed','inset:0','z-index:999999','display:none','align-items:center','justify-content:center',
    'padding:24px','background:radial-gradient(circle at 50% 35%, rgba(34,211,238,.14), rgba(2,6,23,.82) 46%, rgba(0,0,0,.90))',
    'backdrop-filter:blur(7px)','-webkit-backdrop-filter:blur(7px)','pointer-events:auto'
  ].join(';');
  overlay.innerHTML = `
    <div class="nativePauseCard" role="dialog" aria-modal="true" aria-labelledby="nativePauseTitle" style="
      width:min(420px, calc(100vw - 32px));
      border-radius:26px;
      padding:26px 22px 20px;
      border:1px solid rgba(125,211,252,.36);
      background:linear-gradient(180deg, rgba(15,23,42,.96), rgba(2,6,23,.98));
      box-shadow:0 28px 90px rgba(0,0,0,.58), 0 0 38px rgba(34,211,238,.18), inset 0 0 0 1px rgba(255,255,255,.05);
      text-align:center;
      color:#e5f7ff;
      font-family:Pretendard, system-ui, sans-serif;
    ">
      <div style="font:900 11px Orbitron, sans-serif;letter-spacing:.24em;color:#67e8f9;text-shadow:0 0 12px rgba(103,232,249,.58);">BATTLE PAUSED</div>
      <h2 id="nativePauseTitle" style="margin:10px 0 8px;font:900 26px Orbitron, Pretendard, sans-serif;color:#fff;">일시정지</h2>
      <p style="margin:0 0 18px;line-height:1.55;color:#cbd5e1;font-size:14px;">전투가 멈췄습니다. 계속 진행하거나 이전 페이지로 이동할 수 있습니다.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button id="pauseExitBtnNative" type="button" style="height:48px;border:0;border-radius:16px;cursor:pointer;font:900 14px Pretendard, sans-serif;color:#fff;background:linear-gradient(180deg,#7f1d1d,#450a0a);box-shadow:0 12px 26px rgba(127,29,29,.28), inset 0 0 0 1px rgba(255,255,255,.1);">이전 페이지로 이동</button>
        <button id="pauseResumeBtnNative" type="button" style="height:48px;border:0;border-radius:16px;cursor:pointer;font:900 14px Pretendard, sans-serif;color:#04111f;background:linear-gradient(180deg,#67e8f9,#22d3ee);box-shadow:0 12px 26px rgba(34,211,238,.28), inset 0 0 0 1px rgba(255,255,255,.24);">계속 진행하기</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const resume = $('pauseResumeBtnNative');
  const exit = $('pauseExitBtnNative');
  if(resume) resume.onclick = resumeNativePauseDialog;
  if(exit) exit.onclick = exitNativePauseDialog;
  return overlay;
}
function hideNativePauseDialog(){
  const overlay = $('pauseDecisionOverlayNative');
  if(!overlay) return;
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('native-pause-open','prd-pause-v29-open','prd-pause-menu-open');
}
function showNativePauseDialog(ev){
  if(ev){
    ev.preventDefault();
    ev.stopPropagation();
    if(typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
  }
  if(!S || S.gameOver) return false;
  S.paused = true;
  S.skillModalOpen = false;
  hidePlanetDetail();
  const overlay = ensureNativePauseDialog();
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('native-pause-open');
  try{ updateUI(); }catch(err){ console.warn('pause ui update failed', err); }
  const resume = $('pauseResumeBtnNative');
  if(resume) setTimeout(()=>resume.focus(), 0);
  return false;
}
function resumeNativePauseDialog(ev){
  if(ev){ ev.preventDefault(); ev.stopPropagation(); }
  hideNativePauseDialog();
  if(!S || S.gameOver) return false;
  S.paused = false;
  try{ updateUI(); }catch(err){ console.warn('pause resume ui update failed', err); }
  return false;
}
function clearCombatHiddenMapElementV21(el){
  if(!el) return;
  if(el.dataset && el.dataset.v19CombatHidden === '1'){
    delete el.dataset.v19CombatHidden;
    delete el.dataset.v19PrevDisplay;
    delete el.dataset.v19PrevDisplayPriority;
    delete el.dataset.v19PrevVisibility;
    delete el.dataset.v19PrevVisibilityPriority;
    delete el.dataset.v19PrevOpacity;
    delete el.dataset.v19PrevOpacityPriority;
    delete el.dataset.v19PrevPointerEvents;
    delete el.dataset.v19PrevPointerEventsPriority;
  }
  try{
    el.style.removeProperty('display');
    el.style.removeProperty('visibility');
    el.style.removeProperty('opacity');
    el.style.removeProperty('pointer-events');
  }catch(err){}
}
function hideAllPauseOverlaysV21(){
  hideNativePauseDialog();
  ['pauseDecisionOverlayV29','pauseDecisionOverlayV27','pauseDecisionOverlay'].forEach(id => {
    const el = $(id);
    if(!el) return;
    el.classList.remove('is-open','open');
    el.setAttribute('hidden','');
    el.setAttribute('aria-hidden','true');
    if(id === 'pauseDecisionOverlayNative') el.style.display = 'none';
  });
  document.body.classList.remove('native-pause-open','prd-pause-v29-open','prd-pause-menu-open');
}
function forceStageMapScreenFromBattleV21(){
  ['menu','galaxyMap','stageMap','v274GalaxyActionDock','v274StageActionDock','v274MapInfoOverlay'].forEach(id => clearCombatHiddenMapElementV21($(id)));
  const body = document.body;
  if(body && body.classList){
    body.classList.remove('prd-combat-ui-active','prd-battle-active','prd-combat-screen-active','native-pause-open','prd-pause-v29-open','prd-pause-menu-open','prd-stage-entering');
    body.classList.add('prd-map-ui-active');
  }
  const game = $('game');
  const menu = $('menu');
  const galaxy = $('galaxyMap');
  const stage = $('stageMap');
  if(game){
    game.style.setProperty('display', 'none', 'important');
    game.classList.remove('prd-combat-ui-active');
  }
  if(menu) menu.style.setProperty('display', 'none', 'important');
  if(galaxy){
    galaxy.style.setProperty('display', 'none', 'important');
    galaxy.classList.remove('cleanVisible');
  }
  if(stage){
    stage.style.setProperty('display', 'block', 'important');
    stage.style.setProperty('visibility', 'visible', 'important');
    stage.style.setProperty('opacity', '1', 'important');
    stage.style.setProperty('pointer-events', 'auto', 'important');
    stage.classList.add('premiumStage');
  }
}
function returnToStageMapFromBattleV21(){
  hideAllPauseOverlaysV21();
  try{ cancelAnimationFrame(raf); }catch(err){}
  if(S){
    S.paused = true;
    S.active = false;
    S.skillModalOpen = false;
    S.queue = [];
    S.gameOver = false;
    S.gameOverOverlayRequested = false;
    S.gameOverOverlayShown = false;
    S.runEnded = true;
  }
  try{ removeGameOverOverlay(); }catch(err){}
  try{ recycleAllEnemies(); recycleAllBullets(); enemies = []; bullets = []; beams = []; particles = []; floats = []; }catch(err){}
  try{ stopAllGameAudio(); }catch(err){}
  try{ reset(); }catch(err){ console.warn('pause exit reset failed', err); }
  try{ resetBattleUnitsForStageMap(); }catch(err){ console.warn('pause exit unit reset failed', err); }
  forceStageMapScreenFromBattleV21();
  try{ renderStageMap(); }catch(err){ console.warn('pause exit map render failed', err); }
  try{ if(audio && audio.on) playMapBgm(); }catch(err){}
  try{ if(typeof refreshScreenStarfields === 'function') refreshScreenStarfields(); }catch(err){}
  const hint = $('stageHint');
  if(hint) hint.textContent = '전투를 중단하고 성역 지도로 돌아왔습니다.';
  setTimeout(() => forceStageMapScreenFromBattleV21(), 0);
  setTimeout(() => { forceStageMapScreenFromBattleV21(); try{ renderStageMap(); }catch(err){} }, 120);
  return false;
}
if(typeof window !== 'undefined') window.PRD_FORCE_STAGE_MAP_FROM_BATTLE_V21 = returnToStageMapFromBattleV21;
function exitNativePauseDialog(ev){
  if(ev){ ev.preventDefault(); ev.stopPropagation(); }
  return returnToStageMapFromBattleV21();
}
function isNativePauseTarget(target){
  return !!(target && target.closest && target.closest('#pauseBtn'));
}
function nativePauseClickCapture(ev){
  if(isNativePauseTarget(ev.target)) showNativePauseDialog(ev);
}
function nativePauseKeyCapture(ev){
  if(ev.repeat) return;
  if(ev.code === 'Space' && $('game') && $('game').style.display !== 'none') showNativePauseDialog(ev);
}
try{
  window.addEventListener('click', nativePauseClickCapture, true);
  window.addEventListener('keydown', nativePauseKeyCapture, true);
}catch(err){ console.warn('native pause capture hook failed', err); }

$('summonBtn').onclick=summon;
$('mergeBtn').onclick=()=>autoMerge();
$('speedBtn').onclick=()=>{S.speed=S.speed===1?2:S.speed===2?3:1;updateUI()};
$('pauseBtn').onclick=showNativePauseDialog;

/* v96: export direct combat command functions for mobile WebView touch bridges.
   The command buttons live inside closure-owned game logic.  Calling DOM click()
   from late HUD/proxy patches can be swallowed by capture listeners, so the final
   mobile bridge calls these functions directly instead. */
window.PRD_GAME_COMMANDS_V96 = {
  summon(){ return summon(); },
  merge(){ return autoMerge(false, null); },
  speed(){ S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 3 : 1; updateUI(); return S.speed; },
  pause(ev){ return showNativePauseDialog(ev || null); },
  relayout(reason='v96-direct-relayout'){
    try{ configureBattleBoardForCurrentLayout(reason); }catch(err){ console.warn('v96 configure failed', err); }
    try{ makeRoute(); makeTerrain(); relocateInvalidPlanets(); buildFieldStars(); }catch(err){ console.warn('v96 route relayout failed', err); }
    return {speed:S.speed, gold:S.gold, stage:S.stageNo, wave:S.ogge};
  },
  debug(){
    return {speed:S.speed, gold:S.gold, hp:S.hp, active:S.active, paused:S.paused, gameOver:S.gameOver, stage:S.stageNo, wave:S.ogge, statusTopOffset:syncBattleStatusTopOffsetV99('debug')};
  },
  statusTopOffset(){ return syncBattleStatusTopOffsetV99('api'); }
};
function syncAudioControl(){
  const btn = $('audioBtn');
  if(!btn) return;
  const on = !!(audio && audio.on);
  if(window.NativeAudioBridge?.isAvailable?.()) window.NativeAudioBridge.setMuted(!on);
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

window.addEventListener('resize', () => { syncBattleStatusTopOffsetV99('resize'); resizeStarfield(); refreshScreenStarfields(); });
if(window.visualViewport){
  window.visualViewport.addEventListener('resize', () => { syncBattleStatusTopOffsetV99('visualViewport-resize'); }, {passive:true});
  window.visualViewport.addEventListener('scroll', () => { syncBattleStatusTopOffsetV99('visualViewport-scroll'); }, {passive:true});
}
window.addEventListener('orientationchange', () => { setTimeout(() => syncBattleStatusTopOffsetV99('orientationchange'), 80); }, {passive:true});

window.addEventListener('keydown',e=>{
  if(e.repeat)return;
  if(e.code==='Space'){showNativePauseDialog(e);return}
  if(e.key==='1')summon();
  if(e.key==='2'){S.speed=S.speed===1?2:S.speed===2?3:1;updateUI()}
  if(e.key.toLowerCase()==='m')autoMerge();
  // Q/W/E 액티브 스킬 단축키는 전투 UI 단순화를 위해 비활성화
});



/* =========================================================
   Offline Mastery Patch v2
   - 3-star stage mastery and offline ending loop.
   ========================================================= */
const STAGE_MASTERY_GOALS = {"1":["4-1 성역 10웨이브 클리어","코어 HP 53% 이상으로 클리어","코어 HP 80% 이상으로 클리어"],"2":["4-2 성역 10웨이브 클리어","코어 HP 51% 이상으로 클리어","코어 HP 78% 이상으로 클리어"],"3":["4-3 성역 10웨이브 클리어","코어 HP 49% 이상으로 클리어","코어 HP 76% 이상으로 클리어"],"4":["4-4 성역 10웨이브 클리어","코어 HP 47% 이상으로 클리어","코어 HP 74% 이상으로 클리어"],"5":["4-5 성역 10웨이브 클리어","코어 HP 45% 이상으로 클리어","코어 HP 72% 이상으로 클리어"],"6":["5-1 성역 10웨이브 클리어","코어 HP 43% 이상으로 클리어","코어 HP 70% 이상으로 클리어"],"7":["5-2 성역 10웨이브 클리어","코어 HP 41% 이상으로 클리어","코어 HP 68% 이상으로 클리어"],"8":["5-3 성역 10웨이브 클리어","코어 HP 39% 이상으로 클리어","코어 HP 66% 이상으로 클리어"],"9":["5-4 성역 10웨이브 클리어","코어 HP 37% 이상으로 클리어","코어 HP 64% 이상으로 클리어"],"10":["5-5 성역 10웨이브 클리어","코어 HP 35% 이상으로 클리어","코어 HP 62% 이상으로 클리어"],"11":["6-1 성역 10웨이브 클리어","코어 HP 33% 이상으로 클리어","코어 HP 60% 이상으로 클리어"],"12":["6-2 성역 10웨이브 클리어","코어 HP 31% 이상으로 클리어","코어 HP 58% 이상으로 클리어"],"13":["6-3 성역 10웨이브 클리어","코어 HP 29% 이상으로 클리어","코어 HP 56% 이상으로 클리어"],"14":["6-4 성역 10웨이브 클리어","코어 HP 27% 이상으로 클리어","코어 HP 54% 이상으로 클리어"],"15":["6-5 성역 10웨이브 클리어","코어 HP 25% 이상으로 클리어","코어 HP 52% 이상으로 클리어"]};
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
  overlay.innerHTML = `<div class="offlineGuideCard"><h2>COMMAND BRIEFING</h2><p>이 게임은 온라인 과금형이 아니라, 성역을 깨며 타워와 영구 강화를 모으는 오프라인 로그라이트 디펜스입니다.</p><div class="offlineGuideGrid"><div class="offlineGuideItem"><b>1. 스테이지 보상</b><span>성역을 클리어하면 그 성역의 전용 타워가 해금됩니다.</span></div><div class="offlineGuideItem"><b>2. 실패 보상</b><span>실패해도 성흔 조각을 얻고, 조각으로 영구 강화를 올립니다.</span></div><div class="offlineGuideItem"><b>3. 3성 숙련도</b><span>코어 HP를 많이 남기고 클리어할수록 별이 올라갑니다.</span></div><div class="offlineGuideItem"><b>4. 최종 목표</b><span>15개 안드로메다 성역을 정화하고 모든 소용돌이 노드 3성을 노리는 것이 1차 목표입니다.</span></div></div><div class="offlineGuideActions"><button id="offlineGuideClose" class="btnGreen">시작하기</button></div></div>`;
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
  overlay.innerHTML = `<div class="offlineGuideCard"><h2>SEASON 1 CLEAR</h2><p>안드로메다의 잔향이 안정화되었습니다. 균열은 완전히 사라지지 않았지만, 지휘관은 이제 안드로메다 전역의 병기를 묶은 별자리 연합 함대를 완성했습니다.</p><p><b>현재 성역 숙련도:</b> ${fmt2(totalStars)}/${fmt2(STAGE_MAP_DEFS.length * 3)}성</p><div class="offlineGuideGrid"><div class="offlineGuideItem"><b>다음 목표</b><span>각 별자리 성역을 다시 클리어해 3성 숙련도를 완성하세요.</span></div><div class="offlineGuideItem"><b>남은 성장</b><span>성흔 조각으로 코어, 보급, 소환 교리를 강화하세요.</span></div></div><div class="offlineGuideActions"><button id="offlineEndingClose" class="btnGreen">계속하기</button></div></div>`;
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
  if(stageFlowOwnsMapEvents()) return;
  const node = e.target.closest && e.target.closest('#stageMap .stageNode');
  if(!node) return;
  e.preventDefault();
  e.stopPropagation();
  if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  const stageNo = stageSyncClampStage(node.dataset.stage || 1);
  syncStageMapSelectionAndInfo(stageNo, {save:true});
}, true);

document.addEventListener('click', function(e){
  if(stageFlowOwnsMapEvents()) return;
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
  return !!target.closest('#stageInfoPanel, #stageEnterBtn, #stageMapBack, #constellationDeck, [data-constellation-jump], #stageHint, #v274StageActionDock, #v274StageEnterBtn, #v274StageInfoBtn, #v274MapInfoOverlay');
}
function handleStageMapPointerSelection(e){
  if(stageFlowOwnsMapEvents()) return;
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
  if(stageFlowOwnsMapEvents()) return;
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
    if(window.PRD_CLEAN_RUNTIME_V38 && window.PRD_CLEAN_RUNTIME_V38.observeStageMapState){
      window.PRD_CLEAN_RUNTIME_V38.observeStageMapState('core-lower-stage-text', () => forceLowerTextToSelectedStage());
    }else{
      new MutationObserver(() => forceLowerTextToSelectedStage()).observe(mapForLowerText, {attributes:true, attributeFilter:['data-selected','class']});
    }
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
        let rewardEntry = Object.entries(STAGE_TOWER_REWARDS).find(([, reward]) => Number(reward.type) === Number(type));
        if(!rewardEntry){
          rewardEntry = Object.entries(STAGE_TOWER_REWARDS_EXTRA || {}).find(([, rewards]) => Array.isArray(rewards) && rewards.some(reward => Number(reward.type) === Number(type)));
        }
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
window.TEST_MODE_CONFIG = TEST_MODE_CONFIG;
window.StageMapState = StageMapState;
window.META = META;
window.toast = toast;
window.PRD_BATTLE = {
  startSelectedStageFromMap,
  prepareWave,
  reset,
  renderHangar,
  updateUI,
  loop
};

window.PRD_STAGE_RUNTIME = {
  getMaxStage(){ return STAGE_MAP_DEFS.length; },
  isTestMode(){ return !!(TEST_MODE_CONFIG && TEST_MODE_CONFIG.enabled); },
  setTestMode(flag){
    setTestModeEnabled(!!flag);
    try{
      if(flag){
        sessionStorage.setItem('PRD_ENTRY_MODE','test');
        sessionStorage.setItem('PRD_TEST_ENTRY_ACTIVE','1');
        sessionStorage.setItem('PLANET_RIFT_TEST_MODE','1');
      }else{
        sessionStorage.removeItem('PRD_ENTRY_MODE');
        sessionStorage.removeItem('PRD_TEST_ENTRY_ACTIVE');
        sessionStorage.removeItem('PLANET_RIFT_TEST_MODE');
        sessionStorage.removeItem('PRD_FORCE_TEST_MODE_ACTIVE');
        sessionStorage.removeItem('PRD_TEST_MODE');
        localStorage.removeItem('PRD_TEST_ENTRY_ACTIVE');
        localStorage.removeItem('PLANET_RIFT_TEST_MODE');
        localStorage.removeItem('PRD_FORCE_TEST_MODE_ACTIVE');
        localStorage.removeItem('PRD_TEST_MODE');
        if(META && META.flags) META.flags.testMode = false;
      }
    }catch(_){ }
    return !!(TEST_MODE_CONFIG && TEST_MODE_CONFIG.enabled);
  },
  getState(){
    return {
      unlocked: StageMapState.unlocked,
      selected: StageMapState.selected,
      current: StageMapState.current,
      testMode: !!(TEST_MODE_CONFIG && TEST_MODE_CONFIG.enabled)
    };
  },
  setSelected(stageNo, opts={}){
    const max = STAGE_MAP_DEFS.length;
    let n = clamp(Number(stageNo || 1), 1, max);
    const allowLockedPreview = opts && opts.allowLockedPreview === true;
    const unlocked = TEST_MODE_CONFIG.enabled ? max : clamp(Number(StageMapState.unlocked || 1), 1, max);
    if(!allowLockedPreview && !TEST_MODE_CONFIG.enabled && n > unlocked) n = unlocked;
    StageMapState.selected = n;
    StageMapState.current = n;
    return this.getState();
  },
  syncProgress(opts={}){
    if(typeof applyCanonicalProgressToState === 'function') applyCanonicalProgressToState(Object.assign({keepSelected:true, allowLockedPreview:true, save:!TEST_MODE_CONFIG.enabled}, opts || {}));
    else if(typeof syncStageUnlockFromClears === 'function') syncStageUnlockFromClears();
    return this.getState();
  },
  render(){
    if(typeof renderStageMap === 'function') renderStageMap();
    return this.getState();
  },
  start(){ return startSelectedStageFromMap(); },
  getStageView(stageNo){
    const max = STAGE_MAP_DEFS.length;
    const n = clamp(Number(stageNo || StageMapState.selected || 1), 1, max);
    const def = getStageDef(n);
    const arc = getConstellationArcByStage(n);
    const presentation = getStagePresentation(n);
    const copy = getStageDescriptionCopy(n);
    const reward = stageTowerRewardText(n);
    const unlocked = TEST_MODE_CONFIG.enabled ? max : clamp(Number(StageMapState.unlocked || 1), 1, max);
    const canEnter = TEST_MODE_CONFIG.enabled || n <= unlocked;
    return {stage:n, max, def, arc, presentation, copy, reward, unlocked, canEnter, testMode:!!TEST_MODE_CONFIG.enabled, hint:stageHintLine(n, canEnter)};
  }
};

window.PRD_STAGE_PROGRESS_BRIDGE = {
  sync: hardSyncStageProgressFromClears,
  repairAfterClear: forceStageClearUnlockAfterBattle,
  setBattleChromeVisible,
  computeUnlockedStageFromClears,
  getState(){ return {unlocked:StageMapState.unlocked, selected:StageMapState.selected, current:StageMapState.current, clears:Object.assign({}, META?.clears || {})}; }
};

resizeStarfield();
refreshScreenStarfields();
starField.last = performance.now();
starField.raf = requestAnimationFrame(starLoop);
try{ if(window.__PRD_SCREEN_STAR_RAF_V101_FINAL) cancelAnimationFrame(window.__PRD_SCREEN_STAR_RAF_V101_FINAL); }catch(_err){}
screenStarRaf = requestAnimationFrame(screenStarLoop);
try{ window.__PRD_SCREEN_STAR_RAF_V101_FINAL = screenStarRaf; }catch(_err){}
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
  const STAGE_UI_COPY = {"1":{"name":"SILENT ENTRY","ko":"침묵의 진입로","arc":"침묵의 성운","risk":"LOW","tags":["BASIC","TRACE","INTRO"],"summary":"4-1 침묵의 진입로 전장입니다. 잔향 신호 추적 · 안드로메다 진입 · 기본 화력 확인.","enemy":"M01/M02 기본군","strategy":"기본 화력과 병합 타이밍을 안정화하세요.","battle":"침묵의 진입로 방어 · basic trace","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"2":{"name":"ECHO NEBULA","ko":"잔향 성운","arc":"침묵의 성운","risk":"MEDIUM","tags":["ECHO","SPLIT"],"summary":"4-2 잔향 성운 전장입니다. 잔향 분기 · 공명 흔적 · 초반 병합 준비.","enemy":"M01/M02 기본군","strategy":"기본 화력과 병합 타이밍을 안정화하세요.","battle":"잔향 성운 방어 · echo split","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"3":{"name":"RESONANT SHARD","ko":"공명 파편","arc":"침묵의 성운","risk":"MEDIUM","tags":["RESONANCE","UNLOCK"],"summary":"4-3 공명 파편 전장입니다. 공명 표식 · 보호막 약화 · 공명 타워 학습.","enemy":"M01/M02 기본군","strategy":"공명 표식과 집중 화력으로 보호막형 적을 처리하세요.","battle":"공명 파편 방어 · resonance mark","reward":"공명 타워 해금 / 기존 보상 유지"},"4":{"name":"MARKED FIELD","ko":"표식의 전장","arc":"침묵의 성운","risk":"MEDIUM","tags":["SPLIT","MARK"],"summary":"4-4 표식의 전장 전장입니다. 표식 분산 · 분기처럼 보이는 합류 경로 · 화력 분배.","enemy":"M02/M04/M07 혼합군","strategy":"공명 표식과 집중 화력으로 보호막형 적을 처리하세요.","battle":"표식의 전장 방어 · marked split","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"5":{"name":"OUTER WARDEN","ko":"외곽 수호체","arc":"침묵의 성운","risk":"HIGH","tags":["MINI BOSS","ARMOR"],"summary":"4-5 외곽 수호체 전장입니다. 외곽 장갑 보스 · 공명 보호막 대응 · 4장 마무리.","enemy":"M02/M04/M07 혼합군","strategy":"공명 표식과 집중 화력으로 보호막형 적을 처리하세요.","battle":"외곽 수호체 방어 · outer boss","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"6":{"name":"TWISTED ROUTE","ko":"뒤틀린 항로","arc":"중력 회랑","risk":"MEDIUM","tags":["PORTAL","SPEED"],"summary":"5-1 뒤틀린 항로 전장입니다. 고정 포탈 · 빠른 적 압박 · 출구 화력 배치.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"뒤틀린 항로 방어 · portal speed","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"7":{"name":"GRAVITY LENS","ko":"중력 렌즈","arc":"중력 회랑","risk":"MEDIUM","tags":["GRAVITY","UNLOCK"],"summary":"5-2 중력 렌즈 전장입니다. 중력 렌즈 · 둔화 학습 · 속도 압박 제어.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"중력 렌즈 방어 · gravity slow","reward":"중력 렌즈 타워 해금 / 기존 보상 유지"},"8":{"name":"SLOWED STARLIGHT","ko":"느려진 별빛","arc":"중력 회랑","risk":"HIGH","tags":["CONTROL","MERGE"],"summary":"5-3 느려진 별빛 전장입니다. 느린 별빛 · 병합 효율 검증 · 제어 화력 운영.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"느려진 별빛 방어 · slow starlight","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"9":{"name":"RIFT MATRIX","ko":"균열의 행렬","arc":"중력 회랑","risk":"HIGH","tags":["SPLIT","PORTAL"],"summary":"5-4 균열의 행렬 전장입니다. 균열 행렬 · 포탈 출구 대응 · 관통/범위 가치 상승.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"균열의 행렬 방어 · rift matrix","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"10":{"name":"GRAVITY RIFT","ko":"중력 균열체","arc":"중력 회랑","risk":"HIGH","tags":["BOSS","GRAVITY"],"summary":"5-5 중력 균열체 전장입니다. 중력 보스 · 속도 버프 오라 · 회랑 결전.","enemy":"M04/M05/M06 포탈·중력군","strategy":"포탈 출구와 중력 둔화 구간에 화력을 집중하세요.","battle":"중력 균열체 방어 · gravity boss","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"11":{"name":"RUINED CORE","ko":"폐허 코어","arc":"잊힌 코어","risk":"HIGH","tags":["CORE","UNLOCK"],"summary":"6-1 폐허 코어 전장입니다. 폐허 코어 · 직선 경로 대응 · 프리즘 학습.","enemy":"M07/M10 중심의 코어 방어망","strategy":"프리즘 관통과 핵심 배치 칸을 활용해 후반 물량을 정리하세요.","battle":"폐허 코어 방어 · ruined core","reward":"성흔 프리즘 타워 해금 / 기존 보상 유지"},"12":{"name":"PRISM GRID","ko":"프리즘 방어망","arc":"잊힌 코어","risk":"HIGH","tags":["PRISM","PIERCE"],"summary":"6-2 프리즘 방어망 전장입니다. 프리즘 방어망 · 직선 관통 · 행렬 처리.","enemy":"M07/M10 중심의 코어 방어망","strategy":"프리즘 관통과 핵심 배치 칸을 활용해 후반 물량을 정리하세요.","battle":"프리즘 방어망 방어 · prism grid","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"13":{"name":"CORRUPTED PROTOCOL","ko":"오염된 방어 프로토콜","arc":"잊힌 코어","risk":"VERY HIGH","tags":["MIXED","ILLUSION","TRACTOR"],"summary":"6-3 오염된 방어 프로토콜 전장입니다. 오염된 프로토콜 · 포탈/중력/행렬/허상 교란 종합 테스트.","enemy":"M03/M08/M09가 섞인 고급 교란 방어망","strategy":"허상은 광역/관통으로 정리하고 견인체는 우선 제거하세요.","battle":"오염된 방어 프로토콜 방어 · corrupted protocol","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"14":{"name":"WARDEN HEART","ko":"수호자의 심장","arc":"잊힌 코어","risk":"VERY HIGH","tags":["RANDOM BUFF","TRACTOR","CORE"],"summary":"6-4 수호자의 심장 전장입니다. wave 시작 랜덤 버프와 역장 견인 압박이 함께 들어옵니다.","enemy":"M09 견인체와 M10 성흔 포식체 중심 관문 방어망","strategy":"U 칸 주력 배치와 동시에 견인체를 먼저 끊어 물량 압축을 막으세요.","battle":"수호자의 심장 방어 · random buff gate","reward":"임시 리소스 재사용 / 전술 숙련도 보상"},"15":{"name":"ANDROMEDA ECHO","ko":"안드로메다의 잔향","arc":"잊힌 코어","risk":"EXTREME","tags":["FINAL","CORE","KEY TILE"],"summary":"6-5 안드로메다의 잔향 전장입니다. 중앙 코어 · 최종 보스 · 핵심 배치 칸 공략.","enemy":"B03 공명 수호자 아스트라와 M10 성흔 포식체가 최종 코어를 압박합니다.","strategy":"중앙 핵심 칸에 최고 레벨 타워를 두고 장판·공명·프리즘 화력을 모두 연결하세요.","battle":"안드로메다의 잔향 방어 · andromeda final","reward":"임시 리소스 재사용 / 전술 숙련도 보상"}};
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const clampStage = value => Math.max(1, Math.min(15, Number(value) || 1));
  function flowOwnsMapEvents(){
    return !!((window.PRD_STAGE_FLOW_OWNS_MAP_EVENTS && window.PRD_STAGE_FLOW_OWNS_MAP_EVENTS()) || window.PRD_STAGE_FLOW_CONTROLLER_ACTIVE || window.PRD_DISABLE_LEGACY_FLOW_HANDLERS || window.PRD_STAGE_FLOW);
  }
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
    if(flowOwnsMapEvents()){
      setTimeout(() => {
        if(window.PRD_STAGE_FLOW && typeof window.PRD_STAGE_FLOW.renderModeLabel === 'function') window.PRD_STAGE_FLOW.renderModeLabel();
      }, 0);
      return;
    }
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
      if(window.PRD_CLEAN_RUNTIME_V38 && window.PRD_CLEAN_RUNTIME_V38.observeStageMapState){
        window.PRD_CLEAN_RUNTIME_V38.observeStageMapState('core-stage-description', () => {
          if(flowOwnsMapEvents()){
            setTimeout(() => {
              if(window.PRD_STAGE_FLOW && typeof window.PRD_STAGE_FLOW.renderModeLabel === 'function') window.PRD_STAGE_FLOW.renderModeLabel();
            }, 0);
            return;
          }
          setTimeout(() => applyStageDescription(), 0);
        });
      }else{
        new MutationObserver(() => {
          if(flowOwnsMapEvents()){
            setTimeout(() => {
              if(window.PRD_STAGE_FLOW && typeof window.PRD_STAGE_FLOW.renderModeLabel === 'function') window.PRD_STAGE_FLOW.renderModeLabel();
            }, 0);
            return;
          }
          setTimeout(() => applyStageDescription(), 0);
        }).observe(map, {attributes:true, attributeFilter:['data-selected','data-unlocked','class']});
      }
    }
  }catch(err){}
  document.addEventListener('DOMContentLoaded', () => {
    applyStageDescription();
    setTimeout(() => applyStageDescription(), 100);
    setTimeout(() => applyStageDescription(), 500);
  });
  if(window.PRD_CLEAN_RUNTIME_V38 && window.PRD_CLEAN_RUNTIME_V38.observeScreenState){
    window.PRD_CLEAN_RUNTIME_V38.observeScreenState('core-stage-description-visible', () => {
      const map = $('stageMap');
      if(map && getComputedStyle(map).display !== 'none'){
        if(flowOwnsMapEvents()){
          if(window.PRD_STAGE_FLOW && typeof window.PRD_STAGE_FLOW.renderModeLabel === 'function') window.PRD_STAGE_FLOW.renderModeLabel();
          return;
        }
        applyStageDescription();
      }
    });
  }
})();


/* =========================================================
   V62 clean: fixed route layout
   - Dynamic route recalculation removed to prevent line drift on click.
   - Static SVG paths and CSS gradient are used instead.
   ========================================================= */





/* V18 Stage node caption sync: keep map captions short and non-overlapping. */
const STAGE_NODE_SHORT_LABELS_V18 = {
  1:'SILENT', 2:'ECHO', 3:'RESONANT', 4:'MARKED',
  5:'OUTER', 6:'TWISTED', 7:'GRAVITY', 8:'SLOWED',
  9:'RIFT', 10:'GRAVITY', 11:'RUINED', 12:'PRISM',
  13:'CORRUPTED', 14:'WARDEN', 15:'ANDROMEDA'
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
