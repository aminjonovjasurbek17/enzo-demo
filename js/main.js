/* ENZO GROUP — main.js */

(function () {
  'use strict';

  /* Bu IIFE ichida bir necha blok ketma-ket turadi. Biri yo'q elementga
     murojaat qilib xato bersa, KEYINGILARI ham ishga tushmaydi — shu jumladan
     kalkulyator. Shuning uchun har blok o'z elementini avval tekshiradi.
     (2026-08-21 da aniqlandi: kalkulyatorni alohida sahifaga ko'chirganda
     sarhad yo'qligi butun skriptni to'xtatib qo'ygandi.) */

  /* 1 · Header — scroll'da oq fonga o'tadi (DESIGN.md §6.6) */
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* 2 · Mobil menyu */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');

  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Yopish' : 'Menyu');
    };

    burger.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
    });
  }

  /* 3 · FAQ akkordeon — bir vaqtda bittasi ochiladi (DESIGN.md §6.4) */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq__item'));
  faqItems.forEach(function (item) {
    var q = item.querySelector('.faq__q');
    q.addEventListener('click', function () {
      var open = item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('.faq__sign').textContent = '+';
      });
      if (!open) {
        item.classList.add('is-open');
        item.querySelector('.faq__sign').textContent = '−';
      }
    });
  });

  /* 4 · Kalkulyator
     ⚠️ Koeffitsiyentlar TO'LDIRGICH — mijozdan aniq narx formulasi olinadi.
        Vazifasi: interfeys va holatlarni ko'rsatish.

     Model: har mahsulotning O'Z o'lchov savoli bor (mijoz talabi 2026-08-18).
     Umumiy zanjir: mahsulot → o'lchov → miqdor → yetkazish manzili
     (viloyat → shahar/tuman). Masofa slayderi olib tashlandi: mijoz km ni
     bilmaydi, manzilni biladi. */
  var calc = document.getElementById('calc');
  if (calc) {
    var $ = function (id) { return document.getElementById(id); };

    /* Yetkazish zonalari — zavod Farg'ona viloyati, Quvasoyda.
       zona: 1 = vodiy, 2 = markaz, 3 = uzoq. Tarif to'ldirgich. */
    var REGIONS = [
      ['Fargʻona viloyati', 1, ['Fargʻona shahri','Quvasoy','Margʻilon','Qoʻqon','Quva','Rishton','Bagʻdod','Beshariq','Buvayda','Dangʻara','Fargʻona tumani','Furqat','Oltiariq','Oʻzbekiston tumani','Soʻx','Toshloq','Uchkoʻprik','Yozyovon']],
      ['Andijon viloyati', 1, ['Andijon shahri','Xonobod','Asaka','Shahrixon','Andijon tumani','Baliqchi','Boʻston','Buloqboshi','Izboskan','Jalaquduq','Marhamat','Oltinkoʻl','Paxtaobod','Qoʻrgʻontepa','Ulugʻnor']],
      ['Namangan viloyati', 1, ['Namangan shahri','Chust','Chortoq','Kosonsoy','Pop','Toʻraqoʻrgʻon','Uchqoʻrgʻon','Uychi','Yangiqoʻrgʻon','Mingbuloq','Namangan tumani','Norin']],
      ['Toshkent shahri', 2, ['Bektemir','Chilonzor','Mirobod','Mirzo Ulugʻbek','Olmazor','Sergeli','Shayxontohur','Uchtepa','Yakkasaroy','Yashnobod','Yunusobod','Yangihayot']],
      ['Toshkent viloyati', 2, ['Nurafshon','Angren','Olmaliq','Chirchiq','Bekobod','Yangiyoʻl','Ohangaron','Boʻka','Boʻstonliq','Chinoz','Qibray','Parkent','Piskent','Quyichirchiq','Oʻrtachirchiq','Yuqorichirchiq','Zangiota','Oqqoʻrgʻon']],
      ['Sirdaryo viloyati', 2, ['Guliston','Shirin','Yangiyer','Boyovut','Sardoba','Sayxunobod','Sirdaryo tumani','Mirzaobod','Oqoltin','Xovos']],
      ['Jizzax viloyati', 2, ['Jizzax shahri','Gʻallaorol','Doʻstlik','Zomin','Sharof Rashidov tumani','Baxmal','Forish','Mirzachoʻl','Paxtakor','Yangiobod','Zafarobod','Arnasoy']],
      ['Samarqand viloyati', 2, ['Samarqand shahri','Kattaqoʻrgʻon','Urgut','Bulungʻur','Ishtixon','Jomboy','Narpay','Nurobod','Oqdaryo','Paxtachi','Payariq','Pastdargʻom','Qoʻshrabot','Samarqand tumani','Tayloq']],
      ['Qashqadaryo viloyati', 3, ['Qarshi','Shahrisabz','Kitob','Gʻuzor','Koson','Kasbi','Chiroqchi','Dehqonobod','Mirishkor','Muborak','Nishon','Qamashi','Yakkabogʻ']],
      ['Surxondaryo viloyati', 3, ['Termiz','Denov','Sherobod','Shoʻrchi','Boysun','Angor','Bandixon','Jarqoʻrgʻon','Muzrabot','Oltinsoy','Qiziriq','Qumqoʻrgʻon','Sariosiyo','Uzun']],
      ['Buxoro viloyati', 3, ['Buxoro shahri','Kogon','Gʻijduvon','Vobkent','Olot','Jondor','Qorakoʻl','Qorovulbozor','Peshku','Romitan','Shofirkon']],
      ['Navoiy viloyati', 3, ['Navoiy shahri','Zarafshon','Gʻazgʻon','Karmana','Konimex','Xatirchi','Navbahor','Nurota','Qiziltepa','Tomdi','Uchquduq']],
      ['Xorazm viloyati', 3, ['Urganch','Xiva','Bogʻot','Gurlan','Xonqa','Hazorasp','Qoʻshkoʻpir','Shovot','Urganch tumani','Yangiariq','Yangibozor','Tuproqqalʼa']],
      ['Qoraqalpogʻiston Respublikasi', 3, ['Nukus','Xoʻjayli','Beruniy','Chimboy','Ellikqalʼa','Kegeyli','Moʻynoq','Qanlikoʻl','Qoʻngʻirot','Qoraoʻzak','Shumanay','Taxtakoʻpir','Toʻrtkoʻl','Amudaryo','Boʻzatov']]
    ];
    /* Yetkazib berish narxi kalkulyatorda hisoblanmaydi — mijoz aytdi:
       yo'lkira narxi tez-tez o'zgaradi va hudud bo'yicha alohida
       kelishiladi. Xulosada shu jumla ko'rsatiladi. */
    var SHIP_TEXT = 'Hududga qarab alohida kelishiladi';

    /* ═══ NARXLAR — mijoz roʻyxatidan (2026-08-21) ═══════════════════════
       Avval bu yerda to'ldirgich koeffitsiyentlar turardi. Endi raqamlar
       mijoz bergan narx varaqlaridan.

       ⚠️ ПБ plitalari va ЛИ novlari uchun narx varaqi hali yo'q: ular
       «menejer hisoblab beradi» holatida qoladi (narx 0). */

    /* Shifer — bitta o'lcham, ikki xil mahsulot. Faqat dona bo'yicha
       hisoblanadi (mijoz talabi) — m² ga o'tkazish ko'rsatilmaydi. */
    var SHIFER = { enzo: 43500, chek: 45000 };

    /* Tayyor beton — 1 m³, marka bo'yicha.
       Ro'yxatda M100…M400 bor. M450 va M500 sotuvda bor, lekin narx
       varaqida yo'q — ular menejerga uzatiladi. */
    var BETON = {
      M100: 345000, M150: 365000, M200: 370000, M250: 390000,
      M300: 420000, M350: 450000, M400: 485000
    };

    /* Sement — mijoz narxlari (2026-08-21), bir tonna uchun.
       Qop (50 kg) narxi shundan chiqariladi: tonna / 20. */
    var SEMENT_T = {
      'optima-naval': 530000, 'optima-qop': 570000,
      'extra-naval':  560000, 'extra-qop':  630000
    };

    /* 2ПК ko'p bo'shliqli plita — uzunlik (m) va kenglik (m) bo'yicha.
       Kalit: 'uzunlik_kenglik'. Manba: mijozning «2 ПК (Арматуралик)»
       narx varaqi. */
    var PK2 = {
      '1.9_1.2': 655000,  '1.9_1.0': 620000,
      '2.0_1.2': 660000,  '2.0_1.0': 625000,
      '2.1_1.2': 670000,  '2.1_1.0': 635000,
      '2.2_1.2': 670000,  '2.2_1.0': 640000,
      '2.3_1.2': 680000,  '2.3_1.0': 645000,
      '2.4_1.2': 690000,  '2.4_1.0': 655000,
      '2.5_1.2': 670000,  '2.5_1.0': 660000,
      '2.6_1.2': 705000,  '2.6_1.0': 665000,
      '2.7_1.2': 715000,  '2.7_1.0': 675000,
      '2.8_1.2': 720000,  '2.8_1.0': 680000,
      '2.9_1.2': 730000,  '2.9_1.0': 685000,
      '3.0_1.2': 670000,  '3.0_1.0': 635000,
      '3.1_1.2': 805000,  '3.1_1.0': 760000,
      '3.2_1.2': 810000,  '3.2_1.0': 765000,
      '3.3_1.2': 815000,  '3.3_1.0': 770000,
      '3.4_1.2': 825000,  '3.4_1.0': 780000,
      '3.5_1.2': 830000,  '3.5_1.0': 785000,
      '3.6_1.2': 835000,  '3.6_1.0': 790000,
      '3.7_1.2': 845000,  '3.7_1.0': 800000,
      '3.8_1.2': 850000,  '3.8_1.0': 800000,
      '3.9_1.2': 860000,  '3.9_1.0': 805000,
      '4.0_1.2': 865000,  '4.0_1.0': 815000,
      '4.1_1.2': 870000,  '4.1_1.0': 820000,
      '4.2_1.2': 880000,  '4.2_1.0': 825000,
      '4.3_1.2': 890000,  '4.3_1.0': 830000,
      '4.4_1.2': 895000,  '4.4_1.0': 835000,
      '4.5_1.2': 900000,  '4.5_1.0': 840000,
      '4.6_1.2': 905000,  '4.6_1.0': 850000,
      '4.7_1.2': 915000,  '4.7_1.0': 860000,
      '4.8_1.2': 1105000, '4.8_1.0': 1050000,
      '4.9_1.2': 1115000, '4.9_1.0': 1055000,
      '5.0_1.2': 1120000, '5.0_1.0': 1060000,
      '5.1_1.2': 1130000, '5.1_1.0': 1065000,
      '5.2_1.2': 1135000, '5.2_1.0': 1070000,
      '5.3_1.2': 1140000, '5.3_1.0': 1080000,
      '5.4_1.2': 1150000, '5.4_1.0': 1090000,
      '5.5_1.2': 1160000, '5.5_1.0': 1090000,
      '5.6_1.2': 1160000, '5.6_1.0': 1095000,
      '5.7_1.2': 1170000, '5.7_1.0': 1100000,
      '5.8_1.2': 1175000, '5.8_1.0': 1105000,
      '5.9_1.2': 1190000, '5.9_1.0': 1110000,
      '6.0_1.2': 1560000, '6.0_1.0': 1485000,
      '6.1_1.2': 1565000, '6.1_1.0': 1490000,
      '6.2_1.2': 1570000, '6.2_1.0': 1495000,
      '6.3_1.2': 1580000, '6.3_1.0': 1500000,
      '6.4_1.2': 1600000, '6.4_1.0': 1515000,
      '6.5_1.2': 1600000, '6.5_1.0': 1520000,
      '6.6_1.2': 1740000, '6.6_1.0': 1660000,
      '6.7_1.2': 1745000, '6.7_1.0': 1665000,
      '6.8_1.2': 1750000, '6.8_1.0': 1670000,
      '6.9_1.2': 1760000, '6.9_1.0': 1675000,
      '7.0_1.2': 1765000, '7.0_1.0': 1685000,
      '7.1_1.2': 1775000, '7.1_1.0': 1690000
    };

    /* 2ПК o'lchov ro'yxatini HTML'da qo'lda yozish 108 qator bo'lardi —
       jadvalning o'zidan tuziladi. Tartib: uzunlik o'sib boradi, har
       uzunlikda avval 1,2 m keyin 1,0 m. */
    var elPk2 = $('c-pk2');
    if (elPk2) {
      Object.keys(PK2).forEach(function (k) {
        var qism = k.split('_');
        var o = document.createElement('option');
        o.value = k;
        o.textContent = qism[0].replace('.', ',') + ' × ' + qism[1].replace('.', ',') + ' m';
        elPk2.appendChild(o);
      });
      elPk2.value = '6.0_1.2';   // eng ko'p so'raladigan o'lcham
    }

    var fmt = function (n) {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };
    var val = function (x, q) { return typeof x === 'function' ? x(q) : x; };

    /* Mahsulot ta'riflari: o'z o'lchov savoli, birligi, bir birlik narxi va
       bitta reysga sig'adigan miqdori (yetkazish reyslarini sanash uchun). */
    var P = {
      shifer: {
        nom: 'Shifer', field: 'f-shifer', sel: 'c-shifer', birlik: 'dona', boshl: 100,
        narx: function () { return SHIFER[$('c-shifer').value] || 0; },
        izoh: function () { return 'Narx bitta varaq uchun hisoblangan'; }
      },
      sement: {
        nom: 'Sement', field: 'f-sement', sel: 'c-sement', boshl: 100,
        naval: function () { return $('c-sement').value.indexOf('naval') > -1; },
        birlik: function () { return P.sement.naval() ? 'tonna' : 'qop (50 kg)'; },
        narx: function () {
          var t = SEMENT_T[$('c-sement').value] || 0;
          return P.sement.naval() ? t : t / 20;   /* qop = 50 kg */
        },
        izoh: function (q) {
          return P.sement.naval()
            ? 'Naval sement sement-voz bilan tashiladi, eng kam partiya 25 t'
            : 'Ogʻirligi ≈ ' + fmt(q * 0.05) + ' tonna';
        }
      },
      beton: {
        nom: 'Tayyor beton', field: 'f-marka', sel: 'c-marka', birlik: 'm³', boshl: 10,
        /* Narx varaqida M100…M400 bor. M450 va M500 bo'sh qaytaradi —
           kalkulyator ularni «menejer hisoblab beradi» holatiga o'tkazadi. */
        narx: function () { return BETON[$('c-marka').value] || 0; },
        izoh: function (q) { return Math.ceil(q / 10) + ' ta mikser reysi (har biri 10 m³)'; }
      },
      jbi: {
        nom: 'Temir-beton buyumlar', field: 'f-jbi', sel: 'c-jbi', birlik: 'dona', boshl: 10,
        /* 2ПК — o'lchov jadvalidan. Qolganlari uchun narx varaqi hali
           yo'q (ПБ, ЛИ, ЦТ): ular 0 qaytaradi va menejerga uzatiladi. */
        narx: function () {
          if ($('c-jbi').value !== 'pk2') return 0;
          return PK2[$('c-pk2') ? $('c-pk2').value : ''] || 0;
        },
        izoh: function () { return 'Aniq pozitsiya (uzunlik, yuklama) menejer bilan tasdiqlanadi'; }
      }
    };

    /* Viloyat ro'yxati va unga bog'liq tuman ro'yxati */
    var elRegion = $('c-region'), elDistrict = $('c-district');
    REGIONS.forEach(function (r, i) {
      var o = document.createElement('option');
      o.value = String(i); o.textContent = r[0];
      elRegion.appendChild(o);
    });
    var fillDistricts = function () {
      elDistrict.textContent = '';
      REGIONS[+elRegion.value][2].forEach(function (d) {
        var o = document.createElement('option');
        o.value = d; o.textContent = d;
        elDistrict.appendChild(o);
      });
    };
    fillDistricts();

    var elProduct = $('c-product'), elQty = $('c-qty');

    /* Natija paneli — «Bilmayman» holatida ko'rinishi o'zgaradi.
       Kalkulyator formasining yonidan olinadi: mahsulot sahifalarida ham
       bitta juftlik bo'ladi, hujjatdagi birinchi mos elementga tayanmaymiz. */
    var calcResult = calc.parentElement.querySelector('.calc__result') ||
                     document.createElement('div');

    /* Natija sarlavhasi. Kalkulyator besh sahifada takrorlanadi — biror
       nusxada element yetishmasa, butun update() yiqilmasligi kerak. */
    var elCap = $('c-cap') || document.createElement('p');

    /* Mahsulot sahifasida kalkulyator o'sha mahsulot bilan ochiladi
       (PROMPT.md §6.1). /beton da 'Tayyor beton', /shifer da 'Shifer'. */
    var boshlangich = calc.getAttribute('data-default');
    if (boshlangich && P[boshlangich]) { elProduct.value = boshlangich; }
    var FIELDS = ['f-shifer', 'f-sement', 'f-marka', 'f-jbi'];
    var prevKey = null;

    var update = function () {
      var p = P[elProduct.value];

      /* Faqat tanlangan mahsulotning o'lchov savoli ko'rinadi */
      FIELDS.forEach(function (id) { $(id).hidden = (id !== p.field); });

      /* 2ПК o'lchami — qo'shimcha savol, faqat o'sha turkum tanlanganda.
         Boshqa turkumlarda (ПБ, ЛИ, ЦТ) o'lcham savoli ma'nosiz. */
      var fPk2 = $('f-pk2');
      if (fPk2) fPk2.hidden = !(elProduct.value === 'jbi' && $('c-jbi').value === 'pk2');

      /* Mahsulot almashsa, miqdor shu mahsulot uchun mantiqiy qiymatdan
         boshlanadi — 100 dona shifer 100 m³ beton bilan bir narsa emas */
      if (prevKey !== elProduct.value) { elQty.value = p.boshl; prevKey = elProduct.value; }

      var qty = Math.max(1, Math.floor(+elQty.value || 1));
      var birlik = val(p.birlik);
      var sel = $(p.sel);

      /* «Bilmayman» — o'lchov savoliga javob berolmagan xaridor. Hisob
         to'xtaydi, lekin ariza yo'li ochiq qoladi: miqdor va manzil
         menejerga baribir yetib boradi.

         Ikki holat menejerga uzatiladi:
           · xaridor «Bilmayman» degan;
           · tanlangan pozitsiya uchun bizda narx yo'q (ПБ plitalari,
             ЛИ novlari, M450/M500 beton — narx varaqi hali kelmagan).
         Ikkalasida ham taxminiy raqam KO'RSATILMAYDI: «taxminan» deb
         yozilgan noto'g'ri raqam raqamsizlikdan yomonroq. */
      var noaniq = (!p.text && sel.value === '?') || val(p.narx) <= 0;

      $('v-unit').textContent = birlik;
      calcResult.classList.toggle('is-noaniq', noaniq);

      $('o-product').textContent = p.nom;
      $('o-qty').textContent  = fmt(qty) + ' ' + birlik;
      $('o-addr').textContent = elDistrict.value + ', ' + REGIONS[+elRegion.value][0];

      if (noaniq) {
        $('c-hint').textContent = 'Muammo emas — miqdor va manzilni qoldiring, menejer mos turini tanlab, aniq narxni beradi.';
        elCap.textContent = 'Bu tanlov uchun narx tanlangan turga bogʻliq';
        $('c-price').textContent = 'Menejer hisoblab beradi';
        $('o-spec').textContent = 'Menejer bilan aniqlanadi';
        $('o-ship').textContent = SHIP_TEXT;
        return;
      }

      var tovar = val(p.narx) * qty;

      $('c-hint').textContent = p.izoh(qty);
      elCap.textContent = 'Sizning konfiguratsiyangiz uchun taxminiy narx';
      $('c-price').textContent = fmt(tovar) + ' soʻm';
      /* 2ПК da pozitsiyani ikki savol belgilaydi — turkum va o'lcham.
         Xulosada ikkalasi ham ko'rinishi kerak, aks holda mijoz qaysi
         plitaning narxini ko'rayotganini bilmaydi. */
      var spec = sel.options[sel.selectedIndex].textContent;
      if (elProduct.value === 'jbi' && $('c-jbi').value === 'pk2' && elPk2) {
        spec = '2ПК ' + elPk2.options[elPk2.selectedIndex].textContent;
      }
      $('o-spec').textContent = spec;
      $('o-ship').textContent = SHIP_TEXT;
    };

    /* Mahsulot kartochkasidagi «Narxni bilib oling» kalkulyatorga tushiradi va
       o'sha mahsulotni oldindan tanlaydi (PROMPT.md §858). Foydalanuvchi shifer
       haqida o'qib turib bosgan bo'lsa, kalkulyatorda betonni ko'rmasligi kerak. */
    document.querySelectorAll('[data-calc]').forEach(function (a) {
      a.addEventListener('click', function () {
        var k = a.getAttribute('data-calc');
        if (P[k]) { elProduct.value = k; update(); }
      });
    });

    elRegion.addEventListener('change', function () { fillDistricts(); update(); });
    calc.addEventListener('input', update);
    calc.addEventListener('change', update);
    update();
  }

  /* 6 · Paydo bo'lish (DESIGN.md §8) */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  /* Pog'onali paydo bo'lish (stagger).
     `data-stagger` atributi qo'yilgan konteynerning bolalari birin-ketin
     chiqadi — kechikish ularning o'z tartibidan hisoblanadi.

     Nima uchun tartib ota-elementdan olinadi: IntersectionObserver bir necha
     element bir vaqtda ko'ringanda ularni bitta `entries` ro'yxatida ham,
     alohida-alohida ham berishi mumkin. Ro'yxatdagi indeksga tayanilsa,
     kechikish tasodifiy bo'lib qoladi — qator ba'zan birdan chiqadi. */
  var STEP = 90;   // ms, DESIGN.md §8

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var group = el.parentElement;
      var idx = 0;

      if (group && group.hasAttribute('data-stagger')) {
        idx = Array.prototype.indexOf.call(group.children, el);
      }

      setTimeout(function () { el.classList.add('is-in'); }, idx * STEP);
      io.unobserve(el);
    });
  /* Kuzatuv chegarasi.
     ✎ Chegara pasaytirildi (mijoz qarori, 2026-08-21): avval element
     balandligining 12% i ko'rinishi VA pastdan 8% ichkariga kirishi
     kerak edi. Baland bloklarda («Nima uchun ENZO» bento kartochkalari)
     bu shuni anglatardiki, kartochka ekranda turgan bo'lsa ham hali
     ko'rinmasdi — foydalanuvchi pastga tushib bo'lgach paydo bo'lardi.
     Endi element chetidan bir necha piksel kirishi kifoya. */
  }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });

  items.forEach(function (el) { io.observe(el); });
})();


