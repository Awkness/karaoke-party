import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());

// Determine if we're in production (Glitch) or development
const isProduction = process.env.PROJECT_DOMAIN || process.env.NODE_ENV === 'production';

// Configure data directory based on environment
const DATA_DIR = isProduction ? '/app/.data' : 'data';
const SONGS_FILE = path.join(DATA_DIR, 'songs.json');

// Serve static files
if (isProduction) {
  app.use(express.static('dist'));
} else {
  app.use(express.static('public'));
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log(`Data directory ensured at: ${DATA_DIR}`);
  } catch (err) {
    console.error('Error creating data directory:', err);
    if (err.code !== 'EEXIST') throw err;
  }
}

// Initialize songs file if it doesn't exist
async function initSongsFile() {
  try {
    await fs.access(SONGS_FILE);
    console.log('Songs file exists');
  } catch {
    console.log('Creating new songs file');
    await fs.writeFile(SONGS_FILE, JSON.stringify([]));
  }
}

// Read songs from file
async function readSongs() {
  try {
    const data = await fs.readFile(SONGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading songs:', err);
    return [];
  }
}

// Write songs to file
async function writeSongs(songs) {
  await fs.writeFile(SONGS_FILE, JSON.stringify(songs, null, 2));
}

// Initialize data storage
(async () => {
  await ensureDataDir();
  await initSongsFile();
})();

// Auto-delete first song every 6 minutes
setInterval(async () => {
  try {
    const songs = await readSongs();
    if (songs.length > 0) {
      songs.shift();
      await writeSongs(songs);
    }
  } catch (err) {
    console.error('Error in auto-delete:', err);
  }
}, 6 * 60 * 1000);

// Routes
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await readSongs();
    // Sort songs by timestamp in ascending order (oldest first)
    songs.sort((a, b) => b.timestamp - a.timestamp);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

app.post('/api/songs', async (req, res) => {
  try {
    const { code, name, singer } = req.body;
    if (!name || !singer) {
      return res.status(400).json({ error: 'Name and singer are required' });
    }
    
    const songs = await readSongs();
    // Sort songs by position to find the highest number
    const maxPosition = songs.reduce((max, song) => Math.max(max, song.position || 0), 0);
    
    const newSong = {
      id: Date.now().toString(),
      code,
      name,
      singer,
      timestamp: Date.now(),
      position: maxPosition + 1  // Add to the end of the list
    };
    
    songs.push(newSong);
    await writeSongs(songs);
    res.status(201).json(newSong);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add song' });
  }
});

app.delete('/api/songs/:id', async (req, res) => {
  try {
    const songs = await readSongs();
    const filteredSongs = songs.filter(song => song.id !== req.params.id);
    await writeSongs(filteredSongs);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete song' });
  }
});

// Serve the main page for all routes
app.get('*', (req, res) => {
  if (isProduction) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${isProduction ? 'Production (Glitch)' : 'Development'}`);
}); 