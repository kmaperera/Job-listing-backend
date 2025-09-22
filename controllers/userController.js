import cloudinary from "../utils/cloudinary.js";
import pool from "../config/dbConnection.js";
import {
  insertEmployerDetailsQuery,
  getEmployerDetailsQuery,
  updateEmployerDetailsQuery,
  getProfilePictureQuery,
  deleteProfilePictureQuery
} from "../queries/userQueries.js";

// Add employer details (only once after register)
export const createEmployerProfile = async (req, res) => {
  try {
    const userId = req.user.id; // JWT user_id
    const {
      company_name,
      company_address,
      company_website,
      contact_number,
      industry,
      description
    } = req.body;

    if (!company_name || !company_address) {
      return res.status(400).json({ error: "Company name and address are required" });
    }

    let profilePictureUrl = null;

    // Cloudinary upload from memory buffer
    if (req.file) {
      const uploadFromBuffer = (fileBuffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "employers/profile_pictures" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(fileBuffer);
        });

      const result = await uploadFromBuffer(req.file.buffer);
      profilePictureUrl = result.secure_url;
    }

    // Insert employer profile
    await pool.query(
      insertEmployerDetailsQuery,
      [userId, company_name, company_address, company_website, contact_number, industry, description, profilePictureUrl]
    );

    res.json({
      message: "Employer profile created successfully",
    });

  } catch (err) {
    console.error("Create Employer Error:", err);
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
    const userId = req.user.id;

    let profilePictureUrl = null;

    // If file uploaded, upload to Cloudinary
    if (req.file) {
      const uploadFromBuffer = (fileBuffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "employers/profile_pictures" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(fileBuffer);
        });

      const result = await uploadFromBuffer(req.file.buffer);
      profilePictureUrl = result.secure_url;
    }

    // Update text fields (if any)
    const data = req.body || {};
    const fields = Object.keys(data).filter(
      (key) => data[key] !== undefined && data[key] !== ""
    );

    const values = fields.map((key) => data[key]);

    // Add profile_picture to update if uploaded
    if (profilePictureUrl) {
      fields.push("profile_picture");
      values.push(profilePictureUrl);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields or file to update" });
    }

    values.push(userId); // WHERE condition

    await pool.query(
      `UPDATE employer SET ${fields.map((f) => f + " = ?").join(", ")} WHERE user_id = ?`,
      values
    );

    res.json({
      message: "Employer profile updated successfully",
      profile_picture: profilePictureUrl || undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete profile picture
export const deleteProfilePicture = async (req, res) => {
  try {
    const [rows] = await pool.query(getProfilePictureQuery, [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Employer not found" });
    }

    const currentPic = rows[0].profile_picture;
    if (!currentPic) {
      return res.status(400).json({ error: "No profile picture to delete" });
    }

    // Extract Cloudinary public_id
    const parts = currentPic.split("/");
    const fileWithExt = parts[parts.length - 1];
    const publicId = "employers/" + fileWithExt.split(".")[0];

    await cloudinary.uploader.destroy(publicId);

    await pool.query(deleteProfilePictureQuery, [req.user.id]);

    res.json({ message: "Profile picture deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};