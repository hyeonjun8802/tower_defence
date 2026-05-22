/* Runtime JS patches extracted from v78 in original execution order. */

/* ===== v87-armory-scroll-fix ===== */
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

/* ===== v88-armory-rebuild-script ===== */
(function(){
  const popup=document.getElementById('towerPopup');
  const detail=document.getElementById('towerPopupDetail');
  if(!popup||!detail) return;
  function reset(){requestAnimationFrame(()=>{detail.scrollTop=0;});}
  popup.addEventListener('click',e=>{if(e.target.closest('[data-tower-type],[data-common-research-select],[data-tower-popup-tab]')) reset();},true);
  // v99: no MutationObserver scroll reset; preserve manual scroll during active gameplay.
})();

/* ===== v96-detail-scroll-guard ===== */
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

/* ===== v99-armory-scroll-stability ===== */
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

/* ===== v98-stage-armory-entry-behavior ===== */
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
      // 성좌 지도 우측 타워 버튼도 기본 진입 탭을 공통 연구로 맞춘다.
      stageBtn.addEventListener('click', function(){
        setTimeout(function(){
          const commonTab = document.querySelector('[data-tower-popup-tab="common"]');
          if(commonTab) commonTab.click();
        }, 0);
      }, true);
    }
    if(fieldBtn){
      fieldBtn.setAttribute('aria-label','강화 관리');
      fieldBtn.setAttribute('title','강화 관리');
    }
  });
})();

/* ===== v209-true-floating-game-hud-script ===== */
(function(){
  function moveNode(node, target){
    if(node && target && node.parentElement !== target){
      target.appendChild(node);
    }
  }
  function ensure(id, className, parent){
    var el=document.getElementById(id);
    if(!el){
      el=document.createElement('div');
      el.id=id;
      if(className) el.className=className;
    }
    if(parent && el.parentElement !== parent) parent.appendChild(el);
    return el;
  }
  function installCombatHud(){
    var field=document.getElementById('field');
    if(!field) return;
    var hud=ensure('combatHudOverlay','combatHudOverlay',field);
    var left=ensure('combatHudLeft','combatHudLeft',hud);
    var meta=ensure('combatHudMeta','combatHudMeta',left);
    var commands=ensure('combatHudCommands','combatHudCommands',left);
    var right=ensure('combatHudRight','combatHudRight',hud);
    var statsWrap=ensure('combatHudStatsWrap','combatHudStatsWrap',right);
    var buttons=ensure('combatHudButtons','combatHudButtons',right);

    moveNode(document.querySelector('.battleStageLine'), meta);
    moveNode(document.querySelector('.bar.compactWave, .compactWave'), meta);
    moveNode(document.getElementById('wavePreviewLine'), meta);
    moveNode(document.getElementById('globalEffectLine'), meta);
    moveNode(document.querySelector('.battleActions'), commands);
    moveNode(document.querySelector('.battleStatLine'), statsWrap);
    moveNode(document.querySelector('.fieldTopControls'), buttons);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', installCombatHud, {once:true});
  }else{
    installCombatHud();
  }
  window.addEventListener('load', installCombatHud, {once:true});
  setTimeout(installCombatHud, 250);
  setTimeout(installCombatHud, 1000);
})();

/* ===== v213-dual-orientation-command-docks-script ===== */
(function(){
  var ACTIONS = [
    { key:'summon', src:'summonBtn' },
    { key:'merge',  src:'mergeBtn' },
    { key:'speed',  src:'speedBtn' },
    { key:'pause',  src:'pauseBtn' }
  ];

  function ensure(id, className, parent){
    var el = document.getElementById(id);
    if(!el){
      el = document.createElement('div');
      el.id = id;
      if(className) el.className = className;
    }
    if(parent && el.parentElement !== parent) parent.appendChild(el);
    return el;
  }

  function createProxyButton(action, suffix){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hudProxyBtn';
    btn.dataset.action = action.key;
    btn.id = 'hudProxy_' + suffix + '_' + action.key;
    btn.textContent = '...';
    btn.addEventListener('click', function(){
      var src = document.getElementById(action.src);
      if(src && !src.disabled) src.click();
    });
    return btn;
  }

  function buildDock(dockId, suffix){
    var overlay = document.getElementById('combatHudOverlay');
    if(!overlay) return null;
    var dock = ensure(dockId, 'combatHudProxyDock', overlay);
    var grid = dock.querySelector('.hudProxyGrid');
    if(!grid){
      grid = document.createElement('div');
      grid.className = 'hudProxyGrid';
      dock.appendChild(grid);
    }
    if(!dock.dataset.built){
      ACTIONS.forEach(function(action){
        grid.appendChild(createProxyButton(action, suffix));
      });
      dock.dataset.built = '1';
    }
    return dock;
  }

  function syncProxyButtons(){
    ACTIONS.forEach(function(action){
      var src = document.getElementById(action.src);
      if(!src) return;
      ['landscape','portrait'].forEach(function(mode){
        var proxy = document.getElementById('hudProxy_' + mode + '_' + action.key);
        if(!proxy) return;
        var txt = (src.textContent || '').trim();
        proxy.textContent = txt || proxy.textContent;
        proxy.disabled = !!src.disabled;
        proxy.setAttribute('aria-label', src.getAttribute('aria-label') || txt || action.key);
        proxy.setAttribute('title', src.getAttribute('title') || txt || action.key);
        if(src.classList.contains('active')) proxy.classList.add('active');
        else proxy.classList.remove('active');
      });
    });
  }

  function installDualCommandDocks(){
    var overlay = document.getElementById('combatHudOverlay');
    var commands = document.getElementById('combatHudCommands');
    if(!overlay || !commands) return;
    buildDock('combatHudCommandsLandscapeDock', 'landscape');
    buildDock('combatHudCommandsPortraitDock', 'portrait');
    syncProxyButtons();
  }

  var obs;
  function watchOriginalButtons(){
    ACTIONS.forEach(function(action){
      var src = document.getElementById(action.src);
      if(!src || src.dataset.proxyWatched === '1') return;
      src.dataset.proxyWatched = '1';
      var mo = new MutationObserver(syncProxyButtons);
      mo.observe(src, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class','disabled','aria-label','title'] });
    });
  }

  function init(){
    installDualCommandDocks();
    watchOriginalButtons();
    syncProxyButtons();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  }else{
    init();
  }
  window.addEventListener('load', init, {once:true});
  setTimeout(init, 200);
  setTimeout(init, 1000);
  setInterval(syncProxyButtons, 1000);
})();

/* ===== v214-top-hud-proportional-edge-layout-script ===== */
(function(){
  function ensureTopLine(){
    var hud = document.getElementById('combatHudOverlay');
    if(!hud) return;
    var topLine = document.getElementById('combatHudTopLine');
    if(!topLine){
      topLine = document.createElement('div');
      topLine.id = 'combatHudTopLine';
      hud.insertBefore(topLine, hud.firstChild);
    }else if(topLine.parentElement !== hud){
      hud.insertBefore(topLine, hud.firstChild);
    }
    var left = document.getElementById('combatHudLeft');
    var right = document.getElementById('combatHudRight');
    if(left && left.parentElement !== topLine) topLine.appendChild(left);
    if(right && right.parentElement !== topLine) topLine.appendChild(right);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureTopLine, {once:true});
  }else{
    ensureTopLine();
  }
  window.addEventListener('load', ensureTopLine, {once:true});
  setTimeout(ensureTopLine, 100);
  setTimeout(ensureTopLine, 500);
  setTimeout(ensureTopLine, 1200);
})();

