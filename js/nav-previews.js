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
        ["Cerita terbaru", "Pilihan redaksi dan kabar terbaru", "assets/images/playlists/playlist-01.jpg", "index.html"],
        ["Video pilihan", "Tonton kisah dari berbagai penjuru", "assets/images/playlists/playlist-02.jpg", "pages/video.html"],
        ["Audio Podcast", "Dengarkan percakapan lebih mendalam", "assets/images/playlists/playlist-03.jpg", "pages/podcast.html"]
      ]
    },
    "Artikel": {
      eyebrow: "DARI RUANG REDAKSI",
      title: "Cerita, gagasan, dan perspektif",
      cards: [
        ["Artikel terbaru", "Baca kisah dan pemikiran pilihan", "assets/images/playlists/playlist-01.jpg", "pages/artikel.html"],
        ["Tokoh Hindu", "Mengenal tokoh dan perjalanan dharma", "assets/images/playlists/playlist-04.jpg", "topics/tokoh-hindu.html"],
        ["Tradisi & Budaya", "Menelusuri warisan yang tetap hidup", "assets/images/playlists/playlist-05.jpg", "topics/tradisi-budaya.html"]
      ]
    },
    "Video": {
      eyebrow: "TONTON DI MANDALA",
      title: "Kisah Nusantara dalam gambar bergerak",
      cards: [
        ["Video terbaru", "Temukan video dari kanal Mandala", "assets/images/playlists/playlist-02.jpg", "pages/video.html"],
        ["Candika Nusantara", "Candi, sejarah, dan warisan", "assets/images/playlists/playlist-03.jpg", "topics/candika-nusantara.html"],
        ["Jelajah Nusantara", "Tempat, budaya, dan perjalanan", "assets/images/playlists/playlist-06.jpg", "topics/jelajah-nusantara.html"]
      ]
    },
    "Daftar Putar": {
      eyebrow: "RANGKAIAN CERITA",
      title: "Ikuti satu cerita ke cerita berikutnya",
      cards: [
        ["Jelajah Nusantara", "Perjalanan dan warisan Nusantara", "assets/images/playlists/playlist-01.jpg", "pages/playlist.html"],
        ["Kabar Umat", "Kabar dan kegiatan komunitas", "assets/images/playlists/playlist-02.jpg", "pages/playlist.html"],
        ["Bersama Sang Tokoh", "Percakapan dan kisah para tokoh", "assets/images/playlists/playlist-03.jpg", "pages/playlist.html"]
      ]
    },
    "Audio Podcast": {
      eyebrow: "DENGARKAN MANDALA",
      title: "Percakapan yang lebih panjang",
      cards: [
        ["Episode terbaru", "Dengarkan cerita pilihan", "assets/images/playlists/playlist-04.jpg", "pages/podcast.html"],
        ["Perjalanan dharmika", "Pengalaman dan perjalanan hidup", "assets/images/playlists/playlist-05.jpg", "pages/podcast.html"],
        ["Tradisi Nusantara", "Gagasan, budaya, dan kehidupan", "assets/images/playlists/playlist-06.jpg", "pages/podcast.html"]
      ]
    },
    "Tentang": {
      eyebrow: "MENGENAL MANDALA",
      title: "Media Hindu Nusantara",
      cards: [
        ["Tentang kami", "Kenali visi dan perjalanan Mandala", "assets/images/playlists/playlist-07.jpg", "pages/tentang-kami.html"],
        ["Tradisi & Budaya", "Merawat warisan Nusantara", "assets/images/playlists/playlist-08.jpg", "topics/tradisi-budaya.html"],
        ["Hubungi redaksi", "Sampaikan cerita dan pertanyaan", "assets/images/playlists/playlist-09.jpg", "pages/kontak.html"]
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
    const key = link.textContent.trim();
    const entry = entries[key];
    if (!entry || window.matchMedia("(max-width: 900px)").matches) return;
    window.clearTimeout(closeTimer);
    activeLink = link;
    eyebrow.textContent = entry.eyebrow;
    title.textContent = entry.title;
    const existingCovers = [...document.querySelectorAll("#playlistTrack .play-card img")].map(img => img.currentSrc || img.src).filter(Boolean);
    cards.innerHTML = entry.cards.map((item, index) => {
      const cover = existingCovers[index] || item[2];
      return '<a class="nav-preview-card" href="' + item[3] + '">' +
        '<span class="nav-preview-image"><img src="' + cover + '" alt="" loading="eager" onerror="this.onerror=null;this.src=\'assets/images/playlists/playlist-10.jpg\';"></span>' +
        '<span class="nav-preview-copy"><strong>' + item[0] + '</strong><span>' + item[1] + '</span><em>Jelajahi <span aria-hidden="true">↗</span></em></span>' +
      '</a>';
    }).join("");
    const headerRect = header.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const panelWidth = Math.min(820, window.innerWidth - 32);
    const anchorCenter = linkRect.left + linkRect.width / 2 - headerRect.left;
    const minCenter = panelWidth / 2 + 16;
    const maxCenter = headerRect.width - panelWidth / 2 - 16;
    panel.style.width = "min(820px, calc(100vw - 32px))";
    panel.style.left = Math.max(minCenter, Math.min(maxCenter, anchorCenter)) + "px";
    panel.style.top = (headerRect.height + 4) + "px";
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
      if (!panel.matches(":hover") && !(activeLink && activeLink.matches(":focus"))) hideNow();
    }, 140);
  }

  links.forEach(link => {
    if (entries[link.textContent.trim()]) link.setAttribute("aria-haspopup", "true");
    link.addEventListener("mouseenter", () => show(link));
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