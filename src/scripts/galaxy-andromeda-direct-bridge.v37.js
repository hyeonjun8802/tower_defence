(function(){
  'use strict';
  const GALAXIES = ['milky-rift','andromeda-frost','ember-spiral','void-crown'];
  const COPY = {
    'milky-rift': {
      title:'MILKY RIFT', ko:'은하수 균열', state:'OPEN', enter:'ENTER MILKY RIFT',
      body:'현재 플레이 가능한 본편 은하입니다. 성좌 내부로 진입해 12개 성역을 순차적으로 복원합니다.',
      tags:['CORE ROUTE','12 STAGES','RESTORATION']
    },
    'andromeda-frost': {
      title:'ANDROMEDA TRACE', ko:'안드로메다 항로', state:'OPEN', enter:'ENTER ANDROMEDA TRACE',
      body:'은하수 최종 성역 완료 후 열리는 안드로메다 소용돌이 캠페인입니다.',
      tags:['SPIRAL ROUTE','15 STAGES','ANDROMEDA']
    },
    'ember-spiral': {
      title:'EMBER SPIRAL', ko:'잿불 나선은하', state:'LOCKED', enter:'LOCKED',
      body:'후속 은하입니다. 현재 빌드에서는 잠금 상태로 유지합니다.', tags:['LOCKED','FUTURE','SEALED']
    },
    'void-crown': {
      title:'VOID CROWN', ko:'공허 왕관', state:'LOCKED', enter:'LOCKED',
      body:'최후반 은하입니다. 현재 빌드에서는 잠금 상태로 유지합니다.', tags:['LOCKED','FUTURE','SEALED']
    }
  };
  const $ = (id)=>document.getElementById(id);
  const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));
  function flowActive(){
    return !!(window.PRD_STAGE_FLOW_CONTROLLER_ACTIVE || window.PRD_DISABLE_LEGACY_FLOW_HANDLERS || window.PRD_STAGE_FLOW);
  }
  function isExplicitTestMode(){
    try{
      const params = new URLSearchParams(location.search);
      const q = params.get('test') || params.get('testmode') || params.get('qa') || params.get('debug');
      if(/^(1|true|yes|on)$/i.test(String(q || ''))) return true;
      if(sessionStorage.getItem('PRD_TEST_ENTRY_ACTIVE') === '1') return true;
      if(sessionStorage.getItem('PLANET_RIFT_TEST_MODE') === '1') return true;
    }catch(_){ }
    return false;
  }
  function isTestMode(){
    if(!isExplicitTestMode()) return false;
    if(window.PRD_STAGE_RUNTIME && typeof window.PRD_STAGE_RUNTIME.isTestMode === 'function') return !!window.PRD_STAGE_RUNTIME.isTestMode();
    return !!(window.TEST_MODE_CONFIG && window.TEST_MODE_CONFIG.enabled) || !!(document.body && document.body.classList.contains('test-mode-active'));
  }
  function readJson(key){
    try{ const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) || {}) : {}; }catch(_){ return {}; }
  }
  function getProgress(){
    // v36 source-of-truth cleanup: use the actual save keys used by the game core.
    // Older PRD_STAGE_PROGRESS_V1 is still read only as a legacy fallback.
    return {
      metaV2: readJson('planetRiftOfflineMetaV2'),
      metaV1: readJson('planetRiftOfflineMetaV1'),
      progressV3: readJson('planetRiftStageProgressV3'),
      progressV2: readJson('planetRiftStageProgressV2'),
      galaxy: readJson('planetRiftGalaxyProgressV1'),
      flags: readJson('PRD_GALAXY_FLAGS_V1'),
      legacy: readJson('PRD_STAGE_PROGRESS_V1')
    };
  }
  function clearCountAt(obj, stageNo){
    const n = String(stageNo);
    const clears = (obj && obj.clears) || (obj && obj.stageClears) || (obj && obj.completed) || obj || {};
    const direct = Number(clears[n] || clears[stageNo] || clears['stage'+n] || clears[n+'-10'] || clears[n+'-20'] || 0);
    return Number.isFinite(direct) ? direct : 0;
  }
  function hasMilkyClear(){
    if(isTestMode()) return true;
    const gp = getProgress();
    const candidates = [gp.flags, gp.galaxy, gp.metaV2, gp.metaV1, gp.progressV3, gp.progressV2, gp.legacy];
    for(const src of candidates){
      const flags = (src && src.flags) || src || {};
      if(flags.milkyRiftCompleted || flags.galaxyMilkyRiftCompleted || flags.andromedaUnlocked || flags.andromedaFrostUnlocked) return true;
      if(Number(flags.openIndex || flags.unlockedGalaxyIndex || 0) >= 2) return true;
    }
    // Root Milky campaign has 12 main stages. Clearing the final stage opens Andromeda.
    for(const src of candidates){
      if(clearCountAt(src, 12) > 0) return true;
      const maxCleared = Number(src?.maxClearedStage || src?.clearedStage || src?.stage || src?.unlockedStage || 0);
      if(Number.isFinite(maxCleared) && maxCleared >= 12) return true;
    }
    return false;
  }
  function isOpen(id){
    if(id === 'milky-rift') return true;
    if(isTestMode()) return true; // developer/test mode opens all galaxy entries by request.
    if(id === 'andromeda-frost') return hasMilkyClear();
    return false;
  }
  function selectedGalaxy(){
    const map = $('galaxyMap');
    const active = document.querySelector('#galaxyNodeLayer .galaxyNode.active');
    const text = [
      (active && active.dataset && active.dataset.galaxyId) || '',
      map && map.dataset ? map.dataset.selectedGalaxy || '' : '',
      ($('galaxyEnterBtn')||{}).textContent || '',
      ($('v274GalaxyEnterBtn')||{}).textContent || '',
      ($('galaxyInfoPanel')||{}).textContent || ''
    ].join(' ');
    if(/andromeda/i.test(text)) return 'andromeda-frost';
    if(/ember/i.test(text)) return 'ember-spiral';
    if(/void/i.test(text)) return 'void-crown';
    return 'milky-rift';
  }
  function setEnterButton(btn, id, open){
    if(!btn) return;
    const data = COPY[id] || COPY['milky-rift'];
    btn.textContent = open ? data.enter : 'LOCKED';
    btn.disabled = !open;
    btn.classList.toggle('disabled', !open);
    btn.dataset.galaxyId = id;
  }
  function renderInfo(id){
    const data = COPY[id] || COPY['milky-rift'];
    const open = isOpen(id);
    const inTest = isTestMode();
    const panel = $('galaxyInfoPanel');
    if(panel){
      const title = panel.querySelector('.galaxyInfoTitle');
      const state = panel.querySelector('.galaxyInfoState b');
      const body = panel.querySelector('.galaxyInfoBody');
      const tags = panel.querySelector('.galaxyTagRow');
      if(title) title.innerHTML = `${data.title}<small>${data.ko}</small>`;
      if(state) state.textContent = open ? (inTest ? 'TEST OPEN' : data.state) : 'LOCKED';
      if(body) body.textContent = open ? data.body : `${data.ko}는 아직 잠겨 있습니다.`;
      if(tags) tags.innerHTML = (data.tags || []).map(t=>`<span class="galaxyTag">${t}</span>`).join('');
    }
    const label = $('galaxyProgressLabel');
    const sub = $('galaxyProgressSub');
    if(label){
      if(inTest) label.textContent = `${data.title} · TEST OPEN`;
      else if(id === 'milky-rift') label.textContent = 'MILKY RIFT · 1 / 4 GALAXIES';
      else if(id === 'andromeda-frost' && open) label.textContent = 'ANDROMEDA TRACE · ACTIVE CAMPAIGN';
      else label.textContent = `${data.title} · LOCKED PREVIEW`;
    }
    if(sub){
      if(inTest) sub.textContent = '테스트/개발자 모드에서는 모든 은하 노드가 열립니다.';
      else if(id === 'milky-rift') sub.textContent = '현재는 은하수 균열만 개방되어 있습니다.';
      else if(id === 'andromeda-frost' && open) sub.textContent = '안드로메다 소용돌이 항로가 개방되었습니다.';
      else sub.textContent = '이전 은하의 최종 성역을 완료하면 열립니다.';
    }
    setEnterButton($('galaxyEnterBtn'), id, open);
    setEnterButton($('v274GalaxyEnterBtn'), id, open);
  }
  function applyGalaxyState(id){
    id = GALAXIES.includes(id) ? id : 'milky-rift';
    const map = $('galaxyMap');
    if(map) map.dataset.selectedGalaxy = id;
    const openCount = isTestMode() ? GALAXIES.length : (hasMilkyClear() ? 2 : 1);
    $$('button.galaxyNode[data-galaxy-id]').forEach((node)=>{
      const gid = node.dataset.galaxyId;
      const idx = GALAXIES.indexOf(gid);
      const open = isOpen(gid);
      node.classList.toggle('active', gid === id);
      node.classList.toggle('open', open);
      node.classList.toggle('locked', !open);
      node.classList.toggle('fogPreview', !open && idx === openCount);
      node.classList.toggle('fogDeep', !open && idx > openCount);
      const badge = node.querySelector('.galaxyNodeBadge');
      if(badge) badge.textContent = open ? (isTestMode() && gid !== 'milky-rift' ? 'TEST OPEN' : 'OPEN') : (idx === openCount ? 'LOCKED' : 'SEALED');
      let lock = node.querySelector('.galaxyLockMark');
      if(!open){
        if(!lock){ lock = document.createElement('div'); lock.className = 'galaxyLockMark'; lock.textContent = '🔒'; node.appendChild(lock); }
        lock.style.display = '';
      }else if(lock){
        lock.style.display = 'none';
      }
    });
    renderInfo(id);
  }
  function clearAndromedaRuntimeFlags(){
    try{
      sessionStorage.removeItem('PRD_CAMPAIGN');
      sessionStorage.removeItem('PRD_ANDROMEDA_BATTLE_ACTIVE');
      sessionStorage.removeItem('PRD_ANDROMEDA_STAGE_NO');
      sessionStorage.removeItem('PRD_SELECTED_GALAXY');
      localStorage.removeItem('PRD_CAMPAIGN');
      localStorage.removeItem('PRD_ANDROMEDA_BATTLE_ACTIVE');
      localStorage.removeItem('PRD_ANDROMEDA_STAGE_NO');
      localStorage.removeItem('PRD_SELECTED_GALAXY');
    }catch(_){ }
    if(document.body){
      document.body.classList.remove('andromedaTraceMap','prd-andromeda-map','prd-andromeda-battle','andromeda-battle-active');
      delete document.body.dataset.campaign;
      delete document.body.dataset.andromeda;
    }
    if(document.documentElement){
      document.documentElement.classList.remove('andromedaTraceMap','prd-andromeda-map','prd-andromeda-battle','andromeda-battle-active');
      delete document.documentElement.dataset.campaign;
      delete document.documentElement.dataset.andromeda;
    }
  }
  function forceMilkyStageMap(){
    clearAndromedaRuntimeFlags();
    const menu = $('menu');
    const galaxy = $('galaxyMap');
    const stage = $('stageMap');
    const game = $('game');
    if(menu) menu.style.display = 'none';
    if(galaxy) galaxy.style.display = 'none';
    if(game) game.style.display = 'none';
    if(stage){
      stage.style.display = 'block';
      stage.classList.add('premiumStage');
      stage.classList.remove('andromedaTraceMap','prd-andromeda-map');
      stage.dataset.campaign = 'milky';
      stage.dataset.galaxy = 'milky-rift';
    }
    try{ if(typeof window.loadOfflineMeta === 'function') window.loadOfflineMeta(); else if(typeof loadOfflineMeta === 'function') loadOfflineMeta(); }catch(_){ }
    try{ if(typeof window.loadStageMapProgress === 'function') window.loadStageMapProgress(); else if(typeof loadStageMapProgress === 'function') loadStageMapProgress(); }catch(_){ }
    try{ if(window.StageMapState) window.StageMapState.selected = Number(window.StageMapState.selected || 1) || 1; }catch(_){ }
    try{ if(typeof window.renderStageMap === 'function') window.renderStageMap(); else if(typeof renderStageMap === 'function') renderStageMap(); }catch(_){ }
    try{ if(typeof window.refreshScreenStarfields === 'function') window.refreshScreenStarfields(); }catch(_){ }
    try{ if(typeof window.stopStageBgm === 'function') window.stopStageBgm(); else if(typeof stopStageBgm === 'function') stopStageBgm(); }catch(_){ }
    try{ if(typeof window.playMapBgm === 'function') window.playMapBgm(); else if(typeof playMapBgm === 'function') playMapBgm(); }catch(_){ }
    // Some legacy layout patches re-sync one frame later. Re-assert Milky stage visibility.
    [0, 80, 240].forEach(delay => setTimeout(()=>{
      const st = $('stageMap'), gx = $('galaxyMap'), gm = $('game'), mn = $('menu');
      if(mn) mn.style.display = 'none';
      if(gx) gx.style.display = 'none';
      if(gm) gm.style.display = 'none';
      if(st){
        st.style.display = 'block';
        st.classList.remove('andromedaTraceMap','prd-andromeda-map');
        st.dataset.campaign = 'milky';
        st.dataset.galaxy = 'milky-rift';
      }
      try{ if(typeof window.renderStageMap === 'function') window.renderStageMap(); else if(typeof renderStageMap === 'function') renderStageMap(); }catch(_){ }
      try{ if(typeof window.refreshScreenStarfields === 'function') window.refreshScreenStarfields(); }catch(_){ }
    }, delay));
    return true;
  }
  function isReturningFromAndromeda(){
    try{
      const params = new URLSearchParams(location.search);
      return params.get('from') === 'andromeda';
    }catch(_){ return false; }
  }
  function showGalaxyAfterAndromedaReturn(){
    clearAndromedaRuntimeFlags();
    const menu = $('menu');
    const galaxy = $('galaxyMap');
    const stage = $('stageMap');
    const game = $('game');
    if(menu) menu.style.display = 'none';
    if(stage) stage.style.display = 'none';
    if(game) game.style.display = 'none';
    if(galaxy){
      galaxy.style.display = 'block';
      galaxy.classList.add('cleanVisible');
      galaxy.dataset.selectedGalaxy = 'andromeda-frost';
    }
    try{ if(typeof window.loadOfflineMeta === 'function') window.loadOfflineMeta(); else if(typeof loadOfflineMeta === 'function') loadOfflineMeta(); }catch(_){ }
    try{ if(typeof window.loadStageMapProgress === 'function') window.loadStageMapProgress(); else if(typeof loadStageMapProgress === 'function') loadStageMapProgress(); }catch(_){ }
    applyGalaxyState('andromeda-frost');
    try{ if(typeof window.refreshScreenStarfields === 'function') window.refreshScreenStarfields(); }catch(_){ }
    try{ if(typeof window.stopStageBgm === 'function') window.stopStageBgm(); else if(typeof stopStageBgm === 'function') stopStageBgm(); }catch(_){ }
    try{ if(typeof window.playMapBgm === 'function') window.playMapBgm(); else if(typeof playMapBgm === 'function') playMapBgm(); }catch(_){ }
  }
  function enterMilky(){
    // Do not rely on old showStageMap wrappers. They may be overridden by galaxy/andromeda patches.
    return forceMilkyStageMap();
  }
  function enterAndromeda(){
    if(!isOpen('andromeda-frost')){
      try{ if(typeof toast === 'function') toast('은하수 최종 성역 완료 후 안드로메다가 열립니다.'); }catch(_){ }
      applyGalaxyState('andromeda-frost');
      return;
    }
    try{
      sessionStorage.setItem('PRD_CAMPAIGN','andromeda');
      localStorage.removeItem('PRD_CAMPAIGN');
      if(isTestMode()){
        sessionStorage.setItem('PRD_TEST_ENTRY_ACTIVE','1');
        sessionStorage.setItem('PLANET_RIFT_TEST_MODE','1');
      }
    }catch(_){ }
    const qs = isTestMode() ? '?test=1&from=galaxy&campaign=andromeda' : '?from=galaxy&campaign=andromeda';
    const url = new URL('andromeda/index.html' + qs, location.href).href;
    location.href = url;
  }
  function handleEnter(ev){
    if(flowActive()) return;
    const target = ev && ev.target && ev.target.closest && ev.target.closest('button,a,[role="button"],.galaxyEnterBtn,.stageEnter');
    if(!target) return;
    const text = (target.textContent || '').replace(/\s+/g,' ').trim();
    const id = target.dataset && target.dataset.galaxyId ? target.dataset.galaxyId : selectedGalaxy();
    const looksGalaxyEnter = target.id === 'galaxyEnterBtn' || target.id === 'v274GalaxyEnterBtn' || target.classList.contains('galaxyEnterBtn') || /ENTER\s+(MILKY|ANDROMEDA)|LOCKED/i.test(text);
    if(!looksGalaxyEnter) return;
    if(id === 'andromeda-frost' || /ANDROMEDA/i.test(text)){
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      enterAndromeda();
      return;
    }
    if(id === 'milky-rift' || /MILKY/i.test(text)){
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      enterMilky();
    }
  }
  function bind(){
    $$('button.galaxyNode[data-galaxy-id]').forEach(node=>{
      if(node.dataset.v36Bound) return;
      node.dataset.v36Bound = '1';
      node.addEventListener('click', function(ev){
        if(flowActive()) return;
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        applyGalaxyState(node.dataset.galaxyId || 'milky-rift');
      }, true);
      node.addEventListener('mouseenter', function(){ applyGalaxyState(node.dataset.galaxyId || selectedGalaxy()); }, {passive:true});
    });
    document.addEventListener('click', handleEnter, true);
    // Landscape dock sometimes triggers pointerup before the cloned click reaches the real button.
    // Route both Milky and Andromeda here so the selected galaxy always enters the intended campaign.
    document.addEventListener('pointerup', function(ev){
      if(flowActive()) return;
      const t = ev.target && ev.target.closest && ev.target.closest('#galaxyEnterBtn,#v274GalaxyEnterBtn,.galaxyEnterBtn');
      if(!t) return;
      const text = ((t.textContent||'') + ' ' + selectedGalaxy()).replace(/\s+/g,' ');
      if(/MILKY/i.test(text) || /ANDROMEDA/i.test(text)){
        ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        if(/ANDROMEDA/i.test(text)) enterAndromeda();
        else enterMilky();
      }
    }, true);
    ['galaxyEnterBtn','v274GalaxyEnterBtn'].forEach(id=>{
      setTimeout(()=>{
        const btn = $(id);
        if(!btn || btn.dataset.v37MilkyEnterBound) return;
        btn.dataset.v37MilkyEnterBound = '1';
        btn.addEventListener('click', handleEnter, true);
      }, 0);
    });
  }
  function init(){
    if(flowActive()) return;
    bind();
    if(isReturningFromAndromeda()){
      showGalaxyAfterAndromedaReturn();
      setTimeout(showGalaxyAfterAndromedaReturn, 80);
      setTimeout(showGalaxyAfterAndromedaReturn, 240);
      return;
    }
    applyGalaxyState(selectedGalaxy());
    setTimeout(()=>applyGalaxyState(selectedGalaxy()), 80);
    setTimeout(()=>applyGalaxyState(selectedGalaxy()), 300);
  }
  window.PRD_GALAXY_ANDROMEDA_BRIDGE_V37 = {apply:applyGalaxyState, enterAndromeda, enterMilky, forceMilkyStageMap, showGalaxyAfterAndromedaReturn, isTestMode};
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  window.addEventListener('load', init, {once:true});
})();
