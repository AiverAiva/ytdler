const express = require('express');
const ytdlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp4';

    if (!videoUrl) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        // First, get video information to retrieve the title
        const info = await ytdlp(videoUrl, { dumpSingleJson: true });
        const title = info.title.replace(/[\/\\:*?"<>|]/g, ''); // Clean up the title for filenames
        const outputFileName = format === 'mp3' ? `${title}.mp3` : `${title}.mp4`;
        const outputPath = path.join(__dirname, outputFileName);

        // Define options specifically for MP3 and MP4 separately
        const options = format === 'mp3'
            ? {
                output: outputPath,
                extractAudio: true, // This extracts the audio from the video file
                audioFormat: 'mp3', // Ensures it converts to mp3
                audioQuality: '192K', // Specifies the quality for the audio
            }
            : {
                output: outputPath,
                format: 'bestvideo+bestaudio/best', // Fetch the best video+audio quality
                mergeOutputFormat: 'mp4', // Ensures output is in mp4
            };

        // Download using yt-dlp
        await ytdlp(videoUrl, options);

        // Send the file to the client
        res.download(outputPath, outputFileName, (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).send("Failed to download file.");
            }
            fs.unlinkSync(outputPath); // Clean up the file after sending
        });
    } catch (error) {
        console.error("Download error:", error);
        res.status(500).send("Server error occurred.");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
