/* v46: deterministic app-flow controller.
   Single owner for START/TEST, galaxy routing, stage selection and stage ENTER.
   Legacy click routers are disabled in patches.runtime.js when window.PRD_STAGE_FLOW_CONTROLLER_ACTIVE is set.
   No MutationObserver/interval loops. Battle loop, balance, audio and command buttons are untouched. */
(function(){
  'use strict';
  if(window.PRD_STAGE_FLOW_CONTROLLER_V46) return;
  window.PRD_STAGE_FLOW_CONTROLLER_V46 = true;
  window.PRD_STAGE_FLOW_CONTROLLER_ACTIVE = 'v46';
  window.PRD_DISABLE_LEGACY_FLOW_HANDLERS = true;

  var IS_ANDROMEDA = /(?:^|\/)andromeda(?:\/|$)/i.test(location.pathname || '');
  var lastActionAt = 0;
  var enterLock = false;
  var selectedGalaxyId = IS_ANDROMEDA ? 'andromeda-frost' : 'milky-rift';
  var state = {
    mode: 'normal',
    galaxyId: selectedGalaxyId,
    selectedStageNo: 1,
    screen: 'menu'
  };
  var TEST_SESSION_KEYS = ['PRD_ENTRY_MODE','PRD_TEST_ENTRY_ACTIVE','PLANET_RIFT_TEST_MODE','PRD_FORCE_TEST_MODE_ACTIVE','PRD_TEST_MODE'];
  var TEST_LOCAL_KEYS = ['PRD_TEST_ENTRY_ACTIVE','PLANET_RIFT_TEST_MODE','PRD_FORCE_TEST_MODE_ACTIVE','PRD_TEST_MODE'];
  var ANDROMEDA_SESSION_KEYS = ['PRD_CAMPAIGN','PRD_SELECTED_GALAXY','PRD_ANDROMEDA_BATTLE_ACTIVE','PRD_ANDROMEDA_STAGE_NO'];
  var ANDROMEDA_LOCAL_KEYS = ['PRD_CAMPAIGN','PRD_SELECTED_GALAXY','PRD_ANDROMEDA_BATTLE_ACTIVE','PRD_ANDROMEDA_STAGE_NO'];
  var GALAXY_ORDER = ['milky-rift','andromeda-frost','ember-spiral','void-crown'];
  var GALAXY_COPY = {
    'milky-rift':{title:'MILKY RIFT',ko:'은하수 균열',enter:'ENTER MILKY RIFT',state:'OPEN',body:'현재 플레이 가능한 본편 은하입니다. 성좌 내부로 진입해 12개 성역을 순차적으로 복원합니다.',tags:['CORE ROUTE','12 STAGES','RESTORATION']},
    'andromeda-frost':{title:'ANDROMEDA TRACE',ko:'안드로메다 항로',enter:'ENTER ANDROMEDA TRACE',state:'OPEN',body:'은하수 최종 성역 완료 후 열리는 안드로메다 소용돌이 캠페인입니다.',tags:['SPIRAL ROUTE','15 STAGES','ANDROMEDA']},
    'ember-spiral':{title:'EMBER SPIRAL',ko:'잿불 나선은하',enter:'LOCKED',state:'LOCKED',body:'후속 은하입니다. 현재 빌드에서는 잠금 상태로 유지합니다.',tags:['LOCKED','FUTURE','SEALED']},
    'void-crown':{title:'VOID CROWN',ko:'공허 왕관',enter:'LOCKED',state:'LOCKED',body:'최후반 은하입니다. 현재 빌드에서는 잠금 상태로 유지합니다.',tags:['LOCKED','FUTURE','SEALED']}
  };

  function $(id){ return document.getElementById(id); }
  function $$(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function safe(fn, fallback){ try{ return fn(); }catch(err){ console.warn('[v46 app flow]', err); return fallback; } }
  function rt(){ return window.PRD_STAGE_RUNTIME || null; }
  function now(){ return Date.now ? Date.now() : new Date().getTime(); }
  function visible(el){
    if(!el) return false;
    try{
      var cs = getComputedStyle(el);
      if(cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || 1) <= 0.01) return false;
      var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      return !r || (r.width > 1 && r.height > 1);
    }catch(_){ return true; }
  }
  function stop(ev){
    try{ if(ev && ev.cancelable) ev.preventDefault(); }catch(_){ }
    try{ if(ev) ev.stopPropagation(); }catch(_){ }
    try{ if(ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(_){ }
  }
  function queryFlag(name){ return safe(function(){ var p = new URLSearchParams(location.search || ''); return p.has(name) && !/^(0|false|no|off)$/i.test(String(p.get(name) || '1')); }, false); }
  function queryTestRequested(){ return queryFlag('test') || queryFlag('testmode') || queryFlag('qa') || queryFlag('debug'); }
  function sessionTestRequested(){ return safe(function(){ return sessionStorage.getItem('PRD_ENTRY_MODE') === 'test' || sessionStorage.getItem('PRD_TEST_ENTRY_ACTIVE') === '1' || sessionStorage.getItem('PLANET_RIFT_TEST_MODE') === '1'; }, false); }
  function explicitTestRequested(){ return queryTestRequested() || sessionTestRequested(); }
  function updateState(patch){
    Object.keys(patch || {}).forEach(function(key){ state[key] = patch[key]; });
    state.mode = isTestMode() ? 'dev' : state.mode;
    return getState();
  }
  function getState(){
    return {
      mode: isTestMode() ? 'dev' : 'normal',
      galaxyId: state.galaxyId || selectedGalaxyId,
      selectedStageNo: clampStage(state.selectedStageNo || selectedStageFromDom()),
      screen: state.screen || 'menu'
    };
  }
  function isTestMode(){
    if(state.mode === 'dev') return true;
    if(!explicitTestRequested()) return false;
    var r = rt();
    if(r && typeof r.isTestMode === 'function') return !!r.isTestMode();
    return !!(window.TEST_MODE_CONFIG && window.TEST_MODE_CONFIG.enabled) || !!(document.body && document.body.classList.contains('test-mode-active'));
  }
  function setSessionMode(mode){ safe(function(){ sessionStorage.setItem('PRD_ENTRY_MODE', mode === 'test' ? 'test' : 'normal'); }); }
  function patchStoredMetaTestFlag(){
    safe(function(){
      ['planetRiftOfflineMetaV2','planetRiftOfflineMetaV1'].forEach(function(key){
        var raw = localStorage.getItem(key);
        if(!raw) return;
        var obj = JSON.parse(raw);
        if(obj && obj.flags && obj.flags.testMode){ obj.flags.testMode = false; localStorage.setItem(key, JSON.stringify(obj)); }
      });
    });
    safe(function(){ if(window.META && window.META.flags) window.META.flags.testMode = false; });
  }
  function clearTestPersistence(){
    safe(function(){ TEST_SESSION_KEYS.forEach(function(k){ sessionStorage.removeItem(k); }); });
    safe(function(){ TEST_LOCAL_KEYS.forEach(function(k){ localStorage.removeItem(k); }); });
    patchStoredMetaTestFlag();
    window.PRD_FORCE_TEST_MODE_ACTIVE = false;
    window.__PRD_TEST_MODE_ACTIVE = false;
    state.mode = 'normal';
    if(document.body) document.body.classList.remove('test-mode-active');
  }
  function clearAndromedaPersistence(){
    safe(function(){ ANDROMEDA_SESSION_KEYS.forEach(function(k){ sessionStorage.removeItem(k); }); });
    safe(function(){ ANDROMEDA_LOCAL_KEYS.forEach(function(k){ localStorage.removeItem(k); }); });
    if(document.body){
      document.body.classList.remove('andromedaTraceMap','prd-andromeda-map','prd-andromeda-battle','andromeda-battle-active');
      if(document.body.dataset){ delete document.body.dataset.campaign; delete document.body.dataset.andromeda; }
    }
    if(document.documentElement){
      document.documentElement.classList.remove('andromedaTraceMap','prd-andromeda-map','prd-andromeda-battle','andromeda-battle-active');
      if(document.documentElement.dataset){ delete document.documentElement.dataset.campaign; delete document.documentElement.dataset.andromeda; }
    }
  }
  function markNormalMode(){
    clearTestPersistence();
    setSessionMode('normal');
    var r = rt();
    if(r && typeof r.setTestMode === 'function') r.setTestMode(false);
    else if(typeof window.setTestModeEnabled === 'function') safe(function(){ window.setTestModeEnabled(false); });
    setSessionMode('normal');
    safe(function(){ if(typeof window.loadOfflineMeta === 'function') window.loadOfflineMeta(); });
    safe(function(){ if(typeof window.loadStageMapProgress === 'function') window.loadStageMapProgress(); });
    patchStoredMetaTestFlag();
  }
  function markTestMode(){
    safe(function(){
      sessionStorage.setItem('PRD_ENTRY_MODE','test');
      sessionStorage.setItem('PRD_TEST_ENTRY_ACTIVE','1');
      sessionStorage.setItem('PLANET_RIFT_TEST_MODE','1');
    });
    safe(function(){ localStorage.removeItem('PLANET_RIFT_TEST_MODE'); localStorage.removeItem('PRD_TEST_ENTRY_ACTIVE'); localStorage.removeItem('PRD_FORCE_TEST_MODE_ACTIVE'); localStorage.removeItem('PRD_TEST_MODE'); });
    var r = rt();
    if(r && typeof r.setTestMode === 'function') r.setTestMode(true);
    else if(typeof window.setTestModeEnabled === 'function') safe(function(){ window.setTestModeEnabled(true); });
    safe(function(){ if(typeof window.loadOfflineMeta === 'function') window.loadOfflineMeta(); });
    safe(function(){ if(typeof window.loadStageMapProgress === 'function') window.loadStageMapProgress(); });
    safe(function(){ if(typeof window.applyTestModeOverrides === 'function') window.applyTestModeOverrides(); });
    safe(function(){ if(typeof window.renderOfflineMetaPanel === 'function') window.renderOfflineMetaPanel(); });
    state.mode = 'dev';
  }
  function syncModeFromEntry(testMode){ testMode ? markTestMode() : markNormalMode(); }
  function stageMapVisible(){ return visible($('stageMap')); }
  function galaxyMapVisible(){ return visible($('galaxyMap')); }
  function menuVisible(){ return visible($('menu')); }
  function maxStage(){ var r = rt(); return Math.max(1, Number(r && r.getMaxStage && r.getMaxStage()) || $$('#stageMap .stageNode[data-stage]').reduce(function(m,n){ return Math.max(m, Number(n.dataset.stage)||1); }, 1)); }
  function clampStage(v){ var n = Math.floor(Number(v || 1)); if(!Number.isFinite(n)) n = 1; return Math.max(1, Math.min(maxStage(), n)); }
  function normalizeGalaxyId(id){
    if(id === 'milky') return 'milky-rift';
    if(id === 'andromeda') return 'andromeda-frost';
    return GALAXY_ORDER.indexOf(id) >= 0 ? id : 'milky-rift';
  }
  function getMaxImplementedStage(galaxyId){
    var id = normalizeGalaxyId(galaxyId || selectedGalaxyId);
    if(id === 'milky-rift') return 12;
    if(id === 'andromeda-frost') return 15;
    return 0;
  }
  function clearForcedHidden(el){
    if(!el) return;
    if(el.dataset){
      delete el.dataset.v77Hidden;
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
  }
  function setVisibleLayer(el, display){
    if(!el) return;
    clearForcedHidden(el);
    el.style.setProperty('display', display, 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('pointer-events', 'auto', 'important');
  }
  function setHiddenLayer(el){
    if(!el) return;
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
  }
  function showOnly(screen){
    var menu = $('menu'), galaxy = $('galaxyMap'), stage = $('stageMap'), game = $('game');
    screen === 'menu' ? setVisibleLayer(menu, 'flex') : setHiddenLayer(menu);
    screen === 'galaxy' ? setVisibleLayer(galaxy, 'block') : setHiddenLayer(galaxy);
    screen === 'stage' ? setVisibleLayer(stage, 'block') : setHiddenLayer(stage);
    screen === 'game' ? setVisibleLayer(game, 'flex') : setHiddenLayer(game);
    if(document.body){
      document.body.classList.toggle('prd-map-ui-active', screen === 'galaxy' || screen === 'stage');
      document.body.classList.toggle('prd-combat-ui-active', screen === 'game');
      document.body.classList.toggle('prd-battle-active', screen === 'game');
      document.body.classList.toggle('prd-combat-screen-active', screen === 'game');
      if(screen !== 'game') document.body.classList.remove('prd-stage-entering');
    }
    updateState({screen:screen === 'galaxy' ? 'galaxyMap' : (screen === 'stage' ? 'stageMap' : (screen === 'game' ? 'battle' : 'menu'))});
  }
  function syncChromeLater(){
    safe(function(){ if(window.PRD_MAP_HUD_V274 && typeof window.PRD_MAP_HUD_V274.ensureDocks === 'function') window.PRD_MAP_HUD_V274.ensureDocks(); });
    safe(function(){ if(window.PRD_MAP_HUD_RECOVERY_V83_API && typeof window.PRD_MAP_HUD_RECOVERY_V83_API.syncSoon === 'function') window.PRD_MAP_HUD_RECOVERY_V83_API.syncSoon(); });
    safe(function(){ if(typeof window.refreshScreenStarfields === 'function') window.refreshScreenStarfields(); });
  }
  function readJson(key){ return safe(function(){ var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }, null); }
  function clearCountAt(src, stageNo){
    var n = String(stageNo);
    var obj = src || {};
    var clears = obj.clears || obj.stageClears || obj.completed || obj;
    return Number(clears[n] || clears[stageNo] || clears['stage' + n] || clears[n + '-10'] || 0) || 0;
  }
  function milkyComplete(){
    if(isTestMode()) return true;
    var sources = [readJson('planetRiftOfflineMetaV2'), readJson('planetRiftOfflineMetaV1'), readJson('planetRiftStageProgressV3'), readJson('planetRiftStageProgressV2'), readJson('planetRiftGalaxyProgressV1'), readJson('PRD_GALAXY_FLAGS_V1')];
    for(var i=0; i<sources.length; i++){
      var src = sources[i] || {}; var flags = src.flags || src;
      if(flags.milkyRiftCompleted || flags.galaxyMilkyRiftCompleted || flags.andromedaUnlocked || flags.andromedaFrostUnlocked) return true;
      if(Number(flags.openIndex || flags.unlockedGalaxyIndex || 0) >= 2) return true;
      if(clearCountAt(src, 12) > 0) return true;
      var m = Number(src.maxClearedStage || src.clearedStage || src.stage || src.unlockedStage || 0);
      if(Number.isFinite(m) && m >= 12) return true;
    }
    return false;
  }
  function galaxyOpen(id){ if(id === 'milky-rift') return true; if(id === 'andromeda-frost') return isTestMode() || milkyComplete(); return false; }
  function isGalaxyUnlocked(galaxyId){ return galaxyOpen(normalizeGalaxyId(galaxyId)); }
  function selectedGalaxyFromDom(){
    var map = $('galaxyMap');
    var active = document.querySelector('#galaxyNodeLayer .galaxyNode.active[data-galaxy-id]');
    var text = [selectedGalaxyId, active && active.dataset && active.dataset.galaxyId, map && map.dataset && map.dataset.selectedGalaxy, $('galaxyEnterBtn') && $('galaxyEnterBtn').textContent, $('v274GalaxyEnterBtn') && $('v274GalaxyEnterBtn').textContent].join(' ');
    if(/andromeda/i.test(text)) return 'andromeda-frost';
    if(/ember/i.test(text)) return 'ember-spiral';
    if(/void/i.test(text)) return 'void-crown';
    return 'milky-rift';
  }
  function setButton(btn, text, enabled){
    if(!btn) return;
    btn.textContent = text;
    btn.disabled = !enabled;
    btn.classList.toggle('locked', !enabled);
    btn.classList.toggle('disabled', !enabled);
    btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch] || ch; }); }
  function renderGalaxy(id){
    id = GALAXY_ORDER.indexOf(id) >= 0 ? id : 'milky-rift';
    selectedGalaxyId = id;
    updateState({galaxyId:id});
    var map = $('galaxyMap'); if(map) map.dataset.selectedGalaxy = id;
    var data = GALAXY_COPY[id] || GALAXY_COPY['milky-rift'];
    var open = galaxyOpen(id);
    var openCount = isTestMode() ? GALAXY_ORDER.length : (milkyComplete() ? 2 : 1);
    $$('#galaxyNodeLayer .galaxyNode[data-galaxy-id]').forEach(function(node){
      var gid = node.dataset.galaxyId;
      var idx = GALAXY_ORDER.indexOf(gid);
      var nodeOpen = galaxyOpen(gid);
      node.classList.toggle('active', gid === id);
      node.classList.toggle('open', nodeOpen);
      node.classList.toggle('locked', !nodeOpen);
      node.classList.toggle('fogPreview', !nodeOpen && idx === openCount);
      node.classList.toggle('fogDeep', !nodeOpen && idx > openCount);
      var badge = node.querySelector('.galaxyNodeBadge');
      if(badge) badge.textContent = nodeOpen ? (isTestMode() && gid !== 'milky-rift' ? 'TEST OPEN' : 'OPEN') : (idx === openCount ? 'LOCKED' : 'SEALED');
      var lock = node.querySelector('.galaxyLockMark');
      if(lock) lock.style.display = nodeOpen ? 'none' : '';
    });
    var panel = $('galaxyInfoPanel');
    if(panel){
      var title = panel.querySelector('.galaxyInfoTitle');
      var state = panel.querySelector('.galaxyInfoState b');
      var body = panel.querySelector('.galaxyInfoBody');
      var tags = panel.querySelector('.galaxyTagRow');
      if(title) title.innerHTML = esc(data.title) + '<small>' + esc(data.ko) + '</small>';
      if(state) state.textContent = open ? (isTestMode() && id !== 'milky-rift' ? 'TEST OPEN' : data.state) : 'LOCKED';
      if(body) body.textContent = open ? data.body : data.ko + '는 아직 잠겨 있습니다.';
      if(tags) tags.innerHTML = (data.tags || []).map(function(t){ return '<span class="galaxyTag">' + esc(t) + '</span>'; }).join('');
    }
    var label = $('galaxyProgressLabel');
    var sub = $('galaxyProgressSub');
    if(label){
      if(isTestMode()) label.textContent = data.title + ' · TEST OPEN';
      else if(id === 'milky-rift') label.textContent = 'MILKY RIFT · 1 / 4 GALAXIES';
      else if(id === 'andromeda-frost' && open) label.textContent = 'ANDROMEDA TRACE · ACTIVE CAMPAIGN';
      else label.textContent = data.title + ' · LOCKED PREVIEW';
    }
    if(sub){
      if(isTestMode()) sub.textContent = '테스트/개발자 모드에서는 모든 은하 노드가 열립니다.';
      else if(id === 'milky-rift') sub.textContent = '현재는 은하수 균열만 개방되어 있습니다.';
      else if(id === 'andromeda-frost' && open) sub.textContent = '안드로메다 소용돌이 항로가 개방되었습니다.';
      else sub.textContent = '이전 은하의 최종 성역을 완료하면 열립니다.';
    }
    var enterText = open ? data.enter : 'LOCKED';
    setButton($('galaxyEnterBtn'), enterText, open);
    setButton($('v274GalaxyEnterBtn'), enterText, open);
    if($('galaxyEnterBtn')) $('galaxyEnterBtn').dataset.galaxyId = id;
    if($('v274GalaxyEnterBtn')) $('v274GalaxyEnterBtn').dataset.galaxyId = id;
    return {id:id, open:open};
  }
  function showGalaxy(testMode, selected){
    syncModeFromEntry(!!testMode);
    if(!IS_ANDROMEDA) clearAndromedaPersistence();
    showOnly('galaxy');
    renderGalaxy(selected || selectedGalaxyFromDom());
    syncChromeLater();
    setTimeout(function(){ renderGalaxy(selected || selectedGalaxyId); syncChromeLater(); }, 80);
  }
  function parentGalaxyUrl(){
    var url = new URL('../index.html', location.href);
    url.searchParams.set('from','andromeda');
    if(isTestMode()) url.searchParams.set('test','1');
    return url.href;
  }
  function showMenu(){
    if(IS_ANDROMEDA){ location.href = parentGalaxyUrl(); return; }
    markNormalMode();
    clearAndromedaPersistence();
    showOnly('menu');
    syncChromeLater();
  }
  function ensureStageContext(){
    if(IS_ANDROMEDA){
      selectedGalaxyId = 'andromeda-frost';
      updateState({galaxyId:'andromeda-frost'});
      safe(function(){ sessionStorage.setItem('PRD_CAMPAIGN','andromeda'); sessionStorage.setItem('PRD_SELECTED_GALAXY','andromeda-frost'); });
      if(document.body){ document.body.dataset.campaign = 'andromeda'; document.body.classList.add('prd-andromeda-standalone'); }
      if(document.documentElement) document.documentElement.dataset.campaign = 'andromeda';
    }else{
      selectedGalaxyId = 'milky-rift';
      updateState({galaxyId:'milky-rift'});
      clearAndromedaPersistence();
      var stage = $('stageMap');
      if(stage){ stage.dataset.campaign = 'milky'; stage.dataset.galaxy = 'milky-rift'; stage.classList.remove('andromedaTraceMap','prd-andromeda-map'); }
    }
  }
  function showStageMap(selectedStage){
    ensureStageContext();
    safe(function(){ if(typeof window.loadOfflineMeta === 'function') window.loadOfflineMeta(); });
    safe(function(){ if(typeof window.loadStageMapProgress === 'function') window.loadStageMapProgress(); });
    if(isTestMode()) safe(function(){ if(typeof window.applyTestModeOverrides === 'function') window.applyTestModeOverrides(); });
    if(selectedStage) safe(function(){ var r = rt(); if(r && typeof r.setSelected === 'function') r.setSelected(clampStage(selectedStage), {allowLockedPreview:isTestMode()}); });
    showOnly('stage');
    var stage = $('stageMap');
    if(stage){ stage.classList.add('premiumStage'); if(IS_ANDROMEDA) stage.classList.add('andromedaTraceMap','andromedaSpiralMapV9'); }
    var title = document.querySelector('#stageMap .stageTopTitle');
    if(title) title.textContent = IS_ANDROMEDA ? 'ANDROMEDA TRACE' : 'CONSTELLATION MAP';
    var back = $('stageMapBack'); if(back) back.textContent = IS_ANDROMEDA ? '← GALAXY MAP' : '← GALAXY MAP';
    safe(function(){ var r = rt(); if(r && typeof r.render === 'function') r.render(); else if(typeof window.renderStageMap === 'function') window.renderStageMap(); });
    syncStage(clampStage(selectedStage || selectedStageFromDom()));
    syncChromeLater();
    setTimeout(function(){ syncStage(clampStage(selectedStage || selectedStageFromDom())); syncChromeLater(); }, 80);
  }
  function selectedStageFromDom(){
    var map = $('stageMap');
    var active = document.querySelector('#stageMap .stageNode.active[data-stage]');
    var candidates = [];
    if(active && active.dataset) candidates.push(active.dataset.stage);
    if(map && map.dataset) candidates.push(map.dataset.selected);
    var r = rt(); var st = r && r.getState && r.getState();
    if(st && st.selected) candidates.push(st.selected);
    var txt = (($('stageEnterBtn') && $('stageEnterBtn').textContent) || '') + ' ' + (($('v274StageEnterBtn') && $('v274StageEnterBtn').textContent) || '');
    var m = txt.match(/(?:ENTER|LOCKED)\s*(?:·\s*)?(\d+)/i) || txt.match(/SANCTUARY\s*(\d+)/i);
    if(m) candidates.push(m[1]);
    for(var i=0;i<candidates.length;i++){ var n = Number(candidates[i]); if(Number.isFinite(n) && n > 0) return clampStage(n); }
    return 1;
  }
  function stageView(stageNo){
    var r = rt();
    if(r && typeof r.getStageView === 'function') return r.getStageView(clampStage(stageNo));
    var n = clampStage(stageNo);
    var state = r && r.getState ? r.getState() : {unlocked:Number($('stageMap') && $('stageMap').dataset.unlocked || 1), selected:n};
    var unlocked = isTestMode() ? maxStage() : clampStage(state.unlocked || 1);
    return {stage:n, max:maxStage(), unlocked:unlocked, canEnter:isTestMode() || n <= unlocked, def:{stage:n,name:'SANCTUARY '+n,ko:'성역 '+n}, arc:{name:IS_ANDROMEDA?'ANDROMEDA TRACE':'CONSTELLATION MAP',ko:IS_ANDROMEDA?'안드로메다 항로':'성좌 지도'}, presentation:{risk:'-',tags:[]}, copy:{summary:''}, reward:'', hint:''};
  }
  function isStageUnlocked(galaxyId, stageNo){
    var id = normalizeGalaxyId(galaxyId || selectedGalaxyId);
    var n = Math.floor(Number(stageNo || state.selectedStageNo || 1));
    if(!Number.isFinite(n) || n < 1) n = 1;
    if(n > getMaxImplementedStage(id)) return false;
    if(isTestMode()) return true;
    if((IS_ANDROMEDA && id === 'andromeda-frost') || (!IS_ANDROMEDA && id === 'milky-rift')){
      return !!stageView(n).canEnter;
    }
    return id === 'milky-rift' ? n <= 1 : false;
  }
  function currentSelectedStage(){
    var fromState = clampStage(state.selectedStageNo || 1);
    var view = stageView(fromState);
    if(isTestMode() || view.canEnter) return fromState;
    return clampStage(view.unlocked || 1);
  }
  function toastLockedStage(stageNo, view){
    safe(function(){
      if(typeof window.toast === 'function'){
        var arc = view && view.arc && view.arc.ko ? view.arc.ko : '성역';
        window.toast(arc + ' ' + stageNo + '번은 아직 미개방입니다. 현재 선택은 유지됩니다.');
      }
    });
  }
  function syncStage(stageNo){
    var n = clampStage(stageNo);
    var r = rt();
    var view = stageView(n);
    if(!isTestMode() && !view.canEnter){
      n = clampStage(state.selectedStageNo || view.unlocked || 1);
      view = stageView(n);
      if(!view.canEnter){
        n = clampStage(view.unlocked || 1);
        view = stageView(n);
      }
    }
    if(r && typeof r.setSelected === 'function') r.setSelected(n, {allowLockedPreview:isTestMode()});
    view = stageView(n);
    var map = $('stageMap');
    var unlocked = isTestMode() ? view.max : clampStage(view.unlocked || 1);
    if(map){
      map.dataset.selected = String(view.stage);
      map.dataset.unlocked = String(unlocked);
      for(var i=1; i<=view.max; i++) map.classList.remove('stage-selected-' + i);
      map.classList.add('stage-selected-' + view.stage);
    }
    $$('#stageMap .stageNode[data-stage]').forEach(function(node){
      var st = clampStage(node.dataset.stage);
      var open = isTestMode() || st <= unlocked;
      node.classList.toggle('active', st === view.stage);
      node.classList.toggle('unlocked', open);
      node.classList.toggle('locked', !open);
      node.setAttribute('aria-disabled', open ? 'false' : 'true');
      var lock = node.querySelector('.nodeLock'); if(lock) lock.style.display = open ? 'none' : '';
    });
    var def = view.def || {stage:view.stage,name:'SANCTUARY '+view.stage,ko:'성역 '+view.stage};
    var arc = view.arc || {name:IS_ANDROMEDA?'ANDROMEDA TRACE':'CONSTELLATION MAP',ko:IS_ANDROMEDA?'안드로메다 항로':'성좌 지도'};
    var open = !!view.canEnter;
    var label = open ? ('ENTER ' + def.stage + '. ' + def.name) : ('LOCKED · ' + def.stage + '. ' + def.name);
    setButton($('stageEnterBtn'), label, open);
    setButton($('v274StageEnterBtn'), label, open);
    var overlay = $('v274MapInfoOverlay');
    if(overlay && overlay.dataset && overlay.dataset.kind === 'stage') setButton($('v274MapInfoEnterBtn'), label, open);
    var progress = $('stageProgressLabel'), sub = $('stageProgressSub'), hint = $('stageHint');
    if(progress) progress.textContent = (isTestMode() ? 'TEST MODE · ' : '') + arc.name + ' · SANCTUARY ' + def.stage + ' / ' + view.max;
    if(sub) sub.textContent = arc.ko + ' · ' + def.stage + '. ' + def.name + ' / ' + def.ko + ' ' + (open ? '선택됨' : '미개방 미리보기');
    if(hint) hint.textContent = isTestMode() ? ('TEST MODE — ' + def.stage + '. ' + def.name + ' · ' + def.ko + ' / ' + ((view.copy && view.copy.summary) || '')) : (view.hint || (arc.ko + ' · ' + def.stage + '. ' + def.name + ' / ' + def.ko));
    var panel = $('stageInfoPanel'); if(panel) panel.dataset.stage = String(def.stage);
    var title = $('stageInfoTitle'); if(title) title.textContent = arc.ko + ' · ' + def.stage + '. ' + def.name + ' / ' + def.ko;
    var risk = $('stageInfoRisk'); if(risk && view.presentation) risk.textContent = view.presentation.risk || '-';
    var mood = $('stageInfoMood'); if(mood){ mood.textContent = def.ko + ' 설명 · ' + (((view.copy || {}).summary) || '') + (view.reward ? ' 보상: ' + view.reward : ''); mood.title = mood.textContent; }
    var tags = $('stageInfoTags'); if(tags && view.presentation) tags.innerHTML = (view.presentation.tags || []).map(function(t){ return '<span class="stageTag">' + esc(t) + '</span>'; }).join('');
    updateState({selectedStageNo:view.stage});
    syncChromeLater();
    return view;
  }
  function nearestStageFromPoint(x, y){
    var best=null, bestDist=Infinity;
    $$('#stageMap .stageNode[data-stage]').forEach(function(node){
      var r = node.getBoundingClientRect(); if(!r.width || !r.height) return;
      var cx = r.left + r.width/2, cy = r.top + r.height/2;
      var dx = x-cx, dy = y-cy, dist = Math.sqrt(dx*dx+dy*dy);
      if(dist < bestDist && dist <= Math.max(r.width,r.height)*0.95){ best=node; bestDist=dist; }
    });
    return best;
  }
  function stageFromEvent(ev){
    if(!stageMapVisible()) return 0;
    var t = ev && ev.target;
    if(!t || !t.closest) return 0;
    if(t.closest('#stageEnterBtn,#v274StageEnterBtn,#v274MapInfoEnterBtn,#stageInfoPanel,#stageMapBack,#stageGalaxyBtn,#stageTowerManageBtn,#constellationDeck,#v274StageActionDock,#v274MapInfoOverlay')) return 0;
    if(t.closest('#stageMap') && typeof ev.clientX === 'number' && typeof ev.clientY === 'number'){
      var near = nearestStageFromPoint(ev.clientX, ev.clientY); if(near && near.dataset) return clampStage(near.dataset.stage);
    }
    var node = t.closest('#stageMap .stageNode[data-stage]');
    if(node && node.dataset) return clampStage(node.dataset.stage);
    var jump = t.closest('#stageMap [data-constellation-jump]');
    if(jump && jump.dataset) return clampStage(jump.dataset.constellationJump);
    return 0;
  }
  function handleStagePick(ev){
    var n = stageFromEvent(ev);
    if(!n) return false;
    stop(ev);
    var view = stageView(n);
    if(!isTestMode() && !view.canEnter){
      toastLockedStage(n, view);
      syncStage(currentSelectedStage());
      return true;
    }
    syncStage(n);
    requestAnimationFrame(function(){ syncStage(n); });
    return true;
  }
  function targetStageEnter(ev){
    if(!stageMapVisible()) return null;
    var t = ev && ev.target;
    if(!t || !t.closest) return null;
    var btn = t.closest('#stageEnterBtn,#v274StageEnterBtn,#v274MapInfoEnterBtn,[data-stage-enter],.stageEnter');
    if(!btn) return null;
    if(btn.id === 'stageGalaxyBtn' || btn.classList.contains('stageGalaxyEnter')) return null;
    if(btn.id === 'v274MapInfoEnterBtn'){
      var overlay = $('v274MapInfoOverlay');
      if(overlay && overlay.dataset && overlay.dataset.kind && overlay.dataset.kind !== 'stage') return null;
    }
    if(btn.disabled || btn.getAttribute('aria-disabled') === 'true') return null;
    var txt = String(btn.textContent || '');
    if(/LOCKED|미개방/i.test(txt)) return null;
    return btn;
  }
  function forceBattleStage(stageNo){
    var n = clampStage(stageNo);
    safe(function(){ var r = rt(); if(r && typeof r.setSelected === 'function') r.setSelected(n, {allowLockedPreview:isTestMode()}); });
    safe(function(){
      if(window.StageMapState){
        window.StageMapState.selected = n;
        window.StageMapState.current = n;
        if(isTestMode()) window.StageMapState.unlocked = Math.max(Number(window.StageMapState.unlocked || 1), n);
      }
    });
    var map = $('stageMap');
    if(map && map.dataset) map.dataset.selected = String(n);
    return n;
  }
  function ensureBattleVisible(){
    var game = $('game');
    if(!game) return false;
    var cs = getComputedStyle(game);
    var ok = cs.display !== 'none' && cs.visibility !== 'hidden';
    if(!ok) return false;
    showOnly('game');
    if(document.body) document.body.classList.remove('prd-stage-entering');
    return true;
  }
  function rollbackStageMap(){
    enterLock = false;
    if(document.body) document.body.classList.remove('prd-stage-entering');
    showOnly('stage');
    syncStage(selectedStageFromDom());
  }
  function enterSelectedStage(ev){
    if(document.body) document.body.classList.remove('prd-result-stage-map-direct-v116');
    var gameForV116 = $('game'); if(gameForV116) gameForV116.hidden = false;
    var btn = targetStageEnter(ev);
    if(!btn) return false;
    stop(ev);
    if(enterLock && now() - lastActionAt < 900) return true;
    enterLock = true; lastActionAt = now();
    var n = currentSelectedStage();
    var view = syncStage(n);
    if(!view.canEnter){ rollbackStageMap(); return true; }
    if(IS_ANDROMEDA){
      safe(function(){ sessionStorage.setItem('PRD_CAMPAIGN','andromeda'); sessionStorage.setItem('PRD_SELECTED_GALAXY','andromeda-frost'); sessionStorage.setItem('PRD_ANDROMEDA_BATTLE_ACTIVE','1'); sessionStorage.setItem('PRD_ANDROMEDA_STAGE_NO', String(view.stage)); });
    }else{
      clearAndromedaPersistence();
    }
    safe(function(){ window.PRD_STAGE_RESULT_PENDING = false; window.PRD_STAGE_RESULT_PENDING_AT = 0; });
    forceBattleStage(view.stage);
    showOnly('game');
    forceBattleStage(view.stage);
    var result = safe(function(){ var r = rt(); return r && typeof r.start === 'function' ? r.start(view.stage) : (window.PRD_BATTLE && window.PRD_BATTLE.startSelectedStageFromMap ? window.PRD_BATTLE.startSelectedStageFromMap() : window.startSelectedStageFromMap && window.startSelectedStageFromMap()); }, false);
    var checked = false;
    function verify(){
      if(checked) return;
      var game = $('game');
      var ok = game && getComputedStyle(game).display !== 'none';
      if(result === false || !ok){ checked = true; rollbackStageMap(); return; }
      checked = true; ensureBattleVisible(); enterLock = false;
    }
    requestAnimationFrame(verify);
    setTimeout(verify, 120);
    setTimeout(function(){ if(!ensureBattleVisible()) rollbackStageMap(); enterLock = false; }, 700);
    return true;
  }
  function targetGalaxyNode(ev){ var t=ev&&ev.target; return t && t.closest ? t.closest('#galaxyNodeLayer .galaxyNode[data-galaxy-id]') : null; }
  function selectGalaxyFromEvent(ev){
    if(!galaxyMapVisible()) return false;
    var node = targetGalaxyNode(ev); if(!node) return false;
    stop(ev);
    renderGalaxy(node.dataset.galaxyId || 'milky-rift');
    return true;
  }
  function targetGalaxyEnter(ev){
    if(!galaxyMapVisible()) return null;
    var t=ev&&ev.target; if(!t || !t.closest) return null;
    var btn = t.closest('#galaxyEnterBtn,#v274GalaxyEnterBtn,.galaxyEnterBtn');
    if(!btn) return null;
    if(btn.disabled || btn.getAttribute('aria-disabled') === 'true') return null;
    return btn;
  }
  function enterGalaxyById(id){
    id = normalizeGalaxyId(id || selectedGalaxyFromDom());
    var rendered = renderGalaxy(id);
    if(!rendered.open) return true;
    if(id === 'andromeda-frost'){
      if(IS_ANDROMEDA){ showStageMap(); return true; }
      safe(function(){ sessionStorage.setItem('PRD_CAMPAIGN','andromeda'); sessionStorage.setItem('PRD_SELECTED_GALAXY','andromeda-frost'); });
      var qs = isTestMode() ? '?test=1&from=galaxy&campaign=andromeda' : '?from=galaxy&campaign=andromeda';
      location.href = new URL('andromeda/index.html' + qs, location.href).href;
    }else{
      showStageMap();
    }
    return true;
  }
  function enterGalaxyFromButton(ev){
    var btn = targetGalaxyEnter(ev); if(!btn) return false;
    stop(ev);
    var id = (btn.dataset && btn.dataset.galaxyId) || selectedGalaxyFromDom();
    return enterGalaxyById(id);
  }
  function handleStageBack(ev){
    var t=ev&&ev.target; if(!t || !t.closest) return false;
    var target = t.closest('#stageMapBack,#stageGalaxyBtn');
    if(!target || !stageMapVisible()) return false;
    stop(ev);
    if(IS_ANDROMEDA){ safe(function(){ sessionStorage.removeItem('PRD_ANDROMEDA_BATTLE_ACTIVE'); sessionStorage.removeItem('PRD_ANDROMEDA_STAGE_NO'); }); location.href = parentGalaxyUrl(); }
    else showGalaxy(isTestMode(), 'milky-rift');
    return true;
  }
  function handleGalaxyBack(ev){
    var t=ev&&ev.target; if(!t || !t.closest) return false;
    if(!t.closest('#galaxyMapBack') || !galaxyMapVisible()) return false;
    stop(ev); showMenu(); return true;
  }
  function handleInfoButtons(ev){
    var t=ev&&ev.target; if(!t || !t.closest) return false;
    var info = t.closest('#v274GalaxyInfoBtn,#v274StageInfoBtn');
    if(info){
      stop(ev);
      var kind = info.id === 'v274GalaxyInfoBtn' ? 'galaxy' : 'stage';
      safe(function(){
        if(window.PRD_MAP_HUD_RECOVERY_V83_API && typeof window.PRD_MAP_HUD_RECOVERY_V83_API.openInfo === 'function') window.PRD_MAP_HUD_RECOVERY_V83_API.openInfo(kind);
        else if(window.PRD_MAP_HUD_V274 && typeof window.PRD_MAP_HUD_V274.openInfo === 'function') window.PRD_MAP_HUD_V274.openInfo(kind);
      });
      return true;
    }
    var enter = t.closest('#v274MapInfoEnterBtn');
    if(enter){
      var overlay = $('v274MapInfoOverlay');
      if(overlay && overlay.dataset && overlay.dataset.kind === 'galaxy'){ stop(ev); return enterGalaxyById(selectedGalaxyFromDom()); }
      if(overlay && overlay.dataset && overlay.dataset.kind === 'stage') return enterSelectedStage(ev);
    }
    return false;
  }
  function openCurrentStageInfo(){
    syncStage(currentSelectedStage());
    safe(function(){ if(window.PRD_MAP_HUD_RECOVERY_V83_API && typeof window.PRD_MAP_HUD_RECOVERY_V83_API.openInfo === 'function') window.PRD_MAP_HUD_RECOVERY_V83_API.openInfo('stage'); });
    safe(function(){ if(!window.PRD_MAP_HUD_RECOVERY_V83_API && window.PRD_MAP_HUD_V274 && typeof window.PRD_MAP_HUD_V274.openInfo === 'function') window.PRD_MAP_HUD_V274.openInfo('stage'); });
  }
  function renderDock(){ syncChromeLater(); }
  function renderModeLabel(){ if(stageMapVisible()) syncStage(currentSelectedStage()); else if(galaxyMapVisible()) renderGalaxy(selectedGalaxyId); }
  function menuAction(ev){
    if(!menuVisible()) return '';
    var t = ev && ev.target;
    if(t && t.closest){
      if(t.closest('#startBtn')) return 'start';
      if(t.closest('#testModeBtn')) return 'test';
      if(t.closest('#runLogBtn')) return 'log';
    }
    return '';
  }
  function handleMenu(ev){
    var action = menuAction(ev); if(!action) return false;
    stop(ev);
    if(action === 'start') showGalaxy(false, 'milky-rift');
    else if(action === 'test'){ showGalaxy(true, selectedGalaxyId || 'milky-rift'); safe(function(){ if(typeof window.toast === 'function') window.toast('TEST MODE 활성화 — 모든 성역과 기본 타워가 해금되었습니다'); }); }
    else if(action === 'log'){
      var btn = $('runLogBtn');
      safe(function(){ if(btn && typeof btn.onclick === 'function') btn.onclick.call(btn, ev); });
    }
    return true;
  }
  function captureClick(ev){
    if(handleMenu(ev)) return;
    if(handleInfoButtons(ev)) return;
    if(handleStageBack(ev)) return;
    if(handleGalaxyBack(ev)) return;
    if(enterSelectedStage(ev)) return;
    if(enterGalaxyFromButton(ev)) return;
    if(selectGalaxyFromEvent(ev)) return;
    handleStagePick(ev);
  }
  function capturePointer(ev){
    if(handleInfoButtons(ev)) return;
    if(handleStageBack(ev)) return;
    if(handleGalaxyBack(ev)) return;
    if(enterSelectedStage(ev)) return;
    if(enterGalaxyFromButton(ev)) return;
    if(selectGalaxyFromEvent(ev)) return;
    handleStagePick(ev);
  }
  function enterSelectedGalaxy(){ return enterGalaxyById(selectedGalaxyFromDom()); }
  function publicSelectGalaxy(galaxyId){ return renderGalaxy(normalizeGalaxyId(galaxyId)); }
  function publicSelectStage(stageNo){ return syncStage(stageNo); }
  function enterNormalMode(){ showGalaxy(false, 'milky-rift'); }
  function enterDevMode(){ showGalaxy(true, selectedGalaxyId || 'milky-rift'); }
  function boot(){
    if(queryTestRequested()) markTestMode();
    else if(!sessionTestRequested()) { clearTestPersistence(); setSessionMode('normal'); safe(function(){ var r=rt(); if(r && r.setTestMode) r.setTestMode(false); }); setSessionMode('normal'); }
    var resultStageMapRequested = safe(function(){ var q = new URLSearchParams(location.search || ''); return q.get('resultStageMap') === '1' || q.get('screen') === 'stage' || !!sessionStorage.getItem('PRD_RESULT_STAGE_MAP_RETURN_STAGE_V116'); }, false);
    if(resultStageMapRequested){
      var resultStageMapStage = safe(function(){ var q = new URLSearchParams(location.search || ''); return Number(q.get('stage') || q.get('selectedStage') || sessionStorage.getItem('PRD_RESULT_STAGE_MAP_RETURN_STAGE_V116') || 1); }, 1);
      showStageMap(resultStageMapStage || 1);
      safe(function(){ sessionStorage.removeItem('PRD_RESULT_STAGE_MAP_RETURN_STAGE_V116'); sessionStorage.removeItem('PRD_RESULT_STAGE_MAP_RETURN_TS_V116'); });
      safe(function(){ var url = new URL(location.href); ['resultStageMap','screen','stage','selectedStage','prdReturn'].forEach(function(k){ url.searchParams.delete(k); }); history.replaceState(null, '', url.pathname + (url.search ? url.search : '') + (url.hash || '')); });
      return;
    }
    if(IS_ANDROMEDA){
      if(queryFlag('from') || queryFlag('campaign') || safe(function(){ return sessionStorage.getItem('PRD_CAMPAIGN') === 'andromeda'; }, false)) showStageMap();
    }else if(safe(function(){ return new URLSearchParams(location.search || '').get('from') === 'andromeda'; }, false)){
      showGalaxy(isTestMode(), 'andromeda-frost');
    }else{
      if(galaxyMapVisible()) renderGalaxy(selectedGalaxyFromDom());
      else if(stageMapVisible()) syncStage(selectedStageFromDom());
      else if(!menuVisible()){
        clearAndromedaPersistence();
        showOnly('menu');
        syncChromeLater();
      }
    }
  }
  window.addEventListener('click', captureClick, true);
  window.addEventListener('pointerup', capturePointer, {capture:true, passive:false});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('load', function(){ boot(); setTimeout(boot, 80); }, {once:true});
  window.addEventListener('pageshow', function(){ setTimeout(boot, 0); }, {passive:true});
  window.PRD_STAGE_FLOW = {
    getState:getState,
    enterNormalMode:enterNormalMode,
    enterDevMode:enterDevMode,
    selectGalaxy:publicSelectGalaxy,
    enterSelectedGalaxy:enterSelectedGalaxy,
    selectStage:publicSelectStage,
    openCurrentStageInfo:openCurrentStageInfo,
    enterCurrentStageBattle:function(){ return enterSelectedStage({target:$('stageEnterBtn'), cancelable:true, preventDefault:function(){}, stopPropagation:function(){}, stopImmediatePropagation:function(){}}); },
    renderGalaxyMap:function(){ return renderGalaxy(selectedGalaxyId); },
    renderStageMap:function(){ return showStageMap(currentSelectedStage()); },
    renderDock:renderDock,
    renderModeLabel:renderModeLabel,
    isGalaxyUnlocked:isGalaxyUnlocked,
    isStageUnlocked:isStageUnlocked,
    getMaxImplementedStage:getMaxImplementedStage
  };
  window.PRD_STAGE_FLOW_CONTROLLER_V46_API = {showGalaxy:showGalaxy, showStageMap:showStageMap, syncStage:syncStage, renderGalaxy:renderGalaxy, isTestMode:isTestMode, clearTestPersistence:clearTestPersistence, clearAndromedaPersistence:clearAndromedaPersistence, enterSelectedStage:window.PRD_STAGE_FLOW.enterCurrentStageBattle, getState:getState};
})();
