const client = require('../lib/client');
const { getEmoji } = require('../lib/emoji.js');

// async/await needs to run in a function
run();

async function run() {
  try {
    // initiate connecting to db
    await client.connect();

    // run a query to create tables
    await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(256) NOT NULL,
                    hash VARCHAR(512) NOT NULL
                );  
                CREATE TABLE decks (
                    id SERIAL PRIMARY KEY NOT NULL,
                    deck_name VARCHAR(512) NOT NULL,
                    deck_description VARCHAR(512) NOT NULL,
                    deck_type BOOLEAN NOT NULL,
                    owner_id INTEGER NOT NULL REFERENCES users(id)
            );               
                CREATE TABLE cards (
                  id SERIAL PRIMARY KEY NOT NULL,
                  card_name VARCHAR(512) NOT NULL,
                  card_colors VARCHAR(512) NOT NULL,
                  card_type VARCHAR(512) NOT NULL,
                  img_url VARCHAR(512) NOT NULL,
                  deck_id INTEGER NOT NULL REFERENCES decks(id),
                  owner_id INTEGER NOT NULL REFERENCES users(id)
          );         
        `);

    console.log('create tables complete', getEmoji(), getEmoji(), getEmoji());
  } catch(err) {
    // problem? let's see the error...
    console.log(err);
  } finally {
    // success or failure, need to close the db connection
    client.end();
  }
}
