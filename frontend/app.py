from flask import Flask, Response
from flask_cors import CORS
from ultralytics import YOLO
import cv2, torch

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # ✅ allow requests from React

MODEL_PATH = r"C:/Users/DELL/Desktop/car/Car-parking-system/smart-park/frontend/runs/content/runs/detect/train2/weights/best.pt"
VIDEO_PATH = r"C:/Users/DELL/Desktop/car/Car-parking-system/smart-park/frontend/dataset/easy.mp4"

model = YOLO(MODEL_PATH)
cap = cv2.VideoCapture(VIDEO_PATH)

def gen_frames():
    while True:
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # loop the video
            continue

        results = model.predict(frame, conf=0.5, iou=0.5, device=0 if torch.cuda.is_available() else None, verbose=False)

        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].int().tolist()
            cls = int(box.cls[0])
            label = model.names[cls]

            color = (0, 0, 255) if label.lower() == "occupied" else (0, 255, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        # Encode frame
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video')
def video():
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
