/* ===== v23-galaxy-map-canonical-controller =====
   Clean replacement for stacked v18~v22 galaxy patches.
   Rules:
   - Normal play: Milky Rift open. Andromeda opens after Milky completion. Future galaxies remain fogged/locked.
   - Test/dev mode: Milky Rift + Andromeda Trace open only. Ember Spiral / Void Crown remain locked.
   - No battle, stage route, tower, reward, or save schema changes. */
(function(){
  'use strict';
  var ORDER = ['milky-rift','andromeda-frost','ember-spiral','void-crown'];
  var TEST_OPEN_COUNT = 2;
  var pending = false;
  var observer = null;
  var lastSelected = 'milky-rift';
  var COPY = {
    'milky-rift': {
      title:'MILKY RIFT', ko:'은하수 균열', enter:'ENTER MILKY RIFT',
      stateOpen:'OPEN', route:'CORE ROUTE', count:'15 STAGES', reward:'RESTORATION',
      body:'기본 은하수 캠페인입니다. 최종 성역을 복원하면 안드로메다 소용돌이 항로가 개방됩니다.'
    },
    'andromeda-frost': {
      title:'ANDROMEDA TRACE', ko:'안드로메다 항로', enter:'ENTER ANDROMEDA TRACE',
      stateOpen:'OPEN', route:'SPIRAL ROUTE', count:'15 STAGES', reward:'ANDROMEDA',
      body:'은하수 균열 복원 이후 열리는 15개 성역의 안드로메다 소용돌이 캠페인입니다.'
    },
    'ember-spiral': {
      title:'EMBER SPIRAL', ko:'잿불 나선은하', enter:'LOCKED',
      stateOpen:'LOCKED', route:'COMING SOON', count:'LOCKED', reward:'FUTURE',
      body:'안드로메다 이후 확장될 다음 은하입니다. 현재는 공허 안개에 가려져 있습니다.'
    },
    'void-crown': {
      title:'VOID CROWN', ko:'공허 왕관', enter:'LOCKED',
      stateOpen:'LOCKED', route:'COMING SOON', count:'LOCKED', reward:'FUTURE',
      body:'최종 확장 은하입니다. 앞선 은하가 복원되기 전까지 거의 보이지 않도록 봉인되어 있습니다.'
    }
  };
  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try{ return fn(); }catch(err){ console.warn('[galaxy v23]', err); return fallback; } }
  function text(el){ return (el && (el.textContent || el.innerText) || '').trim(); }
  function readJson(key){ return safe(function(){ var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }, null); }
  function meta(){ return (typeof window.META !== 'undefined' && window.META) || readJson('planetRiftOfflineMetaV2') || readJson('planetRiftOfflineMetaV1') || {}; }
  function stageProgress(){ return readJson('planetRiftStageProgressV3') || readJson('planetRiftStageProgressV2') || {}; }
  function maxStage(){ return safe(function(){ return Array.isArray(window.STAGE_MAP_DEFS) ? window.STAGE_MAP_DEFS.length : 15; }, 15); }
  function clearCountFor(stageNo){
    var m = meta();
    var clears = (m && m.clears) || {};
    var progress = stageProgress();
    var v = Number(clears[String(stageNo)] || clears[stageNo] || progress[String(stageNo)] || progress[stageNo] || 0);
    return Number.isFinite(v) ? v : 0;
  }
  function hasMilkyCompletion(){
    var m = meta();
    var flags = (m && m.flags) || {};
    if(flags.milkyRiftCompleted || flags.galaxyMilkyRiftCompleted) return true;
    var gp = readJson('planetRiftGalaxyProgressV1') || {};
    if(gp.milkyRiftCompleted || Number(gp.openIndex || 1) >= 2) return true;
    return clearCountFor(12) > 0 || clearCountFor(maxStage()) > 0;
  }
  function visibleTestLabel(){
    var label = byId('galaxyProgressLabel');
    var sub = byId('galaxyProgressSub');
    return /TEST\s*MODE/i.test(text(label)) || /TEST\s*OPEN/i.test(text(byId('galaxyInfoPanel'))) || /테스트\s*모드/.test(text(sub));
  }
  function queryTest(){
    var q = String(location.search || '').toLowerCase();
    return q.indexOf('test=1') >= 0 || q.indexOf('testmode=1') >= 0 || q.indexOf('dev=1') >= 0;
  }
  function storedTest(){
    return safe(function(){
      if(sessionStorage.getItem('PRD_TEST_ENTRY_ACTIVE') === '1') return true;
      if(sessionStorage.getItem('PLANET_RIFT_TEST_MODE') === '1') return true;
      return false;
    }, false);
  }
  function testModeActive(){
    return !!(
      window.PRD_FORCE_TEST_MODE_ACTIVE === true ||
      window.__PRD_TEST_MODE_ACTIVE === true ||
      (window.TEST_MODE_CONFIG && window.TEST_MODE_CONFIG.enabled) ||
      (window.META && window.META.flags && window.META.flags.testMode === true) ||
      (document.body && document.body.classList.contains('test-mode-active')) ||
      storedTest() || queryTest() || visibleTestLabel()
    );
  }
  function canonicalOpenCount(){
    if(testModeActive()) return TEST_OPEN_COUNT;
    var open = hasMilkyCompletion() ? 2 : 1;
    var gp = readJson('planetRiftGalaxyProgressV1') || {};
    var m = meta();
    var flags = (m && m.flags) || {};
    if(flags.andromedaFrostCompleted || gp.andromedaFrostCompleted) open = Math.max(open, 3);
    if(flags.emberSpiralCompleted || gp.emberSpiralCompleted) open = Math.max(open, 4);
    return Math.max(1, Math.min(ORDER.length, open));
  }
  function galaxyIndex(id){ return ORDER.indexOf(id); }
  function validId(id){ return galaxyIndex(id) >= 0 ? id : null; }
  function selectedId(){
    var map = byId('galaxyMap');
    var id = validId(map && map.dataset && map.dataset.selectedGalaxy);
    return id || lastSelected || (testModeActive() ? 'andromeda-frost' : 'milky-rift');
  }
  function recommendedId(){
    var open = canonicalOpenCount();
    if(testModeActive()) return 'andromeda-frost';
    return ORDER[Math.max(0, Math.min(open - 1, ORDER.length - 1))] || 'milky-rift';
  }
  function isOpen(id){
    var idx = galaxyIndex(id);
    return idx >= 0 && idx < canonicalOpenCount();
  }
  function depthFor(id){
    var idx = galaxyIndex(id);
    var open = canonicalOpenCount();
    if(idx < 0 || idx < open) return 0;
    return idx === open ? 1 : 2;
  }
  function copy(id){ return COPY[id] || COPY['milky-rift']; }
  function ensureLock(node){
    if(!node) return null;
    var lock = node.querySelector('.galaxyLockMark');
    if(!lock){
      lock = document.createElement('div');
      lock.className = 'galaxyLockMark';
      lock.setAttribute('aria-hidden','true');
      node.appendChild(lock);
    }
    lock.textContent = '🔒';
    return lock;
  }
  function removeLocks(node){
    if(!node) return;
    Array.prototype.slice.call(node.querySelectorAll('.galaxyLockMark,[class*="LockMark"],[class*="lockMark"]')).forEach(function(el){
      safe(function(){ el.remove(); });
    });
  }
  function setButton(btn, open, label){
    if(!btn) return;
    btn.textContent = open ? (label || 'ENTER ANDROMEDA TRACE') : 'LOCKED';
    btn.disabled = !open;
    btn.classList.toggle('lockedGalaxyEnter', !open);
    btn.classList.toggle('disabled', !open);
    btn.setAttribute('aria-disabled', open ? 'false' : 'true');
    if(open){
      btn.removeAttribute('disabled');
      btn.style.setProperty('opacity','1','important');
      btn.style.setProperty('filter','none','important');
      btn.style.setProperty('pointer-events','auto','important');
    }else{
      btn.style.setProperty('opacity','.46','important');
      btn.style.setProperty('filter','saturate(.45) brightness(.62)','important');
      btn.style.setProperty('pointer-events','none','important');
    }
  }
  function renderNode(node, id, active){
    var open = isOpen(id);
    var depth = depthFor(id);
    node.classList.add('galaxyNodeV23');
    node.classList.toggle('active', !!active);
    node.classList.toggle('open', open);
    node.classList.toggle('locked', !open);
    node.classList.toggle('fogPreview', !open && depth === 1);
    node.classList.toggle('fogDeep', !open && depth >= 2);
    node.classList.toggle('fogHidden', !open && depth >= 2);
    node.classList.toggle('galaxyOpenV23', open);
    node.classList.toggle('galaxyLockedV23', !open);
    node.classList.toggle('galaxyPreviewV23', !open && depth === 1);
    node.classList.toggle('galaxyDeepFogV23', !open && depth >= 2);
    node.dataset.lockedDepth = String(depth);
    node.dataset.testOpen = (testModeActive() && open) ? '1' : '0';
    node.setAttribute('aria-disabled', open ? 'false' : 'true');
    if(open){
      removeLocks(node);
      node.removeAttribute('disabled');
      node.style.setProperty('opacity','1','important');
      node.style.setProperty('filter','none','important');
      node.style.setProperty('pointer-events','auto','important');
    }else{
      ensureLock(node);
      node.style.removeProperty('opacity');
      node.style.removeProperty('filter');
      node.style.setProperty('pointer-events','auto','important');
    }
    var badge = node.querySelector('.galaxyNodeBadge');
    if(badge){
      badge.textContent = open ? (testModeActive() && id === 'andromeda-frost' ? 'TEST OPEN' : 'OPEN') : (depth === 1 ? 'LOCKED' : 'SEALED');
    }
  }
  function renderInfo(id){
    var data = copy(id);
    var open = isOpen(id);
    var depth = depthFor(id);
    var inTest = testModeActive();
    var label = byId('galaxyProgressLabel');
    var sub = byId('galaxyProgressSub');
    var title = document.querySelector('#galaxyInfoPanel .galaxyInfoTitle');
    var state = document.querySelector('#galaxyInfoPanel .galaxyInfoState b');
    var body = document.querySelector('#galaxyInfoPanel .galaxyInfoBody');
    var tags = document.querySelector('#galaxyInfoPanel .galaxyTagRow');
    if(label){
      if(inTest) label.textContent = 'TEST MODE · ANDROMEDA TRACE · ' + (open ? 'TEST OPEN' : 'FUTURE LOCKED');
      else label.textContent = data.title + ' · ' + (open ? 'OPEN' : depth === 1 ? 'LOCKED PREVIEW' : 'SEALED');
    }
    if(sub){
      if(inTest) sub.textContent = '테스트/개발자 모드에서는 은하수와 안드로메다까지만 열립니다. 3, 4번째 은하는 잠금 유지됩니다.';
      else if(open) sub.textContent = id === 'milky-rift' ? '은하수 최종 성역 완료 시 안드로메다가 개방됩니다.' : '개방된 은하 캠페인입니다.';
      else if(depth === 1) sub.textContent = '다음 개방 대상입니다. 이전 은하 최종 성역을 완료하면 열립니다.';
      else sub.textContent = '아직 공허 안개에 가려진 후속 은하입니다.';
    }
    if(title) title.innerHTML = data.title + '<small>' + data.ko + '</small>';
    if(state) state.textContent = open ? (inTest && id === 'andromeda-frost' ? 'TEST OPEN' : data.stateOpen) : 'LOCKED';
    if(body) body.textContent = open ? data.body : (depth === 1 ? data.body : '먼 은하의 신호가 아직 거의 감지되지 않습니다. 앞선 은하를 먼저 복원하세요.');
    if(tags){
      tags.innerHTML = open
        ? '<span class="galaxyTag">'+data.route+'</span><span class="galaxyTag">'+data.count+'</span><span class="galaxyTag">'+(inTest && id === 'andromeda-frost' ? 'TEST OPEN' : data.reward)+'</span>'
        : '<span class="galaxyTag">LOCKED</span><span class="galaxyTag">'+(depth === 1 ? 'PREVIEW FOG' : 'DEEP VOID FOG')+'</span><span class="galaxyTag">FUTURE</span>';
    }
    setButton(byId('galaxyEnterBtn'), open, id === 'milky-rift' && inTest ? COPY['andromeda-frost'].enter : data.enter);
    setButton(byId('v274GalaxyEnterBtn'), open, id === 'milky-rift' && inTest ? COPY['andromeda-frost'].enter : data.enter);
  }
  function apply(prefer, options){
    options = options || {};
    var map = byId('galaxyMap');
    if(!map) return false;
    var inTest = testModeActive();
    var openCount = canonicalOpenCount();
    var id = validId(prefer) || selectedId() || recommendedId();
    if(options.forceRecommended || !validId(id)) id = recommendedId();
    if(!isOpen(id) && !options.allowLockedInfo) id = recommendedId();
    if(inTest && id === 'milky-rift' && options.forceRecommended !== false) id = 'andromeda-frost';
    lastSelected = id;
    map.classList.add('galaxyCanonicalV23');
    map.classList.toggle('galaxyTestAndromedaOnlyV23', inTest);
    map.classList.toggle('galaxyNormalV23', !inTest);
    map.classList.remove('galaxyTestOpenAll','galaxyTestOpenAllV20','galaxyTestOpenAllV21','galaxyTestAndromedaOnlyV22');
    map.dataset.openGalaxyIndex = String(openCount);
    map.dataset.selectedGalaxy = id;
    document.documentElement.classList.toggle('prd-galaxy-test-andromeda-only', inTest);
    if(document.body) document.body.classList.toggle('test-mode-active', inTest || (document.body && document.body.classList.contains('test-mode-active')));
    map.querySelectorAll('#galaxyNodeLayer .galaxyNode[data-galaxy-id]').forEach(function(node){
      renderNode(node, node.dataset.galaxyId, node.dataset.galaxyId === id);
    });
    renderInfo(id);
    return true;
  }
  function schedule(prefer, options){
    if(pending) return;
    pending = true;
    requestAnimationFrame(function(){ pending = false; apply(prefer, options || {}); });
  }
  function burst(prefer, options){
    [0,40,120,260,520].forEach(function(ms){ setTimeout(function(){ apply(prefer, options || {}); }, ms); });
  }
  function enterSelected(){
    var id = selectedId();
    if(testModeActive() && id === 'milky-rift') id = 'andromeda-frost';
    if(!isOpen(id)){
      if(typeof window.toast === 'function') window.toast(depthFor(id) === 1 ? '이전 은하를 완료하면 개방됩니다.' : '아직 먼 은하입니다. 공허 안개가 차단하고 있습니다.');
      apply(id, {allowLockedInfo:true});
      return;
    }
    if(window.PRD_NAV && typeof window.PRD_NAV.showStage === 'function') window.PRD_NAV.showStage();
    else if(typeof window.showStageMap === 'function') window.showStageMap();
  }
  function onClick(e){
    var node = e.target && e.target.closest && e.target.closest('#galaxyNodeLayer .galaxyNode[data-galaxy-id]');
    if(node){
      e.preventDefault();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      var id = node.dataset.galaxyId;
      apply(id, {allowLockedInfo:true, forceRecommended:false});
      if(!isOpen(id) && typeof window.toast === 'function') window.toast(depthFor(id) === 1 ? '다음 은하입니다. 이전 은하를 완료하면 개방됩니다.' : '아직 먼 은하입니다. 공허 안개가 짙게 차단하고 있습니다.');
      return false;
    }
    var enter = e.target && e.target.closest && e.target.closest('#galaxyEnterBtn,#v274GalaxyEnterBtn');
    if(enter){
      e.preventDefault();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      enterSelected();
      return false;
    }
    if(e.target && e.target.closest && e.target.closest('#testModeBtn')){
      window.PRD_FORCE_TEST_MODE_ACTIVE = true;
      window.__PRD_TEST_MODE_ACTIVE = true;
      safe(function(){ sessionStorage.setItem('PRD_TEST_ENTRY_ACTIVE','1'); sessionStorage.setItem('PLANET_RIFT_TEST_MODE','1'); });
      burst('andromeda-frost', {forceRecommended:true});
    }
  }
  function onPointer(e){
    var node = e.target && e.target.closest && e.target.closest('#galaxyNodeLayer .galaxyNode[data-galaxy-id]');
    if(!node) return;
    schedule(node.dataset.galaxyId, {allowLockedInfo:true, forceRecommended:false});
  }
  function wrapShowGalaxy(){
    var old = window.showGalaxyMapClean;
    if(typeof old === 'function' && !old.__galaxyV23Wrapped){
      var wrapped = function(){
        var ret = old.apply(this, arguments);
        burst(testModeActive() ? 'andromeda-frost' : recommendedId(), {forceRecommended:true});
        return ret;
      };
      wrapped.__galaxyV23Wrapped = true;
      window.showGalaxyMapClean = wrapped;
    }
  }
  function boot(){
    wrapShowGalaxy();
    document.addEventListener('click', onClick, true);
    document.addEventListener('pointerover', onPointer, true);
    document.addEventListener('mouseover', onPointer, true);
    document.addEventListener('focusin', onPointer, true);
    if(observer) observer.disconnect();
    observer = new MutationObserver(function(mutations){
      var should = false;
      for(var i=0;i<mutations.length;i++){
        var target = mutations[i].target;
        if(target && target.nodeType === 1 && (target.id === 'galaxyMap' || (target.closest && target.closest('#galaxyMap')) || target.id === 'galaxyProgressLabel')){ should = true; break; }
      }
      if(should) schedule(lastSelected || recommendedId(), {forceRecommended:false});
    });
    var root = byId('galaxyMap') || document.body || document.documentElement;
    if(root) observer.observe(root, {subtree:true, childList:true, attributes:true, attributeFilter:['class','style','data-selected-galaxy','data-open-galaxy-index','disabled','aria-disabled']});
    burst(testModeActive() ? 'andromeda-frost' : recommendedId(), {forceRecommended:true});
    setTimeout(function(){ apply(testModeActive() ? 'andromeda-frost' : recommendedId(), {forceRecommended:true}); }, 900);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  window.addEventListener('load', function(){ burst(testModeActive() ? 'andromeda-frost' : recommendedId(), {forceRecommended:true}); }, {once:true});
  window.PRD_GALAXY_CANONICAL_V23 = {apply:apply, isTest:testModeActive, openCount:canonicalOpenCount, isOpen:isOpen, burst:burst};
})();
