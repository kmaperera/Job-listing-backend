import multer from "multer";

const storage = multer.memoryStorage(); // store file in memory before upload
const upload = multer({ storage });

export default upload;