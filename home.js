/* Головна (26.11): перший екран — сцена чотирьох флагманів (покупка), далі вибір акордеона, тоді «Розбір» — натискаєш на вузол,
   камера летить до нього в 3D і панель показує комплектуючі цього вузла; далі порада, комісійний, ремонт і запчастини, партнери. Малює app.js → home(), тут розмітка й поведінка.
   Прольоти з 3D-моделі: tools/m3d/fly3.sh → tools/m3d/fly3_web.py, scenes/fly/model/<вузол>_<d|m>[_back].mp4 (старі: scenes/fly/web). */
window.ACC_HOME = (() => {
  const VID = 'scenes/fly/model/', VER = '?v=1';
  // Точки в пікселях вирізаного фото виробника (1727×1228); де воно лежить у кадрі — tools/fly_frames.py (frames.json).
  const CUT = [1727, 1228], PLACE = { d: [.159896, .17739, .530208, .665441], m: [.110294, .303125, .780331, .314063] }, FRAME = { d: [1920, 1088], m: [1088, 1920] };
  const NODES = [['buttons', 5, 320, 900, 'l m'], ['registers', 26, 470, 640, 'l'], ['grille', 19, 690, 900, 'r'], ['bellows', 11, 1211, 330, 'r m'], ['bass', 7, 1520, 690, 'r m'], ['strap', /^(Ремені|Straps)/i, 420, 130, 'l']];
  const STAGE = [
    { id: 301, w: 'Pigini', n: 'Pigini Nova', src: 'img/flag/301.webp', tone: '#7d1528' }, { id: 554, w: 'Bugari', n: 'Bugari Armando 2 RC Cassotto', src: 'img/flag/554.webp', tone: '#8b4a1f' },
    { id: 541, w: 'Scandalli', n: 'Scandalli Super VI', src: 'img/stage2/541.webp', tone: '#3d4650' }, { id: 387, w: 'Fisitalia', n: 'Fisitalia B-61', src: 'img/flag/387.webp', tone: '#0e5a52' },
  ];
  const portrait = () => matchMedia('(max-aspect-ratio: 1/1)').matches;

  function nodes(x) {
    return NODES.map(([k, id, px, py, side]) => {
      const c = id instanceof RegExp ? x.cats.find(c => id.test(c.name) && x.count(c.id)) : x.cat.get(id);
      return c && x.count(c.id) ? { k, c, px, py, side } : null;
    }).filter(Boolean);
  }
  const spec = (p, lang) => {
    const g = k => p.features.find(f => f[0] === k)?.[1] || '', en = lang === 'en';
    const r = g(en ? 'Right hand' : 'Права рука').match(en ? /^\d+ [a-z]+/i : /^\d+ [а-яіїєґ]+/i)?.[0], b = g(en ? 'Left hand' : 'Ліва рука').match(/\d+/)?.[0], w = g(en ? 'Weight' : 'Вага').match(en ? /^[\d.]+ ?kg/ : /^[\d,]+ ?кг/)?.[0];
    return [r, b && `${en ? 'bass' : 'бас'} ${b}`, w].filter(Boolean).join(', ');
  };

  function html(x) {
    const { L, esc, url, goods, count, cat, prod, money } = x, N = nodes(x);
    const pic = n => `<img class="t-pic" src="scenes/still/${n}.webp" srcset="scenes/still/${n}-m.webp 800w, scenes/still/${n}.webp 1600w" sizes="(max-width: 960px) 100vw, 34vw" alt="" loading="lazy">`;   // кадри з 3D-моделі (tools/m3d/stills.py); ШІ-ролики scenes/web прибрано 26.11
    const kom = x.inCat(48).find(p => p.img), st = STAGE.filter(s => prod.get(s.id));
    const restCats = x.roots.filter(r => ![3, 38, 43, 48].includes(r.id) && count(r.id));
    const brands = Object.entries(x.inCat(43).reduce((o, p) => (p.brand && (o[p.brand] = (o[p.brand] || 0) + 1), o), {})).sort((a, b) => b[1] - a[1]);
    const sub = id => cat.get(id) && count(id) ? `<a href="${url(`/c/${id}`)}">${esc(L.pickSub[id] || cat.get(id).name)} <i>${count(id)}</i></a>` : '';
    const pick = (img, h, ids) => `<div class="pk"><a class="pk-go" href="${url(`/c/${ids[0]}`)}" aria-hidden="true" tabindex="-1"><img src="img/stage2/${img}.webp" alt="" loading="lazy"></a><h3>${h}</h3><div class="pk-l">${ids.map(sub).join('')}</div></div>`;
    return `
    <section class="flag" id="flag" tabindex="-1" aria-roledescription="carousel" aria-label="${L.instruments}">
      <h1 class="flag-h1">${L.homeH1}</h1>
      <div class="flag-word" id="flagWord" aria-hidden="true">${st[0] ? esc(st[0].w) : ''}</div>
      <img class="flag-pic" id="flagPic" src="${st[0] ? st[0].src : ''}" alt="${st[0] ? esc(st[0].n) : ''}" fetchpriority="high" draggable="false">
      <div class="flag-info" aria-live="polite"><h2 id="flagN">${st[0] ? esc(st[0].n) : ''}</h2><p id="flagS">${st[0] ? esc(spec(prod.get(st[0].id), x.lang)) : ''}</p></div>
      <div class="flag-buy"><b id="flagP">${st[0] ? money(prod.get(st[0].id).price) : ''}</b><a class="btn" id="flagA" href="${st[0] ? url(`/p/${st[0].id}`) : '#'}">${L.flagOpen}</a></div>
      <button type="button" class="flag-arr p" aria-label="${L.shelfPrev}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="flag-arr n" aria-label="${L.shelfNext}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
      <div class="flag-tabs">${st.map((s, i) => `<button type="button" data-s="${i}" aria-pressed="${i === 0}">${esc(s.w)}</button>`).join('')}<a href="${url('/c/43')}">${L.all(goods(count(43)))}</a></div>
    </section>
    <section class="pick" id="pick" aria-labelledby="pickH">
      <h2 id="pickH">${L.pickH}</h2>
      ${pick(561, L.pickBtn, [44, 45, 56])}
      ${pick(492, L.pickKeys, [46, 47, 54])}
      <div class="pk-brands"><span>${L.pickBrand}</span>${brands.map(([b, n]) => `<a href="${url(`/c/43?brand=${encodeURIComponent(b)}`)}">${esc(b)} <i>${n}</i></a>`).join('')}<a href="${url('/c/43')}">${L.wallAll} <i>${count(43)}</i></a></div>
    </section>
    <section class="lab" id="lab" aria-label="${L.labLabel}">
      <div class="lab-film" id="labFilm"><picture><source media="(max-aspect-ratio: 1/1)" srcset="${VID}start_m.webp${VER}"><img src="${VID}start_d.webp${VER}" alt="${L.labAlt}" loading="lazy"></picture></div>
      <div class="lab-text"><h2>${L.labH}</h2><p class="lab-hint m">${L.labHint}</p><p class="lab-slogan">${L.slogan}</p>
        <div class="lab-cta"><a class="btn" href="${url('/c/3')}">${L.parts}</a><a class="btn ghost" href="${url('/service')}">${L.repair}</a></div></div>
      <p class="lab-hint d" aria-hidden="true">${L.labHint}</p>
      <div class="lab-dots" id="labDots">${N.map((n, i) => `<button type="button" class="hs ${n.side}" data-n="${i}" aria-label="${esc(L.labFly(n.c.name))}"><span>${esc(n.c.name)}</span></button>`).join('')}</div>
      <nav class="lab-nav" aria-label="${L.labLabel}">${N.map((n, i) => `<button type="button" data-n="${i}">${esc(n.c.name)}</button>`).join('')}</nav>
      <aside class="lab-panel" id="labPanel" aria-live="polite"><button type="button" class="lab-x" id="labX" aria-label="${L.labBack}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><h2 id="labH"></h2><p id="labP"></p><ul id="labL"></ul><a class="btn" id="labA"></a></aside>
    </section>
    <section class="bento" aria-labelledby="bentoH">
      <div class="t t-e"><h3>${L.adviceH}</h3><p>${L.adviceP}</p><div class="t-cta"><a class="btn" href="tel:+380993339890">${L.phoneShow}</a><a class="btn ghost" href="${url('/contacts')}">${L.contacts}</a></div></div>
      <a class="t t-f" href="${url('/c/48')}">${kom ? `<img src="${esc(x.photo(kom))}" alt="" width="800" height="800" loading="lazy">` : ''}<h3>${esc(cat.get(48)?.name || '')}</h3><p>${goods(count(48))}</p></a>
      <h2 class="bento-h" id="bentoH">${L.ownersH}</h2>
      <a class="t v t-b" href="${url('/service')}">${pic('bellows')}<h3>${L.repairFull}</h3><p>${L.bentoRepair}</p></a>
      <a class="t v t-b" href="${url('/c/38')}">${pic('strap')}<h3>${esc(cat.get(38)?.name || '')}</h3><p>${goods(count(38))}</p></a>
      <a class="t v t-b" href="${url('/c/3')}">${pic('buttons')}<h3>${L.parts}</h3><p>${L.bentoParts(goods(count(3)))}</p></a>
      <div class="bento-more">${restCats.map(r => `<a href="${url(`/c/${r.id}`)}">${esc(r.name)} <i>${count(r.id)}</i></a>`).join('')}</div>
    </section>
    <section class="partners dark"><p class="partners-lead wrap"><span>${L.partnersLead}</span></p><div class="marquee" aria-hidden="true">${x.partners}</div></section>`;
  }

  function init(view, x) {
    const $ = (s, r = view) => r.querySelector(s), $$ = (s, r = view) => [...r.querySelectorAll(s)];
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ac = new AbortController(), on = (t, e, f, o = {}) => t.addEventListener(e, f, { signal: ac.signal, ...o });
    addEventListener('sitenav', () => ac.abort(), { once: true });
    lab(); flag();

    /* Відео мозаїки грають, лише коли їх видно */
    const vo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.target.dataset.poster) { e.target.poster = e.target.dataset.poster; delete e.target.dataset.poster; } if (e.isIntersecting && !calm) e.target.play().catch(() => {}); else e.target.pause(); }), { rootMargin: '400px' });
    $$('.bento video').forEach(v => vo.observe(v));
    ac.signal.addEventListener('abort', () => vo.disconnect());

    function lab() {
      const el = $('#lab'), film = $('#labFilm'), N = nodes(x), dots = $$('.hs', el), nav = $$('.lab-nav button', el);
      let K = portrait() ? 'm' : 'd', cur = null, busy = false, cache = new Map();
      const place = () => {
        const W = el.clientWidth, H = el.clientHeight, [fw, fh] = FRAME[K], P = PLACE[K], s = Math.max(W / fw, H / fh), ox = (W - fw * s) / 2, oy = (H - fh * s) / 2;
        N.forEach((n, i) => { dots[i].style.transform = `translate(${ox + (P[0] + n.px / CUT[0] * P[2]) * fw * s}px, ${oy + (P[1] + n.py / CUT[1] * P[3]) * fh * s}px)`; });
        el.classList.add('is-placed');
      };
      on(window, 'resize', () => { const k = portrait() ? 'm' : 'd'; if (k !== K && !cur && !busy) { K = k; cache = new Map(); $$('video', film).forEach(v => v.remove()); } place(); });
      place();
      /* Повільний інтернет: беремо легкі копії (_l). Де браузер не каже швидкості (айфон), міряємо за першим кадром. */
      const net = navigator.connection || {}, got = new Map();
      let lite = null;
      const isLite = () => {
        if (lite !== null) return lite;
        if (net.saveData || /2g|3g/.test(net.effectiveType || '')) return lite = true;
        if (net.downlink) return lite = net.downlink < 4;
        const r = performance.getEntriesByType('resource').find(e => /start_[dm]\.webp/.test(e.name)), ms = r ? r.responseEnd - r.requestStart : 0;
        return lite = !!(r && r.transferSize && ms > 120 && r.transferSize / ms < 200);
      };
      const load = (k, back) => {
        const u = `${VID}${k}_${K}${back ? '_back' : ''}${isLite() ? '_l' : ''}.mp4${VER}`;
        const read = async r => {   // читаємо частинами, щоб показати, скільки лишилось
          const total = +r.headers.get('content-length') || 0; if (!r.body?.getReader || !total) return r.blob();
          const rd = r.body.getReader(), parts = []; let n = 0;
          for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); n += value.length; if (!back) got.set(k, Math.min(1, n / total)); }
          return new Blob(parts, { type: 'video/mp4' });
        };
        // Файл тягнемо цілком самі: айфон не завантажує відео наперед і «canplaythrough» там можна не дочекатись.
        if (!cache.has(u)) cache.set(u, fetch(u, { signal: ac.signal }).then(r => { if (!r.ok) throw new Error('video'); return read(r); }).then(b => {
          const v = document.createElement('video'); v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'auto'; v.setAttribute('aria-hidden', 'true');
          const src = URL.createObjectURL(b); ac.signal.addEventListener('abort', () => URL.revokeObjectURL(src)); v.src = src; film.append(v); v.load(); return v;
        }).catch(e => { cache.delete(u); throw e; }));
        return cache.get(u);
      };
      /* Прольоти тягнемо наперед, коли людина вже щось робить і не береже трафік */
      let warm = false;
      const heat = () => { if (warm || net.saveData || /2g|3g/.test(net.effectiveType || '')) return; warm = true; (async () => { for (const n of K === 'm' ? N.filter(n => n.k === 'bellows') : N) { if (ac.signal.aborted) return; await load(n.k).catch(() => {}); } })(); };   // телефон: лише один, решту при дотику до точки
      for (const e of ['pointermove', 'touchstart', 'keydown']) on(window, e, heat, { once: true, passive: true });
      dots.forEach((d, i) => { for (const e of ['pointerenter', 'focus', 'touchstart']) on(d, e, () => load(N[i].k).catch(() => {}), { once: true, passive: true }); });
      const only = v => $$('video', film).forEach(o => o.classList.toggle('on', o === v));
      const play = v => new Promise(ok => { v.currentTime = 0; v.onended = ok; v.play().then(() => requestAnimationFrame(() => requestAnimationFrame(() => only(v)))).catch(() => { try { v.currentTime = Math.max(0, v.duration - .02); } catch { /* */ } only(v); ok(); }); setTimeout(ok, 6000); });
      const fill = i => {
        const c = N[i].c, list = x.inCat(c.id).filter(p => p.price && p.img).slice(0, 5);
        $('#labH').textContent = c.name; $('#labP').textContent = x.goods(x.count(c.id)); const a = $('#labA'); a.href = x.url(`/c/${c.id}`); a.textContent = x.L.labAll;
        $('#labL').innerHTML = list.map(p => `<li><a href="${x.url(`/p/${p.id}`)}"><img src="${x.esc(x.photo(p))}" alt="" width="64" height="64"><span>${x.esc(p.name)}</span><b>${x.money(p.price)}</b></a></li>`).join('');
        nav.forEach((b, k) => b.setAttribute('aria-current', k === i));
      };
      async function fly(i) {
        if (busy || cur === i) return; busy = true;
        const d = dots[i]; let ring = 0;
        const tick = () => { d.style.setProperty('--p', Math.max(.04, got.get(N[i].k) || 0)); ring = requestAnimationFrame(tick); };
        const wait = calm ? 0 : setTimeout(() => { el.classList.add('is-wait'); d.classList.add('busy'); d.setAttribute('aria-busy', 'true'); tick(); }, 90);
        const v = calm ? null : await Promise.race([load(N[i].k).catch(() => null), new Promise(ok => setTimeout(ok, 6000, null))]);   // повільний інтернет: показуємо деталі без польоту
        clearTimeout(wait); cancelAnimationFrame(ring); el.classList.remove('is-wait'); d.classList.remove('busy'); d.removeAttribute('aria-busy');
        if (ac.signal.aborted) return;
        fill(i); el.classList.add('is-fly');
        if (v) { const p = play(v); setTimeout(() => { el.classList.add('is-open'); el.classList.remove('is-swap'); }, Math.max(0, (v.duration || 2.6) * 1000 - 600)); await p; load(N[i].k, true).catch(() => {}); }
        el.classList.add('is-open'); el.classList.remove('is-swap');
        cur = i; busy = false; $('#labX').focus({ preventScroll: true });
      }
      async function back(focus = true, keep = false) {   // keep: перемикаємо вузол, кадр лишається зсунутим, щоб не їздив туди-сюди
        if (busy || cur === null) return; busy = true;
        const i = cur; if (keep) el.classList.add('is-swap'); el.classList.remove('is-open');
        const v = calm ? null : await load(N[i].k, true).catch(() => null);
        if (v) await play(v);
        only(null); el.classList.remove('is-fly'); nav.forEach(b => b.removeAttribute('aria-current')); cur = null; busy = false; if (focus) dots[i].focus({ preventScroll: true });
      }
      const swap = async i => { if (i === cur || busy) return; if (cur !== null) await back(false, true); await fly(i); };
      dots.forEach((d, i) => on(d, 'click', () => fly(i)));
      const T = window.ACC_TAP; if (T?.on) { T.on = false; if (T.i >= 0 && Date.now() - T.t < 20000) fly(T.i); }   // торкнулись точки, поки сайт ще вантажився
      nav.forEach((b, i) => on(b, 'click', () => swap(i)));
      on($('#labX'), 'click', () => back()); on(film, 'click', () => back()); on(window, 'keydown', e => { if (e.key === 'Escape' && cur !== null) back(); });
    }

    function flag() {
      const el = $('#flag'), S = STAGE.filter(s => x.prod.get(s.id)), pic = $('#flagPic'), word = $('#flagWord'), tabs = $$('.flag-tabs button', el);
      if (!S.length) return;
      let cur = 0, busy = false;
      const size = w => `${innerWidth > 860 ? Math.min(23, 150 / w.length) : Math.min(24, 126 / w.length)}vw`;
      const paint = i => { const s = S[i], p = x.prod.get(s.id); el.style.setProperty('--tone', s.tone); word.textContent = s.w; word.style.fontSize = size(s.w); pic.src = s.src; pic.alt = s.n; $('#flagN').textContent = s.n; $('#flagS').textContent = spec(p, x.lang); $('#flagP').textContent = x.money(p.price); $('#flagA').href = x.url(`/p/${s.id}`); tabs.forEach((b, k) => b.setAttribute('aria-pressed', k === i)); };
      paint(0); on(window, 'resize', () => { word.style.fontSize = size(S[cur].w); });
      const seen = new IntersectionObserver(es => { if (es[0].isIntersecting) { seen.disconnect(); S.forEach(s => { new Image().src = s.src; }); } }, { rootMargin: '300px' }); seen.observe(el);
      async function show(i, d) {
        i = (i + S.length) % S.length; if (busy || i === cur) return; busy = true; d = d || (i > cur ? 1 : -1); cur = i;
        if (!calm) { const o = { duration: 260, easing: 'ease-in', fill: 'forwards' }; word.animate([{ opacity: 1 }, { opacity: 0, transform: `translateX(${-d * 6}vw)` }], o); await pic.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-d * 22}vw) rotate(${-d * 5}deg) scale(.9)` }], o).finished.catch(() => {}); }
        paint(i); await pic.decode().catch(() => {}); [...pic.getAnimations(), ...word.getAnimations()].forEach(a => a.cancel());
        if (!calm) { const o = { duration: 620, easing: 'cubic-bezier(.16,.9,.2,1)' }; word.animate([{ opacity: 0, transform: `translateX(${d * 6}vw)` }, { opacity: 1, transform: 'none' }], o); pic.animate([{ opacity: 0, transform: `translateX(${d * 26}vw) rotate(${d * 6}deg) scale(.88)` }, { opacity: 1, transform: 'none' }], o); }
        busy = false;
      }
      tabs.forEach((b, i) => on(b, 'click', () => show(i))); on($('.flag-arr.p', el), 'click', () => show(cur - 1, -1)); on($('.flag-arr.n', el), 'click', () => show(cur + 1, 1));
      on(el, 'keydown', e => { if (e.target.closest('a')) return; if (e.key === 'ArrowLeft') show(cur - 1, -1); if (e.key === 'ArrowRight') show(cur + 1, 1); });
      let sx = null, sy = 0; on(el, 'pointerdown', e => { sx = e.target.closest('a,button') ? null : e.clientX; sy = e.clientY; }); on(el, 'pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 50 && Math.abs(e.clientX - sx) > Math.abs(e.clientY - sy)) show(cur + (e.clientX < sx ? 1 : -1), e.clientX < sx ? 1 : -1); sx = null; }); on(el, 'pointercancel', () => { sx = null; });
    }
  }
  return { html, init };
})();
