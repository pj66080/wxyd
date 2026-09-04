/*
 * WeKit Read Receipts — Cloudflare Worker / D1 single-file edition
 * API/schema aligned with lie-jiu/wekit-read-receipts-server.
 *
 * Privacy note: this service records reader IP/User-Agent/open time.
 * Use only where lawful and with appropriate notice/consent.
 */

const MAX_CONTENT = 2048, MAX_BATCH = 50, LEVEL_MAX = 99;
const SESSION_DAYS = 30, PBKDF2_DEFAULT = 100000;
const RATE = { pixel: 200, count: 60, register: 30, auth: 5, admin: 30, geo: 30 };
const WINDOW = 60;
const PNG = Uint8Array.from([71,73,70,56,57,97,80,0,80,0,246,0,0,0,0,0,159,159,223,140,166,225,149,170,234,150,158,231,143,159,239,142,164,237,153,163,235,149,169,239,147,162,236,149,164,240,150,167,243,146,164,237,149,169,240,149,165,239,146,166,237,148,165,239,147,164,236,146,165,236,148,167,240,149,168,240,148,166,239,148,165,239,147,166,239,148,164,238,147,165,240,147,166,239,148,166,238,148,166,239,147,164,238,147,165,240,148,165,239,148,165,237,148,167,240,148,165,240,148,166,237,149,167,240,147,165,239,147,166,240,148,167,238,148,166,239,148,165,239,147,165,239,149,165,240,148,167,239,149,167,239,148,167,239,148,166,239,149,167,240,148,165,239,148,166,238,148,166,239,148,166,238,148,166,239,147,166,239,148,166,238,148,166,239,147,166,239,148,166,239,147,165,239,148,166,239,148,165,239,148,166,239,148,166,239,148,166,239,148,166,240,148,166,238,148,166,239,148,166,240,147,166,239,148,166,239,148,166,239,148,166,239,148,166,239,148,166,240,148,166,239,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,33,249,4,13,10,0,0,0,33,255,11,78,69,84,83,67,65,80,69,50,46,48,3,1,0,0,0,44,4,0,13,0,67,0,42,0,0,7,254,128,0,130,131,132,133,134,135,136,137,135,8,19,138,142,143,144,145,133,52,72,15,146,151,152,146,52,75,75,68,8,153,160,161,133,61,156,40,10,14,16,6,162,171,138,14,150,6,31,25,68,156,180,75,53,1,172,185,132,6,63,59,40,53,181,193,183,186,196,15,75,73,156,72,72,193,75,52,196,207,9,179,204,157,59,184,144,5,33,10,207,142,17,52,42,45,45,42,210,30,145,29,47,49,75,58,223,224,236,45,47,36,160,49,29,144,63,156,31,144,24,180,203,211,201,68,24,151,192,136,252,208,86,40,128,65,92,245,150,144,123,148,143,95,173,36,203,74,0,60,118,140,160,33,3,10,18,150,64,0,65,129,199,143,15,44,2,200,16,99,93,59,118,226,104,57,184,196,9,217,143,65,176,60,196,122,225,48,24,17,75,146,50,208,18,201,144,230,146,151,130,208,213,116,72,4,2,75,78,60,31,25,128,224,128,32,186,125,67,91,74,93,8,41,192,78,86,6,72,9,252,241,163,199,143,25,0,172,13,194,85,130,226,60,73,87,89,29,168,17,225,82,66,170,254,144,210,70,82,112,15,17,9,177,138,116,114,130,251,72,238,163,24,179,46,28,42,27,3,82,139,37,203,206,34,192,123,72,129,223,68,101,107,253,35,84,225,24,50,137,132,2,36,32,116,120,201,11,65,188,80,80,80,148,112,73,82,67,41,166,25,58,188,15,222,160,18,63,84,9,210,155,1,64,86,78,64,17,145,66,250,40,117,48,36,134,34,132,168,133,66,80,100,184,25,106,3,112,64,113,71,216,231,37,136,236,232,138,108,9,230,71,42,82,4,208,187,132,177,32,10,201,218,2,72,120,214,144,227,105,213,107,45,227,251,232,252,18,231,131,30,200,247,248,28,128,10,196,75,202,23,114,31,181,147,209,75,198,224,54,136,111,156,228,144,129,108,172,41,132,8,127,67,133,32,30,38,66,229,70,32,45,53,8,210,217,14,178,153,247,16,98,29,125,116,202,105,145,120,32,224,107,193,44,212,89,11,245,237,71,203,75,222,229,242,1,39,67,48,86,195,15,68,40,7,0,48,75,160,184,224,138,219,16,34,226,50,58,38,34,84,58,24,124,208,193,7,34,185,237,151,27,38,21,84,160,200,143,57,2,80,66,13,77,214,224,78,56,155,240,211,67,134,74,130,162,0,18,210,37,210,1,126,40,188,216,137,52,253,153,54,72,151,153,64,165,72,103,105,114,34,93,47,254,16,194,38,38,213,37,241,38,51,63,164,208,142,10,56,114,98,163,134,35,98,82,203,158,181,220,68,232,79,142,68,182,36,90,201,40,114,95,122,73,5,80,154,117,138,140,185,140,10,41,182,119,40,105,60,30,50,205,100,134,136,136,12,134,146,60,128,102,97,138,136,128,195,16,45,108,102,8,119,193,12,10,211,14,180,232,144,194,12,182,218,215,78,10,151,130,72,8,35,137,148,38,130,8,180,16,17,195,131,131,220,71,145,156,211,113,229,21,63,200,184,38,10,178,17,25,151,204,18,33,28,2,88,50,80,169,167,204,184,180,88,187,74,150,78,146,37,13,17,178,22,130,64,11,151,14,165,67,11,215,229,34,143,33,42,208,192,108,112,70,122,224,239,191,0,123,112,164,176,61,26,18,8,0,33,249,4,13,10,0,0,0,44,4,0,13,0,67,0,42,0,0,7,254,128,0,130,131,132,133,134,135,136,137,138,139,140,141,142,141,75,75,143,147,148,147,145,145,149,153,154,134,151,152,155,159,149,157,162,160,164,135,162,167,158,165,170,0,168,167,171,171,173,151,175,179,146,172,178,142,177,168,150,181,140,157,143,185,186,144,190,139,195,194,192,197,189,200,166,202,138,188,203,183,184,202,199,193,148,208,209,169,211,185,187,169,191,188,217,218,221,220,154,174,201,226,196,214,179,231,206,229,235,233,137,208,237,156,230,205,204,182,241,207,131,247,249,232,244,163,133,254,239,110,241,35,84,79,30,181,125,214,226,9,156,135,80,159,60,65,204,252,21,132,40,46,86,166,130,216,6,54,156,118,49,161,44,111,26,41,102,27,231,177,164,195,145,155,144,1,180,119,50,36,168,136,220,38,218,115,39,210,97,195,126,52,69,178,107,105,147,152,186,154,223,98,50,52,214,47,40,57,132,41,135,178,52,202,79,38,206,128,43,9,186,100,73,146,167,198,168,6,123,62,179,202,16,171,193,142,74,169,110,149,233,116,235,79,68,22,209,122,221,184,246,26,166,181,20,76,15,130,5,121,53,238,84,162,82,235,198,85,117,239,110,78,85,129,0,0,33,249,4,13,10,0,0,0,44,4,0,12,0,67,0,44,0,0,7,254,128,0,130,131,132,133,134,135,136,137,138,139,140,141,142,142,75,143,146,147,147,75,150,148,152,153,134,150,151,154,158,152,156,145,159,163,143,161,145,156,164,169,131,166,172,161,170,163,173,177,175,164,177,174,179,183,168,165,181,166,149,162,140,185,144,187,188,193,157,139,192,141,194,195,200,182,137,202,204,146,202,203,199,201,181,148,199,196,167,212,187,189,190,186,162,218,219,208,197,149,130,209,191,227,210,183,196,220,170,232,205,192,238,155,241,242,230,0,207,239,157,247,133,250,244,172,253,221,135,108,241,91,117,13,81,181,125,2,209,193,43,104,207,159,56,134,188,6,150,3,7,16,27,161,92,249,24,18,4,151,105,225,51,137,13,181,105,154,246,81,227,196,86,175,174,149,156,119,178,98,187,121,221,64,130,252,100,114,35,74,132,46,83,97,164,120,175,38,205,75,60,245,249,244,132,42,40,190,142,57,55,182,236,119,46,169,49,150,33,67,186,156,25,213,90,77,89,56,161,46,229,230,244,102,86,173,84,153,226,131,232,53,96,216,139,96,7,30,52,232,240,95,216,164,27,204,234,217,12,234,84,154,175,178,104,233,194,82,216,246,43,181,118,108,135,170,35,58,184,112,161,64,0,59]);

const enc = new TextEncoder();
const dec = new TextDecoder();

const HEADERS = {
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "Referrer-Policy":"no-referrer",
  "Permissions-Policy":"camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy":"same-origin"
};
const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'";

function json(data,status=200,extra={}) {
  return new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8",...HEADERS,...extra}});
}
function html(s,status=200){return new Response(s,{status,headers:{"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":CSP,...HEADERS}})}
function now(){return new Date().toISOString().replace("T"," ").slice(0,19)}
function utcDate(){return new Date().toISOString().slice(0,10)}
function cnDate(){return new Date(Date.now()+8*3600000).toISOString().slice(0,10)}
function cnDayStart(){const d=new Date(Date.now()+8*3600000);d.setUTCHours(0,0,0,0);return new Date(d.getTime()-8*3600000).toISOString().replace("T"," ").slice(0,19)}
function daysAgo(n){return new Date(Date.now()-n*86400000).toISOString().replace("T"," ").slice(0,19)}
function safeText(v,n=500){return String(v??"").slice(0,n)}
function validId(v){return /^[0-9a-f]{64}$/.test(String(v))}
function validWx(v){return typeof v==="string" && v.length>0 && v.length<=64}
function validIp(v){return typeof v==="string" && v.length>0 && v.length<=64}
function escapeLike(s){return String(s).replace(/[\\%_]/g,m=>"\\"+m)}
function maskWxId(s){s=String(s||""); if(s.length<=4)return s.replace(/./g,"*"); return s.slice(0,2)+"***"+s.slice(-2)}
function maskContent(s){s=String(s||""); if(s.length<5)return s; return s.slice(0,2)+"…"+s.slice(-2)}

