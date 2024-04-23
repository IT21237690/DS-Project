const express = require('express');
const router = express.Router();
const Course = require('../models/course');
const authorization = require('../controllers/authorization');
const multer = require('multer'); // Middleware for handling file uploads

//authorization should be passed
router.post('/add',  async (req, res) => {
    try {
      // if (!req.isAdmin) {
      //   return res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
      // }
      const course = await Course.create(req.body);
      res.status(201).json(course);
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error occurred
        return res.status(400).json({ message: 'Course code is already used' });
      } else {
        // Other errors
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    }
  });
  
//authorization should be passed
  router.get('/allCourses', async (req, res) => {
    try {
      const courses = await Course.find();
      res.json(courses);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  
  // READ single course
  //authorization should be passed
  router.get('/get/:code', async (req, res) => {
    try {
      // if (!req.isAdmin && !req.isFaculty) {
      //   return res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
      // }
      const course = await Course.findOne({code: req.params.code});
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json(course);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
// UPDATE
//authorization should be passed
// router.patch('/update/:code', async (req, res) => {
//   try {
//     // if (!req.isAdmin && !req.isFaculty) {
//     //   return res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
//     // }

//     const course = await Course.findOne({ code: req.params.code });
//     if (!course) {
//       return res.status(404).json({ message: 'Course not found' });
//     }

//     // Remove the 'code' property from req.body to ensure it cannot be updated
//     delete req.body.code;

//     // Loop through each property in req.body and update only if it's different
//     for (let key in req.body) {
//       if (course[key] !== req.body[key]) {
//         course[key] = req.body[key];
//       }
//     }

//     await course.save();
//     res.json(course);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });



//authorization should be passed
router.delete('/delete/:code', async (req, res) => {
  try {
    // if (!req.isAdmin && !req.isFaculty) {
    //   return res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
    // }
    const course = await Course.findOneAndDelete({ code: req.params.code });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Multer configuration for storing uploaded videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/videos'); // Destination folder for storing videos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Rename the video file
  }
});

const upload = multer({ storage: storage });

// API endpoint for uploading videos
router.post('/:courseId/videos', upload.single('video'), async (req, res) => {
  try {
    const courseId = req.params.courseId;
    // console.log("course id : " ,req.params.courseId)
    const { title, url } = req.body;
    
    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).send('Course not found');
    }
    // Add the uploaded video to the course's videos array
    //if sorting the file path url: req.file.path 
    course.videos.push({ title, url });
    // console.log("course url : " ,url)
    await course.save();
    res.status(201).send('Video uploaded successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.patch('/update/:code', upload.single('video'), async (req, res) => {
  try {
    const { code } = req.params;
    let course = await Course.findOne({ code });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Update course properties (excluding video)
    for (let key in req.body) {
      if (key !== 'video') {
        course[key] = req.body[key];
      }
    }

    // Handle video update logic
    if (req.file) {
      const { video } = req.body; // Assuming 'video' field contains title for identification

      const existingVideoIndex = course.videos.findIndex(
        (videoItem) => videoItem.title === video
      );

      if (existingVideoIndex !== -1) {
        // Update existing video
        course.videos[existingVideoIndex].url = req.file.path;
      } else {
        // Add new video (consider error handling for duplicate titles)
        course.videos.push({ title: video, url: req.file.path }); // Assuming 'video' field is the title
      }
    } else {
      // No new video uploaded, maintain existing videos
      // (Optional: Consider adding a flag to explicitly remove a video if needed)
    }

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:courseId/videos/:videoId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const videoId = req.params.videoId;

    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the index of the video in the course's videos array
    const videoIndex = course.videos.findIndex(video => video._id === videoId);
    // if (videoIndex === -1) {
    //   return res.status(404).json({ message: 'Video not found' });
    // }

    // Remove the video from the course's videos array
    course.videos.splice(videoIndex, 1);

    // Save the course without the deleted video
    await course.save();

    res.json({ message: 'Video deleted successfully', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  
  

module.exports = router;
