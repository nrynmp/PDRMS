(async()=>{
 const u=PRDMSAuth.current(), train=new URLSearchParams(location.search).get('train');
 if(!u||u.role!=='Company'){location.replace('../login.html');return}
 const aliases=(PDRMS_COMPANIES[u.companyId||u.id]?.aliases||[]).map(x=>x.toUpperCase());
 const rs=(await portalReports()).filter(r=>aliases.includes(reportOwner(r))&&String(r.trainNo||'')===String(train||''));
 if(!rs.length){document.getElementById('passport').innerHTML='<div class="alert alert-warning">No train profile found in your company records.</div>';return}
 const wagons=rs.flatMap(r=>r.wagons||[]), damagedCount=rs.reduce((n,r)=>n+damagedWagonCount(r),0);
 const unique=new Set(wagons.map(w=>String(w.wagonNo||w.wagonNumber||'').trim()).filter(Boolean));
 const defects={};rs.forEach(r=>(r.wagons||[]).forEach(w=>wagonDamages(w,r).forEach(d=>defects[d.k]=(defects[d.k]||0)+d.v)));
 const top=Object.entries(defects).sort((a,b)=>b[1]-a[1]).slice(0,10);
 const sorted=[...rs].sort((a,b)=>String(reportDate(a)).localeCompare(String(reportDate(b))));
 document.getElementById('passport').innerHTML=`<div class="card"><div class="card-body"><div class="eyebrow">TRAIN DAMAGE PROFILE</div><h3>🚆 Train No: ${esc(train)}</h3><p>Owner: ${esc(PDRMS_COMPANIES[u.companyId||u.id]?.name)}</p><div class="row g-3"><div class="col-md-3"><b>${rs.length}</b><br>Total Reports</div><div class="col-md-3"><b>${unique.size}</b><br>Unique Wagons Recorded</div><div class="col-md-3"><b>${damagedCount}</b><br>Damaged Wagons Recorded</div><div class="col-md-3"><b>${esc(reportDate(sorted[0]))}</b><br>First Record</div></div></div></div><div class="card mt-3"><div class="card-body"><h5>Most Frequent Defects</h5>${top.map(x=>`<div>${esc(x[0])}: <b>${x[1]}</b></div>`).join('')||'No quantified damage data.'}</div></div><div class="card mt-3"><div class="card-body"><h5>Examination / Damage Timeline</h5><ul>${[...rs].sort((a,b)=>String(reportDate(b)).localeCompare(String(reportDate(a)))).map(r=>`<li>${esc(reportDate(r))} — ${reportDamagedForTrain(r)} damaged wagon record(s)</li>`).join('')}</ul></div></div>`;
})();
function reportDamagedForTrain(r){return damagedWagonCount(r)}
