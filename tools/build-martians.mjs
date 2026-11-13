// FILE: tools/build-martians.mjs
// PURPOSE: builds the shared cosmo-martians/martians.js from tools/martians.template.js and the main
// martian drawing, explosion, splats, sound and styles in ../Mars-project2 (js/martians.js, CSS/martians.css).
// Class names get the "cm-" prefix so the injected styles never clash with the host page.
// Run: node tools/build-martians.mjs   (from the cosmo-martians folder)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const mars = path.resolve(root, '..', 'Mars-project2');
const marsJs = fs.readFileSync(path.join(mars, 'js', 'martians.js'), 'utf8');
const marsCss = fs.readFileSync(path.join(mars, 'CSS', 'martians.css'), 'utf8');

// Takes one "BEGIN SECTION n" … "END SECTION n" block of the Mars source.
function section(source, number) {
  const begin = source.indexOf(`// BEGIN SECTION ${number} `);
  const endMarker = `// END SECTION ${number}`;
  const end = source.indexOf(endMarker);
  if (begin < 0 || end < 0) throw new Error(`Mars section ${number} not found`);
  return source.slice(source.lastIndexOf('\n', begin) + 1, end + endMarker.length);
}

// "martian-x" → "cm-x", the bare class "martian" → "cm-martian".
function prefix(text) {
  return text
    .replace(/\.martian(?![-\w])/g, '.cm-martian')
    .replace(/martian-(?=[a-z])/g, 'cm-');
}

const css = prefix(marsCss)
  .replace(/\/\*[\s\S]*?\*\//g, '')       // comments are not needed inside the injected <style>
  .replace(/\n\s*\n+/g, '\n')
  .trim();
if (css.includes('`') || css.includes('${')) throw new Error('CSS cannot be embedded into a template literal');

// The explosion section numbers in the Mars file are 2 (drawing), 4 (explosion/splats), 5 (sound).
const relabel = (text, from) => text.replace(`// BEGIN SECTION ${from} `, `// BEGIN MARS SECTION ${from} `)
  .replace(`// END SECTION ${from}`, `// END MARS SECTION ${from}`);
let output = fs.readFileSync(path.join(here, 'martians.template.js'), 'utf8')
  .replace('/*@@MARS_SECTION_2@@*/', relabel(prefix(section(marsJs, 2)), 2))
  .replace('/*@@MARS_SECTION_4@@*/', relabel(prefix(section(marsJs, 4)), 4))
  .replace('/*@@MARS_SECTION_5@@*/', relabel(prefix(section(marsJs, 5)), 5))
  .replace('/*@@MARS_CSS@@*/', css);
if (output.includes('@@')) throw new Error('An unfilled placeholder remains');
fs.writeFileSync(path.join(root, 'martians.js'), output);
console.log(`martians.js built: ${output.length} characters`);

// Natural parts (13.11.2026): the realistic cut-out photos of eyes, teeth, brains… live in Mars-project2/js/organs/
// next to the source script; the shared module looks for them next to itself, so the folder is copied here.
const organsFrom = path.join(mars, 'js', 'organs');
if (fs.existsSync(organsFrom)) {
  const organsTo = path.join(root, 'organs');
  fs.mkdirSync(organsTo, { recursive: true });
  const files = fs.readdirSync(organsFrom).filter((file) => file.endsWith('.webp'));
  for (const file of files) fs.copyFileSync(path.join(organsFrom, file), path.join(organsTo, file));
  console.log(`organs copied: ${files.length} photos`);
}
