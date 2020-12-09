const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

// not a lot to say here--nice endpoints!
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

// API displays all decks from user
app.get('/api/decks', async(req, res) => {
  try {
    const data = await client.query(`
    SELECT
    * 
    FROM decks
    WHERE decks.owner_id= $1`, [req.userId]);

    res.json(data.rows);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

//API displays all cards that user has in every deck
// TEST ONE
app.get('/api/cards', async(req, res) => {
  try {
    const data = await client.query(`
    SELECT
    * 
    FROM cards
    WHERE cards.owner_id= $1`, [req.userId]);

    res.json(data.rows);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

// API displays all cards in specific deck
app.get('/api/cards/:id', async(req, res) => {
  try {
    const data = await client.query(`
    SELECT
    cards.id,
    cards.card_name,
    cards.card_colors,
    cards.card_type,
    cards.img_url,
    cards.deck_id,
    owner_id
    FROM cards
    WHERE cards.owner_id = $1
    AND cards.deck_id = $2`, [req.userId, req.params.id]);

    res.json(data.rows);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

// API displays specific card using id
app.get('/api/cards/card/:id', async(req, res) => {
  try {
    const data = await client.query(`
    SELECT
    cards.id,
    cards.card_name,
    cards.card_colors,
    cards.card_type,
    cards.img_url,
    cards.deck_id,
    owner_id
    FROM cards
    WHERE cards.owner_id = $1
    AND cards.id = $2`, [req.userId, req.params.id]);

    res.json(data.rows);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

// API displays single specific deck based on id
app.get('/api/decks/:id', async(req, res) => {
  try {
    const data = await client.query(`
    SELECT
    deck_name,
    deck_description,
    deck_type,
    owner_id
    FROM decks
    WHERE decks.owner_id = $1
    AND decks.id = $2`, [req.userId, req.params.id]);

    res.json(data.rows);
  } catch(e) {

    res.status(500).json({ error: e.message });
  }
});

// API creates new deck
app.post('/api/decks/', async(req, res) => {
  try {

    const data = await client.query(`
      INSERT INTO decks (deck_name, deck_description, deck_type, owner_id)
      VALUES($1, $2, $3, $4)
      RETURNING *
    `,
    [req.body.deck_name, req.body.deck_description, req.body.deck_type, req.userId]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// API creates new card into specific deck
app.post('/api/cards/', async(req, res) => {
  try {

    const data = await client.query(`
      INSERT INTO cards (card_name, card_colors, card_type, img_url, deck_id, owner_id)
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [req.body.card_name, req.body.card_colors, req.body.card_type, req.body.img_url, req.body.deck_id, req.userId]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// API updates the deck
app.put('/api/decks/:id', async(req, res) => {
  try {

    const data = await client.query(`
      UPDATE decks 
      SET deck_name = $1,
      deck_description = $2,
      deck_type = $3,
      owner_id = $4
      WHERE decks.id = $5
      RETURNING *
    `,
    [req.body.deck_name, req.body.deck_description, req.body.deck_type, req.userId, req.params.id]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// API DELETE current deck
// Deck must be empty
app.delete('/api/decks/:id', async(req, res) => {
  try {

    const data = await client.query(`
      DELETE FROM decks 
      WHERE decks.id = $1
      AND owner_id = $2
      RETURNING *
    `,
    [req.params.id, req.userId]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// API DELETE every card from deck_id
// Must do before able to delete deck
app.delete('/api/cards/:id', async(req, res) => {
  try {

    const data = await client.query(`
      DELETE FROM cards 
      WHERE cards.deck_id = $1
      AND owner_id = $2
      RETURNING *
    `,
    [req.params.id, req.userId]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// API DELETE specific card id from users decks
// /api/cards/:id is more RESTful
app.delete('/api/cards/card/:id', async(req, res) => {
  try {

    const data = await client.query(`
      DELETE FROM cards
      WHERE cards.id = $1
      AND owner_id = $2
      RETURNING *
    `,
    [req.params.id, req.userId]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
