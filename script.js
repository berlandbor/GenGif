const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const frames = [];
const framePreview = document.getElementById('frames-list');
const outputGif = document.getElementById('output-gif');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const frameDelay = document.getElementById('frameDelay');
const textOverlay = document.getElementById('textOverlay');

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Настройки рисования
let drawing = false;
ctx.lineCap = 'round';

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mousemove', (event) => {
    if (!drawing) return;
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
    ctx.lineTo(event.offsetX + 1, event.offsetY + 1);
    ctx.stroke();
});

// 📌 Исправленная загрузка изображения (без искажений)
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Вычисляем соотношение сторон
            const aspectRatio = img.width / img.height;
            let newWidth = canvas.width;
            let newHeight = canvas.height;

            if (aspectRatio > 1) {
                newHeight = canvas.width / aspectRatio;
            } else {
                newWidth = canvas.height * aspectRatio;
            }

            const xOffset = (canvas.width - newWidth) / 2;
            const yOffset = (canvas.height - newHeight) / 2;

            ctx.drawImage(img, xOffset, yOffset, newWidth, newHeight);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// 📌 Добавление кадра с текстом и пропорциями
function addFrame() {
    const text = textOverlay.value.trim();

    // Создаём временный canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(canvas, 0, 0);

    if (text) {
        tempCtx.font = "20px Arial";
        tempCtx.fillStyle = "white";
        tempCtx.strokeStyle = "black";
        tempCtx.lineWidth = 3;
        tempCtx.textAlign = "center";
        tempCtx.textBaseline = "bottom";

        tempCtx.strokeText(text, canvas.width / 2, canvas.height - 10);
        tempCtx.fillText(text, canvas.width / 2, canvas.height - 10);
    }

    const frameData = tempCanvas.toDataURL("image/png", 0.8);
    frames.push(frameData);

    const img = document.createElement('img');
    img.src = frameData;
    framePreview.appendChild(img);
}

// 📌 Генерация GIF с контролем размера и сжатием
function generateGIF() {
    if (frames.length === 0) {
        alert('Ошибка: Добавьте хотя бы один кадр!');
        return;
    }

    const gif = new GIF({
        workers: 2,
        quality: 5,
        width: canvas.width,
        height: canvas.height
    });

    frames.forEach(frame => {
        const img = new Image();
        img.src = frame;
        gif.addFrame(img, { delay: Number(frameDelay.value) });
    });

    gif.on('finished', function (blob) {
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
        outputGif.src = frames[previewIndex];
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
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    outputGif.src = "";
}

// 📌 Сохранение GIF
function downloadGIF() {
    if (!outputGif.src) {
        alert('Ошибка: Сначала создайте GIF!');
        return;
    }

    const link = document.createElement('a');
    link.href = outputGif.src;
    link.download = 'animation.gif';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}