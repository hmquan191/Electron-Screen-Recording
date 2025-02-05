const videoSelectBtn = document.getElementById("videoSelectBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const videoElement = document.querySelector("video");

videoSelectBtn.onclick = () => window.electron.send("get-video-sources");
startBtn.onclick = startRecording; // goi ham start
stopBtn.onclick = stopRecording; // goi ham stop

let mediaRecorder;
let recordedChunks = [];

// Nhận màn hình được chọn
window.electron.receive("source-selected", async (source) => {
  console.log("Selected source:", source);
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    videoElement.play();

    // Khởi tạo MediaRecorder
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp9",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = saveVideo;
  } catch (error) {
    console.error("Error accessing screen capture:", error);
  }
});

function startRecording() {
  if (!mediaRecorder) {
    console.error("No mediaRecorder available.");
    return;
  }
  recordedChunks = []; // Reset bộ nhớ video
  mediaRecorder.start();
  startBtn.classList.add("is-loading");
  console.log("Recording started...");
}

function stopRecording() {
  if (!mediaRecorder) {
    console.error("No mediaRecorder available.");
    return;
  }
  mediaRecorder.stop();
  startBtn.classList.remove("is-loading");
  console.log("Recording stopped...");
}

async function saveVideo() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });

  // Chuyển đổi Blob thành ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();

  // Gửi dữ liệu sang Main Process
  window.electron.send("save-video", arrayBuffer);
  console.log("Video data sent to main process.");
}
