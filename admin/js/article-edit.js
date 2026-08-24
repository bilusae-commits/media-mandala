import "./cms-service.js";

const CMS = window.MandalaCMS;
const db = window.MandalaSupabase;
const MEDIA_BUCKET = "article-media";
const MAX_MEDIA = 4;
const MAX_IMAGE_EDGE = 1800;
const WEBP_QUALITY = 0.86;

const $ = (id) => document.getElementById(id);
const form = $("article-form"), pageTitle = $("page-title"), articleId = $("article-id");
const titleInput = $("title"), slugInput = $("slug"), excerptInput = $("excerpt"), contentInput = $("content");
const coverInput = $("cover_image_url"), categoryInput = $("category_id"), featuredInput = $("featured"), statusInput = $("status");
const statusHelp = $("status-help"), statusPill = $("current-status-pill"), formMessage = $("form-message");
const saveButton = $("save-button"), saveDraftButton = $("save-draft-button"), submitReviewButton = $("submit-review-button");
const publishButton = $("publish-button"), archiveButton = $("archive-button"), logoutButton = $("logout-button");
const publishedOption = $("published-option"), mediaFile = $("media-file"), uploadMediaButton = $("upload-media-button"), mediaList = $("media-list");
let profile = null, currentArticle = null, slugManuallyEdited = false, mediaRows = [];

function showMessage(text, type = "info") { if (!formMessage) return; formMessage.textContent = text || ""; formMessage.dataset.type = type; }
function escapeHtml(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function slugify(v) { return String(v || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
function getArticleId() { return new URLSearchParams(location.search).get("id"); }
function publicUrl(path) { return path && db ? db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl : ""; }

async function loadCategories() {
  const rows = await CMS.categories();
  categoryInput.innerHTML = `<option value="">-- Pilih Kategori --</option>` + (rows || []).map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join("");
}

async function loadMedia(id) {
  if (!id || !db) { mediaRows = []; renderMedia(); return; }
  const { data, error } = await db.from("article_media").select("id,article_id,file_url,storage_path,caption,alt_text,sort_order,created_at").eq("article_id", id).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  if (error) throw error;
  mediaRows = (data || []).slice(0, MAX_MEDIA);
  renderMedia();
}

function renderMedia() {
  if (!mediaList) return;
  if (!currentArticle?.id) { mediaList.innerHTML = `<div class="media-empty">Simpan artikel terlebih dahulu untuk menambahkan foto pendukung.</div>`; return; }
  if (!mediaRows.length) { mediaList.innerHTML = `<div class="media-empty">Belum ada foto pendukung. Maksimal ${MAX_MEDIA} foto per artikel.</div>`; return; }
  mediaList.innerHTML = mediaRows.map((row, i) => {
    const url = row.file_url || publicUrl(row.storage_path);
    return `<div class="media-item" data-media-id="${escapeHtml(row.id)}"><img src="${escapeHtml(url)}" alt="${escapeHtml(row.alt_text || row.caption || `Foto ${i + 1}`)}" loading="lazy"><div class="media-fields"><label style="font-size:9px;font-weight:800;color:#334155">CAPTION FOTO</label><input class="media-caption" value="${escapeHtml(row.caption || "")}" placeholder="Contoh: Kegiatan umat Hindu dalam pelestarian tradisi."><label style="font-size:9px;font-weight:800;color:#334155">ALT TEXT</label><input class="media-alt" value="${escapeHtml(row.alt_text || "")}" placeholder="Deskripsi singkat foto untuk aksesibilitas"><label style="font-size:9px;font-weight:800;color:#334155">POSISI</label><input class="media-order" type="number" min="1" max="${MAX_MEDIA}" value="${Math.min(MAX_MEDIA, Math.max(1, Number(row.sort_order) + 1 || i + 1))}" placeholder="1–${MAX_MEDIA}"></div><div class="media-actions"><button class="btn media-insert" type="button" data-action="insert">Sisipkan</button><button class="btn media-insert" type="button" data-action="save">Simpan</button><button class="btn media-delete" type="button" data-action="delete">Hapus</button></div></div>`;
  }).join("");
  mediaList.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", async () => {
    const item = btn.closest(".media-item"), row = mediaRows.find(x => x.id === item?.dataset.mediaId); if (!row) return;
    try { if (btn.dataset.action === "insert") insertMedia(row); else if (btn.dataset.action === "save") await saveMediaMeta(item, row); else await deleteMedia(row); }
    catch (e) { console.error(e); showMessage(e?.message || "Operasi foto gagal.", "error"); }
  }));
}

