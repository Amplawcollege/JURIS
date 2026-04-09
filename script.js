// ─── CONFIG ───────────────────────────────────────────────
const PDF_URL = "magazine.pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

// ─── STATE ────────────────────────────────────────────────
let pdfDoc        = null;
let renderedPages = [];       // cache: { canvas, width, height }
let currentPage   = 1;
let scale         = window.innerWidth < 768 ? 0.8 : 1.2;
let flipInitialized = false;

// ─── DOM REFS ─────────────────────────────────────────────
const flipbook   = document.getElementById("flipbook");
const loadingMsg = document.getElementById("loadingMsg");
const errorMsg   = document.getElementById("errorMsg");
const pageNum    = document.getElementById("page-num");
const rotateMsg  = document.getElementById("rotateMsg");

// ─── LOAD PDF ─────────────────────────────────────────────
pdfjsLib.getDocument(PDF_URL).promise
  .then(async (pdf) => {
    pdfDoc = pdf;
    await renderAllPages(pdf);
    buildFlipbook();
    setTimeout(initFlipbook, 1000);
    loadingMsg.style.display = "none";
  })
  .catch((err) => {
    console.error("PDF load error:", err);
    loadingMsg.style.display = "none";
    errorMsg.style.display   = "block";
  });

// ─── RENDER ALL PAGES (cached) ────────────────────────────
async function renderAllPages(pdf) {
  renderedPages = [];
  flipbook.innerHTML = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page     = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas  = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width  = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width  = "100%";
    canvas.style.height = "auto";

    await page.render({ canvasContext: context, viewport }).promise;

    renderedPages.push({
      canvas: canvas.cloneNode(true),   // store for re-use on zoom
      width:  viewport.width,
      height: viewport.height
    });

    const div = document.createElement("div");
    div.className = "page";
    div.appendChild(canvas);
    flipbook.appendChild(div);
  }
}

// ─── BUILD FLIPBOOK DOM ───────────────────────────────────
function buildFlipbook() {
  flipbook.innerHTML = "";
  renderedPages.forEach(({ canvas }) => {
    const div = document.createElement("div");
    div.className = "page";
    div.appendChild(canvas.cloneNode(true));
    flipbook.appendChild(div);
  });
}

// ─── INIT TURN.JS ─────────────────────────────────────────
function initFlipbook() {
  if (flipInitialized) return;
  const isMobile = window.innerWidth < 768;

  $(flipbook).turn({
    width:    isMobile ? window.innerWidth - 20 : 1000,
    height:   isMobile ? 480 : 650,
    autoCenter: true,
    display:  isMobile ? "single" : "double",
    gradients: true,
    elevation: 50,
    when: {
      turning: function (e, page) {
        currentPage = page;
        pageNum.textContent = "Page " + page + " / " + pdfDoc.numPages;
        playFlipSound();
      }
    }
  });

  flipInitialized = true;
}

// ─── NAVIGATION ───────────────────────────────────────────
function nextPage()  { $(flipbook).turn("next"); }
function prevPage()  { $(flipbook).turn("previous"); }

// ─── SOUND ────────────────────────────────────────────────
function playFlipSound() {
  const sound = document.getElementById("flipSound");
  if (!sound) return;
  sound.currentTime = 0;
  sound.volume = 0.5;
  sound.play().catch(() => {});
}

// ─── ZOOM (no full PDF re-download) ───────────────────────
async function zoomIn()  { await applyZoom(scale + 0.2); }
async function zoomOut() { await applyZoom(Math.max(0.5, scale - 0.2)); }

async function applyZoom(newScale) {
  if (!pdfDoc || newScale === scale) return;
  scale = newScale;

  // Re-render at new scale
  loadingMsg.style.display = "flex";
  if (flipInitialized) {
    $(flipbook).turn("destroy");
    flipInitialized = false;
  }

  await renderAllPages(pdfDoc);
  buildFlipbook();
  setTimeout(() => {
    initFlipbook();
    // Restore page position
    if (currentPage > 1) $(flipbook).turn("page", currentPage);
    loadingMsg.style.display = "none";
  }, 800);
}

// ─── FULLSCREEN ───────────────────────────────────────────
function goFullscreen() {
  if (flipbook.requestFullscreen)       flipbook.requestFullscreen();
  else if (flipbook.webkitRequestFullscreen) flipbook.webkitRequestFullscreen();
}

// ─── SWIPE (MOBILE) ───────────────────────────────────────
let touchStartX = 0;

flipbook.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

flipbook.addEventListener("touchend", (e) => {
  const delta = touchStartX - e.changedTouches[0].clientX;
  if (delta >  50) nextPage();
  if (delta < -50) prevPage();
}, { passive: true });

// ─── ROTATE MESSAGE (portrait mobile) ─────────────────────
function checkOrientation() {
  const isPortraitMobile = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
  rotateMsg.style.display = isPortraitMobile ? "flex" : "none";
}

window.addEventListener("orientationchange", () => {
  setTimeout(checkOrientation, 300);
});
window.addEventListener("resize", checkOrientation);
checkOrientation(); // run on load

// ─── KEYBOARD NAVIGATION ──────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowDown") nextPage();
  if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   prevPage();
});
