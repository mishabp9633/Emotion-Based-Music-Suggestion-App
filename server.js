const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const Music = require('./model/music');

const app = express();
const port = 3000;


// Set up the storage for multer
const storage = multer.diskStorage({
  destination: './public/songs',
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Initialize multer
const upload = multer({ storage: storage });


// Set up middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/models', express.static(path.join(__dirname, 'models')));




// Route to add a new music track with song file upload
app.post('/addMusic', upload.single('songFile'), async (req, res) => {
  try {
    const { title, artist, duration, genre } = req.body;
    const filePath = req.file.path; // Get the file path of the uploaded song

    const music = new Music({ title, artist, duration, genre, filePath });
    await music.save();
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error adding the music track.');
  }
});


// Route to get all music tracks
app.get('/', async (req, res) => {
  try {
    const musicTracks = await Music.find();
    res.render('index', { musicTracks });
  } catch (err) {
    res.status(500).send('Error fetching music tracks.');
  }
});


// Route to stream the music
app.get('/music/:id', async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    if (!music) {
      return res.status(404).send('Music not found');
    }
    // Read the music file from the server's file system
    const fileStream = fs.createReadStream(music.filePath);
    fileStream.pipe(res);
  } catch (err) {
    res.status(500).send('Error streaming the music.');
  }
});


app.get('/photo', (req, res) => {
  res.render('photo'); // Renders the capture.ejs view
});


app.post('/analyzeEmotion', async (req, res) => {
  try {
    const { emotion } = req.body; // Get the emotion from req.body

    // Select appropriate genre based on the detected emotion
    let genre;
    switch (emotion) {
      case 'happy':
        genre = 'Rock';
        break;
      case 'neutral':
        genre = 'Pop';
        break;
      case 'angry':
        genre = 'Rock';
        break;
      case 'sad':
        genre = 'Blues';
        break;
      default:
        genre = 'Pop'; // Default genre
        break;
    }

    // Fetch suggested songs based on the genre
    const suggestedSongs = await Music.find({ genre });
    res.json(suggestedSongs);
  } catch (err) {
    res.status(500).send('Error analyzing emotion.');
  }
});





async function dbconnection(){
  try {
    // await mongoose.connect("mongodb://127.0.0.1:27017/music_player")
    await mongoose.connect("mongodb+srv://mishabp9633:98Zqm6FuQBKv1sCw@shobhagold.pjuqog5.mongodb.net/music_player?retryWrites=true&w=majority")
    console.log("monogo db connecetd");
    
  } catch (error) {
    console.log("monogo db not connecttd");

    throw error
  }
}

dbconnection()

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

