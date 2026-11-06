# Cosmo Martians

A self-contained cartoon easter egg and a local demo for the presentation projects. The martians use an original SVG illustration; their short sound effects are synthesized with Web Audio.

## Run the demo

Serve this directory with a static HTTP server and open `index.html`. The demo has buttons for test music, a martian, a splash and the frog interaction. Music begins only after the visitor presses its button.

## Embed the module

```html
<script src="./martians.js" data-project="my-project" data-name="My Project" defer></script>
```

Configuration attributes: `data-project`, `data-name`, `data-rate="normal|rare"`, `data-friend` (a CSS selector), `data-friend-name`, and `data-friend-eats="true"`.

The module detects media playback on the page. Projects using Web Audio can publish their music state explicitly:

```js
window.dispatchEvent(new CustomEvent('cosmo:music', {detail: {playing: true}}));
```

Publish `playing: false` when playback stops. The counter and on/off choice use the `cosmo-martians:` localStorage prefix and are shared only by pages on the same origin. Disabled storage and malformed saved counters are handled locally.

## Interaction and accessibility

The animation avoids hidden tabs, open modal windows and focused text inputs when starting an appearance. System reduced-motion preference disables appearances; the manual demo controls remain safe. The corner button enables or disables the easter egg. Public demo helpers are `cosmoMartians.show()`, `.eat()`, `.splat()` and `.stats()`.

## Integration boundary

The script installs one instance per window and observes media through `HTMLMediaElement.play`. Load it only in documents that should own the effect. For the future UNIVERSE project viewer, a separate iframe gives the project its own lifecycle; a shared live-document integration will require an explicit dispose/suspend contract before adoption.
