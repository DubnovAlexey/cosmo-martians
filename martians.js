// cosmo-martians/martians.js
// Сквозная пасхалка портфолио: мультяшные марсиане, жуткие до смешного (в духе «Марс атакует!»,
// но свой рисунок). Один файл на все проекты — подключается одной строкой:
//
//   <script src="https://dubnovalexey.github.io/cosmo-martians/martians.js"
//           data-project="library" data-name="My Library" defer></script>
//
// Без музыки марсиане выглядывают из краёв экрана и прячутся. Как только на странице заиграл звук
// (любой <audio>, <video> или new Audio()), они пританцовывают — и у них лопается голова:
// розовые брызги мозга, зелёная слизь и звук «шлёп». Иногда кляксы прилетают «изнутри на стекло».
//
// Настройки — атрибуты тега <script>:
//   data-project   короткое имя проекта (для реплик и общего счётчика), например "olympic-rings"
//   data-name      имя проекта для людей: "Olympic Rings Gallery"
//   data-rate      "normal" (по умолчанию) или "rare" — для рабочих программ, где важно не мешать
//   data-friend    CSS-селектор «друга» на странице, который отвечает марсианам (например ".zoich")
//   data-friend-name  его имя: "Zoich"
//   data-friend-eats  "true" — друг иногда ловит марсианина языком и глотает, как муху
// Проекты со звуком Web Audio сообщают о музыке сами:
//   window.dispatchEvent(new CustomEvent("cosmo:music", {detail: {playing: true}}))
//
// Общая память проектов (у всех один адрес dubnovalexey.github.io, значит, и localStorage общий):
//   cosmo-martians:off     выключатель на все проекты сразу
//   cosmo-martians:stats   сколько голов лопнуло всего и в каждом проекте
//   cosmo-martians:last    из какого проекта марсианин «пришёл» — для реплики «I followed you from…»
//
// Не появляются при «уменьшить анимацию» в системе, на скрытой вкладке, при открытом окне
// и пока посетитель печатает в поле ввода. Клики не перехватывают.

