const url = "magazine.pdf";

// ✅ ADD THIS LINE (IMPORTANT FIX)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

document.getElementById("downloadBtn").href = url;

let pdfDoc = null;
let scale = 1.3;
let flipInitialized = false;

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
    }

    initFlipbook();
});

function initFlipbook() {
    if (flipInitialized) return;

    $('#flipbook').turn({
        width: 1000,
        height: 650,
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

function nextPage() {
    $('#flipbook').turn('next');
}

function prevPage() {
    $('#flipbook').turn('previous');
}

function playFlipSound() {
    let sound = document.getElementById("flipSound");
    if (!sound) return;

    sound.currentTime = 0;
    sound.volume = 0.5;

    sound.play().catch(() => {});
}

// ZOOM FIX (safe reload)
function zoomIn() {
    scale += 0.2;
    reloadViewer();
}

function zoomOut() {
    scale = Math.max(0.6, scale - 0.2);
    reloadViewer();
}

function reloadViewer() {
    document.getElementById("flipbook").innerHTML = "";
    flipInitialized = false;

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
        }

        initFlipbook();
    });
}

// FULLSCREEN
function goFullscreen() {
    let elem = document.getElementById("flipbook");
    if (elem.requestFullscreen) elem.requestFullscreen();
}

// 📱 MOBILE SWIPE (SMOOTH FIX)
let startX = 0;

document.getElementById("flipbook").addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
});

document.getElementById("flipbook").addEventListener("touchend", e => {
    let endX = e.changedTouches[0].clientX;

    if (startX - endX > 50) nextPage();
    if (endX - startX > 50) prevPage();
});
