export type BrowserId = "chrome" | "firefox" | "edge";

export interface BrowserTarget {
  id: BrowserId;
  name: string;
  fileName: string;
  downloadUrl: string;
  installSteps: string[];
}

export interface ExtensionMeta {
  version: string;
  description: string;
  browsers: BrowserTarget[];
}

const EXTENSION_VERSION = "0.1.0";

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:4321";
const CHROME_DOWNLOAD_URL = `${BASE}/downloads/reporank-chrome-v${EXTENSION_VERSION}.zip`;
const FIREFOX_DOWNLOAD_URL = `${BASE}/downloads/reporank-firefox-v${EXTENSION_VERSION}.zip`;
const EDGE_DOWNLOAD_URL = `${BASE}/downloads/reporank-edge-v${EXTENSION_VERSION}.zip`;

export const extensionMeta: ExtensionMeta = {
  version: EXTENSION_VERSION,
  description:
    "See RepoRank credibility scores, AI analysis, and human reviews directly on any GitHub, GitLab, Bitbucket, Codeberg, or npm package page — without leaving the site.",
  browsers: [
    {
      id: "chrome",
      name: "Chrome",
      fileName: `reporank-chrome-v${EXTENSION_VERSION}.zip`,
      downloadUrl: CHROME_DOWNLOAD_URL,
      installSteps: [
        "Download the ZIP file for Chrome.",
        "Unzip the downloaded file to a folder on your computer.",
        "Open Chrome and go to chrome://extensions.",
        'Enable "Developer mode" using the toggle in the top right.',
        'Click "Load unpacked" and select the folder you extracted.',
        "The RepoRank extension should now appear in your extensions list.",
      ],
    },
    {
      id: "firefox",
      name: "Firefox",
      fileName: `reporank-firefox-v${EXTENSION_VERSION}.zip`,
      downloadUrl: FIREFOX_DOWNLOAD_URL,
      installSteps: [
        "Download the ZIP file for Firefox.",
        "Unzip the downloaded file to a folder on your computer.",
        "Open Firefox and go to about:debugging.",
        'Click "This Firefox" in the left sidebar.',
        'Click "Load Temporary Add-on" and select any file from the extracted folder (e.g., manifest.json).',
        "The RepoRank extension will be loaded temporarily until you restart Firefox.",
      ],
    },
    {
      id: "edge",
      name: "Edge",
      fileName: `reporank-edge-v${EXTENSION_VERSION}.zip`,
      downloadUrl: EDGE_DOWNLOAD_URL,
      installSteps: [
        "Download the ZIP file for Edge.",
        "Unzip the downloaded file to a folder on your computer.",
        "Open Edge and go to edge://extensions.",
        'Enable "Developer mode" using the toggle in the bottom left.',
        'Click "Load unpacked" and select the folder you extracted.',
        "The RepoRank extension should now appear in your extensions list.",
      ],
    },
  ],
};
