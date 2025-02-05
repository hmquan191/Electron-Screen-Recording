const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  Menu,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(createWindow);

// Đóng ứng dụng khi tất cả cửa sổ bị đóng
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Xử lý lấy danh sách màn hình
ipcMain.on("get-video-sources", async (event) => {
  const sources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const menu = Menu.buildFromTemplate(
    sources.map((source) => ({
      label: source.name,
      click: () => event.reply("source-selected", source),
    }))
  );

  menu.popup();
});

// Xử lý lưu video
ipcMain.on("save-video", async (event, arrayBuffer) => {
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `recording-${Date.now()}.webm`,
  });

  if (filePath) {
    // Ghi dữ liệu vào file (ArrayBuffer → Buffer)
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    console.log("Video saved to:", filePath);
  }
});
