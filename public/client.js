const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables de jeu
let players = [];
let player = { id: null, x: 0, y: 0, size: 10 };
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
  }
  draw();
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
  ctx.strokeStyle = '#d3d3d3'; // Couleur des lignes de la grille
  ctx.lineWidth = 0.5;
  
  // Dessiner les lignes horizontales
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Dessiner les lignes verticales
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
}

// Dessiner les points à consommer
function drawPoints() {
  ctx.fillStyle = 'green'; // Couleur des points
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
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

    // Si la distance est inférieure à la taille du joueur + la taille du point, il mange le point
    if (distance < player.size + 5) {
      points.splice(index, 1); // Supprimer le point mangé
      player.size += 3; // Augmenter la taille du joueur
      socket.emit('sizeUpdate', player.size); // Envoyer la nouvelle taille au serveur
      generatePoints(); // Régénérer un nouveau point à une position aléatoire
    }
  });
}


// Générer des points aléatoires
function generatePoints() {
  // Créer un point à chaque appel de la fonction pour en avoir plusieurs sur la carte
  if (points.length < 10) { // Limiter le nombre de points à 10
    const x = Math.random() * (canvas.width - 20) + 10; // Position aléatoire
    const y = Math.random() * (canvas.height - 20) + 10;
    points.push({ x, y });
  }
}

// Dessin des joueurs
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(); // Dessiner la grille
  drawPoints(); // Dessiner les points
  
  players.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.id === socket.id ? 'blue' : 'red';
    ctx.fill();
    ctx.closePath();
  });
  
  checkCollision(); // Vérifier les collisions entre le joueur et les points
}

// Animer le jeu
function gameLoop() {
  requestAnimationFrame(gameLoop);
}

gameLoop();
