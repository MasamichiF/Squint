const dropzone = document.getElementById('dropzone');
const dropzoneError = document.getElementById('dropzoneError');
const fileInput = document.getElementById('fileInput');
const stage = document.getElementById('stage');
const image = document.getElementById('image');
const imageWrap = document.querySelector('.image-wrap');
const imageArea = document.querySelector('.image-area');
const toggleBtn = document.getElementById('toggleBtn');
const flipBtn = document.getElementById('flipBtn');
const zoomBtn = document.getElementById('zoomBtn');
const gridThirdsBtn = document.getElementById('gridThirdsBtn');
const gridCrossBtn = document.getElementById('gridCrossBtn');
const viewStatus = document.getElementById('viewStatus');

let imageHovered = false;
function updateViewStatus() {
  const hoverOriginal = imageHovered && !image.classList.contains('actual-size');
  const showingOriginal = stage.classList.contains('show-original') || hoverOriginal;
  viewStatus.textContent = showingOriginal ? '現在: 原画' : '現在: スクイント';
  viewStatus.classList.toggle('original', showingOriginal);
}
image.addEventListener('mouseenter', () => { imageHovered = true; updateViewStatus(); });
image.addEventListener('mouseleave', () => { imageHovered = false; updateViewStatus(); });

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
  imageArea.classList.remove('grid-thirds', 'grid-cross');
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

const blurInput = document.getElementById('blur');
const contrastInput = document.getElementById('contrast');
const saturateInput = document.getElementById('saturate');
const posterInput = document.getElementById('poster');
const blurOut = document.getElementById('blurOut');
const contrastOut = document.getElementById('contrastOut');
const saturateOut = document.getElementById('saturateOut');
const posterOut = document.getElementById('posterOut');

const fBlur = document.getElementById('fBlur');
const fSat = document.getElementById('fSat');
const VERTICAL_BLUR_RATIO = 0.6;
const contrastFuncs = ['conR', 'conG', 'conB'].map(id => document.getElementById(id));
const posterFuncs = ['posterR', 'posterG', 'posterB'].map(id => document.getElementById(id));

function updateBlur() {
  const b = parseFloat(blurInput.value);
  fBlur.setAttribute('stdDeviation', `${b} ${(b * VERTICAL_BLUR_RATIO).toFixed(2)}`);
  blurOut.textContent = b.toFixed(1) + ' px';
}
function updateContrast() {
  const c = parseInt(contrastInput.value, 10) / 100;
  const intercept = (0.5 * (1 - c)).toFixed(4);
  for (const f of contrastFuncs) {
    f.setAttribute('slope', c);
    f.setAttribute('intercept', intercept);
  }
  contrastOut.textContent = contrastInput.value + ' %';
}
function updateSaturate() {
  const s = parseInt(saturateInput.value, 10) / 100;
  fSat.setAttribute('values', s);
  saturateOut.textContent = saturateInput.value + ' %';
}
function updatePoster() {
  const n = parseInt(posterInput.value, 10);
  const values = Array.from({ length: n }, (_, i) => (i / (n - 1)).toFixed(4)).join(' ');
  for (const f of posterFuncs) f.setAttribute('tableValues', values);
  posterOut.textContent = n + ' 段';
}

blurInput.addEventListener('input', updateBlur);
contrastInput.addEventListener('input', updateContrast);
saturateInput.addEventListener('input', updateSaturate);
posterInput.addEventListener('input', updatePoster);
updateBlur();
updateContrast();
updateSaturate();
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
  updateViewStatus();
});
function setGridMode(mode) {
  imageArea.classList.remove('grid-thirds', 'grid-cross');
  const isThirds = mode === 'thirds';
  const isCross = mode === 'cross';
  if (isThirds) imageArea.classList.add('grid-thirds');
  if (isCross) imageArea.classList.add('grid-cross');
  gridThirdsBtn.classList.toggle('active', isThirds);
  gridThirdsBtn.setAttribute('aria-pressed', String(isThirds));
  gridCrossBtn.classList.toggle('active', isCross);
  gridCrossBtn.setAttribute('aria-pressed', String(isCross));
}

gridThirdsBtn.addEventListener('click', () => {
  setGridMode(imageArea.classList.contains('grid-thirds') ? null : 'thirds');
});
gridCrossBtn.addEventListener('click', () => {
  setGridMode(imageArea.classList.contains('grid-cross') ? null : 'cross');
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
