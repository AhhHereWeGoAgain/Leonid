document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  if (!form) return;

  const emailInput = form.querySelector("#email");
  const passInput = form.querySelector("#password");
  const submitBtn = form.querySelector("#submit_button");

  const API_BASE = "http://127.0.0.1:8000";

  const notice = document.createElement("div");
  notice.style.marginTop = "12px";
  notice.style.fontSize = "14px";
  notice.style.lineHeight = "1.35";
  notice.style.display = "none";
  form.appendChild(notice);

  function setNotice(type, text) {
    notice.style.display = "block";
    notice.textContent = text;
    notice.style.color = type === "error" ? "#b42318" : type === "success" ? "#067647" : "#344054";
  }

  function clearNotice() {
    notice.style.display = "none";
    notice.textContent = "";
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.style.opacity = isLoading ? "0.7" : "1";
    submitBtn.value = isLoading ? "Signing in..." : "Sign In";
  }

  function normalize(str) {
    return (str || "").trim();
  }

  async function postJson(url, payload, timeoutMs = 15000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
        credentials: "include", // чтобы refresh-cookie (если есть) работала
      });

      const text = await resp.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (_) {}

      if (!resp.ok) {
        const detail = data?.detail || data?.message || text || `HTTP ${resp.status}`;
        const err = new Error(detail);
        err.status = resp.status;
        throw err;
      }
      return data;
    } finally {
      clearTimeout(t);
    }
  }

  [emailInput, passInput].forEach((el) => el?.addEventListener("input", clearNotice));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearNotice();

    const email = normalize(emailInput?.value).toLowerCase();
    const password = passInput?.value || "";

    if (!email || !password) {
      setNotice("error", "Введите email и пароль.");
      return;
    }

    setLoading(true);
    try {
      const data = await postJson(`${API_BASE}/login`, { email, password });
      if (!data?.access_token) throw new Error("Нет access_token в ответе сервера.");

      localStorage.setItem("access_token", data.access_token);
      setNotice("success", "Вход выполнен. Перенаправляю…");
      setTimeout(() => (window.location.href = "mainpage.html"), 300);
    } catch (err) {
      if (err?.name === "AbortError") {
        setNotice("error", "Сервер не отвечает (таймаут).");
      } else if (err?.status === 401) {
        setNotice("error", "Неверный email или пароль.");
      } else {
        setNotice("error", err?.message || "Ошибка входа.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  });
});
