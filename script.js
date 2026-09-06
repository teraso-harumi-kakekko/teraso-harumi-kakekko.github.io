/* =========================================================
   晴海かけっこ教室 - script.js
========================================================= */

/* ▼▼▼ 設定（公開前に必ず確認してください） ▼▼▼ */
// 体験申込フォーム・お問い合わせの送信先メールアドレス。
// 例: const CONTACT_EMAIL = "harumi.kakekko@gmail.com";
// 空のままだとフォームは案内メッセージを表示し、メール送信は行いません。
const CONTACT_EMAIL = "terasosports.gw@gmail.com";
/* ▲▲▲ 設定ここまで ▲▲▲ */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- モバイルナビ ---------- */
  const navToggle = document.getElementById("navToggle");
  const globalNav = document.getElementById("globalNav");

  if (navToggle && globalNav) {
    navToggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
    // メニュー内リンクをタップしたら閉じる
    globalNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        document.body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- ヘッダーの影・追従ボタン ---------- */
  const header = document.getElementById("siteHeader");
  const floatingCta = document.getElementById("floatingCta");
  const toTop = document.getElementById("toTop");
  const trialSection = document.getElementById("trial");

  let trialInView = false;
  if (trialSection && "IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        trialInView = entries[0].isIntersecting;
        updateScrollUI();
      },
      { threshold: 0.05 }
    ).observe(trialSection);
  }

  function updateScrollUI() {
    const y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 10);
    // 体験セクション表示中は追従CTAを隠す（重複表示を防ぐ）
    if (floatingCta) floatingCta.classList.toggle("show", y > 550 && !trialInView);
    if (toTop) toTop.classList.toggle("show", y > 900);
  }
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  updateScrollUI();

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- スクロール出現アニメーション ---------- */
  const revealItems = document.querySelectorAll(".reveal");
  // 初期表示範囲内の要素は即時表示（IntersectionObserverの発火を待たない）
  revealItems.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add("visible");
  });
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach((el) => {
      if (!el.classList.contains("visible")) revealObserver.observe(el);
    });
  } else {
    revealItems.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- お問い合わせメール表示 ---------- */
  const mailRow = document.getElementById("contactMailRow");
  const mailLink = document.getElementById("contactMailLink");
  if (CONTACT_EMAIL && mailRow && mailLink) {
    mailRow.hidden = false;
    mailLink.href = "mailto:" + CONTACT_EMAIL;
    mailLink.textContent = CONTACT_EMAIL;
  }

  /* ---------- 体験申込フォーム（メール作成） ---------- */
  const form = document.getElementById("trialForm");
  const formError = document.getElementById("formError");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // 必須チェック
      if (!form.checkValidity()) {
        if (formError) {
          formError.hidden = false;
          formError.textContent = "未入力の必須項目があります。ご確認ください。";
        }
        form.reportValidity();
        return;
      }

      if (!CONTACT_EMAIL) {
        if (formError) {
          formError.hidden = false;
          formError.textContent =
            "申し訳ありません。フォームは現在準備中です。お手数ですが、LINEからお申し込みください。";
        }
        return;
      }

      const v = (id) => (document.getElementById(id) ? document.getElementById(id).value.trim() : "");
      const subject = `【体験レッスン申込】${v("fChild")}（${v("fGrade")}）`;
      const body = [
        "晴海かけっこ教室 体験レッスンを申し込みます。",
        "",
        `■保護者のお名前：${v("fParent")}`,
        `■お子さまのお名前：${v("fChild")}`,
        `■学年：${v("fGrade")}`,
        `■ご連絡先：${v("fContact")}`,
        `■ご希望日：${v("fDate") || "（未定・相談したい）"}`,
        "",
        "■ご質問・ご相談：",
        v("fMessage") || "（特になし）",
      ].join("\n");

      if (formError) formError.hidden = true;
      window.location.href =
        "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------- コピーライト年 ---------- */
  const copyYear = document.getElementById("copyYear");
  if (copyYear) copyYear.textContent = String(new Date().getFullYear());
});
