/* Кабінет покупця (Алекс 23.11): вхід і реєстрація, замовлення, питання (чати), профіль; обране й порівняння.
   Обране й порівняння живуть у браузері й без входу; після входу зливаються з кабінетом і видні з будь-якого пристрою.
   Сторінки #/login і #/account малює цей файл, #/favorites і #/compare — app.js (там картки товарів). */
(() => {
  const API = window.ACC_API || '';
  const { url, go } = window.SITE;
  const lang = window.I18N?.lang === 'en' ? 'en' : 'uk';
  const T = {
    uk: {
      account: 'Кабінет', login: 'Вхід', register: 'Реєстрація', loginH: 'Вхід у кабінет', registerH: 'Новий кабінет',
      loginLead: 'У кабінеті видно ваші замовлення й усі розмови з магазином, а обране й порівняння не губляться між телефоном і компʼютером.',
      email: 'Пошта', password: 'Пароль', passwordNew: 'Новий пароль', passwordOld: 'Поточний пароль', name: 'Імʼя', phone: 'Телефон', phoneOpt: 'Телефон (необовʼязково)',
      pwHint: n => `Щонайменше ${n} символів.`, doLogin: 'Увійти', doRegister: 'Створити кабінет', google: 'Увійти через Google', or: 'або',
      forgot: 'Забули пароль?', forgotNoMail: 'Напишіть нам у чат «Запитати» або зателефонуйте: дамо тимчасовий пароль, а ви змініть його в кабінеті.',
      sendCode: 'Надіслати код', codeSent: e => `Якщо кабінет з поштою ${e} існує, код уже в листі. Він діє 15 хвилин.`, code: 'Код з листа', setPw: 'Зберегти пароль і увійти',
      noAccount: 'Ще немає кабінету?', haveAccount: 'Вже є кабінет?', toRegister: 'Зареєструватись', toLogin: 'Увійти',
      orders: 'Замовлення', chats: 'Питання', favorites: 'Обране', compare: 'Порівняння', profile: 'Профіль', logout: 'Вийти',
      hello: n => `Вітаємо, ${n}`, noOrders: 'Замовлень ще немає.', noChats: 'Питань ще не було.', toCatalog: 'До каталогу', ask: 'Поставити питання',
      order: (n, d) => `Замовлення №${n} від ${d}`, total: 'Разом', np: 'Нова Пошта', pickup: 'Самовивіз у Львові', abroad: 'За кордон, особиста передача',
      payNow: 'Оплатити онлайн', payNote: 'Карткою, Apple Pay чи Google Pay на захищеній сторінці LiqPay від ПриватБанку.', payTest: 'Тестовий режим: гроші не списуються.',
      payH: n => `Оплата замовлення №${n}`, paidH: 'Дякуємо, оплату отримано', paidP: n => `Замовлення №${n} оплачено. Ми звʼяжемося з вами щодо доставки.`,
      payWait: 'Перевіряємо оплату…', payWaitP: 'Підтвердження від банку зазвичай приходить за кілька секунд. Якщо ви не оплатили, можна повернутись і спробувати ще раз.',
      payFail: 'Оплата не пройшла. Гроші не списано. Спробуйте ще раз або зателефонуйте нам.', payPaid: 'Оплачено онлайн', payRetry: 'Спробувати ще раз',
      payClosed: 'Онлайн-оплата для цього замовлення зараз недоступна. Ми звʼяжемося з вами щодо оплати.', payToAcc: 'Мої замовлення', payToShop: 'До каталогу',
      status: { new: 'Прийнято', processing: 'Обробляємо', paid: 'Оплачено', sent: 'Відправлено', done: 'Виконано', cancelled: 'Скасовано' },
      chatOpen: 'Відкрите', chatClosed: 'Закрите', you: 'Ви: ', shop: 'Магазин: ', newAnswer: 'нова відповідь',
      save: 'Зберегти', saved: 'Збережено', pwChanged: 'Пароль змінено. На інших пристроях треба увійти знову.', changePw: 'Змінити пароль', setPwH: 'Пароль для входу поштою',
      googleLinked: 'Вхід через Google підключено.', emailFixed: 'Пошту змінити не можна: це ваш логін.',
      offline: 'Кабінет запрацює, щойно сайт підключиться до сервера магазину. Обране й порівняння вже працюють і зберігаються в цьому браузері.',
      favCount: n => `${n} у обраному`, cmpCount: n => `${n} у порівнянні`,
      favAdd: 'Додати в обране', favDel: 'Прибрати з обраного', favAdded: 'Додано в обране', favH: 'Обране',
      favEmpty: 'Тут зʼявляться товари, які ви позначите сердечком. Без входу вони зберігаються в цьому браузері, а в кабінеті — на всіх пристроях.',
      cmpAdd: 'Порівняти', cmpDel: 'Прибрати з порівняння', cmpAdded: 'Додано до порівняння', cmpOpen: 'Порівняти зараз', cmpH: 'Порівняння',
      cmpEmpty: n => `Додайте до ${n} товарів кнопкою «Порівняти» на картці чи сторінці товару, і тут вони стануть поруч: ціна, виробник, характеристики.`,
      cmpOne: 'Додайте ще хоча б один товар, щоб було з чим порівнювати.', cmpDiff: 'Лише відмінності', cmpClear: 'Очистити', remove: 'Прибрати',
      rowPrice: 'Ціна', rowBrand: 'Виробник', rowRef: 'Артикул', rowCat: 'Розділ', rowDesc: 'Опис', loginToKeep: 'Увійдіть, щоб обране було на всіх пристроях', signIn: 'Увійти',
      err: {
        paid: 'Замовлення вже оплачено.', not_payable: 'Онлайн-оплата для цього замовлення недоступна.', not_found: 'Замовлення не знайдено. Відкрийте посилання ще раз.',
        login: 'Неправильна пошта або пароль.', exists: 'Кабінет з цією поштою вже є. Увійдіть або відновіть пароль.', email: 'Перевірте адресу пошти.',
        weak: n => `Пароль коротший за ${n} символів.`, required: 'Заповніть усі поля.', code: 'Код неправильний або застарів.', contact: 'Перевірте номер телефону.',
        rate: s => `Забагато спроб. Спробуйте за ${Math.max(1, Math.ceil(s / 60))} хв.`, auth: 'Сесія закінчилась, увійдіть знову.', compare_full: n => `У порівнянні вже ${n} товари. Приберіть один.`,
        too_fast: 'Секунду, перевіряємо, що ви не робот. Натисніть ще раз.', pow: 'Перевірка не вдалась. Натисніть ще раз.',
        net: 'Немає звʼязку з сервером. Спробуйте пізніше.', other: 'Щось пішло не так. Спробуйте ще.',
      },
    },
    en: {
      account: 'Account', login: 'Sign in', register: 'Sign up', loginH: 'Sign in', registerH: 'Create an account',
      loginLead: 'Your account keeps your orders and every conversation with the shop, and your favourites and comparison follow you from phone to computer.',
      email: 'Email', password: 'Password', passwordNew: 'New password', passwordOld: 'Current password', name: 'Name', phone: 'Phone', phoneOpt: 'Phone (optional)',
      pwHint: n => `At least ${n} characters.`, doLogin: 'Sign in', doRegister: 'Create account', google: 'Sign in with Google', or: 'or',
      forgot: 'Forgot your password?', forgotNoMail: 'Message us through “Ask us” or call: we will give you a temporary password to change in your account.',
      sendCode: 'Send code', codeSent: e => `If an account with ${e} exists, the code is in your inbox. It works for 15 minutes.`, code: 'Code from the email', setPw: 'Save password and sign in',
      noAccount: 'No account yet?', haveAccount: 'Already have an account?', toRegister: 'Sign up', toLogin: 'Sign in',
      orders: 'Orders', chats: 'Questions', favorites: 'Favourites', compare: 'Compare', profile: 'Profile', logout: 'Sign out',
      hello: n => `Hello, ${n}`, noOrders: 'No orders yet.', noChats: 'No questions yet.', toCatalog: 'Browse the catalogue', ask: 'Ask a question',
      order: (n, d) => `Order #${n}, ${d}`, total: 'Total', np: 'Nova Poshta', pickup: 'Pickup in Lviv', abroad: 'Outside Ukraine, handed over in person',
      payNow: 'Pay online', payNote: 'By card, Apple Pay or Google Pay on the secure LiqPay page of PrivatBank.', payTest: 'Test mode: no money is charged.',
      payH: n => `Payment for order #${n}`, paidH: 'Thank you, payment received', paidP: n => `Order #${n} is paid. We will contact you about delivery.`,
      payWait: 'Checking the payment…', payWaitP: 'The bank usually confirms within a few seconds. If you did not pay, you can go back and try again.',
      payFail: 'The payment did not go through. No money was taken. Try again or call us.', payPaid: 'Paid online', payRetry: 'Try again',
      payClosed: 'Online payment is not available for this order right now. We will contact you about payment.', payToAcc: 'My orders', payToShop: 'Browse the catalogue',
      status: { new: 'Received', processing: 'Processing', paid: 'Paid', sent: 'Shipped', done: 'Completed', cancelled: 'Cancelled' },
      chatOpen: 'Open', chatClosed: 'Closed', you: 'You: ', shop: 'Shop: ', newAnswer: 'new reply',
      save: 'Save', saved: 'Saved', pwChanged: 'Password changed. Other devices will need to sign in again.', changePw: 'Change password', setPwH: 'Password for email sign-in',
      googleLinked: 'Google sign-in is connected.', emailFixed: 'The email is your login and cannot be changed.',
      offline: 'Accounts start working once the site is connected to the shop server. Favourites and comparison already work and are kept in this browser.',
      favCount: n => `${n} in favourites`, cmpCount: n => `${n} in comparison`,
      favAdd: 'Add to favourites', favDel: 'Remove from favourites', favAdded: 'Added to favourites', favH: 'Favourites',
      favEmpty: 'Items you mark with the heart appear here. Without an account they stay in this browser; with one, on every device.',
      cmpAdd: 'Compare', cmpDel: 'Remove from comparison', cmpAdded: 'Added to comparison', cmpOpen: 'Compare now', cmpH: 'Comparison',
      cmpEmpty: n => `Add up to ${n} items with the “Compare” button on a card or item page and they will line up here: price, maker, specifications.`,
      cmpOne: 'Add at least one more item to have something to compare with.', cmpDiff: 'Differences only', cmpClear: 'Clear', remove: 'Remove',
      rowPrice: 'Price', rowBrand: 'Maker', rowRef: 'SKU', rowCat: 'Section', rowDesc: 'Description', loginToKeep: 'Sign in to keep favourites on every device', signIn: 'Sign in',
      err: {
        paid: 'This order is already paid.', not_payable: 'Online payment is not available for this order.', not_found: 'Order not found. Open the link again.',
        login: 'Wrong email or password.', exists: 'There is already an account with this email. Sign in or reset the password.', email: 'Check the email address.',
        weak: n => `The password is shorter than ${n} characters.`, required: 'Please fill in every field.', code: 'The code is wrong or expired.', contact: 'Check the phone number.',
        rate: s => `Too many attempts. Try again in ${Math.max(1, Math.ceil(s / 60))} min.`, auth: 'Your session has ended, please sign in again.', compare_full: n => `There are already ${n} items in comparison. Remove one first.`,
        too_fast: 'One second, checking you are not a robot. Press again.', pow: 'The check failed. Press again.',
        net: 'Cannot reach the server. Try later.', other: 'Something went wrong. Try again.',
      },
    },
  }[lang];
  const COMPARE_MAX = 4, PW_MIN = 8;

  /* ── Сховище ── */
  const ls = {
    get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* приватний режим */ } },
    del: k => { try { localStorage.removeItem(k); } catch { /* */ } },
  };
  let auth = ls.get('bac-auth', null);                 // { token, profile }
  let favs = ls.get('bac-favs', []).filter(Number.isFinite);
  let cmp = ls.get('bac-cmp', []).filter(Number.isFinite).slice(0, COMPARE_MAX);
  const subs = new Set();
  const emit = () => { ls.set('bac-favs', favs); ls.set('bac-cmp', cmp); subs.forEach(f => f()); };

  /* ── Сервер ── */
  async function call(path, body) {
    if (!API) throw Object.assign(new Error('net'), { net: true });
    const headers = { 'Content-Type': 'application/json' };
    if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
    let r;
    try { r = await fetch(API + path, body === undefined ? { headers } : { method: 'POST', headers, body: JSON.stringify(body) }); }
    catch { throw Object.assign(new Error('net'), { net: true }); }
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 && auth && path.startsWith('/api/me')) { signedOut(); }
    if (!r.ok) throw Object.assign(new Error(d.error || 'other'), { data: d });
    return d;
  }
  const errText = e => { if (!API) return T.offline;   // тестова копія без сервера: кажемо прямо, а не «щось пішло не так»
    const f = T.err[e.message] || T.err.other; return typeof f === 'function' ? f(e.message === 'rate' ? e.data?.retry || 60 : e.data?.min || e.data?.max || COMPARE_MAX) : f; };
  const apply = d => {   // відповідь сервера з профілем, обраним і порівнянням
    if (d.token) auth = { token: d.token, profile: d.profile }; else if (auth && d.profile) auth.profile = d.profile;
    if (auth) ls.set('bac-auth', auth);
    if (d.favorites) favs = d.favorites;
    if (d.compare) cmp = d.compare;
    emit();
  };
  function signedOut() { auth = null; ls.del('bac-auth'); emit(); }
  /* Що гість назбирав на цьому пристрої — віддаємо в кабінет при вході. */
  const guestStuff = () => ({ chats: ls.get('bac-chats', []).map(c => ({ id: c.id, token: c.token })), orders: ls.get('bac-orders', []), favorites: favs, compare: cmp });
  const afterLogin = d => { apply(d); ls.set('bac-orders', ls.get('bac-orders', []).filter(o => o.pay)); };   // посилання на оплату від менеджера лишаємо

  // Свіжий стан з сервера при кожному відкритті сайту: обране, змінене на іншому пристрої, підтягнеться.
  if (auth && API) call('/api/me').then(apply).catch(() => { /* офлайн: лишаємо збережене */ });

  /* ── Обране й порівняння ── */
  function toggleFav(id) {
    const on = !favs.includes(id);
    favs = on ? [id, ...favs] : favs.filter(x => x !== id); emit();
    if (auth) call('/api/me/favorites', { id, on }).then(apply).catch(() => { /* лишається локально, синхронізуємо при наступному вході */ });
    return on;
  }
  function toggleCmp(id) {
    const on = !cmp.includes(id);
    if (on && cmp.length >= COMPARE_MAX) return { full: true, text: T.err.compare_full(COMPARE_MAX) };
    cmp = on ? [...cmp, id] : cmp.filter(x => x !== id); emit();
    if (auth) call('/api/me/compare', { id, on }).then(apply).catch(() => { /* */ });
    return { on };
  }

  /* ── Розмітка ── */
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
  let uid = 0;
  function field(label, input, hint) {
    const id = `acc-${++uid}`; input.id = id;
    return h('div.field', h('label', { for: id }, label), input, hint ? h('small.acc-hint', hint) : null);
  }
  const show = (el, t) => { el.textContent = t; el.hidden = !t; };
  const date = t => new Date(t).toLocaleDateString(lang === 'en' ? 'en-GB' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateTime = t => new Date(t).toLocaleString(lang === 'en' ? 'en-GB' : 'uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const withBusy = async (btn, fn) => { btn.disabled = true; try { await fn(); } finally { btn.disabled = false; } };
  const human = async () => ({ elapsed: Date.now() - opened, pow: await window.ACC_CHAT.pow(), website: '' });
  let opened = Date.now();

  /* Google: бібліотеку Google вантажимо лише на сторінці входу і лише якщо сервер має GOOGLE_CLIENT_ID. */
  let config = null;
  const getConfig = () => config || (config = call('/api/auth/config').catch(() => ({ google: null, reset: false })));
  function googleButton(box, err, ctx) {
    getConfig().then(c => {
      if (!c.google) return;
      const mount = () => {
        window.google.accounts.id.initialize({ client_id: c.google, callback: async r => {
          try { afterLogin(await call('/api/auth/google', { credential: r.credential, lang, ...guestStuff() })); go('/account'); }
          catch (x) { show(err, errText(x)); }
        } });
        const slot = h('div.acc-google');
        box.replaceChildren(slot, h('p.acc-or', T.or));
        window.google.accounts.id.renderButton(slot, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: lang === 'en' ? 'en' : 'uk', width: 320 });
      };
      if (window.google?.accounts) return mount();
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = mount; document.head.append(s);
    });
  }

  /* ── #/login, #/register, #/reset ── */
  function loginPage(view, mode, ctx) {
    if (auth) { go('/account'); return; }
    opened = Date.now(); window.ACC_CHAT?.warm?.();
    ctx.title(mode === 'register' ? T.registerH : T.loginH);
    const err = h('p.acc-err', { role: 'alert', hidden: true });
    const gbox = h('div');
    const email = h('input', { type: 'email', name: 'email', autocomplete: 'email', required: true, inputmode: 'email' });
    const pw = h('input', { type: 'password', name: 'password', autocomplete: mode === 'register' ? 'new-password' : 'current-password', required: true, minlength: PW_MIN });
    const btn = h('button.btn.wide', { type: 'submit' }, mode === 'register' ? T.doRegister : T.doLogin);
    let form;
    if (mode === 'register') {
      const name = h('input', { name: 'name', autocomplete: 'name', required: true, maxlength: 80 });
      const phone = h('input', { type: 'tel', name: 'phone', autocomplete: 'tel', inputmode: 'tel', placeholder: '+380' });
      form = h('form.form.acc-form', { novalidate: true }, field(T.name, name), field(T.email, email), field(T.password, pw, T.pwHint(PW_MIN)), field(T.phoneOpt, phone), err, btn,
        h('p.acc-switch', T.haveAccount, ' ', h('a', { href: url('/login') }, T.toLogin)));
      form.addEventListener('submit', e => { e.preventDefault(); err.hidden = true;
        if (name.value.trim().length < 2 || !email.value.trim()) return show(err, T.err.required);
        if (pw.value.length < PW_MIN) return show(err, T.err.weak(PW_MIN));
        withBusy(btn, async () => {
          try { afterLogin(await call('/api/auth/register', { name: name.value, email: email.value, password: pw.value, phone: phone.value, lang, ...guestStuff(), ...await human() })); go('/account'); }
          catch (x) { show(err, errText(x)); window.ACC_CHAT?.warm?.(); }
        });
      });
    } else {
      const forgot = h('button.link-btn.acc-forgot', { type: 'button', onclick: () => { go('/reset'); } }, T.forgot);
      form = h('form.form.acc-form', { novalidate: true }, field(T.email, email), field(T.password, pw), forgot, err, btn,
        h('p.acc-switch', T.noAccount, ' ', h('a', { href: url('/register') }, T.toRegister)));
      form.addEventListener('submit', e => { e.preventDefault(); err.hidden = true;
        if (!email.value.trim() || !pw.value) return show(err, T.err.required);
        withBusy(btn, async () => {
          try { afterLogin(await call('/api/auth/login', { email: email.value, password: pw.value, ...guestStuff() })); go('/account'); }
          catch (x) { show(err, errText(x)); }
        });
      });
    }
    const wrap = h('div.wrap.acc-auth',
      h('div.acc-auth-lead', h('h1', mode === 'register' ? T.registerH : T.loginH), h('p', T.loginLead), API ? null : h('p.acc-offline', T.offline)),
      h('div.acc-auth-card', gbox, form));
    view.replaceChildren(ctx.crumbsEl(mode === 'register' ? T.register : T.login), wrap);
    if (API) googleButton(gbox, err, ctx);
    (mode === 'register' ? form.querySelector('input') : email).focus({ preventScroll: true });
  }

  function resetPage(view, ctx) {
    ctx.title(T.forgot);
    const err = h('p.acc-err', { role: 'alert', hidden: true }), card = h('div.acc-auth-card');
    view.replaceChildren(ctx.crumbsEl(T.forgot), h('div.wrap.acc-auth', h('div.acc-auth-lead', h('h1', T.forgot)), card));
    getConfig().then(c => {
      if (!c.reset) { card.replaceChildren(h('p', T.forgotNoMail), h('a.btn.ghost', { href: url('/login') }, T.toLogin)); return; }
      const email = h('input', { type: 'email', autocomplete: 'email', required: true });
      const btn = h('button.btn.wide', { type: 'submit' }, T.sendCode);
      const f1 = h('form.form.acc-form', { novalidate: true }, field(T.email, email), err, btn);
      f1.addEventListener('submit', e => { e.preventDefault(); err.hidden = true;
        withBusy(btn, async () => {
          try {
            await call('/api/auth/reset', { email: email.value });
            const code = h('input', { inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 6, required: true });
            const pw = h('input', { type: 'password', autocomplete: 'new-password', minlength: PW_MIN, required: true });
            const b2 = h('button.btn.wide', { type: 'submit' }, T.setPw);
            const f2 = h('form.form.acc-form', { novalidate: true }, h('p', T.codeSent(email.value.trim())), field(T.code, code), field(T.passwordNew, pw, T.pwHint(PW_MIN)), err, b2);
            f2.addEventListener('submit', ev => { ev.preventDefault(); err.hidden = true;
              withBusy(b2, async () => {
                try { afterLogin(await call('/api/auth/reset/confirm', { email: email.value, code: code.value, password: pw.value, ...guestStuff() })); go('/account'); }
                catch (x) { show(err, errText(x)); }
              });
            });
            card.replaceChildren(f2); code.focus();
          } catch (x) { show(err, errText(x)); }
        });
      });
      card.replaceChildren(f1);
    });
  }

  /* ── Оплата LiqPay: сервер підписує платіж, браузер іде на сторінку LiqPay, повертається на #/paid/N ── */
  const orderCred = id => { const o = ls.get('bac-orders', []).find(x => x.id === +id); return o ? { token: o.token, pay: o.pay } : {}; };
  const keepOrder = (id, extra) => { const all = ls.get('bac-orders', []), o = all.find(x => x.id === +id); if (o) Object.assign(o, extra); else all.unshift({ id: +id, ...extra }); ls.set('bac-orders', all.slice(0, 50)); };
  async function goPay(id) {
    const r = await call(`/api/orders/${id}/pay`, orderCred(id));
    const f = h('form', { method: 'POST', action: r.action, 'accept-charset': 'utf-8', hidden: true },
      h('input', { type: 'hidden', name: 'data', value: r.data }), h('input', { type: 'hidden', name: 'signature', value: r.signature }));
    document.body.append(f); f.submit();
  }
  function payButton(id, label = T.payNow) {
    const err = h('p.acc-err', { role: 'alert', hidden: true });
    const b = h('button.btn', { type: 'button', onclick: () => { err.hidden = true; withBusy(b, () => goPay(id).catch(x => show(err, errText(x)))); } }, label);
    const box = h('div.pay-box', b, h('p.acc-hint', T.payNote), err);
    getConfig().then(c => { if (c.sandbox) box.append(h('p.acc-hint.pay-test', T.payTest)); });
    return box;
  }
  const payItems = (o, ctx) => h('ul.pay-items', o.items.map(i => { const pr = ctx.prod(i.id); return h('li', pr ? ctx.thumb(pr) : h('span.ph'), h('span', pr?.name || i.name, ` × ${i.q}`), h('b', i.price ? ctx.money(i.price * i.q) : '')); }),
    h('li.pay-total', h('span'), h('span', T.total), h('b', ctx.money(o.total))));
  /* #/pay/N/код — посилання від менеджера */
  function payPage(view, id, code, ctx) {
    ctx.title(T.payH(id));
    if (code) keepOrder(id, { pay: code });
    const body = h('div.pay-card', { 'aria-busy': 'true' });
    view.replaceChildren(ctx.crumbsEl(T.payH(id)), h('div.wrap.pay-wrap', h('h1', T.payH(id)), body));
    call(`/api/orders/${id}/state`, orderCred(id)).then(o => {
      body.removeAttribute('aria-busy');
      if (o.pay === 'success') return body.replaceChildren(h('p.acc-ok', T.paidP(o.id)), payItems(o, ctx));
      body.replaceChildren(payItems(o, ctx), o.payable ? payButton(o.id) : h('p', T.payClosed));
    }).catch(x => body.replaceChildren(h('p.acc-err', errText(x))));
  }
  /* #/paid/N — сюди LiqPay повертає покупця. Чекаємо підтвердження від сервера (він питає LiqPay сам). */
  function paidPage(view, id, ctx) {
    ctx.title(T.payWait);
    const body = h('div.pay-card', { 'aria-live': 'polite' }, h('h1', T.payWait), h('p', T.payWaitP));
    const links = h('p.pay-links', h('a.btn.ghost', { href: auth ? url('/account/orders') : url('/') }, auth ? T.payToAcc : T.payToShop));
    view.replaceChildren(h('div.wrap.pay-wrap', body, links));
    let n = 0;
    const tick = () => call(`/api/orders/${id}/state`, orderCred(id)).then(o => {
      if (!view.contains(body)) return;
      if (o.pay === 'success') { ctx.title(T.paidH); return body.replaceChildren(h('h1', T.paidH), h('p', T.paidP(o.id)), payItems(o, ctx)); }
      if (o.pay === 'failure' || ++n >= 8) return body.replaceChildren(h('h1', T.payH(o.id)), h('p', o.pay === 'failure' ? T.payFail : T.payWaitP), o.payable ? payButton(o.id, T.payRetry) : null);
      setTimeout(tick, 2500);
    }).catch(x => body.replaceChildren(h('p.acc-err', errText(x))));
    tick();
  }

  /* ── #/account[/orders|chats|profile] ── */
  function accountPage(view, tab, ctx) {
    if (!auth) { go('/login'); return; }
    tab = ['orders', 'chats', 'profile'].includes(tab) ? tab : 'orders';
    ctx.title(T.account);
    const p = auth.profile || {};
    const nav = h('nav.acc-nav', { 'aria-label': T.account },
      [['orders', T.orders, url('/account/orders')], ['chats', T.chats, url('/account/chats')], ['fav', `${T.favorites} · ${favs.length}`, url('/favorites')], ['cmp', `${T.compare} · ${cmp.length}`, url('/compare')], ['profile', T.profile, url('/account/profile')]]
        .map(([k, label, href]) => h('a', { href, 'aria-current': k === tab ? 'page' : null }, label)),
      h('button.link-btn', { type: 'button', onclick: async () => { await call('/api/auth/logout', {}).catch(() => {}); signedOut(); go('/'); } }, T.logout));
    const body = h('div.acc-body', { 'aria-busy': 'true' });
    view.replaceChildren(ctx.crumbsEl(T.account), h('div.wrap.acc-layout', h('aside.acc-side', h('h1', T.hello(p.name || p.email || '')), h('p.acc-mail', p.email || ''), nav), body));
    const fail = x => body.replaceChildren(h('p.acc-err', errText(x)));
    if (tab === 'orders') call('/api/me/orders').then(list => {
      body.removeAttribute('aria-busy');
      if (!list.length) return body.replaceChildren(h('div.empty', h('h2', T.orders), h('p', T.noOrders), h('a.btn', { href: url('/') }, T.toCatalog)));
      body.replaceChildren(h('h2', T.orders), ...list.map(o => h('article.acc-order',
        h('header', h('h3', T.order(o.id, date(o.created_at))), h(`span.acc-status.s-${o.status}`, T.status[o.status] || o.status)),
        h('ul', o.items.map(i => { const pr = ctx.prod(i.id); return h('li', pr ? ctx.thumb(pr) : h('span.ph'), h('a', { href: url(`/p/${i.id}`) }, pr?.name || i.name), h('span', `× ${i.q}`), h('b', i.price ? ctx.money(i.price * i.q) : '')); })),
        h('footer', h('span', o.delivery === 'pickup' ? T.pickup : `${o.delivery === 'abroad' ? T.abroad : T.np}${o.city ? `, ${o.city}` : ''}`), h('b', `${T.total}: ${ctx.money(o.total)}`)),
        o.pay === 'success' ? h('p.acc-ok.pay-done', T.payPaid) : o.payable ? payButton(o.id) : null)));
    }).catch(fail);
    if (tab === 'chats') call('/api/me/chats').then(list => {
      body.removeAttribute('aria-busy');
      const askBtn = h('button.btn', { type: 'button', onclick: () => window.ACC_CHAT?.open() }, T.ask);
      if (!list.length) return body.replaceChildren(h('div.empty', h('h2', T.chats), h('p', T.noChats), askBtn));
      body.replaceChildren(h('div.acc-head', h('h2', T.chats), askBtn), h('ul.acc-chats', list.map(c => h('li', h('button', { type: 'button', onclick: () => window.ACC_CHAT?.open({ chat: { id: c.id, topic: c.topic } }) },
        h('span.acc-chat-top', h('b', c.topic), h('time', dateTime(c.updated_at))),
        h('span.acc-chat-last', (c.last_sender === 'admin' ? T.shop : T.you) + (c.last || '')),
        h('span.acc-chat-meta', h(`i.acc-status.s-${c.status === 'closed' ? 'done' : 'new'}`, c.status === 'closed' ? T.chatClosed : T.chatOpen), c.unread ? h('i.acc-new', `${c.unread} ${T.newAnswer}`) : null))))));
    }).catch(fail);
    if (tab === 'profile') {
      body.removeAttribute('aria-busy');
      const err = h('p.acc-err', { role: 'alert', hidden: true }), ok = h('p.acc-ok', { role: 'status', hidden: true });
      const name = h('input', { autocomplete: 'name', value: p.name || '', maxlength: 80 });
      const phone = h('input', { type: 'tel', autocomplete: 'tel', value: p.phone || '', placeholder: '+380' });
      const mail = h('input', { type: 'email', value: p.email || '', readonly: true });
      const b1 = h('button.btn', { type: 'submit' }, T.save);
      const f1 = h('form.form.acc-form', { novalidate: true }, h('h2', T.profile), field(T.name, name), field(T.phone, phone), field(T.email, mail, T.emailFixed), err, ok, b1);
      f1.addEventListener('submit', e => { e.preventDefault(); err.hidden = ok.hidden = true;
        withBusy(b1, async () => { try { apply(await call('/api/me/profile', { name: name.value, phone: phone.value })); show(ok, T.saved); } catch (x) { show(err, errText(x)); } });
      });
      const err2 = h('p.acc-err', { role: 'alert', hidden: true }), ok2 = h('p.acc-ok', { role: 'status', hidden: true });
      const old = h('input', { type: 'password', autocomplete: 'current-password' });
      const pw = h('input', { type: 'password', autocomplete: 'new-password', minlength: PW_MIN });
      const b2 = h('button.btn.ghost', { type: 'submit' }, T.changePw);
      const f2 = h('form.form.acc-form', { novalidate: true }, h('h2', p.hasPass === false ? T.setPwH : T.changePw), p.google ? h('p.acc-hint', T.googleLinked) : null,
        p.hasPass === false ? null : field(T.passwordOld, old), field(T.passwordNew, pw, T.pwHint(PW_MIN)), err2, ok2, b2);
      f2.addEventListener('submit', e => { e.preventDefault(); err2.hidden = ok2.hidden = true;
        if (pw.value.length < PW_MIN) return show(err2, T.err.weak(PW_MIN));
        withBusy(b2, async () => { try { await call('/api/me/password', { old: old.value, password: pw.value }); old.value = pw.value = ''; show(ok2, T.pwChanged); call('/api/me').then(apply).catch(() => {}); } catch (x) { show(err2, errText(x)); } });
      });
      body.replaceChildren(f1, f2);
    }
  }

  window.ACC_ACCOUNT = {
    t: T, enabled: !!API, COMPARE_MAX,
    get user() { return auth?.profile || null; },
    get token() { return auth?.token || ''; },
    favs: () => favs, cmp: () => cmp,
    isFav: id => favs.includes(id), inCmp: id => cmp.includes(id),
    toggleFav, toggleCmp, subscribe: f => subs.add(f),
    payButton, payable: o => !!o?.payable,
    rememberOrder: o => { if (!auth && o?.token) ls.set('bac-orders', [{ id: o.id, token: o.token }, ...ls.get('bac-orders', [])].slice(0, 50)); },
    route(view, seg, ctx) {
      if (seg[0] === 'login' || seg[0] === 'register') { loginPage(view, seg[0], ctx); return true; }
      if (seg[0] === 'reset') { resetPage(view, ctx); return true; }
      if (seg[0] === 'account') { accountPage(view, seg[1], ctx); return true; }
      if (API && seg[0] === 'pay' && +seg[1]) { payPage(view, +seg[1], seg[2], ctx); return true; }
      if (API && seg[0] === 'paid' && +seg[1]) { paidPage(view, +seg[1], ctx); return true; }
      return false;
    },
  };
})();
