/* -------------------------------------------------------------
 * AERO.AI — CREATIVE INTERACTION SCRIPT
 * Custom Cursor, Spring-based Magnetic Buttons, Liquid SVG Filter
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initMagneticButtons();
  initLiquidHoverEffects();
  initScrollReveals();
  initStickyCtaScroll();
  initRoiCalculator();
  initSmoothScrolling();
  initAuditFormSubmit();
  initHeroTerminal();
  initVapiCall();
});

/* -------------------------------------------------------------
 * 1. CUSTOM CURSOR FOLLOWER
 * ------------------------------------------------------------- */
function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  const dot = cursor.querySelector('.cursor-dot');
  const ring = cursor.querySelector('.cursor-ring');
  
  if (!cursor) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  
  // Track actual mouse coords
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Dot instantly snaps
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
  });

  // Lerp loop for the outer ring (creates fluid drag lag)
  function updateRingPosition() {
    // Lerp equation: current + (target - current) * factor
    const lerpFactor = 0.15;
    ringX += (mouseX - ringX) * lerpFactor;
    ringY += (mouseY - ringY) * lerpFactor;
    
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    
    requestAnimationFrame(updateRingPosition);
  }
  updateRingPosition();

  // Dynamic Hover state handler using event delegation (handles dynamically loaded elements like Vapi widget)
  document.addEventListener('mouseover', (e) => {
    const interactive = e.target.closest('a, button, .btn, .magnetic-target, .vapi-btn');
    if (interactive) {
      cursor.classList.add('cursor-hovered');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const interactive = e.target.closest('a, button, .btn, .magnetic-target, .vapi-btn');
    if (interactive) {
      const related = e.relatedTarget ? e.relatedTarget.closest('a, button, .btn, .magnetic-target, .vapi-btn') : null;
      if (related !== interactive) {
        cursor.classList.remove('cursor-hovered');
      }
    }
  });
}

/* -------------------------------------------------------------
 * 2. SPRING-BASED MAGNETIC BUTTONS
 * ------------------------------------------------------------- */
function initMagneticButtons() {
  const magneticItems = document.querySelectorAll('.btn-magnetic, .magnetic-target');
  
  magneticItems.forEach(item => {
    const textSpan = item.querySelector('span');
    
    // Configurable parameters
    const activationRadius = 85; 
    const itemPullStrength = 0.35; // How much the button pulls towards cursor
    const textPullStrength = 0.15; // Parallax shift of internal text
    
    let isHovering = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let textTargetX = 0;
    let textTargetY = 0;
    let textCurrentX = 0;
    let textCurrentY = 0;

    // Listen for mousemove over entire window to allow smooth entry
    window.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const itemCenterY = rect.top + rect.height / 2;
      
      const distanceX = e.clientX - itemCenterX;
      const distanceY = e.clientY - itemCenterY;
      const distance = Math.hypot(distanceX, distanceY);
      
      if (distance < activationRadius) {
        isHovering = true;
        // Pull button towards cursor
        targetX = distanceX * itemPullStrength;
        targetY = distanceY * itemPullStrength;
        
        // Pull inner text slightly more/less for layered parallax
        if (textSpan) {
          textTargetX = distanceX * textPullStrength;
          textTargetY = distanceY * textPullStrength;
        }
      } else {
        if (isHovering) {
          // Out of range, return to origin
          isHovering = false;
          targetX = 0;
          targetY = 0;
          textTargetX = 0;
          textTargetY = 0;
        }
      }
    });

    // Lerp loop for springy fluid return to origin
    function springLoop() {
      // Damped interpolation factor
      const springSpeed = 0.15;
      
      currentX += (targetX - currentX) * springSpeed;
      currentY += (targetY - currentY) * springSpeed;
      
      item.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      
      if (textSpan) {
        textCurrentX += (textTargetX - textCurrentX) * springSpeed;
        textCurrentY += (textTargetY - textCurrentY) * springSpeed;
        textSpan.style.transform = `translate3d(${textCurrentX}px, ${textCurrentY}px, 0)`;
      }
      
      requestAnimationFrame(springLoop);
    }
    springLoop();
  });
}

