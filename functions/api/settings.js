/* QA105: 관리자 설정 공용 저장소 (Cloudflare Pages Functions + KV)
   필요한 설정 (Pages 프로젝트 > Settings):
   1) Functions > KV namespace bindings : 변수명 SETTINGS 로 KV 연결 (없으면 REVIEWS KV를 함께 사용)
   2) Environment variables : ADMIN_KEY = 관리자 비밀번호(새로 정한 값, Encrypt 권장)
   ADMIN_KEY 가 없으면 읽기만 되고 저장은 거절(503). 클라이언트는 이 브라우저 저장으로 계속 동작한다. */
const KEYS = ['aic.sched', 'aic.filmInfo', 'aic.layout', 'aic.posters', 'aic.theme', 'aic.txt', 'aic.lobbyPalette', 'aic.lobbyLighting'];
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const kvOf = env => env.SETTINGS || env.REVIEWS || null;
const load = async kv => { try { return (await kv.get('cfg', 'json')) || { rev: 0, data: {} }; } catch { return { rev: 0, data: {} }; } };
const same = (a, b) => { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

export async function onRequestGet({ env }) {
  const kv = kvOf(env);
  if (!kv) return json({ ok: false, error: 'storage_unbound' }, 503);
  const c = await load(kv);
  return json({ ok: true, rev: c.rev || 0, data: c.data || {}, writable: !!env.ADMIN_KEY });
}

export async function onRequestPut({ request, env }) {
  const kv = kvOf(env);
  if (!kv) return json({ ok: false, error: 'storage_unbound' }, 503);
  if (!env.ADMIN_KEY) return json({ ok: false, error: 'admin_key_unset' }, 503);
  if (!same(request.headers.get('x-admin-key') || '', String(env.ADMIN_KEY))) return json({ ok: false, error: 'unauthorized' }, 401);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  const inc = (b && typeof b.data === 'object' && b.data) || {};
  const c = await load(kv);
  let n = 0;
  for (const k of Object.keys(inc)) if (KEYS.includes(k)) { if (inc[k] === null) delete c.data[k]; else c.data[k] = inc[k]; n++; }
  if (n) { c.rev = Date.now(); const body = JSON.stringify(c); if (body.length > 20e6) return json({ ok: false, error: 'too_large' }, 413); await kv.put('cfg', body); }
  return json({ ok: true, rev: c.rev || 0, saved: n });
}
