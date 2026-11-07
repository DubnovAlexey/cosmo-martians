// cosmo-martians/martians.js — СОБРАН АВТОМАТИЧЕСКИ командой `node tools/build-martians.mjs`, не править вручную.
// Источник: этот шаблон (tools/martians.template.js) + рисунок, взрыв, кляксы, звук и стили из
// Mars-project2 (js/martians.js, CSS/martians.css). Там же — основная версия марсиан.
//
// Сквозная пасхалка портфолио: марсиане под стеклянными шлемами, сначала страшные — потом смешные.
// Подключается в любой проект одной строкой:
//   <script src="https://dubnovalexey.github.io/cosmo-martians/martians.js"
//           data-project="library" defer></script>
//
// Без музыки марсиане не взрываются: собираются по краям экрана и мешают. Когда их больше трёх,
// сайт аккуратно подсказывает включить музыку. Как только на странице заиграла музыка (любой <audio>,
// <video> или new Audio()), толпа танцует — и у марсиан по очереди лопаются головы: осколки шлема,
// кровь, мозги, глаз, иногда прямо на «стекло» экрана. Потом тело без головы машет и уползает.
// Только персонажи: никаких реплик и надписей, кроме подсказки сайта.
//
// Настройки — атрибуты тега <script>:
//   data-project      короткое имя проекта для общего счётчика, например "olympic-rings"
//   data-rate         "normal" (по умолчанию) или "rare" — для рабочих программ, где важно не мешать
//   data-friend       CSS-селектор «друга» на странице (например ".zoich")
//   data-friend-eats  "true" — друг иногда ловит марсианина языком и глотает, как муху
// Проекты со звуком Web Audio сообщают о музыке сами:
//   window.dispatchEvent(new CustomEvent("cosmo:music", {detail: {playing: true}}))
// Общая память проектов на одном адресе (localStorage): cosmo-martians:off — выключатель,
// cosmo-martians:stats — сколько голов лопнуло всего и в каждом проекте, сколько съел друг.
// Не появляются при «уменьшить анимацию», на скрытой вкладке, при открытом окне и пока посетитель печатает.

