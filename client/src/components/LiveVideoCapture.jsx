import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const LiveVideoCapture = () => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    const startVideoCapture = async () => {
      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = userMediaStream;
        }


        // Capture and send frames to the server
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 1280;
        canvas.height = 720;

        setInterval(() => {
          context.drawImage(videoRef.current, 0, 0, 1280, 720);
          const frameData = canvas.toDataURL('image/jpeg');
          socketRef.current.emit('frame', frameData);
          console.log(frameData)
        }, 5000); // Adjust the frame capture interval as needed
      } catch (error) {
        console.error('Error accessing the camera:', error);
      }
    };

    // Listen for 'result' events from the server
    socketRef.current.on('result', (data) => {
      setResult(data); // Update the result state when a result is received
    });

    startVideoCapture();

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <React.Fragment>
      <div>
        <div className='Capture'>
          <h2>Crowd Counting App</h2>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', maxWidth: '600px' }}
          />
          {result && <p>{result}</p>}
        </div>
      </div>
    </React.Fragment>
  );
};

export default LiveVideoCapture;
