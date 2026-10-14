async function initShell(title, active){
 const user=await MandalaCMS.requireStaff();
 if(!user)return;
 const actualRole=user.actual_role||user.role;
 const isAdmin=actualRole === "admin";
 document.body.insertAdjacentHTML("afterbegin",`<aside class="sidebar">
 <div class="brand" aria-label="Mandala · Sistem Pengelolaan Konten"><div class="brand-title">MANDALA</div><div class="brand-subtitle">MEDIA PENGELOLAAN KONTEN</div></div>
 <div class="nav-title">Konten</div><nav class="nav" aria-label="Navigasi utama">
 <a class="nav-link" data-page="dashboard" href="dashboard.html"><span class="nav-icon">⌂</span><span>Panel Pengelola</span></a>
 <a class="nav-link" data-page="articles" href="articles.html"><span class="nav-icon">▤</span><span>Artikel</span></a>
 <a class="nav-link" data-page="videos" href="videos.html"><span class="nav-icon">▶</span><span>Video</span></a>
 <a class="nav-link" data-page="playlists" href="playlists.html"><span class="nav-icon">☷</span><span>Daftar Putar</span></a>
 <a class="nav-link" data-page="podcasts" href="podcasts.html"><span class="nav-icon">◉</span><span>Siniar</span></a>
 <a class="nav-link" data-page="categories" href="categories.html"><span class="nav-icon">◇</span><span>Kategori</span></a>
 <div class="nav-title">Sistem</div>
 <a class="nav-link" data-page="settings" href="settings.html"><span class="nav-icon">⚙</span><span>Pengaturan</span></a>
 <a class="nav-link" data-page="change-password" href="change-password.html"><span class="nav-icon">🔒</span><span>Ubah Kata Sandi</span></a>
 </nav>
 <div class="sidebar-bottom"><div class="sidebar-user"><div class="sidebar-user-name">${user.email || "Pengguna"}</div><div class="sidebar-user-role">${isAdmin ? "Pengelola" : "Penyunting"}</div></div><button class="logout-button" id="logoutBtn" type="button"><span>Keluar</span> ↪</button></div>
 </aside>
 <main class="main"><div class="topbar"><div><div class="title">${title}</div><div class="subtitle">Mandala · Sistem Pengelolaan Konten</div></div><div class="user-mini">${isAdmin ? "PENGELOLA" : "PENYUNTING"} · ${user.email || ""}</div></div><div class="content">`);
 document.querySelectorAll(".nav-link").forEach(a=>{if(a.dataset.page===active)a.classList.add("active");});
 const logout=document.getElementById("logoutBtn");
 if(logout)logout.onclick=async()=>{try{await MandalaCMS.logout();}catch(error){console.error(error);}};
 document.body.classList.add("cms-ready");
}
function toast(t){const x=document.getElementById("toast");if(!x)return;x.textContent=t;x.style.display="block";setTimeout(()=>x.style.display="none",2200);}
