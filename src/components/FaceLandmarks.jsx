import React, { useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { createDetector, SupportedModels } from '@tensorflow-models/face-landmarks-detection';

const FaceLandmarks = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const runModel = async () => {
      await tf.setBackend('webgl');
      await tf.ready();

      const detector = await createDetector(SupportedModels.MediaPipeFaceMesh, {
        runtime: 'tfjs',
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          resolve();
        };
      });
      videoRef.current.play();

      const detectFaces = async () => {
        const faces = await detector.estimateFaces(videoRef.current);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        faces.forEach((face) => {
          face.keypoints.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = 'cyan';
            ctx.fill();
          });
        });

        requestAnimationFrame(detectFaces);
      };

      detectFaces();
    };

    runModel();
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

export default FaceLandmarks;
