  var toc=document.querySelector('.mobile-toc');
  var links=document.querySelectorAll('.sidebar a[href^="#sec"]');
  var sections=document.querySelectorAll('main > section');
  var bar=document.querySelector('.reading-progress span');
  var label=document.getElementById('mobile-current');
  var fontButton=document.getElementById('font-toggle');
  var large=false;
  if(fontButton)fontButton.addEventListener('click',function(){large=!large;document.documentElement.style.setProperty('--base',large?'23px':'20px');fontButton.setAttribute('aria-pressed',String(large));fontButton.textContent=large?'글자 기본':'글자 크게';});
  if(toc)toc.addEventListener('click',function(e){if(e.target.closest('a'))toc.removeAttribute('open');});
  function update(){
    var selected=sections[0];
    var threshold=document.querySelector('.topbar').getBoundingClientRect().bottom+65;
    Array.prototype.forEach.call(sections,function(s){if(s.getBoundingClientRect().top<threshold)selected=s;});
    Array.prototype.forEach.call(links,function(a){var active=selected&&a.getAttribute('href')==='#'+selected.id;if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    if(selected&&label){var h=selected.querySelector('h2');label.textContent=h.textContent.replace(/:.*/, '');}
    if(bar){var height=document.documentElement.scrollHeight-innerHeight;bar.style.width=(height>0?Math.min(100,Math.max(0,scrollY/height*100)):0)+'%';}
  }
  var ticking=false;
  window.addEventListener('scroll',function(){if(!ticking){requestAnimationFrame(function(){update();ticking=false;});ticking=true;}},{passive:true});update();
  var dialog=document.getElementById('image-dialog');
  var full=document.getElementById('image-full');
  var caption=document.getElementById('image-caption');
  var source=document.getElementById('image-source');
  document.querySelectorAll('main figure img').forEach(function(im){
    im.tabIndex=0;im.setAttribute('role','button');im.setAttribute('aria-label',im.alt+' — 크게 보기');
    function open(){var fig=im.closest('figure');full.src=im.src;full.alt=im.alt;caption.textContent=fig?fig.querySelector('figcaption').textContent:im.alt;var src=im.getAttribute('data-source');source.hidden=!src;if(src){source.href=src;source.textContent='사진 원문 보기 ↗';}if(dialog.showModal)dialog.showModal();else window.open(im.src,'_blank');}
    im.addEventListener('click',open);im.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
  if(dialog){document.getElementById('image-close').addEventListener('click',function(){dialog.close();});dialog.addEventListener('click',function(e){if(e.target===dialog)dialog.close();});}
