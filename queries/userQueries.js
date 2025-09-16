// Update Profile Picture
export const updateProfilePictureQuery = `
    UPDATE users SET profile_picture = ? WHERE user_id = ?
`;

// Get Profile Picture
export const getUserProfileQuery = `
    SELECT user_id, userName, email, role, profile_picture, created_at
    FROM users
    WHERE user_id = ?
`;

//Remove Profile Picture
export const removeProfilePictureQuery = `
    UPDATE users SET profile_picture = NULL WHERE user_id = ?
`;

//Insert Employer Details
export const insertEmployerDetailsQuery = `
    INSERT INTO employer 
    (user_id, company_name, company_address, company_website, contact_number, industry)
    VALUES (?, ?, ?, ?, ?, ?)
`;

//Get Employer Details
export const getEmployerDetailsQuery = `
    SELECT u.user_id, u.userName, u.email, u.role, e.profile_picture,
           e.company_name, e.company_address, e.company_website, 
           e.contact_number, e.industry
    FROM users u
    JOIN employer e ON u.user_id = e.user_id
    WHERE u.user_id = ?
`;

//Update Employer Details
export const updateEmployerDetailsQuery = `
    UPDATE employer 
    SET company_name = ?, company_address = ?, company_website = ?, 
        contact_number = ?, industry = ?
    WHERE user_id = ?
`;