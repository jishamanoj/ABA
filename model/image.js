const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  buffer: {
    type: Buffer,
    required: true,
  },
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
