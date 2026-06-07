(function(){
  'use strict';
  const $ = (id)=>document.getElementById(id);
  function hasFlag(name){
    try{
      const params = new URLSearchParams(location.search);
      if(params.get(name) === '1' || params.get(name) === 'true' || params.get(name) === 'andromeda') return true;
    }catch(_){ }
    return false;
  }
  function isFromGalaxy(){
    try{
      const params = new URLSearchParams(location.search);
      return params.get('from') === 'galaxy' || params.get('campaign') === 'andromeda' || sessionStorage.getItem('PRD_CAMPAIGN') === 'andromeda';
    }catch(_){ return true; }
  }
  function syncFlags(){
    try{
      sessionStorage.setItem('PRD_CAMPAIGN','andromeda');
      localStorage.removeItem('PRD_CAMPAIGN');
      if(hasFlag('test')){
        sessionStorage.setItem('PRD_TEST_ENTRY_ACTIVE','1');
        sessionStorage.setItem('PLANET_RIFT_TEST_MODE','1');
        if(window.TEST_MODE_CONFIG) window.TEST_MODE_CONFIG.enabled = true;
      }
    }catch(_){ }
    document.documentElement.dataset.campaign = 'andromeda';
    if(document.body){
      document.body.dataset.campaign = 'andromeda';
      document.body.classList.add('prd-andromeda-standalone');
    }
  }
  function parentGalaxyUrl(){
    const url = new URL('../index.html', location.href);
    url.searchParams.set('from', 'andromeda');
    try{
      const params = new URLSearchParams(location.search);
      if(params.get('test') === '1' || params.get('testmode') === '1' || sessionStorage.getItem('PRD_TEST_ENTRY_ACTIVE') === '1' || sessionStorage.getItem('PLANET_RIFT_TEST_MODE') === '1'){
        url.searchParams.set('test', '1');
      }
    }catch(_){ }
    return url.href;
  }
  function clearAndromedaRuntimeOnly(){
    try{
      sessionStorage.removeItem('PRD_CAMPAIGN');
      sessionStorage.removeItem('PRD_ANDROMEDA_BATTLE_ACTIVE');
      sessionStorage.removeItem('PRD_ANDROMEDA_STAGE_NO');
      localStorage.removeItem('PRD_CAMPAIGN');
      localStorage.removeItem('PRD_ANDROMEDA_BATTLE_ACTIVE');
      localStorage.removeItem('PRD_ANDROMEDA_STAGE_NO');
    }catch(_){ }
  }
  function goParentGalaxy(ev){
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }
    clearAndromedaRuntimeOnly();
    location.href = parentGalaxyUrl();
  }
  function bindAndromedaBackBoundary(){
    // The generic map patches bind #stageMapBack/#stageGalaxyBtn directly and stopImmediatePropagation.
    // Capture at document level first so Andromeda standalone never falls back to its embedded galaxy map.
    document.addEventListener('click', function(ev){
      const target = ev.target && ev.target.closest && ev.target.closest('#stageMapBack,#stageGalaxyBtn');
      if(!target) return;
      goParentGalaxy(ev);
    }, true);
  }
  function showAndromedaStageMap(){
    syncFlags();
    const menu = $('menu');
    const galaxy = $('galaxyMap');
    const stage = $('stageMap');
    const game = $('game');
    if(menu) menu.style.display = 'none';
    if(galaxy) galaxy.style.display = 'none';
    if(game) game.style.display = 'none';
    if(stage){
      stage.style.display = 'block';
      stage.classList.add('premiumStage','andromedaTraceMap','andromedaSpiralMapV9');
      stage.dataset.campaign = 'andromeda';
    }
    const title = document.querySelector('.stageTopTitle');
    if(title) title.textContent = 'ANDROMEDA TRACE';
    const back = $('stageMapBack');
    if(back){
      back.textContent = '← GALAXY MAP';
      back.onclick = function(ev){
        if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
        try{ location.href = new URL('../index.html?from=andromeda', location.href).href; }catch(_){ history.back(); }
      };
    }
    try{
      if(window.StageMapState){
        if(hasFlag('test') || (window.TEST_MODE_CONFIG && window.TEST_MODE_CONFIG.enabled)) window.StageMapState.unlocked = 15;
        window.StageMapState.selected = Math.max(1, Math.min(15, Number(window.StageMapState.selected || 1)));
        window.StageMapState.current = window.StageMapState.selected;
      }
    }catch(_){ }
    try{ if(typeof window.showStageMap === 'function') window.showStageMap(); }
    catch(err){ console.warn('[andromeda v34] showStageMap failed', err); }
    try{ if(typeof window.renderStageMap === 'function') window.renderStageMap(); }
    catch(err){ console.warn('[andromeda v34] renderStageMap failed', err); }
    setTimeout(function(){
      const title2 = document.querySelector('.stageTopTitle');
      if(title2) title2.textContent = 'ANDROMEDA TRACE';
      const stage2 = $('stageMap');
      if(stage2){ stage2.style.display='block'; stage2.dataset.campaign='andromeda'; }
    }, 120);
  }
  function patchStageEnter(){
    document.addEventListener('click', function(ev){
      const btn = ev.target && ev.target.closest && ev.target.closest('#stageEnterBtn,.stageEnter');
      if(!btn || !/ENTER/i.test(btn.textContent || '')) return;
      syncFlags();
      try{
        sessionStorage.setItem('PRD_ANDROMEDA_BATTLE_ACTIVE','1');
        localStorage.removeItem('PRD_ANDROMEDA_BATTLE_ACTIVE');
        const active = document.querySelector('#stageMap .stageNode.active');
        const n = active && active.dataset ? active.dataset.stage : '';
        if(n){ sessionStorage.setItem('PRD_ANDROMEDA_STAGE_NO', n); localStorage.removeItem('PRD_ANDROMEDA_STAGE_NO'); }
      }catch(_){ }
    }, true);
  }
  function init(){
    syncFlags();
    bindAndromedaBackBoundary();
    patchStageEnter();
    if(isFromGalaxy()) showAndromedaStageMap();
  }
  window.addEventListener('pageshow', function(){ if(isFromGalaxy()) showAndromedaStageMap(); });
  window.PRD_ANDROMEDA_DIRECT_BOOT_V34 = {show:showAndromedaStageMap, syncFlags, goParentGalaxy};
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  window.addEventListener('load', function(){ if(isFromGalaxy()) showAndromedaStageMap(); }, {once:true});
})();
