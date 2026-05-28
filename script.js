const dropzone = document.getElementById('dropzone');
const dropzoneError = document.getElementById('dropzoneError');
const fileInput = document.getElementById('fileInput');
const stage = document.getElementById('stage');
const image = document.getElementById('image');
const imageWrap = document.querySelector('.image-wrap');
const toggleBtn = document.getElementById('toggleBtn');
const flipBtn = document.getElementById('flipBtn');
const zoomBtn = document.getElementById('zoomBtn');
const gridThirdsBtn = document.getElementById('gridThirdsBtn');
const gridCrossBtn = document.getElementById('gridCrossBtn');
const viewStatus = document.getElementById('viewStatus');

let imageHovered = false;
function updateViewStatus() {
  const showingOriginal = stage.classList.contains('show-original') || imageHovered;
  viewStatus.textContent = showingOriginal ? '現在: 原画' : '現在: スクイント';
  viewStatus.classList.toggle('original', showingOriginal);
}
image.addEventListener('mouseenter', () => { imageHovered = true; updateViewStatus(); });
image.addEventListener('mouseleave', () => { imageHovered = false; updateViewStatus(); });

const root = document.documentElement;
const TOGGLE_DEFAULT_TEXT = '原画を表示（ホバー中も原画）';
let currentObjectUrl = null;

function loadFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    dropzoneError.textContent = '画像ファイルを選択してください。';
    return;
  }
  dropzoneError.textContent = '';
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);
  image.src = currentObjectUrl;
  stage.classList.remove('hidden');
  stage.classList.remove('show-original');
  image.classList.remove('flipped');
  image.classList.remove('actual-size');
  imageWrap.scrollLeft = 0;
  imageWrap.scrollTop = 0;
  imageHovered = false;
  flipBtn.classList.remove('active');
  flipBtn.setAttribute('aria-pressed', 'false');
  zoomBtn.classList.remove('active');
  zoomBtn.setAttribute('aria-pressed', 'false');
  imageWrap.classList.remove('grid-thirds', 'grid-cross');
  gridThirdsBtn.classList.remove('active');
  gridThirdsBtn.setAttribute('aria-pressed', 'false');
  gridCrossBtn.classList.remove('active');
  gridCrossBtn.setAttribute('aria-pressed', 'false');
  toggleBtn.textContent = TOGGLE_DEFAULT_TEXT;
  updateViewStatus();
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener('change', (e) => {
  loadFile(e.target.files[0]);
  e.target.value = '';
});

