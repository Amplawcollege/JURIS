// ✅ PDF FILE (LOCAL)
const url = "magazine.pdf";

// ✅ PDF WORKER FIX
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

// ✅ RESPONSIVE SCALE
let scale = window.innerWidth < 768 ? 0.8 : 1.2;

let pdfDoc = null;
let flipInitialized = false;

// ✅ LOAD PDF
pdfjsLib.getDocument(url).promise.then(async function(pdf) {
    pdfDoc = pdf;

    const container = document.getElementById("flipbook");
    container.innerHTML = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        let page = await pdf.getPage(i);
        let viewport = page.getViewport({ scale: scale });

        let div = document.createElement("div");
        div.className = "page";

        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        div.appendChild(canvas);
        container.appendChild(div);

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // ✅ LAST PAGE → INIT FLIPBOOK
        if (i === pdf.numPages) {
            setTimeout(() => {
                initFlipbook();
                hideLoader();
            }, 500);
        }
    }
});

// ✅ INIT FLIPBOOK
function initFlipbook() {
    if (flipInitialized) return;

    $('#flipbook').turn({
        width: window.innerWidth < 768 ? 350 : 1000,
        height: window.innerWidth < 768 ? 500 : 650,
        autoCenter: true,
        gradients: true,
        elevation: 50,
        when: {
            turning: function(e, page) {
                document.getElementById("page-num").innerText = "Page " + page;
                playFlipSound();
            }
        }
    });

    flipInitialized = true;
}

// ✅ NEXT / PREV
function nextPage() {
    $('#flipbook').turn('next');
}

function prevPage() {
    $('#flipbook').turn('previous');
}

// ✅ SOUND EFFECT
function playFlipSound() {
    let sound = document.getElementById("flipSound");
    if (!sound) return;

    sound.currentTime = 0;
    sound.volume = 0.5;
    sound.play().catch(() => {});
}

// ✅ ZOOM
function zoomIn() {
    scale += 0.2;
    reloadViewer();
}

function zoomOut() {
    scale = Math.max(0.6, scale - 0.2);
    reloadViewer();
}

// ✅ RELOAD PDF
function reloadViewer() {
    flipInitialized = false;
    document.getElementById("flipbook").innerHTML = "";

    pdfjsLib.getDocument(url).promise.then(async function(pdf) {
        pdfDoc = pdf;

        for (let i = 1; i <= pdf.numPages; i++) {
            let page = await pdf.getPage(i);
            let viewport = page.getViewport({ scale: scale });

            let div = document.createElement("div");
            div.className = "page";

            let canvas = document.createElement("canvas");
            let context = canvas.getContext("2d");

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            div.appendChild(canvas);
            document.getElementById("flipbook").appendChild(div);

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            if (i === pdf.numPages) {
                setTimeout(() => {
                    initFlipbook();
                }, 500);
            }
        }
    });
}

// ✅ FULLSCREEN
function goFullscreen() {
    let elem = document.getElementById("flipbook");
    if (elem.requestFullscreen) elem.requestFullscreen();
}

// ✅ MOBILE SWIPE
let startX = 0;

document.getElementById("flipbook").addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
});

document.getElementById("flipbook").addEventListener("touchend", e => {
    let endX = e.changedTouches[0].clientX;

    if (startX - endX > 50) nextPage();
    if (endX - startX > 50) prevPage();
});

// ✅ LANDSCAPE MODE CHECK
function checkOrientation() {
    if (window.innerHeight > window.innerWidth) {
        document.getElementById("rotateMsg").style.display = "flex";
        document.getElementById("flipbook").style.display = "none";
    } else {
        document.getElementById("rotateMsg").style.display = "none";
        document.getElementById("flipbook").style.display = "block";
    }
}

window.addEventListener("load", checkOrientation);
window.addEventListener("resize", checkOrientation);

// ✅ LOADER HIDE
function hideLoader() {
    let loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
}
