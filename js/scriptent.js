const fingers = {
    index1: 8,
    index2: 7,
    index3: 6,
    index4: 5,
    middle1: 12,
    middle2: 11,
    middle3: 10,
    middle4: 9,
    ring1: 16,
    ring2: 15,
    ring3: 14,
    ring4: 13,
    little1: 20,
    little2: 19,
    little3: 18,
    little4: 17,
    thumb1: 4,
    thumb2: 3,
    thumb3: 2,
    thumb4: 1,
    thumb5: 0
}

const finger_state = {
    landmarks: undefined,
    index: false,
    middle: false,
    ring: false,
    little: false,
    isFist: false,
}

/**
 * 將 canvas 畫布保存為 PNG 圖片，並保存筆劃記錄、筆劃大小與顏色
 * @param {HTMLCanvasElement} canvas - 畫布元素
 * @param {StrokeList} stroke_list - 筆劃記錄
 */
function saveCanvasAsImage(canvas, stroke_list) {
    const fist_icon = new Image();
    fist_icon.src = 'assets/fist.png';

    try {
        // 創建一個臨時畫布來重繪所有筆劃和標示
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempContext = tempCanvas.getContext('2d');

        // 將原始畫布內容繪製到臨時畫布
        tempContext.drawImage(canvas, 0, 0);

        // 將筆劃記錄重新繪製到臨時畫布上，包含筆劃大小和顏色
        for (const stroke of stroke_list.stroke_list) {
            if (stroke.length) {
                tempContext.beginPath();
                tempContext.moveTo(stroke[0].x, stroke[0].y);
                
                // 設定每個筆劃的顏色與大小
                tempContext.strokeStyle = stroke[0].color || 'magenta';
                // tempContext.shadowColor = stroke[0].color || 'magenta';
                tempContext.shadowBlur = 10;
                tempContext.lineWidth = stroke[0].size || 5;
                
                for (const pt of stroke.slice(1)) {
                    tempContext.lineTo(pt.x, pt.y);
                }
                tempContext.stroke();
            }
        }

        // 3. 在右下角添加拳頭標示
        const iconSize = 50; // 圖示大小
        tempContext.drawImage(
            fist_icon,
            canvas.width - iconSize - 10, // X 位置（右下角留 10px 邊距）
            canvas.height - iconSize - 10, // Y 位置（右下角留 10px 邊距）
            iconSize, // 寬度
            iconSize  // 高度
        );

        // 4. 將畫布轉換為圖片數據 URL (PNG 格式)
        const image = tempCanvas.toDataURL('image/png');

        // 5. 創建一個臨時的超連結元素並下載
        const a = document.createElement('a');
        a.href = image;
        a.download = `drawing_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
        a.click();

        console.log('🎉 圖片已成功保存，包含筆劃記錄、大小、顏色與拳頭標示！');
    } catch (error) {
        console.error('❌ 保存圖片時發生錯誤:', error);
    }
}



/**
 * 計算兩個向量之間的角度
 * @param {Array} v1 - 向量1 [x, y]
 * @param {Array} v2 - 向量2 [x, y]
 * @returns {number} - 角度（度數）
 */
function vector2DAngle(v1, v2) {
    const dotProduct = v1[0] * v2[0] + v1[1] * v2[1];
    const magnitude1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
    const magnitude2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);
    const angle = Math.acos(dotProduct / (magnitude1 * magnitude2));
    return (angle * 180) / Math.PI; // 將弧度轉換為度數
}

/**
 * 根據手部關鍵點計算每根手指的角度
 * @param {Array} landmarks - 手部關鍵點座標
 * @returns {Array} - 每根手指的角度列表
 */
function calculateFingerAngles(landmarks) {
    const angles = [];

    // 大拇指
    let v1 = [
        landmarks[fingers.thumb2].x - landmarks[fingers.thumb1].x,
        landmarks[fingers.thumb2].y - landmarks[fingers.thumb1].y,
    ];
    let v2 = [
        landmarks[fingers.thumb3].x - landmarks[fingers.thumb2].x,
        landmarks[fingers.thumb3].y - landmarks[fingers.thumb2].y,
    ];
    angles.push(vector2DAngle(v1, v2));

    // 食指
    v1 = [
        landmarks[fingers.index2].x - landmarks[fingers.index1].x,
        landmarks[fingers.index2].y - landmarks[fingers.index1].y,
    ];
    v2 = [
        landmarks[fingers.index3].x - landmarks[fingers.index2].x,
        landmarks[fingers.index3].y - landmarks[fingers.index2].y,
    ];
    angles.push(vector2DAngle(v1, v2));

    // 中指
    v1 = [
        landmarks[fingers.middle2].x - landmarks[fingers.middle1].x,
        landmarks[fingers.middle2].y - landmarks[fingers.middle1].y,
    ];
    v2 = [
        landmarks[fingers.middle3].x - landmarks[fingers.middle2].x,
        landmarks[fingers.middle3].y - landmarks[fingers.middle2].y,
    ];
    angles.push(vector2DAngle(v1, v2));

    // 無名指
    v1 = [
        landmarks[fingers.ring2].x - landmarks[fingers.ring1].x,
        landmarks[fingers.ring2].y - landmarks[fingers.ring1].y,
    ];
    v2 = [
        landmarks[fingers.ring3].x - landmarks[fingers.ring2].x,
        landmarks[fingers.ring3].y - landmarks[fingers.ring2].y,
    ];
    angles.push(vector2DAngle(v1, v2));

    // 小拇指
    v1 = [
        landmarks[fingers.little2].x - landmarks[fingers.little1].x,
        landmarks[fingers.little2].y - landmarks[fingers.little1].y,
    ];
    v2 = [
        landmarks[fingers.little3].x - landmarks[fingers.little2].x,
        landmarks[fingers.little3].y - landmarks[fingers.little2].y,
    ];
    angles.push(vector2DAngle(v1, v2));

    return angles;
}

/**
 * 判斷是否為握拳手勢
 * @param {Array} angles - 每根手指的角度列表
 * @param {number} threshold - 判斷手指彎曲的角度閾值（默認為 50 度）
 * @returns {boolean} - 如果是握拳手勢，返回 true，否則返回 false
 */
function isFist(angles, threshold = 50) {
    return angles.every(angle => angle >= threshold);
}


function gesture() {
    /*
        0 : nothing
        1 : index up, drawing state
        2 : index and middle up, eraser state
        3 : fist, save image
    */
    if (finger_state.index && !finger_state.middle && !finger_state.ring && !finger_state.little) {return 1;}
    if (finger_state.index && finger_state.middle && !finger_state.ring && !finger_state.little) {return 2;}
    if (finger_state.isFist) {
        return 3; // 保存圖片模式（握拳）
    }
    if (finger_state.index && finger_state.middle && finger_state.ring && !finger_state.little) {return 4;}

    return 0;
}

function download_points(stroke_list) {
    const a = document.createElement("a");
    const file = stroke_list.download();
    a.href = URL.createObjectURL(file);
    a.download = "data.txt";
    a.click();
}



class Point {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }

    static distance(a,b) {
        return Math.hypot(a.x-b.x,a.y-b.y);
    }
}

 function init() {
    const download_button = document.querySelector('#download_button')
    const clear_button = document.querySelector('#clear_button')
    const increase_brush_size_button = document.querySelector('#increase_brush_size')
    const decrease_brush_size_button = document.querySelector('#decrease_brush_size')
    const dl_button = document.querySelector('#dl_button')
    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');

    const colorButton = document.getElementById('colorButton');
    const colorPalette = document.getElementById('colorPalette');
    const colorOptions = document.querySelectorAll('.color-option');

    // 顯示/隱藏調色盤
    colorButton.addEventListener('click', () => {
        colorPalette.classList.toggle('hidden');
    });

    // 點擊調色盤中的顏色選項
    colorOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            const selectedColor = event.target.style.backgroundColor;
            colorIndicator.style.backgroundColor = selectedColor; 
            colorPalette.classList.add('hidden'); 

            stroke_list.changeBrushColor(selectedColor)
        });
    });

    let bg_index = 0;  // 當前背景索引
    const backgrounds = [
        video,
        new Image()   // 背景 1
    ];

    backgrounds[1].src = 'assets/background1.jpg';

    const width = canvas.width;
    const height = canvas.height;

    const erase_radius = 40.;

    const draw_icon = new Image();
    const erase_icon = new Image();
    const save_icon = new Image();
    const fist_icon = new Image();
    draw_icon.src = 'assets/draw.png';
    erase_icon.src = 'assets/erase.png';
    save_icon.src = 'assets/save.png';
    fist_icon.src = 'assets/fist.png';

    let stroke_list = new StrokeList();
    let previous_pt = null;
    download_button.onclick = () => download_points(stroke_list);
    clear_button.onclick = () => stroke_list.clear();
    dl_button.onclick = () => show_modal();
    close_button.onclick = () => close_modal();
    // 按鈕點擊事件來調整筆劃大小
    increase_brush_size_button.onclick = () => stroke_list.increaseBrushSize();
    decrease_brush_size_button.onclick = () => stroke_list.decreaseBrushSize();

    let saveCooldown = false;
    let backgroundChangeCooldown = false; // 冷卻標誌


    function show_modal() {
        document.getElementById('myModal').style.display = "block";
    }

    // 關閉模態框
    function close_modal() {
        document.getElementById('myModal').style.display = "none";
    }

    // 點擊模態框外的區域關閉模態框
    window.onclick = function(event) {
        if (event.target == document.getElementById('myModal')) {
            close_modal();
        }
    }

    async function process() {
        context.save();

        // draw video stream
        context.clearRect(0, 0, canvas.width, canvas.height);
        let gest = gesture();
        
        // 根據手勢判斷背景
        if (gest == 4 && !backgroundChangeCooldown) {  // 偵測到背景切換手勢
            bg_index = (bg_index + 1) % backgrounds.length; // 循環切換背景
            console.log('切換背景:', bg_index);

            backgroundChangeCooldown = true; // 啟用冷卻
            setTimeout(() => { 
                backgroundChangeCooldown = false; 
                console.log('冷卻結束');
            }, 3000); // 冷卻時間 3 秒
        }

        let output_frame = video;  // 默認顯示原始畫面

        if (bg_index > 0 && backgrounds[bg_index]) {  // 如果有背景，顯示背景圖片
            let bg_image = backgrounds[bg_index];
            // 確保背景圖片已加載完成
            if (bg_image.complete) {
                // 創建一個畫布來調整背景圖片的大小
                let bgCanvas = document.createElement("canvas");
                let ctx = bgCanvas.getContext("2d");
                
                // 根據原始畫面大小調整背景圖片大小
                bgCanvas.width = canvas.width;
                bgCanvas.height = canvas.height;
    
                ctx.drawImage(bg_image, 0, 0, canvas.width, canvas.height); 
                context.drawImage(bgCanvas, 0, 0, canvas.width, canvas.height);
            }
             
        }else{
                context.drawImage(output_frame, 0, 0, canvas.width, canvas.height);
        }
        

        // draw hands
        await hands.send({image: video});

        // draw icons

        if (gest == 1) {
            // the user is drawing
            context.globalAlpha = 1;
            context.drawImage(draw_icon,width-166,height-100);
            // register point
            index_pos = finger_state.landmarks[fingers.index1];
            new_pt = new Point(index_pos.x*width,index_pos.y*height);
            stroke_list.add_pt(new_pt);
            previous_pt = new_pt;
        } else {
            if (previous_pt !== null) {
                stroke_list.new_stroke();
                previous_pt = null;
            }
            context.globalAlpha = 0.2;
            context.drawImage(draw_icon,width-166,height-100);
        }

        if (gest == 2) {
            // the user is erasing
            context.globalAlpha = 1;
            context.drawImage(erase_icon,width-166,height-200);
            // register erase
            idx = finger_state.landmarks[fingers.index1];
            mdl = finger_state.landmarks[fingers.middle1];
            erase_pos = new Point(width*(idx.x+mdl.x)/2.,height*(idx.y+mdl.y)/2.);
            // filter erased points
            stroke_list.erase(erase_pos,erase_radius);
            // draw eraser
            context.lineWidth = 5;
            context.strokeStyle = 'salmon';
            context.beginPath();
            context.arc(erase_pos.x, erase_pos.y, erase_radius, 0, 2*Math.PI);
            context.stroke()
        } else {
            context.globalAlpha = 0.2;
            context.drawImage(erase_icon,width-166,height-200);
        }

        // 📸 **保存圖片模式（握拳）**
        if (gest == 3 && !saveCooldown) {
            saveCooldown = true;
            console.log('🖐️ 偵測到握拳，正在保存圖片...');
            context.globalAlpha = 1;

            // context.drawImage(save_icon, width - 106, height - 300, 100, 100);
            // context.drawImage(fist_icon, width - 156, height - 300, 100, 100);
            saveCanvasAsImage(canvas, stroke_list);

            setTimeout(() => {
                saveCooldown = false;
            }, 2000); // 2 秒冷卻時間
        } else {
            context.globalAlpha = 0.2;
            // context.drawImage(save_icon, width-106,height-300, 100, 100);
            // context.drawImage(fist_icon, width-156,height-300, 100, 100);
        }

        context.restore();

        context.save();
        stroke_list.draw(context);
        context.restore();
    }

    function processHands(results) {
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(context, landmarks, HAND_CONNECTIONS,{color: '#00FF00', lineWidth: 5});
                drawLandmarks(context, landmarks, {color: '#FF0000', lineWidth: 2});

                // update fingers state
                finger_state.landmarks = landmarks;
                finger_state.index = landmarks[fingers.index1].y < landmarks[fingers.index3].y;
                finger_state.middle = landmarks[fingers.middle1].y < landmarks[fingers.middle3].y;
                finger_state.ring = landmarks[fingers.ring1].y < landmarks[fingers.ring3].y;
                finger_state.little = landmarks[fingers.little1].y < landmarks[fingers.little3].y;
                const angles = calculateFingerAngles(landmarks);
                finger_state.isFist = isFist(angles);
            }
        }
    }

    const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    hands.setOptions({
        selfieMode: false,
        maxNumHands: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        modelComplexity: 1.
    });
    hands.onResults(processHands);

    const camera = new Camera(video, {
        onFrame: process,
        width: 1920,
        height: 1080
    });
    camera.start();
}

window.onload = init