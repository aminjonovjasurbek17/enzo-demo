/* ══════════════════════════════════════════════════════════════════════
   TIL ALMASHTIRISH (2026-08-22)
   ══════════════════════════════════════════════════════════════════════

   Uch til: `uz` (lotin, ASOSIY), `uz-cyrl` (kirill), `ru` (rus).

   Asosiy til HTML'ning O'ZIDA turadi — ya'ni uzbek lotin uchun hech qanday
   lug'at yuklanmaydi va JS ishlamay qolsa ham sayt to'liq o'qiladi. Faqat
   boshqa til tanlanganda `assets/i18n/<til>.json` yuklanadi.

   Har bir tarjima qilinadigan element `data-i18n="<kalit>"` bilan
   belgilangan; atributlar esa `data-i18n-attr="alt:<kalit>;title:<kalit>"`.
   Kalitlar matn mazmunidan hisoblangan — matn o'zgarsa kalit ham o'zgaradi
   va eski tarjima ADASHIB qo'llanmaydi (jimgina eski matn qoladi, bu
   noto'g'ri tarjimadan xavfsizroq).

   ⛔ MUHIM: bu fayl `main.js` DAN OLDIN ulanadi. Sabab: `main.js`
   sarlavhalarni so'zlarga bo'lib `<span class="w">` larga o'raydi. Agar
   tarjima keyin qo'llansa, u o'sha span'larni yuvib yuborardi va
   sarlavha animatsiyasi ishlamay qolardi. */

