/* QA341: 유저 진행 저장(아이디 + 비밀번호 4자리). 개인정보는 받지 않는다.
   KV: SETTINGS(없으면 REVIEWS) 를 함께 쓴다. 키는 'u:<아이디>'. 비밀번호는 해시만 보관. */
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const kvOf = env => env.SETTINGS || env.REVIEWS || null;
const ID = /^[a-z0-9_]{4,16}$/, PIN = /^\d{4}$/;
const MAX = 8e6, TRIES = 5, LOCK = 10 * 60 * 1000;
const hash = async (id, pin) => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cine:' + id + ':' + pin)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); };

export async function onRequestPost({ request, env }) {
  const kv = kvOf(env);
  if (!kv) return json({ ok: false, error: 'storage_unbound' }, 503);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  const id = String((b && b.id) || '').toLowerCase(), pin = String((b && b.pin) || ''), op = b && b.op;
  if (!ID.test(id) || !PIN.test(pin)) return json({ ok: false, error: 'bad_input' }, 400);
  const key = 'u:' + id, now = Date.now(), h = await hash(id, pin);
  let r = null; try { r = await kv.get(key, 'json'); } catch { r = null; }
  if (r && r.lock && r.lock > now) return json({ ok: false, error: 'locked' }, 429);
  if (r && r.h !== h) {
    r.f = (r.f || 0) + 1; if (r.f >= TRIES) { r.f = 0; r.lock = now + LOCK; }
    await kv.put(key, JSON.stringify(r));
    return json({ ok: false, error: op === 'create' ? 'taken' : 'wrong' }, op === 'create' ? 409 : 401);
  }
  if (op === 'load') { if (!r) return json({ ok: false, error: 'none' }, 404); return json({ ok: true, data: r.d || {}, t: r.t || 0 }); }
  if (op === 'create' || op === 'save') {
    if (!r && op === 'save') return json({ ok: false, error: 'none' }, 404);
    const d = (b && typeof b.data === 'object' && b.data) || {};
    const body = JSON.stringify({ h, d, t: now, f: 0 });
    if (body.length > MAX) return json({ ok: false, error: 'too_large' }, 413);
    await kv.put(key, body);
    return json({ ok: true, t: now });
  }
  return json({ ok: false, error: 'bad_op' }, 400);
}
