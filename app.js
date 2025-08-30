let asap, aftn, born, wait, ready;
let ans, furi, sl, session = [], slog = [];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function lvl2subj(spec) {
  const lvls = [];
  spec.replace(/\d+/g, m => lvls.push(m));
  if (lvls.length == 0) return;
  const [a, b] = lvls.map(n => n * 1);
  return wklvl.slice(a, (b||a) + 1).join('');
}

function calcsl() {
  const tsbj = lvl2subj(lvl.value);
  if (!tsbj) return sbr.innerText = slr.innerText = '';
  sbr.innerText = `${tsbj.length} kanji`;
  if (sd.value[0] != 'x') return slr.innerText = '';
  const csl = sd.value.slice(1) * tsbj.length;
  slr.innerText = csl ? `${csl} kanji` : '';
}

function save(vs) {
  vs.split(' ').forEach(v => {
    localStorage[v] = config[v].value;
  });
}

function load(vs) {
  vs.split(' ').forEach(v => {
    config[v].value = localStorage[v];
  });
}

function ikimasu() {
  const subj = lvl2subj(lvl.value).split('');

  const dur = sd.value * 1;
  if (dur) {
    while (session.length < dur) {
      shuffle(subj);
      let s = subj.slice(0, dur - session.length);
      session.splice(0, 0, ...s);
    }
  } else {
    const reps = sd.value.slice(1) * 1 || 1;
    session = [...new Array(reps)].map(() => {
      shuffle(subj);
      return subj.join('');
    }).join('').split('');
  }

  sl = session.length;
  asap = config.acc.value == 'asap';
  aftn = config.aftn.value;
  nr.addEventListener('keyup', check);
  setTimeout(() => { ready = 1 }, 0);

  save('lvl sd acc aftn');
  sh(main, config);
  tick();
}

function up(n) {
  slog.push([ans, n]);
  const rs = slog.length;
  const clr = slog.map(([_, r]) => ['#a32', '#365'][r]);
  pbar.style.backgroundImage = `linear-gradient(to right, ${clr.join(',')})`;
  pbar.style.backgroundSize = `${rs / sl * 100}%`;
}

const el = (tag, props = {}, children = []) => children.reduce((e, child) =>
  (e.append(child), e), Object.assign(document.createElement(tag), props);
);

function tick() {
  ans = session.pop();
  if (!ans) return finish();
  const [def, vocs] = kanji[ans];
  defn.innerText = def;
  nr.className = nr.value = '';
  nr.focus();
  born = performance.now();
  sh(bmiss, bnext);

  furi = [];
  const welms = vocs.map(word => {
    const [mn, fs] = words[word];
    const pron = fs.map(([k,h]) => k.indexOf(ans) > -1 ? `<b>${h}</b>` : (h||k)).join('');
    const rh = fs.map(([k,h]) => h||k).join('');
    furi.push(fs.map(([s, p]) => p ? el('ruby', s.indexOf(ans) > -1 ? {className: 'hl'} : {}, [s, el('rt', {innerText: p})]) : el('span', {className: 'bh', innerText: s})));

    const vle = el('div', {className: 'vl'}, [el('span', {className: 'vw', innerHTML: pron}), ': ', el('span', {className: 'mn', innerText: mn})]);
    vle.addEventListener('click', plaud);
    vle.setAttribute('data-rh', rh);
    return vle;
  });
  vl.replaceChildren(...welms);
  setTimeout(function() {
    document.querySelectorAll('.mn').forEach(e => e.classList.add('sm'));
  }, 1500);
}

function check(ev) {
  if (!ready) return;
  const ima = performance.now();
  if (ima - born < 500) {
    // ignore what was almost certainly an unintentional initial stroke
    nr.dispatchEvent(new CompositionEvent('compositionend'));
    nr.value = '';
  }
  if (ev.keyCode == 13) {
    if (nr.value != ans) return miss();
    return hit();
  }
  if (asap && nr.value == ans) hit();
}

function hit() {
  up(1);
  nr.blur();
  if (aftn == '0') return setTimeout(tick, 0);
  nr.classList.add('win');
  sh(bnext, bmiss);
  document.querySelectorAll('.vw').forEach(e => e.replaceWith(...furi.shift()));
  if (aftn) wait = setTimeout(tick, aftn * 1000);
}

const show = e => e.style.display = 'block';
const hide = e => e.style.display = 'none';
const sh = (a, b) => { show(a); hide(b); };

function miss() {
  up(0);
  nr.blur();
  nr.classList.add('miss');
  sh(bnext, bmiss);
  document.querySelectorAll('.vw').forEach(e => e.replaceWith(...furi.shift()));
}

function next() {
  clearTimeout(wait);
  tick();
}

function finish() {
  const am = {};
  const rek = slog.map(([k, n]) => {
    if (!n) am[k] = 1;
    return el('span', {className: ['rw', 'rc'][n], innerText: k});
  });
  sr.replaceChildren(...rek);
  session = Object.keys(am);
  shuffle(session);
  if (!session.length) hide(bcram);
  sh(res, main);
}

function cram() {
  slog = [];
  sl = session.length;
  sh(main, res);
  tick();
}

function plaud(ev) {
  const tv = ev.target.closest('.vl');
  const rh = tv.getAttribute('data-rh');
  (new Audio(`https://kanjissen-audio.onrender.com/${rh}?cb=${Math.random()}`)).play();
}

hide(main);
hide(res);
if (localStorage['lvl']) load('lvl sd acc aftn');
calcsl();
