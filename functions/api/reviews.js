/* QA21: 영화 좋아요·한줄평 공용 저장소 (Cloudflare Pages Functions + KV)
   필요한 설정: Pages 프로젝트 > Settings > Functions > KV namespace bindings 에 변수명 REVIEWS 로 KV 연결
   (Production·Preview 각각). 연결 전에는 503을 돌려주고, 클라이언트는 이 브라우저 저장으로 자동 대체한다. */
const ID = /^[\w-]{1,64}$/, MAXR = 30;
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clean = (v, n) => String(v || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const load = async (kv, id) => { try { return (await kv.get('f:' + id, 'json')) || { likes: [], rv: [] }; } catch { return { likes: [], rv: [] }; } };
const view = (f, uid) => ({ likes: f.likes.length, liked: !!uid && f.likes.includes(uid), reviews: f.rv.slice(0, MAXR).map(r => ({ n: r.n, t: r.t, ts: r.ts, mine: !!uid && r.u === uid })) });

export async function onRequestGet({ request, env }) {
  if (!env.REVIEWS) return json({ ok: false, error: 'storage_unbound' }, 503);
  const u = new URL(request.url), uid = clean(u.searchParams.get('uid'), 40), ids = (u.searchParams.get('ids') || '').split(',').filter(x => ID.test(x)).slice(0, 20);
  const films = {};
  for (const id of ids) films[id] = view(await load(env.REVIEWS, id), uid);
  return json({ ok: true, films });
}

export async function onRequestPost({ request, env }) {
  if (!env.REVIEWS) return json({ ok: false, error: 'storage_unbound' }, 503);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  const id = String(b.id || ''), uid = clean(b.uid, 40), op = b.op;
  if (!ID.test(id) || uid.length < 8 || !['like', 'unlike', 'review', 'unreview'].includes(op)) return json({ ok: false, error: 'bad_request' }, 400);
  const f = await load(env.REVIEWS, id);
  if (op === 'like' && !f.likes.includes(uid)) f.likes.push(uid);
  if (op === 'unlike') f.likes = f.likes.filter(x => x !== uid);
  if (op === 'review') { const t = clean(b.text, 40), n = clean(b.name, 12) || '관객'; if (!t) return json({ ok: false, error: 'empty' }, 400); f.rv = [{ u: uid, n, t, ts: Date.now() }, ...f.rv.filter(r => r.u !== uid)].slice(0, 200); }
  if (op === 'unreview') f.rv = f.rv.filter(r => r.u !== uid);
  await env.REVIEWS.put('f:' + id, JSON.stringify(f));
  return json({ ok: true, film: view(f, uid) });
}
