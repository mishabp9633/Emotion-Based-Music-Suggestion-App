const video = document.getElementById('video');

async function loadModels() {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
  ]);
}

async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
  } catch (err) {
    console.error(err);
  }
}

async function detectFaces() {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    // Analyze the dominant emotion
    let dominantEmotion = '';
    let highestProbability = 0;
    for (const expression in detections[0].expressions) {
      if (detections[0].expressions[expression] > highestProbability) {
        dominantEmotion = expression;
        highestProbability = detections[0].expressions[expression];
      }
    }
  
    // Send the dominant emotion to the server
    fetch('/analyzeEmotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emotion: dominantEmotion }),
    })
    .then(response => response.json())
    .then(suggestedSongs => {
      // Update the suggested songs section in the HTML
      const suggestedSongsList = document.getElementById('suggested-songs');
      const songsHTML = suggestedSongs.map(song => `
        <li>
          <h3>${song.title}</h3>
          <p>Artist: ${song.artist}</p>
          <p>Genre: ${song.genre}</p>
          <audio controls>
            <source src="/music/${song._id}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
        </li>
      `).join('');
      suggestedSongsList.querySelector('ul').innerHTML = songsHTML;
    });
  }, 100);
}

async function setup() {
  await loadModels();
  await startVideo();
  video.addEventListener('play', detectFaces);
}

setup();
