// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];

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

  // Envoyer les informations des joueurs à chaque client connecté
  socket.emit('init', players);

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
  
  socket.on('sizeUpdate', (newSize) => {
    let player = players.find(p => p.id === socket.id);
    if (player) {
      player.size = newSize; // Mettre à jour la taille côté serveur
    }
    io.emit('update', players); // Diffuser la mise à jour à tous les clients
  });
});

// Lancer le serveur sur le port 3000
server.listen(3003, () => {
  console.log('Serveur en cours d\'exécution sur http://localhost:3003');
});
