/**
 * Module handles database management
 *
 * The sample data is for a chat log with one table:
 * Messages: id + message text
 *
 * NOTE: Post, update, and delete methods do not check if record exists
 */

const fs = require("fs");
const dbFile = "./.data/chat.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const faker = require("faker");
let db;

/* 
We're using the sqlite wrapper so that we can make async / await connections
- https://www.npmjs.com/package/sqlite
*/
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dBase => {
    db = dBase;

    try {
      if (!exists) {
        await db.run("DROP TABLE Messages");
        await db.run(
          "CREATE TABLE Messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT)"
        );
        let records = [];
        for (let r = 0; r < 5; r++) records.push(faker.hacker.phrase());
        await db.run(
          "INSERT INTO Messages (message) VALUES (?),(?),(?),(?),(?)",
          records
        );
      }
      console.log(await db.all("SELECT * from Messages"));
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Server script calls these methods to connect to the db
module.exports = {
  // Get the messages in the database
  getMessages: async () => {
    try {
      return await db.all("SELECT * from Messages");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  // Add new option initially set to zero
  addMessage: async message => {
    let success = false;
    try {
      success = await db.run(
        "INSERT INTO Messages (message) VALUES (?)",
        [message]
      );
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },

  // Update picks for a language
  updateOption: async (language, picks) => {
    let success = false;
    try {
      success = await db.run(
        "Update Choices SET picks = ? WHERE language = ?",
        picks,
        language
      );
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },

  // Remove option
  deleteOption: async language => {
    let success = false;
    try {
      success = await db.run(
        "Delete from Choices WHERE language = ?",
        language
      );
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  }
};
