// ============================================
// 心の整理室 LP - インタラクション
// ============================================

// スクロールフェードイン（統一）
const REVEAL_SELECTOR = ".fade-up";
const REVEAL_THRESHOLD = 0.12;
const REVEAL_ROOT_MARGIN = "0px 0px -32px 0px";
const REVEAL_STAGGER = 0.06;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN }
);

document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
  revealObserver.observe(el);
});

// 同一グループ内で段階的に表示
document
  .querySelectorAll(
    ".container, .benefits, .services, .flow, .reasons__grid, .foryou, .pricing__grid, .checklist, .faq, .compare, .hero__inner"
  )
  .forEach((group) => {
    group.querySelectorAll(REVEAL_SELECTOR).forEach((el, i) => {
      el.style.transitionDelay = `${i * REVEAL_STAGGER}s`;
    });
  });

// ほどけた心の線アニメーション（untangle が見えたら発火）
const untangle = document.querySelector(".untangle");
if (untangle) {
  const untangleObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          untangleObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  untangleObserver.observe(untangle);
}

// チェックリスト: 1つでもチェックされたら結果を強調
const checkboxes = document.querySelectorAll(".checklist input[type='checkbox']");
const checkResult = document.getElementById("checkResult");

checkboxes.forEach((cb) => {
  cb.addEventListener("change", () => {
    const checkedCount = [...checkboxes].filter((c) => c.checked).length;
    if (checkedCount > 0 && checkResult) {
      checkResult.style.transform = "scale(1.02)";
      checkResult.style.boxShadow = "0 18px 50px rgba(217, 119, 147, 0.25)";
      setTimeout(() => {
        checkResult.style.transform = "";
      }, 300);
    }
  });
});

// 追従CTA: ファーストビューを過ぎたら表示、CTAセクション付近では隠す
const stickyCta = document.getElementById("stickyCta");
const hero = document.querySelector(".hero");
const ctaTargets = [
  document.getElementById("cta"),
  document.getElementById("form"),
].filter(Boolean);

function updateStickyCta() {
  if (!stickyCta || !hero) return;
  const heroBottom = hero.getBoundingClientRect().bottom;
  const nearCta = ctaTargets.some((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  if (heroBottom < 0 && !nearCta) {
    stickyCta.classList.add("is-shown");
  } else {
    stickyCta.classList.remove("is-shown");
  }
}

window.addEventListener("scroll", updateStickyCta, { passive: true });
updateStickyCta();

// ============================================
// ページ内アンカー: 飛ぶ先を確実に表示してスクロール
//   （fade-up が opacity:0 のまま「開かない」のを防ぐ）
// ============================================
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();

    // 飛ぶ先のセクションとその中の fade-up を即時に表示
    target.classList.add("is-visible");
    target.querySelectorAll(".fade-up").forEach((el) => {
      el.classList.add("is-visible");
    });

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", id);
  });
});

// ============================================
// 安心して相談できる理由: タップ/クリックで説明を開閉
// ============================================
document.querySelectorAll(".reason-card").forEach((card) => {
  card.addEventListener("click", () => {
    card.classList.toggle("is-open");
  });
});

// ============================================
// 流れ星: 夜空セクションに2分に1度降らせる
// ============================================
const nightSections = [
  document.querySelector(".hero"),
  document.getElementById("cta"),
].filter(Boolean);

function spawnShootingStar() {
  nightSections.forEach((section) => {
    const star = document.createElement("span");
    star.className = "shooting-star";
    // 高さはランダム（上部〜中程から流れ始める）
    star.style.top = 5 + Math.random() * 35 + "%";
    section.appendChild(star);
    star.addEventListener("animationend", () => star.remove());
  });
}

// ページを開いて少ししたら1回、その後は2分に1度
setTimeout(spawnShootingStar, 4000);
setInterval(spawnShootingStar, 120000);

// ============================================
// 予約フォーム送信 → GAS → スプレッドシート
// ============================================

// ★ GAS（ウェブアプリ）のデプロイURLをここに貼り付けてください
const GAS_ENDPOINT =
"https://script.google.com/macros/s/AKfycbyYJ1iYXV4u2NaYSDj8jGk8xyCSJsBCGJan8YQ7lWLk8LUs4D-FJA78olitfy97UgVK/exec";

const reserveForm = document.getElementById("reserveForm");

if (reserveForm) {
  const submitBtn = document.getElementById("submitBtn");
  const statusEl = document.getElementById("formStatus");

  const setStatus = (msg, type) => {
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (type ? " form-status--" + type : "");
  };

  reserveForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ハニーポット（ボットが入力したら無言で中断）
    if (reserveForm.company.value) return;

    // 必須項目の簡易チェック
    if (!reserveForm.checkValidity()) {
      reserveForm.reportValidity();
      return;
    }

    const data = {
      formType: "reservation",
      name: reserveForm.name.value.trim(),
      email: reserveForm.email.value.trim(),
      method: reserveForm.method.value,
      preferredDate: reserveForm.preferredDate.value.trim(),
      message: reserveForm.message.value.trim(),
      pageUrl: location.href,
    };

    submitBtn.disabled = true;
    setStatus("送信しています…", "");

    try {
      const res = await fetch(GAS_ENDPOINT, {
        method: "POST",
        // text/plain にすることで CORS プリフライトを回避
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
      });

      const result = await res.json().catch(() => ({ result: "error" }));

      if (res.ok && result.result === "success") {
        showThanks();
      } else {
        throw new Error(result.message || "送信に失敗しました");
      }
    } catch (err) {
      submitBtn.disabled = false;
      setStatus(
        "送信に失敗しました。お手数ですが時間をおいて再度お試しください。",
        "ng"
      );
      console.error(err);
    }
  });

  // 送信完了画面に差し替え
  function showThanks() {
    reserveForm.innerHTML = `
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
  }
}

// ============================================
// お問い合わせフォーム送信 → GAS → スプレッドシート
// ============================================

const contactForm = document.getElementById("contactForm");

if (contactForm) {
  const submitBtn = document.getElementById("contactSubmitBtn");
  const statusEl = document.getElementById("contactStatus");

  const setStatus = (msg, type) => {
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (type ? " form-status--" + type : "");
  };

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ハニーポット（ボット対策）
    if (contactForm.website.value) return;

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const data = {
      formType: "inquiry",
      name: contactForm.name.value.trim(),
      email: contactForm.email.value.trim(),
      company: contactForm.company.value.trim(),
      phone: contactForm.phone.value.trim(),
      message: contactForm.message.value.trim(),
      pageUrl: location.href,
    };

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
        contactForm.innerHTML = `
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
      } else {
        throw new Error(result.message || "送信に失敗しました");
      }
    } catch (err) {
      submitBtn.disabled = false;
      setStatus(
        "送信に失敗しました。お手数ですが時間をおいて再度お試しください。",
        "ng"
      );
      console.error(err);
    }
  });
}
