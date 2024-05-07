const blockRuleID = 1

const convertToPromise = (block) => {
  return new Promise((resolve, reject) => {
    try {
      block((...results) => {
        resolve(...results);
      });
    } catch (error) {
      reject(error);
    }

    if (chrome.runtime.lastError) {
      reject(chrome.runtime.lastError);
    }
  });
};

getEnterpriseAttribute = function (item) {
  return convertToPromise((callback) => {
    if (chrome.enterprise?.deviceAttributes?.[item]) {
      chrome.enterprise.deviceAttributes[item](callback);
    } else {
      callback(undefined);
    }
  });
}

getIdentity = function () {
  return convertToPromise((callback) => {
    chrome.identity.getProfileUserInfo(callback);
  });
}

async function get_data(callback) {
  const requiredData = ['location', 'assetid', 'directoryid', 'useremail'];
  const promises = [
    getEnterpriseAttribute('getDeviceAnnotatedLocation'), // 0 location
    getEnterpriseAttribute('getDeviceAssetId'), // 1 asset id
    getEnterpriseAttribute('getDirectoryDeviceId'), // 2 directory api id
    getIdentity(), // 3 user email
  ];

  const results = await Promise.allSettled(promises);

  const data = {};

  for (let i = 0; i < results.length; i++) {
    const value = results[i].status === 'fulfilled' ? results[i].value : null;

    if (value && requiredData.includes(requiredData[i])) {
      switch (requiredData[i]) {
        case 'location':
          data.location = value.toLowerCase().split(',');
          break;
        case 'assetid':
          data.assetid = value;
          break;
        case 'directoryid':
          data.directoryid = value;
          break;
        case 'useremail':
          data.useremail = value.email.toLowerCase();
          break;
      }
    }
  }

  callback(data);
}

function checkDeviceAuthorization(data) {


  if (typeof data.location === 'undefined') {
    // unmanaged device
    console.log('Couldn\'t get managed device info. Is this device enrolled in your admin console and device location set? Not blocking anything');
    return;
  }

  if (data.location.includes('*')) {
    console.log('Device allows wildcard login, not blocking anything.');
    return;
  }

  if (data.location.some(location => location.endsWith('@owensboro.kyschools.us'))) {
    console.log('Device assigned to a staff member, not blocking anything.');
    return;
  }

  if (data.location.includes(data.useremail)) {
    console.log('Device has this user as allowed to login, not blocking anything.');
    return;
  }

  console.log('Device does not have this user as allowed, BLOCKING ALL WEBSITES!');
  applyBlockingRule();

}

chrome.runtime.onStartup.addListener(function () {
  console.log('determining blocking status on startup.')
  get_data(checkDeviceAuthorization);
})

chrome.runtime.onInstalled.addListener(function () {
  console.log('determining blocking status on install.')
  get_data(checkDeviceAuthorization);
})

chrome.storage.onChanged.addListener(function (changes, namespace) {
  console.log('policy change detected')
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
})

function applyBlockingRule() {
  chrome.declarativeNetRequest.updateSessionRules({
    addRules: [{
      id: blockRuleID,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          extensionPath: "/blocked.html"
        }
      },
      condition: {
        urlFilter: "*://*/*",
        resourceTypes: [
          "main_frame"
        ]
      }
    }]
  }, () => { console.log("block rule applied") });
}