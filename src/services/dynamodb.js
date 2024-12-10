import * as dotenv from 'dotenv';
dotenv.config();

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});
export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const COMMUNICATIONS_TABLE = process.env.COMMUNICATIONS_TABLE;
const KAZOO_CALLS_TABLE = process.env.KAZOO_CALLS_TABLE;

export const getCommunicationsInRange = async (
  australisId,
  batchRange,
  batchEnd
) => {
  let items = [];
  let dbQueries = 0;

  try {
    let resp;

    do {
      resp = await queryCommunications(
        australisId,
        batchRange,
        batchEnd,
        resp?.lastEvaluatedKey
      );

      items = items.concat(resp.communications);
      dbQueries++;
    } while (resp.lastEvaluatedKey);
  } catch (error) {
    console.error('getCommInRange ::', error);
  }

  console.debug('Total DB Queries ::', dbQueries);
  console.debug('Communications Queried ::', items.length);

  return items;
};

const queryCommunications = async (
  australisId,
  start,
  end,
  lastEvaluatedKey
) => {
  const expressionAttributeValues = {
    ':australisId': australisId,
  };

  let filter = '';
  if (start && end) {
    expressionAttributeValues[':start'] = start;
    expressionAttributeValues[':end'] = end;
    filter = 'dateCreated >= :start and dateCreated <= :end';
  }

  const command = new QueryCommand({
    TableName: COMMUNICATIONS_TABLE,
    KeyConditionExpression: 'australisId = :australisId',
    ScanIndexForward: false,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  if (filter) command.input.FilterExpression = filter;
  if (lastEvaluatedKey) command.input.ExclusiveStartKey = lastEvaluatedKey;

  const resp = await dynamodb.send(command);

  return {
    communications: resp?.Items,
    lastEvaluatedKey: resp?.LastEvaluatedKey,
  };
};

export const getCalls = async (
  indexName, // 'australisAccountId'
  indexValue, // accountId
  start,
  end,
  key
) => {
  const expressionAttributeValues = {
    ':indexValue': indexValue,
  };

  let filter = '';
  if (start && end) {
    expressionAttributeValues[':start'] = start;
    expressionAttributeValues[':end'] = end;
    filter = 'dateCreated >= :start and dateCreated <= :end';
  }

  const command = new QueryCommand({
    TableName: KAZOO_CALLS_TABLE,
    IndexName: indexName,
    KeyConditionExpression: '#indexName = :indexValue',
    ExpressionAttributeNames: {
      '#indexName': indexName,
    },
    ExpressionAttributeValues: expressionAttributeValues,
    ScanIndexForward: false,
  });

  if (filter) command.input.FilterExpression = filter;
  if (key) command.input.ExclusiveStartKey = key;
  // if (projection) command.input.ProjectionExpression = projection;

  const { Items, LastEvaluatedKey } = await dynamodb.send(command);
  // console.log('lastEvaluatedKey ::', LastEvaluatedKey);

  return {
    calls: Items,
    key: LastEvaluatedKey,
  };
};

export const queryChatNumberLink = async (numberStr) => {
  try {
    const command = new QueryCommand({
      TableName: 'ChatNumbers-alpha',
      KeyConditionExpression: 'numbers = :numberStr',
      ExpressionAttributeValues: {
        ':numberStr': numberStr,
      },
    });

    const resp = await dynamodb.send(command);
    return resp?.Items;
  } catch (error) {
    console.error(`queryChatNumbers ::`, error);
  }
};

export const addChatNumber = async (numbers, chatId) => {
  try {
    const command = new PutCommand({
      TableName: 'ChatNumbers-alpha',
      Item: { numbers, chatId },
    });

    const res = await dynamodb.send(command);
    console.debug(
      `addChatNumber :: numbers: ${numbers}, chatId: ${chatId}`,
      res
    );
  } catch (err) {
    console.error('addChatNumber ::', err);
  }
};
