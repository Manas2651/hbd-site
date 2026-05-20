/* ============================================
   Happy Birthday 3D — Application Logic
   Three.js particles · GSAP · Camera Reel
   ============================================ */

// ────────────────────────────────────────────
// CONFIGURATION — Change these easily!
// ────────────────────────────────────────────
const CONFIG = {
  /** The 4-digit passcode to unlock. Change this! */
  passcode: '2014',

  /** Name displayed in the birthday title */
  birthdayName: 'Anushree!',

  /** Number of particles in the swirl transition */
  particleCount: 500,

  /** Auto-advance interval for the reel (milliseconds) */
  reelInterval: 3500,

  /**
   * Photos for the camera reel (all from assets/).
   * The MAIN hero image (Picsart_26-05-20_11-11-14-080.png) is separate.
   */
  photos: [
    { src: 'assets/20260119_161856.jpg',                message: "Here's to another amazing year! 🎉" },
    { src: 'assets/20260119_163452 (1).jpg',            message: 'You make the world brighter! ✨' },
    { src: 'assets/IMG-20260109-WA0190.jpg',            message: 'Cheers to you, superstar! 🌟' },
    { src: 'assets/IMG-20260119-WA0299.jpg',            message: 'May all your dreams come true! 🎂' },
    { src: 'assets/IMG-20260119-WA0427.jpg',            message: 'Another year of awesomeness! 🥳' },
    { src: 'assets/IMG-20260119-WA0566.jpg',            message: 'Wishing you endless joy! 💖' },
    { src: 'assets/Picsart_26-01-27_23-56-38-603.png',  message: 'You are truly one of a kind! 🌈' },
    { src: 'assets/Picsart_26-01-28_03-31-21-500.png',  message: 'Keep shining bright! ✨' },
    { src: 'assets/Picsart_26-01-28_11-42-23-822.png',  message: 'Best wishes today and always! 🎈' },
    { src: 'assets/Picsart_26-01-28_16-10-20-928.png',  message: 'Enjoy your special day! 🎁' },
    { src: 'assets/Picsart_26-01-28_17-13-50-373.png',  message: 'To many more adventures! 🌟' },
    { src: 'assets/Picsart_26-01-30_02-30-12-086.png',  message: 'Happy Birthday! 🎂' },
  ],
};

// ────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────
let currentInput = '';
let isUnlocked = false;

// Three.js
let scene, camera, renderer;
let particleSystem, particleGeometry, particleMaterial;
let particleData = [];
let swirlProgress = { value: 0 };
let ambientParticles, ambientGeometry, ambientMaterial;
let rafId = null;
let clock;

// Parallax
let targetTiltX = 0, targetTiltY = 0;
let currentTiltX = 0, currentTiltY = 0;

// Camera Reel
let reelOpen = false;
let reelIndex = 0;
let reelAutoTimer = null;
let reelTouchStartX = 0;

// ────────────────────────────────────────────
// DOM REFERENCES
// ────────────────────────────────────────────
const lockScreen     = document.getElementById('lock-screen');
const dotsContainer  = document.getElementById('dots');
const dots           = dotsContainer.querySelectorAll('.dot');
const keypad         = document.getElementById('keypad');
const threeCanvas    = document.getElementById('three-canvas');
const mainContent    = document.getElementById('main-content');
const heroEmoji      = document.getElementById('hero-emoji');
const heroNameEl     = document.getElementById('hero-name');
const cameraHotspot  = document.getElementById('camera-hotspot');
const cameraReel     = document.getElementById('camera-reel');
const reelViewport   = document.getElementById('reel-viewport');
const reelMessage    = document.getElementById('reel-message');
const reelDotsEl     = document.getElementById('reel-dots');
const reelCloseBtn   = document.getElementById('reel-close');
const reelPrevBtn    = document.getElementById('reel-prev');
const reelNextBtn    = document.getElementById('reel-next');
const photoModal     = document.getElementById('photo-modal');
const modalImg       = document.getElementById('modal-img');
const modalMessage   = document.getElementById('modal-message');
const modalPhotoWrap = document.getElementById('modal-photo-wrap');

// ============================================
// PASSCODE LOCK SCREEN
// ============================================

function handleKeyPress(key) {
  if (isUnlocked) return;

  if (key === 'del') {
    if (currentInput.length > 0) {
      currentInput = currentInput.slice(0, -1);
      updateDots();
    }
    return;
  }

  if (currentInput.length >= 4) return;
  currentInput += key;
  updateDots();

  if (currentInput.length === 4) {
    setTimeout(() => checkPasscode(), 200);
  }
}

function updateDots() {
  dots.forEach((dot, i) => {
    dot.classList.toggle('filled', i < currentInput.length);
    dot.classList.remove('success', 'error');
  });
}

