async function checkUrlsSafety(urls) {
  const body = {
    client: {
      clientId: "your-client-name",
      clientVersion: "1.0.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: urls.map((url) => ({ url })),
    },
  };

  try {
    const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error("Error checking URLs:", error);
    return [];
  }
}

function batchUrls(urls, batchSize = 500) {
  const batches = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }
  return batches;
}

document.getElementById("extractBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const linkList = document.getElementById("linkList");
  const progress = document.getElementById("progress");
  const summary = document.getElementById("summary");

  // Clear previous results
  linkList.innerHTML = '<div class="loading">Analyzing links...</div>';
  progress.textContent = "Extracting links...";

  // Extract links
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractLinks,
  });

  const links = results[0].result;
  const uniqueUrls = [...new Set(links.map((link) => link.href))];

  // Process URLs in batches
  const batches = batchUrls(uniqueUrls);
  let totalThreats = 0;
  const threatMap = new Map();

  progress.textContent = `Analyzing ${uniqueUrls.length} unique URLs...`;
  linkList.innerHTML = "";

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const threats = await checkUrlsSafety(batch);

    // Map threats to URLs
    threats.forEach((threat) => {
      threatMap.set(threat.threat.url, threat.threatType);
      totalThreats++;
    });

    progress.textContent = `Processed ${Math.min((i + 1) * 500, uniqueUrls.length)} of ${uniqueUrls.length} URLs...`;
  }

  // Display results
  links.forEach((link) => {
    const threatType = threatMap.get(link.href);
    const isSafe = !threatType;

    linkList.innerHTML += `
      <div class="link-item ${isSafe ? "safe" : "dangerous"}">
        <div>
          <a href="${link.href}" target="_blank">${link.text || link.href}</a>
          <span class="status-badge ${isSafe ? "safe-badge" : "danger-badge"}">
            ${isSafe ? "SAFE" : "THREAT DETECTED"}
          </span>
        </div>
        ${threatType ? `<div class="threat-type">Threat Type: ${threatType}</div>` : ""}
      </div>
    `;
  });

  // Display summary
  summary.innerHTML = `
    <strong>Analysis Complete:</strong><br>
    Total Links: ${links.length}<br>
    Unique URLs: ${uniqueUrls.length}<br>
    Threats Detected: ${totalThreats}<br>
    Safe Links: ${uniqueUrls.length - totalThreats}
  `;
});

function extractLinks() {
  const links = document.getElementsByTagName("a");
  return Array.from(links).map((link) => ({
    href: link.href,
    text: link.textContent.trim(),
  }));
}
