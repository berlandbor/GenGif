const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const frames = [];
const framePreview = document.getElementById('frames-list');
const outputGif = document.getElementById('output-gif');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const frameDelay = document.getElementById('frameDelay');
const textOverlay = document.getElementById('textOverlay');

let gifBlob = null;
let maxCanvasWidth = 0;
let maxCanvasHeight = 0;

// 📌 Функция для изменения размера canvas под изображение
function resizeCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "white"; // Фон белый (если нужно, можно убрать)
    ctx.fillRect(0, 0, width, height);
}

// 📌 Исправленная загрузка изображения (с сохранением размеров всех кадров)
document.getElementById('upload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Ошибка: Файл не выбран!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            // Обновляем максимальные размеры
            maxCanvasWidth = Math.max(maxCanvasWidth, img.width);
            maxCanvasHeight = Math.max(maxCanvasHeight, img.height);

            // Меняем размер canvas под новое изображение
            resizeCanvas(maxCanvasWidth, maxCanvasHeight);
            ctx.drawImage(img, (maxCanvasWidth - img.width) / 2, (maxCanvasHeight - img.height) / 2, img.width, img.height);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// 📌 Добавление кадра с текстом (сохранение точного размера)
function addFrame() {
    const text = textOverlay.value.trim();

    // Создаём временный canvas с максимальным размером
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = maxCanvasWidth;
    tempCanvas.height = maxCanvasHeight;
    const tempCtx = tempCanvas.getContext('2d');

    // Заполняем фон белым
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Рисуем изображение по центру
    tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

    if (text) {
        tempCtx.font = "20px Arial";
        tempCtx.fillStyle = "white";
        tempCtx.strokeStyle = "black";
        tempCtx.lineWidth = 3;
        tempCtx.textAlign = "center";
        tempCtx.textBaseline = "bottom";
        tempCtx.strokeText(text, tempCanvas.width / 2, tempCanvas.height - 10);
        tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height - 10);
    }

    frames.push(tempCanvas);

    // Превью кадра
    const img = document.createElement('img');
    img.src = tempCanvas.toDataURL("image/gif");
    framePreview.appendChild(img);
}

// 📌 Генерация GIF с точными размерами (по максимальному кадру)
function generateGIF() {
    if (frames.length === 0) {
        alert('Ошибка: Добавьте хотя бы один кадр!');
        return;
    }

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: maxCanvasWidth, // Теперь GIF создаётся с максимальным размером всех кадров
        height: maxCanvasHeight
    });

    frames.forEach(frame => {
        gif.addFrame(frame, { delay: Number(frameDelay.value) });
    });

    gif.on('finished', function (blob) {
        gifBlob = blob;
        outputGif.src = URL.createObjectURL(blob);
    });

    gif.render();
}

// 📌 Просмотр кадров перед сохранением GIF
let previewIndex = 0;
let previewInterval;

function previewAnimation() {
    if (frames.length === 0) {
        alert("Ошибка: Нет кадров для просмотра!");
        return;
    }

    previewIndex = 0;
    clearInterval(previewInterval);

    previewInterval = setInterval(() => {
        outputGif.src = frames[previewIndex].toDataURL("image/gif");
        previewIndex = (previewIndex + 1) % frames.length;
    }, Number(frameDelay.value));
}

// 📌 Остановка просмотра кадров
function stopPreview() {
    clearInterval(previewInterval);
}

// 📌 Очистка кадров
function clearFrames() {
    frames.length = 0;
    framePreview.innerHTML = '';
    maxCanvasWidth = 0;
    maxCanvasHeight = 0;
    resizeCanvas(300, 300); // Сбрасываем размер на дефолтный
    outputGif.src = "";
    gifBlob = null;
}

// 📌 Сохранение GIF (без ошибок)
function downloadGIF() {
    if (!gifBlob) {
        alert('Ошибка: Сначала создайте GIF!');
        return;
    }

    // Генерируем уникальное имя файла
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `animation_${timestamp}.gif`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(gifBlob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}