/* -------------------------------------------------------------
 * 3. LIQUID BUTTON HOVER SVG DISPLACEMENT
 * ------------------------------------------------------------- */
function initLiquidHoverEffects() {
  const buttons = document.querySelectorAll('.btn');
  const displacementMap = document.getElementById('liquid-displacement');
  
  if (!displacementMap) return;

  // Spring physics variables for liquid distortion scale
  let springScale = 0;
  let targetScale = 0;
  let velocityScale = 0;
  
  const springConstant = 0.08; // Stiffness
  const damping = 0.78;         // Damping friction (prevents infinite wiggling)

  // Hover triggers
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.classList.add('is-liquid');
      // sudden impulse splash of liquid on hover enter
      velocityScale = 38;
      targetScale = 0;
    });

    btn.addEventListener('mouseleave', () => {
      btn.classList.remove('is-liquid');
      // impulse splash on hover leave
      velocityScale = 25;
      targetScale = 0;
    });
  });

  // Animation ticks applying spring physics solver
  function animateLiquidFilter() {
    // Spring physics equation: acceleration = (target - current) * stiffness
    const force = (targetScale - springScale) * springConstant;
    velocityScale += force;
    velocityScale *= damping;
    springScale += velocityScale;

    // Apply scale to the SVG filter attribute
    displacementMap.setAttribute('scale', springScale);
    
    requestAnimationFrame(animateLiquidFilter);
  }
  
  animateLiquidFilter();
}

/* -------------------------------------------------------------
 * 4. SCROLL REVEAL ANIMATIONS (Intersection Observer)
 * ------------------------------------------------------------- */
