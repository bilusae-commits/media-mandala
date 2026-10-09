const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"GET, OPTIONS"};
const AUTH="https://api.backblazeb2.com/b2api/v4/b2_authorize_account";
const json=(body:unknown,status=400)=>new Response(JSON.stringify(body),{status,headers:{...CORS,"Content-Type":"application/json"}});
const basic=(id:string,key:string)=>btoa(`${id.trim()}:${key.trim()}`);
let authCache:{token:string,downloadUrl:string,expiresAt:number}|null=null;
async function b2(){
  const now=Date.now();
  if(authCache && authCache.expiresAt>now+60_000)return authCache;
  const id=Deno.env.get("B2_KEY_ID"),key=Deno.env.get("B2_APPLICATION_KEY");
  if(!id||!key)throw Error("Backblaze credentials are missing.");
  const r=await fetch(AUTH,{headers:{Authorization:`Basic ${basic(id,key)}`}});
  if(!r.ok)throw Error(`Backblaze authorization failed: HTTP ${r.status}`);
  const d=await r.json();
  const token=d?.authorizationToken,downloadUrl=d?.apiInfo?.storageApi?.downloadUrl??d?.downloadUrl;
  if(!token||!downloadUrl)throw Error("Backblaze authorization response is incomplete.");
  authCache={token,downloadUrl,expiresAt:now+23*60*60*1000};
  return authCache;
}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
  if(req.method!=="GET")return json({error:"Method not allowed."},405);
  try{
    const u=new URL(req.url),raw=u.searchParams.get("url");
    if(!raw)return json({error:"Missing url."});
    const target=new URL(raw);
    if(!target.hostname.endsWith(".backblazeb2.com"))return json({error:"Invalid image host."},403);
    const path=decodeURIComponent(target.pathname);
    const m=path.match(/^\/file\/([^/]+)\/(homepage\/.+|playlist-covers\/.+)$/);
    if(!m)return json({error:"Only approved public media paths are allowed."},403);
    const bucket=m[1],filePath=m[2];
    if(bucket!=="Mandala-Podcast")return json({error:"Invalid image bucket."},403);
    if(filePath.split("/").some(part=>!part||part==="."||part===".."))return json({error:"Invalid image path."},403);
    const b=await b2();
    const r=await fetch(`${b.downloadUrl}/file/${encodeURIComponent(bucket)}/${filePath}`,{headers:{Authorization:b.token}});
    if(!r.ok){
      if(r.status===401){authCache=null;const fresh=await b2();const retry=await fetch(`${fresh.downloadUrl}/file/${encodeURIComponent(bucket)}/${filePath}`,{headers:{Authorization:fresh.token}});if(!retry.ok)return json({error:`Backblaze download failed: HTTP ${retry.status}`},retry.status);return imageResponse(retry);}
      return json({error:`Backblaze download failed: HTTP ${r.status}`},r.status);
    }
    return imageResponse(r);
  }catch(e){console.error(e);return json({error:e instanceof Error?e.message:"Unexpected error."},500);}
});
function imageResponse(r:Response){
  const h=new Headers(CORS);
  h.set("Content-Type",r.headers.get("Content-Type")||"application/octet-stream");
  h.set("Cache-Control","public, max-age=31536000, immutable");
  h.set("X-Content-Type-Options","nosniff");
  return new Response(r.body,{status:200,headers:h});
}