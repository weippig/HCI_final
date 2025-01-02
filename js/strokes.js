class StrokeList {
    constructor() {
        this.stroke_list = [[]];
        this.brushSize = 5;  // 初始筆劃大小
        this.color = '#FF0000';
    }

    // 增加筆劃大小
    increaseBrushSize() {
        this.brushSize += 5;
        console.log('Brush Size:', this.brushSize);
    }

    // 減少筆劃大小
    decreaseBrushSize() {
        if (this.brushSize > 5) {
            this.brushSize -= 5;
            console.log('Brush Size:', this.brushSize);
        }
    }

    changeBrushColor(color) {
        this.color = color
        console.log("change!", this.color)
    }

    add_pt (pt) {
        const pointWithSize = { ...pt, size: this.brushSize, color:this.color };
        this.stroke_list.at(-1).push(pointWithSize);
    }

    clear () {
        this.stroke_list = [[]];
    }

    erase (erase_pos,radius) {
        const new_strokes = [];

        this.stroke_list.forEach(stroke => {
            let current_segment = [];
            stroke.forEach(pt => {
                if (Point.distance(erase_pos, pt) > radius + (pt.size || 0) / 2) {
                    // 保留未被擦除的點
                    current_segment.push(pt);
                } else if (current_segment.length > 0) {
                    // 如果當前段落結束，將其存入新筆劃列表
                    new_strokes.push(current_segment);
                    current_segment = [];
                }
            });
            // 最後處理段落
            if (current_segment.length > 0) {
                new_strokes.push(current_segment);
            }
        });
    
        // 更新 stroke_list 並移除空筆劃
        this.stroke_list = new_strokes.filter(stroke => stroke.length > 0);
    }

    new_stroke () {
        if (!this.stroke_list.length || this.stroke_list.at(-1).length) {
            this.stroke_list.push([]);
        }
    }

    draw (context) {
        context.lineJoin = "round";
        context.strokeStyle = "magenta"; // 顏色
        // context.shadowColor = "magenta";
        context.shadowBlur = 10;
        
        for (const stroke of this.stroke_list) {
            if (stroke.length) {
                context.beginPath();
                context.fillStyle = stroke[0].color;
                context.lineWidth = stroke[0].size; // 使用第一點的筆劃粗細
                context.strokeStyle = stroke[0].color;
                context.moveTo(stroke[0].x, stroke[0].y);
                for (let i = 1; i < stroke.length; i++) {
                    const pt = stroke[i];
                    context.lineWidth = pt.size; // 更新筆劃粗細
                    context.lineTo(pt.x, pt.y);
                }
                context.stroke();
            }
        }
    }

    download () {
        return new Blob([JSON.stringify(this.stroke_list.flat(), null, 2)], {type: "text/plain"});
    }

    filter (criterion) {
        /*
        criterion is a function (index,element) => bool which tells wether element at a given index
        should be kept 
        */
        let old_stroke_list = this.stroke_list.slice();
        this.stroke_list = [[]];
        const n = old_stroke_list.length;
        let count = 0
        for (let k = 0; k < n; k++) {
            let n_k = old_stroke_list[k].length;
            for (let i = 0; i < n_k; i++) {
                if (criterion(count,old_stroke_list[k][i])) {this.add_pt(old_stroke_list[k][i]);}
                else {this.new_stroke();}
                count++;
            }
            this.new_stroke();
        }
        this.new_stroke();
    }

    // Use a DL on the sequence to predict wether the user wanted to draw or not
    async predict () {
        let data = this.stroke_list.slice().flat();
        data = data.map(x => {return [x.x,x.y];})
        data = transformData(data);

        const session = await ort.InferenceSession.create('models/lstm_X_91_48.onnx');
        const tensor = new ort.Tensor('float32',data.flat(),[data.length,6]);
        const feed = {'input': tensor};
        const result = await session.run(feed);

        const output = result.output.data;
        this.filter((index,pt) => (output[index] > 0.5));
    }
}

// Takes an array of 2D coordinates and returns an array of 6D values (vx,vy,v,ax,ay,a)
function transformData(data) {
    let new_data = [[0.,0.,0.,0.,0.,0.]];
    let n = data.length;
    for (let k = 1; k < n; k++) {
        vx = data[k][0] - data[k-1][0];
        vy = data[k][1] - data[k-1][1];
        v = Math.hypot(vx,vy);
        ax = vx - new_data.at(-1)[0];
        ay = vy - new_data.at(-1)[1];
        a = Math.hypot(ax,ay);
        new_data.push([vx,vy,v,ax,ay,a]);
    }
    return new_data;
}