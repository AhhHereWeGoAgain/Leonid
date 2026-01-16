document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#regTr");
  if (!form) return;

  const nameInput = form.querySelector("#name");
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
    submitBtn.value = isLoading ? "Creating..." : "Create Account";
  }

  function normalizeSpaces(str) {
    return (str || "").replace(/\s+/g, " ").trim();
  }

  function validateName(name) {
    return /^[A-Za-zА-Яа-яЁё\s'-]{2,60}$/.test(name);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function validatePassword(pw) {
    return typeof pw === "string" && pw.length >= 8 && pw.length <= 64;
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

  [nameInput, emailInput, passInput].forEach((el) => el?.addEventListener("input", clearNotice));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearNotice();

    const name = normalizeSpaces(nameInput?.value);
    const email = normalizeSpaces(emailInput?.value).toLowerCase();
    const password = passInput?.value || "";

    const errors = [];
    if (!validateName(name)) errors.push("Имя: 2–60 символов (буквы, пробел, дефис).");
    if (!validateEmail(email)) errors.push("Email: некорректный формат.");
    if (!validatePassword(password)) errors.push("Пароль: минимум 8 символов.");

    if (errors.length) {
      setNotice("error", errors.join(" "));
      return;
    }

    setLoading(true);
    try {
      await postJson(`${API_BASE}/register`, { name, email, password });
      setNotice("success", "Аккаунт создан. Теперь войдите…");
      setTimeout(() => (window.location.href = "login.html"), 400);
    } catch (err) {
      if (err?.name === "AbortError") {
        setNotice("error", "Сервер не отвечает (таймаут). Проверь backend на 127.0.0.1:8000.");
      } else if (err?.status === 409) {
        setNotice("error", "Пользователь уже существует. Перейдите к входу.");
      } else {
        setNotice("error", err?.message || "Ошибка регистрации.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  });
});
