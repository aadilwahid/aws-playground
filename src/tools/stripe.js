const STRIPE_API_KEY = 'sk_test_SdtrPZ3nEtaUo1HsNWnDDUAp';
import Stripe from 'stripe';
import { queryChatNumberLink, addChatNumber } from '../services/dynamodb.js';

const stripe = new Stripe(STRIPE_API_KEY);

const runV2 = async (customerId, duration) => {
  try {
    const meterEvent = await stripe.billing.meterEvents.create({
      event_name: 'transcription-minute',
      payload: {
        value: duration,
        stripe_customer_id: customerId,
      },
    });

    console.debug(`Stripe Resp ::`, meterEvent);
    return true;
  } catch (error) {
    console.error(`errMessage ::`, error.message);
    console.error(`billTranscriptionV2 ::`, error);
  }

  return false;
};

export const billTranscription = async (customerId, duration) => {
  const url = 'https://api.stripe.com/v1/billing/meter_events';

  const payload = {
    event_name: 'transcription-minute',
    payload: {
      stripe_customer_id: customerId,
      value: duration,
    },
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_API_KEY}`,
        // 'Stripe-Version': '2024-09-30.acacia',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    console.debug(`stripe resp ::`, json);
  } catch (error) {
    console.error(`billTranscription ::`, error);
  }

  return false;
};

// billTranscription('cus_QzKXK53tTvS8gT', '71');
// const links = await queryChatNumberLink('+12897780853+13653663570');

