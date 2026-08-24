import "./cms-service.js";

const CMS = window.MandalaCMS;
const db = window.MandalaSupabase;
const MEDIA_BUCKET = "article-media";

const form = document.getElementById("article-form");
const pageTitle = document.getElementById("page-title");
const articleId = document.getElementById("article-id");
const titleInput = document.getElementById("title");
const slugInput = document.getElementById("slug");
const excerptInput = document.getElementById("excerpt");
const contentInput = document.getElementById("content");
const coverInput = document.getElementById("cover_image_url");
const categoryInput = document.getElementById("category_id");
const featuredInput = document.getElementById("featured");
const statusInput = document.getElementById("status");
const statusHelp = document.getElementById("status-help");
const statusPill = document.getElementById("current-status-pill");
const formMessage = document.getElementById("form-message");
const saveButton = document.getElementById("save-button");
const saveDraftButton = document.getElementById("save-draft-button");
const submitReviewButton = document.getElementById("submit-review-button");
const publishButton = document.getElementById("publish-button");
const archiveButton = document.getElementById("archive-button");
const logoutButton = document.getElementById("logout-button");
const publishedOption = document.getElementById("published-option");
const mediaFile = document.getElementById("media-file");
const uploadMediaButton = document.getElementById("upload-media-button");
const mediaList = document.getElementById("media-list");

let profile = null;
let currentArticle = null;
let slugManuallyEdited = false;
let mediaRows = [];

function showMessage(text, type = "info") {
  if (!formMessage) return;
  formMessage.textContent = text || "";
  formMessage.dataset.type = type;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(text) {
  return String(text || "").toLowerCase().trim().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

titleInput?.addEventListener("input", () => {
  if (!slugManuallyEdited) slugInput.value = slugify(titleInput.value);
});
slugInput?.addEventListener("input", () => { slugManuallyEdited = true; });

function getArticleId() { return new URLSearchParams(window.location.search).get("id"); }

async function loadCategories() {
  const data = await CMS.categories();
  categoryInput.innerHTML = `<option value="">-- Pilih Kategori --</option>` +
    (data || []).map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("");
}

function getPublicMediaUrl(path) {
  if (!path || !db) return "";
  return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function loadMedia(id) {
  if (!id || !db) { mediaRows = []; renderMedia(); return; }
  const { data, error } = await db.from("article_media")
    .select("id,article_id,file_url,storage_path,caption,alt_text,sort_order,created_at")
    .eq("article_id", id).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  if (error) throw error;
  mediaRows = data || [];
  renderMedia();
}

function renderMedia() {
  if (!mediaList) return;
  if (!currentArticle?.id) {
    mediaList.innerHTML = `<div class="media-empty">Simpan artikel terlebih dahulu untuk mulai mengunggah foto pendukung.</div>`;
    return;
  }
  if (!mediaRows.length) {
    mediaList.innerHTML = `<div class="media-empty">Belum ada foto pendukung. Pilih foto lalu tekan Upload Foto.</div>`;
    return;
  }
  mediaList.innerHTML = mediaRows.map((row, index) => {
    const url = row.file_url || getPublicMediaUrl(row.storage_path);
    return `<div class="media-item" data-media-id="${escapeHtml(row.id)}">
      <img src="${escapeHtml(url)}" alt="${escapeHtml(row.alt_text || row.caption || `Foto ${index + 1}`)}" loading="lazy">
      <div class="media-fields">
        <input class="media-caption" type="text" value="${escapeHtml(row.caption || "")}" placeholder="Caption foto">
        <input class="media-alt" type="text" value="${escapeHtml(row.alt_text || "")}" placeholder="Alt text untuk aksesibilitas">
        <input class="media-order" type="number" min="0" step="1" value="${Number(row.sort_order) || 0}" placeholder="Urutan">
      </div>
      <div class="media-actions">
        <button class="btn media-insert" type="button" data-action="insert">Sisipkan</button>
        <button class="btn media-insert" type="button" data-action="save">Simpan</button>
        <button class="btn media-delete" type="button" data-action="delete">Hapus</button>
      </div>
    </div>`;
  }).join("");

  mediaList.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", async () => {
    const item = button.closest(".media-item");
    const row = mediaRows.find(x => x.id === item?.dataset.mediaId);
    if (!row) return;
    try {
      if (button.dataset.action === "insert") insertMedia(row);
      if (button.dataset.action === "save") await saveMediaMeta(item, row);
      if (button.dataset.action === "delete") await deleteMedia(row);
    } catch (error) { console.error(error); showMessage(error?.message || "Operasi foto gagal.", "error"); }
  }));
}

