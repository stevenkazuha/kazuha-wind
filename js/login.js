/* ─────────────────────────────────────────────
   登录页 — 本地账号（仅存本机 localStorage）
   ───────────────────────────────────────────── */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const user = window.Kazuha.user;

  const card = $("#loginCard");
  const already = $("#alreadyCard");
  const form = $("#loginForm");
  const nameInput = $("#loginName");
  const passInput = $("#loginPass");
  const nameField = $("#fieldName");
  const passField = $("#fieldPass");

  function setError(field, msg) {
    field.classList.toggle("has-error", Boolean(msg));
    const err = field.querySelector(".error");
    if (err) err.textContent = msg || "";
  }

  function showState(current) {
    const logged = Boolean(current);
    card.hidden = logged;
    already.hidden = !logged;
    if (logged) $("#alreadyName").textContent = current.name;
    if (!logged) nameInput.focus({ preventScroll: true });
  }

  /* 已登录时直接展示“你已在风中” */
  showState(user.get());
  document.addEventListener("kazuha:userchange", () => showState(user.get()));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = nameInput.value.trim() || "旅人";
    const pass = passInput.value;
    let ok = true;

    if (name.length > 12) {
      setError(nameField, "名字太长，风记不住。请少于 12 个字。");
      ok = false;
    } else {
      setError(nameField, "");
    }

    if (!pass.trim()) {
      setError(passField, "还需一句密语，才能通过风。");
      ok = false;
    } else {
      setError(passField, "");
    }

    if (!ok) {
      $("#formMsg").textContent = "风在门外等了一会儿，请看看上面缺了什么。";
      return;
    }

    $("#formMsg").textContent = "";
    user.set({ name, guest: false, at: Date.now() });
    location.href = "chat.html";
  });

  $("#guestBtn").addEventListener("click", () => {
    user.set({ name: "访客", guest: true, at: Date.now() });
    location.href = "chat.html";
  });

  [nameInput, passInput].forEach(input => {
    input.addEventListener("input", () => {
      setError(input.closest(".field"), "");
      $("#formMsg").textContent = "";
    });
  });
})();
