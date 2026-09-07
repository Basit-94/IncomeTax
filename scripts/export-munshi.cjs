/* Rebuild the deliverable from the SAME paths and CSS used by the live component. */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transform, loadBindings } = require('next/dist/build/swc');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public/brand/munshi');
const states = ['idle','welcome','listening','explaining','working','reading','uploading','happy','concerned','success','error','waiting','secure'];
const descriptions = {
  idle:'Quiet brand mark. Small avatars blink; large placements breathe gently.',
  welcome:'Landing and empty states: a small greeting wave, twice, then rest.',
  listening:'A slight attentive tilt while waiting for the next answer.',
  explaining:'New assistant reply or an opened fact explanation: small open-palm gesture.',
  working:'Six seconds: retrieve the page, read across it, adjust spectacles, return it.',
  reading:'Review and confirmation cards: look down at the document without claiming completion.',
  uploading:'Document upload in progress: retrieve, read and adjust spectacles.',
  happy:'Brief pleased nod after a higher signed net outcome is selected.',
  concerned:'Gentle concern after a lower signed net outcome. Never angry or punitive.',
  success:'One acknowledgement nod only after the existing success state is reached.',
  error:'Small concerned movement; the adjacent text supplies the error and retry action.',
  waiting:'Patient glance, suitable for a pending refund or review; no promise of timing.',
  secure:'Eyes politely lowered at consent and OTP screens. Decorative, not a privacy claim.',
};
async function main() {
  await loadBindings();
  fs.mkdirSync(out, { recursive:true });
  const file = path.join(root,'components/brand/munshi-art.tsx');
  const compiled = await transform(fs.readFileSync(file,'utf8'), { filename:file, jsc:{ parser:{ syntax:'typescript',tsx:true }, transform:{ react:{ runtime:'automatic' } } }, module:{ type:'commonjs' } });
  const mod = new Module(file, module); mod.filename=file; mod.paths=module.paths; mod._compile(compiled.code,file);
  const css = fs.readFileSync(path.join(root,'components/brand/munshi.css'),'utf8');
  let serial=0;
  const svg = (state='idle',size=256,animated=false,compact=false) => {
    let markup=renderToStaticMarkup(React.createElement(mod.exports.MunshiArt,{ id:`export-${serial++}`,state,size,animated,compact,title:`Munshi ji — ${state}` },animated ? React.createElement('style',null,css) : null));
    if (!animated) {
      // Bake resting transforms into SVG attributes. Print/import renderers such as
      // librsvg do not consistently implement CSS transform-origin on SVG groups.
      markup=markup.replace(/class="mj-(rest|adjust)-arm"/g,'transform="rotate(-64 63 171)"');
      markup=markup.replace('class="mj-touch-hand"','opacity="0"');
      markup=markup.replace('class="mj-document"','transform="translate(0 -13) rotate(-4 174 224)"');
      if(state==='listening') markup=markup.replace('class="mj-body"','transform="rotate(-3 140 240)"');
      if(state==='concerned'||state==='error') markup=markup.replace('class="mj-body"','transform="rotate(2 140 240)"');
      if(state==='reading'||state==='working'||state==='uploading') markup=markup.replaceAll('class="mj-pupils"','transform="translate(0 5)"');
      if(state==='secure') markup=markup.replace('class="mj-eyes"','transform="translate(0 96.3) scale(1 .1)"');
    }
    return markup;
  };
  for (const state of states) {
    fs.writeFileSync(path.join(out,`${state}.svg`),svg(state,256,true));
    fs.writeFileSync(path.join(out,`${state}-static.svg`),svg(state));
  }
  const logo=svg('idle',512,false,true);
  fs.writeFileSync(path.join(out,'logo.svg'),logo);
  fs.writeFileSync(path.join(out,'logo-full.svg'),svg('welcome',512,false));
  // Print mark keeps white eye openings and single dark ink for the rest.
  const mono=logo.replace(/<defs>[\s\S]*?<\/defs>/,'').replace(/clip-path="[^"]*"/g,'').replace(/fill="(?!none)[^"]*"/g,'fill="#2A1B4A"').replace(/stroke="(?!none)[^"]*"/g,'stroke="#2A1B4A"');
  // A simple silhouette is a secondary mark, not a substitute for the face avatar.
  fs.writeFileSync(path.join(out,'logo-silhouette.svg'),mono);
  for (const size of [20,24,34,38,56,72,96,120,150,256,512]) {
    await sharp(Buffer.from(logo)).resize(size,size).png().toFile(path.join(out,`logo-${size}.png`));
  }
  const sheetStates=['welcome','idle','listening','explaining','working','reading','uploading','happy','concerned','success','error','secure'];
  const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1320" viewBox="0 0 1440 1320"><rect width="1440" height="1320" fill="#fffaf3"/><text x="48" y="65" font-family="sans-serif" font-size="32" fill="#2A1B4A">Munshi ji / vector character and expression sheet</text>${sheetStates.map((s,i)=>`<g transform="translate(${48+(i%4)*348},${100+Math.floor(i/4)*395})">${svg(s,300,false)}<text x="150" y="335" text-anchor="middle" font-family="sans-serif" font-size="21" fill="#2A1B4A">${s}</text></g>`).join('')}</svg>`;
  fs.writeFileSync(path.join(out,'character-sheet.svg'),sheet);
  await sharp(Buffer.from(sheet)).png().toFile(path.join(out,'character-sheet.png'));
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({
    name:'Munshi ji', source:'components/brand/munshi-art.tsx', animationCss:'components/brand/munshi.css',
    states, avatarPngSizes:[20,24,34,38,56,72,96,120,150,256,512],
    identityMaster:'Munsi ji/Munshi ji.png', generatedAt:new Date().toISOString(),
  },null,2));
  fs.writeFileSync(path.join(out,'README.txt'),`MUNSHI JI VECTOR AND MOTION KIT\n\nThe purple background and message box in the supplied identity master are intentionally excluded.\n\nlogo.svg             primary transparent avatar mark\nlogo-full.svg        transparent welcome pose\nlogo-silhouette.svg  one-colour secondary silhouette\nlogo-20.png ...      raster avatar exports\n*-static.svg          editable still state\n*.svg                 standalone animated state with embedded CSS\ncharacter-sheet.svg   vector state sheet\ncharacter-sheet.png   raster preview sheet\nreference-sheet.png   approved illustrated identity/pose reference\nindex.html            interactive animation studio\nmanifest.json         machine-readable inventory\n\nWebsite source of truth:\n  components/brand/munshi-art.tsx\n  components/brand/munshi.css\n  components/brand/munshi.tsx\n\nRegenerate with: npm run export:munshi\n`);
  fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Munshi ji — animation studio</title><style>
  *{box-sizing:border-box}body{margin:0;background:#fcfaf7;color:#2a1b4a;font:16px/1.5 system-ui,sans-serif}main{max-width:1250px;margin:auto;padding:40px 24px}h1{font-size:clamp(28px,4vw,48px);letter-spacing:-.04em;margin:0}h2{font-size:24px}p{max-width:760px;color:#655b72}a{color:#653391}button,select{font:inherit;border:1px solid #d9cfdc;border-radius:10px;padding:9px 14px;background:white;color:#2a1b4a;cursor:pointer}button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #a761e6;outline-offset:3px}button[aria-pressed=true]{background:#2a1b4a;color:white}.controls,.links{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:20px 0}.stage{display:grid;grid-template-columns:1fr 1fr;gap:24px}.canvas{min-height:350px;display:flex;align-items:center;justify-content:center;border:1px solid #e1dbe5;border-radius:22px;background:#f2ecff}.canvas.dark{background:#101a30}.gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.card{padding:20px;background:white;border:1px solid #e7e0e8;border-radius:16px}.card h3{margin:8px 0;text-transform:capitalize}.card p{font-size:13px}.card .art{text-align:center}.avatars{display:flex;align-items:center;gap:20px;flex-wrap:wrap;background:#eee7fa;padding:24px;border-radius:16px}.avatars figure{margin:0;text-align:center}.avatars figcaption{font-size:12px}.paused *{animation-play-state:paused!important}.motion-off *{animation:none!important;transition:none!important}.motion-off .mj-wave-arm{transform:rotate(-64deg)}.motion-off .mj-touch-hand{opacity:0}.motion-off .mj-adjust-arm{opacity:1;transform:rotate(-64deg)}.motion-off .mj-body,.motion-off .mj-eyes{transform:none}.compare{padding:24px;background:#f2ecff;border-radius:16px}.note{font-size:13px}input[type=range]{width:min(450px,100%)}@media(max-width:760px){.gallery{grid-template-columns:repeat(2,1fr)}.stage{grid-template-columns:1fr}main{padding:24px 16px}}@media(max-width:410px){.gallery{grid-template-columns:1fr}}${css}</style>
  <main><h1>Meet Munshi ji.</h1><p>The supplied character translated into editable vector layers. No baked-in background or message box. Preview the same rig used across Wapsi, or download transparent artwork and standalone animations.</p>
  <div class="links"><a href="character-sheet.svg" download>Vector character sheet</a><a href="character-sheet.png" download>PNG sheet</a><a href="reference-sheet.png">Illustrated reference sheet</a><a href="logo.svg" download>Avatar SVG</a><a href="logo-full.svg" download>Full logo SVG</a><a href="../munshi-kit.zip" download>Download full kit</a></div>
  <div class="controls"><label>State <select id="state">${states.map(s=>`<option value="${s}" ${s==='working'?'selected':''}>${s}</option>`).join('')}</select></label><button id="replay">Replay</button><button id="pause" aria-pressed="false">Pause</button><button id="motion" aria-pressed="false">Reduced motion</button></div>
  <div class="stage"><div class="canvas" id="light-stage">${svg('working',300,true)}</div><div class="canvas dark" id="dark-stage">${svg('working',300,true)}</div></div>
  <p id="description">${descriptions.working}</p><label>Working-loop timeline <input id="timeline" type="range" min="0" max="6000" step="50" value="0"></label><output id="time">0.00s</output>
  <h2>Try the regime reaction</h2><div class="compare"><p class="note">Illustrative values only. Higher signed net means a larger refund or less tax due. Equal and unknown outcomes stay neutral. These controls do not change a return.</p><div id="reaction">${svg('idle',120,true)}</div><div class="controls"><button data-regime="new">New · refund ₹8,400</button><button data-regime="old">Old · refund ₹2,000</button><button data-regime="tie">Equal outcomes</button><button data-regime="unknown">Unknown outcomes</button></div><p id="reaction-label" role="status">Choose either example.</p></div>
  <h2>Small-size recognition</h2><div class="avatars">${[20,24,34,38,56,72,96,120,150].map(n=>`<figure>${svg('idle',n,false,true)}<figcaption>${n}px</figcaption></figure>`).join('')}</div>
  <h2>Interaction library</h2><div class="gallery">${states.map(s=>`<article class="card"><div class="art">${svg(s,180,true)}</div><h3>${s}</h3><p>${descriptions[s]}</p><a href="${s}.svg" download>Animation SVG</a> · <a href="${s}-static.svg" download>Still SVG</a></article>`).join('')}</div>
  <p class="note">This studio is a design artifact, not a filing surface. Production motion follows actual application state. Operating-system reduced motion is respected automatically. SVG files contain editable paths and CSS animation, not raster images or a Lottie rig.</p></main>
  <script>const templates=${JSON.stringify(Object.fromEntries(states.map(s=>[s,svg(s,300,true)]))).replace(/</g,'\\u003c')};const descriptions=${JSON.stringify(descriptions)};let seq=0;const fresh=s=>templates[s].replaceAll(/export-\\d+/g,'preview-'+seq++);const state=document.querySelector('#state');const light=document.querySelector('#light-stage'),dark=document.querySelector('#dark-stage');function show(){light.innerHTML=fresh(state.value);dark.innerHTML=fresh(state.value);document.querySelector('#description').textContent=descriptions[state.value];document.querySelector('#pause').setAttribute('aria-pressed','false');document.body.classList.remove('paused')}state.onchange=show;document.querySelector('#replay').onclick=show;document.querySelector('#pause').onclick=e=>{const on=document.body.classList.toggle('paused');e.target.setAttribute('aria-pressed',String(on))};document.querySelector('#motion').onclick=e=>{const on=document.body.classList.toggle('motion-off');e.target.setAttribute('aria-pressed',String(on))};document.querySelector('#timeline').oninput=e=>{if(state.value!=='working'){state.value='working';show()}for(const stage of [light,dark])for(const a of stage.getAnimations({subtree:true})){a.pause();a.currentTime=Number(e.target.value)}document.querySelector('#time').textContent=(Number(e.target.value)/1000).toFixed(2)+'s'};for(const b of document.querySelectorAll('[data-regime]'))b.onclick=()=>{const v=b.dataset.regime,s=v==='new'?'happy':v==='old'?'concerned':'idle';document.querySelector('#reaction').innerHTML=fresh(s).replaceAll('width="300"','width="120"').replaceAll('height="300"','height="120"');document.querySelector('#reaction-label').textContent=v==='new'?'Higher refund selected.':v==='old'?'Lower refund selected. Both choices remain available.':'Neutral: no supported difference.';for(const x of document.querySelectorAll('[data-regime]'))x.setAttribute('aria-pressed',String(x===b))};</script></html>`);
  console.log(`Exported ${states.length} animated SVGs, ${states.length} stills, logos, 11 PNG sizes, vector/PNG sheet and studio to ${out}`);
}
main().catch(e=>{console.error(e);process.exitCode=1});
