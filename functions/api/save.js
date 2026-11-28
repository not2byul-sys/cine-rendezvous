/* QA341: 유저 진행 저장(아이디 + 비밀번호 4자리). 개인정보는 받지 않는다.
   KV: SETTINGS(없으면 REVIEWS) 를 함께 쓴다. 키는 'u:<아이디>'. 비밀번호는 해시만 보관. */
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const kvOf = env => env.SETTINGS || env.REVIEWS || null;
/* QA422: 아이디 = 닉네임(한글 영화 제목 등). 앞뒤 공백 정리·소문자 */
const CH = "[\\p{L}\\p{N} _:.,'!?·&\\-\\/()…]";
/* QA471: 새 아이디는 화면 입력 한도(14자)와 같게 받는다. 예전에 만든 15~16자 아이디는 불러오기·저장에서만 계속 허용 */
const ID = new RegExp('^' + CH + '{1,16}$', 'u'), ID_NEW = new RegExp('^' + CH + '{1,14}$', 'u'), PIN = /^\d{4}$/;
const norm = v => String(v || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
const MAX = 8e6, TRIES = 5, LOCK = 10 * 60 * 1000;
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
/* 예전 해시(솔트 없음) — 기존 계정 확인용 */
const hashOld = async (id, pin) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cine:' + id + ':' + pin)));
/* QA471: 사용자별 솔트 + (있으면) 서버 비밀값 PIN_PEPPER 로 HMAC. 저장소만 유출돼도 미리 계산한 표로는 못 푼다 */
const hashNew = async (id, pin, salt, env) => { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode('cine2:' + ((env && env.PIN_PEPPER) || '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return hex(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(salt + ':' + id + ':' + pin))); };
const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)));
/* 한 번 배포해 본 뒤 이전 버전으로 되돌려도 로그인되도록, 예전 해시(h)를 한동안 같이 보관한다. 안정화 후 false 로 바꾸면 예전 해시를 지운다 */
const KEEP_LEGACY = true;

export async function onRequestPost({ request, env }) {
  const kv = kvOf(env);
  if (!kv) return json({ ok: false, error: 'storage_unbound' }, 503);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  const id = norm(b && b.id), pin = String((b && b.pin) || ''), op = b && b.op;
  if (!ID.test(id) || !PIN.test(pin)) return json({ ok: false, error: 'bad_input' }, 400);
  const key = 'u:' + id, now = Date.now();
  let r = null; try { r = await kv.get(key, 'json'); } catch { r = null; }
  if (!r && op === 'create' && !ID_NEW.test(id)) return json({ ok: false, error: 'bad_input' }, 400);
  if (r && r.lock && r.lock > now) return json({ ok: false, error: 'locked' }, 429);
  /* 확인: 솔트가 있으면 새 해시, 없으면(예전 계정) 예전 해시. 맞으면 아래 저장 때 새 방식으로 올려 둔다 */
  const salt = (r && r.s) || newSalt();
  const h2 = await hashNew(id, pin, salt, env);
  const okPin = !r || (r.s ? r.h2 === h2 : r.h === (await hashOld(id, pin)));
  const hOld = KEEP_LEGACY ? await hashOld(id, pin) : undefined;
  const h = h2;
  if (r && !okPin) {
    r.f = (r.f || 0) + 1; if (r.f >= TRIES) { r.f = 0; r.lock = now + LOCK; }
    await kv.put(key, JSON.stringify(r));
    return json({ ok: false, error: op === 'create' ? 'taken' : 'wrong' }, op === 'create' ? 409 : 401);
  }
  if (op === 'load') {
    if (!r) return json({ ok: false, error: 'none' }, 404);
    if (!r.s) { try { await kv.put(key, JSON.stringify({ ...r, s: salt, h2, h: KEEP_LEGACY ? r.h : undefined, f: 0 })); } catch { /* 올리기 실패해도 불러오기는 성공 */ } }
    return json({ ok: true, data: r.d || {}, t: r.t || 0 });
  }
  if (op === 'create' || op === 'save') {
    if (!r && op === 'save') return json({ ok: false, error: 'none' }, 404);
    const d = (b && typeof b.data === 'object' && b.data) || {};
    const body = JSON.stringify({ h: hOld, h2, s: salt, d, t: now, f: 0 });
    if (body.length > MAX) return json({ ok: false, error: 'too_large' }, 413);
    await kv.put(key, body);
    return json({ ok: true, t: now });
  }
  return json({ ok: false, error: 'bad_op' }, 400);
}

/* QA422: 이미 등록된 닉네임 확인 — GET /api/save?name=<닉네임> → 같은 이름으로 시작하는 등록 아이디 목록(최대 50) */
export async function onRequestGet({ request, env }) {
  const kv = kvOf(env);
  if (!kv) return json({ ok: false, error: 'storage_unbound' }, 503);
  const name = norm(new URL(request.url).searchParams.get('name'));
  if (!name || !ID.test(name)) return json({ ok: false, error: 'bad_input' }, 400);
  let keys = [];
  try { keys = (await kv.list({ prefix: 'u:' + name, limit: 50 })).keys.map(k => k.name.slice(2)); } catch { keys = []; }
  return json({ ok: true, taken: keys });
}