/* 7 · Galereya · kartochkalar to'plami (deck)
   ---------------------------------------------------------------------------
   Markazda bitta kadr, ikki yonida keyingilari kichrayib turadi. Yon kadr
   bosilsa yoki o'q tugma bosilsa — to'plam siljiydi.

   Progressiv yaxshilanish: manba HTML'da oddiy setka bo'lib turadi. JS
   ishlamasa (yoki xato bo'lsa) foydalanuvchi baribir hamma kadrni ko'radi. */
(function () {
  'use strict';

  var source = document.getElementById('deckSource');
  var deck   = document.getElementById('gallery');
  if (!source || !deck) return;

  var stage = document.getElementById('deckStage');
  var cap   = document.getElementById('deckCap');

  /* Manba setkasidan kadrlarni o'qib olamiz */
  var shots = [].slice.call(source.querySelectorAll('.shot')).map(function (fig) {
    var img = fig.querySelector('img');
    var cp  = fig.querySelector('figcaption');
    return {
      src:   img ? img.getAttribute('src') : '',
      alt:   img ? img.getAttribute('alt') : '',
      ph:    fig.querySelector('.ph').getAttribute('data-ph') || '',
      label: cp ? cp.textContent : ''
    };
  });
  if (shots.length < 3) return;

  var VISIBLE = 2;      // markazdan ikki yonda nechta kadr ko'rinadi

  /* Har bir kadr o'z DOM elementiga BIR MARTA bog'lanadi va shundayligicha
     qoladi — siljiganda faqat pozitsiya o'zgaradi. Aks holda kartochka
     joyini o'zgartirayotganda rasmi ham almashib, ko'z uzilib qolardi. */
  shots.forEach(function (s) {
    var el = document.createElement('figure');
    el.className = 'deck__card';

    /* `ph` klassi ichki elementda — kartochkaning o'zida emas.
       Sabab: `.ph` ga tegishli umumiy qoidalar kartochkaning
       `position:absolute` ini bosib ketardi. Ajratilgan holda barqaror.
    */
    var box = document.createElement('span');
    box.className = 'ph deck__ph';
    box.setAttribute('data-ph', s.ph);

    var img = document.createElement('img');
    img.src = s.src; img.alt = s.alt; img.loading = 'lazy';

    box.appendChild(img);
    el.appendChild(box);
    stage.appendChild(el);
    s.el = el;
  });

  var order = shots.slice();

  var dragPx = 0;       // surish paytidagi vaqtinchalik siljish

  var place = function () {
    var mid = Math.floor(order.length / 2);

    order.forEach(function (shot, i) {
      var el = shot.el;
      var pos = i - mid;
      var far = Math.abs(pos);
      var hidden = far > VISIBLE;

      el.style.zIndex = String(shots.length - far);

      /* ✎ Yon kadr SHAFFOF emas, oq parda bilan xiralashadi (2026-08-19).
         Avval `opacity` butun elementga qo'yilardi. To'ldirgichlar bo'sh
         kulrang bo'lgani uchun bu bilinmagan; real fotolar qo'yilgach yon
         kadrlar bir-biridan ko'rinib, ikki ekspozitsiyaga o'xshab qoldi.
         Endi element to'liq noshaffof — yaqin kadr uzoqni toza yopadi,
         uzoqlik esa `--veil` (::after dagi oq qatlam) bilan beriladi. */
      el.style.opacity = hidden ? '0' : '1';
      el.style.setProperty('--veil', String(far * 0.34));
      el.style.pointerEvents = hidden || far === 0 ? 'none' : 'auto';
      el.style.transform =
        'translateX(-50%) translateX(' + (pos * 46) + '%)' +
        (dragPx ? ' translateX(' + dragPx + 'px)' : '') +
        ' scale(' + (1 - far * 0.09) + ')';
      el.classList.toggle('is-center', far === 0);

      /* Yon kadrni bosish uni markazga olib keladi.
         Surishdan keyingi "bosish" hodisasi hisobga olinmaydi. */
      el.onclick = far ? function () { if (!moved) move(pos); } : null;
    });

    cap.textContent = order[mid].label;
  };

  var move = function (steps) {
    var n = Math.abs(steps);
    while (n--) {
      if (steps > 0) order.push(order.shift());
      else order.unshift(order.pop());
    }
    place();
  };

  [].forEach.call(document.querySelectorAll('[data-deck]'), function (btn) {
    btn.addEventListener('click', function () {
      move(parseInt(btn.getAttribute('data-deck'), 10));
    });
  });

  /* --- Sichqoncha bilan surish va barmoq bilan yonga tortish -------------
     Pointer Events uchalasini ham qamrab oladi: sichqoncha, sensor, qalam.
     Surish davomida kartochkalar barmoq ortidan real vaqtda siljiydi,
     qo'yib yuborilganda esa masofaga qarab qancha qadam o'tish hisoblanadi. */
  var startX = 0, moved = false, dragging = false;

  var stepPx = function () {
    /* Bitta qadam — kartochka kengligining 46% i (place() dagi bilan bir xil).
       `offsetWidth` olinadi, `getBoundingClientRect` emas: ikkinchisi
       `scale` ni hisobga oladi va yon kartochkada kichik chiqadi. */
    return Math.max(60, shots[0].el.offsetWidth * 0.46);
  };

  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;   // faqat chap tugma
    dragging = true; moved = false; startX = e.clientX;
    stage.classList.add('is-dragging');
    if (stage.setPointerCapture) stage.setPointerCapture(e.pointerId);
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    /* Chetlarida qarshilik yo'q — ro'yxat halqa, cheksiz aylanadi */
    dragPx = dx;
    place();
  });

  var endDrag = function (e) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');

    var dx = (e && typeof e.clientX === 'number' ? e.clientX : startX) - startX;
    dragPx = 0;

    /* Masofa yarim qadamdan oshsa — o'tkaziladi. Bitta harakatda ko'pi
       bilan 2 qadam: tez surganda to'plam nazoratdan chiqib ketmasin. */
    var steps = Math.round(-dx / stepPx());
    steps = Math.max(-2, Math.min(2, steps));

    if (steps) move(steps);
    else place();

    /* `moved` bayrog'i click hodisasidan keyin tozalanadi */
    setTimeout(function () { moved = false; }, 0);
  };

  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('dragstart', function (e) { e.preventDefault(); });

  source.classList.add('is-off');
  deck.classList.add('is-on');
  place();
})();