(function () {
    if (window.cosmoMartians) return; // подключили дважды — работает один экземпляр

    // BEGIN SECTION 1 — настройки, цвета, подсказка
    const script = document.currentScript;
    const config = {
        project: (script && script.dataset.project) || location.pathname.split("/")[1] || "site",
        rate: (script && script.dataset.rate) || "normal",
        friend: script && script.dataset.friend,
        friendEats: !!(script && script.dataset.friendEats === "true")
    };
    const RATES = {
        normal: {quiet: [9000, 16000], music: [8000, 18000]},
        rare: {quiet: [40000, 80000], music: [30000, 60000]}
    };
    const rate = RATES[config.rate] || RATES.normal;
    const MAX_CROWD = config.rate === "rare" ? 3 : 6;
    const HINT_AFTER = 3;
    const DANCE = [3000, 5500];
    const NEXT_POP = [1200, 2600];
    const BLOOD = ["#7a0000", "#9e0b0b", "#b31212", "#c81d1d", "#5c0000"];
    const BRAIN = ["#e7a3b1", "#d98597", "#f0bac5", "#c46b80"];
    const GOO = ["#8fd14f", "#6fbf3a", "#b7e36a"];
    const HINT = {
        en: "To fight off the alien invasion, turn on the music.",
        ru: "Для борьбы с инопланетным вторжением включите музыку.",
        he: "כדי להדוף את הפלישה החייזרית, הפעילו את המוזיקה."
    };
    // END SECTION 1

    // BEGIN SECTION 2 — общая память проектов
    const STORE = "cosmo-martians:";

    function load(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(STORE + key));
            return value === null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function save(key, value) {
        try {
            localStorage.setItem(STORE + key, JSON.stringify(value));
        } catch (e) {
            // нет хранилища — работаем без памяти
        }
    }

    const isOff = () => load("off", false) === true;

    // Проверяем структуру общей памяти: валидный JSON ещё не гарантирует корректный счётчик
    function readStats() {
        const raw = load("stats", null);
        const stats = {total: 0, eaten: 0, projects: Object.create(null)};
        if (!raw || typeof raw !== "object") return stats;
        if (Number.isSafeInteger(raw.total) && raw.total >= 0) stats.total = raw.total;
        if (Number.isSafeInteger(raw.eaten) && raw.eaten >= 0) stats.eaten = raw.eaten;
        if (raw.projects && typeof raw.projects === "object" && !Array.isArray(raw.projects)) {
            for (const [key, value] of Object.entries(raw.projects)) {
                if (Number.isSafeInteger(value) && value >= 0) stats.projects[key] = value;
            }
        }
        return stats;
    }

    function count(kind) {
        const stats = readStats();
        if (kind === "eaten") stats.eaten += 1;
        else {
            stats.total += 1;
            stats.projects[config.project] = (stats.projects[config.project] || 0) + 1;
        }
        save("stats", stats);
    }
    // END SECTION 2

    // BEGIN SECTION 3 — есть ли музыка на странице
    // Следим за любым play()/pause(), даже у new Audio(), которого нет в разметке
    const playingMedia = new Set();
    let webAudioMusic = false;

    function isMusicLike(media) {
        return !media.muted && media.volume > 0 && !(media.duration > 0 && media.duration < 8); // писк — не музыка
    }

    function track(media) {
        if (media.__cosmoTracked) return;
        media.__cosmoTracked = true;
        media.addEventListener("playing", () => {
            playingMedia.add(media);
            onMusicChange();
        });
        ["pause", "ended", "emptied"].forEach(type => media.addEventListener(type, () => {
            playingMedia.delete(media);
            onMusicChange();
        }));
    }

    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
        track(this);
        return originalPlay.apply(this, arguments);
    };
    window.addEventListener("cosmo:music", (event) => {
        webAudioMusic = !!(event.detail && event.detail.playing);
        onMusicChange();
    });

    function musicPlaying() {
        if (webAudioMusic) return true;
        for (const media of playingMedia) if (!media.paused && isMusicLike(media)) return true;
        return false;
    }

    // Громкость эффектов следует за громкостью музыки страницы
    function music() {
        for (const media of playingMedia) if (!media.paused) return media;
        return {volume: 0.5};
    }
    // END SECTION 3

    // BEGIN MARS SECTION 2 — рисунок марсианина
    // Тело в металлическом костюме и отдельная группа головы (череп, мозг в венах, стеклянный шлем):
    // именно она раздувается и лопается. Глаза и вены — отдельные классы для анимации.
    const MARTIAN_SVG = `
<svg viewBox="0 0 100 132" aria-hidden="true">
  <defs>
    <radialGradient id="mrt-skin" cx="50%" cy="35%" r="72%">
      <stop offset="0" stop-color="#eef0d8"/><stop offset=".5" stop-color="#c3c99c"/><stop offset="1" stop-color="#5f6a3e"/>
    </radialGradient>
    <radialGradient id="mrt-brain" cx="38%" cy="28%" r="80%">
      <stop offset="0" stop-color="#fde6d6"/><stop offset=".45" stop-color="#eab1ad"/><stop offset="1" stop-color="#93445a"/>
    </radialGradient>
    <linearGradient id="mrt-suit" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a9b3c2"/><stop offset=".45" stop-color="#525d70"/><stop offset="1" stop-color="#1e242e"/>
    </linearGradient>
    <radialGradient id="mrt-eye" cx="42%" cy="38%" r="62%">
      <stop offset="0" stop-color="#fffdf0"/><stop offset=".65" stop-color="#f3e6c6"/><stop offset="1" stop-color="#c9786c"/>
    </radialGradient>
  </defs>
  <g class="cm-body">
    <path d="M45 118 L43 129 M55 118 L57 129" stroke="#7d9a4a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M39 130 h7 M54 130 h7" stroke="#1e242e" stroke-width="3" stroke-linecap="round"/>
    <path d="M39 97 Q50 93 61 97 L59 118 Q50 121 41 118 Z" fill="url(#mrt-suit)" stroke="#12161d" stroke-width="1"/>
    <path d="M42 103 L58 103 M43 110 L57 110" stroke="#cfd8e4" stroke-width=".6" opacity=".45"/>
    <circle cx="50" cy="114" r="1.8" fill="#ff3b3b" class="cm-light"/>
    <ellipse cx="37" cy="98.5" rx="5" ry="3" fill="#8793a5" stroke="#12161d" stroke-width=".8"/>
    <ellipse cx="63" cy="98.5" rx="5" ry="3" fill="#8793a5" stroke="#12161d" stroke-width=".8"/>
    <path class="cm-arm" d="M34 99 Q24 104 20 94 L17 86 M17 86 L13 82 M17 86 L15 80 M17 86 L19 80" stroke="#86a552" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path class="cm-arm cm-arm--right" d="M66 99 Q76 104 80 94 L83 86 M83 86 L87 82 M83 86 L85 80 M83 86 L81 80" stroke="#86a552" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <g class="cm-gun">
      <path d="M81 82 L94 77 L95 81 L83 85 Z" fill="#c9ced6" stroke="#1e242e" stroke-width=".9"/>
      <circle cx="94.6" cy="79" r="2" fill="#ff3b3b"/><path d="M83 85 L82 90" stroke="#1e242e" stroke-width="2" stroke-linecap="round"/>
      <path class="cm-zap" d="M96 79 L108 73 L104 79 L118 71" stroke="#ff2d55" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
    <ellipse cx="50" cy="95.5" rx="16" ry="3.4" fill="#bcc7d6" stroke="#232a36" stroke-width="1"/>
    <g class="cm-neck-stump"><ellipse cx="50" cy="93.5" rx="5.5" ry="2.4" fill="#6b0000"/><ellipse cx="50" cy="93" rx="3" ry="1.3" fill="#e7a3b1"/></g>
    <g class="cm-head">
      <path d="M46 96 L46.5 89 L53.5 89 L54 96 Z" fill="#7d8660"/>
      <path d="M23 52 Q21 61 25 67 Q21 74 29 80 Q35 90 44 93 L56 93 Q65 90 71 80 Q79 74 75 67 Q79 61 77 52 Z" fill="url(#mrt-skin)" stroke="#3c4424" stroke-width="1.1"/>
      <path d="M25 67 Q29 71 30 78 M75 67 Q71 71 70 78" stroke="#4a5530" stroke-width="1.2" fill="none" opacity=".7"/>
      <ellipse cx="26.5" cy="60" rx="3.2" ry="5.5" fill="#3c4424" opacity=".45"/>
      <ellipse cx="73.5" cy="60" rx="3.2" ry="5.5" fill="#3c4424" opacity=".45"/>
      <path d="M27 54 Q38 50 47 56 M53 56 Q62 50 73 54" stroke="#3c4424" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M27 64 Q27 54 38 54 Q49 54 48.5 64 Q48 75 38 75 Q27 75 27 64 Z" fill="#0b0b06"/>
      <path d="M51.5 64 Q51 54 62 54 Q73 54 73 64 Q73 75 62 75 Q52 75 51.5 64 Z" fill="#0b0b06"/>
      <g class="cm-eye">
        <circle cx="38" cy="64.5" r="9.4" fill="url(#mrt-eye)"/>
        <path d="M29.5 61 L33.5 63 L32 65.5 M30 69.5 L34 67.5 M46.5 59 L42.5 62 L44 63.5 M46.8 68.5 L42.6 66.4 M38 55.6 L38.6 59" stroke="#c0151a" stroke-width=".7" fill="none"/>
        <circle cx="38.6" cy="64.6" r="2.9" fill="#b0080d"/><circle cx="38.6" cy="64.6" r="1" fill="#050505"/>
        <circle cx="36" cy="61.6" r="1.1" fill="#fff"/>
      </g>
      <g class="cm-eye cm-eye--right">
        <circle cx="62" cy="64.5" r="9.4" fill="url(#mrt-eye)"/>
        <path d="M70.5 61 L66.5 63 L68 65.5 M70 69.5 L66 67.5 M53.5 59 L57.5 62 L56 63.5 M53.2 68.5 L57.4 66.4 M62 55.6 L61.4 59" stroke="#c0151a" stroke-width=".7" fill="none"/>
        <circle cx="61.4" cy="64.6" r="2.9" fill="#b0080d"/><circle cx="61.4" cy="64.6" r="1" fill="#050505"/>
        <circle cx="59" cy="61.6" r="1.1" fill="#fff"/>
      </g>
      <path d="M50 73 Q47 74.5 47.5 78 L50 76.6 L52.5 78 Q53 74.5 50 73 Z" fill="#14140a"/>
      <path d="M31 82 Q50 76.5 69 82 Q66 91 50 92 Q34 91 31 82 Z" fill="#2a0505"/>
      <path d="M33 81.4 Q50 78.6 67 81.4" stroke="#7a1d1d" stroke-width="1.4" fill="none"/>
      <path d="M35.0 80.6 L35.0 84.6 M38.3 80.6 L38.3 84.6 M41.6 80.6 L41.6 84.6 M44.9 80.6 L44.9 84.6 M48.2 80.6 L48.2 84.6 M51.5 80.6 L51.5 84.6 M54.8 80.6 L54.8 84.6 M58.1 80.6 L58.1 84.6 M61.4 80.6 L61.4 84.6 M64.7 80.6 L64.7 84.6" stroke="#f3ead0" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M36.6 85.6 L36.6 88.8 M39.9 85.6 L39.9 88.8 M43.2 85.6 L43.2 88.8 M46.5 85.6 L46.5 88.8 M49.8 85.6 L49.8 88.8 M53.1 85.6 L53.1 88.8 M56.4 85.6 L56.4 88.8 M59.7 85.6 L59.7 88.8 M63.0 85.6 L63.0 88.8" stroke="#e4d9b8" stroke-width="2.3" stroke-linecap="round"/>
      <path d="M31 82 Q50 77 69 82" stroke="#3c4424" stroke-width="1" fill="none"/>
      <path d="M13 44 Q9 30 15 22 Q14 12 26 9 Q32 1 42 4 Q50 0 58 4 Q68 1 74 9 Q86 12 85 22 Q91 30 87 44 Q85 54 74 57 Q62 60 50 59 Q38 60 26 57 Q15 54 13 44 Z" fill="url(#mrt-brain)" stroke="#7d2f45" stroke-width="1.2"/>
      <path d="M50 4 Q48 20 51 32 Q48 46 50 59" stroke="#7d2f45" stroke-width="1.8" fill="none"/>
      <path d="M18 24 Q23 18 27 24 Q30 30 35 24 Q38 18 44 21 M56 21 Q62 18 65 24 Q70 30 73 24 Q77 18 82 24 M15 36 Q21 30 25 37 Q29 44 35 37 Q40 30 46 36 M54 36 Q60 30 65 37 Q71 44 75 37 Q79 30 85 36 M19 48 Q25 42 30 49 Q35 55 41 49 M59 49 Q65 55 70 49 Q75 42 81 48 M28 11 Q34 15 38 10 M62 10 Q66 15 72 11 M24 30 Q28 33 31 30 M69 30 Q72 33 76 30 M36 44 Q40 47 44 44 M56 44 Q60 47 64 44 M40 15 Q44 20 46 14 M54 14 Q56 20 60 15"
            stroke="#8e3a55" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M19 23 Q23 19 26 23 M57 20 Q62 18 64 22 M16 35 Q20 31 23 35 M55 35 Q59 31 63 35 M29 10 Q33 13 36 10" stroke="#fff3ec" stroke-width=".7" fill="none" opacity=".8"/>
      <path d="M22 28 Q27 33 30 28 M70 28 Q74 34 78 28 M33 52 Q38 49 42 53 M58 53 Q62 49 67 52" stroke="#5b4fb4" stroke-width=".7" fill="none" opacity=".55"/>
      <path class="cm-veins" d="M20 30 Q26 26 28 31 Q31 36 36 30 M64 28 Q70 24 74 30 M30 46 Q36 50 40 44 M60 44 Q66 50 72 44 M46 12 Q44 22 47 27 M80 40 Q76 46 72 42"
            stroke="#d1001f" stroke-width=".9" fill="none" stroke-linecap="round"/>
      <path class="cm-helmet" d="M6 52 Q0 2 50 0 Q100 2 94 52 Q96 96 50 98 Q4 96 6 52 Z" fill="rgba(190,235,255,.09)" stroke="rgba(210,245,255,.6)" stroke-width="1.4"/>
      <path class="cm-helmet" d="M18 16 Q28 5 45 4" stroke="rgba(255,255,255,.75)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path class="cm-helmet" d="M87 60 Q85 78 74 88" stroke="rgba(255,255,255,.35)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path class="cm-crack" d="M72 10 L64 21 L69 26 L60 36 M64 21 L56 19 M69 26 L77 30" stroke="rgba(255,255,255,.9)" stroke-width=".9" fill="none"/>
    </g>
  </g>
</svg>`;

    // Откуда выглядывает: снизу, слева, справа, сверху (вниз головой)
    const SPOTS = [
        {name: "bottom", hidden: "translateY(115%)", shown: "translateY(12%)", peek: "translateY(55%)"},
        {name: "left", hidden: "rotate(90deg) translateY(115%)", shown: "rotate(90deg) translateY(22%)", peek: "rotate(90deg) translateY(60%)"},
        {name: "right", hidden: "rotate(-90deg) translateY(115%)", shown: "rotate(-90deg) translateY(22%)", peek: "rotate(-90deg) translateY(60%)"},
        {name: "top", hidden: "rotate(180deg) translateY(115%)", shown: "rotate(180deg) translateY(22%)", peek: "rotate(180deg) translateY(60%)"}
    ];
    // END MARS SECTION 2

    // BEGIN SECTION 4 — общие помощники
    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stage = null;
    let timer = null;
    const crowd = [];
    let queueRunning = false;
    let forceEat = false;
    let hint = null;

    const rand = (min, max) => min + Math.random() * (max - min);
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function canShow() {
        const active = document.activeElement;
        const typing = active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
        return !!stage && !reducedMotion && !isOff() && !document.hidden && !typing &&
            !document.querySelector(".modal.show, dialog[open]");
    }

    function placeMartian(el, spot) {
        const w = window.innerWidth, h = window.innerHeight;
        el.style.left = el.style.right = el.style.top = el.style.bottom = "";
        if (spot.name === "bottom") {
            el.style.bottom = "0";
            el.style.left = rand(0.05, 0.8) * w + "px";
        } else if (spot.name === "top") {
            el.style.top = "0";
            el.style.left = rand(0.1, 0.8) * w + "px";
        } else {
            el.style.top = rand(0.25, 0.7) * h + "px";
            el.style[spot.name] = "-10px";
        }
        el.style.transformOrigin = spot.name === "bottom" ? "50% 100%" : "50% 50%";
    }

    function freeSpot(el) {
        let spot = pick(SPOTS);
        for (let attempt = 0; attempt < 10; attempt++) {
            spot = pick(SPOTS);
            placeMartian(el, spot);
            const x = parseFloat(el.style.left) || 0, y = parseFloat(el.style.top) || 0;
            const close = crowd.some(m => m.spot.name === spot.name &&
                Math.hypot((parseFloat(m.el.style.left) || 0) - x, (parseFloat(m.el.style.top) || 0) - y) < 150);
            if (!close) break;
        }
        return spot;
    }

    function updateHint() {
        const quiet = crowd.filter(m => m.state === "quiet").length;
        if (musicPlaying() || quiet <= HINT_AFTER || isOff()) {
            if (hint) hint.classList.remove("visible");
            return;
        }
        if (!hint) {
            hint = document.createElement("div");
            hint.className = "cm-hint";
            hint.setAttribute("role", "status");
            document.body.appendChild(hint);
        }
        const lang = (document.documentElement.lang || "en").slice(0, 2);
        hint.textContent = HINT[lang] || HINT.en;
        hint.dir = lang === "he" ? "rtl" : "ltr";
        hint.classList.add("visible");
    }
    // END SECTION 4

    // BEGIN MARS SECTION 4 — взрыв: осколки шлема, кровь, мозги, слизь и глаз
    // Каждый кусочек летит по дуге (вверх и вниз под «тяжестью») через Web Animations API,
    // а капли крови остаются пятнами на странице и потом тают.
    function fling(piece, x, y, spread, lift, spin, duration) {
        const angle = rand(-Math.PI, 0) + rand(-0.5, 0.5);
        const dx = Math.cos(angle) * rand(spread * 0.35, spread);
        const up = -rand(lift * 0.4, lift);
        const fall = rand(60, 220);
        piece.style.left = x + "px";
        piece.style.top = y + "px";
        stage.appendChild(piece);
        const turn = rand(-spin, spin);
        return piece.animate([
            {transform: "translate(-50%, -50%) scale(.4) rotate(0deg)", opacity: 1},
            {transform: `translate(calc(-50% + ${dx * 0.6}px), calc(-50% + ${up}px)) scale(1) rotate(${turn * 0.6}deg)`, opacity: 1, offset: 0.45},
            {transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${fall}px)) scale(1) rotate(${turn}deg)`, opacity: 1}
        ], {duration, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards"});
    }

    function explode(x, y) {
        const pieces = [];
        const add = (className, style, spread, lift, spin, duration) => {
            const piece = document.createElement("div");
            piece.className = className;
            // setProperty понимает и обычные свойства, и CSS-переменные вроде --brain
            Object.entries(style).forEach(([name, value]) => piece.style.setProperty(name, value));
            fling(piece, x, y, spread, lift, spin, duration);
            pieces.push(piece);
            return piece;
        };
        // Вспышка и облако кровавой пыли в момент взрыва
        const burst = document.createElement("div");
        burst.className = "cm-burst";
        burst.style.left = x + "px";
        burst.style.top = y + "px";
        stage.appendChild(burst);
        pieces.push(burst);
        // Осколки шлема
        for (let i = 0; i < 9; i++) {
            const size = rand(8, 18);
            add("cm-shard", {width: size + "px", height: size * rand(1.2, 2) + "px"}, 220, 160, 720, rand(700, 1000));
        }
        // Кровь: много вытянутых капель
        for (let i = 0; i < 26; i++) {
            const size = rand(4, 13);
            add("cm-blood", {width: size + "px", height: size * rand(1, 1.8) + "px", background: pick(BLOOD)}, 260, 200, 90, rand(650, 1100));
        }
        // Куски мозга с извилинами
        for (let i = 0; i < 7; i++) {
            const size = rand(14, 28);
            add("cm-brain", {width: size + "px", height: size * rand(.7, 1) + "px", "--brain": pick(BRAIN)}, 200, 150, 260, rand(800, 1200));
        }
        // Зелёная слизь
        for (let i = 0; i < 6; i++) {
            const size = rand(7, 15);
            add("cm-goo", {width: size + "px", height: size + "px", background: pick(GOO)}, 180, 120, 60, rand(700, 1000));
        }
        // Глаз: улетает дальше всех, потом моргает и укатывается
        const eye = add("cm-eyeball", {}, 240, 190, 540, 1100);
        return {pieces, eye};
    }

    // Клякса как SVG: неровное пятно с выплесками-лучами, капли вокруг, подтёки вниз и влажный блик.
    // Форма каждый раз новая (случайные радиусы), поэтому две кляксы никогда не совпадают.
    function splatSVG(color, brainy) {
        const R = 46, points = [], count = 18;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            points.push([Math.cos(angle) * R * rand(0.72, 1.08), Math.sin(angle) * R * rand(0.72, 1.08)]);
            if (Math.random() < 0.38) { // выплеск: узкий длинный луч
                const reach = R * rand(1.35, 2.05), side = 0.05;
                points.push([Math.cos(angle + side) * R * 0.95, Math.sin(angle + side) * R * 0.95]);
                points.push([Math.cos(angle + side * 2) * reach, Math.sin(angle + side * 2) * reach]);
                points.push([Math.cos(angle + side * 3) * R * 0.95, Math.sin(angle + side * 3) * R * 0.95]);
            }
        }
        let d = "";
        for (let i = 0; i < points.length; i++) {
            const [x, y] = points[i], [nx, ny] = points[(i + 1) % points.length];
            const mx = (x + nx) / 2, my = (y + ny) / 2;
            d += i === 0 ? `M${mx.toFixed(1)} ${my.toFixed(1)}` : `Q${x.toFixed(1)} ${y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
        }
        d += `Q${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)} ${((points[0][0] + points[1][0]) / 2).toFixed(1)} ${((points[0][1] + points[1][1]) / 2).toFixed(1)}Z`;
        let drops = "";
        for (let i = 0; i < 14; i++) {
            const angle = rand(0, Math.PI * 2), dist = R * rand(1.15, 2.1);
            drops += `<circle cx="${(Math.cos(angle) * dist).toFixed(1)}" cy="${(Math.sin(angle) * dist).toFixed(1)}" r="${rand(1.2, 5).toFixed(1)}"/>`;
        }
        let drips = "";
        for (let i = 0; i < Math.round(rand(2, 4)); i++) {
            const x = rand(-R * 0.6, R * 0.6), width = rand(4, 9), length = rand(40, 130);
            drips += `<g class="cm-drip" style="--drip-time:${rand(1.8, 3.2).toFixed(2)}s;--drip-delay:${rand(0.2, 0.6).toFixed(2)}s">` +
                `<rect x="${(x - width / 2).toFixed(1)}" y="0" width="${width.toFixed(1)}" height="${length.toFixed(1)}" rx="${(width / 2).toFixed(1)}"/>` +
                `<circle cx="${x.toFixed(1)}" cy="${length.toFixed(1)}" r="${(width * 0.75).toFixed(1)}"/></g>`;
        }
        let chunks = "";
        if (brainy) {
            for (let i = 0; i < 3; i++) {
                const x = rand(-22, 22), y = rand(-22, 18), w = rand(9, 16);
                chunks += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${w.toFixed(1)}" ry="${(w * 0.75).toFixed(1)}" fill="${pick(BRAIN)}" stroke="#7d2f45" stroke-width="1"/>` +
                    `<path d="M${(x - w * 0.6).toFixed(1)} ${y.toFixed(1)} q${(w * 0.3).toFixed(1)} -4 ${(w * 0.6).toFixed(1)} 0 t${(w * 0.6).toFixed(1)} 0" stroke="#8e3a55" stroke-width="1.2" fill="none"/>`;
            }
        }
        return `<svg viewBox="-110 -110 220 260" aria-hidden="true"><g fill="${color}">` +
            `<g class="cm-drips">${drips}</g><path d="${d}"/>${drops}</g>` +
            `<path d="${d}" fill="none" stroke="rgba(40,0,0,.45)" stroke-width="3"/>${chunks}` +
            `<ellipse cx="-14" cy="-16" rx="12" ry="6" fill="rgba(255,255,255,.32)" transform="rotate(-30 -14 -16)"/></svg>`;
    }

    // Пятна крови (и иногда мозгов) «на стекле» экрана: шлепок изнутри и подтёки вниз
    function screenSplat() {
        const blobs = [];
        const count = Math.round(rand(3, 6));
        for (let i = 0; i < count; i++) {
            const blob = document.createElement("div");
            blob.className = "cm-glass";
            const size = rand(110, 240);
            blob.style.width = size + "px";
            blob.style.height = size * 260 / 220 + "px";
            blob.style.left = rand(0.06, 0.86) * window.innerWidth - size / 2 + "px";
            blob.style.top = rand(0.05, 0.6) * window.innerHeight - size / 2 + "px";
            blob.style.animationDelay = i * 70 + "ms";
            blob.innerHTML = splatSVG(pick(BLOOD), Math.random() < 0.3); // разметка строится в этом файле из чисел
            stage.appendChild(blob);
            blobs.push(blob);
        }
        setTimeout(() => playSplat(1, false), 60);
        return blobs;
    }
    // END MARS SECTION 4

    // BEGIN MARS SECTION 5 — звук: треск стекла и мокрый «шлёп»
    // Короткий шум с падающим фильтром, глухой удар и (по желанию) высокий звон осколков.
    // Громкость — от громкости музыки сайта.
    let audioCtx = null;

    function playSplat(strength, glass) {
        try {
            const m = music();
            const volume = (m ? m.volume : 0.5) * 0.75 * strength;
            if (volume <= 0) return;
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === "suspended") audioCtx.resume();
            const now = audioCtx.currentTime;
            const noiseBurst = (seconds, from, to, type, gainValue) => {
                const buffer = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * seconds), audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
                const source = audioCtx.createBufferSource();
                source.buffer = buffer;
                const filter = audioCtx.createBiquadFilter();
                filter.type = type;
                filter.frequency.setValueAtTime(from, now);
                filter.frequency.exponentialRampToValueAtTime(to, now + seconds * 0.85);
                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(gainValue, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
                source.connect(filter).connect(gain).connect(audioCtx.destination);
                source.start(now);
            };
            noiseBurst(0.45, 2600, 140, "lowpass", volume);                 // мокрый шлепок
            if (glass) noiseBurst(0.25, 6000, 3500, "highpass", volume * 0.5); // звон осколков
            const thump = audioCtx.createOscillator();
            thump.frequency.setValueAtTime(130, now);
            thump.frequency.exponentialRampToValueAtTime(38, now + 0.22);
            const thumpGain = audioCtx.createGain();
            thumpGain.gain.setValueAtTime(volume, now);
            thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            thump.connect(thumpGain).connect(audioCtx.destination);
            thump.start(now);
            thump.stop(now + 0.27);
        } catch (e) {
            // нет Web Audio — просто без звука
        }
    }
    // END MARS SECTION 5

    // BEGIN SECTION 6 — друг, который ест марсиан
    function playGulp() {
        try {
            const volume = music().volume * 0.6 || 0.3;
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;
            const oscillator = audioCtx.createOscillator();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(90, now);
            oscillator.frequency.exponentialRampToValueAtTime(320, now + 0.18);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            oscillator.connect(gain).connect(audioCtx.destination);
            oscillator.start(now);
            oscillator.stop(now + 0.24);
        } catch (e) {
            // нет Web Audio — без звука
        }
    }

    function visibleFriend() {
        if (!config.friendEats || !config.friend) return null;
        const friend = document.querySelector(config.friend);
        if (!friend) return null;
        const r = friend.getBoundingClientRect();
        return r.width && r.bottom > 0 && r.top < window.innerHeight ? friend : null;
    }

    // Язык вылетает из друга, ловит марсианина, и тот улетает в рот, как муха
    async function eatMartian(martian, friend) {
        martian.state = "eaten";
        clearInterval(martian.fidget);
        const el = martian.el;
        const fr = friend.getBoundingClientRect();
        const mr = el.querySelector(".cm-head").getBoundingClientRect();
        const fx = fr.left + fr.width / 2, fy = fr.top + fr.height * 0.6;
        const mx = mr.left + mr.width / 2, my = mr.top + mr.height / 2;
        const angle = Math.atan2(my - fy, mx - fx);
        const tongue = document.createElement("div");
        tongue.className = "cm-tongue";
        tongue.style.left = fx + "px";
        tongue.style.top = fy + "px";
        tongue.style.width = Math.hypot(mx - fx, my - fy) + "px";
        tongue.style.transform = `rotate(${angle}rad) scaleX(0)`;
        document.body.appendChild(tongue);
        await wait(30);
        tongue.style.transform = `rotate(${angle}rad) scaleX(1)`; // хлоп!
        await wait(200);
        const er = el.getBoundingClientRect();
        el.style.transition = "transform .22s ease-in";
        el.style.transform = `translate(${fx - (er.left + er.width / 2)}px, ${fy - (er.top + er.height / 2)}px) scale(.08)`;
        tongue.style.transform = `rotate(${angle}rad) scaleX(0)`;
        await wait(230);
        el.remove();
        tongue.remove();
        crowd.splice(crowd.indexOf(martian), 1);
        playGulp();
        friend.classList.add("cm-gulp");
        setTimeout(() => friend.classList.remove("cm-gulp"), 950);
        count("eaten");
        updateHint();
    }

    function maybeEat(martian) {
        const friend = visibleFriend();
        if (!friend || !(forceEat || Math.random() < 0.25)) return false;
        forceEat = false;
        eatMartian(martian, friend);
        return true;
    }
    // END SECTION 6

    // BEGIN SECTION 7 — толпа, танец и взрывы
    async function spawn() {
        if (!canShow() || crowd.length >= MAX_CROWD) return null;
        const el = document.createElement("div");
        el.className = "cm-martian";
        el.innerHTML = MARTIAN_SVG; // постоянная разметка из этого файла, без данных пользователя
        const spot = freeSpot(el);
        el.style.transform = spot.hidden;
        stage.appendChild(el);
        const martian = {el, spot, state: "quiet", fidget: null};
        crowd.push(martian);
        await wait(50);
        el.style.transform = spot.shown;
        if (musicPlaying()) doom(martian);
        else quiet(martian);
        return martian;
    }

    // Тишина: сидит у края, оглядывается, то прячется наполовину, то снова высовывается
    function quiet(martian) {
        martian.state = "quiet";
        martian.el.classList.add("quiet");
        clearInterval(martian.fidget);
        let peeking = false;
        martian.fidget = setInterval(() => {
            if (martian.state !== "quiet") return;
            peeking = !peeking;
            martian.el.style.transform = peeking ? martian.spot.peek : martian.spot.shown;
        }, rand(3000, 7000));
        updateHint();
    }

    function doom(martian) {
        martian.state = "doomed";
        clearInterval(martian.fidget);
        martian.el.classList.remove("quiet");
        martian.el.style.transform = martian.spot.shown;
        updateHint();
        runQueue();
    }

    async function waitOrSilence(ms) {
        const end = Date.now() + ms;
        while (Date.now() < end && musicPlaying()) await wait(200);
    }

    async function runQueue() {
        if (queueRunning) return;
        queueRunning = true;
        let first = true;
        while (musicPlaying()) {
            const next = crowd.find(m => m.state === "doomed");
            if (!next) break;
            await waitOrSilence(first ? rand(DANCE[0], DANCE[1]) : rand(NEXT_POP[0], NEXT_POP[1]));
            while (!canShow() && musicPlaying() && !isOff()) await wait(500);
            if (!musicPlaying() || next.state !== "doomed") break;
            first = false;
            if (maybeEat(next)) continue;        // друг успел раньше музыки
            await pop(next);
        }
        queueRunning = false;
    }

    async function pop(martian) {
        martian.state = "popping";
        const el = martian.el;
        el.classList.add("frenzy");
        await wait(1100);
        el.classList.add("swelling");
        await wait(1500);
        const head = el.querySelector(".cm-head").getBoundingClientRect();
        el.classList.add("popped");
        const {pieces, eye} = explode(head.left + head.width / 2, head.top + head.height * 0.45);
        playSplat(0.8, true);
        count("popped");
        aftermath(martian, pieces, eye);
    }

    async function aftermath(martian, pieces, eye) {
        const el = martian.el;
        let glass = [];
        if (Math.random() < 0.38) {
            await wait(220);
            glass = screenSplat();
        }
        await wait(1000);
        eye.classList.add("blinking");
        el.classList.add("searching");
        await wait(1800);
        el.classList.remove("searching");
        el.classList.add("waving");
        const rolled = getComputedStyle(eye).transform;
        eye.animate([
            {transform: rolled},
            {transform: `${rolled} translateX(${rand(-260, 260)}px) rotate(${rand(-720, 720)}deg)`}
        ], {duration: 1600, easing: "ease-in", fill: "forwards"});
        await wait(900);
        el.style.transform = martian.spot.hidden;
        pieces.forEach(piece => piece.classList.add("fading"));
        await wait(2300);
        el.remove();
        crowd.splice(crowd.indexOf(martian), 1);
        pieces.forEach(piece => piece.remove());
        glass.forEach(blob => blob.classList.add("fading"));
        await wait(1500);
        glass.forEach(blob => blob.remove());
    }

    function schedule(range) {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            const martian = await spawn();
            // В тишине друг тоже не дремлет: иногда ловит одного из толпы
            if (martian && !musicPlaying()) {
                const quietOnes = crowd.filter(m => m.state === "quiet");
                if (quietOnes.length > 1) maybeEat(pick(quietOnes));
            }
            schedule(musicPlaying() ? rate.music : rate.quiet);
        }, rand(range[0], range[1]));
    }

    let wasPlaying = false;

    function onMusicChange() {
        if (!stage) return;
        const now = musicPlaying();
        if (now === wasPlaying) return;
        wasPlaying = now;
        if (now) crowd.filter(m => m.state === "quiet").forEach(doom);
        else crowd.filter(m => m.state === "doomed").forEach(quiet);
        updateHint();
        schedule(now ? rate.music : rate.quiet);
    }

    // Выключатель убирает всех марсиан сразу и запоминает выбор для всех проектов
    function hideEveryone() {
        crowd.filter(m => m.state === "quiet" || m.state === "doomed").forEach(martian => {
            martian.state = "gone";
            clearInterval(martian.fidget);
            martian.el.style.transform = martian.spot.hidden;
            setTimeout(() => {
                martian.el.remove();
                crowd.splice(crowd.indexOf(martian), 1);
            }, 700);
        });
        updateHint();
    }

    function addToggle() {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cm-toggle";
        button.textContent = "👽";
        const refresh = () => {
            const off = isOff();
            button.classList.toggle("cm-off", off);
            button.title = off ? "Martians are off — click to let them back" : "Martians: click to turn them off";
            button.setAttribute("aria-label", button.title);
            button.setAttribute("aria-pressed", String(!off));
        };
        button.addEventListener("click", () => {
            save("off", !isOff());
            refresh();
            if (isOff()) hideEveryone();
        });
        refresh();
        document.body.appendChild(button);
    }

    function init() {
        if (reducedMotion) return;
        const style = document.createElement("style");
        style.textContent = CSS;
        document.head.appendChild(style);
        stage = document.createElement("div");
        stage.className = "cm-stage";
        stage.setAttribute("aria-hidden", "true");
        document.body.appendChild(stage);
        addToggle();
        document.querySelectorAll("audio, video").forEach(track);
        wasPlaying = musicPlaying();
        schedule([4000, 8000]);
    }
    // END SECTION 7

    // Стили из Mars-project2 плюс свои: язык друга, «глоток» и кнопка-выключатель
    const CSS = `.cm-stage {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 1030; 
}
.cm-martian {
    position: absolute;
    width: 100px;
    height: 132px;
    transition: transform 0.55s cubic-bezier(.2, .9, .3, 1.35);
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, .55));
}
.cm-martian svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}
.cm-martian .cm-body {
    transform-origin: 50% 100%;
    animation: cm-groove 0.42s ease-in-out infinite alternate;
}
@keyframes cm-groove {
    from { transform: rotate(-8deg) translateY(0); }
    to { transform: rotate(8deg) translateY(-5px); }
}
.cm-martian.quiet .cm-body { animation: cm-look 1.4s ease-in-out infinite alternate; }
@keyframes cm-look {
    from { transform: rotate(-4deg); }
    to { transform: rotate(4deg); }
}
.cm-martian .cm-eye { transform-box: fill-box; transform-origin: 50% 50%; }
.cm-martian .cm-veins { opacity: 0; }
.cm-martian .cm-crack { opacity: 0; }
.cm-martian .cm-zap { opacity: 0; }
.cm-martian .cm-light { animation: cm-light 0.6s steps(2, end) infinite; }
.cm-martian .cm-neck-stump { opacity: 0; }
@keyframes cm-light { 50% { opacity: .2; } }
.cm-martian.frenzy .cm-body { animation-duration: 0.16s; }
.cm-martian.frenzy .cm-eye { animation: cm-eye-bulge 0.22s ease-in-out infinite alternate; }
.cm-martian.frenzy .cm-veins { animation: cm-veins 0.3s ease-in-out infinite alternate; }
.cm-martian.frenzy .cm-crack { opacity: 1; transition: opacity .2s ease .5s; }
.cm-martian.frenzy .cm-zap { animation: cm-zap 0.35s steps(2, end) infinite; }
@keyframes cm-eye-bulge {
    from { transform: scale(1.05) translate(-.6px, 0); }
    to { transform: scale(1.35) translate(.6px, -.4px); }
}
@keyframes cm-veins {
    from { opacity: .35; }
    to { opacity: 1; }
}
@keyframes cm-zap {
    0% { opacity: 1; }
    100% { opacity: 0; }
}
.cm-martian.swelling .cm-head {
    transform-box: fill-box;
    transform-origin: 50% 85%;
    animation: cm-swell 1.5s cubic-bezier(.5, 0, .9, .6) forwards;
}
@keyframes cm-swell {
    0% { transform: scale(1); }
    55% { transform: scale(1.3, 1.2); }
    70% { transform: scale(1.22, 1.42); }
    85% { transform: scale(1.55, 1.4); }
    100% { transform: scale(1.85); }
}
.cm-martian.popped .cm-head { visibility: hidden; }
.cm-martian.popped .cm-neck-stump { opacity: 1; }
.cm-martian.popped .cm-zap { animation: none; opacity: 0; }
.cm-martian.popped .cm-body { animation: cm-wobble 0.22s ease-in-out 4; }
@keyframes cm-wobble {
    from { transform: rotate(-14deg); }
    to { transform: rotate(14deg); }
}
.cm-burst {
    position: absolute;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(255, 250, 220, .95) 0 12%, rgba(255, 70, 40, .75) 30%, rgba(120, 0, 0, .45) 55%, transparent 72%);
    animation: cm-burst 0.55s ease-out forwards;
}
@keyframes cm-burst {
    from { transform: translate(-50%, -50%) scale(.2); opacity: 1; }
    to { transform: translate(-50%, -50%) scale(2.1); opacity: 0; }
}
.cm-shard {
    position: absolute;
    background: linear-gradient(135deg, rgba(235, 250, 255, .9), rgba(160, 215, 235, .35));
    clip-path: polygon(50% 0, 100% 70%, 30% 100%, 0 40%);
}
.cm-blood {
    position: absolute;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    box-shadow: inset -1px -2px 2px rgba(0, 0, 0, .35);
}
.cm-brain {
    --brain: #e7a3b1;            
    position: absolute;
    border-radius: 46% 54% 42% 58% / 55% 45% 58% 42%;
    background:
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, .45) 0 10%, transparent 12%),
            repeating-radial-gradient(circle at 60% 60%, transparent 0 3px, rgba(140, 40, 70, .55) 3px 4px),
            var(--brain);
    box-shadow: inset -2px -3px 4px rgba(90, 0, 20, .45), 0 0 0 1px rgba(120, 0, 0, .5);
}
.cm-goo {
    position: absolute;
    border-radius: 50%;
    box-shadow: inset -2px -2px 3px rgba(0, 60, 0, .35);
}
.cm-eyeball {
    position: absolute;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background:
            radial-gradient(circle at 52% 50%, #050505 0 14%, #8b0000 15% 30%, transparent 31%),
            radial-gradient(circle at 40% 35%, #fffbe8 0 35%, #f1e3c2 60%, #d79a8a 100%);
    box-shadow: inset 0 0 0 1px rgba(150, 0, 0, .5), 0 3px 6px rgba(0, 0, 0, .4);
}
.cm-eyeball::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #b4bd8c;
    transform: scaleY(0);
    transform-origin: 50% 0;
}
.cm-eyeball.blinking::after { animation: cm-blink 0.9s ease-in-out 2; }
@keyframes cm-blink {
    0%, 40%, 100% { transform: scaleY(0); }
    55%, 65% { transform: scaleY(1); }
}
.cm-shard.fading,
.cm-blood.fading,
.cm-brain.fading,
.cm-goo.fading,
.cm-eyeball.fading {
    transition: opacity 2.2s ease;
    opacity: 0;
}
.cm-glass {
    position: absolute;
    opacity: .93;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, .35));
    animation: cm-glass-hit 0.24s cubic-bezier(.2, 1.6, .4, 1) both;
}
.cm-glass svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}
.cm-drip {
    --drip-time: 2.4s;           
    --drip-delay: .3s;
    transform-box: fill-box;
    transform-origin: 50% 0;
    transform: scaleY(.04);
    animation: cm-drip var(--drip-time) cubic-bezier(.5, 0, .8, .6) var(--drip-delay) forwards;
}
@keyframes cm-glass-hit {
    0% { transform: scale(.15); filter: blur(5px); opacity: 0; }
    100% { transform: scale(1); filter: blur(0) drop-shadow(0 2px 3px rgba(0, 0, 0, .35)); opacity: .93; }
}
@keyframes cm-drip { to { transform: scaleY(1); } }
.cm-glass.fading {
    animation: none; 
    transition: opacity 1.4s ease;
    opacity: 0;
}
.cm-martian.searching .cm-body { animation: cm-search 0.5s ease-in-out infinite alternate; }
.cm-martian.searching .cm-arm { transform-box: fill-box; transform-origin: 100% 100%; animation: cm-pat 0.3s ease-in-out infinite alternate; }
@keyframes cm-search {
    from { transform: rotate(-5deg) translateX(-3px); }
    to { transform: rotate(5deg) translateX(3px); }
}
@keyframes cm-pat {
    from { transform: rotate(0deg); }
    to { transform: rotate(-35deg); }
}
.cm-martian.waving .cm-body { animation: none; }
.cm-martian.waving .cm-arm--right { transform-box: fill-box; transform-origin: 0 100%; animation: cm-wave 0.25s ease-in-out infinite alternate; }
@keyframes cm-wave {
    from { transform: rotate(10deg); }
    to { transform: rotate(-40deg); }
}
.cm-hint {
    position: fixed;
    inset-inline-end: 16px;
    bottom: 16px;
    z-index: 1031;
    max-width: min(340px, calc(100vw - 32px));
    padding: 10px 14px;
    border: 1px solid rgba(255, 255, 255, .25);
    border-inline-start: 3px solid #c81d1d;
    background: rgba(12, 14, 20, .88);
    color: #f1f1ea;
    font: 500 .85rem/1.45 system-ui, sans-serif;
    box-shadow: 0 8px 24px rgba(0, 0, 0, .4);
    pointer-events: none;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity .35s ease, transform .35s ease;
}
.cm-hint.visible { opacity: 1; transform: none; }
@media (max-width: 575.98px) {
    .cm-martian { width: 70px; height: 92px; }
}
.cm-tongue{position:fixed;z-index:1031;height:7px;margin-top:-3px;border-radius:4px;background:linear-gradient(90deg,#e8829c,#a8495f);transform-origin:0 50%;pointer-events:none;transition:transform .16s ease-out}
.cm-gulp{animation:cm-gulp .45s ease-in-out 2}
@keyframes cm-gulp{0%,100%{transform:scale(1)}50%{transform:scale(1.18,.9)}}
.cm-toggle{position:fixed;left:10px;bottom:10px;z-index:1029;width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,0,0,.2);background:rgba(255,255,255,.75);font-size:18px;line-height:30px;padding:0;cursor:pointer;opacity:.45;transition:opacity .2s}
.cm-toggle:hover,.cm-toggle:focus-visible{opacity:1}
.cm-toggle.cm-off{filter:grayscale(1)}
@media (prefers-reduced-motion: reduce){.cm-toggle{display:none}}`;

    // Для проверки из консоли: cosmoMartians.show(), .eat(), .splat(), .stats()
    window.cosmoMartians = {
        show: () => spawn(),
        eat: async () => {
            forceEat = true;
            const martian = crowd.find(m => m.state === "quiet" || m.state === "doomed") || await spawn();
            if (martian && !maybeEat(martian)) forceEat = false;
        },
        splat: () => stage && screenSplat(),
        stats: () => readStats(),
        count: () => crowd.length,
        config
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
