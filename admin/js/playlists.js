"use strict";

const API = window.MandalaSupabase;

if (!API) throw new Error("Supabase client belum dimuat.");

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));

let db;
let rows = [];
let categories = [];
let filter = "all";
let search = "";

function message(text, type="") {
  const el = $("#page-message");
  if (!el) return;
  el.className = `message ${type}`;
  el.textContent = text || "";
}

function slugify(value) {
  return String(value || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100);
}

function playlistId(value) {
  const text = String(value || "").trim();
  if (/^[A-Za-z0-9_-]+$/.test(text) && text.length >= 10) return text;
  try {
    const u = new URL(text);
    return u.searchParams.get("list") || "";
  } catch { return ""; }
}

function youtubeUrl(id) {
  return id ? `https://www.youtube.com/playlist?list=${encodeURIComponent(id)}` : "";
}

function counts() {
  const c = {all:rows.length,draft:0,review:0,published:0,archived:0,featured:0};
  rows.forEach(r => { if (c[r.status] !== undefined) c[r.status]++; if (r.featured) c.featured++; });
  Object.entries(c).forEach(([k,v]) => { const el = $(`#stat-${k}`); if (el) el.textContent=v; });
}

function categoryName(id) {
  return categories.find(c => c.id === id)?.name || "Tanpa kategori";
}

function filtered() {
  const q = search.trim().toLowerCase();
  return rows.filter(r => {
    const statusOk = filter === "all" || (filter === "featured" ? r.featured : r.status === filter);
    const text = [r.title,r.slug,r.description,r.youtube_playlist_id].join(" ").toLowerCase();
    return statusOk && (!q || text.includes(q));
  });
}

function render() {
  const data = filtered();
  $("#result-count").textContent = `${data.length} playlist${data.length===1?"":"s"}`;
  const box = $("#playlists-container");
  if (!data.length) {
    box.innerHTML = `<div class="empty"><strong>${rows.length ? "Tidak ada hasil" : "Belum ada playlist"}</strong>${rows.length ? "Coba ubah filter atau pencarian." : "Tambahkan playlist YouTube pertama dari tombol + Playlist Baru."}</div>`;
    return;
  }
  box.innerHTML = `<div class="table-scroll"><table><thead><tr><th>PLAYLIST</th><th>KATEGORI</th><th>STATUS</th><th>UNGGULAN</th><th>URUTAN</th><th>AKSI</th></tr></thead><tbody>${data.map(r => `
    <tr>
      <td><div class="playlist-cell"><div class="playlist-cover">${r.cover_image_url ? `<img src="${esc(r.cover_image_url)}" alt="">` : "▶"}</div><div><strong>${esc(r.title)}</strong><div class="sub">${esc(r.youtube_playlist_id)}</div></div></div></td>
      <td>${esc(categoryName(r.category_id))}</td>
      <td><span class="badge badge-${esc(r.status)}">${esc(r.status)}</span></td>
      <td>${r.featured ? "★" : "—"}</td>
      <td>${Number(r.sort_order)||0}</td>
      <td><div class="actions"><a class="btn btn-light btn-small" href="playlist-edit.html?id=${encodeURIComponent(r.id)}">Edit</a><a class="btn btn-light btn-small" href="../pages/playlist-detail.html?id=${encodeURIComponent(r.id)}" target="_blank" rel="noopener">Lihat</a><button class="btn btn-danger btn-small" data-delete="${esc(r.id)}" type="button">Hapus</button></div></td>
    </tr>`).join("")}</tbody></table></div>`;
  box.querySelectorAll("[data-delete]").forEach(b => b.onclick = () => removePlaylist(b.dataset.delete));
}

async function load() {
  try {
    db = await API.getClient();
    const auth = await API.auth.requireStaff();
    if (!auth) return;
    const [p,c] = await Promise.all([
      db.from("playlists").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false}),
      db.from("categories").select("id,name").order("name")
    ]);
    if (p.error) throw p.error;
    if (c.error) throw c.error;
    rows = p.data || [];
    categories = c.data || [];
    counts(); render();
  } catch(e) {
    console.error(e); message(e.message || "Playlist gagal dimuat.","error");
    $("#playlists-container").innerHTML = `<div class="empty"><strong>Gagal memuat playlist</strong>${esc(e.message || "Periksa koneksi dan izin Supabase.")}</div>`;
  }
}

async function removePlaylist(id) {
  if (!confirm("Hapus playlist ini? Tindakan ini tidak dapat dibatalkan.")) return;
  try {
    const {error} = await db.from("playlists").delete().eq("id",id);
    if (error) throw error;
    message("Playlist berhasil dihapus.","success");
    await load();
  } catch(e) { message(e.message || "Playlist gagal dihapus.","error"); }
}

function bind() {
  $("#search").oninput = e => { search=e.target.value; render(); };
  $("#refresh").onclick = load;
  $("#clear-filters").onclick = () => { search=""; filter="all"; $("#search").value=""; document.querySelectorAll(".status-tab").forEach(x=>x.classList.toggle("active",x.dataset.status==="all")); render(); };
  document.querySelectorAll(".status-tab,[data-status-card]").forEach(el => el.onclick = () => { filter=el.dataset.status || el.dataset.statusCard; document.querySelectorAll(".status-tab").forEach(x=>x.classList.toggle("active",x.dataset.status===filter)); render(); });
  $("#status-filter").onchange = e => { filter=e.target.value; document.querySelectorAll(".status-tab").forEach(x=>x.classList.toggle("active",x.dataset.status===filter)); render(); };
}

document.addEventListener("DOMContentLoaded", () => { bind(); load(); });