function checkPasscode() {
  if (currentInput === CONFIG.passcode) {
    isUnlocked = true;
    dots.forEach(d => { d.classList.remove('filled'); d.classList.add('success'); });
    setTimeout(unlockSequence, 400);
  } else {
    dots.forEach(d => { d.classList.remove('filled'); d.classList.add('error'); });
    dotsContainer.classList.add('shake');
    setTimeout(() => {
      dotsContainer.classList.remove('shake');
      dots.forEach(d => d.classList.remove('error'));
      currentInput = '';
      updateDots();
    }, 550);
  }
}

function initKeypad() {
  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.key-btn');
    if (!btn || btn.classList.contains('hidden-btn')) return;
    handleKeyPress(btn.dataset.key);
  });
  document.addEventListener('keydown', (e) => {
    if (isUnlocked) return;
    if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key);
    if (e.key === 'Backspace') handleKeyPress('del');
  });
}

// ============================================
// THREE.JS
// ============================================

function initThreeScene() {
  clock = new THREE.Clock();
  scene = new THREE.Scene();

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);
  camera.position.z = 6;

  renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  createSwirlParticles();
  createAmbientParticles();
  window.addEventListener('resize', onWindowResize);
}

function createGlowTexture(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0,   'rgba(255,255,255,1)');
  grad.addColorStop(0.25,'rgba(255,255,255,0.8)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.25)');
  grad.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function createSwirlParticles() {
  const count = CONFIG.particleCount;
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);

  const palette = [
    new THREE.Color('#ff6b9d'),
    new THREE.Color('#c084fc'),
    new THREE.Color('#fbbf24'),
    new THREE.Color('#ff9ec5'),
    new THREE.Color('#ddb4fe'),
    new THREE.Color('#ffffff'),
  ];

  particleData = [];
  for (let i = 0; i < count; i++) {
    particleData.push({
      baseAngle:    Math.random() * Math.PI * 2,
      angularSpeed: 1.5 + Math.random() * 3,
      maxRadius:    2 + Math.random() * 6,
      drift:        (Math.random() - 0.5) * 5,
      baseZ:        (Math.random() - 0.5) * 4,
      phase:        Math.random() * Math.PI * 2,
    });
    positions[i * 3] = positions[i * 3 + 1] = positions[i * 3 + 2] = 0;
    const col = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = col.r;  colors[i * 3 + 1] = col.g;  colors[i * 3 + 2] = col.b;
  }

  particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  particleMaterial = new THREE.PointsMaterial({
    size: 0.12, map: createGlowTexture(64),
    vertexColors: true, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });

  particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
}

function updateSwirlParticles(progress) {
  const positions = particleGeometry.attributes.position.array;
  for (let i = 0; i < CONFIG.particleCount; i++) {
    const d = particleData[i], i3 = i * 3;
    const angle  = d.baseAngle + progress * d.angularSpeed * Math.PI * 3;
    const radius = progress * d.maxRadius;
    positions[i3]     = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius + d.drift * progress;
    positions[i3 + 2] = d.baseZ + Math.sin(progress * Math.PI * 2 + d.phase) * 1.2;
  }
  particleGeometry.attributes.position.needsUpdate = true;

  let opacity;
  if (progress < 0.15)      opacity = progress / 0.15;
  else if (progress > 0.6)  opacity = 1 - (progress - 0.6) / 0.4;
  else                      opacity = 1;
  particleMaterial.opacity = Math.max(0, opacity);
}

function createAmbientParticles() {
  const count = 80;
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);
  const palette = [
    new THREE.Color('#ff6b9d'), new THREE.Color('#c084fc'),
    new THREE.Color('#fbbf24'), new THREE.Color('#ffffff'),
  ];
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    const col = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = col.r;  colors[i * 3 + 1] = col.g;  colors[i * 3 + 2] = col.b;
  }
  ambientGeometry = new THREE.BufferGeometry();
  ambientGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  ambientGeometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  ambientMaterial = new THREE.PointsMaterial({
    size: 0.06, map: createGlowTexture(32),
    vertexColors: true, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  ambientParticles = new THREE.Points(ambientGeometry, ambientMaterial);
  scene.add(ambientParticles);
}

function updateAmbientParticles(time) {
  const positions = ambientGeometry.attributes.position.array;
  const count = positions.length / 3;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3 + 1] += Math.sin(time * 0.4 + i * 0.7) * 0.003;
    positions[i3]     += Math.cos(time * 0.3 + i * 0.5) * 0.002;
  }
  ambientGeometry.attributes.position.needsUpdate = true;
}

