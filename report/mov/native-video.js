/* Native mobile video fullscreen; desktop players retain their own controls. */
window.NativeVideoPlayer=(()=>{
 let active=false;
 function isMobile(){
  return navigator.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 }
 function open(source){
  if(active)return;
  active=true;
  const existing=source instanceof HTMLVideoElement;
  const video=existing?source:document.createElement('video');
  const old={parent:video.parentNode,next:video.nextSibling,controls:video.controls,inline:video.playsInline,focus:document.activeElement,overflow:document.body.style.overflow,x:scrollX,y:scrollY};
  const main=document.querySelector('main'),wasInert=main?.inert;
  const overlay=document.createElement('div');
  overlay.className='native-video-overlay';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','동영상 전체화면 재생');
  overlay.style.cssText='position:fixed;inset:0;z-index:10001;background:#000;display:flex;flex-direction:column;height:100%;height:100dvh';
  const videoStyle=video.getAttribute('style');
  video.style.cssText='display:block;width:100%;height:100%;min-height:0;flex:1;object-fit:contain;background:#000;border:0';
  video.controls=true;video.playsInline=false;video.muted=false;
  if(!existing){video.src=source;video.preload='auto';video.setAttribute('aria-label','가을의 시작, 2026');}
  const actions=document.createElement('div');
  actions.className='native-video-actions';
  actions.style.cssText='display:flex;gap:12px;justify-content:center;padding:12px;padding-bottom:max(12px,env(safe-area-inset-bottom));background:#10100e';
  const start=document.createElement('button'),close=document.createElement('button');
  start.textContent='소리 켜고 전체화면 재생';close.textContent='닫기';
  for(const button of [start,close]){button.type='button';button.style.cssText='min-height:48px;padding:10px 16px;border:1px solid #6e5940;border-radius:8px;background:#30271d;color:#efe8db;font:16px system-ui;touch-action:manipulation';actions.append(button);}
  overlay.append(video,actions);document.body.append(overlay);
  if(main)main.inert=true;
  document.body.style.overflow='hidden';
  let entered=false,closed=false;
  function cleanup(){
   if(closed)return;closed=true;active=false;
   document.removeEventListener('fullscreenchange',onFullscreen);
   document.removeEventListener('keydown',onKey);
   video.removeEventListener('webkitbeginfullscreen',onBegin);
   video.removeEventListener('webkitendfullscreen',cleanup);
   video.removeEventListener('error',onError);
   video.pause();
   if(document.fullscreenElement===video)document.exitFullscreen().catch(()=>{});
   if(video.webkitDisplayingFullscreen&&video.webkitExitFullscreen)video.webkitExitFullscreen();
   if(existing){old.parent.insertBefore(video,old.next);video.controls=old.controls;video.playsInline=old.inline;videoStyle===null?video.removeAttribute('style'):video.setAttribute('style',videoStyle);}
   else{video.removeAttribute('src');video.load();}
   overlay.remove();if(main)main.inert=wasInert;
   document.body.style.overflow=old.overflow;
   old.focus?.focus({preventScroll:true});window.scrollTo(old.x,old.y);
  }
  function onBegin(){entered=true;}
  function onFullscreen(){if(document.fullscreenElement===video)entered=true;else if(entered&&!document.fullscreenElement)cleanup();}
  function onKey(event){if(event.key==='Escape')cleanup();}
  function onError(){start.textContent='재생 불가 · 닫고 다른 재생 링크 이용';start.disabled=true;}
  function enter(){
   // Call synchronously in the original click, before any navigation/await.
   // iPhone also enters its native player when play() starts without playsinline.
   try{
    if(video.webkitEnterFullscreen){video.webkitEnterFullscreen();}
    else if(video.requestFullscreen){video.requestFullscreen().catch(()=>{});}
   }catch{/* Cold media may need loading; the visible button permits another tap. */}
  }
  function play(){
   video.muted=false;
   video.play().catch(error=>{if(closed)return;if(error.name==='NotAllowedError')start.textContent='눌러서 소리 켜고 재생';else if(error.name!=='AbortError')onError();});
   enter();
  }
  document.addEventListener('fullscreenchange',onFullscreen);
  document.addEventListener('keydown',onKey);
  video.addEventListener('webkitbeginfullscreen',onBegin);
  video.addEventListener('webkitendfullscreen',cleanup);
  video.addEventListener('error',onError);
  start.addEventListener('click',play);close.addEventListener('click',cleanup);
  play();
 }
 return {isMobile,open};
})();
