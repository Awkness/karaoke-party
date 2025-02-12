const songs = [
  { code: "1234", name: "Sweet Caroline", singer: "John Smith" },
  { code: "5678", name: "Bohemian Rhapsody", singer: "Sarah Johnson" },
  { code: "9012", name: "I Want It That Way", singer: "Mike Brown" },
  { code: "3456", name: "Don't Stop Believin'", singer: "Emma Wilson" },
  { code: "7890", name: "Wonderwall", singer: "David Lee" },
  { code: "2345", name: "Purple Rain", singer: "Lisa Anderson" },
  { code: "6789", name: "Hotel California", singer: "Tom Parker" },
  { code: "0123", name: "Livin' on a Prayer", singer: "Rachel Green" },
  { code: "4567", name: "Sweet Home Alabama", singer: "Chris Martin" },
  { code: "8901", name: "Hey Jude", singer: "Maria Garcia" }
];

async function populateSongs() {
  for (const song of songs) {
    try {
      const response = await fetch('http://localhost:3000/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(song)
      });
      
      if (response.ok) {
        console.log(`Added song: ${song.name} by ${song.singer}`);
      } else {
        console.error(`Failed to add song: ${song.name}`);
      }
    } catch (err) {
      console.error(`Error adding song ${song.name}:`, err);
    }
  }
}

populateSongs(); 