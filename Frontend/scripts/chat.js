document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://127.0.0.1:8000";

  // ✅ редирект сразу, если токена нет
  const initialToken = localStorage.getItem("access_token");
  if (!initialToken) {
    window.location.replace("login.html");
    return;
  }

  const form = document.querySelector(".message-form");
  const input = form?.querySelector('input[name="message"]');
  const messages = document.querySelector(".chat-messages");

  function formatTime(d = new Date()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function addMessage(role, text) {
    const wrap = document.createElement("div");
    wrap.className = `message ${role === "user" ? "user-message" : "ai-message"}`;

    if (role !== "user") {
      const av = document.createElement("div");
      av.className = "message-avatar";
      av.innerHTML = `<div class="avatar-icon">AI</div>`;
      wrap.appendChild(av);
    }

    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = `<p></p><span class="message-time">${formatTime()}</span>`;
    content.querySelector("p").textContent = text;

    wrap.appendChild(content);
    messages?.appendChild(wrap);
    messages?.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
  }

  async function postChat(message) {
    // ✅ берём актуальный токен каждый запрос
    const token = localStorage.getItem("access_token");
    if (!token) {
      const err = new Error("Нет access_token");
      err.status = 401;
      err.body = { detail: "missing_token" };
      throw err;
    }

    const resp = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
      credentials: "include",
    });

    const text = await resp.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) {}

    if (!resp.ok) {
      const detail = data?.detail || data?.message || text || `HTTP ${resp.status}`;
      const err = new Error(detail);
      err.status = resp.status;
      err.body = data ?? text;
      throw err;
    }

    return data;
  }

  function shouldLogoutOn401(detail) {
    const d = String(detail || "").toLowerCase();
    // ✅ выкидываем только когда реально проблема токена/авторизации
    return (
      d.includes("token") ||
      d.includes("jwt") ||
      d.includes("expired") ||
      d.includes("signature") ||
      d.includes("not authenticated") ||
      d.includes("missing bearer") ||
      d.includes("invalid")
    );
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = (input?.value || "").trim();
    if (!msg) return;

    input.value = "";
    addMessage("user", msg);

    try {
      const data = await postChat(msg);
      addMessage("assistant", data?.reply || "Пустой ответ.");
    } catch (err) {
      console.error(err);

      const status = err?.status;
      const body = err?.body;
      const detail =
        typeof body === "object" && body
          ? (body.detail || body.message || err.message)
          : (err.message || String(body || ""));

      if (status === 401) {
        addMessage("assistant", `Нет доступа: ${detail || "401"}`);

        // if (shouldLogoutOn401(detail)) {
        localStorage.removeItem("access_token");
        setTimeout(() => window.location.replace("login.html?reason=401"), 400);
        // }
        return; // ✅ главное: не редиректим всегда
      }

      addMessage("assistant", `Ошибка: ${detail || "unknown error"}`);
    }
  });
});
