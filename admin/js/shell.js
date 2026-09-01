async function initShell(title, active){
 const user=await MandalaCMS.requireStaff();
 if(!user)return;
 const isAdmin=user.role === "admin";
 document.body.insertAdjacentHTML("afterbegin",`<aside class="sidebar">
 <div class="brand" aria-label="Mandala Channel CMS"><div class="brand-title">MANDALA</div><div class="brand-subtitle">CHANNEL CMS</div></div>
 <div class="nav-title">Konten</div><nav class="nav" aria-label="Navigasi utama">
 <a class="nav-link" data-page="dashboard" href="dashboard.html"><span class="nav-icon">⌂</span><span>Dashboard</span></a>
 <a class="nav-link" data-page="articles" href="articles.html"><span class="nav-icon">▤</span><span>Artikel</span></a>
 <a class="nav-link" data-page="videos" href="videos.html"><span class="nav-icon">▶</span><span>Video</span></a>
 <a class="nav-link" data-page="playlists" href="playlists.html"><span class="nav-icon">☷</span><span>Playlist</span></a>
 <a class="nav-link" data-page="podcasts" href="podcasts.html"><span class="nav-icon">◉</span><span>Podcast</span></a>
 <a class="nav-link" data-page="categories" data-admin-only="true" href="categories.html"><span class="nav-icon">◇</span><span>Kategori</span></a>
 <div class="nav-title">Sistem</div>
 <a class="nav-link" data-page="settings" data-admin-only="true" href="settings.html"><span class="nav-icon">⚙</span><span>Pengaturan</span></a>
 </nav>
 <div class="sidebar-bottom"><div class="sidebar-user"><div class="sidebar-user-name">${user.email || "Pengguna"}</div><div class="sidebar-user-role">${isAdmin ? "Admin" : "Editor"}</div></div><button class="logout-button" id="logoutBtn" type="button"><span>Keluar</span> ↪</button></div>
 </aside>
 <main class="main"><div class="topbar"><div><div class="title">${title}</div><div class="subtitle">Mandala Channel CMS</div></div><div class="user-mini">${isAdmin ? "ADMIN" : "EDITOR"} · ${user.email || ""}</div></div><div class="content">`);
 document.querySelectorAll('.nav [data-admin-only="true"]').forEach(a=>{if(!isAdmin)a.remove();});
 document.querySelectorAll(".nav-link").forEach(a=>{if(a.dataset.page===active)a.classList.add("active");});
 const logout=document.getElementById("logoutBtn");
 if(logout)logout.onclick=async()=>{try{await MandalaCMS.logout();}catch(error){console.error(error);}};
}
function toast(t){const x=document.getElementById("toast");if(!x)return;x.textContent=t;x.style.display="block";setTimeout(()=>x.style.display="none",2200);}
