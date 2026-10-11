
/**
 * Xclounkit234X's N3XN x MacVG
 * Dynamic games + Eagler clients loader (relative paths only — no source exposure)
 */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let everything = [];
  let filtered = [];
  let clientsManifest = null;

  /* —— Tab cloak / panic (settings) —— */
  function applyCloak() {
    try {
      const raw = localStorage.getItem("n3xn_title");
      if (!raw) return;
      const parts = raw.split(",");
      const title = parts[0];
      const icon = parts[1];
      const t = document.querySelector(".cloak");
      const f = document.querySelector(".favicon");
      if (t && title) t.textContent = title;
      if (f && icon) {
        f.setAttribute("href", icon);
      }
    } catch (_) {}
  }

  function wirePanic() {
    document.addEventListener("keydown", (e) => {
      const key = localStorage.getItem("n3xn_panic") || "`";
      const href = localStorage.getItem("n3xn_panic_href") || "https://www.google.com";
      if (e.key === key) {
        window.location.href = href;
      }
    });
  }

  /* —— Particles (Seraph-like amber/violet) —— */
  function initParticles() {
    if (typeof particlesJS !== "function") return;
    try {
      particlesJS("particles-js", {
        particles: {
          number: { value: 70, density: { enable: true, value_area: 900 } },
          color: { value: ["#a78bfa", "#f3a847", "#818cf8"] },
          shape: { type: "circle" },
          opacity: { value: 0.35, random: true },
          size: { value: 3, random: true },
          line_linked: {
            enable: true,
            distance: 140,
            color: "#a78bfa",
            opacity: 0.2,
            width: 1,
          },
          move: { enable: true, speed: 1.4, out_mode: "out" },
        },
        interactivity: {
          detect_on: "window",
          events: {
            onhover: { enable: false },
            onclick: { enable: true, mode: "push" },
          },
        },
        retina_detect: true,
      });
    } catch (err) {
      console.warn("[N3XN] particles failed", err);
    }
  }

  /* —— Games —— */
  function catOf(g) {
    return String(g.category || g.catagory || "").toLowerCase();
  }

  function makeGameTile(g) {
    const a = document.createElement("a");
    a.className = "n3xn-tile";
    a.href = "#";
    a.dataset.id = String(g.id);
    const thumb = (g.link || "") + (g.thumb || "");
    if (thumb) {
      a.style.backgroundImage =
        'linear-gradient(transparent 30%, rgba(0,0,0,.88)), url("' +
        thumb.replace(/"/g, '\\"') +
        '")';
    }
    if (g.featured) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = "Featured";
      a.appendChild(b);
    }
    const lab = document.createElement("span");
    lab.className = "label";
    lab.textContent = g.name || "Game";
    a.appendChild(lab);
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const params = new URLSearchParams({ target: String(g.id) });
      window.location.href = "game.html?" + params.toString();
    });
    return a;
  }

  function renderGames(list) {
    const grid = $("#gamesGrid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!list.length) {
      grid.innerHTML = '<div class="n3xn-empty">No games match.</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach((g) => frag.appendChild(makeGameTile(g)));
    grid.appendChild(frag);
  }

  function updateCounts() {
    const c = { all: everything.length, featured: 0, action: 0, strategy: 0, casual: 0, driving: 0, download: 0 };
    everything.forEach((g) => {
      if (g.featured) c.featured++;
      if (g.download) c.download++;
      const k = catOf(g);
      if (c[k] !== undefined) c[k]++;
    });
    const map = {
      all: c.all,
      featured: c.featured,
      action: c.action,
      strategy: c.strategy,
      casual: c.casual,
      driving: c.driving,
      download: c.download,
    };
    $$("[data-filter]").forEach((btn) => {
      const f = btn.getAttribute("data-filter");
      const base = btn.getAttribute("data-label") || f;
      if (map[f] !== undefined) btn.textContent = base + " (" + map[f] + ")";
    });
  }

  function applyFilter(name) {
    let list = everything.slice();
    if (name === "featured") list = list.filter((g) => g.featured);
    else if (name === "download") list = list.filter((g) => g.download);
    else if (name === "action" || name === "strategy" || name === "casual" || name === "driving") {
      list = list.filter((g) => catOf(g) === name);
    }
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    filtered = list;
    renderGames(filtered);
    $$("[data-filter]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-filter") === name));
  }

  function searchGames(q) {
    q = (q || "").trim().toLowerCase();
    const clear = $("#searchClear");
    if (clear) clear.style.display = q ? "block" : "none";
    if (!q) {
      renderGames(filtered.length ? filtered : everything);
      return;
    }
    const src = filtered.length ? filtered : everything;
    const hit = src.filter((g) => String(g.name).toLowerCase().includes(q));
    renderGames(hit);
  }

  function randomGame() {
    const pool = filtered.length ? filtered : everything;
    if (!pool.length) return;
    const g = pool[Math.floor(Math.random() * pool.length)];
    const slot = $("#randomSlot");
    if (slot) {
      slot.innerHTML = "";
      const tile = makeGameTile(g);
      tile.style.maxWidth = "160px";
      slot.appendChild(tile);
    }
  }

  async function loadGames() {
    const status = $("#gamesStatus");
    try {
      const res = await fetch("games.json", { cache: "no-store" });
      if (!res.ok) throw new Error("games.json HTTP " + res.status);
      const data = await res.json();
      everything = Array.isArray(data.games) ? data.games : [];
      everything.forEach((g) => {
        if (g.category == null && g.catagory != null) g.category = g.catagory;
      });
      filtered = everything.slice();
      updateCounts();
      applyFilter("all");
      if (status) {
        status.className = "n3xn-status ok show";
        status.textContent = "Loaded " + everything.length + " games.";
        setTimeout(() => status.classList.remove("show"), 2500);
      }
    } catch (err) {
      console.error("[N3XN] games", err);
      if (status) {
        status.className = "n3xn-status error show";
        status.textContent = "Could not load games library. Check games.json is present.";
      }
      const grid = $("#gamesGrid");
      if (grid) grid.innerHTML = '<div class="n3xn-empty">Games unavailable.</div>';
    }
  }

  /* —— Eagler clients (relative path only) —— */
  function clientUrl(file) {
    const base = (clientsManifest && clientsManifest.basePath) || "e/clients/";
    const clean = String(file || "").replace(/^\/+/, "");
    return base.replace(/\/?$/, "/") + clean;
  }

  function openClient(file, name) {
    const url = clientUrl(file);
    // Probe then open in about:blank shell (no source UI)
    fetch(url, { method: "HEAD", cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        const w = window.open("about:blank", "_blank");
        if (!w) {
          alert("Allow pop-ups, then try again.");
          return;
        }
        w.document.write(
          "<!DOCTYPE html><html><head><meta charset=utf-8><title>" +
            (name || "Client").replace(/</g, "") +
            "</title><style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head><body>" +
            '<iframe src="' +
            url.replace(/"/g, "&quot;") +
            '" allowfullscreen></iframe></body></html>'
        );
        w.document.close();
      })
      .catch((err) => {
        console.error("[N3XN] client", file, err);
        const st = $("#clientsStatus");
        if (st) {
          st.className = "n3xn-status error show";
          st.textContent =
            "Failed to open “" +
            (name || file) +
            "”. File missing under " +
            ((clientsManifest && clientsManifest.basePath) || "e/clients/") +
            " or blocked.";
        }
      });
  }

  function makeClientTile(c) {
    const a = document.createElement("a");
    a.className = "n3xn-tile client-tile";
    a.href = "#";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = c.group || "Client";
    a.appendChild(badge);
    const lab = document.createElement("span");
    lab.className = "label";
    lab.textContent = c.name;
    a.appendChild(lab);
    if (c.desc) {
      const d = document.createElement("span");
      d.className = "desc";
      d.textContent = c.desc;
      a.appendChild(d);
    }
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = "Launch";
    a.appendChild(meta);
    a.addEventListener("click", (e) => {
      e.preventDefault();
      openClient(c.file, c.name);
    });
    return a;
  }

  async function loadClients() {
    const grid = $("#clientsGrid");
    const status = $("#clientsStatus");
    try {
      const res = await fetch("clients.json", { cache: "no-store" });
      if (!res.ok) throw new Error("clients.json HTTP " + res.status);
      clientsManifest = await res.json();
      const list = Array.isArray(clientsManifest.clients) ? clientsManifest.clients : [];
      if (!grid) return;
      grid.innerHTML = "";
      if (!list.length) {
        grid.innerHTML = '<div class="n3xn-empty">No clients listed.</div>';
        return;
      }
      const frag = document.createDocumentFragment();
      list.forEach((c) => frag.appendChild(makeClientTile(c)));
      grid.appendChild(frag);
      if (status) {
        status.className = "n3xn-status ok show";
        status.textContent = list.length + " clients ready.";
        setTimeout(() => status.classList.remove("show"), 2500);
      }
    } catch (err) {
      console.error("[N3XN] clients", err);
      if (status) {
        status.className = "n3xn-status error show";
        status.textContent = "Could not load clients manifest (clients.json).";
      }
      if (grid) grid.innerHTML = '<div class="n3xn-empty">Clients unavailable.</div>';
    }
  }

  /* —— Settings modal —— */
  function wireSettings() {
    const bg = $("#settingsModal");
    const openBtn = $("#btnSettings");
    const closeBtn = $("#btnCloseSettings");
    if (openBtn && bg) openBtn.addEventListener("click", () => bg.classList.add("open"));
    if (closeBtn && bg) closeBtn.addEventListener("click", () => bg.classList.remove("open"));
    if (bg) {
      bg.addEventListener("click", (e) => {
        if (e.target === bg) bg.classList.remove("open");
      });
    }

    const saveCloak = $("#btnSaveCloak");
    if (saveCloak) {
      saveCloak.addEventListener("click", () => {
        const title = ($("#cloakTitle") && $("#cloakTitle").value) || "";
        const icon = ($("#cloakIcon") && $("#cloakIcon").value) || "";
        if (title) localStorage.setItem("n3xn_title", title + "," + icon);
        else localStorage.removeItem("n3xn_title");
        applyCloak();
      });
    }

    const presets = {
      Google: ["Google", "https://www.google.com/favicon.ico"],
      Canva: ["Home - Canva", "https://www.canva.com/favicon.ico"],
      Classroom: ["Home", "https://ssl.gstatic.com/classroom/favicon.png"],
    };
    $$("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = presets[btn.getAttribute("data-preset")];
        if (!p) return;
        localStorage.setItem("n3xn_title", p[0] + "," + p[1]);
        applyCloak();
      });
    });

    const savePanic = $("#btnSavePanic");
    if (savePanic) {
      savePanic.addEventListener("click", () => {
        const k = ($("#panicKey") && $("#panicKey").value) || "`";
        const u = ($("#panicUrl") && $("#panicUrl").value) || "https://www.google.com";
        localStorage.setItem("n3xn_panic", k);
        localStorage.setItem("n3xn_panic_href", u.startsWith("http") ? u : "https://" + u);
      });
    }
  }

  function wireToolbar() {
    $$("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => applyFilter(btn.getAttribute("data-filter")));
    });
    const input = $("#searchInput");
    if (input) input.addEventListener("input", () => searchGames(input.value));
    const clear = $("#searchClear");
    if (clear && input) {
      clear.addEventListener("click", () => {
        input.value = "";
        searchGames("");
        input.focus();
      });
    }
    const rand = $("#btnRandom");
    if (rand) rand.addEventListener("click", randomGame);
  }

  function boot() {
    applyCloak();
    wirePanic();
    wireSettings();
    wireToolbar();
    initParticles();
    loadGames();
    loadClients();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
