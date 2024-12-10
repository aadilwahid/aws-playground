import { getWebhookData } from '../services/s3.service.js';

const testData = async () => {
  const key = 'e4598261-56b3-4b35-ae16-9d0045b2c807';

  const data = await getWebhookData(key);

  console.log(JSON.stringify(data, null, 2));
};
testData();
