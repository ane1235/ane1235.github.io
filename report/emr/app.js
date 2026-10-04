import {CLIENT_ID} from './config.js';
import {parseLog,intervalDelta,classify,TOTAL} from './metrics.js';
const SCOPE='https://www.googleapis.com/auth/drive.readonly';
const LOG_NAME='EMR_2015-2024_실행로그.md',STATE_NAME='EMR_current_state.md';
const API='https://www.googleapis.com/drive/v3/files';
const $=id=>document.getElementById(id),fmt=n=>n==null?'—':Number(n).toLocaleString('ko-KR');
const clock=t=>t?new Date(t).toLocaleString('sv-SE',{timeZone:'Asia/Seoul'}).slice(5):'—';
const labels={ACTIVE:'로그 갱신 중',COMPLETE:'완료',STALE:'로그 지연',CHECK:'확인 필요',FAILED:'실패 기록',SOURCE_ERROR:'읽기 오류',READ_STALE:'읽기 지연',WAITING:'읽는 중',AUTH:'재연결 필요',SIGNED_OUT:'로그인 필요',SETUP:'설정 필요'};
const stages={STARTED:'조회 시작',QUERY_CONFIRMED:'조회 확인',SAVE_PENDING:'저장 대기',SAVED_VERIFIED:'저장 완료',NO_DATA_CONFIRMED:'자료없음',RETRY_PENDING:'재시도',FAILED:'실패'};
// Access tokens and source text are never written to storage, URLs, or logs.
let accessToken='',expiresAt=0,tokenClient=null,authPending=false,busy=false,session=0;
let metrics=null,samples=[],delta=null,lastSuccess=0,lastAttempt=0,sourceModified=null,stateModified=null;
let source=null,stateFile=null,version=null,nextStateRead=0,nextPoll=0,error='',authRequired=false;
let gisReady=false,gisFailed=false,readStep='',failureStep='',httpStatus=0;
function message(code){return ({API_DISABLED:'Google Cloud 프로젝트에서 Google Drive API를 사용 설정해 주세요.',RATE_LIMIT:'Google 요청 한도에 도달했습니다. 잠시 후 다시 읽어 주세요.',POLICY:'Google 계정의 조직 정책으로 Drive 접근이 차단됐습니다.',BAD_REQUEST:'Drive 요청 형식을 확인해야 합니다.',NO_FILE:'진행 로그를 찾을 수 없습니다. 연결한 Google 계정을 확인해 주세요.',MULTIPLE_FILES:'동일한 이름의 로그가 여러 개여서 자동 선택하지 않았습니다.',NO_DOWNLOAD:'로그 읽기 권한이 없습니다.',NO_VALID_ROWS:'해석할 수 있는 로그가 없습니다.',AUTH:'인증이 만료됐습니다. Drive 재연결을 눌러 주세요.',DENIED:'Drive 읽기 권한 승인이 필요합니다.',POPUP:'로그인 창이 닫혔거나 차단됐습니다. 다시 연결해 주세요.',NETWORK:'Google 연결 실패 · 마지막 확인값',SETUP:'웹용 Google Client ID 설정이 필요합니다.',GIS:'Google 로그인 모듈에 연결할 수 없습니다.',TOO_LARGE:'로그 크기가 허용 범위를 초과했습니다.',SOURCE_ERROR:'Drive 읽기 실패 · 마지막 확인값'})[code]||'Drive 읽기 실패 · 마지막 확인값';}
function render(){
 const now=Date.now();if(accessToken&&now>=expiresAt){accessToken='';authRequired=true;error='AUTH';samples=[];delta=null;}
 let status=!CLIENT_ID?'SETUP':authRequired?'AUTH':!accessToken?'SIGNED_OUT':error?'SOURCE_ERROR':classify(metrics,lastSuccess,now);
 $('status').textContent=labels[status];$('status').dataset.state=status;
 $('connect').textContent=authPending?'연결 중…':accessToken?'계정 변경':authRequired?'Drive 재연결':'Drive 연결';
 $('connect').disabled=authPending||busy||!CLIENT_ID||!gisReady;$('refresh').disabled=!accessToken||busy;
 $('disconnect').hidden=!accessToken&&!metrics;
 const warnings=[];
 if(!CLIENT_ID)warnings.push(message('SETUP'));else if(gisFailed)warnings.push(message('GIS'));else if(error)warnings.push(message(error));else if(!accessToken)warnings.push('Drive 연결 후 60초마다 갱신합니다.');
 if(status==='STALE')warnings.push('최근 로그 지연 · 추출 중단 여부 미확인');
 if(status==='READ_STALE')warnings.push('브라우저 읽기 지연 · 마지막 확인값');
 if(metrics){
  const m=metrics;
  $('percent').replaceChildren(document.createTextNode(m.percent.toFixed(1)),Object.assign(document.createElement('small'),{textContent:'%'}));
  for(const [id,key] of [['completed','completed'],['saved','saved'],['noData','no_data'],['failures','failures']])$(id).textContent=fmt(m[key]);
  $('failures').classList.toggle('bad',m.failures>0);$('bar').value=m.completed;
  $('through').textContent=m.completed_through||'—';$('current').textContent=m.current_date;$('stage').textContent=stages[m.stage]||'—';
  $('delta').textContent=delta?`${(delta.seconds/60).toFixed(1).replace('.0','')}분 · +${fmt(delta.completed)}일`:'10분 · 측정 중';
  $('updated').textContent=`로그 ${clock(m.log_time)} KST`;
  let eta='산출 대기';if(status==='ACTIVE'&&delta?.completed>0)eta='약 '+clock(now+(TOTAL-m.completed)*delta.seconds*1000/delta.completed).slice(0,-3);
  const entries=[['Drive 수정',clock(sourceModified)],['읽기 성공',clock(lastSuccess)],['읽기 시도',clock(lastAttempt)],['보조 상태 수정',clock(stateModified)],['관측 구간',delta?`${clock(delta.from)} → ${clock(delta.to)}`:'측정 중'],['구간 저장 / 자료없음',delta?`${delta.saved} / ${delta.no_data}일`:'—'],['구간 신규 실패',delta?`${delta.failures}건`:'—'],['완료 예상',eta],['갱신 간격','60초 · 백그라운드 탭은 지연 가능'],['인증 유효 시간',accessToken?`약 ${Math.max(0,Math.ceil((expiresAt-now)/60000))}분`:'재연결 필요']];
  $('details').replaceChildren(...entries.flatMap(([k,v])=>[Object.assign(document.createElement('dt'),{textContent:k}),Object.assign(document.createElement('dd'),{textContent:v})]));
  if(Object.values(m.warnings).some(Boolean))warnings.push(`누락 ${m.warnings.missing} · 충돌 ${m.warnings.conflicts} · 형식 ${m.warnings.malformed} · 범위 밖 ${m.warnings.out_of_range}`);
 }
 const diagnosis=error?`${failureStep||'인증'} · ${error}${httpStatus?' · HTTP '+httpStatus:''}`:'';
 $('status').title=error?message(error)+' ('+diagnosis+')':'';
 $('notice').hidden=!warnings.length;$('notice').textContent=warnings.join(' / ')+(diagnosis?' ['+diagnosis+']':'');
}
async function drive(url,asText=false){
 if(!accessToken||Date.now()>=expiresAt)throw Error('AUTH');
 const r=await fetch(url,{headers:{Authorization:'Bearer '+accessToken},cache:'no-store',signal:AbortSignal.timeout(15000),credentials:'omit'});
 if(!r.ok){
  httpStatus=r.status;
  // Classify only documented reason codes; never display raw response text.
  let body={};try{body=await r.json();}catch{}
  const reasons=[...(Array.isArray(body.error?.errors)?body.error.errors:[]),...(Array.isArray(body.error?.details)?body.error.details:[])].map(e=>e.reason);
  if(r.status===401)throw Error('AUTH');
  if(reasons.some(x=>['accessNotConfigured','SERVICE_DISABLED'].includes(x)))throw Error('API_DISABLED');
  if(r.status===429||reasons.some(x=>['rateLimitExceeded','userRateLimitExceeded','dailyLimitExceeded','RATE_LIMIT_EXCEEDED'].includes(x)))throw Error('RATE_LIMIT');
  if(reasons.includes('domainPolicy'))throw Error('POLICY');
  if(r.status===403)throw Error('DENIED');
  if(r.status===404)throw Error('NO_FILE');
  if(r.status===400)throw Error('BAD_REQUEST');
  throw Error('SOURCE_ERROR');
 }
 if(asText){if(Number(r.headers.get('Content-Length'))>33554432)throw Error('TOO_LARGE');const text=await r.text();if(text.length>33554432)throw Error('TOO_LARGE');return text;}
 return r.json();
}
async function findSources(){
 const q=`trashed = false and (name = '${LOG_NAME}' or name = '${STATE_NAME}')`;
 const params=new URLSearchParams({q,fields:'files(id,name,mimeType,modifiedTime),nextPageToken',pageSize:'100'});
 const found=await drive(API+'?'+params),logs=found.files.filter(f=>f.name===LOG_NAME);
 if(found.nextPageToken||logs.length>1)throw Error('MULTIPLE_FILES');if(!logs.length)throw Error('NO_FILE');
 const states=found.files.filter(f=>f.name===STATE_NAME);return {log:logs[0],state:states.length===1?states[0]:null};
}
async function poll(){
 if(busy||!accessToken)return;busy=true;const generation=session;lastAttempt=Date.now();render();
 try{
  httpStatus=0;readStep='파일 검색';
  if(!source){const found=await findSources();if(generation!==session)return;source=found.log;stateFile=found.state;stateModified=stateFile?.modifiedTime||null;}
  readStep='로그 정보';
  const meta=await drive(API+'/'+encodeURIComponent(source.id)+'?fields=id,modifiedTime,size,version,capabilities(canDownload)');
  if(generation!==session)return;
  if(meta.capabilities?.canDownload===false)throw Error('NO_DOWNLOAD');
  const v=String(meta.version||meta.modifiedTime)+'|'+meta.size;
  let next=metrics;if(!metrics||v!==version){readStep='로그 읽기';const text=await drive(API+'/'+encodeURIComponent(source.id)+'?alt=media',true);readStep='로그 해석';next=parseLog(text);}
  if(generation!==session||!accessToken)return;
  const now=Date.now();if(lastSuccess&&now-lastSuccess>150000)samples=[];
  metrics=next;version=v;sourceModified=meta.modifiedTime;lastSuccess=now;error='';failureStep='';httpStatus=0;
  samples=samples.filter(s=>now-s.time<=750000);samples.push({time:now,metrics});delta=intervalDelta(samples,now);
  if(stateFile&&now>=nextStateRead){try{const m=await drive(API+'/'+encodeURIComponent(stateFile.id)+'?fields=modifiedTime');if(generation===session)stateModified=m.modifiedTime;}catch{httpStatus=0;/* Auxiliary state never replaces the progress log. */}nextStateRead=Date.now()+300000;}
 }catch(e){if(generation===session){failureStep=readStep;const safe=['API_DISABLED','RATE_LIMIT','POLICY','BAD_REQUEST','AUTH','DENIED','NO_FILE','MULTIPLE_FILES','NO_DOWNLOAD','NO_VALID_ROWS','TOO_LARGE','SOURCE_ERROR'];error=safe.includes(e.message)?e.message:'NETWORK';samples=[];delta=null;if(error==='AUTH'){accessToken='';authRequired=true;}}}
 finally{busy=false;nextPoll=generation===session?lastAttempt+60000:0;render();}
}
function clearData(){failureStep='';httpStatus=0;metrics=null;samples=[];delta=null;lastSuccess=0;source=null;stateFile=null;version=null;sourceModified=null;stateModified=null;nextStateRead=0;for(const id of ['completed','saved','noData','failures','through','current','stage'])$(id).textContent='—';$('percent').textContent='—';$('bar').value=0;$('updated').textContent='로그 —';$('details').replaceChildren();$('delta').textContent='10분 · 측정 대기';}
function initGIS(){
 if(!CLIENT_ID)return;
 try{tokenClient=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:SCOPE,include_granted_scopes:false,
  callback:response=>{authPending=false;if(response.error||!response.access_token||!Number.isFinite(Number(response.expires_in))||Number(response.expires_in)<=30||!google.accounts.oauth2.hasGrantedAllScopes(response,SCOPE)){error='DENIED';render();return;}session++;clearData();accessToken=response.access_token;expiresAt=Date.now()+Number(response.expires_in)*1000-30000;authRequired=false;error='';nextPoll=0;poll();},
  error_callback:()=>{authPending=false;error='POPUP';render();}});gisReady=true;
 }catch{gisFailed=true;}render();
}
$('connect').addEventListener('click',()=>{if(!tokenClient)return;authPending=true;error='';failureStep='';httpStatus=0;render();try{tokenClient.requestAccessToken({prompt:accessToken?'select_account':''});}catch{authPending=false;error='POPUP';render();}});
$('disconnect').addEventListener('click',()=>{session++;accessToken='';expiresAt=0;authRequired=false;error='';clearData();render();});
$('refresh').addEventListener('click',poll);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&accessToken&&Date.now()>=nextPoll)poll();});
setInterval(()=>{render();if(accessToken&&Date.now()>=nextPoll)poll();},1000);
render();if(CLIENT_ID){const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=initGIS;script.onerror=()=>{gisFailed=true;render();};document.head.append(script);}
