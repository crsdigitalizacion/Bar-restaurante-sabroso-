(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Cada página empieza arriba (salvo enlaces a una sección concreta) */
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
  function toTop() { if (!location.hash) window.scrollTo(0, 0); }
  toTop();
  window.addEventListener("pageshow", toTop);

  /* Menú: el panel se descubre desde el botón; enlaces en secuencia; foto lateral en ordenador */
  var mbtn = document.querySelector(".menu-btn");
  var menu = document.getElementById("site-menu");
  if (mbtn && menu) {
    var mclose = menu.querySelector(".sm-close");
    var closeTimer = null;
    var origin = function () {
      var r = mbtn.getBoundingClientRect();
      menu.style.setProperty("--ox", (r.left + r.width / 2) + "px");
      menu.style.setProperty("--oy", (r.top + r.height / 2) + "px");
    };
    var setMenu = function (open) {
      mbtn.setAttribute("aria-expanded", String(open));
      clearTimeout(closeTimer);
      if (open) {
        origin();
        menu.classList.remove("is-closing");
        menu.hidden = false;
        document.body.classList.add("menu-open");
        requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add("is-open"); }); });
        if (mclose) setTimeout(function () { mclose.focus(); }, 30);
      } else {
        document.body.classList.remove("menu-open");
        menu.classList.remove("is-open");
        mbtn.focus({ preventScroll: true });
        if (reduce) { menu.hidden = true; return; }
        menu.classList.add("is-closing");
        closeTimer = setTimeout(function () { menu.hidden = true; menu.classList.remove("is-closing"); }, 320);
      }
    };
    mbtn.addEventListener("click", function () { setMenu(mbtn.getAttribute("aria-expanded") !== "true"); });
    if (mclose) mclose.addEventListener("click", function () { setMenu(false); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) document.body.classList.remove("menu-open"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) setMenu(false);
      if (e.key === "Tab" && !menu.hidden) {   /* el foco no sale del menú abierto */
        var f = menu.querySelectorAll("a,button"); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    /* foto lateral (ordenador): cambia al señalar o enfocar cada sección */
    var shots = menu.querySelectorAll(".sm-photo img");
    menu.querySelectorAll(".sm-list a").forEach(function (a) {
      var show = function () { shots.forEach(function (im) { im.classList.toggle("on", im.dataset.photo === a.dataset.photo); }); };
      a.addEventListener("pointerenter", show); a.addEventListener("focus", show);
    });
  }

  /* Motivo del pincho: el trazo se dibuja al entrar en pantalla (una vez por sección) */
  if (!reduce && "IntersectionObserver" in window) {
    var seen = [];
    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("drawn");
        mio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll("main .motif, .site-footer .motif").forEach(function (m) {
      if (m.closest(".layers")) { m.classList.add("draw"); return; }   /* estos se dibujan con su paso */
      if (m.getBoundingClientRect().top < window.innerHeight * 0.8) return;
      m.classList.add("draw");
      mio.observe(m);
    });
  }

  /* Cinta de palabras: avanza sola a velocidad constante; se pausa fuera de pantalla */
  if (!reduce) document.querySelectorAll(".ribbon").forEach(function (ribbon) {
    var group = ribbon.querySelector(".rb-group");
    var setSpeed = function () { if (group) ribbon.style.setProperty("--rb-dur", (group.offsetWidth / 70).toFixed(1) + "s"); };
    setSpeed();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setSpeed);
    ribbon.classList.add("is-running");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { ribbon.classList.toggle("is-paused", !e[0].isIntersecting); }).observe(ribbon);
    }
  });

  /* Carga de fotos: las que se acercan a la pantalla se piden con mucha antelación,
     y cuando la página termina de cargar, el resto se descarga en segundo plano.
     Así, al llegar a una foto ya está lista y no se ve la versión desenfocada. */
  (function () {
    var lazy = Array.prototype.slice.call(document.querySelectorAll('img[loading="lazy"]'));
    if (!lazy.length) return;
    var eager = function (im) { im.loading = "eager"; };
    if ("IntersectionObserver" in window) {
      var pio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { eager(e.target); pio.unobserve(e.target); } });
      }, { rootMargin: "2000px 0px" });
      lazy.forEach(function (im) { pio.observe(im); });
    }
    var rest = function () {
      var i = 0;
      var nextBatch = function () {
        lazy.slice(i, i + 3).forEach(eager); i += 3;
        if (i < lazy.length) { if (window.requestIdleCallback) window.requestIdleCallback(nextBatch, { timeout: 600 }); else setTimeout(nextBatch, 120); }
      };
      nextBatch();
    };
    if (document.readyState === "complete") setTimeout(rest, 400);
    else window.addEventListener("load", function () { setTimeout(rest, 400); });
  })();
  /* Cuando una foto ya está cargada, se retira su previsualización desenfocada */
  document.querySelectorAll("img[style*='data:image']").forEach(function (im) {
    var clear = function () { im.style.backgroundImage = "none"; };
    if (im.complete && im.naturalWidth) clear(); else im.addEventListener("load", clear, { once: true });
  });

  /* Abierto ahora: solo aparece cuando el horario esté confirmado (atributo data-hours) */
  document.querySelectorAll(".open-now").forEach(function (el) {
    var h; try { h = JSON.parse(el.getAttribute("data-hours") || "{}"); } catch (e) { return; }
    if (!h || !Object.keys(h).length) return;
    var now = new Date(), day = (now.getDay() + 6) % 7, mins = now.getHours() * 60 + now.getMinutes();
    var toM = function (t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; };
    var today = h[day] || [], open = today.some(function (r) { return mins >= toM(r[0]) && mins < toM(r[1]); });
    var nextOpen = today.map(function (r) { return r[0]; }).filter(function (t) { return toM(t) > mins; })[0];
    el.textContent = open ? "Abierto ahora" : (nextOpen ? "Cerrado · abre a las " + nextOpen : "Cerrado ahora");
    el.classList.toggle("is-open", open);
    el.hidden = false;
  });

  /* Categorías de la carta: resaltar la sección visible */
  var chips = document.querySelectorAll(".chip[href^='#']");
  if (chips.length && "IntersectionObserver" in window) {
    var map = {};
    chips.forEach(function (c) { map[c.getAttribute("href").slice(1)] = c; });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          chips.forEach(function (c) { c.classList.remove("is-active"); c.removeAttribute("aria-current"); });
          var c = map[e.target.id];
          c.classList.add("is-active"); c.setAttribute("aria-current", "true");
          try { c.parentElement.scrollTo({ left: c.offsetLeft - 16, behavior: reduce ? "auto" : "smooth" }); } catch (err) {}
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) cio.observe(el); });
  }

  /* Detalle ampliable de platos */
  var dlg = document.getElementById("dish-dialog");
  if (dlg) {
    var tpl = {};
    document.querySelectorAll("template[data-dish]").forEach(function (t) { tpl[t.dataset.dish] = t; });
    document.querySelectorAll("[data-open-dish]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = tpl[b.dataset.openDish];
        if (!t) return;
        var slot = dlg.querySelector(".dlg-slot");
        slot.innerHTML = "";
        slot.appendChild(t.content.cloneNode(true));
        if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
        var close = dlg.querySelector(".dlg-close");
        if (close) close.focus();
      });
    });
    var closeDlg = function () {
      if (!dlg.open || dlg.classList.contains("closing")) return;
      var finish = function () { dlg.classList.remove("closing"); if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); };
      if (reduce) { finish(); return; }
      dlg.classList.add("closing");
      setTimeout(finish, 260);
    };
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.closest(".dlg-close") || e.target.closest("[data-close]")) closeDlg();
    });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); closeDlg(); });
  }

  /* Copiar dirección */
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var txt = b.getAttribute("data-copy");
      var label = b.textContent;
      var done = function () { b.textContent = b.getAttribute("data-done") || "Dirección copiada"; setTimeout(function () { b.textContent = label; }, 1800); };
      var fallback = function () {
        var el = document.getElementById(b.getAttribute("data-target"));
        if (!el) return;
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        b.textContent = "Seleccionado";
      };
      try { navigator.clipboard.writeText(txt).then(done, fallback); } catch (err) { fallback(); }
    });
  });

  /* Formulario de muestra: nunca envía datos */
  var form = document.getElementById("demo-form");
  if (form) {

    var tipo = document.getElementById("f-tipo");
    if (location.hash === "#grupo" && tipo) tipo.value = "grupo";
    var fecha = document.getElementById("f-fecha");
    if (fecha) fecha.min = new Date().toISOString().slice(0, 10);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var out = document.getElementById("demo-result");
      out.hidden = false;
      out.focus();
    });
  }

  /* Inclinación sutil al pasar el ratón (solo ordenador) */
  if (finePointer && !reduce) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.classList.add("tilt");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(1000px) rotateY(" + (x * 5).toFixed(2) + "deg) rotateX(" + (-y * 5).toFixed(2) + "deg)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* Títulos principales: entrada breve con perspectiva (giro en X + subida), una sola vez.
     Se comprueba en cada scroll: si un título se pasa de largo, aparece directamente. */
  if (!reduce) {
    var isHome = !!document.querySelector(".hero");
    var titles = Array.prototype.slice.call(document.querySelectorAll("main h1:not(.hero-mark), main h2.display"));
    /* fotos con marco del resto de páginas (el Inicio tiene sus propios momentos) */
    var photos = Array.prototype.slice.call(document.querySelectorAll(isHome ? "main .cats li" : "main .frame, main .split-head .media, main .full"));
    var pend = titles.concat(photos).filter(function (el) { return !el.closest(".hero") && el.getBoundingClientRect().top > window.innerHeight * 0.92; });
    pend.forEach(function (el) { el.classList.add(photos.indexOf(el) !== -1 ? "p-pre" : "t-pre"); });
    var tick = false;
    var check = function () {
      tick = false;
      var vh = window.innerHeight;
      pend = pend.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top >= vh * 0.92) return true;
        var ph = el.classList.contains("p-pre");
        if (r.bottom > 0) el.classList.add(ph ? "p-in" : "t-in");
        el.classList.remove(ph ? "p-pre" : "t-pre");
        return false;
      });
      if (!pend.length) { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); }
    };
    var onScroll = function () { if (!tick) { tick = true; requestAnimationFrame(check); } };
    if (pend.length) { window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll); }
    document.addEventListener("click", function (e) { if (e.target.closest("a[href^='#']")) setTimeout(check, 50); });
  }

  /* Tres momentos de scroll. Todo el texto y las fotos son visibles sin ellos:
     solo se ejecutan si GSAP cargó y no se pidió movimiento reducido. */
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  try {
    var mm = gsap.matchMedia();
    var Q = { big: "(min-width: 900px)", small: "(max-width: 899px)" };

    /* 1 · Portada: la foto pasa de 1 a 1.06 y SABROSO sube un poco.
       Texto y botón visibles desde el inicio: aquí no hay entrada, solo scroll. */
    var hero = document.querySelector(".hero");
    var lift = document.querySelector(".lift-over");
    if (hero) {
      var hmedia = hero.querySelector(".hero-media");
      var mark = hero.querySelector(".hero-mark span");
      var shade = hero.querySelector(".hero-shade");
      mm.add(Q, function (ctx) {
        var big = ctx.conditions.big;
        var tl = gsap.timeline({ scrollTrigger: { trigger: lift || hero, start: "top bottom", end: "top top", scrub: true } });
        if (hmedia) tl.fromTo(hmedia, { scale: 1 }, { scale: 1.06, ease: "none" }, 0);
        if (mark) tl.fromTo(mark, { yPercent: 0 }, { yPercent: big ? -22 : -14, ease: "none" }, 0);
        if (shade) tl.fromTo(shade, { opacity: 0 }, { opacity: 0.45, ease: "none" }, 0);
      });
    }

    /* Momento protagonista: Barra → Comedor → Terraza.
       La foto queda fija (sticky, scroll nativo); la siguiente entra desde la derecha y la cubre; el texto cambia a la vez. */
    document.querySelectorAll("[data-layers]").forEach(function (layers) {
      var sec = layers.closest(".spaces");
      sec.classList.add("is-layered");
      var phs = gsap.utils.toArray(layers.querySelectorAll(".ly-ph"));
      var txs = gsap.utils.toArray(layers.querySelectorAll(".ly-tx"));
      var dots = layers.querySelectorAll(".ly-dots span");
      var setDot = function (k) {
        dots.forEach(function (d, i) { d.classList.toggle("on", i === k); });
        var ic = txs[k] && txs[k].querySelector(".motif"); if (ic) ic.classList.add("drawn");
      };
      setDot(0);
      gsap.set(phs.slice(1), { clipPath: "inset(0% 0% 0% 100%)" });
      gsap.set(txs.slice(1), { autoAlpha: 0, y: 24 });
      var tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: layers, start: "top top", end: "bottom bottom", scrub: 0.6,
        onUpdate: function (st) {
          var t = st.progress * tl.duration(), k = 0;
          for (var j = 1; j < phs.length; j++) if (t >= 0.15 + (j - 1) * 1.35 + 0.6) k = j;
          setDot(k);
        } } });
      tl.to({}, { duration: 0.15 });
      for (var k = 1; k < phs.length; k++) {
        var t0 = tl.duration();
        tl.to(phs[k], { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, t0)
          .fromTo(phs[k].querySelector("img"), { scale: 1.08, xPercent: 6 }, { scale: 1, xPercent: 0, duration: 1 }, t0)
          .to(phs[k - 1].querySelector("img"), { xPercent: -8, scale: 1.04, duration: 1 }, t0)
          .to(txs[k - 1], { autoAlpha: 0, y: -24, duration: 0.45 }, t0 + 0.1)
          .to(txs[k], { autoAlpha: 1, y: 0, duration: 0.45 }, t0 + 0.5)
          .to({}, { duration: 0.35 });
      }
    });

    /* Grupos: la foto del comedor crece desde un marco hasta todo el ancho */
    document.querySelectorAll("[data-grow]").forEach(function (fr) {
      var im = fr.querySelector("img");
      mm.add({ big: "(min-width: 900px)", small: "(max-width: 899px)" }, function (ctx) {
        var tl = gsap.timeline({ scrollTrigger: { trigger: fr, start: "top 85%", end: "top 15%", scrub: 0.5 } });
        tl.fromTo(fr, { clipPath: ctx.conditions.big ? "inset(6% 14% 6% 14% round 18px)" : "inset(4% 5% 4% 5% round 14px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none" }, 0);
        if (im) tl.fromTo(im, { scale: 1.12 }, { scale: 1, ease: "none" }, 0);
      });
    });

    window.addEventListener("load", function () { ST.refresh(); });
  } catch (err) { /* el contenido ya es visible */ }
})();
