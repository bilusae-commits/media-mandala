(() => {
  const $ = (id) => document.getElementById(id);
  let auth = null;
  let id = new URLSearchParams(location.search).get('id');
  let editing = null;

  function esc(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function slugify(v='') { return v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }
  function isAdmin(){ return auth?.role === 'admin'; }
  function toast(msg, error=false){ const el=$('toast'); el.textContent=msg; el.className='toast '+(error?'error':''); el.hidden=false; setTimeout(()=>el.hidden=true,3500); }

  async function loadCategories(){
    const db = await MandalaSupabase.getClient();
    const {data,error}=await db.from('categories').select('id,name').eq('is_active',true).order('sort_order').order('name');
    if(error) throw error;
    $('category_id').innerHTML='<option value="">Tanpa kategori</option>'+ (data||[]).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
  }

  async function loadPodcast(){
    if(!id) return;
    const db=await MandalaSupabase.getClient();
    const {data,error}=await db.from('podcasts').select('*').eq('id',id).maybeSingle();
    if(error) throw error;
    if(!data) throw new Error('Podcast tidak ditemukan.');
    editing=data;
    $('title').value=data.title||''; $('slug').value=data.slug||''; $('description').value=data.description||'';
    $('youtube_url').value=data.youtube_url||''; $('youtube_video_id').value=data.youtube_video_id||'';
    $('cover_image_url').value=data.cover_image_url||''; $('category_id').value=data.category_id||'';
    $('featured').checked=!!data.featured; $('status').value=data.status||'draft';
    if(!isAdmin()){ $('status').querySelector('option[value="published"]').disabled=true; if(data.status==='published') document.querySelectorAll('input,select,textarea').forEach(e=>e.disabled=true); }
  }

  async function save(){
    const title=$('title').value.trim(); if(!title) return toast('Judul podcast wajib diisi.',true);
    let status=$('status').value;
    if(!isAdmin() && status==='published') return toast('Editor tidak dapat publish podcast.',true);
    if(!isAdmin() && editing?.status==='published') return toast('Podcast yang sudah published hanya dapat diubah oleh Admin.',true);
    const payload={title,slug:($('slug').value.trim()||slugify(title)),description:$('description').value.trim()||null,youtube_url:$('youtube_url').value.trim()||null,youtube_video_id:$('youtube_video_id').value.trim()||null,cover_image_url:$('cover_image_url').value.trim()||null,category_id:$('category_id').value||null,featured:$('featured').checked,status};
    if(status==='published' && !editing?.published_at) payload.published_at=new Date().toISOString();
    else if(status!=='published') payload.published_at=editing?.published_at||null;
    if(editing) payload.updated_at=new Date().toISOString();
    else payload.author_id=auth.user.id;
    const db=await MandalaSupabase.getClient();
    let result;
    if(editing) result=await db.from('podcasts').update(payload).eq('id',id);
    else result=await db.from('podcasts').insert(payload);
    if(result.error) throw result.error;
    toast('Podcast berhasil disimpan.');
    setTimeout(()=>location.href='podcasts.html',500);
  }

  async function init(){
    auth=await MandalaSupabase.auth.requireStaff({loginPage:'index.html',deniedPage:'dashboard.html'});
    if(!auth) return;
    $('role').textContent=auth.role==='admin'?'ADMIN':'EDITOR';
    await loadCategories(); await loadPodcast();
    $('slug').addEventListener('input',()=>{ if(!$('slug').dataset.manual) $('slug').value=slugify($('title').value); });
    $('slug').addEventListener('input',()=> $('slug').dataset.manual='1');
    $('title').addEventListener('input',()=>{if(!$('slug').dataset.manual && !id) $('slug').value=slugify($('title').value);});
    $('save').onclick=()=>save().catch(e=>toast(e.message||'Gagal menyimpan.',true));
    $('cancel').onclick=()=>location.href='podcasts.html';
    $('logout').onclick=async()=>{await MandalaSupabase.auth.signOut();location.href='index.html';};
  }
  init().catch(e=>toast(e.message||'Gagal memuat.',true));
})();