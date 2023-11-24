const mongoose = require('mongoose');

const signupSchema = new mongoose.Schema({
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
  // img: {
  //   name: String,
  //   contentType: String,
  //   data: Buffer
  // },
  isRegisteredUser: {
    type: Boolean,
    required: true,
  },
});

const signup = mongoose.model('signup', signupSchema);

module.exports = signup;
