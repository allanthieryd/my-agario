// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
let players = [];
let points = [];

// Fonction pour générer une couleur aléatoire
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Générer les 500 points avec des couleurs aléatoires
function generatePoints() {
  points = [];
  for (let i = 0; i < 500; i++) {
    points.push({
      x: Math.random() * 1600,  // Position aléatoire sur la carte
      y: Math.random() * 1200,
      color: getRandomColor(), // Couleur aléatoire
    });
  }
}

app.use(express.static('public')); // Dossier pour les fichiers frontend

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

  generatePoints(); // Générer les points au début de chaque connexion
  // Envoyer les informations des joueurs et les points à chaque client connecté
  socket.emit('init', { players, points });

  // Mettre à jour la position du joueur
  socket.on('move', (data) => {
    let player = players.find(p => p.id === socket.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
    }
    // Diffuser la mise à jour des joueurs à tous les clients
    io.emit('update', { players, points });
  });

  // Déconnexion d'un joueur
  socket.on('disconnect', () => {
    console.log('Un joueur s\'est déconnecté : ' + socket.id);
    players = players.filter(p => p.id !== socket.id);
    io.emit('update', { players, points });
  });

  // Mise à jour de la taille du joueur
  socket.on('sizeUpdate', (newSize) => {
    let player = players.find(p => p.id === socket.id);
    if (player) {
      player.size = newSize; // Mettre à jour la taille côté serveur
    }
    io.emit('update', { players, points }); // Diffuser la mise à jour à tous les clients
  });
});

// Lancer le serveur sur le port 3000
server.listen(3003, () => {
  console.log('Serveur en cours d\'exécution sur http://localhost:3003');
});