const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const HummusRecipe = require('hummus-recipe');

const app = express();
const port = 8000;


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Serve static files
app.use(express.static('public'));

// Handle PDF encryption
app.post('/encrypt', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join('uploads', `encrypted_${Date.now()}.pdf`);
    const password = req.body.password || 'default';

    try {
        const pdfDoc = new HummusRecipe(inputPath, outputPath);
        pdfDoc.encrypt({
            userPassword: password,
            ownerPassword: password,
            userProtectionFlag: 4
        }).endPDF();

        // Send file and cleanup after a delay
        res.download(outputPath, 'encrypted.pdf', (err) => {
            if (err) {
                console.error('Download error:', err);
                // Clean up files even if download fails
                cleanupFiles(inputPath, outputPath);
                return;
            }
            
            // Add a delay before cleanup to avoid EBUSY error
            setTimeout(() => {
                cleanupFiles(inputPath, outputPath);
            }, 5000); // 5 second delay
        });
    } catch (error) {
        console.error('Error encrypting PDF:', error);
        cleanupFiles(inputPath);
        res.status(500).json({ error: 'Error encrypting PDF' });
    }
});

// Helper function to safely cleanup files
function cleanupFiles(...filePaths) {
    filePaths.forEach(filePath => {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                if (error.code !== 'EBUSY') {
                    console.error(`Error deleting file ${filePath}:`, error);
                }
            }
        }
    });
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}); 