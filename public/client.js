const socket = io(); 
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables de jeu
let players = [];
let player = { id: null, x: 0, y: 0, size: 10, offsetX: 0, offsetY: 0, speed: 1 }; // Taille de base plus grande et vitesse initiale
let points = []; // Tableau pour les points à manger

// Taille de la grille
const gridSize = 30; // Taille des petits carrés de la grille

// Initialisation des joueurs
socket.on('init', (data) => {
  players = data;
  player = players.find(p => p.id === socket.id) || player;
  generatePoints(); // Générer les points au début
});

// Mise à jour des joueurs
socket.on('update', (data) => {
  players = data;
  const updatedPlayer = players.find(p => p.id === socket.id);
  if (updatedPlayer) {
    player.size = updatedPlayer.size; // Mettre à jour la taille locale du joueur
    player.speed = Math.max(1, 1 / (player.size / 30)); // Ralentir la vitesse avec la taille
  }
  draw();
});

socket.on('die', () => {
  player = null;

  const message = document.createElement('div');
  message.textContent = 'Mangé...';
  message.style.position = 'absolute';
  message.style.top = '50%';
  message.style.left = '50%';
  message.style.transform = 'translate(-50%, -50%)';
  message.style.fontSize = '24px';
  message.style.color = 'red';
  message.style.fontWeight = 'bold';
  message.style.zIndex = '1000';

  document.body.appendChild(message);

  setTimeout(() => {
    message.remove();
  }, 3000);
});


// Contrôles du joueur
window.addEventListener('mousemove', (e) => {
  const x = e.clientX;
  const y = e.clientY;
  if (player.id) {
    player.x = x;
    player.y = y;
    socket.emit('move', { x, y });
  }
});

// Dessiner la grille
function drawGrid() {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.5;

  const offsetX = player.x - canvas.width / 2;
  const offsetY = player.y - canvas.height / 2;

  // Retirer le facteur player.size ici pour que la grille reste constante
  const adjustedGridSize = gridSize;  // Taille fixe des carreaux

  // Dessiner les lignes de la grille sans tenir compte de la taille du joueur
  for (let y = -offsetY % adjustedGridSize; y < canvas.height; y += adjustedGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  for (let x = -offsetX % adjustedGridSize; x < canvas.width; x += adjustedGridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
}



// Dessiner les points à consommer
function drawPoints() {
  points.forEach(p => {
    const offsetX = player.x - canvas.width / 2;
    const offsetY = player.y - canvas.height / 2;
    const posX = p.x - offsetX;
    const posY = p.y - offsetY;
    
    ctx.beginPath();
    ctx.arc(posX, posY, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.color; // Utiliser la couleur spécifique pour chaque point
    ctx.fill();
    ctx.closePath();
  });
}

// Vérifier la collision entre le joueur et les points
function checkCollision() {
  points.forEach((point, index) => {
    const dx = player.x - point.x;
    const dy = player.y - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < player.size + 5) {
      points.splice(index, 1);
      player.size += 1;
      player.speed = 1;
      player.speed = Math.max(1, 1 / (player.size / 20));
      socket.emit('sizeUpdate', player.size);
      generatePoints();
    }
  });

  // Vérifier les collisions entre le joueur local et les autres joueurs
  players.forEach((p) => {
    if (p.id !== player.id) {
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < player.size + p.size) {
        if (player.size > p.size) {
          player.size += 1;
          socket.emit('sizeUpdate', player.size);
          players = players.filter(otherPlayer => otherPlayer.id !== p.id);
          delete players[player.id]
        }
      }
    }
  });
}

// Générer des points aléatoires
function generatePoints() {
  // Créer un point à chaque appel de la fonction pour en avoir plusieurs sur la carte
  while (points.length < 500) { // Créer 500 points
    const x = Math.random() * (canvas.width * 2); // Position aléatoire sur une carte plus grande
    const y = Math.random() * (canvas.height * 2);
    const color = getRandomColor(); // Obtenir une couleur aléatoire pour chaque point
    points.push({ x, y, color });
  }
}

// Générer une couleur aléatoire
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Dessin des joueurs avec leurs noms
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(); // Dessiner la grille
  drawPoints(); // Dessiner les points
  
  players.forEach((p, index) => {
    const offsetX = player.x - canvas.width / 2;
    const offsetY = player.y - canvas.height / 2;
    const posX = p.x - offsetX;
    const posY = p.y - offsetY;

    ctx.beginPath();
    ctx.arc(posX, posY, p.size+15, 0, Math.PI * 2);
    ctx.fillStyle = p.id === socket.id ? 'blue' : 'red';
    ctx.fill();
    ctx.closePath();

    ctx.font = `${Math.max(12, p.size / 3)}px Arial`; 
    ctx.fillStyle = 'white';
    const textWidth = ctx.measureText(`Joueur ${index + 1}`).width;
    const textHeight = Math.max(12, p.size / 3); 
    ctx.fillText(`Joueur ${index + 1}`, posX - textWidth / 2, posY + textHeight / 4); 
  });

  checkCollision(); // Vérifier les collisions entre le joueur et les points
}

// Animer le jeu
function gameLoop() {
  requestAnimationFrame(gameLoop);
}
gameLoop();
