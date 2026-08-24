const API=window.MandalaSupabase;
const BUCKET="article-media";
const $=id=>document.getElementById(id);
let bypass=false;

function show(text,type="info"){
 const el=$("form-message");
 if(el){el.textContent=text;el.dataset.type=type;}
}
function publicUrl(path){return API?.getClient?null:null}
async function client(){return await API.getClient()}
async function optimize(file){
 if(!file?.type?.startsWith("image/"))throw new Error("File cover harus berupa gambar.");
 if(file.size>8*1024*1024)throw new Error("Ukuran cover maksimal 8 MB.");
 const bitmap=await createImageBitmap(file);
 const max=1800,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 const ctx=canvas.getContext("2d",{alpha:false});ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Gagal memproses cover.")),"image/webp",.86));
}
async function uploadCover(){
 const file=$("cover_image_file")?.files?.[0];
 const mode=document.querySelector("input[name=cover_source]:checked")?.value||"url";
 const urlInput=$("cover_image_url");
 if(mode!=="file")return urlInput?.value.trim()||null;
 if(!file)throw new Error("Pilih file cover terlebih dahulu.");
 show("Mengupload cover...");
 const db=await client();
 const slug=($("slug")?.value||$("title")?.value||"artikel").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"artikel";
 const path=`covers/${slug}/${crypto.randomUUID()}.webp`;
 const blob=await optimize(file);
 const up=await db.storage.from(BUCKET).upload(path,blob,{cacheControl:"31536000",upsert:false,contentType:"image/webp"});
 if(up.error)throw up.error;
 const publicUrl=db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
 if(urlInput)urlInput.value=publicUrl;
 const preview=$("cover-preview-image");const box=$("cover-preview");if(preview){preview.src=publicUrl;box?.classList.add("show");}
 show("Cover berhasil diupload.","success");
 return publicUrl;
}
function injectUI(){
 const field=$("cover_image_url")?.closest(".field");
 if(!field||$("cover-source-ui"))return;
 const ui=document.createElement("div");ui.id="cover-source-ui";ui.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px"><label style="display:flex!important;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--line);border-radius:6px;background:#fafbfc;cursor:pointer"><input type="radio" name="cover_source" value="url" checked> URL gambar</label><label style="display:flex!important;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--line);border-radius:6px;background:#fafbfc;cursor:pointer"><input type="radio" name="cover_source" value="file"> Pilih file</label></div><div id="cover-file-wrap" style="display:none;margin-bottom:10px"><input id="cover_image_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="width:100%;padding:10px;border:1px dashed var(--line);border-radius:6px;background:#fff"><small class="hint">JPG, PNG, WEBP atau GIF · maksimal 8 MB. Sistem akan mengoptimalkan menjadi WEBP.</small></div>`;
 field.insertBefore(ui,field.firstChild);
 const toggle=()=>{
  const file=document.querySelector("input[name=cover_source]:checked")?.value==="file";
  $("cover-file-wrap").style.display=file?"block":"none";
  $("cover_image_url").disabled=file;
  if(file)$("cover_image_url").value="";
 };
 ui.querySelectorAll("input[name=cover_source]").forEach(r=>r.addEventListener("change",toggle));
 $("cover_image_file")?.addEventListener("change",()=>{const f=$("cover_image_file").files?.[0];if(f){const img=$("cover-preview-image"),box=$("cover-preview");img.src=URL.createObjectURL(f);box.classList.add("show");}});
}
async function guard(action){
 if(bypass)return false;
 const mode=document.querySelector("input[name=cover_source]:checked")?.value||"url";
 if(mode!=="file")return false;
 action.preventDefault();action.stopImmediatePropagation();
 try{await uploadCover();bypass=true;if(action.type==="submit")action.target.requestSubmit();else action.target.click();}catch(e){show(e?.message||"Upload cover gagal.","error")}finally{bypass=false}
 return true;
}
function init(){
 injectUI();
 const form=$("article-form");
 if(!form)return;
 form.addEventListener("submit",e=>guard(e),true);
 ["save-draft-button","submit-review-button","publish-button","archive-button"].forEach(id=>$(id)?.addEventListener("click",e=>guard(e),true));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
