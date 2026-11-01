const enc = new TextEncoder();
function b64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function hmac(secret,data){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64(await crypto.subtle.sign('HMAC',key,enc.encode(data)))}
export async function signToken(env,payload){const body=b64(enc.encode(JSON.stringify(payload)));return body+'.'+await hmac(env.SESSION_SECRET,body)}
export async function verifyToken(env,token){if(!token||!env.SESSION_SECRET)return null;const [body,sig]=token.split('.');if(!body||!sig)return null;const expected=await hmac(env.SESSION_SECRET,body);if(sig.length!==expected.length)return null;let ok=false;try{ok=crypto.subtle.timingSafeEqual?crypto.subtle.timingSafeEqual(enc.encode(sig),enc.encode(expected)):sig===expected}catch{ok=sig===expected}if(!ok)return null;try{const p=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(body.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));return p.exp>Date.now()?p:null}catch{return null}}
export async function requireAdmin(request,env){const cookie=request.headers.get('Cookie')||'';const token=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('ft_admin='))?.slice(9);return verifyToken(env,token)}
export function jsonError(message,status=400){return Response.json({error:message},{status})}
export function checkOrigin(request){const origin=request.headers.get('Origin');if(!origin)return false;try{return new URL(origin).host===new URL(request.url).host}catch{return false}}
export function cookieHeader(value,maxAge){return `ft_admin=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`}
export async function readJson(request){const len=Number(request.headers.get('Content-Length')||0);if(len>50000)throw Error('Request too large');return await request.json()}
export function clean(v,max=5000){return String(v??'').trim().slice(0,max)}
export function validUrl(v){if(!v)return true;try{return new URL(v).protocol==='https:'}catch{return false}}
