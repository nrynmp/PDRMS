let wagonReports=[]; let allCompanyReports=[];
async function loadPassport(){
 const no=document.getElementById('wagon').value.trim(); const out=document.getElementById('passport');
 if(!no){out.innerHTML='<div class="alert alert-warning">Please enter a wagon number.</div>';return}
 const hits=wagonReports.flatMap(r=>(r.wagons||[]).filter(w=>String(w.wagonNo||w.wagonNumber||'')===no).map(w=>({r,w})));
 if(!hits.length){
   const existsElsewhere=allCompanyReports.some(r=>(r.wagons||[]).some(w=>String(w.wagonNo||w.wagonNumber||'')===no));
   out.innerHTML=`<div class="card"><div class="card-body text-center py-4"><h5>${existsElsewhere?'🚫 Not in Your Company’s Wagon List in NRY/NMP':'No Wagon Record Found'}</h5><p class="text-muted mb-0">${existsElsewhere?'This wagon is not associated with your company records in NRY/NMP.':'No matching wagon record is available in the PDRMS database.'}</p></div></div>`;
   return;
 }
 const defects={};hits.forEach(x=>wagonDamages(x.w,x.r).forEach(d=>defects[d.k]=(defects[d.k]||0)+d.v));
 out.innerHTML=`<div class="card"><div class="card-body"><div class="d-flex justify-content-between flex-wrap gap-2"><div><h4>🚃 Wagon Damage Passport</h4><h5>Wagon No: ${esc(no)}</h5></div><span class="badge text-bg-primary align-self-start">${hits.length} record(s)</span></div><p>Times Recorded: <b>${hits.length}</b></p><h5>Damage Timeline</h5><ul>${hits.map(x=>`<li>${esc(reportDate(x.r))} — ${wagonDamages(x.w,x.r).map(d=>esc(d.k)+': '+d.v).join(', ')||'Damage details not quantified'}</li>`).join('')}</ul><h5>Repeated Defects</h5>${Object.entries(defects).sort((a,b)=>b[1]-a[1]).map(x=>`<div>${esc(x[0])}: <b>${x[1]}</b></div>`).join('')||'<div class="text-muted">No quantified repeated defects available.</div>'}</div></div>`;
}
(async()=>{const u=PRDMSAuth.current();if(!u||u.role!=='Company'){location.replace('../login.html');return}const aliases=(PDRMS_COMPANIES[u.companyId||u.id]?.aliases||[]).map(x=>x.toUpperCase());allCompanyReports=await portalReports();wagonReports=allCompanyReports.filter(r=>aliases.includes(reportOwner(r)))})();
