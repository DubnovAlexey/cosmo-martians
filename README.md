# Cosmo Martians

A self-contained cartoon easter egg and a local demo for the presentation projects. The martians use an original SVG illustration; their short sound effects are synthesized with Web Audio.


## Try it in a minute

Press **Call a martian**, then **Splash the screen** or **Feed the frog** to compare the interactions. **Play test music** enables the synthesized demo loop; press the same button again to stop it. Use the corner toggle to disable the effect.

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

## Engineering focus

Vanilla JavaScript, an original SVG character, DOM/CSS animation, Web Audio synthesis and optional localStorage counters. No package installation or build step is required for the standalone demo.

## Roadmap

These are proposed next steps, not current capabilities.

- **Visual:** offer a gentler no-splash presentation preset and a consistent local SVG favicon; preserve the existing cartoon version as a separate choice.
- **Engineering:** expose explicit suspend/resume/dispose methods and cancel an in-progress appearance; replace the global media-method patch with an opt-in music adapter.
- **Functionality:** add a small preset panel for appearance frequency, sound and interaction intensity without changing the host project.
