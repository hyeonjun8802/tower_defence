/* v45: unified app flow and stage map controller.
   - Owns START/TEST entry, stage selection, and stage ENTER routing with one event-driven controller.
   - Test mode is runtime-only: current TEST MODE entry or ?test=1. Persisted test flags are scrubbed in normal mode.
   - No MutationObserver or interval loop. No battle-loop/balance/audio/command changes. */
(function(){
  'use strict';
  if(window.PRD_STAGE_MAP_CONTROLLER_V45) return;
  window.PRD_STAGE_MAP_CONTROLLER_V45 = true;

  var enterLock = false;
  var lastEnterAt = 0;
  var CLEAR_TEST_KEYS = ['PRD_TEST_ENTRY_ACTIVE','PLANET_RIFT_TEST_MODE','PRD_FORCE_TEST_MODE_ACTIVE','PRD_TEST_MODE'];
  var SESSION_TEST_KEYS = ['PRD_ENTRY_MODE','PRD_TEST_ENTRY_ACTIVE','PLANET_RIFT_TEST_MODE','PRD_FORCE_TEST_MODE_ACTIVE','PRD_TEST_MODE'];

  function byId(id){ return document.getElementById(id); }
  function qs(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function safe(fn, fallback){ try{ return fn(); }catch(err){ console.warn('[v45 app flow controller]', err); return fallback; } }
  function runtime(){ return window.PRD_STAGE_RUNTIME || null; }
  function visible(el){
    if(!el) return false;
    try{
      var cs = getComputedStyle(el);
      if(cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || 1) <= 0.01) return false;
      var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      return !r || (r.width > 1 && r.height > 1);
    }catch(_){ return true; }
  }
  function stageMapVisible(){ return visible(byId('stageMap')); }
  function stop(ev){
    try{ if(ev && ev.cancelable) ev.preventDefault(); }catch(_){ }
    try{ if(ev) ev.stopPropagation(); }catch(_){ }
    try{ if(ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(_){ }
  }
  function queryTestRequested(){
    return safe(function(){
      var p = new URLSearchParams(location.search || '');
      var raw = p.get('test') || p.get('testmode') || p.get('qa') || p.get('debug');
      return /^(1|true|yes|on)$/i.test(String(raw || '')) || p.has('test');
    }, false);
  }
  function explicitTestRequested(){
    return queryTestRequested() || safe(function(){
      return sessionStorage.getItem('PRD_ENTRY_MODE') === 'test';
    }, false);
  }
  function patchStoredMetaTestFlag(){
    safe(function(){
      ['planetRiftOfflineMetaV2','planetRiftOfflineMetaV1'].forEach(function(key){
        var raw = localStorage.getItem(key);
        if(!raw) return;
        var obj = JSON.parse(raw);
        if(obj && obj.flags){
          obj.flags.testMode = false;
          localStorage.setItem(key, JSON.stringify(obj));
        }
      });
    });
    safe(function(){ if(window.META && window.META.flags) window.META.flags.testMode = false; });
  }
  function clearStaleTestMode(){
    if(explicitTestRequested()) return;
    safe(function(){ CLEAR_TEST_KEYS.forEach(function(key){ localStorage.removeItem(key); }); });
    safe(function(){ SESSION_TEST_KEYS.forEach(function(key){ sessionStorage.removeItem(key); }); });
    patchStoredMetaTestFlag();
    var rt = runtime();
    if(rt && typeof rt.setTestMode === 'function') rt.setTestMode(false);
    else if(typeof window.setTestModeEnabled === 'function') window.setTestModeEnabled(false);
    if(window.TEST_MODE_CONFIG) window.TEST_MODE_CONFIG.enabled = false;
    safe(function(){ sessionStorage.setItem('PRD_ENTRY_MODE','normal'); });
    window.PRD_FORCE_TEST_MODE_ACTIVE = false;
    window.__PRD_TEST_MODE_ACTIVE = false;
    if(document.body) document.body.classList.remove('test-mode-active');
  }
  function markExplicitTestMode(){
    safe(function(){
      sessionStorage.setItem('PRD_ENTRY_MODE','test');
      sessionStorage.setItem('PRD_TEST_ENTRY_ACTIVE','1');
      sessionStorage.setItem('PLANET_RIFT_TEST_MODE','1');
    });
  }
  function isTestMode(){
    if(!explicitTestRequested()) return false;
    var rt = runtime();
    if(rt && typeof rt.isTestMode === 'function') return !!rt.isTestMode();
    return !!(window.TEST_MODE_CONFIG && window.TEST_MODE_CONFIG.enabled) || !!(document.body && document.body.classList.contains('test-mode-active'));
  }
  function clampStage(value, max){
    var n = Math.floor(Number(value || 1));
    if(!Number.isFinite(n)) n = 1;
    return Math.max(1, Math.min(max || maxStage(), n));
  }
  function maxStage(){
    var rt = runtime();
    if(rt && typeof rt.getMaxStage === 'function') return Math.max(1, Number(rt.getMaxStage()) || 1);
    return Math.max(1, qs('#stageMap .stageNode[data-stage]').reduce(function(m, node){ return Math.max(m, Number(node.dataset.stage) || 1); }, 1));
  }
  function getState(){
    var rt = runtime();
    if(rt && typeof rt.getState === 'function') return rt.getState();
    var map = byId('stageMap');
    return {selected:clampStage(map && map.dataset && map.dataset.selected || 1), unlocked:clampStage(map && map.dataset && map.dataset.unlocked || 1), current:1, testMode:isTestMode()};
  }
  function stageView(stageNo){
    var rt = runtime();
    if(rt && typeof rt.getStageView === 'function') return rt.getStageView(stageNo);
    var n = clampStage(stageNo);
    var map = byId('stageMap');
    var unlocked = isTestMode() ? maxStage() : clampStage(map && map.dataset && map.dataset.unlocked || 1);
    return {stage:n, max:maxStage(), unlocked:unlocked, canEnter:isTestMode() || n <= unlocked, testMode:isTestMode(), def:{stage:n,name:'STAGE '+n,ko:'스테이지 '+n}, arc:{name:'CONSTELLATION MAP',ko:'성좌 지도'}, presentation:{risk:'-',tags:[]}, copy:{summary:''}, reward:'', hint:''};
  }
  function setSelected(stageNo){
    var rt = runtime();
    var n = clampStage(stageNo);
    if(rt && typeof rt.setSelected === 'function') rt.setSelected(n, {allowLockedPreview:true});
    var map = byId('stageMap');
    if(map && map.dataset) map.dataset.selected = String(n);
    return stageView(n);
  }
  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>\"]/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch] || ch; });
  }
  function setButton(button, label, open){
    if(!button) return;
    button.textContent = label;
    button.disabled = !open;
    button.classList.toggle('locked', !open);
    button.classList.toggle('disabled', !open);
    button.setAttribute('aria-disabled', open ? 'false' : 'true');
  }
  function syncNodes(view){
    var map = byId('stageMap');
    var selected = clampStage(view.stage, view.max);
    var unlocked = isTestMode() ? view.max : clampStage(view.unlocked, view.max);
    if(map){
      map.dataset.selected = String(selected);
      map.dataset.unlocked = String(unlocked);
      for(var i=1; i<=view.max; i++) map.classList.remove('stage-selected-' + i);
      map.classList.add('stage-selected-' + selected);
    }
    qs('#stageMap .stageNode[data-stage]').forEach(function(node){
      var n = clampStage(node.dataset && node.dataset.stage, view.max);
      var open = isTestMode() || n <= unlocked;
      node.classList.toggle('active', n === selected);
      node.classList.toggle('unlocked', open);
      node.classList.toggle('locked', !open);
      node.setAttribute('aria-disabled', open ? 'false' : 'true');
      var lock = node.querySelector('.nodeLock');
      if(lock) lock.style.display = open ? 'none' : 'block';
    });
  }
  function syncCopy(view){
    var def = view.def || {stage:view.stage, name:'STAGE '+view.stage, ko:'스테이지 '+view.stage};
    var arc = view.arc || {name:'CONSTELLATION MAP', ko:'성좌 지도'};
    var pres = view.presentation || {risk:'-', tags:[]};
    var copy = view.copy || {summary:''};
    var open = !!view.canEnter;
    var labelText = open ? ('ENTER ' + def.stage + '. ' + def.name) : ('LOCKED · ' + def.stage + '. ' + def.name);
    var progress = byId('stageProgressLabel');
    var sub = byId('stageProgressSub');
    var hint = byId('stageHint');
    if(progress) progress.textContent = (isTestMode() ? 'TEST MODE · ' : '') + arc.name + ' · SANCTUARY ' + def.stage + ' / ' + view.max;
    if(sub) sub.textContent = arc.ko + ' · ' + def.stage + '. ' + def.name + ' / ' + def.ko + ' ' + (open ? '선택됨' : '미개방 미리보기');
    if(hint) hint.textContent = isTestMode() ? ('TEST MODE — ' + def.stage + '. ' + def.name + ' · ' + def.ko + ' / ' + (copy.summary || '')) : (view.hint || (arc.ko + ' · ' + def.stage + '. ' + def.name + ' / ' + def.ko));
    setButton(byId('stageEnterBtn'), labelText, open);
    setButton(byId('v274StageEnterBtn'), labelText, open);
    var overlay = byId('v274MapInfoOverlay');
    if(overlay && overlay.dataset && overlay.dataset.kind === 'stage') setButton(byId('v274MapInfoEnterBtn'), labelText, open);

    var panel = byId('stageInfoPanel');
    if(panel) panel.dataset.stage = String(def.stage);
    var title = byId('stageInfoTitle');
    var risk = byId('stageInfoRisk');
    var mood = byId('stageInfoMood');
    var tags = byId('stageInfoTags');
    if(title) title.textContent = arc.ko + ' · ' + def.stage + '. ' + def.name + ' / ' + def.ko;
    if(risk) risk.textContent = pres.risk || '-';
    if(mood){
      mood.textContent = def.ko + ' 설명 · ' + (copy.summary || def.mood || '') + (view.reward ? ' 보상: ' + view.reward : '');
      mood.title = mood.textContent;
    }
    if(tags) tags.innerHTML = (pres.tags || []).map(function(tag){ return '<span class="stageTag">' + esc(tag) + '</span>'; }).join('');
  }
  function sync(stageNo){
    var view = setSelected(stageNo || selectedStageFromDom());
    syncNodes(view);
    syncCopy(view);
    return view;
  }
  function shouldIgnoreStagePick(ev){
    var t = ev && ev.target;
    if(!t || !t.closest) return true;
    return !!t.closest('#stageEnterBtn,#v274StageEnterBtn,#v274MapInfoEnterBtn,#stageInfoPanel,#stageMapBack,#stageGalaxyBtn,#stageTowerManageBtn,#constellationDeck,#v274StageActionDock,#v274MapInfoOverlay');
  }
  function nearestStageFromPoint(x, y){
    var best = null, bestDist = Infinity;
    qs('#stageMap .stageNode[data-stage]').forEach(function(node){
      var r = node.getBoundingClientRect();
      if(!r.width || !r.height) return;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = x - cx, dy = y - cy, dist = Math.sqrt(dx * dx + dy * dy);
      var radius = Math.max(r.width, r.height) * 0.9;
      if(dist <= radius && dist < bestDist){ best = node; bestDist = dist; }
    });
    return best;
  }
  function stageFromEvent(ev){
    if(!stageMapVisible() || shouldIgnoreStagePick(ev)) return 0;
    var t = ev && ev.target;
    if(!t || !t.closest) return 0;
    var node = t.closest('#stageMap .stageNode[data-stage]');
    if(node && node.dataset) return clampStage(node.dataset.stage);
    var jump = t.closest('#stageMap [data-constellation-jump]');
    if(jump && jump.dataset) return clampStage(jump.dataset.constellationJump);
    if(t.closest('#stageMap') && typeof ev.clientX === 'number' && typeof ev.clientY === 'number'){
      var near = nearestStageFromPoint(ev.clientX, ev.clientY);
      if(near && near.dataset) return clampStage(near.dataset.stage);
    }
    return 0;
  }
  function syncFromStagePick(ev){
    var n = stageFromEvent(ev);
    if(!n) return false;
    sync(n);
    if(window.requestAnimationFrame) requestAnimationFrame(function(){ sync(n); });
    setTimeout(function(){ sync(n); }, 80);
    return true;
  }
  function selectedStageFromDom(){
    var map = byId('stageMap');
    var active = document.querySelector('#stageMap .stageNode.active[data-stage]');
    var candidates = [];
    if(active && active.dataset) candidates.push(active.dataset.stage);
    if(map && map.dataset) candidates.push(map.dataset.selected);
    var text = [byId('stageEnterBtn'), byId('v274StageEnterBtn')].map(function(btn){ return btn && btn.textContent; }).join(' ');
    var m = text.match(/(?:ENTER|LOCKED)\s*(?:·)?\s*(\d+)/i) || text.match(/SANCTUARY\s*(\d+)/i);
    if(m) candidates.push(m[1]);
    var st = getState();
    candidates.push(st.selected);
    for(var i=0; i<candidates.length; i++){
      var n = Number(candidates[i]);
      if(Number.isFinite(n) && n > 0) return clampStage(n);
    }
    return 1;
  }
  function stageEnterTarget(ev){
    var t = ev && ev.target;
    if(!t || !t.closest || !stageMapVisible()) return null;
    var btn = t.closest('#stageEnterBtn,#v274StageEnterBtn,#v274MapInfoEnterBtn,[data-stage-enter],.stageEnter,.stageEnterBtn');
    if(!btn) return null;
    if(btn.closest('#galaxyMap') || btn.id === 'galaxyEnterBtn' || btn.id === 'v274GalaxyEnterBtn') return null;
    if(btn.id === 'v274MapInfoEnterBtn'){
      var overlay = byId('v274MapInfoOverlay');
      var kind = overlay && overlay.dataset ? overlay.dataset.kind : '';
      if(kind && kind !== 'stage') return null;
    }
    if(btn.disabled || btn.getAttribute('aria-disabled') === 'true') return null;
    var text = String(btn.textContent || '').replace(/\s+/g, ' ').trim();
    if(/LOCKED|미개방/i.test(text)) return null;
    return btn;
  }
  function closeStageInfoOverlay(){
    var overlay = byId('v274MapInfoOverlay');
    if(!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
  }
  function setEntering(on){
    window.PRD_STAGE_ENTERING = !!on;
    if(document.body) document.body.classList.toggle('prd-stage-entering', !!on);
  }
  function battleVisible(){ return visible(byId('game')); }
  function ensureBattleMounted(){
    if(!battleVisible()) return false;
    var map = byId('stageMap'), galaxy = byId('galaxyMap'), menu = byId('menu');
    if(map) map.style.display = 'none';
    if(galaxy) galaxy.style.display = 'none';
    if(menu) menu.style.display = 'none';
    if(document.body){
      document.body.classList.remove('prd-map-ui-active');
      document.body.classList.add('prd-combat-ui-active','prd-battle-active','prd-combat-screen-active');
    }
    return true;
  }
  function rollbackMapUi(){
    setEntering(false);
    var map = byId('stageMap');
    if(map && !battleVisible()){
      map.style.display = 'block';
      map.style.pointerEvents = '';
    }
    safe(function(){ if(window.PRD_MAP_HUD_RECOVERY_V83_API && typeof window.PRD_MAP_HUD_RECOVERY_V83_API.syncSoon === 'function') window.PRD_MAP_HUD_RECOVERY_V83_API.syncSoon(); });
    safe(function(){ if(window.PRD_MAP_HUD_V274 && typeof window.PRD_MAP_HUD_V274.ensureDocks === 'function') window.PRD_MAP_HUD_V274.ensureDocks(); });
  }
  function startBattle(){
    var rt = runtime();
    if(rt && typeof rt.start === 'function') return rt.start();
    if(window.PRD_BATTLE && typeof window.PRD_BATTLE.startSelectedStageFromMap === 'function') return window.PRD_BATTLE.startSelectedStageFromMap();
    if(typeof window.startSelectedStageFromMap === 'function') return window.startSelectedStageFromMap();
    return false;
  }
  function routeEnter(ev){
    var btn = stageEnterTarget(ev);
    if(!btn) return false;
    stop(ev);
    var now = Date.now();
    if(enterLock || now - lastEnterAt < 350) return true;
    enterLock = true;
    lastEnterAt = now;
    sync(selectedStageFromDom());
    closeStageInfoOverlay();
    setEntering(true);
    var result = safe(function(){ return startBattle(); }, false);
    function verify(){ if(result === false || !ensureBattleMounted()) rollbackMapUi(); }
    if(window.requestAnimationFrame) requestAnimationFrame(verify);
    setTimeout(verify, 80);
    setTimeout(verify, 220);
    setTimeout(function(){ if(!ensureBattleMounted()) rollbackMapUi(); enterLock = false; }, 700);
    return true;
  }

  function markNormalMode(){
    safe(function(){
      sessionStorage.setItem('PRD_ENTRY_MODE','normal');
      SESSION_TEST_KEYS.forEach(function(key){ if(key !== 'PRD_ENTRY_MODE') sessionStorage.removeItem(key); });
      CLEAR_TEST_KEYS.forEach(function(key){ localStorage.removeItem(key); });
    });
    patchStoredMetaTestFlag();
    var rt = runtime();
    if(rt && typeof rt.setTestMode === 'function') rt.setTestMode(false);
    else if(typeof window.setTestModeEnabled === 'function') window.setTestModeEnabled(false);
    safe(function(){ sessionStorage.setItem('PRD_ENTRY_MODE','normal'); });
    safe(function(){ if(window.META && window.META.flags) window.META.flags.testMode = false; });
    window.PRD_FORCE_TEST_MODE_ACTIVE = false;
    window.__PRD_TEST_MODE_ACTIVE = false;
    if(document.body) document.body.classList.remove('test-mode-active','prd-stage-entering','prd-combat-ui-active','prd-battle-active','prd-combat-screen-active');
  }
  function showGalaxyEntry(testMode){
    if(testMode){
      markExplicitTestMode();
      safe(function(){ if(typeof window.loadOfflineMeta === 'function') window.loadOfflineMeta(); });
      safe(function(){ if(typeof window.loadStageMapProgress === 'function') window.loadStageMapProgress(); });
      safe(function(){ if(typeof window.applyTestModeOverrides === 'function') window.applyTestModeOverrides(); });
      safe(function(){ if(typeof window.renderOfflineMetaPanel === 'function') window.renderOfflineMetaPanel(); });
    }else{
      markNormalMode();
      safe(function(){ if(typeof window.loadOfflineMeta === 'function') window.loadOfflineMeta(); });
      safe(function(){ if(window.META && window.META.flags) window.META.flags.testMode = false; });
      safe(function(){ if(typeof window.loadStageMapProgress === 'function') window.loadStageMapProgress(); });
    }
    safe(function(){ if(typeof window.bindGalaxyMapClean === 'function') window.bindGalaxyMapClean(); });
    safe(function(){ if(typeof window.showGalaxyMapClean === 'function') window.showGalaxyMapClean(); });
    var menu = byId('menu'), galaxy = byId('galaxyMap'), stage = byId('stageMap'), game = byId('game');
    if(menu) menu.style.display = 'none';
    if(stage) stage.style.display = 'none';
    if(game) game.style.display = 'none';
    if(galaxy){ galaxy.style.display = 'block'; galaxy.classList.add('cleanVisible'); }
    if(document.body){
      document.body.classList.add('prd-map-ui-active');
      document.body.classList.remove('prd-combat-ui-active','prd-stage-entering','prd-battle-active','prd-combat-screen-active');
    }
    if(!testMode){
      var label = byId('galaxyProgressLabel');
      var sub = byId('galaxyProgressSub');
      if(label && /^TEST MODE/i.test(label.textContent || '')) label.textContent = 'MILKY RIFT · 1 / 4 GALAXIES';
      if(sub && /테스트|TEST/i.test(sub.textContent || '')) sub.textContent = '현재는 은하수 균열 은하만 개방되어 있습니다.';
    }else{
      safe(function(){ if(typeof window.toast === 'function') window.toast('TEST MODE 활성화 — 모든 성역과 기본 타워가 해금되었습니다'); });
    }
    safe(function(){ if(typeof window.refreshScreenStarfields === 'function') window.refreshScreenStarfields(); });
  }
  function menuTarget(ev){
    var t = ev && ev.target;
    if(!t || !t.closest) return '';
    if(t.closest('#startBtn')) return 'start';
    if(t.closest('#testModeBtn')) return 'test';
    return '';
  }
  function captureMenuMode(ev){
    var action = menuTarget(ev);
    if(!action) return;
    var menu = byId('menu');
    if(menu && !visible(menu)) return;
    stop(ev);
    showGalaxyEntry(action === 'test');
  }
  function boot(){
    if(queryTestRequested()){
      markExplicitTestMode();
      var rt = runtime();
      if(rt && typeof rt.setTestMode === 'function') rt.setTestMode(true);
    }else if(!explicitTestRequested()){
      clearStaleTestMode();
    }
    if(stageMapVisible()) sync(selectedStageFromDom());
  }

  window.addEventListener('click', captureMenuMode, true);
  window.addEventListener('pointerdown', syncFromStagePick, true);
  window.addEventListener('touchstart', syncFromStagePick, {capture:true, passive:true});
  window.addEventListener('click', function(ev){ if(routeEnter(ev)) return; syncFromStagePick(ev); }, true);
  window.addEventListener('pageshow', function(){ setTimeout(boot, 0); }, {passive:true});
  window.addEventListener('load', function(){ boot(); setTimeout(boot, 120); }, {once:true});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  window.PRD_STAGE_MAP_CONTROLLER_V45_API = {sync:sync, start:routeEnter, isTestMode:isTestMode, clearStaleTestMode:clearStaleTestMode, selected:selectedStageFromDom};
})();
