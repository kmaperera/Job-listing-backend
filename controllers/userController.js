import cloudinary from "../utils/cloudinary.js";
import pool from "../config/dbConnection.js";
import {
    insertEmployerDetailsQuery,
    getEmployerDetailsQuery,
    updateEmployerDetailsQuery,
    updateProfilePictureQuery,
    getUserProfileQuery,
    removeProfilePictureQuery
} from "../queries/userQueries.js";


// Add employer details (only once after register)
export const createEmployerProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from verifyToken middleware
    const {
      company_name,
      company_address,
      company_website,
      contact_number,
      industry,
      description
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID missing" });
    }

    await pool.query(
      `INSERT INTO employer
      (user_id, company_name, company_address, company_website, contact_number, industry, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, company_name, company_address, company_website, contact_number, industry, description]
    );

    res.json({ message: "Employer profile created successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employer details
export const getEmployerDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(getEmployerDetailsQuery, [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Employer details not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update employer details
export const updateEmployerDetails = async (req, res) => {
  try {
    const { company_name, company_address, company_website, contact_number, industry } = req.body;

    await pool.query(updateEmployerDetailsQuery, [
      company_name,
      company_address,
      company_website,
      contact_number,
      industry,
      req.user.user_id
    ]);

    res.json({ message: "Employer details updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Upload or update profile picture
export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to Cloudinary
    cloudinary.uploader.upload_stream(
      { folder: "profile_pictures" },
      async (error, result) => {
        if (error) return res.status(500).json({ error: error.message });

        // Save Cloudinary URL
        await pool.query(updateProfilePictureQuery, [
          result.secure_url,
          req.user.user_id,
        ]);

        res.json({
          message: "Profile picture uploaded successfully",
          profile_picture: result.secure_url,
        });
      }
    ).end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user profile (with profile picture)
export const getUserProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(getUserProfileQuery, [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete profile picture
export const deleteProfilePicture = async (req, res) => {
  try {
    // Get current profile picture
    const [rows] = await pool.query(getUserProfileQuery, [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentPic = rows[0].profile_picture;

    if (currentPic) {
      // Extract public_id from Cloudinary URL
      const parts = currentPic.split("/");
      const fileWithExt = parts[parts.length - 1]; // e.g. "abc123.jpg"
      const publicId = "profile_pictures/" + fileWithExt.split(".")[0];

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(publicId);
    }

    // Remove from DB
    await pool.query(removeProfilePictureQuery, [req.user.id]);

    res.json({ message: "Profile picture deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};