async function saveMediaMeta(item, row) {
  const position = Math.min(MAX_MEDIA, Math.max(1, Number(item.querySelector(".media-order")?.value || 1)));
  const { error } = await db.from("article_media").update({ caption: item.querySelector(".media-caption")?.value.trim() || null, alt_text: item.querySelector(".media-alt")?.value.trim() || null, sort_order: position - 1, updated_at: new Date().toISOString() }).eq("id", row.id);
  if (error) throw error;
  await loadMedia(currentArticle.id);
  showMessage("Data foto berhasil disimpan.", "success");
}

function insertMedia(row) {
  const url = row.file_url || publicUrl(row.storage_path); if (!url) throw new Error("URL foto tidak tersedia.");
  const alt = escapeHtml(row.alt_text || row.caption || "Foto pendukung artikel"), caption = row.caption ? `<figcaption>${escapeHtml(row.caption)}</figcaption>` : "";
  const block = `\n<figure class="article-media"><img src="${escapeHtml(url)}" alt="${alt}" loading="lazy" decoding="async">${caption}</figure>\n`;
  const start = contentInput.selectionStart ?? contentInput.value.length, end = contentInput.selectionEnd ?? start;
  contentInput.value = contentInput.value.slice(0, start) + block + contentInput.value.slice(end); contentInput.focus(); contentInput.setSelectionRange(start + block.length, start + block.length); showMessage("Foto disisipkan ke posisi cursor.", "success");
}

async function deleteMedia(row) {
  if (!confirm("Hapus foto pendukung ini?")) return;
  if (row.storage_path) { const s = await db.storage.from(MEDIA_BUCKET).remove([row.storage_path]); if (s.error) console.warn(s.error); }
  const { error } = await db.from("article_media").delete().eq("id", row.id); if (error) throw error;
  await loadMedia(currentArticle.id); showMessage("Foto berhasil dihapus.", "success");
}

async function prepareImage(file) {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} bukan file gambar.`);
  if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} terlalu besar. Maksimal 8 MB sebelum kompresi.`);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false }); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height); ctx.drawImage(bitmap, 0, 0, width, height); bitmap.close();
  const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Browser gagal mengoptimalkan gambar.")), "image/webp", WEBP_QUALITY));
  return { blob, width, height };
}

async function uploadMedia() {
  if (!currentArticle?.id) await save("draft");
  const files = Array.from(mediaFile?.files || []); if (!files.length) throw new Error("Pilih minimal satu foto.");
  if (mediaRows.length + files.length > MAX_MEDIA) throw new Error(`Maksimal ${MAX_MEDIA} foto pendukung. Saat ini sudah ada ${mediaRows.length}.`);
  uploadMediaButton.disabled = true;
  try {
    for (const file of files) {
      showMessage(`Mengoptimalkan ${file.name}...`);
      const optimized = await prepareImage(file);
      const path = `${currentArticle.id}/${crypto.randomUUID()}.webp`;
      const up = await db.storage.from(MEDIA_BUCKET).upload(path, optimized.blob, { cacheControl: "31536000", upsert: false, contentType: "image/webp" });
      if (up.error) throw up.error;
      const url = publicUrl(path), order = mediaRows.length;
      const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      const ins = await db.from("article_media").insert({ article_id: currentArticle.id, file_url: url, storage_path: path, caption: baseName, alt_text: baseName, sort_order: order });
      if (ins.error) { await db.storage.from(MEDIA_BUCKET).remove([path]); throw ins.error; }
      mediaRows.push({ article_id: currentArticle.id, file_url: url, storage_path: path, caption: baseName, alt_text: baseName, sort_order: order });
    }
    mediaFile.value = ""; await loadMedia(currentArticle.id); showMessage("Foto berhasil dioptimalkan dan diupload.", "success");
  } finally { uploadMediaButton.disabled = false; updateUI(); }
}

