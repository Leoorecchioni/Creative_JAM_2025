import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const ObjectDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [targetObject, setTargetObject] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle', 'playing', 'success', 'failed'
  const timerRef = useRef(null);
  const gameStatusRef = useRef('idle');
  const targetObjectRef = useRef(null);

  useEffect(() => {
    let stream = null;
    
    const loadModelAndDetect = async () => {
      const model = await cocoSsd.load();
      const video = videoRef.current;
      const canvas = canvasRef.current;

      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          resolve();
        };
      });

      // Attendre que la vidéo soit prête avant de jouer
      try {
        await video.play();
      } catch (error) {
        console.warn('Play error:', error);
      }

      // Attendre que la vidéo ait des dimensions valides
      await new Promise((resolve) => {
        const checkReady = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            resolve();
          } else {
            requestAnimationFrame(checkReady);
          }
        };
        checkReady();
      });
      
      detectFrame(video, model);
    };

    const detectFrame = (video, model) => {
      // Vérifier que la vidéo a des dimensions valides avant de détecter
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        requestAnimationFrame(() => detectFrame(video, model));
        return;
      }

      model.detect(video).then(predictions => {
        // Mettre à jour l'état avec les objets détectés
        setDetectedObjects(predictions);
        
        // Vérifier si l'objet cible est détecté pendant le jeu
        if (gameStatusRef.current === 'playing' && targetObjectRef.current) {
          const found = predictions.some(pred => 
            pred.class.toLowerCase() === targetObjectRef.current.toLowerCase()
          );
          if (found) {
            setGameStatus('success');
            gameStatusRef.current = 'success';
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
          }
        }
        
        drawPredictions(predictions);
        requestAnimationFrame(() => detectFrame(video, model));
      }).catch(error => {
        console.error('Detection error:', error);
        requestAnimationFrame(() => detectFrame(video, model));
      });
    };

    const drawPredictions = (predictions) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = 'red';
        ctx.font = '24px Arial';
        ctx.fillText(prediction.class, x, y > 10 ? y - 5 : y + 15);
      });
    };

    loadModelAndDetect();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer pour le jeu
  useEffect(() => {
    if (gameStatus === 'playing') {
      // Nettoyer le timer précédent s'il existe
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameStatus('failed');
            gameStatusRef.current = 'failed';
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Arrêter le timer si le jeu n'est pas en cours
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStatus]);

  const startGame = () => {
    const objects = ['cup', 'cell phone', 'bottle'];
    const randomObject = objects[Math.floor(Math.random() * objects.length)];
    setTargetObject(randomObject);
    targetObjectRef.current = randomObject;
    setTimeLeft(10);
    setGameStatus('playing');
    gameStatusRef.current = 'playing';
  };

  const resetGame = () => {
    setTargetObject(null);
    targetObjectRef.current = null;
    setTimeLeft(10);
    setGameStatus('idle');
    gameStatusRef.current = 'idle';
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Filtrer les personnes de la liste des objets détectés
  const filteredObjects = detectedObjects.filter(obj => 
    obj.class.toLowerCase() !== 'person'
  );

  return (
    <div>
      <div style={{ position: 'relative', width: '640px', height: '480px' }}>
        <video
          ref={videoRef}
          width="640"
          height="480"
          style={{ position: 'absolute', top: 0, left: 0 }}
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>

      {/* Zone de jeu */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '5px', border: '2px solid #4CAF50' }}>
        {gameStatus === 'idle' && (
          <div>
            <h3 style={{ marginTop: 0 }}>🎮 Défi d'objets</h3>
            <p>Montrez l'objet demandé à la caméra en moins de 10 secondes !</p>
            <button 
              onClick={startGame}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
          Démarrer le jeu
            </button>
          </div>
        )}

        {gameStatus === 'playing' && (
          <div>
            <h3 style={{ marginTop: 0 }}>⏱️ Trouvez cet objet :</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3', margin: '10px 0' }}>
              {targetObject}
            </div>
            <div style={{ fontSize: '20px', color: timeLeft <= 3 ? '#f44336' : '#333' }}>
              Temps restant : {timeLeft} secondes
            </div>
          </div>
        )}

        {gameStatus === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#4CAF50', marginTop: 0 }}>🎉 Réussi !</h2>
            <p style={{ fontSize: '18px' }}>Vous avez trouvé <strong>{targetObject}</strong> !</p>
            <button 
              onClick={resetGame}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginTop: '10px'
              }}
            >
          Rejouer
            </button>
          </div>
        )}

        {gameStatus === 'failed' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#f44336', marginTop: 0 }}>⏰ Temps écoulé !</h2>
            <p style={{ fontSize: '18px' }}>Vous n'avez pas trouvé <strong>{targetObject}</strong> à temps.</p>
            <button 
              onClick={resetGame}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginTop: '10px'
              }}
            >
          Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Liste des objets détectés (sans les personnes) */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Objets détectés :</h3>
        {filteredObjects.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {filteredObjects.map((obj, index) => (
              <li key={index} style={{ margin: '5px 0', padding: '5px', backgroundColor: 'white', borderRadius: '3px' }}>
                <strong>{obj.class}</strong> - Confiance: {(obj.score * 100).toFixed(1)}%
                <br />
                <small>
                  Position: x={obj.bbox[0].toFixed(0)}, y={obj.bbox[1].toFixed(0)}, 
                  largeur={obj.bbox[2].toFixed(0)}, hauteur={obj.bbox[3].toFixed(0)}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#666' }}>Aucun objet détecté</p>
        )}
      </div>
    </div>
  );
};

export default ObjectDetection;