async function sha256Hex(s){const h=await crypto.subtle.digest("SHA-256",enc.encode(String(s)));return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function randomHex(n){const a=crypto.getRandomValues(new Uint8Array(n));return [...a].map(x=>x.toString(16).padStart(2,"0")).join("")}
function hexBytes(h){const a=new Uint8Array(h.length/2);for(let i=0;i<a.length;i++)a[i]=parseInt(h.slice(i*2,i*2+2),16);return a}
async function pbkdf2(password,saltHex,iters){const k=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);const b=await crypto.subtle.deriveBits({name:"PBKDF2",salt:hexBytes(saltHex),iterations:iters,hash:"SHA-256"},k,256);return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function hashPassword(password,iters=PBKDF2_DEFAULT){const salt=await randomHex(16);return `pbkdf2$${iters}$${salt}$${await pbkdf2(password,salt,iters)}`}
async function passwordMatches(password,stored,maxIter=1000000){
  const p=String(stored||"").split("$"); if(p.length!==4||p[0]!=="pbkdf2")return false;
  const it=Number(p[1]); if(!Number.isInteger(it)||it<1000||it>maxIter)return false;
  const h=await pbkdf2(password,p[2],it); return await sha256Hex(h)===await sha256Hex(p[3]);
}
async function computeId(wx,content,createTime){return sha256Hex(wx+"\0"+content+"\0"+String(createTime))}
function ip(req){return req.headers.get("CF-Connecting-IP")||"unknown"}
function isAdmin(wx,env){return !!wx && String(env.ADMIN||"").split(",").map(s=>s.trim()).filter(Boolean).includes(wx)}

async function rateLimit(key,limit,env,failClosed=false){
  const u="https://wekit-rr-ratelimit.invalid/"+encodeURIComponent(key);
  try{
    const c=caches.default, hit=await c.match(u); let n=0;
    if(hit){const x=await hit.json();n=Number(x.count)||0}
    if(n>=limit)return false;
    await c.put(u,new Response(JSON.stringify({count:n+1}),{headers:{"Cache-Control":`max-age=${WINDOW}`}})); return true;
  }catch(e){console.error("rate limit",e);return !failClosed}
}
async function audit(db,wxId,action,detail="",addr=""){
  try{await db.prepare("INSERT INTO audit_logs (wx_id,action,detail,ip,timestamp) VALUES (?,?,?,?,?)").bind(wxId||null,action,safeText(detail),addr||null,now()).run()}catch(e){console.error("audit",e)}
}
function getFormula(env,key){return String(env[key]||"x").trim()||"x"}

/* Safe formula parser: x, + - * / % ^, (), floor/ceil/round/abs/min/max/pow */
function formulaValue(src,x){
  const t=[];let i=0;
  while(i<src.length){
    const c=src[i]; if(/\s/.test(c)){i++;continue}
    if(/[0-9.]/.test(c)){let j=i+1;while(j<src.length&&/[0-9.]/.test(src[j]))j++;const n=Number(src.slice(i,j));if(!Number.isFinite(n))throw Error("invalid number");t.push(["n",n]);i=j;continue}
    if(/[A-Za-z]/.test(c)){let j=i+1;while(j<src.length&&/[A-Za-z0-9_]/.test(src[j]))j++;t.push(["id",src.slice(i,j)]);i=j;continue}
    if("+-*/%^".includes(c))t.push(["op",c]);else if(c==="("||c===")")t.push(["p",c]);else if(c===",")t.push(["c",c]);else throw Error("invalid formula character");i++
  }
  let p=0;
  const peek=()=>t[p]||["e",""]; const take=()=>t[p++]||["e",""];
  function expr(){let a=term();while(peek()[0]==="op"&&(peek()[1]==="+"||peek()[1]==="-")){const o=take()[1],b=term();a=o==="+"?a+b:a-b}return a}
  function term(){let a=power();while(peek()[0]==="op"&&["*","/","%"].includes(peek()[1])){const o=take()[1],b=power();a=o==="*"?a*b:o==="/" ? a/b:a%b}return a}
  function power(){let a=unary();if(peek()[0]==="op"&&peek()[1]==="^"){take();a=Math.pow(a,power())}return a}
  function unary(){if(peek()[0]==="op"&&(peek()[1]==="+"||peek()[1]==="-")){const o=take()[1],v=unary();return o==="-"?-v:v}return primary()}
  function primary(){
    const z=take();if(z[0]==="n")return z[1];if(z[0]==="id"){if(z[1]==="x")return x;
      const f={floor:Math.floor,ceil:Math.ceil,round:Math.round,abs:Math.abs,min:Math.min,max:Math.max,pow:Math.pow}[z[1]];
      if(!f)throw Error("unknown function"); if(take()[1]!=="(")throw Error("missing ("); const a=[expr()];while(peek()[0]==="c"){take();a.push(expr())}if(take()[1]!==")")throw Error("missing )");return f(...a)}
    if(z[0]==="p"&&z[1]==="("){const v=expr();if(take()[1]!==")")throw Error("missing )");return v}throw Error("formula syntax")
  }
  const v=expr();if(peek()[0]!=="e")throw Error("formula syntax");return Number.isFinite(v)?Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.round(v))):0
}
function quota(env,key,level){try{return formulaValue(getFormula(env,key),Math.max(0,Math.min(99,Number(level)||0)))}catch{return Math.max(0,Number(level)||0)}}
async function quotaD1(db,env,key,level){let f=getFormula(env,key);try{const r=await db.prepare("SELECT value FROM meta WHERE key=?").bind("formula:"+key).first();if(r?.value)f=String(r.value)}catch{}try{return formulaValue(f,Math.max(0,Math.min(99,Number(level)||0)))}catch{return Math.max(0,Number(level)||0)}}

function cookieValue(req){
  const h=req.headers.get("Cookie")||"";for(const p of h.split(";")){const q=p.trim();if(q.startsWith("__Host-session="))return q.slice(15)}return ""
}
async function session(req,env){
  const v=cookieValue(req); if(!v.startsWith("sess_"))return null;
  const row=await env.DB.prepare("SELECT s.wx_id wxId,s.expires_at expiresAt,u.level level,u.geo_count geoCount,u.geo_date geoDate FROM sessions s JOIN users u ON u.wx_id=s.wx_id WHERE s.token_hash=?").bind(await sha256Hex(v.slice(5))).first();
  if(!row||row.expiresAt<=now())return null;
  return {wxId:row.wxId,level:Math.max(0,Math.min(99,Number(row.level)||0)),geoCount:Number(row.geoCount)||0,geoDate:String(row.geoDate||""),isAdmin:isAdmin(row.wxId,env)}
}
async function setSession(db,wxId){
  const token=await randomHex(32), exp=new Date(Date.now()+SESSION_DAYS*86400000).toISOString().replace("T"," ").slice(0,19);
  await db.prepare("DELETE FROM sessions WHERE expires_at<?").bind(now()).run();
  await db.prepare("INSERT INTO sessions(token_hash,wx_id,created_at,expires_at) VALUES(?,?,?,?)").bind(await sha256Hex(token),wxId,now(),exp).run();
  return `__Host-session=sess_${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS*86400}`
}
async function destroySession(req,db){const v=cookieValue(req);if(v.startsWith("sess_"))await db.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256Hex(v.slice(5))).run()}
async function revokeOther(req,db,wxId){const v=cookieValue(req);if(v.startsWith("sess_"))await db.prepare("DELETE FROM sessions WHERE wx_id=? AND token_hash!=?").bind(wxId,await sha256Hex(v.slice(5))).run();else await db.prepare("DELETE FROM sessions WHERE wx_id=?").bind(wxId).run()}

async function readBody(req){
  const ct=req.headers.get("content-type")||"";
  if(ct.includes("application/x-www-form-urlencoded")||ct.includes("multipart/form-data")){const f=await req.formData();return Object.fromEntries([...f.entries()].map(([k,v])=>[k,typeof v==="string"?v:""]))}
  return await req.json()
}
async function message(db,id){return await db.prepare("SELECT id,wx_id,content,timestamp,is_public FROM messages WHERE id=?").bind(id).first()}
async function blocks(db,id,owner){
  const s=new Set();
  const globalRows=(await db.prepare("SELECT ip FROM ip_block_global").all()).results||[];
  for(const q of globalRows)s.add(q.ip);
  const messageRows=(await db.prepare("SELECT ip FROM ip_block_message WHERE id=?").bind(id).all()).results||[];
  for(const q of messageRows)s.add(q.ip);
  if(owner){
    const accountRows=(await db.prepare("SELECT ip FROM ip_block_account WHERE wx_id=?").bind(owner).all()).results||[];
    for(const q of accountRows)s.add(q.ip);
  }
  return s;
}
function geoUsed(s){return s.geoDate===utcDate()?s.geoCount:0}

