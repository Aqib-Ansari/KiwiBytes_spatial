/* ==========================================================================
   Kiwibytes Interactive Webpage Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. Mobile Navigation Menu Toggle
  // ==========================================
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (menuToggle && mobileOverlay) {
    menuToggle.addEventListener('click', () => {
      const isActive = menuToggle.classList.toggle('active');
      mobileOverlay.classList.toggle('active', isActive);
      document.body.style.overflow = isActive ? 'hidden' : '';
    });

    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Header border transition on scroll
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // ==========================================
  // 2. High-Performance Canvas Scroll Animation
  // ==========================================
  const canvas = document.getElementById('scroll-canvas');
  const context = canvas?.getContext('2d');
  const canvasLoader = document.getElementById('canvas-loader');
  const loadPct = document.getElementById('load-pct');
  const dynamicLabel = document.getElementById('canvas-dynamic-label');
  const showcaseSection = document.querySelector('.scroll-showcase');
  const serviceCards = document.querySelectorAll('.service-card');

  const frameCount = 300;
  const images = [];
  let loadedCount = 0;
  let hasLoadedAll = false;
  let latestFrameIndex = -1;

  // Frame details mapping (for labels)
  const serviceLabels = [
    { start: 0, end: 49, label: "01 // Web Engineering Scaffold" },
    { start: 50, end: 99, label: "02 // Mobile Architecture Render" },
    { start: 100, end: 149, label: "03 // Neural Network Integrator" },
    { start: 150, end: 199, label: "04 // Autonomous Agent Subsystem" },
    { start: 200, end: 249, label: "05 // High-Scale Cloud Topology" },
    { start: 250, end: 299, label: "06 // Shopify Conversions Engine" }
  ];

  // Helper to format frame path
  const getFramePath = (index) => {
    const formattedNum = String(index).padStart(3, '0');
    return `imagestobescrolled/ezgif-frame-${formattedNum}.jpg`;
  };

  // Preload all frames
  const preloadImages = () => {
    if (!canvas) return;

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / frameCount) * 100);
        if (loadPct) loadPct.textContent = `${percent}%`;

        if (loadedCount === frameCount) {
          hasLoadedAll = true;
          // Hide loader with a subtle transition
          if (canvasLoader) {
            canvasLoader.style.opacity = '0';
            setTimeout(() => {
              canvasLoader.style.display = 'none';
            }, 400);
          }
          // Initial draw
          handleScrollAnimation();
        }
      };
      img.onerror = () => {
        console.error(`Failed to load image frame: ${getFramePath(i)}`);
        // Continue loader progression even if a frame fails so the site doesn't lock up
        loadedCount++;
      };
      images.push(img);
    }
  };

  // Ultra-sharp canvas draw with center-cover cropping
  const drawFrame = (index) => {
    const img = images[index];
    if (!img || !context || !canvas) return;

    // Handle high DPI scaling (Retina screens)
    const dpi = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpi;
    canvas.height = canvas.clientHeight * dpi;
    context.scale(dpi, dpi);

    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // Cover cropping calculations
    const canvasAspect = canvas.clientWidth / canvas.clientHeight;
    const imgAspect = img.width / img.height;
    let drawWidth, drawHeight, x, y;

    if (canvasAspect > imgAspect) {
      drawWidth = canvas.clientWidth;
      drawHeight = canvas.clientWidth / imgAspect;
      x = 0;
      y = (canvas.clientHeight - drawHeight) / 2;
    } else {
      drawWidth = canvas.clientHeight * imgAspect;
      drawHeight = canvas.clientHeight;
      x = (canvas.clientWidth - drawWidth) / 2;
      y = 0;
    }

    context.drawImage(img, x, y, drawWidth, drawHeight);
    latestFrameIndex = index;
  };

  // Scroll mapping logic throttled with requestAnimationFrame
  let rAFScheduled = false;

  const handleScrollAnimation = () => {
    if (!showcaseSection || !hasLoadedAll) return;

    const rect = showcaseSection.getBoundingClientRect();
    const viewHeight = window.innerHeight;
    const scrollableHeight = rect.height - viewHeight;

    // Calculate progress as the section passes through the top of the viewport
    const scrolled = -rect.top;
    let progress = scrolled / scrollableHeight;
    progress = Math.max(0, Math.min(1, progress)); // Clamp between 0.0 and 1.0

    const frameIndex = Math.floor(progress * (frameCount - 1));

    if (frameIndex !== latestFrameIndex) {
      drawFrame(frameIndex);
      updateActiveCardAndLabel(frameIndex);
    }
  };

  const updateActiveCardAndLabel = (frameIndex) => {
    // 1. Update text label below canvas
    const matchingLabel = serviceLabels.find(
      range => frameIndex >= range.start && frameIndex <= range.end
    );
    if (matchingLabel && dynamicLabel) {
      dynamicLabel.textContent = matchingLabel.label;
    }

    // 2. Highlight service card on the right
    serviceCards.forEach((card, index) => {
      const start = parseInt(card.getAttribute('data-frame-start'), 10);
      const end = parseInt(card.getAttribute('data-frame-end'), 10);

      if (frameIndex >= start && frameIndex <= end) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  };

  // Bind scroll event using requestAnimationFrame for perfect performance
  window.addEventListener('scroll', () => {
    if (!rAFScheduled) {
      rAFScheduled = true;
      requestAnimationFrame(() => {
        handleScrollAnimation();
        rAFScheduled = false;
      });
    }
  });

  // Handle window resizing
  window.addEventListener('resize', () => {
    if (hasLoadedAll && latestFrameIndex !== -1) {
      drawFrame(latestFrameIndex);
    }
  });

  // Initialize image preloading
  preloadImages();


  // ==========================================
  // 3. Interactive Multi-Step Project Builder Wizard
  // ==========================================
  const modal = document.getElementById('project-builder-modal');
  const triggers = document.querySelectorAll('.trigger-project-builder');
  const closeBtn = document.querySelector('.modal-close');
  const closeSuccessBtn = document.querySelector('.close-modal-btn');
  const form = document.getElementById('project-builder-form');
  const steps = document.querySelectorAll('.modal-step-content');

  const progressBar = document.getElementById('modal-progress-bar');
  const stepIndicator = document.getElementById('step-indicator');
  const stepTitle = document.getElementById('modal-step-title');
  const stepSubtitle = document.getElementById('modal-step-subtitle');
  const step1ValidationMsg = document.getElementById('step1-validation');

  const budgetRange = document.getElementById('budget-range');
  const budgetValueText = document.getElementById('budget-value');
  const successEmailPlaceholder = document.getElementById('success-email-placeholder');

  const nextBtn = document.querySelector('.modal-next');
  const nextBtnText = document.getElementById('next-btn-text');
  const backBtn = document.querySelector('.modal-back');
  const actionsBar = document.getElementById('modal-actions-bar');

  let currentStep = 1;

  // Step headers configuration
  const stepMeta = {
    1: {
      title: "What are we building?",
      subtitle: "Select all services you require for this project."
    },
    2: {
      title: "What is your estimated scope & budget?",
      subtitle: "Use the slider and options to outline project boundaries."
    },
    3: {
      title: "Tell us about you.",
      subtitle: "Enter your contact details so our design architects can reach out."
    },
    4: {
      title: "", // Blank for success step header
      subtitle: ""
    }
  };

  // Open modal
  const openModal = () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    resetModal();
  };

  // Close modal
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  triggers.forEach(trigger => trigger.addEventListener('click', openModal));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeModal);

  // Close modal if clicked on backdrop overlay
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Update budget slider value on change
  if (budgetRange && budgetValueText) {
    budgetRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val >= 100000) {
        budgetValueText.textContent = "$100,000+";
      } else {
        budgetValueText.textContent = `$${val.toLocaleString()}`;
      }
    });
  }

  // Handle Wizard Steps Navigation
  const updateStepView = () => {
    // 1. Toggle visibility of steps
    steps.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'), 10);
      step.classList.toggle('active', stepNum === currentStep);
    });

    // 2. Hide/Show Header context based on step 4 (Success Screen)
    if (currentStep === 4) {
      if (progressBar) progressBar.parentElement.style.display = 'none';
      if (stepIndicator) stepIndicator.style.display = 'none';
      if (stepTitle) stepTitle.style.display = 'none';
      if (stepSubtitle) stepSubtitle.style.display = 'none';
      if (actionsBar) actionsBar.style.display = 'none';
      return;
    } else {
      if (progressBar) progressBar.parentElement.style.display = 'block';
      if (stepIndicator) stepIndicator.style.display = 'block';
      if (stepTitle) stepTitle.style.display = 'block';
      if (stepSubtitle) stepSubtitle.style.display = 'block';
      if (actionsBar) actionsBar.style.display = 'flex';
    }

    // 3. Update Text Content
    if (stepIndicator) stepIndicator.textContent = `Step ${currentStep} of 3`;
    if (stepTitle && stepMeta[currentStep]) stepTitle.textContent = stepMeta[currentStep].title;
    if (stepSubtitle && stepMeta[currentStep]) stepSubtitle.textContent = stepMeta[currentStep].subtitle;

    // 4. Update Progress Bar width
    if (progressBar) {
      const widthPct = ((currentStep - 1) / 3) * 100 + 10;
      progressBar.style.width = `${Math.min(100, widthPct)}%`;
    }

    // 5. Action Buttons Logic
    if (backBtn) {
      backBtn.disabled = currentStep === 1;
    }
    if (nextBtnText) {
      nextBtnText.textContent = currentStep === 3 ? "Submit Blueprint" : "Continue";
    }
  };

  // Form Validation per step
  const validateStep = (step) => {
    if (step === 1) {
      const selectedServices = form.querySelectorAll('input[name="services"]:checked');
      const isValid = selectedServices.length > 0;
      if (step1ValidationMsg) {
        step1ValidationMsg.style.display = isValid ? 'none' : 'block';
      }
      return isValid;
    }

    if (step === 3) {
      let isStepValid = true;
      const nameInput = document.getElementById('client-name');
      const emailInput = document.getElementById('client-email');

      // Name validation
      if (nameInput) {
        const parent = nameInput.parentElement;
        if (!nameInput.value.trim()) {
          parent.classList.add('invalid');
          isStepValid = false;
        } else {
          parent.classList.remove('invalid');
        }
      }

      // Email validation
      if (emailInput) {
        const parent = emailInput.parentElement;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
          parent.classList.add('invalid');
          isStepValid = false;
        } else {
          parent.classList.remove('invalid');
        }
      }

      return isStepValid;
    }

    return true; // Step 2 has range and radio which are always valid
  };

  // Form field listener to remove validation error indicators on typing
  const formInputs = form?.querySelectorAll('input[required]');
  formInputs?.forEach(input => {
    input.addEventListener('input', () => {
      if (input.value.trim()) {
        input.parentElement.classList.remove('invalid');
      }
    });
  });

  // Action button clicks
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        if (currentStep < 3) {
          currentStep++;
          updateStepView();
        } else {
          // Submit action
          const emailInput = document.getElementById('client-email');
          if (successEmailPlaceholder && emailInput) {
            successEmailPlaceholder.textContent = emailInput.value;
          }
          currentStep = 4;
          updateStepView();
        }
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepView();
      }
    });
  }

  const resetModal = () => {
    currentStep = 1;
    form.reset();

    // Clear validation outlines
    const fields = form.querySelectorAll('.form-field');
    fields.forEach(f => f.classList.remove('invalid'));
    if (step1ValidationMsg) step1ValidationMsg.style.display = 'none';

    // Reset range text
    if (budgetValueText) budgetValueText.textContent = "$15,000";

    updateStepView();
  };

  // ==========================================
  // 4. Page Loader Curtain
  // ==========================================
  const pageLoader = document.querySelector('.page-loader');
  const loaderBar = document.querySelector('.loader-progress-bar');

  if (pageLoader && loaderBar) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 18;
      if (progress >= 90) {
        progress = 90;
        clearInterval(interval);
      }
      loaderBar.style.width = `${progress}%`;
    }, 80);

    window.addEventListener('load', () => {
      clearInterval(interval);
      loaderBar.style.width = '100%';
      setTimeout(() => {
        pageLoader.classList.add('fade-out');
        document.body.classList.add('loaded');
      }, 350);
    });

    // Fallback loader clearance
    setTimeout(() => {
      clearInterval(interval);
      loaderBar.style.width = '100%';
      setTimeout(() => {
        pageLoader.classList.add('fade-out');
      }, 150);
    }, 2500);
  }

  // ==========================================
  // 5. Scroll Reveal & Counter Animation System
  // ==========================================
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const processGrid = document.querySelector('.process-grid');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');

        // Handle staggered loading for lists / grid items inside viewport
        const siblings = entry.target.parentElement.querySelectorAll('.reveal-on-scroll');
        const visibleSiblings = Array.from(siblings).filter(el => el.classList.contains('revealed'));
        const index = visibleSiblings.indexOf(entry.target);
        if (index > 0) {
          entry.target.style.transitionDelay = `${index * 0.12}s`;
        }

        // Process grid connector activation
        if (entry.target.classList.contains('process-step') && processGrid) {
          processGrid.classList.add('revealed');
        }

        // Trigger Counter elements inside revealed container
        const counters = entry.target.querySelectorAll('.stat-num');
        counters.forEach(counter => animateCounter(counter));

        // If the element itself is a counter, animate it directly
        if (entry.target.classList.contains('stat-num')) {
          animateCounter(entry.target);
        }

        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach((el) => {
    revealObserver.observe(el);
  });

  // Support direct observation of stats as well
  const statsList = document.querySelectorAll('.stat-num');
  statsList.forEach(stat => {
    revealObserver.observe(stat);
  });

  function animateCounter(counterEl) {
    if (counterEl.dataset.animated) return;
    counterEl.dataset.animated = 'true';

    const rawText = counterEl.textContent.trim();
    const numericPart = parseFloat(rawText.replace(/[^0-9.]/g, ''));
    const isFloat = rawText.includes('.');
    const suffix = rawText.replace(/[0-9.]/g, '');
    const prefix = rawText.startsWith('$') ? '$' : '';

    let current = 0;
    const duration = 1600;
    const start = performance.now();

    function update(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // Ease out
      const val = easeProgress * numericPart;

      if (isFloat) {
        counterEl.textContent = prefix + val.toFixed(1) + suffix;
      } else {
        counterEl.textContent = prefix + Math.floor(val) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counterEl.textContent = rawText;
      }
    }

    requestAnimationFrame(update);
  }

  // ==========================================
  // 6. Interactive Spotlight Hover & 3D Tilt
  // ==========================================
  const interactiveCards = document.querySelectorAll('.service-card, .product-card, .process-step');

  interactiveCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      if (window.innerWidth > 900) {
        const width = rect.width;
        const height = rect.height;
        const centerX = rect.left + width / 2;
        const centerY = rect.top + height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        const rotateX = (-mouseY / (height / 2)) * 6; // max 6 deg
        const rotateY = (mouseX / (width / 2)) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });



  // ==========================================
  // 8. Navigation Scroll Spy (Active Pill Highlight)
  // ==========================================
  const navSections = [
    { id: 'hero-section', link: null },
    { id: 'services-anchor', link: document.querySelector('a[href="#services-anchor"]') },
    { id: 'products-anchor', link: document.querySelector('a[href="#products-anchor"]') },
    { id: 'process-anchor', link: document.querySelector('a[href="#process-anchor"]') },
    { id: 'contact-anchor', link: document.querySelector('a[href="#contact-anchor"]') }
  ];

  window.addEventListener('scroll', () => {
    let currentActive = null;
    const scrollPos = window.scrollY + 180;

    navSections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentActive = sec;
        }
      }
    });

    if (window.scrollY < 120) {
      currentActive = navSections[0];
    }

    navSections.forEach(sec => {
      if (sec.link) {
        if (currentActive && sec.id === currentActive.id) {
          sec.link.classList.add('active');
        } else {
          sec.link.classList.remove('active');
        }
      }
    });
  });

  // ==========================================
  // 9. Staggered Typography Character Entrance
  // ==========================================
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const contents = Array.from(heroTitle.childNodes);
    heroTitle.innerHTML = '';
    let charIndex = 0;

    contents.forEach((node, nodeIdx) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent.replace(/\s+/g, ' ');
        if (nodeIdx === 0) text = text.trimStart();
        if (nodeIdx === contents.length - 1) text = text.trimEnd();

        if (text === '' || text === ' ') return;

        const chars = text.split('');
        chars.forEach(char => {
          const span = document.createElement('span');
          span.className = 'char';
          if (char === ' ') {
            span.innerHTML = '&nbsp;';
          } else {
            span.textContent = char;
            span.style.transitionDelay = `${charIndex * 0.015}s`;
            charIndex++;
          }
          heroTitle.appendChild(span);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('gradient-text')) {
        const wrapper = document.createElement('span');
        wrapper.className = 'gradient-text';
        wrapper.textContent = node.textContent;
        // Delay it right after the characters before it
        wrapper.style.transitionDelay = `${charIndex * 0.015}s`;
        charIndex += node.textContent.length;
        heroTitle.appendChild(wrapper);
      }
    });

    const triggerReveal = () => {
      setTimeout(() => {
        heroTitle.classList.add('revealed-chars');
      }, 550);
    };

    if (document.readyState === 'complete') {
      triggerReveal();
    } else {
      window.addEventListener('load', triggerReveal);
    }
  }

  // ==========================================
  // 10. Interactive Background Canvas Network
  // ==========================================
  const heroCanvas = document.getElementById('hero-canvas');
  const heroSec = document.getElementById('hero-section');

  if (heroCanvas && heroSec) {
    const ctx = heroCanvas.getContext('2d');
    let width = (heroCanvas.width = heroSec.offsetWidth);
    let height = (heroCanvas.height = heroSec.offsetHeight);

    let particles = [];
    const maxParticles = window.innerWidth < 768 ? 20 : 60;
    let mouse = { x: null, y: null, radius: 130 };

    window.addEventListener('resize', () => {
      if (heroSec) {
        width = heroCanvas.width = heroSec.offsetWidth;
        height = heroCanvas.height = heroSec.offsetHeight;
      }
    });

    heroSec.addEventListener('mousemove', (e) => {
      const rect = heroSec.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    heroSec.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x += (dx / dist) * force * 1.2;
            this.y += (dy / dist) * force * 1.2;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(116, 201, 21, 0.75)';
        ctx.fill();
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < 100) {
            const alpha = ((100 - dist) / 100) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(116, 201, 21, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        if (mouse.x !== null && mouse.y !== null) {
          const p = particles[i];
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
          if (dist < mouse.radius) {
            const alpha = ((mouse.radius - dist) / mouse.radius) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(116, 201, 21, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    function loop() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();
      requestAnimationFrame(loop);
    }

    loop();
  }

  // ==========================================
  // 11. Project Builder Estimator Calculator
  // ==========================================
  const priceSlider = document.getElementById('budget-range');
  const tiers = {
    mvp: document.getElementById('tier-mvp'),
    pro: document.getElementById('tier-pro'),
    enterprise: document.getElementById('tier-enterprise')
  };

  if (priceSlider && tiers.mvp && tiers.pro && tiers.enterprise) {
    priceSlider.addEventListener('input', (e) => {
      const budget = parseInt(e.target.value, 10);

      tiers.mvp.classList.remove('active');
      tiers.pro.classList.remove('active');
      tiers.enterprise.classList.remove('active');

      if (budget < 25000) {
        tiers.mvp.classList.add('active');
      } else if (budget >= 25000 && budget < 75000) {
        tiers.pro.classList.add('active');
      } else {
        tiers.enterprise.classList.add('active');
      }
    });
  }



});
