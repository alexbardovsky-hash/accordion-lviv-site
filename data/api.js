/* Адреса сервера CRM (server/). Порожньо = чату немає, замовлення йде листом, як раніше. */
window.ACC_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? `http://${location.hostname}:8790` : '';
