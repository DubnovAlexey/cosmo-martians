# Cosmo Martians

[English](#english) · [Русский](#русский) · [עברית](#עברית) · [Español](#español) · [Français](#français)

<a name="english"></a>

## English

A shared black-humour easter egg for the portfolio projects, in the style of 1950s pulp science fiction: skull-faced martians with huge veiny brains under glass helmets. Scary first, funny second. The drawing is original SVG and every sound is synthesized with Web Audio, so there are no image or audio files.

### Try it in a minute

1. Wait a little without music: martians gather at the screen edges and get in the way. They fire blaster beams across the screen. After the fourth one, a burgundy-red danger alert pulses in the centre of the screen and asks to turn the music on; pressing the alert turns it on.
2. Press **Play test music**: the crowd dances, a martian fires a blaster beam or two across the screen, then the heads burst one by one — an eye, teeth, a finger, an ear and pieces of the helmet and suit hit the screen glass with a splash of blood and slowly slide down. The headless body climbs out, pats its neck, waves, falls over and crawls away.
3. Press **Feed the frog**: the frog catches a martian with its tongue like a fly. **Call a martian** and **Splash the screen** trigger the other parts by hand.
4. Use the 👽 button in the corner to send every martian away (the choice is remembered for all projects).

The martians show no speech or captions — only the characters themselves. The one text is the site hint, in English, Russian, Hebrew, Spanish or French according to the page's `<html lang>`.

### Run the demo

Serve this directory with a static HTTP server and open `index.html`. Music begins only after the visitor presses its button.

### Embed the module

```html
<script src="./martians.js" data-project="my-project" defer></script>
```

Configuration attributes: `data-project` (name for the shared counter), `data-rate="normal|rare"` (`rare` for work tools where interruptions matter), `data-friend` (a CSS selector of a page character), `data-friend-eats="true"` and `data-music` (a CSS selector of the player that counts as music, for example `#playlistAudio`; without it any playing `<audio>` or `<video>` longer than 8 seconds counts, so pages with background hum or interface sounds should name their music player).

The module notices any `<audio>`, `<video>` or `new Audio()` that plays music. Projects using Web Audio publish their music state explicitly:

```js
window.dispatchEvent(new CustomEvent('cosmo:music', {detail: {playing: true}}));
```

Publish `playing: false` when playback stops. The counters and the on/off choice use the `cosmo-martians:` localStorage prefix and are shared only by pages on the same origin. Disabled storage and malformed saved counters are handled locally.

### How it is built

`martians.js` is generated — do not edit it by hand. The main martian (drawing, explosion, screen splats, sound and styles) lives in `Mars-project2` (`js/martians.js`, `CSS/martians.css`). `tools/martians.template.js` adds what only this shared module needs: media detection, the shared counter, the on/off button, the hungry friend and injected styles with a `cm-` prefix. Rebuild after a change in either place:

```bash
node tools/build-martians.mjs
```

### Interaction and accessibility

Martians never block clicks; only the visible alert can be pressed (it presses the page button marked `data-martian-play`, or plays the first `<audio>`). They do not start while a tab is hidden, a modal is open or the visitor is typing, and they never appear when the system asks for reduced motion. The alert is announced with `role="alert"`. Console helpers: `cosmoMartians.show()`, `.eat()`, `.splat()`, `.stats()`, `.count()`.

### Integration boundary

The script installs one instance per window and observes media through `HTMLMediaElement.play`. Load it only in documents that should own the effect. For the future UNIVERSE project viewer, a separate iframe gives each project its own lifecycle; a shared live-document integration will need an explicit dispose/suspend contract first.

### Planned improvements

These are proposals, not features.

- `dispose()` / `suspend()` / `resume()` for embedding in the UNIVERSE viewer.
- A small automated test of the crowd → music → pop state machine.

---

<a name="russian"></a>

## Русский

Общая пасхалка с чёрным юмором для проектов портфолио в стиле фантастики 1950-х: марсиане с лицом-черепом и огромным мозгом в венах под стеклянным шлемом. Сначала страшно, потом смешно. Рисунок — свой SVG, а каждый звук синтезируется через Web Audio, поэтому ни картинок, ни аудиофайлов нет.

### Попробовать за минуту

1. Подождите немного без музыки: марсиане собираются по краям экрана и мешают. Они палят из бластеров лучом через весь экран. После четвёртого в центре экрана загорается бордово-красная тревога и просит включить музыку; нажатие на табличку включает её.
2. Нажмите **Play test music**: толпа танцует, марсианин раз-другой стреляет лучом через весь экран, а потом головы лопаются одна за другой — глаз, зубы, палец, ухо и куски шлема и скафандра врезаются в стекло экрана с кровавой кляксой и медленно сползают. Тело без головы вылезает, ощупывает шею, машет, падает и уползает.
3. Нажмите **Feed the frog**: лягушка ловит марсианина языком, как муху. **Call a martian** и **Splash the screen** запускают остальное вручную.
4. Кнопка 👽 в углу прогоняет всех марсиан (выбор запоминается для всех проектов).

Марсиане ничего не говорят и не показывают надписей — только сами персонажи. Единственный текст — подсказка сайта на английском, русском, иврите, испанском или французском, в зависимости от `<html lang>` страницы.

### Запуск демо

Раздайте эту папку любым статическим HTTP-сервером и откройте `index.html`. Музыка начинается только после того, как посетитель нажмёт её кнопку.

### Подключение модуля

```html
<script src="./martians.js" data-project="my-project" defer></script>
```

Атрибуты настройки: `data-project` (имя для общего счётчика), `data-rate="normal|rare"` (`rare` — для рабочих инструментов, где отвлекать нельзя), `data-friend` (CSS-селектор персонажа страницы), `data-friend-eats="true"` и `data-music` (CSS-селектор плеера, который считается музыкой, например `#playlistAudio`; без него музыкой считается любое играющее `<audio>` или `<video>` длиннее 8 секунд, поэтому страницам с фоновым гулом или звуками интерфейса стоит указать свой музыкальный плеер).

Модуль замечает любой `<audio>`, `<video>` или `new Audio()`, который играет музыку. Проекты на Web Audio сообщают о своей музыке явно:

```js
window.dispatchEvent(new CustomEvent('cosmo:music', {detail: {playing: true}}));
```

Когда воспроизведение остановилось, отправьте `playing: false`. Счётчики и выбор «вкл/выкл» хранятся в localStorage с префиксом `cosmo-martians:` и общие только для страниц одного источника (origin). Отключённое хранилище и испорченные сохранённые счётчики обрабатываются на месте.

### Как он собирается

`martians.js` генерируется — не правьте его вручную. Основной марсианин (рисунок, взрыв, кляксы на экране, звук и стили) живёт в `Mars-project2` (`js/martians.js`, `CSS/martians.css`). `tools/martians.template.js` добавляет то, что нужно только общему модулю: распознавание медиа, общий счётчик, кнопку «вкл/выкл», голодного друга и встраиваемые стили с префиксом `cm-`. После изменения в любом из этих мест пересоберите модуль:

```bash
node tools/build-martians.mjs
```

### Взаимодействие и доступность

Марсиане никогда не перехватывают клики; нажать можно только видимую тревогу (она нажимает кнопку страницы с атрибутом `data-martian-play` или запускает первый `<audio>`). Они не появляются, пока вкладка скрыта, открыто модальное окно или посетитель печатает, и никогда — если система просит уменьшить анимацию. Тревога объявляется через `role="alert"`. Помощники для консоли: `cosmoMartians.show()`, `.eat()`, `.splat()`, `.stats()`, `.count()`.

### Граница интеграции

Скрипт создаёт один экземпляр на окно и следит за медиа через `HTMLMediaElement.play`. Подключайте его только в те документы, которым эффект должен принадлежать. В будущем просмотрщике проектов UNIVERSE отдельный iframe даст каждому проекту свой жизненный цикл; общей интеграции в живой документ сначала понадобится явный контракт dispose/suspend.

### План развития

Это предложения, а не готовые функции.

- `dispose()` / `suspend()` / `resume()` для встраивания в просмотрщик UNIVERSE.
- Небольшой автоматический тест машины состояний «толпа → музыка → взрыв».

---

<a name="hebrew"></a>

<div dir="rtl">

## עברית

ביצת פסחא משותפת עם הומור שחור לפרויקטים של תיק העבודות, בסגנון המדע הבדיוני של שנות ה־50: חייזרים עם פני גולגולת ומוח ענק מלא ורידים תחת קסדת זכוכית. קודם מפחיד, אחר כך מצחיק. הציור הוא SVG מקורי וכל צליל מסונתז ב־Web Audio, כך שאין קובצי תמונה או שמע.

### לנסות בדקה

1. חכו מעט בלי מוזיקה: החייזרים מתאספים בקצוות המסך ומפריעים. הם יורים קרני בלסטר לרוחב המסך. אחרי הרביעי, במרכז המסך פועמת התראת סכנה בצבע בורדו־אדום ומבקשת להפעיל מוזיקה; לחיצה על ההתראה מפעילה אותה.
2. לחצו על **Play test music**: ההמון רוקד, חייזר יורה קרן בלסטר פעם או פעמיים לרוחב המסך, ואז הראשים מתפוצצים בזה אחר זה — עין, שיניים, אצבע, אוזן וחלקי קסדה וחליפה פוגעים בזכוכית המסך עם כתם דם ומחליקים לאט למטה. הגוף בלי הראש יוצא, ממשש את הצוואר, מנופף, נופל וזוחל משם.
3. לחצו על **Feed the frog**: הצפרדע תופסת חייזר בלשון כמו זבוב. **Call a martian** ו־**Splash the screen** מפעילים את שאר החלקים ידנית.
4. כפתור 👽 בפינה מגרש את כל החייזרים (הבחירה נשמרת לכל הפרויקטים).

החייזרים לא מדברים ולא מציגים כיתובים — רק הדמויות עצמן. הטקסט היחיד הוא הרמז של האתר, באנגלית, ברוסית, בעברית, בספרדית או בצרפתית לפי `<html lang>` של הדף.

### הרצת ההדגמה

הגישו את התיקייה הזו בשרת HTTP סטטי כלשהו ופתחו את `index.html`. המוזיקה מתחילה רק אחרי שהמבקר לוחץ על הכפתור שלה.

### הטמעת המודול

<div dir="ltr">

```html
<script src="./martians.js" data-project="my-project" defer></script>
```

</div>

מאפייני הגדרה: `data-project` (שם למונה המשותף), `data-rate="normal|rare"` (`rare` לכלי עבודה שבהם הפרעות מזיקות), `data-friend` (בורר CSS של דמות בדף), `data-friend-eats="true"` ו־`data-music` (בורר CSS של הנגן שנחשב למוזיקה, למשל `#playlistAudio`; בלעדיו כל `<audio>` או `<video>` שמתנגן יותר מ־8 שניות נחשב למוזיקה, ולכן דפים עם זמזום רקע או צלילי ממשק צריכים לציין את נגן המוזיקה שלהם).

המודול מבחין בכל `<audio>`, `<video>` או `new Audio()` שמנגן מוזיקה. פרויקטים שמשתמשים ב־Web Audio מפרסמים את מצב המוזיקה שלהם במפורש:

<div dir="ltr">

```js
window.dispatchEvent(new CustomEvent('cosmo:music', {detail: {playing: true}}));
```

</div>

כשהניגון נעצר, פרסמו `playing: false`. המונים ובחירת ההפעלה והכיבוי נשמרים ב־localStorage עם הקידומת `cosmo-martians:` ומשותפים רק לדפים מאותו מקור (origin). אחסון מושבת ומונים שמורים פגומים מטופלים במקום.

### איך הוא נבנה

הקובץ `martians.js` נוצר אוטומטית — אל תערכו אותו ידנית. החייזר הראשי (ציור, פיצוץ, כתמים על המסך, צליל וסגנונות) נמצא ב־`Mars-project2` (`js/martians.js`, `CSS/martians.css`). `tools/martians.template.js` מוסיף את מה שרק המודול המשותף צריך: זיהוי מדיה, המונה המשותף, כפתור ההפעלה והכיבוי, החבר הרעב וסגנונות מוזרקים עם הקידומת `cm-`. אחרי שינוי באחד משני המקומות בנו אותו מחדש:

<div dir="ltr">

```bash
node tools/build-martians.mjs
```

</div>

### אינטראקציה ונגישות

החייזרים אף פעם לא חוסמים לחיצות; אפשר ללחוץ רק על ההתראה הגלויה (היא לוחצת על כפתור הדף המסומן ב־`data-martian-play`, או מנגנת את ה־`<audio>` הראשון). הם לא מופיעים כשהלשונית מוסתרת, כשחלון מודאלי פתוח או כשהמבקר מקליד, ולעולם לא מופיעים כשהמערכת מבקשת להפחית תנועה. ההתראה מוכרזת באמצעות `role="alert"`. עוזרים לקונסולה: `cosmoMartians.show()`, `.eat()`, `.splat()`, `.stats()`, `.count()`.

### גבול האינטגרציה

הסקריפט מתקין מופע אחד לכל חלון ועוקב אחרי מדיה דרך `HTMLMediaElement.play`. טענו אותו רק במסמכים שהאפקט אמור להיות שייך להם. בצופה הפרויקטים העתידי UNIVERSE, iframe נפרד ייתן לכל פרויקט מחזור חיים משלו; שילוב משותף במסמך חי יצריך קודם חוזה dispose/suspend מפורש.

### שיפורים מתוכננים

אלה הצעות, לא יכולות קיימות.

- `dispose()` / `suspend()` / `resume()` להטמעה בצופה UNIVERSE.
- בדיקה אוטומטית קטנה של מכונת המצבים המון ← מוזיקה ← פיצוץ.

</div>

---

<a name="spanish"></a>

## Español

Un huevo de Pascua compartido con humor negro para los proyectos del portafolio, al estilo de la ciencia ficción pulp de los años cincuenta: marcianos con cara de calavera y enormes cerebros venosos bajo cascos de cristal. Primero da miedo, luego hace gracia. El dibujo es SVG original y cada sonido se sintetiza con Web Audio, así que no hay archivos de imagen ni de audio.

### Pruébalo en un minuto

1. Espera un poco sin música: los marcianos se reúnen en los bordes de la pantalla y estorban. Disparan rayos de bláster que cruzan la pantalla. Después del cuarto, en el centro de la pantalla late una alarma de peligro rojo burdeos que pide encender la música; al pulsar la alarma, la música se enciende.
2. Pulsa **Play test music**: la multitud baila, un marciano dispara uno o dos rayos de bláster a través de la pantalla y luego las cabezas revientan una tras otra: un ojo, dientes, un dedo, una oreja y trozos del casco y del traje golpean el cristal de la pantalla con una salpicadura de sangre y se deslizan despacio hacia abajo. El cuerpo sin cabeza sale, se palpa el cuello, saluda, se cae y se aleja arrastrándose.
3. Pulsa **Feed the frog**: la rana atrapa a un marciano con la lengua, como a una mosca. **Call a martian** y **Splash the screen** activan el resto a mano.
4. Usa el botón 👽 de la esquina para echar a todos los marcianos (la elección se recuerda en todos los proyectos).

Los marcianos no hablan ni muestran textos: solo están los personajes. El único texto es el aviso del sitio, en inglés, ruso, hebreo, español o francés según el `<html lang>` de la página.

### Ejecutar la demo

Sirve esta carpeta con cualquier servidor HTTP estático y abre `index.html`. La música empieza solo cuando el visitante pulsa su botón.

### Integrar el módulo

```html
<script src="./martians.js" data-project="my-project" defer></script>
```

Atributos de configuración: `data-project` (nombre para el contador compartido), `data-rate="normal|rare"` (`rare` para herramientas de trabajo en las que las interrupciones molestan), `data-friend` (un selector CSS de un personaje de la página), `data-friend-eats="true"` y `data-music` (un selector CSS del reproductor que cuenta como música, por ejemplo `#playlistAudio`; sin él cuenta cualquier `<audio>` o `<video>` que suene más de 8 segundos, así que las páginas con zumbido de fondo o sonidos de interfaz deberían indicar su reproductor de música).

El módulo detecta cualquier `<audio>`, `<video>` o `new Audio()` que reproduzca música. Los proyectos que usan Web Audio publican el estado de su música de forma explícita:

```js
window.dispatchEvent(new CustomEvent('cosmo:music', {detail: {playing: true}}));
```

Publica `playing: false` cuando se detenga la reproducción. Los contadores y la elección de activar o desactivar usan el prefijo `cosmo-martians:` en localStorage y solo los comparten las páginas del mismo origen. El almacenamiento desactivado y los contadores guardados dañados se gestionan localmente.

### Cómo se construye

`martians.js` se genera: no lo edites a mano. El marciano principal (dibujo, explosión, salpicaduras en la pantalla, sonido y estilos) vive en `Mars-project2` (`js/martians.js`, `CSS/martians.css`). `tools/martians.template.js` añade lo que solo necesita este módulo compartido: la detección de medios, el contador compartido, el botón de activar y desactivar, el amigo hambriento y los estilos inyectados con el prefijo `cm-`. Tras un cambio en cualquiera de los dos sitios, vuelve a construirlo:

```bash
node tools/build-martians.mjs
```

### Interacción y accesibilidad

Los marcianos nunca bloquean los clics; solo se puede pulsar la alarma visible (pulsa el botón de la página marcado con `data-martian-play` o reproduce el primer `<audio>`). No aparecen mientras la pestaña está oculta, hay una ventana modal abierta o el visitante está escribiendo, y nunca aparecen si el sistema pide reducir el movimiento. La alarma se anuncia con `role="alert"`. Ayudas para la consola: `cosmoMartians.show()`, `.eat()`, `.splat()`, `.stats()`, `.count()`.

### Límite de integración

El script instala una sola instancia por ventana y vigila los medios a través de `HTMLMediaElement.play`. Cárgalo solo en los documentos a los que deba pertenecer el efecto. En el futuro visor de proyectos UNIVERSE, un iframe aparte dará a cada proyecto su propio ciclo de vida; una integración compartida en un documento vivo necesitará antes un contrato explícito de dispose/suspend.

### Mejoras previstas

Son propuestas, no funciones existentes.

- `dispose()` / `suspend()` / `resume()` para integrarlo en el visor de UNIVERSE.
- Una pequeña prueba automática de la máquina de estados multitud → música → explosión.

---

<a name="french"></a>

## Français

Un easter egg partagé à l’humour noir pour les projets du portfolio, dans le style de la science-fiction pulp des années 1950 : des martiens à tête de mort avec d’énormes cerveaux veinés sous des casques de verre. D’abord effrayant, ensuite drôle. Le dessin est un SVG original et chaque son est synthétisé avec Web Audio : il n’y a donc aucun fichier image ni audio.

### Essayer en une minute

1. Attendez un peu sans musique : les martiens se rassemblent sur les bords de l’écran et gênent. Ils tirent des rayons de blaster à travers l’écran. Après le quatrième, une alerte de danger rouge bordeaux pulse au centre de l’écran et demande de lancer la musique ; un clic sur l’alerte la lance.
2. Appuyez sur **Play test music** : la foule danse, un martien tire un ou deux rayons de blaster à travers l’écran, puis les têtes éclatent l’une après l’autre — un œil, des dents, un doigt, une oreille et des morceaux du casque et de la combinaison frappent la vitre de l’écran dans une giclée de sang et glissent lentement vers le bas. Le corps sans tête sort, se tâte le cou, fait signe de la main, tombe et s’éloigne en rampant.
3. Appuyez sur **Feed the frog** : la grenouille attrape un martien avec sa langue, comme une mouche. **Call a martian** et **Splash the screen** déclenchent le reste à la main.
4. Le bouton 👽 dans le coin renvoie tous les martiens (le choix est mémorisé pour tous les projets).

Les martiens ne parlent pas et n’affichent aucun texte — seulement les personnages eux-mêmes. Le seul texte est l’indication du site, en anglais, russe, hébreu, espagnol ou français selon le `<html lang>` de la page.

### Lancer la démo

Servez ce dossier avec n’importe quel serveur HTTP statique et ouvrez `index.html`. La musique ne démarre qu’une fois que le visiteur a appuyé sur son bouton.

### Intégrer le module

```html
<script src="./martians.js" data-project="my-project" defer></script>
```

Attributs de configuration : `data-project` (nom pour le compteur partagé), `data-rate="normal|rare"` (`rare` pour les outils de travail où les interruptions gênent), `data-friend` (un sélecteur CSS d’un personnage de la page), `data-friend-eats="true"` et `data-music` (un sélecteur CSS du lecteur qui compte comme musique, par exemple `#playlistAudio` ; sans lui, tout `<audio>` ou `<video>` qui joue plus de 8 secondes compte, donc les pages avec un bourdonnement de fond ou des sons d’interface devraient désigner leur lecteur de musique).

Le module remarque tout `<audio>`, `<video>` ou `new Audio()` qui joue de la musique. Les projets qui utilisent Web Audio publient explicitement l’état de leur musique :

```js
window.dispatchEvent(new CustomEvent('cosmo:music', {detail: {playing: true}}));
```

Publiez `playing: false` quand la lecture s’arrête. Les compteurs et le choix marche/arrêt utilisent le préfixe `cosmo-martians:` dans localStorage et ne sont partagés que par les pages de la même origine. Un stockage désactivé et des compteurs enregistrés corrompus sont gérés localement.

### Comment il est construit

`martians.js` est généré — ne le modifiez pas à la main. Le martien principal (dessin, explosion, éclaboussures sur l’écran, son et styles) se trouve dans `Mars-project2` (`js/martians.js`, `CSS/martians.css`). `tools/martians.template.js` ajoute ce dont seul ce module partagé a besoin : la détection des médias, le compteur partagé, le bouton marche/arrêt, l’ami affamé et les styles injectés avec le préfixe `cm-`. Après une modification à l’un ou l’autre endroit, reconstruisez-le :

```bash
node tools/build-martians.mjs
```

### Interaction et accessibilité

Les martiens ne bloquent jamais les clics ; seule l’alerte visible peut être cliquée (elle appuie sur le bouton de la page marqué `data-martian-play`, ou lance le premier `<audio>`). Ils n’apparaissent pas quand l’onglet est masqué, qu’une fenêtre modale est ouverte ou que le visiteur tape au clavier, et jamais quand le système demande de réduire les animations. L’alerte est annoncée avec `role="alert"`. Aides pour la console : `cosmoMartians.show()`, `.eat()`, `.splat()`, `.stats()`, `.count()`.

### Limite d’intégration

Le script installe une seule instance par fenêtre et observe les médias via `HTMLMediaElement.play`. Ne le chargez que dans les documents auxquels l’effet doit appartenir. Dans le futur visualiseur de projets UNIVERSE, un iframe séparé donnera à chaque projet son propre cycle de vie ; une intégration partagée dans un document vivant exigera d’abord un contrat dispose/suspend explicite.

### Améliorations prévues

Ce sont des propositions, pas des fonctionnalités.

- `dispose()` / `suspend()` / `resume()` pour l’intégration dans le visualiseur UNIVERSE.
- Un petit test automatique de la machine à états foule → musique → explosion.
