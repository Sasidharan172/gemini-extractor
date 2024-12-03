chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getLinks") {
    // Log to confirm that message is received
    console.log("Received message: getLinks");

    // Execute the script to extract links
    chrome.scripting.executeScript(
      {
        target: { tabId: sender.tab.id },
        func: extractLinks,
      },
      (injectionResults) => {
        const links = injectionResults[0].result;
        console.log("Extracted links:", links); // Log extracted links

        // Send the links back to the popup
        sendResponse({ links: links });
      },
    );

    // Return true to indicate asynchronous response
    return true;
  }
});

// Function to extract links from the current page
function extractLinks() {
  const links = [];
  const linkElements = document.querySelectorAll("a");
  linkElements.forEach((link) => {
    if (link.href) {
      links.push(link.href);
    }
  });
  return links;
}
