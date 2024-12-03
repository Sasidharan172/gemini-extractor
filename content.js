// content.js

// This function will extract all links from the page
function extractLinks() {
  const links = document.querySelectorAll("a");
  const linkUrls = [];

  links.forEach((link) => {
    if (link.href) {
      linkUrls.push(link.href);
    }
  });

  return linkUrls;
}

// Send the links to the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getLinks") {
    const links = extractLinks();
    sendResponse({ links });
  }
});
