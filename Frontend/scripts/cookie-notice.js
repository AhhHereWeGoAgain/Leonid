/* cookie-notice.js
   Подключение:
   <script src="scripts/cookie-notice.js" defer></script>
*/

(function () {
  "use strict";

  const STORAGE_KEY = "cookie_notice_accepted_v1";

  // Настройки (можешь менять без правок кода ниже)
  const cfg = {
    text:
      "Мы используем cookie для работы авторизации и сохранения сессии (например, refresh-token). Продолжая пользоваться сайтом, вы соглашаетесь с использованием cookie.",
    acceptText: "Понятно",
    closeText: "Закрыть",
  };

  function isAccepted() {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }

  function markAccepted() {
    localStorage.setItem(STORAGE_KEY, "1");
  }

  function injectStyles() {
    if (document.getElementById("cookie-notice-style")) return;

    const style = document.createElement("style");
    style.id = "cookie-notice-style";
    style.textContent = `
      .cookie-notice {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 16px;
        z-index: 9999;
        display: none;
      }

      .cookie-notice__content {
        max-width: 920px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(225, 229, 238, 0.9);
        border-radius: 14px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.18);
        backdrop-filter: blur(10px);
        padding: 14px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      }

      .cookie-notice__text {
        color: #344054;
        font-size: 14px;
        line-height: 1.35;
      }

      .cookie-notice__actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
      }

      .cookie-notice__btn {
        border: none;
        border-radius: 10px;
        padding: 10px 12px;
        font-weight: 600;
        cursor: pointer;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
        transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      }

      .cookie-notice__btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(102, 126, 234, 0.25);
      }

      .cookie-notice__btn--ghost {
        background: transparent;
        color: #344054;
        border: 1px solid #e1e5ee;
      }

      .cookie-notice__btn--ghost:hover {
        box-shadow: none;
        opacity: 0.9;
      }

      .cookie-notice--hide {
        opacity: 0;
        transform: translateY(8px);
        transition: all 0.18s ease;
      }

      @media (max-width: 520px) {
        .cookie-notice__content {
          flex-direction: column;
          align-items: stretch;
        }
        .cookie-notice__actions {
          justify-content: flex-end;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function buildNotice() {
    // если уже есть — не дублируем
    if (document.getElementById("cookieNotice")) return null;

    const root = document.createElement("div");
    root.className = "cookie-notice";
    root.id = "cookieNotice";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-label", "Cookie notice");

    root.innerHTML = `
      <div class="cookie-notice__content">
        <div class="cookie-notice__text">${escapeHtml(cfg.text)}</div>
        <div class="cookie-notice__actions">
          <button class="cookie-notice__btn cookie-notice__btn--ghost" type="button" id="cookieDecline">
            ${escapeHtml(cfg.closeText)}
          </button>
          <button class="cookie-notice__btn" type="button" id="cookieAccept">
            ${escapeHtml(cfg.acceptText)}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    return root;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function show(el) {
    el.style.display = "block";
  }

  function hide(el) {
    el.classList.add("cookie-notice--hide");
    setTimeout(() => {
      el.style.display = "none";
    }, 180);
  }

  function init() {
    try {
      if (isAccepted()) return;

      injectStyles();
      const el = buildNotice();
      if (!el) return;

      const acceptBtn = el.querySelector("#cookieAccept");
      const declineBtn = el.querySelector("#cookieDecline");

      acceptBtn?.addEventListener("click", () => {
        markAccepted();
        hide(el);
      });

      declineBtn?.addEventListener("click", () => {
        hide(el);
      });

      show(el);
    } catch (e) {
      // Не ломаем страницу, даже если что-то пошло не так
      console.warn("[cookie-notice] init error:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
