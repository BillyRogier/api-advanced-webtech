const express = require('express');
const etag = require('etag');
const mongoose = require('mongoose');
const User = require('./user'); 

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose.connect('mongodb://localhost:27017/api-users?retryWrites=true&w=majority')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.post('/users', async (req, res) => {
  try {
    const newUser = new User({
      username: req.body.username,
      name: req.body.name,
      password: req.body.password
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).send('Erreur lors de la création de l\'utilisateur');
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('Utilisateur non trouvé');
    }
    const userJson = JSON.stringify(user);
    const hash = etag(userJson);
    if (req.headers['if-none-match'] === hash) {
      return res.status(304).send(); 
    }
    res.setHeader('ETag', hash);
    res.status(200).json(user);
  } catch (err) {
    res.status(500).send('Erreur lors de la récupération de l\'utilisateur');
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('Utilisateur non trouvé');
    }
    const clientETag = req.headers['if-match'];
    const currentETag = etag(JSON.stringify(user));
    if (clientETag !== currentETag) {
      return res.status(412).send('Precondition Failed: ETag mismatch'); 
    }
    user.username = req.body.username || user.username;
    user.name = req.body.name || user.name;
    user.password = req.body.password || user.password;
    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).send('Erreur lors de la mise à jour de l\'utilisateur');
  }
});

module.exports = app;
