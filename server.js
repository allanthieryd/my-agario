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

function checkPlayerCollisions() {
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const playerA = players[i];
      const playerB = players[j];
      const dx = playerA.x - playerB.x;
      const dy = playerA.y - playerB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Si la distance entre les joueurs est inférieure à la taille de l'un des joueurs
      // et que le joueur A est plus gros que le joueur B
      if (distance < playerA.size + playerB.size) {
        if (playerA.size > playerB.size) {
          // Le joueur A mange le joueur B
          playerA.size += playerB.size; // Augmenter la taille du joueur A
          players = players.filter(p => p.id !== playerB.id); // Supprimer le joueur B
          // Envoyer l'événement de "mort" au joueur B
          io.to(playerB.id).emit('die');
        } else if (playerB.size > playerA.size) {
          // Le joueur B mange le joueur A
          playerB.size += playerA.size; // Augmenter la taille du joueur B
          players = players.filter(p => p.id !== playerA.id); // Supprimer le joueur A
          // Envoyer l'événement de "mort" au joueur A
          io.to(playerA.id).emit('die');
        }
      }
    }
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

    checkPlayerCollisions();
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