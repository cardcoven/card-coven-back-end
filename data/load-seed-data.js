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
                    INSERT INTO decks (deck_name, deck_description, deck_type, card_id, owner_id)
                    VALUES ($1, $2, $3, $4 , $5);
                `,
          [deck.deck_name, deck.deck_description, true, deck.card_id, user.id]);
      })
    );

    await Promise.all(
      cards.map(card => {
        return client.query(`
                    INSERT INTO decks (card_name, img_url, owner_id)
                    VALUES ($1, $2, $3);
                `,
          [card.card_name, card.img_url, user.id]);
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
