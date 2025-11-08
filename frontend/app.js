const SAMPLE_TEXT = `
Artificial intelligence is transforming the way humans interact with technology. 
From voice assistants that understand speech to recommendation systems that learn what we enjoy, 
machines are adapting to us faster than we ever imagined. 
In classrooms, teachers are using adaptive learning systems that personalize instruction for each student, 
analyzing strengths, weaknesses, and pace in real time. 
In hospitals, algorithms assist doctors in diagnosing diseases earlier than ever before, 
sometimes spotting patterns invisible to the human eye. 
Yet despite these breakthroughs, there remains an important conversation about how we maintain 
human judgment, ethics, and empathy in the loop. 

The power of AI lies not only in computation but in interpretation. 
A model may detect anomalies in millions of images, 
but it takes a person to decide whether those patterns matter. 
As researchers, we are challenged to design systems that complement rather than replace human capabilities. 
Some experiments explore gaze tracking as a new interface—allowing users to control computers 
simply by looking at text or images on the screen. 
Imagine a student reading digital material, and the system automatically highlighting sections 
where their attention lingers or wanes. 
This kind of interaction merges psychology, design, and engineering into something profoundly human. 

Still, technology is not neutral. 
The data we feed it reflects our societies—with all their biases and assumptions. 
Building ethical systems means more than writing code; 
it requires reflection, debate, and humility. 
Developers must constantly ask: whose values are embedded in our algorithms, 
and whose voices are missing from the training data? 
Transparency, explainability, and accountability will determine whether people trust the 
tools we create. 
When users understand *why* an AI made a certain decision, 
they can respond critically rather than passively accepting its output. 

Looking ahead, the convergence of artificial intelligence, neuroscience, and human-computer interaction 
will redefine what it means to learn, create, and collaborate. 
Machines will become less like calculators and more like companions in discovery. 
But the direction we take depends on us. 
The future of AI is not prewritten—it’s coauthored every day by engineers, artists, teachers, and ordinary users. 
Our responsibility is to make sure that future remains inclusive, transparent, and ultimately, human-centered.
`;

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
  const SMOOTH_N = 7;          // moving-average window
  const ALPHA = 0.22;          // low-pass factor (0–1), higher = more responsive
  const buf = [];
  let last = { x: 0, y: 0 };

  // Optional tunables
  webgazer.params.stabilization = 0.7;     // steadier cursor
  webgazer.params.trainingThreshold = 80;  // require more samples before retrain

  // Begin and hide default video/overlays
  webgazer
    .setRegression('ridge')
    .setGazeListener((data) => {
      if (!data) return;

      // Moving average to kill spikes
      buf.push([data.x, data.y]);
      if (buf.length > SMOOTH_N) buf.shift();
      const avgX = buf.reduce((s, p) => s + p[0], 0) / buf.length;
      const avgY = buf.reduce((s, p) => s + p[1], 0) / buf.length;

      // Low-pass filter for silky motion
      last.x = last.x * (1 - ALPHA) + avgX * ALPHA;
      last.y = last.y * (1 - ALPHA) + avgY * ALPHA;

      gaze = { x: last.x, y: last.y };
      gazeDot.style.left = `${gaze.x}px`;
      gazeDot.style.top  = `${gaze.y}px`;
    })
    .begin();

  webgazer.showVideo(false);
  webgazer.showFaceOverlay(false);
  webgazer.showPredictionPoints(true); // turn off later if you prefer

  // Record clicks as training samples (helps a lot)
  webgazer.addMouseEventListeners();
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
