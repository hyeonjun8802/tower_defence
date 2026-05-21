/* Extracted from second inline <script> block. */

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
