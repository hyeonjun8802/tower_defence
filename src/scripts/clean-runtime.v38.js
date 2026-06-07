/* v38: shared clean runtime scheduler for non-combat UI screens.
   Goal: avoid scattered MutationObserver/setInterval loops on menu/map/armory.
   Battle canvas and combat command logic intentionally stay in their existing flow. */
(function(){
  'use strict';
  if(window.PRD_CLEAN_RUNTIME_V38) return;

  var rafJobs = Object.create(null);
  var timeoutJobs = Object.create(null);
  var observers = Object.create(null);
  var subscribers = Object.create(null);

  function safe(fn){ try{ return fn && fn(); }catch(err){ try{ console.warn('[clean-runtime-v38]', err); }catch(_){ } } }
  function byId(id){ return document.getElementById(id); }
  function isVisible(el){
    if(!el) return false;
    try{
      var st = getComputedStyle(el);
      if(st.display === 'none' || st.visibility === 'hidden') return false;
      var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      return !r || r.width > 0 || r.height > 0;
    }catch(_){ return false; }
  }
  function battleActive(){
    return isVisible(byId('game')) && !isVisible(byId('menu')) && !isVisible(byId('galaxyMap')) && !isVisible(byId('stageMap'));
  }
  function screenName(){
    if(isVisible(byId('menu'))) return 'menu';
    if(isVisible(byId('galaxyMap'))) return 'galaxyMap';
    if(isVisible(byId('stageMap'))) return 'stageMap';
    if(battleActive()) return 'battle';
    if(isVisible(byId('towerPopup'))) return 'armory';
    return 'unknown';
  }
  function schedule(key, fn, delay){
    key = String(key || 'default');
    if(timeoutJobs[key]) clearTimeout(timeoutJobs[key]);
    timeoutJobs[key] = setTimeout(function(){
      timeoutJobs[key] = 0;
      if(rafJobs[key]) cancelAnimationFrame(rafJobs[key]);
      rafJobs[key] = requestAnimationFrame(function(){
        rafJobs[key] = 0;
        safe(fn);
      });
    }, Math.max(0, delay == null ? 48 : delay));
  }
  function observe(key, targets, options, fn, delay){
    key = String(key || 'observer');
    if(observers[key]) return observers[key];
    if(!window.MutationObserver) return null;
    var nodes = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
    if(!nodes.length) return null;
    var obs = new MutationObserver(function(){ schedule('mo:' + key, fn, delay == null ? 64 : delay); });
    nodes.forEach(function(node){ safe(function(){ obs.observe(node, options || {attributes:true}); }); });
    observers[key] = obs;
    return obs;
  }
  function addSubscriber(group, name, fn){
    group = String(group || 'default');
    name = String(name || ('sub-' + Date.now()));
    if(!subscribers[group]) subscribers[group] = Object.create(null);
    subscribers[group][name] = fn;
  }
  function notify(group){
    var bucket = subscribers[group];
    if(!bucket) return;
    Object.keys(bucket).forEach(function(name){ safe(bucket[name]); });
  }
  function observeScreenState(name, fn){
    addSubscriber('screen', name, fn);
    var nodes = ['menu','galaxyMap','stageMap','game','towerPopup'].map(byId).filter(Boolean);
    observe('screen-state', nodes, {attributes:true, attributeFilter:['class','style','hidden','aria-hidden','data-selected','data-unlocked']}, function(){ notify('screen'); }, 72);
  }
  function observeStageMapState(name, fn){
    addSubscriber('stageMap', name, fn);
    var map = byId('stageMap');
    if(map){
      observe('stage-map-state', map, {childList:true, subtree:false, attributes:true, attributeFilter:['class','style','data-selected','data-unlocked','hidden','aria-hidden']}, function(){ notify('stageMap'); }, 72);
    }
  }
  function observeArmoryDetail(name, fn){
    addSubscriber('armoryDetail', name, fn);
    var detail = byId('towerPopupDetail');
    if(detail){
      observe('armory-detail-childlist', detail, {childList:true, subtree:false}, function(){ notify('armoryDetail'); }, 72);
    }
  }
  function observeElement(key, getter, options, fn, delay){
    var el = typeof getter === 'function' ? safe(getter) : getter;
    if(el) return observe(key, el, options, fn, delay);
    return null;
  }
  function runOnVisible(key, selector, fn){
    observeScreenState(key, function(){
      var el = document.querySelector(selector);
      if(isVisible(el)) schedule('visible:' + key, fn, 72);
    });
  }

  window.PRD_CLEAN_RUNTIME_V38 = {
    schedule: schedule,
    observe: observe,
    observeElement: observeElement,
    observeScreenState: observeScreenState,
    observeStageMapState: observeStageMapState,
    observeArmoryDetail: observeArmoryDetail,
    runOnVisible: runOnVisible,
    isVisible: isVisible,
    battleActive: battleActive,
    screenName: screenName,
    _debug: function(){ return {screen: screenName(), observers: Object.keys(observers), subscriberGroups: Object.keys(subscribers)}; }
  };
})();
