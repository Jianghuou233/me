/* ==========================================================================
   me.s1on.wtf — Night Log
   Vanilla ES2020. No dependencies, no build step, works from file://.
   --------------------------------------------------------------------------
   00. Config
   01. Helpers
   02. Preloader
   03. Clock
   04. Starfield
   05. Cursor, sparks and the occasional ciallo
   06. Reveal, phases, nav, progress
   07. Parallax and the sky map
   08. Counters
   09. Copy to clipboard
   ========================================================================== */
(function () {
  "use strict";

  /* 00. Config — edit here, nothing else needs to change. */
  const CONFIG = {
    email: "dev@s1on.wtf",
    timeZone: "Asia/Shanghai",
    clockLabel: "CST",
    phaseFallback: "deep",
    cialloChance: 0.22,
    cialloText: "Ciallo～(∠・ω< )⌒★"
  };

  /* 01. Helpers */
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  const safe = (name, fn) => {
    try {
      fn();
    } catch (error) {
      console.warn("[night-log] " + name + " failed:", error);
    }
  };

  /* 02. Preloader */
  function initPreloader() {
    const preloader = $("#preloader");
    const bar = $("#loader-bar");
    const pct = $("#loader-pct");
    if (!preloader) {
      document.body.classList.remove("is-loading");
      return;
    }

    let value = 0;
    let target = 88;
    let done = false;

    const paint = () => {
      if (bar) bar.style.transform = "scaleX(" + value / 100 + ")";
      if (pct) pct.textContent = String(Math.round(value));
    };

    const tick = () => {
      value += (target - value) * 0.12;
      if (target - value < 0.4) value = target;
      paint();
      if (value < target) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);

    const finish = () => {
      if (done) return;
      done = true;
      target = 100;
      window.requestAnimationFrame(tick);
      window.setTimeout(() => {
        preloader.classList.add("is-done");
        document.body.classList.remove("is-loading");
        document.body.classList.add("is-ready");
      }, 380);
      window.setTimeout(() => preloader.setAttribute("hidden", ""), 1600);
    };

    let loaded = false;
    const onLoad = () => {
      loaded = true;
      finish();
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    window.setTimeout(() => {
      if (!loaded) finish();
    }, 3200);
  }

  /* 03. Clock */
  function initClock() {
    const node = $("#clock");
    if (!node) return;

    let formatter;
    try {
      formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: CONFIG.timeZone,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch (error) {
      formatter = new Intl.DateTimeFormat("en-GB", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }

    const write = () => {
      node.textContent = formatter.format(new Date());
    };
    write();
    window.setInterval(write, 1000);
  }

  /* 04. Starfield */
  function initStarfield() {
    const canvas = $("#starfield");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = {
      width: 0,
      height: 0,
      dpr: 1,
      stars: [],
      shots: [],
      pointerX: 0.5,
      pointerY: 0.5,
      softX: 0.5,
      softY: 0.5,
      last: 0,
      nextShot: 0,
      frame: 0,
      running: true
    };

    const palette = {
      white: [242, 238, 229],
      gold: [231, 197, 147],
      mist: [185, 212, 221]
    };

    function size() {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      canvas.style.width = state.width + "px";
      canvas.style.height = state.height + "px";
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      seed();
    }

    function seed() {
      const count = clamp(Math.round((state.width * state.height) / 11500), 60, 200);
      state.stars = [];
      for (let i = 0; i < count; i += 1) {
        const roll = Math.random();
        state.stars.push({
          x: Math.random(),
          y: Math.random(),
          r: Math.random() * 1.25 + 0.28,
          alpha: Math.random() * 0.45 + 0.2,
          speed: Math.random() * 0.012 + 0.003,
          phase: Math.random() * Math.PI * 2,
          depth: Math.random() * 0.85 + 0.15,
          tint: roll > 0.86 ? "gold" : roll > 0.62 ? "mist" : "white"
        });
      }
    }

    function drawStars(time) {
      ctx.clearRect(0, 0, state.width, state.height);

      const driftX = (state.softX - 0.5) * 26;
      const driftY = (state.softY - 0.5) * 18;

      for (let i = 0; i < state.stars.length; i += 1) {
        const star = state.stars[i];
        const twinkle = 0.55 + 0.45 * Math.sin(star.phase + time * star.speed);
        const alpha = star.alpha * twinkle;
        const x = star.x * state.width + driftX * star.depth;
        const y = star.y * state.height + driftY * star.depth;
        const color = palette[star.tint];

        ctx.beginPath();
        ctx.arc(x, y, star.r, 0, Math.PI * 2);
        ctx.fillStyle =
          "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + alpha.toFixed(3) + ")";
        ctx.fill();

        if (star.r > 1.05) {
          ctx.beginPath();
          ctx.arc(x, y, star.r * 3.2, 0, Math.PI * 2);
          ctx.fillStyle =
            "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + (alpha * 0.08).toFixed(3) + ")";
          ctx.fill();
        }
      }
    }

    function spawnShot() {
      const fromLeft = Math.random() > 0.45;
      state.shots.push({
        x: fromLeft ? -60 : state.width * (0.35 + Math.random() * 0.6),
        y: Math.random() * state.height * 0.5,
        vx: 520 + Math.random() * 380,
        vy: 150 + Math.random() * 150,
        life: 0,
        max: 0.85 + Math.random() * 0.5,
        len: 90 + Math.random() * 120
      });
    }

    function drawShots(dt) {
      for (let i = state.shots.length - 1; i >= 0; i -= 1) {
        const shot = state.shots[i];
        shot.life += dt;
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        const progress = shot.life / shot.max;

        if (progress >= 1 || shot.x > state.width + 200) {
          state.shots.splice(i, 1);
          continue;
        }

        const fade = Math.sin(Math.min(progress, 1) * Math.PI);
        const tailX = shot.x - shot.vx * (shot.len / 700);
        const tailY = shot.y - shot.vy * (shot.len / 700);
        const gradient = ctx.createLinearGradient(shot.x, shot.y, tailX, tailY);
        gradient.addColorStop(0, "rgba(242,238,229," + (0.75 * fade).toFixed(3) + ")");
        gradient.addColorStop(0.4, "rgba(231,197,147," + (0.35 * fade).toFixed(3) + ")");
        gradient.addColorStop(1, "rgba(231,197,147,0)");

        ctx.beginPath();
        ctx.moveTo(shot.x, shot.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.1;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    function loop(now) {
      if (!state.running) return;
      const time = now * 0.001;
      const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 0.016;
      state.last = now;

      state.softX += (state.pointerX - state.softX) * 0.04;
      state.softY += (state.pointerY - state.softY) * 0.04;

      drawStars(time);

      if (now > state.nextShot && state.shots.length < 2) {
        spawnShot();
        state.nextShot = now + 5200 + Math.random() * 9000;
      }
      drawShots(dt);

      state.frame = window.requestAnimationFrame(loop);
    }

    function still() {
      drawStars(0);
    }

    size();
    state.nextShot = performance.now() + 2600;

    window.addEventListener("resize", () => {
      window.clearTimeout(state.resizeTimer);
      state.resizeTimer = window.setTimeout(() => {
        size();
        if (prefersReduced.matches) still();
      }, 160);
    });

    window.addEventListener(
      "pointermove",
      (event) => {
        state.pointerX = event.clientX / window.innerWidth;
        state.pointerY = event.clientY / window.innerHeight;
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        state.running = false;
        window.cancelAnimationFrame(state.frame);
      } else if (!prefersReduced.matches) {
        state.running = true;
        state.last = 0;
        state.frame = window.requestAnimationFrame(loop);
      }
    });

    prefersReduced.addEventListener("change", () => {
      window.cancelAnimationFrame(state.frame);
      if (prefersReduced.matches) {
        state.running = false;
        still();
      } else {
        state.running = true;
        state.last = 0;
        state.frame = window.requestAnimationFrame(loop);
      }
    });

    if (prefersReduced.matches) {
      still();
    } else {
      state.frame = window.requestAnimationFrame(loop);
    }
  }

  /* 05. Cursor, sparks, ciallo */
  function initCursor() {
    const cursor = $("#cursor");
    if (!cursor || !canHover.matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let targetX = x;
    let targetY = y;
    let raf = 0;

    const render = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      cursor.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      raf = window.requestAnimationFrame(render);
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        cursor.classList.add("is-visible");
      },
      { passive: true }
    );

    document.addEventListener("pointerover", (event) => {
      const hot = event.target.closest("a, button, [data-copy-email]");
      cursor.classList.toggle("is-hot", Boolean(hot));
    });

    document.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));

    render();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        window.cancelAnimationFrame(raf);
      } else {
        raf = window.requestAnimationFrame(render);
      }
    });
  }

  function burst(x, y) {
    if (prefersReduced.matches) return;
    const count = 7;
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement("span");
      dot.className = "spark";
      dot.style.left = x + "px";
      dot.style.top = y + "px";
      document.body.appendChild(dot);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = 16 + Math.random() * 34;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      dot.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 0.95 },
          { transform: "translate(" + dx + "px," + dy + "px) scale(0.2)", opacity: 0 }
        ],
        { duration: 620 + Math.random() * 320, easing: "cubic-bezier(0.16,1,0.3,1)" }
      ).onfinish = () => dot.remove();
    }
  }

  function ciallo(x, y) {
    if (prefersReduced.matches) return;
    if (Math.random() > CONFIG.cialloChance) return;
    const node = document.createElement("span");
    node.className = "ciallo";
    node.textContent = CONFIG.cialloText;
    node.style.left = x + "px";
    node.style.top = y + "px";
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 2000);
  }

  function initClickSpark() {
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0) return;
        if (event.target.closest("input, textarea")) return;
        burst(event.clientX, event.clientY);
        ciallo(event.clientX, event.clientY - 18);
      },
      { passive: true }
    );
  }

  /* 06. Reveal, phases, nav, progress */
  function initReveal() {
    const items = $$("[data-reveal]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    items.forEach((item) => observer.observe(item));

    // Failsafe: never leave content invisible if the observer misbehaves.
    window.setTimeout(() => {
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.top < window.innerHeight) item.classList.add("is-in");
      });
    }, 3600);
  }

  function initSky() {
    const layers = $$(".sky__layer");
    const sections = $$("[data-section]");
    if (!layers.length || !sections.length) return;

    const setPhase = (phase) => {
      layers.forEach((layer) => {
        layer.classList.toggle("is-on", layer.classList.contains("sky__layer--" + phase));
      });
      document.body.dataset.phase = phase;
    };

    if (!("IntersectionObserver" in window)) {
      setPhase(sections[0].dataset.phase || CONFIG.phaseFallback);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setPhase(entry.target.dataset.phase || CONFIG.phaseFallback);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    setPhase(sections[0].dataset.phase || CONFIG.phaseFallback);
  }

  function initNav() {
    const links = $$(".site-nav a[data-nav]");
    const sections = $$("main [data-section]");
    const header = $("#site-header");
    const progress = $("#progress");
    if (!links.length || !sections.length) return;

    const byId = new Map();
    sections.forEach((section) => byId.set(section.id, section));

    const setActive = (id) => {
      links.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.nav === id);
      });
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
      );
      sections.forEach((section) => observer.observe(section));
    }

    let scheduled = false;

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        const top = window.scrollY;
        if (header) header.classList.toggle("is-stuck", top > 24);
        if (progress) {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const ratio = max > 0 ? clamp(top / max, 0, 1) : 0;
          progress.style.transform = "scaleX(" + ratio + ")";
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* 07. Parallax and the sky map */
  function initParallax() {
    const items = $$("[data-parallax]");
    if (!items.length || prefersReduced.matches || !canHover.matches) return;

    let scheduled = false;
    const render = () => {
      scheduled = false;
      const vh = window.innerHeight;
      items.forEach((item) => {
        const speed = parseFloat(item.dataset.parallax) || 0.1;
        const rect = item.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        item.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
    };

    const request = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(render);
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    request();
  }

  function initSkyMap() {
    const map = $("[data-map]");
    if (!map) return;

    const svg = $(".sky-map__lines", map);
    const path = $("[data-map-path]", map);
    const cards = $$(".star__card", map);

    const reveal = () => {
      map.classList.add("is-drawn");
      if (path) path.style.strokeDashoffset = "0";
    };

    if (!svg || !path || cards.length < 3) {
      reveal();
      return;
    }

    // Perimeter order: top-left, top-right, bottom-right, bottom-left.
    const order = [0, 1, 3, 2, 0];

    const build = () => {
      const box = map.getBoundingClientRect();
      if (box.width < 40 || box.height < 40) return;

      const points = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return {
          x: rect.left - box.left + rect.width / 2,
          y: rect.top - box.top + rect.height / 2
        };
      });

      const d = order
        .filter((index) => points[index])
        .map((index, step) => {
          const point = points[index];
          return (step === 0 ? "M" : "L") + point.x.toFixed(1) + " " + point.y.toFixed(1);
        })
        .join(" ");

      svg.setAttribute("viewBox", "0 0 " + Math.round(box.width) + " " + Math.round(box.height));
      path.setAttribute("d", d);

      if (map.classList.contains("is-drawn")) {
        path.style.strokeDashoffset = "0";
      } else {
        try {
          const length = path.getTotalLength();
          path.style.strokeDasharray = String(length);
          path.style.strokeDashoffset = String(length);
        } catch (error) {
          path.style.strokeDasharray = "none";
        }
      }
    };

    build();
    window.addEventListener("resize", () => {
      window.clearTimeout(map.resizeTimer);
      map.resizeTimer = window.setTimeout(build, 180);
    });

    if (!("IntersectionObserver" in window)) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          build();
          window.requestAnimationFrame(reveal);
          observer.disconnect();
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(map);
  }

  /* 08. Counters */
  function initCounters() {
    const nodes = $$("[data-count]");
    if (!nodes.length) return;

    const run = (node) => {
      const target = parseFloat(node.dataset.count);
      if (!Number.isFinite(target)) return;
      if (prefersReduced.matches) {
        node.textContent = String(target);
        return;
      }
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const p = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = String(Math.round(target * eased));
        if (p < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(run);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    nodes.forEach((node) => {
      node.textContent = "0";
      observer.observe(node);
    });
  }

  /* 09. Copy to clipboard */
  function initCopy() {
    const buttons = $$("[data-copy-email]");
    const toast = $("#toast");
    if (!buttons.length) return;

    let timer = 0;

    const showToast = (message) => {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
    };

    const legacyCopy = (text) => {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (error) {
        ok = false;
      }
      document.body.removeChild(area);
      return ok;
    };

    buttons.forEach((button) => {
      const label = $("[data-copy-label]", button);
      const email = button.dataset.copyEmail || CONFIG.email;

      button.addEventListener("click", async () => {
        let copied = false;
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(email);
            copied = true;
          } catch (error) {
            copied = false;
          }
        }
        if (!copied) copied = legacyCopy(email);

        if (copied) {
          showToast("已复制 " + email);
          if (label) {
            const original = label.textContent;
            label.textContent = "已复制";
            window.setTimeout(() => {
              label.textContent = original;
            }, 2200);
          }
        } else {
          showToast("复制失败，请手动选择：" + email);
        }
      });
    });
  }

  /* boot */
  function boot() {
    document.documentElement.classList.add("js");
    safe("preloader", initPreloader);
    safe("clock", initClock);
    safe("starfield", initStarfield);
    safe("cursor", initCursor);
    safe("clicks", initClickSpark);
    safe("reveal", initReveal);
    safe("sky", initSky);
    safe("nav", initNav);
    safe("parallax", initParallax);
    safe("map", initSkyMap);
    safe("counters", initCounters);
    safe("copy", initCopy);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
