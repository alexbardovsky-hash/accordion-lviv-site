/* Архів (Алекс 28.11: «акордеони всіх інших виробників з сайту поки прибираємо»).
   На сайті продаємо лише Pigini, Scandalli, Bugari, Fisitalia, Musictech. Товари звідси покупець не бачить: ні в каталозі, ні в пошуку, ні в sitemap.
   Нічого не видалено: щоб повернути товар, приберіть його номер зі списку. CRM знає їх і далі (старі замовлення й чати). */
window.ARCHIVE = [
  509,                  // Mengascini F-6 Jazz
  562,                  // Mengascini Bambino 44/60
  565, 566, 567, 568,   // Hohner Bravo II 48, Bravo III 80 / 96 / 120
];
if (window.CATALOG) window.CATALOG.products = window.CATALOG.products.filter(p => !window.ARCHIVE.includes(p.id));
