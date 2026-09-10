const appUrl = chrome.runtime.getURL("index.html");
chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: appUrl });
  if (tabs.length) return chrome.tabs.update(tabs[0].id, { active: true });
  return chrome.tabs.create({ url: appUrl });
});
