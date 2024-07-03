const accountId = '3c374d83-2515-417c-910b-9cb0d8803145';
const contactId = '03caad9f-c724-40fd-a775-4534debcf546';
const australisId = '02b1d412-55ab-45aa-9fa7-97cb7d7db496';

const userContactSettings = {
  autoAssignCommunicationMatter: 'false',
  batchSmsToConversations: 'false',
  callCommunicationBillable: 'false',
  callCommunicationMatter: 'unknown',
  callCommunicationPushable: 'false',
  smsCommunicationBillable: 'false',
  smsCommunicationMatter: 'unknown',
  smsCommunicationPushable: 'false',
  smsConversationCommunicationBillable: 'false',
  smsConversationCommunicationMatter: 'unknown',
  smsConversationCommunicationPushable: 'false',
  smsReadSettings: {
    durationType: 'flat',
    rate: 30,
  },
  smsWriteSettings: {
    durationType: 'flat',
    rate: 120,
  },
  voicemailPushable: 'false',
};

const contact = {
  accountId,
  contactId,
  addresses: [],
  company: '',
  contactSettings: {
    '02b1d412-55ab-45aa-9fa7-97cb7d7db496': {
      batchSmsToConversations: 'admin',
      callCommunicationBillable: 'admin',
      callCommunicationMatter: 'admin',
      callCommunicationPushable: 'admin',
      smsCommunicationBillable: 'admin',
      smsCommunicationMatter: 'admin',
      smsCommunicationPushable: 'admin',
      smsConversationCommunicationBillable: 'admin',
      smsConversationCommunicationMatter: 'admin',
      smsConversationCommunicationPushable: 'admin',
      smsReadSettings: 'admin',
      smsWriteSettings: 'admin',
    },
    admin: {
      batchSmsToConversations: 'true',
      callCommunicationBillable: 'true',
      callCommunicationMatter: '60deb9cc-9912-4a8d-8880-2fa4e1b34a95',
      callCommunicationPushable: 'true',
      smsCommunicationBillable: 'true',
      smsCommunicationMatter: '60deb9cc-9912-4a8d-8880-2fa4e1b34a95',
      smsCommunicationPushable: 'true',
      smsConversationCommunicationBillable: 'false',
      smsConversationCommunicationMatter: 'unknown',
      smsConversationCommunicationPushable: 'true',
      smsReadSettings: {
        durationType: 'flat',
        rate: 30,
      },
      smsWriteSettings: {
        durationType: 'flat',
        rate: 120,
      },
    },
  },
  contactSource: 'clio',
  dateCreated: 1707987819504,
  dateUpdated: 1707987819504,
  date_of_birth: '',
  defaultEmail: 'aadilmd4@gmail.com',
  defaultPhoneNumber: '+923023500988',
  defaultWebsite: 'https://www.linkedin.com/in/muhammad-adil-sbe/',
  emails: [
    {
      email: 'aadilmd4@gmail.com',
      id: 1991525,
      type: 'Work',
    },
  ],
  externalContactIds: {
    clio: '3189839',
  },
  firstName: 'Muhammad Adil',
  jobTitle: '',
  lastName: 'Pakistan',
  matters: {},
  middleName: '',
  notes: '',
  phoneNumbers: [
    {
      id: 2617535,
      number: '+923023500988',
      parsed: {
        canBeInternationallyDialled: true,
        countryCode: 92,
        number: {
          e164: '+923023500988',
          input: '+923023500988',
          international: '+92 302 3500988',
          national: '0302 3500988',
          rfc3966: 'tel:+92-302-3500988',
          significant: '3023500988',
        },
        possibility: 'is-possible',
        possible: true,
        regionCode: 'PK',
        type: 'mobile',
        typeIsFixedLine: false,
        typeIsMobile: true,
        valid: true,
      },
      type: 'Mobile',
    },
  ],
  type: 'Person',
  websites: [
    {
      address: 'https://www.linkedin.com/in/muhammad-adil-sbe/',
      id: 48584,
      type: 'Work',
    },
  ],
};

const getContactSetting = (
  contact,
  contactSettingsKey,
  userContactSettings
) => {
  const contactSetting = contact.contactSettings[contactSettingsKey];

  try {
    if (contactSetting === undefined) return contactSetting;

    for (const [key, value] of Object.entries(
      contact.contactSettings[contactSettingsKey]
    )) {
      if (
        value === 'admin' &&
        key !== 'smsCommunicationMatter' &&
        key !== 'smsConversationCommunicationMatter' &&
        key !== 'callCommunicationMatter'
      )
        contactSetting[key] = userContactSettings[key];
      else if (checkForContactSetting(contact, value))
        contactSetting[key] = getContactSettingValue(contact, value, key);
    }
  } catch (error) {
    console.error('getContactSetting ::', error);
  }

  console.log('FINAL SETTINGS ::', contactSetting);
  return contactSetting;
};

const checkForContactSetting = (contact, contactSettingsKey) => {
  console.log('checkForContactSetting', contactSettingsKey);
  const contactSetting = contact.contactSettings[contactSettingsKey];

  //return !(contactSetting === undefined);
  if (contactSetting === undefined) return false;

  return true;
};

const getContactSettingValue = (contact, contactSettingKey, settingKey) => {
  try {
    const contactSetting = contact.contactSettings[contactSettingKey];

    if (contactSetting === undefined) return undefined;

    let settingValue = contactSetting[settingKey];

    if (settingValue === undefined) return undefined;

    if (checkForContactSetting(contact, settingValue))
      settingValue = getContactSettingValue(contact, settingValue, settingKey);

    return settingValue;
  } catch (error) {
    console.error('getContactSettingValue ::', error);
  }
};

getContactSetting(contact, australisId, userContactSettings);