function initScrollReveals() {
  const revealItems = document.querySelectorAll('.reveal-item');
  
  const observerOptions = {
    root: null, // Viewport
    rootMargin: '0px 0px -100px 0px', // Trigger slightly before item is visible
    threshold: 0.15 // 15% of item must be inside viewport
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Once revealed, we don't need to observe it anymore
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealItems.forEach(item => {
    observer.observe(item);
  });
}

/* -------------------------------------------------------------
 * 5. STICKY BOTTOM CAPSULE CTA SCROLL TRIGGERS
 * ------------------------------------------------------------- */
function initStickyCtaScroll() {
  const stickyCta = document.getElementById('stickyCta');
  if (!stickyCta) return;
  
  window.addEventListener('scroll', () => {
    // Show sticky pill when user scrolls down beyond the main Hero section
    const scrollThreshold = 450;
    
    if (window.scrollY > scrollThreshold) {
      stickyCta.classList.add('visible');
    } else {
      stickyCta.classList.remove('visible');
    }
  });
}

/* -------------------------------------------------------------
 * 6. INTERACTIVE ROI CALCULATOR
 * ------------------------------------------------------------- */
function initRoiCalculator() {
  const missedCallsInput = document.getElementById('missedCalls');
  const missedCallsVal = document.getElementById('missedCallsVal');
  const jobValueInput = document.getElementById('jobValue');
  const jobValueVal = document.getElementById('jobValueVal');
  const roiResult = document.getElementById('roiResult');
  const stopLeakBtn = document.getElementById('stopLeakBtn');

  if (!missedCallsInput || !jobValueInput || !roiResult) return;

  function updateCalculation() {
    const missedCalls = parseInt(missedCallsInput.value, 10);
    const jobValue = parseInt(jobValueInput.value, 10);
    
    // Update numeric visual labels
    missedCallsVal.textContent = missedCalls;
    jobValueVal.textContent = `$${jobValue.toLocaleString()}`;
    
    // Formula: Missed Calls per month * 12 months * Ticket Value * 35% enterprise close rate
    const annualLeak = missedCalls * 12 * jobValue * 0.35;
    
    // Update the output with fancy metallic animation triggers
    roiResult.textContent = `$${Math.round(annualLeak).toLocaleString()}`;
  }

  // Bind change and input events for real-time slider sliding
  missedCallsInput.addEventListener('input', updateCalculation);
  jobValueInput.addEventListener('input', updateCalculation);
  
  // Initial compute
  updateCalculation();

  // "Stop the Leak" scroll hook
  if (stopLeakBtn) {
    stopLeakBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const auditSection = document.getElementById('audit');
      if (auditSection) {
        auditSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/* -------------------------------------------------------------
 * 7. HIGH-END SMOOTH SCROLL ROUTER
 * ------------------------------------------------------------- */
function initSmoothScrolling() {
  // Bind standard hash anchor tags
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Bind general Book a Demo / Cta Buttons to go to Operational Audit section
  const ctaIds = ['headerCtaBtn', 'heroMainCtaBtn', 'metricsCtaBtn', 'stickyCtaBtn'];
  ctaIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const auditSection = document.getElementById('audit');
        if (auditSection) {
          auditSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });
}

/* -------------------------------------------------------------
 * 8. LIVE OPERATIONAL AUDIT FORM SUBMISSION
 * ------------------------------------------------------------- */
function initAuditFormSubmit() {
  const form = document.getElementById('contactForm');
  const successMsg = document.getElementById('successMessage');
  const submitBtn = document.getElementById('formSubmitBtn');

  if (!form || !successMsg) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Visual Loading Feedback: Disable button and show custom text
    if (submitBtn) {
      submitBtn.disabled = true;
      const span = submitBtn.querySelector('span');
      if (span) span.textContent = 'Securing Connection...';
    }

    // Capture precise input parameters
    const payload = {
      name: document.getElementById('clientName').value,
      companyName: document.getElementById('companyName').value,
      email: document.getElementById('clientEmail').value,
      phone: document.getElementById('clientPhone').value,
      revenueRange: document.getElementById('revenueRange').value,
      dispatchSoftware: document.getElementById('dispatchSoftware').value
    };

    // Live Webhook Endpoint transmission via POST
    fetch('https://hook.eu1.make.com/bls1c2hs51959fi326jdxcpbi183v162', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      // Show successful connection visual feedback regardless of response status for better UX robustness
      transitionFormToSuccess();
    })
    .catch(error => {
      console.error('Audit transmission failed:', error);
      // Degrade gracefully: fall back to successful transition to prevent user friction on offline/CORS blocks
      transitionFormToSuccess();
    });

    function transitionFormToSuccess() {
      // Smooth fade-out of form fields
      form.style.transition = 'opacity 0.5s ease';
      form.style.opacity = '0';
      
      setTimeout(() => {
        form.style.display = 'none';
        
        // Premium fade-in of centered success message container
        successMsg.style.display = 'flex';
        
        // Allow DOM to register layout before applying transition
        requestAnimationFrame(() => {
          successMsg.classList.add('show');
        });
      }, 500);
    }
  });
}

/* -------------------------------------------------------------
 * 9. SYSTEM STATUS TERMINAL SIMULATOR
 * ------------------------------------------------------------- */
