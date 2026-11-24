/* Адреси сайту: справжні шляхи замість #. Основа береться з <base href>, мова — з першого шматка шляху (/en/…).
   url('/p/301') → /p/301-pigini-nova/ ; назви в адресах зафіксовані в data/slugs.js (tools/build_site.mjs), щоб адреса не мінялась разом із назвою. */
(() => {
  const BASE = new URL(document.baseURI).pathname.replace(/[^/]*$/, '');
  const inBase = p => p.startsWith(BASE) ? p.slice(BASE.length) : p.replace(/^\//, '');
  const lang = /^en(\/|$)/.test(inBase(location.pathname)) ? 'en' : 'uk';
  const HASHED = new Set(['pay', 'paid']);              // одноразові адреси з кодом: окремих сторінок для них немає
  const SLUGS = () => window.SLUGS || { p: {}, c: {} };
  function url(r, l = lang) {
    const [p, qs] = String(r).split('?');
    const seg = p.split('/').filter(Boolean), pre = BASE + (l === 'en' ? 'en/' : '');
    if (HASHED.has(seg[0])) return `${pre}#/${seg.join('/')}`;
    if (seg[0] === 'p' || seg[0] === 'c') { const s = SLUGS()[seg[0]][seg[1]]?.[l === 'en' ? 1 : 0]; if (s) seg[1] = `${seg[1]}-${s}`; }
    return pre + seg.map(x => `${x}/`).join('') + (qs ? `?${qs}` : '');
  }
  // Поточний маршрут у внутрішньому вигляді: /p/301, /search?q=…
  function here() {
    if (location.hash.startsWith('#/')) return location.hash.slice(1);
    const p = inBase(location.pathname).replace(/^en(\/|$)/, '').replace(/index\.html$/, '');
    const seg = p.split('/').filter(Boolean);
    if ((seg[0] === 'p' || seg[0] === 'c') && seg[1]) seg[1] = String(parseInt(seg[1], 10));
    return `/${seg.join('/')}${location.search}`;
  }
  let onRoute = () => {};
  const nav = y => { dispatchEvent(new Event('sitenav')); onRoute(y); };
  const saveY = () => { try { history.replaceState({ ...history.state, y: scrollY }, ''); } catch { /* */ } };
  function go(r) { saveY(); history.pushState({}, '', url(r)); nav(0); }
  // Старі посилання з # відкривають нову адресу без перезавантаження.
  function upgrade() {
    const r = location.hash.slice(1);
    if (r.startsWith('/') && !HASHED.has(r.split('/')[1])) history.replaceState({}, '', url(r));
  }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.('a[href]');
    if (!a || a.target || a.hasAttribute('download') || a.origin !== location.origin || !a.pathname.startsWith(BASE)) return;
    const raw = a.getAttribute('href');
    if (raw.startsWith('#') && !raw.startsWith('#/')) {   // якір на цій самій сторінці: через <base> він інакше повів би на головну
      e.preventDefault(); const t = document.getElementById(raw.slice(1)); t?.focus(); t?.scrollIntoView(); return;
    }
    const rest = inBase(a.pathname);
    if (/\.[a-z0-9]{2,5}$/i.test(rest) || /^en(\/|$)/.test(rest) !== (lang === 'en')) return;
    e.preventDefault();
    if (a.href === location.href) { scrollTo(0, 0); return; }
    saveY(); history.pushState({}, '', a.href); nav(0);
  });
  addEventListener('popstate', e => { upgrade(); nav(e.state?.y || 0); });
  addEventListener('beforeunload', saveY);
  window.SITE = {
    BASE, lang, url, here, go,
    start: f => { onRoute = f; upgrade(); f(history.state?.y || 0); },
    links: s => s.replace(/href="#(\/[^"]*)"/g, (_, r) => `href="${url(r)}"`),
  };
})();