function animate() {
  rafId = requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  updateSwirlParticles(swirlProgress.value);
  updateAmbientParticles(elapsed);
  currentTiltX += (targetTiltX - currentTiltX) * 0.06;
  currentTiltY += (targetTiltY - currentTiltY) * 0.06;
  camera.position.x = currentTiltX * 0.3;
  camera.position.y = currentTiltY * 0.2;
  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// UNLOCK SEQUENCE
// ============================================

function unlockSequence() {
  threeCanvas.style.opacity = '1';

  const tl = gsap.timeline({
    onComplete: () => {
      lockScreen.style.display = 'none';
      gsap.to(ambientMaterial, { opacity: 0.35, duration: 1 });
    },
  });

  tl.to(lockScreen, {
    scale: 0.85, opacity: 0, filter: 'blur(12px)',
    duration: 0.7, ease: 'power3.in',
  });

  tl.to(swirlProgress, {
    value: 1, duration: 2.2, ease: 'power2.inOut',
  }, '-=0.3');

  tl.call(() => { mainContent.classList.add('visible'); }, null, '-=1.4');

  tl.to(mainContent, {
    opacity: 1, duration: 0.8, ease: 'power2.out',
  }, '-=1.4');

  tl.from(heroEmoji, {
    scale: 0, rotation: -180, duration: 0.7, ease: 'elastic.out(1, 0.5)',
  }, '-=0.9');

  tl.from('.hero-title', {
    y: 40, opacity: 0, duration: 0.6, ease: 'power3.out',
  }, '-=0.5');

  // Camera hotspot animates in
  tl.from(cameraHotspot, {
    scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(1.7)',
  }, '-=0.3');

  tl.call(spawnConfetti, null, 0.7);
}

// ============================================
// CAMERA REEL
// ============================================

/** Build reel slides and dot indicators */
function buildReel() {
  CONFIG.photos.forEach((photo, i) => {
    // Slide
    const slide = document.createElement('div');
    slide.className = 'reel-slide' + (i === 0 ? ' active' : '');
    slide.innerHTML = `<img src="${photo.src}" alt="Memory ${i + 1}" />`;
    reelViewport.appendChild(slide);

    // Dot
    const dot = document.createElement('div');
    dot.className = 'reel-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(i));
    reelDotsEl.appendChild(dot);
  });

  // Set initial message and accent
  reelMessage.textContent = CONFIG.photos[0].message;
  reelViewport.dataset.accent = '0';
}

/** Open the camera reel */
function openReel() {
  if (reelOpen) return;
  reelOpen = true;
  reelIndex = 0;
  updateReelSlide(0, false);

  cameraReel.classList.add('open');

  // Animate the viewport in
  gsap.fromTo(reelViewport, {
    scale: 0.6, rotation: -8, opacity: 0,
  }, {
    scale: 1, rotation: 0, opacity: 1,
    duration: 0.6, ease: 'back.out(1.5)',
  });

  gsap.from('.reel-info', {
    y: 30, opacity: 0, duration: 0.5, delay: 0.2, ease: 'power3.out',
  });

  // Start auto-advance
  startAutoAdvance();
}

/** Close the camera reel */
function closeReel() {
  if (!reelOpen) return;
  stopAutoAdvance();

  gsap.to(reelViewport, {
    scale: 0.7, rotation: 5, opacity: 0,
    duration: 0.3, ease: 'power2.in',
    onComplete: () => {
      cameraReel.classList.remove('open');
      gsap.set(reelViewport, { scale: 1, rotation: 0, opacity: 1 });
      reelOpen = false;
    },
  });
}

/** Go to a specific slide */
function goToSlide(index) {
  if (index === reelIndex) return;
  updateReelSlide(index, true);
  reelIndex = index;
  // Reset auto-advance timer
  stopAutoAdvance();
  startAutoAdvance();
}

/** Navigate to next slide (wraps around) */
function nextSlide() {
  goToSlide((reelIndex + 1) % CONFIG.photos.length);
}

/** Navigate to previous slide (wraps around) */
function prevSlide() {
  goToSlide((reelIndex - 1 + CONFIG.photos.length) % CONFIG.photos.length);
}

/** Update the active slide, dots, message, and accent */
function updateReelSlide(newIndex, animate) {
  const slides = reelViewport.querySelectorAll('.reel-slide');
  const dotEls = reelDotsEl.querySelectorAll('.reel-dot');

  // Deactivate old
  slides.forEach(s => s.classList.remove('active'));
  dotEls.forEach(d => d.classList.remove('active'));

  // Activate new
  slides[newIndex].classList.add('active');
  dotEls[newIndex].classList.add('active');

  // Accent color
  reelViewport.dataset.accent = newIndex;

  // Message with fade
  if (animate) {
    gsap.to(reelMessage, {
      opacity: 0, y: -10, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        reelMessage.textContent = CONFIG.photos[newIndex].message;
        gsap.to(reelMessage, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      },
    });
  } else {
    reelMessage.textContent = CONFIG.photos[newIndex].message;
  }
}

/** Start auto-advance timer */
function startAutoAdvance() {
  stopAutoAdvance();
  reelAutoTimer = setInterval(nextSlide, CONFIG.reelInterval);
}

/** Stop auto-advance timer */
function stopAutoAdvance() {
  if (reelAutoTimer) {
    clearInterval(reelAutoTimer);
    reelAutoTimer = null;
  }
}

/** Init reel event listeners */
function initReelControls() {
  // Open reel when camera hotspot is tapped
  cameraHotspot.addEventListener('click', openReel);

  // Close button
  reelCloseBtn.addEventListener('click', closeReel);

  // Navigation arrows
  reelPrevBtn.addEventListener('click', prevSlide);
  reelNextBtn.addEventListener('click', nextSlide);

  // Swipe support on the viewport
  reelViewport.addEventListener('touchstart', (e) => {
    reelTouchStartX = e.touches[0].clientX;
  }, { passive: true });

  reelViewport.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - reelTouchStartX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) nextSlide();
      else        prevSlide();
    }
  }, { passive: true });

  // Keyboard support (when reel is open)
  document.addEventListener('keydown', (e) => {
    if (!reelOpen) return;
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft')  prevSlide();
    if (e.key === 'Escape')     closeReel();
  });

  // Tap on reel slide to open full photo modal
  reelViewport.addEventListener('click', () => {
    openPhotoModal(reelIndex);
  });
}

