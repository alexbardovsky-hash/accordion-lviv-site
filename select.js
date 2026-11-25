/* Випадні списки у стилі сайту. Справжній <select> лишається в сторінці (значення, події), а людина бачить кнопку й список.
   Клавіатура: Enter, пробіл, стрілки, Home, End, перші літери, Esc. ACC_SELECT(корінь) можна викликати повторно. */
(() => {
  let n = 0, open = null;
  const close = focus => { if (!open) return; const o = open; open = null; o.ul.hidden = true; o.b.setAttribute('aria-expanded', 'false'); o.b.removeAttribute('aria-activedescendant'); if (focus) o.b.focus({ preventScroll: true }); };
  addEventListener('pointerdown', e => { if (open && !open.w.contains(e.target)) close(); });
  function make(sel) {
    const id = `sl${++n}`, w = document.createElement('span'), b = document.createElement('button'), ul = document.createElement('ul'); w.className = 'sl';
    b.type = 'button'; b.className = 'sl-b'; b.id = id; b.setAttribute('role', 'combobox'); b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', `${id}l`);
    const lab = sel.closest('label'), name = sel.getAttribute('aria-label') || (lab ? [...lab.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent.trim()).join(' ').trim() : ''); if (name) ul.setAttribute('aria-label', name);
    ul.className = 'sl-l'; ul.id = `${id}l`; ul.hidden = true; ul.setAttribute('role', 'listbox'); ul.tabIndex = -1;
    [...sel.options].forEach((o, i) => { const li = document.createElement('li'); li.id = `${id}o${i}`; li.setAttribute('role', 'option'); li.textContent = o.text; ul.append(li); });
    const paint = () => { const t = sel.options[sel.selectedIndex]?.text || ''; b.textContent = t; if (name) b.setAttribute('aria-label', `${name}: ${t}`); [...ul.children].forEach((li, i) => li.setAttribute('aria-selected', i === sel.selectedIndex)); };
    let cur = 0, type = '', tt;
    const mark = i => { cur = Math.max(0, Math.min(ul.children.length - 1, i)); [...ul.children].forEach((li, k) => li.classList.toggle('on', k === cur)); b.setAttribute('aria-activedescendant', `${id}o${cur}`); ul.children[cur]?.scrollIntoView({ block: 'nearest' }); };
    const show = () => { close(); ul.hidden = false; const r = w.getBoundingClientRect(); ul.classList.toggle('up', r.bottom + ul.offsetHeight + 12 > innerHeight && r.top > ul.offsetHeight + 90); ul.classList.toggle('right', r.left + ul.offsetWidth > innerWidth - 8); b.setAttribute('aria-expanded', 'true'); open = { w, b, ul }; mark(sel.selectedIndex); };
    const pick = i => { close(true); if (i === sel.selectedIndex) return; sel.selectedIndex = i; paint(); sel.dispatchEvent(new Event('change', { bubbles: true })); };
    b.onclick = e => { e.preventDefault(); if (open?.b === b) close(); else show(); };
    b.onkeydown = e => {
      const on = open?.b === b, k = e.key;
      if (!on && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(k)) { e.preventDefault(); show(); return; }
      if (!on) return;
      if (k === 'ArrowDown') mark(cur + 1); else if (k === 'ArrowUp') mark(cur - 1); else if (k === 'Home') mark(0); else if (k === 'End') mark(1e3);
      else if (k === 'Enter' || k === ' ') pick(cur); else if (k === 'Escape') { e.stopPropagation(); close(true); } else if (k === 'Tab') { close(); return; }
      else if (k.length === 1) { clearTimeout(tt); type += k.toLowerCase(); tt = setTimeout(() => { type = ''; }, 600); const i = [...sel.options].findIndex(o => o.text.toLowerCase().startsWith(type)); if (i >= 0) mark(i); } else return;
      e.preventDefault();
    };
    ul.onclick = e => { e.preventDefault(); e.stopPropagation(); const li = e.target.closest('li'); if (li) pick([...ul.children].indexOf(li)); };
    ul.onpointermove = e => { const li = e.target.closest('li'); if (li) mark([...ul.children].indexOf(li)); };
    sel.before(w); w.append(b, ul, sel); sel.hidden = true; sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true'); sel.focus = o => b.focus(o); sel.addEventListener('change', paint); paint();
  }
  window.ACC_SELECT = root => root.querySelectorAll('select').forEach(s => { if (!s.closest('.sl')) make(s); });
})();
