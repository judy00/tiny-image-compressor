const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

let mainWindow;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('select-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }
        ]
    });
    return result.filePaths;
});

async function processImage(filePath, outputPath, width) {
    const fileName = path.basename(filePath);
    const outputFilePath = path.join(outputPath, `${path.parse(fileName).name}.webp`);

    await sharp(filePath)
        .resize(width, null, {
            fit: 'inside',
            withoutEnlargement: true,
            kernel: 'lanczos3'
        })
        .webp({
            quality: 100,
            effort: 6,
            lossless: false
        })
        .toFile(outputFilePath);

    return outputFilePath;
}

// 處理電腦版圖片
ipcMain.handle('process-desktop-images', async (event, files) => {
    const results = [];

    for (const filePath of files) {
        try {
            const dirPath = path.dirname(filePath);
            const fileName = path.basename(filePath);

            // 建立電腦版輸出目錄
            const outputPath = path.join(dirPath, '電腦版壓縮圖');
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }

            // 處理電腦版圖片 (1000px)
            const outputFilePath = await processImage(filePath, outputPath, 1000);

            results.push({
                success: true,
                file: fileName,
                outputPath: outputFilePath
            });
        } catch (error) {
            results.push({
                success: false,
                file: path.basename(filePath),
                error: error.message
            });
        }
    }

    return results;
});

// 處理手機版圖片
ipcMain.handle('process-mobile-images', async (event, files) => {
    const results = [];

    for (const filePath of files) {
        try {
            const dirPath = path.dirname(filePath);
            const fileName = path.basename(filePath);

            // 建立手機版輸出目錄
            const outputPath = path.join(dirPath, '手機版壓縮圖');
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }

            // 處理手機版圖片 (700px)
            const outputFilePath = await processImage(filePath, outputPath, 700);

            results.push({
                success: true,
                file: fileName,
                outputPath: outputFilePath
            });
        } catch (error) {
            results.push({
                success: false,
                file: path.basename(filePath),
                error: error.message
            });
        }
    }

    return results;
});
