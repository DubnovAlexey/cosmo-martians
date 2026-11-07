# Cosmo Martians

A shared black-humour easter egg for the portfolio projects, in the style of 1950s pulp science fiction: skull-faced martians with huge veiny brains under glass helmets. Scary first, funny second. The drawing is original SVG and every sound is synthesized with Web Audio, so there are no image or audio files.

## Try it in a minute

1. Wait a little without music: martians gather at the screen edges and get in the way. After the fourth one, a small hint suggests turning the music on.
2. Press **Play test music**: the crowd dances, then their heads burst one by one — helmet shards, blood, brains and an eyeball fly across the page, sometimes hitting the screen from inside. The headless body pats its neck and waves; the eyeball blinks and rolls away.
3. Press **Feed the frog**: the frog catches a martian with its tongue like a fly. **Call a martian** and **Splash the screen** trigger the other parts by hand.
4. Use the 👽 button in the corner to send every martian away (the choice is remembered for all projects).

The martians show no speech or captions — only the characters themselves. The one text is the site hint, in English, Russian or Hebrew according to the page's `<html lang>`.

## Run the demo

Serve this directory with a static HTTP server and open `index.html`. Music begins only after the visitor presses its button.

## Embed the module

```html
<script src="./martians.js" data-project="my-project" defer></script>
```

Configuration attributes: `data-project` (name for the shared counter), `data-rate="normal|rare"` (`rare` for work tools where interruptions matter), `data-friend` (a CSS selector of a page character) and `data-friend-eats="true"`.

The module notices any `<audio>`, `<video>` or `new Audio()` that plays music. Projects using Web Audio publish their music state explicitly:

```js
window.dispatchEvent(new CustomEvent('cosmo:music', {detail: {playing: true}}));
```

Publish `playing: false` when playback stops. The counters and the on/off choice use the `cosmo-martians:` localStorage prefix and are shared only by pages on the same origin. Disabled storage and malformed saved counters are handled locally.

## How it is built

`martians.js` is generated — do not edit it by hand. The main martian (drawing, explosion, screen splats, sound and styles) lives in `Mars-project2` (`js/martians.js`, `CSS/martians.css`). `tools/martians.template.js` adds what only this shared module needs: media detection, the shared counter, the on/off button, the hungry friend and injected styles with a `cm-` prefix. Rebuild after a change in either place:

```bash
node tools/build-martians.mjs
```

## Interaction and accessibility

Martians never block clicks. They do not start while a tab is hidden, a modal is open or the visitor is typing, and they never appear when the system asks for reduced motion. The hint is a polite `role="status"` message. Console helpers: `cosmoMartians.show()`, `.eat()`, `.splat()`, `.stats()`, `.count()`.

## Integration boundary

The script installs one instance per window and observes media through `HTMLMediaElement.play`. Load it only in documents that should own the effect. For the future UNIVERSE project viewer, a separate iframe gives each project its own lifecycle; a shared live-document integration will need an explicit dispose/suspend contract first.

## Planned improvements

These are proposals, not features.

- `dispose()` / `suspend()` / `resume()` for embedding in the UNIVERSE viewer.
- A small automated test of the crowd → music → pop state machine.