async function saveMediaMeta(item, row) {
  const { data, error } = await db.from("article_media").update({
    caption: item.querySelector(".media-caption")?.value.trim() || null,
    alt_text: item.querySelector(".media-alt")?.value.trim() || null,
    sort_order: Math.max(0, Number(item.querySelector(".media-order")?.value || 0)),
    updated_at: new Date().toISOString()
  }).eq("id", row.id).select().single();
  if (error) throw error;
  const index = mediaRows.findIndex(x => x.id === row.id);
  if (index >= 0) mediaRows[index] = data;
  renderMedia();
  showMessage("Data foto berhasil disimpan.", "success");
}

function insertMedia(row) {
  const url = row.file_url || getPublicMediaUrl(row.storage_path);
  if (!url) throw new Error("URL foto tidak tersedia.");
  const caption = row.caption ? `<figcaption>${escapeHtml(row.caption)}</figcaption>` : "";
  const alt = escapeHtml(row.alt_text || row.caption || "Foto pendukung artikel");
  const html = `\n<figure class="article-media"><img src="${escapeHtml(url)}" alt="${alt}" loading="lazy">${caption}</figure>\n`;
  const start = contentInput.selectionStart ?? contentInput.value.length;
  const end = contentInput.selectionEnd ?? start;
  contentInput.value = contentInput.value.slice(0, start) + html + contentInput.value.slice(end);
  contentInput.focus();
  const cursor = start + html.length;
  contentInput.setSelectionRange(cursor, cursor);
  showMessage("Foto disisipkan ke posisi cursor.", "success");
}

async function deleteMedia(row) {
  if (!confirm("Hapus foto pendukung ini?")) return;
  if (row.storage_path) {
    const { error: storageError } = await db.storage.from(MEDIA_BUCKET).remove([row.storage_path]);
    if (storageError) console.warn("Storage delete warning:", storageError);
  }
  const { error } = await db.from("article_media").delete().eq("id", row.id);
  if (error) throw error;
  mediaRows = mediaRows.filter(x => x.id !== row.id);
  renderMedia();
  showMessage("Foto berhasil dihapus.", "success");
}

function extensionFor(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".gif")) return "gif";
  return "jpg";
}

async function uploadMedia() {
  if (!currentArticle?.id) await save("draft");
  if (!currentArticle?.id) throw new Error("Simpan artikel terlebih dahulu sebelum upload foto.");
  if (!db) throw new Error("Koneksi Supabase belum tersedia.");
  const files = Array.from(mediaFile?.files || []);
  if (!files.length) throw new Error("Pilih minimal satu foto.");
  uploadMediaButton.disabled = true;
  try {
    for (const file of files) {
      if (!file.type.startsWith("image/")) throw new Error(`${file.name} bukan file gambar.`);
      if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} terlalu besar. Maksimal 8 MB.`);
      const ext = extensionFor(file);
      const path = `${currentArticle.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      showMessage(`Mengunggah ${file.name}...`);
      const { error: uploadError } = await db.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const publicUrl = getPublicMediaUrl(path);
      const nextOrder = mediaRows.length ? Math.max(...mediaRows.map(x => Number(x.sort_order) || 0)) + 1 : 0;
      const { error: rowError } = await db.from("article_media").insert({ article_id: currentArticle.id, file_url: publicUrl, storage_path: path, caption: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), alt_text: "", sort_order: nextOrder });
      if (rowError) { await db.storage.from(MEDIA_BUCKET).remove([path]); throw rowError; }
    }
    if (mediaFile) mediaFile.value = "";
    await loadMedia(currentArticle.id);
    showMessage("Foto berhasil diupload dan terhubung ke artikel.", "success");
  } finally { uploadMediaButton.disabled = false; }
}

uploadMediaButton?.addEventListener("click", async () => {
  try { await uploadMedia(); } catch (error) { console.error(error); showMessage(error?.message || "Upload foto gagal.", "error"); uploadMediaButton.disabled = false; }
});

async function loadArticle(id) {
  showMessage("Memuat artikel...");
  const data = await CMS.article(id);
  currentArticle = data;
  articleId.value = data.id || "";
  titleInput.value = data.title || "";
  slugInput.value = data.slug || "";
  slugManuallyEdited = true;
  excerptInput.value = data.excerpt || "";
  contentInput.value = data.content || "";
  coverInput.value = data.cover_image_url || "";
  categoryInput.value = data.category_id || "";
  featuredInput.checked = Boolean(data.featured);
  statusInput.value = data.status || "draft";
  pageTitle.textContent = "Edit Artikel";
  updateUI();
  await loadMedia(data.id);
  showMessage("Artikel berhasil dimuat.", "success");
}