/* 8 · Silliq scroll (DESIGN.md §8)
   ---------------------------------------------------------------------------
   ✎ QAYTARILDI (2026-08-21). 21-avgust kuni bu blok olib tashlangandi:
   sahifada YouTube iframe'i turgan ekan, u ikki narsani buzardi — ~1,3 MB
   skript asosiy oqimni band qilardi (JS scroll aynan shu oqimda ishlaydi),
   va kursor iframe ustida bo'lganda `wheel` hodisasi bizga umuman yetib
   kelmasdi, ya'ni video ustida scroll boshqacha ishlab, chetga chiqqanda
   sakrardi.

   Endi video o'z serverimizda, oddiy `<video>` tegida — begona iframe
   sahifada qolmadi. Ikkala sabab ham yo'qoldi, shuning uchun mijoz so'ragan
   silliqlik qaytarildi.

   > Agar kelajakda sahifaga yana boshqa manbadagi iframe qo'yilsa
   > (xarita, YouTube, to'lov oynasi) — shu blok qayta ko'rib chiqilsin.
   > Iframe va JS scroll bir sahifada yaxshi yashamaydi.

   Sichqoncha g'ildiragi sahifani darrov siljitmaydi — u nishonni belgilaydi,
   sahifa esa o'sha nishonga bir necha kadrda yetib boradi.

   Ataylab qilingan cheklovlar:
   · `prefers-reduced-motion` — butunlay o'chadi
   · Ctrl+g'ildirak (masshtab) va ichida o'z scroll'i bor elementlar tegilmaydi
   · sahifa `window.scrollTo` bilan siljiydi, transform bilan emas — shuning
     uchun `position:sticky` va `position:fixed` buzilmaydi
   · klaviatura, scrollbar va anchor havolalar odatdagidek ishlaydi

   Sensorli ekran uchun alohida tekshiruv KERAK EMAS: barmoq bilan surish
   `wheel` hodisasini umuman chiqarmaydi, demak bu kod u yerda ishga tushmaydi. */
