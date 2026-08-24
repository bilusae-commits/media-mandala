(() => {
  const $=id=>document.getElementById(id); let auth=null, files=[];
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function toast(m,e=false){const t=$('toast');t.textContent=m;t.className='toast '+(e?'error':'');t.hidden=false;setTimeout(()=>t.hidden=true,3500);}
  async function load(){
    const db=await MandalaSupabase.getClient();
    const {data,error}=await db.from('media').select('*').order('created_at',{ascending:false}).limit(100);
    if(error) throw error; files=data||[]; render();
  }
  function render(){
    $('grid').innerHTML=files.length?files.map(x=>`<article class="media-card"><div class="media-thumb">${x.mime_type?.startsWith('image/')?`<img src="${esc(x.file_url)}" alt="${esc(x.alt_text||x.file_name)}">`:'<span>MEDIA</span>'}</div><div class="media-info"><strong>${esc(x.file_name)}</strong><small>${esc(x.mime_type||'')} · ${x.file_size?Math.round(x.file_size/1024)+' KB':''}</small><div class="media-actions"><button class="btn small" data-copy="${esc(x.file_url)}">Copy URL</button>${auth?.role==='admin'?`<button class="btn small danger" data-delete="${esc(x.id)}">Hapus</button>`:''}</div></div></article>`).join(''):'<div class="empty">Belum ada media.</div>';
    document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText(b.dataset.copy);toast('URL berhasil disalin.');});
    document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>remove(b.dataset.delete));
  }
  async function upload(){
    const input=$('file'); const file=input.files[0]; if(!file)return toast('Pilih file terlebih dahulu.',true);
    if(file.size>15*1024*1024)return toast('Ukuran maksimum 15 MB.',true);
    const allowed=['image/','video/']; if(!allowed.some(x=>file.type.startsWith(x)))return toast('Hanya gambar atau video yang diperbolehkan.',true);
    const btn=$('upload');btn.disabled=true;btn.textContent='Mengunggah...';
    try{
      const result=await MandalaSupabase.storage.upload(file,'media');
      const db=await MandalaSupabase.getClient();
      const row={file_name:file.name,file_url:result.url,storage_path:result.path,mime_type:file.type,file_size:file.size,alt_text:$('alt').value.trim()||null,uploaded_by:auth.user.id};
      const {error}=await db.from('media').insert(row); if(error)throw error;
      input.value='';$('alt').value='';toast('Media berhasil diupload.');await load();
    }catch(e){toast(e.message||'Upload gagal. Pastikan bucket mandala-media dan policy Storage sudah aktif.',true);}finally{btn.disabled=false;btn.textContent='+ UPLOAD MEDIA';}
  }
  async function remove(id){if(!confirm('Hapus media ini?'))return;const item=files.find(x=>x.id===id);try{const db=await MandalaSupabase.getClient();if(item?.storage_path)await db.storage.from('mandala-media').remove([item.storage_path]);const {error}=await db.from('media').delete().eq('id',id);if(error)throw error;toast('Media dihapus.');await load();}catch(e){toast(e.message||'Gagal menghapus.',true);}}
  async function init(){auth=await MandalaSupabase.auth.requireStaff({loginPage:'index.html',deniedPage:'dashboard.html'});if(!auth)return;$('role').textContent=auth.role==='admin'?'ADMIN':'EDITOR';$('upload').onclick=upload;$('logout').onclick=async()=>{await MandalaSupabase.auth.signOut();location.href='index.html';};await load();}
  init().catch(e=>toast(e.message||'Gagal memuat media.',true));
})();