/* Café: una gota de leche cae sobre la taza al ritmo del scroll.
   Si dejas de bajar, se detiene. La foto no se mueve; todo ocurre en el SVG.
   Sin este script (o con movimiento reducido) se ve la foto y el texto, sin gota. */
(function () {
  "use strict";
  var sec = document.querySelector("[data-cafe]");
  if (!sec) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var svg = sec.querySelector(".cafe-fx");
  var NS = "http://www.w3.org/2000/svg";
  var drop = svg.querySelector(".fx-drop");
  var spot = svg.querySelector(".fx-spot"), rings = svg.querySelectorAll(".fx-ring");
  var crownG = svg.querySelector(".fx-crown"), back = svg.querySelector(".fx-back"), front = svg.querySelector(".fx-front");
  var tipsG = svg.querySelector(".fx-tips"), dropsG = svg.querySelector(".fx-drops");
  var text = sec.querySelector(".cafe-text");
  var CX = 760, CY = 506;            /* punto de impacto: centro del café, sobre el corazón */
  var CRESTS = 7;                    /* puntas de la corona */

  var tips = [];
  for (var i = 0; i < CRESTS; i++) {
    var t = document.createElementNS(NS, "ellipse");
    t.setAttribute("fill", "url(#milk)"); tipsG.appendChild(t); tips.push(t);
  }
  /* cinco gotas hacia los lados: [dirección, subida, radio] */
  var DROPS = [[-1, 0.8, 6.5], [-0.5, 1.1, 5], [0.55, 1.05, 5.5], [1, 0.75, 6]];
  var drops = DROPS.map(function (d) {
    var c = document.createElementNS(NS, "ellipse");
    c.setAttribute("fill", "url(#milk)"); c.setAttribute("opacity", "0"); dropsG.appendChild(c);
    return { el: c, dir: d[0], up: d[1], r: d[2] };
  });

  sec.classList.add("is-anim");
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* Corona baja: un anillo de leche que se levanta del café con el borde superior ondulado */
  /* altura de cada cresta, distinta para que el borde sea irregular */
  var CREST_H = [1, 0.62, 0.88, 0.55, 0.95, 0.7, 0.8];
  function crestAt(b) {
    var u = ((b / (Math.PI * 2)) * CRESTS % CRESTS + CRESTS) % CRESTS, i = Math.floor(u), fr = u - i;
    var peak = Math.pow(Math.sin(Math.PI * fr), 4);
    return 0.4 + 0.6 * peak * CREST_H[i];
  }
  /* Corona pequeña: anillo bajo de leche con el borde superior irregular */
  function crownPath(R, H, half) {
    var ry = R * 0.4, d = "", n = 42, a0 = half === "front" ? 0 : Math.PI, k;
    for (k = 0; k <= n; k++) {
      var a = a0 + (Math.PI * k) / n;
      d += (k ? "L" : "M") + (CX + Math.cos(a) * R).toFixed(1) + "," + (CY + Math.sin(a) * ry).toFixed(1);
    }
    for (k = n; k >= 0; k--) {
      var b = a0 + (Math.PI * k) / n, r2 = R * 1.08;
      d += "L" + (CX + Math.cos(b) * r2).toFixed(1) + "," + (CY + Math.sin(b) * ry * 1.08 - H * crestAt(b)).toFixed(1);
    }
    return d + "Z";
  }

  function render(p) {
    /* 0–40 % · caída */
    var f = seg(p, 0, 0.4);
    var y = -70 + (CY - 26 + 70) * f * f;
    drop.setAttribute("opacity", f > 0.01 && p < 0.4 ? "1" : "0");
    drop.setAttribute("transform", "translate(" + CX + "," + y.toFixed(1) + ") scale(" + (1.3 * (1 - 0.12 * f)).toFixed(3) + "," + (1.3 * (1 + 0.28 * f)).toFixed(3) + ")");

    /* 40–65 % · impacto: corona pequeña, gotas que suben y caen, onda tenue */
    var s = seg(p, 0.4, 0.65);
    var out = 1 - seg(p, 0.65, 0.74);                    /* 65–74 %: desaparece lo que queda */
    var R = 15 + 24 * easeOut(s), H = 22 * Math.sin(Math.PI * clamp(s * 1.1, 0, 1));
    crownG.setAttribute("opacity", p >= 0.4 && H > 0.4 ? (0.95 * out).toFixed(2) : "0");
    back.setAttribute("d", crownPath(R, H * 0.8, "back"));
    front.setAttribute("d", crownPath(R, H, "front"));
    tips.forEach(function (t, i) {
      var a = (i + 0.5) / CRESTS * Math.PI * 2, r2 = R * 1.08, hh = H * (0.4 + 0.6 * CREST_H[i]);
      var ty = CY + Math.sin(a) * R * 0.4 * 1.08 - hh - 4 * Math.sin(Math.PI * s) * CREST_H[i];
      var sz = Math.min(1, H / 10) * (0.7 + 0.4 * CREST_H[i]);
      t.setAttribute("cx", (CX + Math.cos(a) * r2).toFixed(1)); t.setAttribute("cy", ty.toFixed(1));
      t.setAttribute("rx", (3.2 * sz).toFixed(1)); t.setAttribute("ry", (3.9 * sz).toFixed(1));
    });

    spot.setAttribute("rx", (44 * easeOut(s)).toFixed(1));
    spot.setAttribute("ry", (18 * easeOut(s)).toFixed(1));
    spot.setAttribute("opacity", p >= 0.4 ? (0.55 * (1 - seg(p, 0.6, 0.8))).toFixed(2) : "0");

    var t = seg(p, 0.41, 0.66);
    drops.forEach(function (d) {
      var x = CX + d.dir * 150 * t, yy = CY - 16 - d.up * 150 * t + 200 * t * t;   /* suben y vuelven a caer */
      d.el.setAttribute("cx", x.toFixed(1)); d.el.setAttribute("cy", yy.toFixed(1));
      d.el.setAttribute("rx", (d.r * 0.85).toFixed(1)); d.el.setAttribute("ry", (d.r * 1.0).toFixed(1));
      d.el.setAttribute("opacity", p >= 0.41 && p < 0.74 ? ((t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15) * out).toFixed(2) : "0");
    });

    rings.forEach(function (ring, k) {
      var r = seg(p, 0.43 + k * 0.06, 0.78 + k * 0.03), rx = 36 + 200 * easeOut(r);
      ring.setAttribute("rx", rx.toFixed(1)); ring.setAttribute("ry", (rx * 0.46).toFixed(1));
      ring.setAttribute("opacity", r > 0 && r < 1 ? ((1 - r) * 0.3).toFixed(2) : "0");
    });

    /* 65–80 % · aparece el título; 80–100 % · composición final estable */
    var tx = seg(p, 0.66, 0.8);
    text.style.opacity = tx.toFixed(3);
    text.style.transform = "translateY(" + ((1 - easeOut(tx)) * 18).toFixed(1) + "px)";
  }

  var stage = sec.querySelector(".cafe-stage"), ticking = false, visible = false;
  function progress() {
    /* el tramo fijo empieza cuando la sección llega bajo la cabecera y acaba cuando el marco empieza a salir */
    var r = sec.getBoundingClientRect(), stTop = parseFloat(getComputedStyle(stage).top) || 0;
    var range = sec.offsetHeight - stage.offsetHeight;
    return range > 0 ? clamp((stTop - r.top) / range, 0, 1) : 0;
  }
  function frame() { ticking = false; render(progress()); }
  function onScroll() { if (visible && !ticking) { ticking = true; requestAnimationFrame(frame); } }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) onScroll(); }, { rootMargin: "200px 0px" }).observe(sec);
  } else visible = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  render(progress());
})();
