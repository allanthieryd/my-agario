// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const FOODS_COUNT = 500; // Nombre de points à générer
let players = [];
let points = []; // Tableau pour les points à générer

app.use(express.static('public')); // Dossier pour les fichiers frontend

// Fonction pour générer une couleur aléatoire
function getRandomColor() {
  const hue = Math.random() * 360; // Générer une teinte aléatoire entre 0 et 360
  return `hsl(${hue}, 50%, 50%)`; // Créer la couleur HSL
}

// Fonction pour générer des points à manger
const generatePoint = () => {
  const x = Math.random() * 800; // Position aléatoire en x
  const y = Math.random() * 600; // Position aléatoire en y
  const color = getRandomColor(); // Couleur HSL aléatoire pour chaque point
  points.push({ x, y, color }); // Ajouter un point de nourriture avec la couleur aléatoire
};

// Générer des points au démarrage
for (let i = 0; i < FOODS_COUNT; i++) {
  generatePoint();
}

// Gérer la connexion des clients
io.on('connection', (socket) => {
  console.log('Un joueur s\'est connecté : ' + socket.id);

  // Ajouter un nouveau joueur
  players.push({
    id: socket.id,
    x: Math.random() * 800,  // Position aléatoire
    y: Math.random() * 600,
    size: 10,  // Taille initiale
  });

  // Envoyer les informations des joueurs et des points à chaque client connecté
  socket.emit('init', { players, points });

  // Mettre à jour la position du joueur
  socket.on('move', (data) => {
    let player = players.find(p => p.id === socket.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
    }

    // Diffuser la mise à jour des joueurs à tous les clients
    io.emit('update', players);
  });

  // Déconnexion d'un joueur
  socket.on('disconnect', () => {
    console.log('Un joueur s\'est déconnecté : ' + socket.id);
    players = players.filter(p => p.id !== socket.id);
    io.emit('update', players);
  });

  // Mise à jour de la taille d'un joueur
  socket.on('sizeUpdate', (newSize) => {
    let player = players.find(p => p.id === socket.id);
    if (player) {
      player.size = newSize; // Mettre à jour la taille côté serveur
    }
    io.emit('update', players); // Diffuser la mise à jour à tous les clients
  });

  // Diffuser les points aux clients
  socket.on('getPoints', () => {
    socket.emit('init', { players, points });
  });
});

// Lancer le serveur sur le port 3003
server.listen(3003, () => {
  console.log('Serveur en cours d\'exécution sur http://localhost:3003');
});