(function () {
  'use strict';

  var media = window.matchMedia;
  if (!media || media('(prefers-reduced-motion: reduce)').matches) return;

  /* Sekinlashuv koeffitsienti. Kattaroq son — tezroq va yengilroq siljish. */
  var LERP = 0.115;

  var root = document.documentElement;
  var target = window.scrollY;
  var current = window.scrollY;   // o'zimiz yuritadigan kasrli pozitsiya
  var running = false;
  var last = 0;

  var limit = function () {
    return Math.max(0, root.scrollHeight - window.innerHeight);
  };

  /* G'ildirak o'z scroll'i bor element ustida bo'lsa — aralashmaymiz.
     Natija keshlanadi: `getComputedStyle` uslublarni qayta hisoblashga
     majbur qiladi, g'ildirak esa sekundiga o'nlab hodisa chiqaradi —
     keshsiz bu har aylanishda mayda taqillashga sabab bo'lardi. */
  var cache = typeof WeakMap === 'function' ? new WeakMap() : null;

  var hasOwnScroll = function (node) {
    if (cache && cache.has(node)) return cache.get(node);

    var found = false;
    var n = node;
    while (n && n.nodeType === 1 && n !== root) {
      var oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) {
        found = true;
        break;
      }
      n = n.parentNode;
    }

    if (cache) cache.set(node, found);
    return found;
  };

  var step = function (now) {
    var diff = target - current;

    if (Math.abs(diff) < 0.1) {
      current = target;
      window.scrollTo(0, current);
      root.style.scrollBehavior = '';   // anchor havolalarga CSS smooth qaytadi
      running = false;
      return;
    }

    /* Kadr tezligidan mustaqil sekinlashuv.
       Oddiy `diff * LERP` monitor chastotasiga bog'lanib qoladi: 60 Gts da
       siljish ~350ms, 144 Gts da esa ~150ms — o'yin monitorida effekt
       deyarli ko'rinmay qoladi. `1 - e^(-60·LERP·dt)` buni tenglashtiradi. */
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;

    /* Pozitsiya `current` da kasrli saqlanadi va har kadrda shu yerdan
       hisoblanadi. Avval har kadrda `window.scrollY` o'qilardi — brauzer
       esa uni butun pikselga yaxlitlaydi, ya'ni har kadrda kasr qismi
       yo'qolib, qadamlar notekis chiqardi. Aynan shu mayda taqillash edi. */
    current += diff * (1 - Math.exp(-60 * LERP * dt));
    window.scrollTo(0, current);

    requestAnimationFrame(step);
  };

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.defaultPrevented) return;

    /* Hujjatning o'zi siljimaydigan bo'lsa (masalan sahifa balandligi
       oynadan kichik, yoki sahifa iframe ichida va scroll'ni tashqi
       hujjat boshqaradi) — hech narsa qilmaymiz. `preventDefault` ham
       chaqirilmaydi, aks holda scroll butunlay to'xtab qolardi. */
    if (limit() <= 0) return;

    if (hasOwnScroll(e.target)) return;

    /* deltaMode: 0 — piksel, 1 — qator, 2 — sahifa */
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 16;
    else if (e.deltaMode === 2) d *= window.innerHeight;

    e.preventDefault();
    target = Math.min(limit(), Math.max(0, target + d));

    if (!running) {
      running = true;
      last = 0;
      current = window.scrollY;   // haqiqiy pozitsiyadan boshlanadi
      /* CSS `scroll-behavior:smooth` har bir scrollTo'ni o'zi ham
         animatsiya qilardi — ikki animatsiya ustma-ust tushmasin */
      root.style.scrollBehavior = 'auto';
      requestAnimationFrame(step);
    }
  }, { passive: false });

  /* Sahifa balandligi kod tomonidan o'zgartirilsa (masalan qadalgan
     bo'lim yo'lini yig'ishtirish), scroll ham shuncha siljishi kerak.
     Bu yerda `target` va `current` ikkalasi birga suriladi — aks holda
     silliq scroll keyingi kadrda eski nishonga qaytarib tashlardi. */
  window.__enzoScrollShift = function (dy) {
    target += dy;
    current += dy;
  };

  /* Boshqa yo'l bilan siljitilsa (klaviatura, scrollbar, anchor) — sinxron */
  window.addEventListener('scroll', function () {
    if (!running) {
      target = window.scrollY;
      current = target;
    }
  }, { passive: true });

  window.addEventListener('resize', function () {
    if (cache && typeof WeakMap === 'function') cache = new WeakMap();  // o'lchamlar o'zgardi
    target = Math.min(limit(), target);
  }, { passive: true });
})();

/* 8 · Matn ochilishi — sarlavhalar so'zma-so'z, qolgani bir butun
   ---------------------------------------------------------------------------
   Ikki sinf:
     `.t-words` — sarlavha. So'zlarga bo'linadi, har so'z `<span class="w">`
                  ichiga olinadi va `--i` tartib raqamini oladi.
     `.t-rise`  — oddiy matn bloki. Bo'linmaydi, bir butun ko'tariladi.
                  Kechikish `--d` orqali HTML'da beriladi.
   Qolganini CSS qiladi (`style.css` §13).

   Nega `textContent` bilan emas, tugunlar bo'ylab yuriladi: hero sarlavhasida
   qatorlarni ajratuvchi `<span>` lar bor. Matnni tekis olib qayta yozsak,
   o'sha qatorlar yo'qoladi va sarlavha bir uzun satrga aylanadi.

   Progressiv yaxshilanish: bu blok umuman ishlamasa ham matn manba HTML'da
   o'z holicha turadi — `.w` bo'lmasa CSS ham hech narsani yashirmaydi. */
