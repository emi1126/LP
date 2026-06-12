// ========== チェックリスト：チェック数のカウント表示 ==========
const checkboxes = document.querySelectorAll('.check-item input[type="checkbox"]');
const resultBox = document.getElementById('checklistResult');
const countEl = document.getElementById('checkCount');

function updateCheckCount() {
  const count = [...checkboxes].filter((cb) => cb.checked).length;
  countEl.textContent = count;
  resultBox.hidden = count === 0;
}
checkboxes.forEach((cb) => cb.addEventListener('change', updateCheckCount));

// ========== スクロールフェードイン ==========
const fadeTargets = document.querySelectorAll(
  '.section__title, .section__sub, .check-item, .empathy-conclusion, ' +
  '.tangle-visual__item, .depth-card, .problem-conclusion, ' +
  '.benefit-card, .service-step, .voice-card, .compare-card, ' +
  '.faq-item, .price-box, .gift-box, .cta__message, .next-visual__step'
);
fadeTargets.forEach((el) => el.classList.add('fade-in'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-shown');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);
fadeTargets.forEach((el) => observer.observe(el));

// カード類は兄弟要素の順に少しずつ遅延させ、波のように表示する
document
  .querySelectorAll('.benefit-grid, .voice-grid, .compare-grid, .checklist, .next-visual')
  .forEach((grid) => {
    [...grid.children].forEach((child, i) => {
      const target = child.classList.contains('fade-in') ? child : child.querySelector('.fade-in');
      if (target) target.style.transitionDelay = `${i * 0.08}s`;
    });
  });

// ========== 追従CTAバー：FVを過ぎたら表示、CTAセクション付近では隠す ==========
const stickyCta = document.getElementById('stickyCta');
const hero = document.querySelector('.hero');
const ctaSection = document.getElementById('cta');

function updateStickyCta() {
  const heroBottom = hero.getBoundingClientRect().bottom;
  const ctaRect = ctaSection.getBoundingClientRect();
  const ctaInView = ctaRect.top < window.innerHeight && ctaRect.bottom > 0;
  stickyCta.classList.toggle('is-visible', heroBottom < 0 && !ctaInView);
}
window.addEventListener('scroll', updateStickyCta, { passive: true });
updateStickyCta();
