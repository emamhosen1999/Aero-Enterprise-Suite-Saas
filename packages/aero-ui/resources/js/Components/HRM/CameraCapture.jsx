// src/Components/CameraCapture.jsx
import React, { useRef, useState } from 'react';

const CameraCapture = ({ onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [streaming, setStreaming] = useState(false);

    const startCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
    };

    const capturePhoto = async () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        // Set canvas size to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw image from video
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get geolocation
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude.toFixed(5);
            const lng = pos.coords.longitude.toFixed(5);
            const timestamp = new Date().toLocaleString();

            // Draw timestamp and location
            context.fillStyle = 'rgba(0, 0, 0, 0.6)';
            context.fillRect(0, canvas.height - 60, canvas.width, 60);
            context.fillStyle = '#fff';
            context.font = '20px Arial';
            context.fillText(`Time: ${timestamp}`, 10, canvas.height - 35);
            context.fillText(`Location: ${lat}, ${lng}`, 10, canvas.height - 10);

            const imageBase64 = canvas.toDataURL('image/jpeg');
            onCapture(imageBase64, { lat, lng, timestamp });

            // Stop camera
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            setStreaming(false);
        });
    };

    return (
        <div>
            {!streaming ? (
                <button onClick={startCamera}>Open Camera</button>
            ) : (
                <>
                    <video ref={videoRef} style={{ width: '100%' }} />
                    <button onClick={capturePhoto}>Capture</button>
                </>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default CameraCapture;
