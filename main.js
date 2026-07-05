/* ==========================================================================
   Kiwibytes Spatial Universe - Next-Gen Interactive Core Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 1. Setup Cosmic Canvas Coordinates & Camera Map
  // ==========================================================================
  const canvasContainer = document.getElementById('canvas-container');
  const coordTicker = document.getElementById('coord-ticker');
  
  // Camera state
  const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    vx: 0,
    vy: 0,
    isDragging: false,
    startX: 0,
    startY: 0
  };

  // Sector centers mapped in relative coordinates (offsets from center 0,0)
  const SECTORS = {
    'home-portal': { x: 0, y: 0 },
    'services-nebula': { x: 900, y: -700 },
    'products-cluster': { x: 1100, y: 700 },
    'process-map': { x: -900, y: 700 },
    'project-builder-console': { x: -1000, y: -700 }
  };

  // Audio Engine Variables declared at top to avoid Temporal Dead Zone ReferenceError
  let audioCtx = null;
  let masterGain = null;
  let windGain = null;
  let windFilter = null;
  let currentWindGain = 0;
  let chordInterval = null;
  let chordIndex = 0;
  let isAudioMuted = false;

  let lastCameraX = 0;
  let lastCameraY = 0;

  // Update canvas placement using CSS transform
  const updateCanvasTransform = () => {
    // Damp camera position towards targets for smooth vector motion
    camera.x += (camera.targetX - camera.x) * 0.1;
    camera.y += (camera.targetY - camera.y) * 0.1;
    
    // Apply transform centered
    canvasContainer.style.transform = `translate(calc(-50% - ${camera.x}px), calc(-50% - ${camera.y}px))`;
    
    // Update live coordinate ticker
    coordTicker.textContent = `X: ${Math.round(camera.x)} Y: ${Math.round(-camera.y)}`;
    
    // Modulate moving wind sound based on camera travel velocity
    if (audioCtx && audioCtx.state === 'running' && windGain && windFilter) {
      const speedX = camera.x - lastCameraX;
      const speedY = camera.y - lastCameraY;
      const speed = Math.hypot(speedX, speedY);
      
      const targetWindGain = Math.min(speed * 0.035, 0.38);
      currentWindGain += (targetWindGain - currentWindGain) * 0.15;
      
      // Use setTargetAtTime to prevent audio zipper crackle/clicks
      windGain.gain.setTargetAtTime(currentWindGain, audioCtx.currentTime, 0.04);
      
      // Dynamic whoosh lowpass sweep smoothed exponentially to prevent clicks
      const targetFreq = 180 + Math.min(speed * 20, 600);
      windFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.04);
    }
    
    lastCameraX = camera.x;
    lastCameraY = camera.y;
    
    // Request animation tick
    requestAnimationFrame(updateCanvasTransform);
  };
  
  // Initialize loop
  updateCanvasTransform();

  // ==========================================================================
  // 2. Drag to Pan & Inertia Momentum Engine
  // ==========================================================================
  let isPointerDown = false;
  let dragLastX = 0;
  let dragLastY = 0;

  const onPointerDown = (e) => {
    // Ignore events on interactive components (buttons, inputs, cards)
    if (e.target.closest('.spatial-card, .terminal-container, button, input, a')) return;
    
    isPointerDown = true;
    dragLastX = e.clientX || (e.touches && e.touches[0].clientX);
    dragLastY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Set target to current coordinate to stop any active teleports instantly
    camera.targetX = camera.x;
    camera.targetY = camera.y;
    
    playAudioClick(350, 0.05); // Play deep grip click
  };

  const onPointerMove = (e) => {
    if (!isPointerDown) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const dx = clientX - dragLastX;
    const dy = clientY - dragLastY;
    
    // Translate camera targets (inverting coordinates)
    camera.targetX -= dx;
    camera.targetY -= dy;
    
    // Keep current coordinate matching target for instant slide response
    camera.x = camera.targetX;
    camera.y = camera.targetY;
    
    dragLastX = clientX;
    dragLastY = clientY;
  };

  const onPointerUp = () => {
    isPointerDown = false;
  };

  // Bind mouse and touch events
  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  
  window.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Wheel Panning
  window.addEventListener('wheel', (e) => {
    // Stop event propagating if scrolling in terminal form to avoid canvas shift
    if (e.target.closest('.terminal-body')) return;
    
    // Accumulate zoom/pan offsets
    camera.targetX += e.deltaX * 0.8;
    camera.targetY += e.deltaY * 0.8;
  }, { passive: true });


  // ==========================================================================
  // 3. Web Audio Synthesizer Engine (Sci-Fi click feedback & ambient drone)
  // ==========================================================================
  const audioBtn = document.getElementById('hud-audio-btn');
  const audioOnIcon = audioBtn.querySelector('.audio-on');
  const audioOffIcon = audioBtn.querySelector('.audio-off');
  const audioStatusLabel = audioBtn.querySelector('.audio-status-label');
  const soundtrack = document.getElementById('bg-soundtrack');

  const initAudioEngine = () => {
    if (audioCtx) return;
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.95, audioCtx.currentTime); // Boosted master volume limit
    masterGain.connect(audioCtx.destination);
    
    // A. Synthesize moving air sound (White Noise + lowpass filter whoosh)
    const bufferSize = audioCtx.sampleRate * 6; // 6 seconds buffer removes repetitive loop-restart clicks
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;
    
    windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(180, audioCtx.currentTime);
    
    windGain = audioCtx.createGain();
    windGain.gain.setValueAtTime(0, audioCtx.currentTime);
    
    noiseNode.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    
    noiseNode.start();
    
    // B. Synthesize background musical tone pad loop (slow sweeping warm minor chords)
    const playSpacePad = () => {
      if (!audioCtx || audioCtx.state === 'suspended') return;
      
      const chords = [
        [130.81, 164.81, 196.00, 246.94, 293.66], // C3, E3, G3, B3, D4 (Cmaj9)
        [110.00, 146.83, 174.61, 220.00, 261.63], // A2, D3, F3, A3, C4 (Amin9)
        [87.31, 130.81, 174.61, 220.00, 261.63],  // F2, C3, F3, A3, C4 (Fmaj9)
        [98.00, 146.83, 196.00, 220.00, 293.66]   // G2, D3, G3, A3, D4 (G11)
      ];
      
      const activeChord = chords[chordIndex % chords.length];
      chordIndex++;
      
      activeChord.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        // Stagger note triggers for a beautiful spatial glide
        const attackStart = audioCtx.currentTime + (idx * 0.06);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.05, attackStart + 1.2); // Boosted musical note volume
        gainNode.gain.setValueAtTime(0.05, attackStart + 2.5);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, attackStart + 4.5); // Fading pad tail
        
        osc.connect(gainNode);
        gainNode.connect(masterGain);
        
        osc.start(attackStart);
        osc.stop(attackStart + 4.5);
      });
    };
    
    // Play first chord instantly and loop every 4.8 seconds
    playSpacePad();
    chordInterval = setInterval(playSpacePad, 4800);

    // C. Start external background ambient music track
    if (soundtrack) {
      soundtrack.volume = 0.45; // Clear audible level
      soundtrack.play().catch(err => console.log("Soundtrack play deferred:", err));
    }
  };

  const playAudioClick = (freq = 800, duration = 0.15) => {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Boosted click volume level for distinct feedback
    gainNode.gain.setValueAtTime(0.85, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(masterGain);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Toggle Audio Engine status
  audioBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent triggering autoPlayAudio window click!
    
    if (!audioCtx) {
      // First click: since audio is ON by default, clicking "AUDIO OFF" turns it OFF (suspends context)
      initAudioEngine();
      audioCtx.suspend();
      isAudioMuted = true;
      if (soundtrack) soundtrack.pause();
      audioOnIcon.classList.remove('hidden');
      audioOffIcon.classList.add('hidden');
      audioStatusLabel.textContent = 'AUDIO ON';
    } else {
      if (audioCtx.state === 'running') {
        audioCtx.suspend();
        isAudioMuted = true;
        if (soundtrack) soundtrack.pause();
        audioOnIcon.classList.remove('hidden');
        audioOffIcon.classList.add('hidden');
        audioStatusLabel.textContent = 'AUDIO ON';
      } else {
        audioCtx.resume();
        isAudioMuted = false;
        if (soundtrack) soundtrack.play().catch(err => console.log(err));
        audioOnIcon.classList.add('hidden');
        audioOffIcon.classList.remove('hidden');
        audioStatusLabel.textContent = 'AUDIO OFF';
        playAudioClick(600, 0.15);
      }
    }
  });

  // Autoplay compliance helper: initialize audio engine on first user interaction
  const autoPlayAudio = () => {
    if (isAudioMuted) return;
    if (!audioCtx) {
      initAudioEngine();
      // Keep the button label as "AUDIO OFF" (default action indicator)
      audioOnIcon.classList.add('hidden');
      audioOffIcon.classList.remove('hidden');
      audioStatusLabel.textContent = 'AUDIO OFF';
    }
    // Clean up autoplay triggers
    window.removeEventListener('click', autoPlayAudio);
    window.removeEventListener('keydown', autoPlayAudio);
    window.removeEventListener('wheel', autoPlayAudio);
    window.removeEventListener('touchstart', autoPlayAudio);
  };

  window.addEventListener('click', autoPlayAudio);
  window.addEventListener('keydown', autoPlayAudio);
  window.addEventListener('wheel', autoPlayAudio, { passive: true });
  window.addEventListener('touchstart', autoPlayAudio, { passive: true });


  // ==========================================================================
  // 4. Heads-Up Display Fast Travel system
  // ==========================================================================
  const navItems = document.querySelectorAll('.hud-nav-item');

  const focusSector = (targetId) => {
    const coords = SECTORS[targetId];
    if (!coords) return;
    
    camera.targetX = coords.x;
    camera.targetY = coords.y;
    
    // Highlight sidebar active item
    navItems.forEach(item => {
      if (item.getAttribute('data-target') === targetId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      focusSector(targetId);
    });
  });

  // Automatically check which sector is closest to active viewport (HUD nav sync)
  setInterval(() => {
    if (isPointerDown) return; // Don't snap highlights while dragging
    
    let closestSector = 'home-portal';
    let minDistance = Infinity;
    
    Object.keys(SECTORS).forEach(key => {
      const coords = SECTORS[key];
      const dist = Math.hypot(camera.x - coords.x, camera.y - coords.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestSector = key;
      }
    });
    
    navItems.forEach(item => {
      if (item.getAttribute('data-target') === closestSector) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }, 1000);


  // ==========================================================================
  // 5. Dynamic Radar Minimap Display
  // ==========================================================================
  const radarCanvas = document.getElementById('radar-canvas');
  const radarCtx = radarCanvas.getContext('2d');
  
  const drawRadar = () => {
    radarCtx.clearRect(0, 0, 140, 140);
    
    const center = 70;
    const scale = 0.045; // Scale down coordinates to fit 140px radar
    
    // A. Draw radar grids circles
    radarCtx.strokeStyle = 'rgba(160, 133, 86, 0.08)';
    radarCtx.lineWidth = 1;
    
    radarCtx.beginPath();
    radarCtx.arc(center, center, 60, 0, Math.PI * 2);
    radarCtx.stroke();
    
    radarCtx.beginPath();
    radarCtx.arc(center, center, 35, 0, Math.PI * 2);
    radarCtx.stroke();
    
    // Radar sweeping line (visual effect)
    const angle = (Date.now() / 1200) % (Math.PI * 2);
    radarCtx.strokeStyle = 'rgba(116, 201, 21, 0.06)';
    radarCtx.beginPath();
    radarCtx.moveTo(center, center);
    radarCtx.lineTo(center + Math.cos(angle) * 60, center + Math.sin(angle) * 60);
    radarCtx.stroke();
    
    // B. Draw sector nodes
    Object.keys(SECTORS).forEach(key => {
      const node = SECTORS[key];
      const rx = center + node.x * scale;
      const ry = center + node.y * scale;
      
      // Node indicator point
      radarCtx.fillStyle = key === 'home-portal' ? '#74c915' : '#A08556';
      radarCtx.beginPath();
      radarCtx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      radarCtx.fill();
      
      // Ring pulse around home portal
      if (key === 'home-portal') {
        radarCtx.strokeStyle = 'rgba(116, 201, 21, 0.25)';
        radarCtx.beginPath();
        radarCtx.arc(rx, ry, 6 + Math.sin(Date.now() / 300) * 2, 0, Math.PI * 2);
        radarCtx.stroke();
      }
    });
    
    // C. Draw current camera viewport boundaries frame on radar
    const cx = center + camera.x * scale;
    const cy = center + camera.y * scale;
    const viewWidth = window.innerWidth * scale * 0.6;
    const viewHeight = window.innerHeight * scale * 0.6;
    
    radarCtx.strokeStyle = 'rgba(116, 201, 21, 0.55)';
    radarCtx.lineWidth = 1.2;
    radarCtx.strokeRect(cx - viewWidth / 2, cy - viewHeight / 2, viewWidth, viewHeight);
    
    // Loop animation
    requestAnimationFrame(drawRadar);
  };
  
  // Start radar ticks
  drawRadar();

  // Radar Minimap click-to-teleport telemetry
  radarCanvas.addEventListener('click', (e) => {
    const rect = radarCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const center = 70;
    const scale = 0.045;
    
    // Translate click back to real coordinates space targets
    const targetX = (clickX - center) / scale;
    const targetY = (clickY - center) / scale;
    
    camera.targetX = targetX;
    camera.targetY = targetY;
  });


  // ==========================================================================
  // 6. Interactive Spotlight Hover & 3D Tilt cards
  // ==========================================================================
  const cards = document.querySelectorAll('.spatial-card');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      
      // Perform 3D card tilt
      if (window.innerWidth > 900) {
        const width = rect.width;
        const height = rect.height;
        const centerX = rect.left + width / 2;
        const centerY = rect.top + height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        const rotateX = (-mouseY / (height / 2)) * 5; // max 5 degrees
        const rotateY = (mouseX / (width / 2)) * 5;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
      }
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
    
    card.addEventListener('mouseenter', () => {
      playAudioClick(650, 0.04);
    });
  });


  // ==========================================================================
  // 7. Ambient Particle network Background logic (Cosmic particles)
  // ==========================================================================
  const bgCanvas = document.getElementById('galaxy-bg-particles');
  const bgCtx = bgCanvas.getContext('2d');
  
  let bgWidth = (bgCanvas.width = window.innerWidth);
  let bgHeight = (bgCanvas.height = window.innerHeight);
  
  window.addEventListener('resize', () => {
    bgWidth = bgCanvas.width = window.innerWidth;
    bgHeight = bgCanvas.height = window.innerHeight;
  });

  const bgParticles = [];
  const maxBgParticles = 80;

  class CosmicParticle {
    constructor() {
      this.x = Math.random() * bgWidth;
      this.y = Math.random() * bgHeight;
      this.vx = (Math.random() - 0.5) * 0.2;
      this.vy = (Math.random() - 0.5) * 0.2;
      this.radius = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.1;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      // Loop coordinates boundaries
      if (this.x < 0) this.x = bgWidth;
      if (this.x > bgWidth) this.x = 0;
      if (this.y < 0) this.y = bgHeight;
      if (this.y > bgHeight) this.y = 0;
    }
    
    draw() {
      bgCtx.beginPath();
      bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(160, 133, 86, ${this.alpha})`;
      bgCtx.fill();
    }
  }

  for (let i = 0; i < maxBgParticles; i++) {
    bgParticles.push(new CosmicParticle());
  }

  const loopBgParticles = () => {
    bgCtx.clearRect(0, 0, bgWidth, bgHeight);
    
    bgParticles.forEach(p => {
      p.update();
      p.draw();
    });
    
    requestAnimationFrame(loopBgParticles);
  };
  
  loopBgParticles();


  // ==========================================================================
  // 8. Process roadmap Horizontal active timeline track activation
  // ==========================================================================
  const stepWrappers = document.querySelectorAll('.process-step-card-wrapper');
  const activeTimelineTrail = document.getElementById('active-timeline-trail');

  const checkRoadmapIntersection = () => {
    const coords = SECTORS['process-map'];
    const dist = Math.hypot(camera.x - coords.x, camera.y - coords.y);
    
    if (dist < 450) {
      if (activeTimelineTrail) activeTimelineTrail.style.width = '100%';
      
      stepWrappers.forEach((wrapper, index) => {
        setTimeout(() => {
          wrapper.classList.add('active');
        }, index * 200);
      });
    } else {
      if (activeTimelineTrail) activeTimelineTrail.style.width = '0%';
      stepWrappers.forEach(wrapper => wrapper.classList.remove('active'));
    }
  };
  
  // Continuously check sector distance
  setInterval(checkRoadmapIntersection, 500);


  // ==========================================================================
  // 9. Interactive Project Calculator & Form Steps
  // ==========================================================================
  const termForm = document.getElementById('project-builder-form');
  const budgetSlider = document.getElementById('budget-range');
  const budgetValSpan = document.getElementById('budget-val');
  
  const hudMVP = document.getElementById('hud-mvp');
  const hudPRO = document.getElementById('hud-pro');
  const hudENT = document.getElementById('hud-enterprise');

  // Budget slider update
  budgetSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    budgetValSpan.textContent = val.toLocaleString();
    
    // Toggle active HUD recommendations card
    hudMVP.classList.remove('active');
    hudPRO.classList.remove('active');
    hudENT.classList.remove('active');
    
    if (val < 25000) {
      hudMVP.classList.add('active');
    } else if (val >= 25000 && val < 75000) {
      hudPRO.classList.add('active');
    } else {
      hudENT.classList.add('active');
    }
    
    playAudioClick(400 + val/250, 0.03); // Modulate pitch with budget!
  });

  // Step logic navigation
  const termSteps = termForm.querySelectorAll('.terminal-step');
  const nextButtons = termForm.querySelectorAll('.next-step');
  const backButtons = termForm.querySelectorAll('.back-step');

  const switchTerminalStep = (currentStep, nextStep) => {
    const currentEl = termForm.querySelector(`.terminal-step[data-step="${currentStep}"]`);
    const nextEl = termForm.querySelector(`.terminal-step[data-step="${nextStep}"]`);
    
    if (currentEl && nextEl) {
      currentEl.classList.remove('active');
      nextEl.classList.add('active');
      playAudioClick(820, 0.08);
    }
  };

  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const stepContainer = btn.closest('.terminal-step');
      const step = parseInt(stepContainer.getAttribute('data-step'), 10);
      
      // Simple validation checks
      if (step === 1) {
        const input = document.getElementById('project-name');
        const err = document.getElementById('err-step-1');
        if (!input.value.trim()) {
          err.style.display = 'block';
          playAudioClick(300, 0.15); // play error buzz
          return;
        } else {
          err.style.display = 'none';
        }
      }
      
      switchTerminalStep(step, step + 1);
    });
  });

  backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const stepContainer = btn.closest('.terminal-step');
      const step = parseInt(stepContainer.getAttribute('data-step'), 10);
      switchTerminalStep(step, step - 1);
    });
  });

  // Form submit (final handshake)
  termForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('user-email');
    const err = document.getElementById('err-step-3');
    
    if (!emailInput.value.trim() || !emailInput.checkValidity()) {
      err.style.display = 'block';
      playAudioClick(300, 0.15); // error sound
      return;
    }
    
    err.style.display = 'none';
    
    // Display security email in success step
    document.getElementById('success-email').textContent = emailInput.value;
    
    switchTerminalStep(3, 4);
    
    // Play sci-fi victory handshake tone
    playAudioClick(650, 0.1);
    setTimeout(() => playAudioClick(850, 0.1), 100);
    setTimeout(() => playAudioClick(1050, 0.2), 200);
  });

  // Reset form
  const restartBtn = termForm.querySelector('.restart-form');
  restartBtn.addEventListener('click', () => {
    termForm.reset();
    budgetValSpan.textContent = '45,000';
    hudMVP.classList.remove('active');
    hudPRO.classList.add('active');
    hudENT.classList.remove('active');
    
    switchTerminalStep(4, 1);
  });

});
