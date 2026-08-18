/* ENZO GROUP — main.js */

(function () {
  'use strict';

  /* 1 · Header — scroll'da oq fonga o'tadi (DESIGN.md §6.6) */
  var header = document.getElementById('header');
  var onScroll = function () {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* 2 · Mobil menyu */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');

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
    var ZONA = { 1: 1, 2: 1.8, 3: 2.6 };          // yetkazish koeffitsiyenti
    var SHIP_BASE = 1400000;                      // so'm — bitta reys, to'ldirgich

    var fmt = function (n) {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };
    var val = function (x, q) { return typeof x === 'function' ? x(q) : x; };

    /* Mahsulot ta'riflari: o'z o'lchov savoli, birligi, bir birlik narxi va
       bitta reysga sig'adigan miqdori (yetkazish reyslarini sanash uchun). */
    var P = {
      shifer: {
        nom: 'Shifer', field: 'f-shifer', sel: 'c-shifer', text: true, birlik: 'dona', boshl: 100,
        narx: function () { return 48000; },
        reys: 400,
        izoh: function (q) { return 'Qoplanadigan maydon ≈ ' + fmt(q * 1.6) + ' m² (1 varaq = 1,6 m²)'; }
      },
      sement: {
        nom: 'Sement', field: 'f-sement', sel: 'c-sement', boshl: 100,
        naval: function () { return $('c-sement').value.indexOf('naval') > -1; },
        birlik: function () { return P.sement.naval() ? 'tonna' : 'qop (50 kg)'; },
        narx: function () {
          var extra = $('c-sement').value.indexOf('extra') === 0;
          return P.sement.naval() ? (extra ? 1180000 : 1050000) : (extra ? 62000 : 55000);
        },
        reys: function () { return P.sement.naval() ? 25 : 500; },
        izoh: function (q) {
          return P.sement.naval()
            ? 'Naval sement sement-voz bilan tashiladi, eng kam partiya 25 t'
            : 'Ogʻirligi ≈ ' + fmt(q * 0.05) + ' tonna';
        }
      },
      beton: {
        nom: 'Tayyor beton', field: 'f-marka', sel: 'c-marka', birlik: 'm³', boshl: 10,
        narx: function () {
          var MARKA = { M100:1, M150:1.06, M250:1.14, M300:1.2, M350:1.27, M400:1.34, M450:1.41, M500:1.48 };
          return 375000 * (MARKA[$('c-marka').value] || 1);
        },
        reys: 10,
        izoh: function (q) { return Math.ceil(q / 10) + ' ta mikser reysi (har biri 10 m³)'; }
      },
      jbi: {
        nom: 'Temir-beton buyumlar', field: 'f-jbi', sel: 'c-jbi', birlik: 'dona', boshl: 10,
        narx: function () {
          var N = { pb: 2400000, pk2: 2150000, li60: 640000, li30: 380000, ct: 290000 };
          return N[$('c-jbi').value] || 0;
        },
        reys: function () {
          var v = $('c-jbi').value;
          return (v === 'pb' || v === 'pk2') ? 8 : 20;
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

      /* Mahsulot almashsa, miqdor shu mahsulot uchun mantiqiy qiymatdan
         boshlanadi — 100 dona shifer 100 m³ beton bilan bir narsa emas */
      if (prevKey !== elProduct.value) { elQty.value = p.boshl; prevKey = elProduct.value; }

      var qty = Math.max(1, Math.floor(+elQty.value || 1));
      var birlik = val(p.birlik);
      var zona = REGIONS[+elRegion.value][1];
      var tovar = val(p.narx) * qty;
      var ship  = Math.ceil(qty / val(p.reys)) * SHIP_BASE * ZONA[zona];
      var sel = $(p.sel);

      $('v-unit').textContent = birlik;
      $('c-hint').textContent = p.izoh(qty);
      $('c-price').textContent = fmt(tovar + ship) + ' soʻm';

      $('o-product').textContent = p.nom;
      $('o-spec').textContent = p.text ? sel.textContent : sel.options[sel.selectedIndex].textContent;
      $('o-qty').textContent  = fmt(qty) + ' ' + birlik;
      $('o-addr').textContent = elDistrict.value + ', ' + REGIONS[+elRegion.value][0];
      $('o-ship').textContent = fmt(ship) + ' soʻm';
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

  /* 5 · Prototip: struktura ↔ rang rejimi */
  var wireCss = document.getElementById('wireCss');
  var btnWire = document.getElementById('btnWire');
  var btnFull = document.getElementById('btnFull');

  var setMode = function (wire) {
    document.documentElement.classList.toggle('wire', wire);
    wireCss.disabled = !wire;
    btnWire.classList.toggle('is-active', wire);
    btnFull.classList.toggle('is-active', !wire);
  };
  btnWire.addEventListener('click', function () { setMode(true); });
  btnFull.addEventListener('click', function () { setMode(false); });

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
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

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
       Sabab: `wireframe.css` dagi `.wire .ph { position:relative }` qoidasi
       spetsifikligi yuqoriroq bo'lib, kartochkaning `position:absolute` ini
       bosib ketardi va butun to'plam oddiy oqimga tushib qolardi. */
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
      el.style.opacity = hidden ? '0' : String(1 - far * 0.34);
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
