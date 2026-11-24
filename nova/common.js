/* Спільне для макетів головної (proto/m*.html): дані каталогу, шапка, низ. Лише для тестової копії. */
window.PROTO = (() => {
  const { url } = window.SITE, C = window.CATALOG, TR = window.CATALOG_I18N.uk, L = window.I18N.L;
  const P = new Map(C.products.map(p => [p.id, p])), $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const kids = id => [id, ...C.cats.filter(c => c.parent === id).flatMap(c => kids(c.id))];
  const inCat = id => { const k = new Set(kids(id)); return C.products.filter(p => p.cats.some(c => k.has(c))); };
  const el = (tag, props = {}, ...ch) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(props)) if (k in e && k !== 'list') e[k] = v; else e.setAttribute(k, v); e.append(...ch.filter(x => x != null)); return e; };
  const spec = id => { const f = window.SPECS?.[id]?.uk || TR.products[id]?.features || [], g = k => f.find(x => x[0] === k)?.[1] || ''; return { right: g('Права рука').match(/^\d+ [а-яіїєґ]+/i)?.[0], bass: g('Ліва рука').match(/\d+/)?.[0], kg: g('Вага').match(/^[\d,]+ ?кг/)?.[0], voices: g('Права рука').match(/\d голос[а-яів]*/)?.[0] }; };
  const I = [
    { id: 301, b: 'Pigini', n: 'Nova', src: 'img/flag/301.webp', tone: '#7d1528' }, { id: 554, b: 'Bugari', n: '2 RC Cassotto', src: 'img/flag/554.webp', tone: '#8b4a1f' },
    { id: 377, b: 'Scandalli', n: 'BJP-442 ST', src: 'img/stage2/377.webp', tone: '#3d4650' }, { id: 387, b: 'Fisitalia', n: 'B-61', src: 'img/flag/387.webp', tone: '#0e5a52' },
    { id: 485, b: 'Scandalli', n: 'Bloom', src: 'img/stage2/485.webp', tone: '#5d2a78' }, { id: 509, b: 'Mengascini', n: 'F-6 Jazz', src: 'img/stage2/509.webp', tone: '#8a6a2a' },
    { id: 494, b: 'Fisitalia', n: 'Littlestar', src: 'img/stage2/494.webp', tone: '#2a4f9a' }, { id: 568, b: 'Hohner', n: 'Bravo III 120', src: 'img/stage2/568.webp', tone: '#1f3f8f' },
  ].filter(x => P.get(x.id)).map(x => ({ ...x, price: L.money(P.get(x.id).price), url: url(`/p/${x.id}`), spec: spec(x.id) }));
  const catId = re => C.cats.find(c => re.test(TR.cats[c.id] || c.name))?.id;
  const cat = id => ({ id, name: TR.cats[id] || C.cats.find(c => c.id === id)?.name, n: inCat(id).length, goods: L.goods(inCat(id).length), url: url(`/c/${id}`), items: inCat(id).filter(p => p.price).slice(0, 4).map(p => ({ img: `photos/web5/${p.id}-m.webp`, name: TR.products[p.id]?.name || p.name, price: L.money(p.price), url: url(`/p/${p.id}`) })) });
  const NAV = [['Інструменти', '/c/43'], ['Запчастини', '/c/3'], ['Ремонт', '/service'], ['Контакти', '/contacts']];
  const links = () => NAV.map(([t, u]) => el('a', { href: url(u) }, t));
  document.body.prepend(el('header', { className: 'bar' }, el('a', { href: url('/') }, el('img', { src: 'img/logo-light.png', alt: 'Акордеон Центр' })), el('nav', {}, ...links()), el('a', { className: 'tel', href: 'tel:+380993339890' }, '099 333 98 90'), (() => { const d = el('details', { className: 'mn' }, el('summary', { ariaLabel: 'Меню' }, '☰'), el('div', {}, ...links())); return d; })()));
  document.body.append(el('footer', { className: 'ft' }, el('a', { className: 'big', href: 'tel:+380993339890' }, '099 333 98 90'), el('div', {}, el('a', { href: 'mailto:bajan@accordion.lviv.ua' }, 'bajan@accordion.lviv.ua'), el('a', { href: url('/delivery') }, 'Доставка й оплата'), ...links())));
  $$('[data-u]').forEach(a => { a.href = url(a.dataset.u); });
  addEventListener('scroll', () => $('.bar').classList.toggle('on', scrollY > 30), { passive: true });
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !calm) e.target.play().catch(() => {}); else e.target.pause(); }), { rootMargin: '150px' });
  const vids = () => $$('video').forEach(v => vo.observe(v)); vids();
  return { $, $$, el, url, I, cat, catId, inCat, L, calm, vids };
})();