(function () {
  'use strict';

  var heads = Array.prototype.slice.call(document.querySelectorAll('.t-words'));
  var rises = Array.prototype.slice.call(document.querySelectorAll('.t-rise'));
  var all   = heads.concat(rises);
  if (!all.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Bitta sarlavhani so'zlarga bo'ladi. `n` — hozirgi tartib raqami,
     qaytariladigan qiymat — keyingi so'z uchun raqam. */
  function split(el, n) {
    var kids = Array.prototype.slice.call(el.childNodes);

    kids.forEach(function (node) {
      if (node.nodeType === 1) {            // element — ichiga kiramiz
        n = split(node, n);
        return;
      }
      if (node.nodeType !== 3) return;      // matn tuguni emas

      var text = node.nodeValue;
      if (!text.trim()) return;

      /* Bo'shliqlarni saqlab bo'lamiz: bo'linmalarning toq indekslari —
         so'zlar, juftlari — oradagi bo'shliq. Bo'shliq matn tugun bo'lib
         qoladi, aks holda so'zlar bir-biriga yopishadi. */
      var frag  = document.createDocumentFragment();
      var parts = text.split(/(\s+)/);

      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        var span = document.createElement('span');
        span.className = 'w';
        span.style.setProperty('--i', n++);
        span.textContent = part;
        frag.appendChild(span);
      });

      node.parentNode.replaceChild(frag, node);
    });

    return n;
  }

  /* ⚠️ Faqat sarlavhalar bo'linadi. `.t-rise` bloklariga tegilmaydi —
     ular ichida tugma, SVG va band matn bor. */
  heads.forEach(function (el) { split(el, 0); });

  if (reduced) {
    all.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  /* Animatsiya tugagach `will-change` olib tashlanadi. Eng uzun yo'l:
     butun sarlavhaning kechikishi + so'zlar soni × qadam + davomiylik.
     Qiymatlar CSS'dan o'qiladi — ikki joyda takrorlanmasin. */
  function done(el) {
    var cs   = getComputedStyle(el);
    var ms   = function (name, fallback) {
      var v = parseFloat(cs.getPropertyValue(name));
      return isNaN(v) ? fallback : v;
    };
    var wait = ms('--lag', 0) + el.querySelectorAll('.w').length * ms('--step', 60)
             + ms('--dur', 640) + 80;
    setTimeout(function () { el.classList.add('is-done'); }, wait);
  }

  function show(el) { el.classList.add('is-in'); done(el); }

  /* Kirish pardasi bilan ketma-ketlik (2026-08-21).
     Muammo: parda ekranni ~2,35 s to'sib turadi, hero matni esa sahifa
     ochilishi bilan darrov ochilardi — butun animatsiya parda ORTIDA o'tib
     ketardi va parda ko'tarilganda matn allaqachon joyida turardi. Mijoz
     aytgan «herodagi matnlar animatsiya bo'lmayapti» aynan shu.

     Endi ekran tepasidagi matn parda so'na boshlashiga yaqin qo'zg'aladi —
     matn parda ortidan chiqib kelayotgandek ko'rinadi.

     1750 ms: parda 1900 ms da so'nishni boshlaydi, matn undan sal oldin
     yo'lga tushadi — ikkisi ulanib ketadi, ketma-ket sanalmaydi.

     Kechikish sinfga bog'langan: parda bo'lmasa (has-intro yo'q — takroriy
     tashrif, ichki havola, harakat kamaytirilgan) kechikish ham nolga teng. */
  var introWait = document.documentElement.classList.contains('has-intro') ? 1750 : 0;

  function atStart(el) {
    if (!introWait) { show(el); return; }
    setTimeout(function () { show(el); }, introWait);
  }

  if (!('IntersectionObserver' in window)) {
    all.forEach(show);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      show(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  all.forEach(function (el) {
    /* Ekran tepasidagi matn (hero) kuzatuvni kutmaydi — sahifa ochilishi
       bilan chiqadi. Aks holda hero ketma-ketligi ishga tushmay qolardi:
       u allaqachon ko'rinib turibdi, "kesib o'tish" hodisasi bo'lmaydi. */
    if (el.getBoundingClientRect().top < window.innerHeight) atStart(el);
    else io.observe(el);
  });
})();


/* 9 · Hero — kadr parallaksi
   ---------------------------------------------------------------------------
   Parallaks butun qatlamga (`.hero__frame`) qo'yiladi — rasmga emas.
   Qatlam balandligi 108% va tepasi -8% (CSS) — siljish uchun zaxira.

   ✎ Kadr izohlarini joylashtiruvchi kod olib tashlandi (mijoz qarori,
   2026-08-19): izohlarning o'zi hero'dan chiqarildi. */
(function () {
  'use strict';

  var frame = document.getElementById('heroFrame');
  if (!frame) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    frame.style.animation = 'none';
    return;
  }

  /* Parallaks — hero ko'rinib turganda, faqat pastga.
     0,07 koeffitsiyenti: eng ko'p siljish 0,07 × qatlam balandligi, tepadagi
     8% zaxiradan kichik. Ko'proq bo'lsa kadrning tepa cheti ochilib qolardi. */
  var ticking = false;
  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      /* Faqat 1024px dan keng ekranda — pastroqda qatlamda zaxira yo'q (CSS) */
      if (window.innerWidth < 1024) { frame.style.translate = ''; ticking = false; return; }
      var h = frame.clientHeight;
      var y = Math.min(window.scrollY, h);
      frame.style.translate = '0 ' + (y * 0.07).toFixed(1) + 'px';
      ticking = false;
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* 10 · Scroll indikatori — o'ng chetdagi progress chizig'i
   ---------------------------------------------------------------------------
   ✎ Qayta qurildi (mijoz qarori, 2026-08-19). Avval o'rtada suzib turgan
   qisqa chiziq va ikkita raqam («02 … 16») bor edi — mijoz rad etdi.
   Endi ekranning o'ng chetiga yopishgan yupqa to'liq balandlikdagi yo'l,
   ustidan brend rangidagi to'ldirgich yuradi. Raqam yo'q: sahifada nechta
   bo'lim borligi foydalanuvchining savoli emas.

   Balandlikni CSS `--p` o'zgaruvchisi orqali beramiz — layout hisoblanmaydi,
   faqat kompozitsiya qatlami yangilanadi. */
(function () {
  'use strict';

  var bar = document.getElementById('snavBar');
  if (!bar) return;

  var ticking = false;

  var update = function () {
    var doc = document.documentElement.scrollHeight;
    var vh  = window.innerHeight;
    var max = doc - vh;
    var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

    /* Yuguruvchining uzunligi — ekran sahifaning qancha qismini ko'rsatayotgani.
       Eng kamida 8%: uzun sahifada aniq nisbat 2–3px bo'lib, ko'rinmay qolardi. */
    var h = Math.max(8, (vh / doc) * 100);
    bar.style.setProperty('--h', h.toFixed(2) + '%');
    bar.style.setProperty('--y', (pct * (100 - h)).toFixed(2) + '%');
  };

  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { update(); ticking = false; });
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();


/* 11 · Ijtimoiy tarmoqlar — suzuvchi tugma
   ---------------------------------------------------------------------------
   Yig'ilgan holatda bitta tugma. Sabab: uchta rangli kvadrat doim ekranda
   tursa, kalkulyator va forma ustida ular birinchi darajali element bo'lib
   qolardi. Ochilish holati faqat shu blokda — sahifaning boshqa qismiga
   ta'sir qilmaydi. */
(function () {
  'use strict';

  var soc = document.getElementById('soc');
  if (!soc) return;

  var btn = document.getElementById('socToggle');

  var setOpen = function (on) {
    soc.classList.toggle('is-open', on);
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  };

  btn.addEventListener('click', function () {
    setOpen(!soc.classList.contains('is-open'));
  });

  /* Tashqariga bosilsa yopiladi — ochiq qolgan panel scroll paytida
     kontentni to'sib turardi. */
  document.addEventListener('click', function (e) {
    if (!soc.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();


/* 12 · Statistika — raqamlar 0 dan sanaladi
   ---------------------------------------------------------------------------
   Raqam ekranga kirganda 0 dan o'z qiymatigacha tez sanaladi. Bir marta —
   qayta scroll qilinganda takrorlanmaydi: har o'tganda qaytadan sanalsa,
   ko'rsatkich "hisoblagich" bo'lib, dalil bo'lmay qolardi.

   Matn tugunining O'ZI yangilanadi, `textContent` emas: raqamdan keyin
   `<span class="unit">` turadi (+, yil) va u o'chib ketardi. */
(function () {
  'use strict';

  var nums = document.querySelectorAll('.stat__num');
  if (!nums.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  var DUR = 900;   // ms — tez. Uzunroq bo'lsa raqam "og'ir" bo'lib qoladi
                   // va o'quvchi natijani kutib turadi.

  var run = function (el) {
    var node = el.firstChild;                       // raqam matni
    if (!node || node.nodeType !== 3) return;
    var target = parseInt(node.textContent, 10);
    if (isNaN(target)) return;

    var t0 = null;
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / DUR);
      /* easeOutExpo — boshida keskin, oxirida to'xtaydi. Chiziqli sanoq
         mexanik ko'rinadi, bu esa "yetib keldi" degan tuyg'u beradi. */
      var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      node.textContent = String(Math.round(target * e));
      if (p < 1) requestAnimationFrame(step);
      else node.textContent = String(target);
    };
    node.textContent = '0';
    requestAnimationFrame(step);
  };

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      run(en.target);
    });
  }, { threshold: 0.6 });

  Array.prototype.forEach.call(nums, function (n) { io.observe(n); });
})();


/* 13 · Zavod videosi — o'z serverimizdagi MP4 (§5.3)
   ---------------------------------------------------------------------------
   ✎ YouTube iframe'i olib tashlandi (mijoz qarori, 2026-08-21). Sabab:
   iframe boshqa manba (`youtube.com`) bo'lgani uchun ikki narsani buzardi —
   ~1,3 MB skript asosiy oqimni band qilardi, va kursor uning ustida
   bo'lganda `wheel` hodisasi bizning sahifamizga umuman yetib kelmasdi.

   Endi video sahifaning O'Z elementi. Uch qoida:

   1. `preload="none"` — sahifa ochilganda bayt ham yuklanmaydi. Manba
      (`src`) faqat bo'lim ekranga kirganda qo'yiladi. Ya'ni hero va
      birinchi ekranlar video tufayli sekinlashmaydi.
   2. Ekran kengligiga qarab ikki fayldan biri: 900px dan keng bo'lsa
      1080p (~29 MB), tor bo'lsa 720p (~15 MB). Mobil internetga katta
      faylni yuborishning ma'nosi yo'q — u yerda kadr baribir kichik.
   3. Ekrandan chiqsa pauza, qaytsa davom. Video sahifaning qolgan qismi
      bo'ylab ijro bo'lib turishi — bekorga dekodlash va tarmoq.

   OVOZSIZ boshlanadi: ovozli avtomatik ijroga hech bir brauzer ruxsat
   bermaydi. Kadr ustidagi tugma ovozni yoqadi. */
(function () {
  'use strict';

  var box = document.getElementById('zavodVideo');
  var v   = document.getElementById('zavodPlayer');
  if (!box || !v) return;

  var src = window.innerWidth >= 900
    ? box.getAttribute('data-src-1080')
    : box.getAttribute('data-src-720');
  if (!src) return;

  var loaded = false;
  var pausedByUs = false;

  /* ═══ Pleyer paneli ═══════════════════════════════════════════════════
     Panel HTML'da tayyor turadi, lekin `hidden` — JS ishlamasa u umuman
     ko'rinmaydi va o'rniga brauzerning o'z boshqaruvi yoqiladi. Ishlagan
     holatda esa aksincha: panel ochiladi, brauzerniki kerak emas. */
  var ctl   = document.getElementById('zavodCtl');
  var bPlay = document.getElementById('vPlay');
  var bMute = document.getElementById('vMute');
  var eVol  = document.getElementById('vVol');
  var eSeek = document.getElementById('vSeek');
  var eTime = document.getElementById('vTime');
  var bFull = document.getElementById('vFull');

  /* Boshlang'ich ovoz 35% — mijoz so'radi: to'liq balandlik zavod
     shovqini bilan birga keskin eshitiladi. */
  var VOL = 0.35;

  var ikon = function (btn, id) {
    var u = btn.querySelector('use');
    if (u) u.setAttribute('href', '#' + id);
  };
  var vaqt = function (t) {
    if (!isFinite(t)) return '0:00';
    var m = Math.floor(t / 60), s2 = Math.floor(t % 60);
    return m + ':' + (s2 < 10 ? '0' : '') + s2;
  };
  var holat = function () {
    box.classList.toggle('is-paused', v.paused);
    ikon(bPlay, v.paused ? 'i-play' : 'i-pause');
    bPlay.setAttribute('aria-label', v.paused ? 'Ijro etish' : 'Toʻxtatish');
    var jim = v.muted || v.volume === 0;
    ikon(bMute, jim ? 'i-mute' : 'i-sound');
    bMute.setAttribute('aria-label', jim ? 'Ovozni yoqish' : 'Ovozni oʻchirish');
  };

  if (ctl && bPlay && bMute && eVol && eSeek && eTime && bFull) {
    ctl.hidden = false;
    v.volume = VOL;
    eVol.value = String(Math.round(VOL * 100));

    bPlay.addEventListener('click', function () {
      if (v.paused) { start(); } else { v.pause(); pausedByUs = false; }
    });

    bMute.addEventListener('click', function () {
      v.muted = !(v.muted || v.volume === 0);
      /* Ovoz nolga tushirilgan holatda «yoqish» bosilsa — eshitiladigan
         darajaga qaytariladi, aks holda tugma hech narsa qilmagandek
         tuyulardi. */
      if (!v.muted && v.volume === 0) { v.volume = VOL; eVol.value = String(Math.round(VOL * 100)); }
      holat();
    });

    eVol.addEventListener('input', function () {
      v.volume = (+eVol.value) / 100;
      v.muted = v.volume === 0;
      holat();
    });

    /* O'tish chizig'i. Sudralayotgan paytda vaqt yangilanishi to'xtatiladi,
       aks holda barmoq ostidagi tugmacha o'z-o'zidan sakrab turardi. */
    var sudrash = false;
    eSeek.addEventListener('pointerdown', function () { sudrash = true; });
    var qoyish = function () {
      if (!v.duration) return;
      v.currentTime = (+eSeek.value / 1000) * v.duration;
    };
    eSeek.addEventListener('input', function () {
      eSeek.style.setProperty('--seek', (+eSeek.value / 10) + '%');
      if (!sudrash) qoyish();
    });
    eSeek.addEventListener('change', function () { sudrash = false; qoyish(); });

    v.addEventListener('timeupdate', function () {
      if (!v.duration) return;
      if (!sudrash) {
        var p = v.currentTime / v.duration;
        eSeek.value = String(Math.round(p * 1000));
        eSeek.style.setProperty('--seek', (p * 100).toFixed(2) + '%');
      }
      eTime.textContent = vaqt(v.currentTime) + ' / ' + vaqt(v.duration);
    });
    v.addEventListener('loadedmetadata', function () {
      eTime.textContent = vaqt(0) + ' / ' + vaqt(v.duration);
    });
    v.addEventListener('play', holat);
    v.addEventListener('pause', holat);
    v.addEventListener('volumechange', holat);

    bFull.addEventListener('click', function () {
      var d = document;
      if (d.fullscreenElement || d.webkitFullscreenElement) {
        (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      } else if (box.requestFullscreen) {
        box.requestFullscreen();
      } else if (box.webkitRequestFullscreen) {
        box.webkitRequestFullscreen();
      } else if (v.webkitEnterFullscreen) {
        /* iPhone: sahifa elementi to'liq ekranga chiqmaydi, faqat
           videoning o'zi — o'sha yerda brauzerning o'z paneli ishlaydi. */
        v.webkitEnterFullscreen();
      }
    });
    document.addEventListener('fullscreenchange', function () {
      var f = !!document.fullscreenElement;
      ikon(bFull, f ? 'i-exitfull' : 'i-full');
      bFull.setAttribute('aria-label', f ? 'Toʻliq ekrandan chiqish' : 'Toʻliq ekran');
    });

    /* Kadr ustiga bosish — ijro/pauza (video pleyerlarda odat bo'lgan
       harakat). Panelning o'ziga bosilganda ishlamaydi. */
    v.addEventListener('click', function () {
      if (v.paused) { start(); } else { v.pause(); pausedByUs = false; }
    });

    holat();
  } else {
    v.controls = true;   // panel topilmadi — brauzerniki ishlatiladi
  }

  var start = function () {
    if (!loaded) {
      loaded = true;
      v.src = src;
    }
    /* `play()` va'da qaytaradi va u rad etilishi mumkin (masalan tejamkor
       rejim). Ushlamasak konsolda ushlanmagan xato qolardi. */
    var pr = v.play();
    if (pr && pr.catch) pr.catch(function () {});
  };

  if (!('IntersectionObserver' in window)) { start(); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        if (!loaded || pausedByUs) { start(); pausedByUs = false; }
      } else if (loaded && !v.paused) {
        v.pause();
        pausedByUs = true;
      }
    });
  }, { threshold: 0.35 });

  io.observe(box);

  /* Foydalanuvchi o'zi to'xtatgan videoni qaytib kelganda majburan
     yoqmaymiz — «o'zi yonib ketdi» hissi bo'lmasin. */
  v.addEventListener('pause', function () {
    if (!pausedByUs) pausedByUs = false;
  });
})();


/* 13b · Logo lentasi — yuklanmagan rasmni bir marta qayta so'rash
   ---------------------------------------------------------------------------
   Lenta bir vaqtda 27 ta SVG so'raydi (ro'yxat uch marta takrorlanadi).
   Ba'zan ulardan bittasi yo'lda uzilib qoladi va o'rnida brauzerning
   «buzilgan rasm» ikonkasi turib qoladi — fayl joyida bo'lsa ham.

   Shuning uchun bitta urinish: xato bo'lsa manba qayta qo'yiladi (keshni
   chetlab o'tish uchun so'rov qo'shimchasi bilan). Ikkinchi marta
   urinilmaydi — fayl haqiqatan yo'q bo'lsa cheksiz aylanish bo'lardi. */
(function () {
  'use strict';

  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    if (!img.closest || !img.closest('.logo-tile')) return;
    if (img.dataset.retry) return;
    img.dataset.retry = '1';
    var s = img.getAttribute('src');
    img.setAttribute('src', s + (s.indexOf('?') > -1 ? '&' : '?') + 'r=1');
  }, true);   // capture: rasm xatosi ko'pikka chiqmaydi
})();