function getFormData() {
  const title = titleInput.value.trim();
  const slug = slugInput.value.trim();
  if (!title) throw new Error("Judul wajib diisi.");
  if (!slug) throw new Error("Slug wajib diisi.");
  return { title, slug, excerpt: excerptInput.value.trim() || null, content: contentInput.value.trim() || null, cover_image_url: coverInput.value.trim() || null, category_id: categoryInput.value || null, featured: Boolean(featuredInput.checked) };
}

async function save(targetStatus = null) {
  const payload = getFormData();
  payload.status = targetStatus || currentArticle?.status || "draft";
  if (profile.role === "editor" && payload.status === "published") throw new Error("Editor tidak dapat publish artikel.");
  if (!currentArticle) {
    const user = await CMS.currentUser();
    if (!user) throw new Error("User tidak ditemukan.");
    payload.author_id = user.id;
  }
  payload.published_at = payload.status === "published" ? (currentArticle?.published_at || new Date().toISOString()) : null;
  showMessage("Menyimpan...");
  const result = currentArticle ? await CMS.updateArticle(currentArticle.id, payload) : await CMS.createArticle(payload);
  currentArticle = result;
  articleId.value = result.id;
  pageTitle.textContent = "Edit Artikel";
  window.history.replaceState({}, "", `article-edit.html?id=${encodeURIComponent(result.id)}`);
  updateUI();
  await loadMedia(result.id);
  showMessage("Artikel berhasil disimpan.", "success");
  return result;
}

function updateUI() {
  const role = profile?.role;
  const status = currentArticle?.status || statusInput?.value || "draft";
  if (publishedOption) publishedOption.disabled = role !== "admin";
  if (statusPill) { statusPill.textContent = status.toUpperCase(); statusPill.className = `status-pill ${status}`; }
  if (statusHelp) statusHelp.textContent = role === "admin" ? "Admin dapat mempublish artikel." : "Editor dapat membuat Draft/Review, tetapi tidak dapat publish.";
  saveButton.style.display = ""; saveDraftButton.style.display = ""; submitReviewButton.style.display = ""; archiveButton.style.display = ""; publishButton.style.display = role === "admin" ? "" : "none";
  [titleInput, slugInput, excerptInput, contentInput, coverInput, categoryInput, featuredInput, statusInput].forEach(field => { if (field) field.disabled = false; });
  if (status === "published" && role === "editor") {
    [titleInput, slugInput, excerptInput, contentInput, coverInput, categoryInput, featuredInput, statusInput].forEach(field => { if (field) field.disabled = true; });
    saveButton.style.display = "none"; saveDraftButton.style.display = "none"; submitReviewButton.style.display = "none"; archiveButton.style.display = "none"; publishButton.style.display = "none";
    if (uploadMediaButton) uploadMediaButton.disabled = true;
  } else if (uploadMediaButton) uploadMediaButton.disabled = !currentArticle?.id;
  if (status === "published" || status === "review") submitReviewButton.style.display = "none";
}

form?.addEventListener("submit", async event => { event.preventDefault(); try { await save(); } catch (error) { console.error(error); showMessage(error?.message || "Gagal menyimpan artikel.", "error"); } });
saveDraftButton?.addEventListener("click", async () => { try { await save("draft"); } catch (error) { showMessage(error?.message || "Gagal menyimpan draft.", "error"); } });
submitReviewButton?.addEventListener("click", async () => { try { await save("review"); } catch (error) { showMessage(error?.message || "Gagal mengirim review.", "error"); } });
publishButton?.addEventListener("click", async () => { try { if (profile?.role !== "admin") throw new Error("Hanya Admin yang dapat publish artikel."); await save("published"); } catch (error) { showMessage(error?.message || "Gagal publish artikel.", "error"); } });
archiveButton?.addEventListener("click", async () => { try { await save("archived"); } catch (error) { showMessage(error?.message || "Gagal mengarsipkan artikel.", "error"); } });
statusInput?.addEventListener("change", () => { if (profile?.role === "editor" && statusInput.value === "published") { statusInput.value = currentArticle?.status || "draft"; showMessage("Editor tidak dapat memilih Published.", "warning"); } updateUI(); });
logoutButton?.addEventListener("click", async () => { try { await CMS.logout(); } catch (error) { showMessage(error?.message || "Gagal logout.", "error"); } });

async function init() {
  try {
    profile = await CMS.requireStaff();
    if (!profile) return;
    await loadCategories();
    const id = getArticleId();
    if (id) await loadArticle(id);
    else { pageTitle.textContent = "Artikel Baru"; statusInput.value = "draft"; updateUI(); renderMedia(); showMessage("Siap membuat artikel baru."); }
  } catch (error) { console.error("Article editor init error:", error); showMessage(error?.message || "Gagal membuka editor artikel.", "error"); }
}

init();
