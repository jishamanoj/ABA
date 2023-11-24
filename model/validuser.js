const mongoose = require('mongoose');

const validUserSchema = new mongoose.Schema({
  regNo: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  img: {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    name: {
      type: String,  // Ensure that 'img.name' is defined as a String type
      required: true,
    },
  },
  
  isRegisteredUser: {
    type: Boolean,
    required: true,
  },
});

const validUser = mongoose.model('validUser', validUserSchema);

module.exports = validUser;