/* 18 · Reklama manbasi (UTM) va hodisalar
   ---------------------------------------------------------------------------
   Reklama saytdagi formaga olib keladi (Instagram → sayt), shuning uchun ikki
   narsa kerak: ariza QAYERDAN kelgani va reklama tizimiga «lid bo'ldi» degan
   signal.

   UTM sessiyada saqlanadi: odam reklamadan bosh sahifaga tushib, keyin shifer
   sahifasiga o'tib, formani o'sha yerda to'ldirishi mumkin — o'shanda ham
   manba yo'qolmasligi kerak.

   `enzoTrack` — bitta yig'uvchi nuqta. Hozircha sayt hech qanday hisoblagichga
   ulanmagan (Meta Pixel ID mijozdan kutilyapti), shuning uchun u faqat mavjud
   bo'lganini chaqiradi. Pixel qo'yilganda bu blokka tegilmaydi. */
(function () {
  'use strict';

  var KEY = 'enzo-utm';
  var FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  var saqla = function (o) {
    try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  };
  var oqi = function () {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  };

  var qs = new URLSearchParams(location.search);
  var bor = false;
  var utm = {};
  FIELDS.forEach(function (k) {
    var v = qs.get(k);
    if (v) { utm[k] = v.slice(0, 120); bor = true; }
  });

  /* Yangi manba eskisini almashtiradi: odam qaysi reklamadan kelgan bo'lsa,
     oxirgisi hisoblanadi. */
  if (bor) { saqla(utm); } else { utm = oqi(); }
  window.__enzoUtm = utm;

  /* Reklama tizimlariga signal. Ulanmagan bo'lsa — hech narsa qilmaydi. */
  window.enzoTrack = function (nom, qosh) {
    try {
      if (typeof window.fbq === 'function') window.fbq('track', nom, qosh || {});
      if (typeof window.gtag === 'function') window.gtag('event', nom, qosh || {});
      if (window.dataLayer && window.dataLayer.push) {
        var d = { event: nom };
        Object.keys(qosh || {}).forEach(function (k) { d[k] = qosh[k]; });
        window.dataLayer.push(d);
      }
    } catch (e) {}
  };

  /* Telefon, pochta va Telegram bosilishi ham aloqa hisoblanadi: mijozlarning
     bir qismi forma to'ldirmasdan to'g'ridan-to'g'ri qo'ng'iroq qiladi. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var tur = h.indexOf('tel:') === 0 ? 'telefon'
            : h.indexOf('mailto:') === 0 ? 'pochta'
            : h.indexOf('t.me/') > -1 ? 'telegram' : '';
    if (!tur) return;
    window.enzoTrack('Contact', { usul: tur });
  });
})();


/* 19 · Ariza formasi
   ---------------------------------------------------------------------------
   Uch ish: telefonni o'qiladigan ko'rinishga solish, yuborish va natijani
   ko'rsatish.

   ⚠️ Eng muhim qoida: manzil (`data-endpoint`) qo'yilmagan bo'lsa forma o'zini
   «yuborildi» deb KO'RSATMAYDI. Yolg'on «rahmat» — arizasi hech qayerga
   bormaganini bilmagan mijoz demakdir. Manzil yo'q bo'lsa telefon va Telegram
   taklif qilinadi.

   Yuborish `fetch` bilan: sahifa qayta yuklanmaydi, ya'ni odam qayerda turgan
   bo'lsa o'sha yerda qoladi. */
(function () {
  'use strict';

  var form = document.getElementById('leadForm');
  if (!form) return;

  var tel   = form.querySelector('#f-tel');
  var ism   = form.querySelector('#f-name');
  var btn   = form.querySelector('button[type="submit"]');
  var holat = form.querySelector('#formStatus');
  if (!tel || !ism || !btn || !holat) return;

  var ketdi = false;

  /* --- Telefon maskasi: +998 (90) 123-45-67 -------------------------------
     Faqat raqamlar olinadi. 998 boshi majburiy emas: odam «90…» deb yozsa
     ham to'g'ri shakl chiqadi. */
  var raqamlar = function (s) { return (s || '').replace(/\D/g, ''); };

  var tanasi = function (xom) {
    var d = raqamlar(xom);
    if (d.indexOf('998') === 0) d = d.slice(3);
    return d.slice(0, 9);
  };

  var mask = function (xom) {
    var d = tanasi(xom);
    var out = '+998';
    if (d.length) out += ' (' + d.slice(0, 2);
    if (d.length >= 2) out += ')';
    if (d.length > 2) out += ' ' + d.slice(2, 5);
    if (d.length > 5) out += '-' + d.slice(5, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    return out;
  };

  tel.addEventListener('focus', function () {
    if (!tel.value) tel.value = '+998 ';
  });
  tel.addEventListener('input', function () {
    tel.value = mask(tel.value);
  });
  tel.addEventListener('blur', function () {
    if (!tanasi(tel.value)) tel.value = '';
  });

  var xato = function (matn) {
    holat.className = 't-small form__status is-error';
    holat.textContent = matn;
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (ketdi) return;

    /* Bot tuzog'i to'ldirilgan bo'lsa — jim to'xtaymiz. */
    var trap = form.querySelector('[name="botcheck"]');
    if (trap && trap.value) return;

    if (!ism.value.trim()) { xato('Ismingizni yozing'); ism.focus(); return; }
    if (tanasi(tel.value).length !== 9) {
      xato('Telefon raqamini toʻliq kiriting');
      tel.focus();
      return;
    }

    /* Yashirin maydonlar shu payt to'ldiriladi — sahifa ochilganda emas:
       odam bir necha sahifa aylanib kelgan bo'lishi mumkin. */
    var utm = window.__enzoUtm || {};
    Object.keys(utm).forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      if (el) el.value = utm[k];
    });
    var ref = form.querySelector('[name="referrer"]');
    if (ref) ref.value = document.referrer || '';
    var pg = form.querySelector('[name="page"]');
    if (pg) pg.value = location.pathname;

    /* Manzil bor, lekin kalit hali qo'yilmagan bo'lishi mumkin — u holda
       yuborish baribir muvaffaqiyatsiz bo'lardi, faqat foydalanuvchi buni
       «xatolik» deb ko'rardi. Shuning uchun oldindan tekshiriladi. */
    var kalit = form.querySelector('[name="access_key"]');
    var url = form.getAttribute('data-endpoint');
    if (!url || (kalit && !kalit.value)) {
      /* Ulanish hali yo'q — bor haqiqat aytiladi, «rahmat» yozilmaydi. */
      holat.className = 't-small form__status is-warn';
      holat.innerHTML = 'Onlayn ariza hozircha ulanmoqda. Iltimos, qoʻngʻiroq qiling: ' +
        '<a href="tel:+998558107777">+998 55 810 77 77</a> yoki ' +
        '<a href="https://t.me/enzogroup_uz" target="_blank" rel="noopener">Telegram</a> orqali yozing.';
      return;
    }

    ketdi = true;
    btn.disabled = true;
    holat.className = 't-small form__status';
    holat.textContent = 'Yuborilyapti…';

    /* Xatga faqat TO'LDIRILGAN maydonlar ketadi. Reklamasiz kelgan
       arizada beshta bo'sh «Utm …» qatori keraksiz shovqin — menejer
       xatni ochganda darrov ism va telefonni ko'rishi kerak. */
    var body = {};
    new FormData(form).forEach(function (v, k) {
      if (typeof v === 'string' && !v.trim()) return;
      body[k] = v;
    });

    /* Xat sarlavhasida ism turadi — pochtada ariza qidirish oson bo'ladi. */
    body.subject = 'ENZO GROUP — ariza: ' + ism.value.trim();

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return { success: r.ok }; });
    }).then(function (d) {
      /* Web3Forms 200 qaytarib, ichida `success:false` yozishi mumkin
         (masalan kalit noto'g'ri) — javobning o'zi o'qiladi. */
      if (!d || d.success === false) throw new Error('rad etildi');
      form.classList.add('is-sent');
      holat.className = 't-small form__status';
      holat.textContent = '';
      /* «Lid» signali aynan shu yerda — ariza haqiqatan qabul qilinganda. */
      window.enzoTrack('Lead', { manba: (window.__enzoUtm || {}).utm_source || 'sayt' });
    }).catch(function () {
      ketdi = false;
      btn.disabled = false;
      xato('Yuborib boʻlmadi. Iltimos, +998 55 810 77 77 raqamiga qoʻngʻiroq qiling.');
    });
  });
})();


