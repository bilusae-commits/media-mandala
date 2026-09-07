/* Mandala Channel — YouTube thumbnail helper for Article Editor */
(function(){
  'use strict';
  const input=document.getElementById('cover_image_url');
  if(!input||document.getElementById('youtube-cover-helper'))return;

  const field=input.closest('.field');
  if(!field)return;

  const wrap=document.createElement('div');
  wrap.id='youtube-cover-helper';
  wrap.style.cssText='margin-top:14px;padding:12px;border:1px dashed #cbd3db;border-radius:7px;background:#fafbfc';
  wrap.innerHTML=`
    <label for="youtube-cover-url" style="display:block;margin-bottom:7px;color:#334155;font-size:10px;font-weight:800;letter-spacing:.03em">AMBIL THUMBNAIL DARI YOUTUBE</label>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center">
      <input type="url" id="youtube-cover-url" placeholder="https://youtu.be/... atau https://youtube.com/watch?v=..." style="width:100%;border:1px solid #e4e8ed;border-radius:6px;background:#fff;color:#172536;outline:none;padding:11px 12px;font-size:12px">
      <button class="btn btn-primary" type="button" id="youtube-cover-button" style="white-space:nowrap">Ambil Thumbnail</button>
    </div>
    <small class="hint" id="youtube-cover-hint">Masukkan link video YouTube. Thumbnail akan otomatis dipasang sebagai Cover artikel.</small>
  `;
  field.appendChild(wrap);

  const youtubeInput=document.getElementById('youtube-cover-url');
  const button=document.getElementById('youtube-cover-button');
  const hint=document.getElementById('youtube-cover-hint');

  function setHint(text,type){
    hint.textContent=text;
    hint.style.color=type==='error'?'#b42318':type==='success'?'#18794e':'#8a96a3';
  }

  function extractVideoId(value){
    const raw=String(value||'').trim();
    if(!raw)return '';
    if(/^[A-Za-z0-9_-]{11}$/.test(raw))return raw;
    try{
      const url=new URL(raw.includes('://')?raw:`https://${raw}`);
      const host=url.hostname.toLowerCase().replace(/^www\./,'');
      if(host==='youtu.be')return (url.pathname.split('/').filter(Boolean)[0]||'').slice(0,11);
      if(host==='youtube.com'||host==='m.youtube.com'){
        const queryId=url.searchParams.get('v');
        if(queryId)return queryId.slice(0,11);
        const parts=url.pathname.split('/').filter(Boolean);
        const index=parts.findIndex(x=>['shorts','embed','live','v'].includes(x.toLowerCase()));
        if(index>=0&&parts[index+1])return parts[index+1].slice(0,11);
      }
    }catch(e){return ''}
    return '';
  }

  function setCover(url){
    input.value=url;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function loadImage(url){
    return new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>resolve(url);
      image.onerror=()=>reject(new Error('Thumbnail tidak tersedia pada ukuran ini.'));
      image.src=url;
    });
  }

  async function applyThumbnail(){
    const id=extractVideoId(youtubeInput.value);
    if(!id){
      setHint('Link YouTube tidak valid. Gunakan link video seperti youtu.be/ID atau youtube.com/watch?v=ID.','error');
      return;
    }
    button.disabled=true;
    button.textContent='Memeriksa...';
    setHint('Mencari thumbnail terbaik...');
    const max=`https://i.ytimg.com/vi/${encodeURIComponent(id)}/maxresdefault.jpg`;
    const high=`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
    try{
      let chosen=high;
      try{await loadImage(max);chosen=max}catch(e){await loadImage(high)}
      setCover(chosen);
      setHint(`Thumbnail YouTube berhasil dipasang sebagai Cover. Video ID: ${id}`,'success');
    }catch(e){
      setHint('Thumbnail YouTube tidak dapat dimuat. Pastikan link mengarah ke video yang masih tersedia.','error');
    }finally{
      button.disabled=false;
      button.textContent='Ambil Thumbnail';
    }
  }

  button.addEventListener('click',applyThumbnail);
  youtubeInput.addEventListener('keydown',event=>{
    if(event.key==='Enter'){event.preventDefault();applyThumbnail();}
  });

  input.addEventListener('input',()=>{
    if(input.value.trim()&&!youtubeInput.value.trim()){
      const id=extractVideoId(input.value);
      if(id)youtubeInput.value=input.value.trim();
    }
  });
})();
