const fs = require('fs')
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const randomstring = require('randomstring');
const _ = require('lodash');

const url = 'mongodb://192.168.4.102';
const client = new MongoClient(url);
const dbName = 'test';

const qty = _.toInteger(process.argv[2]);
const length = _.toInteger(process.argv[3]);

async function main() {
  const startTime = new Date().getTime();

  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('items');

  // Generating the string only once to avoid high CPU usage
  const randomValue = randomstring.generate(length);

  for (let i = 0; i < qty; i++) {
    const insertResult = await collection.insertOne(
      {
        itemNumber: i,
        randomValue: randomValue,
        shardKey: new ObjectID(),
      }
    );
  }

  const endTime = new Date().getTime();
  const resultTime = endTime - startTime;

  const content = `Recording time for quantity ${qty} items and ${length} item size is ${resultTime}ms`;
  fs.writeFileSync('report.txt', content);

  return 'done.';
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());

