import React, { useRef, useEffect } from 'react';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';

const FaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const runFaceDetection = async () => {
      const model = await blazeface.load();

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.play();

      const detect = async () => {
        if (video.readyState === 4) {
          const predictions = await model.estimateFaces(video, false);

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (predictions.length > 0) {
            predictions.forEach((prediction) => {
              const start = prediction.topLeft;
              const end = prediction.bottomRight;
              const size = [end[0] - start[0], end[1] - start[1]];

              ctx.strokeStyle = 'red';
              ctx.lineWidth = 2;
              ctx.strokeRect(start[0], start[1], size[0], size[1]);
            });
          }
        }

        requestAnimationFrame(detect);
      };

      detect();
    };

    runFaceDetection();
  }, []);

  return (
    <div style={{ position: 'relative', width: '640px', height: '480px' }}>
      <video
        ref={videoRef}
        width="640"
        height="480"
        style={{ position: 'absolute', top: 0, left: 0 }}
        autoPlay
        muted
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
};

export default FaceDetection;
