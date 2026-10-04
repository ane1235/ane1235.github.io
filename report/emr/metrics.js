export const TOTAL=3653;
export const RESTART=Date.parse('2026-10-04T22:19:00+09:00');
const START='2015-01-01',END='2024-12-31';
const DONE=new Set(['SAVED_VERIFIED','NO_DATA_CONFIRMED']);
const KNOWN=new Set([...DONE,'STARTED','RETRY_PENDING','FAILED','QUERY_CONFIRMED','SAVE_PENDING']);
const dayMS=86400000;
function validDay(s){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
export function parseLog(text){
 const records=[],seen=new Set(),warnings={conflicts:0,missing:0,malformed:0,out_of_range:0};
 for(const line of text.split(/\r?\n/)){
  if(!/^\s*\|\s*\d{4}-\d{2}-\d{2}/.test(line))continue;
  const c=line.split('|').slice(1,-1).map(s=>s.trim());
  const stamp=Date.parse((c[0]||'').replace(' ','T')+'+09:00');
  if(c.length!==8||!KNOWN.has(c[5])||!validDay(c[1])||!Number.isFinite(stamp)||new Date(stamp+9*3600000).toISOString().slice(0,19)!==c[0].replace(' ','T')){warnings.malformed++;continue;}
  if(c[1]<START||c[1]>END){warnings.out_of_range++;continue;}
  const key=JSON.stringify([stamp,c[1],c[2],c[5]]);
  if(!seen.has(key)){seen.add(key);records.push({time:stamp,day:c[1],stage:c[5]});}
 }
 if(!records.length)throw Error('NO_VALID_ROWS');
 records.sort((a,b)=>a.time-b.time);
 const completed=new Map(),terminal=new Map(),conflicts=new Set();
 for(const r of records){if(DONE.has(r.stage)){if(completed.has(r.day)&&completed.get(r.day)!==r.stage)conflicts.add(r.day);completed.set(r.day,r.stage);terminal.set(r.day,r.stage);}else if(r.stage==='FAILED')terminal.set(r.day,r.stage);}
 let unresolved=0;for(const [day,stage] of terminal){if(stage==='FAILED'){unresolved++;completed.delete(day);}}
 let contiguous=Date.parse(START),through=null;
 while(completed.has(new Date(contiguous).toISOString().slice(0,10))){through=new Date(contiguous).toISOString().slice(0,10);contiguous+=dayMS;}
 const saved=[...completed.values()].filter(s=>s==='SAVED_VERIFIED').length;
 const latest=records.at(-1),high=[...completed.keys()].sort().at(-1);
 warnings.conflicts=conflicts.size;warnings.missing=high?Math.round((Date.parse(high)-Date.parse(START))/dayMS)+1-completed.size:0;
 return {total:TOTAL,completed:completed.size,saved,no_data:completed.size-saved,percent:Math.round(completed.size/TOTAL*1000)/10,completed_through:through,current_date:latest.day,stage:latest.stage,log_time:new Date(latest.time).toISOString(),failures:records.filter(r=>r.time>=RESTART&&r.stage==='FAILED').length,unresolved_failures:unresolved,warnings};
}
export function intervalDelta(samples,now){
 const old=samples.filter(s=>now-s.time>=600000&&now-s.time<=690000).at(-1);
 if(!old)return null;
 const latest=samples.at(-1),result={seconds:Math.round((latest.time-old.time)/1000),from:old.time,to:latest.time};
 for(const key of ['completed','saved','no_data','failures']){result[key]=latest.metrics[key]-old.metrics[key];if(result[key]<0)return null;}
 return result;
}
export function classify(metrics,lastSuccess,now){
 if(!metrics)return 'WAITING';
 if(now-lastSuccess>150000)return 'READ_STALE';
 const age=now-Date.parse(metrics.log_time);
 if(age< -120000||Object.values(metrics.warnings).some(Boolean))return 'CHECK';
 if(metrics.unresolved_failures)return 'FAILED';
 if(metrics.completed===TOTAL)return 'COMPLETE';
 return age>180000?'STALE':'ACTIVE';
}
