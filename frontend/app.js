const SAMPLE_TEXT = `Artificial intelligence is changing how we learn. This app demonstrates gaze-based interaction. Look at any sentence and press spacebar to "blink" and highlight it. Highlighted sentences become flashcards you can review.`;

const reader = document.getElementById('reader');
const flashcardsDiv = document.getElementById('flashcards');
const gazeDot = document.getElementById('gazeDot');
let sentenceRects = [], gaze = {x:0, y:0}, flashcards = [];

function renderText() {
  const sents = SAMPLE_TEXT.split(/(?<=[.?!])\s+/);
  reader.innerHTML = '';
  sents.forEach((s, i) => {
    const span = document.createElement('span');
    span.className = 'sentence';
    span.textContent = s + ' ';
    reader.appendChild(span);
  });
  setTimeout(measureRects, 200);
}

function measureRects() {
  sentenceRects = [];
  document.querySelectorAll('.sentence').forEach(el => {
    const rect = el.getBoundingClientRect();
    sentenceRects.push({el, rect, text: el.innerText});
  });
}

function startGazer() {
  webgazer.setGazeListener((data) => {
    if (!data) return;
    gaze = {x: data.x, y: data.y};
    gazeDot.style.left = gaze.x + 'px';
    gazeDot.style.top = gaze.y + 'px';
  }).begin();
  webgazer.showVideo(false);
  webgazer.showFaceOverlay(false);
}

function blink() {
  const hit = sentenceRects.find(r =>
    gaze.x >= r.rect.left && gaze.x <= r.rect.right &&
    gaze.y >= r.rect.top && gaze.y <= r.rect.bottom
  );
  if (!hit) return;
  hit.el.classList.add('highlight');
  flashcards.push({q: `Explain "${hit.text}"`, a: hit.text});
  renderCards();
}

function renderCards() {
  flashcardsDiv.innerHTML = '';
  flashcards.forEach(c => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<strong>${c.q}</strong><p>${c.a}</p>`;
    flashcardsDiv.appendChild(div);
  });
}

window.addEventListener('keydown', e => {
  if (e.key === ' ') blink();
});
window.addEventListener('resize', () => setTimeout(measureRects, 200));

renderText();
startGazer();
