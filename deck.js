/* Baraja de pinchos: cuatro tarjetas con entrada en abanico y paso con flechas o gesto.
   Sin este script las tarjetas se ven en una fila deslizable normal. */
(function () {
  "use strict";
  document.querySelectorAll("[data-deck]").forEach(function (deck) { setup(deck); });
  function setup(deck) {
  var stage = deck.querySelector(".deck-stage");
  var cards = Array.prototype.slice.call(deck.querySelectorAll(".deck-card"));
  var N = cards.length;
  var ctrl = deck.querySelector(".deck-ctrl");
  var now = deck.querySelector(".deck-now");
  var prev = deck.querySelector('[data-dir="-1"]');
  var next = deck.querySelector('[data-dir="1"]');
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wide = window.matchMedia("(min-width: 900px)");
  var active = Math.min(parseInt(deck.dataset.start || "0", 10), N - 1);

  deck.classList.add("js");
  if (reduce) deck.classList.add("is-static");
  ctrl.hidden = false;

  /* posición circular de cada tarjeta respecto a la activa: 0 centro, 1 derecha, -1 izquierda, 2 detrás */
  function rel(i) {
    var d = ((i - active) % N + N) % N;
    if (d > N / 2) d -= N;
    return d;
  }
  function place() {
    var W = cards[0].offsetWidth || 280;
    var side = W * (wide.matches ? 0.8 : 0.64);
    cards.forEach(function (c, i) {
      var d = rel(i), a = Math.abs(d), back = a >= 2 || (N === 2 && a === 1 && false);
      var x = back ? 0 : d * side;
      var z = d === 0 ? 0 : back ? -320 : -150;
      var ry = d === 0 ? 0 : back ? 0 : -d * 32;
      var s = d === 0 ? 1 : back ? 0.7 : 0.88;
      var y = d === 0 ? 0 : back ? 20 : 12;
      c.style.transform = "perspective(1100px) translateX(" + x.toFixed(1) + "px) translateY(" + y + "px) translateZ(" + z + "px) rotateY(" + ry + "deg) scale(" + s + ")";
      c.style.zIndex = String(d === 0 ? 10 : back ? 1 : 5);
      c.style.opacity = back ? "0" : "1";
      c.classList.toggle("is-active", d === 0);
      c.setAttribute("aria-hidden", d === 0 ? "false" : "true");
    });
    now.textContent = String(active + 1).padStart(2, "0");
    prev.disabled = false; next.disabled = false;
  }

  /* gira en círculo: después de la última vuelve a la primera, y al revés */
  function go(i) {
    i = ((i % N) + N) % N;
    if (i === active) return;
    active = i; place();
  }

  /* Pila inicial: solo si la sección todavía no se ve al cargar */
  function pile() {
    cards.forEach(function (c, i) {
      var k = i - (N - 1) / 2;
      c.style.transform = "translateX(" + (k * 8) + "px) translateY(" + (Math.abs(k) * 4) + "px) rotate(" + (k * 3) + "deg) scale(0.92)";
      c.style.zIndex = String(i === active ? 10 : 5 - Math.abs(i - active));
      c.style.opacity = "1";
    });
  }

  if (!reduce && "IntersectionObserver" in window && deck.getBoundingClientRect().top > window.innerHeight * 0.75) {
    deck.classList.add("is-pile");
    pile();
    now.textContent = String(active + 1).padStart(2, "0");
    /* las fotos se decodifican antes de abrir, para que el abanico no se trabe */
    var ready = Promise.all(cards.map(function (c) {
      var im = c.querySelector("img"); if (!im) return null;
      im.loading = "eager";
      return im.decode ? im.decode().catch(function () {}) : null;
    }));
    var open = function () {
      deck.classList.remove("is-pile");
      deck.classList.add("is-opening");
      requestAnimationFrame(function () { place(); setTimeout(function () { deck.classList.remove("is-opening"); }, 750); });
    };
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      Promise.race([ready, new Promise(function (r) { setTimeout(r, 400); })]).then(open);
    }, { threshold: 0.5 });
    io.observe(stage);
  } else {
    place();
  }

  prev.addEventListener("click", function () { go(active - 1); });
  next.addEventListener("click", function () { go(active + 1); });
  cards.forEach(function (c, i) { c.addEventListener("click", function () { var d = rel(i); if (d) go(active + d); }); });
  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
  });

  /* Gesto horizontal; el vertical queda para la página (touch-action: pan-y) */
  var sx = 0, sy = 0, down = false;
  stage.addEventListener("pointerdown", function (e) { down = true; sx = e.clientX; sy = e.clientY; });
  stage.addEventListener("pointerup", function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) go(active + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener("pointercancel", function () { down = false; });

  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (!deck.classList.contains("is-pile")) place(); }, 120); });
  }
})();
