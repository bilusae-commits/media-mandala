/* MANDALA CHANNEL — LIVING ARCHIVE EXPERIENCE ENGINE */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const body=document.body;
const loader=$("#worldLoader");
const drawer=$("#worldDrawer");
const menu=$("#worldMenu");
const close=$("#worldClose");
const progress=$(".world-progress i");
const cursor=$("#worldCursor");

function ready(){setTimeout(()=>loader?.classList.add("loaded"),520)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});else ready();

function drawerSet(open){drawer?.classList.toggle("open",open);drawer?.setAttribute("aria-hidden",String(!open));body.classList.toggle("drawer-open",open)}
menu?.addEventListener("click",()=>drawerSet(!drawer?.classList.contains("open")));
close?.addEventListener("click",()=>drawerSet(false));
$$(".world-drawer a").forEach(a=>a.addEventListener("click",()=>drawerSet(false)));
document.addEventListener("keydown",e=>{if(e.key==="Escape")drawerSet(false)});

const clock=$("#worldClock");
function tick(){if(clock)clock.textContent=new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date())}
tick();setInterval(tick,30000);

let ticking=false;
function scrollUI(){
 const y=window.scrollY||0, max=document.documentElement.scrollHeight-innerHeight;
 if(progress)progress.style.width=(max>0?(y/max)*100:0)+"%";
 $("#siteHeader")?.classList.toggle("scrolled",y>30);
 ticking=false;
}
window.addEventListener("scroll",()=>{if(!ticking){requestAnimationFrame(scrollUI);ticking=true}},{passive:true});scrollUI();

if(cursor && matchMedia("(pointer:fine)").matches){
 let cx=-100,cy=-100,tx=-100,ty=-100;
 window.addEventListener("pointermove",e=>{tx=e.clientX;ty=e.clientY},{passive:true});
 function move(){cx+=(tx-cx)*.18;cy+=(ty-cy)*.18;cursor.style.left=cx+"px";cursor.style.top=cy+"px";requestAnimationFrame(move)} move();
 document.addEventListener("mouseover",e=>{if(e.target.closest("a,button,.m-podcast-card,.card"))cursor.classList.add("big")});
 document.addEventListener("mouseout",e=>{if(e.target.closest("a,button,.m-podcast-card,.card"))cursor.classList.remove("big")});
}

const canvas=$("#mandalaCanvas"),ctx=canvas?.getContext("2d");
let W=0,H=0,dpr=1,mouseX=.5,mouseY=.5;
function resizeCanvas(){if(!canvas||!ctx)return;dpr=Math.min(devicePixelRatio||1,2);W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
window.addEventListener("resize",resizeCanvas);resizeCanvas();
window.addEventListener("pointermove",e=>{mouseX=e.clientX/innerWidth;mouseY=e.clientY/innerHeight},{passive:true});
function mandala(t){
 if(!ctx)return;
 ctx.clearRect(0,0,W,H);
 const cx=W*(.57+(mouseX-.5)*.035),cy=H*(.48+(mouseY-.5)*.035),base=Math.min(W,H)*.34;
 const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,base*1.2);bg.addColorStop(0,"rgba(223,255,63,.12)");bg.addColorStop(.45,"rgba(90,100,70,.035)");bg.addColorStop(1,"rgba(0,0,0,0)");
 ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 for(let r=0;r<7;r++){
   const radius=base*(.18+r*.115),segments=24+r*6;
   ctx.beginPath();
   for(let i=0;i<=segments;i++){
     const a=i/segments*Math.PI*2+t*(r%2?.00035:-.00025), wobble=Math.sin(a*(6+r)+t*.0007)*radius*.018;
     const x=cx+Math.cos(a)*radius+wobble,y=cy+Math.sin(a)*radius+wobble;
     i?ctx.lineTo(x,y):ctx.moveTo(x,y);
   }
   ctx.closePath();ctx.strokeStyle="rgba(223,255,63,"+(r===0?.18:.055)+")";ctx.lineWidth=r===0?1.2:.6;ctx.stroke();
 }
 for(let i=0;i<36;i++){
   const a=i/36*Math.PI*2+t*.00018,rad=base*(.55+.08*Math.sin(t*.0005+i));
   const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad;
   ctx.fillStyle="rgba(223,255,63,"+(i%3===0?.45:.11)+")";ctx.fillRect(x-1,y-1,2,2);
 }
 requestAnimationFrame(mandala);
}
requestAnimationFrame(mandala);

$$(".origin-copy h1 span").forEach((el,i)=>el.style.transform="translateX("+(i%2?-12:0)+"vw)");
let lastY=0;
window.addEventListener("scroll",()=>{const y=window.scrollY||0;if(y<innerHeight*1.1){const d=Math.min(y,500);$$(".origin-copy h1 span").forEach((el,i)=>el.style.transform="translateX("+(i%2?-12+i*d*.012:i*d*.004)+"px)")}lastY=y},{passive:true});

if("IntersectionObserver" in window){
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("world-visible");io.unobserve(e.target)}}),{threshold:.12});
 $$("section").forEach(s=>io.observe(s));
}

window.MandalaWorld={version:"2026.09.23",experience:"living-archive"};
})();