/* MANDALA — compact, text-only navigation previews for the homepage.
   Every preview link stays inside the content area named by its primary menu. */
(function () {
  const header = document.getElementById("siteHeader");
  const nav = document.getElementById("primaryNav");
  if (!header || !nav) return;

  const entries = {
    "Beranda": {
      eyebrow: "MANDALA · BERANDA",
      title: "Jelajahi beranda",
      links: [
        ["Pilihan redaksi", "Cerita dan bacaan pilihan", "#articlesContainer"],
        ["Video pilihan", "Tonton video Mandala", "#videosContainer"],
        ["Daftar putar", "Ikuti rangkaian cerita", "#playlistSection"],
        ["Audio pilihan", "Dengarkan episode terbaru", "#homeAudioSection"]
      ]
    },
    "Artikel": {
      eyebrow: "DARI RUANG REDAKSI",
      title: "Baca cerita dan gagasan",
      links: [
        ["Baca artikel", "Jelajahi seluruh artikel Mandala", "pages/artikel.html"],
        ["Cerita pilihan", "Pilihan redaksi di beranda", "#articlesContainer"]
      ]
    },
    "Video": {
      eyebrow: "TONTON DI MANDALA",
      title: "Video dan dokumenter",
      links: [
        ["Tonton video pilihan", "Pilihan video di beranda", "#videosContainer"],
        ["Semua video", "Buka katalog video Mandala", "pages/video.html"]
      ]
    },
    "Daftar Putar": {
      eyebrow: "RANGKAIAN CERITA",
      title: "Lanjutkan dari satu cerita ke cerita lain",
      links: [
        ["Daftar putar pilihan", "Koleksi yang tampil di beranda", "#playlistSection"],
        ["Semua daftar putar", "Jelajahi seluruh koleksi", "pages/playlist.html"]
      ]
    },
    "Audio Podcast": {
      eyebrow: "DENGARKAN MANDALA",
      title: "Percakapan yang lebih panjang",
      links: [
        ["Dengarkan pilihan", "Episode audio di beranda", "#homeAudioSection"],
        ["Semua audio podcast", "Buka katalog audio Mandala", "pages/podcast.html"]
      ]
    },
    "Tentang": {
      eyebrow: "MENGENAL MANDALA",
      title: "Tentang media Mandala",
      links: [
        ["Tentang kami", "Visi dan perjalanan Mandala", "pages/tentang-kami.html"],
        ["Kontak redaksi", "Hubungi tim Mandala", "pages/kontak.html"]
      ]
    }
  };

  const panel = document.createElement("div");
  panel.className = "nav-preview nav-preview-text-only";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Pratinjau navigasi");
  panel.innerHTML = '<div class="nav-preview-inner"><div class="nav-preview-heading"><span class="nav-preview-eyebrow"></span><strong class="nav-preview-title"></strong><span class="nav-preview-hint">PILIH BAGIAN</span></div><div class="nav-preview-links"></div></div>';
  header.appendChild(panel);

  const eyebrow = panel.querySelector(".nav-preview-eyebrow");
  const title = panel.querySelector(".nav-preview-title");
  const list = panel.querySelector(".nav-preview-links");
  const links = [...nav.querySelectorAll("a")];
  let activeLink = null;
  let closeTimer = null;

  const escapeHTML = value => String(value || "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);

  function show(link) {
    const label = link.textContent.trim().replace(/\s+/g, " ");
    const entry = entries[label];
    if (!entry || window.matchMedia("(max-width: 900px)").matches) return;
    window.clearTimeout(closeTimer);
    activeLink = link;
    eyebrow.textContent = entry.eyebrow;
    title.textContent = entry.title;
    panel.dataset.menu = label.toLowerCase().replace(/\s+/g, "-");
    list.innerHTML = entry.links.map((item, index) =>
      '<a class="nav-preview-text-link" href="' + escapeHTML(item[2]) + '">' +
        '<span class="nav-preview-link-number">' + String(index + 1).padStart(2, "0") + '</span>' +
        '<span class="nav-preview-link-copy"><strong>' + escapeHTML(item[0]) + '</strong><small>' + escapeHTML(item[1]) + '</small></span>' +
        '<span class="nav-preview-link-arrow" aria-hidden="true">↗</span>' +
      '</a>'
    ).join("");

    const headerRect = header.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const panelWidth = Math.min(680, window.innerWidth - 32);
    const anchorCenter = linkRect.left + linkRect.width / 2;
    const minCenter = panelWidth / 2 + 16;
    const maxCenter = window.innerWidth - panelWidth / 2 - 16;
    panel.style.position = "fixed";
    panel.style.display = "block";
    panel.style.visibility = "visible";
    panel.style.opacity = "1";
    panel.style.width = "min(680px, calc(100vw - 32px))";
    panel.style.left = Math.max(minCenter, Math.min(maxCenter, anchorCenter)) + "px";
    panel.style.top = (headerRect.bottom + 2) + "px";
    panel.style.transform = "translateX(-50%)";
    panel.hidden = false;
    header.classList.add("has-nav-preview");
    links.forEach(item => item.setAttribute("aria-expanded", String(item === link)));
  }

  function hideNow() {
    panel.hidden = true;
    header.classList.remove("has-nav-preview");
    links.forEach(item => {
      item.removeAttribute("aria-expanded");
      item.removeAttribute("aria-haspopup");
    });
    activeLink = null;
  }

  function scheduleHide() {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (!panel.matches(":hover") && !(activeLink && (activeLink.matches(":focus") || activeLink.matches(":hover")))) hideNow();
    }, 180);
  }

  links.forEach(link => {
    const label = link.textContent.trim();
    if (!entries[label]) return;
    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");
    link.addEventListener("mouseenter", () => show(link));
    link.addEventListener("pointerenter", () => show(link));
    link.addEventListener("focus", () => show(link));
    link.addEventListener("mouseleave", scheduleHide);
  });
  panel.addEventListener("mouseenter", () => window.clearTimeout(closeTimer));
  panel.addEventListener("mouseleave", scheduleHide);
  panel.addEventListener("focusin", () => window.clearTimeout(closeTimer));
  panel.addEventListener("focusout", event => {
    if (!panel.contains(event.relatedTarget)) scheduleHide();
  });
  header.addEventListener("mouseleave", scheduleHide);
  header.addEventListener("mouseenter", () => window.clearTimeout(closeTimer));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") hideNow();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth <= 900) hideNow();
  }, { passive: true });
})();