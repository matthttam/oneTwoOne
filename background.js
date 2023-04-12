const blockRuleID = 1

/*const asPromised = (block) => {
  return new Promise((resolve, reject) => {
    block((...results) => {
      if (chrome.runtime.lastError) {
        reject(chrome.extension.lastError);
      } else {
        resolve(...results);
      }
    });
  });
};*/

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
/*
entGetInfo = function (item) {
  return asPromised((callback) => {
    if (typeof chrome.enterprise !== "undefined") {
      if (typeof chrome.enterprise.deviceAttributes !== "undefined") {
        if (typeof chrome.enterprise.deviceAttributes[item] !== "undefined") {
          chrome.enterprise.deviceAttributes[item](callback);
        } else { callback(undefined); }
      } else { callback(undefined); }
    } else { callback(undefined); }
  });
}*/
entGetInfo = function (item) {
  return convertToPromise((callback) => {
    if (chrome.enterprise?.deviceAttributes?.[item]) {
      chrome.enterprise.deviceAttributes[item](callback);
    } else {
      callback(undefined);
    }
  });
}


getIden = function () {
  return convertToPromise((callback) => {
    chrome.identity.getProfileUserInfo(callback);
  });
}

async function get_data(callback) {
  const data_needed = ['location', 'assetid', 'directoryid', 'useremail'];
  const mypromises = [
    entGetInfo('getDeviceAnnotatedLocation'), // 0 location
    entGetInfo('getDeviceAssetId'), // 1 asset id
    entGetInfo('getDirectoryDeviceId'), // 2 directory api id
    getIden(), // 3 user email
  ];

  const results = await Promise.allSettled(mypromises);

  const data = {};

  for (let i = 0; i < results.length; i++) {
    const value = results[i].status === 'fulfilled' ? results[i].value : null;

    if (value && data_needed.includes(data_needed[i])) {
      switch (data_needed[i]) {
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

/*
getIden = function () {
  return convertToPromise((callback) => {
    chrome.identity.getProfileUserInfo(callback);
  });
}
*/
/*function get_data(callback) {
  data = {};
  data_needed = ['location', 'assetid', 'directoryid', 'useremail'];
  mypromises = [Promise.resolve(false),  // 0 location
  Promise.resolve(false),  // 1 asset id
  Promise.resolve(false),  // 2 directory api id
  Promise.resolve(false),  // 3 user email
  ];
  for (i = 0; i < data_needed.length; i++) {
    if (data_needed[i] === 'location') {
      mypromises[0] = entGetInfo('getDeviceAnnotatedLocation');
    } else if (data_needed[i] === 'assetid') {
      mypromises[1] = entGetInfo('getDeviceAssetId');
    } else if (data_needed[i] === 'directoryid') {
      mypromises[2] = entGetInfo('getDirectoryDeviceId');
    } else if (data_needed[i] === 'useremail') {
      mypromises[3] = getIden();
    }
  }
  Promise.all(mypromises).then(function (values) {
    if (values[0]) {
      data.location = values[0].toLowerCase().split(',');
    }
    if (values[1]) {
      data.assetid = values[1];
    }
    if (values[2]) {
      data.directoryid = values[2];
    }
    if (values[3]) {
      data.useremail = values[3].email.toLowerCase();
    }
    callback(data);
  });
}*/

function checkDeviceAuthorization(data) {
  removeBlockingRule()

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

/*function check_block({ frameId, url }) {
  if (block_everything) {
    apply_blocking_rules()
    //url = chrome.runtime.getURL("blocked.html")
    //return { redirectUrl: url };
  } else {
    return;
  }
}*/

function removeBlockingRule() {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [blockRuleID]
  }, () => {
    console.log("block rule removed");
  });
}

function applyBlockingRule() {
  //url = chrome.runtime.getURL("blocked.html")
  chrome.declarativeNetRequest.updateDynamicRules({
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

/*function sanity() {
  console.log('working!!!!!')
}*/

//chrome.webRequest.onBeforeRequest.addListener(sanity, {}, [])

// chrome.webRequest.onBeforeRequest.addListener(check_block, {
//  urls: ['*://*/*'],
//  types: ["main_frame", "sub_frame"]
//}, ["blocking"]);
