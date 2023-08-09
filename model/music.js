const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  duration: { type: Number, required: true },
  genre: { type: String },
  filePath: { type: String, required: true }, 
});

const Music = mongoose.model('Music', musicSchema);

module.exports = Music;
