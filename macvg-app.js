
/**
 * MacVG × GX — dynamic games + theme + cloak/panic
 */
(function () {
  "use strict";

  var everything = [];
  var filtered = [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function getTheme() {
    try { return localStorage.getItem("macvgTheme") || "default"; } catch (e) { return "default"; }
  }
  function setTheme(name) {
    document.documentElement.setAttribute("data-theme", name === "default" ? "" : name);
    if (name === "default") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", name);
    try { localStorage.setItem("macvgTheme", name); } catch (e) {}
    $$(".theme-swatch").forEach(function (s) {
      s.classList.toggle("selected", s.getAttribute("data-theme") === name);
    });
    if (window.GXParticles) {
      try { GXParticles.refresh(); } catch (e) {}
    }
  }

  function applyCloak() {
    try {
      var raw = localStorage.getItem("macvg_cloak");
      if (!raw) return;
      var parts = raw.split("|");
      var t = $(".cloak");
      var f = $(".favicon");
      if (t && parts[0]) t.textContent = parts[0];
      if (f && parts[1]) f.setAttribute("href", parts[1]);
    } catch (e) {}
  }

  function wirePanic() {
    document.addEventListener("keydown", function (e) {
      var key = localStorage.getItem("macvg_panic") || "`";
      var href = localStorage.getItem("macvg_panic_href") || "https://www.google.com";
      if (e.key === key) location.href = href;
    });
  }

  function catOf(g) {
    return String(g.category || g.catagory || "").toLowerCase();
  }

  function thumbUrl(g) {
    var link = g.link || "";
    var thumb = g.thumb || "";
    if (!thumb && !link) return "";
    if (/^https?:\/\//i.test(thumb)) return thumb;
    if (/^https?:\/\//i.test(link)) return link.replace(/\/?$/, "/") + thumb;
    // relative to this site
    var path = (link.replace(/\/?$/, "/") + thumb).replace(/^\//, "");
    // MacVG often lives under /macvg/
    var base = "";
    if (location.pathname.indexOf("/macvg") !== -1) {
      base = location.pathname.replace(/\/[^/]*$/, "/").replace(/\/$/, "");
      if (base.indexOf("/macvg") === -1) base = "/macvg";
    }
    return (base ? base + "/" : "./") + path;
  }

  function makeTile(g) {
    var a = document.createElement("a");
    a.className = "gx-tile";
    a.href = "#";
    a.title = g.name || "Game";
    var url = thumbUrl(g);
    if (url) {
      a.style.backgroundImage =
        'linear-gradient(transparent 30%, rgba(0,0,0,0.92)), url("' +
        url.replace(/\\/g, "\\\\").replace(/"/g, '\\"') +
        '")';
    }
    if (g.featured) {
      var b = document.createElement("span");
      b.className = "badge";
      b.textContent = "FEAT";
      a.appendChild(b);
    }
    var n = document.createElement("span");
    n.className = "name";
    n.textContent = g.name || "Game";
    a.appendChild(n);
    a.addEventListener("click", function (e) {
      e.preventDefault();
      location.href = "game.html?target=" + encodeURIComponent(String(g.id));
    });
    return a;
  }

  function render(list) {
    var grid = $("#gamesGrid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!list.length) {
      grid.innerHTML = '<div class="gx-status">No games match.</div>';
      return;
    }
    var frag = document.createDocumentFragment();
    list.forEach(function (g) { frag.appendChild(makeTile(g)); });
    grid.appendChild(frag);
  }

  function updateCounts() {
    var c = { all: everything.length, featured: 0, action: 0, strategy: 0, casual: 0, driving: 0, download: 0 };
    everything.forEach(function (g) {
      if (g.featured) c.featured++;
      if (g.download) c.download++;
      var k = catOf(g);
      if (c[k] !== undefined) c[k]++;
    });
    var labels = {
      all: "All", featured: "Featured", action: "Action", strategy: "Strategy",
      casual: "Casual", driving: "Driving", download: "Downloadable"
    };
    $$("[data-filter]").forEach(function (btn) {
      var f = btn.getAttribute("data-filter");
      if (c[f] !== undefined) btn.textContent = labels[f] + " (" + c[f] + ")";
    });
  }

  function applyFilter(name) {
    var list = everything.slice();
    if (name === "featured") list = list.filter(function (g) { return !!g.featured; });
    else if (name === "download") list = list.filter(function (g) { return !!g.download; });
    else if (name === "action" || name === "strategy" || name === "casual" || name === "driving") {
      list = list.filter(function (g) { return catOf(g) === name; });
    }
    list.sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    filtered = list;
    var q = ($("#searchInput") && $("#searchInput").value || "").trim().toLowerCase();
    render(q ? filtered.filter(function (g) {
      return String(g.name || "").toLowerCase().indexOf(q) !== -1;
    }) : filtered);
    $$("[data-filter]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-filter") === name);
    });
  }

  function searchNow() {
    var q = ($("#searchInput") && $("#searchInput").value || "").trim().toLowerCase();
    var base = filtered.length ? filtered : everything;
    render(q ? base.filter(function (g) {
      return String(g.name || "").toLowerCase().indexOf(q) !== -1;
    }) : base);
  }

  function randomGame() {
    var pool = filtered.length ? filtered : everything;
    if (!pool.length) return;
    var g = pool[Math.floor(Math.random() * pool.length)];
    var slot = $("#randomSlot");
    if (slot) {
      slot.innerHTML = "";
      slot.appendChild(makeTile(g));
    }
  }

  function loadGames() {
    var st = $("#gamesStatus");
    var sources = ["games.json", "./games.json"];
    var i = 0;
    function next() {
      if (i >= sources.length) {
        if (st) {
          st.className = "gx-status err";
          st.textContent = "Could not load games.json";
        }
        return;
      }
      var src = sources[i++];
      fetch(src, { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function (data) {
          everything = Array.isArray(data.games) ? data.games : [];
          everything.forEach(function (g) {
            if (g.category == null && g.catagory != null) g.category = g.catagory;
          });
          filtered = everything.slice();
          updateCounts();
          applyFilter("all");
          if (st) {
            st.className = "gx-status ok";
            st.textContent = "Loaded " + everything.length + " games";
          }
        })
        .catch(function () { next(); });
    }
    next();
  }

  function wireUI() {
    $$("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.getAttribute("data-filter"));
      });
    });
    var input = $("#searchInput");
    if (input) input.addEventListener("input", searchNow);
    var rnd = $("#btnRandom");
    if (rnd) rnd.addEventListener("click", randomGame);

    var open = $("#btnSettings");
    var modal = $("#settingsModal");
    var close = $("#btnCloseSettings");
    if (open && modal) open.addEventListener("click", function () { modal.classList.add("open"); });
    if (close && modal) close.addEventListener("click", function () { modal.classList.remove("open"); });
    if (modal) modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.classList.remove("open");
    });

    $$(".theme-swatch").forEach(function (s) {
      s.addEventListener("click", function () {
        setTheme(s.getAttribute("data-theme"));
      });
    });

    var saveCloak = $("#btnSaveCloak");
    if (saveCloak) {
      saveCloak.addEventListener("click", function () {
        var title = ($("#cloakTitle") && $("#cloakTitle").value) || "";
        var icon = ($("#cloakIcon") && $("#cloakIcon").value) || "";
        if (title) localStorage.setItem("macvg_cloak", title + "|" + icon);
        else localStorage.removeItem("macvg_cloak");
        applyCloak();
      });
    }
    $$("[data-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var map = {
          Google: ["Google", "https://www.google.com/favicon.ico"],
          Canva: ["Home - Canva", "https://www.canva.com/favicon.ico"],
          Classroom: ["Home", "https://ssl.gstatic.com/classroom/favicon.png"]
        };
        var p = map[btn.getAttribute("data-preset")];
        if (!p) return;
        localStorage.setItem("macvg_cloak", p[0] + "|" + p[1]);
        applyCloak();
      });
    });
    var savePanic = $("#btnSavePanic");
    if (savePanic) {
      savePanic.addEventListener("click", function () {
        var k = ($("#panicKey") && $("#panicKey").value) || "`";
        var u = ($("#panicUrl") && $("#panicUrl").value) || "https://www.google.com";
        localStorage.setItem("macvg_panic", k);
        localStorage.setItem("macvg_panic_href", /^https?:/i.test(u) ? u : "https://" + u);
      });
    }
  }

  function boot() {
    setTheme(getTheme());
    applyCloak();
    wirePanic();
    wireUI();
    loadGames();
    if (window.GXParticles) {
      try { GXParticles.start(); } catch (e) { console.warn(e); }
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
