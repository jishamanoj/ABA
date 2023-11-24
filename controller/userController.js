const express = require('express');
require("dotenv").config();
const router = express.Router();
const jwt = require('jsonwebtoken');
//const verifyToken = require('../verifytoken');
const signup = require('../model/signup');
const Image= require('../model/image');
const bcrypt = require('bcrypt');
const multer = require('multer');
const validuser = require('../model/validuser');
 const { MongoClient } = require('mongodb');
 const axios = require('axios');
 const verifyToken = require('../verifyToken');

router.post('/sendOTP', async (req, res) => {
  const phone = req.body.phone;

  try {
    // Check if the user already exists with the given phone
    const existingUser = await signup.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const otp = Math.floor(Math.random() * (9999 - 1000)) + 1000;
    const otpRequest = {
      method: 'get',
      url:`https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/${otp}/:otp_template_name`,
      headers: {
        Accept: 'application/json',
      },
    };

    axios(otpRequest)
      .then((resp) => {
       // console.log(String(resp.data.OTP).slice(0,resp.data.OTP.length -2));
       console.log(resp.data);
        res.status(200).json({ message: 'OTP sent successfully', generatedOTP: otp });
      })
      .catch((err) => {
        console.error('Error:', err);
        res.status(400).json({ message: 'Failed to send OTP' });
      });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024, // 50 KB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG images are allowed'), false);
    }
  },
});
router.post('/upload', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    try {
      console.log("..........enter...........");
      const { regNo, phone, password } = req.body;

      // Check if the user already exists with the given phone
      const existingUser = await signup.findOne({ phone });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Generate a salt to use for password hashing
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);

      // Hash the password using the generated salt
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create a new user instance
      const newUser = new signup({
        regNo,
        phone,
        password: hashedPassword,
        isRegisteredUser: false,
      });

      // Check if an image was uploaded
      if (req.file) {
        newUser.img = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          name: req.file.originalname, // Provide the name property
        };
      }

      // Save the user to the database
      await newUser.save();

      res.status(200).json({ message: 'User registered and image uploaded successfully' });
    } catch (error) {
          // Additional error handling for multer errors
      if (err instanceof multer.MulterError == false) {
        console.log("...........error...................");
        return res.status(404).json({ message: 'Only JPEG images are allowed' });
      } else if (err instanceof multer.MulterError == true) {
        return res.status(404).json({ message: 'File size limit exceeded (50 KB max)' });
        
      } else {
        //return res.status(404).json({ message: 'File size limit exceeded (50 KB max)' });
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
});


router.post('/login', async (req, res) => {
  try {
    const { regNo, password } = req.body;

    // Check if the user exists with the given regNo
    const user = await signup.findOne({ regNo });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });
    return res.status(200).json({ message: 'login successful', token});
    // Respond with the generated token
   // res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// router.get('/download/:id', async (req, res) => {
//   try {
//     const user = await signup.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     const img = user.img;

//     if (!img || !img.data) {
//       return res.status(404).json({ message: 'Image not found in user document' });
//     }

//     res.set('Content-Type', img.contentType);
//     res.set('Content-Disposition', `attachment; filename="${img.name}"`);
//     res.send(img.data);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

router.get('/list_users', async (req, res) => {
  try {
    // Fetch regNo, phone, and img fields from the signup schema
    const users = await signup.find({}, 'regNo phone img');

    // Convert binary image data to Base64
    const usersWithBase64Image = users.map(user => {
      return {
        regNo: user.regNo,
        phone: user.phone,
        img: user.img && user.img.data ? user.img.data.toString('base64') : null,
      };
    });

    // Respond with the array of user data including Base64 image
    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    // Log the error
    console.error(error);

    // Respond with a 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/validUser/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user in the signup schema by ID
    const user = await signup.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new validUser object with all the details from the signup document
    const { _id, regNo, phone, password, img, isRegisteredUser } = user;
    const newUser = new validuser({
      _id,
      regNo,
      phone,
      password,
      img,
      isRegisteredUser: true,
    });

    // Save the new user object in the validUser schema
    await newUser.save();

    // Delete the user from the signup schema
    await signup.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User registration updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
