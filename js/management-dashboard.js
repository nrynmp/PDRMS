/* =========================================
   PDRMS MANAGEMENT INTELLIGENCE
   Robust live dashboard - no Chart.js dependency
   ========================================= */

let miReports = [];
let miRefreshTimer = null;

const MI_LABELS = {
  "Lock Lifter Handle Change": "CBC Operating Handle (LLH) Change",
  "Lock Lifter Handle Repair": "CBC Operating Handle (LLH) Repair"
};

function miLabel(v){
  const s=String(v??'').trim();
  return MI_LABELS[s] || s;
}
function escMI(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function asArray(v){
  if(Array.isArray(v)) return v;
  if(typeof v==='string'){
    try{const x=JSON.parse(v); return Array.isArray(x)?x:[];}catch(_){return[];}
  }
  return [];
}
function normalizeReport(r){
  const x=(r&&typeof r==='object')?r:{};
  return {...x,wagons:asArray(x.wagons)};
}
function reportDateMI(r){
  const raw=String(r?.reportDate||r?.savedAt||'');
  const d=new Date(raw);
  return Number.isNaN(d.getTime())?new Date(0):d;
}
function dateKeyMI(r){
  const raw=String(r?.reportDate||r?.savedAt||'');
  const m=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m) return `${m[1]}-${String(m[2]).padStart(2,'0')}`;
  const d=reportDateMI(r);
  return d.getTime()?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`:'Unknown';
}
function displayDateMI(r){
  const raw=String(r?.reportDate||r?.savedAt||'');
  const m=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m?`${String(m[3]).padStart(2,'0')}/${String(m[2]).padStart(2,'0')}/${m[1]}`:(raw.slice(0,10)||'—');
}
function reportOwnerMI(r){
  if(typeof reportOwner==='function') return String(reportOwner(r)||'').trim().toUpperCase();
  return String(r.owner||r.rly||r.ownerRly||r.company||'UNKNOWN').trim().toUpperCase()||'UNKNOWN';
}
function wagonDamagesMI(w,r){
  if(typeof wagonDamages==='function') return wagonDamages(w,r)||[];
  return [];
}
function topEntryMI(obj){return Object.entries(obj).sort((a,b)=>b[1]-a[1])[0]||null;}
function readCacheMI(){
  try{
    const d=JSON.parse(localStorage.getItem('PRDMS_REPORT_HISTORY')||'[]');
    return Array.isArray(d)?d.map(normalizeReport):[];
  }catch(_){return[];}
}
function getFilteredMI(){
  const f=document.getElementById('fromDate')?.value||'';
  const t=document.getElementById('toDate')?.value||'';
  const c=document.getElementById('companyFilter')?.value||'';
  const tr=(document.getElementById('trainFilter')?.value||'').trim().toLowerCase();
  return miReports.filter(r=>{
    const raw=String(r.reportDate||r.savedAt||'');
    const day=raw.slice(0,10);
    return (!f||day>=f)&&(!t||day<=t)&&(!c||reportOwnerMI(r)===c)&&(!tr||String(r.trainNo||'').toLowerCase().includes(tr));
  });
}

function damageTotalsMI(reports){
  const out={};
  reports.forEach(r=>r.wagons.forEach(w=>wagonDamagesMI(w,r).forEach(d=>{
    const k=String(d?.k||'').trim(); const v=Number(d?.v||0);
    if(k&&Number.isFinite(v)&&v>0){const label=miLabel(k);out[label]=(out[label]||0)+v;}
  })));
  return out;
}
function typeTotalsMI(reports){
  const out={};
  reports.forEach(r=>r.wagons.forEach(w=>{
    const k=String(w.wagonType||w.type||'').trim(); if(k) out[k]=(out[k]||0)+1;
  }));
  return out;
}
function updateCompaniesMI(){
  const sel=document.getElementById('companyFilter'); if(!sel)return;
  const old=sel.value;
  const companies=[...new Set(miReports.map(reportOwnerMI).filter(Boolean))].sort();
  sel.innerHTML='<option value="">All Companies</option>'+companies.map(c=>`<option value="${escMI(c)}">${escMI(c)}</option>`).join('');
  if(companies.includes(old))sel.value=old;
}
function cardMI(title,value,icon,sub=''){
  return `<div class="col-sm-6 col-lg"><div class="mi-stat"><div class="mi-stat-label"><i class="bi ${icon}"></i> ${escMI(title)}</div><div class="mi-stat-value">${escMI(value)}</div>${sub?`<div class="mi-stat-sub">${escMI(sub)}</div>`:''}</div></div>`;
}
function renderStatsMI(a,damages,types){
  const trains=new Set(a.map(r=>String(r.trainNo||'').trim()).filter(Boolean));
  const companies=new Set(a.map(reportOwnerMI).filter(Boolean));
  const mostDamage=topEntryMI(damages);
  const mostType=topEntryMI(types);
  const now=new Date(); const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthReports=a.filter(r=>dateKeyMI(r)===ym).length;
  const monthWagons=a.filter(r=>dateKeyMI(r)===ym).reduce((n,r)=>n+r.wagons.length,0);
  document.getElementById('stats').innerHTML=[
    cardMI('Total Reports',a.length,'bi-files','Selected period'),
    cardMI('Damaged Wagons',a.reduce((n,r)=>n+r.wagons.length,0),'bi-train-freight-front','Recorded wagon entries'),
    cardMI('Companies',companies.size,'bi-buildings','Companies represented'),
    cardMI('Unique Trains',trains.size,'bi-train-front','Distinct train numbers'),
    cardMI('Most Common Damage',mostDamage?miLabel(mostDamage[0]):'—','bi-tools',mostDamage?`${mostDamage[1]} occurrences`:''),
    cardMI('Most Affected Wagon Type',mostType?mostType[0]:'—','bi-box-seam',mostType?`${mostType[1]} wagon entries`:''),
    cardMI('This Month',monthReports,'bi-calendar-check',`${monthWagons} damaged wagons`)
  ].join('');
}
function renderTrendMI(a){
  const host=document.getElementById('trendChart');
  const map={};
  a.forEach(r=>{const k=dateKeyMI(r);if(!map[k])map[k]={reports:0,wagons:0};map[k].reports++;map[k].wagons+=r.wagons.length;});
  const keys=Object.keys(map).filter(k=>k!=='Unknown').sort();
  if(!keys.length){host.innerHTML='<div class="mi-empty">No dated report data for the selected filters.</div>';return;}
  const max=Math.max(...keys.map(k=>Math.max(map[k].reports,map[k].wagons)),1);
  host.innerHTML=`<div class="trend-list">${keys.map(k=>{
    const [y,m]=k.split('-');const label=new Date(Number(y),Number(m)-1,1).toLocaleString('en-IN',{month:'short',year:'numeric'});
    const p=Math.round(map[k].reports/max*100),w=Math.round(map[k].wagons/max*100);
    return `<div class="trend-row"><div class="trend-month">${escMI(label)}</div><div class="trend-series"><div class="trend-line"><span>Reports</span><div class="trend-track"><i style="width:${p}%"></i></div><b>${map[k].reports}</b></div><div class="trend-line"><span>Wagons</span><div class="trend-track wagon"><i style="width:${w}%"></i></div><b>${map[k].wagons}</b></div></div></div>`;
  }).join('')}</div><div class="mi-legend"><span><i class="legend-dot report"></i> Reports</span><span><i class="legend-dot wagon"></i> Damaged Wagons</span></div>`;
}
function renderDamageMI(d){
  const host=document.getElementById('damageChart');
  const entries=Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,10);
  if(!entries.length){host.innerHTML='<div class="mi-empty">No quantified damage data for the selected filters.</div>';return;}
  const max=Math.max(entries[0][1],1);
  host.innerHTML=entries.map(([k,v])=>`<div class="damage-row"><div class="damage-head"><span title="${escMI(k)}">${escMI(k)}</span><b>${v}</b></div><div class="damage-track"><i style="width:${Math.max(2,Math.round(v/max*100))}%"></i></div></div>`).join('');
}
function renderCompanyMI(a){
  const map={};
  a.forEach(r=>{const c=reportOwnerMI(r);map[c]??={reports:0,wagons:0,d:{}};map[c].reports++;map[c].wagons+=r.wagons.length;Object.entries(damageTotalsMI([r])).forEach(([k,v])=>map[c].d[k]=(map[c].d[k]||0)+v);});
  const rows=Object.entries(map).sort((x,y)=>y[1].wagons-x[1].wagons);
  const total=rows.reduce((n,[,v])=>n+v.wagons,0);
  document.querySelector('#companyTable tbody').innerHTML=rows.map(([c,v],i)=>`<tr><td><strong>${i+1}</strong>&nbsp; ${escMI(c)}</td><td>${v.reports}</td><td>${v.wagons}</td><td>${total?Math.round(v.wagons/total*100)+'%':'0%'}</td><td>${escMI(topEntryMI(v.d)?.[0]||'—')}</td></tr>`).join('')||'<tr><td colspan="5" class="text-center text-muted py-4">No data for the selected filters.</td></tr>';
}
function renderAlertsMI(a,damages){
  const wm={},tm={};
  a.forEach(r=>{const t=String(r.trainNo||'').trim();if(t)tm[t]=(tm[t]||0)+1;r.wagons.forEach(w=>{const n=String(w.wagonNo||w.wagonNumber||'').trim();if(n)wm[n]=(wm[n]||0)+1;});});
  const alerts=[];
  Object.entries(wm).filter(x=>x[1]>1).sort((x,y)=>y[1]-x[1]).slice(0,5).forEach(x=>alerts.push(`<div class="mi-alert danger"><i class="bi bi-exclamation-triangle-fill"></i><div><strong>Repeated Wagon</strong><br>Wagon ${escMI(x[0])} appears in <b>${x[1]}</b> damage records.</div></div>`));
  Object.entries(tm).filter(x=>x[1]>1).sort((x,y)=>y[1]-x[1]).slice(0,5).forEach(x=>alerts.push(`<div class="mi-alert warning"><i class="bi bi-train-front-fill"></i><div><strong>Repeated Train</strong><br>Train ${escMI(x[0])} has <b>${x[1]}</b> reports.</div></div>`));
  const td=Object.entries(damages).sort((x,y)=>y[1]-x[1]);
  if(td.length&&a.length){const share=td[0][1]; if(share>=Math.max(10,a.reduce((n,r)=>n+r.wagons.length,0)*0.5)) alerts.push(`<div class="mi-alert info"><i class="bi bi-bar-chart-fill"></i><div><strong>Recurring Damage</strong><br>${escMI(td[0][0])} is the dominant quantified damage (${td[0][1]} occurrences).</div></div>`);}
  document.getElementById('alerts').innerHTML=alerts.join('')||'<div class="mi-empty">No repeated wagon, train, or dominant-damage alerts for the selected period.</div>';
}
function renderRecentMI(a){
  const rows=[...a].sort((x,y)=>reportDateMI(y)-reportDateMI(x)).slice(0,8);
  document.getElementById('recentActivity').innerHTML=rows.map(r=>{
    const id=String(r.reportId||'');
    const q=id?`?reportId=${encodeURIComponent(id)}`:'';
    return `<div class="recent-item"><div><strong>${escMI(r.trainNo||'Train not recorded')}</strong> <span class="mi-pill">${escMI(reportOwnerMI(r))}</span></div><div class="small text-muted">${displayDateMI(r)} • ${r.wagons.length} damaged wagon(s)${r.reportReference?` • ${escMI(r.reportReference)}`:''}</div><div class="mt-2"><a class="btn btn-sm btn-outline-primary" href="damage-history.html${q}">View History</a></div></div>`;
  }).join('')||'<div class="mi-empty">No recent activity for the selected filters.</div>';
}
function renderMI(){
  const a=getFilteredMI();
  const damages=damageTotalsMI(a),types=typeTotalsMI(a);
  renderStatsMI(a,damages,types);renderTrendMI(a);renderDamageMI(damages);renderCompanyMI(a);renderAlertsMI(a,damages);renderRecentMI(a);
  const now=new Date();
  document.getElementById('lastUpdated').textContent=now.toLocaleString('en-IN');
  document.getElementById('syncStatus').textContent=`${a.length} report${a.length===1?'':'s'} in view • ${miReports.length} live records loaded`;
  document.getElementById('miLoading').textContent=`Dashboard ready • ${miReports.length} central report${miReports.length===1?'':'s'}`;
}
function applyFiltersMI(){renderMI();}
function clearFiltersMI(){['fromDate','toDate','trainFilter'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});const c=document.getElementById('companyFilter');if(c)c.value='';renderMI();}
async function syncMI(){
  const status=document.getElementById('syncStatus');
  try{
    if(!window.PRDMSCloud||typeof PRDMSCloud.getReports!=='function')throw new Error('Central database bridge unavailable');
    const live=await Promise.race([PRDMSCloud.getReports(),new Promise((_,rej)=>setTimeout(()=>rej(new Error('Central database timeout')),10000))]);
    if(Array.isArray(live)){miReports=live.map(normalizeReport);updateCompaniesMI();renderMI();return;}
    throw new Error('Central database returned no report list');
  }catch(e){
    console.warn('PDRMS Management Intelligence sync failed:',e);
    if(!miReports.length)miReports=readCacheMI();
    updateCompaniesMI();renderMI();
    if(status)status.textContent=miReports.length?`Cached/local data • ${miReports.length} reports • central sync unavailable`:'No report data available';
  }
}
function initManagementDashboard(){
  const apply=document.getElementById('applyFilters'),clear=document.getElementById('clearFilters'),train=document.getElementById('trainFilter');
  if(apply)apply.addEventListener('click',applyFiltersMI);
  if(clear)clear.addEventListener('click',clearFiltersMI);
  if(train)train.addEventListener('keydown',e=>{if(e.key==='Enter')renderMI();});
  miReports=readCacheMI();updateCompaniesMI();renderMI();
  syncMI();
  if(miRefreshTimer)clearInterval(miRefreshTimer);
  miRefreshTimer=setInterval(syncMI,60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initManagementDashboard,{once:true});else initManagementDashboard();
