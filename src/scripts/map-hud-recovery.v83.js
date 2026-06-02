/* v83: isolated landscape map HUD recovery.
   Keep this file separate from patches.runtime.js so an error in legacy patches cannot hide map HUD buttons.
   No global body MutationObserver, no audio preload, no layout/coordinate changes. */
(function(){
  'use strict';
  if(window.PRD_MAP_HUD_RECOVERY_V83) return;
  window.PRD_MAP_HUD_RECOVERY_V83 = true;

  function byId(id){ return document.getElementById(id); }
  function isLandscape(){
    try{
      return (window.matchMedia && window.matchMedia('(orientation: landscape)').matches) || window.innerWidth >= window.innerHeight;
    }catch(_){ return window.innerWidth >= window.innerHeight; }
  }
  function visible(el){
    if(!el) return false;
    var cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) !== 0;
  }
  function activeStage(){
    var map = byId('stageMap');
    var selected = map && map.dataset ? Number(map.dataset.selected || 1) : 1;
    var active = document.querySelector('#stageMap .stageNode.active[data-stage]');
    if(active && active.dataset) selected = Number(active.dataset.stage || selected || 1);
    return Number.isFinite(selected) && selected > 0 ? Math.floor(selected) : 1;
  }
  function makeButton(id, text, className){
    var btn = document.createElement('button');
    btn.id = id;
    btn.type = 'button';
    btn.className = className;
    btn.textContent = text;
    return btn;
  }
  function ensureDock(mapId, dockId, infoId, enterId, infoText, enterText, type){
    var map = byId(mapId);
    if(!map) return;
    var dock = byId(dockId);
    if(!dock){
      dock = document.createElement('div');
      dock.id = dockId;
      dock.className = 'v274ActionDock v83ActionDock';
      map.appendChild(dock);
    }
    if(dock.parentElement !== map) map.appendChild(dock);
    var info = byId(infoId);
    if(!info){ info = makeButton(infoId, infoText, 'v274InfoBtn'); dock.appendChild(info); }
    if(info.parentElement !== dock) dock.appendChild(info);
    info.textContent = infoText;

    var enter = byId(enterId);
    if(!enter){ enter = makeButton(enterId, enterText, 'v274EnterBtn'); dock.appendChild(enter); }
    if(enter.parentElement !== dock) dock.appendChild(enter);

    var live = type === 'galaxy' ? byId('galaxyEnterBtn') : byId('stageEnterBtn');
    var liveText = live && live.textContent ? live.textContent.trim() : '';
    enter.textContent = liveText || (type === 'stage' ? ('ENTER SANCTUARY ' + activeStage()) : enterText);
    enter.disabled = !!(live && live.disabled);
    enter.classList.toggle('locked', enter.disabled);
    enter.setAttribute('aria-disabled', enter.disabled ? 'true' : 'false');

    var show = isLandscape() && visible(map);
    if(show){
      var game = byId('game');
      if(window.PRD_STAGE_ENTERING && (!game || !visible(game))){
        window.PRD_STAGE_ENTERING = false;
        if(document.body) document.body.classList.remove('prd-stage-entering');
      }
    }
    dock.style.display = show ? 'grid' : 'none';
    dock.style.visibility = show ? 'visible' : 'hidden';
    dock.style.opacity = show ? '1' : '0';
    dock.style.pointerEvents = show ? 'auto' : 'none';
    dock.dataset.v86SyncedAt = String(Date.now());
  }
  function ensureDocks(){
    ensureDock('galaxyMap','v274GalaxyActionDock','v274GalaxyInfoBtn','v274GalaxyEnterBtn','INFO','ENTER MILKY RIFT','galaxy');
    ensureDock('stageMap','v274StageActionDock','v274StageInfoBtn','v274StageEnterBtn','INFO','ENTER SANCTUARY 1','stage');
  }

  function ensureOverlay(){
    var overlay = byId('v274MapInfoOverlay');
    if(overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'v274MapInfoOverlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = ''+
      '<div class="v274MapInfoPanel" role="dialog" aria-modal="true" aria-labelledby="v274MapInfoTitleText">'+
        '<div class="v274MapInfoHead">'+
          '<div class="v274MapInfoTitle"><small id="v274MapInfoKicker">MAP INFO</small><b id="v274MapInfoTitleText">DETAIL</b></div>'+
          '<button class="v274CloseBtn" type="button" data-v274-close aria-label="닫기">×</button>'+
        '</div>'+
        '<div id="v274MapInfoBody"></div>'+
        '<div class="v274MapInfoActions">'+
          '<button class="v274SecondaryBtn" type="button" data-v274-close>닫기</button>'+
          '<button id="v274MapInfoEnterBtn" class="v274PrimaryBtn" type="button">ENTER</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){
      if(e.target === overlay || (e.target.closest && e.target.closest('[data-v274-close]'))) closeInfo();
    });
    byId('v274MapInfoEnterBtn').addEventListener('click', function(){
      var kind = overlay.dataset.kind || 'stage';
      closeInfo();
      setTimeout(function(){ kind === 'galaxy' ? enterGalaxy() : enterStage(); }, 0);
    });
    return overlay;
  }
  function closeInfo(){
    var overlay = byId('v274MapInfoOverlay');
    if(!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
  }
  function openInfo(kind){
    if(window.PRD_MAP_HUD_V274 && typeof window.PRD_MAP_HUD_V274.openInfo === 'function'){
      try{ window.PRD_MAP_HUD_V274.openInfo(kind); return; }catch(_){ }
    }
    var source = kind === 'galaxy' ? byId('galaxyInfoPanel') : byId('stageInfoPanel');
    if(!source) return;
    var overlay = ensureOverlay();
    var kicker = byId('v274MapInfoKicker');
    var title = byId('v274MapInfoTitleText');
    var body = byId('v274MapInfoBody');
    var enter = byId('v274MapInfoEnterBtn');
    if(kicker) kicker.textContent = kind === 'galaxy' ? 'GALAXY MAP' : 'CONSTELLATION MAP';
    if(title){
      var label = kind === 'galaxy' ? byId('galaxyProgressLabel') : byId('stageProgressLabel');
      title.textContent = label && label.textContent ? label.textContent.trim() : (kind === 'galaxy' ? 'MILKY RIFT' : 'SANCTUARY');
    }
    if(body){
      var clone = source.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('#stageEnterBtn,#galaxyEnterBtn,#stageGalaxyBtn,.stageActionRow,.stageEnter,.galaxyEnterBtn,.stageManageBtn').forEach(function(el){ el.remove(); });
      body.innerHTML = '';
      body.appendChild(clone);
    }
    var live = kind === 'galaxy' ? byId('galaxyEnterBtn') : byId('stageEnterBtn');
    if(enter) enter.textContent = live && live.textContent ? live.textContent.trim() : (kind === 'galaxy' ? 'ENTER MILKY RIFT' : ('ENTER SANCTUARY ' + activeStage()));
    overlay.dataset.kind = kind;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
  }
  function enterGalaxy(){
    if(window.PRD_MAP_HUD_V274 && typeof window.PRD_MAP_HUD_V274.showStage === 'function'){
      try{ window.PRD_MAP_HUD_V274.showStage(); return; }catch(_){ }
    }
    var btn = byId('galaxyEnterBtn');
    if(btn){ btn.click(); return; }
    if(window.PRD_NAV && typeof window.PRD_NAV.showStage === 'function') window.PRD_NAV.showStage();
  }
  function hasActiveStageResult(){
    var o = byId('stageClearOverlay') || byId('gameOverOverlay');
    if(!o) return false;
    var cs = getComputedStyle(o);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) !== 0;
  }
  function canStartStageFromMap(){
    if(window.PRD_STAGE_RESULT_PENDING || hasActiveStageResult()) return false;
    var map = byId('stageMap');
    if(!map || !visible(map)) return false;
    var btn = byId('stageEnterBtn');
    if(btn && btn.disabled) return false;
    return true;
  }
  var v85RecoveryEnterLock = false;
  function enterStage(){
    if(v85RecoveryEnterLock) return;
    if(!canStartStageFromMap()){
      window.PRD_STAGE_ENTERING = false;
      if(document.body) document.body.classList.remove('prd-stage-entering');
      syncSoon();
      return;
    }
    v85RecoveryEnterLock = true;
    window.PRD_STAGE_ENTERING = true;
    if(document.body) document.body.classList.add('prd-stage-entering');
    setTimeout(function(){
      try{
        if(window.PRD_MAP_HUD_V274 && typeof window.PRD_MAP_HUD_V274.enterStage === 'function'){
          try{ window.PRD_MAP_HUD_V274.enterStage(); return; }catch(_){ }
        }
        var btn = byId('stageEnterBtn');
        if(btn){ btn.click(); return; }
        if(window.PRD_NAV && typeof window.PRD_NAV.enterStageOnly === 'function') window.PRD_NAV.enterStageOnly();
      }finally{
        setTimeout(function(){
          v85RecoveryEnterLock = false;
          var game=byId('game');
          if(!game || getComputedStyle(game).display === 'none'){
            window.PRD_STAGE_ENTERING = false;
            if(document.body) document.body.classList.remove('prd-stage-entering');
            syncSoon();
          }
        }, 650);
      }
    }, 30);
  }
  var v86SyncTimer = 0;
  function syncSoon(){
    if(v86SyncTimer) clearTimeout(v86SyncTimer);
    ensureDocks();
    if(window.requestAnimationFrame){
      requestAnimationFrame(function(){ ensureDocks(); requestAnimationFrame(ensureDocks); });
    }
    setTimeout(ensureDocks, 80);
    setTimeout(ensureDocks, 180);
    setTimeout(ensureDocks, 420);
    v86SyncTimer = setTimeout(ensureDocks, 900);
  }
  function syncFor(ms){
    var start = Date.now();
    function tick(){
      ensureDocks();
      if(Date.now() - start < ms) setTimeout(tick, 180);
    }
    tick();
  }
  function installV86VisibilityWatch(){
    if(window.PRD_MAP_HUD_RECOVERY_V86_WATCH) return;
    window.PRD_MAP_HUD_RECOVERY_V86_WATCH = true;
    var nodes = [document.body, byId('galaxyMap'), byId('stageMap'), byId('menu'), byId('game')].filter(Boolean);
    if(window.MutationObserver){
      var observer = new MutationObserver(function(){ syncSoon(); });
      nodes.forEach(function(node){
        try{ observer.observe(node, {attributes:true, attributeFilter:['class','style','hidden','aria-hidden']}); }catch(_){ }
      });
    }
    document.addEventListener('visibilitychange', syncSoon, {passive:true});
    window.addEventListener('focus', syncSoon, {passive:true});
    window.addEventListener('pageshow', syncSoon, {passive:true});
    document.addEventListener('click', function(e){
      var t = e.target && e.target.closest ? e.target.closest('#galaxyMap,#stageMap,#mainBtn,#stageGalaxyBtn,.galaxyNode,.stageNode,.backBtn,.mapBtn') : null;
      if(t) syncFor(900);
    }, true);
    syncFor(2600);
  }
  document.addEventListener('click', function(e){
    var target = e.target && e.target.closest ? e.target.closest('#v274GalaxyInfoBtn,#v274StageInfoBtn,#v274GalaxyEnterBtn,#v274StageEnterBtn') : null;
    if(target){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      if(target.id === 'v274GalaxyInfoBtn') openInfo('galaxy');
      else if(target.id === 'v274StageInfoBtn') openInfo('stage');
      else if(target.id === 'v274GalaxyEnterBtn') enterGalaxy();
      else if(target.id === 'v274StageEnterBtn') enterStage();
      return;
    }
    var stageNode = e.target && e.target.closest ? e.target.closest('#stageMap .stageNode[data-stage]') : null;
    if(stageNode && isLandscape()) setTimeout(function(){ openInfo('stage'); syncSoon(); }, 100);
  }, true);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncSoon, {once:true});
  else syncSoon();
  window.addEventListener('load', syncSoon, {once:true});
  window.addEventListener('resize', syncSoon, {passive:true});
  window.addEventListener('orientationchange', syncSoon, {passive:true});
  installV86VisibilityWatch();
  window.PRD_MAP_HUD_RECOVERY_V83_API = {ensureDocks:ensureDocks, openInfo:openInfo, enterGalaxy:enterGalaxy, enterStage:enterStage, syncSoon:syncSoon};
})();
