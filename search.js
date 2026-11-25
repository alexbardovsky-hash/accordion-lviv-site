/* Пошук: спершу точні збіги, потім основа слова, потім одна-дві помилки. Чиста функція без сторінки (tests/search.test.js). */
(() => {
  const norm = s => String(s).toLowerCase().replace(/[іїиы]/g, 'и').replace(/[єэё]/g, 'е').replace(/ґ/g, 'г').replace(/['ʼ’`]/g, '').replace(/ь/g, '');
  const LOOK = { а: 'a', в: 'b', е: 'e', к: 'k', м: 'm', н: 'h', о: 'o', р: 'p', с: 'c', т: 't', х: 'x' };
  // У моделях (є цифра) кирилична «В» і латинська «B» — одне й те саме.
  const token = t => { t = t.replace(/([a-zа-я])\1/g, '$1'); return /\d/.test(t) && /[а-я]/.test(t) && t.length < 8 ? t.replace(/[авекмнорстх]/g, c => LOOK[c]) : t; };
  const tokens = s => norm(s).split(/[^0-9a-zа-я]+/).filter(Boolean).map(token);
  // «B-61» шукають і як «b61»: склеєні пари «літери + цифри» теж ідуть в індекс.
  const glued = s => [...norm(s).matchAll(/([a-zа-я]{1,3})[-\s.]?(\d{1,4})(?!\d)/g)].map(m => token(m[1] + m[2]));
  const key = w => tokens(w)[0] || '';
  // Як люди пишуть → як у каталозі. Ключі й значення проходять через ту саму нормалізацію.
  const ALIAS = new Map(Object.entries({
    'піджіні пиджини пігіні піґіні піджини пиджіні': 'pigini', 'скандалі скандалли скандали': 'scandalli', 'бугарі бугари': 'bugari', 'фізіталія фиситалия фізиталія': 'fisitalia', 'хонер хоннер гонер хохнер': 'hohner', 'менгасціні менгаскіні': 'mengascini',
    'ремень ремни ремінь': 'ремін', 'ремні ремені': 'ремен', 'чехол чехлы сумка сумки рюкзак': 'чохол', 'кейс': 'футляр', 'мех меха меху': 'міх', 'воск': 'віск', 'кнопка кнопки пуговица пуговицы пуговки': 'ґудзик', 'гармонь гармошка гармоніка аккордеон': 'акордеон', 'баян bayan bajan': 'баян',
    'ноти ноты збірник': 'антологія', 'планки планка': 'план', 'уголок уголки куточок': 'кутник', 'ножка ножки': 'ніжка', 'винт': 'гвинт', 'наклейка': 'напис', 'накладки': 'накладка', 'sheet notes': 'anthology', 'bag': 'case', 'belt belts': 'strap',
  }).flatMap(([a, b]) => a.split(' ').map(x => [key(x), key(b)])));
  const KIND = new Set(['баян', 'баяни', 'акордеон', 'акордеони', 'accordion', 'accordions', 'bayan', 'bajan', 'гармонь', 'гармошка'].map(key));
  const dist = (a, b, max) => {   // відстань Дамерау—Левенштейна, зупиняється за межею max
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let p2 = [], p = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const c = [i]; let low = i;
      for (let j = 1; j <= b.length; j++) {
        let v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        c[j] = v; if (v < low) low = v;
      }
      if (low > max) return max + 1;
      p2 = p; p = c;
    }
    return p[b.length];
  };
  const make = rows => {
    const idx = rows.map(r => {
      const name = tokens(r.name), more = tokens(`${r.more}${r.bayan ? ' баян' : ''}`), g = glued(`${r.name} ${r.more}`);
      return { r, name, first: name[0] || '', more: [...new Set([...more, ...g])], cats: tokens(r.cats), glue: new Set(g) };
    });
    const vocab = [...new Set(idx.flatMap(x => [...x.name, ...x.more]))].filter(t => /^[a-zа-я]{4,}$/.test(t));
    const hit = (x, w) => {   // наскільки добре слово w є в товарі
      const num = /^\d+$/.test(w);
      if (x.name.includes(w)) return x.first === w ? 12 : 10;
      if (!num && x.first.startsWith(w)) return 9;
      if (!num && x.name.some(t => t.startsWith(w))) return 7;
      if (x.glue.has(w)) return 7;
      if (x.more.includes(w)) return 5;
      if (w.length > 2 && x.name.some(t => t.includes(w))) return 4;
      if (w.length > 2 && x.cats.some(t => t.startsWith(w))) return 3;
      if (w.length > 2 && x.more.some(t => t.startsWith(w))) return 2;
      if (w.length > 3 && x.more.some(t => t.includes(w))) return 1;
      return 0;
    };
    const pass = groups => {   // groups: для кожного слова запиту — варіанти написання
      const kind = groups.some(g => g.some(v => KIND.has(v.w))), out = [];
      for (const x of idx) {
        let s = 0, all = true;
        for (const g of groups) {
          let best = 0;
          for (const v of g) { const h = hit(x, v.w); if (h) best = Math.max(best, h - v.cost); }
          if (best <= 0) { all = false; break; }
          s += best + (g.some(v => v.w.length > 2 && x.cats.some(t => t.startsWith(v.w))) ? 2 : 0);
        }
        if (all) out.push({ p: x.r.p, s: s + (kind && x.r.instrument ? 40 : 0) });
      }
      return out.sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name)).map(o => o.p);
    };
    const exact = w => [{ w, cost: 0 }, ...(ALIAS.has(w) ? [{ w: ALIAS.get(w), cost: 0 }] : [])];
    const stem = w => w.length > 4 && /^[a-zа-я]+$/.test(w) ? [{ w: w.slice(0, Math.max(4, w.length - 2)), cost: .5 }] : [];
    const near = w => {
      if (!/^[a-zа-я]{4,24}$/.test(w)) return [];
      const max = w.length > 7 ? 2 : 1, o = [];
      for (const t of vocab) { const d = dist(w, t, max); if (d <= max) o.push({ w: t, cost: d * .5 }); }
      return o.sort((a, b) => a.cost - b.cost).slice(0, 12);
    };
    return q => {
      const words = tokens(String(q).slice(0, 80)).slice(0, 8);
      if (!words.length) return { items: [], fuzzy: false };
      const joined = tokens(norm(String(q).slice(0, 80)).replace(/(^|[^a-zа-я])([a-zа-я]{1,3})[-\s.]+(\d{1,4})(?!\d)/g, '$1$2$3'));   // «b-61», «b 61» → «b61»
      let items = joined.length < words.length ? pass(joined.map(exact)) : []; if (items.length) return { items, fuzzy: false };
      items = pass(words.map(exact)); if (items.length) return { items, fuzzy: false };
      items = pass(words.map(w => [...exact(w), ...stem(w)])); if (items.length) return { items, fuzzy: false };
      items = pass(words.map(w => [...exact(w), ...stem(w), ...near(w)]));
      return { items, fuzzy: items.length > 0 };
    };
  };
  window.ACC_SEARCH = { make };
})();
