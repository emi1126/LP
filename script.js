// ============================================
// 心の整理室 LP - インタラクション
// ============================================

// スクロールフェードイン
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".fade-up").forEach((el, i) => {
  // 同一セクション内で少しずつ遅延をつける
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  observer.observe(el);
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
const ctaSection = document.getElementById("cta");

function updateStickyCta() {
  if (!stickyCta || !hero) return;
  const heroBottom = hero.getBoundingClientRect().bottom;
  let nearCta = false;
  if (ctaSection) {
    const rect = ctaSection.getBoundingClientRect();
    nearCta = rect.top < window.innerHeight && rect.bottom > 0;
  }
  if (heroBottom < 0 && !nearCta) {
    stickyCta.classList.add("is-shown");
  } else {
    stickyCta.classList.remove("is-shown");
  }
}

window.addEventListener("scroll", updateStickyCta, { passive: true });
updateStickyCta();