(function () {
  'use strict';

  var TILLAR  = { 'uz': 1, 'uz-cyrl': 1, 'ru': 1 };
  var ASOSIY  = 'uz';
  var KALIT   = 'enzo-til';
  var HTML    = document.documentElement;

  /* ── Tanlangan til ────────────────────────────────────────────────────
     Ustuvorlik: URL (`?lang=ru`) → xotira → asosiy til.
     URL birinchi: mijozga to'g'ridan-to'g'ri ruscha havola berish mumkin. */
  function tanlangan() {
    var u = (location.search.match(/[?&]lang=([\w-]+)/) || [])[1];
    if (u && TILLAR[u]) return u;
    try { var x = localStorage.getItem(KALIT); if (x && TILLAR[x]) return x; } catch (e) {}
    return ASOSIY;
  }

  function saqla(til) { try { localStorage.setItem(KALIT, til); } catch (e) {} }

  /* ── Lug'atni qo'llash ─────────────────────────────────────────────── */
  function qolla(lugat) {
    var n = 0, elems = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elems.length; i++) {
      var k = elems[i].getAttribute('data-i18n');
      if (lugat[k] != null) { elems[i].innerHTML = lugat[k]; n++; }
    }
    var attrs = document.querySelectorAll('[data-i18n-attr]');
    for (var j = 0; j < attrs.length; j++) {
      var juftlar = attrs[j].getAttribute('data-i18n-attr').split(';');
      for (var p = 0; p < juftlar.length; p++) {
        var q = juftlar[p].split(':');
        if (q.length === 2 && lugat[q[1]] != null) attrs[j].setAttribute(q[0], lugat[q[1]]);
      }
    }
    return n;
  }

  /* ── Til belgisi ──────────────────────────────────────────────────────
     `lang` atributi ekran o'quvchi va brauzerning tinish belgilari uchun.
     Kirill ham, lotin ham o'zbekcha — ikkalasi `uz`, farqi yozuvda. */
  function belgila(til) {
    HTML.setAttribute('lang', til === 'ru' ? 'ru' : 'uz');
    HTML.setAttribute('data-til', til);
    var tugmalar = document.querySelectorAll('.lang__opt');
    for (var i = 0; i < tugmalar.length; i++) {
      var oz = tugmalar[i].getAttribute('data-lang') === til;
      tugmalar[i].classList.toggle('is-active', oz);
      if (oz) tugmalar[i].setAttribute('aria-current', 'true');
      else tugmalar[i].removeAttribute('aria-current');
    }
  }

  /* ── Yuklash ──────────────────────────────────────────────────────────
     Sessiya xotirasida saqlanadi: bir sahifadan ikkinchisiga o'tganda
     yoki qayta yuklanganda tarmoqqa ikkinchi marta chiqilmaydi. */
  function yukla(til) {
    var s = null;
    try { s = sessionStorage.getItem('enzo-lugat-' + til); } catch (e) {}
    if (s) { try { return Promise.resolve(JSON.parse(s)); } catch (e) {} }

    return fetch('assets/i18n/' + til + '.json', { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (matn) {
        try { sessionStorage.setItem('enzo-lugat-' + til, matn); } catch (e) {}
        return JSON.parse(matn);
      });
  }

  /* ── Almashtirish ─────────────────────────────────────────────────────
     Sahifa QAYTA YUKLANADI. Sabab: sayt ishga tushganda sarlavhalarni
     so'zlarga bo'ladi, kalkulyator ro'yxatlarini quradi va kuzatuvchilarni
     o'rnatadi. Matnni joyida almashtirish bularning hammasini qayta
     tiklashni talab qilardi — qayta yuklash soddaroq va ishonchliroq. */
  function almashtir(til) {
    if (!TILLAR[til]) return;
    saqla(til);
    var manzil = location.pathname + (til === ASOSIY ? '' : '?lang=' + til) + location.hash;
    location.replace(manzil);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.lang__opt');
    if (!t) return;
    e.preventDefault();
    almashtir(t.getAttribute('data-lang'));
  });

  /* ── Ishga tushirish ──────────────────────────────────────────────────
     Asosiy tilda hech narsa qilinmaydi — HTML allaqachon o'sha tilda.
     Boshqa tilda: lug'at kelguncha sahifa yashiriladi (`is-tarjima`),
     aks holda ko'z bir zumga o'zbekcha matnni ilg'ab qoladi. */
  /* `main.js` SHU YERDAN ulanadi, HTML'dan emas.

     Sabab: `main.js` ishga tushishi bilan sarlavhalarni so'zlarga bo'lib
     `<span class="w">` larga o'raydi, kalkulyator ro'yxatlarini quradi va
     kuzatuvchilarni o'rnatadi. Agar tarjima undan KEYIN qo'llansa,
     `innerHTML` almashtirilganda o'sha span'lar yuvilib ketardi va
     sarlavha animatsiyasi ishlamay qolardi.

     Shuning uchun tartib qat'iy: avval tarjima, keyin `main.js`.

     Kesh belgisi (`?v=…`) shu faylning o'z manzilidan olinadi — ikki
     joyda ikki xil raqam qolib ketmasin. */
  var MENING_SRC = (document.currentScript && document.currentScript.src) || '';

  var til = tanlangan();
  belgila(til);

  if (til === ASOSIY) { ishgaTushirXavfsiz(); return; }

  HTML.classList.add('is-tarjima');
  /* Ikki lugʻat: sahifa matni (`<til>.json`) va JS ichidagi matnlar
     (`js-<til>.json` — hudud roʻyxati, kalkulyator xabarlari). Ikkinchisi
     `main.js` ishga tushishidan OLDIN oynaga qoʻyiladi, chunki hudud
     roʻyxati sahifa qurilayotganda bir marta yasaladi. */
  Promise.all([yukla(til), yukla('js-' + til)])
    .then(function (r) { qolla(r[0]); window.ENZO_JS_LUGAT = r[1]; })
    .catch(function (xato) {
      /* Lug'at kelmasa sayt o'zbekcha qoladi — bu ishlamay qolishdan
         yaxshiroq. Xato konsolga yoziladi, foydalanuvchiga emas. */
      if (window.console) console.warn('[i18n] lugʻat yuklanmadi:', til, xato);
    })
    .then(function () {
      HTML.classList.remove('is-tarjima');
      ishgaTushirXavfsiz();
    });

  function ishgaTushirXavfsiz() {
    var s = document.createElement('script');
    s.src = MENING_SRC ? MENING_SRC.replace(/i18n\.js/, 'main.js') : 'js/main.js';
    document.body.appendChild(s);
  }
})();
