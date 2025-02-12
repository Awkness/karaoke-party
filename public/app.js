// Generate random hue (0-360) with three shades
const generateColorScheme = () => {
  const hue = Math.floor(Math.random() * 360);
  return {
    primary: `hsl(${hue}, 30%, 25%)`,    // Dark shade
    secondary: `hsl(${hue}, 30%, 85%)`,   // Light shade
    accent: `hsl(${hue}, 30%, 55%)`       // Medium shade
  };
};

// Store color scheme in session storage
const colors = sessionStorage.getItem('colorScheme') 
  ? JSON.parse(sessionStorage.getItem('colorScheme'))
  : generateColorScheme();
sessionStorage.setItem('colorScheme', JSON.stringify(colors));

// Apply colors to root element
document.documentElement.style.setProperty('--color-primary', colors.primary);
document.documentElement.style.setProperty('--color-secondary', colors.secondary);
document.documentElement.style.setProperty('--color-accent', colors.accent);

// State management
let currentSection = 'see';
let songs = [];
let isAdmin = false;

// DOM Elements
const root = document.getElementById('root');

// Fetch songs from server
async function fetchSongs() {
  try {
    const response = await fetch('/api/songs');
    songs = await response.json();
    render();
  } catch (err) {
    console.error('Error fetching songs:', err);
  }
}

// Add new song
async function addSong(code, name, singer) {
  try {
    const response = await fetch('/api/songs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, name, singer })
    });
    if (response.ok) {
      await fetchSongs();
    }
  } catch (err) {
    console.error('Error adding song:', err);
  }
}

// Delete song
async function deleteSong(id) {
  try {
    const response = await fetch(`/api/songs/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      await fetchSongs();
    }
  } catch (err) {
    console.error('Error deleting song:', err);
  }
}

// Render functions
function renderAddSection() {
  return `
    <div class="section">
      <form id="addForm" class="form">
        <div class="form-group">
          <label class="title-font">Your Name</label>
          <input type="text" name="singer" placeholder="Enter your name" required class="body-font">
        </div>
        <div class="form-group">
          <label class="title-font">Song Code</label>
          <input type="text" name="code" placeholder="Enter song code" class="body-font">
        </div>
        <div class="form-group">
          <label class="title-font">Song Name</label>
          <input type="text" name="name" placeholder="Enter song name" required class="body-font">
        </div>
        <button type="submit" class="title-font">Add Song</button>
      </form>
    </div>
  `;
}

function renderSeeSection() {
  return `
    <div class="section">
      <div class="song-list">
        ${songs.map(song => `
          <div class="song-item">
            <div class="singer title-font">${song.singer}</div>
            <div class="song-details body-font">
              <span>Song: ${song.name}</span>
              ${song.code ? `<span>Code: ${song.code}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderEditSection() {
  if (!isAdmin) {
    return `
      <div class="section">
        <form id="adminForm" class="form">
          <div class="form-group">
            <label class="title-font">Admin Password</label>
            <input type="password" name="password" placeholder="Enter password" required class="body-font">
          </div>
          <button type="submit" class="title-font">Login</button>
        </form>
      </div>
    `;
  }

  return `
    <div class="section">
      <div class="song-list">
        ${songs.map(song => `
          <div class="song-item">
            <div class="song-content">
              <div class="singer title-font">${song.singer}</div>
              <div class="song-details body-font">
                <span>Song: ${song.name}</span>
                ${song.code ? `<span>Code: ${song.code}</span>` : ''}
              </div>
            </div>
            <button class="delete-btn" data-id="${song.id}">×</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function render() {
  root.innerHTML = `
    <div class="container">
      <h1 class="title title-font">Karaoke Party</h1>
      ${currentSection === 'add' ? renderAddSection() :
        currentSection === 'see' ? renderSeeSection() :
        renderEditSection()}
      <nav class="nav title-font">
        <button class="${currentSection === 'add' ? 'active' : ''}" data-section="add">ADD</button>
        <div class="nav-divider">|</div>
        <button class="${currentSection === 'see' ? 'active' : ''}" data-section="see">SEE</button>
        <div class="nav-divider">|</div>
        <button class="${currentSection === 'edit' ? 'active' : ''}" data-section="edit">EDIT</button>
      </nav>
    </div>
  `;

  // Add event listeners
  addEventListeners();
}

// Event listeners
function addEventListeners() {
  // Navigation
  document.querySelectorAll('nav button').forEach(button => {
    button.addEventListener('click', (e) => {
      currentSection = e.target.dataset.section;
      render();
    });
  });

  // Add form
  const addForm = document.getElementById('addForm');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      await addSong(
        formData.get('code'),
        formData.get('name'),
        formData.get('singer')
      );
      e.target.reset();
    });
  }

  // Admin form
  const adminForm = document.getElementById('adminForm');
  if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = new FormData(e.target).get('password');
      if (password === 'admin123') {
        isAdmin = true;
        render();
      }
    });
  }

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await deleteSong(id);
    });
  });
}

// Initial render
fetchSongs();
render();

// Poll for updates
setInterval(fetchSongs, 5000); 