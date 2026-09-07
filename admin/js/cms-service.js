/* Mandala CMS Service — classic script
   API publik sengaja menyediakan alias camelCase dan nama lama agar halaman CMS kompatibel. */
(function(window){
  'use strict';
  const API = window.MandalaSupabase;
  if (!API) { console.error('MandalaSupabase belum dimuat. Pastikan ../js/supabase-client.js dimuat lebih dulu.'); return; }
  async function getDb(){ return await API.getClient(); }
  async function getCurrentUser(){ return await API.auth.getUser(); }
  async function getCurrentAuth(){ return await API.auth.getCurrent(); }
  async function requireStaff(options={}){
    const auth=await getCurrentAuth();
    if(!auth?.authenticated){ window.location.replace(options.loginPage||'index.html'); return null; }
    if(auth.role!=='admin'&&auth.role!=='editor'){ window.location.replace(options.deniedPage||'dashboard.html'); return null; }
    /* Legacy CMS pages historically used role==='admin' for content actions.
       Keep those pages compatible while preserving the real role separately. */
    return {...(auth.profile||{}),role:'admin',actual_role:auth.role,user:auth.user,authenticated:true};
  }
  async function logout(){ await API.auth.signOut(); window.location.href='index.html'; }
  async function getVideos(){const db=await getDb();const {data,error}=await db.from('videos').select('id,title,slug,youtube_url,youtube_video_id,thumbnail_url,description,category_id,status,featured,published_at,created_at,updated_at,author_id').order('created_at',{ascending:false});if(error)throw error;return data||[];}
  async function getVideo(id){const db=await getDb();const {data,error}=await db.from('videos').select('*').eq('id',id).maybeSingle();if(error)throw error;return data;}
  async function createVideo(payload){const db=await getDb();const {data,error}=await db.from('videos').insert(payload).select().single();if(error)throw error;return data;}
  async function updateVideo(id,payload){const db=await getDb();const {data,error}=await db.from('videos').update(payload).eq('id',id).select().single();if(error)throw error;return data;}
  async function deleteVideo(id){const db=await getDb();const {error}=await db.from('videos').delete().eq('id',id);if(error)throw error;return true;}
  const ARTICLE_COLUMNS='id,title,slug,excerpt,content,cover_image_url,category_id,status,featured,published_at,created_at,updated_at,author_id,categories:category_id(id,name,slug)';
  async function articles(){const db=await getDb();const {data,error}=await db.from('articles').select(ARTICLE_COLUMNS).order('created_at',{ascending:false});if(error)throw error;return data||[];}
  async function article(id){const db=await getDb();const {data,error}=await db.from('articles').select(ARTICLE_COLUMNS).eq('id',id).maybeSingle();if(error)throw error;if(!data)throw new Error('Artikel tidak ditemukan.');return data;}
  async function createArticle(payload){const db=await getDb();const {data,error}=await db.from('articles').insert(payload).select(ARTICLE_COLUMNS).single();if(error)throw error;return data;}
  async function updateArticle(id,payload){const db=await getDb();const {data,error}=await db.from('articles').update(payload).eq('id',id).select(ARTICLE_COLUMNS).single();if(error)throw error;return data;}
  async function deleteArticle(id){const db=await getDb();const {error}=await db.from('articles').delete().eq('id',id);if(error)throw error;return true;}
  async function changeStatus(tableName,id,status){if(!tableName||!id||!status)throw new Error('Data status tidak lengkap.');const db=await getDb();const payload={status,published_at:status==='published'?new Date().toISOString():null};const {data,error}=await db.from(tableName).update(payload).eq('id',id).select().single();if(error)throw error;return data;}
  async function getCategories(){const db=await getDb();const {data,error}=await db.from('categories').select('*').order('name',{ascending:true});if(error)throw error;return data||[];}
  async function select(tableName,columns='*'){const db=await getDb();const {data,error}=await db.from(tableName).select(columns);if(error)throw error;return data||[];}
  async function insert(tableName,payload){const db=await getDb();const {data,error}=await db.from(tableName).insert(payload).select();if(error)throw error;return data;}
  async function update(tableName,id,payload){const db=await getDb();const {data,error}=await db.from(tableName).update(payload).eq('id',id).select();if(error)throw error;return data;}
  async function remove(tableName,id){const db=await getDb();const {error}=await db.from(tableName).delete().eq('id',id);if(error)throw error;return true;}
  window.MandalaCMS={currentUser:getCurrentUser,currentAuth:getCurrentAuth,getCurrentUser,getCurrentAuth,requireStaff,logout,videos:getVideos,getVideos,video:getVideo,getVideo,createVideo,updateVideo,deleteVideo,articles,article,createArticle,updateArticle,deleteArticle,categories:getCategories,getCategories,changeStatus,select,insert,update,remove};
})(window);
