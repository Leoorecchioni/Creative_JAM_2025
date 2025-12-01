import React, { useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import {
  createDetector,
  SupportedModels,
} from '@tensorflow-models/hand-pose-detection';

const HandPoseDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let detector = null;
    let stream = null;
    let animationFrameId = null;

    const setupCamera = async () => {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });

      return new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();

            const checkReady = () => {
              if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                resolve();
              } else {
                requestAnimationFrame(checkReady);
              }
            };

            checkReady();
          };
        }
      });
    };

    const renderHands = (hands, ctx) => {
      hands.forEach((hand) => {
        hand.keypoints.forEach(({ x, y }) => {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'lime';
          ctx.fill();
        });
      });
    };

    const runDetection = async () => {
      if (!videoRef.current || !canvasRef.current || !detector) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const detect = async () => {
        // Vérifie que la vidéo a bien une taille
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          animationFrameId = requestAnimationFrame(detect);
          return;
        }

        const hands = await detector.estimateHands(video, { flipHorizontal: false });

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderHands(hands, ctx);

        animationFrameId = requestAnimationFrame(detect);
      };

      detect();
    };

    const init = async () => {
      await tf.setBackend('webgl');
      await tf.ready();

      detector = await createDetector(SupportedModels.MediaPipeHands, {
        runtime: 'tfjs',
        modelType: 'lite',
        maxHands: 2,
      });

      await setupCamera();
      await runDetection();
    };

    init();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
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

export default HandPoseDetector;
  