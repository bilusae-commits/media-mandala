
async function initShell(title, active){
 const user=await MandalaCMS.requireUser(); if(!user)return;
 document.body.insertAdjacentHTML("afterbegin",`<aside class="sidebar">
 <div class="sideBrand"><b>MANDALA</b><small>CHANNEL CMS</small></div>
 <div class="navTitle">UTAMA</div><nav class="sideNav">
 <a data-page="dashboard" href="dashboard.html"><span>⌂</span>Dashboard</a>
 <a data-page="articles" href="articles.html"><span>▤</span>Artikel</a>
 <a data-page="videos" href="videos.html"><span>▶</span>Video</a>
 <a data-page="playlists" href="playlists.html"><span>☷</span>Playlist</a>
 <a data-page="podcasts" href="podcasts.html"><span>◉</span>Podcast</a>
 <div class="navTitle">KONTEN</div>
 <a data-page="media" href="media.html"><span>▧</span>Media</a>
 <a data-page="categories" href="categories.html"><span>◇</span>Kategori</a>
 <a data-page="settings" href="settings.html"><span>⚙</span>Pengaturan</a>
 </nav><button class="logout" id="logoutBtn">Keluar</button></aside>
 <main class="main"><div class="topbar"><h2>${title}</h2><div class="user">${user.email}</div></div><div class="content">`);
 document.querySelectorAll(".sideNav a").forEach(a=>{if(a.dataset.page===active)a.classList.add("active")});
 document.getElementById("logoutBtn").onclick=async()=>{const db=await MandalaCMS.ready();await db.auth.signOut();location.href="index.html"};
}
function toast(t){const x=document.getElementById("toast");x.textContent=t;x.style.display="block";setTimeout(()=>x.style.display="none",2200)}
