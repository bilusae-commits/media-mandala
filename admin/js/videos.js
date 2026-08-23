import { getVideos, getCategories, deleteVideo, getCurrentAuth, logout } from "./cms-service.js";

const $ = (selector) => document.querySelector(selector);
const container = $("#videos-container");
const message = $("#page-message");
const permissionNote = $("#permission-note");

let videos = [];
let categories = [];
let auth = null;
let currentStatus = "all";

const FALLBACK_THUMBNAIL = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
  <rect width="640" height="360" fill="#edf1f5"/>
  <text x="320" y="170" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#082d56">MANDALA</text>
  <text x="320" y="205" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#718091">CHANNEL · VIDEO</text>
</svg>`);

function esc(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (match) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[match]));
}

function date(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function statusLabel(value) {
  return ({
    draft: "Draft",
    review: "Review",
    published: "Published",
    archived: "Arsip"
  }[value] || value || "-";
}

function statusClass(value) {
  return ["draft", "review", "published", "archived"].includes(value) ? value : "draft";
}

function youtubeId(video) {
  if (video?.youtube_video_id) return video.youtube_video_id;
  const url = String(video?.youtube_url || "");
  const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/(?:embed|shorts)\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] || "";
}

function thumbnail(video) {
  if (video?.thumbnail_url) return video.thumbnail_url;
  const id = youtubeId(video);
  return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : FALLBACK_THUMBNAIL;
}

function setMessage(text = "", type = "") {
  if (!message) return;
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function renderStats() {
  const count = (status) => videos.filter((video) => video.status === status).length;
  $("#stat-total").textContent = videos.length;
  $("#stat-draft").textContent = count("draft");
  $("#stat-review").textContent = count("review");
  $("#stat-published").textContent = count("published");
  $("#stat-archived").textContent = count("archived");
  $("#stat-featured").textContent = videos.filter((video) => video.featured === true).length;
}

function renderCategories() {
  const select = $("#category-filter");
  if (!select) return;

  select.innerHTML = '<option value="all">Semua kategori</option>';
  categories
    .filter((category) => category?.is_active !== false)
    .forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name || "Tanpa nama";
      select.appendChild(option);
    });
}

function setStatus(status) {
  currentStatus = status;
  $("#status-filter").value = status === "featured" ? "all" : status;

  document.querySelectorAll(".status-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.status === status);
  });

  render();
}

function filteredVideos() {
  const query = $("#search").value.trim().toLowerCase();
  const dropdownStatus = $("#status-filter").value;
  const category = $("#category-filter").value;
  const status = currentStatus !== "all" ? currentStatus : dropdownStatus;

  return videos.filter((video) => {
    const text = [
      video.title,
      video.slug,
      video.youtube_video_id,
      video.youtube_url,
      video.description
    ].filter(Boolean).join(" ").toLowerCase();

    const matchesSearch = !query || text.includes(query);
    const matchesStatus = status === "all" || status === "featured"
      ? true
      : video.status === status;
    const matchesFeatured = status !== "featured" || video.featured === true;
    const matchesCategory = category === "all" || String(video.category_id || "") === String(category);

    return matchesSearch && matchesStatus && matchesFeatured && matchesCategory;
  });
}

function render() {
  const rows = filteredVideos();
  $("#result-count").textContent = `${rows.length} dari ${videos.length} video`;

  if (!rows.length) {
    container.innerHTML = `
      <div class="empty">
        <strong>Tidak ada video</strong>
        Tidak ada video yang sesuai dengan filter saat ini.
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Video</th>
          <th>Kategori</th>
          <th>Status</th>
          <th>Dibuat</th>
          <th>Publikasi</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>${rows.map(row).join("")}</tbody>
    </table>`;

  container.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", handleDelete);
  });
}

function row(video) {
  const category = categories.find((item) => String(item.id) === String(video.category_id));
  const image = thumbnail(video);
  const id = youtubeId(video);
  const isAdmin = auth?.role === "admin";
  const isEditor = auth?.role === "editor";
  const canDelete = isAdmin || (isEditor && video.status !== "published");
  const title = video.title || "Tanpa judul";
  const status = video.status || "draft";

  const deleteButton = canDelete
    ? `<button class="action danger" type="button" data-delete="${esc(video.id)}">Hapus</button>`
    : `<button class="action danger" type="button" disabled title="Editor tidak dapat menghapus video published">Hapus</button>`;

  const youtubeButton = video.youtube_url
    ? `<a class="action" href="${esc(video.youtube_url)}" target="_blank" rel="noopener">YouTube ↗</a>`
    : "";

  return `
    <tr>
      <td>
        <div class="video-cell">
          <div class="video-thumb-wrap">
            <img
              class="thumb"
              src="${esc(image)}"
              alt="${esc(title)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='${FALLBACK_THUMBNAIL}'">
          </div>
          <div>
            <div class="video-name">${esc(title)}</div>
            <div class="video-sub">
              ${id ? `YouTube ID: ${esc(id)}` : "YouTube ID belum tersedia"}
              ${video.featured ? '<span class="featured-mark">★ Unggulan</span>' : ""}
            </div>
          </div>
        </div>
      </td>
      <td>${esc(category?.name || "Tanpa kategori")}</td>
      <td><span class="badge badge-${statusClass(status)}">${esc(statusLabel(status))}</span></td>
      <td>${date(video.created_at)}</td>
      <td>${video.published_at ? date(video.published_at) : "-"}</td>
      <td>
        <div class="actions">
          <a class="action" href="video-edit.html?id=${encodeURIComponent(video.id)}">Edit</a>
          ${youtubeButton}
          ${deleteButton}
        </div>
      </td>
    </tr>`;
}

function updateRoleUI() {
  if (!permissionNote) return;

  if (auth?.role === "editor") {
    permissionNote.textContent = "Mode Editor: video Draft, Review, dan Arsip dapat dikelola. Video Published tidak dapat diedit atau dihapus oleh Editor sesuai aturan keamanan Supabase.";
    permissionNote.style.display = "block";
  } else if (auth?.role === "admin") {
    permissionNote.textContent = "Mode Admin: seluruh status video dapat dikelola.";
    permissionNote.style.display = "block";
  } else {
    permissionNote.style.display = "none";
  }
}

async function load() {
  try {
    setMessage("Memeriksa sesi...");

    auth = await getCurrentAuth();

    if (!auth?.authenticated) {
      window.location.replace("login.html?next=videos.html");
      return;
    }

    if (auth.role !== "admin" && auth.role !== "editor") {
      window.location.replace("index.html");
      return;
    }

    $("#side-name").textContent = auth.profile?.full_name || auth.user?.email || "Pengguna";
    $("#side-role").textContent = auth.role || "-";
    $("#top-user").textContent = auth.profile?.full_name || auth.user?.email || "";
    updateRoleUI();

    setMessage("Memuat video...");
    const [videoRows, categoryRows] = await Promise.all([getVideos(), getCategories()]);

    videos = Array.isArray(videoRows) ? videoRows : [];
    categories = Array.isArray(categoryRows) ? categoryRows : [];

    renderStats();
    renderCategories();
    render();
    setMessage("");
  } catch (error) {
    console.error("Video Admin Load Error:", error);
    setMessage(error?.message || "Gagal memuat video.", "error");
    container.innerHTML = `
      <div class="empty">
        <strong>Gagal memuat video</strong>
        ${esc(error?.message || "Terjadi kesalahan saat mengambil data dari Supabase.")}
      </div>`;
  }
}

async function handleDelete(event) {
  const id = event.currentTarget.dataset.delete;
  const video = videos.find((item) => item.id === id);
  if (!video) return;

  if (video.status === "published" && auth?.role !== "admin") {
    setMessage("Video Published hanya dapat dihapus oleh Admin.", "error");
    return;
  }

  const confirmed = confirm(`Hapus video “${video.title || "Tanpa judul"}”?\n\nData video akan dihapus dari database.`);
  if (!confirmed) return;

  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Menghapus...";

  try {
    await deleteVideo(id);
    videos = videos.filter((item) => item.id !== id);
    renderStats();
    render();
    setMessage("Video berhasil dihapus.", "success");
  } catch (error) {
    button.disabled = false;
    button.textContent = "Hapus";
    setMessage(error?.message || "Gagal menghapus video.", "error");
  }
}

function resetFilters() {
  $("#search").value = "";
  $("#status-filter").value = "all";
  $("#category-filter").value = "all";
  currentStatus = "all";
  document.querySelectorAll(".status-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.status === "all");
  });
  render();
}

$("#search").addEventListener("input", () => {
  currentStatus = "all";
  document.querySelectorAll(".status-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.status === "all");
  });
  render();
});

$("#status-filter").addEventListener("change", (event) => {
  currentStatus = event.target.value;
  document.querySelectorAll(".status-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.status === currentStatus);
  });
  render();
});

$("#category-filter").addEventListener("change", render);
$("#clear-filters").addEventListener("click", resetFilters);
$("#refresh").addEventListener("click", load);

$("#status-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-status]");
  if (!button) return;
  setStatus(button.dataset.status || "all");
});

document.querySelectorAll("[data-status-card]").forEach((card) => {
  card.addEventListener("click", () => setStatus(card.dataset.statusCard || "all"));
});

$("#logout").addEventListener("click", async () => {
  try {
    await logout();
  } catch (error) {
    setMessage(error?.message || "Gagal keluar.", "error");
  }
});

load();