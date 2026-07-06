/* Eventera unified dashboard — shared chrome (sidebar + topbar) + icon set */

const ICONS = {
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 9.5h18M7 14.5h5"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-9.8-9.2C.7 8 2.3 4.8 5.6 4.2c2-.4 3.9.5 5 2.1a5.6 5.6 0 0 1 1.4-1.5c1.5-1 3.6-1 5-.2 2.6 1.4 3.2 4.6 1.6 7.6-2.3 4.4-6.6 8.3-6.6 8.3Z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.2 2.3 3.5 5.3 3.5 8.5s-1.3 6.2-3.5 8.5c-2.2-2.3-3.5-5.3-3.5-8.5S9.8 5.8 12 3.5Z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  trending: '<path d="M3 17.5 9.5 11l4 4L21 6.5"/><path d="M15 6.5h6v6"/>',
  palette: '<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="9.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="13.5" r="1.1" fill="currentColor" stroke="none"/><path d="M12 20.5A2.5 2.5 0 0 1 9.5 18c0-1 .7-1.4.7-2.3 0-1-.9-1.7-2-1.7H7"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M2.8 20c.7-3.3 3-5.2 6.2-5.2s5.5 1.9 6.2 5.2"/><circle cx="17.2" cy="8.8" r="2.5"/><path d="M15.5 14.9c2.6.3 4.3 2 4.9 4.6"/>',
  layout: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M9 9.5V20"/>',
  barchart: '<path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2.5 20.5h19"/>',
  shield: '<path d="M12 3.5 19 6v6c0 5-3 8-7 9.5-4-1.5-7-4.5-7-9.5V6l7-2.5Z"/>',
  creditcard: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 9.5h18"/><path d="M7 14.7h4"/>',
  filetext: '<path d="M6 3.5h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4M8 12h8M8 16h8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 12.9a7.5 7.5 0 0 0 0-1.8l2-1.6-2-3.4-2.4.9a7.6 7.6 0 0 0-1.6-.9L15 3.5H9l-.4 2.6a7.6 7.6 0 0 0-1.6.9l-2.4-.9-2 3.4 2 1.6a7.5 7.5 0 0 0 0 1.8l-2 1.6 2 3.4 2.4-.9c.5.4 1 .7 1.6.9L9 20.5h6l.4-2.6c.6-.2 1.1-.5 1.6-.9l2.4.9 2-3.4Z"/>',
  logout: '<path d="M9 20.5H5.5a1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.5-1.5H9"/><path d="M16 16.5 21 12l-5-4.5"/><path d="M21 12H9"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/>',
  plus: '<path d="M12 4.5v15M4.5 12h15"/>',
  external: '<path d="M9 5h10v10"/><path d="M19 5 5 19"/>',
  scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M4 12h16"/>',
  dots: '<circle cx="12" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
  download: '<path d="M12 3.5v12M7.5 11l4.5 4.5L16.5 11"/><path d="M4.5 18h15"/>',
  arrowright: '<path d="M4.5 12h15M13 5.5 19.5 12 13 18.5"/>',
  ticket: '<path d="M3 9.5a2 2 0 0 0 0-3.9V5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v.6a2 2 0 0 0 0 3.9v.1a2 2 0 0 0 0 3.9v.1a2 2 0 0 0 0 3.9v.6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-.6a2 2 0 0 0 0-3.9Z"/><path d="M14 4v16" stroke-dasharray="2.5 2.5"/>',
  qr: '<rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><path d="M14.5 15h2.5v2.5H14.5zM19.5 14.5v2M14.5 20h2M19.5 19v1.5"/>',
  chevdown: '<path d="M6 9l6 6 6-6"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 9h17M12 9v11"/><path d="M12 9C9 9 7.5 7.8 7.5 6.2A2.2 2.2 0 0 1 12 5.8 2.2 2.2 0 0 1 16.5 6.2C16.5 7.8 15 9 12 9Z"/>',
  alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5" /><circle cx="12" cy="16" r=".6" fill="currentColor" stroke="none"/>',
  check: '<path d="M5 12.5 9.5 17 19 6.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.3 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.5 1.7-2.5 3.6"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/>',
  layers: '<path d="M12 3.5 3.5 8l8.5 4.5L20.5 8Z"/><path d="M3.5 12 12 16.5 20.5 12"/><path d="M3.5 16 12 20.5 20.5 16"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M3 17l5-5 4 4 3-3 6 6"/>',
  type: '<path d="M5 5h14M12 5v14M8.5 19h7"/>',
  undo: '<path d="M7 8H4V5"/><path d="M4 8c2-3 5.5-4.5 9-3.8 3.5.6 6.2 3.5 6.6 7a8 8 0 0 1-14.6 5.3"/>',
  redo: '<path d="M17 8h3V5"/><path d="M20 8c-2-3-5.5-4.5-9-3.8-3.5.6-6.2 3.5-6.6 7A8 8 0 0 0 19 16.5"/>',
};
function ic(key, size=18, stroke=1.75){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${ICONS[key]||''}</svg>`;
}

/* Nav model — reflects the approved unification blueprint */
const NAV = {
  home: { key:'home', label:'Home', icon:'home' },
  groups: [
    { key:'attending', label:'Attending', items:[
      { key:'my-events', label:'Tickets', icon:'ticket' },
      { key:'my-cards', label:'My Cards', icon:'card' },
      { key:'saved', label:'Saved', icon:'heart' },
      { key:'discover', label:'Discover', icon:'globe' },
    ]},
    { key:'organizing', label:'Organizing', items:[
      { key:'events', label:'Events', icon:'grid' },
      { key:'analytics', label:'Analytics', icon:'trending' },
      { key:'team', label:'Team', icon:'users' },
    ]},
    { key:'admin', label:'Admin', admin:true, items:[
      { key:'platform-stats', label:'Platform Stats', icon:'barchart' },
      { key:'accounts', label:'Accounts', icon:'shield' },
      { key:'revenue', label:'Revenue', icon:'creditcard' },
      { key:'activity', label:'Activity Log', icon:'filetext' },
    ]},
  ],
};

function sidebarHTML(active){
  let html = `
  <div class="sb-brand">
    <span class="sb-logo">${ic('grid',20,2)}Event<span class="accent">era</span></span>
    <span class="sb-studio-badge">STUDIO</span>
  </div>
  <div class="sb-user">Abdalla Abdikarim</div>
  <div class="sb-nav">
    <div class="sb-link home ${active==='home'?'active':''}">${ic(NAV.home.icon)}${NAV.home.label}</div>`;
  for(const g of NAV.groups){
    const hasActive = g.items.some(i=>i.key===active);
    html += `<details class="sb-group ${g.admin?'admin':''}" ${hasActive||true?'open':''}>
      <summary>${g.label}${ic('chevdown',13,2.2).replace('<svg','<svg class="chev"')}</summary>`;
    for(const it of g.items){
      html += `<div class="sb-link ${it.key===active?'active':''}">${ic(it.icon)}${it.label}</div>`;
    }
    html += `</details>`;
  }
  html += `</div>
  <div class="sb-bottom">
    <div class="sb-usage">
      <div class="sb-usage-label"><span>Events</span><span>25 / ∞</span></div>
      <div class="sb-usage-bar"><div class="sb-usage-fill" style="width:38%"></div></div>
    </div>
    <div class="sb-plan-btn">${ic('check',15,2.4)} Studio plan</div>
    <div class="sb-foot-link">${ic('settings',17)}Settings</div>
    <div class="sb-foot-link">${ic('logout',17)}Sign out</div>
  </div>`;
  return html;
}

function topbarHTML(crumb){
  return `
  <div class="crumb">Eventera <span style="opacity:.5">/</span> <b>${crumb}</b></div>
  <div class="topbar-right">
    <div class="search-box">${ic('search',15)} Search... <span class="kbd">⌘K</span></div>
    <div class="icon-btn">${ic('bell',18)}</div>
    <div class="avatar">AA</div>
  </div>`;
}

function mountChrome(){
  document.querySelectorAll('[data-sidebar]').forEach(el=>{
    el.innerHTML = sidebarHTML(el.getAttribute('data-sidebar'));
  });
  document.querySelectorAll('[data-topbar]').forEach(el=>{
    el.innerHTML = topbarHTML(el.getAttribute('data-topbar'));
  });
  document.querySelectorAll('[data-icon]').forEach(el=>{
    const [key,size,stroke] = el.getAttribute('data-icon').split(',');
    el.innerHTML = ic(key, size?+size:18, stroke?+stroke:1.75);
  });
}
document.addEventListener('DOMContentLoaded', mountChrome);
