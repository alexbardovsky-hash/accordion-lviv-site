/* Акордеон Центр: каталог, пошук, кошик. Без збирання, дані в data/catalog.js. */
(() => {
  const C = window.CATALOG || { cats: [], products: [], featured: [] };
  const { lang, L, uk: UK } = window.I18N;
  // Переклад каталогу накладаємо на дані: українська назва лишається в p.uk для листа із замовленням.
  const TR = window.CATALOG_I18N || {};
  for (const c of C.cats) { c.uk = TR.uk?.cats[c.id] || c.name; c.name = TR[lang]?.cats[c.id] || c.uk; }
  // Слово «баян» зі сторінок прибране, але в пошуку й у <title> лишається як синонім: люди шукають саме його.
  for (const x of C.products) { const u = TR.uk?.products[x.id] || {}; x.orig = x.name; x.uk = u.name || x.name; Object.assign(x, u, TR[lang]?.products[x.id]); }
  const BAYAN_CATS = new Set([44, 45, 56]);
  const seoName = (name, id) => lang === 'uk' && BAYAN_CATS.has(id) && !/баян/i.test(name) ? `${name} (баян)` : name;
  // Перезняті фото (білий фон, тінь) лежать у photos/web/; список готових id у data/photos.js. Решта лишається з сайту.
  const PHOTO_DIR = 'photos/web5';  // поточна версія перезнятих фото (web4 + нові з ChatGPT)
  const GPT = new Set(window.GPT_PHOTOS || []);
  const LOCAL = new Set([...(window.LOCAL_PHOTOS || []), ...GPT]);
  // Нові фото з ChatGPT: головне чисте, оригінал з підписами (розміри, колір) другим.
  for (const x of C.products) if (LOCAL.has(x.id)) { x.img = `${PHOTO_DIR}/${x.id}-s.jpg`; x.big = x.img; x.imgs = GPT.has(x.id) ? [`${PHOTO_DIR}/${x.id}.jpg`, `${PHOTO_DIR}/${x.id}-o.jpg`] : [`${PHOTO_DIR}/${x.id}.jpg`]; }
  const PHONE = '+380993339890', PHONE_TEXT = '+38 099 333 98 90', MAIL = 'bajan@accordion.lviv.ua';
  const PAGE = 36;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = L.money, goods = L.goods;
  // Пошук прощає різне написання: і/и, ґ/г, подвоєні літери. Шукаємо і за українською назвою, і за назвою поточною мовою.
  const norm = s => String(s).toLowerCase().replace(/[іїи]/g, 'и').replace(/[єэ]/g, 'е').replace(/ґ/g, 'г').replace(/ы/g, 'и').replace(/ё/g, 'е').replace(/[ʼ'’`"«»]/g, '').replace(/кк/g, 'к').replace(/лл/g, 'л');

  /* ── Індекси ── */
  const cat = new Map(C.cats.map(c => [c.id, c]));
  const prod = new Map(C.products.map(p => [p.id, p]));
  const roots = C.cats.filter(c => c.parent == null);
  const subtree = id => { const out = [id]; for (const ch of cat.get(id)?.children || []) out.push(...subtree(ch)); return out; };
  const inCat = new Map();
  for (const c of C.cats) {
    const ids = new Set(subtree(c.id));
    inCat.set(c.id, C.products.filter(p => p.cats.some(x => ids.has(x))));
  }
  const count = id => inCat.get(id)?.length || 0;
  const path = id => { const out = []; for (let c = cat.get(id); c; c = cat.get(c.parent)) out.unshift(c); return out; };
  for (const p of C.products) p._n = norm(`${p.name} ${p.uk} ${p.orig} ${p.ref} ${p.brand || ''} ${p.short}${p.cats.some(c => BAYAN_CATS.has(c)) ? ' баян' : ''}`);

  const search = q => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return C.products
      .map(p => { const name = norm(p.name); let s = 0; for (const w of words) { if (!p._n.includes(w)) return null; s += name.startsWith(w) ? 3 : name.includes(w) ? 2 : 1; } return { p, s }; })
      .filter(Boolean).sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name, L.locale)).map(x => x.p);
  };

  /* ── Кошик ── */
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('bac-cart') || '{}') || {}; } catch { cart = {}; }
  const saveCart = () => { try { localStorage.setItem('bac-cart', JSON.stringify(cart)); } catch { /* приватний режим */ } paintCart(); };
  const cartLines = () => Object.entries(cart).map(([id, q]) => ({ p: prod.get(+id), q })).filter(l => l.p);
  const cartTotal = () => cartLines().reduce((s, l) => s + (l.p.price || 0) * l.q, 0);
  const cartQty = () => cartLines().reduce((s, l) => s + l.q, 0);
  const add = (id, q = 1) => { cart[id] = Math.min(999, (cart[id] || 0) + q); saveCart(); toast(L.added(prod.get(id).name), L.openCart, () => openPanel('cart')); };
  const setQty = (id, q) => { if (q <= 0) delete cart[id]; else cart[id] = Math.min(999, q); saveCart(); };

  /* ── Шматки розмітки ── */
  const pic = (p, cls = '') => p.img ? `<img ${cls} src="${esc(p.img)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;ph&quot;></span>'">` : '<span class="ph"></span>';
  const priceTag = p => p.price ? `<span class="price">${money(p.price)}</span>` : `<span class="price ask">${L.askPrice}</span>`;
  /* Обране й порівняння (account.js): сердечко й терези на картці та сторінці товару. */
  const ACC = window.ACC_ACCOUNT, AT = ACC?.t || {};
  const ICON = {
    fav: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.4 3.6 4 7 4c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 15.4 12 20 12 20Z"/></svg>',
    cmp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M5 20h14M4 9l3-5 3 5a3 3 0 0 1-6 0ZM14 9l3-5 3 5a3 3 0 0 1-6 0ZM7 4h10"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/></svg>',
  };
  const acts = p => ACC ? `<div class="card-acts">
      <button class="act" data-fav="${p.id}" aria-pressed="${ACC.isFav(p.id)}" aria-label="${esc(AT.favAdd)}" title="${esc(AT.favAdd)}">${ICON.fav}</button>
      <button class="act" data-cmp="${p.id}" aria-pressed="${ACC.inCmp(p.id)}" aria-label="${esc(AT.cmpAdd)}" title="${esc(AT.cmpAdd)}">${ICON.cmp}</button></div>` : '';
  const card = p => `
    <article class="card">
      <div class="card-img">${pic(p)}${acts(p)}</div>
      <a class="card-name" href="#/p/${p.id}">${esc(p.name)}</a>
      ${p.ref ? `<span class="card-meta">${L.sku} ${esc(p.ref)}</span>` : ''}
      <div class="card-foot">${priceTag(p)}
        ${p.buy ? `<button class="add" data-add="${p.id}" aria-label="${esc(L.addAria(p.name))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>` : ''}
      </div>
    </article>`;
  const crumbs = (items) => `<nav class="crumbs wrap" aria-label="${L.youAreHere}"><a href="#/">${L.homeCrumb}</a>${items.map(i => `<i>/</i>${i.href ? `<a href="${i.href}">${esc(i.name)}</a>` : `<span>${esc(i.name)}</span>`}`).join('')}</nav>`;
  const tree = (ids, depth = 0, current) => `<ul>${ids.filter(id => count(id)).map(id => { const c = cat.get(id); return `<li><a href="#/c/${id}"${id === current ? ' aria-current="page"' : ''}>${esc(c.name)}<span>${count(id)}</span></a>${c.children.length && depth < 2 ? tree(c.children, depth + 1, current) : ''}</li>`; }).join('')}</ul>`;

  /* ── Сторінки ── */
  const view = $('#view');
  const title = t => { document.title = t ? `${t} — ${L.brand}` : L.titleHome; };


  /* ── Вітрина: стіна підсвічених полиць, на кожній інструмент. Клік знімає інструмент з полиці й ставить
     великим планом на постамент із назвою та ціною; стрілки гортають, Esc або кнопка повертає на стіну. ── */
  // Сцени (Алекс 19.11): сторінка гортається як звичайно, кожна сцена — свій екран у потоці, нічого не прилипає.
  // Кадр сцени йде за гортанням: поки сцена проїжджає крізь екран, анімація програється від початку до кінця.
  // Кадри — картинки на canvas (tools/scene_frames.py), бо перемотка <video> на телефоні смикається;
  // між сусідніми кадрами змішуємо, а позицію згладжуємо, тож рух плавний навіть при різкому свайпі.
  function reelInit() {
    const sec = $('#reel');
    if (!sec) return;
    const FR = window.SCENE_FRAMES || {}, calm = matchMedia('(prefers-reduced-motion: reduce)').matches, hint = $('.reel-hint', sec);
    const clamp = x => Math.min(1, Math.max(0, x));
    const stages = $$('.reel-stage', sec).map((el, i) => {
      const cv = $('canvas', el), key = el.dataset.key;
      return { el, i, key, cv, ctx: cv.getContext('2d'), n: FR[key] || 0, imgs: [], p: -1, target: 0, drawn: -2, started: false, card: $('.reel-card', el) };
    });
    // Телефон бере вузьку вертикальну смугу кадру в рідній якості (tools/scene_frames.py): легше й плавніше.
    const SET = innerWidth <= 960 ? 'm' : 'd';
    const src = (s, i) => `scenes/frames2/${s.key}/${SET}/${String(i + 1).padStart(3, '0')}.webp?v=6`;
    // Спершу кожен 8-й кадр, потім щільніше: сцена оживає одразу, а дрібні кадри догружаються.
    function load(s) {
      if (s.started || !s.n) return;
      s.started = true;
      const seen = new Set(), order = [];
      for (const step of [8, 4, 2, 1]) for (let i = 0; i < s.n; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
      let k = 0, busy = 0;
      const next = () => {
        while (busy < 6 && k < order.length) {
          const i = order[k++], im = new Image(); busy++;
          im.decoding = 'async';
          const ready = () => { s.imgs[i] = im; busy--; s.drawn = -2; ask(); next(); };
          im.onload = () => (im.decode ? im.decode().then(ready, ready) : ready());
          im.onerror = () => { busy--; next(); };
          im.src = src(s, i);
        }
      };
      next();
    }
    const near = (s, i) => { for (let d = 0; d < s.n; d++) { if (s.imgs[i - d]) return [s.imgs[i - d], i - d]; if (s.imgs[i + d]) return [s.imgs[i + d], i + d]; } return [null, -1]; };
    function draw(s) {
      const box = s.cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      const W = Math.round(box.width * dpr), H = Math.round(box.height * dpr);
      if (!W || !H) return;
      if (s.cv.width !== W || s.cv.height !== H) { s.cv.width = W; s.cv.height = H; }
      const f = s.p * (s.n - 1), i = Math.floor(f), t = f - i;
      const [a, ai] = near(s, i);
      if (!a) return;
      const k = Math.max(W / a.naturalWidth, H / a.naturalHeight), dw = a.naturalWidth * k, dh = a.naturalHeight * k;
      const x = (W - dw) / 2, y = (H - dh) / 2;
      const c = s.ctx;
      c.globalAlpha = 1; c.drawImage(a, x, y, dw, dh);
      const b = ai === i && t > .02 && s.imgs[i + 1];
      if (b) { c.globalAlpha = t; c.drawImage(b, x, y, dw, dh); c.globalAlpha = 1; }
      s.cv.classList.add('is-drawn');
    }
    let raf = 0;
    function tick() {
      raf = 0;
      if (!document.body.contains(sec)) return removeEventListener('scroll', ask);
      const vh = innerHeight;
      let more = false;
      for (const s of stages) {
        const box = s.el.getBoundingClientRect();
        if (box.top < vh * 4 && box.bottom > -vh) load(s);                // наступні сцени вантажимо заздалегідь
        else if (s.started && (box.top > vh * 6 || box.bottom < -vh * 3)) { s.started = false; s.imgs = []; s.drawn = -2; }   // далекі сцени відпускаємо: телефону бракує памʼяті на всі кадри
        if (box.bottom < 0 || box.top > vh) continue;
        // перша сцена: від верху сторінки, поки не проїде; решта: від появи знизу до зникнення вгорі
        s.target = s.i === 0 ? clamp(-box.top / (box.height * .8)) : clamp((vh - box.top) / (vh + box.height));
        const d = s.target - s.p;
        s.p = calm || s.p < 0 || Math.abs(d) < .0008 ? s.target : s.p + d * .22;
        if (s.p !== s.target) more = true;
        if (!calm) {
          // глибина: картинка трохи відстає від сторінки
          const off = Math.max(-1, Math.min(1, (box.top + box.height / 2 - vh / 2) / vh)) * box.height * -.08;
          s.cv.style.setProperty('--py', `${off.toFixed(1)}px`);
        }
        if (Math.abs(s.drawn - s.p) > .0004 || s.drawn === -2) { draw(s); s.drawn = s.p; }
      }
      if (hint) hint.style.opacity = scrollY > 20 ? 0 : '';
      if (more) raf = requestAnimationFrame(tick);
    }
    const ask = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', () => { stages.forEach(s => { s.drawn = -2; }); ask(); });
    // Текст сцени виринає, коли сама сцена вже на екрані.
    const io = new IntersectionObserver(es => es.forEach(e => {
      const s = stages.find(x => x.el === e.target);
      if (e.isIntersecting) { s.card.classList.add('is-on'); s.card.removeAttribute('aria-hidden'); s.card.inert = false; }
    }), { threshold: .35 });
    stages.forEach(s => io.observe(s.el));
    tick();
  }

  // Перший екран: велика назва, поруч один інструмент із вітрини, що змінюється сам.
  function mastInit(list) {
    const a = $('#mastPic');
    if (!a || list.length < 2) return;
    const img = $('img', a), cap = $('.mast-cap', a);
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = 0, t;
    list.slice(1).forEach(p => { const im = new Image(); im.src = `img/stage2/${p.id}.webp`; });
    const show = async () => {
      if (!document.body.contains(a)) return clearInterval(t);
      if (document.hidden || a.matches(':hover')) return;
      i = (i + 1) % list.length;
      const p = list[i];
      const out = img.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-6%) scale(.96)' }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
      await out.finished.catch(() => {});
      img.src = `img/stage2/${p.id}.webp`; img.alt = p.name; a.href = `#/p/${p.id}`;
      const amb = $('#mastAmb'); if (amb) amb.src = img.src;
      a.style.setProperty('--tone', p.tone);
      cap.innerHTML = `<b>${esc(p.brandName)}</b><span>${money(p.price)}</span>`;
      await img.decode().catch(() => {});
      out.cancel();
      img.animate([{ opacity: 0, transform: 'translateX(8%) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
    };
    if (!calm) t = setInterval(show, 4200);
  }

  function wallInit(list) {
    const sec = $('#wall'), focus = $('#wallFocus');
    if (!sec || !focus) return;
    const items = $$('.wall-item', sec), n = items.length;
    const big = $('.wall-big', focus), info = $('.wall-info', focus), closeBtn = $('.wall-close', focus);
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = 'cubic-bezier(.2,.8,.2,1)';
    let cur = -1, busy = false;
    const clip = t => { t = (t || '').replace(/\s+/g, ' ').trim(); return t.length > 190 ? t.slice(0, t.lastIndexOf(' ', 190)) + '…' : t; };
    const fill = i => {
      const p = list[i], text = clip(p.short);
      big.src = `img/stage2/${p.id}.webp`; big.alt = p.name;
      focus.style.setProperty('--tone', p.tone);
      info.innerHTML = `<small>${esc(p.brandName)}<i>${L.stageOf(i + 1, n)}</i></small><h2>${esc(p.name)}</h2>${text && text !== p.name ? `<p>${esc(text)}</p>` : ''}<span class="price">${money(p.price)}</span><div class="wall-actions"><a class="btn" href="#/p/${p.id}">${L.stageView}</a>${p.buy ? `<button class="add" data-add="${p.id}" aria-label="${esc(L.addAria(p.name))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>` : ''}</div>`;
    };
    // Переліт: великий план стартує з місця й розміру інструмента на полиці.
    const fly = (i, back) => {
      const a = $('img', items[i]).getBoundingClientRect(), r = big.getBoundingClientRect();
      const k = a.height / r.height;
      const from = `translate(${a.left + a.width / 2 - (r.left + r.width / 2)}px, ${a.bottom - r.bottom}px) scale(${k})`;
      const frames = back ? [{ transform: 'none' }, { transform: from }] : [{ transform: from }, { transform: 'none' }];
      return big.animate(frames, { duration: calm ? 0 : back ? 420 : 680, easing: ease, fill: 'both' });
    };
    const unlock = () => document.documentElement.classList.remove('wall-open');
    const open = i => {
      if (busy) return;
      cur = i; fill(i);
      focus.hidden = false; document.documentElement.classList.add('wall-open');
      items.forEach((el, k) => el.classList.toggle('is-out', k === i));
      const go2 = () => { fly(i); requestAnimationFrame(() => focus.classList.add('is-open')); };
      if (big.complete && big.naturalWidth) go2(); else big.addEventListener('load', go2, { once: true });
      closeBtn.focus({ preventScroll: true });
      addEventListener('hashchange', unlock, { once: true });
    };
    const close = () => {
      if (cur < 0 || busy) return;
      busy = true; focus.classList.remove('is-open');
      const i = cur, an = fly(i, true);
      an.finished.catch(() => {}).then(() => {
        an.cancel(); focus.hidden = true; unlock(); busy = false; cur = -1;
        items.forEach(el => el.classList.remove('is-out'));
        items[i].focus({ preventScroll: true });
      });
    };
    const go = d => {
      if (cur < 0 || busy) return;
      const i = (cur + d + n) % n;
      big.getAnimations().forEach(x => x.cancel());
      const out = big.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-d * 60}px) scale(.94)` }], { duration: calm ? 0 : 200, easing: 'ease-in', fill: 'both' });
      busy = true; info.classList.add('is-swap');
      out.finished.then(() => {
        cur = i; fill(i); items.forEach((el, k) => el.classList.toggle('is-out', k === i));
        out.cancel(); info.classList.remove('is-swap'); busy = false;
        big.animate([{ opacity: 0, transform: `translateX(${d * 60}px) scale(.94)` }, { opacity: 1, transform: 'none' }], { duration: calm ? 0 : 420, easing: ease });
      });
    };
    items.forEach((el, k) => el.addEventListener('click', e => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); open(k); }));
    closeBtn.addEventListener('click', close);
    $('.wall-bg', focus).addEventListener('click', close);
    $('.wall-arrow.prev', focus).addEventListener('click', () => go(-1));
    $('.wall-arrow.next', focus).addEventListener('click', () => go(1));
    addEventListener('keydown', e => {
      if (cur < 0 || !$('#wall')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    // Свайп на телефоні гортає інструменти у великому плані.
    let sx = 0, sy = 0;
    focus.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    focus.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1); }, { passive: true });
  }

  /* ── Партнери: official — офіційне представництво в Україні, dealer — домовленості про представництво, partner — партнер.
     Знаки стилізовані під фірмові: шрифт і дрібний елемент, без чужих файлів. ── */
  const PARTNERS = [
    { n: 'Fisitalia', tier: 'official', cls: 'fisitalia' },
    { n: 'Scandalli', tier: 'official', cls: 'scandalli' },
    { n: 'Bugari', tier: 'official', cls: 'bugari', sub: 'Armando' },
    { n: 'Musictech', tier: 'official', cls: 'musictech' },
    { n: 'Pigini', tier: 'dealer', cls: 'pigini', mark: '<svg viewBox="0 0 24 24"><path d="M3 13a9 9 0 0 1 9-9M6 13a6 6 0 0 1 6-6M9 13a3 3 0 0 1 3-3"/></svg>' },
    { n: 'Beltuna', tier: 'dealer', cls: 'beltuna', mark: '<svg class="rays" viewBox="0 0 40 12"><path d="M20 1v10M13 2l4 9M27 2l-4 9M6 5l9 6M34 5l-9 6"/></svg>' },
    { n: 'Victoria', tier: 'dealer', cls: 'victoria' },
    { n: 'Mengascini', tier: 'partner', cls: 'mengascini' },
    { n: 'Serenellini', tier: 'partner', cls: 'serenellini' },
    { n: 'Dino Baffetti', tier: 'partner', cls: 'baffetti' },
  ];
  // Порядок на полиці підібраний за кольором: синій, фіолетовий, чорний, білий, червоний у центрі, далі чорний, біло-синій, червоно-чорний, сірий.
  // tone — колір підсвітки тла під інструмент (як смак у банки); brand — підпис, якщо в каталозі бренду нема.
  const SHELF = [
    { id: 568, tone: '#2f4fa8' }, { id: 485, tone: '#7a3b9a' }, { id: 297, tone: '#6e6a70' }, { id: 509, tone: '#c9a24f', brand: 'Mengascini' },
    { id: 492, tone: '#e0203f' },
    { id: 377, tone: '#5f5a60' }, { id: 494, tone: '#3b6fc4' }, { id: 543, tone: '#b51f3a' }, { id: 561, tone: '#8a8d93' },
  ];
  const logo = p => `<span class="lg lg-${p.cls} is-${p.tier}">${p.mark || ''}<b>${p.n}</b>${p.sub ? `<em>${p.sub}</em>` : ''}${p.tier === 'official' ? `<small>${L.official}</small>` : ''}</span>`;


  function home() {
    title('');
    const open = roots.find(r => r.children.length) || roots[0];
    const featured = C.featured.map(id => prod.get(id)).filter(Boolean);
    const instRoot = roots.find(r => /^акордеони/i.test(r.uk));
    const partsRoot = roots.find(r => r.children.some(k => cat.get(k).children.length));
    const groups = partsRoot ? partsRoot.children.map(k => cat.get(k)).filter(g => count(g.id)) : [];
    // По одному найстаршому інструменту від кожного виробника.
    const flagship = new Map();
    if (instRoot) for (const p of [...inCat.get(instRoot.id)].filter(p => p.price && p.imgs.length && p.brand).sort((a, b) => b.price - a.price)) if (!flagship.has(p.brand)) flagship.set(p.brand, p);
    const show = [...flagship.values()].slice(0, 6);
    // Полиця на першому екрані: ряд інструментів у повітрі, обраний виїжджає в центр (вирізані на прозоре, img/stage2/).
    const shelf = SHELF.map(x => { const p = prod.get(x.id); return p && { ...p, tone: x.tone, brandName: p.brand || x.brand || '' }; }).filter(Boolean);
    const cheapest = Math.min(...C.products.filter(p => p.price).map(p => p.price));
    // Перший екран: три повільні макросцени (міх, клавіша, ґудзик), гортання перемикає сцену, інформація зліва.
    const minIn = id => { const v = (inCat.get(id) || []).filter(p => p.price).map(p => p.price); return v.length ? Math.min(...v) : 0; };
    const KEYS = 6, BUTTONS = 5, BELLOWS = 11;
    const scenes = [
      { key: 'open', scrub: true, html: `<h1 class="reel-name">${L.mast.map(w => `<span><i>${w}</i></span>`).join('')}</h1><p>${L.mastLead(goods(C.products.length), money(cheapest))}</p><div class="hero-cta">${partsRoot ? `<a class="btn" href="#/c/${partsRoot.id}">${L.parts}</a>` : ''}${instRoot ? `<a class="btn ghost" href="#/c/${instRoot.id}">${L.instruments}</a>` : ''}</div>` },
      cat.get(BELLOWS) && { key: 'bellows', html: `<h2>${L.reelOpenH}</h2><p>${L.reelOpenP(goods(count(BELLOWS)), money(minIn(BELLOWS)))}</p><div class="hero-cta"><a class="btn" href="#/c/${BELLOWS}">${L.reelOpenCta}</a></div>` },
      cat.get(KEYS) && { key: 'keys', band: true, html: `<h2>${L.reelKeysH}</h2><p>${L.reelKeysP(goods(count(KEYS)), money(minIn(KEYS)))}</p><div class="hero-cta"><a class="btn" href="#/c/${KEYS}">${L.reelKeysCta}</a></div>` },
      cat.get(BUTTONS) && { key: 'buttons', html: `<h2>${L.reelBtnH}</h2><p>${L.reelBtnP(goods(count(BUTTONS)), money(minIn(BUTTONS)))}</p><div class="hero-cta"><a class="btn" href="#/c/${BUTTONS}">${L.reelBtnCta}</a></div>` },
    ].filter(Boolean);
    view.innerHTML = `
      <section class="reel" id="reel">
        ${scenes.map((sc, i) => `<div class="reel-stage" data-key="${sc.key}">
          <canvas class="reel-vid is-on"${sc.scrub ? ' data-scrub' : ''}${sc.band ? ' data-band' : ''} aria-hidden="true" style="background-image:url(scenes/web/${sc.key}.jpg?v=26)"></canvas>
          <div class="reel-shade" aria-hidden="true"></div>
          <div class="wrap reel-in"><div class="reel-card${i ? '' : ' is-on'}"${i ? ' aria-hidden="true"' : ''}>${sc.html}</div></div>
          ${i ? '' : `<div class="reel-hint" aria-hidden="true"><span>${L.reelHint}</span><i></i></div>`}
        </div>`).join('')}
      </section>
      <section class="section wrap wall" id="wall">
        <div class="section-head"><h2>${L.wallTitle}</h2><p>${L.wallLead}</p></div>
        <div class="wall-shelves" role="group" aria-label="${L.wallLabel}">
          ${shelf.map((p, i) => `<a class="wall-item" href="#/p/${p.id}" style="--tone:${p.tone};--i:${i}"><img src="img/stage2/${p.id}.webp" alt="${esc(p.name)}" draggable="false"><span class="wall-tag"><b>${esc(p.brandName)}</b>${money(p.price)}</span></a>`).join('')}
          ${instRoot ? `<a class="wall-all" href="#/c/${instRoot.id}"><b>${L.wallAll}</b><span>${goods(count(instRoot.id))}</span></a>` : ''}
        </div>
        <div class="wall-focus" id="wallFocus" role="dialog" aria-modal="true" aria-label="${L.wallLabel}" hidden>
          <div class="wall-bg"></div>
          <button class="wall-close" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>${L.wallBack}</button>
          <div class="wall-stand"><img class="wall-big" alt=""><div class="wall-disc" aria-hidden="true"></div></div>
          <div class="wall-info" aria-live="polite"></div>
          <button class="wall-arrow prev" type="button" aria-label="${L.shelfPrev}"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
          <button class="wall-arrow next" type="button" aria-label="${L.shelfNext}"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
        </div>
      </section>
      <section class="partners">
        <p class="partners-lead wrap"><span>${L.partnersLead}</span></p>
        <div class="marquee" aria-hidden="true">${[0, 1].map(() => `<div>${PARTNERS.map(logo).join('')}</div>`).join('')}</div>
      </section>
      <div class="sheet">
      <section class="section wrap">
        <div class="section-head"><h2>${L.catalog}</h2><p>${L.catLead}</p></div>
        <div class="cats">
          ${roots.filter(r => count(r.id)).map(r => {
            const kids = r.children.filter(count), p = inCat.get(r.id).find(x => x.img);
            return `<div class="cat${kids.length ? '' : ' solo'}">
              <a class="cat-main" href="#/c/${r.id}"><h3>${esc(r.name)}</h3><em>${goods(count(r.id))}</em></a>
              ${p ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : ''}
              ${kids.length ? `<ul>${kids.slice(0, 4).map(k => `<li><a href="#/c/${k}">${esc(cat.get(k).name)}</a></li>`).join('')}${kids.length > 4 ? `<li><a href="#/c/${r.id}">${L.moreGroups(kids.length - 4)}</a></li>` : ''}</ul>` : ''}
            </div>`;
          }).join('')}
        </div>
      </section>
      ${show.length ? `<section class="section wrap">
        <div class="section-head"><h2>${L.newInst}</h2><a href="#/c/${instRoot.id}">${L.all(goods(count(instRoot.id)))}</a></div>
        <div class="show">${show.map(p => `<a href="#/p/${p.id}"><span class="tag">${esc(p.brand)}</span><span class="pic"><img src="${esc(p.imgs[0])}" alt="" loading="lazy"></span><h3>${esc(p.name)}</h3><span class="price">${money(p.price)}</span></a>`).join('')}</div>
      </section>` : ''}
      ${featured.length ? `<section class="section wrap"><div class="section-head"><h2>${L.popular}</h2></div><div class="grid four">${featured.map(card).join('')}</div></section>` : ''}
      </div>
      ${groups.length ? `<section class="section wrap">
        <div class="section-head"><h2>${L.byUnit}</h2><p>${L.byUnitLead}</p></div>
        <div class="index" id="index">${groups.map((g, i) => {
          const p = inCat.get(g.id).find(x => x.img);
          return `<a href="#/c/${g.id}" data-peek="${p ? esc(p.img) : ''}"><i>${String(i + 1).padStart(2, '0')}</i><b>${esc(g.name)}</b><span>${g.children.filter(count).slice(0, 4).map(k => esc(cat.get(k).name.toLowerCase())).join(', ')}</span><em>${count(g.id)}</em></a>`;
        }).join('')}</div>
      </section>` : ''}
      <section class="wrap"><div class="help">
        <a href="#/service"><h3>${L.repairFull}</h3><p>${L.help1p}</p></a>
        <a href="#/delivery"><h3>${L.help2h}</h3><p>${L.help2p}</p></a>
        <a href="tel:${PHONE}"><h3>${L.help3h}</h3><p>${L.help3p(PHONE_TEXT)}</p></a>
      </div></section>`;

    const fine = matchMedia('(hover: hover) and (min-width: 961px)').matches;

    const peek = $('#peek'), index = $('#index'), heroImg = null;
    wallInit(shelf);
    reelInit();
    if (fine && index) {
      let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
      const tick = () => { x += (tx - x) * .16; y += (ty - y) * .16; peek.style.transform = `translate(${x}px, ${y}px)`; raf = peek.classList.contains('is-on') ? requestAnimationFrame(tick) : 0; };
      index.addEventListener('mousemove', e => {
        tx = e.clientX + 28; ty = e.clientY - 120;
        const a = e.target.closest('a[data-peek]');
        if (!a?.dataset.peek) return;
        const im = $('img', peek);
        if (im.getAttribute('src') !== a.dataset.peek) im.src = a.dataset.peek;
        if (!peek.classList.contains('is-on')) { x = tx; y = ty; peek.classList.add('is-on'); }
        if (!raf) raf = requestAnimationFrame(tick);
      });
      index.addEventListener('mouseleave', () => peek.classList.remove('is-on'));
    }
    if (fine && heroImg) $('.hero').addEventListener('mousemove', e => { heroImg.style.setProperty('--px', `${(e.clientX / innerWidth - .5) * -26}px`); heroImg.style.setProperty('--py', `${(e.clientY / innerHeight - .5) * -18}px`); });
  }

  function category(id, query) {
    const c = cat.get(id);
    if (!c) return notFound();
    title(seoName(c.name, c.id));
    const all = inCat.get(id);
    const brands = [...new Set(all.map(p => p.brand).filter(Boolean))].sort();
    const state = { sort: query.get('sort') || 'default', brand: query.get('brand') || '', shown: PAGE };
    const top = path(id)[0];
    view.innerHTML = `
      ${crumbs(path(id).map((x, i, a) => ({ name: x.name, href: i < a.length - 1 ? `#/c/${x.id}` : null })))}
      <div class="wrap cat-layout">
        <aside class="side" aria-label="${L.sections}"><h2>${esc(top.name)}</h2>${tree(top.children.length ? top.children : [top.id], 0, id)}
          <h2 style="margin-top:18px">${L.otherSections}</h2><ul>${roots.filter(r => r !== top).map(r => `<li><a href="#/c/${r.id}">${esc(r.name)}<span>${count(r.id)}</span></a></li>`).join('')}</ul></aside>
        <div>
          <div class="cat-head"><h1>${esc(c.name)}</h1><small>${goods(all.length)}</small></div>
          ${(window.CAT_INTRO?.[lang] || {})[id] ? `<p class="cat-lead">${esc(window.CAT_INTRO[lang][id])}</p>` : ''}
          ${c.children.length ? `<div class="chips">${c.children.filter(count).map(k => `<a class="chip" href="#/c/${k}">${esc(cat.get(k).name)}<span>${count(k)}</span></a>`).join('')}</div>` : ''}
          <div id="list"></div>
        </div>
      </div>`;
    listing($('#list'), all, state, brands, `#/c/${id}`, L.emptyCat(c.name));
  }

  function results(query) {
    const q = (query.get('q') || '').trim();
    title(L.searchTitle(q));
    const found = search(q);
    view.innerHTML = `${crumbs([{ name: L.search }])}<div class="wrap"><div class="cat-head"><h1>${q ? esc(L.quote(q)) : L.search}</h1><small>${goods(found.length)}</small></div><div id="list"></div></div>`;
    const brands = [...new Set(found.map(p => p.brand).filter(Boolean))].sort();
    listing($('#list'), found, { sort: 'default', brand: '', shown: PAGE }, brands, null, L.emptySearch(q, PHONE_TEXT));
  }

  function listing(root, all, state, brands, base, emptyText) {
    const paint = () => {
      let items = state.brand ? all.filter(p => p.brand === state.brand) : [...all];
      if (state.sort === 'cheap') items.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      if (state.sort === 'dear') items.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
      if (state.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name, L.locale));
      if (!all.length) { root.innerHTML = `<div class="empty"><h2>${L.emptyH}</h2><p>${esc(emptyText)}</p><a class="btn" href="#/">${L.toCatalog}</a></div>`; return; }
      root.innerHTML = `
        <div class="toolbar">
          <label>${L.sort} <select id="sort"><option value="default">${L.sortDefault}</option><option value="cheap">${L.sortCheap}</option><option value="dear">${L.sortDear}</option><option value="name">${L.sortName}</option></select></label>
          ${brands.length > 1 ? `<div class="brands" role="group" aria-label="${L.maker}">${brands.map(b => `<button class="chip" data-brand="${esc(b)}" aria-pressed="${state.brand === b}">${esc(b)}</button>`).join('')}</div>` : ''}
        </div>
        <div class="grid">${items.slice(0, state.shown).map(card).join('')}</div>
        ${items.length > state.shown ? `<button class="btn ghost more" id="more">${L.showMore(Math.min(PAGE, items.length - state.shown), items.length - state.shown)}</button>` : ''}`;
      $('#sort', root).value = state.sort;
    };
    root.addEventListener('change', e => { if (e.target.id === 'sort') { state.sort = e.target.value; state.shown = PAGE; paint(); } });
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-brand]');
      if (b) { state.brand = state.brand === b.dataset.brand ? '' : b.dataset.brand; state.shown = PAGE; paint(); }
      if (e.target.id === 'more') { state.shown += PAGE; paint(); }
    });
    paint();
  }

  function product(id) {
    const p = prod.get(id);
    if (!p) return notFound();
    title(seoName(p.name, p.cats.find(c => BAYAN_CATS.has(c))));
    const pics = p.imgs.length ? p.imgs : (p.big ? [p.big] : []);
    const related = inCat.get(p.cat).filter(x => x.id !== p.id).slice(0, 10);
    view.innerHTML = `
      ${crumbs([...path(p.cat).map(x => ({ name: x.name, href: `#/c/${x.id}` })), { name: p.name }])}
      <div class="wrap product">
        <div>
          <div class="gallery-main">${pics.length ? `<img id="mainPic" src="${esc(pics[0])}" alt="${esc(p.name)}" onerror="this.outerHTML='<span class=&quot;ph&quot;></span>'">` : '<span class="ph"></span>'}</div>
          ${pics.length > 1 ? `<div class="thumbs">${pics.map((u, i) => `<button data-pic="${esc(u)}" aria-pressed="${i === 0}" aria-label="${L.photo(i + 1)}"><img src="${esc(u.includes('thickbox_default') ? u.replace('thickbox_default', 'cart_default') : u)}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div class="p-info">
          <h1>${esc(p.name)}</h1>
          <p class="p-ref">${[p.ref && `${L.sku} ${esc(p.ref)}`, p.brand && esc(p.brand)].filter(Boolean).join(', ')}</p>
          ${p.price ? `<p class="p-price">${money(p.price)}</p>` : `<p class="p-price" style="font-size:1.4rem">${L.askPrice}</p>`}
          ${p.buy ? `<div class="buy">
              <div class="qty"><button data-step="-1" aria-label="${L.less}"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><input id="qty" type="number" min="1" max="999" value="1" aria-label="${L.qty}"><button data-step="1" aria-label="${L.more}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div>
              <button class="btn" id="buy">${L.addToCart}</button>${window.ACC_CHAT?.enabled ? `<button class="btn ghost p-ask" id="askP" type="button">${window.ACC_CHAT.t.askProduct}</button>` : ''}
            </div>`
            : `<div class="buy"><a class="btn" href="tel:${PHONE}">${L.callPh(PHONE_TEXT)}</a></div><p class="p-note">${L.toOrder}</p>`}
          ${ACC ? `<div class="p-acts">
            <button class="chip act-chip" data-fav="${p.id}" aria-pressed="${ACC.isFav(p.id)}">${ICON.fav}<span>${esc(AT.favH)}</span></button>
            <button class="chip act-chip" data-cmp="${p.id}" aria-pressed="${ACC.inCmp(p.id)}">${ICON.cmp}<span>${esc(AT.cmpAdd)}</span></button></div>` : ''}
          <ul class="p-facts">
            <li><b>${L.factDeliveryL}</b> ${L.factDelivery}</li>
            <li><b>${L.factCompat}</b> <a href="tel:${PHONE}">${PHONE_TEXT}</a></li>
          </ul>
          ${p.desc || p.short || p.features.length ? `<div class="p-desc"><h2>${L.desc}</h2>${p.short ? `<p>${esc(p.short)}</p>` : ''}${p.desc && p.desc !== p.short ? `<p>${esc(p.desc)}</p>` : ''}
            ${p.features.length ? `<table>${p.features.map(f => `<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join('')}</table>` : ''}</div>` : ''}
        </div>
      </div>
      ${related.length ? `<section class="section wrap"><div class="section-head"><h2>${L.related}</h2><a href="#/c/${p.cat}">${L.all(goods(count(p.cat)))}</a></div><div class="row-scroll">${related.map(card).join('')}</div></section>` : ''}`;
    view.onclick = e => {
      const t = e.target.closest('[data-pic]');
      if (t) { $('#mainPic').src = t.dataset.pic; $$('.thumbs button').forEach(b => b.setAttribute('aria-pressed', b === t)); }
      const s = e.target.closest('[data-step]');
      if (s && $('#qty')) { const i = $('#qty'); i.value = Math.max(1, Math.min(999, (+i.value || 1) + +s.dataset.step)); }
      if (e.target.id === 'buy') add(p.id, Math.max(1, +$('#qty').value || 1));
      if (e.target.id === 'askP') window.ACC_CHAT.open({ topic: window.ACC_CHAT.t.productTopic(p.name), productId: p.id });
    };
  }

  function checkout() {
    title(L.checkout);
    const lines = cartLines();
    if (!lines.length) { view.innerHTML = `<div class="wrap empty"><h1>${L.cartEmpty}</h1><p>${L.cartEmptyCheckout}</p><a class="btn" href="#/">${L.toCatalog}</a></div>`; return; }
    view.innerHTML = `
      ${crumbs([{ name: L.checkout }])}
      <div class="wrap checkout">
        <form class="form" id="order" novalidate>
          <h1>${L.checkout}</h1>
          <p class="note">${L.checkoutNote}</p>
          <div class="field"><label for="f-name">${L.fName}</label><input id="f-name" name="name" autocomplete="name" required value="${esc(ACC?.user?.name || '')}"><p class="err" hidden>${L.fNameErr}</p></div>
          <div class="field"><label for="f-phone">${L.fPhone}</label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+380" required value="${esc(ACC?.user?.phone || '')}"><p class="err" hidden>${L.fPhoneErr}</p></div>
          <div class="field"><span class="sr" id="del-l">${L.fDelivery}</span><div class="radio" role="radiogroup" aria-labelledby="del-l">
            <label><input type="radio" name="delivery" value="np" checked><span><b>${L.np}</b><br>${L.npNote}</span></label>
            <label><input type="radio" name="delivery" value="pickup"><span><b>${L.pickup}</b><br>${L.pickupNote}</span></label></div></div>
          <div class="field" id="np"><label for="f-city">${L.fCity}</label><input id="f-city" name="city" autocomplete="address-level2"></div>
          <div class="field"><label for="f-note">${L.fNote}</label><textarea id="f-note" name="note" rows="3" placeholder="${L.fNotePh}"></textarea></div>
          <div class="ask-hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>
          <p class="err" id="orderErr" role="alert" hidden></p>
          <button class="btn" type="submit">${L.send}</button>
          ${window.ACC_CHAT?.enabled ? '' : `<p class="p-note">${L.proto(MAIL)}</p>`}
        </form>
        <aside class="summary" aria-label="${L.yourOrder}"><h2>${L.yourOrder}</h2>
          ${lines.map(l => `<div class="sum-line"><span>${esc(l.p.name)} × ${l.q}</span><b>${l.p.price ? money(l.p.price * l.q) : ''}</b></div>`).join('')}
          <div class="sum-line sum-total"><span>${L.total}</span><span>${money(cartTotal())}</span></div>
          <p class="p-note">${L.payDelivery}</p></aside>
      </div>`;
    const form = $('#order');
    form.addEventListener('change', e => { if (e.target.name === 'delivery') $('#np').hidden = e.target.value !== 'np'; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const bad = { name: d.name.trim().length < 2, phone: d.phone.replace(/\D/g, '').length < 9 };
      let first;
      for (const k of ['name', 'phone']) { const i = form.elements[k]; i.nextElementSibling.hidden = !bad[k]; i.setAttribute('aria-invalid', bad[k]); if (bad[k] && !first) first = i; }
      if (first) { first.focus(); return; }
      const body = [`Замовлення з сайту`, '', ...lines.map(l => `${l.p.uk}${l.p.ref ? ` (арт. ${l.p.ref})` : ''} × ${l.q}${l.p.price ? ` = ${UK.money(l.p.price * l.q)}` : ''}`), '', `Разом: ${UK.money(cartTotal())}`, '',
        `Ім'я: ${d.name}`, `Телефон: ${d.phone}`, `Доставка: ${UK[d.delivery]}${d.delivery === 'np' && d.city ? `, ${d.city}` : ''}`, d.note ? `Коментар: ${d.note}` : '', lang === 'en' ? 'Покупець користувався англійською версією сайту.' : ''].filter((x, i, a) => x || a[i - 1]).join('\n');
      const viaMail = () => {
        location.href = `mailto:${MAIL}?subject=${encodeURIComponent('Замовлення з сайту')}&body=${encodeURIComponent(body)}`;
        view.innerHTML = `<div class="wrap empty"><h1>${L.sentH}</h1><p>${L.sentP(PHONE_TEXT)}</p><a class="btn" href="tel:${PHONE}">${L.call}</a></div>`;
      };
      const CH = window.ACC_CHAT;
      if (!CH?.enabled) return viaMail();
      // Замовлення йде в CRM; якщо сервер недоступний, лишається старий шлях через лист.
      const btn = form.querySelector('[type=submit]'), err = $('#orderErr');
      btn.disabled = true; err.hidden = true;
      CH.sendOrder({ name: d.name, phone: d.phone, delivery: d.delivery, city: d.city, note: d.note, website: d.website, items: lines.map(l => ({ id: l.p.id, q: l.q })) })
        .then(r => {
          cart = {}; saveCart(); ACC?.rememberOrder(r);
          view.innerHTML = `<div class="wrap empty"><h1>${esc(CH.t.orderOk(r.id))}</h1><p>${esc(CH.t.orderOkP(PHONE_TEXT))}</p><a class="btn" href="tel:${PHONE}">${L.call}</a></div>`;
        })
        .catch(x => { if (x.net) return viaMail(); err.textContent = CH.errText(x); err.hidden = false; btn.disabled = false; });
    });
    window.ACC_CHAT?.mark?.();
  }

  function favorites() {
    title(AT.favH);
    const list = ACC.favs().map(id => prod.get(id)).filter(Boolean);
    view.innerHTML = `${crumbs([{ name: AT.favH }])}<div class="wrap"><div class="cat-head"><h1>${esc(AT.favH)}</h1><small>${goods(list.length)}</small></div>
      ${!ACC.user && ACC.enabled && list.length ? `<p class="acc-keep"><a href="#/login">${esc(AT.loginToKeep)}</a></p>` : ''}
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty"><p>${esc(AT.favEmpty)}</p><a class="btn" href="#/">${L.toCatalog}</a></div>`}</div>`;
  }
  /* Порівняння: товари стовпчиками, рядки — ціна, виробник, артикул, розділ і всі характеристики, що є хоч в одного. */
  function compare(query) {
    title(AT.cmpH);
    const list = ACC.cmp().map(id => prod.get(id)).filter(Boolean);
    const diff = query.get('diff') === '1';
    const keys = [...new Set(list.flatMap(p => p.features.map(f => f[0])))];
    const feat = (p, k) => p.features.find(f => f[0] === k)?.[1] || '';
    const rows = [
      [AT.rowPrice, p => p.price ? money(p.price) : L.askPrice],
      [AT.rowBrand, p => esc(p.brand || '')],
      [AT.rowRef, p => esc(p.ref || '')],
      [AT.rowCat, p => cat.get(p.cat) ? `<a href="#/c/${p.cat}">${esc(cat.get(p.cat).name)}</a>` : ''],
      ...keys.map(k => [esc(k), p => esc(feat(p, k))]),
      [AT.rowDesc, p => esc(p.desc || p.short || '')],
    ].filter(([, f]) => list.some(p => f(p)) && (!diff || new Set(list.map(f)).size > 1));
    view.innerHTML = `${crumbs([{ name: AT.cmpH }])}<div class="wrap cmp">
      <div class="cat-head"><h1>${esc(AT.cmpH)}</h1><small>${goods(list.length)}</small></div>
      ${!list.length ? `<div class="empty"><p>${esc(AT.cmpEmpty(ACC.COMPARE_MAX))}</p><a class="btn" href="#/">${L.toCatalog}</a></div>` : `
      <div class="cmp-tools">${list.length > 1 ? `<a class="chip" href="#/compare${diff ? '' : '?diff=1'}" aria-pressed="${diff}">${esc(AT.cmpDiff)}</a>` : `<p class="p-note">${esc(AT.cmpOne)}</p>`}
        <button class="chip" id="cmpClear">${esc(AT.cmpClear)}</button></div>
      <div class="cmp-scroll"><table class="cmp-table" style="--n:${list.length}">
        <thead><tr><th scope="row"></th>${list.map(p => `<th scope="col"><div class="cmp-card">
          <button class="cmp-x" data-cmp="${p.id}" aria-label="${esc(AT.cmpDel)}: ${esc(p.name)}">×</button>
          <a class="cmp-img" href="#/p/${p.id}">${pic(p)}</a><a class="cmp-name" href="#/p/${p.id}">${esc(p.name)}</a>
          ${p.buy ? `<button class="btn cmp-buy" data-add="${p.id}">${L.addToCart}</button>` : `<a class="btn ghost cmp-buy" href="tel:${PHONE}">${L.call}</a>`}</div></th>`).join('')}</tr></thead>
        <tbody>${rows.map(([name, f]) => `<tr><th scope="row">${name}</th>${list.map(p => `<td>${f(p) || '—'}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>`}</div>`;
    $('#cmpClear')?.addEventListener('click', () => { ACC.cmp().slice().forEach(id => ACC.toggleCmp(id)); compare(query); });
  }
  // Для сторінок кабінету (account.js): спільні шматки сайту.
  const accCtx = {
    title, prod: id => prod.get(id), money,
    thumb: p => { const d = document.createElement('span'); d.className = 'acc-thumb'; d.innerHTML = pic(p); return d; },
    crumbsEl: name => { const d = document.createElement('div'); d.innerHTML = crumbs([{ name }]); return d.firstElementChild; },
  };

  const PAGES = {
    delivery: [L.delivery, L.pages.delivery],
    service: [L.repairFull, `${L.pages.service}<p style="margin-top:20px"><a class="contact-big" href="tel:${PHONE}">${PHONE_TEXT}</a></p>`],
    contacts: [L.contacts, `<p><a class="contact-big" href="tel:${PHONE}">${PHONE_TEXT}</a></p>
      <p><a class="contact-big" style="font-size:1.4rem" href="mailto:${MAIL}">${MAIL}</a></p>
      <h2>${L.footTitle}</h2>${L.pages.contacts}<div id="letterBox"></div>`],
  };
  function page(key) { const [h, body] = PAGES[key]; title(h); view.innerHTML = `${crumbs([{ name: h }])}<article class="wrap page"><h1>${h}</h1>${body}</article>`; if (key === 'contacts') window.ACC_CHAT?.mountLetter($('#letterBox')); }
  function notFound() { title(L.nfTitle); view.innerHTML = `<div class="wrap empty"><h1>${L.nfH}</h1><p>${L.nfP}</p><a class="btn" href="#/">${L.toCatalog}</a></div>`; }

  /* ── Маршрути ── */
  function route() {
    const [p, qs] = (location.hash.slice(1) || '/').split('?');
    const seg = p.split('/').filter(Boolean), query = new URLSearchParams(qs || '');
    closePanels(); view.onclick = null;
    if (!seg.length) home();
    else if (seg[0] === 'c') category(+seg[1], query);
    else if (seg[0] === 'p') product(+seg[1]);
    else if (seg[0] === 'search') results(query);
    else if (seg[0] === 'checkout') checkout();
    else if (ACC && seg[0] === 'favorites') favorites();
    else if (ACC && seg[0] === 'compare') compare(query);
    else if (ACC?.route(view, seg, accCtx)) { /* кабінет */ }
    else if (PAGES[seg[0]]) page(seg[0]);
    else notFound();
    $('#peek').classList.remove('is-on');
    $$('.nav-info a').forEach(a => a.getAttribute('href') === location.hash ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    window.scrollTo(0, 0);
  }

  /* ── Шапка: мова, меню, пошук ── */
  document.documentElement.lang = L.locale;
  $('meta[name="description"]').content = L.metaDesc;
  $$('[data-t]').forEach(e => { e.textContent = L[e.dataset.t]; });
  $$('[data-ta]').forEach(e => { const [attr, key] = e.dataset.ta.split(':'); e.setAttribute(attr, L[key]); });
  const wireLang = () => $$('[data-lang]').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.lang === lang);
    b.onclick = () => {
      if (b.dataset.lang === lang) return;
      const u = new URL(location.href);
      try { localStorage.setItem('bac-lang', b.dataset.lang); u.searchParams.delete('lang'); } catch { u.searchParams.set('lang', b.dataset.lang); }
      history.replaceState(null, '', u); location.reload();
    };
  });
  $('#footCats').insertAdjacentHTML('beforeend', `<p>${roots.map(r => `<a href="#/c/${r.id}">${esc(r.name)}</a>`).join('<br>')}</p>`);
  // Найбільший розділ розкладаємо на групи, щоб колонки меню були рівними.
  const megaCols = roots.flatMap(r => r.children.some(k => cat.get(k).children.length) ? r.children.map(k => cat.get(k)) : r.children.length ? [r] : []);
  const megaRest = roots.filter(r => !r.children.length && count(r.id));
  $('#mega').innerHTML = `<div class="wrap mega-grid">${megaCols.filter(c => count(c.id)).map(c => `<div class="mega-col"><a href="#/c/${c.id}">${esc(c.name)}</a>${tree(c.children, 2)}</div>`).join('')}
    <div class="mega-col">${megaRest.map(r => `<a href="#/c/${r.id}">${esc(r.name)}</a>`).join('')}<a href="#/service">${L.repair}</a><a href="#/delivery">${L.delivery}</a><a href="#/contacts">${L.contacts}</a></div></div>`;
  $('#drawer').innerHTML = `<div class="panel-head"><h2>${L.catalog}</h2><button class="icon-btn" data-close aria-label="${L.close}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <div class="panel-body">${roots.map(r => r.children.length
      ? `<details><summary>${esc(r.name)}</summary><ul><li><a href="#/c/${r.id}">${L.allInSection}<span>${count(r.id)}</span></a></li>${tree(r.children, 1).slice(4, -5)}</ul></details>`
      : `<div class="plain"><a href="#/c/${r.id}">${esc(r.name)}</a></div>`).join('')}
      <div class="plain"><a href="#/service">${L.repair}</a><a href="#/delivery">${L.delivery}</a><a href="#/contacts">${L.contacts}</a></div>
      <div class="lang drawer-lang" role="group" aria-label="${L.langLabel}"><button data-lang="uk" lang="uk">Українська</button><button data-lang="en" lang="en">English</button></div></div>`;
  wireLang();

  const scrim = $('#scrim'), panels = { cart: $('#cart'), drawer: $('#drawer') }, btns = { cart: $('#cartBtn'), drawer: $('#menuBtn') };
  let lastFocus;
  function openPanel(name) { closePanels(); $('#toast').classList.remove('is-on'); lastFocus = document.activeElement; panels[name].hidden = false; scrim.hidden = false; btns[name].setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('[data-close]', panels[name])?.focus(); }
  function closePanels() {
    const wasOpen = !scrim.hidden;
    for (const k in panels) { panels[k].hidden = true; btns[k].setAttribute('aria-expanded', 'false'); }
    scrim.hidden = true; document.body.style.overflow = ''; $('#mega').hidden = true; $('#megaBtn').setAttribute('aria-expanded', 'false');
    if (wasOpen && lastFocus?.isConnected) lastFocus.focus();
  }
  btns.cart.onclick = () => openPanel('cart');
  btns.drawer.onclick = () => openPanel('drawer');
  scrim.onclick = closePanels;
  $('#megaBtn').onclick = () => { const m = $('#mega'), on = m.hidden; m.hidden = !on; $('#megaBtn').setAttribute('aria-expanded', on); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePanels(); hideSuggest(); } });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closePanels();
    const a = e.target.closest('[data-add]'); if (a) add(+a.dataset.add);
    const fv = e.target.closest('[data-fav]');
    if (fv && ACC) { const on = ACC.toggleFav(+fv.dataset.fav); toast(on ? AT.favAdded : AT.favDel, on ? AT.favH : null, () => { location.hash = '#/favorites'; }); if (!on && location.hash === '#/favorites') favorites(); }
    const cm = e.target.closest('[data-cmp]');
    if (cm && ACC) {
      const r = ACC.toggleCmp(+cm.dataset.cmp);
      if (r.full) toast(r.text, AT.cmpOpen, () => { location.hash = '#/compare'; });
      else if (location.hash.startsWith('#/compare')) route();
      else toast(r.on ? AT.cmpAdded : AT.cmpDel, r.on && ACC.cmp().length > 1 ? AT.cmpOpen : null, () => { location.hash = '#/compare'; });
    }
    if (!e.target.closest('.top')) { $('#mega').hidden = true; $('#megaBtn').setAttribute('aria-expanded', 'false'); }
    if (!e.target.closest('.search')) hideSuggest();
  });

  function paintCart() {
    const n = cartQty(), b = $('#cartCount');
    b.hidden = !n; b.textContent = n; btns.cart.setAttribute('aria-label', n ? L.cartAria(goods(n)) : L.cartAriaEmpty);
    const lines = cartLines();
    panels.cart.innerHTML = `<div class="panel-head"><h2>${L.cart}</h2><button class="icon-btn" data-close aria-label="${L.close}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      ${lines.length ? `<div class="panel-body">${lines.map(l => `<div class="line">${pic(l.p)}
          <div><a href="#/p/${l.p.id}">${esc(l.p.name)}</a>
            <div class="qty"><button data-q="${l.p.id}" data-d="-1" aria-label="${L.less}"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><input type="number" min="1" max="999" value="${l.q}" data-qi="${l.p.id}" aria-label="${esc(L.qtyOf(l.p.name))}"><button data-q="${l.p.id}" data-d="1" aria-label="${L.more}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div></div>
          <div class="line-side"><b class="price">${l.p.price ? money(l.p.price * l.q) : ''}</b><button class="link-btn" data-rm="${l.p.id}">${L.remove}</button></div></div>`).join('')}</div>
        <div class="panel-foot"><div class="sum-line sum-total"><span>${L.total}</span><span>${money(cartTotal())}</span></div><a class="btn wide" href="#/checkout">${L.placeOrder}</a><button class="btn ghost wide" data-close>${L.keepShopping}</button></div>`
        : `<div class="panel-body"><div class="empty"><h2>${L.cartEmpty}</h2><p>${L.cartEmptyP}</p><button class="btn" data-close>${L.toCatalog}</button></div></div>`}`;
  }
  panels.cart.addEventListener('click', e => {
    const q = e.target.closest('[data-q]'); if (q) setQty(+q.dataset.q, (cart[q.dataset.q] || 0) + +q.dataset.d);
    const r = e.target.closest('[data-rm]'); if (r) setQty(+r.dataset.rm, 0);
  });
  panels.cart.addEventListener('change', e => { if (e.target.dataset.qi) setQty(+e.target.dataset.qi, Math.max(1, +e.target.value || 1)); });

  const q = $('#q'), sug = $('#suggest');
  let active = -1;
  function hideSuggest() { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); active = -1; }
  q.addEventListener('input', () => {
    const v = q.value.trim();
    if (v.length < 2) return hideSuggest();
    const found = search(v);
    sug.innerHTML = found.length
      ? found.slice(0, 6).map(p => `<a href="#/p/${p.id}">${pic(p)}<span>${esc(p.name)}<small>${esc(cat.get(p.cat)?.name || '')}</small></span>${p.price ? `<b>${money(p.price)}</b>` : ''}</a>`).join('') + (found.length > 6 ? `<a class="all" href="#/search?q=${encodeURIComponent(v)}" style="display:block">${L.showAll(goods(found.length))}</a>` : '')
      : `<p class="none">${L.noneFound}</p>`;
    sug.hidden = false; q.setAttribute('aria-expanded', 'true'); active = -1;
  });
  q.addEventListener('keydown', e => {
    const links = $$('a', sug);
    if (sug.hidden || !links.length || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
    links.forEach((a, i) => a.classList.toggle('is-active', i === active));
  });
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const pick = $('a.is-active', sug), v = q.value.trim();
    hideSuggest(); q.blur();
    if (pick) location.hash = pick.getAttribute('href'); else if (v) location.hash = `#/search?q=${encodeURIComponent(v)}`;
  });
  sug.addEventListener('click', () => { hideSuggest(); q.value = ''; });

  let toastT;
  function toast(text, action, fn) {
    const t = $('#toast'); t.innerHTML = `<span>${esc(text)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
    if (action) $('button', t).onclick = () => { t.classList.remove('is-on'); fn(); };
    t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 4000);
  }

  /* Шапка: сердечко, терези й кабінет; лічильники й позначки на картках оновлюються, щойно щось змінилось (і після входу). */
  function paintAcc() {
    if (!ACC) return;
    const f = ACC.favs().length, c = ACC.cmp().length;
    $('#favCount').hidden = !f; $('#favCount').textContent = f;
    $('#cmpCount').hidden = !c; $('#cmpCount').textContent = c; $('#cmpBtn').hidden = !c;
    const u = ACC.user, ab = $('#accBtn');
    ab.href = u ? '#/account' : '#/login'; ab.setAttribute('aria-label', u ? AT.account : AT.login); ab.title = u ? (u.name || u.email) : AT.login;
    ab.classList.toggle('is-in', !!u);
    $$('[data-fav]').forEach(b => b.setAttribute('aria-pressed', ACC.isFav(+b.dataset.fav)));
    $$('[data-cmp]').forEach(b => b.setAttribute('aria-pressed', ACC.inCmp(+b.dataset.cmp)));
  }
  if (ACC) {
    btns.cart.insertAdjacentHTML('beforebegin', `
      <a class="icon-btn hdr-act" id="cmpBtn" href="#/compare" aria-label="${esc(AT.cmpH)}" title="${esc(AT.cmpH)}" hidden>${ICON.cmp}<b id="cmpCount" hidden></b></a>
      <a class="icon-btn hdr-act" id="favBtn" href="#/favorites" aria-label="${esc(AT.favH)}" title="${esc(AT.favH)}">${ICON.fav}<b id="favCount" hidden></b></a>
      <a class="icon-btn hdr-act" id="accBtn" href="#/login">${ICON.user}</a>`);
    $$('#drawer .plain').at(-1)?.insertAdjacentHTML('afterbegin', `<a href="#/account">${esc(AT.account)}</a><a href="#/favorites">${esc(AT.favH)}</a><a href="#/compare">${esc(AT.cmpH)}</a>`);
    ACC.subscribe(paintAcc);
    paintAcc();
  }

  addEventListener('scroll', () => $('#top').classList.toggle('is-stuck', scrollY > 8), { passive: true });
  addEventListener('hashchange', route);
  paintCart(); route();
})();
