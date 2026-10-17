
/* MacVG GX player — ads removed, assets from macvg-games.github.io */
(function () {
  "use strict";

  var ASSET_BASE = "https://macvg-games.github.io";

  function assetUrl(link, thumb) {
    link = link || "";
    thumb = thumb || "";
    if (/^https?:\/\//i.test(thumb)) return thumb;
    if (/^https?:\/\//i.test(link)) return link.replace(/\/?$/, "/") + thumb;
    var path = (String(link).replace(/\/?$/, "/") + thumb).replace(/^\/+/, "");
    return ASSET_BASE + "/" + path;
  }

  function playUrl(link) {
    if (!link) return "";
    if (/^https?:\/\//i.test(link)) return link;
    return ASSET_BASE + (link.charAt(0) === "/" ? link : "/" + link);
  }

  function applyPlayerCloak() {
    try {
      var raw = localStorage.getItem("macvg_cloak") || localStorage.getItem("title") || "";
      if (!raw) return;
      var title, image;
      if (raw.indexOf("|") >= 0) {
        var p = raw.split("|");
        title = p[0];
        image = p[1];
      } else {
        var p2 = raw.split(",");
        title = p2[0];
        image = p2[1];
      }
      if (title) {
        document.title = title;
        var t2 = document.querySelector(".cloak");
        if (t2) t2.textContent = title;
      }
      if (image) {
        var favicon = document.querySelector(".favicon");
        if (favicon) favicon.href = image;
      }
    } catch (e) {}
  }

  applyPlayerCloak();

  document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var gameID = params.get("target");
    if (!gameID) {
      window.location.href = "./";
      return;
    }

    var gameName = document.getElementById("game-name");
    var gameCategory = document.getElementById("game-category");
    var gameRelease = document.getElementById("game-release");
    var gameDeveloper = document.getElementById("game-developer");
    var gamePopularity = document.getElementById("game-popularity");
    var gameGenre = document.getElementById("game-genre");
    var gameBuild = document.getElementById("game-build");
    var gameThumb = document.getElementById("game-thumb");
    var gameDescription = document.getElementById("game-description");
    var gameControls = document.getElementById("game-controls");
    var gameFrame = document.getElementById("game-frame");
    var download = document.getElementById("download");
    var fullScreen = document.getElementById("fullscreen");
    var share = document.getElementById("share");
    var report = document.getElementById("report");
    var star = document.getElementById("star");
    var gameShare = document.getElementById("game-share");
    var gameShareBtn = document.getElementById("game-share-btn");
    var gameframeBox = document.getElementById("gameframe");

    var allGames = [];

    fetch("games.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("games.json HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        allGames = data.games || [];
        var game = null;
        for (var i = 0; i < allGames.length; i++) {
          if (String(allGames[i].id) === String(gameID)) {
            game = allGames[i];
            break;
          }
        }
        if (!game) {
          if (gameName) gameName.textContent = "Game not found";
          return;
        }

        if (gameName) gameName.textContent = game.name || "";
        if (gameCategory) gameCategory.textContent = game.category || game.catagory || "";
        if (gameRelease) gameRelease.textContent = game.releaseDate || "";
        if (gameDeveloper) gameDeveloper.textContent = game.dev || "";
        if (gamePopularity) gamePopularity.textContent = game.popularity || "";
        if (gameGenre) gameGenre.textContent = game.genre || "";
        if (gameBuild) gameBuild.textContent = game.build || "";
        if (gameDescription) gameDescription.textContent = game.about || "";
        if (gameThumb) {
          gameThumb.src = assetUrl(game.link, game.thumb);
          gameThumb.alt = game.name || "";
        }
        if (gameControls) {
          gameControls.innerHTML = "";
          var controls = game.controls || [];
          if (typeof controls === "string") controls = [controls];
          controls.forEach(function (c) {
            var li = document.createElement("li");
            li.textContent = c;
            gameControls.appendChild(li);
          });
        }
        if (gameFrame) {
          gameFrame.src = playUrl(game.link);
        }
        if (!document.title || document.title === "MacVG GX") {
          document.title = (game.name || "Game") + " | MacVG GX";
        }

        if (download) {
          if (game.download) {
            download.style.display = "";
            download.onclick = function () {
              window.open(ASSET_BASE + "/zips/game" + gameID + ".zip", "_blank");
            };
          } else {
            download.style.display = "none";
          }
        }
      })
      .catch(function (err) {
        console.error(err);
        if (gameName) gameName.textContent = "Failed to load game data";
      });

    if (fullScreen && gameframeBox) {
      fullScreen.addEventListener("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (gameframeBox.requestFullscreen) {
          gameframeBox.requestFullscreen();
        } else if (gameFrame && gameFrame.requestFullscreen) {
          gameFrame.requestFullscreen();
        }
      });
    }

    if (share) {
      share.addEventListener("click", function () {
        try {
          navigator.clipboard.writeText(window.location.href);
        } catch (e) {}
        if (gameShare) gameShare.classList.remove("none");
      });
    }
    if (gameShareBtn && gameShare) {
      gameShareBtn.addEventListener("click", function () {
        gameShare.classList.add("none");
      });
    }
    if (report) {
      report.addEventListener("click", function () {
        window.open("https://forms.gle/vKN71eKeMNGiswUY7", "_blank");
      });
    }

    var favRaw = localStorage.getItem("favorites");
    var favoritesArray = favRaw ? favRaw.split(",").filter(Boolean) : [];
    if (star) {
      if (favoritesArray.indexOf(String(gameID)) !== -1) {
        star.style.opacity = "1";
        star.title = "Unfavorite";
      }
      star.addEventListener("click", function () {
        var id = String(gameID);
        var idx = favoritesArray.indexOf(id);
        if (idx === -1) {
          favoritesArray.push(id);
          star.title = "Unfavorite";
        } else {
          favoritesArray.splice(idx, 1);
          star.title = "Favorite";
        }
        localStorage.setItem("favorites", favoritesArray.join(","));
      });
    }

    try {
      var eRecent = localStorage.getItem("macvgRecents");
      var recentArray = eRecent ? eRecent.split(",").filter(Boolean) : [];
      if (recentArray.indexOf(String(gameID)) === -1) {
        recentArray.push(String(gameID));
        localStorage.setItem("macvgRecents", recentArray.join(","));
      }
    } catch (e) {}

    if (gameFrame) {
      gameFrame.addEventListener("load", function () {
        try {
          gameFrame.contentWindow.focus();
        } catch (e) {}
      });
    }
  });
})();
