"use strict";
(function(){
  const header=document.getElementById('siteHeader');
  const toggle=document.querySelector('.menu-toggle');
  const nav=document.getElementById('mainNav');
  toggle?.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');toggle.setAttribute('aria-expanded',String(open));});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{document.body.classList.remove('menu-open');toggle?.setAttribute('aria-expanded','false');}));
  const onScroll=()=>header?.classList.toggle('scrolled',window.scrollY>8);onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  const revealTargets=document.querySelectorAll('.latest-grid,.immersive-content,.visual-grid,.photo-layout,.topic-hero,.swipe-rail,.topic-list,.audio-grid,.mag-grid,.mission,.footer-main');
  if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -30px'});revealTargets.forEach(el=>io.observe(el));}
  else revealTargets.forEach(el=>el.classList.add('in'));
  document.querySelectorAll('.swipe-rail,.latest-grid,.visual-side,.audio-grid,.mag-grid').forEach(rail=>{
    let down=false,start=0,left=0;
    rail.addEventListener('pointerdown',e=>{down=true;start=e.clientX;left=rail.scrollLeft;rail.setPointerCapture?.(e.pointerId);});
    rail.addEventListener('pointermove',e=>{if(!down)return;rail.scrollLeft=left-(e.clientX-start)*1.15;});
    ['pointerup','pointercancel','pointerleave'].forEach(type=>rail.addEventListener(type,()=>down=false));
  });
  document.querySelectorAll('.audio-play').forEach(btn=>btn.addEventListener('click',()=>{const card=btn.closest('.audio-card');if(!card)return;const audio=card.querySelector('audio');if(audio){audio.paused?audio.play():audio.pause();btn.textContent=audio.paused?'▶ PUTAR':'Ⅱ JEDA';}}));
})();
