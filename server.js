const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Data storage setup
const DATA_DIR = '.data';
const SONGS_FILE = path.join(DATA_DIR, 'songs.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error('Error creating data directory:', err);
      throw err;
    }
  }
}

// Initialize songs file if it doesn't exist
async function initSongsFile() {
  try {
    await fs.access(SONGS_FILE);
  } catch {
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
    const maxPosition = songs.reduce((max, song) => Math.max(max, song.position || 0), 0);
    
    const newSong = {
      id: Date.now().toString(),
      code,
      name,
      singer,
      timestamp: Date.now(),
      position: maxPosition + 1
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

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 