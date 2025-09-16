import express from 'express';
import { 
    createEmployerProfile,
    getEmployerDetails,
    updateEmployerDetails,
    updateProfilePicture, 
    getUserProfile,
    deleteProfilePicture,
} from '../controllers/userController.js';
import upload from '../utils/multer.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Add employer details
router.post("/employer/details", verifyToken, createEmployerProfile);

// Get employer details
router.get("/employer/details", verifyToken, getEmployerDetails);

// Update employer details
router.put("/employer/details", verifyToken, updateEmployerDetails);


// Upload profile picture
router.post(
  "/profile-picture",
  upload.single("profile_picture"), // expects form-data field name 'profile_picture'
  verifyToken,
  updateProfilePicture
);

// Get user profile info
router.get("/profile", verifyToken, getUserProfile);

// Delete profile picture
router.delete("/profile-picture", verifyToken, deleteProfilePicture);

export default router;