/* 14 · Kirish animatsiyasi — o'tkazib yuborish
   ---------------------------------------------------------------------------
   Pardaning YO'QOLISHI CSS animatsiyasi bilan bo'ladi (style.css §22), bu
   yerda faqat qo'shimchalar: bosish yoki Esc bilan darrov yopish, va
   tugagandan keyin `<html>` dagi scroll qulfini olib tashlash.

   Ya'ni bu blok ishlamay qolsa ham parda o'z vaqtida yo'qoladi. */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('has-intro')) return;

  var el = document.getElementById('intro');
  if (!el) { root.classList.remove('has-intro'); return; }

  var done = false;
  var finish = function () {
    if (done) return;
    done = true;
    /* Scroll qulfini `<head>` dagi skript o'zi ochadi — bu yerda faqat
       parda DOM'dan olib tashlanadi. */
    root.classList.remove('has-intro');
    el.remove();
  };

  /* CSS animatsiyasi tugagach tozalaymiz. `animationend` kelmasa ham
     (masalan animatsiya o'chirilgan bo'lsa) taymer ishlaydi. */
  el.addEventListener('animationend', finish);
  setTimeout(finish, 2700);

  var skip = function () { el.style.animation = 'none'; finish(); };
  el.addEventListener('click', skip);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
  }, { once: true });
})();


