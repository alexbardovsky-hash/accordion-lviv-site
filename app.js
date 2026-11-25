/* Акордеон Центр: каталог, пошук, кошик. Без збирання, дані в data/catalog.js. */
(() => {
  const C = window.CATALOG || { cats: [], products: [], featured: [] };
  const { lang, L, uk: UK } = window.I18N;
  const { url, go, here, links } = window.SITE;
  // Переклад каталогу накладаємо на дані: українська назва лишається в p.uk для листа із замовленням.
  const TR = window.CATALOG_I18N || {};
  for (const c of C.cats) { c.uk = TR.uk?.cats[c.id] || c.name; c.name = TR[lang]?.cats[c.id] || c.uk; }
  // Слово «баян» зі сторінок прибране, але в пошуку й у <title> лишається як синонім: люди шукають саме його.
  for (const x of C.products) { const u = TR.uk?.products[x.id] || {}; x.orig = x.name; x.uk = u.name || x.name; Object.assign(x, u, TR[lang]?.products[x.id]); }
  /* Назви в каталозі писали різні люди: різні лапки, капс, «mod.», зайві дефіси. Вирівнюємо на показ; у пошуку й листах лишається й початкова. */
  const nice = t => t.replace(/PIGINI/g, 'Pigini').replace(/BUGARI/g, 'Bugari').replace(/Fis[Ii]talia/g, 'Fisitalia').replace(/Mengasciini/g, 'Mengascini').replace(/LITTLESTAR/g, 'Littlestar').replace(/ARABESQUE/g, 'Arabesque').replace(/MusicTech-DUAL LINK DIGITAL BOX/g, 'Musictech Dual Link Digital Box').replace(/MusicTech/g, 'Musictech')
    .replace(/(\d)\|/g, '$1/').replace(/\|(?=[A-Z])/g, '/').replace(/\b(87|96)120\b/g, '$1/120')
    .replace(/["“”]([^"“”]*)["“”]/g, (_, q) => `«${q.trim()}»`).replace(/«(Pigini|Bugari Armando|Bugari|Scandalli)\s+([^»]+)»/g, '$1 «$2»').replace(/«(Bugari|Pigini|Scandalli|Fisitalia)»/g, '$1')
    .replace(/(?:\s[–-])?\s(?:mod\.|мод\.|модель|model)\s*/gi, ' ').replace(/«Mod\. /g, '«').replace(/\s*\(convertor\)/g, '').replace(/\s[–-]\s(?=[а-яіїєґ]|button|converter|accordion|piano)/gi, ', ').replace(/\s[–-]\s(?=[\d«A-ZА-Я])/g, ' ').replace(/(\d)\s\/\s(?=[A-ZА-Я])/g, '$1/')
    .replace(/,\s*,/g, ',').replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim().replace(/[«»]/g, q => lang === 'en' ? { '«': '“', '»': '”' }[q] : q);
  for (const x of C.products) x.name = nice(x.name);
  // Характеристики з сайтів виробників (data/specs.js) — лише там, де в каталозі їх немає.
  for (const x of C.products) { const s = window.SPECS?.[x.id]; if (s && x.features.length < 3) { x.features = s[lang]; x.maker = true; } }
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
  // Телефон бере легшу копію головного фото (tools/web_sizes.py).
  const srcsetOf = u => /^photos\/web5\/\d+(-o)?\.jpg$/.test(u) ? `${u.replace('.jpg', '-m.webp')} 800w, ${u} 1200w` : '';
  const thumb = u => srcsetOf(u) ? u.replace('.jpg', '-m.webp') : u.replace('thickbox_default', 'cart_default');
  const photo = p => LOCAL.has(p.id) ? `${PHOTO_DIR}/${p.id}-m.webp` : p.img;
  const srcset = u => srcsetOf(u) ? ` srcset="${srcsetOf(u)}" sizes="(max-width: 960px) 92vw, 1200px"` : '';
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
      <a class="card-name" href="${url(`/p/${p.id}`)}">${esc(p.name)}</a>
      ${p.ref ? `<span class="card-meta">${L.sku} ${esc(p.ref)}</span>` : ''}
      <div class="card-foot">${priceTag(p)}
        ${p.buy ? `<button class="add" data-add="${p.id}" aria-label="${esc(L.addAria(p.name))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>` : ''}
      </div>
    </article>`;
  const crumbs = (items) => `<nav class="crumbs wrap" aria-label="${L.youAreHere}"><a href="${url(`/`)}">${L.homeCrumb}</a>${items.map(i => `<i>/</i>${i.href ? `<a href="${i.href}">${esc(i.name)}</a>` : `<span>${esc(i.name)}</span>`}`).join('')}</nav>`;
  const tree = (ids, depth = 0, current) => `<ul>${ids.filter(id => count(id)).map(id => { const c = cat.get(id); return `<li><a href="${url(`/c/${id}`)}"${id === current ? ' aria-current="page"' : ''}>${esc(c.name)}<span>${count(id)}</span></a>${c.children.length && depth < 2 ? tree(c.children, depth + 1, current) : ''}</li>`; }).join('')}</ul>`;

  /* ── Сторінки ── */
  const view = $('#view');
  // Готова сторінка вже має ту саму розмітку: тоді не перемальовуємо, щоб картинка не блимала.
  let fresh = true, lastHTML = '';
  const out = { set html(v) {
    lastHTML = v;
    if (fresh && view.firstElementChild) { const t = document.createElement('template'); t.innerHTML = v; fresh = false; if (t.innerHTML.trim() === view.innerHTML.trim()) return; }
    fresh = false; view.innerHTML = v;
  } };
  const title = t => { document.title = t ? `${t} — ${L.brand}` : L.titleHome; };


  /* ── Вітрина: стіна підсвічених полиць, на кожній інструмент. Клік знімає інструмент з полиці й ставить
     великим планом на постамент із назвою та ціною; стрілки гортають, Esc або кнопка повертає на стіну. ── */
  // Сцени (Алекс 19.11): сторінка гортається як звичайно, кожна сцена — свій екран у потоці, нічого не прилипає.
  // Кадр сцени йде за гортанням: поки сцена проїжджає крізь екран, анімація програється від початку до кінця.
  // Кадри — картинки на canvas (tools/scene_frames.py), бо перемотка <video> на телефоні смикається;
  // між сусідніми кадрами змішуємо, а позицію згладжуємо, тож рух плавний навіть при різкому свайпі.
  const poster = k => k === 'open' ? '--po:url(scenes/web/open-da.webp?v=1);--pom:url(scenes/web/open-ma.webp?v=1)' : `--po:url(scenes/web/${k}.jpg?v=26);--pom:url(scenes/web/${k}-m.webp?v=1)`;
  function reelInit() {
    const sec = $('#reel');
    if (!sec) return;
    const FR = window.SCENE_FRAMES || {}, calm = matchMedia('(prefers-reduced-motion: reduce)').matches, hint = $('.reel-hint', sec);
    const clamp = x => Math.min(1, Math.max(0, x));
    const stages = $$('.reel-stage', sec).map((el, i) => {
      const cv = $('canvas', el), key = el.dataset.key;
      return { el, i, key, cv, ctx: cv.getContext('2d'), n: FR[key] || 0, imgs: [], p: -1, target: 0, drawn: -2, level: 0, asked: new Set(), card: $('.reel-card', el) };
    });
    // Телефон бере вузьку вертикальну смугу кадру в рідній якості (tools/scene_frames.py): легше й плавніше.
    const SET = innerWidth <= 960 ? 'm' : 'd';
    const src = (s, i) => `scenes/frames2/${s.key}/${s.key === 'open' ? `${SET}a` : SET}/${String(i + 1).padStart(3, '0')}.webp?v=8`;
    // Спершу кожен 8-й кадр, потім щільніше: сцена оживає одразу, а дрібні кадри догружаються.
    // Поки людина не торкнулась сторінки, беремо лише рідкі кадри першої сцени: хто зайшов і пішов, не качає десятки мегабайтів.
    let touched = false;
    function load(s, level) {
      if (s.level >= level || !s.n) return;
      s.level = level;
      const order = [], imgs = s.imgs;
      for (const step of level > 1 ? [8, 4, 2, 1] : [8]) for (let i = 0; i < s.n; i += step) if (!s.asked.has(i)) { s.asked.add(i); order.push(i); }
      let k = 0, busy = 0;
      const next = () => {
        while (busy < 6 && k < order.length && s.imgs === imgs) {   // сцену відпустили — решту її кадрів уже не просимо
          const i = order[k++], im = new Image(); busy++;
          im.decoding = 'async';
          const ready = () => { imgs[i] = im; busy--; s.drawn = -2; ask(); next(); };
          im.onload = () => (im.decode ? im.decode().then(ready, ready) : ready());
          im.onerror = () => { busy--; next(); };
          im.src = src(s, i);
        }
      };
      next();
    }
    const near = (s, i) => { for (let d = 0; d < s.n; d++) { if (s.imgs[i - d]) return [s.imgs[i - d], i - d]; if (s.imgs[i + d]) return [s.imgs[i + d], i + d]; } return [null, -1]; };
    function draw(s) {
      const box = s.cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1, s.cv.hasAttribute("data-scrub") && SET === "m" ? Math.max(1, 1080 / box.width) : 9);   // більше за сам кадр малювати нема сенсу
      const W = Math.round(box.width * dpr), H = Math.round(box.height * dpr);
      if (!W || !H) return;
      if (s.cv.width !== W || s.cv.height !== H) { s.cv.width = W; s.cv.height = H; }
      const f = s.p * (s.n - 1), i = Math.floor(f), t = f - i;
      const [a, ai] = near(s, i);
      if (!a) return;
      const k = Math.max(W / a.naturalWidth, H / a.naturalHeight), dw = a.naturalWidth * k, dh = a.naturalHeight * k;
      const x = (W - dw) / 2, y = (H - dh) / 2;
      const c = s.ctx;
      if (s.key === 'open') c.clearRect(0, 0, W, H);   // ці кадри прозорі: тло під ними малює CSS
      c.globalAlpha = 1; c.drawImage(a, x, y, dw, dh);
      const b = ai === i && t > .02 && s.imgs[i + 1];
      if (b) { c.globalAlpha = t; c.drawImage(b, x, y, dw, dh); c.globalAlpha = 1; }
      s.cv.classList.add('is-drawn');
    }
    let raf = 0;
    function tick() {
      raf = 0;
      if (!document.body.contains(sec)) return;
      const vh = innerHeight;
      let more = false;
      for (const s of stages) {
        const box = s.el.getBoundingClientRect();
        if (touched && s.i > 1 && box.top < vh * 3 && !s.cv.style.backgroundImage) s.cv.style.backgroundImage = innerWidth <= 960 ? `url(scenes/web/${s.key}-m.webp?v=1)` : `url(scenes/web/${s.key}.jpg?v=26)`;
        if (!touched) { if (!s.i) load(s, 1); }
        else if (box.top < vh * 2.5 && box.bottom > -vh) load(s, box.top < vh * 1.5 ? 2 : 1);   // наступну сцену вантажимо заздалегідь, дальшу — рідко
        else if (s.level && (box.top > vh * 6 || box.bottom < -vh * 3)) { s.level = 0; s.asked = new Set(); s.imgs = []; s.drawn = -2; }   // далекі сцени відпускаємо: телефону бракує памʼяті на всі кадри
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
    const ac = new AbortController(), on = (ev, f, o = {}) => addEventListener(ev, f, { signal: ac.signal, ...o });
    addEventListener('sitenav', () => { ac.abort(); io.disconnect(); cancelAnimationFrame(raf); stages.forEach(s => { s.imgs = []; }); }, { once: true });   // інакше кадри висять у памʼяті телефона
    on('scroll', ask, { passive: true });
    on('resize', () => { stages.forEach(s => { s.drawn = -2; }); ask(); });
    // Текст сцени виринає, коли сама сцена вже на екрані.
    const io = new IntersectionObserver(es => es.forEach(e => {
      const s = stages.find(x => x.el === e.target);
      if (e.isIntersecting) { s.card.classList.add('is-on'); s.card.removeAttribute('aria-hidden'); s.card.inert = false; }
    }), { threshold: .35 });
    stages.forEach(s => io.observe(s.el));
    const wake = () => { if (touched) return; touched = true; ask(); };
    for (const ev of ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown']) on(ev, wake, { passive: true, once: true });
    tick();
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
  const logo = p => `<span class="lg lg-${p.cls} is-${p.tier}">${p.mark || ''}<b>${p.n}</b>${p.sub ? `<em>${p.sub}</em>` : ''}${p.tier === 'official' ? `<small>${L.official}</small>` : ''}</span>`;


  function home() {
    title('');
    const x = { L, lang, esc, url, goods, money, count, cat, prod, inCat: id => inCat.get(id) || [], cats: C.cats, roots, photo,
      partners: [0, 1].map(() => `<div>${PARTNERS.map(logo).join('')}</div>`).join('') };
    out.html = window.ACC_HOME.html(x);
    logoFonts();
    window.ACC_HOME.init(view, x);
  }
  // Шрифти знаків партнерів потрібні лише в тому рядку: беремо їх, коли він близько.
  function logoFonts() {
    const p = $('.partners', view);
    if (p) new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect(); if (!$('#logoFonts')) document.head.insertAdjacentHTML('beforeend', '<link id="logoFonts" rel="stylesheet" href="fonts-logos.css">'); }, { rootMargin: '800px' }).observe(p);
  }

  function category(id, query) {
    const c = cat.get(id);
    if (!c) return notFound();
    title(seoName(c.name, c.id));
    const all = inCat.get(id);
    const brands = [...new Set(all.map(p => p.brand).filter(Boolean))].sort();
    const state = { sort: query.get('sort') || 'default', brand: query.get('brand') || '', shown: Math.max(PAGE, +query.get('n') || 0), query };
    const top = path(id)[0];
    const scene = { 11: 'bellows', 6: 'keys', 5: 'buttons' }[id];   // макросцени з колишньої головної живуть у своїх розділах
    out.html = `
      ${scene ? `<section class="reel cat-reel" id="reel" aria-hidden="true"><div class="reel-stage" data-key="${scene}"><canvas class="reel-vid is-on"${scene === 'keys' ? ' data-band' : ''} style="${poster(scene)}"></canvas><div class="reel-card" hidden></div></div></section>` : ''}
      ${crumbs(path(id).map((x, i, a) => ({ name: x.name, href: i < a.length - 1 ? url(`/c/${x.id}`) : null })))}
      <div class="wrap cat-layout">
        <aside class="side" aria-label="${L.sections}"><h2>${esc(top.name)}</h2>${tree(top.children.length ? top.children : [top.id], 0, id)}
          <h2 style="margin-top:18px">${L.otherSections}</h2><ul>${roots.filter(r => r !== top).map(r => `<li><a href="${url(`/c/${r.id}`)}">${esc(r.name)}<span>${count(r.id)}</span></a></li>`).join('')}</ul></aside>
        <div>
          <div class="cat-head"><h1>${esc(c.name)}</h1><small>${goods(all.length)}</small></div>
          ${(window.CAT_INTRO?.[lang] || {})[id] ? `<p class="cat-lead">${esc(window.CAT_INTRO[lang][id])}</p>` : ''}
          ${c.children.length ? `<div class="chips">${c.children.filter(count).map(k => `<a class="chip" href="${url(`/c/${k}`)}">${esc(cat.get(k).name)}<span>${count(k)}</span></a>`).join('')}</div>` : ''}
          <div id="list"></div>
        </div>
      </div>`;
    listing($('#list'), all, state, brands, `/c/${id}`, L.emptyCat(c.name));
    if (scene) reelInit();
  }

  function results(query) {
    const q = (query.get('q') || '').trim();
    title(L.searchTitle(q));
    const found = search(q);
    out.html = `${crumbs([{ name: L.search }])}<div class="wrap"><div class="cat-head"><h1>${q ? esc(L.quote(q)) : L.search}</h1><small>${goods(found.length)}</small></div><div id="list"></div></div>`;
    const brands = [...new Set(found.map(p => p.brand).filter(Boolean))].sort();
    listing($('#list'), found, { sort: query.get('sort') || 'default', brand: query.get('brand') || '', shown: Math.max(PAGE, +query.get('n') || 0), query }, brands, null, L.emptySearch(q, PHONE_TEXT));
  }

  /* Фільтри для інструментів: ціна, баси, вага. Число басів беремо з назви (41/120) чи характеристики, вагу — з характеристики. */
  const basses = p => +(p.features.find(f => /^(Ліва рука|Left hand)$/.test(f[0]))?.[1].match(/^\d+/)?.[0] || p.name.match(/\d{2,3}\s*\/\s*(\d{2,3})/)?.[1] || 0);
  const weight = p => parseFloat((p.features.find(f => /^(Вага|Weight)$/.test(f[0]))?.[1] || '').replace(',', '.')) || 0;
  function listing(root, all, state, brands, base, emptyText) {
    if (!brands.includes(state.brand)) state.brand = '';
    const inst = all.filter(p => p.price >= 20000).length > 7;
    const bassSet = inst ? [...new Set(all.map(basses).filter(Boolean))].sort((a, b) => a - b) : [];
    const heavy = inst && all.filter(weight).length > 7;
    const qn = k => Math.max(0, +state.query?.get(k) || 0);
    const f = state.f = { min: qn('min'), max: qn('max'), bass: qn('bass'), kg: qn('kg') };
    // Фільтри живуть в адресі: повернувся назад чи надіслав посилання — вони на місці.
    const keep = () => {
      const u = new URL(location.href);
      for (const [k, v] of Object.entries({ ...f, brand: state.brand, sort: state.sort === 'default' ? '' : state.sort, n: state.shown > PAGE ? state.shown : '' })) if (v) u.searchParams.set(k, v); else u.searchParams.delete(k);
      if (u.href !== location.href) history.replaceState(history.state, '', u);
    };
    const sel = (id, label, opts) => `<label>${label} <select data-f="${id}">${opts.map(([v, t]) => `<option value="${v}"${f[id] === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
    let painted = false;
    const paint = () => {
      let items = all.filter(p => (!state.brand || p.brand === state.brand) && (!f.min || p.price >= f.min) && (!f.max || (p.price && p.price <= f.max)) && (!f.bass || basses(p) === f.bass) && (!f.kg || (weight(p) && weight(p) <= f.kg)));
      if (state.sort === 'cheap') items.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      if (state.sort === 'dear') items.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
      if (state.sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name, L.locale));
      if (!all.length) { root.innerHTML = `<div class="empty"><h2>${L.emptyH}</h2><p>${esc(emptyText)}</p><a class="btn" href="${url(`/`)}">${L.toCatalog}</a></div>`; return; }
      root.innerHTML = `
        ${inst ? `<button type="button" class="chip filt-btn" aria-expanded="${!!state.open}">${L.fBtn}${(n => n ? ` · ${n}` : '')([f.min, f.max, f.bass, f.kg, state.brand].filter(Boolean).length)}</button>` : ''}
        <div class="toolbar${inst ? ' can-fold' : ''}${state.open ? ' is-open' : ''}">
          <label>${L.sort} <select id="sort"><option value="default">${L.sortDefault}</option><option value="cheap">${L.sortCheap}</option><option value="dear">${L.sortDear}</option><option value="name">${L.sortName}</option></select></label>
          ${brands.length > 1 ? `<div class="brands" role="group" aria-label="${L.maker}">${brands.map(b => `<button class="chip" data-brand="${esc(b)}" aria-pressed="${state.brand === b}">${esc(b)}</button>`).join('')}</div>` : ''}
          ${inst ? `<div class="filters">
            <label>${L.fPrice} <input type="number" data-f="min" min="0" step="1000" inputmode="numeric" placeholder="${L.fFrom}" aria-label="${L.fPrice}: ${L.fFrom}" value="${f.min || ''}"></label><input type="number" data-f="max" min="0" step="1000" inputmode="numeric" placeholder="${L.fTo}" aria-label="${L.fPrice}: ${L.fTo}" value="${f.max || ''}">
            ${bassSet.length > 1 ? sel('bass', L.fBass, [[0, L.fAny], ...bassSet.map(x => [x, x])]) : ''}
            ${heavy ? sel('kg', L.fWeight, [[0, L.fAny], ...[6, 8, 10, 12].map(x => [x, L.fUpTo(x)])]) : ''}
            ${f.min || f.max || f.bass || f.kg || state.brand ? `<button class="link-btn" data-clear>${L.fClear}</button>` : ''}
            <span class="filters-n" role="status">${goods(items.length)}</span></div>` : ''}
        </div>
        ${items.length ? '' : `<div class="empty"><p>${L.fNone}</p></div>`}
        <div class="grid">${items.slice(0, state.shown).map(card).join('')}</div>
        ${items.length > state.shown ? `<button class="btn ghost more" id="more">${L.showMore(Math.min(PAGE, items.length - state.shown), items.length - state.shown)}</button>` : ''}`;
      $('#sort', root).value = state.sort;
      if (painted) keep(); painted = true;
    };
    root.addEventListener('change', e => { if (e.target.id === 'sort') { state.sort = e.target.value; state.shown = PAGE; paint(); }
      const k = e.target.dataset.f; if (k) { f[k] = Math.max(0, +e.target.value || 0); state.shown = PAGE; paint(); $(`[data-f="${k}"]`, root)?.focus({ preventScroll: true }); } });
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-brand]');
      if (b) { state.brand = state.brand === b.dataset.brand ? '' : b.dataset.brand; state.shown = PAGE; paint(); }
      if (e.target.closest('.filt-btn')) { state.open = !state.open; paint(); $('.filt-btn', root).focus({ preventScroll: true }); }
      if (e.target.closest('[data-clear]')) { Object.assign(f, { min: 0, max: 0, bass: 0, kg: 0 }); state.brand = ''; paint(); $('#sort', root).focus({ preventScroll: true }); }
      if (e.target.id === 'more') { state.shown += PAGE; paint(); }
    });
    paint();
  }

  function product(id) {
    const p = prod.get(id);
    if (!p) return notFound();
    title(seoName(p.name, p.cats.find(c => BAYAN_CATS.has(c))));
    const pics = p.imgs.length ? p.imgs : (p.big ? [p.big] : []);
    setFoot(L.footLeadInst, p);
    const related = inCat.get(p.cat).filter(x => x.id !== p.id).slice(0, 10);
    // Інструменти: без «кількості», спершу питають про наявність і домовляються послухати (варіант A, 25.11).
    const inst = p.price >= 20000 && p.cats.some(c => path(c)[0]?.id === 43 || c === 48);
    const text = [p.short, p.desc !== p.short ? p.desc : ''].filter(Boolean).map(t => `<p>${esc(t)}</p>`).join('');
    const spec = p.features.length ? (inst ? `<dl class="p-spec">${p.features.map(f => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>` : `<table>${p.features.map(f => `<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join('')}</table>`) + (p.maker ? `<p class="p-note">${L.makerData}</p>` : '') : '';
    const desc = text || spec ? `<div class="p-desc"><h2>${inst && spec ? L.specH : L.desc}</h2>${text}${spec}</div>` : '';
    out.html = `
      ${crumbs([...path(p.cat).map(x => ({ name: x.name, href: url(`/c/${x.id}`) })), { name: p.name }])}
      <div class="wrap product${inst ? ' inst' : ''}">
        <div>
          <div class="gallery-main">${pics.length ? `<button type="button" class="zoom-btn" id="zoomBtn" aria-label="${L.zoom}"><img id="mainPic" src="${esc(pics[0])}"${srcset(pics[0])} fetchpriority="high" width="1200" height="1200" alt="${esc(p.name)}" onerror="this.outerHTML='<span class=&quot;ph&quot;></span>'"></button>` : '<span class="ph"></span>'}</div>
          ${pics.length > 1 ? `<div class="thumbs">${pics.map((u, i) => `<button data-pic="${esc(u)}" aria-pressed="${i === 0}" aria-label="${L.photo(i + 1)}"><img src="${esc(thumb(u))}" alt="" width="72" height="72"></button>`).join('')}</div>` : ''}
        </div>
        <div class="p-info">
          <h1>${esc(p.name)}</h1>
          <p class="p-ref">${[p.ref && `${L.sku} ${esc(p.ref)}`, p.brand && esc(p.brand)].filter(Boolean).join(', ')}</p>
          ${p.price ? `<p class="p-price">${money(p.price)}</p>` : `<p class="p-price" style="font-size:1.4rem">${L.askPrice}</p>`}
          ${inst ? `<div class="p-ask">
              ${window.ACC_CHAT?.enabled ? `<button class="btn" id="askP" type="button">${L.instAsk}</button><button class="btn ghost" id="askL" type="button">${L.instListen}</button>` : `<a class="btn" href="tel:${PHONE}">${L.instAsk}</a><a class="btn ghost" href="${url('/contacts')}">${L.instListen}</a>`}
              ${p.buy ? `<button class="link-btn p-add" data-add="${p.id}">${L.addToCart}</button>` : ''}</div>`
          : p.buy ? `<div class="buy">
              <div class="qty"><button data-step="-1" aria-label="${L.less}"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><input id="qty" type="number" min="1" max="999" value="1" aria-label="${L.qty}"><button data-step="1" aria-label="${L.more}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div>
              <button class="btn" id="buy">${L.addToCart}</button>${window.ACC_CHAT?.enabled ? `<button class="btn ghost p-ask-one" id="askP" type="button">${window.ACC_CHAT.t.askProduct}</button>` : ''}
            </div>`
            : `<div class="buy"><a class="btn" href="tel:${PHONE}">${L.callPh(PHONE_TEXT)}</a></div><p class="p-note">${L.toOrder}</p>`}
          ${ACC ? `<div class="p-acts">
            <button class="chip act-chip" data-fav="${p.id}" aria-pressed="${ACC.isFav(p.id)}">${ICON.fav}<span>${esc(AT.favH)}</span></button>
            <button class="chip act-chip" data-cmp="${p.id}" aria-pressed="${ACC.inCmp(p.id)}">${ICON.cmp}<span>${esc(AT.cmpAdd)}</span></button></div>` : ''}
          ${inst ? `<ul class="p-steps">${L.instSteps.map(([b, t]) => `<li><b>${b}</b>${t}</li>`).join('')}</ul>` : `<ul class="p-facts">
            <li><b>${L.factDeliveryL}</b> ${L.factDelivery}</li>
            <li><b>${L.factCompat}</b> <a href="tel:${PHONE}">${PHONE_TEXT}</a></li>
          </ul>`}
          ${!inst ? desc : ''}
        </div>
        ${inst ? `<div class="p-full">${desc}</div>` : ''}
      </div>
      ${related.length ? `<section class="section wrap"><div class="section-head"><h2>${L.related}</h2><a href="${url(`/c/${p.cat}`)}">${L.all(goods(count(p.cat)))}</a></div><div class="row-scroll">${related.map(card).join('')}</div></section>` : ''}`;
    view.onclick = e => {
      const t = e.target.closest('[data-pic]');
      if (t) { const m = $('#mainPic'), ss = srcsetOf(t.dataset.pic); if (ss) m.srcset = ss; else m.removeAttribute('srcset'); m.src = t.dataset.pic; $$('.thumbs button').forEach(b => b.setAttribute('aria-pressed', b === t)); }
      const s = e.target.closest('[data-step]');
      if (s && $('#qty')) { const i = $('#qty'); i.value = Math.max(1, Math.min(999, (+i.value || 1) + +s.dataset.step)); }
      if (e.target.id === 'buy') add(p.id, Math.max(1, +$('#qty').value || 1));
      if (e.target.id === 'askP') window.ACC_CHAT.open({ topic: window.ACC_CHAT.t.productTopic(p.name), productId: p.id });
      if (e.target.id === 'askL') window.ACC_CHAT.open({ topic: `${L.instListen}: ${p.name}`.slice(0, 120), productId: p.id });
      if (e.target.closest('#zoomBtn')) zoom($('#mainPic').dataset.full || $('#mainPic').getAttribute('src'), p.name);
    };
  }

  /* Фото на весь екран */
  function zoom(src, alt) {
    let d = $('#zoom');
    if (!d) { document.body.insertAdjacentHTML('beforeend', `<dialog id="zoom" class="zoom"><img alt=""><button type="button" aria-label="${L.close}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></dialog>`); d = $('#zoom'); d.addEventListener('click', () => d.close()); addEventListener('sitenav', () => d.close()); }
    const im = $('img', d); im.src = src; im.alt = alt; d.showModal();
  }

  function checkout() {
    title(L.checkout);
    const lines = cartLines();
    if (!lines.length) { out.html = `<div class="wrap empty"><h1>${L.cartEmpty}</h1><p>${L.cartEmptyCheckout}</p><a class="btn" href="${url(`/`)}">${L.toCatalog}</a></div>`; return; }
    out.html = `
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
        out.html = `<div class="wrap empty"><h1>${L.sentH}</h1><p>${L.sentP(PHONE_TEXT)}</p><a class="btn" href="tel:${PHONE}">${L.call}</a></div>`;
      };
      const CH = window.ACC_CHAT;
      if (!CH?.enabled) return viaMail();
      // Замовлення йде в CRM; якщо сервер недоступний, лишається старий шлях через лист.
      const btn = form.querySelector('[type=submit]'), err = $('#orderErr');
      btn.disabled = true; err.hidden = true;
      CH.sendOrder({ name: d.name, phone: d.phone, delivery: d.delivery, city: d.city, note: d.note, website: d.website, items: lines.map(l => ({ id: l.p.id, q: l.q })) })
        .then(r => {
          cart = {}; saveCart(); ACC?.rememberOrder(r);
          out.html = `<div class="wrap empty"><h1>${esc(CH.t.orderOk(r.id))}</h1><p>${esc(CH.t.orderOkP(PHONE_TEXT))}</p><a class="btn ${r.payable ? 'ghost' : ''}" href="tel:${PHONE}">${L.call}</a></div>`;
          if (r.payable && ACC?.payButton) $('.empty h1', view).nextElementSibling.after(ACC.payButton(r.id));
          scrollTo({ top: 0, behavior: 'instant' });
        })
        .catch(x => { if (x.net) return viaMail(); err.textContent = CH.errText(x); err.hidden = false; btn.disabled = false; });
    });
    window.ACC_CHAT?.mark?.();
  }

  function favorites() {
    title(AT.favH);
    const list = ACC.favs().map(id => prod.get(id)).filter(Boolean);
    out.html = `${crumbs([{ name: AT.favH }])}<div class="wrap"><div class="cat-head"><h1>${esc(AT.favH)}</h1><small>${goods(list.length)}</small></div>
      ${!ACC.user && ACC.enabled && list.length ? `<p class="acc-keep"><a href="${url(`/login`)}">${esc(AT.loginToKeep)}</a></p>` : ''}
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty"><p>${esc(AT.favEmpty)}</p><a class="btn" href="${url(`/`)}">${L.toCatalog}</a></div>`}</div>`;
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
      [AT.rowCat, p => cat.get(p.cat) ? `<a href="${url(`/c/${p.cat}`)}">${esc(cat.get(p.cat).name)}</a>` : ''],
      ...keys.map(k => [esc(k), p => esc(feat(p, k))]),
      [AT.rowDesc, p => esc(p.desc || p.short || '')],
    ].filter(([, f]) => list.some(p => f(p)) && (!diff || new Set(list.map(f)).size > 1));
    out.html = `${crumbs([{ name: AT.cmpH }])}<div class="wrap cmp">
      <div class="cat-head"><h1>${esc(AT.cmpH)}</h1><small>${goods(list.length)}</small></div>
      ${!list.length ? `<div class="empty"><p>${esc(AT.cmpEmpty(ACC.COMPARE_MAX))}</p><a class="btn" href="${url(`/`)}">${L.toCatalog}</a></div>` : `
      <div class="cmp-tools">${list.length > 1 ? `<a class="chip" href="${url(`/compare${diff ? '' : '?diff=1'}`)}" aria-pressed="${diff}">${esc(AT.cmpDiff)}</a>` : `<p class="p-note">${esc(AT.cmpOne)}</p>`}
        <button class="chip" id="cmpClear">${esc(AT.cmpClear)}</button></div>
      <div class="cmp-scroll"><table class="cmp-table" style="--n:${list.length}">
        <thead><tr><th scope="row"></th>${list.map(p => `<th scope="col"><div class="cmp-card">
          <button class="cmp-x" data-cmp="${p.id}" aria-label="${esc(AT.cmpDel)}: ${esc(p.name)}">×</button>
          <a class="cmp-img" href="${url(`/p/${p.id}`)}">${pic(p)}</a><a class="cmp-name" href="${url(`/p/${p.id}`)}">${esc(p.name)}</a>
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
    delivery: [L.delivery, links(L.pages.delivery)],
    service: [L.repairFull, `<div class="svc-media" aria-hidden="true"><video src="scenes/web/bellows_macro-w.mp4" poster="scenes/web/bellows-m.webp" muted loop playsinline preload="none"></video><video src="scenes/web/buttons-w.mp4" poster="scenes/web/buttons-m.webp" muted loop playsinline preload="none"></video></div>${links(L.pages.service)}<p style="margin-top:20px"><a class="contact-big" href="tel:${PHONE}">${PHONE_TEXT}</a></p>`],
    contacts: [L.contacts, `<p><a class="contact-big" href="tel:${PHONE}">${PHONE_TEXT}</a></p>
      <p><a class="contact-big" style="font-size:1.4rem" href="mailto:${MAIL}">${MAIL}</a></p>
      <h2>${L.footTitle}</h2>${links(L.pages.contacts)}<div id="letterBox"></div>`],
  };
  function page(key) { const [h, body] = PAGES[key]; title(h); out.html = `${crumbs([{ name: h }])}<article class="wrap page"><h1>${h}</h1>${body}</article>`; if (key === 'contacts') window.ACC_CHAT?.mountLetter($('#letterBox'));
    if (key === 'service' && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const vo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause(); })); $$('.svc-media video').forEach(v => vo.observe(v)); }
  }
  function notFound() { title(L.nfTitle); out.html = `<div class="wrap empty"><h1>${L.nfH}</h1><p>${L.nfP}</p><a class="btn" href="${url(`/`)}">${L.toCatalog}</a></div>`; }

  /* ── Маршрути ── */
  const setFoot = (t, p) => { const e = $('.foot-lead'); if (e) e.textContent = p && !(p.price >= 20000 && p.cats.some(c => path(c)[0]?.id === 43 || c === 48)) ? L.footLead : t; };
  function route(y = 0) {
    setFoot(L.footLead);
    const [p, qs] = here().split('?');
    const seg = p.split('/').filter(Boolean), query = new URLSearchParams(qs || '');
    closePanels(); view.onclick = null;
    document.body.classList.toggle('is-home', !seg.length);
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
    $$('.nav-info a').forEach(a => a.pathname === location.pathname ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    window.scrollTo({ top: y, behavior: 'instant' });
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
      location.href = url(here(), b.dataset.lang);
    };
  });
  $$('[data-r]').forEach(a => { a.href = url(a.dataset.r); });
  $('#footCats p')?.remove();   // у готовій сторінці список уже є
  $('#footCats').insertAdjacentHTML('beforeend', `<p>${roots.map(r => `<a href="${url(`/c/${r.id}`)}">${esc(r.name)}</a>`).join('<br>')}</p>`);
  // Найбільший розділ розкладаємо на групи, щоб колонки меню були рівними.
  const megaCols = roots.flatMap(r => r.children.some(k => cat.get(k).children.length) ? r.children.map(k => cat.get(k)) : r.children.length ? [r] : []);
  const megaRest = roots.filter(r => !r.children.length && count(r.id));
  $('#mega').innerHTML = `<div class="wrap mega-grid">${megaCols.filter(c => count(c.id)).map(c => `<div class="mega-col"><a href="${url(`/c/${c.id}`)}">${esc(c.name)}</a>${tree(c.children, 2)}</div>`).join('')}
    <div class="mega-col">${megaRest.map(r => `<a href="${url(`/c/${r.id}`)}">${esc(r.name)}</a>`).join('')}<a href="${url(`/service`)}">${L.repair}</a><a href="${url(`/delivery`)}">${L.delivery}</a><a href="${url(`/contacts`)}">${L.contacts}</a></div></div>`;
  $('#drawer').innerHTML = `<div class="panel-head"><h2>${L.catalog}</h2><button class="icon-btn" data-close aria-label="${L.close}"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <div class="panel-body">${roots.map(r => r.children.length
      ? `<details><summary>${esc(r.name)}</summary><ul><li><a href="${url(`/c/${r.id}`)}">${L.allInSection}<span>${count(r.id)}</span></a></li>${tree(r.children, 1).slice(4, -5)}</ul></details>`
      : `<div class="plain"><a href="${url(`/c/${r.id}`)}">${esc(r.name)}</a></div>`).join('')}
      <div class="plain"><a href="${url(`/service`)}">${L.repair}</a><a href="${url(`/delivery`)}">${L.delivery}</a><a href="${url(`/contacts`)}">${L.contacts}</a></div>
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
  $('#searchBtn').onclick = () => { const on = $('#top').classList.toggle('search-on'); $('#searchBtn').setAttribute('aria-expanded', on); topH(); if (on) $('#q').focus(); };
  btns.cart.onclick = () => openPanel('cart');
  btns.drawer.onclick = () => openPanel('drawer');
  scrim.onclick = closePanels;
  $('#megaBtn').onclick = () => { const m = $('#mega'), on = m.hidden; m.hidden = !on; $('#megaBtn').setAttribute('aria-expanded', on); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePanels(); hideSuggest(); } });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closePanels();
    const a = e.target.closest('[data-add]'); if (a) add(+a.dataset.add);
    const fv = e.target.closest('[data-fav]');
    if (fv && ACC) { const on = ACC.toggleFav(+fv.dataset.fav); toast(on ? AT.favAdded : AT.favDel, on ? AT.favH : null, () => go('/favorites')); if (!on && here() === '/favorites') favorites(); }
    const cm = e.target.closest('[data-cmp]');
    if (cm && ACC) {
      const r = ACC.toggleCmp(+cm.dataset.cmp);
      if (r.full) toast(r.text, AT.cmpOpen, () => go('/compare'));
      else if (here().startsWith('/compare')) route();
      else toast(r.on ? AT.cmpAdded : AT.cmpDel, r.on && ACC.cmp().length > 1 ? AT.cmpOpen : null, () => go('/compare'));
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
          <div><a href="${url(`/p/${l.p.id}`)}">${esc(l.p.name)}</a>
            <div class="qty"><button data-q="${l.p.id}" data-d="-1" aria-label="${L.less}"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><input type="number" min="1" max="999" value="${l.q}" data-qi="${l.p.id}" aria-label="${esc(L.qtyOf(l.p.name))}"><button data-q="${l.p.id}" data-d="1" aria-label="${L.more}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div></div>
          <div class="line-side"><b class="price">${l.p.price ? money(l.p.price * l.q) : ''}</b><button class="link-btn" data-rm="${l.p.id}">${L.remove}</button></div></div>`).join('')}</div>
        <div class="panel-foot"><div class="sum-line sum-total"><span>${L.total}</span><span>${money(cartTotal())}</span></div><a class="btn wide" href="${url(`/checkout`)}">${L.placeOrder}</a><button class="btn ghost wide" data-close>${L.keepShopping}</button></div>`
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
      ? found.slice(0, 6).map(p => `<a href="${url(`/p/${p.id}`)}">${pic(p)}<span>${esc(p.name)}<small>${esc(cat.get(p.cat)?.name || '')}</small></span>${p.price ? `<b>${money(p.price)}</b>` : ''}</a>`).join('') + (found.length > 6 ? `<a class="all" href="${url(`/search?q=${encodeURIComponent(v)}`)}" style="display:block">${L.showAll(goods(found.length))}</a>` : '')
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
    if (pick) pick.click(); else if (v) go(`/search?q=${encodeURIComponent(v)}`);
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
    ab.href = url(u ? '/account' : '/login'); ab.setAttribute('aria-label', u ? AT.account : AT.login); ab.title = u ? (u.name || u.email) : AT.login;
    ab.classList.toggle('is-in', !!u);
    $$('[data-fav]').forEach(b => b.setAttribute('aria-pressed', ACC.isFav(+b.dataset.fav)));
    $$('[data-cmp]').forEach(b => b.setAttribute('aria-pressed', ACC.inCmp(+b.dataset.cmp)));
  }
  if (ACC) {
    for (const [id, t] of [['#cmpBtn', AT.cmpH], ['#favBtn', AT.favH]]) { $(id).setAttribute('aria-label', t); $(id).title = t; }
    $$('#drawer .plain').at(-1)?.insertAdjacentHTML('afterbegin', `<a href="${url(`/account`)}">${esc(AT.account)}</a><a href="${url(`/favorites`)}">${esc(AT.favH)}</a><a href="${url(`/compare`)}">${esc(AT.cmpH)}</a>`);
    ACC.subscribe(paintAcc);
    paintAcc();
  }

  addEventListener('scroll', () => $('#top').classList.toggle('is-stuck', scrollY > 8), { passive: true });
  // Для tools/build_site.mjs: малює маршрут і віддає розмітку та дані для пошуковиків.
  window.ACC_BUILD = { C, cat, prod, inCat, roots, path, title: () => document.title, L, lang,
    render: r => { history.replaceState({}, '', url(r)); route(); return r === '/' ? lastHTML : view.innerHTML; } };   // головну беремо до того, як її оживить home.js
  function topH() { document.documentElement.style.setProperty('--top-h', `${$('#top').offsetHeight}px`); }
  topH(); addEventListener('resize', topH);
  paintCart(); window.SITE.start(route);
})();
