const appUrl = chrome.runtime.getURL("index.html");
let contentPort;

chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: appUrl });
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    return;
  }
  await chrome.tabs.create({ url: appUrl });
});

// Create a port for communication between the app and the background script.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "oasis-get-token") {
    contentPort = port;
    contentPort.onDisconnect.addListener(() => {
      contentPort = null;
    });

    // Handle token requests from the app.
    contentPort.onMessage.addListener((message) => {
      if (message.action === "getTokenFromOasis") {
        getTokenFromOasis(function (token) {
          contentPort.postMessage({ token: token });
        });
      }
    });
  }
});


// Read the token from Oasis local storage.
async function getTokenFromOasis(callback) {
  await chrome.tabs.query({ url: 'https://oasis.arcelik.com/*' }, function (tabs) {
    if (tabs.length > 0) {
      const tabId = tabs[0].id;
      // Execute the token lookup in the Oasis tab.
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => {
          try {
            const token = localStorage.getItem('token');
            return token;
          } catch (error) {
            return null; // Return null when local storage cannot be read.
          }
        }
      }, (result) => {
        if (chrome.runtime.lastError) {
          callback(null); // Return null when script execution fails.
        } else {
          const tokenFromOasis = result[0].result;
          callback(tokenFromOasis);
        }
      });
    } else {
      callback(null); // Return null when no Oasis tab is open.
    }
  });
}