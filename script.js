const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const frames = [];
const framePreview = document.getElementById('frames-list');
const outputGif = document.getElementById('output-gif');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const frameDelay = document.getElementById('frameDelay');
const textOverlay = document.getElementById('textOverlay');

let gifBlob = null; // Переменная для хранения готового GIF

// Устанавливаем белый фон
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

// 📌 Исправленная загрузка изображения (без обрезки и растяжения)
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
            // Динамически изменяем размер canvas
            const maxWidth = 400; // Максимальная ширина canvas
            const maxHeight = 400; // Максимальная высота canvas
            let newWidth = img.width;
            let newHeight = img.height;

            // Масштабируем изображение, если оно больше maxWidth/maxHeight
            if (newWidth > maxWidth || newHeight > maxHeight) {
                const scale = Math.min(maxWidth / newWidth, maxHeight / newHeight);
                newWidth *= scale;
                newHeight *= scale;
            }

            // Изменяем размер canvas под изображение
            canvas.width = newWidth;
            canvas.height = newHeight;

            // Заполняем фон белым цветом (чтобы не было прозрачности)
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Отрисовываем изображение в центр canvas
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// 📌 Добавление кадра с текстом и сохранением размеров
function addFrame() {
    const text = textOverlay.value.trim();

    // Создаём временный canvas с размерами основного
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(canvas, 0, 0);

    if (text) {
        tempCtx.font = "10px Georgia";
        tempCtx.fillStyle = "white";
        tempCtx.strokeStyle = "black";
        tempCtx.lineWidth = 3;
        tempCtx.textAlign = "center";
        tempCtx.textBaseline = "bottom";

        tempCtx.strokeText(text, canvas.width / 2, canvas.height - 10);
        tempCtx.fillText(text, canvas.width / 2, canvas.height - 10);
    }

    frames.push(tempCanvas); // Теперь добавляем `canvas`, а не `toDataURL()`

    // Превью кадра
    const img = document.createElement('img');
    img.src = tempCanvas.toDataURL("image/gif"); // Отображаем как GIF
    framePreview.appendChild(img);
}

// 📌 Генерация GIF с динамическим размером
function generateGIF() {
    if (frames.length === 0) {
        alert('Ошибка: Добавьте хотя бы один кадр!');
        return;
    }

    const gif = new GIF({
        workers: 2,
        quality: 15,
        width: canvas.width,
        height: canvas.height
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
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    outputGif.src = "";
    gifBlob = null;
}

// 📌 Сохранение GIF (теперь без ошибок)
function downloadGIF() {
    if (!gifBlob) {
        alert('Ошибка: Сначала создайте GIF!');
        return;
    }

    // Генерируем уникальное имя файла (с датой и временем)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `animation_${timestamp}.gif`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(gifBlob); // Используем BLOB
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