/* 15 · `--vw` — scrollbar'siz kenglik
   ---------------------------------------------------------------------------
   `100vw` scrollbar'ni ham qo'shib hisoblaydi. To'liq kenglikdagi bloklarda
   (zavod videosi) bu kadrni o'ngga surib, chap chetda ~16px oq tasma
   qoldirardi. `clientWidth` esa aynan ko'rinadigan kenglikni beradi. */
(function () {
  'use strict';

  var set = function () {
    document.documentElement.style.setProperty(
      '--vw', document.documentElement.clientWidth + 'px');
  };

  set();

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(set, 120);
  }, { passive: true });
})();


/* 16 · Ish jarayoni — chiziq scroll bilan to'ladi (§5.14)
   ---------------------------------------------------------------------------
   Qadamlar bo'ylab o'tgan chiziq o'quvchi bilan birga oldinga siljiydi va
   yetib borgan qadam yonadi. CSS `--p` (0…1) qiymatini o'qiydi (style.css
   §5.14), bu blok esa faqat shu bitta sonni yangilaydi.

   Uchta ataylab qilingan cheklov:
   · Hisob FAQAT bo'lim ekranda turganda ishlaydi — IntersectionObserver
     scroll tinglovchisini yoqib-o'chiradi. Aks holda sahifaning har bir
     pikselida bekorga o'lchov olinardi.
   · O'lchov `requestAnimationFrame` ichida — scroll hodisasining o'zida
     `getBoundingClientRect` chaqirilsa, brauzer uslublarni qayta hisoblashga
     majbur bo'ladi va aynan scroll paytida taqillash paydo bo'ladi.
   · JS ishlamasa `--p` umuman qo'yilmaydi va CSS'dagi `--p:1` qoladi:
     chiziq to'la, qadamlar yongan. Hech narsa yashirin qolmaydi. */
(function () {
  'use strict';

  var box = document.querySelector('.process');
  if (!box) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var steps = [].slice.call(box.querySelectorAll('.pstep'));
  if (!steps.length) return;

  /* Qadalgan sahna (desktop). Mobilda `.pin__stage` oddiy blok bo'lib qoladi. */
  var pin   = document.getElementById('processPin');
  var stage = pin && pin.querySelector('.pin__stage');
  var head  = parseFloat(getComputedStyle(document.documentElement)
                .getPropertyValue('--header-h')) || 0;

  var ticking = false;
  var live = false;
  var pMax = 0;      // eng uzoq borilgan to'lish darajasi
  var done = false;  // yo'l yig'ishtirilganmi

  /* ✎ Yo'lni bir marta ishlatib, keyin yig'ishtirish (mijoz qarori,
     2026-08-22).

     Muammo: qadash yo'li (160svh) chiziq to'lgandan KEYIN ham joyida
     qolardi. Ikkinchi marta o'sha yerdan o'tganda — ayniqsa yuqoriga
     qaytganda — ekranda hech narsa o'zgarmaydigan yarim ekranlik masofa
     paydo bo'lardi: sahifa siljiyapti, ko'rinish esa qotib turadi.

     Yechim: animatsiya tugagan zahoti «pin» yo'li olib tashlanadi va
     bo'lim oddiy blokka aylanadi. Shu payt sahifa balandligi yo'l
     uzunligicha qisqaradi, shuning uchun scroll ham aynan shuncha
     yuqoriga suriladi — ko'z uchun hech narsa qimirlamaydi, lekin
     bo'limda endi ushlab turadigan bo'sh masofa qolmaydi.

     Siljish window.__enzoScrollShift orqali silliq scroll bloki bilan
     ham kelishiladi (main.js §11), aks holda u keyingi kadrda eski
     nishonga tortib qaytarardi. */
  var yigishtir = function (sticky) {
    if (done) return;
    done = true;
    /* Haqiqatda ishlatilgan sticky masofasi — 0 va yo'l uzunligi orasida.
       Tez scroll qilinganda sahna allaqachon qo'zg'algan bo'lishi mumkin,
       o'shanda to'liq yo'lga surish sakrashga olib kelardi. */
    pin.classList.add('is-done');
    if (sticky > 0) {
      var y = window.scrollY - sticky;
      window.scrollTo(0, y);
      if (typeof window.__enzoScrollShift === 'function') {
        window.__enzoScrollShift(-sticky);
      }
    }
  };

  var measure = function () {
    ticking = false;

    var vh = window.innerHeight;
    var p;

    if (pin && stage && stage.offsetHeight < pin.offsetHeight) {
      /* QADALGAN holat (desktop). Sahna ekranda turadi, `.pin` esa uning
         ostidagi yo'l. To'lish shu yo'l bo'ylab o'tilgan masofa bilan
         o'lchanadi: 0 — sahna endigina qadaldi, 1 — yo'l tugadi va sahna
         joyidan qo'zg'aladi.

         Shart `stage.offsetHeight < pin.offsetHeight` — sticky haqiqatan
         ishlayotganining belgisi. Mobilda (yoki harakat kamaytirilganda)
         sahna butun `.pin` ni to'ldiradi va hisob o'zi pastdagi oddiy
         formulaga o'tadi. */
      var pr  = pin.getBoundingClientRect();
      var yol = pin.offsetHeight - stage.offsetHeight;
      var oq  = -pr.top + head;          // yo'l bo'ylab o'tilgan masofa
      p = oq / (yol || 1);

      if (p >= 1) {
        /* Chiziq to'ldi — yo'l endi keraksiz. */
        measure.qol = Math.max(0, Math.min(yol, oq));
      }
    } else {
      /* Oddiy oqim (mobil). Yo'l uzunligi bo'lim balandligiga EMAS, unga
         qo'shimcha yarim ekranga teng — aks holda chiziq bir necha yuz
         piksel scroll ichida to'lib bo'lardi va to'lish ko'rinmasdi. */
      var r = box.getBoundingClientRect();
      p = (vh * 0.85 - r.top) / (r.height + vh * 0.45);
    }

    p = Math.max(0, Math.min(1, p));

    /* ✎ Faqat oldinga (mijoz qarori, 2026-08-21). Yuqoriga qaytilganda
       chiziq orqaga qaytib bo'shalardi — animatsiya ikki tomonga ishlab,
       o'quvchi allaqachon o'qib bo'lgan qadamlar so'nardi. Endi eng
       uzoq borilgan nuqta eslab qolinadi: pastga siljiganda to'ladi,
       yuqoriga qaytganda o'sha holida turadi. */
    if (p < pMax) { p = pMax; } else { pMax = p; }

    box.style.setProperty('--p', p.toFixed(3));

    /* Qadam chiziq unga YETGANDA yonadi. Chegara qadamning o'z ulushidan
       biroz oldin (0,04) — belgi chiziq ustiga kelgan payt bilan yonish
       bir vaqtga to'g'ri kelsin. */
    steps.forEach(function (el, i) {
      var lit = p >= Math.max(0, i / steps.length - 0.04);
      el.classList.toggle('is-lit', lit);
    });

    if (measure.qol !== undefined) {
      var q = measure.qol;
      measure.qol = undefined;
      yigishtir(q);
    }
  };

  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  };

  if (!('IntersectionObserver' in window)) {
    box.style.setProperty('--p', '1');
    steps.forEach(function (el) { el.classList.add('is-lit'); });
    return;
  }

  new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting === live) return;
      live = en.isIntersecting;
      if (live) {
        window.addEventListener('scroll', onScroll, { passive: true });
        measure();
      } else {
        window.removeEventListener('scroll', onScroll);
      }
    });
  }, { rootMargin: '20% 0px 20% 0px' }).observe(box);

  window.addEventListener('resize', onScroll, { passive: true });
})();

/* 17 · Mijoz otzivlari — vertikal videolar (§5.11)
   ---------------------------------------------------------------------------
   Kadr bosilguncha video umuman yuklanmaydi: `preload="none"` va `src`
   yo'q, ekranda faqat poster turadi. Ikkita 9:16 video ~22 MB — ularni
   sahifa ochilishida yuklash mumkin emas.

   Bosilganda: manba qo'yiladi, ovoz yoqiladi (bu foydalanuvchining O'Z
   harakati, shuning uchun brauzer ruxsat beradi) va pleyer boshqaruvi
   ko'rinadi.

   Bir vaqtda faqat bittasi ijro bo'ladi — ikkita ovoz bir-birining ustiga
   chiqmasin. */
(function () {
  'use strict';

  var boxes = [].slice.call(document.querySelectorAll('.reel__poster[data-src]'));
  if (!boxes.length) return;

  var players = [];

  boxes.forEach(function (box) {
    var v   = box.querySelector('video');
    var btn = box.querySelector('.reel__play');
    if (!v || !btn) return;
    players.push(v);

    btn.addEventListener('click', function () {
      players.forEach(function (other) { if (other !== v) other.pause(); });

      if (!v.src) v.src = box.getAttribute('data-src');
      v.muted = false;
      v.controls = true;
      box.classList.add('is-on');

      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {
        /* Ijro rad etilsa tugma qaytadi — foydalanuvchi qayta urinib
           ko'rishi kerak, kadr esa «boshlangan» ko'rinishda qolmasin. */
        box.classList.remove('is-on');
      });
    });
  });

  /* Ekrandan chiqqan video to'xtaydi. Ovoz yoqilgani uchun bu ayniqsa
     muhim: ko'rinmayotgan joydan kelayotgan ovoz — eng bezovta qiladigan
     narsa. */
  if (!('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) en.target.pause();
    });
  }, { threshold: 0.2 });

  players.forEach(function (v) { io.observe(v); });
})();
