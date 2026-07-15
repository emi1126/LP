// ============================================
// 心の整理室 LP - インタラクション
// ============================================

const REVEAL_SELECTOR = ".fade-up";
const REVEAL_THRESHOLD = 0.12;
const REVEAL_ROOT_MARGIN = "0px 0px -32px 0px";
const REVEAL_STAGGER = 0.06;
const STAGGER_GROUPS =
  ".container, .benefits, .services, .flow, .reasons__grid, .foryou, .pricing__grid, .checklist, .faq, .compare, .hero__inner";

// ---------- 背景動画（既存 assets/hero-bg.mp4 を復元表示） ----------
function initHeroVideo() {
  const wrap = document.querySelector(".hero__video");
  const video = document.getElementById("heroVideo");
  if (!wrap || !video) return;

  const play = () => {
    video.muted = true;
    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  play();
  video.addEventListener("loadeddata", play, { once: true });
  video.addEventListener("canplay", play, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) play();
  });
}

// ---------- IntersectionObserver（統合） ----------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN }
);

function initReveal() {
  document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
    revealObserver.observe(el);
  });

  document.querySelectorAll(STAGGER_GROUPS).forEach((group) => {
    group.querySelectorAll(REVEAL_SELECTOR).forEach((el, i) => {
      el.style.transitionDelay = `${i * REVEAL_STAGGER}s`;
    });
  });
}

// ---------- 追従CTA（rAFでスロットル） ----------
function initStickyCta() {
  const stickyCta = document.getElementById("stickyCta");
  const hero = document.querySelector(".hero");
  const ctaTargets = [document.getElementById("cta"), document.getElementById("form")].filter(Boolean);
  if (!stickyCta || !hero) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const heroBottom = hero.getBoundingClientRect().bottom;
    const nearCta = ctaTargets.some((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    stickyCta.classList.toggle("is-shown", heroBottom < 0 && !nearCta);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

// ---------- ページ内アンカー ----------
function initAnchorLinks() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      target.classList.add("is-visible");
      target.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        el.classList.add("is-visible");
      });
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });
}

// ---------- 理由カード開閉 ----------
function initReasonCards() {
  document.querySelectorAll(".reason-card").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("is-open"));
  });
}

// ---------- チェックリスト ----------
function initChecklist() {
  const checkboxes = document.querySelectorAll(".checklist input[type='checkbox']");
  const checkResult = document.getElementById("checkResult");
  if (!checkboxes.length || !checkResult) return;

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const checkedCount = [...checkboxes].filter((c) => c.checked).length;
      if (checkedCount > 0) {
        checkResult.style.transform = "scale(1.02)";
        checkResult.style.boxShadow = "0 18px 50px rgba(217, 119, 147, 0.25)";
        setTimeout(() => {
          checkResult.style.transform = "";
        }, 300);
      }
    });
  });
}

// ---------- 流れ星 ----------
function initShootingStars() {
  const nightSections = [document.querySelector(".hero"), document.getElementById("cta")].filter(Boolean);

  const spawn = () => {
    nightSections.forEach((section) => {
      const star = document.createElement("span");
      star.className = "shooting-star";
      star.style.top = 5 + Math.random() * 35 + "%";
      section.appendChild(star);
      star.addEventListener("animationend", () => star.remove(), { once: true });
    });
  };

  setTimeout(spawn, 4000);
  setInterval(spawn, 120000);
}

// ---------- フォーム送信 ----------
const GAS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyYJ1iYXV4u2NaYSDj8jGk8xyCSJsBCGJan8YQ7lWLk8LUs4D-FJA78olitfy97UgVK/exec";

function bindForm(form, options) {
  const submitBtn = document.getElementById(options.submitId);
  const statusEl = document.getElementById(options.statusId);
  if (!form || !submitBtn || !statusEl) return;

  const setStatus = (msg, type) => {
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (type ? ` form-status--${type}` : "");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form[options.honeypot].value) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = options.buildData(form);
    submitBtn.disabled = true;
    setStatus("送信しています…", "");

    try {
      const res = await fetch(GAS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({ result: "error" }));

      if (res.ok && result.result === "success") {
        form.innerHTML = options.doneHtml;
      } else {
        throw new Error(result.message || "送信に失敗しました");
      }
    } catch (err) {
      submitBtn.disabled = false;
      setStatus("送信に失敗しました。お手数ですが時間をおいて再度お試しください。", "ng");
      console.error(err);
    }
  });
}

const DONE_RESERVATION = `
  <div class="form-done">
    <span class="form-done__icon"><svg class="line-icon" aria-hidden="true"><use href="icons.svg#icon-check-circle"/></svg></span>
    <p class="form-done__title">お申し込みありがとうございます</p>
    <p class="form-done__text">
      ご入力いただいたメールアドレス宛に、<br />
      担当より折り返しご連絡いたします。<br />
      まずはゆっくり、心の準備だけ整えてお待ちください。
    </p>
  </div>
`;

const DONE_CONTACT = `
  <div class="form-done">
    <span class="form-done__icon"><svg class="line-icon" aria-hidden="true"><use href="icons.svg#icon-mail-check"/></svg></span>
    <p class="form-done__title">お問い合わせありがとうございます</p>
    <p class="form-done__text">
      内容を確認のうえ、<br />
      ご入力いただいたメールアドレス宛に<br />
      担当より折り返しご連絡いたします。
    </p>
  </div>
`;

function initForms() {
  bindForm(document.getElementById("reserveForm"), {
    submitId: "submitBtn",
    statusId: "formStatus",
    honeypot: "company",
    doneHtml: DONE_RESERVATION,
    buildData: (form) => ({
      formType: "reservation",
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      method: form.method.value,
      preferredDate: form.preferredDate.value.trim(),
      message: form.message.value.trim(),
      pageUrl: location.href,
    }),
  });

  bindForm(document.getElementById("contactForm"), {
    submitId: "contactSubmitBtn",
    statusId: "contactStatus",
    honeypot: "website",
    doneHtml: DONE_CONTACT,
    buildData: (form) => ({
      formType: "inquiry",
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company.value.trim(),
      phone: form.phone.value.trim(),
      message: form.message.value.trim(),
      pageUrl: location.href,
    }),
  });
}

// ---------- ほどけた心の線アニメーション ----------
function initUntangle() {
  const untangle = document.querySelector(".untangle");
  if (!untangle) return;

  const untangleObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        untangleObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );
  untangleObserver.observe(untangle);
}

// ---------- 初期化 ----------
initHeroVideo();
initReveal();
initUntangle();
initStickyCta();
initAnchorLinks();
initReasonCards();
initChecklist();
initShootingStars();
initForms();