async function save(status = null) {
  const title = titleInput.value.trim(), slug = slugInput.value.trim(); if (!title) throw new Error("Judul wajib diisi."); if (!slug) throw new Error("Slug wajib diisi.");
  const target = status || currentArticle?.status || "draft"; if (profile?.role === "editor" && target === "published") throw new Error("Editor tidak dapat publish artikel.");
  const payload = { title, slug, excerpt: excerptInput.value.trim() || null, content: contentInput.value.trim() || null, cover_image_url: coverInput.value.trim() || null, category_id: categoryInput.value || null, featured: !!featuredInput.checked, status: target, published_at: target === "published" ? (currentArticle?.published_at || new Date().toISOString()) : null };
  if (!currentArticle) { const { data: auth } = await db.auth.getUser(); if (!auth?.user) throw new Error("User tidak ditemukan."); payload.author_id = auth.user.id; }
  showMessage("Menyimpan...");
  const result = currentArticle ? await CMS.updateArticle(currentArticle.id, payload) : await CMS.createArticle(payload);
  currentArticle = result; articleId.value = result.id; pageTitle.textContent = "Edit Artikel"; history.replaceState({}, "", `article-edit.html?id=${encodeURIComponent(result.id)}`); updateUI(); await loadMedia(result.id); showMessage("Artikel berhasil disimpan.", "success"); return result;
}

function updateUI() {
  const role = profile?.role, status = currentArticle?.status || statusInput?.value || "draft";
  if (publishedOption) publishedOption.disabled = role !== "admin";
  statusPill.textContent = status.toUpperCase(); statusPill.className = `status-pill ${status}`;
  statusHelp.textContent = role === "admin" ? "Admin dapat publish artikel." : "Editor dapat membuat Draft/Review, tetapi tidak dapat publish.";
  publishButton.style.display = role === "admin" ? "" : "none";
  submitReviewButton.style.display = ["review", "published"].includes(status) ? "none" : "";
  uploadMediaButton.disabled = !currentArticle?.id || mediaRows.length >= MAX_MEDIA;
}

async function loadArticle(id) {
  const data = await CMS.article(id); currentArticle = data; articleId.value = data.id || ""; titleInput.value = data.title || ""; slugInput.value = data.slug || ""; slugManuallyEdited = true; excerptInput.value = data.excerpt || ""; contentInput.value = data.content || ""; coverInput.value = data.cover_image_url || ""; categoryInput.value = data.category_id || ""; featuredInput.checked = !!data.featured; statusInput.value = data.status || "draft"; pageTitle.textContent = "Edit Artikel"; await loadMedia(id); updateUI(); showMessage("Artikel berhasil dimuat.", "success");
}

async function init() {
  try {
    if (!db || !CMS) throw new Error("CMS belum siap. Muat ulang halaman.");
    const { data: auth } = await db.auth.getUser(); if (!auth?.user) { location.href = "login.html"; return; }
    const { data: p, error } = await db.from("profiles").select("id,full_name,role").eq("id", auth.user.id).maybeSingle(); if (error) throw error; profile = p || { id: auth.user.id, role: "editor" };
    await loadCategories(); const id = getArticleId(); if (id) await loadArticle(id); else { pageTitle.textContent = "Artikel Baru"; renderMedia(); updateUI(); showMessage("Siap membuat artikel baru.", "success"); }
  } catch (e) { console.error(e); showMessage(e?.message || "Editor gagal dimuat.", "error"); }
}

titleInput?.addEventListener("input", () => { if (!slugManuallyEdited) slugInput.value = slugify(titleInput.value); });
slugInput?.addEventListener("input", () => { slugManuallyEdited = true; });
form?.addEventListener("submit", async e => { e.preventDefault(); try { await save(); } catch (x) { showMessage(x?.message || "Gagal menyimpan artikel.", "error"); } });
saveDraftButton?.addEventListener("click", async () => { try { await save("draft"); } catch (x) { showMessage(x?.message || "Gagal menyimpan draft.", "error"); } });
submitReviewButton?.addEventListener("click", async () => { try { await save("review"); } catch (x) { showMessage(x?.message || "Gagal mengirim review.", "error"); } });
publishButton?.addEventListener("click", async () => { try { if (profile?.role !== "admin") throw new Error("Hanya Admin yang dapat publish."); await save("published"); } catch (x) { showMessage(x?.message || "Gagal publish artikel.", "error"); } });
archiveButton?.addEventListener("click", async () => { try { await save("archived"); } catch (x) { showMessage(x?.message || "Gagal mengarsipkan artikel.", "error"); } });
statusInput?.addEventListener("change", updateUI);
logoutButton?.addEventListener("click", async () => { try { await db.auth.signOut(); } finally { location.href = "login.html"; } });
uploadMediaButton?.addEventListener("click", async () => { try { await uploadMedia(); } catch (x) { console.error(x); showMessage(x?.message || "Upload foto gagal.", "error"); uploadMediaButton.disabled = false; } });
init();