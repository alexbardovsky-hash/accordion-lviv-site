/* Живий чат з магазином, форма листа й відправка замовлень у CRM (server/). Без window.ACC_API нічого не показує. */
(() => {
  const API = window.ACC_API || '';
  const lang = window.I18N?.lang === 'en' ? 'en' : 'uk';
  const T = {
    uk: {
      fab: 'Запитати', title: 'Питання до магазину', close: 'Закрити', newQ: 'Нове питання', myQ: 'Мої питання', back: '← Мої питання',
      intro: 'Напишіть, що шукаєте або що сталося з інструментом. Відповімо тут, у цьому вікні, і за потреби подзвонимо.',
      topic: 'Про що питання', topicPh: 'Напр., ґудзики для Weltmeister', name: 'Імʼя', contact: 'Телефон або пошта', message: 'Питання',
      send: 'Надіслати', sending: 'Надсилаємо…', write: 'Повідомлення…', reply: 'Надіслати',
      waiting: 'Питання отримали. Відповідь зʼявиться тут, вікно можна закрити: ми покажемо значок на кнопці «Запитати».',
      closed: 'Чат закрито. Якщо напишете ще, він відкриється знову.', you: 'Ви', shop: 'Акордеон Центр', left: n => `лишилось ${n}`,
      askProduct: 'Запитати про товар', productTopic: n => `Питання про товар: ${n}`,
      err: {
        too_long: m => `Задовгий текст: не більше ${m} символів.`, required: 'Заповніть усі поля.', contact: 'Вкажіть телефон (від 9 цифр) або пошту.',
        rate: s => `Забагато повідомлень. Спробуйте за ${Math.max(1, Math.ceil(s / 60))} хв.`, links: 'Забагато посилань у повідомленні.',
        duplicate: 'Це повідомлення вже надіслано.', wait_reply: 'Зачекайте на відповідь, будь ласка.', too_fast: 'Секунду, перевіряємо, що ви не робот. Натисніть ще раз.',
        pow: 'Перевірка не вдалась. Натисніть ще раз.', not_found: 'Цей чат не знайдено.', net: 'Немає звʼязку з сервером. Спробуйте пізніше або зателефонуйте.', other: 'Щось пішло не так. Спробуйте ще.',
      },
      letterH: 'Написати нам', subject: 'Тема', letter: 'Лист', letterSend: 'Надіслати лист', letterOk: n => `Лист №${n} отримали. Відповімо на вказаний контакт.`,
      orderOk: n => `Замовлення №${n} прийнято`, orderOkP: ph => `Ми звʼяжемося з вами, щоб підтвердити наявність, доставку й оплату. Якщо терміново, телефонуйте ${ph}.`,
    },
    en: {
      fab: 'Ask us', title: 'Ask the shop', close: 'Close', newQ: 'New question', myQ: 'My questions', back: '← My questions',
      intro: 'Tell us what you are looking for or what is wrong with the instrument. We reply right here and call if needed.',
      topic: 'Subject', topicPh: 'E.g. buttons for a Weltmeister', name: 'Name', contact: 'Phone or email', message: 'Question',
      send: 'Send', sending: 'Sending…', write: 'Message…', reply: 'Send',
      waiting: 'We have your question. The reply will appear here; you can close this window, the “Ask us” button will show a badge.',
      closed: 'This chat is closed. Writing again reopens it.', you: 'You', shop: 'Accordion Centre', left: n => `${n} left`,
      askProduct: 'Ask about this item', productTopic: n => `Question about: ${n}`,
      err: {
        too_long: m => `Too long: ${m} characters at most.`, required: 'Please fill in every field.', contact: 'Enter a phone number (9+ digits) or an email.',
        rate: s => `Too many messages. Try again in ${Math.max(1, Math.ceil(s / 60))} min.`, links: 'Too many links in the message.',
        duplicate: 'This message was already sent.', wait_reply: 'Please wait for our reply.', too_fast: 'One second, checking you are not a robot. Press again.',
        pow: 'The check failed. Press again.', not_found: 'This chat was not found.', net: 'Cannot reach the server. Try later or call us.', other: 'Something went wrong. Try again.',
      },
      letterH: 'Write to us', subject: 'Subject', letter: 'Message', letterSend: 'Send message', letterOk: n => `Message #${n} received. We will reply to the contact you gave.`,
      orderOk: n => `Order #${n} received`, orderOkP: ph => `We will contact you to confirm stock, delivery and payment. If it is urgent, call ${ph}.`,
    },
  }[lang];
  const LIM = { name: 80, contact: 120, topic: 120, message: 2000, subject: 160, letter: 4000 };

  /* ── Спільне ── */
  async function call(path, body) {
    let r;
    // Увійшов у кабінет (account.js) — сервер упізнає за токеном: чати видно з будь-якого пристрою.
    const tok = window.ACC_ACCOUNT?.token, auth = tok ? { Authorization: `Bearer ${tok}` } : {};
    try { r = await fetch(API + path, body === undefined ? { headers: auth } : { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(body) }); }
    catch { throw Object.assign(new Error('net'), { net: true }); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.error || 'other'), { data: d });
    return d;
  }
  function errText(e) {
    const f = T.err[e.message] || T.err.other;
    return typeof f === 'function' ? f(e.message === 'rate' ? e.data?.retry || 60 : e.data?.max || 2000) : f;
  }
  /* Proof-of-work: шукаємо nonce, щоб sha256(challenge+nonce) починався з bits нульових бітів. Рахуємо заздалегідь. */
  const enc = new TextEncoder();
  async function solve() {
    const { challenge, bits } = await call('/api/pow');
    const full = bits >> 3, rest = bits & 7;
    for (let n = 0; ; n += 256) {
      const batch = await Promise.all(Array.from({ length: 256 }, (_, i) => crypto.subtle.digest('SHA-256', enc.encode(challenge + (n + i).toString(36)))));
      for (let i = 0; i < batch.length; i++) {
        const b = new Uint8Array(batch[i]); let ok = true;
        for (let k = 0; k < full; k++) if (b[k]) { ok = false; break; }
        if (ok && rest && b[full] >> (8 - rest)) ok = false;
        if (ok) return { challenge, nonce: (n + i).toString(36) };
      }
    }
  }
  let powP = null;
  const pow = () => { const p = powP || solve(); powP = null; return p; };
  const warm = () => { if (!powP && API) { powP = solve(); powP.catch(() => { powP = null; }); } };

  const store = {
    get chats() { try { return JSON.parse(localStorage.getItem('bac-chats') || '[]'); } catch { return []; } },
    set chats(v) { try { localStorage.setItem('bac-chats', JSON.stringify(v.slice(0, 20))); } catch { /* приватний режим */ } },
    get me() { try { return JSON.parse(localStorage.getItem('bac-me') || '{}'); } catch { return {}; } },
    set me(v) { try { localStorage.setItem('bac-me', JSON.stringify(v)); } catch { /* */ } },
  };

  function h(tag, attrs, ...kids) {
    const [name, ...cls] = tag.split('.');
    const el = document.createElement(name);
    if (cls.length) el.className = cls.join(' ');
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (k === 'value') el.value = v; else el.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k instanceof Node ? k : String(k));
    return el;
  }
  const time = t => new Date(t).toLocaleString(lang === 'en' ? 'en-GB' : 'uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  let opened = 0;
  const mark = () => { opened = Date.now(); warm(); };
  /* Поле з лічильником символів: попереджаємо до сервера, а не після. */
  function field(label, input, max) {
    const id = `ask-${Math.random().toString(36).slice(2, 8)}`;
    input.id = id; if (max) input.maxLength = max;
    const left = max && max >= 500 ? h('small.ask-left', { 'aria-live': 'polite' }) : null;
    if (left) input.addEventListener('input', () => { const n = max - input.value.length; left.textContent = n < 200 ? T.left(n) : ''; });
    return h('div.ask-field', h('label', { for: id }, label), input, left);
  }
  const honeypot = () => h('div.ask-hp', { 'aria-hidden': 'true' }, h('label', 'Website', h('input', { name: 'website', tabindex: '-1', autocomplete: 'off' })));

  /* ── Віджет ── */
  if (!API) { window.ACC_CHAT = { enabled: false, open() {}, pow, mountLetter() {}, t: T }; return; }
  const fab = h('button.ask-fab', { type: 'button', 'aria-controls': 'ask', 'aria-expanded': 'false' });
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>';
  fab.append(h('span', T.fab), h('b.ask-badge', { hidden: true }));
  const body = h('div.ask-body');
  const panel = h('section.ask', { id: 'ask', role: 'dialog', 'aria-label': T.title, hidden: true },
    h('header.ask-head', h('h2', T.title), h('button.ask-x', { type: 'button', 'aria-label': T.close, onclick: () => toggle(false) }, '×')), body);
  document.body.append(fab, panel);
  fab.addEventListener('click', () => toggle(panel.hidden));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) toggle(false); });

  let es = null, current = null;
  function toggle(on, opts) {
    panel.hidden = !on; fab.setAttribute('aria-expanded', String(on));
    if (!on) { es?.close(); es = null; current = null; fab.focus(); return; }
    if (opts?.chat) thread(opts.chat); else if (opts?.topic) newForm(opts); else if (logged() || store.chats.length) list(); else newForm();
  }

  const logged = () => !!window.ACC_ACCOUNT?.token;
  /* Увійшов — список з сервера (історія з усіх пристроїв), інакше — чати, збережені в цьому браузері. */
  async function chatList() {
    if (!logged()) return store.chats;
    try { const l = await call('/api/me/chats'); l.forEach(c => { unread[c.id] = c.id === current ? 0 : c.unread || 0; }); paintBadge(); return l; } catch { return store.chats; }
  }
  async function list() {
    es?.close(); es = null; current = null;
    const chats = await chatList();
    if (!chats.length) return newForm();
    body.replaceChildren(
      h('ul.ask-list', chats.map(c => h('li', h('button', { type: 'button', onclick: () => thread(c) }, h('span', c.topic), unread[c.id] ? h('b.ask-badge', unread[c.id]) : null)))),
      h('button.btn.wide', { type: 'button', onclick: () => newForm() }, T.newQ));
  }

  function newForm(opts = {}) {
    es?.close(); es = null; current = null; mark();
    const me = store.me;
    const topic = h('input', { name: 'topic', required: true, placeholder: T.topicPh, value: opts.topic || '' });
    const name = h('input', { name: 'name', required: true, autocomplete: 'name', value: me.name || '' });
    const contact = h('input', { name: 'contact', required: true, autocomplete: 'tel', value: me.contact || '' });
    const message = h('textarea', { name: 'message', required: true, rows: 4 });
    const err = h('p.ask-err', { role: 'alert', hidden: true });
    const btn = h('button.btn.wide', { type: 'submit' }, T.send);
    const form = h('form.ask-form', { novalidate: true },
      logged() || store.chats.length ? h('button.ask-link', { type: 'button', onclick: list }, T.back) : null,
      h('p.ask-note', T.intro), field(T.topic, topic, LIM.topic), logged() ? null : [field(T.name, name, LIM.name), field(T.contact, contact, LIM.contact)], field(T.message, message, LIM.message), honeypot(), err, btn);
    form.addEventListener('submit', async e => {
      e.preventDefault(); err.hidden = true;
      const v = { topic: topic.value.trim(), name: name.value.trim(), contact: contact.value.trim(), message: message.value.trim() };
      if (!v.topic || (!logged() && v.name.length < 2) || !v.message) return show(err, T.err.required);
      if (!logged() && !/\S+@\S+\.\S+/.test(v.contact) && v.contact.replace(/\D/g, '').length < 9) return show(err, T.err.contact);
      btn.disabled = true; btn.textContent = T.sending;
      try {
        const r = await call('/api/chats', { ...v, productId: opts.productId, lang, website: form.website.value, elapsed: Date.now() - opened, pow: await pow() });
        const c = { id: r.id, token: r.token, topic: v.topic };
        if (!logged()) { store.me = { name: v.name, contact: v.contact }; store.chats = [c, ...store.chats]; }
        thread(c, true);
      } catch (x) { show(err, errText(x)); warm(); btn.disabled = false; btn.textContent = T.send; }
    });
    body.replaceChildren(form);
    (opts.topic ? (name.value ? message : name) : topic).focus();
  }
  const show = (el, t) => { el.textContent = t; el.hidden = false; };

  async function thread(c, fresh) {
    es?.close(); current = c.id; unread[c.id] = 0; paintBadge();
    const box = h('div.ask-msgs', { 'aria-live': 'polite' });
    const note = h('p.ask-note', { hidden: true });
    const ta = h('textarea', { rows: 2, maxlength: LIM.message, placeholder: T.write, 'aria-label': T.write });
    const err = h('p.ask-err', { role: 'alert', hidden: true });
    const btn = h('button.btn', { type: 'submit' }, T.reply);
    const form = h('form.ask-reply', ta, btn);
    const add = m => {
      if (box.querySelector(`[data-id="${m.id}"]`)) return;
      box.append(h(`div.ask-msg.${m.sender}`, { 'data-id': m.id }, h('span.ask-who', m.sender === 'admin' ? T.shop : T.you), m.body, h('time', time(m.created_at))));
      box.scrollTop = box.scrollHeight;
      note.hidden = !(m.sender === 'client' && box.querySelectorAll('.ask-msg.admin').length === 0);
      if (!note.hidden) note.textContent = T.waiting;
    };
    form.addEventListener('submit', async e => {
      e.preventDefault(); err.hidden = true; const v = ta.value.trim(); if (!v) return;
      btn.disabled = true;
      try { add(await call(`/api/chats/${c.id}/messages`, { token: c.token || '', body: v })); ta.value = ''; }
      catch (x) { show(err, errText(x)); }
      btn.disabled = false; ta.focus();
    });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); form.requestSubmit(); } });
    body.replaceChildren(h('button.ask-link', { type: 'button', onclick: list }, T.back), h('h3.ask-topic', c.topic), box, note, err, form);
    try {
      const d = await call(`/api/chats/${c.id}?token=${encodeURIComponent(c.token || '')}`);
      if (current !== c.id) return;
      d.messages.forEach(add);
      if (d.status === 'closed') { note.hidden = false; note.textContent = T.closed; }
      // EventSource не шле заголовків: для акаунта токен входу йде параметром.
      const tok = window.ACC_ACCOUNT?.token;
      es = new EventSource(`${API}/api/chats/${c.id}/stream?token=${encodeURIComponent(c.token || '')}${tok ? `&auth=${encodeURIComponent(tok)}` : ''}`);
      es.addEventListener('message', e => add(JSON.parse(e.data)));
      es.addEventListener('status', e => { if (JSON.parse(e.data).status === 'closed') { note.hidden = false; note.textContent = T.closed; } });
    } catch (x) {
      show(err, errText(x));
      if (x.message === 'not_found') store.chats = store.chats.filter(s => s.id !== c.id);
    }
    ta.focus();
  }

  /* Значок на кнопці: нові відповіді, поки вікно закрите. */
  const unread = {};
  function paintBadge() {
    const n = Object.values(unread).reduce((s, x) => s + x, 0);
    const b = fab.querySelector('.ask-badge'); b.hidden = !n; b.textContent = n;
  }
  async function poll() {
    if (document.hidden) return;
    if (logged()) return void chatList();
    const chats = store.chats; if (!chats.length) return;
    try {
      const r = await call('/api/chats/unread', { chats: chats.map(c => ({ id: c.id, token: c.token })) });
      for (const c of chats) unread[c.id] = c.id === current ? 0 : r[c.id]?.unread || 0;
      paintBadge();
    } catch { /* сервер недоступний */ }
  }
  poll(); setInterval(poll, 45000); document.addEventListener('visibilitychange', poll);

  /* Форма листа на сторінці контактів. */
  function mountLetter(el) {
    if (!el) return; mark();
    const me = store.me;
    const name = h('input', { name: 'name', required: true, autocomplete: 'name', value: me.name || '' });
    const contact = h('input', { name: 'contact', required: true, value: me.contact || '' });
    const subject = h('input', { name: 'subject' });
    const text = h('textarea', { name: 'body', rows: 6, required: true });
    const err = h('p.ask-err', { role: 'alert', hidden: true });
    const btn = h('button.btn', { type: 'submit' }, T.letterSend);
    const form = h('form.ask-form.letter-form', { novalidate: true }, h('h2', T.letterH),
      field(T.name, name, LIM.name), field(T.contact, contact, LIM.contact), field(T.subject, subject, LIM.subject), field(T.letter, text, LIM.letter), honeypot(), err, btn);
    form.addEventListener('submit', async e => {
      e.preventDefault(); err.hidden = true;
      const v = { name: name.value.trim(), contact: contact.value.trim(), subject: subject.value.trim(), body: text.value.trim() };
      if (v.name.length < 2 || v.body.length < 5) return show(err, T.err.required);
      if (!/\S+@\S+\.\S+/.test(v.contact) && v.contact.replace(/\D/g, '').length < 9) return show(err, T.err.contact);
      btn.disabled = true;
      try {
        const r = await call('/api/letters', { ...v, lang, website: form.website.value, elapsed: Date.now() - opened, pow: await pow() });
        store.me = { name: v.name, contact: v.contact };
        form.replaceChildren(h('h2', T.letterH), h('p.ask-ok', T.letterOk(r.id)));
      } catch (x) { show(err, errText(x)); warm(); btn.disabled = false; }
    });
    el.replaceChildren(form);
  }

  window.ACC_CHAT = {
    enabled: true, t: T, pow, warm, mark, mountLetter, errText,
    open: opts => toggle(true, opts),
    sendOrder: async d => call('/api/orders', { ...d, lang, elapsed: Date.now() - opened, pow: await pow() }),
  };
})();