function isFileDrag(e) {
  return e.dataTransfer && [...e.dataTransfer.types].includes('Files');
}
let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  if (!isFileDrag(e)) return;
  dragDepth++;
  dropzone.classList.add('dragover');
});
window.addEventListener('dragover', (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
window.addEventListener('dragleave', (e) => {
  if (!isFileDrag(e)) return;
  dragDepth--;
  if (dragDepth <= 0) {
    dragDepth = 0;
    dropzone.classList.remove('dragover');
  }
});
window.addEventListener('drop', (e) => {
  if (!isFileDrag(e)) return;
  e.preventDefault();
  dragDepth = 0;
  dropzone.classList.remove('dragover');
  loadFile(e.dataTransfer.files[0]);
});

const sliders = [
  { id: 'blur',     out: 'blurOut',     unit: 'px', prop: '--blur',     suffix: 'px', fixed: 1 },
  { id: 'contrast', out: 'contrastOut', unit: '%',  prop: '--contrast', suffix: '%',  fixed: 0 },
  { id: 'saturate', out: 'saturateOut', unit: '%',  prop: '--saturate', suffix: '%',  fixed: 0 },
];

for (const s of sliders) {
  const input = document.getElementById(s.id);
  const output = document.getElementById(s.out);
  const update = () => {
    const v = parseFloat(input.value);
    root.style.setProperty(s.prop, v + s.suffix);
    output.textContent = v.toFixed(s.fixed) + ' ' + s.unit;
  };
  input.addEventListener('input', update);
  update();
}

const posterInput = document.getElementById('poster');
const posterOut = document.getElementById('posterOut');
const posterFuncs = ['posterR', 'posterG', 'posterB'].map(id => document.getElementById(id));

function updatePoster() {
  const n = parseInt(posterInput.value, 10);
  const values = Array.from({ length: n }, (_, i) => (i / (n - 1)).toFixed(4)).join(' ');
  for (const f of posterFuncs) f.setAttribute('tableValues', values);
  posterOut.textContent = n + ' 段';
}
posterInput.addEventListener('input', updatePoster);
updatePoster();

const presets = [
  { name: '軽くスクイント', blur: 2, contrast: 120, saturate: 60, poster: 8 },
  { name: '強くスクイント', blur: 6, contrast: 150, saturate: 30, poster: 4 },
  { name: '明暗チェック',   blur: 4, contrast: 180, saturate: 0,  poster: 3 },
];
const DEFAULTS = { blur: 3, contrast: 130, saturate: 40, poster: 5 };
const SLIDER_KEYS = ['blur', 'contrast', 'saturate', 'poster'];

function applyValues(v) {
  for (const key of SLIDER_KEYS) {
    const input = document.getElementById(key);
    input.value = v[key];
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

const presetContainer = document.getElementById('presets');
const presetButtons = presets.map(p => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = p.name;
  btn.addEventListener('click', () => applyValues(p));
  presetContainer.appendChild(btn);
  return { btn, preset: p };
});

const resetBtn = document.createElement('button');
resetBtn.type = 'button';
resetBtn.textContent = 'リセット';
resetBtn.className = 'reset';
resetBtn.addEventListener('click', () => applyValues(DEFAULTS));
presetContainer.appendChild(resetBtn);

function syncActivePreset() {
  const current = Object.fromEntries(
    SLIDER_KEYS.map(k => [k, parseFloat(document.getElementById(k).value)])
  );
  for (const { btn, preset } of presetButtons) {
    const match = SLIDER_KEYS.every(k => preset[k] === current[k]);
    btn.classList.toggle('active', match);
  }
}

for (const key of SLIDER_KEYS) {
  document.getElementById(key).addEventListener('input', syncActivePreset);
}
syncActivePreset();

toggleBtn.addEventListener('click', () => {
  const showing = stage.classList.toggle('show-original');
  toggleBtn.textContent = showing ? '加工後を表示' : TOGGLE_DEFAULT_TEXT;
  updateViewStatus();
});

flipBtn.addEventListener('click', () => {
  const flipped = image.classList.toggle('flipped');
  flipBtn.classList.toggle('active', flipped);
  flipBtn.setAttribute('aria-pressed', String(flipped));
});

zoomBtn.addEventListener('click', () => {
  const zoomed = image.classList.toggle('actual-size');
  zoomBtn.classList.toggle('active', zoomed);
  zoomBtn.setAttribute('aria-pressed', String(zoomed));
  if (!zoomed) {
    imageWrap.scrollLeft = 0;
    imageWrap.scrollTop = 0;
  }
});
function setGridMode(mode) {
  imageWrap.classList.remove('grid-thirds', 'grid-cross');
  const isThirds = mode === 'thirds';
  const isCross = mode === 'cross';
  if (isThirds) imageWrap.classList.add('grid-thirds');
  if (isCross) imageWrap.classList.add('grid-cross');
  gridThirdsBtn.classList.toggle('active', isThirds);
  gridThirdsBtn.setAttribute('aria-pressed', String(isThirds));
  gridCrossBtn.classList.toggle('active', isCross);
  gridCrossBtn.setAttribute('aria-pressed', String(isCross));
}

gridThirdsBtn.addEventListener('click', () => {
  setGridMode(imageWrap.classList.contains('grid-thirds') ? null : 'thirds');
});
gridCrossBtn.addEventListener('click', () => {
  setGridMode(imageWrap.classList.contains('grid-cross') ? null : 'cross');
});

let isPanning = false;
let panStart = null;

image.addEventListener('mousedown', (e) => {
  if (!image.classList.contains('actual-size')) return;
  isPanning = true;
  panStart = {
    x: e.clientX,
    y: e.clientY,
    scrollLeft: imageWrap.scrollLeft,
    scrollTop: imageWrap.scrollTop,
  };
  imageWrap.classList.add('panning');
  e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  imageWrap.scrollLeft = panStart.scrollLeft - (e.clientX - panStart.x);
  imageWrap.scrollTop = panStart.scrollTop - (e.clientY - panStart.y);
});

window.addEventListener('mouseup', () => {
  if (!isPanning) return;
  isPanning = false;
  imageWrap.classList.remove('panning');
});
