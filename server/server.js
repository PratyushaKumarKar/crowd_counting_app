
const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const PORT = process.env.PORT || 5002;
const app = express();
const server = http.createServer(app);
const { spawn } = require('child_process');


const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('frame', (frameData) => {
                                             // Process the frame (in python) 
    processFrame(frameData)
      .then((result) => {
                                             // Send the processed result back to the client
        socket.emit('result', result);
      })
      .catch((error) => {
        console.error('Error processing frame:', error);
                                              // Handle the error and potentially notify the client about the error
      });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


// Running my Python script and returning output

function processFrame(frameData) {
  return new Promise((resolve, reject) => {
    const pythonScript = 'crowd_counting_working.py';
    let returnData = '';

    const pyProg = spawn('python', [pythonScript], { stdio: ['pipe', 'pipe', 'pipe'] });

    pyProg.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
      reject(data);                          // Reject the Promise in case of an error
    });

    pyProg.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      if (code === 0) {
        resolve(`Number of Crowd: ${returnData}`);
      } else {
        reject(`Python process exited with code ${code}`);
      }
    });

    pyProg.stdout.on('data', (data) => {
      returnData += data;
      console.log(`Python Output: ${data}`);
    });

    // Write the frame data to the Python process's stdin
    pyProg.stdin.write(frameData);
    pyProg.stdin.end();                   // End the input stream
  });
}

// listening to PORT

server.listen(PORT, (err) => {
  if (err) console.log(err);
  console.log('Server running on Port ', PORT);
});

