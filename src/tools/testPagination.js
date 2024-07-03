import { getCommunicationsInRange } from '../services/dynamodb.js';

async function test() {
  // const australisId = '2cd0117a-958d-4acb-8c65-3e568891fac5';
  // let start = 1712862000000; // Friday, April 12, 2024 12:00:00 AM
  // let end = 1713466799999; // Thursday, April 18, 2024 11:59:59.999 PM

  // let communications = await getCommunicationsInRange(australisId, start, end);
  // logCommunicationDates(communications);

  // communications = communications.sort((a, b) => a.dateCreated - b.dateCreated);
  // console.log('--:: SORTING STARTS NOW ::--');
  // logCommunicationDates(communications);

  const currentDate = new Date();

  // Subtract 30 days from the current date
  const pastDate = new Date(currentDate);
  pastDate.setDate(pastDate.getDate() - 30);

  // Convert the past date to Unix timestamp (milliseconds since January 1, 1970)
  const pastTimestamp = pastDate.getTime();

  console.log(pastTimestamp);
}

function logCommunicationDates(communications) {
  // console.log('-'.repeat(30));
  // console.log('-'.repeat(30));
  // console.log('Communications found :: ', communications?.length);
  // console.log('-'.repeat(30));
  communications.map((comm) =>
    console.log(new Date(comm.dateCreated), '-', comm.type)
  );
}

test();
