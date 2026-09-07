/* MANDALA CHANNEL — SUPABASE CONFIGURATION */
window.MANDALA_CONFIG={
  SUPABASE_URL:"https://roeckoabffhyctfkvbhw.supabase.co",
  SUPABASE_PUBLISHABLE_KEY:"sb_publishable_rtbdvp4WdU4xMjn9Hyz4SQ_zIWkzWAr"
};

/* Homepage visual bootstrap. Legacy HTML is only a structural fallback.
   Do not let it paint and then get replaced by live Supabase content. */
if(location.pathname.endsWith("/index.html")||location.pathname.endsWith("/")){
  const bootstrap=document.createElement("style");
  bootstrap.id="mandala-home-bootstrap";
  bootstrap.textContent=`
    body[data-base="./"] main{opacity:0!important;visibility:hidden!important}
    body[data-base="./"].homepage-ready main{opacity:1!important;visibility:visible!important}
    body[data-base="./"] main .reveal,
    body[data-base="./"] main .revealItem,
    body[data-base="./"] main .reveal.is-visible,
    body[data-base="./"] main .reveal.visible,
    body[data-base="./"] main .revealItem.is-visible,
    body[data-base="./"] main .revealItem.visible{
      opacity:1!important;transform:none!important;transition:none!important
    }
  `;
  document.head.appendChild(bootstrap);

  /* One controlled hero background layer. */
  const style=document.createElement("style");
  style.id="mandala-home-hero-layer";
  style.textContent=`
    body[data-base="./"] .hero{
      position:relative!important;isolation:isolate!important;min-width:0!important;overflow:hidden!important;
      background-color:#082d56!important;
      background-image:linear-gradient(90deg,#082d56 0%,#082d56 28%,rgba(8,45,86,.985) 40%,rgba(8,45,86,.90) 49%,rgba(8,45,86,.72) 58%,rgba(8,45,86,.48) 67%,rgba(8,45,86,.23) 76%,rgba(8,45,86,0) 87%),var(--hero-overlay-image,none)!important;
      background-position:center,center!important;background-size:cover,cover!important;background-repeat:no-repeat,no-repeat!important;
    }
    body[data-base="./"] .hero::before,body[data-base="./"] .hero::after,body[data-base="./"] .hero.has-hero-overlay::before,body[data-base="./"] .hero.has-hero-overlay::after{content:none!important;display:none!important}
    body[data-base="./"] .heroGrid{position:relative!important;z-index:1!important;min-width:0!important}
    body[data-base="./"] .hero .heroCopy{position:relative!important;z-index:2!important;min-width:0!important;color:#fff!important}
    body[data-base="./"] .hero .visual{position:relative!important;z-index:3!important;isolation:isolate!important;min-width:0!important}
    body[data-base="./"] .hero .visual>div{z-index:4!important}
    body[data-base="./"] .hero .visual img{filter:none!important}
    body[data-base="./"] .hero .k{color:#e2bd68!important}
    body[data-base="./"] .hero h1{color:#fff!important;text-shadow:0 2px 20px rgba(0,0,0,.28)!important}
    body[data-base="./"] .hero p{color:#fff!important}
    body[data-base="./"] .hero .btn,body[data-base="./"] .hero .btn.primary{background:#fff!important;border-color:#fff!important;color:#082d56!important}
    body[data-base="./"] .hero .btn:hover{background:#f4f7fa!important;color:#082d56!important}
    @media(max-width:1100px){body[data-base="./"] .hero{background-image:linear-gradient(90deg,#082d56 0%,#082d56 30%,rgba(8,45,86,.98) 42%,rgba(8,45,86,.84) 53%,rgba(8,45,86,.58) 63%,rgba(8,45,86,.30) 73%,rgba(8,45,86,0) 88%),var(--hero-overlay-image,none)!important}}
    @media(max-width:760px){body[data-base="./"] .hero{background-image:linear-gradient(180deg,#082d56 0%,#082d56 34%,rgba(8,45,86,.96) 46%,rgba(8,45,86,.68) 59%,rgba(8,45,86,.28) 72%,rgba(8,45,86,0) 84%),var(--hero-overlay-image,none)!important}}
  `;
  document.head.appendChild(style);
}
