import path from 'path';
import { fileURLToPath } from 'url';
import { TryCatch } from '../utility/TryCatch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getResumeData = TryCatch(async (req, res) => {
    const resumePath = path.join(__dirname, '../public/Ayush_Dubey___Resume.pdf');
    const fileName = 'Ayush_Dubey___Resume.pdf';

    res.download(resumePath, fileName, (err) => {
        if (err) {
            console.error('Error downloading resume:', err);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error downloading resume file' });
            }
        }
    });
});