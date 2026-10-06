(() => {
 const shell=document.querySelector('.player-shell');
 const frame=shell.querySelector('iframe');
 const play=document.querySelector('[data-play]');
 const mute=document.querySelector('[data-mute]');
 const full=document.querySelector('[data-fullscreen]');
 const seek=document.querySelector('[data-seek]');
 const time=document.querySelector('[data-time]');
 const message=document.querySelector('[data-message]');
 let player,paused=true,muted=false,duration=Number(seek.max),seeking=false;
 const format=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 function notice(text){message.textContent=text;message.hidden=!text;}
 function error(e){notice(e?.name==='NotAllowedError'?'영상 안의 재생 버튼을 눌러 주세요.':'플레이어 연결을 확인해 주세요. 아래의 Vimeo에서 보기 링크도 이용할 수 있습니다.');}
 function expanded(){return document.fullscreenElement===shell||shell.classList.contains('screen-expanded');}
 function syncFull(){full.textContent=expanded()?'화면 축소':'전체화면';full.setAttribute('aria-pressed',String(expanded()));}
 async function close(){if(document.fullscreenElement===shell)await document.exitFullscreen();shell.classList.remove('screen-expanded');document.body.classList.remove('player-expanded');syncFull();}
 full.addEventListener('click',async()=>{
  if(expanded()){await close();return;}
  if(shell.requestFullscreen){try{await shell.requestFullscreen();syncFull();return;}catch{}}
  shell.classList.add('screen-expanded');document.body.classList.add('player-expanded');syncFull();
 });
 document.addEventListener('fullscreenchange',syncFull);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded())close().catch(error);});
 if(new URLSearchParams(location.search).get('fullscreen')==='1'){shell.classList.add('screen-expanded');document.body.classList.add('player-expanded');syncFull();}
 if(!window.Vimeo?.Player){notice('추가 재생 버튼을 불러오지 못했습니다. 영상 안의 기본 재생 버튼을 이용해 주세요.');return;}
 player=new Vimeo.Player(frame);
 player.on('error',error);
 player.on('play',()=>{paused=false;play.textContent='일시정지';notice('');});
 player.on('pause',()=>{paused=true;play.textContent='재생';});
 player.on('ended',()=>{paused=true;play.textContent='다시 재생';});
 player.on('volumechange',e=>{muted=e.muted??e.volume===0;mute.textContent=muted?'소리 켜기':'음소거';mute.setAttribute('aria-pressed',String(muted));});
 player.on('timeupdate',e=>{duration=e.duration;seek.max=duration;if(!seeking)seek.value=e.seconds;time.textContent=`${format(e.seconds)} / ${format(duration)}`;});
 player.ready().then(async()=>{
  duration=await player.getDuration();seek.max=duration;time.textContent=`0:00 / ${format(duration)}`;
  for(const b of document.querySelectorAll('[data-media-control]'))b.disabled=false;
  seek.disabled=false;notice('');
 }).catch(error);
 play.addEventListener('click',()=>{(paused?player.play():player.pause()).catch(error);});
 mute.addEventListener('click',()=>{player.setMuted(!muted).catch(error);});
 for(const b of document.querySelectorAll('[data-skip]'))b.addEventListener('click',async()=>{try{const now=await player.getCurrentTime();await player.setCurrentTime(Math.max(0,Math.min(duration,now+Number(b.dataset.skip))));}catch(e){error(e);}});
 seek.addEventListener('input',()=>{seeking=true;time.textContent=`${format(Number(seek.value))} / ${format(duration)}`;});
 seek.addEventListener('change',async()=>{try{await player.setCurrentTime(Number(seek.value));}catch(e){error(e);}finally{seeking=false;}});
})();