async function geoLookup(addr,env){
  const tasks=[];
  if(env.GEO_ALLOW_HTTP!=="0")tasks.push(fetch(`http://ip-api.com/json/${encodeURIComponent(addr)}?fields=status,country,regionName,city,isp&lang=zh-CN`,{signal:AbortSignal.timeout(3000)}).then(r=>r.json()).then(x=>x.status==="success"?{country:x.country||"",region:x.regionName||"",city:x.city||"",isp:x.isp||""}:null).catch(()=>null));
  tasks.push(fetch(`https://ipwho.is/${encodeURIComponent(addr)}`,{signal:AbortSignal.timeout(3000)}).then(r=>r.json()).then(x=>x.success!==false?{country:x.country||"",region:x.region||"",city:x.city||"",isp:x.connection?.isp||x.isp||""}:null).catch(()=>null));
  const [zh,en0]=await Promise.all(tasks);
  const en=en0||zh||{country:"",region:"",city:"",isp:""};
  const z=zh||en;
  return {zh:z,en};
}

/* ---------- UI ---------- */
function shell(title,body,script=""){return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0b1220"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="format-detection" content="telephone=no"><title>${title}</title><style>
:root{color-scheme:dark;--bg:#0b1220;--card:#111827;--card2:#0f172a;--line:#263449;--text:#e5e7eb;--muted:#94a3b8;--blue:#2563eb;--danger:#b91c1c}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}html{font-size:16px;text-size-adjust:100%;-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans SC",sans-serif;min-height:100dvh;padding:env(safe-area-inset-top) max(12px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));overscroll-behavior-y:none}body,button,input,select{font-size:16px}.wrap{width:100%;max-width:1100px;margin:0 auto;padding:8px 0 20px}a{color:#93c5fd}.top{position:sticky;top:env(safe-area-inset-top);z-index:10;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 -2px 12px;padding:8px 2px;background:linear-gradient(var(--bg) 78%,transparent);backdrop-filter:blur(8px)}.top h1{font-size:20px;line-height:1.25;margin:0}.muted{color:var(--muted);font-size:13px;line-height:1.5}.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;margin:10px 0;box-shadow:0 1px 2px #0003}.card h3{margin:0 0 12px;font-size:16px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.controls{display:flex;gap:8px;flex-wrap:wrap}.input,select{width:auto;min-width:0;background:var(--card2);color:var(--text);border:1px solid #334155;border-radius:10px;padding:10px 12px;min-height:44px;outline:none;font:inherit;appearance:auto}.input::placeholder{color:#64748b}.input:focus,select:focus{border-color:#60a5fa;box-shadow:0 0 0 2px #2563eb33}.btn{border:0;border-radius:10px;padding:10px 13px;min-height:44px;background:var(--blue);color:#fff;font-weight:650;cursor:pointer;touch-action:manipulation;white-space:nowrap}.btn:active{transform:translateY(1px)}.btn.secondary{background:#334155}.btn.danger{background:var(--danger)}.btn.small{min-height:40px;padding:8px 10px;font-size:14px}.table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.table{width:100%;border-collapse:collapse}.table th,.table td{text-align:left;padding:10px 8px;border-bottom:1px solid #223047;vertical-align:top;font-size:14px}.table th{color:var(--muted);font-weight:650}.table td{overflow-wrap:anywhere}.msg{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5}.pill{display:inline-block;padding:4px 9px;border-radius:999px;background:#1e293b;color:#cbd5e1;font-size:12px}.nav{display:flex;gap:8px;flex-wrap:wrap}.toast{position:fixed;left:50%;right:auto;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);background:#1e293b;border:1px solid #334155;padding:11px 13px;border-radius:10px;z-index:30;max-width:min(92vw,520px);box-shadow:0 8px 30px #0006}.hide{display:none}.row{display:flex;justify-content:space-between;gap:10px;align-items:center}.field{display:grid;gap:6px;margin:10px 0}.field label{font-weight:650;font-size:14px}.ip-list{display:grid;gap:8px}.ip-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--card2)}.ip-item code{overflow-wrap:anywhere}.danger-text{color:#fca5a5}
@media(max-width:720px){body{padding-left:max(10px,env(safe-area-inset-left));padding-right:max(10px,env(safe-area-inset-right))}.wrap{padding-top:2px}.top{align-items:center;margin-bottom:8px}.top>div:first-child{min-width:0;flex:1}.top h1{font-size:19px}.top .nav{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.top .nav:has(.btn:nth-child(2):last-child){grid-template-columns:repeat(2,minmax(0,1fr))}.top .nav .btn{width:100%}.card{padding:12px;border-radius:12px}.grid{grid-template-columns:1fr}.controls{display:grid;grid-template-columns:1fr;gap:8px}.controls>*{width:100%;min-width:0}.controls .btn{width:100%}.controls.inline{display:flex}.controls.inline>*{width:auto;flex:1;min-width:0}.nav{gap:7px}.nav .btn{flex:1}.row{align-items:flex-start}.row>span{max-width:65%}.table thead{display:none}.table,.table tbody,.table tr,.table td{display:block;width:100%}.table tr{border:1px solid var(--line);border-radius:12px;margin:8px 0;background:var(--card2);overflow:hidden}.table td{border:0;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;gap:12px;text-align:right;overflow-wrap:anywhere;min-height:42px}.table td:last-child{border-bottom:0}.table td:before{content:attr(data-label);color:var(--muted);font-weight:650;text-align:left;flex:0 0 auto}.table td[data-label="操作"]{display:flex;flex-wrap:wrap;justify-content:flex-start;text-align:left}.table td[data-label="操作"]:before{width:100%;margin-bottom:2px}.table td[data-label="消息"]{display:block;text-align:left}.table td[data-label="消息"]:before{display:block;margin-bottom:5px}.table td[data-label="UA"]{display:block;text-align:left}.table td[data-label="UA"]:before{display:block;margin-bottom:5px}.table td[data-label="地区"]{display:block;text-align:left}.table td[data-label="地区"]:before{display:block;margin-bottom:5px}.table td[data-label="操作"] .btn{width:auto;flex:1;min-width:90px}.table-wrap{overflow:visible}.msg{font-size:15px}.pill{font-size:12px}.toast{font-size:14px}.login-card{margin:5vh auto!important}}
@media(min-width:721px){.table-wrap{overflow-x:auto}}
</style></head><body><div class="wrap">${body}</div><div id="toast" class="toast hide"></div><script>${script}</script></body></html>`}
function loginPage(invite){
  const body=`<div class="card" style="max-width:460px;margin:7vh auto"><h1>WeKit 已读回执</h1><p class="muted">Cloudflare Worker + D1</p>
  <div class="controls"><input id="wx" class="input" placeholder="wxId" autocomplete="username"><input id="pw" class="input" type="password" placeholder="密码（至少 8 位）" autocomplete="current-password">${invite?'<input id="iv" class="input" placeholder="邀请码">':""}</div>
  <div class="controls" style="margin-top:10px"><button class="btn" onclick="go(0)">登录</button><button class="btn secondary" onclick="go(1)">注册</button></div><p id="err" class="danger-text"></p></div>`;
  return shell("登录",body,`async function go(reg){const wx=wxv=document.getElementById('wx').value.trim(),pw=document.getElementById('pw').value;const b=reg?{wxId:wx,password:pw,inviteCode:document.getElementById('iv')?.value||''}:{wxId:wx,password:pw};try{const r=await fetch(reg?'/auth/register':'/auth/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const x=await r.json();if(!r.ok)throw Error(x.error||'失败');location='/'}catch(e){document.getElementById('err').textContent=e.message}}`);
}
function dashboardPage(s){
  const body=`<div class="top"><div><h1>已读回执</h1><div class="muted">${esc(s.wxId)} · 等级 ${s.level} · 消息配额 ${s.msgQuota} · 定位剩余 ${s.geoRemaining}</div></div><div class="nav"><button class="btn small secondary" onclick="location='/account'">账户</button>${s.isAdmin?'<button class="btn small secondary" onclick="location=\'/admin\'">管理</button>':""}<button class="btn small secondary" onclick="logout()">退出</button></div></div>
  <div class="card"><div class="controls"><input id="q" class="input" placeholder="搜索消息"><button class="btn" onclick="load()">刷新</button><button class="btn danger" onclick="clearAll()">清空我的消息</button></div></div>
  <div class="card"><div class="row"><b>排行榜</b><span><button class="btn small secondary" onclick="lb('reg','total')">注册</button> <button class="btn small secondary" onclick="lb('read','total')">已读</button> <button class="btn small secondary" onclick="lb('msg','total')">消息</button></span></div><div id="lb" style="margin-top:8px"></div></div>
  <div class="card"><div class="row"><b>消息</b><span id="total" class="muted"></span></div><div class="table-wrap"><table class="table"><thead><tr><th>消息</th><th>已读</th><th>时间</th><th>操作</th></tr></thead><tbody id="rows"></tbody></table></div></div>`;
  return shell("仪表盘",body,`const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function toast(x){const e=document.getElementById('toast');e.textContent=x;e.classList.remove('hide');setTimeout(()=>e.classList.add('hide'),2200)}
async function load(){const q=encodeURIComponent(document.getElementById('q').value);const r=await fetch('/messages?q='+q+'&limit=50&offset=0');if(!r.ok){toast('加载失败');return}const x=await r.json();document.getElementById('total').textContent='共 '+(r.headers.get('X-Total-Count')||x.length)+' 条';document.getElementById('rows').innerHTML=x.map(m=>'<tr><td data-label="消息"><div class="msg">'+esc(m.content)+'</div></td><td data-label="已读"><span class="pill">'+m.reads+'</span></td><td data-label="时间">'+esc(m.timestamp)+'</td><td data-label="操作"><button class="btn small" onclick="detail(\\''+m.id+'\\')">详情</button> <button class="btn small danger" onclick="del(\\''+m.id+'\\')">删除</button></td></tr>').join('')||'<tr><td colspan="4">暂无消息</td></tr>'}
async function detail(id){location='/reads/'+id}async function del(id){if(!confirm('删除这条消息？'))return;const r=await fetch('/reads/'+id,{method:'DELETE'});toast(r.ok?'已删除':'删除失败');if(r.ok)load()}async function clearAll(){if(!confirm('清空全部消息？'))return;const r=await fetch('/messages',{method:'DELETE'});toast(r.ok?'已清空':'失败');if(r.ok)load()}async function lb(metric,scope){const r=await fetch('/leaderboard?metric='+metric+'&scope='+scope);const x=await r.json();document.getElementById('lb').innerHTML='<ol>'+x.map(a=>'<li>'+esc(a.wxId)+(a.content?' — '+esc(a.content):'')+'：'+a.count+(a.me?'（我）':'')+'</li>').join('')+'</ol>'}async function logout(){await fetch('/auth/logout',{method:'POST'});location='/login'}load();lb('reg','total')`);
}

function formatReadVisitor(read){
  const ip = read?.ip || '—';
  const time = read?.timestamp || read?.time || '—';
  const ua = read?.user_agent || read?.userAgent || '—';
  const country = read?.country || read?.country_en || '—';
  const region = read?.region || read?.region_en || '—';
  const city = read?.city || read?.city_en || '—';
  const isp = read?.isp || read?.isp_en || '—';
  return {
    ip, time, ua, country, region, city, isp,
    location: [country, region, city].filter(Boolean).join(' / ') || '—'
  };
}

function readPage(s,m){
  const body=`<div class="top"><div><h1>已读详情</h1><div class="muted">${esc(m.id)}</div></div><div class="nav"><button class="btn small secondary" onclick="location.href='/'">返回</button></div></div>
  <div class="card"><div class="msg">${esc(m.content)}</div><div class="muted" style="margin-top:8px">公开：${m.is_public?'是':'否'}</div><div class="controls" style="margin-top:10px">${s.canManage?'<button class="btn small" onclick="pub()">切换公开</button><button class="btn small secondary" onclick="blockCurrent()">拉黑当前访问 IP</button>':''}</div></div>
  ${s.canManage?'<div class="card"><div class="row"><b>消息 IP 黑名单</b><span id="blockStat" class="muted"></span></div><div id="msgBlockList" class="ip-list" style="margin-top:8px"><div class="muted">正在加载…</div></div></div>':''}
  <div class="card"><div class="row"><b>访问记录</b><span id="stat" class="muted"></span></div><div class="table-wrap"><table class="table"><thead><tr><th>IP</th><th>UA</th><th>时间</th><th>地区</th><th>操作</th></tr></thead><tbody id="reads"></tbody></table></div></div>`;
  return shell("已读详情",body,`const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){const r=await fetch('/reads/${m.id}/data?page=1&pageSize=200',{method:'GET',credentials:'same-origin',cache:'no-store'});if(!r.ok){let e='加载访问记录失败';try{const z=await r.json();if(z?.error==='forbidden'||z?.error==='unauthorized')e='当前会话无权限，请重新登录后从仪表盘打开该消息';else if(z?.error==='not found')e='消息不存在或已被删除';else if(z?.error)e='加载失败：'+z.error;}catch{}document.getElementById('reads').innerHTML='<tr><td colspan="5">'+esc(e)+'</td></tr>';return}const x=await r.json();document.getElementById('stat').textContent='可见 '+x.visibleTotal+' / 总计 '+x.total+'，隐藏 '+x.blockedCount;document.getElementById('reads').innerHTML=x.reads.map(a=>{const actions=${s.canManage?`'<button class="btn small" data-ip="'+encodeURIComponent(a.ip)+'" onclick="geo(this.dataset.ip)">定位</button> <button class="btn small danger" data-ip="'+encodeURIComponent(a.ip)+'" onclick="block(this.dataset.ip)">拉黑</button>'`:`''`};return '<tr><td data-label="IP"><code>'+esc(a.ip)+'</code></td><td data-label="UA">'+esc(a.userAgent)+'</td><td data-label="时间">'+esc(a.timestamp)+'</td><td data-label="地区">'+esc((a.country||'')+' '+(a.region||'')+' '+(a.city||'')+' '+(a.isp||''))+'</td><td data-label="操作">'+actions+'</td></tr>'}).join('')||'<tr><td colspan="5">暂无记录</td></tr>'}
async function geo(ip){ip=decodeURIComponent(ip);const r=await fetch('/reads/${m.id}/geo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip})});alert((await r.json()).error||'已更新');load()}
async function block(ip){ip=decodeURIComponent(ip);const r=await fetch('/reads/${m.id}/block',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip})});alert((await r.json()).error||'已拉黑');load();loadBlocks()}
async function blockCurrent(){const r=await fetch('/reads/${m.id}/block',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'current'})});alert((await r.json()).error||'已拉黑');load();loadBlocks()}
async function loadBlocks(){const r=await fetch('/reads/${m.id}/block',{cache:'no-store'});if(!r.ok)return;const x=await r.json();document.getElementById('blockStat').textContent='共 '+x.count+' 个';document.getElementById('msgBlockList').innerHTML=x.ips.map(a=>'<div class="ip-item"><code>'+esc(a.ip)+'</code><button class="btn small danger" data-ip="'+encodeURIComponent(a.ip)+'" onclick="unblock(this.dataset.ip)">移除</button></div>').join('')||'<div class="muted">暂无黑名单 IP</div>'}
async function unblock(ip){ip=decodeURIComponent(ip);const r=await fetch('/reads/${m.id}/block',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip})});if(r.ok)loadBlocks();else alert((await r.json()).error||'移除失败')}
async function pub(){const r=await fetch('/reads/${m.id}/public',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({public:${m.is_public?0:1}})});if(r.ok)location.reload()}
load();loadBlocks()`);
}
function accountPage(){
  const body=`<div class="top"><h1>账户设置</h1><button class="btn small secondary" onclick="location='/'">返回</button></div><div class="card"><h3>修改密码</h3><div class="controls"><input id="oldPw" class="input" type="password" placeholder="旧密码"><input id="newPw" class="input" type="password" placeholder="新密码"><button class="btn" onclick="pass()">保存</button></div></div><div class="card"><h3>账户 IP 黑名单</h3><div class="controls inline"><input id="ip" class="input" placeholder="IP"><button class="btn" onclick="add()">添加</button></div><div id="list"></div></div>`;
  return shell("账户",body,`async function pass(){const r=await fetch('/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({oldPassword:document.getElementById('oldPw').value,newPassword:document.getElementById('newPw').value})});alert((await r.json()).error||'密码已修改')}async function load(){const r=await fetch('/account/ip-block');const x=await r.json();list.innerHTML=x.ips.map(a=>'<div class="row card"><code>'+a.ip+'</code><button class="btn small danger" onclick="rm(\\''+a.ip+'\\')">删除</button></div>').join('')}async function add(){const r=await fetch('/account/ip-block',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip:ip.value.trim()})});alert((await r.json()).error||'已添加');load()}async function rm(x){await fetch('/account/ip-block',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip:x})});load()}load()`);
}
function adminPage(){
  const body=`<div class="top"><h1>管理后台</h1><div class="nav"><button class="btn small secondary" onclick="location='/'">仪表盘</button></div></div>
  <div class="card"><h3>创建用户</h3><div class="controls"><input id="nw" class="input" placeholder="wxId"><input id="np" class="input" type="password" placeholder="密码"><input id="nl" class="input" type="number" value="1" min="0" max="99"><button class="btn" onclick="createUser()">创建</button></div></div>
  <div class="card"><h3>等级权益公式</h3>
  <div class="field"><label for="fm">消息配额公式</label><div class="muted">x = 用户等级；计算结果为该等级允许的消息数量。例如 x * 20 表示 5 级可用 100 条。</div><input id="fm" class="input" value="x" placeholder="例如：max(10, x * 20)"></div>
  <div class="field"><label for="fg">定位配额公式</label><div class="muted">x = 用户等级；计算结果为每日可使用的 IP 定位次数。例如 x * 5 表示 5 级每天 25 次。</div><input id="fg" class="input" value="x" placeholder="例如：max(5, x * 5)"></div>
  <div class="field"><label for="fr">消息保留时长公式</label><div class="muted">x = 用户等级；计算结果单位是“月”，用于自动清理旧消息。例如 x * 3 表示 5 级保留 15 个月。</div><input id="fr" class="input" value="x" placeholder="例如：min(24, x * 3)"></div>
  <div class="controls"><button class="btn" onclick="saveFormula()">保存公式</button></div><p class="muted">支持：x、+ - * / % ^、括号，以及 floor / ceil / round / abs / min / max / pow。</p></div>
  <div class="card"><h3>用户</h3><div class="controls"><input id="uq" class="input" placeholder="搜索 wxId"><button class="btn" onclick="users()">刷新</button></div><div class="table-wrap"><table class="table"><thead><tr><th>wxId</th><th>等级</th><th>消息数</th><th>累计注册</th><th>操作</th></tr></thead><tbody id="us"></tbody></table></div></div>
  <div class="card"><h3>全局 IP 黑名单</h3><div class="controls inline"><input id="gip" class="input" placeholder="IP"><button class="btn" onclick="gadd()">添加</button></div><div id="gl"></div></div>
  <div class="card"><h3>僵尸用户清理</h3>
  <div class="field"><label for="nd">从未注册天数</label><div class="muted">仅清理创建后超过此天数、且从未注册过消息的用户。填 0 表示不启用此条件。</div><input id="nd" class="input" type="number" min="0" value="0" placeholder="例如：30"></div>
  <div class="field"><label for="dd">沉寂天数</label><div class="muted">清理超过此天数没有活动/注册消息的用户。填 0 表示不启用此条件。</div><input id="dd" class="input" type="number" min="0" value="0" placeholder="例如：180"></div>
  <div class="controls"><button class="btn" onclick="retSave()">保存策略</button><button class="btn danger" onclick="retRun()">立即清理</button></div>
  <p class="muted">建议先保存策略，再使用“立即清理”。清理操作会删除符合条件用户及其关联数据。</p></div>`;
  return shell("管理后台",body,`const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));async function users(){const r=await fetch('/admin/users?page=1&pageSize=100&q='+encodeURIComponent(uq.value));const x=await r.json();us.innerHTML=x.rows.map(a=>'<tr><td data-label="wxId">'+esc(a.wxId)+'</td><td data-label="等级">'+a.level+'</td><td data-label="消息数">'+a.messageCount+'</td><td data-label="累计注册">'+a.totalRegMsgs+'</td><td data-label="操作"><button class="btn small" onclick="lvl(\\''+esc(a.wxId)+'\\')">改等级</button> <button class="btn small danger" onclick="delu(\\''+esc(a.wxId)+'\\')">删除</button></td></tr>').join('')}async function createUser(){const r=await fetch('/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wxId:nw.value,password:np.value,level:Number(nl.value)})});alert((await r.json()).error||'创建成功');users()}async function lvl(w){const v=prompt('等级 0-99');if(v===null)return;const r=await fetch('/admin/level',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wxId:w,level:Number(v)})});alert((await r.json()).error||'已更新');users()}async function delu(w){if(!confirm('删除用户及全部数据？'))return;const r=await fetch('/admin/users/'+encodeURIComponent(w),{method:'DELETE'});alert((await r.json()).error||'已删除');users()}async function saveFormula(){const r=await fetch('/admin/levels',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:fm.value,geo:fg.value,retentionMonths:fr.value})});alert((await r.json()).error||'已保存；立即生效')}async function gload(){const r=await fetch('/admin/ip-block');const x=await r.json();gl.innerHTML=x.ips.map(a=>'<div class="row card"><code>'+a.ip+'</code><button class="btn small danger" onclick="grm(\\''+a.ip+'\\')">删除</button></div>').join('')}async function gadd(){const r=await fetch('/admin/ip-block',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip:gip.value.trim()})});alert((await r.json()).error||'已添加');gload()}async function grm(x){await fetch('/admin/ip-block',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip:x})});gload()}async function retSave(){const r=await fetch('/admin/retention',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({newUserDays:Number(nd.value),dormantDays:Number(dd.value)})});alert((await r.json()).error||'已保存')}async function retRun(){if(!confirm('立即清理？'))return;const r=await fetch('/admin/retention/run',{method:'POST'});alert(JSON.stringify(await r.json()))}users();gload()`);
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

/* ---------- Request handler ---------- */
async function handle(req,env){
  const u=new URL(req.url), p=u.pathname, method=req.method, ip0=ip(req);
  let s=await session(req,env);

  if(p==="/auth/status"&&method==="GET")return json({auth_required:true,invite_required:!!env.INVITE_CODE});
  if(p==="/login"&&method==="GET")return html(loginPage(!!env.INVITE_CODE));

  if(p==="/auth/register"&&method==="POST"){
    if(!(await rateLimit("auth:"+ip0,RATE.auth,env,true)))return json({error:"rate limited"},429);
    let b;try{b=await readBody(req)}catch{return json({error:"invalid JSON"},400)}
    const wx=String(b.wxId||"").trim(),pw=String(b.password||""),iv=String(b.inviteCode??b.invite??"");
    if(!validWx(wx)||pw.length<8||pw.length>128)return json({error:"invalid credentials"},400);
    if(env.INVITE_CODE && !(await sha256Hex(iv)===await sha256Hex(env.INVITE_CODE)))return json({error:"invalid invite code"},403);
    if(await env.DB.prepare("SELECT 1 FROM users WHERE wx_id=?").bind(wx).first())return json({error:"already registered"},409);
    await env.DB.prepare("INSERT INTO users(wx_id,password_hash,level,message_count,created_at,geo_count,geo_date) VALUES(?,?,1,0,?,0,?)").bind(wx,await hashPassword(pw),now(),utcDate()).run();
    await audit(env.DB,wx,"register","",ip0);return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json","Set-Cookie":await setSession(env.DB,wx),...HEADERS}});
  }
  if(p==="/auth/verify"&&method==="POST"){
    if(!(await rateLimit("auth:"+ip0,RATE.auth,env,true)))return json({error:"rate limited"},429);
    let b;try{b=await readBody(req)}catch{return json({error:"invalid JSON"},400)}
    const wx=String(b.wxId||"").trim(),pw=String(b.password||"");const row=await env.DB.prepare("SELECT password_hash FROM users WHERE wx_id=?").bind(wx).first();
    if(!row||!(await passwordMatches(pw,row.password_hash,Number(env.PBKDF2_MAX_ITER||1000000))))return json({error:"invalid credentials"},401);
    await audit(env.DB,wx,"login","",ip0);return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json","Set-Cookie":await setSession(env.DB,wx),...HEADERS}});
  }
  if(p==="/auth/logout"&&method==="POST"){await destroySession(req,env.DB);return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json","Set-Cookie":"__Host-session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",...HEADERS}})}

  if(p==="/pixel"&&method==="GET"){
    const wx=u.searchParams.get("wxId")||"",id=u.searchParams.get("id")||""; if(!validId(id)||!validWx(wx))return new Response(PNG,{headers:{"Content-Type":"image/png","Cache-Control":"no-store",...HEADERS}});
    if(!(await rateLimit("pixel:"+ip0,RATE.pixel,env,false)))return new Response(PNG,{headers:{"Content-Type":"image/png","Cache-Control":"no-store",...HEADERS}});
    const m=await env.DB.prepare("SELECT wx_id FROM messages WHERE id=? AND wx_id=?").bind(id,wx).first();
    if(m) {
      await env.DB.prepare("INSERT OR IGNORE INTO reads(id,ip,timestamp,user_agent) VALUES(?,?,?,?)").bind(id,ip0,now(),safeText(req.headers.get("User-Agent"),500)).run();
      const r=await env.DB.prepare("SELECT 1 FROM reads WHERE id=? AND ip=?").bind(id,ip0).first();
      if(r){
        try{
          await env.DB.prepare("INSERT INTO read_stats(date,wx_id,count) VALUES(?,?,1) ON CONFLICT(date,wx_id) DO UPDATE SET count=count+1").bind(cnDate(),wx).run();
        }catch{}
      }
    }
    return new Response(PNG,{headers:{"Content-Type":"image/png","Cache-Control":"no-store, no-cache, must-revalidate, max-age=0",...HEADERS}});
  }

  if(p==="/count"&&method==="GET"){
    const id=u.searchParams.get("id")||"";if(!validId(id))return json({count:0});
    if(!(await rateLimit("count:"+ip0,RATE.count,env,true)))return json({error:"rate limited"},429);
    const m=await env.DB.prepare("SELECT wx_id FROM messages WHERE id=?").bind(id).first();if(!m)return json({count:0});
    const x=await env.DB.prepare("SELECT COUNT(DISTINCT r.ip) n FROM reads r WHERE r.id=? AND r.ip NOT IN(SELECT ip FROM ip_block_global) AND r.ip NOT IN(SELECT ip FROM ip_block_message WHERE id=?) AND r.ip NOT IN(SELECT ip FROM ip_block_account WHERE wx_id=?)").bind(id,id,m.wx_id).first();return json({count:Number(x?.n||0)});
  }

  if(p==="/register"&&method==="POST"){
    if(!(await rateLimit("register:"+ip0,RATE.register,env,false)))return json({error:"rate limited"},429);
    let b;try{b=await req.json()}catch{return json({error:"invalid JSON"},400)}
    const items=Array.isArray(b)?b:[b];if(!items.length||items.length>MAX_BATCH)return json({error:"invalid batch"},400);const ids=[];
    for(const it of items){
      const wx=typeof it.wxId==="string"?it.wxId:"",content=typeof it.content==="string"?it.content:"",ct=String(it.createTime??"");
      if(!validWx(wx)||!content||content.length>MAX_CONTENT||!/^\d{1,16}$/.test(ct))return json({error:"invalid payload"},400);
      const user=await env.DB.prepare("SELECT level FROM users WHERE wx_id=?").bind(wx).first();if(!user||Number(user.level)<=0)return json({error:"not registered"},403);
      if(!(await rateLimit("wx:"+wx,RATE.register,env,false)))return json({error:"rate limited"},429);
      const id=await computeId(wx,content,ct);const res=await env.DB.prepare("INSERT OR IGNORE INTO messages(id,wx_id,content,timestamp,is_public) VALUES(?,?,?,?,0)").bind(id,wx,content,now()).run();
      if(res.meta?.changes>0){
        await env.DB.prepare("INSERT OR IGNORE INTO ip_block_message(id,ip,created_at) VALUES(?,?,?)").bind(id,ip0,now()).run();
        await env.DB.prepare("INSERT INTO registration_stats(date,wx_id,count) VALUES(?,?,1) ON CONFLICT(date,wx_id) DO UPDATE SET count=count+1").bind(utcDate(),wx).run();
        await enforceQuota(env.DB,wx,Number(user.level),env);
      }
      ids.push(id)
    }
    return json(Array.isArray(b)?{ids}:{id:ids[0]||""});
  }

  const publicReadPath = p.match(/^\/reads\/([^/]+)(?:\/data)?$/);
  if(!s && publicReadPath){
    const id=decodeURIComponent(publicReadPath[1]);
    const m=await message(env.DB,id);
    if(!m)return json({error:"not found"},404);
    if(Number(m.is_public)!==1)return json({error:"forbidden"},403);
    if(p.endsWith("/data")){
      const b=await blocks(env.DB,id,null);
      const all=(await env.DB.prepare("SELECT ip,timestamp,user_agent,country,region,city,isp,country_en,region_en,city_en,isp_en FROM reads WHERE id=? ORDER BY timestamp DESC").bind(id).all()).results;
      const visible=all.filter(x=>!b.has(x.ip));
      return json({id,content:m.content,total:all.length,blockedCount:all.length-visible.length,visibleTotal:visible.length,page:1,pageSize:200,reads:visible.slice(0,200).map(x=>({ip:x.ip,timestamp:x.timestamp,userAgent:x.user_agent,country:x.country,region:x.region,city:x.city,isp:x.isp,countryEn:x.country_en,regionEn:x.region_en,cityEn:x.city_en,ispEn:x.isp_en,located:!!(x.country||x.region||x.city||x.isp)}))});
    }
    return html(readPage({canManage:false},m));
  }

  if(!s){
    if(p==="/")return html(loginPage(!!env.INVITE_CODE));
    return json({error:"unauthorized"},401)
  }

  if(p==="/auth/password"&&method==="POST"){
    if(!(await rateLimit("auth:"+ip0,RATE.auth,env,true)))return json({error:"rate limited"},429);
    const b=await req.json(),oldP=String(b.oldPassword||""),newP=String(b.newPassword||"");const row=await env.DB.prepare("SELECT password_hash FROM users WHERE wx_id=?").bind(s.wxId).first();
    if(!row||!(await passwordMatches(oldP,row.password_hash,Number(env.PBKDF2_MAX_ITER||1000000))))return json({error:"invalid credentials"},401);
    if(newP.length<8||newP.length>128)return json({error:"invalid password"},400);await env.DB.prepare("UPDATE users SET password_hash=? WHERE wx_id=?").bind(await hashPassword(newP),s.wxId).run();await revokeOther(req,env.DB,s.wxId);await audit(env.DB,s.wxId,"password_change","",ip0);return json({ok:true})
  }

  if(p==="/messages"&&method==="GET"){
    await enforceQuota(env.DB,s.wxId,s.level,env);const q=safeText(u.searchParams.get("q")||"",200),lim=Math.min(200,Math.max(1,Number(u.searchParams.get("limit")||50))),off=Math.max(0,Number(u.searchParams.get("offset")||0));
    let rows,total;
    if(q.length>=3){
      try{rows=(await env.DB.prepare(`SELECT m.id,m.content,m.timestamp,(SELECT COUNT(DISTINCT r.ip) FROM reads r WHERE r.id=m.id) reads FROM messages m JOIN messages_fts f ON f.rowid=m.rowid WHERE m.wx_id=? AND f.messages_fts MATCH ? ORDER BY m.timestamp DESC LIMIT ? OFFSET ?`).bind(s.wxId,'"'+q.replaceAll('"','""')+'"',lim,off).all()).results;total=Number((await env.DB.prepare(`SELECT COUNT(*) n FROM messages m JOIN messages_fts f ON f.rowid=m.rowid WHERE m.wx_id=? AND f.messages_fts MATCH ?`).bind(s.wxId,'"'+q.replaceAll('"','""')+'"').first())?.n||0)}catch{rows=null}
    }
    if(!rows){rows=(await env.DB.prepare(`SELECT m.id,m.content,m.timestamp,(SELECT COUNT(DISTINCT r.ip) FROM reads r WHERE r.id=m.id) reads FROM messages m WHERE m.wx_id=? ${q?"AND m.content LIKE ? ESCAPE '\\\\'":""} ORDER BY m.timestamp DESC LIMIT ? OFFSET ?`).bind(...(q?[s.wxId,"%"+escapeLike(q)+"%",lim,off]:[s.wxId,lim,off])).all()).results;total=Number((await env.DB.prepare(`SELECT COUNT(*) n FROM messages m WHERE m.wx_id=? ${q?"AND m.content LIKE ? ESCAPE '\\\\'":""}`).bind(...(q?[s.wxId,"%"+escapeLike(q)+"%"]:[s.wxId])).first())?.n||0)}
    return json(rows.map(r=>({id:r.id,content:r.content,reads:Number(r.reads||0),timestamp:r.timestamp})),200,{"X-Total-Count":String(total)})
  }
  if(p==="/messages"&&method==="DELETE"){await env.DB.prepare("DELETE FROM reads WHERE id IN (SELECT id FROM messages WHERE wx_id=?)").bind(s.wxId).run();await env.DB.prepare("DELETE FROM messages WHERE wx_id=?").bind(s.wxId).run();await env.DB.prepare("UPDATE users SET message_count=0 WHERE wx_id=?").bind(s.wxId).run();await audit(env.DB,s.wxId,"delete_all_messages","",ip0);return json({ok:true})}

  const wm=p.match(/^\/messages\/([^/]+)$/);if(wm&&(method==="GET"||method==="DELETE")){const wx=decodeURIComponent(wm[1]);if(wx!==s.wxId)return json({error:"forbidden"},403);if(method==="DELETE"){await env.DB.prepare("DELETE FROM reads WHERE wx_id=?").bind(wx).run();await env.DB.prepare("DELETE FROM messages WHERE wx_id=?").bind(wx).run();await env.DB.prepare("UPDATE users SET message_count=0 WHERE wx_id=?").bind(wx).run();return json({ok:true})}return json((await env.DB.prepare("SELECT m.id,m.content,m.timestamp,COUNT(DISTINCT r.ip) reads FROM messages m LEFT JOIN reads r ON r.id=m.id WHERE m.wx_id=? GROUP BY m.id ORDER BY m.timestamp DESC").bind(wx).all()).results)}

  const rm=p.match(/^\/reads\/([^/]+)$/);
  if(rm&&method==="GET"){const id=decodeURIComponent(rm[1]),m=await message(env.DB,id);if(!m)return json({error:"not found"},404);if(Number(m.is_public)!==1&&m.wx_id!==s.wxId&&!s.isAdmin)return json({error:"forbidden"},403);return html(readPage({canManage:m.wx_id===s.wxId||s.isAdmin},m))}
  if(rm&&method==="DELETE"){const id=decodeURIComponent(rm[1]),m=await message(env.DB,id);if(!m)return json({error:"not found"},404);if(m.wx_id!==s.wxId&&!s.isAdmin)return json({error:"forbidden"},403);await env.DB.prepare("DELETE FROM reads WHERE id=?").bind(id).run();await env.DB.prepare("DELETE FROM messages WHERE id=?").bind(id).run();await audit(env.DB,s.wxId,"delete_message",id,ip0);return json({ok:true})}

  const rd=p.match(/^\/reads\/([^/]+)\/data$/);
  if(rd&&method==="GET"){const id=decodeURIComponent(rd[1]),m=await message(env.DB,id);if(!m)return json({error:"not found"},404);if(Number(m.is_public)!==1&&m.wx_id!==s.wxId&&!s.isAdmin)return json({error:"forbidden"},403);const owner=m.wx_id===s.wxId?s.wxId:null,b=await blocks(env.DB,id,owner);const all=(await env.DB.prepare("SELECT ip,timestamp,user_agent,country,region,city,isp,country_en,region_en,city_en,isp_en FROM reads WHERE id=? ORDER BY timestamp DESC").bind(id).all()).results;const visible=all.filter(x=>!b.has(x.ip));return json({id,content:m.content,total:all.length,blockedCount:all.length-visible.length,visibleTotal:visible.length,page:1,pageSize:200,reads:visible.slice(0,200).map(x=>({ip:x.ip,timestamp:x.timestamp,userAgent:x.user_agent,country:x.country,region:x.region,city:x.city,isp:x.isp,countryEn:x.country_en,regionEn:x.region_en,cityEn:x.city_en,ispEn:x.isp_en,located:!!(x.country||x.region||x.city||x.isp)}))})}

  const pub=p.match(/^\/reads\/([^/]+)\/public$/);if(pub&&method==="POST"){const id=decodeURIComponent(pub[1]),m=await message(env.DB,id);if(!m)return json({error:"not found"},404);if(m.wx_id!==s.wxId&&!s.isAdmin)return json({error:"forbidden"},403);const b=await req.json();const v=b.public===1||b.public===true||b.public==="1"?1:0;await env.DB.prepare("UPDATE messages SET is_public=? WHERE id=?").bind(v,id).run();return json({ok:true,public:!!v})}

  const blk=p.match(/^\/reads\/([^/]+)\/block$/);if(blk){const id=decodeURIComponent(blk[1]),m=await message(env.DB,id);if(!m)return json({error:"not found"},404);if(m.wx_id!==s.wxId&&!s.isAdmin)return json({error:"forbidden"},403);
    if(method==="GET"){const x=await env.DB.prepare("SELECT ip,created_at createdAt FROM ip_block_message WHERE id=? ORDER BY created_at DESC").bind(id).all();return json({id,count:x.results.length,ips:x.results})}
    if(method==="POST"){const b=await req.json(),v=b.action==="current"?ip0:String(b.ip||"");if(!validIp(v))return json({error:"invalid ip"},400);const r=await env.DB.prepare("INSERT OR IGNORE INTO ip_block_message(id,ip,created_at) VALUES(?,?,?)").bind(id,v,now()).run();if(!r.meta?.changes)return json({error:"exists"},409);return json({ok:true,ip:v})}
    if(method==="DELETE"){const b=await req.json(),v=String(b.ip||"");if(!validIp(v))return json({error:"invalid ip"},400);await env.DB.prepare("DELETE FROM ip_block_message WHERE id=? AND ip=?").bind(id,v).run();return json({ok:true})}
  }

  if(p==="/account"&&method==="GET")return html(accountPage());
  if(p==="/account/ip-block"){
    if(method==="GET"){const x=await env.DB.prepare("SELECT ip,created_at createdAt FROM ip_block_account WHERE wx_id=? ORDER BY created_at DESC").bind(s.wxId).all();return json({count:x.results.length,ips:x.results})}
    if(method==="POST"){const b=await req.json(),v=String(b.ip||"");if(!validIp(v))return json({error:"invalid ip"},400);const r=await env.DB.prepare("INSERT OR IGNORE INTO ip_block_account(wx_id,ip,created_at) VALUES(?,?,?)").bind(s.wxId,v,now()).run();return r.meta?.changes?json({ok:true,ip:v}):json({error:"exists"},409)}
    if(method==="DELETE"){const b=await req.json(),v=String(b.ip||"");await env.DB.prepare("DELETE FROM ip_block_account WHERE wx_id=? AND ip=?").bind(s.wxId,v).run();return json({ok:true})}
  }

  if(p==="/reads/"+(u.pathname.split("/")[2]||"")+"/geo"||(/^\/reads\/[^/]+\/geo$/.test(p))){
    if(!(await rateLimit("geo:"+ip0,RATE.geo,env,true)))return json({error:"rate limited"},429);
    if(env.ENABLE_GEO==="0"||env.ENABLE_GEO==="off"||env.ENABLE_GEO==="false")return json({error:"geo disabled"},403);
    const id=p.split("/")[2],m=await message(env.DB,id);if(!m)return json({error:"not found"},404);if(m.wx_id!==s.wxId&&!s.isAdmin)return json({error:"forbidden"},403);
    const b=await req.json(),addr=String(b.ip||"");if(!validIp(addr))return json({error:"invalid ip"},400);
    const already=await env.DB.prepare("SELECT country,region,city,isp FROM reads WHERE id=? AND ip=?").bind(id,addr).first();if(!already)return json({error:"read not found"},404);
    if(already.country||already.region||already.city||already.isp)return json({ok:true,located:true});
    const q=await quotaD1(env.DB,env,"GEO_QUOTA_FORMULA",s.level);const used=geoUsed(s);if(!s.isAdmin&&used>=q)return json({error:"geo_quota_exceeded"},429);
    const g=await geoLookup(addr,env);const z=g.zh,e=g.en;await env.DB.prepare("UPDATE reads SET country=?,region=?,city=?,isp=?,country_en=?,region_en=?,city_en=? ,isp_en=? WHERE id=? AND ip=?").bind(z.country,z.region,z.city,z.isp,e.country,e.region,e.city,e.isp,id,addr).run();
    if(!s.isAdmin)await env.DB.prepare("UPDATE users SET geo_count=CASE WHEN geo_date=? THEN geo_count+1 ELSE 1 END,geo_date=? WHERE wx_id=?").bind(utcDate(),utcDate(),s.wxId).run();
    return json({ok:true,zh:z,en:e})
  }

  if(p==="/leaderboard"&&method==="GET"){
    const metric=u.searchParams.get("metric")||"reg",scope=u.searchParams.get("scope")||"total";if(!["reg","read","msg"].includes(metric)||!["day","total"].includes(scope))return json({error:"invalid parameter"},400);
    if(metric==="reg"){const q=scope==="day"?"WHERE date=?":"";const x=await env.DB.prepare(`SELECT wx_id,SUM(count) cnt FROM registration_stats ${q} GROUP BY wx_id ORDER BY cnt DESC,wx_id ASC LIMIT 10`).bind(...(scope==="day"?[cnDate()]:[])).all();return json(x.results.map(a=>({wxId:maskWxId(a.wx_id),count:Number(a.cnt),me:a.wx_id===s.wxId})))} 
    if(metric==="read"){const q=scope==="day"?"WHERE date=?":"";const x=await env.DB.prepare(`SELECT wx_id,SUM(count) cnt FROM read_stats ${q} GROUP BY wx_id ORDER BY cnt DESC,wx_id ASC LIMIT 10`).bind(...(scope==="day"?[cnDate()]:[])).all();return json(x.results.map(a=>({wxId:maskWxId(a.wx_id),count:Number(a.cnt),me:a.wx_id===s.wxId})))} 
    const q=scope==="day"?"WHERE date=?":"";const x=await env.DB.prepare(`SELECT wx_id,SUM(count) cnt FROM message_read_stats ${q} GROUP BY wx_id ORDER BY cnt DESC,wx_id ASC LIMIT 10`).bind(...(scope==="day"?[cnDate()]:[])).all();return json(x.results.map(a=>({wxId:maskWxId(a.wx_id),count:Number(a.cnt),me:a.wx_id===s.wxId})))
  }

  if(p.startsWith("/admin")){
    if(!s.isAdmin)return json({error:"forbidden"},403);
    if(!(await rateLimit("admin:"+ip0,RATE.admin,env,true)))return json({error:"rate limited"},429);
    if(p==="/admin"&&method==="GET")return html(adminPage());
    if(p==="/admin/users"&&method==="GET"){const ps=Math.min(100,Math.max(1,Number(u.searchParams.get("pageSize")||20))),pg=Math.max(1,Number(u.searchParams.get("page")||1)),q=safeText(u.searchParams.get("q")||"",100),like=q?"%"+escapeLike(q)+"%":"";const total=Number((await env.DB.prepare(`SELECT COUNT(*) n FROM users ${q?"WHERE wx_id LIKE ? ESCAPE '\\\\'":""}`).bind(...(q?[like]:[])).first())?.n||0);const rows=(await env.DB.prepare(`SELECT u.wx_id wxId,u.level,u.created_at createdAt,u.message_count messageCount,(SELECT MAX(timestamp) FROM messages WHERE wx_id=u.wx_id) lastMsgAt,(SELECT COALESCE(SUM(count),0) FROM registration_stats WHERE wx_id=u.wx_id) totalRegMsgs FROM users u ${q?"WHERE u.wx_id LIKE ? ESCAPE '\\\\'":""} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`).bind(...(q?[like,ps,(pg-1)*ps]:[ps,(pg-1)*ps])).all()).results;return json({rows,total,page:pg,pageSize:ps,totalPages:Math.max(1,Math.ceil(total/ps))})}
    if(p==="/admin/users"&&method==="POST"){const b=await req.json(),wx=String(b.wxId||"").trim(),pw=String(b.password||""),lv=Number(b.level??1);if(!validWx(wx)||pw.length<8||!Number.isInteger(lv)||lv<0||lv>99)return json({error:"invalid payload"},400);if(await env.DB.prepare("SELECT 1 FROM users WHERE wx_id=?").bind(wx).first())return json({error:"exists"},409);await env.DB.prepare("INSERT INTO users(wx_id,password_hash,level,message_count,created_at,geo_count,geo_date) VALUES(?,?,?,0,?,0,?)").bind(wx,await hashPassword(pw),lv,now(),utcDate()).run();return json({ok:true})}
    if(p==="/admin/level"&&method==="POST"){const b=await req.json(),wx=String(b.wxId||""),lv=Number(b.level);if(!validWx(wx)||!Number.isInteger(lv)||lv<0||lv>99)return json({error:"invalid level"},400);const r=await env.DB.prepare("UPDATE users SET level=? WHERE wx_id=?").bind(lv,wx).run();if(!r.meta?.changes)return json({error:"not found"},404);if(lv===0){await env.DB.prepare("DELETE FROM reads WHERE wx_id=?").bind(wx).run();await env.DB.prepare("DELETE FROM messages WHERE wx_id=?").bind(wx).run();await env.DB.prepare("DELETE FROM registration_stats WHERE wx_id=?").bind(wx).run();await env.DB.prepare("DELETE FROM read_stats WHERE wx_id=?").bind(wx).run();await env.DB.prepare("DELETE FROM message_read_stats WHERE wx_id=?").bind(wx).run();await env.DB.prepare("UPDATE users SET message_count=0 WHERE wx_id=?").bind(wx).run()}return json({ok:true})}
    if(p==="/admin/password"&&method==="POST"){const b=await req.json(),wx=String(b.wxId||""),pw=String(b.password||"");if(pw.length<8||pw.length>128)return json({error:"invalid password"},400);if(!(await env.DB.prepare("SELECT 1 FROM users WHERE wx_id=?").bind(wx).first()))return json({error:"not found"},404);await env.DB.prepare("UPDATE users SET password_hash=? WHERE wx_id=?").bind(await hashPassword(pw),wx).run();await env.DB.prepare("DELETE FROM sessions WHERE wx_id=?").bind(wx).run();return json({ok:true})}
    const du=p.match(/^\/admin\/users\/([^/]+)$/);if(du&&method==="DELETE"){const wx=decodeURIComponent(du[1]);if(wx===s.wxId||isAdmin(wx,env))return json({error:"protected user"},400);await deleteUser(env.DB,wx);return json({ok:true})}
    if(p==="/admin/messages"&&method==="GET"){const q=safeText(u.searchParams.get("q")||"",200),wx=safeText(u.searchParams.get("wxId")||"",64);const rows=(await env.DB.prepare(`SELECT m.id,m.wx_id wxId,m.content,m.timestamp,COUNT(DISTINCT r.ip) reads FROM messages m LEFT JOIN reads r ON m.id=r.id WHERE (?='' OR m.wx_id=?) AND (?='' OR m.content LIKE ? ESCAPE '\\\\') GROUP BY m.id ORDER BY m.timestamp DESC`).bind(wx,wx,q,"%"+escapeLike(q)+"%").all()).results;return json(rows)}
    if(p==="/admin/messages"&&method==="DELETE"){const wx=safeText(u.searchParams.get("wxId")||"",64);if(!wx)return json({error:"missing wxId"},400);await env.DB.prepare("DELETE FROM reads WHERE id IN (SELECT id FROM messages WHERE wx_id=? )").bind(wx).run();await env.DB.prepare("DELETE FROM messages WHERE wx_id=?").bind(wx).run();await env.DB.prepare("DELETE FROM registration_stats WHERE wx_id=?").bind(wx).run();await env.DB.prepare("DELETE FROM read_stats WHERE wx_id=?").bind(wx).run();await env.DB.prepare("DELETE FROM message_read_stats WHERE wx_id=?").bind(wx).run();return json({ok:true})}
    const dm=p.match(/^\/admin\/messages\/([^/]+)$/);if(dm&&method==="DELETE"){const id=decodeURIComponent(dm[1]);await env.DB.prepare("DELETE FROM reads WHERE id=?").bind(id).run();await env.DB.prepare("DELETE FROM messages WHERE id=?").bind(id).run();return json({ok:true})}
    if(p==="/admin/ip-block"){
      if(method==="GET"){const x=await env.DB.prepare("SELECT ip,created_at createdAt FROM ip_block_global ORDER BY created_at DESC").all();return json({count:x.results.length,ips:x.results})}
      if(method==="POST"){const b=await req.json(),v=String(b.ip||"");if(!validIp(v))return json({error:"invalid ip"},400);const r=await env.DB.prepare("INSERT OR IGNORE INTO ip_block_global(ip,created_at) VALUES(?,?)").bind(v,now()).run();return r.meta?.changes?json({ok:true,ip:v}):json({error:"exists"},409)}
      if(method==="DELETE"){const b=await req.json(),v=String(b.ip||"");await env.DB.prepare("DELETE FROM ip_block_global WHERE ip=?").bind(v).run();return json({ok:true})}
    }
    if(p==="/admin/levels"&&method==="GET")return json({message:getFormula(env,"MESSAGE_QUOTA_FORMULA"),geo:getFormula(env,"GEO_QUOTA_FORMULA"),retentionMonths:getFormula(env,"RETENTION_MONTHS_FORMULA")});
    if(p==="/admin/levels"&&method==="POST"){const b=await req.json();for(const [k,envk] of [["message","MESSAGE_QUOTA_FORMULA"],["geo","GEO_QUOTA_FORMULA"],["retentionMonths","RETENTION_MONTHS_FORMULA"]]){if(b[k]!==undefined){const f=String(b[k]||"x").trim()||"x";try{for(let n=0;n<=99;n++)formulaValue(f,n)}catch{return json({error:`invalid ${k} formula`},400)}await env.DB.prepare("INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("formula:"+envk,f).run()}}return json({ok:true})}
    if(p==="/admin/retention"&&method==="GET"){const rows=await env.DB.prepare("SELECT key,value FROM meta WHERE key IN ('retention:newUserDays','retention:dormantDays')").all();const o={newUserDays:0,dormantDays:0};for(const r of rows.results)o[r.key.split(":")[1]]=Number(r.value)||0;return json(o)}
    if(p==="/admin/retention"&&method==="POST"){const b=await req.json();for(const [k,n] of [["newUserDays",b.newUserDays],["dormantDays",b.dormantDays]]){if(!Number.isInteger(Number(n))||Number(n)<0||Number(n)>36500)return json({error:"invalid retention days"},400);await env.DB.prepare("INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("retention:"+k,String(Number(n))).run()}return json({ok:true})}
    if(p==="/admin/retention/run"&&method==="POST"){const r=await purgeIdle(env.DB,env);return json(r)}
    if(p==="/admin/retention/preview"&&method==="GET")return json(await previewIdle(env.DB));
    if(p==="/admin/retention/orphans"&&method==="GET"){const o={};for(const t of ["registration_stats","read_stats","message_read_stats"])o[t]=Number((await env.DB.prepare(`SELECT COUNT(*) n FROM ${t} WHERE wx_id NOT IN (SELECT wx_id FROM users)`).first())?.n||0);return json(o)}
    if(p==="/admin/retention/orphans"&&method==="POST"){let total=0;for(const t of ["registration_stats","read_stats","message_read_stats"]){const r=await env.DB.prepare(`DELETE FROM ${t} WHERE wx_id NOT IN (SELECT wx_id FROM users)`).run();total+=Number(r.meta?.changes||0)}return json({ok:true,total})}
  }

  return p==="/"&&method==="GET"?html(dashboardPage({wxId:s.wxId,level:s.level,isAdmin:s.isAdmin,msgQuota:await quotaD1(env.DB,env,"MESSAGE_QUOTA_FORMULA",s.level),geoRemaining:Math.max(0,await quotaD1(env.DB,env,"GEO_QUOTA_FORMULA",s.level)-geoUsed(s))})):json({error:"not found"},404)
}

async function enforceQuota(db,wxId,level,env){
  const n=await quotaD1(db,env,"MESSAGE_QUOTA_FORMULA",level),months=await quotaD1(db,env,"RETENTION_MONTHS_FORMULA",level);
  if(n<=0){await db.prepare("DELETE FROM reads WHERE wx_id=?").bind(wxId).run();await db.prepare("DELETE FROM messages WHERE wx_id=?").bind(wxId).run();await db.prepare("UPDATE users SET message_count=0 WHERE wx_id=?").bind(wxId).run();return}
  const rows=(await db.prepare("SELECT id FROM messages WHERE wx_id=? ORDER BY timestamp DESC LIMIT -1 OFFSET ?").bind(wxId,n).all()).results;for(const r of rows){await db.prepare("DELETE FROM reads WHERE id=?").bind(r.id).run();await db.prepare("DELETE FROM messages WHERE id=?").bind(r.id).run()}
  if(months>0){const cutoff=new Date();cutoff.setUTCMonth(cutoff.getUTCMonth()-months);const ts=cutoff.toISOString().replace("T"," ").slice(0,19);const ex=(await db.prepare("SELECT id FROM messages WHERE wx_id=? AND timestamp<?").bind(wxId,ts).all()).results;for(const r of ex){await db.prepare("DELETE FROM reads WHERE id=?").bind(r.id).run();await db.prepare("DELETE FROM messages WHERE id=?").bind(r.id).run()}}
  await db.prepare("UPDATE users SET message_count=(SELECT COUNT(*) FROM messages WHERE wx_id=?) WHERE wx_id=?").bind(wxId,wxId).run()
}
async function deleteUser(db,wx){await db.prepare("DELETE FROM reads WHERE id IN (SELECT id FROM messages WHERE wx_id=? )").bind(wx).run();await db.prepare("DELETE FROM messages WHERE wx_id=?").bind(wx).run();for(const t of ["registration_stats","read_stats","message_read_stats","ip_block_account","sessions"])await db.prepare(`DELETE FROM ${t} WHERE wx_id=?`).bind(wx).run();await db.prepare("DELETE FROM users WHERE wx_id=?").bind(wx).run()}
async function getRetention(db){const x=await db.prepare("SELECT key,value FROM meta WHERE key IN ('retention:newUserDays','retention:dormantDays')").all();const o={newUserDays:0,dormantDays:0};for(const r of x.results)o[r.key.split(":")[1]]=Number(r.value)||0;return o}
async function previewIdle(db){const r=await getRetention(db);let never=0,dormant=0;if(r.newUserDays)never=Number((await db.prepare("SELECT COUNT(*) n FROM users u WHERE u.created_at<? AND COALESCE((SELECT SUM(count) FROM registration_stats WHERE wx_id=u.wx_id),0)=0 AND u.level<>0").bind(daysAgo(r.newUserDays)).first())?.n||0);if(r.dormantDays)dormant=Number((await db.prepare("SELECT COUNT(*) n FROM users u WHERE u.level<>0 AND COALESCE((SELECT MAX(date) FROM registration_stats WHERE wx_id=u.wx_id),'')<? AND COALESCE((SELECT SUM(count) FROM registration_stats WHERE wx_id=u.wx_id),0)>0").bind(utcDate()).first())?.n||0);return {never,dormant,purgeable:never+dormant,truncated:false}}
async function purgeIdle(db,env){const r=await getRetention(db);const users=(await db.prepare("SELECT wx_id wxId,level,created_at createdAt FROM users WHERE level<>0 ORDER BY created_at ASC LIMIT 1000").all()).results;const del=[];for(const u of users){let yes=false;if(r.newUserDays&&u.createdAt<daysAgo(r.newUserDays)){const c=Number((await db.prepare("SELECT COALESCE(SUM(count),0) n FROM registration_stats WHERE wx_id=?").bind(u.wxId).first())?.n||0);if(c===0)yes=true}if(!yes&&r.dormantDays){const c=Number((await db.prepare("SELECT COALESCE(SUM(count),0) n FROM registration_stats WHERE wx_id=?").bind(u.wxId).first())?.n||0);const last=String((await db.prepare("SELECT MAX(date) d FROM registration_stats WHERE wx_id=?").bind(u.wxId).first())?.d||"");if(c>0&&last && last<utcDate() && (Date.now()-Date.parse(last+"T00:00:00Z"))/86400000>r.dormantDays)yes=true}if(yes&&!isAdmin(u.wxId,env))del.push(u.wxId)}for(const w of del)await deleteUser(db,w);return {deleted:del.length,by:"manual",never:0,dormant:0,truncated:users.length>=1000}}
async function scheduled(env){
  try{
    await env.DB.prepare("DELETE FROM sessions WHERE expires_at<=?").bind(now()).run();
    const days=Number(env.AUDIT_RETENTION_DAYS??30);if(days>0)await env.DB.prepare("DELETE FROM audit_logs WHERE timestamp<?").bind(daysAgo(days)).run();
    await env.DB.prepare("DELETE FROM reads WHERE timestamp<? AND id NOT IN (SELECT id FROM messages)").bind(daysAgo(7)).run();
    for(const t of ["registration_stats","read_stats","message_read_stats"])await env.DB.prepare(`DELETE FROM ${t} WHERE wx_id NOT IN (SELECT wx_id FROM users)`).run();
    await env.DB.prepare("UPDATE users SET geo_count=0 WHERE geo_date<>? AND geo_count>0").bind(utcDate()).run();
    await env.DB.prepare("DELETE FROM sessions WHERE expires_at<=?").bind(now()).run();
    await purgeIdle(env.DB,env);
  }catch(e){console.error("scheduled",e)}
}
export default {
  async fetch(request,env){try{return await handle(request,env)}catch(e){console.error(e);return json({error:"Internal Server Error"},500)}},
  async scheduled(event,env){await scheduled(env)}
};
