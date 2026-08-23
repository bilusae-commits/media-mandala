import { getVideos, getCategories, deleteVideo, getCurrentAuth, logout } from "./cms-service.js";

const $=s=>document.querySelector(s);
const container=$("#videos-container");
const message=$("#page-message");
let videos=[];let categories=[];let auth=null;

function esc(v){return String(v??"").replace(/[&<>\"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function date(v){if(!v)return "-";const d=new Date(v);return Number.isNaN(d.getTime())?"-":d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});}
function statusLabel(v){return ({draft:"Draft",review:"Review",published:"Published",archived:"Arsip"}[v]||v);}
function thumb(v){if(v.thumbnail_url)return v.thumbnail_url;const id=v.youtube_video_id;if(id)return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;return "";}
function setMessage(text,type=""){message.textContent=text||"";message.className=`message ${type}`;}

function renderStats(){
  const count=s=>videos.filter(v=>v.status===s).length;
  $("#stat-total").textContent=videos.length;
  $("#stat-draft").textContent=count("draft");
  $("#stat-review").textContent=count("review");
  $("#stat-published").textContent=count("published");
  $("#stat-featured").textContent=videos.filter(v=>v.featured).length;
}

function renderCategories(){
  const select=$("#category-filter");
  select.innerHTML='<option value="all">Semua kategori</option>';
  categories.forEach(c=>{const o=document.createElement("option");o.value=c.id;o.textContent=c.name;select.appendChild(o);});
}

function filtered(){
  const q=$("#search").value.trim().toLowerCase();
  const st=$("#status-filter").value;
  const cat=$("#category-filter").value;
  return videos.filter(v=>{
    const text=[v.title,v.slug,v.youtube_video_id,v.youtube_url,v.description].filter(Boolean).join(" ").toLowerCase();
    return (!q||text.includes(q))&&(st==="all"||v.status===st)&&(cat==="all"||v.category_id===cat);
  });
}

function render(){
  const rows=filtered();
  $("#result-count").textContent=`${rows.length} dari ${videos.length} video`;
  if(!rows.length){container.innerHTML='<div class="empty"><strong>Tidak ada video</strong>Sesuaikan pencarian atau filter, atau buat video baru.</div>';return;}
  container.innerHTML=`<table class="table"><thead><tr><th>Video</th><th>Kategori</th><th>Status</th><th>Dibuat</th><th>Publikasi</th><th>Aksi</th></tr></thead><tbody>${rows.map(row).join("")}</tbody></table>`;
  container.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",handleDelete));
}

function row(v){
  const c=categories.find(x=>x.id===v.category_id);
  const image=thumb(v);
  const canDelete=auth?.role==="admin" || (auth?.role==="editor"&&v.status!=="published");
  return `<tr><td><div style="display:flex;gap:11px;align-items:center"><img class="thumb" src="${esc(image)}" alt="${esc(v.title)}" loading="lazy" onerror="this.style.visibility='hidden'"><div><div class="video-name">${esc(v.title||"Tanpa judul")}</div><div class="video-sub">${esc(v.youtube_video_id||"YouTube ID belum ada")}${v.featured?'<span class="badge badge-featured">★ Unggulan</span>':''}</div></div></div></td><td>${esc(c?.name||"-")}</td><td><span class="badge badge-${esc(v.status||"draft")}">${esc(statusLabel(v.status||"draft"))}</span></td><td>${date(v.created_at)}</td><td>${v.published_at?date(v.published_at):"-"}</td><td><div class="actions"><a class="action" href="video-edit.html?id=${encodeURIComponent(v.id)}">Edit</a><button class="action danger" type="button" data-delete="${esc(v.id)}" ${canDelete?"":"disabled title=\"Tidak dapat dihapus\""}>Hapus</button></div></td></tr>`;
}

async function load(){
  try{setMessage("Memuat video...");
    auth=await getCurrentAuth();
    if(!auth?.authenticated){window.location.href="index.html";return;}
    $("#side-name").textContent=auth.profile?.full_name||auth.user?.email||"Pengguna";
    $("#side-role").textContent=auth.role||"-";
    $("#top-user").textContent=auth.profile?.full_name||auth.user?.email||"";
    [videos,categories]=await Promise.all([getVideos(),getCategories()]);
    renderStats();renderCategories();render();setMessage("");
  }catch(e){console.error(e);setMessage(e?.message||"Gagal memuat video.","error");container.innerHTML=`<div class="empty"><strong>Gagal memuat video</strong>${esc(e?.message||"Terjadi kesalahan.")}</div>`;}
}

async function handleDelete(e){
  const id=e.currentTarget.dataset.delete;const v=videos.find(x=>x.id===id);if(!v)return;
  if(v.status==="published"&&auth?.role!=="admin"){setMessage("Video published hanya dapat dihapus oleh Admin.","error");return;}
  if(!confirm(`Hapus video “${v.title}”?`))return;
  const b=e.currentTarget;b.disabled=true;b.textContent="Menghapus...";
  try{await deleteVideo(id);videos=videos.filter(x=>x.id!==id);renderStats();render();setMessage("Video berhasil dihapus.","success");}catch(err){b.disabled=false;b.textContent="Hapus";setMessage(err?.message||"Gagal menghapus video.","error");}
}

["search","status-filter","category-filter"].forEach(id=>$("#"+id).addEventListener("input",render));
$("#refresh").addEventListener("click",load);
$("#logout").addEventListener("click",async()=>{try{await logout();}catch(e){setMessage(e?.message||"Gagal keluar.","error");}});
load();