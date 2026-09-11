/* PDRMS Train Intelligence - Admin/User/Company compatible */
let trainReportsMI=[];
const TRAIN_LABELS={"Lock Lifter Handle Change":"CBC Operating Handle (LLH) Change","Lock Lifter Handle Repair":"CBC Operating Handle (LLH) Repair"};
function tEsc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function tArr(v){if(Array.isArray(v))return v;if(typeof v==='string'){try{const x=JSON.parse(v);return Array.isArray(x)?x:[]}catch(_){return[]}}return[]}
function tLabel(v){return TRAIN_LABELS[String(v||'').trim()]||String(v||'').trim()}
function tOwner(r){return typeof reportOwner==='function'?String(reportOwner(r)||'').toUpperCase():String(r.owner||r.rly||r.company||'UNKNOWN').toUpperCase()}
function tDate(r){return String(r.reportDate||r.savedAt||'').slice(0,10)||'—'}
function tDamages(r){const o={};tArr(r.wagons).forEach(w=>(typeof wagonDamages==='function'?wagonDamages(w,r):[]).forEach(d=>{const k=tLabel(d.k);const v=Number(d.v||0);if(k&&v)o[k]=(o[k]||0)+v;}));return o}
function trainAllowed(r){const u=PRDMSAuth.current();if(!u)return false;if(u.role!=='Company')return true;const aliases=(PDRMS_COMPANIES[u.companyId||u.id]?.aliases||[]).map(x=>String(x).toUpperCase());return aliases.includes(tOwner(r));}
async function loadTrainData(){
 const u=PRDMSAuth.current();if(!u){location.replace('../login.html');return;}
 let rs=[];try{rs=await portalReports();}catch(_){rs=[]}
 trainReportsMI=rs.filter(trainAllowed).map(r=>({...r,wagons:tArr(r.wagons)}));
 const input=document.getElementById('trainSearch'), q=new URLSearchParams(location.search).get('train');
 if(q){input.value=q;renderTrainSearch(q);}else renderTrainSearch('');
}
function renderTrainSearch(q){
 const out=document.getElementById('passport'), term=String(q||'').trim().toLowerCase();
 if(!term){out.innerHTML='<div class="alert alert-info">Enter a Train No. above to view Train Intelligence.</div>';return;}
 const hits=trainReportsMI.filter(r=>String(r.trainNo||'').toLowerCase().includes(term));
 if(!hits.length){out.innerHTML='<div class="alert alert-warning">No matching train record found in the available PDRMS data.</div>';return;}
 const groups={};hits.forEach(r=>{const k=String(r.trainNo||'').trim()||'Unknown';(groups[k]??=[]).push(r);});
 out.innerHTML=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).map(([train,rs])=>{
   const wagons=rs.flatMap(r=>r.wagons),unique=new Set(wagons.map(w=>String(w.wagonNo||w.wagonNumber||'').trim()).filter(Boolean));
   const dmg={};rs.forEach(r=>Object.entries(tDamages(r)).forEach(([k,v])=>dmg[k]=(dmg[k]||0)+v));
   const top=Object.entries(dmg).sort((a,b)=>b[1]-a[1]).slice(0,8);
   return `<div class="card mb-3"><div class="card-body"><div class="d-flex justify-content-between flex-wrap gap-2"><div><div class="text-muted small">TRAIN INTELLIGENCE</div><h3>${tEsc(train)}</h3><div>Owner: ${tEsc(tOwner(rs[0]))}</div></div><span class="badge text-bg-primary align-self-start">${rs.length} report(s)</span></div><div class="row g-3 mt-2"><div class="col-md-3"><b>${rs.length}</b><br><span class="text-muted">Reports</span></div><div class="col-md-3"><b>${unique.size}</b><br><span class="text-muted">Unique Wagons</span></div><div class="col-md-3"><b>${wagons.length}</b><br><span class="text-muted">Damaged Wagons</span></div><div class="col-md-3"><b>${tEsc(tDate(rs.slice().sort((a,b)=>tDate(a).localeCompare(tDate(b)))[0]))}</b><br><span class="text-muted">First Record</span></div></div><hr><h5>Most Frequent Damage</h5>${top.map(x=>`<div class="d-flex justify-content-between border-bottom py-2"><span>${tEsc(x[0])}</span><b>${x[1]}</b></div>`).join('')||'<div class="text-muted">No quantified damage data.</div>'}<hr><h5>Examination / Damage Timeline</h5><ul class="mb-0">${rs.slice().sort((a,b)=>tDate(b).localeCompare(tDate(a))).map(r=>`<li>${tEsc(tDate(r))} — ${r.wagons.length} damaged wagon record(s) • ${tEsc(r.reportReference||'PDRMS report')}</li>`).join('')}</ul></div></div>`;
 }).join('');
}
document.addEventListener('DOMContentLoaded',()=>{const input=document.getElementById('trainSearch'),btn=document.getElementById('trainSearchBtn');if(input)input.addEventListener('keydown',e=>{if(e.key==='Enter')renderTrainSearch(input.value)});if(btn)btn.addEventListener('click',()=>renderTrainSearch(input.value));loadTrainData();});
