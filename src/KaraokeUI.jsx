import React, { useState, useEffect, useRef } from 'react';
import { Trash2, ChevronUp, ChevronDown, RotateCw } from 'lucide-react';
import styles from './KaraokeUI.module.css';
import cloudwalkLogo from '../0101_CloudWalk_Logo.svg';

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
  const [activeSection, setActiveSection] = useState('see');
  const [colors, setColors] = useState(generateColorScheme());
  const [songList, setSongList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [newSong, setNewSong] = useState({
    code: '',
    name: '',
    singer: ''
  });
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const itemHeight = 166; // 150px height + 16px gap
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const [pullToRefresh, setPullToRefresh] = useState({ pulling: false, progress: 0 });
  const elasticLimit = 150; // maximum pull distance

  // Array of karaoke-related emojis
  const karaokeEmojis = ['🎤', '🎵', '🎶', '🎸', '🎹', '🎼', '🎙️', '🎭', '🎪'];
  const [titleEmoji] = useState(karaokeEmojis[Math.floor(Math.random() * karaokeEmojis.length)]);

  const calculateScrollPosition = (index, containerHeight) => {
    if (index === 0) {
      // First item should be at the top with a small padding
      return 20;
    } else {
      // Center other items
      return -(index * itemHeight) + (containerHeight / 2 - itemHeight / 2);
    }
  };

  // Reset scroll position and focused index when switching sections
  useEffect(() => {
    setFocusedIndex(0);
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      setScrollPosition(calculateScrollPosition(0, containerHeight));
    }
  }, [activeSection, songList.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let startScrollPosition = 0;
    let currentDragDistance = 0;
    let isDragging = false;
    let lastTouchY = 0;
    let startTime = 0;
    let pullDistance = 0;

    const handleTouchStart = (e) => {
      e.preventDefault();
      touchStartY = e.touches[0].clientY;
      lastTouchY = touchStartY;
      startScrollPosition = scrollPosition;
      startTime = Date.now();
      isDragging = false;
      currentDragDistance = 0;
      pullDistance = 0;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaY = touch.clientY - lastTouchY;
      const totalDeltaY = touch.clientY - touchStartY;
      
      // Set dragging after small threshold
      if (Math.abs(totalDeltaY) > 5) {
        isDragging = true;
      }

      // Handle pull-to-refresh at the top
      if (focusedIndex === 0 && deltaY > 0) {
        pullDistance = Math.min(pullDistance + deltaY, elasticLimit);
        const progress = (pullDistance / elasticLimit) * 100;
        setPullToRefresh({ pulling: true, progress });
        setScrollPosition(20 + (pullDistance / 2)); // Add to initial padding
        lastTouchY = touch.clientY;
        return;
      }

      // Reset pull-to-refresh when pulling down
      if (pullDistance > 0 && deltaY < 0) {
        pullDistance = Math.max(0, pullDistance + deltaY);
        const progress = (pullDistance / elasticLimit) * 100;
        setPullToRefresh({ pulling: progress > 0, progress });
        setScrollPosition(20 + (pullDistance / 2));
        lastTouchY = touch.clientY;
        return;
      }

      currentDragDistance = totalDeltaY;
      const dragIndexChange = Math.round(currentDragDistance / itemHeight);
      const maxIndex = Math.min(songList.length - 1, 9);
      const newIndex = Math.min(Math.max(0, focusedIndex - dragIndexChange), maxIndex);

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        const containerHeight = container.clientHeight;
        const newPosition = calculateScrollPosition(newIndex, containerHeight);
        setScrollPosition(newPosition);
      }

      lastTouchY = touch.clientY;
    };

    const handleTouchEnd = (e) => {
      const endTime = Date.now();
      const timeElapsed = endTime - startTime;
      const velocity = currentDragDistance / timeElapsed;

      // Handle pull-to-refresh completion
      if (pullToRefresh.progress >= 100) {
        window.location.reload();
        return;
      }

      // Reset pull-to-refresh
      setPullToRefresh({ pulling: false, progress: 0 });

      // Handle click vs drag
      if (!isDragging && Math.abs(currentDragDistance) < 5) {
        // This was a click/tap
        return;
      }

      // Apply momentum scrolling
      const momentumThreshold = 0.5;
      if (Math.abs(velocity) > momentumThreshold) {
        const direction = velocity > 0 ? -1 : 1;
        const maxIndex = Math.min(songList.length - 1, 9);
        const newIndex = Math.min(Math.max(0, focusedIndex + direction), maxIndex);
        
        setFocusedIndex(newIndex);
        const containerHeight = container.clientHeight;
        const newPosition = calculateScrollPosition(newIndex, containerHeight);
        setScrollPosition(newPosition);
      } else {
        // Snap to current focused item
        const containerHeight = container.clientHeight;
        const newPosition = calculateScrollPosition(focusedIndex, containerHeight);
        setScrollPosition(newPosition);
      }
    };

    // Handle mouse wheel for desktop (optional)
    const handleWheel = (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      const maxIndex = Math.min(songList.length - 1, 9);
      const newIndex = Math.min(Math.max(0, focusedIndex + direction), maxIndex);

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        const containerHeight = container.clientHeight;
        const newPosition = calculateScrollPosition(newIndex, containerHeight);
        setScrollPosition(newPosition);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [focusedIndex, songList.length, pullToRefresh.progress, scrollPosition]);

  useEffect(() => {
    // Initialize color scheme
    const colors = generateColorScheme();
    setColors(colors);
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
      setSongList(data);
    } catch (err) {
      console.error('Error fetching songs:', err);
    }
  };

  const addSong = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSong)
      });
      if (response.ok) {
        setNewSong({ code: '', name: '', singer: '' });
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

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAdmin(true);
      setActiveSection('edit');
    }
    setPassword('');
  };

  const getSongItemClass = (index) => {
    const distance = Math.abs(index - focusedIndex);
    const baseClass = styles['song-item'];
    return `${baseClass} ${distance === 0 ? styles.focused : styles.blurred}`;
  };

  // Custom styles for placeholder text
  const placeholderStyles = `
    .custom-input::placeholder {
      color: ${colors.accent} !important;
      opacity: 0.8;
    }
  `;

  const renderAddSection = () => (
    <div className="w-full max-w-md mx-auto p-4">
      <form className="space-y-4" onSubmit={addSong}>
        <div>
          <input
            type="text"
            placeholder="Song Code"
            className="w-full p-2 bg-transparent border custom-input"
            style={{ 
              borderColor: colors.accent, 
              color: colors.secondary
            }}
            value={newSong.code}
            onChange={(e) => setNewSong(prev => ({ ...prev, code: e.target.value }))}
            onFocus={(e) => e.target.style.borderColor = colors.secondary}
            onBlur={(e) => e.target.style.borderColor = colors.accent}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Song Name"
            className="w-full p-2 bg-transparent border custom-input"
            style={{ 
              borderColor: colors.accent, 
              color: colors.secondary
            }}
            value={newSong.name}
            onChange={(e) => setNewSong(prev => ({ ...prev, name: e.target.value }))}
            required
            onFocus={(e) => e.target.style.borderColor = colors.secondary}
            onBlur={(e) => e.target.style.borderColor = colors.accent}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Your Name"
            className="w-full p-2 bg-transparent border custom-input"
            style={{ 
              borderColor: colors.accent, 
              color: colors.secondary
            }}
            value={newSong.singer}
            onChange={(e) => setNewSong(prev => ({ ...prev, singer: e.target.value }))}
            required
            onFocus={(e) => e.target.style.borderColor = colors.secondary}
            onBlur={(e) => e.target.style.borderColor = colors.accent}
          />
        </div>
        <button
          type="submit"
          className="w-full p-2 border"
          style={{ borderColor: colors.secondary, color: colors.secondary }}
        >
          Add Song
        </button>
      </form>
    </div>
  );

  const handleSongClick = (index) => {
    setFocusedIndex(index);
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const newPosition = calculateScrollPosition(index, containerHeight);
      setScrollPosition(newPosition);
    }
  };

  const renderSongList = (songs) => (
    <div className={styles.section}>
      {pullToRefresh.pulling && (
        <div 
          className={styles['refresh-indicator']}
          style={{ 
            opacity: pullToRefresh.progress / 100,
            transform: `rotate(${pullToRefresh.progress * 3.6}deg)`
          }}
        >
          <RotateCw size={24} color={colors.secondary} />
        </div>
      )}
      <div className={styles['song-list-container']} ref={containerRef}>
        <div 
          className={styles['song-list']} 
          ref={listRef}
          style={{ 
            transform: `translateY(${scrollPosition}px)`,
            transition: pullToRefresh.pulling ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {songs.map((song, index) => (
            <div
              key={song.id}
              className={getSongItemClass(index)}
              style={{ borderColor: colors.accent }}
              onClick={() => handleSongClick(index)}
            >
              <div className={styles['song-header']}>
                <div className={`${styles.singer} ${styles['title-font']}`}>{song.singer}</div>
                <div className={styles['song-number']}>#{index + 1}</div>
              </div>
              <div className={styles['song-details']}>
                <div>♪ {song.name}</div>
                {song.code && <div>CODE: {song.code}</div>}
              </div>
              {isAdmin && activeSection === 'edit' && (
                <button
                  className={`${styles['delete-btn']} absolute`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent the song click handler from firing
                    deleteSong(song.id);
                  }}
                >
                  <Trash2 size={20} style={{ color: colors.secondary }} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSeeSection = () => renderSongList(songList.slice(0, 10));
  const renderEditSection = () => {
    if (!isAdmin) {
      return (
        <div className={styles.section}>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Admin Password"
              className="w-full p-2 bg-transparent border custom-input"
              style={{ borderColor: colors.secondary, color: colors.secondary }}
            />
            <button
              type="submit"
              className="w-full p-2 border"
              style={{ borderColor: colors.secondary, color: colors.secondary }}
            >
              Login
            </button>
          </form>
        </div>
      );
    }

    return renderSongList([...songList].sort((a, b) => a.position - b.position));
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setFocusedIndex(0);
    setScrollPosition(0);
    
    // Wait for the next frame to calculate the correct position
    requestAnimationFrame(() => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerHeight = container.clientHeight;
        const newPosition = containerHeight / 2 - itemHeight / 2;
        setScrollPosition(newPosition);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.primary, color: colors.secondary }}>
      <style>{placeholderStyles}</style>
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-4">
        <h1 className={`${styles.title} text-3xl mb-4`}>
          <img src={cloudwalkLogo} alt="CloudWalk Karaoke" className={styles.logo} />
        </h1>
        
        {activeSection === 'add' && renderAddSection()}
        {activeSection === 'see' && renderSeeSection()}
        {activeSection === 'edit' && renderEditSection()}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0" style={{ backgroundColor: colors.primary }}>
        <div className={`${styles.nav} max-w-md mx-auto title-font`}>
          <button
            onClick={() => handleSectionChange('add')}
            className={activeSection === 'add' ? styles.active : ''}
          >
            ADD
          </button>
          <div className={styles['nav-divider']}>|</div>
          <button
            onClick={() => handleSectionChange('see')}
            className={activeSection === 'see' ? styles.active : ''}
          >
            SEE
          </button>
          <div className={styles['nav-divider']}>|</div>
          <button
            onClick={() => handleSectionChange('edit')}
            className={activeSection === 'edit' ? styles.active : ''}
          >
            EDIT
          </button>
        </div>
      </nav>
    </div>
  );
};

export default KaraokeUI; 