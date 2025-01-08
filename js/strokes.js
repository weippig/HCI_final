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
}