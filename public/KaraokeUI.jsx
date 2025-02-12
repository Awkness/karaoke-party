import React, { useState, useEffect } from 'react';
import styles from './KaraokeUI.module.css';

// Generate random hue (0-360) with three shades
const generateColorScheme = () => {
  const hue = Math.floor(Math.random() * 360);
  return {
    primary: `hsl(${hue}, 30%, 25%)`,    // Dark shade
    secondary: `hsl(${hue}, 30%, 85%)`,   // Light shade
    accent: `hsl(${hue}, 30%, 55%)`       // Medium shade
  };
};

const KaraokeUI = () => {
  const [currentSection, setCurrentSection] = useState('see');
  const [songs, setSongs] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Initialize color scheme
    const colors = sessionStorage.getItem('colorScheme')
      ? JSON.parse(sessionStorage.getItem('colorScheme'))
      : generateColorScheme();
    sessionStorage.setItem('colorScheme', JSON.stringify(colors));

    // Apply colors to root element
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-secondary', colors.secondary);
    document.documentElement.style.setProperty('--color-accent', colors.accent);

    // Fetch initial songs
    fetchSongs();

    // Set up polling
    const interval = setInterval(fetchSongs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      setSongs(data);
    } catch (err) {
      console.error('Error fetching songs:', err);
    }
  };

  const addSong = async (code, name, singer) => {
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
  };

  const deleteSong = async (id) => {
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
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await addSong(
      formData.get('code'),
      formData.get('name'),
      formData.get('singer')
    );
    e.target.reset();
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    const password = new FormData(e.target).get('password');
    if (password === 'admin123') {
      setIsAdmin(true);
    }
  };

  const renderAddSection = () => (
    <div className={styles.section}>
      <form id="addForm" className={styles.form} onSubmit={handleAddSubmit}>
        <div className={styles['form-group']}>
          <label className={styles['title-font']}>Your Name</label>
          <input type="text" name="singer" placeholder="Enter your name" required className={styles['body-font']} />
        </div>
        <div className={styles['form-group']}>
          <label className={styles['title-font']}>Song Code</label>
          <input type="text" name="code" placeholder="Enter song code" className={styles['body-font']} />
        </div>
        <div className={styles['form-group']}>
          <label className={styles['title-font']}>Song Name</label>
          <input type="text" name="name" placeholder="Enter song name" required className={styles['body-font']} />
        </div>
        <button type="submit" className={styles['title-font']}>Add Song</button>
      </form>
    </div>
  );

  const renderSeeSection = () => (
    <div className={styles.section}>
      <div className={styles['song-list']}>
        {songs.map(song => (
          <div key={song.id} className={styles['song-item']}>
            <div className={`${styles.singer} ${styles['title-font']}`}>{song.singer}</div>
            <div className={`${styles['song-details']} ${styles['body-font']}`}>
              <span>Song: {song.name}</span>
              {song.code && <span>Code: {song.code}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEditSection = () => {
    if (!isAdmin) {
      return (
        <div className={styles.section}>
          <form id="adminForm" className={styles.form} onSubmit={handleAdminSubmit}>
            <div className={styles['form-group']}>
              <label className={styles['title-font']}>Admin Password</label>
              <input type="password" name="password" placeholder="Enter password" required className={styles['body-font']} />
            </div>
            <button type="submit" className={styles['title-font']}>Login</button>
          </form>
        </div>
      );
    }

    return (
      <div className={styles.section}>
        <div className={styles['song-list']}>
          {songs.map(song => (
            <div key={song.id} className={styles['song-item']}>
              <div className={styles['song-content']}>
                <div className={`${styles.singer} ${styles['title-font']}`}>{song.singer}</div>
                <div className={`${styles['song-details']} ${styles['body-font']}`}>
                  <span>Song: {song.name}</span>
                  {song.code && <span>Code: {song.code}</span>}
                </div>
              </div>
              <button className={styles['delete-btn']} onClick={() => deleteSong(song.id)}>×</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={`${styles.title} ${styles['title-font']}`}>Karaoke Party</h1>
      {currentSection === 'add' ? renderAddSection() :
       currentSection === 'see' ? renderSeeSection() :
       renderEditSection()}
      <nav className={`${styles.nav} ${styles['title-font']}`}>
        <button 
          className={currentSection === 'add' ? styles.active : ''} 
          onClick={() => setCurrentSection('add')}
        >
          ADD
        </button>
        <div className={styles['nav-divider']}>|</div>
        <button 
          className={currentSection === 'see' ? styles.active : ''} 
          onClick={() => setCurrentSection('see')}
        >
          SEE
        </button>
        <div className={styles['nav-divider']}>|</div>
        <button 
          className={currentSection === 'edit' ? styles.active : ''} 
          onClick={() => setCurrentSection('edit')}
        >
          EDIT
        </button>
      </nav>
    </div>
  );
};

export default KaraokeUI; 