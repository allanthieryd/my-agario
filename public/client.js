const socket = io(); 
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables de jeu
let players = [];
let player = { id: null, x: 0, y: 0, size: 10, targetX: 0, targetY: 0, speed: 1 }; // Ajout de targetX, targetY et speed
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
  // La position cible du joueur est la position de la souris
  const targetX = e.clientX;
  const targetY = e.clientY;
  if (player.id) {
    player.targetX = targetX;
    player.targetY = targetY;
    socket.emit('move', { x: targetX, y: targetY });
  }
});

// Calculer la direction et le déplacement progressif
function movePlayer() {
  // Calculer la différence entre la position actuelle et la position cible
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Si la distance est supérieure à la vitesse du joueur, se déplacer progressivement
  if (distance > player.speed) {
    const angle = Math.atan2(dy, dx); // Calculer l'angle pour se diriger vers la souris
    player.x += player.speed * Math.cos(angle); // Déplacer le joueur dans la direction de la souris
    player.y += player.speed * Math.sin(angle);
  } else {
    // Si le joueur est proche de la cible, on peut le positionner directement à la souris
    player.x = player.targetX;
    player.y = player.targetY;
  }
}

// Dessiner la grille
function drawGrid() {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.5;

  const offsetX = player.x - canvas.width / 2;
  const offsetY = player.y - canvas.height / 2;

  // Dessiner les lignes de la grille en prenant en compte le décalage
  for (let y = -offsetY % gridSize; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  for (let x = -offsetX % gridSize; x < canvas.width; x += gridSize) {
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
    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.arc(p.x - offsetX, p.y - offsetY, 5, 0, Math.PI * 2);
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
  if (points.length < 1000) { // Limiter le nombre de points à 10
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

  // Dessiner les joueurs en prenant en compte l'offset
  players.forEach(p => {
    const offsetX = player.x - canvas.width / 2;
    const offsetY = player.y - canvas.height / 2;

    ctx.beginPath();
    ctx.arc(p.x - offsetX, p.y - offsetY, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.id === socket.id ? 'blue' : 'red';
    ctx.fill();
    ctx.closePath();
  });

  checkCollision(); // Vérifier les collisions entre le joueur et les points
}

// Animer le jeu
function gameLoop() {
  movePlayer(); // Déplacer le joueur
  requestAnimationFrame(gameLoop);
}

gameLoop();
