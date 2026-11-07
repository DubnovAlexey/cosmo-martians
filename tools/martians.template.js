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
//   data-music        CSS-селектор плеера, который считается музыкой (например "#playlistAudio");
//                     без него музыкой считается любой звучащий <audio>/<video> длиннее 8 секунд —
//                     а с ним фоновый гул или звуки интерфейса страницы марсиан не взрывают
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
        friendEats: !!(script && script.dataset.friendEats === "true"),
        music: script && script.dataset.music
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
        if (config.music) {
            // Страница назвала свой музыкальный плеер — остальные звуки (фон, щелчки) музыкой не считаются
            try { if (!media.matches(config.music)) return false; } catch (e) { return false; }
        }
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

/*@@MARS_SECTION_2@@*/

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

    const SPOT_WEIGHTS = {bottom: 0.38, top: 0.3, left: 0.16, right: 0.16}; // сверху и снизу — чаще
    function pickSpot() {
        let roll = Math.random();
        for (const spot of SPOTS) { roll -= SPOT_WEIGHTS[spot.name]; if (roll <= 0) return spot; }
        return SPOTS[0];
    }

    function freeSpot(el) {
        let spot = pickSpot();
        for (let attempt = 0; attempt < 10; attempt++) {
            spot = pickSpot();
            placeMartian(el, spot);
            const x = parseFloat(el.style.left) || 0, y = parseFloat(el.style.top) || 0;
            const close = crowd.some(m => m.spot.name === spot.name &&
                Math.hypot((parseFloat(m.el.style.left) || 0) - x, (parseFloat(m.el.style.top) || 0) - y) < 150);
            if (!close) break;
        }
        return spot;
    }

    // Нажатие на тревогу включает музыку страницы: кнопкой с data-martian-play, если она есть,
    // иначе первым <audio> на странице
    function startMusic() {
        if (musicPlaying()) return;
        const control = document.querySelector("[data-martian-play]");
        if (control) { control.click(); return; }
        const audio = (config.music && document.querySelector(config.music)) || document.querySelector("audio");
        if (audio) audio.play().catch(() => {});
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
            hint.setAttribute("role", "alert");
            hint.innerHTML = '<span class="cm-hint__sign" aria-hidden="true">⚠</span><span class="cm-hint__text"></span>';
            hint.addEventListener("click", startMusic); // табличку можно нажать — она включает музыку страницы
            document.body.appendChild(hint);
        }
        const lang = (document.documentElement.lang || "en").slice(0, 2);
        hint.querySelector(".cm-hint__text").textContent = HINT[lang] || HINT.en;
        hint.dir = lang === "he" ? "rtl" : "ltr";
        hint.classList.add("visible");
    }
    // END SECTION 4

/*@@MARS_SECTION_4@@*/

/*@@MARS_SECTION_5@@*/

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
        // Появился — сразу палит, не дожидаясь музыки
        setTimeout(() => { if (martian.state === "quiet" && canShow()) volley(martian); }, rand(500, 1200));
        martian.fidget = setInterval(() => {
            if (martian.state !== "quiet") return;
            peeking = !peeking;
            martian.el.style.transform = peeking ? martian.spot.peek : martian.spot.shown;
            if (!peeking && canShow() && Math.random() < 0.55) setTimeout(() => volley(martian), 600);
        }, rand(3000, 7000));
        updateHint();
    }

    function volley(martian) {
        if (!martian.el.isConnected) return;
        fireBlaster(martian);
        if (Math.random() < 0.55) setTimeout(() => martian.el.isConnected && fireBlaster(martian), 380);
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
        await wait(250);
        fireBlaster(martian);                     // пиу!
        await wait(420);
        if (Math.random() < 0.6) fireBlaster(martian);
        await wait(430);
        el.classList.add("swelling");
        await wait(1500);
        const head = el.querySelector(".cm-head").getBoundingClientRect();
        el.classList.add("popped");
        const x = head.left + head.width / 2, y = head.top + head.height * 0.45;
        explode(x, y);
        playSplat(0.8, true);
        count("popped");
        aftermath(martian, organsFrom(x, y));
    }

    // Тело без головы вылезает целиком, ищет голову, машет, падает и уползает; части на стекле сползают и тают
    async function aftermath(martian, organs) {
        const el = martian.el;
        el.style.transform = martian.spot.out;
        await wait(700);
        el.classList.add("searching");
        await wait(1800);
        el.classList.remove("searching");
        el.classList.add("waving");
        await wait(1500);
        el.classList.remove("waving");
        el.classList.add("fallen");
        await wait(1100);
        el.style.transform = martian.spot.hidden;
        await wait(900);
        el.remove();
        crowd.splice(crowd.indexOf(martian), 1);
        const rest = organs.done - 6000;
        if (rest > 0) await wait(rest);
        await wait(1200);
        organs.parts.forEach(part => part.classList.add("fading"));
        await wait(1500);
        organs.parts.forEach(part => part.remove());
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
    const CSS = `/*@@MARS_CSS@@*/
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
