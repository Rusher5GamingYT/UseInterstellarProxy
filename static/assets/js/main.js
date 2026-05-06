// Theme is applied immediately, to prevent flashing on page load
(() => {
  const themeid = localStorage.getItem("theme");
  const themes = {
    catppuccinMocha: "/assets/css/themes/catppuccin/mocha.css",
    catppuccinMacchiato: "/assets/css/themes/catppuccin/macchiato.css",
    catppuccinFrappe: "/assets/css/themes/catppuccin/frappe.css",
    catppuccinLatte: "/assets/css/themes/catppuccin/latte.css",
    Inverted: "/assets/css/themes/colors/inverted.css",
    sky: "/assets/css/themes/colors/sky.css",
  };

  if (themes[themeid]) {
    const themeLink = document.createElement("link");
    themeLink.rel = "stylesheet";
    themeLink.href = themes[themeid];
    document.head.appendChild(themeLink);
  } else {
    const customThemeCss = localStorage.getItem(`theme-${themeid}`);
    if (customThemeCss) {
      const customThemeStyle = document.createElement("style");
      customThemeStyle.textContent = customThemeCss;
      document.head.appendChild(customThemeStyle);
    }
  }

  const PROXY_KEY = "proxy";
  const ALLOWED = ["uv", "sj", "dy"];
  const DEFAULT = "uv";

  function initProxy() {
    const current = localStorage.getItem(PROXY_KEY);
    if (current === null) {
      localStorage.setItem(PROXY_KEY, DEFAULT);
      return DEFAULT;
    }
    if (ALLOWED.includes(current)) {
      return current;
    }
    localStorage.setItem(PROXY_KEY, DEFAULT);
    return DEFAULT;
  }

  window.resolveProxyChoice = initProxy;
  window.resolveProxyChoice();
})();

let isInTabMode;

try {
  isInTabMode = window.top.location.pathname === "/tabs";
} catch {
  try {
    isInTabMode = window.parent.location.pathname === "/tabs";
  } catch {
    isInTabMode = false;
  }
}

function reconstructSafeUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = new URL(raw);
    const allowed = ["https:", "http:", "data:"];
    if (!allowed.includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    if (typeof raw === "string" && !raw.includes(":")) return raw;
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const blockedHostnames = ["gointerstellar.app"];

  if (!blockedHostnames.includes(window.location.hostname)) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = `(()=>{const k="p",d=15e4,s=()=>{let t=localStorage.getItem(k);return !t||Date.now()-t>d},m=()=>localStorage.setItem(k,Date.now());function h(){if(!s())return;window.open("https://undercoverhiking.com/cn4ai6dv?key=4d729d45e2fde8ef6d2caccfe564d6be","_blank");m();document.removeEventListener("click",h)}s()&&document.addEventListener("click",h,{once:1})})();`;
    document.body.appendChild(script);
  }

  const nav = document.querySelector(".nav-bar");

  if (nav) {
    const themeId = localStorage.getItem("theme");
    let LogoUrl = "/assets/media/favicon/main.png";
    if (themeId === "Inverted") {
      LogoUrl = "/assets/media/favicon/main-inverted.png";
    }
    const html = `
      <div id="icon-container">
        <a class="icon" href="/./"><img alt="nav" id="INImg" src="${LogoUrl}"/></a>
      </div>
      <div class="nav-bar-right">
        <a class="navbar-link" href="/./games"><i class="fa-solid fa-gamepad navbar-icon"></i><an>&#71;&#97;</an><an>&#109;&#101;&#115;</an></a>
        <a class="navbar-link" href="/./apps"><i class="fa-solid fa-phone navbar-icon"></i><an>&#65;&#112;</an><an>&#112;&#115;</an></a>
        <a class="navbar-link" href="/./settings"><i class="fa-solid fa-gear navbar-icon settings-icon"></i><an>&#83;&#101;&#116;</an><an>&#116;&#105;&#110;&#103;</an></a>
      </div>`;
    nav.innerHTML = html;
  }

  // Favicon and Name Logic
  const icon = document.getElementById("tab-favicon");
  const title = document.getElementById("t");
  const cloakName = localStorage.getItem("CustomName") || localStorage.getItem("name");
  const cloakIcon = localStorage.getItem("CustomIcon") || localStorage.getItem("icon");
  if (cloakName) title.textContent = cloakName;
  if (cloakIcon) {
    const safeIcon = reconstructSafeUrl(cloakIcon);
    if (safeIcon) icon.setAttribute("href", safeIcon);
  }

  // Event Key Logic
  const eventKey = JSON.parse(localStorage.getItem("eventKey")) || ["`"];
  const rawPLink = localStorage.getItem("pLink") || "https://classroom.google.com/";
  const safePLink = reconstructSafeUrl(rawPLink) ?? "https://classroom.google.com/";

  const panicAnchor = document.createElement("a");
  panicAnchor.href = safePLink;
  panicAnchor.style.display = "none";
  document.body.appendChild(panicAnchor);

  let pressedKeys = [];
  document.addEventListener("keydown", event => {
    pressedKeys.push(event.key);
    const recentKeys = pressedKeys.slice(-eventKey.length);
    if (recentKeys.length === eventKey.length && eventKey.every((key, i) => key === recentKeys[i])) {
      panicAnchor.click();
      pressedKeys = [];
    }
  });

  // Background Image Logic
  const savedBackgroundImage = localStorage.getItem("backgroundImage");
  if (savedBackgroundImage === "none") {
    document.body.style.backgroundImage = "none";
  } else if (savedBackgroundImage) {
    document.body.style.backgroundImage = `url('${savedBackgroundImage}')`;
  }

  // Background Particles
  if (localStorage.getItem("particles") === "true") {
    // CSS Parallax Pixel Stars (based on codepen.io/sarazond/pen/LYGbwj)
    ["stars", "stars2", "stars3"].forEach(id => {
      if (!document.getElementById(id)) {
        const el = document.createElement("div");
        el.id = id;
        document.body.insertBefore(el, document.body.firstChild);
      }
    });
  }

  // Pointer Effects
  if (localStorage.getItem("pointer") === "rainbow-stars") {
    // Rainbow Star Particles (based on codepen.io/tommyho/pen/ZEmjWGY)
    if (!document.getElementById("pointer-canvas")) {
      const canvas = document.createElement("canvas");
      canvas.id = "pointer-canvas";
      document.body.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const bNum = 3;
      const bSize = 8;
      const bSpeed = 6;
      const bDep = 0.1;
      const bDist = 30;
      const bStarVar = 2;
      const bHue = 4;

      let spots = [];
      let hue = 0;
      const mouse = { x: undefined, y: undefined };

      window.addEventListener("mousemove", e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        for (let i = 0; i < bNum; i++) spots.push(new Particle());
      });

      window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });

      class Particle {
        constructor() {
          this.x = mouse.x;
          this.y = mouse.y;
          this.size = Math.random() * bSize + 0.1;
          this.speedX = Math.random() * bSpeed - bSpeed / 2;
          this.speedY = Math.random() * bSpeed - bSpeed / 2;
          this.points = Math.floor(Math.random() * bStarVar) + 5;
          this.radius = Math.random() * bSize + 0.1;
          this.color = "hsl(" + bHue * hue + ", 100%, 50%)";
        }
        draw() {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          star(this.x, this.y, this.radius * 2, this.radius, this.points);
          ctx.fill();
        }
        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          if (this.size > bDep) this.size -= bDep;
        }
      }

      function star(x, y, radius1, radius2, npoints) {
        const angle = (2 * Math.PI) / npoints;
        const halfAngle = angle / 2;
        ctx.moveTo(x + Math.cos(halfAngle) * radius1, y + Math.sin(halfAngle) * radius1);
        for (let a = 0; a <= 2 * Math.PI; a += angle) {
          ctx.lineTo(x + Math.cos(a) * radius2, y + Math.sin(a) * radius2);
          ctx.lineTo(x + Math.cos(a + halfAngle) * radius1, y + Math.sin(a + halfAngle) * radius1);
        }
      }

      function handleParticles() {
        for (let i = 0; i < spots.length; i++) {
          spots[i].update();
          spots[i].draw();
          for (let j = i; j < spots.length; j++) {
            const dx = spots[i].x - spots[j].x;
            const dy = spots[i].y - spots[j].y;
            if (Math.sqrt(dx * dx + dy * dy) < bDist) {
              ctx.beginPath();
              ctx.strokeStyle = spots[i].color;
              ctx.lineWidth = spots[i].size / 3;
              ctx.moveTo(spots[i].x, spots[i].y);
              ctx.bezierCurveTo(spots[j].x, spots[j].y, spots[j].x, spots[i].y, spots[j].x, spots[j].y);
              ctx.stroke();
            }
          }
          if (spots[i].size <= bDep) {
            spots.splice(i, 1);
            i--;
          }
        }
        hue++;
      }

      (function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        handleParticles();
        requestAnimationFrame(animate);
      })();
    }
  } else if (localStorage.getItem("pointer") === "white-orbs") {
    // White Orb Particles (based on codepen.io/gabezink17-cmd/pen/WbGmeyR)
    if (!document.getElementById("pointer-canvas")) {
      const canvas = document.createElement("canvas");
      canvas.id = "pointer-canvas";
      document.body.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
      let particles = [];

      class OrbParticle {
        constructor(x, y) {
          this.x = x;
          this.y = y;
          this.vx = (Math.random() - 0.5) * 4;
          this.vy = (Math.random() - 0.5) * 4;
          this.size = Math.random() * 3 + 1;
          this.life = 100;
        }
        update() {
          this.vx += (mouse.x - this.x) * 0.0005;
          this.vy += (mouse.y - this.y) * 0.0005;
          this.x += this.vx;
          this.y += this.vy;
          this.vx *= 0.96;
          this.vy *= 0.96;
          this.life -= 1;
        }
        draw() {
          ctx.fillStyle = "white";
          ctx.globalAlpha = this.life / 100;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      function spawn(x, y, n = 10) {
        for (let i = 0; i < n; i++) particles.push(new OrbParticle(x, y));
      }

      window.addEventListener("mousemove", e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        spawn(mouse.x, mouse.y, 1);
      });

      window.addEventListener("click", e => spawn(e.clientX, e.clientY, 40));

      window.addEventListener("mousedown", () => {
        for (let i = 0; i < 50; i++) spawn(mouse.x, mouse.y, 1);
      });

      window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });

      (function animate() {
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
          p.update();
          p.draw();
          if (p.life <= 0) particles.splice(i, 1);
        });
        requestAnimationFrame(animate);
      })();
    }
  } else if (localStorage.getItem("pointer") === "rainbow-trail") {
    // Rainbow Trail Particles (based on codepen.io/Jiironimo/pen/vEXbVNP)
    if (!document.getElementById("pointer-canvas")) {
      const cursorDot = document.createElement("div");
      cursorDot.id = "rainbow-trail-cursor";
      cursorDot.style.visibility = "hidden";
      document.body.appendChild(cursorDot);
      document.body.classList.add("rainbow-trail-cursor");

      const canvas = document.createElement("canvas");
      canvas.id = "pointer-canvas";
      document.body.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      let W = canvas.width;
      let H = canvas.height;
      let mx = null;
      let my = null;
      let clicking = false;
      let hue = 0;
      const particles = [];

      window.addEventListener("resize", () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
      });

      window.addEventListener("mousemove", e => {
        mx = e.clientX;
        my = e.clientY;
        cursorDot.style.left = mx + "px";
        cursorDot.style.top = my + "px";
        cursorDot.style.visibility = "visible";
      });

      window.addEventListener("mousedown", () => (clicking = true));
      window.addEventListener("mouseup", () => (clicking = false));

      class RainbowTrailParticle {
        constructor(x, y, isClicking) {
          this.x = x + (Math.random() - 0.5) * (isClicking ? 18 : 4);
          this.y = y + (Math.random() - 0.5) * (isClicking ? 18 : 4);

          const speed = isClicking ? 1.5 + Math.random() * 3.5 : 0.4 + Math.random() * 1.2;
          const angle = Math.random() * Math.PI * 2;

          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed - (isClicking ? 0 : 0.5);
          this.life = 1;
          this.decay = isClicking ? 0.018 + Math.random() * 0.025 : 0.012 + Math.random() * 0.018;
          this.size = isClicking ? 3 + Math.random() * 7 : 1.5 + Math.random() * 3.5;
          this.hue = hue + (Math.random() - 0.5) * 40;
          this.sat = 80 + Math.random() * 20;
          this.lit = 55 + Math.random() * 25;
          this.shape = isClicking ? Math.floor(Math.random() * 3) : 0;
          this.rot = Math.random() * Math.PI * 2;
          this.rotSpd = (Math.random() - 0.5) * 0.2;
        }

        update() {
          this.x += this.vx;
          this.y += this.vy;
          this.vy += 0.04;
          this.vx *= 0.98;
          this.life -= this.decay;
          this.rot += this.rotSpd;
          this.size *= 0.992;
        }

        draw() {
          if (this.life <= 0) return;
          ctx.save();
          ctx.globalAlpha = Math.max(0, this.life * this.life);
          ctx.fillStyle = `hsl(${this.hue},${this.sat}%,${this.lit}%)`;
          ctx.shadowColor = `hsl(${this.hue},${this.sat}%,${this.lit}%)`;
          ctx.shadowBlur = this.size * 3;
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rot);

          if (this.shape === 1) {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
          } else if (this.shape === 2) {
            ctx.beginPath();
            const r1 = this.size,
              r2 = this.size * 0.4,
              pts = 4;
            for (let i = 0; i < pts * 2; i++) {
              const r = i % 2 === 0 ? r1 : r2;
              const ang = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
              i === 0 ? ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r) : ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      function spawnTrail() {
        if (mx === null || my === null) return;
        const count = clicking ? 6 : 2;
        for (let i = 0; i < count; i++) {
          particles.push(new RainbowTrailParticle(mx, my, clicking));
        }
      }

      (function loop() {
        requestAnimationFrame(loop);
        ctx.clearRect(0, 0, W, H);

        hue = (hue + 0.8) % 360;
        spawnTrail();

        for (let i = particles.length - 1; i >= 0; i--) {
          particles[i].update();
          particles[i].draw();
          if (particles[i].life <= 0 || particles[i].size < 0.3) {
            particles.splice(i, 1);
          }
        }
      })();
    }
  } else if (localStorage.getItem("pointer") === "blue-orbs") {
    // Blue Orbs cursor effect (based on codepen.io/perror12/pen/JoRwZwg )
    if (!document.getElementById("blue-orbs-glow")) {
      document.body.classList.add("blue-orbs-cursor");

      const glow = document.createElement("div");
      glow.id = "blue-orbs-glow";
      glow.className = "cursor-glow";
      document.body.appendChild(glow);

      const core = document.createElement("div");
      core.id = "blue-orbs-core";
      core.className = "cursor-core";
      document.body.appendChild(core);

      let mouseX = null;
      let mouseY = null;
      let glowX = 0;
      let glowY = 0;
      let lastX = 0;
      let lastY = 0;

      function createTrail(x, y, speed) {
        const trail = document.createElement("div");
        trail.className = "orb-trail";
        const size = Math.max(18, Math.min(60, 20 + speed * 0.35));
        trail.style.width = `${size}px`;
        trail.style.height = `${size}px`;
        trail.style.left = `${x}px`;
        trail.style.top = `${y}px`;
        trail.style.animationDuration = `${0.5 + Math.random() * 0.35}s`;
        document.body.appendChild(trail);
        setTimeout(() => trail.remove(), 900);
      }

      function createSpark(x, y) {
        const spark = document.createElement("div");
        spark.className = "orb-spark";
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.setProperty("--dx", `${(Math.random() - 0.5) * 80}px`);
        spark.style.setProperty("--dy", `${(Math.random() - 0.5) * 80}px`);
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 850);
      }

      window.addEventListener("mousemove", e => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (core.style.visibility !== "visible") {
          core.style.visibility = "visible";
          glow.style.visibility = "visible";
          glowX = mouseX;
          glowY = mouseY;
          lastX = mouseX;
          lastY = mouseY;
        }

        const dx = mouseX - lastX;
        const dy = mouseY - lastY;
        const speed = Math.sqrt(dx * dx + dy * dy);

        core.style.left = `${mouseX}px`;
        core.style.top = `${mouseY}px`;

        createTrail(mouseX, mouseY, speed);
        if (speed > 25) {
          createSpark(mouseX, mouseY);
          createSpark(mouseX, mouseY);
        }

        lastX = mouseX;
        lastY = mouseY;
      });

      window.addEventListener("mousedown", () => {
        core.style.transform = "translate(-50%, -50%) scale(1.8)";
        glow.style.transform = "translate(-50%, -50%) scale(1.2)";
      });

      window.addEventListener("mouseup", () => {
        core.style.transform = "translate(-50%, -50%) scale(1)";
        glow.style.transform = "translate(-50%, -50%) scale(1)";
      });

      (function animateGlow() {
        if (mouseX !== null) {
          glowX += (mouseX - glowX) * 0.15;
          glowY += (mouseY - glowY) * 0.15;
          glow.style.left = `${glowX}px`;
          glow.style.top = `${glowY}px`;
        }
        requestAnimationFrame(animateGlow);
      })();
    }
  }
});
