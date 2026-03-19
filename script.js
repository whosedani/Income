/* ========== CONFIG ========== */
const DEFAULT_CONFIG = {
  ca: '',
  twitter: '#',
  community: '#',
  buy: '#'
};

let CONFIG = { ...DEFAULT_CONFIG };

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      CONFIG = { ...DEFAULT_CONFIG, ...data };
    }
  } catch (e) {
    // silent — use defaults
  }
  applyConfig();
}

function applyConfig() {
  const caBtn = document.getElementById('caButton');
  const caText = document.getElementById('caText');
  if (CONFIG.ca) {
    caText.textContent = CONFIG.ca;
  } else {
    caText.textContent = 'CA coming soon';
  }

  const setHref = (id, url) => {
    const el = document.getElementById(id);
    if (el && url) el.href = url;
  };

  setHref('twitterLink', CONFIG.twitter);
  setHref('twitterBtn', CONFIG.twitter);
  setHref('communityLink', CONFIG.community);
  setHref('communityBtn', CONFIG.community);
  setHref('buyButton', CONFIG.buy);
}

/* ========== COPY CA ========== */
document.getElementById('caButton').addEventListener('click', async () => {
  if (!CONFIG.ca) return;
  try {
    await navigator.clipboard.writeText(CONFIG.ca);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = CONFIG.ca;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
});

/* ========== HERO SOUND ========== */
const heroVideo = document.getElementById('heroVideo');
const heroSoundBtn = document.getElementById('heroSound');
let heroMuted = true;

heroSoundBtn.addEventListener('click', () => {
  heroMuted = !heroMuted;
  if (heroMuted) {
    heroVideo.muted = true;
    heroSoundBtn.querySelector('.sound-icon').textContent = '🔇';
  } else {
    heroVideo.muted = false;
    heroVideo.volume = 0;
    heroSoundBtn.querySelector('.sound-icon').textContent = '🔊';
    // volume ramp
    let vol = 0;
    const ramp = setInterval(() => {
      vol += 0.5 / (1500 / 30);
      if (vol >= 0.5) {
        vol = 0.5;
        clearInterval(ramp);
      }
      heroVideo.volume = vol;
    }, 30);
  }
});

/* ========== SCRAMBLE TYPEWRITER ========== */
const phrases = [
  "he doesn't have a job. he has a system.",
  "unemployed since never. retired since always.",
  "the bag is not explained. it is simply present.",
  "you know the type. you are the type."
];

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&';
const scrambleEl = document.getElementById('scrambleText');
let phraseIndex = 0;

function scrambleReveal(text, callback) {
  let revealed = 0;
  const len = text.length;
  const interval = setInterval(() => {
    let out = '';
    for (let i = 0; i < len; i++) {
      if (i < revealed) {
        out += text[i];
      } else if (i < revealed + 3) {
        out += chars[Math.floor(Math.random() * chars.length)];
      } else {
        out += ' ';
      }
    }
    scrambleEl.textContent = out;
    revealed += 0.5;
    if (revealed > len + 3) {
      clearInterval(interval);
      scrambleEl.textContent = text;
      if (callback) callback();
    }
  }, 35);
}

function scrambleOut(callback) {
  const current = scrambleEl.textContent;
  const len = current.length;
  let progress = 0;
  const interval = setInterval(() => {
    let out = '';
    for (let i = 0; i < len; i++) {
      if (i > progress) {
        out += current[i];
      } else {
        out += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    scrambleEl.textContent = out;
    progress += 1;
    if (progress > len) {
      clearInterval(interval);
      scrambleEl.textContent = '';
      if (callback) callback();
    }
  }, 25);
}

function cyclePhrase() {
  scrambleReveal(phrases[phraseIndex], () => {
    setTimeout(() => {
      scrambleOut(() => {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(cyclePhrase, 400);
      });
    }, 3000);
  });
}

setTimeout(cyclePhrase, 800);

/* ========== VIDEO GALLERY SOUND ========== */
document.querySelectorAll('.vid-sound').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const card = btn.closest('.evidence-card');
    const video = card.querySelector('video');
    const isMuted = video.muted;

    // mute all gallery videos first
    document.querySelectorAll('.evidence-card video').forEach(v => {
      v.muted = true;
    });
    document.querySelectorAll('.vid-sound span').forEach(s => {
      s.textContent = '🔇';
    });

    if (isMuted) {
      video.muted = false;
      video.volume = 0.5;
      btn.querySelector('span').textContent = '🔊';
      gallerySoundActivated = true;
    } else {
      gallerySoundActivated = false;
    }
  });
});

