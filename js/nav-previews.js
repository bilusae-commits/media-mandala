/* MANDALA — desktop navigation editorial previews.
   Hover or keyboard-focus a primary navigation item to preview related content.
   On touch/mobile, the existing navigation remains unchanged. */
(function () {
  const header = document.getElementById("siteHeader");
  const nav = document.getElementById("primaryNav");
  if (!header || !nav) return;

  const entries = {
    "Beranda": {
      eyebrow: "JELAJAHI MANDALA",
      title: "Ruang cerita Hindu Nusantara",
      cards: [
        ["Cerita terbaru", "Pilihan redaksi dan kabar terbaru", "assets/images/playlists/playlist-04.jpg", "pages/artikel.html"],
        ["Video pilihan", "Tonton kisah dari berbagai penjuru", "assets/images/playlists/playlist-05.jpg", "pages/video.html"]
      ]
    },
    "Artikel": {
      eyebrow: "DARI RUANG REDAKSI",
      title: "Cerita, gagasan, dan perspektif",
      cards: [
        ["Tokoh Hindu", "Mengenal tokoh dan perjalanan dharma", "assets/images/playlists/playlist-06.jpg", "topics/tokoh-hindu.html"],
        ["Tradisi & Budaya", "Menelusuri warisan yang tetap hidup", "assets/images/playlists/playlist-07.jpg", "topics/tradisi-budaya.html"]
      ]
    },
    "Video": {
      eyebrow: "TONTON DI MANDALA",
      title: "Kisah Nusantara dalam gambar bergerak",
      cards: [
        ["Candika Nusantara", "Candi, sejarah, dan warisan", "assets/images/playlists/playlist-08.jpg", "topics/candika-nusantara.html"],
        ["Jelajah Nusantara", "Tempat, budaya, dan perjalanan", "assets/images/playlists/playlist-09.jpg", "topics/jelajah-nusantara.html"]
      ]
    },
    "Daftar Putar": {
      eyebrow: "RANGKAIAN CERITA",
      title: "Ikuti satu cerita ke cerita berikutnya",
      cards: [
        ["Kabar Umat", "Kabar dan kegiatan komunitas", "assets/images/playlists/playlist-12.jpg", "topics/kabar-umat.html"],
        ["Bersama Sang Tokoh", "Percakapan dan kisah para tokoh", "assets/images/playlists/playlist-13.jpg", "pages/playlist.html"]
      ]
    },
    "Audio Podcast": {
      eyebrow: "DENGARKAN MANDALA",
      title: "Percakapan yang lebih panjang",
      cards: [
        ["Perjalanan dharmika", "Pengalaman dan perjalanan hidup", "assets/images/playlists/playlist-14.jpg", "topics/dharmika.html"],
        ["Tradisi Nusantara", "Gagasan, budaya, dan kehidupan", "assets/images/playlists/playlist-15.jpg", "pages/podcast.html"]
      ]
    },
    "Tentang": {
      eyebrow: "MENGENAL MANDALA",
      title: "Media Hindu Nusantara",
      cards: [
        ["Tentang kami", "Kenali visi dan perjalanan Mandala", "assets/brand/Mandala.png", "pages/tentang-kami.html"],
        ["Hubungi redaksi", "Sampaikan cerita dan pertanyaan", "assets/brand/WhatsApp%20Image%202026-02-19%20at%2011.46.52%20AM.jpeg", "pages/kontak.html"]
      ]
    }
  };

  const panel = document.createElement("div");
  panel.className = "nav-preview";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Pratinjau isi menu");
  panel.innerHTML = '<div class="nav-preview-inner"><div class="nav-preview-heading"><span class="nav-preview-eyebrow"></span><strong class="nav-preview-title"></strong></div><div class="nav-preview-cards"></div></div>';
  header.appendChild(panel);

  const eyebrow = panel.querySelector(".nav-preview-eyebrow");
  const title = panel.querySelector(".nav-preview-title");
  const cards = panel.querySelector(".nav-preview-cards");
  const links = [...nav.querySelectorAll("a")];
  let activeLink = null;
  let closeTimer = null;

  function show(link) {
    const label = link.textContent.trim().replace(/\\s+/g, " ");
    const key = Object.keys(entries).find(name => name.toLowerCase() === label.toLowerCase());
    const entry = key ? entries[key] : null;
    if (!entry || window.matchMedia("(max-width: 900px)").matches) return;
    window.clearTimeout(closeTimer);
    activeLink = link;
    eyebrow.textContent = entry.eyebrow;
    title.textContent = entry.title;
    panel.dataset.menu = key.toLowerCase().replace(/\\s+/g, "-");
    cards.innerHTML = entry.cards.map((item) => {
      const cover = item[2];
      return '<a class="nav-preview-card" href="' + item[3] + '">' +
        '<span class="nav-preview-image"><img src="' + cover + '" alt="" loading="eager" onerror="this.onerror=null;this.src=\'assets/images/playlists/playlist-10.jpg\';"></span>' +
        '<span class="nav-preview-copy"><strong>' + item[0] + '</strong><span>' + item[1] + '</span><em>Jelajahi <span aria-hidden="true">↗</span></em></span>' +
      '</a>';
    }).join("");
    const headerRect = header.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const panelWidth = Math.min(820, window.innerWidth - 32);
    const anchorCenter = linkRect.left + linkRect.width / 2;
    const minCenter = panelWidth / 2 + 16;
    const maxCenter = window.innerWidth - panelWidth / 2 - 16;
    panel.style.position = "fixed";
    panel.style.display = "block";
    panel.style.visibility = "visible";
    panel.style.opacity = "1";
    panel.style.width = "min(820px, calc(100vw - 32px))";
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
    links.forEach(item => item.removeAttribute("aria-expanded"));
    activeLink = null;
  }

  function scheduleHide() {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (!panel.matches(":hover") && !(activeLink && (activeLink.matches(":focus") || activeLink.matches(":hover")))) hideNow();
    }, 140);
  }

  links.forEach(link => {
    if (entries[link.textContent.trim()]) link.setAttribute("aria-haspopup", "true");
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