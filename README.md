# FLOWDRAW 🌈

This tool leverages technology to address the challenges of drawing being heavily dependent on hardware. By replacing the mouse with gestures, it enables real-time drawing capabilities. In remote video conferences, where participants often struggle to express ideas in real-time, this tool allows the use of fingers as a virtual pen to create interactive drawings seamlessly.
Watch the gif until the end to see how it works.


![](assets/gif.gif)

## Technical Details

- The interface is built using HTML, CSS, and JavaScript, with drawing functionality implemented on a Canvas element.
- Hand gesture recognition is performed using [MediaPipe toolbox](https://google.github.io/mediapipe/solutions/hands.html)
- Hand detection relies on the hand being fully visible on the screen. Partial visibility may lead to poor detection results.
- The detection is sensitive to finger positions; bending fingers excessively can impact the accuracy of hand tracking.
- The application runs entirely client-side, requiring only a computer with a webcam for gesture recognition.

## Going Forward
Overall, the pipeline still has room for improvement. Ideas for enhancement include:

- Using WebSocket to establish a video functionality.
- Incorporating deep learning to automatically correct handwriting.
- Triggering drawing functions when lifting or placing the pen.
