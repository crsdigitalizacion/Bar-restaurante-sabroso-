/* Carta: la foto acompaña al plato.
   Ordenador: foto fija a la derecha que cambia con el plato a la vista o bajo el ratón.
   Móvil: cada plato despliega su foto al tocarlo. Sin este script, las fotos se ven en línea. */
(function () {
  "use strict";
  var root = document.getElementById("carta");
  if (!root) return;
  root.classList.add("js");
  var rows = Array.prototype.slice.call(root.querySelectorAll(".c-row"));
  var stage = root.querySelector(".c-stage");
  var capCat = root.querySelector(".c-cap-cat");
  var capName = root.querySelector(".c-cap-name");
  var wide = window.matchMedia("(min-width: 960px)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
  var current = null, pending = null, swapping = false;
  var catOf = function (row) { var h = row.closest(".c-cat").querySelector(".c-cat-title"); return h ? h.textContent : ""; };

  /* ---------- Foto fija (ordenador) ---------- */
  function preload(row) {
    if (!row || row._pre) return;
    var p = new Image(); p.sizes = "40vw"; p.srcset = row.dataset.srcset; p.src = row.dataset.src; row._pre = p;
  }

  function show(row, instant) {
    if (!row || row === current) return;
    rows.forEach(function (r) { r.classList.toggle("is-active", r === row); });
    current = row;
    capCat.textContent = catOf(row);
    capName.textContent = row.dataset.alt;
    var i = rows.indexOf(row); preload(rows[i + 1]); preload(rows[i - 1]);
    if (swapping) { pending = row; return; }
    swap(row, instant);
  }

  function swap(row, instant) {
    var top = stage.querySelector(".c-layer.is-top");
    var under = stage.querySelector(".c-layer:not(.is-top)");
    var img = document.createElement("img");
    img.alt = row.dataset.alt; img.sizes = "(min-width:960px) 40vw, 1px";
    img.srcset = row.dataset.srcset; img.src = row.dataset.src; img.decoding = "async";
    if (row.dataset.lq) img.style.background = "#EEE7DE url(" + row.dataset.lq + ") center/cover no-repeat";
    under.innerHTML = ""; under.appendChild(img);
    var reveal = function () {
      under.classList.add("is-top"); top.classList.remove("is-top");
      if (instant || reduce || typeof under.animate !== "function") { end(); return; }
      swapping = true;
      under.animate([{ clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)" }], { duration: 320, easing: EASE });
      if (top.firstChild) top.firstChild.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6%)" }], { duration: 320, easing: EASE });
      var a = img.animate([{ transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 420, easing: EASE });
      setTimeout(end, 320);
    };
    var end = function () {
      swapping = false;
      if (pending && pending !== row) { var p = pending; pending = null; swap(p, false); } else pending = null;
    };
    if (img.complete && img.naturalWidth) reveal();
    else { img.onload = reveal; img.onerror = reveal; }
  }

  /* Plato activo según el scroll (una franja en el centro de la pantalla) */
  var io = null;
  function watch() {
    if (io) { io.disconnect(); io = null; }
    return;   /* la foto ya no cambia sola con el scroll */
    if (!wide.matches || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (entries) {
      if (hovering) return;
      entries.forEach(function (e) { if (e.isIntersecting) show(e.target); });
    }, { rootMargin: "-42% 0px -52% 0px" });
    rows.forEach(function (r) { io.observe(r); });
  }

  /* Ratón y teclado en ordenador */
  var hovering = false;
  rows.forEach(function (r) {
    var btn = r.querySelector(".c-btn");
    /* (sin cambio de foto al pasar el ratón) */
    r.addEventListener("pointerleave", function () { hovering = false; });

    btn.addEventListener("click", function () {
      if (wide.matches) { openBig(r); return; }
      if (r.classList.contains("is-feat")) return;   /* su foto ya está encima */
      toggle(r);
    });
  });

  /* ---------- Foto grande y entera al pulsar (ordenador) ---------- */
  var big = document.createElement("dialog");
  big.className = "c-big";
  big.setAttribute("aria-label", "Foto del plato");
  big.innerHTML = '<button class="c-big-close" type="button" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><figure><img alt=""><figcaption><span class="c-big-cat"></span><span class="c-big-name"></span><span class="c-big-desc"></span></figcaption></figure>';
  document.body.appendChild(big);
  var bigImg = big.querySelector("img");
  function openBig(row) {
    bigImg.removeAttribute("src");
    if (row.dataset.lq) bigImg.style.background = "#EEE7DE url(" + row.dataset.lq + ") center/contain no-repeat";
    bigImg.sizes = "(min-width:1200px) 1000px, 80vw";
    bigImg.srcset = row.dataset.srcset; bigImg.src = row.dataset.src; bigImg.alt = row.dataset.alt;
    big.querySelector(".c-big-cat").textContent = catOf(row);
    big.querySelector(".c-big-name").textContent = row.dataset.alt;
    var d = row.querySelector(".c-desc"); big.querySelector(".c-big-desc").textContent = d ? d.textContent : "";
    if (typeof big.showModal === "function") big.showModal(); else big.setAttribute("open", "");
  }
  function closeBig() {
    if (!big.open) return;
    if (reduce) { big.close(); return; }
    big.classList.add("closing");
    setTimeout(function () { big.classList.remove("closing"); big.close(); }, 200);
  }
  big.addEventListener("click", function (e) { if (e.target === big || e.target.closest(".c-big-close")) closeBig(); });
  big.addEventListener("cancel", function (e) { e.preventDefault(); closeBig(); });

  /* ---------- Desplegar la foto (móvil) ---------- */
  function toggle(row) {
    var btn = row.querySelector(".c-btn");
    var open = btn.getAttribute("aria-expanded") !== "true";
    rows.forEach(function (r) {
      if (r !== row && r.classList.contains("is-open")) { r.classList.remove("is-open"); r.querySelector(".c-btn").setAttribute("aria-expanded", "false"); }
    });
    row.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    if (open) {
      var im = row.querySelector(".c-photo img"); if (im) im.loading = "eager";
    }
  }

  /* ---------- Pestañas de categoría ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  if ("IntersectionObserver" in window) {
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tabs.forEach(function (t) {
          var on = t.getAttribute("href") === "#" + e.target.id;
          t.classList.toggle("is-active", on);
          if (on) { t.setAttribute("aria-current", "true"); try { t.parentElement.scrollTo({ left: t.offsetLeft - 12, behavior: reduce ? "auto" : "smooth" }); } catch (x) {} }
          else t.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    root.querySelectorAll(".c-cat").forEach(function (c) { tio.observe(c); });
  }

  /* Foto destacada (móvil): se asienta al entrar en pantalla */
  if ("IntersectionObserver" in window) {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("seen"); fio.unobserve(e.target); } });
    }, { threshold: 0.25 });
    root.querySelectorAll(".c-feat").forEach(function (f) {
      if (f.getBoundingClientRect().top < window.innerHeight) f.classList.add("seen"); else fio.observe(f);
    });
  } else root.querySelectorAll(".c-feat").forEach(function (f) { f.classList.add("seen"); });

  wide.addEventListener("change", watch);
  current = rows[0]; rows[0].classList.add("is-active");
  watch();
})();
