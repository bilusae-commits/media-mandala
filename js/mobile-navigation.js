/* Accessible mobile navigation for public pages */
(function(){
  "use strict";
  function init(){
    const header=document.querySelector("#siteHeader");
    const source=header&&header.querySelector("nav.links");
    if(!header||!source||header.querySelector(".mc-mobile-menu"))return;
    const button=document.createElement("button");
    button.type="button";button.className="mc-mobile-menu";button.setAttribute("aria-label","Buka navigasi");button.setAttribute("aria-expanded","false");button.innerHTML="<span></span><span></span>";
    const drawer=document.createElement("aside");
    drawer.className="mc-mobile-drawer";drawer.id="mcMobileDrawer";drawer.setAttribute("aria-hidden","true");
    const head=document.createElement("div");head.className="mc-mobile-drawer-head";
    const title=document.createElement("span");title.textContent="MANDALA CHANNEL · NAVIGASI";
    const close=document.createElement("button");close.type="button";close.className="mc-mobile-drawer-close";close.textContent="TUTUP ×";
    head.append(title,close);
    const nav=source.cloneNode(true);nav.className="mc-mobile-drawer-links";nav.removeAttribute("id");
    const foot=document.createElement("div");foot.className="mc-mobile-drawer-foot";foot.textContent="MEDIA DHARMA & NUSANTARA";
    drawer.append(head,nav,foot);document.body.appendChild(drawer);
    function focusables(){return Array.from(drawer.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.offsetParent!==null);}
    function setOpen(open){drawer.classList.toggle("open",open);drawer.setAttribute("aria-hidden",String(!open));button.setAttribute("aria-expanded",String(open));button.setAttribute("aria-label",open?"Tutup navigasi":"Buka navigasi");document.body.classList.toggle("mc-mobile-nav-open",open);if(open)close.focus();else button.focus();}
    button.addEventListener("click",()=>setOpen(!drawer.classList.contains("open")));
    close.addEventListener("click",()=>setOpen(false));
    nav.addEventListener("click",event=>{if(event.target.closest("a"))setOpen(false);});
    document.addEventListener("keydown",event=>{
      if(!drawer.classList.contains("open"))return;
      if(event.key==="Escape"){setOpen(false);return;}
      if(event.key==="Tab"){const items=focusables();if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
    });
    const active=source.querySelector('[aria-current="page"]');
    if(active){const clone=Array.from(nav.querySelectorAll("a")).find(a=>a.getAttribute("href")===active.getAttribute("href"));if(clone)clone.setAttribute("aria-current","page");}
    (header.querySelector(".nav")||header).appendChild(button);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();