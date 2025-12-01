import React from 'react';
import FaceLandmarksAR from './components/FaceLandmarks';
import FaceDetection from './components/FaceDetection';
import ObjectDetection from './components/ObjectDetection';
import HandPoseDetector from './components/HandPoseDetector';

function App() {
  return (
    <div className="App">
      <h1>Real-time object detection</h1>
      <ObjectDetection />
      {/* <h1>Face detection</h1>
      <FaceDetection />
      <h1>Facial landmarks</h1>
      <FaceLandmarksAR />
      <h1>Hand detection</h1>
      <HandPoseDetector /> */}
    </div>
  );
}

export default App;