// ============================================
// PHOTO MODAL (full-size view from reel)
// ============================================

let modalOpenState = false;

function openPhotoModal(index) {
  if (modalOpenState) return;
  modalOpenState = true;

  const photo = CONFIG.photos[index];
  modalImg.src = photo.src;
  modalMessage.textContent = photo.message;

  const accentColors = ['#ff6b9d', '#fbbf24', '#c084fc', '#34d399', '#60a5fa', '#fb923c', '#f472b6'];
  modalPhotoWrap.style.outlineColor = accentColors[index % accentColors.length];

  photoModal.classList.add('visible');

  gsap.fromTo(modalPhotoWrap,
    { scale: 0.7, rotation: -5 },
    { scale: 1, rotation: 0, duration: 0.55, ease: 'elastic.out(1, 0.6)' }
  );
}

function closePhotoModal() {
  if (!modalOpenState) return;
  gsap.to(modalPhotoWrap, {
    scale: 0.8, rotation: 3, opacity: 0.5,
    duration: 0.25, ease: 'power2.in',
    onComplete: () => {
      photoModal.classList.remove('visible');
      gsap.set(modalPhotoWrap, { opacity: 1 });
      modalOpenState = false;
    },
  });
}

photoModal.addEventListener('click', (e) => {
  if (e.target === photoModal || e.target.closest('.modal-hint')) {
    closePhotoModal();
  }
});

// ============================================
// PARALLAX
// ============================================

function initParallax() {
  if (window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      document.addEventListener('touchstart', function reqPerm() {
        DeviceOrientationEvent.requestPermission()
          .then(state => { if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation); })
          .catch(console.warn);
        document.removeEventListener('touchstart', reqPerm);
      }, { once: true });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  document.addEventListener('mousemove', (e) => {
    targetTiltX = ((e.clientX / window.innerWidth) - 0.5) * 2;
    targetTiltY = ((e.clientY / window.innerHeight) - 0.5) * 2;
  });
}

function handleOrientation(e) {
  targetTiltX = Math.max(-1, Math.min(1, (e.gamma || 0) / 45));
  targetTiltY = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 45));
}

// ============================================
// CONFETTI
// ============================================

function spawnConfetti() {
  const colors = ['#ff6b9d', '#c084fc', '#fbbf24', '#34d399', '#60a5fa', '#fb923c', '#f472b6', '#a78bfa'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    const size = 6 + Math.random() * 8;
    el.style.width  = size + 'px';
    el.style.height = size * (0.5 + Math.random() * 0.8) + 'px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = '50%';
    el.style.top  = '45%';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 200 + Math.random() * 350;
    gsap.to(el, {
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity - 150,
      rotation: Math.random() * 720 - 360,
      opacity: 0,
      duration: 1.5 + Math.random() * 1,
      ease: 'power2.out',
      onComplete: () => el.remove(),
    });
  }
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
  heroNameEl.textContent = CONFIG.birthdayName;

  // Build the camera reel slides
  buildReel();

  // Init controls
  initKeypad();
  initReelControls();

  // Three.js
  initThreeScene();
  animate();

  // Parallax
  initParallax();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