(function () {
    if (window.cosmoMartians) return; // подключили дважды — работает один экземпляр

    const script = document.currentScript;
    const config = {
        project: (script && script.dataset.project) || location.pathname.split("/")[1] || "site",
        name: (script && script.dataset.name) || document.title || "this site",
        rate: (script && script.dataset.rate) || "normal",
        friend: script && script.dataset.friend,
        friendName: (script && script.dataset.friendName) || "Friend",
        friendEats: !!(script && script.dataset.friendEats === "true")
    };

    const STORE = "cosmo-martians:";
    const RATES = {
        normal: {quiet: [12000, 25000], first: [2000, 5000], music: [8000, 18000]},
        rare: {quiet: [45000, 90000], first: [8000, 15000], music: [30000, 60000]}
    };
    const rate = RATES[config.rate] || RATES.normal;

    // Брызги: розовые кусочки мозга, зелёная марсианская слизь и немного неона
    const COLORS = ["#f4a3b8", "#e8829c", "#d65c7f", "#f4a3b8", "#9fd36b", "#7ed957", "#3bff9c", "#ffd23f", "#b23bff"];

    const LINES = {
        default: {
            music: ["Too… much… groove!", "Turn it down, Earthling!", "My brain can't take the bass!",
                "Is this Earth music?!", "Not the yodelling, please!", "Who put on Slim Whitman?!"],
            quiet: ["Psst… the Earthlings are quiet.", "No music? Good. Very good.", "We come in peace. Mostly.",
                "Just looking…", "Nobody press Play, OK?"]
        },
        mars: {music: ["This is OUR planet's website!"], quiet: ["Who wrote all these myths about us?!"]},
        "olympic-rings": {music: ["Gold medal in head-popping!", "These rings… so hypnotic…"],
            quiet: ["Are the rings a landing pad?"]},
        library: {music: ["Shhh! This is a library!", "This book is too loud!"],
            quiet: ["Any books about Earth cooking?", "I'll just borrow… a human."]},
        coffee: {music: ["Too much caffeine for one brain!", "Is this coffee from Mars?!"],
            quiet: ["Smells like a red planet…"]},
        "devil-cat": {music: ["That cat is scarier than us!", "Nice kitty… NICE kitty…"],
            quiet: ["Is that cat… one of us?"]}
    };
    const lines = (kind) => (LINES.default[kind]).concat((LINES[config.project] || {})[kind] || []);

    // Реплики «друга» (например, Зойча — неофициального талисмана Сочи-2014): судья марсианской олимпиады
    const FRIEND_LINES = {
        afterPop: ["10 points for the splash!", "And that's a new world record!", "Disqualified for head loss!",
            "The judges are… speechless.", "Unofficial mascot approves."],
        quiet: ["I see you, Martian.", "No music — no medals.", "Warm-up is over, press Play!"],
        ate: ["Mmm, crunchy!", "Tastes like a red planet.", "Burp. Excuse me.", "Flies were smaller in Sochi."]
    };

    // ---------- Память на все проекты ----------
    function load(key, fallback) {
        try {
            const v = JSON.parse(localStorage.getItem(STORE + key));
            return v === null ? fallback : v;
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

    // Проверяем структуру общей памяти: валидный JSON ещё не гарантирует корректный счётчик.
    function readStats() {
        const raw = load("stats", null);
        const stats = {total: 0, projects: Object.create(null)};
        if (!raw || typeof raw !== "object") return stats;
        if (Number.isSafeInteger(raw.total) && raw.total >= 0) stats.total = raw.total;
        if (raw.projects && typeof raw.projects === "object" && !Array.isArray(raw.projects)) {
            for (const [key, value] of Object.entries(raw.projects)) {
                if (Number.isSafeInteger(value) && value >= 0) stats.projects[key] = value;
            }
        }
        return stats;
    }

    function countPop() {
        const stats = readStats();
        stats.total += 1;
        stats.projects[config.project] = (stats.projects[config.project] || 0) + 1;
        save("stats", stats);
        save("last", {project: config.project, name: config.name, time: Date.now()});
        return stats;
    }

    // ---------- Есть ли музыка на странице ----------
    // Следим за любым play()/pause(), даже у new Audio(), которого нет в разметке
    const playing = new Set();
    let webAudioMusic = false;

    function isMusicLike(media) {
        // короткие звуки (писк, щелчок) — не музыка
        return !media.muted && media.volume > 0 && !(media.duration > 0 && media.duration < 8);
    }

    function track(media) {
        if (media.__cosmoTracked) return;
        media.__cosmoTracked = true;
        media.addEventListener("playing", () => {
            playing.add(media);
            onMusicChange();
        });
        ["pause", "ended", "emptied"].forEach(type => media.addEventListener(type, () => {
            playing.delete(media);
            onMusicChange();
        }));
    }

    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
        track(this);
        return originalPlay.apply(this, arguments);
    };
    document.querySelectorAll("audio, video").forEach(track);
    window.addEventListener("cosmo:music", (ev) => {
        webAudioMusic = !!(ev.detail && ev.detail.playing);
        onMusicChange();
    });

    function musicPlaying() {
        if (webAudioMusic) return true;
        for (const media of playing) {
            if (!media.paused && isMusicLike(media)) return true;
        }
        return false;
    }

    function musicVolume() {
        for (const media of playing) if (!media.paused) return media.volume;
        return 0.5;
    }

    // ---------- Рисунок, стили ----------
    const MARTIAN_SVG = `
<svg viewBox="0 0 90 110" aria-hidden="true">
  <g class="cm-body">
    <path d="M30 108 L34 88 M60 108 L56 88" stroke="#3f8f2a" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="45" cy="80" rx="20" ry="16" fill="#5fbf3a"/>
    <path d="M26 76 Q14 70 12 60 M64 76 Q76 70 78 60" stroke="#5fbf3a" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g class="cm-head">
      <path d="M24 44 Q20 62 34 66 L56 66 Q70 62 66 44 Z" fill="#9fd36b" stroke="#4f7d2c" stroke-width="2"/>
      <path d="M12 34 Q8 8 30 6 Q38 -2 48 4 Q60 -2 68 8 Q84 12 78 34 Q74 46 45 46 Q16 46 12 34 Z" fill="#f4a3b8" stroke="#b5536f" stroke-width="2"/>
      <path class="cm-veins" d="M22 16 Q28 10 32 18 Q36 26 42 18 M48 10 Q54 20 60 12 Q66 8 70 18 M18 30 Q26 24 30 32 Q36 38 44 30 Q50 24 56 32 Q62 38 72 28 M45 6 L45 44"
            stroke="#b5536f" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g class="cm-eyes">
        <circle cx="35" cy="50" r="8" fill="#fff" stroke="#c0392b" stroke-width="1.5"/>
        <circle cx="55" cy="50" r="8" fill="#fff" stroke="#c0392b" stroke-width="1.5"/>
        <path d="M28 47 L32 49 M62 47 L58 49 M30 55 L33 53 M60 55 L57 53" stroke="#e74c3c" stroke-width="1"/>
        <g class="cm-pupils">
          <circle cx="36" cy="50" r="3.5" fill="#c0392b"/><circle cx="54" cy="50" r="3.5" fill="#c0392b"/>
          <circle cx="36" cy="50" r="1.5" fill="#1b1b1b"/><circle cx="54" cy="50" r="1.5" fill="#1b1b1b"/>
        </g>
      </g>
      <g class="cm-jaw">
        <path d="M31 60 Q45 68 59 60 L57 64 Q45 70 33 64 Z" fill="#3a1010"/>
        <path d="M33 61 L35 65 M37 62 L38.5 66.5 M41 63 L42 67.5 M45 63.5 L45 68 M49 63 L48 67.5 M53 62 L51.5 66.5 M57 61 L55 65"
              stroke="#fff8e0" stroke-width="2" stroke-linecap="round"/>
      </g>
    </g>
  </g>
</svg>`;

    const CSS = `
.cm-stage{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:1030}
.cm-martian{position:absolute;width:90px;height:110px;transition:transform .6s cubic-bezier(.2,.9,.3,1.3)}
.cm-martian svg{width:100%;height:100%;overflow:visible}
.cm-martian .cm-body{transform-origin:50% 100%;animation:cm-groove .48s ease-in-out infinite alternate}
.cm-martian.cm-quiet .cm-body{animation:cm-look 1.4s ease-in-out infinite alternate}
.cm-martian .cm-pupils{animation:cm-pupils 1.1s steps(2,end) infinite}
.cm-martian .cm-jaw{transform-box:fill-box;transform-origin:50% 0;animation:cm-chatter .16s ease-in-out infinite alternate}
.cm-martian.cm-quiet .cm-jaw{animation:none}
.cm-martian .cm-veins{animation:cm-veins .48s ease-in-out infinite alternate}
.cm-martian.cm-swelling .cm-head{transform-box:fill-box;transform-origin:50% 80%;animation:cm-swell 1.6s ease-in forwards}
.cm-martian.cm-swelling .cm-veins{stroke:#c0392b;animation-duration:.12s}
.cm-martian.cm-popped .cm-head{visibility:hidden}
.cm-martian.cm-popped .cm-body{animation:cm-wobble .25s ease-in-out 3}
@keyframes cm-groove{from{transform:rotate(-7deg)}to{transform:rotate(7deg) translateY(-4px)}}
@keyframes cm-look{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
@keyframes cm-pupils{0%{transform:translateX(-2px)}50%{transform:translateX(2px)}}
@keyframes cm-chatter{from{transform:translateY(0)}to{transform:translateY(2px)}}
@keyframes cm-veins{from{stroke-width:2}to{stroke-width:3.2}}
@keyframes cm-swell{0%{transform:scale(1)}60%{transform:scale(1.35,1.25)}80%{transform:scale(1.3,1.45)}100%{transform:scale(1.75)}}
@keyframes cm-wobble{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}
.cm-bubble{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);white-space:nowrap;background:#fff;color:#8B0000;border:2px solid #8B0000;border-radius:12px;padding:2px 10px;font:600 12px/1.5 system-ui,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.3)}
.cm-friend-bubble{position:fixed;z-index:1031;pointer-events:none;background:#fff;color:#1f5fbf;border:2px solid #1f5fbf;border-radius:12px;padding:2px 10px;font:600 12px/1.5 system-ui,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.3);white-space:nowrap;transform:translate(-50%,-100%)}
.cm-drop{position:absolute;border-radius:50%;opacity:.95;transition:transform .7s cubic-bezier(.15,.7,.3,1),border-radius .7s ease}
.cm-drop.cm-landed{border-radius:45% 55% 40% 60%/55% 45% 60% 40%}
.cm-drop.cm-fading{transition:opacity 2.2s ease,transform 2.2s ease-in;opacity:0}
.cm-glass{position:absolute;border-radius:48% 52% 45% 55%/55% 42% 58% 45%;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.55) 0 8%,transparent 9%),var(--cm-color);opacity:.85;box-shadow:inset -8px -10px 18px rgba(0,0,0,.25);animation:cm-hit .28s cubic-bezier(.2,1.6,.4,1) both}
.cm-glass::after{content:"";position:absolute;left:42%;top:70%;width:16%;height:0;background:var(--cm-color);border-radius:0 0 50% 50%;animation:cm-drip 2.4s ease-in .3s forwards}
.cm-glass.cm-fading{animation:none;transition:opacity 1.4s ease;opacity:0}
@keyframes cm-hit{0%{transform:scale(.1);filter:blur(6px);opacity:0}100%{transform:scale(1);filter:blur(0);opacity:.85}}
@keyframes cm-drip{to{height:var(--cm-drip)}}
.cm-tongue{position:fixed;z-index:1031;height:7px;margin-top:-3px;border-radius:4px;background:linear-gradient(90deg,#e8829c,#d65c7f);transform-origin:0 50%;pointer-events:none;transition:transform .16s ease-out}
.cm-gulp{animation:cm-gulp .45s ease-in-out 2}
@keyframes cm-gulp{0%,100%{transform:scale(1)}50%{transform:scale(1.18,.9)}}
.cm-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:1031;pointer-events:none;background:rgba(20,20,20,.85);color:#9fd36b;padding:6px 14px;border-radius:999px;font:600 13px/1.4 system-ui,sans-serif;transition:opacity .5s;white-space:nowrap}
.cm-toggle{position:fixed;left:10px;bottom:10px;z-index:1029;width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,0,0,.2);background:rgba(255,255,255,.75);font-size:18px;line-height:30px;padding:0;cursor:pointer;opacity:.45;transition:opacity .2s}
.cm-toggle:hover,.cm-toggle:focus-visible{opacity:1}
.cm-toggle.cm-off{filter:grayscale(1)}
@media (max-width:575.98px){.cm-martian{width:64px;height:78px}}
`;

    const SPOTS = [
        {name: "bottom", hidden: "translateY(115%)", shown: "translateY(18%)"},
        {name: "left", hidden: "rotate(90deg) translateY(115%)", shown: "rotate(90deg) translateY(25%)"},
        {name: "right", hidden: "rotate(-90deg) translateY(115%)", shown: "rotate(-90deg) translateY(25%)"},
        {name: "top", hidden: "rotate(180deg) translateY(115%)", shown: "rotate(180deg) translateY(25%)"}
    ];

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stage = null;
    let timer = null;
    let busy = false;
    let forceEat = false; // для проверки: следующего марсианина друг съест наверняка

    const rand = (min, max) => min + Math.random() * (max - min);
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function canShow() {
        const active = document.activeElement;
        const typing = active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
        return !!stage && !reducedMotion && !isOff() && !document.hidden && !typing &&
            !document.querySelector(".modal.show, dialog[open]");
    }

    // Ждём, но если за это время включили музыку — сразу сообщаем
    async function waitOrMusic(ms) {
        const end = Date.now() + ms;
        while (Date.now() < end) {
            if (musicPlaying()) return true;
            await wait(250);
        }
        return musicPlaying();
    }

    function bubble(el, text, spot) {
        const b = document.createElement("div");
        b.className = "cm-bubble";
        b.textContent = text;
        if (spot.name === "top") b.style.transform = "translateX(-50%) rotate(180deg)";
        el.appendChild(b);
        return b;
    }

    function toast(text, ms = 3500) {
        const t = document.createElement("div");
        t.className = "cm-toast";
        t.textContent = text;
        stage.appendChild(t);
        setTimeout(() => t.style.opacity = "0", ms);
        setTimeout(() => t.remove(), ms + 600);
    }

    // «Друг» на странице (Зойч) отвечает марсианам из своего места
    function friendSays(text) {
        const friend = config.friend && document.querySelector(config.friend);
        if (!friend) return;
        const r = friend.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight || !r.width) return; // друга сейчас не видно
        const b = document.createElement("div");
        b.className = "cm-friend-bubble";
        b.textContent = `${config.friendName}: ${text}`;
        b.style.left = Math.min(Math.max(r.left + r.width / 2, 90), window.innerWidth - 90) + "px";
        b.style.top = Math.max(r.top - 6, 30) + "px";
        document.body.appendChild(b);
        setTimeout(() => b.remove(), 2600);
    }

    function placeMartian(el, spot) {
        const w = window.innerWidth, h = window.innerHeight;
        if (spot.name === "bottom") {
            el.style.bottom = "0";
            el.style.left = rand(0.08, 0.8) * w + "px";
        } else if (spot.name === "top") {
            el.style.top = "0";
            el.style.left = rand(0.1, 0.8) * w + "px";
        } else {
            el.style.top = rand(0.25, 0.7) * h + "px";
            el.style[spot.name] = "-10px";
        }
        el.style.transformOrigin = spot.name === "bottom" ? "50% 100%" : "50% 50%";
    }

    // ---------- Звук «шлёп» и болтовня — генерирует браузер (Web Audio), своих файлов нет ----------
    let audioCtx = null;

    function ctx() {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
        return audioCtx;
    }

    function playSplat(strength) {
        try {
            const volume = musicVolume() * 0.7 * strength;
            if (volume <= 0) return;
            const ac = ctx(), now = ac.currentTime;
            const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.35), ac.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
            const src = ac.createBufferSource();
            src.buffer = buffer;
            const filter = ac.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(2400, now);
            filter.frequency.exponentialRampToValueAtTime(180, now + 0.3);
            const g = ac.createGain();
            g.gain.setValueAtTime(volume, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            src.connect(filter).connect(g).connect(ac.destination);
            const thump = ac.createOscillator();
            thump.frequency.setValueAtTime(140, now);
            thump.frequency.exponentialRampToValueAtTime(45, now + 0.18);
            const tg = ac.createGain();
            tg.gain.setValueAtTime(volume * 0.9, now);
            tg.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            thump.connect(tg).connect(ac.destination);
            src.start(now);
            thump.start(now);
            thump.stop(now + 0.22);
        } catch (e) {
            // нет Web Audio — без звука
        }
    }

    // Писклявая марсианская тарабарщина перед взрывом: несколько коротких «слогов» с прыгающей высотой
    function playChatter() {
        try {
            const volume = musicVolume() * 0.25;
            if (volume <= 0) return;
            const ac = ctx();
            let t = ac.currentTime;
            const syllables = Math.round(rand(4, 7));
            for (let i = 0; i < syllables; i++) {
                const o = ac.createOscillator();
                o.type = "square";
                const f = rand(500, 1100);
                o.frequency.setValueAtTime(f, t);
                o.frequency.exponentialRampToValueAtTime(f * rand(0.5, 1.6), t + 0.08);
                const g = ac.createGain();
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
                o.connect(g).connect(ac.destination);
                o.start(t);
                o.stop(t + 0.1);
                t += rand(0.09, 0.14);
            }
        } catch (e) {
            // нет Web Audio — без звука
        }
    }

    // «Глоть»: низкий звук, уходящий вверх
    function playGulp() {
        try {
            const volume = musicVolume() * 0.6 || 0.3;
            const ac = ctx(), now = ac.currentTime;
            const o = ac.createOscillator();
            o.type = "sine";
            o.frequency.setValueAtTime(90, now);
            o.frequency.exponentialRampToValueAtTime(320, now + 0.18);
            const g = ac.createGain();
            g.gain.setValueAtTime(volume, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            o.connect(g).connect(ac.destination);
            o.start(now);
            o.stop(now + 0.24);
        } catch (e) {
            // нет Web Audio — без звука
        }
    }

    // Друг виден на экране? Тогда он может съесть марсианина
    function visibleFriend() {
        const friend = config.friend && document.querySelector(config.friend);
        if (!friend) return null;
        const r = friend.getBoundingClientRect();
        return r.width && r.bottom > 0 && r.top < window.innerHeight ? friend : null;
    }

    // Язык вылетает из друга, ловит марсианина, и тот улетает в рот, как муха
    async function eatMartian(el, friend) {
        const fr = friend.getBoundingClientRect();
        const mr = el.querySelector(".cm-head").getBoundingClientRect();
        const fx = fr.left + fr.width / 2, fy = fr.top + fr.height * 0.6;
        const mx = mr.left + mr.width / 2, my = mr.top + mr.height / 2;
        const dist = Math.hypot(mx - fx, my - fy);
        const tongue = document.createElement("div");
        tongue.className = "cm-tongue";
        tongue.style.left = fx + "px";
        tongue.style.top = fy + "px";
        tongue.style.width = dist + "px";
        tongue.style.transform = `rotate(${Math.atan2(my - fy, mx - fx)}rad) scaleX(0)`;
        document.body.appendChild(tongue);
        await wait(30);
        tongue.style.transform = `rotate(${Math.atan2(my - fy, mx - fx)}rad) scaleX(1)`; // хлоп!
        await wait(200);
        const er = el.getBoundingClientRect();
        el.style.transition = "transform .22s ease-in";
        el.style.transform = `translate(${fx - (er.left + er.width / 2)}px, ${fy - (er.top + er.height / 2)}px) scale(.08)`;
        tongue.style.transform = `rotate(${Math.atan2(my - fy, mx - fx)}rad) scaleX(0)`;
        await wait(230);
        el.remove();
        tongue.remove();
        playGulp();
        friend.classList.add("cm-gulp");
        setTimeout(() => friend.classList.remove("cm-gulp"), 950);
        const stats = load("stats", {total: 0, projects: {}});
        stats.eaten = (stats.eaten || 0) + 1;
        save("stats", stats);
        setTimeout(() => friendSays(pick(FRIEND_LINES.ate)), 400);
        await wait(1500);
    }

    // ---------- Брызги ----------
    function splash(x, y) {
        const drops = [];
        const count = Math.round(rand(12, 18));
        for (let i = 0; i < count; i++) {
            const drop = document.createElement("div");
            drop.className = "cm-drop";
            const size = rand(8, 22);
            drop.style.width = drop.style.height = size + "px";
            drop.style.left = x - size / 2 + "px";
            drop.style.top = y - size / 2 + "px";
            drop.style.background = pick(COLORS);
            stage.appendChild(drop);
            drops.push(drop);
            const angle = rand(0, Math.PI * 2), dist = rand(50, 190);
            requestAnimationFrame(() => requestAnimationFrame(() => {
                drop.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(${rand(1, 1.8)})`;
                drop.classList.add("cm-landed");
            }));
        }
        return drops;
    }

    // Кляксы прилетают «изнутри на стекло» экрана и стекают
    function screenSplat() {
        if (!canShow()) return [];
        const blobs = [];
        const count = Math.round(rand(3, 6));
        for (let i = 0; i < count; i++) {
            const blob = document.createElement("div");
            blob.className = "cm-glass";
            const size = rand(70, 170);
            blob.style.width = blob.style.height = size + "px";
            blob.style.left = rand(0.08, 0.85) * window.innerWidth - size / 2 + "px";
            blob.style.top = rand(0.1, 0.7) * window.innerHeight - size / 2 + "px";
            blob.style.setProperty("--cm-color", pick(COLORS));
            blob.style.setProperty("--cm-drip", rand(40, 140) + "px");
            blob.style.animationDelay = i * 70 + "ms";
            stage.appendChild(blob);
            blobs.push(blob);
        }
        setTimeout(() => playSplat(1), 60);
        return blobs;
    }

    // ---------- Один выход марсианина ----------
    async function performMartian() {
        if (busy || !canShow()) return;
        busy = true;
        const spot = pick(SPOTS);
        const el = document.createElement("div");
        el.className = "cm-martian";
        el.innerHTML = MARTIAN_SVG; // постоянная разметка из этого файла, без данных пользователя
        placeMartian(el, spot);
        el.style.transform = spot.hidden;
        stage.appendChild(el);
        await wait(50);
        el.style.transform = spot.shown;

        // Пришёл из другого проекта недавно — хвастается
        const last = load("last", null);
        const traveller = last && last.project !== config.project && Date.now() - last.time < 30 * 60 * 1000;

        if (!musicPlaying()) {
            el.classList.add("cm-quiet");
            let started = await waitOrMusic(1500);
            if (!started) {
                const b = bubble(el, traveller ? `I followed you from ${last.name}!` : pick(lines("quiet")), spot);
                if (Math.random() < 0.3) setTimeout(() => friendSays(pick(FRIEND_LINES.quiet)), 900);
                started = await waitOrMusic(rand(2000, 3500));
                b.remove();
            }
            if (!started) {
                // В тишине друг тоже не дремлет
                const quietEater = config.friendEats && (forceEat || Math.random() < 0.2) && visibleFriend();
                forceEat = false;
                if (quietEater) {
                    await eatMartian(el, quietEater);
                    busy = false;
                    return;
                }
                el.style.transform = spot.hidden;
                await wait(700);
                el.remove();
                busy = false;
                return;
            }
            el.classList.remove("cm-quiet"); // музыка! теперь ему конец
        }

        await wait(rand(2000, 3500)); // пританцовывает

        // Иногда друг (Зойч) успевает раньше музыки: ловит марсианина языком
        const eater = config.friendEats && (forceEat || Math.random() < 0.3) && visibleFriend();
        forceEat = false;
        if (eater) {
            await eatMartian(el, eater);
            busy = false;
            return;
        }

        const b = bubble(el, traveller && Math.random() < 0.5 ? `I followed you from ${last.name}!` : pick(lines("music")), spot);
        playChatter();
        await wait(1200);
        el.classList.add("cm-swelling");
        await wait(1600);

        const head = el.querySelector(".cm-head").getBoundingClientRect();
        b.remove();
        el.classList.add("cm-popped");
        const drops = splash(head.left + head.width / 2, head.top + head.height / 2);
        playSplat(0.6);
        const glass = Math.random() < 0.35 ? (await wait(250), screenSplat()) : [];

        const stats = countPop();
        if ([1, 5, 10, 25, 50, 100, 250, 500].includes(stats.total)) {
            const projects = Object.keys(stats.projects).length;
            toast(`👽 ${stats.total} martian ${stats.total === 1 ? "head" : "heads"} popped` +
                (projects > 1 ? ` in ${projects} projects` : "") + "!");
        }
        if (Math.random() < 0.5) setTimeout(() => friendSays(pick(FRIEND_LINES.afterPop)), 700);

        await wait(1200);
        el.style.transform = spot.hidden;
        drops.forEach(d => d.classList.add("cm-fading"));
        await wait(2300);
        el.remove();
        drops.forEach(d => d.remove());
        glass.forEach(g => g.classList.add("cm-fading"));
        await wait(1500);
        glass.forEach(g => g.remove());
        busy = false;
    }

    function schedule(range) {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            if (canShow()) await performMartian();
            schedule(musicPlaying() ? rate.music : rate.quiet);
        }, rand(range[0], range[1]));
    }

    let wasPlaying = false;

    function onMusicChange() {
        if (!stage) return;
        const now = musicPlaying();
        if (now === wasPlaying) return;
        wasPlaying = now;
        if (!busy) schedule(now ? rate.first : rate.quiet);
    }

    // Кнопка 👽 в углу: выключает и включает марсиан сразу во всех проектах
    function addToggle() {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cm-toggle";
        btn.textContent = "👽";
        const refresh = () => {
            const off = isOff();
            btn.classList.toggle("cm-off", off);
            btn.title = off ? "Martians are off — click to let them back" : "Martians: click to turn them off";
            btn.setAttribute("aria-label", btn.title);
            btn.setAttribute("aria-pressed", String(!off));
        };
        btn.addEventListener("click", () => {
            save("off", !isOff());
            refresh();
            toast(isOff() ? "Martians are hiding. For now." : "The martians are back!", 2000);
        });
        refresh();
        document.body.appendChild(btn);
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
        schedule(wasPlaying ? rate.first : [4000, 8000]);
    }

    // Для проверки из консоли: cosmoMartians.show(), cosmoMartians.splat(), cosmoMartians.stats()
    window.cosmoMartians = {
        show: () => performMartian(),
        eat: () => {
            forceEat = true;
            return performMartian();
        },
        splat: () => screenSplat(),
        stats: () => readStats(),
        config
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
