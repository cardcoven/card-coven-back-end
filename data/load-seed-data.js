const client = require('../lib/client');
// import our seed data:
const cards = require('./cards.js');
const decks = require('./decks.js');
const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, user.hash]);
      })
    );

    const user = users[0].rows[0];

    await Promise.all(
      decks.map(deck => {
        return client.query(`
                    INSERT INTO decks (deck_name, deck_description, deck_type, owner_id)
                    VALUES ($1, $2, $3, $4);
                `,
        [deck.deck_name, deck.deck_description, true, user.id]);
      })
    );

    await Promise.all(
      cards.map(card => {
        return client.query(`
                    INSERT INTO cards (card_name, card_colors, card_type, img_url, deck_id, owner_id)
                    VALUES ($1, $2, $3, $4, $5, $6);
                `,
        [card.name, card.colors, card.type, card.imageUrl, card.deck_id, user.id]);
      })
    );


    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch (err) {
    console.log(err);
  }
  finally {
    client.end();
  }

}
