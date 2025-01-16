const beep = new Audio("assets/audio/success-sound.mp3");
const scanTypeSelect = document.getElementById("scan-type");
const startButton = document.getElementById("start-scan");
const stopButton = document.getElementById("stop-scan");
const cameraSelect = document.getElementById("camera-select");
const readerElement = document.getElementById("reader");
const barcodeScanner = document.getElementById("barcode-scanner");
const resultElement = document.getElementById("result");
const inputField = document.getElementById("input-string");
const statusIcon = document.getElementById("status-icon");

let reader; // Html5Qrcode instance for QR scanning
let selectedCameraId = null; // ID of the selected camera

// Populate camera options
Html5Qrcode.getCameras()
  .then((cameras) => {
    if (cameras && cameras.length > 0) {
      cameras.forEach((camera) => {
        const option = document.createElement("option");
        option.value = camera.id;
        option.text = camera.label || `Camera ${camera.id}`;
        cameraSelect.appendChild(option);
      });

      selectedCameraId = cameras[0].id; // Default to the first camera
      cameraSelect.addEventListener("change", () => {
        stopScanning();
        selectedCameraId = cameraSelect.value;
      });
    } else {
      alert("No cameras found on this device.");
    }
  })
  .catch((err) => console.error("Error fetching cameras:", err));

// Start scanning based on the selected scan type
async function startScanning() {
  const scanType = scanTypeSelect.value;

  if (scanType === "qrcode") {
    startQrCodeScanning();
  } else if (scanType === "barcode") {
    startBarcodeScanning();
  }
}

// Start QR code scanning
async function startQrCodeScanning() {
  try {
    reader = new Html5Qrcode("reader");
    readerElement.style.display = "block";
    barcodeScanner.style.display = "none";

    const config = {
      fps: 10,
    };

    await reader.start(
      { deviceId: { exact: selectedCameraId } },
      config,
      onScanSuccess,
      onScanError
    );
  } catch (error) {
    // console.error("Error starting QR scanner:", error);
  }
}

// Start Barcode scanning
function startBarcodeScanning() {
  readerElement.style.display = "none";
  barcodeScanner.style.display = "block";

  Quagga.init(
    {
      inputStream: {
        type: "LiveStream",
        target: barcodeScanner,
        constraints: {
          deviceId: selectedCameraId,
        },
      },
      decoder: {
        readers: ["code_128_reader", "ean_reader", "upc_reader"],
      },
    },
    (err) => {
      if (err) {
        //     console.error("Error initializing Quagga:", err);
        return;
      }
      Quagga.start();
    }
  );

  Quagga.onDetected((data) => {
    const decodedText = data.codeResult.code;
    onScanSuccess(decodedText);
  });
}

// Stop scanning
async function stopScanning() {
  try {
    if (reader) {
      await reader.stop();
      readerElement.style.display = "none";
    }
    Quagga.stop();
    barcodeScanner.style.display = "none";
  } catch (error) {
    //       console.error("Error stopping scanner:", error);
  }
}

// Handle successful scan
function onScanSuccess(decodedText) {
  resultElement.textContent = decodedText;
  //  console.log("Scanned Result:", decodedText);

  beep.play();

  if (decodedText === inputField.value) {
    statusIcon.textContent = "✔ Match";
    statusIcon.className = "status-icon match";
  } else {
    statusIcon.textContent = "✘ No-Match";
    statusIcon.className = "status-icon nomatch";
  }

  stopScanning();
}

// Handle scanning errors or no result
function onScanError(errorMessage) {
  //  console.warn("Scan error:", errorMessage);
}

// Event listeners for buttons
startButton.addEventListener("click", () => {
  resultElement.textContent = "None";
  statusIcon.textContent = "";
  startScanning();
});

stopButton.addEventListener("click", () => stopScanning());