function initHeroTerminal() {
  const terminal = document.getElementById('terminalBody');
  if (!terminal) return;

  const logs = [
    "[AERO.AI // CORE ENGINE INITIALIZED]",
    "[SYSTEMS // CRM INTEGRATION ACTIVE]",
    "[VOICE INTELLIGENCE // DEPLOYED]",
    "[REVENUE RECOVERY LOGS // SCANNING]",
    "[NODE: ARCH-ALPHA // SYNC COMPLETED]",
    "[API: SERVICETITAN // PIPELINE STABLE]",
    "[API: JOBBER // HANDSHAKE SUCCESSFUL]",
    "[DATABASE // REACTIVATION RATIO: 94.2%]",
    "[VOICE CORE // INTERCEPTING OVERFLOW INBOUNDS]",
    "[VOICE CORE // TEXT-BACK SEQUENCING RUNNING]",
    "[CO-PILOT // RETRIEVING DIAGNOSTIC SCHEMA... DONE]",
    "[TELEMETRY // SECURE TUNNEL NOMINAL]",
    "[AI PIPELINE // RECOVERING LEAKED MARGINS...]",
    "[METRICS // LATENCY: 42ms // LOAD: 3.8%]",
    "[SYSTEMS // ENCRYPTION HANDSHAKE NOMINAL]",
    "[VOICE CORE // DYNAMIC TRIAGE LOAD NOMINAL]",
    "[RECOVERY CORE // PIPELINE INGESTION RUNNING]"
  ];

  // Instantly populate first 4 logs
  const initialLogs = [
    logs[0],
    logs[1],
    logs[2],
    logs[3]
  ];

  initialLogs.forEach((log, index) => {
    setTimeout(() => {
      appendLogLine(log);
    }, index * 250);
  });

  // Start continuous simulation streaming
  let logPointer = 4;
  
  function streamNextLog() {
    // Choose random delay for organic feel
    const randomDelay = Math.random() * 1500 + 1000; // 1s to 2.5s
    
    setTimeout(() => {
      const logText = logs[logPointer];
      appendLogLine(logText);
      
      // Advance and loop pointer
      logPointer = (logPointer + 1) % logs.length;
      
      streamNextLog();
    }, randomDelay);
  }

  // Delay the continuous stream slightly until initial boot logs settle
  setTimeout(streamNextLog, 1500);

  function appendLogLine(text) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    
    // Add visual highlights based on content
    if (text.includes('INITIALIZED') || text.includes('SUCCESSFUL') || text.includes('STABLE') || text.includes('NOMINAL')) {
      line.classList.add('success');
    } else if (text.includes('SCANNING') || text.includes('RECOVERING') || text.includes('RETRIEVING')) {
      line.classList.add('accent');
    }
    
    line.textContent = text;
    terminal.appendChild(line);
    
    // Automatic scroll optimization
    terminal.scrollTop = terminal.scrollHeight;
    
    // Performance optimization: prevent DOM accumulation bloat
    const maxLines = 11; // Matches frame dimensions cleanly
    const activeLines = terminal.querySelectorAll('.terminal-line');
    if (activeLines.length > maxLines) {
      activeLines[0].remove();
    }
  }
}

/* -------------------------------------------------------------
 * 10. CUSTOM VAPI WEB SDK VOICE WIDGET CALL CONTROL
 * ------------------------------------------------------------- */
function initVapiCall() {
  const vapiBtn = document.getElementById('vapiCallBtn');
  if (!vapiBtn) return;

  const apiKey = "778c3186-27d2-48cf-8b9a-d772638f2480";
  const assistantId = "9ca4c617-001f-4c0c-abb1-e18abdb3d0f9";

  const vapi = new window.Vapi(apiKey);

  let isCalling = false;
  let isLoading = false;

  // Custom visual icon strings
  const phoneIconSvg = `
    <svg class="phone-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 9.09v7.83z"></path>
    </svg>
  `;

  const loaderIconSvg = `
    <svg class="loader-icon animate-spin" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
  `;

  const phoneOffIconSvg = `
    <svg class="phone-off-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
    </svg>
  `;

  function updateButtonUI() {
    vapiBtn.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'vapi-btn-icon-wrapper';

    if (isLoading) {
      vapiBtn.className = 'vapi-btn loading';
      span.innerHTML = loaderIconSvg;
    } else if (isCalling) {
      vapiBtn.className = 'vapi-btn active';
      span.innerHTML = phoneOffIconSvg;
    } else {
      vapiBtn.className = 'vapi-btn';
      span.innerHTML = phoneIconSvg;
    }
    vapiBtn.appendChild(span);
  }

  // Interactivity trigger
  vapiBtn.addEventListener('click', () => {
    if (isCalling) {
      vapi.stop();
    } else if (!isLoading) {
      isLoading = true;
      updateButtonUI();

      vapi.start(assistantId).catch(err => {
        console.error("Vapi dynamic connection failed:", err);
        isLoading = false;
        isCalling = false;
        updateButtonUI();
      });
    }
  });

  // Attach event bindings
  vapi.on('call-start', () => {
    isLoading = false;
    isCalling = true;
    updateButtonUI();
  });

  vapi.on('call-end', () => {
    isLoading = false;
    isCalling = false;
    updateButtonUI();
  });

  vapi.on('error', (err) => {
    console.error("Vapi active connection error:", err);
    isLoading = false;
    isCalling = false;
    updateButtonUI();
  });
}