/* ========== VIDEO GALLERY CAROUSEL FOCUS ========== */
const evidenceScroll = document.querySelector('.evidence-scroll');
const evidenceCards = document.querySelectorAll('.evidence-card');
const scrollbarThumb = document.querySelector('.evidence-scrollbar-thumb');
let gallerySoundActivated = false; // becomes true after user unmutes first time
let prevActiveIdx = -1;

function updateGalleryFocus() {
  if (!evidenceScroll || evidenceCards.length === 0) return;

  const scrollRect = evidenceScroll.getBoundingClientRect();
  const center = scrollRect.left + scrollRect.width / 2;

  let closestIdx = 0;
  let closestDist = Infinity;

  evidenceCards.forEach((card, i) => {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.left + cardRect.width / 2;
    const dist = Math.abs(center - cardCenter);

    card.classList.remove('active', 'near');

    if (dist < closestDist) {
      closestDist = dist;
      closestIdx = i;
    }
  });

  evidenceCards.forEach((card, i) => {
    const diff = Math.abs(i - closestIdx);
    if (diff === 0) card.classList.add('active');
    else if (diff === 1) card.classList.add('near');
  });

  // auto-switch sound to focused card (only after user activated sound once)
  if (gallerySoundActivated && closestIdx !== prevActiveIdx) {
    document.querySelectorAll('.evidence-card video').forEach(v => { v.muted = true; });
    document.querySelectorAll('.vid-sound span').forEach(s => { s.textContent = '🔇'; });

    const activeCard = evidenceCards[closestIdx];
    const activeVideo = activeCard.querySelector('video');
    activeVideo.muted = false;
    activeVideo.volume = 0.5;
    activeCard.querySelector('.vid-sound span').textContent = '🔊';
  }
  prevActiveIdx = closestIdx;

  // update scrollbar thumb
  if (scrollbarThumb) {
    const maxScroll = evidenceScroll.scrollWidth - evidenceScroll.clientWidth;
    const pct = maxScroll > 0 ? evidenceScroll.scrollLeft / maxScroll : 0;
    scrollbarThumb.style.left = (pct * 70) + '%';
  }
}

if (evidenceScroll) {
  evidenceScroll.addEventListener('scroll', updateGalleryFocus, { passive: true });
  // click-to-center
  evidenceCards.forEach(card => {
    card.addEventListener('click', () => {
      const scrollRect = evidenceScroll.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const offset = cardRect.left + cardRect.width / 2 - scrollRect.left - scrollRect.width / 2;
      evidenceScroll.scrollBy({ left: offset, behavior: 'smooth' });
    });
  });
  // initial state
  setTimeout(updateGalleryFocus, 100);
}

/* ========== SCROLL ANIMATIONS ========== */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.type-row').forEach(el => observer.observe(el));
document.querySelectorAll('.quote-word').forEach((el, i) => {
  el.style.transitionDelay = `${i * 0.2}s`;
  observer.observe(el);
});

/* ========== STAT BARS ========== */
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target.querySelector('.stat-fill');
      if (fill) {
        const w = fill.getAttribute('data-width');
        setTimeout(() => { fill.style.width = w + '%'; }, 200);
      }
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.stat-card').forEach(el => statObserver.observe(el));

/* ========== SCROLL WORDS — bidirectional horizontal slide ========== */
function handleScrollWords() {
  const blocks = document.querySelectorAll('.scroll-word-block');
  blocks.forEach(block => {
    const word = block.querySelector('.scroll-word');
    const dir = word.getAttribute('data-dir');
    const rect = block.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = 1 - (rect.top / vh);
    const clamped = Math.max(-1, Math.min(2, progress));
    const offset = (clamped - 0.5) * 300;
    word.style.transform = dir === 'left'
      ? `translateX(${-offset}px)`
      : `translateX(${offset}px)`;
  });
}

window.addEventListener('scroll', handleScrollWords, { passive: true });

/* ========== GLITCH RANDOMIZER ========== */
const glitch = document.querySelector('.glitch');
function triggerGlitch() {
  glitch.style.animation = 'none';
  void glitch.offsetHeight;
  const beforeDur = (4 + Math.random() * 2).toFixed(1);
  const afterDur = (4 + Math.random() * 2).toFixed(1);
  glitch.style.setProperty('--g-before', beforeDur + 's');
  glitch.style.setProperty('--g-after', afterDur + 's');
  if (glitch.style.cssText.includes('--g-before')) {
    // CSS will handle it via the keyframes
  }
}
setInterval(triggerGlitch, 5000);

/* ========== INIT ========== */
loadConfig();