/* ===== v216-pause-decision-dialog-script ===== */
(function(){
  function byId(id){ return document.getElementById(id); }

  function ensurePauseDecisionOverlay(){
    var overlay = byId('pauseDecisionOverlay');
    if(overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'pauseDecisionOverlay';
    overlay.setAttribute('hidden','');
    overlay.innerHTML = '<div class="pauseDecisionCard" role="dialog" aria-modal="true" aria-labelledby="pauseDecisionTitle">'
      + '<div class="pauseDecisionKicker">BATTLE PAUSED</div>'
      + '<h2 id="pauseDecisionTitle">일시정지</h2>'
      + '<p>전투가 멈춰 있습니다. 이어서 플레이하거나 현재 전투를 종료하고 성역 지도로 돌아갈 수 있습니다.</p>'
      + '<div class="pauseDecisionActions">'
      + '<button id="pauseQuitBtn" type="button">게임 종료하기</button>'
      + '<button id="pauseResumeBtn" type="button">계속 이어서하기</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    var resume = byId('pauseResumeBtn');
    var quit = byId('pauseQuitBtn');
    if(resume) resume.addEventListener('click', resumeBattleFromPauseMenu);
    if(quit) quit.addEventListener('click', quitBattleFromPauseMenu);
    overlay.addEventListener('click', function(e){
      // Clicking the backdrop keeps the battle paused intentionally. Use the buttons for explicit action.
      if(e.target === overlay) e.preventDefault();
    });
    return overlay;
  }

  function showPauseDecisionOverlay(){
    if(!window.S || S.gameOver) return;
    var overlay = ensurePauseDecisionOverlay();
    S.paused = true;
    overlay.removeAttribute('hidden');
    overlay.classList.add('open');
    try{ if(typeof updateUI === 'function') updateUI(); }catch(_){ }
    var resume = byId('pauseResumeBtn');
    if(resume){ setTimeout(function(){ try{ resume.focus({preventScroll:true}); }catch(_){ resume.focus(); } }, 20); }
  }

  function hidePauseDecisionOverlay(){
    var overlay = byId('pauseDecisionOverlay');
    if(!overlay) return;
    overlay.setAttribute('hidden','');
    overlay.classList.remove('open');
  }

  function resumeBattleFromPauseMenu(){
    hidePauseDecisionOverlay();
    if(window.S && !S.gameOver){
      S.paused = false;
      try{ if(typeof updateUI === 'function') updateUI(); }catch(_){ }
      try{ if(typeof toast === 'function') toast('전투 재개'); }catch(_){ }
    }
  }

  function quitBattleFromPauseMenu(){
    hidePauseDecisionOverlay();
    try{ if(typeof cancelAnimationFrame === 'function' && typeof raf !== 'undefined') cancelAnimationFrame(raf); }catch(_){ }
    try{ if(typeof stopAllGameAudio === 'function') stopAllGameAudio(); else if(typeof stopStageBgm === 'function') stopStageBgm(); }catch(_){ }
    try{ if(typeof removeGameOverOverlay === 'function') removeGameOverOverlay(); }catch(_){ }
    try{ if(window.S){ S.paused = true; S.active = false; S.skillModalOpen = false; S.gameOver = true; } }catch(_){ }

    var game = byId('game');
    var stageMap = byId('stageMap');
    var menu = byId('menu');
    if(game) game.style.display = 'none';
    if(menu) menu.style.display = 'none';
    if(stageMap) stageMap.style.display = 'block';

    try{ if(typeof reset === 'function') reset(); }catch(err){ console.warn('pause quit reset failed', err); }
    try{ if(typeof resetBattleUnitsForStageMap === 'function') resetBattleUnitsForStageMap(); }catch(err){ console.warn('pause quit unit reset failed', err); }
    try{ if(typeof renderStageMap === 'function') renderStageMap(); }catch(err){ console.warn('pause quit map render failed', err); }
    try{ if(typeof renderOfflineMetaPanel === 'function') renderOfflineMetaPanel(); }catch(_){ }
    try{
      var hint = byId('stageHint');
      if(hint) hint.textContent = '전투를 종료했습니다. 같은 성역을 다시 선택해 이어서 도전할 수 있습니다.';
    }catch(_){ }
    try{ if(typeof toast === 'function') toast('전투 종료 — 성역 지도로 이동'); }catch(_){ }
  }

  function installPauseDecisionHook(){
    var pauseBtn = byId('pauseBtn');
    if(!pauseBtn || pauseBtn.dataset.pauseDecisionHook === '1') return;
    pauseBtn.dataset.pauseDecisionHook = '1';
    pauseBtn.onclick = function(){
      if(!window.S || S.gameOver) return;
      if(S.paused){
        resumeBattleFromPauseMenu();
      }else{
        S.paused = true;
        try{ if(typeof updateUI === 'function') updateUI(); }catch(_){ }
        showPauseDecisionOverlay();
      }
    };
  }

  function initPauseDecision(){
    ensurePauseDecisionOverlay();
    installPauseDecisionHook();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPauseDecision, {once:true});
  else initPauseDecision();
  window.addEventListener('load', initPauseDecision, {once:true});
  setTimeout(initPauseDecision, 300);
  setTimeout(initPauseDecision, 1200);

  // Original Space-key pause handler still toggles the state. This listener runs later
  // and opens/closes the decision dialog according to the resulting state.
  window.addEventListener('keydown', function(e){
    if(e.repeat || e.code !== 'Space') return;
    setTimeout(function(){
      if(!window.S || S.gameOver) return;
      if(S.paused) showPauseDecisionOverlay();
      else hidePauseDecisionOverlay();
    }, 0);
  });

  window.PauseDecisionMenu = {
    show: showPauseDecisionOverlay,
    hide: hidePauseDecisionOverlay,
    resume: resumeBattleFromPauseMenu,
    quit: quitBattleFromPauseMenu
  };
})();

/* ===== v227-pause-decision-menu-final-script ===== */
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

/* ===== v32-landscape-short-command-labels-script ===== */
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
    // v46: button label is fixed to a single word. Prevent "소환 소환" when source text is already "소환".
    return '소환';
  }
  function applyShortLandscapeLabels(){
    injectStyle();
    var summonFull=textOf('summonBtn');
    var mergeFull=textOf('mergeBtn') || '합치기';
    var speedFull=textOf('speedBtn') || '1x';
    var pauseFull=textOf('pauseBtn') || '정지';

    setProxy('summon', '소환', summonFull || '소환');
    setProxy('merge', '합치기', mergeFull || '합치기');
    setProxy('speed', speedFull, speedFull);
    setProxy('pause', '정지', pauseFull || '정지');
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

/* ===== v37-original-command-hitbox-fix-script ===== */
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

/* ===== v101-stage-tower-button-safe-behavior ===== */
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

/* ===== v104-armory-scroll-stability ===== */
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

/* ===== v111-navigation-recovery-script ===== */
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
          const commonTab = document.querySelector('[data-tower-popup-tab="common"]');
          if(commonTab) commonTab.click();
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

/* ===== v116-battle-enter-bridge ===== */
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

/* ===== v114-stage-back-label-script ===== */
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

/* ===== v117-stage-galaxy-back-button-script ===== */
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

/* ===== v118-stage-back-main-pill-match-script ===== */
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

/* ===== v122-map-duplicate-buttons-remove-script ===== */
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

/* ===== v126-test-mode-full-unlock-fix ===== */
(function(){
  'use strict';
  function maxStage(){
    try{ return Array.isArray(window.STAGE_MAP_DEFS) ? window.STAGE_MAP_DEFS.length : 12; }
    catch(err){ return 12; }
  }
  function isTestMode(){
    try{
      return !!(window.TEST_MODE_CONFIG && window.TEST_MODE_CONFIG.enabled) || !!(window.META && window.META.flags && window.META.flags.testMode);
    }catch(err){ return false; }
  }
  function forceAllStages(){
    if(!isTestMode() || !window.StageMapState) return;
    var max = maxStage();
    window.StageMapState.unlocked = max;
    var selected = Number(window.StageMapState.selected || 1);
    if(!Number.isFinite(selected) || selected < 1) selected = 1;
    if(selected > max) selected = max;
    window.StageMapState.selected = selected;
    window.StageMapState.current = selected;
    try{
      if(window.META){
        if(!window.META.flags || typeof window.META.flags !== 'object') window.META.flags = {};
        window.META.flags.testMode = true;
        if(window.TEST_MODE_CONFIG && Array.isArray(window.TEST_MODE_CONFIG.allTowers)){
          window.META.unlockedTowers = window.TEST_MODE_CONFIG.allTowers.slice();
        }
      }
    }catch(err){}
  }

  var originalSetTest = window.setTestModeEnabled;
  if(typeof originalSetTest === 'function'){
    window.setTestModeEnabled = function(flag){
      var result = originalSetTest.apply(this, arguments);
      if(flag) forceAllStages();
      return result;
    };
  }

  var originalApplyTest = window.applyTestModeOverrides;
  if(typeof originalApplyTest === 'function'){
    window.applyTestModeOverrides = function(){
      var result = originalApplyTest.apply(this, arguments);
      forceAllStages();
      return result;
    };
  }

  var originalLoadProgress = window.loadStageMapProgress;
  if(typeof originalLoadProgress === 'function'){
    window.loadStageMapProgress = function(){
      var result = originalLoadProgress.apply(this, arguments);
      forceAllStages();
      return result;
    };
  }

  var originalSyncUnlock = window.syncStageUnlockFromClears;
  if(typeof originalSyncUnlock === 'function'){
    window.syncStageUnlockFromClears = function(){
      if(isTestMode()){
        forceAllStages();
        return true;
      }
      return originalSyncUnlock.apply(this, arguments);
    };
  }

  var originalRenderStageMap = window.renderStageMap;
  if(typeof originalRenderStageMap === 'function'){
    window.renderStageMap = function(){
      forceAllStages();
      var result = originalRenderStageMap.apply(this, arguments);
      forceAllStages();
      var map = document.getElementById('stageMap');
      if(map && isTestMode()) map.dataset.unlocked = String(maxStage());
      return result;
    };
  }

  var originalStartStage = window.startSelectedStageFromMap;
  if(typeof originalStartStage === 'function'){
    window.startSelectedStageFromMap = function(){
      forceAllStages();
      return originalStartStage.apply(this, arguments);
    };
  }

  var originalShowStage = window.showStageMap;
  if(typeof originalShowStage === 'function'){
    window.showStageMap = function(){
      forceAllStages();
      return originalShowStage.apply(this, arguments);
    };
  }

  function patchLabels(){
    if(!isTestMode()) return;
    forceAllStages();
    var max = maxStage();
    var label = document.getElementById('stageProgressLabel');
    if(label) label.textContent = 'TEST MODE · ORION CONSTELLATION · OPEN ' + max + ' / ' + max;
    var galaxyLabel = document.getElementById('galaxyProgressLabel');
    if(galaxyLabel) galaxyLabel.textContent = 'TEST MODE · MILKY RIFT · 1 / 4 GALAXIES';
  }

  document.addEventListener('click', function(e){
    var testBtn = e.target && e.target.closest && e.target.closest('#testModeBtn');
    if(testBtn){
      setTimeout(function(){ forceAllStages(); if(typeof window.renderStageMap === 'function') window.renderStageMap(); patchLabels(); }, 0);
      setTimeout(function(){ forceAllStages(); patchLabels(); }, 80);
    }
  }, true);

  window.addEventListener('load', function(){ setTimeout(function(){ forceAllStages(); patchLabels(); }, 0); }, {once:true});
  window.PRD_TEST_MODE_UNLOCK = {forceAllStages: forceAllStages};
})();

/* ===== v128-canonical-manifest-unlock-finalizer ===== */
(function(){
  'use strict';
  function safe(fn){ try{return fn();}catch(e){console.warn('[v128 manifest unlock]', e);} }
  function apply(){ safe(function(){ if(typeof applyCanonicalProgressToState === 'function') applyCanonicalProgressToState({keepSelected:true, allowLockedPreview:true, save:true}); }); }
  function rerender(){ safe(function(){ if(typeof renderStageMap === 'function' && document.getElementById('stageMap')?.style.display !== 'none') renderStageMap(); }); safe(function(){ if(typeof renderHangar === 'function') renderHangar(); }); }
  var oldTest = typeof applyTestModeOverrides === 'function' ? applyTestModeOverrides : null;
  if(oldTest){ applyTestModeOverrides = function(){ var ret = oldTest.apply(this, arguments); safe(function(){ TEST_MODE_CONFIG.enabled=true; StageMapState.unlocked=STAGE_MAP_DEFS.length; META.unlockedTowers=allTowerTypesFromManifest(); }); rerender(); return ret; }; }
  var oldRender = typeof renderStageMap === 'function' ? renderStageMap : null;
  if(oldRender){ renderStageMap = function(){ apply(); return oldRender.apply(this, arguments); }; }
  var oldComplete = typeof completeStageFromBattle === 'function' ? completeStageFromBattle : null;
  if(oldComplete){ completeStageFromBattle = function(){ var ret = oldComplete.apply(this, arguments); setTimeout(function(){ apply(); rerender(); }, 140); return ret; }; }
  document.addEventListener('click', function(e){
    if(e.target && e.target.closest && e.target.closest('#testModeBtn')){
      setTimeout(function(){ safe(function(){ applyTestModeOverrides(); }); rerender(); }, 0);
      setTimeout(function(){ safe(function(){ applyTestModeOverrides(); }); rerender(); }, 120);
    }
  }, true);
})();

/* ===== v142-stage-map-top-right-tower-shortcut-remove-js ===== */
(function(){
  function removeStageTowerShortcut(){
    document.querySelectorAll('#stageMap #stageTowerManageBtn, #stageMap .stageManageBtn').forEach(function(el){
      if(el && el.parentNode) el.parentNode.removeChild(el);
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', removeStageTowerShortcut, {once:true});
  } else {
    removeStageTowerShortcut();
  }
  window.addEventListener('load', removeStageTowerShortcut, {once:true});
})();

/* ===== v164-armory-controller-script ===== */
(function(){
  window.__armoryControllerRebuildV164 = true;
  function $(id){return document.getElementById(id);}
  function esc(v){return String(v ?? '').replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
  function fmt(v){var n=Number(v);return Number.isFinite(n)?String(Math.round(n)):String(v??'-');}
  function els(){return {popup:$('towerPopup'),list:$('towerPopupList'),detail:$('towerPopupDetail'),close:$('towerPopupClose'),tabs:Array.prototype.slice.call(document.querySelectorAll('#towerPopup [data-tower-popup-tab]'))};}
  var activeTab='common';
  var selectedTowerType=0;
  var selectedCommonKey='global_damage';
  var selectedPlateKey='amp';
  var COMMON_ICON_DIR='assets/images/common_skill_icons';
  var commonNames={global_damage:'전역 공격력 증폭',global_crit:'치명타 매트릭스',global_speed:'공격속도 동기화',global_boss:'보스 해체 프로토콜',global_range:'사거리 네트워크',global_plate:'장판 증폭 회로',global_economy:'전장 회수 시스템'};
  var commonSub={global_damage:'전체 화력 강화 / 공용 패시브',global_crit:'치명 기대값 강화 / 공용 패시브',global_speed:'공격 템포 강화 / 공용 패시브',global_boss:'보스전 대응 강화 / 공용 패시브',global_range:'전장 커버리지 강화 / 공용 패시브',global_plate:'장판 운용 강화 / 공용 패시브',global_economy:'성장 자원 회수 / 공용 패시브'};
  var commonTags={global_damage:['공용','패시브','전역 효과'],global_crit:['치명','폭발력','전역 효과'],global_speed:['공속','템포','전역 효과'],global_boss:['보스','관통','후반'],global_range:['사거리','배치','커버'],global_plate:['장판','전략','증폭'],global_economy:['보상','성장','경제']};
  var plates={
    amp:{key:'amp',symbol:'DMG',label:'증폭',name:'증폭성운',subtitle:'핵심 화력 장판',tags:['화력','보스','버스트'],effect:'피해 +65%',best:'보스 구간 · 합류 지점 · 주력 딜러',caution:'제어보다 순수 화력 비중이 큽니다.',summary:'증폭성운은 가장 직관적인 공격 장판입니다. 주력 딜러를 올리면 짧은 시간에 큰 피해를 몰아넣기 좋아 웨이브 정리와 보스 삭제에 강합니다.',tips:'솔라, 스톰, 광자처럼 원래 화력이 높은 행성을 우선 배치하세요. 합류 지점이나 보스가 오래 머무는 구간에 두면 효율이 크게 올라갑니다.'},
    coil:{key:'coil',symbol:'SPD',label:'가속',name:'가속궤도',subtitle:'가속 / 공격속도 장판',tags:['공속','연사','템포'],effect:'공격속도 대폭 증가',best:'연사형 · 독/연쇄형 · 꾸준딜 라인',caution:'한방 화력보다는 누적 딜 효율이 좋습니다.',summary:'가속궤도는 초당 타격 횟수를 늘려 누적 피해를 키우는 장판입니다. 평타 빈도가 많은 타워일수록 기대 효율이 높습니다.',tips:'바이오, 스톰, 프로스트처럼 지속적으로 효과를 누적하는 행성과 잘 맞습니다. 병목 구간보다 긴 직선 초입에서 안정적입니다.'},
    lens:{key:'lens',symbol:'RNG',label:'사거리',name:'중력렌즈',subtitle:'사거리 확장 장판',tags:['사거리','저격','커버'],effect:'사거리 +50',best:'후방 배치 · 직선 저격 · 광역 커버',caution:'사거리가 짧은 타워보다 장거리형에서 체감이 큽니다.',summary:'중력렌즈는 타워의 공격 반경을 넓혀 한 자리에서 더 오랫동안 공격하게 만드는 장판입니다. 후방 안전지대 활용도가 높아집니다.',tips:'광자, 프로스트처럼 사거리 가치가 큰 행성과 잘 맞습니다. 코어 근처보다 긴 라인을 비출 수 있는 후방 칸에 두세요.'},
    mine:{key:'mine',symbol:'ORE',label:'광맥',name:'수정광맥',subtitle:'성장 / 보상 장판',tags:['성장','보상','경제'],effect:'소량 추가 보상',best:'안전한 후방 · 장기전 · 여유 슬롯',caution:'즉시 전투력 상승은 다른 장판보다 약합니다.',summary:'수정광맥은 전투 중 보상을 조금 더 챙겨 장기적인 성장을 돕는 장판입니다. 초반이나 안정 구간에서 자원 굴리기에 좋습니다.',tips:'라인 핵심 전투 칸보다는 후방 안정 칸에 두고, 여유가 생긴 뒤 성장용 행성을 배치하는 운영이 무난합니다.'},
    rift:{key:'rift',symbol:'RFT',label:'균열',name:'불안정균열',subtitle:'고위험 고화력 장판',tags:['리스크','폭딜','후반'],effect:'피해 +95% · 과열',best:'고레벨 주력 딜러 · 중반 병목 구간',caution:'리스크가 큰 만큼 아무 타워나 올리면 손해를 볼 수 있습니다.',summary:'불안정균열은 가장 강한 공격 보너스를 주지만 과열 리스크가 있는 하이리스크 장판입니다. 잘 쓰면 전장을 크게 압축하지만 운영 난도가 높습니다.',tips:'고레벨 주력 딜러를 올리고, 군중 제어 타워와 같이 써서 리스크를 줄이세요. 초반보다 중후반 핵심 구간에 배치하는 편이 안전합니다.'}
  };
  var plateKeys=['amp','coil','lens','mine','rift'];
  function tagsHtml(tags){return (Array.isArray(tags)?tags:[]).map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join('');}
  function iconImg(key,extra){var s=esc(key||'global_damage');return '<img class="commonResearchImg '+esc(extra||'')+'" src="'+COMMON_ICON_DIR+'/'+s+'.svg" alt="" aria-hidden="true" draggable="false" onerror="if(!this.dataset.fallback){this.dataset.fallback=1;this.src=\'common_skill_icons/'+s+'.svg\';}">';}
  function towerImg(t){var src=t&&t.thumb?t.thumb:'assets/images/thumbs/'+esc((t&&t.id)||'solar')+'_lv1.webp?v=align2';return '<img src="'+esc(src)+'" alt="" aria-hidden="true" draggable="false">';}
  function kindText(kind){var m={splash:'광역 폭발형',slow:'감속 제어형',chain:'연쇄 공격형',poison:'지속 피해형',gravity:'군중 제어형',beam:'관통 저격형',crystal:'축전 공명형',mecha:'실드 해체형',crit:'치명 폭발형'};return m[kind]||kind||'전투형';}
  function setWallet(){var w=$('towerPopupWallet');if(!w)return;var api=window.TowerDefenseGrowth;var shards=Math.max(0,Number(api&&api.getShards?api.getShards():0)||0);w.innerHTML='<div class="towerWalletItem shard"><span>성흔 조각</span><b>'+esc(shards.toLocaleString('ko-KR'))+'</b></div>';}
  function ensureTabs(){var wrap=document.querySelector('#towerPopup .towerPopupTabs');if(!wrap)return;var common=wrap.querySelector('[data-tower-popup-tab="common"]');var tower=wrap.querySelector('[data-tower-popup-tab="tower"]');var plate=wrap.querySelector('[data-tower-popup-tab="plate"]');if(!plate){plate=document.createElement('button');plate.className='towerPopupTab';plate.type='button';plate.setAttribute('role','tab');plate.setAttribute('aria-selected','false');plate.dataset.towerPopupTab='plate';plate.textContent='장판';} if(common)wrap.appendChild(common);if(tower)wrap.appendChild(tower);if(plate)wrap.appendChild(plate); }
  function setActive(tab){var e=els();activeTab=(tab==='common'||tab==='plate')?tab:'tower';if(e.popup)e.popup.dataset.activeTab=activeTab;document.querySelectorAll('#towerPopup [data-tower-popup-tab]').forEach(function(b){var on=b.dataset.towerPopupTab===activeTab;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false');});}
  function getTowers(){var api=window.TowerDefenseCatalog;return api&&typeof api.getTowers==='function'?api.getTowers():[];}
  function getSkills(type){var api=window.TowerDefenseCatalog;return api&&typeof api.getTowerSkills==='function'?api.getTowerSkills(type):[];}
  function renderTowerDetail(type){
    var e=els();
    var towers=getTowers();
    var t=towers.find(function(x){return Number(x.type)===Number(type);})||towers.find(function(x){return x.unlocked;})||towers[0];
    if(!t){e.detail.innerHTML='<div class="towerPopupEmpty">타워 데이터를 불러오지 못했습니다.</div>';return;}
    selectedTowerType=Number(t.type);
    e.list.querySelectorAll('[data-v164-tower]').forEach(function(b){b.classList.toggle('active',Number(b.dataset.v164Tower)===selectedTowerType);});
    if(!t.unlocked){
      e.detail.className='towerPopupDetail towerDenseDetail';
      e.detail.innerHTML='<div class="armoryLockedShell"><div class="armoryLockOverlay" style="position:relative;min-height:220px"><div class="armoryLockBox"><div class="armoryLockIcon">🔒</div><b>행성 정보 잠금</b><span>'+esc(t.unlockText||'성역 클리어 후 공개')+'</span></div></div></div>';
      return;
    }
    var skills=getSkills(t.type);
    var skillHtml=skills.length?'<div class="towerDenseSkillList">'+skills.map(function(s,i){
      return '<div class="towerDenseSkillRow"><b>Lv.'+esc(s.unlockLevel)+'</b><span class="skillIcon" style="color:'+esc(t.color)+'">'+(['☀','✹','♨'][i%3])+'</span><div><strong>'+esc(s.name)+'</strong><span>'+esc(s.text)+' · 해금 스킬</span></div></div>';
    }).join('')+'</div>':'<p class="towerDenseEmpty">등록된 고유 스킬 정보가 없습니다.</p>';
    e.detail.className='towerPopupDetail towerDenseDetail';
    e.detail.innerHTML=''
      +'<div class="towerDenseHero" style="--planet-color:'+esc(t.color)+'">'
        +'<div class="towerDenseHeroTop"><div class="armoryTowerThumb">'+towerImg(t)+'</div><div><small>TOWER PROFILE</small><h2 class="armoryTowerTitle">'+esc(t.name)+'</h2><p>'+esc(t.role)+' / '+esc(kindText(t.kind))+'</p></div></div>'
        +'<div class="towerDenseTags">'+tagsHtml(t.tags)+'</div>'
      +'</div>'
      +'<div class="towerDenseStats">'
        +'<div class="towerDenseHead"><small>COMBAT SUMMARY</small><b>핵심 전투 정보</b><span>'+esc(t.identity)+'</span></div>'
        +'<div class="towerDenseGrid">'
          +'<div><small>활성</small><b>활성화됨</b></div>'
          +'<div><small>조건</small><b>'+esc(t.unlockText||'기본 지급')+'</b></div>'
          +'<div><small>타입</small><b>'+esc(kindText(t.kind))+'</b></div>'
          +'<div><small>공격</small><b>'+esc(fmt(t.dmg))+'</b></div>'
          +'<div><small>사거리</small><b>'+esc(fmt(t.range))+'</b></div>'
          +'<div><small>주기 / 비용</small><b>'+esc(fmt(t.cd))+' / '+esc(fmt(t.cost))+'</b></div>'
        +'</div>'
      +'</div>'
      +'<div class="towerDenseRole">'
        +'<small>ROLE & USAGE</small><h3>역할과 운용</h3>'
        +'<p><b style="color:'+esc(t.color)+'">'+esc(t.role)+'</b> — '+esc(t.identity)+'</p>'
      +'</div>'
      +'<div class="towerDenseSkills">'
        +'<small>UNIQUE SKILLS</small><h3>타워별 고유 스킬</h3>'+skillHtml
      +'</div>';
    requestAnimationFrame(function(){e.detail.scrollLeft=0;});
  }
  function renderTowerList(){var e=els();e.list.classList.remove('commonList');var towers=getTowers();if(!towers.length){e.list.innerHTML='';e.detail.innerHTML='<div class="towerPopupEmpty">타워 데이터를 불러오지 못했습니다.</div>';return;}if(!towers.some(function(t){return Number(t.type)===Number(selectedTowerType);}))selectedTowerType=(towers.find(function(t){return t.unlocked;})||towers[0]).type;e.list.innerHTML=towers.map(function(t){var active=Number(t.type)===Number(selectedTowerType);return '<button class="towerPopupItem '+(active?'active ':'')+(t.unlocked?'':'locked')+'" type="button" data-v164-tower="'+esc(t.type)+'" aria-label="'+esc(t.unlocked?t.name:'미개방 행성')+'" title="'+esc(t.unlocked?t.name:(t.unlockText||'잠금'))+'"><div class="towerPopupThumb">'+towerImg(t)+'</div></button>';}).join('');renderTowerDetail(selectedTowerType);}
  function commonTitle(u){return commonNames[u&&u.key]||(u&&u.name)||'공통 연구';}
  function commonSubtitle(u){return commonSub[u&&u.key]||((u&&u.type)||'공통')+' 강화 / 공용 패시브';}
  function renderCommonDetail(key){var e=els();var api=window.TowerDefenseGrowth;var ups=api&&api.getUpgrades?api.getUpgrades():[];var u=ups.find(function(x){return x.key===key;})||ups[0];if(!u){e.detail.innerHTML='<div class="towerPopupEmpty">공통 연구 데이터가 없습니다.</div>';return;}selectedCommonKey=u.key;e.list.querySelectorAll('[data-v164-common]').forEach(function(b){b.classList.toggle('active',b.dataset.v164Common===selectedCommonKey);});if(!u.unlocked){var stage=Math.max(1,Number(u.unlockStage||1));var unlock=stage<=1?'기본 연구':(stage-1)+'성역 클리어 후';e.detail.innerHTML='<div class="lockedResearchPolish" style="--skill-color:'+esc(u.color)+'"><div class="lockedResearchHero"><div class="lockedResearchIconWrap">'+iconImg(u.icon,'hero')+'<span class="lockedResearchLock">🔒</span></div><div class="lockedResearchCopy"><div class="lockedResearchKicker">LOCKED COMMON RESEARCH</div><h2 class="lockedResearchTitle">'+esc(commonTitle(u))+'</h2><p class="lockedResearchDesc">'+esc(unlock)+' 연구 정보와 업그레이드가 열립니다.</p><div class="armoryTags">'+tagsHtml(commonTags[u.key]||['공용'])+'</div></div></div></div>';return;}var shards=Number(api&&api.getShards?api.getShards():0)||0;var cost=Number(u.cost||0)||0;var canBuy=u.unlocked&&!u.maxed&&shards>=cost;var costText=u.maxed?'MAX':cost.toLocaleString('ko-KR')+' 조각';e.detail.innerHTML='<div class="armoryCommonHero v82Hero" style="--skill-color:'+esc(u.color)+'"><div class="armoryCommonIcon">'+iconImg(u.icon,'hero')+'</div><div><h2 class="armoryCommonTitle">'+esc(commonTitle(u))+'</h2><div class="armoryCommonSubtitle">'+esc(commonSubtitle(u))+'</div><div class="armoryTags">'+tagsHtml(commonTags[u.key]||['공용'])+'</div></div></div><div class="armoryUpgradeDock" style="--skill-color:'+esc(u.color)+'"><div><small>NEXT UPGRADE</small><b>'+(u.maxed?'최대 연구 완료':esc(u.nextEffect))+'</b><span>'+(u.maxed?'해당 연구의 모든 보너스가 적용 중입니다.':'비용 '+esc(costText)+' · 보유 '+esc(shards.toLocaleString('ko-KR'))+' 조각')+'</span></div><button class="commonResearchBuy" type="button" data-v164-buy="'+esc(u.key)+'" '+(canBuy?'':'disabled')+'>'+(u.maxed?'MAX':(canBuy?'업그레이드':'조각 부족'))+'</button></div><div class="armoryQuickGrid v164InfoGrid"><div class="armoryQuickCard highlight"><small>현재 레벨</small><b>Lv.'+esc(u.level)+'</b></div><div class="armoryQuickCard"><small>현재 효과</small><b>'+esc(u.level>0?u.effect:'아직 연구 없음')+'</b></div><div class="armoryQuickCard"><small>다음 효과</small><b>'+esc(u.maxed?'최대 연구 완료':u.nextEffect)+'</b></div><div class="armoryQuickCard"><small>업그레이드 비용</small><b>'+esc(costText)+'</b></div></div><div class="v164Section"><h3>스킬 정보</h3><p>'+esc(u.desc||'')+'</p></div>';}
  function renderCommonList(){var e=els();e.list.classList.add('commonList');var api=window.TowerDefenseGrowth;var ups=api&&api.getUpgrades?api.getUpgrades():[];if(!ups.length){e.list.innerHTML='';e.detail.innerHTML='<div class="towerPopupEmpty">공통 연구 데이터가 없습니다.</div>';return;}if(!ups.some(function(u){return u.key===selectedCommonKey;}))selectedCommonKey=ups[0].key;e.list.innerHTML=ups.map(function(u){return '<button class="commonResearchItem '+(u.key===selectedCommonKey?'active ':'')+(u.unlocked?'':'locked')+(u.maxed?' maxed':'')+'" style="--skill-color:'+esc(u.color)+'" type="button" data-v164-common="'+esc(u.key)+'" aria-label="'+esc(commonTitle(u))+'" title="'+esc(commonTitle(u))+'">'+iconImg(u.icon)+'</button>';}).join('');renderCommonDetail(selectedCommonKey);}
  function plateTile(p){return '<span class="v164PlateTile plate-'+esc(p.key)+'"><span class="v164PlateCode">'+esc(p.symbol)+'</span><span class="v164PlateLabel">'+esc(p.label)+'</span></span>';}
  function renderPlateDetail(key){var e=els();var p=plates[key]||plates.amp;selectedPlateKey=p.key;e.list.querySelectorAll('[data-v164-plate]').forEach(function(b){b.classList.toggle('active',b.dataset.v164Plate===selectedPlateKey);});e.detail.innerHTML='<div class="v164PlateHero"><div class="v164PlateHeroVisual">'+plateTile(p)+'</div><div><h2 class="armoryCommonTitle">'+esc(p.name)+'</h2><div class="armoryCommonSubtitle">'+esc(p.subtitle)+'</div><div class="armoryTags">'+tagsHtml(p.tags)+'</div></div></div><div class="armoryQuickGrid v164InfoGrid"><div class="armoryQuickCard highlight"><small>핵심 효과</small><b>'+esc(p.effect)+'</b></div><div class="armoryQuickCard"><small>추천 배치</small><b>'+esc(p.best)+'</b></div><div class="armoryQuickCard"><small>공명 보너스</small><b>같은 색상/계열 배치 시 피해 +30% · 공속 +8%</b></div><div class="armoryQuickCard"><small>주의 사항</small><b>'+esc(p.caution)+'</b></div></div><div class="v164Section"><h3>장판 설명</h3><p>'+esc(p.summary)+'</p></div><div class="v164Section"><h3>추천 운용</h3><p>'+esc(p.tips)+'</p></div><div class="v164Section"><h3>색상 매칭</h3><p>장판 색상은 타워 색상과 맞춰서 보면 됩니다. 금색 계열 장판은 금색 계열 타워와, 보라색 계열 장판은 보라색 계열 타워와 맞춰 배치하는 방식으로 이해하면 쉽습니다.</p></div><div class="v164Section"><h3>공명 규칙</h3><p>장판 중앙 약어와 보조 이름은 현재 공명 계열을 의미합니다. 같은 계열 행성을 그 장판 위에 배치하면 추가 공명 보너스가 적용됩니다.</p></div>';}
  function renderPlateList(){var e=els();e.list.classList.add('commonList');e.list.innerHTML=plateKeys.map(function(k){var p=plates[k];return '<button class="commonResearchItem plateInfoItem '+(k===selectedPlateKey?'active':'')+'" type="button" data-v164-plate="'+esc(k)+'" aria-label="'+esc(p.name)+'" title="'+esc(p.name)+'">'+plateTile(p)+'</button>';}).join('');renderPlateDetail(selectedPlateKey);}
  function render(tab){ensureTabs();setWallet();setActive(tab||activeTab);var e=els();if(!e.popup||!e.list||!e.detail)return;if(activeTab==='common')renderCommonList();else if(activeTab==='plate')renderPlateList();else renderTowerList();e.detail.scrollTop=0;}
  function resetCommonSelectionToFirst(){var api=window.TowerDefenseGrowth;var ups=api&&api.getUpgrades?api.getUpgrades():[];if(ups&&ups.length)selectedCommonKey=ups[0].key;}
  function open(tab){var e=els();if(!e.popup)return;ensureTabs();var firstTab=(tab==='tower'||tab==='plate'||tab==='common')?tab:'common';if(firstTab==='common')resetCommonSelectionToFirst();e.popup.classList.add('open');e.popup.setAttribute('aria-hidden','false');render(firstTab);}
  function close(){var e=els();if(!e.popup)return;e.popup.classList.remove('open');e.popup.setAttribute('aria-hidden','true');}
  window.openTowerArmoryPopup=open;window.setTowerArmoryTab=function(tab){render(tab);};window.closeTowerArmoryPopup=close;
  document.addEventListener('click',function(ev){var t=ev.target;if(!t||!t.closest)return;var tab=t.closest('#towerPopup [data-tower-popup-tab]');var closeBtn=t.closest('#towerPopupClose,#towerPopup .towerPopupClose,[data-tower-popup-close]');var towerOpen=t.closest('#towerMenuBtn,#stageTowerManageBtn');var towerItem=t.closest('#towerPopup [data-v164-tower]');var commonItem=t.closest('#towerPopup [data-v164-common]');var plateItem=t.closest('#towerPopup [data-v164-plate]');var buy=t.closest('#towerPopup [data-v164-buy]');if(tab||closeBtn||towerOpen||towerItem||commonItem||plateItem||buy){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}
    if(closeBtn){close();return;} if(towerOpen){open('common');return;} if(tab){render(tab.dataset.towerPopupTab||'common');return;} if(towerItem){renderTowerDetail(towerItem.dataset.v164Tower);return;} if(commonItem){renderCommonDetail(commonItem.dataset.v164Common);return;} if(plateItem){renderPlateDetail(plateItem.dataset.v164Plate);return;} if(buy){var api=window.TowerDefenseGrowth;if(api&&typeof api.buy==='function')api.buy(buy.dataset.v164Buy);if(api&&typeof api.refresh==='function')api.refresh();setWallet();selectedCommonKey=buy.dataset.v164Buy;renderCommonList();return;} },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();},true);
})();

/* ===== v167-armory-refresh-guard-marker ===== */
(function(){ window.__armoryControllerRebuildV164 = true; })();

/* ===== v184-custom-bgm-entry-autoplay ===== */
(function(){
  'use strict';
  function safe(fn){ try{return fn();}catch(e){ console.warn('[custom bgm]', e); } }
  function visible(id){
    var el=document.getElementById(id);
    if(!el) return false;
    var cs=getComputedStyle(el);
    return cs.display!=='none' && cs.visibility!=='hidden' && Number(cs.opacity||1)!==0;
  }
  function initAndEnable(){
    safe(function(){ if(typeof initAudio==='function' && (typeof audio==='undefined' || !audio)) initAudio(); });
    safe(function(){ if(typeof audio!=='undefined' && audio){ audio.on=true; audio.unlocked=true; } });
    safe(function(){ if(typeof META!=='undefined' && META && META.settings){ META.settings.bgm=true; } });
    safe(function(){ if(typeof updateAudioButton==='function') updateAudioButton(); });
  }
  function play(kind){
    initAndEnable();
    safe(function(){
      if(kind==='battle'){
        if(typeof playStageBgm==='function') playStageBgm();
      }else{
        if(typeof playMapBgm==='function') playMapBgm();
      }
    });
  }
  function bind(){
    document.addEventListener('click', function(e){
      var t=e.target;
      if(!t || !t.closest) return;
      if(t.closest('#stageEnterBtn, [data-stage-enter], .stageEnterBtn')){
        play('battle');
        setTimeout(function(){ play('battle'); }, 90);
        setTimeout(function(){ play('battle'); }, 420);
      }else if(t.closest('#stageMapBack, #stageMap, #galaxyMap, [data-stage], [data-constellation-jump]')){
        setTimeout(function(){ play('map'); }, 0);
      }
    }, true);
    setTimeout(function(){
      if(visible('stageMap') || visible('galaxyMap')) play('map');
    }, 350);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();

/* ===== v191-boss-bgm-return-and-autostart ===== */
(function(){
  'use strict';
  function safe(fn){ try{return fn();}catch(e){ console.warn('[v191 bgm]', e); } }
  function visible(id){
    var el=document.getElementById(id);
    if(!el) return false;
    var cs=getComputedStyle(el);
    return cs.display!=='none' && cs.visibility!=='hidden' && Number(cs.opacity||1)!==0;
  }
  function srcIsBoss(src){
    src=String(src||'').toLowerCase();
    return src.indexOf('boss')>=0 || src.indexOf('beneath_the_iron')>=0;
  }
  function ensureAudioOn(){
    safe(function(){ if(typeof initAudio==='function' && (typeof audio==='undefined' || !audio)) initAudio(); });
    safe(function(){ if(typeof audio!=='undefined' && audio){ audio.on=true; audio.unlocked=true; } });
    safe(function(){ if(typeof META!=='undefined' && META && META.settings){ META.settings.bgm=true; } });
    safe(function(){ if(typeof updateAudioButton==='function') updateAudioButton(); });
  }
  function currentSrc(){ try{return audio && audio.bgmSrc || '';}catch(e){return '';} }
  function stageBaseSrc(){
    try{
      var bgm=AUDIO_URLS && AUDIO_URLS.bgm;
      var arr=(bgm && bgm.stages) || [];
      var theme=0;
      if(typeof S!=='undefined' && S && Number.isFinite(Number(S.theme))) theme=Number(S.theme);
      return arr.length ? arr[theme % arr.length] : (bgm.map || bgm.main || 'audio/bgm_battle_sentinels_of_the_ember.ogg');
    }catch(e){ return 'audio/bgm_battle_sentinels_of_the_ember.ogg'; }
  }
  function playBattleNormal(){
    ensureAudioOn();
    safe(function(){ if(typeof playBgmSrc==='function') playBgmSrc(stageBaseSrc(), .34); });
  }
  function playMapNormal(){
    ensureAudioOn();
    safe(function(){
      if(typeof playMapBgm==='function') playMapBgm();
      else if(typeof playBgmSrc==='function' && typeof AUDIO_URLS!=='undefined') playBgmSrc(AUDIO_URLS.bgm && (AUDIO_URLS.bgm.map || AUDIO_URLS.bgm.main), .30);
    });
  }
  function enemyAlive(e){
    if(!e) return false;
    if(e.dead || e.removed || e.gone || e.done || e._dead) return false;
    if(Number.isFinite(Number(e.hp)) && Number(e.hp)<=0) return false;
    if(Number.isFinite(Number(e.health)) && Number(e.health)<=0) return false;
    return true;
  }
  function enemyIsBoss(e){
    if(!e) return false;
    if(e.isBoss || e.boss || e.bossType || e.bossInfo || e.finalBoss || e.midBoss) return true;
    var s=[e.type,e.kind,e.role,e.tier,e.name,e.id,e.key,e.label,e.className].join(' ').toLowerCase();
    return /boss|overmind|warden|lord|보스|군주|심핵|왕좌/.test(s);
  }
  function enemyLists(){
    var out=[];
    safe(function(){ if(typeof enemies!=='undefined' && Array.isArray(enemies)) out.push(enemies); });
    safe(function(){ ['enemies','enemyList','mobs'].forEach(function(k){ if(Array.isArray(window[k])) out.push(window[k]); }); });
    safe(function(){ if(typeof S!=='undefined' && S){ ['enemies','enemyList','mobs'].forEach(function(k){ if(Array.isArray(S[k])) out.push(S[k]); }); } });
    return out;
  }
  function hasAliveBoss(){
    var lists=enemyLists();
    for(var i=0;i<lists.length;i++){
      for(var j=0;j<lists[i].length;j++){
        if(enemyAlive(lists[i][j]) && enemyIsBoss(lists[i][j])) return true;
      }
    }
    return false;
  }
  function recover(){
    ensureAudioOn();
    var src=currentSrc();
    if(visible('game') || visible('field')){
      if(srcIsBoss(src) && !hasAliveBoss()) playBattleNormal();
      else if(!src) playBattleNormal();
    }else if(visible('stageMap') || visible('galaxyMap') || visible('menu')){
      if(!src || srcIsBoss(src)) playMapNormal();
    }
  }
  function autoStart(){
    ensureAudioOn();
    if(visible('game') || visible('field')) playBattleNormal();
    else playMapNormal();
    setTimeout(recover, 160);
  }
  function wrap(name){
    safe(function(){
      var fn=window[name];
      if(typeof fn!=='function' || fn.__v191BgmWrapped) return;
      var w=function(){
        var r=fn.apply(this, arguments);
        setTimeout(recover, 0);
        setTimeout(recover, 260);
        setTimeout(recover, 900);
        return r;
      };
      w.__v191BgmWrapped=true;
      window[name]=w;
    });
  }
  function bind(){
    ['completeStageFromBattle','showStageClear','showGameOver','showStageMap','showGalaxyMapClean','enterMilkyRiftClean','returnMainFromGalaxyClean','nextWave','endWave','finishWave','clearWave'].forEach(wrap);
    ['pointerdown','click','touchstart','keydown'].forEach(function(ev){
      document.addEventListener(ev, autoStart, {once:true, capture:true});
    });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) setTimeout(autoStart,120); });
    setTimeout(autoStart, 120);
    setTimeout(autoStart, 700);
    setTimeout(recover, 1600);
    setInterval(recover, 500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();

/* ===== v119-stage-back-english-main-size-script ===== */
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

/* ===== v120-map-control-spacing-normalize-script ===== */
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

/* ===== v127-test-and-progress-unlock-hardening ===== */
(function(){
  'use strict';
  function safe(fn, fallback){ try{ return fn(); }catch(err){ console.warn('[v127 unlock hardening]', err); return fallback; } }
  function maxStage(){ return safe(function(){ return Array.isArray(STAGE_MAP_DEFS) ? STAGE_MAP_DEFS.length : 12; }, 12); }
  function clampStage(n){
    var max = maxStage();
    n = Number(n || 1);
    if(!Number.isFinite(n)) n = 1;
    return Math.max(1, Math.min(max, Math.floor(n)));
  }
  function isTestModeActive(){
    return safe(function(){ return !!(TEST_MODE_CONFIG && TEST_MODE_CONFIG.enabled) || !!(META && META.flags && META.flags.testMode); }, false);
  }
  function forceTestModeUnlock(){
    if(!isTestModeActive()) return false;
    return safe(function(){
      var max = maxStage();
      if(TEST_MODE_CONFIG) TEST_MODE_CONFIG.enabled = true;
      if(document.body) document.body.classList.add('test-mode-active');
      StageMapState.unlocked = max;
      StageMapState.selected = clampStage(StageMapState.selected || 1);
      StageMapState.current = StageMapState.selected;
      if(!META) META = defaultOfflineMeta();
      if(!META.flags || typeof META.flags !== 'object') META.flags = {};
      META.flags.testMode = true;
      META.unlockedTowers = Array.isArray(TEST_MODE_CONFIG.allTowers) ? TEST_MODE_CONFIG.allTowers.slice() : [0,1,2,3,4,5,6,7,8];
      var map = document.getElementById('stageMap');
      if(map){ map.dataset.unlocked = String(max); map.dataset.selected = String(StageMapState.selected); }
      return true;
    }, false);
  }
  function syncNormalProgressFromClears(){
    if(isTestModeActive()) return forceTestModeUnlock();
    return safe(function(){
      if(!StageMapState || !META) return false;
      var max = maxStage();
      var beforeStage = clampStage(StageMapState.unlocked || 1);
      var next = beforeStage;
      var towerChanged = false;
      var towerSet = new Set(normalizeUnlockedTowers(META.unlockedTowers, META.clears || {}));
      for(var i=1; i<=max; i++){
        if(Number((META.clears || {})[String(i)] || (META.clears || {})[i] || 0) > 0){
          next = Math.max(next, Math.min(max, i + 1));
          var reward = typeof stageTowerReward === 'function' ? stageTowerReward(i) : null;
          if(reward && !towerSet.has(Number(reward.type))){ towerSet.add(Number(reward.type)); towerChanged = true; }
        }
      }
      StageMapState.unlocked = clampStage(next);
      StageMapState.selected = clampStage(StageMapState.selected || StageMapState.unlocked);
      if(StageMapState.selected > StageMapState.unlocked) StageMapState.selected = StageMapState.unlocked;
      StageMapState.current = clampStage(StageMapState.current || StageMapState.selected);
      META.unlockedTowers = Array.from(towerSet).filter(function(v){ return Number.isInteger(Number(v)); }).map(Number).sort(function(a,b){return a-b;});
      if(StageMapState.unlocked !== beforeStage || towerChanged){
        if(typeof saveStageMapProgress === 'function') saveStageMapProgress();
        if(towerChanged && typeof saveOfflineMeta === 'function') saveOfflineMeta();
      }
      return StageMapState.unlocked !== beforeStage || towerChanged;
    }, false);
  }
  function refreshStageUiLabels(){
    safe(function(){
      var max = maxStage();
      var unlocked = isTestModeActive() ? max : clampStage(StageMapState.unlocked || 1);
      var selected = clampStage(StageMapState.selected || 1);
      var map = document.getElementById('stageMap');
      if(map){ map.dataset.unlocked = String(unlocked); map.dataset.selected = String(selected); }
      document.querySelectorAll('#stageMap .stageNode').forEach(function(node){
        var stage = clampStage(node.dataset.stage || 1);
        var open = stage <= unlocked;
        node.classList.toggle('locked', !open);
        node.classList.toggle('unlocked', open);
        var lock = node.querySelector('.nodeLock');
        if(lock) lock.style.display = open ? 'none' : 'block';
      });
      var label = document.getElementById('stageProgressLabel');
      if(label){
        var arc = typeof getConstellationArcByStage === 'function' ? getConstellationArcByStage(selected) : {name:'ORION CONSTELLATION'};
        label.textContent = (isTestModeActive() ? 'TEST MODE · ' : '') + arc.name + ' · OPEN ' + unlocked + ' / ' + max;
      }
      var galaxyLabel = document.getElementById('galaxyProgressLabel');
      if(galaxyLabel && isTestModeActive()) galaxyLabel.textContent = 'TEST MODE · MILKY RIFT · 1 / 4 GALAXIES';
      if(typeof renderHangar === 'function') renderHangar();
    });
  }
  function beforeMapWork(){ if(isTestModeActive()) forceTestModeUnlock(); else syncNormalProgressFromClears(); }

  var _setTestModeEnabled = typeof setTestModeEnabled === 'function' ? setTestModeEnabled : null;
  if(_setTestModeEnabled){
    setTestModeEnabled = function(flag){
      var ret = _setTestModeEnabled.apply(this, arguments);
      if(flag) forceTestModeUnlock();
      else syncNormalProgressFromClears();
      refreshStageUiLabels();
      return ret;
    };
  }
  var _applyTestModeOverrides = typeof applyTestModeOverrides === 'function' ? applyTestModeOverrides : null;
  if(_applyTestModeOverrides){
    applyTestModeOverrides = function(){
      var ret = _applyTestModeOverrides.apply(this, arguments);
      forceTestModeUnlock();
      refreshStageUiLabels();
      return ret;
    };
  }
  var _loadStageMapProgress = typeof loadStageMapProgress === 'function' ? loadStageMapProgress : null;
  if(_loadStageMapProgress){
    loadStageMapProgress = function(){
      var ret = _loadStageMapProgress.apply(this, arguments);
      beforeMapWork();
      refreshStageUiLabels();
      return ret;
    };
  }
  var _loadOfflineMeta = typeof loadOfflineMeta === 'function' ? loadOfflineMeta : null;
  if(_loadOfflineMeta){
    loadOfflineMeta = function(){
      var ret = _loadOfflineMeta.apply(this, arguments);
      beforeMapWork();
      return ret;
    };
  }
  var _syncStageUnlockFromClears = typeof syncStageUnlockFromClears === 'function' ? syncStageUnlockFromClears : null;
  if(_syncStageUnlockFromClears){
    syncStageUnlockFromClears = function(){
      if(isTestModeActive()){ forceTestModeUnlock(); refreshStageUiLabels(); return true; }
      var ret = _syncStageUnlockFromClears.apply(this, arguments);
      syncNormalProgressFromClears();
      refreshStageUiLabels();
      return ret;
    };
  }
  var _renderStageMap = typeof renderStageMap === 'function' ? renderStageMap : null;
  if(_renderStageMap){
    renderStageMap = function(){
      beforeMapWork();
      var ret = _renderStageMap.apply(this, arguments);
      beforeMapWork();
      refreshStageUiLabels();
      return ret;
    };
  }
  var _syncStageMapSelectionAndInfo = typeof syncStageMapSelectionAndInfo === 'function' ? syncStageMapSelectionAndInfo : null;
  if(_syncStageMapSelectionAndInfo){
    syncStageMapSelectionAndInfo = function(stageNo, opts){
      beforeMapWork();
      var ret = _syncStageMapSelectionAndInfo.apply(this, arguments);
      beforeMapWork();
      refreshStageUiLabels();
      return ret;
    };
  }
  var _startSelectedStageFromMap = typeof startSelectedStageFromMap === 'function' ? startSelectedStageFromMap : null;
  if(_startSelectedStageFromMap){
    startSelectedStageFromMap = function(){
      beforeMapWork();
      refreshStageUiLabels();
      return _startSelectedStageFromMap.apply(this, arguments);
    };
  }
  var _completeStageFromBattle = typeof completeStageFromBattle === 'function' ? completeStageFromBattle : null;
  if(_completeStageFromBattle){
    completeStageFromBattle = function(){
      var ret = _completeStageFromBattle.apply(this, arguments);
      setTimeout(function(){ syncNormalProgressFromClears(); refreshStageUiLabels(); }, 0);
      setTimeout(function(){ syncNormalProgressFromClears(); refreshStageUiLabels(); }, 120);
      return ret;
    };
  }

  document.addEventListener('click', function(e){
    var testBtn = e.target && e.target.closest && e.target.closest('#testModeBtn');
    if(testBtn){
      safe(function(){ applyTestModeOverrides(); });
      setTimeout(function(){ forceTestModeUnlock(); refreshStageUiLabels(); }, 0);
      setTimeout(function(){ forceTestModeUnlock(); refreshStageUiLabels(); if(typeof renderStageMap === 'function') renderStageMap(); }, 80);
    }
  }, true);

  window.PRD_UNLOCK_HARDENING_V127 = {
    forceTestModeUnlock: forceTestModeUnlock,
    syncNormalProgressFromClears: syncNormalProgressFromClears,
    refreshStageUiLabels: refreshStageUiLabels
  };
  setTimeout(function(){ beforeMapWork(); refreshStageUiLabels(); }, 0);
})();

/* ===== v144-stage-map-topright-two-buttons-restore-js ===== */
(function(){
  function syncStageAudioButton(){
    var stageAudio = document.getElementById('stageAudioQuickBtn');
    var battleAudio = document.getElementById('audioBtn');
    if(!stageAudio) return;
    var isOff = battleAudio ? battleAudio.classList.contains('is-off') : false;
    stageAudio.classList.toggle('is-off', isOff);
    stageAudio.setAttribute('aria-label', isOff ? 'BGM 켜기' : 'BGM 끄기');
    stageAudio.setAttribute('title', isOff ? 'BGM OFF' : 'BGM ON');
  }
  function ensureStageQuickControls(){
    var stageMap = document.getElementById('stageMap');
    if(!stageMap) return;
    var oldSquare = document.getElementById('stageTowerManageBtn');
    if(oldSquare && oldSquare.parentNode) oldSquare.parentNode.removeChild(oldSquare);

    var wrap = document.getElementById('stageQuickControls');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'stageQuickControls';
      wrap.className = 'stageQuickControls';
      wrap.setAttribute('aria-label', '스테이지 맵 빠른 조작');
      wrap.innerHTML =
        '<button id="stageTowerQuickBtn" class="stageQuickBtn stageQuickBtn--tower" type="button" aria-label="강화 관리" title="강화 관리"><img src="assets/images/ui/icons/ui_icon_tower.png" alt="" aria-hidden="true"></button>' +
        '<button id="stageAudioQuickBtn" class="stageQuickBtn stageQuickBtn--bgm" type="button" aria-label="BGM 끄기" title="BGM ON"><img src="assets/images/ui/icons/ui_icon_bgm.png" alt="" aria-hidden="true"></button>';
      stageMap.appendChild(wrap);
    }

    var tower = document.getElementById('stageTowerQuickBtn');
    var audio = document.getElementById('stageAudioQuickBtn');

    if(tower && tower.dataset.v144Bound !== '1'){
      tower.dataset.v144Bound = '1';
      tower.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        var fieldTower = document.getElementById('towerMenuBtn');
        if(fieldTower){
          fieldTower.click();
          setTimeout(function(){
            var commonTab = document.querySelector('[data-tower-popup-tab="common"]');
            if(commonTab) commonTab.click();
          }, 0);
        }
      });
    }
    if(audio && audio.dataset.v144Bound !== '1'){
      audio.dataset.v144Bound = '1';
      audio.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        var fieldAudio = document.getElementById('audioBtn');
        if(fieldAudio){
          fieldAudio.click();
          setTimeout(syncStageAudioButton, 0);
        }
      });
    }
    syncStageAudioButton();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureStageQuickControls, {once:true});
  }else{
    ensureStageQuickControls();
  }
  window.addEventListener('load', ensureStageQuickControls, {once:true});
  document.addEventListener('click', function(){
    setTimeout(syncStageAudioButton, 0);
  }, true);
})();

/* ===== v207-pointer-fill-calibration ===== */
(function(){
  function clampLocal(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function fillPos(e){
    var c = document.getElementById('canvas');
    if(!c) return {x:0,y:0};
    var r = c.getBoundingClientRect();
    var p = e && e.touches ? e.touches[0] : e;
    var cw = Number(c.width) || 748;
    var ch = Number(c.height) || 708;
    return {
      x: clampLocal(((p.clientX - r.left) * cw) / Math.max(1, r.width), 0, cw),
      y: clampLocal(((p.clientY - r.top) * ch) / Math.max(1, r.height), 0, ch)
    };
  }
  try{
    window.pos = fillPos;
    if (typeof pos !== 'undefined') pos = fillPos;
  }catch(err){
    window.pos = fillPos;
  }
})();

/* ===== v209-true-floating-game-hud-script ===== */
(function(){
  function moveNode(node, target){
    if(node && target && node.parentElement !== target){
      target.appendChild(node);
    }
  }
  function ensure(id, className, parent){
    var el=document.getElementById(id);
    if(!el){
      el=document.createElement('div');
      el.id=id;
      if(className) el.className=className;
    }
    if(parent && el.parentElement !== parent) parent.appendChild(el);
    return el;
  }
  function installCombatHud(){
    var field=document.getElementById('field');
    if(!field) return;
    var hud=ensure('combatHudOverlay','combatHudOverlay',field);
    var left=ensure('combatHudLeft','combatHudLeft',hud);
    var meta=ensure('combatHudMeta','combatHudMeta',left);
    var commands=ensure('combatHudCommands','combatHudCommands',left);
    var right=ensure('combatHudRight','combatHudRight',hud);
    var statsWrap=ensure('combatHudStatsWrap','combatHudStatsWrap',right);
    var buttons=ensure('combatHudButtons','combatHudButtons',right);

    moveNode(document.querySelector('.battleStageLine'), meta);
    moveNode(document.querySelector('.bar.compactWave, .compactWave'), meta);
    moveNode(document.getElementById('wavePreviewLine'), meta);
    moveNode(document.getElementById('globalEffectLine'), meta);
    moveNode(document.querySelector('.battleActions'), commands);
    moveNode(document.querySelector('.battleStatLine'), statsWrap);
    moveNode(document.querySelector('.fieldTopControls'), buttons);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', installCombatHud, {once:true});
  }else{
    installCombatHud();
  }
  window.addEventListener('load', installCombatHud, {once:true});
  setTimeout(installCombatHud, 250);
  setTimeout(installCombatHud, 1000);
})();

/* ===== v214-top-hud-proportional-edge-layout-script ===== */
(function(){
  function ensureTopLine(){
    var hud = document.getElementById('combatHudOverlay');
    if(!hud) return;
    var topLine = document.getElementById('combatHudTopLine');
    if(!topLine){
      topLine = document.createElement('div');
      topLine.id = 'combatHudTopLine';
      hud.insertBefore(topLine, hud.firstChild);
    }else if(topLine.parentElement !== hud){
      hud.insertBefore(topLine, hud.firstChild);
    }
    var left = document.getElementById('combatHudLeft');
    var right = document.getElementById('combatHudRight');
    if(left && left.parentElement !== topLine) topLine.appendChild(left);
    if(right && right.parentElement !== topLine) topLine.appendChild(right);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureTopLine, {once:true});
  }else{
    ensureTopLine();
  }
  window.addEventListener('load', ensureTopLine, {once:true});
  setTimeout(ensureTopLine, 100);
  setTimeout(ensureTopLine, 500);
  setTimeout(ensureTopLine, 1200);
})();

/* ===== v216-pause-decision-dialog-script ===== */
(function(){
  function byId(id){ return document.getElementById(id); }

  function ensurePauseDecisionOverlay(){
    var overlay = byId('pauseDecisionOverlay');
    if(overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'pauseDecisionOverlay';
    overlay.setAttribute('hidden','');
    overlay.innerHTML = '<div class="pauseDecisionCard" role="dialog" aria-modal="true" aria-labelledby="pauseDecisionTitle">'
      + '<div class="pauseDecisionKicker">BATTLE PAUSED</div>'
      + '<h2 id="pauseDecisionTitle">일시정지</h2>'
      + '<p>전투가 멈춰 있습니다. 이어서 플레이하거나 현재 전투를 종료하고 성역 지도로 돌아갈 수 있습니다.</p>'
      + '<div class="pauseDecisionActions">'
      + '<button id="pauseQuitBtn" type="button">게임 종료하기</button>'
      + '<button id="pauseResumeBtn" type="button">계속 이어서하기</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    var resume = byId('pauseResumeBtn');
    var quit = byId('pauseQuitBtn');
    if(resume) resume.addEventListener('click', resumeBattleFromPauseMenu);
    if(quit) quit.addEventListener('click', quitBattleFromPauseMenu);
    overlay.addEventListener('click', function(e){
      // Clicking the backdrop keeps the battle paused intentionally. Use the buttons for explicit action.
      if(e.target === overlay) e.preventDefault();
    });
    return overlay;
  }

  function showPauseDecisionOverlay(){
    if(!window.S || S.gameOver) return;
    var overlay = ensurePauseDecisionOverlay();
    S.paused = true;
    overlay.removeAttribute('hidden');
    overlay.classList.add('open');
    try{ if(typeof updateUI === 'function') updateUI(); }catch(_){ }
    var resume = byId('pauseResumeBtn');
    if(resume){ setTimeout(function(){ try{ resume.focus({preventScroll:true}); }catch(_){ resume.focus(); } }, 20); }
  }

  function hidePauseDecisionOverlay(){
    var overlay = byId('pauseDecisionOverlay');
    if(!overlay) return;
    overlay.setAttribute('hidden','');
    overlay.classList.remove('open');
  }

  function resumeBattleFromPauseMenu(){
    hidePauseDecisionOverlay();
    if(window.S && !S.gameOver){
      S.paused = false;
      try{ if(typeof updateUI === 'function') updateUI(); }catch(_){ }
      try{ if(typeof toast === 'function') toast('전투 재개'); }catch(_){ }
    }
  }

  function quitBattleFromPauseMenu(){
    hidePauseDecisionOverlay();
    try{ if(typeof cancelAnimationFrame === 'function' && typeof raf !== 'undefined') cancelAnimationFrame(raf); }catch(_){ }
    try{ if(typeof stopAllGameAudio === 'function') stopAllGameAudio(); else if(typeof stopStageBgm === 'function') stopStageBgm(); }catch(_){ }
    try{ if(typeof removeGameOverOverlay === 'function') removeGameOverOverlay(); }catch(_){ }
    try{ if(window.S){ S.paused = true; S.active = false; S.skillModalOpen = false; S.gameOver = true; } }catch(_){ }

    var game = byId('game');
    var stageMap = byId('stageMap');
    var menu = byId('menu');
    if(game) game.style.display = 'none';
    if(menu) menu.style.display = 'none';
    if(stageMap) stageMap.style.display = 'block';

    try{ if(typeof reset === 'function') reset(); }catch(err){ console.warn('pause quit reset failed', err); }
    try{ if(typeof resetBattleUnitsForStageMap === 'function') resetBattleUnitsForStageMap(); }catch(err){ console.warn('pause quit unit reset failed', err); }
    try{ if(typeof renderStageMap === 'function') renderStageMap(); }catch(err){ console.warn('pause quit map render failed', err); }
    try{ if(typeof renderOfflineMetaPanel === 'function') renderOfflineMetaPanel(); }catch(_){ }
    try{
      var hint = byId('stageHint');
      if(hint) hint.textContent = '전투를 종료했습니다. 같은 성역을 다시 선택해 이어서 도전할 수 있습니다.';
    }catch(_){ }
    try{ if(typeof toast === 'function') toast('전투 종료 — 성역 지도로 이동'); }catch(_){ }
  }

  function installPauseDecisionHook(){
    var pauseBtn = byId('pauseBtn');
    if(!pauseBtn || pauseBtn.dataset.pauseDecisionHook === '1') return;
    pauseBtn.dataset.pauseDecisionHook = '1';
    pauseBtn.onclick = function(){
      if(!window.S || S.gameOver) return;
      if(S.paused){
        resumeBattleFromPauseMenu();
      }else{
        S.paused = true;
        try{ if(typeof updateUI === 'function') updateUI(); }catch(_){ }
        showPauseDecisionOverlay();
      }
    };
  }

  function initPauseDecision(){
    ensurePauseDecisionOverlay();
    installPauseDecisionHook();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPauseDecision, {once:true});
  else initPauseDecision();
  window.addEventListener('load', initPauseDecision, {once:true});
  setTimeout(initPauseDecision, 300);
  setTimeout(initPauseDecision, 1200);

  // Original Space-key pause handler still toggles the state. This listener runs later
  // and opens/closes the decision dialog according to the resulting state.
  window.addEventListener('keydown', function(e){
    if(e.repeat || e.code !== 'Space') return;
    setTimeout(function(){
      if(!window.S || S.gameOver) return;
      if(S.paused) showPauseDecisionOverlay();
      else hidePauseDecisionOverlay();
    }, 0);
  });

  window.PauseDecisionMenu = {
    show: showPauseDecisionOverlay,
    hide: hidePauseDecisionOverlay,
    resume: resumeBattleFromPauseMenu,
    quit: quitBattleFromPauseMenu
  };
})();

/* ===== v21-safe-combat-only-controls-script ===== */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function visible(el){
    if(!el) return false;
    var cs = window.getComputedStyle ? getComputedStyle(el) : null;
    if(cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    return !!(r && r.width > 4 && r.height > 4);
  }
  function setCombatUi(active){
    var body = document.body;
    var menuVisible = visible(byId('menu')) || visible(byId('galaxyMap')) || visible(byId('stageMap')) || visible(byId('stageClearOverlay'));
    var finalActive = !!active && !menuVisible;
    body.classList.toggle('prd-combat-ui-active', finalActive);
    body.classList.toggle('prd-map-ui-active', !finalActive);
    body.classList.toggle('prd-battle-active', finalActive);
    body.classList.toggle('prd-combat-screen-active', finalActive);
    body.classList.remove('prd-non-combat-screen');
    var game = byId('game');
    if(game){
      game.classList.toggle('prd-combat-ui-active', finalActive);
      game.classList.toggle('prd-battle-active', finalActive);
      game.classList.toggle('prd-combat-screen-active', finalActive);
      game.dataset.combatScreenActive = finalActive ? '1' : '0';
    }
    var field = byId('field');
    if(field) field.dataset.battleActive = finalActive ? '1' : '0';
    var pause = byId('pauseDecisionOverlay');
    if(pause && !finalActive){
      pause.hidden = true;
      pause.setAttribute('aria-hidden','true');
      pause.classList.remove('open');
    }
  }
  function computeCombatActive(){
    var gameVisible = visible(byId('game'));
    var mapVisible = visible(byId('menu')) || visible(byId('galaxyMap')) || visible(byId('stageMap')) || visible(byId('stageClearOverlay'));
    return gameVisible && !mapVisible;
  }
  function sync(){ setCombatUi(computeCombatActive()); }
  function deferSync(){
    sync();
    if(window.requestAnimationFrame) requestAnimationFrame(sync);
    setTimeout(sync, 60);
    setTimeout(sync, 180);
  }
  function wrapFunction(name, mode){
    var fn = window[name];
    if(typeof fn !== 'function' || fn.__prdCombatUiWrapped) return;
    var wrapped = function(){
      if(mode === 'beforeOff') setCombatUi(false);
      var ret = fn.apply(this, arguments);
      if(mode === 'battleOn'){
        setTimeout(function(){ setCombatUi(true); }, 0);
        setTimeout(sync, 80);
        setTimeout(sync, 220);
      }else{
        setTimeout(function(){ setCombatUi(false); }, 0);
        setTimeout(sync, 80);
      }
      return ret;
    };
    wrapped.__prdCombatUiWrapped = true;
    window[name] = wrapped;
    try{ eval(name + ' = window[name]'); }catch(_){ }
  }
  function install(){
    wrapFunction('startSelectedStageFromMap', 'battleOn');
    wrapFunction('showStageMap', 'beforeOff');
    wrapFunction('showGalaxyMapClean', 'beforeOff');
    wrapFunction('returnMainFromGalaxyClean', 'beforeOff');
    wrapFunction('enterMilkyRiftClean', 'beforeOff');
    wrapFunction('completeStageFromBattle', 'beforeOff');
    if(window.PauseDecisionMenu && typeof window.PauseDecisionMenu.quit === 'function' && !window.PauseDecisionMenu.quit.__prdCombatUiWrapped){
      var quit = window.PauseDecisionMenu.quit;
      window.PauseDecisionMenu.quit = function(){
        var ret = quit.apply(this, arguments);
        setTimeout(function(){ setCombatUi(false); }, 0);
        setTimeout(sync, 80);
        return ret;
      };
      window.PauseDecisionMenu.quit.__prdCombatUiWrapped = true;
    }
    deferSync();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
  window.addEventListener('load', install, {once:true});
  window.addEventListener('resize', deferSync, {passive:true});
  window.addEventListener('orientationchange', deferSync, {passive:true});
  document.addEventListener('click', function(){ setTimeout(deferSync, 0); }, true);
  document.addEventListener('keyup', function(){ setTimeout(deferSync, 0); }, true);
  window.PRD_SET_COMBAT_UI_ACTIVE = setCombatUi;
  window.PRD_SYNC_BATTLE_HUD_VISIBILITY = sync;
  window.PRD_SYNC_STRICT_COMBAT_UI = sync;
})();

/* ===== v227-pause-decision-menu-final-script ===== */
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

/* ===== v229-reliable-pause-decision-modal-script ===== */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{ return fn && fn(); }catch(err){ console.warn('[v229 pause]', err); return null; } }
  function hasState(){ return (typeof S !== 'undefined' && S); }
  function visible(el){
    if(!el) return false;
    var st = window.getComputedStyle ? getComputedStyle(el) : null;
    if(st && (st.display === 'none' || st.visibility === 'hidden')) return false;
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    return !r || (r.width > 2 && r.height > 2);
  }
  function isGameScreen(){
    var game = byId('game');
    if(!visible(game)) return false;
    if(visible(byId('stageMap')) || visible(byId('galaxyMap')) || visible(byId('menu'))) return false;
    return true;
  }
  function hideOldPauseMenus(){
    ['pauseDecisionOverlayV27','pauseDecisionOverlay'].forEach(function(id){
      var el = byId(id);
      if(el){ el.setAttribute('hidden',''); el.classList.remove('open','is-open'); }
    });
  }
  function ensurePauseModal(){
    var overlay = byId('pauseDecisionOverlayV29');
    if(overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'pauseDecisionOverlayV29';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = '<div class="pauseV29Card" role="dialog" aria-modal="true" aria-labelledby="pauseDecisionTitleV29">'
      + '<div class="pauseV29Kicker">BATTLE PAUSED</div>'
      + '<h2 id="pauseDecisionTitleV29">일시정지</h2>'
      + '<p>전투가 멈춰 있습니다. 계속 진행하거나 현재 전투를 종료하고 이전 스테이지 화면으로 이동할 수 있습니다.</p>'
      + '<div class="pauseV29Actions">'
      + '<button id="pauseExitBtnV29" type="button">이전 페이지로 이동</button>'
      + '<button id="pauseResumeBtnV29" type="button">계속 진행하기</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){ if(e.target === overlay){ e.preventDefault(); e.stopPropagation(); } }, true);
    var resume = byId('pauseResumeBtnV29');
    var exit = byId('pauseExitBtnV29');
    if(resume) resume.addEventListener('click', resumeBattleFromPauseV29, true);
    if(exit) exit.addEventListener('click', exitBattleFromPauseV29, true);
    return overlay;
  }
  function showPauseModalV29(e){
    if(e){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
    if(!hasState() || S.gameOver) return;
    if(!isGameScreen()) return;
    hideOldPauseMenus();
    var overlay = ensurePauseModal();
    S.paused = true;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('prd-pause-v29-open','prd-pause-menu-open');
    safe(function(){ if(typeof updateUI === 'function') updateUI(); });
    var resume = byId('pauseResumeBtnV29');
    if(resume) setTimeout(function(){ safe(function(){ resume.focus({preventScroll:true}); }); }, 20);
  }
  function hidePauseModalV29(){
    var overlay = byId('pauseDecisionOverlayV29');
    if(overlay){ overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden','true'); }
    document.body.classList.remove('prd-pause-v29-open','prd-pause-menu-open');
    hideOldPauseMenus();
  }
  function resumeBattleFromPauseV29(e){
    if(e){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
    hidePauseModalV29();
    if(hasState() && !S.gameOver){
      S.paused = false;
      safe(function(){ if(typeof updateUI === 'function') updateUI(); });
      safe(function(){ if(typeof toast === 'function') toast('전투 재개'); });
    }
  }
  function cleanupBattleForExit(){
    if(hasState()){
      S.paused = true;
      S.active = false;
      S.skillModalOpen = false;
      S.gameOver = true;
      S.gameOverOverlayRequested = true;
      S.runEnded = true;
    }
    safe(function(){ if(typeof removeGameOverOverlay === 'function') removeGameOverOverlay(); });
    safe(function(){ if(typeof stopAllGameAudio === 'function') stopAllGameAudio(); else if(typeof stopStageBgm === 'function') stopStageBgm(); });
    safe(function(){ if(typeof resetBattleUnitsForStageMap === 'function') resetBattleUnitsForStageMap(); });
    safe(function(){ selected = -1; dragging = null; });
  }
  function goPreviousStagePage(){
    document.body.classList.remove('prd-combat-ui-active','prd-battle-active','prd-pause-v29-open','prd-pause-menu-open');
    document.body.classList.add('prd-map-ui-active');
    if(typeof showStageMap === 'function'){
      safe(function(){ showStageMap(); });
      return;
    }
    if(window.PRD_NAV && typeof window.PRD_NAV.showStage === 'function'){
      safe(function(){ window.PRD_NAV.showStage(); });
      return;
    }
    var game = byId('game'), menu = byId('menu'), galaxy = byId('galaxyMap'), stage = byId('stageMap');
    if(game) game.style.display = 'none';
    if(menu) menu.style.display = 'none';
    if(galaxy) galaxy.style.display = 'none';
    if(stage){ stage.style.display = 'block'; stage.classList.add('premiumStage'); }
    safe(function(){ if(typeof renderStageMap === 'function') renderStageMap(); });
  }
  function exitBattleFromPauseV29(e){
    if(e){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
    hidePauseModalV29();
    cleanupBattleForExit();
    goPreviousStagePage();
    safe(function(){ if(typeof toast === 'function') toast('전투 종료 — 이전 화면으로 이동'); });
  }
  function isPauseTarget(t){ return !!(t && t.closest && t.closest('#pauseBtn, [data-pause-btn], .pauseBtn')); }
  document.addEventListener('click', function(e){
    if(isPauseTarget(e.target)) showPauseModalV29(e);
  }, true);
  window.addEventListener('keydown', function(e){
    if(e.repeat || e.code !== 'Space') return;
    if(!hasState() || S.gameOver || !isGameScreen()) return;
    showPauseModalV29(e);
  }, true);
  function init(){ ensurePauseModal(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
  window.addEventListener('load', init, {once:true});
  window.PauseDecisionMenuV29 = {show:showPauseModalV29, hide:hidePauseModalV29, resume:resumeBattleFromPauseV29, exit:exitBattleFromPauseV29};
})();

/* ===== v35-field-pointer-bridge-script ===== */
(function(){
  'use strict';
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
    return !!target.closest([
      '#combatHudCommands',
      '#combatHudButtons',
      '.fieldTopControls',
      '#towerPopup',
      '#pauseDecisionOverlay',
      '#pauseDecisionOverlayV27',
      '#pauseDecisionOverlayV29',
      '#gameOverOverlay',
      'button',
      'a',
      'input',
      'select',
      'textarea',
      '[role="button"]'
    ].join(','));
  }
  function dispatchCanvasMouse(type, source){
    var canvas = byId('canvas');
    var p = pointFromEvent(source);
    if(!canvas || !p) return false;
    var ev = new MouseEvent(type, {
      bubbles:true,
      cancelable:true,
      view:window,
      clientX:p.x,
      clientY:p.y,
      screenX:source.screenX || p.x,
      screenY:source.screenY || p.y,
      button:source.button || 0,
      buttons:type === 'mouseup' ? 0 : (source.buttons || 1),
      ctrlKey:!!source.ctrlKey,
      shiftKey:!!source.shiftKey,
      altKey:!!source.altKey,
      metaKey:!!source.metaKey
    });
    try{ Object.defineProperty(ev, '__prdFieldBridgeSynthetic', {value:true}); }catch(_){ ev.__prdFieldBridgeSynthetic = true; }
    bridging = true;
    try{ canvas.dispatchEvent(ev); }
    finally{ bridging = false; }
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
    if(!fieldActive) return;
    if(!isCombatScreen()) return;
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
    if(insideField(p) && !isRealControlTarget(e.target)){
      /* onUp() reads the last cached mouse position, so update it once right before the native window mouseup/touchend handler runs. */
      dispatchCanvasMouse('mousemove', e);
    }
  }

  document.addEventListener('mousedown', begin, true);
  document.addEventListener('mousemove', move, true);
  window.addEventListener('mouseup', end, true);
  document.addEventListener('touchstart', begin, {capture:true, passive:false});
  document.addEventListener('touchmove', move, {capture:true, passive:false});
  window.addEventListener('touchend', end, {capture:true, passive:false});
  window.addEventListener('blur', function(){ fieldActive = false; }, true);
})();

/* ===== v240-compact-transparent-top-hud-final-script ===== */
(function(){
  'use strict';
  var root = null;
  var stageValue = null;
  var goldValue = null;
  var coreValue = null;
  var lastStage = '';
  var lastGold = '';
  var lastCore = '';

  function byId(id){ return document.getElementById(id); }
  function visible(el){
    if(!el || !el.getBoundingClientRect) return false;
    var cs = window.getComputedStyle ? getComputedStyle(el) : null;
    if(cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
    var r = el.getBoundingClientRect();
    return !!(r.width > 4 && r.height > 4);
  }
  function textOf(id, fallback){
    var el = byId(id);
    var v = el ? (el.textContent || '').trim() : '';
    return v || fallback || '';
  }
  function isCombatScreen(){
    var body = document.body;
    if(!body) return false;
    if(body.classList && body.classList.contains('prd-map-ui-active')) return false;
    if(body.classList && body.classList.contains('prd-combat-ui-active')) return true;
    return visible(byId('game')) && visible(byId('field')) && !visible(byId('menu')) && !visible(byId('galaxyMap')) && !visible(byId('stageMap'));
  }
  function ensureRoot(){
    var field = byId('field');
    if(!field) return null;
    root = byId('mjTopMiniHud');
    if(!root){
      root = document.createElement('div');
      root.id = 'mjTopMiniHud';
      root.setAttribute('aria-label','전투 상단 요약 정보');
      root.innerHTML = [
        '<div class="mjStageMini" id="mjTinyStage" aria-label="스테이지">',
          '<span class="mjMiniLabel">스테이지</span>',
          '<strong id="mjTinyStageValue">1-1</strong>',
        '</div>',
        '<div class="mjResourceStrip" id="mjTinyResources" aria-label="보유 재화와 코어">',
          '<div class="mjResourcePill mjGoldPill" aria-label="돈"><i class="mjMoneyIcon" aria-hidden="true"></i><b id="mjTinyGoldValue">500</b></div>',
          '<div class="mjResourcePill mjCorePill" aria-label="코어"><i class="mjCoreIcon" aria-hidden="true"></i><b id="mjTinyCoreValue">25</b></div>',
        '</div>'
      ].join('');
      field.appendChild(root);
    }else if(root.parentElement !== field){
      field.appendChild(root);
    }
    stageValue = byId('mjTinyStageValue');
    goldValue = byId('mjTinyGoldValue');
    coreValue = byId('mjTinyCoreValue');
    return root;
  }
  function hideUnusedStats(){
    ['exp','level'].forEach(function(id){
      var el = byId(id);
      var stat = el && el.closest ? el.closest('.stat') : null;
      if(stat){ stat.setAttribute('data-mj-hide-stat','1'); }
    });
  }
  function sync(){
    var el = ensureRoot();
    if(!el) return;
    hideUnusedStats();
    var active = isCombatScreen();
    el.classList.toggle('is-active', active);
    if(!active) return;

    var stage = textOf('stageLabel', lastStage || '1-1');
    var gold = textOf('gold', lastGold || '0');
    var core = textOf('hp', lastCore || '0');
    if(stage !== lastStage && stageValue){ stageValue.textContent = stage; lastStage = stage; }
    if(gold !== lastGold && goldValue){ goldValue.textContent = gold; lastGold = gold; }
    if(core !== lastCore && coreValue){ coreValue.textContent = core; lastCore = core; }
  }
  function boot(){
    sync();
    setTimeout(sync, 80);
    setTimeout(sync, 250);
    setTimeout(sync, 800);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }
  window.addEventListener('load', boot, {once:true});
  window.addEventListener('resize', sync, {passive:true});
  window.addEventListener('orientationchange', function(){ setTimeout(sync, 120); }, {passive:true});
  document.addEventListener('click', function(){ setTimeout(sync, 0); setTimeout(sync, 160); }, true);
  document.addEventListener('keyup', function(){ setTimeout(sync, 0); }, true);
  setInterval(sync, 350);
})();

/* ===== v241-top-right-controls-and-hud-margin-final-script ===== */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function keepControlsOnTop(){
    var field = byId('field');
    var controls = document.querySelector('.fieldTopControls');
    if(!field || !controls) return;
    /* 기존 v209/v214 패치가 버튼을 HUD 라인 안으로 옮겨도 위치는 CSS로 고정되지만,
       직접 자식으로 되돌리면 flex 라인의 빈 공간 영향까지 줄어든다. */
    if(controls.parentElement !== field){
      field.appendChild(controls);
    }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', keepControlsOnTop, {once:true});
  }else{
    keepControlsOnTop();
  }
  window.addEventListener('load', keepControlsOnTop, {once:true});
  setTimeout(keepControlsOnTop, 80);
  setTimeout(keepControlsOnTop, 400);
  setTimeout(keepControlsOnTop, 1300);
  setInterval(keepControlsOnTop, 900);
})();

/* ===== v242-armory-orientation-mode-script ===== */
(function(){
  'use strict';
  function getPopup(){ return document.getElementById('towerPopup'); }
  function applyArmoryLayoutMode(){
    var popup = getPopup();
    if(!popup) return;
    var isLandscape = window.innerWidth > window.innerHeight;
    popup.classList.toggle('armory-layout-landscape', !!isLandscape);
    popup.classList.toggle('armory-layout-portrait', !isLandscape);
    popup.dataset.layoutMode = isLandscape ? 'landscape' : 'portrait';
  }
  function patchOpen(){
    if(typeof window.openTowerArmoryPopup !== 'function' || window.__armoryOrientationModePatchedV242) return;
    var originalOpen = window.openTowerArmoryPopup;
    window.openTowerArmoryPopup = function(tab){
      applyArmoryLayoutMode();
      return originalOpen.apply(this, arguments);
    };
    var originalSetTab = typeof window.setTowerArmoryTab === 'function' ? window.setTowerArmoryTab : null;
    if(originalSetTab){
      window.setTowerArmoryTab = function(tab){
        applyArmoryLayoutMode();
        return originalSetTab.apply(this, arguments);
      };
    }
    window.__armoryOrientationModePatchedV242 = true;
  }
  function watchPopupState(){
    var popup = getPopup();
    if(!popup || popup.__armoryLayoutObserverV242) return;
    var observer = new MutationObserver(function(){
      if(popup.classList.contains('open')) applyArmoryLayoutMode();
    });
    observer.observe(popup, {attributes:true, attributeFilter:['class']});
    popup.__armoryLayoutObserverV242 = observer;
    if(popup.classList.contains('open')) applyArmoryLayoutMode();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ patchOpen(); watchPopupState(); }, {once:true});
  }else{
    patchOpen();
    watchPopupState();
  }
  window.addEventListener('load', function(){ patchOpen(); watchPopupState(); }, {once:true});
  window.addEventListener('resize', function(){
    var popup = getPopup();
    if(popup && popup.classList.contains('open')) applyArmoryLayoutMode();
  });
})();

/* ===== v244-armory-layout-class-guard ===== */
(function(){
  'use strict';
  function apply(){
    var popup=document.getElementById('towerPopup');
    if(!popup) return;
    var isLandscape=window.innerWidth>window.innerHeight;
    popup.classList.toggle('armory-layout-landscape',isLandscape);
    popup.classList.toggle('armory-layout-portrait',!isLandscape);
    popup.dataset.layoutMode=isLandscape?'landscape':'portrait';
  }
  var original=window.openTowerArmoryPopup;
  if(typeof original==='function'&&!window.__armoryLandscapeFinalGuardV244){
    window.openTowerArmoryPopup=function(){apply();var ret=original.apply(this,arguments);requestAnimationFrame(apply);return ret;};
    window.__armoryLandscapeFinalGuardV244=true;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
  window.addEventListener('resize',apply,{passive:true});
  window.addEventListener('orientationchange',function(){setTimeout(apply,80);},{passive:true});
})();

/* ===== v253-armory-scroll-reset-guard ===== */
(function(){
  'use strict';
  function resetDetailScroll(){
    var detail=document.getElementById('towerPopupDetail');
    if(!detail) return;
    detail.scrollLeft=0;
  }
  function scheduleReset(){
    requestAnimationFrame(function(){ requestAnimationFrame(resetDetailScroll); });
  }
  document.addEventListener('click',function(e){
    if(!e.target) return;
    if(e.target.closest('#towerPopup [data-tower-popup-tab], #towerPopupList button, #towerPopup [data-v164-common], #towerPopup [data-v164-tower], #towerPopup [data-v164-plate], #towerPopup [data-common-research-select], #towerPopup [data-tower-type]')){
      scheduleReset();
    }
  },true);
  function attachObserver(){
    var detail=document.getElementById('towerPopupDetail');
    if(!detail || detail.__v253ScrollResetObserver) return;
    var mo=new MutationObserver(scheduleReset);
    mo.observe(detail,{childList:true});
    detail.__v253ScrollResetObserver=mo;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',attachObserver,{once:true}); else attachObserver();
  window.addEventListener('resize',scheduleReset,{passive:true});
  window.addEventListener('orientationchange',function(){setTimeout(scheduleReset,80);},{passive:true});
})();

/* ===== v264-armory-compact-combined-layout-script ===== */
(function(){
  'use strict';
  function pillTags(tags){ return '<div class="armoryMiniTags">'+(tags||[]).map(function(t){return '<span>'+esc(t)+'</span>';}).join('')+'</div>'; }
  function infoRow(label, value, desc, highlight){ return '<div class="armoryInfoRow"><small>'+esc(label)+'</small><div><b class="'+(highlight?'highlight':'')+'">'+esc(value)+'</b>'+(desc?'<span>'+esc(desc)+'</span>':'')+'</div></div>'; }
  function statCell(label, value){ return '<div class="armoryInlineStat"><small>'+esc(label)+'</small><b>'+esc(value)+'</b></div>'; }
  function resetDetailScroll(){ var detail=document.getElementById('towerPopupDetail'); if(detail) detail.scrollLeft=0; }
  function rerenderAfterUpdate(){ requestAnimationFrame(function(){ requestAnimationFrame(resetDetailScroll); }); }

  renderCommonDetail=function(key){
    var e=els(); var api=window.TowerDefenseGrowth; var ups=api&&api.getUpgrades?api.getUpgrades():[]; var u=ups.find(function(x){return x.key===key;})||ups[0];
    if(!u){ e.detail.innerHTML='<div class="towerPopupEmpty">공통 연구 데이터가 없습니다.</div>'; return; }
    selectedCommonKey=u.key;
    e.list.querySelectorAll('[data-v164-common]').forEach(function(b){ b.classList.toggle('active', b.dataset.v164Common===selectedCommonKey); });
    if(!u.unlocked){
      var stage=Math.max(1,Number(u.unlockStage||1)); var unlock=stage<=1?'기본 연구':(stage-1)+'성역 클리어 후';
      e.detail.className='towerPopupDetail compactCombined';
      e.detail.innerHTML='<div class="armoryHeroPanel lockedResearchPolish" style="--skill-color:'+esc(u.color)+'"><div class="armoryHeroHeader"><div class="lockedResearchIconWrap">'+iconImg(u.icon,'hero')+'<span class="lockedResearchLock">🔒</span></div><div><div class="armoryPanelTitle">Locked Research</div><h2 class="lockedResearchTitle">'+esc(commonTitle(u))+'</h2><p class="lockedResearchDesc">'+esc(unlock)+' 연구 정보와 업그레이드가 열립니다.</p>'+pillTags(commonTags[u.key]||['공용'])+'</div></div></div>';
      rerenderAfterUpdate();
      return;
    }
    var shards=Number(api&&api.getShards?api.getShards():0)||0; var cost=Number(u.cost||0)||0; var canBuy=u.unlocked&&!u.maxed&&shards>=cost; var costText=u.maxed?'MAX':cost.toLocaleString('ko-KR')+' 조각';
    e.detail.className='towerPopupDetail compactCombined';
    e.detail.innerHTML=''
      +'<div class="armoryHeroPanel" style="--skill-color:'+esc(u.color)+'"><div class="armoryHeroHeader"><div class="armoryCommonIcon">'+iconImg(u.icon,'hero')+'</div><div><div class="armoryPanelTitle">Common Research</div><h2 class="armoryCommonTitle">'+esc(commonTitle(u))+'</h2><div class="armoryCommonSubtitle">'+esc(commonSubtitle(u))+'</div>'+pillTags(commonTags[u.key]||['공용'])+'</div></div></div>'
      +'<div class="armoryComboPanel" style="--skill-color:'+esc(u.color)+'"><div class="upgradeSummaryTop"><div><div class="armoryPanelTitle">Next Upgrade</div><div class="armoryDenseList">'+infoRow('다음 업그레이드', (u.maxed?'최대 연구 완료':u.nextEffect), (u.maxed?'해당 연구의 모든 보너스가 적용 중입니다.':'보유 '+shards.toLocaleString('ko-KR')+' 조각'))+'</div></div><button class="commonResearchBuy" type="button" data-v164-buy="'+esc(u.key)+'" '+(canBuy?'':'disabled')+'>'+(u.maxed?'MAX':(canBuy?'업그레이드':'조각 부족'))+'</button></div><div class="armoryInlineStatGrid">'
      +statCell('현재 레벨','Lv.'+u.level)+statCell('현재 효과',u.level>0?u.effect:'아직 연구 없음')+statCell('다음 효과',u.maxed?'최대 연구 완료':u.nextEffect)+statCell('비용',costText)
      +'</div></div>'
      +'<div class="armoryStackPanel">'
      +infoRow('현재 레벨','Lv.'+u.level,null,true)
      +infoRow('현재 효과',u.level>0?u.effect:'아직 연구 없음')
      +infoRow('다음 효과',u.maxed?'최대 연구 완료':u.nextEffect)
      +infoRow('업그레이드 비용',costText)
      +'</div>'
      +'<div class="armoryWidePanel"><div class="armoryPanelTitle">Skill Info</div><div class="armoryDenseList">'+infoRow('설명',u.desc||'')+'</div></div>';
    rerenderAfterUpdate();
  };

  renderTowerDetail=function(type){
    var e=els(); var towers=getTowers(); var t=towers.find(function(x){return Number(x.type)===Number(type);})||towers.find(function(x){return x.unlocked;})||towers[0];
    if(!t){e.detail.innerHTML='<div class="towerPopupEmpty">타워 데이터를 불러오지 못했습니다.</div>';return;}
    selectedTowerType=Number(t.type);
    e.list.querySelectorAll('[data-v164-tower]').forEach(function(b){ b.classList.toggle('active', Number(b.dataset.v164Tower)===selectedTowerType); });
    if(!t.unlocked){e.detail.innerHTML='<div class="armoryLockedShell"><div class="armoryLockOverlay" style="position:relative;min-height:260px"><div class="armoryLockBox"><div class="armoryLockIcon">🔒</div><b>행성 정보 잠금</b><span>'+esc(t.unlockText||'성역 클리어 후 공개')+'</span></div></div></div>';return;}
    var skills=getSkills(t.type);
    var skillHtml=skills.length?'<div class="armorySkillList">'+skills.map(function(s,i){ return '<div class="armorySkillRow"><b>Lv.'+esc(s.unlockLevel)+'</b><span class="skillIcon" style="color:'+esc(t.color)+'">'+(['☀','✹','♨'][i%3])+'</span><div><strong>'+esc(s.name)+'</strong><span>'+esc(s.text)+' · 해금 스킬</span></div></div>'; }).join('')+'</div>':'<p>등록된 고유 스킬 정보가 없습니다.</p>';
    e.detail.className='towerPopupDetail compactCombined';
    e.detail.innerHTML=''
      +'<div class="armoryHeroPanel" style="--planet-color:'+esc(t.color)+'"><div class="armoryHeroHeader"><div class="armoryTowerThumb">'+towerImg(t)+'</div><div><div class="armoryPanelTitle">Tower Profile</div><h2 class="armoryTowerTitle">'+esc(t.name)+'</h2><div class="armoryTowerRole">'+esc(t.role)+' / '+esc(kindText(t.kind))+'</div>'+pillTags(t.tags)+'</div></div></div>'
      +'<div class="armoryComboPanel"><div class="armoryPanelTitle">Combat Summary</div><div class="armoryDenseList">'+infoRow('활성','활성화됨',null,true)+infoRow('조건',t.unlockText||'기본 지급')+'</div><div class="armoryInlineStatGrid">'
      +statCell('타입',kindText(t.kind))+statCell('공격',fmt(t.dmg))+statCell('사거리',fmt(t.range))+statCell('주기/비용',fmt(t.cd)+' / '+fmt(t.cost))+statCell('역할',t.role)+statCell('운용',t.identity)
      +'</div></div>'
      +'<div class="armoryStackPanel"><div class="armoryPanelTitle">Role & Usage</div><div class="armoryDenseList">'+infoRow('핵심 역할',t.role)+infoRow('운용 포인트',t.identity)+'</div></div>'
      +'<div class="armorySkillsPanel"><div class="armoryPanelTitle">Unique Skills</div>'+skillHtml+'</div>';
    rerenderAfterUpdate();
  };

  renderPlateDetail=function(key){
    var e=els(); var p=plates[key]||plates.amp; selectedPlateKey=p.key;
    e.list.querySelectorAll('[data-v164-plate]').forEach(function(b){ b.classList.toggle('active', b.dataset.v164Plate===selectedPlateKey); });
    e.detail.className='towerPopupDetail compactCombined';
    e.detail.innerHTML=''
      +'<div class="armoryHeroPanel"><div class="armoryHeroHeader">'+plateTile(p)+'<div><div class="armoryPanelTitle">Plate Profile</div><h2 class="armoryCommonTitle">'+esc(p.name)+'</h2><div class="armoryCommonSubtitle">'+esc(p.subtitle)+'</div>'+pillTags(p.tags)+'</div></div></div>'
      +'<div class="armoryComboPanel"><div class="armoryPanelTitle">Effect Summary</div><div class="armoryInlineStatGrid">'+statCell('핵심 효과',p.effect)+statCell('추천 배치',p.best)+statCell('공명 보너스','같은 색상/계열 배치 시 피해 +30% · 공속 +8%')+statCell('주의 사항',p.caution)+'</div></div>'
      +'<div class="armoryWidePanel"><div class="armoryPanelTitle">Plate Description</div><div class="armoryDenseList">'+infoRow('설명',p.summary)+infoRow('추천 운용',p.tips)+'</div></div>'
      +'<div class="armoryStackPanel"><div class="armoryComboPanel"><div class="armoryPanelTitle">Color Matching</div><div class="armoryDenseList">'+infoRow('색상 매칭','장판 색상은 타워 색상과 맞춰서 보면 됩니다.','금색 계열 장판은 금색 계열 타워와, 보라색 계열 장판은 보라색 계열 타워와 맞춰 배치하면 쉽습니다.')+'</div></div><div class="armoryComboPanel"><div class="armoryPanelTitle">Resonance Rule</div><div class="armoryDenseList">'+infoRow('공명 규칙','같은 계열 행성을 장판 위에 배치하면 추가 공명 보너스 적용','장판 중앙 약어와 보조 이름은 현재 공명 계열을 의미합니다.')+'</div></div></div>';
    rerenderAfterUpdate();
  };
})();

/* ===== v266-armory-landscape-resolution-adaptive-fix-script ===== */
(function(){
  function resetActiveDetailScroll(){
    var popup=document.getElementById('towerPopup');
    if(!popup) return;
    var detail=popup.querySelector('.towerPopupDetail');
    if(detail) detail.scrollLeft=0;
  }
  var resizeTimer=null;
  function onResize(){
    if(resizeTimer) clearTimeout(resizeTimer);
    resizeTimer=setTimeout(resetActiveDetailScroll, 90);
  }
  window.addEventListener('resize', onResize, {passive:true});
  window.addEventListener('orientationchange', onResize, {passive:true});
})();

/* ===== v267-landscape-hard-grid-reset-script ===== */
(function(){
  'use strict';
  function applyLandscapeClass(){
    var popup=document.getElementById('towerPopup');
    if(!popup) return;
    var isLandscape=window.innerWidth>window.innerHeight;
    popup.classList.toggle('armory-layout-landscape', isLandscape);
    if(isLandscape){
      var detail=document.getElementById('towerPopupDetail');
      if(detail) detail.scrollLeft=0;
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyLandscapeClass,{once:true}); else applyLandscapeClass();
  window.addEventListener('resize',function(){requestAnimationFrame(applyLandscapeClass);},{passive:true});
  window.addEventListener('orientationchange',function(){setTimeout(applyLandscapeClass,80);},{passive:true});
  document.addEventListener('click',function(e){
    if(e.target && e.target.closest('#towerPopup [data-tower-popup-tab], #towerPopupList button')){
      requestAnimationFrame(function(){var d=document.getElementById('towerPopupDetail'); if(d) d.scrollLeft=0;});
    }
  },true);
})();

/* ===== v268-armory-landscape-resolution-final-lock-script ===== */
(function(){
  'use strict';
  function syncLandscape(){
    var popup=document.getElementById('towerPopup');
    if(!popup) return;
    var landscape=window.innerWidth>window.innerHeight;
    popup.classList.toggle('armory-layout-landscape', landscape);
    if(landscape){
      var detail=document.getElementById('towerPopupDetail');
      if(detail) detail.scrollLeft=0;
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', syncLandscape, {once:true});
  else syncLandscape();
  window.addEventListener('resize', function(){setTimeout(syncLandscape, 60);}, {passive:true});
  window.addEventListener('orientationchange', function(){setTimeout(syncLandscape, 90);}, {passive:true});
  document.addEventListener('click', function(e){
    if(e.target && e.target.closest('#towerPopup [data-tower-popup-tab], #towerPopupList button')){
      setTimeout(syncLandscape, 30);
    }
  }, true);
})();

/* ===== v274-landscape-map-hud-recovery-script ===== */
(function(){
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function safe(fn){ try{ return fn && fn(); }catch(err){ console.warn('[v274 map hud]', err); } }
  function isLandscape(){ return window.matchMedia ? window.matchMedia('(orientation: landscape)').matches : (window.innerWidth >= window.innerHeight); }
  function visible(el){ return !!(el && getComputedStyle(el).display !== 'none'); }
  var lastDockActionAt = 0;
  function makeBtn(id, text, cls){
    var b=document.createElement('button');
    b.type='button'; b.id=id; b.className=cls; b.textContent=text;
    return b;
  }
  function showGalaxy(){
    if(window.PRD_NAV && typeof window.PRD_NAV.showGalaxy === 'function') return window.PRD_NAV.showGalaxy();
    var menu=byId('menu'), galaxy=byId('galaxyMap'), stage=byId('stageMap'), game=byId('game');
    if(menu) menu.style.display='none';
    if(stage) stage.style.display='none';
    if(game) game.style.display='none';
    if(galaxy){ galaxy.style.display='block'; galaxy.classList.add('cleanVisible'); }
    safe(function(){ if(typeof window.refreshScreenStarfields === 'function') window.refreshScreenStarfields(); });
  }
  function showStage(){
    if(window.PRD_NAV && typeof window.PRD_NAV.showStage === 'function'){
      window.PRD_NAV.showStage();
    }else{
      var menu=byId('menu'), galaxy=byId('galaxyMap'), stage=byId('stageMap'), game=byId('game');
      if(menu) menu.style.display='none';
      if(galaxy) galaxy.style.display='none';
      if(game) game.style.display='none';
      if(stage) stage.style.display='block';
      safe(function(){ if(typeof window.renderStageMap === 'function') window.renderStageMap(); });
      safe(function(){ if(typeof window.refreshScreenStarfields === 'function') window.refreshScreenStarfields(); });
    }
    setTimeout(ensureDocks, 0);
    setTimeout(ensureDocks, 120);
  }
  function enterStage(){
    if(window.PRD_NAV && typeof window.PRD_NAV.enterStageOnly === 'function'){
      window.PRD_NAV.enterStageOnly();
      return;
    }
    if(typeof window.startSelectedStageFromMap === 'function'){
      window.startSelectedStageFromMap();
      return;
    }
    var stage=byId('stageMap'), game=byId('game');
    if(stage) stage.style.display='none';
    if(game) game.style.display='flex';
  }
  var v85StageEnterLock = false;
  function enterStageStable(){
    if(v85StageEnterLock) return;
    v85StageEnterLock = true;
    window.PRD_STAGE_ENTERING = true;
    if(document.body) document.body.classList.add('prd-stage-entering');
    var dock=byId('v274StageActionDock');
    if(dock) dock.style.pointerEvents='none';
    // Run after the click/pointer event stack finishes so legacy pointer/timer
    // handlers cannot win the same frame.
    setTimeout(function(){
      try{ enterStage(); }
      finally{
        setTimeout(function(){
          if(dock) dock.style.pointerEvents='';
          v85StageEnterLock = false;
          if(!byId('game') || getComputedStyle(byId('game')).display === 'none'){
            window.PRD_STAGE_ENTERING = false;
            if(document.body) document.body.classList.remove('prd-stage-entering');
          }
        }, 650);
      }
    }, 30);
  }
  function ensureOverlay(){
    var overlay=byId('v274MapInfoOverlay');
    if(overlay) return overlay;
    overlay=document.createElement('div');
    overlay.id='v274MapInfoOverlay';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=''
      +'<div class="v274MapInfoPanel" role="dialog" aria-modal="true" aria-labelledby="v274MapInfoTitleText">'
      +  '<div class="v274MapInfoHead">'
      +    '<div class="v274MapInfoTitle"><small id="v274MapInfoKicker">MAP INFO</small><b id="v274MapInfoTitleText">DETAIL</b></div>'
      +    '<button class="v274CloseBtn" type="button" data-v274-close aria-label="닫기">×</button>'
      +  '</div>'
      +  '<div id="v274MapInfoBody"></div>'
      +  '<div class="v274MapInfoActions">'
      +    '<button class="v274SecondaryBtn" type="button" data-v274-close>닫기</button>'
      +    '<button id="v274MapInfoEnterBtn" class="v274PrimaryBtn" type="button">ENTER</button>'
      +  '</div>'
      +'</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){
      if(e.target===overlay || e.target.closest('[data-v274-close]')) closeInfo();
    });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeInfo(); });
    byId('v274MapInfoEnterBtn').addEventListener('click', function(){
      var kind=overlay.dataset.kind;
      closeInfo();
      setTimeout(function(){ kind==='galaxy' ? showStage() : enterStage(); }, 0);
    });
    return overlay;
  }
  function closeInfo(){
    var overlay=byId('v274MapInfoOverlay');
    if(!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
  }
  function titleFor(kind){
    if(kind==='galaxy'){
      var t=document.querySelector('#galaxyMap .galaxyTopTitle');
      var s=document.querySelector('#galaxyMap #galaxyProgressLabel');
      return {kicker:t ? t.textContent.trim() : 'GALAXY MAP', title:s ? s.textContent.trim().replace(/\s+/g,' ') : 'MILKY RIFT'};
    }
    var title=document.querySelector('#stageMap .stageTopTitle');
    var prog=byId('stageProgressLabel');
    return {kicker:title ? title.textContent.trim() : 'CONSTELLATION MAP', title:prog ? prog.textContent.trim() : 'SANCTUARY'};
  }
  function openInfo(kind){
    var source = kind==='galaxy' ? byId('galaxyInfoPanel') : byId('stageInfoPanel');
    if(!source) return;
    var overlay=ensureOverlay();
    var label=titleFor(kind);
    byId('v274MapInfoKicker').textContent=label.kicker;
    byId('v274MapInfoTitleText').textContent=label.title;
    var body=byId('v274MapInfoBody');
    var clone=source.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('#stageEnterBtn,#galaxyEnterBtn,#stageGalaxyBtn,.stageActionRow,.stageEnter,.galaxyEnterBtn,.stageManageBtn').forEach(function(el){ el.remove(); });
    body.innerHTML='';
    body.appendChild(clone);
    var enterBtn=byId('v274MapInfoEnterBtn');
    var liveEnter = kind==='galaxy' ? byId('galaxyEnterBtn') : byId('stageEnterBtn');
    enterBtn.textContent = liveEnter ? (liveEnter.textContent || 'ENTER') : 'ENTER';
    overlay.dataset.kind=kind;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
  }
  function ensureDock(mapId, dockId, infoId, enterId, infoText, enterText, kind){
    var map=byId(mapId);
    if(!map) return;
    var dock=byId(dockId);
    if(!dock){
      dock=document.createElement('div');
      dock.id=dockId;
      dock.className='v274ActionDock';
      map.appendChild(dock);
    }
    var info=byId(infoId);
    if(!info){
      info=makeBtn(infoId, infoText, 'v274InfoBtn');
      dock.appendChild(info);
    }else if(info.parentElement!==dock){
      dock.appendChild(info);
    }
    var enter=byId(enterId);
    if(!enter){
      enter=makeBtn(enterId, enterText, 'v274EnterBtn');
      dock.appendChild(enter);
    }else if(enter.parentElement!==dock){
      dock.appendChild(enter);
    }
    var realEnter = kind==='galaxy' ? byId('galaxyEnterBtn') : byId('stageEnterBtn');
    if(realEnter && realEnter.textContent) enter.textContent = realEnter.textContent.trim();
    info.textContent=infoText;
    dock.style.display = isLandscape() ? 'grid' : 'none';
  }
  function ensureDocks(){
    ensureOverlay();
    ensureDock('galaxyMap','v274GalaxyActionDock','v274GalaxyInfoBtn','v274GalaxyEnterBtn','INFO','ENTER MILKY RIFT','galaxy');
    ensureDock('stageMap','v274StageActionDock','v274StageInfoBtn','v274StageEnterBtn','INFO','ENTER SANCTUARY 1','stage');
  }
  function delegatedClick(e){
    /* v81 reconnect: in landscape, the original stage info panel and enter row are intentionally
       hidden by v274 CSS, so clicking a planet must bridge into the existing v274 info overlay.
       Do not stop propagation here: the original stage-node handler must first update
       StageMapState/data-selected/renderStageMapInfo, then we open the popup from that source. */
    var stageNode = e.type === 'click' && e.target && e.target.closest ? e.target.closest('#stageMap .stageNode[data-stage]') : null;
    if(stageNode && isLandscape()){
      setTimeout(function(){ openInfo('stage'); }, 80);
      return;
    }

    var target=e.target && e.target.closest ? e.target.closest('#v274GalaxyInfoBtn,#v274StageInfoBtn,#v274GalaxyEnterBtn,#v274StageEnterBtn') : null;
    if(!target) return;
    var now = Date.now();
    if(now - lastDockActionAt < 220) return;
    lastDockActionAt = now;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    if(target.id==='v274GalaxyInfoBtn') openInfo('galaxy');
    else if(target.id==='v274StageInfoBtn') openInfo('stage');
    else if(target.id==='v274GalaxyEnterBtn') showStage();
    else if(target.id==='v274StageEnterBtn') enterStageStable();
  }
  function boot(){
    ensureDocks();
    setTimeout(ensureDocks, 80);
    setTimeout(ensureDocks, 400);
    setTimeout(ensureDocks, 1000);
  }
  document.addEventListener('click', delegatedClick, true);
  // v85: dock activation must happen on click only. Pointerup fired too early and raced combat HUD mounting.
  // document.addEventListener('pointerup', delegatedClick, true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  window.addEventListener('load', boot, {once:true});
  window.addEventListener('resize', function(){ setTimeout(ensureDocks, 80); }, {passive:true});
  window.addEventListener('orientationchange', function(){ setTimeout(ensureDocks, 140); }, {passive:true});
  window.PRD_MAP_HUD_V274 = {showGalaxy:showGalaxy, showStage:showStage, enterStage:enterStage, openInfo:openInfo, ensureDocks:ensureDocks};
})();

/* ===== v76-stage-unlock-manifest-fix ===== */
(function(){
  'use strict';
  var PROD_MANIFEST = {
    id:'planet-rift-runtime',
    version:'v76',
    mode:'production',
    enableTestHarness:false,
    enableProgressMocks:false,
    stageProgressKey:'planetRiftStageProgressV3',
    offlineMetaKey:'planetRiftOfflineMetaV2',
    maxStage:12
  };
  var TEST_MANIFEST = {
    id:'planet-rift-test-runtime',
    version:'v76',
    mode:'test',
    enableTestHarness:true,
    enableProgressMocks:true
  };
  function queryHas(name){
    try{ return new URLSearchParams(location.search).has(name); }catch(_){ return false; }
  }
  function explicitTestMode(){
    try{
      return queryHas('test') || queryHas('qa') || queryHas('debug') || localStorage.getItem('PLANET_RIFT_TEST_MODE') === '1';
    }catch(_){ return false; }
  }
  var TEST_ALLOWED = explicitTestMode();
  window.PLANET_RIFT_RUNTIME_MANIFEST = TEST_ALLOWED ? Object.assign({}, PROD_MANIFEST, TEST_MANIFEST) : Object.assign({}, PROD_MANIFEST);

  function safe(fn, fallback){ try{ return fn(); }catch(err){ console.warn('[v76 stage unlock]', err); return fallback; } }
  function maxStage(){ return safe(function(){ return Array.isArray(STAGE_MAP_DEFS) ? STAGE_MAP_DEFS.length : PROD_MANIFEST.maxStage; }, PROD_MANIFEST.maxStage); }
  function clampStage(n){
    var max=maxStage();
    n = Math.floor(Number(n || 1));
    if(!Number.isFinite(n)) n = 1;
    return Math.max(1, Math.min(max, n));
  }
  function readJson(key, fallback){
    return safe(function(){
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }, fallback);
  }
  function writeJson(key, value){ safe(function(){ localStorage.setItem(key, JSON.stringify(value)); }); }
  function ensureMeta(){
    if(!window.META && typeof META !== 'undefined') window.META = META;
    if(typeof META === 'undefined' || !META){
      if(typeof defaultOfflineMeta === 'function') META = defaultOfflineMeta();
      else META = {saveVersion:2, shards:0, totalClears:0, totalDefeats:0, bestWave:{}, clears:{}, story:{}, upgrades:{}, mastery:{}, flags:{}, settings:{}, unlockedTowers:[2,5]};
    }
    if(!META.clears || typeof META.clears !== 'object') META.clears = {};
    if(!META.flags || typeof META.flags !== 'object') META.flags = {};
    if(!Array.isArray(META.unlockedTowers)) META.unlockedTowers = [2,5];
    if(!TEST_ALLOWED){
      // Persisted test flags from an old build must not affect production progression.
      META.flags.testMode = false;
      if(typeof TEST_MODE_CONFIG !== 'undefined' && TEST_MODE_CONFIG) TEST_MODE_CONFIG.enabled = false;
      if(document.body) document.body.classList.remove('test-mode-active');
    }
    return META;
  }
  function testModeActive(){
    if(!TEST_ALLOWED) return false;
    return safe(function(){ return !!(TEST_MODE_CONFIG && TEST_MODE_CONFIG.enabled) || !!(META && META.flags && META.flags.testMode); }, false);
  }
  function normalizeClearRecords(){
    var meta=ensureMeta();
    var out={};
    Object.keys(meta.clears || {}).forEach(function(k){
      var st=clampStage(k), count=Math.max(0, Math.floor(Number(meta.clears[k] || 0)));
      if(count>0) out[String(st)] = Math.max(Number(out[String(st)] || 0), count);
    });
    meta.clears = out;
    return out;
  }
  function unlockTowersFromClears(){
    var meta=ensureMeta();
    var set;
    try{ set = new Set(normalizeUnlockedTowers(meta.unlockedTowers, meta.clears)); }
    catch(_){ set = new Set(Array.isArray(meta.unlockedTowers) ? meta.unlockedTowers.map(Number) : [2,5]); }
    Object.keys(meta.clears || {}).forEach(function(k){
      if(Number(meta.clears[k] || 0) <= 0) return;
      var reward = typeof stageTowerReward === 'function' ? stageTowerReward(Number(k)) : null;
      if(reward && Number.isFinite(Number(reward.type))) set.add(Number(reward.type));
    });
    meta.unlockedTowers = Array.from(set).filter(function(v){return Number.isInteger(Number(v));}).map(Number).sort(function(a,b){return a-b;});
  }
  function deriveUnlockedFromClears(){
    if(testModeActive()) return maxStage();
    var clears=normalizeClearRecords();
    var unlocked=1;
    Object.keys(clears).forEach(function(k){
      if(Number(clears[k] || 0) > 0) unlocked = Math.max(unlocked, Math.min(maxStage(), Number(k) + 1));
    });
    var saved=readJson(PROD_MANIFEST.stageProgressKey, null);
    if(saved && Number(saved.unlocked)) unlocked=Math.max(unlocked, clampStage(saved.unlocked));
    return clampStage(unlocked);
  }
  function persistProgress(opts){
    opts = opts || {};
    var meta=ensureMeta();
    unlockTowersFromClears();
    var unlocked=deriveUnlockedFromClears();
    if(typeof StageMapState !== 'undefined' && StageMapState){
      StageMapState.unlocked = unlocked;
      if(opts.selectStage) StageMapState.selected = clampStage(opts.selectStage);
      else StageMapState.selected = clampStage(StageMapState.selected || unlocked);
      if(StageMapState.selected > unlocked && !opts.allowLockedPreview) StageMapState.selected = unlocked;
      StageMapState.current = clampStage(opts.currentStage || StageMapState.current || StageMapState.selected || unlocked);
      writeJson(PROD_MANIFEST.stageProgressKey, {saveVersion:2, unlocked:StageMapState.unlocked, selected:StageMapState.selected, current:StageMapState.current});
    }
    safe(function(){ localStorage.setItem(PROD_MANIFEST.offlineMetaKey, JSON.stringify(meta)); });
    return unlocked;
  }
  function applyStageDomState(){
    safe(function(){
      var unlocked = testModeActive() ? maxStage() : deriveUnlockedFromClears();
      if(typeof StageMapState !== 'undefined' && StageMapState) StageMapState.unlocked = unlocked;
      var selected = typeof StageMapState !== 'undefined' && StageMapState ? clampStage(StageMapState.selected || unlocked) : unlocked;
      var map=document.getElementById('stageMap');
      if(map){ map.dataset.unlocked=String(unlocked); map.dataset.selected=String(selected); }
      document.querySelectorAll('#stageMap .stageNode').forEach(function(node){
        var stage=clampStage(node.dataset.stage || 1);
        var open=stage<=unlocked;
        node.classList.toggle('locked', !open);
        node.classList.toggle('unlocked', open);
        node.setAttribute('aria-disabled', open ? 'false' : 'true');
        var lock=node.querySelector('.nodeLock');
        if(lock) lock.style.display=open?'none':'block';
      });
      var label=document.getElementById('stageProgressLabel');
      if(label){
        var arc = typeof getConstellationArcByStage === 'function' ? getConstellationArcByStage(selected) : {name:'ORION CONSTELLATION'};
        label.textContent = (testModeActive() ? 'TEST MODE · ' : '') + arc.name + ' · OPEN ' + unlocked + ' / ' + maxStage();
      }
    });
  }
  function ensureStageClear(stageNo, options){
    options = options || {};
    if(testModeActive()) return maxStage();
    var meta=ensureMeta();
    var st=clampStage(stageNo);
    var before=Number(meta.clears[String(st)] || 0);
    if(options.recordClear !== false && before <= 0){
      meta.clears[String(st)] = 1;
      meta.totalClears = Math.max(Number(meta.totalClears || 0), 0) + 1;
      if(!meta.story || typeof meta.story !== 'object') meta.story = {};
      meta.story[st + '_clear'] = true;
    }else if(options.recordClear !== false){
      meta.clears[String(st)] = before;
    }
    var next=Math.min(maxStage(), st+1);
    if(typeof StageMapState !== 'undefined' && StageMapState){
      StageMapState.unlocked=Math.max(clampStage(StageMapState.unlocked || 1), next);
      if(Number(StageMapState.selected || 1) <= st) StageMapState.selected=next;
      StageMapState.current=StageMapState.selected;
    }
    persistProgress({selectStage:(typeof StageMapState!=='undefined'&&StageMapState)?StageMapState.selected:next, currentStage:(typeof StageMapState!=='undefined'&&StageMapState)?StageMapState.current:next, allowLockedPreview:true});
    applyStageDomState();
    safe(function(){ if(typeof renderOfflineMetaPanel === 'function') renderOfflineMetaPanel(); });
    safe(function(){ if(typeof renderHangar === 'function') renderHangar(); });
    return next;
  }

  var _record = typeof recordOfflineRunEnd === 'function' ? recordOfflineRunEnd : null;
  if(_record && !_record.__v76StageUnlockWrapped){
    var wrappedRecord=function(cleared, stageNoOverride){
      var st=clampStage(stageNoOverride || (typeof S !== 'undefined' && S ? S.stageNo : null) || (typeof StageMapState !== 'undefined' && StageMapState ? StageMapState.current : 1));
      var before=safe(function(){ return Number((ensureMeta().clears || {})[String(st)] || 0); }, 0);
      var ret=_record.apply(this, arguments);
      if(cleared){
        var after=safe(function(){ return Number((ensureMeta().clears || {})[String(st)] || 0); }, 0);
        // If an older wrapper returned early because S.runEnded was already true, still record the clear once.
        ensureStageClear(st, {recordClear: after <= before});
      }else{
        persistProgress({allowLockedPreview:true});
      }
      return ret;
    };
    wrappedRecord.__v76StageUnlockWrapped=true;
    recordOfflineRunEnd=wrappedRecord;
    try{ window.recordOfflineRunEnd=wrappedRecord; }catch(_){ }
  }

  var _complete = typeof completeStageFromBattle === 'function' ? completeStageFromBattle : null;
  if(_complete && !_complete.__v76StageUnlockWrapped){
    var wrappedComplete=function(){
      var st=clampStage((typeof S !== 'undefined' && S ? S.stageNo : null) || (typeof StageMapState !== 'undefined' && StageMapState ? StageMapState.current : 1));
      var ret=_complete.apply(this, arguments);
      setTimeout(function(){ ensureStageClear(st, {recordClear:false}); safe(function(){ if(typeof renderStageMap === 'function' && document.getElementById('stageMap')?.style.display !== 'none') renderStageMap(); }); }, 0);
      setTimeout(function(){ ensureStageClear(st, {recordClear:false}); applyStageDomState(); }, 160);
      setTimeout(function(){ ensureStageClear(st, {recordClear:false}); applyStageDomState(); }, 500);
      return ret;
    };
    wrappedComplete.__v76StageUnlockWrapped=true;
    completeStageFromBattle=wrappedComplete;
    try{ window.completeStageFromBattle=wrappedComplete; }catch(_){ }
  }

  var _loadProgress = typeof loadStageMapProgress === 'function' ? loadStageMapProgress : null;
  if(_loadProgress && !_loadProgress.__v76StageUnlockWrapped){
    var wrappedLoad=function(){
      var ret=_loadProgress.apply(this, arguments);
      persistProgress({keepSelected:true, allowLockedPreview:true});
      applyStageDomState();
      return ret;
    };
    wrappedLoad.__v76StageUnlockWrapped=true;
    loadStageMapProgress=wrappedLoad;
    try{ window.loadStageMapProgress=wrappedLoad; }catch(_){ }
  }

  var _renderMap = typeof renderStageMap === 'function' ? renderStageMap : null;
  if(_renderMap && !_renderMap.__v76StageUnlockWrapped){
    var wrappedRender=function(){
      persistProgress({keepSelected:true, allowLockedPreview:true});
      var ret=_renderMap.apply(this, arguments);
      applyStageDomState();
      return ret;
    };
    wrappedRender.__v76StageUnlockWrapped=true;
    renderStageMap=wrappedRender;
    try{ window.renderStageMap=wrappedRender; }catch(_){ }
  }

  document.addEventListener('click', function(e){
    var node=e.target && e.target.closest && e.target.closest('#stageMap .stageNode[data-stage]');
    if(!node) return;
    var st=clampStage(node.dataset.stage || 1);
    var unlocked=deriveUnlockedFromClears();
    if(st>unlocked && !testModeActive()){
      e.preventDefault();
      e.stopImmediatePropagation && e.stopImmediatePropagation();
      safe(function(){ if(typeof toast === 'function') toast(st+'성역은 아직 미개방입니다. 이전 성역을 먼저 클리어하세요.'); });
      applyStageDomState();
    }
  }, true);

  function boot(){
    ensureMeta();
    persistProgress({keepSelected:true, allowLockedPreview:true});
    applyStageDomState();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  window.addEventListener('load', function(){ setTimeout(boot, 0); setTimeout(boot, 180); }, {once:true});
  window.PRD_STAGE_UNLOCK_V76 = {manifest:window.PLANET_RIFT_RUNTIME_MANIFEST, ensureStageClear:ensureStageClear, persistProgress:persistProgress, applyStageDomState:applyStageDomState};
})();

/* ===== v77-map-battle-hud-separation-js ===== */
(function(){
  'use strict';
  function el(id){ return document.getElementById(id); }
  function visible(node){
    if(!node) return false;
    var cs = window.getComputedStyle ? getComputedStyle(node) : null;
    if(cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
    var rect = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
    return !!(rect && rect.width > 3 && rect.height > 3);
  }
  function mapActive(){
    return visible(el('menu')) || visible(el('galaxyMap')) || visible(el('stageMap')) || visible(el('stageClearOverlay')) || visible(el('gameOverOverlay'));
  }
  var combatIds=['combatHudOverlay','combatHudTopLine','combatHudCommands','combatHudCommandsLandscapeDock','combatHudCommandsPortraitDock'];
  var combatSelectors=['#battleHud','#side > .battleActions','#field > .fieldTopControls','#combatHudTopLine .fieldTopControls','#combatHudOverlay .fieldTopControls'];
  function forceHideCombatOnly(hide){
    var nodes=[];
    combatIds.forEach(function(id){ var n=el(id); if(n) nodes.push(n); });
    document.querySelectorAll(combatSelectors.join(',')).forEach(function(n){ nodes.push(n); });
    nodes.forEach(function(n){
      if(!n) return;
      if(hide){
        n.dataset.v77Hidden='1';
        n.style.setProperty('display','none','important');
        n.style.setProperty('visibility','hidden','important');
        n.style.setProperty('opacity','0','important');
        n.style.setProperty('pointer-events','none','important');
      }else if(n.dataset.v77Hidden === '1'){
        n.style.removeProperty('display');
        n.style.removeProperty('visibility');
        n.style.removeProperty('opacity');
        n.style.removeProperty('pointer-events');
        delete n.dataset.v77Hidden;
      }
    });
  }
  function sync(){
    // v85: during stage entry, let the battle screen finish mounting before
    // legacy map-HUD timers re-evaluate visibility. Without this guard, the
    // combat command dock can flash in the lower-right and then be hidden again.
    if(window.PRD_STAGE_ENTERING || (document.body && document.body.classList.contains('prd-stage-entering'))){
      document.body.classList.toggle('prd-map-ui-active', false);
      document.body.classList.toggle('prd-combat-ui-active', true);
      document.body.classList.toggle('prd-battle-active', true);
      document.body.classList.toggle('prd-combat-screen-active', true);
      try{
        if(window.PRD_STAGE_PROGRESS_BRIDGE && typeof window.PRD_STAGE_PROGRESS_BRIDGE.setBattleChromeVisible === 'function')
          window.PRD_STAGE_PROGRESS_BRIDGE.setBattleChromeVisible(true);
      }catch(err){ console.warn('[v85 stage entering sync]', err); }
      forceHideCombatOnly(false);
      return;
    }
    var map = mapActive();
    var game = visible(el('game')) && !map;
    document.body.classList.toggle('prd-map-ui-active', map || !game);
    document.body.classList.toggle('prd-combat-ui-active', game);
    document.body.classList.toggle('prd-battle-active', game);
    document.body.classList.toggle('prd-combat-screen-active', game);
    try{
      if(window.PRD_STAGE_PROGRESS_BRIDGE && typeof window.PRD_STAGE_PROGRESS_BRIDGE.sync === 'function' && visible(el('stageMap'))){
        window.PRD_STAGE_PROGRESS_BRIDGE.sync({keepSelected:true, allowLockedPreview:true, save:false});
      }
      if(window.PRD_STAGE_PROGRESS_BRIDGE && typeof window.PRD_STAGE_PROGRESS_BRIDGE.setBattleChromeVisible === 'function'){
        window.PRD_STAGE_PROGRESS_BRIDGE.setBattleChromeVisible(game);
      }
    }catch(err){ console.warn('[v77 hud sync]', err); }
    forceHideCombatOnly(!game);
  }
  ['click','pointerdown','touchstart','keyup','resize','orientationchange'].forEach(function(ev){
    window.addEventListener(ev, function(){ setTimeout(sync,0); setTimeout(sync,120); }, true);
    document.addEventListener(ev, function(){ setTimeout(sync,0); setTimeout(sync,120); }, true);
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, {once:true}); else sync();
  window.addEventListener('load', function(){ sync(); setTimeout(sync,180); setTimeout(sync,700); }, {once:true});
  setInterval(sync, 500);
  window.PRD_SYNC_MAP_BATTLE_HUD_V77 = sync;
})();

/* ===== v78-stage-unlock-and-enter-label-final-fix ===== */
(function(){
  'use strict';
  var META_KEY='planetRiftOfflineMetaV2';
  var PROGRESS_KEY='planetRiftStageProgressV3';
  var lastRepair=0;
  function safe(fn, fallback){ try{return fn();}catch(err){ console.warn('[v78 stage unlock]', err); return fallback; } }
  function maxStage(){ return safe(function(){ return Array.isArray(STAGE_MAP_DEFS) ? STAGE_MAP_DEFS.length : 12; }, 12) || 12; }
  function clampStage(v){ var n=Math.floor(Number(v)||1); return Math.max(1, Math.min(maxStage(), n)); }
  function byId(id){ return document.getElementById(id); }
  function readJson(key, fallback){ return safe(function(){ var raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }, fallback); }
  function writeJson(key, value){ safe(function(){ localStorage.setItem(key, JSON.stringify(value)); }); }
  function getMeta(){
    if(typeof META !== 'undefined' && META){
      if(!META.clears || typeof META.clears !== 'object') META.clears={};
      if(!META.story || typeof META.story !== 'object') META.story={};
      if(!Array.isArray(META.unlockedTowers)) META.unlockedTowers=[2,5];
      return META;
    }
    var stored=readJson(META_KEY, null) || {saveVersion:2,shards:0,totalClears:0,totalDefeats:0,bestWave:{},clears:{},story:{},upgrades:{},mastery:{},flags:{},settings:{},unlockedTowers:[2,5]};
    if(!stored.clears || typeof stored.clears !== 'object') stored.clears={};
    return stored;
  }
  function saveMeta(meta){
    safe(function(){ if(typeof saveOfflineMeta === 'function' && typeof META !== 'undefined' && META === meta) saveOfflineMeta(); else writeJson(META_KEY, meta); });
    writeJson(META_KEY, meta);
  }
  function testMode(){ return safe(function(){ return !!(TEST_MODE_CONFIG && TEST_MODE_CONFIG.enabled); }, false); }
  function deriveUnlocked(meta){
    if(testMode()) return maxStage();
    meta=meta || getMeta();
    var unlocked=1;
    Object.keys(meta.clears || {}).forEach(function(k){
      var st=clampStage(k);
      if(Number(meta.clears[k] || 0) > 0) unlocked=Math.max(unlocked, Math.min(maxStage(), st+1));
    });
    var saved=readJson(PROGRESS_KEY, null);
    if(saved && Number(saved.unlocked)) unlocked=Math.max(unlocked, clampStage(saved.unlocked));
    return clampStage(unlocked);
  }
  function ensureTowerRewards(meta){
    meta=meta || getMeta();
    var set=new Set(Array.isArray(meta.unlockedTowers) ? meta.unlockedTowers.map(Number) : [2,5]);
    safe(function(){
      Object.keys(meta.clears || {}).forEach(function(k){
        if(Number(meta.clears[k] || 0) <= 0) return;
        var reward = typeof stageTowerReward === 'function' ? stageTowerReward(Number(k)) : null;
        if(reward && Number.isFinite(Number(reward.type))) set.add(Number(reward.type));
      });
    });
    meta.unlockedTowers=Array.from(set).filter(function(v){ return Number.isInteger(Number(v)); }).sort(function(a,b){return a-b;});
  }
  function selectedStage(){
    var st=safe(function(){ return StageMapState && StageMapState.selected; }, null);
    if(!st){
      var map=byId('stageMap');
      st=map && map.dataset ? map.dataset.selected : null;
    }
    if(!st){
      var active=document.querySelector('#stageMap .stageNode.active');
      st=active && active.dataset ? active.dataset.stage : 1;
    }
    return clampStage(st || 1);
  }
  function setStageStateFromProgress(selectStage, currentStage, allowLocked){
    var meta=getMeta();
    ensureTowerRewards(meta);
    var unlocked=deriveUnlocked(meta);
    var selected=clampStage(selectStage || selectedStage() || unlocked);
    if(!allowLocked && selected>unlocked) selected=unlocked;
    var current=clampStage(currentStage || selected);
    safe(function(){
      if(typeof StageMapState !== 'undefined' && StageMapState){
        StageMapState.unlocked=unlocked;
        StageMapState.selected=selected;
        StageMapState.current=current;
      }
    });
    writeJson(PROGRESS_KEY,{saveVersion:2,unlocked:unlocked,selected:selected,current:current});
    saveMeta(meta);
    return {unlocked:unlocked, selected:selected, current:current};
  }
  function repairAfterClear(stageNo, opts){
    opts=opts || {};
    var st=clampStage(stageNo || safe(function(){ return S && S.stageNo; }, 1));
    if(testMode()){
      return setStageStateFromProgress(opts.selectStage || st, opts.currentStage || st, true);
    }
    var meta=getMeta();
    var key=String(st);
    var before=Number(meta.clears[key] || 0);
    if(opts.recordClear !== false && before <= 0){
      meta.clears[key]=1;
      meta.totalClears=Math.max(Number(meta.totalClears || 0), 0)+1;
      meta.story[key + '_clear']=true;
    }
    ensureTowerRewards(meta);
    saveMeta(meta);
    var next=Math.min(maxStage(), st+1);
    return setStageStateFromProgress(opts.selectStage || next, opts.currentStage || next, true);
  }
  function applyDomUnlock(){
    var state=setStageStateFromProgress(selectedStage(), selectedStage(), true);
    var map=byId('stageMap');
    if(map){ map.dataset.unlocked=String(state.unlocked); map.dataset.selected=String(state.selected); }
    document.querySelectorAll('#stageMap .stageNode').forEach(function(node){
      var st=clampStage(node.dataset && node.dataset.stage || 1);
      var open=st<=state.unlocked;
      var active=st===state.selected;
      node.classList.toggle('locked', !open);
      node.classList.toggle('unlocked', open);
      node.classList.toggle('active', active);
      node.setAttribute('aria-disabled', open ? 'false' : 'true');
      var lock=node.querySelector('.nodeLock');
      if(lock) lock.style.display=open?'none':'block';
    });
    return state;
  }
  function stageName(st){
    var def=safe(function(){ return typeof getStageDef === 'function' ? getStageDef(st) : null; }, null);
    return def && def.name ? def.name : ('SANCTUARY ' + st);
  }
  function updateVisibleEnterLabel(){
    var state=applyDomUnlock();
    var st=state.selected;
    var open=testMode() || st<=state.unlocked;
    var label=open ? ('ENTER SANCTUARY ' + st) : ('LOCKED · SANCTUARY ' + st);
    var original=byId('stageEnterBtn');
    if(original){
      original.textContent=label;
      original.disabled=!open;
      original.classList.toggle('locked', !open);
    }
    var dock=byId('v274StageEnterBtn');
    if(dock){
      dock.textContent=label;
      dock.disabled=!open;
      dock.classList.toggle('locked', !open);
      dock.setAttribute('aria-disabled', open ? 'false' : 'true');
    }
    var popupEnter=byId('v274MapInfoEnterBtn');
    var overlay=byId('v274MapInfoOverlay');
    if(popupEnter && overlay && overlay.dataset.kind==='stage') popupEnter.textContent=label;
    var hint=byId('stageProgressSub');
    if(hint){
      var name=stageName(st);
      hint.textContent=(open?'선택됨':'미개방 미리보기') + ' · ' + st + '. ' + name;
    }
    return state;
  }
  function scheduleLabelSync(){
    setTimeout(updateVisibleEnterLabel, 0);
    setTimeout(updateVisibleEnterLabel, 80);
    setTimeout(updateVisibleEnterLabel, 240);
  }

  var oldRecord = typeof recordOfflineRunEnd === 'function' ? recordOfflineRunEnd : null;
  if(oldRecord && !oldRecord.__v78FinalUnlock){
    var wrappedRecord=function(cleared, stageNoOverride){
      var st=clampStage(stageNoOverride || safe(function(){ return S && S.stageNo; }, null) || safe(function(){ return StageMapState && StageMapState.current; }, 1));
      var ret=oldRecord.apply(this, arguments);
      if(cleared){
        repairAfterClear(st, {recordClear:true, selectStage:Math.min(maxStage(), st+1), currentStage:Math.min(maxStage(), st+1)});
        scheduleLabelSync();
      }
      return ret;
    };
    wrappedRecord.__v78FinalUnlock=true;
    recordOfflineRunEnd=wrappedRecord;
    try{ window.recordOfflineRunEnd=wrappedRecord; }catch(_){ }
  }

  var oldComplete = typeof completeStageFromBattle === 'function' ? completeStageFromBattle : null;
  if(oldComplete && !oldComplete.__v78FinalUnlock){
    var wrappedComplete=function(){
      var st=clampStage(safe(function(){ return S && S.stageNo; }, null) || safe(function(){ return StageMapState && StageMapState.current; }, 1));
      var ret=oldComplete.apply(this, arguments);
      repairAfterClear(st, {recordClear:true, selectStage:Math.min(maxStage(), st+1), currentStage:Math.min(maxStage(), st+1)});
      scheduleLabelSync();
      setTimeout(function(){ repairAfterClear(st,{recordClear:true,selectStage:Math.min(maxStage(),st+1),currentStage:Math.min(maxStage(),st+1)}); if(typeof renderStageMap === 'function' && byId('stageMap') && byId('stageMap').style.display!=='none') renderStageMap(); scheduleLabelSync(); }, 120);
      setTimeout(function(){ repairAfterClear(st,{recordClear:true,selectStage:Math.min(maxStage(),st+1),currentStage:Math.min(maxStage(),st+1)}); scheduleLabelSync(); }, 520);
      return ret;
    };
    wrappedComplete.__v78FinalUnlock=true;
    completeStageFromBattle=wrappedComplete;
    try{ window.completeStageFromBattle=wrappedComplete; }catch(_){ }
  }

  var oldRender = typeof renderStageMap === 'function' ? renderStageMap : null;
  if(oldRender && !oldRender.__v78LabelSync){
    var wrappedRender=function(){
      var ret=oldRender.apply(this, arguments);
      scheduleLabelSync();
      return ret;
    };
    wrappedRender.__v78LabelSync=true;
    renderStageMap=wrappedRender;
    try{ window.renderStageMap=wrappedRender; }catch(_){ }
  }

  document.addEventListener('click', function(e){
    if(e.target && e.target.closest && e.target.closest('#stageMap .stageNode')) scheduleLabelSync();
    if(e.target && e.target.closest && e.target.closest('#v274StageEnterBtn')){
      updateVisibleEnterLabel();
    }
  }, true);
  document.addEventListener('pointerup', function(e){
    if(e.target && e.target.closest && e.target.closest('#stageMap .stageNode')) scheduleLabelSync();
  }, true);
  var observer=safe(function(){ return new MutationObserver(function(){
    var now=Date.now();
    if(now-lastRepair<80) return;
    lastRepair=now;
    scheduleLabelSync();
  }); }, null);
  if(observer){
    var target=byId('stageMap') || document.body;
    observer.observe(target,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-selected','data-unlocked','style']});
  }
  window.PRD_STAGE_UNLOCK_V78={repairAfterClear:repairAfterClear, updateVisibleEnterLabel:updateVisibleEnterLabel, applyDomUnlock:applyDomUnlock};
  scheduleLabelSync();
  window.addEventListener('load', scheduleLabelSync, {once:true});
  window.addEventListener('resize', scheduleLabelSync, {passive:true});
  window.addEventListener('orientationchange', scheduleLabelSync, {passive:true});
})();

/* ===== v96-expo-viewport-and-real-command-buttons =====
   Full audit result: command touch broke because the real buttons were moved into
   #combatHudCommands and then hidden offscreen by v37; visible proxy buttons were
   separate DOM nodes, so Expo WebView hit-testing could route taps to canvas while
   document-capture guards swallowed the original command buttons.  v96 disables
   the proxy/hitbox route, shows the real buttons, and handles touches at window
   capture before v37 can redirect them. */
(function(){
  'use strict';
  if(window.PRD_V96_EXPO_REAL_COMMANDS) return;
  window.PRD_V96_EXPO_REAL_COMMANDS = true;

  var COMMANDS = [
    {action:'summon', id:'summonBtn', label:'소환'},
    {action:'merge',  id:'mergeBtn',  label:'합치기'},
    {action:'speed',  id:'speedBtn',  label:'배속'},
    {action:'pause',  id:'pauseBtn',  label:'정지'}
  ];
  var lastAction = '';
  var lastAt = 0;
  var raf = 0;

  function byId(id){ return document.getElementById(id); }
  function safe(fn, fallback){ try{ return fn(); }catch(err){ console.warn('[v96]', err); return fallback; } }
  function getStyle(el){ return el && window.getComputedStyle ? getComputedStyle(el) : null; }
  function rect(el){ return safe(function(){ return el && el.getBoundingClientRect ? el.getBoundingClientRect() : null; }, null); }
  function point(ev){
    var t = ev && ev.touches && ev.touches.length ? ev.touches[0] : (ev && ev.changedTouches && ev.changedTouches.length ? ev.changedTouches[0] : ev);
    if(!t || typeof t.clientX !== 'number' || typeof t.clientY !== 'number') return null;
    return {x:t.clientX, y:t.clientY};
  }
  function visible(el){
    if(!el) return false;
    var st = getStyle(el);
    if(st && (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0)) return false;
    var r = rect(el);
    var vw = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 0);
    var vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 0);
    return !!(r && r.width > 6 && r.height > 6 && r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh);
  }
  function inside(r, p, pad){
    if(!r || !p) return false;
    pad = Number(pad || 0);
    return p.x >= r.left - pad && p.x <= r.right + pad && p.y >= r.top - pad && p.y <= r.bottom + pad;
  }
  function combatActive(){
    var body = document.body;
    if(!body || !body.classList) return false;
    if(body.classList.contains('prd-map-ui-active')) return false;
    if(body.classList.contains('native-pause-open') || body.classList.contains('prd-pause-v29-open') || body.classList.contains('prd-pause-menu-open')) return false;
    // Trust the combat class first.  Some mobile WebViews keep the previous map
    // element measurable behind the game for one frame, so checking stageMap/
    // galaxyMap visibility here can incorrectly disable command taps.
    if(body.classList.contains('prd-combat-ui-active')) return true;
    return visible(byId('game')) && visible(byId('field'));
  }
  function readViewport(){
    var root = document.documentElement || document.body;
    var vv = window.visualViewport || null;
    var w = Math.round((vv && vv.width) || window.innerWidth || (root && root.clientWidth) || 748);
    var h = Math.round((vv && vv.height) || window.innerHeight || (root && root.clientHeight) || 708);
    if((!w || !h || w < 120 || h < 120) && window.screen){
      w = Math.round(window.screen.width || w || 748);
      h = Math.round(window.screen.height || h || 708);
    }
    w = Math.max(320, w || 748);
    h = Math.max(320, h || 708);
    return {w:w, h:h, landscape:w >= h};
  }
  function applyViewport(reason){
    var vp = readViewport();
    window.PRD_EXPO_VIEWPORT_V96 = {w:vp.w, h:vp.h, landscape:vp.landscape, reason:reason || 'apply', ts:Date.now()};
    var root = document.documentElement;
    var body = document.body;
    if(root){
      root.style.setProperty('--prd-vw', vp.w + 'px');
      root.style.setProperty('--prd-vh', vp.h + 'px');
      root.style.setProperty('--prd-app-w', vp.w + 'px');
      root.style.setProperty('--prd-app-h', vp.h + 'px');
    }
    if(body && body.classList){
      body.classList.toggle('prd-vp-landscape', !!vp.landscape);
      body.classList.toggle('prd-vp-portrait', !vp.landscape);
      body.dataset.prdViewport = vp.landscape ? 'landscape' : 'portrait';
    }
    return vp;
  }
  function scheduleViewport(reason){
    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function(){
      raf = 0;
      applyViewport(reason || 'raf');
      if(combatActive() && window.PRD_GAME_COMMANDS_V96 && typeof window.PRD_GAME_COMMANDS_V96.relayout === 'function'){
        setTimeout(function(){ window.PRD_GAME_COMMANDS_V96.relayout('v96-' + (reason || 'viewport')); }, 0);
      }
    });
  }
  window.PRD_APPLY_EXPO_VIEWPORT_V96 = function(reason){
    var vp = applyViewport(reason || 'manual');
    scheduleViewport(reason || 'manual');
    return vp;
  };

  function injectCss(){
    if(byId('v96-real-command-buttons-css')) return;
    var st = document.createElement('style');
    st.id = 'v96-real-command-buttons-css';
    st.textContent = `
/* v96 final command source of truth: hide proxy docks and use real buttons. */
#combatHudCommandsLandscapeDock,
#combatHudCommandsPortraitDock,
#prdCommandHitboxLayerV95{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands,
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands .battleActions,
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands .battleActions .row,
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands .battleActions .row3,
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands button{
  opacity:1!important;visibility:visible!important;pointer-events:auto!important;clip-path:none!important;filter:none!important;
}
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands{
  position:fixed!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;
  width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;
  margin:0!important;padding:0!important;overflow:visible!important;z-index:2147483200!important;transform:none!important;
  display:block!important;background:transparent!important;border:0!important;box-shadow:none!important;contain:none!important;
}
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands .battleActions{
  position:relative!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;
  width:100%!important;height:auto!important;margin:0!important;box-sizing:border-box!important;
  display:grid!important;background:linear-gradient(180deg,rgba(15,23,42,.58),rgba(2,6,23,.78))!important;
  border:1px solid rgba(103,232,249,.18)!important;box-shadow:0 14px 40px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.035)!important;
  backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;
}
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands .battleActions .row,
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands .battleActions .row3{display:contents!important;margin:0!important;padding:0!important;}
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands #summonBtn,
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands #mergeBtn,
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands #speedBtn,
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands #pauseBtn{
  display:block!important;position:relative!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;
  width:100%!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0 8px!important;
  border-radius:15px!important;border:1px solid rgba(103,232,249,.24)!important;background:linear-gradient(180deg,rgba(15,23,42,.94),rgba(2,6,23,.98))!important;
  color:#f8fafc!important;font-weight:900!important;text-align:center!important;letter-spacing:-.02em!important;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.035)!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(103,232,249,.18)!important;user-select:none!important;-webkit-user-select:none!important;
}
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands #summonBtn{border-color:rgba(251,191,36,.42)!important;color:#fff7ed!important;}
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands button:active{transform:translateY(1px) scale(.985)!important;}
@media (orientation:landscape){body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands{right:calc(8px + env(safe-area-inset-right,0px))!important;bottom:calc(8px + env(safe-area-inset-bottom,0px))!important;width:clamp(92px,10vw,120px)!important;}}
body.prd-vp-landscape.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands{right:calc(8px + env(safe-area-inset-right,0px))!important;bottom:calc(8px + env(safe-area-inset-bottom,0px))!important;width:clamp(92px,10vw,120px)!important;}
body.prd-vp-landscape.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands .battleActions{grid-template-columns:1fr!important;gap:7px!important;padding:8px!important;border-radius:20px!important;}
body.prd-vp-landscape.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands button{height:clamp(32px,7vh,44px)!important;min-height:32px!important;max-height:44px!important;font-size:clamp(8px,1.18vw,11px)!important;}
body.prd-vp-portrait.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands{left:50%!important;right:auto!important;bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;transform:translateX(-50%)!important;width:min(680px,calc(var(--prd-vw,100vw) - 12px))!important;}
body.prd-vp-portrait.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands .battleActions{grid-template-columns:1fr 1fr!important;gap:8px!important;padding:8px calc(8px + env(safe-area-inset-right,0px)) 8px calc(8px + env(safe-area-inset-left,0px))!important;border-radius:18px!important;}
body.prd-vp-portrait.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudCommands button{height:clamp(38px,5.4vh,48px)!important;min-height:38px!important;max-height:48px!important;font-size:clamp(8px,2.35vw,11px)!important;}
body:not(.prd-combat-ui-active) #combatHudCommands,
body.prd-map-ui-active #combatHudCommands{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}

/* v96 Expo viewport lock: battle screen must fill the actual visual viewport. */
html,body{width:var(--prd-vw,100vw)!important;height:var(--prd-vh,100dvh)!important;overflow:hidden!important;overscroll-behavior:none!important;}
#wrap{position:fixed!important;inset:0!important;width:var(--prd-vw,100vw)!important;height:var(--prd-vh,100dvh)!important;margin:0!important;padding:0!important;overflow:hidden!important;}
body.prd-combat-ui-active:not(.prd-map-ui-active) #game{position:fixed!important;inset:0!important;width:var(--prd-vw,100vw)!important;height:var(--prd-vh,100dvh)!important;display:flex!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;background:#020617!important;box-shadow:none!important;}
body.prd-vp-landscape.prd-combat-ui-active:not(.prd-map-ui-active) #game{flex-direction:row!important;}
body.prd-vp-portrait.prd-combat-ui-active:not(.prd-map-ui-active) #game{flex-direction:column!important;}
body.prd-combat-ui-active:not(.prd-map-ui-active) #field{position:relative!important;flex:1 1 auto!important;width:var(--prd-vw,100vw)!important;height:var(--prd-vh,100dvh)!important;min-width:var(--prd-vw,100vw)!important;min-height:var(--prd-vh,100dvh)!important;max-width:var(--prd-vw,100vw)!important;max-height:var(--prd-vh,100dvh)!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;transform:none!important;}
body.prd-combat-ui-active:not(.prd-map-ui-active) #canvas{display:block!important;width:var(--prd-vw,100vw)!important;height:var(--prd-vh,100dvh)!important;min-width:var(--prd-vw,100vw)!important;min-height:var(--prd-vh,100dvh)!important;max-width:var(--prd-vw,100vw)!important;max-height:var(--prd-vh,100dvh)!important;object-fit:fill!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;touch-action:none!important;}
body.prd-combat-ui-active:not(.prd-map-ui-active) #side,
body.prd-combat-ui-active:not(.prd-map-ui-active) #side.battleMinimal{position:fixed!important;left:0!important;top:0!important;width:0!important;height:0!important;min-width:0!important;min-height:0!important;max-width:0!important;max-height:0!important;overflow:visible!important;pointer-events:none!important;background:transparent!important;margin:0!important;padding:0!important;border:0!important;}
body.prd-combat-ui-active:not(.prd-map-ui-active) #combatHudOverlay{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;pointer-events:none!important;z-index:70!important;}
`;
    (document.head || document.documentElement).appendChild(st);
  }

  function commandFromPoint(p){
    if(!p) return null;
    // Prefer real buttons.  Proxy docks are intentionally hidden by v96, but keep
    // them as fallback while the DOM is still settling during the first frame.
    var selectors = [
      ['summon','#summonBtn,#hudProxy_landscape_summon,#hudProxy_portrait_summon,[data-action="summon"]'],
      ['merge', '#mergeBtn,#hudProxy_landscape_merge,#hudProxy_portrait_merge,[data-action="merge"]'],
      ['speed', '#speedBtn,#hudProxy_landscape_speed,#hudProxy_portrait_speed,[data-action="speed"]'],
      ['pause', '#pauseBtn,#hudProxy_landscape_pause,#hudProxy_portrait_pause,[data-action="pause"]']
    ];
    for(var i=0;i<selectors.length;i++){
      var action = selectors[i][0];
      var nodes = [];
      try{ nodes = Array.prototype.slice.call(document.querySelectorAll(selectors[i][1])); }catch(_e){}
      for(var j=nodes.length-1;j>=0;j--){
        var el = nodes[j];
        if(!visible(el)) continue;
        if(inside(rect(el), p, Math.max(6, Math.min(12, (rect(el).height || 40) * .18)))) return {action:action, el:el};
      }
    }
    return null;
  }
  function stop(ev){
    safe(function(){ if(ev && ev.cancelable) ev.preventDefault(); });
    safe(function(){ if(ev) ev.stopPropagation(); });
    safe(function(){ if(ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation(); });
  }
  function runCommand(action, ev){
    var now = Date.now();
    if(action === lastAction && now - lastAt < 210){ stop(ev); return false; }
    lastAction = action;
    lastAt = now;
    stop(ev);
    var api = window.PRD_GAME_COMMANDS_V96;
    if(api && typeof api[action] === 'function'){
      api[action](action === 'pause' ? (ev || null) : undefined);
    }else{
      var id = COMMANDS.find(function(c){ return c.action === action; })?.id;
      var btn = id ? byId(id) : null;
      if(btn && typeof btn.onclick === 'function') btn.onclick.call(btn);
    }
    safe(function(){ window.dispatchEvent(new Event('prd-command-sync')); });
    return false;
  }
  function captureCommand(ev){
    if(!combatActive()) return;
    var hit = commandFromPoint(point(ev));
    if(!hit) return;
    runCommand(hit.action, ev);
  }
  function bindRealButtons(){
    COMMANDS.forEach(function(cmd){
      var btn = byId(cmd.id);
      if(!btn || btn.dataset.v96Bound === '1') return;
      btn.dataset.v96Bound = '1';
      btn.setAttribute('aria-label', cmd.label);
      btn.setAttribute('title', cmd.label);
      ['pointerdown','touchstart','mousedown','click'].forEach(function(type){
        btn.addEventListener(type, function(ev){ runCommand(cmd.action, ev); }, {capture:true, passive:false});
      });
    });
  }
  function boot(){
    injectCss();
    applyViewport('boot');
    bindRealButtons();
    scheduleViewport('boot');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
  window.addEventListener('load', boot, {once:true});
  ['pointerdown','touchstart','mousedown','click'].forEach(function(type){
    window.addEventListener(type, captureCommand, {capture:true, passive:false});
  });
  ['resize','orientationchange','pageshow'].forEach(function(type){
    window.addEventListener(type, function(){ scheduleViewport(type); setTimeout(function(){ scheduleViewport(type + '-late'); }, 220); }, {passive:true});
  });
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', function(){ scheduleViewport('visualViewport-resize'); }, {passive:true});
    window.visualViewport.addEventListener('scroll', function(){ scheduleViewport('visualViewport-scroll'); }, {passive:true});
  }
  document.addEventListener('visibilitychange', function(){ scheduleViewport('visibilitychange'); }, {passive:true});
  setTimeout(boot, 120);
  setTimeout(boot, 600);
  setInterval(function(){ bindRealButtons(); if(combatActive()) applyViewport('interval'); }, 500);

  window.PRD_COMMAND_AUDIT_V96 = function(){
    var p = readViewport();
    var rows = COMMANDS.map(function(c){
      var el = byId(c.id);
      var r = rect(el);
      var st = getStyle(el);
      return {action:c.action, exists:!!el, visible:visible(el), display:st&&st.display, visibility:st&&st.visibility, opacity:st&&st.opacity, pointerEvents:st&&st.pointerEvents, rect:r?{left:r.left,top:r.top,width:r.width,height:r.height}:null, onclick:!!(el&&typeof el.onclick==='function')};
    });
    return {viewport:p, body:document.body&&document.body.className, combatActive:combatActive(), commands:rows, api:!!window.PRD_GAME_COMMANDS_V96};
  };
})();


/* ===== v97-main-menu-button-hardening =====
   The menu action row is fixed on mobile. This handler makes the three main
   buttons work even when Expo WebView dispatches touch events to the menu/card
   layer instead of to the button node itself. */
(function(){
  'use strict';
  var lastAction = '';
  var lastAt = 0;
  function byId(id){ return document.getElementById(id); }
  function visible(el){
    if(!el) return false;
    var st = window.getComputedStyle(el);
    if(!st || st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity || 1) <= 0.01) return false;
    var r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  function menuActive(){ return visible(byId('menu')); }
  function stop(ev){
    try{ if(ev && ev.cancelable) ev.preventDefault(); }catch(_e){}
    try{ if(ev) ev.stopPropagation(); }catch(_e){}
    try{ if(ev && ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(_e){}
  }
  function safe(fn){ try{ return fn(); }catch(e){ console.warn('[v97 menu buttons]', e); } }
  function setMapUi(){
    safe(function(){ document.body.classList.add('prd-map-ui-active'); });
    safe(function(){ document.body.classList.remove('prd-combat-ui-active','prd-stage-entering'); });
  }
  function goGalaxy(testMode){
    setMapUi();
    if(testMode){
      safe(function(){ if(typeof loadOfflineMeta === 'function') loadOfflineMeta(); });
      safe(function(){ if(typeof loadStageMapProgress === 'function') loadStageMapProgress(); });
      safe(function(){ if(typeof applyTestModeOverrides === 'function') applyTestModeOverrides(); });
      safe(function(){ if(typeof renderOfflineMetaPanel === 'function') renderOfflineMetaPanel(); });
    }else{
      safe(function(){ if(typeof setTestModeEnabled === 'function') setTestModeEnabled(false); });
      safe(function(){ if(typeof loadOfflineMeta === 'function') loadOfflineMeta(); });
      safe(function(){ if(typeof loadStageMapProgress === 'function') loadStageMapProgress(); });
    }
    safe(function(){ if(typeof bindGalaxyMapClean === 'function') bindGalaxyMapClean(); });
    if(typeof showGalaxyMapClean === 'function'){
      safe(function(){ showGalaxyMapClean(); });
    }else{
      var menu = byId('menu'), galaxy = byId('galaxyMap'), stage = byId('stageMap'), game = byId('game');
      if(menu) menu.style.display = 'none';
      if(stage) stage.style.display = 'none';
      if(game) game.style.display = 'none';
      if(galaxy) galaxy.style.display = 'block';
    }
    if(testMode){
      safe(function(){ if(typeof toast === 'function') toast('TEST MODE 활성화 — 모든 성역과 기본 타워가 해금되었습니다'); });
      setTimeout(function(){ safe(function(){ if(typeof renderStageMap === 'function' && byId('stageMap') && byId('stageMap').style.display !== 'none') renderStageMap(); }); }, 80);
    }
  }
  function runLog(){
    if(typeof showBattleLogSummary === 'function'){
      safe(function(){ showBattleLogSummary(); });
      return;
    }
    var btn = byId('runLogBtn');
    if(btn && typeof btn.onclick === 'function') safe(function(){ btn.onclick.call(btn); });
    else safe(function(){ if(typeof toast === 'function') toast('아직 저장된 전투 로그가 없습니다'); });
  }
  function execute(action, ev){
    var now = Date.now();
    if(action === lastAction && now - lastAt < 350){ stop(ev); return false; }
    lastAction = action; lastAt = now;
    stop(ev);
    if(action === 'start') goGalaxy(false);
    else if(action === 'test') goGalaxy(true);
    else if(action === 'log') runLog();
    return false;
  }
  function getActionFromNode(node){
    if(!node || !node.closest) return '';
    if(node.closest('#startBtn')) return 'start';
    if(node.closest('#testModeBtn')) return 'test';
    if(node.closest('#runLogBtn')) return 'log';
    return '';
  }
  function point(ev){
    var t = ev && ev.touches && ev.touches[0] ? ev.touches[0] : (ev && ev.changedTouches && ev.changedTouches[0] ? ev.changedTouches[0] : ev);
    if(!t) return null;
    return {x:Number(t.clientX || 0), y:Number(t.clientY || 0)};
  }
  function actionFromPoint(p){
    if(!p) return '';
    var pairs = [['start',byId('startBtn')],['test',byId('testModeBtn')],['log',byId('runLogBtn')]];
    for(var i=0;i<pairs.length;i++){
      var el = pairs[i][1];
      if(!visible(el)) continue;
      var r = el.getBoundingClientRect();
      var pad = Math.max(8, Math.min(18, r.height * .25));
      if(p.x >= r.left - pad && p.x <= r.right + pad && p.y >= r.top - pad && p.y <= r.bottom + pad) return pairs[i][0];
    }
    return '';
  }
  function capture(ev){
    if(!menuActive()) return;
    var action = getActionFromNode(ev.target) || actionFromPoint(point(ev));
    if(!action) return;
    execute(action, ev);
  }
  function bindDirect(){
    [['startBtn','start'],['testModeBtn','test'],['runLogBtn','log']].forEach(function(pair){
      var el = byId(pair[0]);
      if(!el || el.dataset.v97MenuBound === '1') return;
      el.dataset.v97MenuBound = '1';
      el.setAttribute('type','button');
      el.style.pointerEvents = 'auto';
      ['pointerup','touchend','click'].forEach(function(type){
        el.addEventListener(type, function(ev){ execute(pair[1], ev); }, {capture:true, passive:false});
      });
    });
  }
  function boot(){ bindDirect(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  window.addEventListener('load', boot, {once:true});
  setTimeout(boot, 80); setTimeout(boot, 500); setInterval(boot, 1000);
  ['pointerup','touchend','click'].forEach(function(type){
    window.addEventListener(type, capture, {capture:true, passive:false});
  });
  window.PRD_MENU_BUTTON_AUDIT_V97 = function(){
    return ['startBtn','testModeBtn','runLogBtn'].map(function(id){
      var el = byId(id), r = el && el.getBoundingClientRect(), st = el && getComputedStyle(el);
      return {id:id, exists:!!el, visible:visible(el), rect:r?{left:r.left,top:r.top,width:r.width,height:r.height}:null, pointerEvents:st&&st.pointerEvents, display:st&&st.display, menuActive:menuActive()};
    });
  };
})();


/* ===== v99-iphone-status-safe-sync =====
   Standalone safe-area synchronizer for Expo/iPhone WebView. */
(function(){
  'use strict';
  if(window.PRD_V99_STATUS_SAFE_SYNC) return;
  window.PRD_V99_STATUS_SAFE_SYNC = true;
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function measureEnvTop(){
    try{
      var probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);';
      (document.body || document.documentElement).appendChild(probe);
      var v = parseFloat(getComputedStyle(probe).paddingTop) || 0;
      probe.remove();
      return v;
    }catch(_e){ return 0; }
  }
  function compute(){
    var vv = window.visualViewport || null;
    var envTop = Math.max(0, Math.round(measureEnvTop() || 0));
    var vvTop = Math.max(0, Math.round((vv && vv.offsetTop) || 0));
    var w = Math.round((vv && vv.width) || window.innerWidth || document.documentElement.clientWidth || 0);
    var h = Math.round((vv && vv.height) || window.innerHeight || document.documentElement.clientHeight || 0);
    var ua = navigator.userAgent || '';
    var isIOS = /iP(hone|ad|od)/.test(ua) || ((navigator.platform || '') === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    var isTouch = (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && window.matchMedia('(hover:none), (pointer:coarse)').matches);
    var fallback = (isIOS && isTouch && envTop < 4 && vvTop < 4) ? (w >= h ? 18 : 44) : 0;
    return Math.round(clamp(Math.max(envTop, vvTop, fallback), 0, 64));
  }
  function apply(reason){
    var px = compute();
    var root = document.documentElement;
    if(root){
      root.style.setProperty('--prd-status-top-offset', px + 'px');
      root.style.setProperty('--prd-battle-safe-top', px + 'px');
    }
    if(document.body) document.body.dataset.prdStatusTop = String(px);
    window.PRD_STATUS_TOP_OFFSET_V99 = {px:px, reason:reason || 'apply', ts:Date.now()};
    return px;
  }
  function relayout(reason){
    var before = window.PRD_STATUS_TOP_OFFSET_V99 && window.PRD_STATUS_TOP_OFFSET_V99.px;
    var px = apply(reason);
    if(document.body && document.body.classList && document.body.classList.contains('prd-combat-ui-active') && before !== px){
      setTimeout(function(){
        try{
          if(window.PRD_GAME_COMMANDS_V96 && typeof window.PRD_GAME_COMMANDS_V96.relayout === 'function') window.PRD_GAME_COMMANDS_V96.relayout('v99-status-' + (reason || 'sync'));
        }catch(e){ console.warn('[v99 status relayout]', e); }
      }, 0);
    }
    return px;
  }
  window.PRD_APPLY_STATUS_SAFE_V99 = relayout;
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ relayout('DOMContentLoaded'); }, {once:true});
  else relayout('boot');
  window.addEventListener('load', function(){ relayout('load'); }, {once:true});
  ['resize','orientationchange','pageshow'].forEach(function(type){
    window.addEventListener(type, function(){ relayout(type); setTimeout(function(){ relayout(type + '-late'); }, 180); }, {passive:true});
  });
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', function(){ relayout('visualViewport-resize'); }, {passive:true});
    window.visualViewport.addEventListener('scroll', function(){ relayout('visualViewport-scroll'); }, {passive:true});
  }
  setTimeout(function(){ relayout('late-120'); }, 120);
  setTimeout(function(){ relayout('late-800'); }, 800);
})();
