async function portalReports(){
  try { return await PRDMSCloud.getReports(); }
  catch(e){ try { return JSON.parse(localStorage.getItem('PRDMS_REPORT_HISTORY')||'[]'); } catch(_){ return []; } }
}

function reportOwner(r){
  const direct = String(r.owner||r.rly||r.ownerRly||r.company||'').trim();
  if (direct) return direct.toUpperCase();
  const counts = {};
  (r.wagons||[]).forEach(w=>{
    const o=String(w.orly||w.owner||w.rly||'').trim().toUpperCase();
    if(o) counts[o]=(counts[o]||0)+1;
  });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
}

function reportDate(r){ return r.reportDate||r.savedAt||''; }

/*
 * Read damage exactly from the real PDRMS wagon structure.
 * Normal repair quantities are stored in wagon.repairs, while
 * Panel/Floor Fitted details are stored in wagon.fittedDetails.
 */
function wagonDamages(w, report){
  const totals = {};
  const metadata = new Set([
    'id','position','examinationPosition','_bpcIndex','serialNo','slNo','sl','srNo',
    'wagonNo','wagonNumber','wagonType','type','orly','owner','rly','remarks',
    'incomingDamage','incomingDamages','bpcSrNo','bpcIndex','createdAt','updatedAt'
  ]);

  const repairs = (w && typeof w.repairs === 'object' && w.repairs) ? w.repairs : {};
  const configured = Array.isArray(report?.repairColumns) ? report.repairColumns : [];
  const repairKeys = configured.length ? configured : Object.keys(repairs);

  repairKeys.forEach(k=>{
    if(!k || metadata.has(String(k))) return;
    // Panel/Floor Fitted are represented through fittedDetails below.
    if(k === 'Panel Fitted' || k === 'Floor Fitted') return;
    const v = Number(repairs[k] ?? w?.[k] ?? 0);
    if(Number.isFinite(v) && v > 0) totals[k] = (totals[k]||0) + v;
  });

  // Backward-compatible fallback for old reports that may have direct repair keys.
  if(!Object.keys(repairs).length && !configured.length){
    Object.entries(w||{}).forEach(([k,raw])=>{
      if(metadata.has(k) || k === 'repairs' || k === 'fittedDetails') return;
      const v=Number(raw);
      if(Number.isFinite(v) && v>0) totals[k]=(totals[k]||0)+v;
    });
  }

  // Special Panel/Floor fitted records are actual PDRMS damage/repair entries.
  if(Array.isArray(w?.fittedDetails)){
    w.fittedDetails.forEach(item=>{
      const name=String(item?.item||'').trim();
      if(!name) return;
      const key=name;
      totals[key]=(totals[key]||0)+1;
    });
  }

  return Object.entries(totals).map(([k,v])=>({k,v}));
}

// In PDRMS only damaged wagons are entered into a Damage Report.
// Therefore every wagon record is a damaged-wagon record, even when a
// particular repair quantity is zero or represented by descriptive details.
function damagedWagonCount(report){
  return Array.isArray(report?.wagons) ? report.wagons.length : 0;
}

function esc(v){ return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
