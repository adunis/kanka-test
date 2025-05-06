// script.js (Full Code - Including Previous Fixes + New Fetch Logs)
document.addEventListener("DOMContentLoaded", async () => {
  let appConfig = null;

  // --- DOM Element References ---
  // ... (keep all references)
  const sidebar = document.getElementById("sidebar");
  const resizer = document.getElementById("resizer");
  const mainContent = document.getElementById("mainContent");
  const fileTreeRootUl = document.getElementById("fileTreeRoot");
  const jsonEntryContentDiv = document.getElementById("jsonEntryContent");
  const currentFileNameH2 = document.getElementById("currentFileName");
  const viewerDiv = document.getElementById("viewer");
  const editorDiv = document.getElementById("editor");
  const htmlEditorTextarea = document.getElementById("htmlEditor");
  const editingFileNameH2 = document.getElementById("editingFileName");
  const editBtn = document.getElementById("editBtn");
  const deleteEntryBtn = document.getElementById("deleteEntryBtn");
  const generatePdfBtn = document.getElementById("generatePdfBtn");
  const formatBtn = document.getElementById("formatBtn");
  const improveBtn = document.getElementById("improveBtn");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const createNewFileBtn = document.getElementById("createNewFileBtn");
  const autocompletePopup = document.getElementById("autocompletePopup");
  const fileCountSpan = document.getElementById("fileCount");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const repoNameSpan = document.getElementById("repoName");
  const repoPathSpan = document.getElementById("repoPath");
  const refreshFileListBtn = document.getElementById("refreshFileListBtn");
  const imagePreviewSidebar = document.getElementById("imagePreviewSidebar");
  const imageListContainer = document.getElementById("imageListContainer");
  const noImageTextElement = document.getElementById("noImageText");
  const addImageBtn = document.getElementById("addImageBtn");
  const imageUploadInput = document.getElementById("imageUploadInput");
  const improveModal = document.getElementById("improveModal");
  const closeImproveModalBtn = document.getElementById("closeImproveModalBtn");
  const contextSelectionListDiv = document.getElementById("contextSelectionList");
  const contextTreeRootUl = document.getElementById("contextTreeRoot");
  const selectAllContextBtn = document.getElementById("selectAllContextBtn");
  const deselectAllContextBtn = document.getElementById("deselectAllContextBtn");
  const contextTokenEstimateSpan = document.getElementById("contextTokenEstimate");
  const proceedWithImprovementBtn = document.getElementById("proceedWithImprovementBtn");
  const cancelImprovementBtn = document.getElementById("cancelImprovementBtn");
  const copyPromptBtn = document.getElementById("copyPromptBtn");
  const improveModalEntryNameSpan = document.getElementById("improveModalEntryName");
  const modalLoadingIndicator = document.getElementById("modalLoadingIndicator");
  const geminiModelSelect = document.getElementById("geminiModelSelect");
  const imageLightboxModal = document.getElementById("imageLightboxModal");
  const lightboxImage = document.getElementById("lightboxImage");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");


  // --- State Variables ---
  // ... (keep all state variables)
  let allFetchedFiles = [];
  let flatJsonData = [];
  let imageFileMap = {};
  let fileTree = [];
  let currentFilePath = null;
  let currentFileSha = null;
  let currentJsonData = null;
  let activeLinkElement = null;
  let contextCache = {};
  let currentAutocompleteQuery = "";
  let currentMentionStartIndex = -1;
  let selectedAutocompleteIndex = -1;


  // --- Constants (populated from config) ---
  // ... (keep all constant declarations)
  let GITHUB_USERNAME, GITHUB_REPO, GITHUB_DATA_PATH, GITHUB_BRANCH, GITHUB_TOKEN, GALLERY_FOLDER;
  let GEMINI_API_KEY, GEMINI_API_BASE_URL, GEMINI_MODELS = [];
  let API_BASE_URL, RAW_CONTENT_BASE;
  let PROMPT_FORMAT, PROMPT_IMPROVE_BASE, PROMPT_IMPROVE_CAMPAIGN, PROMPT_IMPROVE_CONTEXT_HEADER, PROMPT_IMPROVE_CONTEXT_FOOTER, PROMPT_IMPROVE_MAIN_HEADER;


  const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

  // --- Initialization ---
  async function initialize() {
      console.log("[INIT] Starting initialization...");
      try {
          await loadConfig();
          console.log("[INIT] Config loaded:", appConfig);

          // Set constants from config
          // ... (keep constant assignments)
          GITHUB_USERNAME = appConfig.github.USERNAME;
          GITHUB_REPO = appConfig.github.REPO;
          GITHUB_DATA_PATH = appConfig.github.DATA_PATH;
          GITHUB_BRANCH = appConfig.github.BRANCH;
          GITHUB_TOKEN = appConfig.github.TOKEN;
          GALLERY_FOLDER = appConfig.github.GALLERY_FOLDER;
          GEMINI_API_KEY = appConfig.gemini.API_KEY;
          GEMINI_API_BASE_URL = appConfig.gemini.API_BASE_URL;
          if (appConfig.gemini && Array.isArray(appConfig.gemini.MODELS)) { GEMINI_MODELS = appConfig.gemini.MODELS; console.log(`[INIT] Loaded ${GEMINI_MODELS.length} Gemini models.`); }
          else { console.error("[INIT] ERROR: Gemini models missing or not array!"); GEMINI_MODELS = []; }
          PROMPT_FORMAT = appConfig.prompts.format;
          PROMPT_IMPROVE_BASE = appConfig.prompts.improve_base;
          PROMPT_IMPROVE_CAMPAIGN = appConfig.prompts.improve_campaign_context;
          PROMPT_IMPROVE_CONTEXT_HEADER = appConfig.prompts.improve_context_header;
          PROMPT_IMPROVE_CONTEXT_FOOTER = appConfig.prompts.improve_context_footer;
          PROMPT_IMPROVE_MAIN_HEADER = appConfig.prompts.improve_main_content_header;
          API_BASE_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents`;
          RAW_CONTENT_BASE = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${GITHUB_BRANCH}`;


          // Update UI with repo info
          repoNameSpan.textContent = `${GITHUB_USERNAME}/${GITHUB_REPO}`;
          repoPathSpan.textContent = `/${GITHUB_DATA_PATH}`;

          // Validate tokens
          if (!GITHUB_TOKEN || GITHUB_TOKEN.startsWith("YOUR_") || GITHUB_TOKEN.length < 30) {
              showError("ERROR: GitHub Token is missing or invalid in config.json.");
              disableAllControls();
              return;
          }
          if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR_") || GEMINI_API_KEY.length < 30) {
              console.warn("[INIT] Gemini API Key missing/invalid.");
          }

          // Setup listeners and resizer
          setupEventListeners();
          makeResizable(sidebar, resizer);

          // *** Fetch initial file list ***
          console.log("[INIT] Attempting to fetch initial file list...");
          await fetchFileList(); // <<<<<<<< THIS IS LIKELY WHERE IT'S FAILING
          console.log("[INIT] Initialization complete.");

      } catch (error) {
          console.error("[INIT] Initialization failed:", error);
          showError(`Initialization failed: ${error.message}`);
          disableAllControls();
      }
  }

  // --- Configuration Loading ---
  async function loadConfig() {
    try {
        console.log("[CONFIG] Fetching config.json..."); // Added log
        const response = await fetch('config.json');
        console.log("[CONFIG] Fetch response status:", response.status); // Added log

        if (!response.ok) {
            // Log the error status before throwing
            console.error(`[CONFIG] Failed to fetch config.json: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch config.json: ${response.status} ${response.statusText}`);
        }

        // *** THIS IS THE CRUCIAL LINE ***
        // It parses the text content of the response as JSON
        appConfig = await response.json();
        // *** END CRUCIAL LINE ***

        // Basic validation (after successful parsing)
        if (!appConfig.github || !appConfig.gemini || !appConfig.prompts) {
              console.error("[CONFIG] config.json is missing required top-level keys (github, gemini, prompts).");
            throw new Error("config.json is missing required top-level keys (github, gemini, prompts).");
        }
        console.log("[CONFIG] config.json loaded and parsed successfully."); // Log success

    } catch (error) {
        console.error("[CONFIG] Error loading or parsing config.json:", error); // Log the specific error
        // Display error prominently and prevent further execution
        showError(`FATAL: Could not load or parse config.json. ${error.message}. Check file content and console.`);
        throw error; // Re-throw to stop initialization
    }
}


  // Estimates token count (simple approximation)
  function estimateTokens(text) {
    if (!text) return 0;
    // Basic estimate: 1 token ~ 4 chars in English
    // This is very rough and language-dependent.
    return Math.ceil(text.length / 4);
  }

  // Shows the loading indicator inside the modal
  function showModalLoading(message = "Processing...") {
    if (modalLoadingIndicator) {
        const textElement = modalLoadingIndicator.querySelector(".loading-text");
        if (textElement) textElement.textContent = message;
        modalLoadingIndicator.style.display = "flex";
    } else {
        console.warn("Modal loading indicator element not found.");
    }
  }

  // Hides the loading indicator inside the modal
  function hideModalLoading() {
    if (modalLoadingIndicator) {
        modalLoadingIndicator.style.display = "none";
    }
  }

  // Shows the main loading indicator in the sidebar
  function showLoading(message = "Loading...") {
    if (loadingIndicator) {
        const textElement = loadingIndicator.querySelector(".loading-text");
        if (textElement) textElement.textContent = message;
        loadingIndicator.style.display = "flex";
    } else {
        console.warn("Main loading indicator element not found.");
    }

    // Disable key buttons during general loading
    if (refreshFileListBtn) refreshFileListBtn.disabled = true;
    if (createNewFileBtn) createNewFileBtn.disabled = true;
    if (editBtn) editBtn.disabled = true;
    if (deleteEntryBtn) deleteEntryBtn.disabled = true;
    if (generatePdfBtn) generatePdfBtn.disabled = true;
    if (formatBtn) formatBtn.disabled = true;
    if (improveBtn) improveBtn.disabled = true;
    if (addImageBtn) addImageBtn.disabled = true;
    // Keep save/cancel enabled if editor is open, disable otherwise?
    // For simplicity, let's assume general loading disables most actions.
  }

  // Hides the main loading indicator in the sidebar
  function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = "none";
    }
    if (!appConfig) return; // Don't enable if config failed

    // Re-enable buttons based on the current state
    if (refreshFileListBtn) refreshFileListBtn.disabled = false;
    if (createNewFileBtn) createNewFileBtn.disabled = false; // Generally enable

    const isFileLoaded = !!currentFilePath;
    const isJournal = !!(currentJsonData?.entity && Array.isArray(currentJsonData.entity.posts)); // Recalculate here if needed
    const geminiReady = !!(GEMINI_API_KEY && !GEMINI_API_KEY.startsWith("YOUR_") && GEMINI_MODELS.length > 0);

    if (editBtn) editBtn.disabled = !isFileLoaded; // Enabled for both types now
    if (deleteEntryBtn) deleteEntryBtn.disabled = !isFileLoaded;
    if (generatePdfBtn) generatePdfBtn.disabled = !isFileLoaded;
    if (formatBtn) formatBtn.disabled = !isFileLoaded || !geminiReady;
    if (improveBtn) improveBtn.disabled = !isFileLoaded || !geminiReady;
    if (addImageBtn) {
        addImageBtn.disabled = !isFileLoaded;
        addImageBtn.style.display = isFileLoaded ? 'block' : 'none';
    }
  }

  // Displays an error message in the main content area
  function showError(message) {
      if (jsonEntryContentDiv) {
          jsonEntryContentDiv.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
      } else {
          console.error("Error display area (jsonEntryContentDiv) not found. Error was:", message);
          alert("Error: " + message); // Fallback alert
      }
      if (currentFileNameH2) {
          currentFileNameH2.textContent = "Error";
      }
  }

  // Disables most controls, typically used on fatal init errors
  function disableAllControls() {
      console.warn("Disabling all controls due to error.");
      if (refreshFileListBtn) refreshFileListBtn.disabled = true;
      if (createNewFileBtn) createNewFileBtn.disabled = true;
      if (editBtn) editBtn.disabled = true;
      if (deleteEntryBtn) deleteEntryBtn.disabled = true;
      if (generatePdfBtn) generatePdfBtn.disabled = true;
      if (formatBtn) formatBtn.disabled = true;
      if (improveBtn) improveBtn.disabled = true;
      if (addImageBtn) addImageBtn.disabled = true;
      if (saveBtn) saveBtn.disabled = true;
      if (cancelBtn) cancelBtn.disabled = true;
      if (selectAllContextBtn) selectAllContextBtn.disabled = true;
      if (deselectAllContextBtn) deselectAllContextBtn.disabled = true;
      if (proceedWithImprovementBtn) proceedWithImprovementBtn.disabled = true;
      if (copyPromptBtn) copyPromptBtn.disabled = true;
      if (geminiModelSelect) geminiModelSelect.disabled = true;
      if (htmlEditorTextarea) htmlEditorTextarea.disabled = true;
      // Could also disable file tree links if needed
  }

  // Switches the main content area to viewing mode
  function switchToViewMode() {
    if (editorDiv) editorDiv.style.display = "none";
    if (viewerDiv) viewerDiv.style.display = "block";
    hideAutocomplete(); // Ensure autocomplete is hidden

    // Re-enable view mode buttons based on state
    const isFileLoaded = !!currentFilePath;
    const geminiReady = !!(GEMINI_API_KEY && !GEMINI_API_KEY.startsWith("YOUR_") && GEMINI_MODELS.length > 0);

    if (editBtn) editBtn.disabled = !isFileLoaded;
    if (deleteEntryBtn) deleteEntryBtn.disabled = !isFileLoaded;
    if (generatePdfBtn) generatePdfBtn.disabled = !isFileLoaded;
    if (formatBtn) formatBtn.disabled = !isFileLoaded || !geminiReady;
    if (improveBtn) improveBtn.disabled = !isFileLoaded || !geminiReady;
    if (addImageBtn) {
        addImageBtn.disabled = !isFileLoaded;
        // Don't hide the button here, loadFileContent does that
    }
    // Disable save/cancel when in view mode
    if (saveBtn) saveBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
  }

  // Switches the main content area to editing mode
  function switchToEditMode() {
    if (viewerDiv) viewerDiv.style.display = "none";
    if (editorDiv) editorDiv.style.display = "block";
    if (htmlEditorTextarea) {
        htmlEditorTextarea.disabled = false; // Ensure enabled
        htmlEditorTextarea.focus();
        // Initial positioning of autocomplete if needed
        positionAutocompletePopup();
    }

    // Disable view mode buttons
    if (editBtn) editBtn.disabled = true;
    if (deleteEntryBtn) deleteEntryBtn.disabled = true;
    if (generatePdfBtn) generatePdfBtn.disabled = true;
    if (formatBtn) formatBtn.disabled = true;
    if (improveBtn) improveBtn.disabled = true;
    if (addImageBtn) addImageBtn.disabled = true; // Disable add image during edit

    // Enable save/cancel
    if (saveBtn) saveBtn.disabled = false;
    if (cancelBtn) cancelBtn.disabled = false;
  }


  // --- GitHub API Functions ---

  // Helper to construct headers for GitHub API calls
  function getGitHubHeaders() {
      if (!GITHUB_TOKEN || GITHUB_TOKEN.startsWith("YOUR_")) {
          // This shouldn't happen if initialize checks passed, but safety check
          console.error("CRITICAL: GitHub Token is missing or invalid when trying to make API call.");
          throw new Error("GitHub Token is missing or invalid.");
      }
      return {
          "Accept": "application/vnd.github.v3+json",
          "Authorization": `token ${GITHUB_TOKEN}`,
          // Consider adding 'X-GitHub-Api-Version' if needed, e.g.:
          // "X-GitHub-Api-Version": "2022-11-28"
      };
  }

  // Fetches directory contents recursively (ADDED LOGGING)
  async function fetchDirectoryContentsRecursive(directoryPath) {
      const url = `${API_BASE_URL}/${directoryPath}?ref=${GITHUB_BRANCH}`;
      console.log(`[FETCH] Fetching directory contents from: ${url}`); // Log URL
      let filesFound = [];
      try {
          const response = await fetch(url, { headers: getGitHubHeaders() });
          console.log(`[FETCH] Response status for ${directoryPath}: ${response.status}`); // Log status

          if (!response.ok) {
              if (response.status === 404) {
                  console.warn(`[FETCH] Directory not found: ${directoryPath}`); return [];
              }
              let errorMsg = `Error fetching directory '${directoryPath}': ${response.status} ${response.statusText}`;
              let responseText = await response.text(); // Try to get response body
              if (response.status === 403) errorMsg += ` (Rate limit/token permissions issue?)`;
              if (response.status === 401) errorMsg += ` (Invalid token?)`;
              console.error(`[FETCH] API Error details: ${responseText}`); // Log error details
              throw new Error(errorMsg);
          }
          const items = await response.json();
          if (!Array.isArray(items)) { throw new Error(`[FETCH] Invalid API response (not an array) for ${directoryPath}`); }
          console.log(`[FETCH] Found ${items.length} items in ${directoryPath}`);

          const promises = items.map(async (item) => {
              if (item.type === "file") {
                  const lowerName = item.name.toLowerCase();
                  let fileType = "other";
                  if (lowerName.endsWith(".json")) fileType = "json";
                  else if (IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) fileType = "image";
                  if (fileType === "json" || fileType === "image") {
                      return { name: item.name, path: item.path, sha: item.sha, download_url: item.download_url, type: fileType };
                  } else return null;
              } else if (item.type === "dir") {
                   //console.log(`[FETCH] Recursing into directory: ${item.path}`);
                  return await fetchDirectoryContentsRecursive(item.path); // Recurse
              } else return null;
          });
          const results = await Promise.all(promises);
          filesFound = results.flat().filter((file) => file !== null);
      } catch (error) {
          console.error(`[FETCH] Error in fetchDirectoryContentsRecursive for ${directoryPath}:`, error);
          // Re-throw to let fetchFileList handle it
          throw error;
      }
      return filesFound;
  }
  function getGitHubHeaders() {
    if (!GITHUB_TOKEN || GITHUB_TOKEN.startsWith("YOUR_")) {
        console.error("CRITICAL: GitHub Token is missing or invalid when trying to make API call.");
        throw new Error("GitHub Token is missing or invalid.");
    }
    return {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${GITHUB_TOKEN}`,
        // "X-GitHub-Api-Version": "2022-11-28" // Optional: Specify API version
    };
}

// Fetches directory contents recursively (Assumed to be present and correct from previous steps)
async function fetchDirectoryContentsRecursive(directoryPath) {
    // ... (implementation from previous steps with [FETCH] logs) ...
    const url = `${API_BASE_URL}/${directoryPath}?ref=${GITHUB_BRANCH}`;
    console.log(`[FETCH] Fetching directory contents from: ${url}`);
    let filesFound = [];
    try {
        const response = await fetch(url, { headers: getGitHubHeaders() });
        console.log(`[FETCH] Response status for ${directoryPath}: ${response.status}`);
        if (!response.ok) { /* ... error handling ... */ throw new Error(/*...*/); }
        const items = await response.json();
        if (!Array.isArray(items)) { throw new Error(`[FETCH] Invalid API response (not an array) for ${directoryPath}`); }
        console.log(`[FETCH] Found ${items.length} items in ${directoryPath}`);
        const promises = items.map(async (item) => {
            if (item.type === "file") {
                const lowerName = item.name.toLowerCase();
                let fileType = "other";
                if (lowerName.endsWith(".json")) fileType = "json";
                else if (IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) fileType = "image";
                if (fileType === "json" || fileType === "image") {
                    return { name: item.name, path: item.path, sha: item.sha, download_url: item.download_url, type: fileType };
                } else return null;
            } else if (item.type === "dir") {
                return await fetchDirectoryContentsRecursive(item.path);
            } else return null;
        });
        const results = await Promise.all(promises);
        filesFound = results.flat().filter((file) => file !== null);
    } catch (error) { console.error(`[FETCH] Error in fetchDirectoryContentsRecursive for ${directoryPath}:`, error); throw error; }
    return filesFound;
}


// Fetches content of a single JSON file (Includes Debug Logging)
async function fetchFileContent(filePath, useCache = true) {
  console.log(`[CONTENT] Attempting to fetch content for: ${filePath}, UseCache: ${useCache}`); // Log entry point

  if (useCache && contextCache[filePath]) {
      console.log(`[CONTENT] Using cached content for: ${filePath}`);
      const latestSha = flatJsonData.find((f) => f.path === filePath)?.sha; // Get potentially updated SHA
      return { jsonData: contextCache[filePath], sha: latestSha || null };
  }

  // Find the file entry in our fetched list
  const fileEntry = flatJsonData.find((item) => item.path === filePath);
  if (!fileEntry) {
      console.error(`[CONTENT] ERROR: File metadata not found in flatJsonData for path: ${filePath}`);
      return null; // Indicate failure
  }
  if (!fileEntry.download_url) {
       console.error(`[CONTENT] ERROR: Missing download_url for file: ${filePath}`, fileEntry);
       return null; // Indicate failure
  }

  const downloadUrl = fileEntry.download_url; // Use the URL from the file entry
  console.log(`[CONTENT] Found file entry. Fetching from download_url: ${downloadUrl}`);
  showLoading(`Loading ${filePath.split('/').pop()}...`); // Show user we are loading

  try {
      // Use fetch with no-cache to try and bypass browser cache for the JSON itself
      const response = await fetch(downloadUrl, { cache: "no-cache" });
      console.log(`[CONTENT] Fetch response status for ${filePath}: ${response.status}`);

      if (!response.ok) {
          // Log error details before throwing
          let errorText = await response.text();
          console.error(`[CONTENT] Fetch error (${response.status}) for ${filePath}. Response text: ${errorText}`);
          throw new Error(`Fetch error (${response.status}): ${response.statusText}`);
      }

      // Get the raw text content
      const jsonString = await response.text();
      console.log(`[CONTENT] Successfully fetched raw text for ${filePath}. Length: ${jsonString.length}`);

      // --- Attempt to parse the JSON ---
      let jsonData;
      try {
          jsonData = JSON.parse(jsonString);
          console.log(`[CONTENT] Successfully parsed JSON for ${filePath}.`);
      } catch (parseError) {
          console.error(`[CONTENT] !!! JSON Parsing Error for ${filePath}:`, parseError);
          console.error(`[CONTENT] Raw text that failed parsing (first 1000 chars):\n`, jsonString.substring(0, 1000)); // Log problematic text
          throw new Error(`Invalid JSON content in file ${filePath}. Check file syntax. Original error: ${parseError.message}`);
      }
      // --- End JSON Parsing ---

      // Update kankaName in flatJsonData and cache the content
      fileEntry.kankaName = jsonData?.name || fileEntry.name.replace(/\.json$/, "");
      contextCache[filePath] = jsonData; // Cache the successfully parsed data

      // Update link text in file tree if it differs
      const linkElement = fileTreeRootUl?.querySelector(`a[data-file-path="${CSS.escape(filePath)}"]`);
      if (linkElement) {
          const currentText = linkElement.textContent;
          const baseName = fileEntry.name.replace(/\.json$/, "");
          if (fileEntry.kankaName && fileEntry.kankaName !== currentText && fileEntry.kankaName !== baseName) {
              linkElement.textContent = fileEntry.kankaName;
          }
          linkElement.title = `Entry: ${fileEntry.kankaName || baseName}`;
      }

      return { jsonData, sha: fileEntry.sha };

  } catch (error) {
      console.error(`[CONTENT] Error loading/parsing file ${filePath}:`, error);
      return null; // Indicate failure
  } finally {
       console.log(`[CONTENT] fetchFileContent finished for ${filePath}.`);
  }
}

// Commits (Creates or Updates) a file to GitHub
async function commitFileToGitHub(filePath, content, commitMessage, sha = null, isBinary = false) {
  console.log(`[COMMIT] Attempting to ${sha ? 'update' : 'create'} file: ${filePath}`);
  showLoading(sha ? 'Saving changes...' : 'Creating file...');
  const url = `${API_BASE_URL}/${filePath}`;
  let base64Content;

  if (!isBinary) {
       try {
          // Correctly handle UTF-8 characters before Base64 encoding
          const utf8Bytes = new TextEncoder().encode(content); // Encode text to UTF-8 bytes
          // Convert byte array to binary string - required by btoa
          let binaryString = '';
          utf8Bytes.forEach(byte => {
              binaryString += String.fromCharCode(byte);
          });
          base64Content = btoa(binaryString); // Encode binary string to Base64
       } catch (e) {
           console.error("[COMMIT] Base64 Text Encoding Error:", e);
           alert("Text Encoding Error. Could not save file.");
           hideLoading();
           return null;
       }
  } else {
       // Assumes 'content' is already a Base64 string if isBinary is true
       // (Usually from FileReader result without the 'data:mime/type;base64,' prefix)
       base64Content = content;
  }

  const body = {
      message: commitMessage,
      content: base64Content,
      branch: GITHUB_BRANCH
  };
  // Add SHA only if updating an existing file
  if (sha) {
      body.sha = sha;
      console.log(`[COMMIT] Providing SHA for update: ${sha}`);
  } else {
      console.log(`[COMMIT] No SHA provided (creating new file).`);
  }

  try {
      const response = await fetch(url, {
          method: 'PUT',
          headers: getGitHubHeaders(),
          body: JSON.stringify(body)
      });

      // Try to parse JSON regardless of status for better error info
      const resultData = await response.json().catch(e => {
           console.warn("[COMMIT] Failed to parse JSON response body, likely no body or non-JSON error.", e);
           return null; // Return null if JSON parsing fails
      });


      if (!response.ok) {
          console.error(`[COMMIT] GitHub API Error (${response.status}) for ${filePath}:`, resultData || response.statusText);
          let errorMsg = `GitHub API Error (${response.status}): ${resultData?.message || response.statusText}`;
          if (response.status === 409) { errorMsg += "\nConflict detected (SHA mismatch?). Refresh & retry."; }
          else if (response.status === 422 && !sha) { errorMsg += ` File may already exist or path is invalid.`; }
           else if (response.status === 422 && sha) { errorMsg += ` File update failed (validation error?).`; }
          else if (response.status === 403) { errorMsg += ` Rate limit/token permissions issue?`; }
          else if (response.status === 401) { errorMsg += ` Invalid token?`; }
          else if (response.status === 404 && sha) { errorMsg += ` File not found for update (SHA: ${sha}). Has it been deleted?`; }
          throw new Error(errorMsg);
      }

      // If response.ok, resultData should contain commit info
      console.log("[COMMIT] GitHub Commit successful:", resultData?.commit?.message, resultData?.content?.path);
      return resultData?.content; // Returns { name, path, sha, size, ... }

  } catch (error) {
      console.error("[COMMIT] Error committing file to GitHub:", error);
      alert(`Failed to save to GitHub: ${filePath}\nError: ${error.message}`);
      // No hideLoading() here, let the caller handle UI state based on null return
      return null; // Indicate failure
  }
  // Removed finally hideLoading, caller should handle it
}

// Deletes a file from GitHub
async function deleteFileFromGitHub(filePath, sha, commitMessage) {
  console.log(`[DELETE] Attempting to delete file: ${filePath} with SHA: ${sha}`);
  showLoading(`Deleting ${filePath.split('/').pop()}...`); // Show feedback
  const url = `${API_BASE_URL}/${filePath}`;
  const body = {
      message: commitMessage,
      sha: sha,
      branch: GITHUB_BRANCH
  };

  try {
    const response = await fetch(url, {
        method: 'DELETE',
        headers: getGitHubHeaders(),
        body: JSON.stringify(body)
    });

    console.log(`[DELETE] Response status for ${filePath}: ${response.status}`);

    if (!response.ok) {
      let errorMsg = `GitHub API Error (${response.status}): ${response.statusText}`;
      let errorData = null;
      try {
          // Attempt to get more details if available
          errorData = await response.json();
          errorMsg += ` - ${errorData.message || 'No specific message.'}`;
          console.error(`[DELETE] API Error details for ${filePath}:`, errorData);
      } catch (e) {
          console.warn(`[DELETE] Could not parse error response body for ${filePath}.`);
      }
      // Provide specific messages based on status codes
      if (response.status === 404) errorMsg += " File not found or already deleted?";
      if (response.status === 409) errorMsg += " Conflict - SHA mismatch? Refresh needed.";
      if (response.status === 401) errorMsg += " Invalid token?";
      if (response.status === 403) errorMsg += " Token permissions issue?";
      if (response.status === 422) errorMsg += " Validation failed (e.g., missing SHA).";

      throw new Error(errorMsg);
    }

    // If response.ok, deletion was successful (usually status 204 No Content or 200 OK with commit info)
    console.log(`[DELETE] Successfully deleted ${filePath} (Status: ${response.status})`);
    return true; // Indicate success

  } catch (error) {
    console.error(`[DELETE] Error deleting file ${filePath} from GitHub:`, error);
    alert(`Failed to delete file from GitHub: ${filePath}\nError: ${error.message}`);
    return false; // Indicate failure
  } finally {
      hideLoading(); // Hide loading indicator after attempt
  }
}

  // --- File Tree and Data Handling ---

  // Main function to fetch and process the file list (ADDED LOGGING)
  async function fetchFileList() {
      console.log("[FETCH] Starting fetchFileList..."); // Log start
      showLoading("Fetching file list...");
      // Reset state
      // ... (keep state resets)
      fileTreeRootUl.innerHTML = ""; allFetchedFiles = []; flatJsonData = []; imageFileMap = {}; fileTree = []; contextCache = {};
      editBtn.disabled = true; deleteEntryBtn.disabled = true; generatePdfBtn.disabled = true; formatBtn.disabled = true; improveBtn.disabled = true; addImageBtn.disabled = true; addImageBtn.style.display = 'none';
      fileCountSpan.textContent = ""; currentFilePath = null; currentJsonData = null; currentFileSha = null;
      currentFileNameH2.textContent = "Select an entry";
      jsonEntryContentDiv.innerHTML = "<p>Fetching all files...</p>";
      imagePreviewSidebar.style.display = "none"; imageListContainer.innerHTML = ""; noImageTextElement.style.display = "block";


      try {
          console.log(`[FETCH] Calling fetchDirectoryContentsRecursive for base path: ${GITHUB_DATA_PATH}`);
          allFetchedFiles = await fetchDirectoryContentsRecursive(GITHUB_DATA_PATH);
          console.log(`[FETCH] fetchDirectoryContentsRecursive completed. Found ${allFetchedFiles ? allFetchedFiles.length : 'null'} total items.`);

          if (allFetchedFiles && allFetchedFiles.length > 0) {
              console.log("[FETCH] Processing fetched files...");
              flatJsonData = []; imageFileMap = {};
              let jsonFileCount = 0;
              const galleryPathPrefix = `${GITHUB_DATA_PATH}/${GALLERY_FOLDER}/`;

              allFetchedFiles.forEach((file) => {
                  // ... (keep processing logic)
                  const isGalleryFile = file.path.startsWith(galleryPathPrefix);
                   if (file.type === "json") {
                       if (!isGalleryFile) {
                           let relativePath = file.path;
                           const dataPathPrefix = GITHUB_DATA_PATH + "/";
                           if (relativePath.startsWith(dataPathPrefix)) { relativePath = relativePath.substring(dataPathPrefix.length); }
                           flatJsonData.push({ ...file, kankaName: null, displayPath: relativePath });
                           jsonFileCount++;
                       }
                   } else if (file.type === "image" && isGalleryFile) {
                       const imageId = file.name.substring(0, file.name.lastIndexOf("."));
                       if (imageId) { imageFileMap[imageId] = file; }
                   }
              });
              console.log(`[FETCH] Processed files: ${jsonFileCount} JSON entries, ${Object.keys(imageFileMap).length} images mapped.`);

              flatJsonData.sort((a, b) => a.displayPath.localeCompare(b.displayPath));

              // Build and render the tree
              console.log("[FETCH] Building file tree...");
              fileTree = buildFileTree(flatJsonData, GITHUB_DATA_PATH);
              console.log("[FETCH] Rendering file tree...");
              renderFileTree(fileTree, fileTreeRootUl);
              console.log("[FETCH] File tree rendered.");

              fileCountSpan.textContent = `${jsonFileCount} JSON entries found.`;
              if (jsonFileCount === 0) { jsonEntryContentDiv.innerHTML = `<p>No JSON entries found in '/${GITHUB_DATA_PATH}'.</p>`; }
              else { jsonEntryContentDiv.innerHTML = "<p>Select an entry from the tree.</p>"; }
              createNewFileBtn.disabled = false;

          } else {
              console.warn("[FETCH] No files found or fetch result was empty/null.");
              fileCountSpan.textContent = `0 files found.`;
              jsonEntryContentDiv.innerHTML = `<p>No files found in '/${GITHUB_DATA_PATH}'. Check path in config.json and repository contents.</p>`;
              createNewFileBtn.disabled = true;
          }
      } catch (error) {
          console.error("[FETCH] Error processing file list:", error);
          // Display the specific error message from the fetch operation if possible
          showError(`Failed to load file tree. Error: ${error.message || 'Unknown error'}. Check console and GitHub details.`);
          fileCountSpan.textContent = "Error loading files.";
      } finally {
          hideLoading();
          console.log("[FETCH] fetchFileList finished.");
      }
  }

  // --- File Tree and Data Handling ---

  // Builds the hierarchical tree structure from flat file data
  function buildFileTree(jsonData, basePath) {
    const tree = [];
    const map = {}; // Maps folder paths to their node in the tree

    jsonData.forEach((file) => {
        // Use displayPath which is relative to GITHUB_DATA_PATH
        const relativePath = file.displayPath || file.name;
        const parts = relativePath.split("/");
        let currentLevel = tree;
        let currentFolderPath = ''; // Path relative to basePath

        // Create folders
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            const folderPathForMap = currentFolderPath ? `${currentFolderPath}/${part}` : part;
            let folderNode = map[folderPathForMap];

            if (!folderNode) {
                // Construct the full GitHub path for the folder dataset
                const fullFolderPath = basePath ? `${basePath}/${folderPathForMap}` : folderPathForMap;
                folderNode = {
                    name: part,
                    path: fullFolderPath, // Use full path for dataset actions
                    type: "dir",
                    children: [],
                };
                map[folderPathForMap] = folderNode;
                currentLevel.push(folderNode);
                // Sort folders alphabetically as they are added
                currentLevel.sort((a, b) => a.name.localeCompare(b.name));
            }
            currentLevel = folderNode.children;
            currentFolderPath = folderPathForMap; // Update relative path for next level
        }

        // Add the file node
        const fileName = parts[parts.length - 1];
        // Ensure the file node uses the full GitHub path from the original file object
        const fileNode = { ...file, name: fileName, type: "file" }; // name is just the filename part
        currentLevel.push(fileNode);

        // Sort files and folders within the current level
        currentLevel.sort((a, b) => {
            if (a.type === "dir" && b.type === "file") return -1;
            if (a.type === "file" && b.type === "dir") return 1;
            return a.name.localeCompare(b.name);
        });
    });

    // Sort the root level
    tree.sort((a, b) => {
       if (a.type === "dir" && b.type === "file") return -1;
       if (a.type === "file" && b.type === "dir") return 1;
       return a.name.localeCompare(b.name);
    });

    return tree;
  }

  // Renders the file tree UL/LI structure
  function renderFileTree(nodes, parentUlElement) {
    parentUlElement.innerHTML = ""; // Clear previous tree
    nodes.forEach((node) => {
      const li = document.createElement("li");
      const nodeContentWrapper = document.createElement("div"); // Wrapper for content and button
      nodeContentWrapper.classList.add('node-content'); // Apply common styling/hover to wrapper

      const nodeDisplayElement = document.createElement(node.type === "file" ? "a" : "span");
      nodeDisplayElement.classList.add("node-text"); // Class for the text part
      nodeDisplayElement.textContent = node.name.replace(/\.json$/i, "");

      if (node.type === "dir") {
        li.classList.add("folder", "collapsed");
        nodeDisplayElement.title = `Folder: ${node.name}`; // Tooltip shows folder name
        // Click listener for expanding/collapsing on the text/icon part
        nodeDisplayElement.addEventListener("click", (e) => {
          li.classList.toggle("collapsed");
        });
        nodeContentWrapper.style.cursor = 'pointer'; // Indicate clickable folder wrapper

        // Add '+' button for creating files within this folder
        const addBtn = document.createElement("button");
        addBtn.textContent = "+";
        addBtn.classList.add("add-in-folder-btn");
        addBtn.title = `Create new entry in ${node.name}`;
        addBtn.dataset.folderPath = node.path; // Store the *full* GitHub path
        addBtn.addEventListener("click", handleCreateInFolderClick); // Attach listener

        nodeContentWrapper.appendChild(nodeDisplayElement); // Add text first
        nodeContentWrapper.appendChild(addBtn); // Add button after text

        li.appendChild(nodeContentWrapper); // Append the wrapper
        const childrenUl = document.createElement("ul");
        if (node.children && node.children.length > 0) {
          renderFileTree(node.children, childrenUl); // Recurse
        }
        li.appendChild(childrenUl);
      } else { // It's a file
        li.classList.add("file");
        nodeDisplayElement.href = "#"; // Make it behave like a link
        const displayName = node.kankaName || node.name.replace(/\.json$/i, "");
        nodeDisplayElement.textContent = displayName;
        nodeDisplayElement.title = `Entry: ${displayName}`;
        nodeDisplayElement.dataset.filePath = node.path; // Store the *full* GitHub path
        nodeDisplayElement.addEventListener("click", (event) => {
          event.preventDefault();
          handleFileLinkClick(node.path, nodeDisplayElement); // Pass the link element itself
        });

        nodeContentWrapper.appendChild(nodeDisplayElement); // Only text inside wrapper for files
        li.appendChild(nodeContentWrapper); // Append the wrapper
      }
      parentUlElement.appendChild(li);
    });
  }

  // Handles clicks on file links in the tree
  function handleFileLinkClick(filePath, linkElement) {
    // We now pass the linkElement directly
    loadFileContentAndDisplay(filePath, linkElement);
  }

  // Handles clicks on the '+' button next to folders
  function handleCreateInFolderClick(event) {
    event.stopPropagation(); // Prevent folder toggle
    const folderPath = event.target.dataset.folderPath; // Get full path
    console.log('+ Clicked! Folder path:', folderPath);
    const folderName = folderPath.split("/").pop();
    const newFileNameBase = prompt(`Enter name for new entry in folder "${folderName}":`);
    if (newFileNameBase && newFileNameBase.trim()) {
      handleCreateNewEntry(newFileNameBase.trim(), folderPath); // Pass full path
    }
  }

  // Handles creating a new entry (called by root button or folder button)
  async function handleCreateNewEntry(name, targetFolderPath) {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      // Sanitize filename
      const safeFilename = trimmedName.toLowerCase()
          .replace(/[^a-z0-9\-_]+/g, "-") // Replace invalid chars with hyphen
          .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
          + ".json";

      if (!safeFilename || safeFilename === ".json") {
          alert("Invalid entry name after sanitization.");
          return;
      }

      const newFilePathInRepo = `${targetFolderPath}/${safeFilename}`; // Construct full path

      // Check for conflicts (name or path) more carefully
      const nameExists = flatJsonData.some(item => item.kankaName && item.kankaName.toLowerCase() === trimmedName.toLowerCase());
      const pathExists = flatJsonData.some(item => item.path === newFilePathInRepo);

      if (nameExists) {
          alert(`An entry with the name '${trimmedName}' may already exist (possibly in a different folder or with a different filename). Please choose a unique name.`);
          return;
      }
      if (pathExists) {
           alert(`A file with the calculated path '${newFilePathInRepo}' already exists. Please choose a different name.`);
           return;
      }

      // --- Create JSON structure ---
      const now = new Date().toISOString().replace("Z", ".000000Z");
      const campaignId = currentJsonData?.campaign_id || null;
      const newJsonData = {
          id: null, // Kanka ID would be assigned by Kanka
          name: trimmedName,
          campaign_id: campaignId,
          entry: `<p>New entry: ${trimmedName}.</p>`, // Basic content for standard entry
          created_at: now,
          updated_at: now,
          is_private: 0,
          tags: [],
          entity: { // Basic entity structure
              id: null, entity_id: null, parent_id: null, type_id: null,
              name: trimmedName, type: null,
              entry: `<p>New entry: ${trimmedName}.</p>`, // Also put basic content here
              is_private: 0, is_template: null, is_attributes_private: 0, // Add missing common field
              focus_x: null, focus_y: null, // Add missing common fields
              created_at: now, updated_at: now,
              created_by: null, updated_by: null, // Add missing fields
              image_uuids: [], // Initialize with empty array for images
              header_uuid: null, image_path: null, header_image: null, // Add missing fields
              marketplace_uuid: null, tooltip: null // Add missing fields
              // Add 'posts': [] if you want newly created files to default to Journal type
              // posts: []
          },
      };
      const jsonString = JSON.stringify(newJsonData, null, 2);
      const commitMessage = `Create entry: ${trimmedName} in ${targetFolderPath === GITHUB_DATA_PATH ? 'root' : targetFolderPath.split('/').pop()}`;

      // --- Commit to GitHub ---
      const commitResult = await commitFileToGitHub(newFilePathInRepo, jsonString, commitMessage);

      if (commitResult) {
          alert(`Created entry '${trimmedName}'. Refreshing file list to see it.`);
          await fetchFileList(); // Refresh the whole list
          // Optionally, try to find and load the newly created file:
          // Find the new file in flatJsonData (after refresh) and call loadFileContentAndDisplay
      }
      // If commitResult is null, commitFileToGitHub already showed an alert.
  }


  // --- Entry Viewing/Editing ---

  // Renders standard HTML content with internal links
  function renderHtmlEntry(htmlContent, targetDiv = jsonEntryContentDiv) {
    // Regex to find @Links not inside HTML tags or attributes
    const linkedHtml = htmlContent.replace(
      /(?<!<[^>]*)(?<!=\s*["'])@([a-zA-Z0-9\s\-_',.!]+)/g,
      (match, docName) => {
        const trimmedName = docName.trim();
        const targetFileEntry = findFileByKankaName(trimmedName);
        if (targetFileEntry) {
          return `<a href="#" data-internal-link="${encodeURIComponent(targetFileEntry.path)}" title="Link to ${trimmedName}">${trimmedName}</a>`;
        } else {
          return `<span class="missing-link" title="Entry not found: ${trimmedName}">@${trimmedName}</span>`;
        }
      }
    );
    targetDiv.innerHTML = linkedHtml;
    // Re-attach event listeners for new links
    targetDiv.querySelectorAll("a[data-internal-link]").forEach((link) => {
        link.addEventListener("click", handleInternalLinkClick);
    });
  }

  // Renders Journal content with multiple posts
  function renderJournalContent(posts, targetDiv = jsonEntryContentDiv) {
      targetDiv.innerHTML = ""; // Clear previous content
      if (!posts || posts.length === 0) {
          targetDiv.innerHTML = "<p><em>Journal contains no posts.</em></p>";
          return;
      }
      const sortedPosts = posts.sort((a, b) => (a.position || 0) - (b.position || 0));
      sortedPosts.forEach((post, index) => {
          const postHeader = document.createElement("h3");
          postHeader.textContent = post.name || `Post ${index + 1}`;
          postHeader.id = `post-${post.id || index}`;
          targetDiv.appendChild(postHeader);
          const postContentDiv = document.createElement("div");
          postContentDiv.classList.add('journal-post-content');
          renderHtmlEntry(post.entry || "<p><em>(Post content is empty)</em></p>", postContentDiv);
          targetDiv.appendChild(postContentDiv);
          if (index < sortedPosts.length - 1) {
              const hr = document.createElement("hr");
              hr.style.borderTop = "1px dotted #c8b8a8"; hr.style.margin = "1em 0";
              targetDiv.appendChild(hr);
          }
      });
  }

  // --- Helper function to get the content to be edited/processed ---
  function getContentForEditingOrAI(isJournal) {
      if (isJournal) {
          return htmlEditorTextarea.dataset.concatenatedJournalHtml || "";
      } else {
          return htmlEditorTextarea.dataset.rawHtmlEntry || "";
      }
  }

  // Loads and displays content for a selected file path (Includes debugging logs from previous step)
  async function loadFileContentAndDisplay(filePath, linkElement = null) {
    console.log(`[LOAD] Attempting to load: ${filePath}`); // Log start

    if (editorDiv.style.display !== "none" && !confirm("Discard current editor changes?")) {
        return;
    }

    let result = null; // Will store { jsonData, sha }
    let isJournal = false; // Flag for Journal type

    // --- Reset UI elements ---
    imagePreviewSidebar.style.display = "block"; // Show sidebar container initially
    imageListContainer.innerHTML = "";
    noImageTextElement.style.display = 'block'; // Assume no images initially
    noImageTextElement.textContent = "Loading image info..."; // Loading text for images
    addImageBtn.style.display = 'none';
    addImageBtn.disabled = true;
    currentFileNameH2.textContent = "Loading...";
    jsonEntryContentDiv.innerHTML = "<p>Loading content...</p>"; // Show loading message
    htmlEditorTextarea.value = ''; // Clear editor
    htmlEditorTextarea.dataset.rawHtmlEntry = ""; // Clear raw HTML cache
    htmlEditorTextarea.dataset.concatenatedJournalHtml = ""; // Clear concatenated cache
    htmlEditorTextarea.disabled = true; // Disable editor initially

    try {
        result = await fetchFileContent(filePath, false); // Force fetch
        console.log(`[LOAD] fetchFileContent result for ${filePath}:`, result ? 'Success' : 'Failure/Null', result?.sha);

        if (result && result.jsonData) {
            // --- Process successful fetch ---
            currentFilePath = filePath;
            currentJsonData = result.jsonData;
            currentFileSha = result.sha;
            console.log(`[LOAD] Successfully fetched data for ${filePath} with SHA: ${currentFileSha}`);

            // Detect Journal type
            isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts) && currentJsonData.entity.posts.length >= 0);
            console.log(`[LOAD] File Type Detected: ${isJournal ? 'Journal' : 'Standard Entry'}`);

            // --- Link Highlighting & Folder Expansion (Keep as is) ---
            if (activeLinkElement && activeLinkElement !== linkElement) { activeLinkElement.classList.remove("active"); }
            if (linkElement) { linkElement.classList.add("active"); activeLinkElement = linkElement; } else { activeLinkElement = null; }
            if (linkElement) {
                let parentLi = linkElement.closest("li.folder");
                while (parentLi) {
                    parentLi.classList.remove("collapsed");
                    const grandParentUl = parentLi.parentElement;
                    if (grandParentUl && grandParentUl.id !== "fileTreeRoot") {
                        parentLi = grandParentUl.closest("li.folder");
                    } else { parentLi = null; }
                }
             }

            // --- Render Main Content & Prepare Editor Content ---
            currentFileNameH2.textContent = currentJsonData?.name || filePath.split("/").pop().replace(/\.json$/, "");
            console.log(`[LOAD] Set header to: ${currentFileNameH2.textContent}`);

            if (isJournal) {
                 console.log("[LOAD] Processing as Journal...");
                const posts = currentJsonData.entity.posts || [];
                const separator = "\n<hr />\n"; // Ensure self-closing HR
                const concatenatedHtml = posts.map(p => p.entry || '').join(separator);
                htmlEditorTextarea.dataset.concatenatedJournalHtml = concatenatedHtml; // Store concatenated version

                // Render structured view
                try {
                    console.log(`[LOAD] Rendering Journal structured view for ${filePath}`);
                    renderJournalContent(posts); // Render the structured view
                    console.log(`[LOAD] Finished rendering Journal structured view for ${filePath}`);
                } catch (renderError) {
                    console.error(`[LOAD] Error during renderJournalContent for ${filePath}:`, renderError);
                    jsonEntryContentDiv.innerHTML = `<p style="color: red;">Error rendering journal content. Check console.</p>`;
                }
                htmlEditorTextarea.disabled = false; // Enable editor for journals (concatenated view)
            } else {
                // *** STANDARD ENTRY PATH ***
                 console.log("[LOAD] Processing as Standard Entry...");
                const entryHtml = currentJsonData?.entity?.entry ?? currentJsonData?.entry ?? "";
                 console.log(`[LOAD] Standard Entry HTML length: ${entryHtml.length}`);
                htmlEditorTextarea.dataset.rawHtmlEntry = entryHtml; // Store raw HTML
                htmlEditorTextarea.disabled = false; // Ensure editor is enabled for standard

                try {
                    console.log(`[LOAD] Rendering standard entry content for ${filePath}...`);
                    renderHtmlEntry(entryHtml || "<p><em>(Entry content is empty)</em></p>", jsonEntryContentDiv);
                    console.log(`[LOAD] Finished rendering standard entry content for ${filePath}`);
                } catch (renderError) {
                    console.error(`[LOAD] Error during renderHtmlEntry for ${filePath}:`, renderError);
                    jsonEntryContentDiv.innerHTML = `<p style="color: red;">Error rendering standard content. Check console.</p>`;
                }
            }

            // --- Image Handling (Improved with async/await) ---
            console.log(`[LOAD] Starting image handling for ${filePath}`);
            let imageUUIDs = currentJsonData?.entity?.image_uuids;
            if (!Array.isArray(imageUUIDs) && currentJsonData?.entity?.image_uuid) { imageUUIDs = [currentJsonData.entity.image_uuid]; }

            if (Array.isArray(imageUUIDs) && imageUUIDs.length > 0) {
                console.log(`[LOAD] Found ${imageUUIDs.length} linked image UUIDs.`);
                let imagesFoundCount = 0;
                // Clear container before adding new images
                imageListContainer.innerHTML = "";
                const imageLoadPromises = imageUUIDs.map(async (uuid) => {
                    const imageData = imageFileMap[uuid];
                    if (imageData && imageData.download_url && imageData.sha) {
                        imagesFoundCount++; // Increment here, assumes data exists
                        const cacheBustedUrl = `${imageData.download_url}?v=${imageData.sha}`;
                        console.log(`[LOAD] - Loading image: UUID=${uuid}, Name=${imageData.name}, URL=${cacheBustedUrl}`);
                        const imageContainerDiv = document.createElement('div');
                        imageContainerDiv.style.position = 'relative'; imageContainerDiv.style.marginBottom = '15px';
                        const imgElement = document.createElement('img');
                        let loadedSuccessfully = false; // Flag to check if image actually loaded
                        await new Promise((resolve) => {
                           imgElement.onload = () => {
                               console.log(`[LOAD] Image loaded: ${cacheBustedUrl}`);
                               loadedSuccessfully = true;
                               resolve();
                           };
                           imgElement.onerror = () => {
                               console.error(`[LOAD] Failed to load image: ${cacheBustedUrl}`);
                               imgElement.style.display = 'none';
                               const errorText = document.createElement('p');
                               errorText.textContent = `[Failed: ${imageData.name || uuid}]`;
                               errorText.style.cssText = 'color: red; font-size: 0.8em; text-align: center;';
                               imageContainerDiv.insertBefore(errorText, imgElement);
                               resolve();
                           };
                           imgElement.src = cacheBustedUrl;
                           imgElement.alt = `Linked image ${uuid}`;
                           imgElement.title = `${imageData.name} (UUID: ${uuid}) - Click to enlarge`;
                           imgElement.style.cssText = `display: block; max-width: 100%; height: auto; border: 1px solid #d4c8b8; border-radius: 3px; background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 0 auto; cursor: pointer;`;
                           imgElement.addEventListener('click', () => openImageLightbox(cacheBustedUrl));
                        });

                        if (loadedSuccessfully) {
                             const deleteBtn = document.createElement('button');
                             deleteBtn.textContent = '×'; deleteBtn.title = `Delete image: ${imageData.name}`;
                             deleteBtn.style.cssText = `position: absolute; top: 2px; right: 2px; background-color: rgba(200, 0, 0, 0.7); color: white; border: 1px solid rgba(100, 0, 0, 0.8); border-radius: 50%; width: 20px; height: 20px; line-height: 18px; text-align: center; font-size: 14px; font-weight: bold; cursor: pointer; padding: 0; z-index: 10;`;
                             deleteBtn.dataset.uuid = uuid; deleteBtn.dataset.filename = imageData.name;
                             deleteBtn.addEventListener('click', handleDeleteImageClick);
                             imageContainerDiv.appendChild(deleteBtn);
                        }
                        imageContainerDiv.appendChild(imgElement);
                        imageListContainer.appendChild(imageContainerDiv);
                    } else {
                         console.warn(`[LOAD] Image data not found or incomplete for UUID: ${uuid}.`);
                         const errorP = document.createElement('p'); errorP.textContent = `[Data missing: ${uuid}]`; errorP.style.cssText = 'font-size: 0.8em; color: orange; text-align: center; margin-bottom: 10px;';
                         imageListContainer.appendChild(errorP);
                    }
                });
                await Promise.all(imageLoadPromises);

                // Update "no image" text based on final counts
                const actualRenderedImages = imageListContainer.querySelectorAll('img:not([style*="display: none"])').length;
                if (actualRenderedImages > 0) {
                     noImageTextElement.style.display = 'none';
                } else if (imageUUIDs.length > 0) {
                     noImageTextElement.textContent = "Linked images found, but failed to load.";
                     noImageTextElement.style.display = 'block';
                } else {
                    noImageTextElement.textContent = "No images linked.";
                    noImageTextElement.style.display = 'block';
                }

            } else {
                 console.log("[LOAD] No image UUIDs found for this entry.");
                 imageListContainer.innerHTML = ""; // Clear just in case
                 noImageTextElement.textContent = "No images linked.";
                 noImageTextElement.style.display = 'block';
            }
             console.log(`[LOAD] Finished image handling for ${filePath}`);
            // --- End Image Handling ---

        } else {
             // Handle failed file fetch
            console.error(`[LOAD] fetchFileContent failed or returned no JSON data for ${filePath}.`);
            result = null; showError(`Failed to load entry content for ${filePath}.`);
            if (activeLinkElement) { activeLinkElement.classList.remove("active"); activeLinkElement = null; }
            imagePreviewSidebar.style.display = 'none';
        }
    } catch (error) {
         // Handle critical errors
        console.error(`[LOAD] Critical error loading/displaying file ${filePath}:`, error);
        result = null; showError(`Critical error processing entry: ${error.message}. Check console.`);
        if (activeLinkElement) { activeLinkElement.classList.remove("active"); activeLinkElement = null; }
        imagePreviewSidebar.style.display = 'none';
    } finally {
        console.log(`[LOAD] Finally block for ${filePath}. Result status: ${!!result}`);
        // Set button states
        const enableButtons = !!result;
        if (result) { addImageBtn.style.display = "block"; addImageBtn.disabled = false; }
        else { addImageBtn.style.display = 'none'; addImageBtn.disabled = true; }
        editBtn.disabled = !enableButtons;
        deleteEntryBtn.disabled = !enableButtons;
        generatePdfBtn.disabled = !enableButtons;
        formatBtn.disabled = !enableButtons || !GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR_") || GEMINI_MODELS.length === 0;
        improveBtn.disabled = !enableButtons || !GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR_") || GEMINI_MODELS.length === 0;
        editBtn.title = ""; formatBtn.title = ""; improveBtn.title = "";
        htmlEditorTextarea.disabled = !enableButtons;
        switchToViewMode();
        if (!result) { imagePreviewSidebar.style.display = 'none'; }
        console.log(`[LOAD] Load process finished for ${filePath}`);
    }
  }

  // Handles clicks on @Links within entry content
  function handleInternalLinkClick(event) {
    event.preventDefault();
    const targetPath = decodeURIComponent(event.target.dataset.internalLink);
    const targetFileEntry = flatJsonData.find((item) => item.path === targetPath);
    if (targetFileEntry) {
      const linkElement = fileTreeRootUl.querySelector(`a[data-file-path="${CSS.escape(targetPath)}"]`);
      loadFileContentAndDisplay(targetPath, linkElement);
      const viewEditArea = document.querySelector(".entry-view-edit-area");
      if (viewEditArea) viewEditArea.scrollTop = 0;
    } else {
      alert(`Link target "${targetPath}" not found in the current file list. Refresh list?`);
    }
  }

  // Finds a file in flatJsonData by its kankaName (case-insensitive)
  function findFileByKankaName(kankaName) {
    if (!kankaName) return null;
    const lowerKankaName = kankaName.toLowerCase();
    // Ensure kankaName is loaded before searching - fetchFileContent populates it
    return flatJsonData.find(item => item.kankaName && item.kankaName.toLowerCase() === lowerKankaName);
  }


  // --- Image Handling (Add/Delete/View) ---

  // Handles click on the 'Add Image' button
  function handleAddImageClick() {
      console.log("Add Image button clicked, triggering input...");
      if (imageUploadInput) imageUploadInput.click(); // Trigger hidden file input
      else console.error("Image upload input element not found.");
  }

  // Handles file selection for image upload
  async function handleImageUploadInputChange(event) {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;
    if(imageUploadInput) imageUploadInput.value = ""; // Clear input for re-selection
    if (!currentFilePath || !currentJsonData || !currentFileSha) {
        alert("Load an entry before adding an image."); return;
    }
    const entryName = currentJsonData.name || "this entry";
    const confirmUpload = confirm(`Add image "${file.name}" to entry "${entryName}"?`);
    if (confirmUpload) {
        await uploadImageAndLink(file); // Call upload function
    }
  }

  // Uploads image, creates metadata, links UUID to entry
  async function uploadImageAndLink(imageFile) {
    showLoading(`Reading ${imageFile.name}...`);

    // --- Prepare filenames and paths ---
    const sanitizedFilenameBase = imageFile.name.substring(0, imageFile.name.lastIndexOf('.')).replace(/[^a-z0-9\-_]/gi, '_').replace(/_+/g, '_');
    const fileExt = imageFile.name.substring(imageFile.name.lastIndexOf('.') + 1).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(`.${fileExt}`)) {
         alert(`Invalid image file type: .${fileExt}. Allowed types: ${IMAGE_EXTENSIONS.join(', ')}`);
         hideLoading(); return;
    }
    const imageId = crypto.randomUUID ? crypto.randomUUID() : `img-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;
    const imageFileNameWithId = `${imageId}.${fileExt}`;
    const imageFilePath = `${GITHUB_DATA_PATH}/${GALLERY_FOLDER}/${imageFileNameWithId}`;
    const metadataFilePath = `${GITHUB_DATA_PATH}/${GALLERY_FOLDER}/${imageId}.json`;
    console.log(`Generated New Image ID: ${imageId}`);
    console.log(`Target Image Path (New): ${imageFilePath}`);
    console.log(`Target Metadata Path (New): ${metadataFilePath}`);

    // --- Check for conflicts (unlikely with UUID, but good practice) ---
    const conflictingImage = allFetchedFiles.find(f => f.path === imageFilePath);
    const conflictingMeta = allFetchedFiles.find(f => f.path === metadataFilePath);
    if (conflictingImage || conflictingMeta) {
         alert(`Generated file ID "${imageId}" conflicts with an existing file. Please try again.`);
         hideLoading(); return;
    }

    try {
        const reader = new FileReader();
        reader.onerror = (e) => { throw new Error("Failed to read image file using FileReader."); };
        reader.onload = async (e) => { // Process after reading file
            const dataUrl = e.target.result;
            const base64Content = dataUrl.split(',')[1];
            if (!base64Content) { throw new Error("Could not read image data as Base64."); }
            console.log("FileReader loaded successfully.");
            const now = new Date().toISOString().replace('Z', '.000000Z');

            // --- 1. Upload Image File ---
            showLoading(`Uploading ${imageFileNameWithId}...`);
            const uploadCommitMessage = `Upload gallery image: ${imageFileNameWithId}`;
            const imageUploadResult = await commitFileToGitHub(imageFilePath, base64Content, uploadCommitMessage, null, true); // isBinary = true
            if (!imageUploadResult) { /* Error handled in commit func */ return; }
            console.log("Image File Upload Successful", imageUploadResult);

            // --- 2. Create & Upload Metadata File ---
            showLoading(`Creating metadata for ${imageFileNameWithId}...`);
            const imageMetadata = { id: imageId, campaign_id: currentJsonData?.campaign_id || null, name: imageFile.name, ext: fileExt, size: imageFile.size, created_by: currentJsonData?.entity?.created_by || currentJsonData?.created_by || null, created_at: now, updated_at: now, is_default: 0, folder_id: null, is_folder: 0, visibility_id: 1, focus_x: null, focus_y: null, image_folder: null };
            const metadataString = JSON.stringify(imageMetadata, null, 2);
            const metadataCommitMessage = `Create metadata for image: ${imageFileNameWithId}`;
            const metadataUploadResult = await commitFileToGitHub(metadataFilePath, metadataString, metadataCommitMessage, null, false); // isBinary = false
            if (!metadataUploadResult) { /* Error handled */ return; }
            console.log("Metadata Upload Successful", metadataUploadResult);

            // --- 3. Update Local State (Maps, Lists) ---
            const newImageDataForMap = { name: imageUploadResult.name, path: imageUploadResult.path, sha: imageUploadResult.sha, download_url: imageUploadResult.download_url || `${RAW_CONTENT_BASE}/${imageUploadResult.path}`, type: 'image' };
            const newMetadataData = { name: metadataUploadResult.name, path: metadataUploadResult.path, sha: metadataUploadResult.sha, download_url: metadataUploadResult.download_url || `${RAW_CONTENT_BASE}/${metadataUploadResult.path}`, type: 'json' };
            imageFileMap[imageId] = newImageDataForMap; // Add to map
            allFetchedFiles.push(newImageDataForMap); // Add to full list
            allFetchedFiles.push(newMetadataData); // Add metadata to full list

            // --- 4. Add UUID to Entry & Save Entry ---
            showLoading(`Linking image and saving entry...`);
            const modifiedJsonData = JSON.parse(JSON.stringify(currentJsonData));
            if (!modifiedJsonData.entity) { modifiedJsonData.entity = {}; }
            if (!Array.isArray(modifiedJsonData.entity.image_uuids)) {
                if (modifiedJsonData.entity.image_uuid) { // Handle legacy
                     modifiedJsonData.entity.image_uuids = [modifiedJsonData.entity.image_uuid];
                     delete modifiedJsonData.entity.image_uuid;
                } else { modifiedJsonData.entity.image_uuids = []; }
            }
            modifiedJsonData.entity.image_uuids.push(imageId);
            modifiedJsonData.updated_at = now; // Update timestamp
            if (modifiedJsonData.entity) { modifiedJsonData.entity.updated_at = now; }
            const updatedJsonString = JSON.stringify(modifiedJsonData, null, 2);
            const linkCommitMessage = `Link image ${newImageDataForMap.name} to entry: ${modifiedJsonData.name || currentFilePath.split('/').pop()}`;
            const linkCommitResult = await commitFileToGitHub(currentFilePath, updatedJsonString, linkCommitMessage, currentFileSha);

            if (linkCommitResult) {
                // --- 5. Update Entry State Variables ---
                currentFileSha = linkCommitResult.sha;
                currentJsonData = modifiedJsonData;
                contextCache[currentFilePath] = modifiedJsonData; // Update cache
                // Update editor cache based on type
                const isJournal = !!(modifiedJsonData.entity && Array.isArray(modifiedJsonData.entity.posts));
                if(isJournal) {
                    const separator = "\n<hr />\n";
                    htmlEditorTextarea.dataset.concatenatedJournalHtml = (modifiedJsonData.entity.posts || []).map(p => p.entry || '').join(separator);
                } else {
                    htmlEditorTextarea.dataset.rawHtmlEntry = modifiedJsonData.entity?.entry || modifiedJsonData.entry || '';
                }

                const fileIndex = flatJsonData.findIndex(item => item.path === currentFilePath);
                if (fileIndex !== -1) { flatJsonData[fileIndex].sha = linkCommitResult.sha; } // Update SHA in flat list
                alert(`Image "${imageFileNameWithId}" added and linked successfully.`);

                // --- 6. Refresh View ---
                hideLoading(); // Hide loading *before* reloading content
                loadFileContentAndDisplay(currentFilePath, activeLinkElement); // Reload to show new image
            } else {
                 alert("Image/Metadata uploaded, but saving the link back to the entry failed. Please refresh and check.");
                 // Don't hide loading as state is inconsistent
            }
        }; // End reader.onload
        reader.readAsDataURL(imageFile); // Start reading
    } catch (error) {
        console.error("Error during image add/link process:", error);
        alert(`Operation failed: ${error.message}\nCheck console for details.`);
        hideLoading();
    }
  }

  // Handles clicking the delete 'X' button on an image
  function handleDeleteImageClick(event) {
      const button = event.currentTarget;
      const uuid = button.dataset.uuid;
      const filename = button.dataset.filename || 'this image';
      if (!uuid) { console.error("Delete button missing UUID."); alert("Error: Cannot determine which image to delete."); return; }
      if (!currentFilePath || !currentJsonData || !currentFileSha) { alert("Error: Current entry data not loaded."); return; }
      const confirmDelete = confirm(`DELETE Image?\n\nAre you sure you want to permanently delete the image "${filename}" and remove it from the entry "${currentJsonData.name || 'current entry'}"?\n\nThis cannot be undone.`);
      if (confirmDelete) { deleteImageFromGitHubAndEntry(uuid); }
  }

  // Deletes image+metadata from GitHub, then updates entry JSON
  async function deleteImageFromGitHubAndEntry(uuid) {
      showLoading(`Deleting image ${uuid}...`);
      // 1. Find file details
      const imageData = imageFileMap[uuid];
      const metadataFile = allFetchedFiles.find(f => f.path && f.path.includes(`/${GALLERY_FOLDER}/`) && f.path.endsWith(`/${uuid}.json`));
      if (!imageData || !imageData.path || !imageData.sha) { alert(`Error: Could not find image file data locally for UUID ${uuid}.`); hideLoading(); return; }
      if (!metadataFile || !metadataFile.path || !metadataFile.sha) { alert(`Error: Could not find metadata file data locally for UUID ${uuid}.`); hideLoading(); return; }

      let imageDeleted = false;
      let metadataDeleted = false;

      try {
          // 2. Delete Image File
          console.log(`Attempting to delete image file: ${imageData.path} (SHA: ${imageData.sha})`);
          imageDeleted = await deleteFileFromGitHub(imageData.path, imageData.sha, `Delete gallery image: ${imageData.name} (UUID: ${uuid})`);
          if (!imageDeleted) throw new Error(`Failed to delete image file ${imageData.path}`);
          console.log("Image file deleted successfully.");

          // 3. Delete Metadata File
          console.log(`Attempting to delete metadata file: ${metadataFile.path} (SHA: ${metadataFile.sha})`);
          metadataDeleted = await deleteFileFromGitHub(metadataFile.path, metadataFile.sha, `Delete metadata for image: ${imageData.name} (UUID: ${uuid})`);
          if (!metadataDeleted) throw new Error(`Failed to delete metadata file ${metadataFile.path}`);
          console.log("Metadata file deleted successfully.");

          // 4. Update Entry JSON
          showLoading(`Updating entry: ${currentJsonData.name}...`);
          const modifiedJsonData = JSON.parse(JSON.stringify(currentJsonData));
          if (modifiedJsonData.entity && Array.isArray(modifiedJsonData.entity.image_uuids)) {
              const initialLength = modifiedJsonData.entity.image_uuids.length;
              modifiedJsonData.entity.image_uuids = modifiedJsonData.entity.image_uuids.filter(id => id !== uuid);
              if (modifiedJsonData.entity.image_uuids.length === initialLength) { console.warn(`UUID ${uuid} not found in entry's image_uuids array.`); }
              const now = new Date().toISOString().replace('Z', '.000000Z');
              modifiedJsonData.updated_at = now;
              if (modifiedJsonData.entity) { modifiedJsonData.entity.updated_at = now; }
              const updatedJsonString = JSON.stringify(modifiedJsonData, null, 2);
              const linkCommitMessage = `Unlink deleted image (UUID: ${uuid}) from entry: ${modifiedJsonData.name || currentFilePath.split('/').pop()}`;
              const linkCommitResult = await commitFileToGitHub(currentFilePath, updatedJsonString, linkCommitMessage, currentFileSha);

              if (linkCommitResult) {
                  console.log("Entry updated successfully.");
                  // Update local state
                  currentFileSha = linkCommitResult.sha; currentJsonData = modifiedJsonData;
                  contextCache[currentFilePath] = modifiedJsonData;

                  // Update editor cache based on type
                  const isJournal = !!(modifiedJsonData.entity && Array.isArray(modifiedJsonData.entity.posts));
                  if(isJournal) {
                      const separator = "\n<hr />\n";
                      htmlEditorTextarea.dataset.concatenatedJournalHtml = (modifiedJsonData.entity.posts || []).map(p => p.entry || '').join(separator);
                  } else {
                      htmlEditorTextarea.dataset.rawHtmlEntry = modifiedJsonData.entity?.entry || modifiedJsonData.entry || '';
                  }

                  const fileIndex = flatJsonData.findIndex(item => item.path === currentFilePath);
                  if (fileIndex !== -1) { flatJsonData[fileIndex].sha = linkCommitResult.sha; }
              } else { throw new Error("Failed to save updated entry JSON."); }
          } else { console.warn("Entry data missing image_uuids array or entity structure."); } // Changed to warning

          // 5. Update local maps/lists
          delete imageFileMap[uuid];
          allFetchedFiles = allFetchedFiles.filter(f => f.path !== imageData.path && f.path !== metadataFile.path);
          console.log("Local maps and file lists updated.");
          alert(`Image "${imageData.name}" deleted successfully.`);

      } catch (error) {
          console.error("Error during image deletion:", error);
          alert(`Image deletion failed: ${error.message}\n\nGitHub state might be inconsistent. Check console and consider refreshing.`);
      } finally {
          hideLoading();
          if (currentFilePath) { // Reload view to reflect changes/errors
              console.log("Reloading current entry view after deletion attempt...");
              loadFileContentAndDisplay(currentFilePath, activeLinkElement);
          }
      }
  }

  // Opens the image lightbox modal
  function openImageLightbox(imageUrl) {
      if (lightboxImage && imageLightboxModal) {
          console.log("Opening lightbox for:", imageUrl);
          lightboxImage.src = imageUrl; // Set the source for the modal image
          imageLightboxModal.style.display = 'flex'; // Show the modal
      } else {
          console.error("Lightbox elements not found.");
      }
  }

  // Closes the image lightbox modal
  function closeImageLightbox() {
      if (imageLightboxModal) {
          imageLightboxModal.style.display = 'none'; // Hide the modal
          if (lightboxImage) lightboxImage.src = ''; // Clear src to stop loading/free memory
      }
  }


  // --- Entry Deletion ---

  // Handles clicking the Delete Entry button
  async function handleDeleteEntryClick() {
      if (!currentFilePath || !currentJsonData || !currentFileSha) {
          alert("No entry selected to delete."); return;
      }

      const entryName = currentJsonData.name || currentFilePath.split('/').pop();
      const imageUUIDs = currentJsonData.entity?.image_uuids || []; // Get linked image IDs
      const imageCount = Array.isArray(imageUUIDs) ? imageUUIDs.length : 0;

      const confirmMessage = `DELETE ENTRY AND LINKED IMAGES?\n\n`
          + `Entry: "${entryName}" (${currentFilePath})\n`
          + `This will also attempt to delete ${imageCount} linked image file(s) and their metadata from the gallery.\n\n`
          + `THIS ACTION IS PERMANENT AND CANNOT BE UNDONE.\n\n`
          + `Are you absolutely sure?`;

      if (!confirm(confirmMessage)) { return; }

      showLoading(`Deleting entry ${entryName} and ${imageCount} images...`);

      let allImagesDeleted = true;
      let imageDeleteErrors = [];

      // 1. Delete linked images and metadata
      if (imageCount > 0) {
          console.log(`Starting deletion of ${imageCount} linked images...`);
          for (const uuid of imageUUIDs) {
              const imageData = imageFileMap[uuid];
              const metadataFile = allFetchedFiles.find(f => f.path && f.path.includes(`/${GALLERY_FOLDER}/`) && f.path.endsWith(`/${uuid}.json`));
              let imgDel = false; let metaDel = false;

              if (imageData?.path && imageData?.sha) {
                  console.log(`Deleting image file for ${uuid}: ${imageData.path}`);
                  imgDel = await deleteFileFromGitHub(imageData.path, imageData.sha, `Delete image (part of entry delete): ${imageData.name}`);
                  if (!imgDel) imageDeleteErrors.push(`Failed to delete image file: ${imageData.path}`);
              } else { console.warn(`Skipping image file delete for ${uuid}: Data missing.`); }

              if (metadataFile?.path && metadataFile?.sha) {
                  console.log(`Deleting metadata file for ${uuid}: ${metadataFile.path}`);
                  metaDel = await deleteFileFromGitHub(metadataFile.path, metadataFile.sha, `Delete metadata (part of entry delete): ${imageData?.name || uuid}`);
                  if (!metaDel) imageDeleteErrors.push(`Failed to delete metadata file: ${metadataFile.path}`);
              } else { console.warn(`Skipping metadata file delete for ${uuid}: Data missing.`); }

              if (!imgDel || !metaDel) { allImagesDeleted = false; }
          }
          console.log("Finished image deletion phase.");
      }

      if (!allImagesDeleted) {
          alert("Warning: Some linked images or metadata files could not be deleted. See console for details. Proceeding to delete entry file anyway...");
      }

      // 2. Delete the main entry JSON file
      console.log(`Attempting to delete entry file: ${currentFilePath} (SHA: ${currentFileSha})`);
      const entryDeleted = await deleteFileFromGitHub(
          currentFilePath,
          currentFileSha,
          `Delete entry: ${entryName}`
      );

      hideLoading(); // Hide loading before final alerts/actions

      if (entryDeleted) {
          alert(`Entry "${entryName}" and associated images (if any) deleted successfully. Refreshing list...`);

          // 3. Clear current view and state
          currentFilePath = null; currentJsonData = null; currentFileSha = null; activeLinkElement = null;
          currentFileNameH2.textContent = "Select an entry";
          jsonEntryContentDiv.innerHTML = `<p>Entry deleted. Select another entry or refresh.</p>`;
          editorDiv.style.display = 'none'; viewerDiv.style.display = 'block';
          imagePreviewSidebar.style.display = 'none';
          imageListContainer.innerHTML = '';
          disableAllControls(); // Disable buttons until new selection/refresh

          // 4. Refresh file list to reflect deletion
          await fetchFileList();

      } else {
          alert(`Failed to delete the main entry file "${entryName}". Associated images may or may not have been deleted. Check GitHub and the console. Refresh recommended.`);
      }
  }


  // --- Editor and Autocomplete ---

  // Handles input in the editor textarea for @mention autocomplete
  function handleEditorInput(event) {
    if (!htmlEditorTextarea) return;
    const text = htmlEditorTextarea.value;
    const cursorPos = htmlEditorTextarea.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9\s\-_',.!]*)$/);

    if (mentionMatch) {
        const textAroundMention = text.substring(Math.max(0, cursorPos - mentionMatch[0].length - 10), cursorPos + 10);
        const lastOpenBracket = textBeforeCursor.lastIndexOf('<');
        const lastCloseBracket = textBeforeCursor.lastIndexOf('>');
        if (lastOpenBracket > lastCloseBracket && textAroundMention.includes('<')) {
            hideAutocomplete(); return;
        }
        currentMentionStartIndex = cursorPos - mentionMatch[1].length - 1;
        currentAutocompleteQuery = mentionMatch[1];
        showAutocomplete(currentAutocompleteQuery);
        positionAutocompletePopup();
    } else {
        hideAutocomplete();
    }
  }

  // Handles keyboard navigation (arrows, Enter, Esc) in autocomplete popup
  function handleEditorKeyDown(event) {
    if (!autocompletePopup || autocompletePopup.style.display === "none") return;

    const items = autocompletePopup.querySelectorAll("div");
    if (items.length === 0) return;

    let preventDefault = false; // Flag to prevent default behavior

    switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
            preventDefault = true;
            if (event.key === "ArrowDown") {
                selectedAutocompleteIndex = (selectedAutocompleteIndex + 1) % items.length;
            } else { // ArrowUp
                selectedAutocompleteIndex = (selectedAutocompleteIndex - 1 + items.length) % items.length;
            }
            updateAutocompleteSelection(items);
            break;
        case "Enter":
        case "Tab": // Treat Tab like Enter for selection
            preventDefault = true;
            if (selectedAutocompleteIndex >= 0 && selectedAutocompleteIndex < items.length) {
                items[selectedAutocompleteIndex].click(); // Trigger click on selected item
            } else if (items.length > 0 && !items[0].classList.contains('create-new')) {
                 items[0].click(); // Select first existing item if nothing highlighted
            } else {
                 hideAutocomplete(); // Hide if only "Create New" or nothing selectable
            }
            break;
        case "Escape":
            preventDefault = true;
            hideAutocomplete();
            break;
    }

    if (preventDefault) {
        event.preventDefault();
    }
  }

  // Updates the visual selection in the autocomplete popup
  function updateAutocompleteSelection(items) {
    items.forEach((item, index) => {
      if (index === selectedAutocompleteIndex) {
        item.classList.add("selected");
        // Ensure the selected item is visible within the popup
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else {
        item.classList.remove("selected");
      }
    });
  }

  // Shows and populates the autocomplete popup
  function showAutocomplete(query) {
    if (!autocompletePopup) return;
    const lowerQuery = query.toLowerCase().trim();
    // Filter entries based on kankaName or displayPath
    const suggestions = flatJsonData.filter((item) => {
      const nameToSearch = (item.kankaName || item.displayPath.replace(/\.json$/i, '')).toLowerCase();
      // Simple includes search, exclude exact match (unless it's the only result?)
      return nameToSearch.includes(lowerQuery); // && nameToSearch !== lowerQuery; - allow exact match in list
    }).slice(0, 15); // Limit suggestions

    autocompletePopup.innerHTML = ""; // Clear previous

    suggestions.forEach((item) => {
      const div = document.createElement("div");
      const displayName = item.kankaName || item.displayPath.replace(/\.json$/i, '');
      div.textContent = displayName;
      div.title = item.path;
      div.dataset.kankaName = item.kankaName || displayName;
      div.addEventListener("mousedown", handleSuggestionClick); // Use mousedown
      autocompletePopup.appendChild(div);
    });

    // Option to create new entry
    const createNewName = query.trim();
    if (createNewName) {
      const safeFilename = createNewName.toLowerCase().replace(/[^a-z0-9\-_]+/g, "-").replace(/^-+|-+$/g, "") + ".json";
      const filePathInRepo = `${GITHUB_DATA_PATH}/${safeFilename}`; // Assume root creation
      const nameExists = findFileByKankaName(createNewName);
      const pathExists = flatJsonData.some(item => item.path === filePathInRepo);

      if (!nameExists && !pathExists && safeFilename !== ".json") {
        const div = document.createElement("div");
        div.textContent = `Create New: ${createNewName}`;
        div.classList.add("create-new");
        div.dataset.newFileNameBase = createNewName;
        div.addEventListener("mousedown", handleCreateNewSuggestionClick);
        autocompletePopup.appendChild(div);
      }
    }

    if (autocompletePopup.children.length > 0) {
      autocompletePopup.style.display = "block";
      selectedAutocompleteIndex = -1; // Reset selection
      positionAutocompletePopup(); // Reposition after content added
    } else {
      hideAutocomplete();
    }
  }

  // Positions the autocomplete popup near the text cursor
  function positionAutocompletePopup() {
      const textarea = htmlEditorTextarea;
      const mirror = document.getElementById('autocomplete-mirror');
      const popup = autocompletePopup;
      if (!textarea || !mirror || !popup || popup.style.display === 'none') return;

      const text = textarea.value;
      const cursorPos = textarea.selectionStart;
      // Only calculate if a mention is potentially active
      if (currentMentionStartIndex < 0) return;

      // Use text up to the start of the mention for more stable positioning base
      const textBeforeMention = text.substring(0, currentMentionStartIndex);
      const mirrorHTML = textBeforeMention
          .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
          .replace(/\n/g, '<br>');

      mirror.innerHTML = mirrorHTML + '<span id="cursor-marker">@</span>'; // Marker at '@' position

      const marker = mirror.querySelector('#cursor-marker');
      if (!marker) return;

      const textareaRect = textarea.getBoundingClientRect();
      const computedTextareaStyle = window.getComputedStyle(textarea);
      const textareaPadTop = parseFloat(computedTextareaStyle.paddingTop);
      const textareaPadLeft = parseFloat(computedTextareaStyle.paddingLeft);
      const textareaBorderTop = parseFloat(computedTextareaStyle.borderTopWidth);
      const textareaBorderLeft = parseFloat(computedTextareaStyle.borderLeftWidth);
      let textareaLineHeight = parseFloat(computedTextareaStyle.lineHeight);
      if (isNaN(textareaLineHeight)) {
          const fontSize = parseFloat(computedTextareaStyle.fontSize);
          textareaLineHeight = (parseFloat(computedTextareaStyle.lineHeight) || 1.2) * fontSize;
      }
       if (isNaN(textareaLineHeight)) textareaLineHeight = 16; // Fallback

      const baseTop = textareaRect.top + textareaBorderTop + textareaPadTop - textarea.scrollTop;
      const baseLeft = textareaRect.left + textareaBorderLeft + textareaPadLeft - textarea.scrollLeft;

      // Position using marker's offset relative to mirror
      const popupTop = baseTop + marker.offsetTop + textareaLineHeight; // Position below the line with '@'
      const popupLeft = baseLeft + marker.offsetLeft;

      popup.style.position = 'fixed';
      popup.style.top = `${popupTop}px`;
      popup.style.left = `${popupLeft}px`;

      // Ensure popup stays within viewport bounds
      requestAnimationFrame(() => { // Wait for styles to apply
           const popupRect = popup.getBoundingClientRect();
            if (popupRect.right > window.innerWidth - 10) {
                popup.style.left = `${window.innerWidth - popupRect.width - 10}px`;
            }
            if (popupRect.left < 10) { popup.style.left = '10px'; }
            if (popupRect.bottom > window.innerHeight - 10) {
                 // Try moving it above the cursor line instead
                 popup.style.top = `${baseTop + marker.offsetTop - popupRect.height - 2}px`;
            }
            if (popupRect.top < 0) { popup.style.top = '10px'; } // Prevent going off top
      });
  }

  // Hides the autocomplete popup
  function hideAutocomplete() {
    if (autocompletePopup) {
        autocompletePopup.style.display = "none";
        autocompletePopup.innerHTML = ""; // Clear content
    }
    currentAutocompleteQuery = "";
    currentMentionStartIndex = -1;
    selectedAutocompleteIndex = -1;
  }

  // Handles clicking on a suggestion in the popup
  function handleSuggestionClick(event) {
    event.preventDefault(); // Prevent blur event firing too early
    const suggestedName = event.target.dataset.kankaName;
    if (suggestedName) {
        replaceMention(`@${suggestedName}`);
    }
    hideAutocomplete();
    if(htmlEditorTextarea) htmlEditorTextarea.focus(); // Return focus
  }

  // Handles clicking on the "Create New" suggestion
  function handleCreateNewSuggestionClick(event) {
    event.preventDefault(); // Prevent blur
    const newFileNameBase = event.target.dataset.newFileNameBase;
    if (newFileNameBase) {
        replaceMention(`@${newFileNameBase}`);
        handleCreateNewEntry(newFileNameBase, GITHUB_DATA_PATH); // Create in root
    }
    hideAutocomplete();
     if(htmlEditorTextarea) htmlEditorTextarea.focus(); // Return focus
  }

  // Replaces the typed @mention query with the selected text
  function replaceMention(replacementText) {
    const textarea = htmlEditorTextarea;
    if (!textarea) return;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart; // Cursor position *before* replacement

    if (currentMentionStartIndex < 0 || currentMentionStartIndex > text.length) {
        console.error("Invalid currentMentionStartIndex:", currentMentionStartIndex);
        return;
    }

    const textBefore = text.substring(0, currentMentionStartIndex);
    // Calculate the end of the mention being replaced based on the query length at trigger time
    const mentionEndIndex = currentMentionStartIndex + 1 + currentAutocompleteQuery.length;
    const textAfter = text.substring(mentionEndIndex);

    textarea.value = textBefore + replacementText + textAfter;
    const newCursorPos = currentMentionStartIndex + replacementText.length;
    textarea.focus();
    // Use setTimeout to ensure focus takes effect before setting selection
    setTimeout(() => {
         textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }


  // --- Gemini AI Functions ---

  // Calls the Gemini API
  async function callGeminiApi(prompt, modelId) {
      if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR_")) { throw new Error("Gemini API Key is missing or invalid."); }
      if (!modelId) { throw new Error("Gemini model ID not provided."); }
      const apiUrl = `${GEMINI_API_BASE_URL}${modelId}:generateContent?key=${GEMINI_API_KEY}`;
      console.log(`Calling Gemini API: ${modelId}`);

      try {
          const response = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          });

          const responseData = await response.json(); // Always try to parse JSON

          if (!response.ok) {
              console.error("Gemini API Error Response:", responseData);
              const errorMsg = responseData?.error?.message || response.statusText || "Unknown API error";
              throw new Error(`Gemini API Error (${response.status}): ${errorMsg}`);
          }

          // Process successful response
           if (responseData.candidates && responseData.candidates.length > 0) {
                const candidate = responseData.candidates[0];
                if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                     console.warn(`Gemini candidate finished with reason: ${candidate.finishReason}`);
                     if (candidate.finishReason === 'SAFETY') {
                          console.error("Gemini response blocked due to safety settings:", candidate.safetyRatings);
                          throw new Error("Gemini response blocked due to safety settings. Check content/API console.");
                     }
                     // Handle other reasons like MAX_TOKENS if needed
                     if(candidate.finishReason === 'MAX_TOKENS') {
                         console.warn("Gemini response truncated due to maximum token limit.");
                     }
                }
                const text = candidate?.content?.parts?.[0]?.text;
                 if (typeof text === 'string') { // Check if text is actually a string
                     return text;
                 } else {
                      console.error("No valid text content found in Gemini candidate:", candidate);
                 }
           }

           // Fallback if no valid candidates or text found
           console.error("No valid text content found in Gemini response:", responseData);
           throw new Error("No text content received from Gemini.");

      } catch (error) {
          console.error("Error calling Gemini API:", error);
          throw error; // Re-throw the specific error
      }
  }

  // Formats HTML using Gemini
  async function formatHtmlWithGemini(htmlContent) {
    showLoading("Asking Gemini to format...");
    const formatModel = GEMINI_MODELS.find(m => m.id && m.id.includes('flash'))?.id || GEMINI_MODELS[0]?.id;
    if (!formatModel) { alert("No suitable Gemini model found for formatting."); hideLoading(); return null;}
    const prompt = `${PROMPT_FORMAT}\n\nHTML:\n${htmlContent}`;
    try {
        const resultText = await callGeminiApi(prompt, formatModel);
        // Extract code block more reliably
        const match = resultText.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
        const formatted = match ? match[1].trim() : resultText.trim(); // Fallback to trimmed text if no block found
        hideLoading();
        return formatted;
    } catch (error) {
        alert(`Gemini formatting failed.\n${error.message}`);
        hideLoading();
        return null;
    }
  }

  // Opens the modal for selecting context for Gemini improvement (Includes validation/logging)
  function openImproveModal() {
    console.log("[IMPROVE MODAL] Opening modal...");
    if (!currentJsonData || !currentFilePath || !fileTree) { console.error("[IMPROVE MODAL] Missing current data or file tree."); return; }
    if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR_")) { alert("Gemini API Key invalid."); return; }
    if (!Array.isArray(GEMINI_MODELS) || GEMINI_MODELS.length === 0) { alert("No Gemini models loaded."); console.error("[IMPROVE MODAL] GEMINI_MODELS empty."); return; }

    const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
    const contentForImprovement = getContentForEditingOrAI(isJournal);

    contextTreeRootUl.innerHTML = "";
    improveModalEntryNameSpan.textContent = currentJsonData.name || currentFilePath.split("/").pop();
    if (isJournal) improveModalEntryNameSpan.textContent += " (Journal - Combined)";
    console.log(`[IMPROVE MODAL] Entry: ${improveModalEntryNameSpan.textContent}`);

    // Populate Model Dropdown
    geminiModelSelect.innerHTML = ''; console.log("[IMPROVE MODAL] Populating AI models:", GEMINI_MODELS);
    let modelsAdded = 0;
    GEMINI_MODELS.forEach(model => {
        if (model && model.id && model.name) {
            const option = document.createElement('option'); option.value = model.id; option.textContent = model.name;
            geminiModelSelect.appendChild(option); modelsAdded++;
        } else { console.warn("[IMPROVE MODAL] Skipping invalid model data:", model); }
    });
    console.log(`[IMPROVE MODAL] Added ${modelsAdded} models to dropdown.`);
    if (modelsAdded === 0) {
        console.error("[IMPROVE MODAL] No valid models found!");
        const option = document.createElement('option'); option.value = ""; option.textContent = "No models available"; option.disabled = true;
        geminiModelSelect.appendChild(option); geminiModelSelect.disabled = true;
        proceedWithImprovementBtn.disabled = true; copyPromptBtn.disabled = true;
    } else {
         const defaultModel = GEMINI_MODELS.find(m => m.id && m.id.includes('flash')) || GEMINI_MODELS[0];
         if (defaultModel && defaultModel.id) { geminiModelSelect.value = defaultModel.id; console.log(`[IMPROVE MODAL] Default model selected: ${defaultModel.id}`); }
         geminiModelSelect.disabled = false; proceedWithImprovementBtn.disabled = false; copyPromptBtn.disabled = false;
    }

    // Build context tree
    const contextTreeWithoutCurrent = filterTree(fileTree, currentFilePath);
    renderContextTree(contextTreeWithoutCurrent, contextTreeRootUl);

    // Update token estimate
    updateTokenEstimate(contentForImprovement);

    improveModal.style.display = "block";
    console.log("[IMPROVE MODAL] Modal displayed.");
  }

  // Recursive helper to filter the current file out of the tree structure
  function filterTree(nodes, excludePath) {
    return nodes
      .filter((node) => node.path !== excludePath) // Exclude the file itself
      .map((node) => {
        if (node.type === "dir" && node.children) {
          const filteredChildren = filterTree(node.children, excludePath);
          return filteredChildren.length > 0 ? { ...node, children: filteredChildren } : null;
        }
        return node; // Keep files (that aren't the excluded one)
      })
      .filter(node => node !== null); // Remove nulls (empty folders)
  }

  // Renders the context selection tree inside the Improve modal
  function renderContextTree(nodes, parentUlElement) {
    parentUlElement.innerHTML = "";
    nodes.forEach((node) => {
      const li = document.createElement("li");
      li.classList.add(node.type === "dir" ? "folder" : "file");
      const nodeContent = document.createElement("div");
      nodeContent.classList.add("context-node-content");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox"; checkbox.checked = false;
      checkbox.id = `context-${node.type}-${node.path.replace(/[^a-zA-Z0-9]/g, "-")}`;
      checkbox.dataset.path = node.path; checkbox.dataset.type = node.type;

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = node.name.replace(/\.json$/i, "");
      label.title = node.path; // Show full path on hover

      if (node.type === "file") {
        // Estimate base tokens for file name/title only
        const baseTokens = estimateTokens(node.kankaName || node.name);
        checkbox.dataset.baseTokens = baseTokens;
        checkbox.addEventListener("change", updateTokenEstimate); // Update estimate on change
        nodeContent.appendChild(checkbox);
        nodeContent.appendChild(label);
        li.appendChild(nodeContent);
      } else { // Folder
        li.classList.add("collapsed"); // Start collapsed
        checkbox.addEventListener("change", (e) => { // Check/uncheck children
          const isChecked = e.target.checked;
          const childCheckboxes = li.querySelectorAll(':scope > ul input[type="checkbox"]');
          childCheckboxes.forEach((cb) => (cb.checked = isChecked));
          updateTokenEstimate(); // Recalculate estimate
        });

        nodeContent.appendChild(checkbox);
        nodeContent.appendChild(label);
        // Click on label/span part to toggle collapse, not checkbox
        nodeContent.addEventListener("click", (e) => {
          if (e.target !== checkbox) { li.classList.toggle("collapsed"); }
        });
        li.appendChild(nodeContent);

        // Recursively render children
        const childrenUl = document.createElement("ul");
        if (node.children && node.children.length > 0) {
          renderContextTree(node.children, childrenUl);
        }
        li.appendChild(childrenUl);
      }
      parentUlElement.appendChild(li);
    });
  }

  // Updates the estimated token count in the Improve modal
  function updateTokenEstimate(baseContent = null) {
      const isJournal = !!(currentJsonData?.entity && Array.isArray(currentJsonData.entity.posts));
      const contentToEstimate = baseContent ?? getContentForEditingOrAI(isJournal);
      let totalEstimate = estimateTokens(contentToEstimate);
      const checkboxes = contextTreeRootUl.querySelectorAll('input[type="checkbox"][data-type="file"]:checked');
      checkboxes.forEach((cb) => {
          totalEstimate += parseInt(cb.dataset.baseTokens || "0", 10);
      });
      contextTokenEstimateSpan.textContent = totalEstimate;
  }

  // Fetches context and calls Gemini to improve HTML
  async function improveHtmlWithGeminiContext() {
    if (!currentJsonData || !currentFilePath) { alert("Current entry data missing."); return; }

    const selectedModelId = geminiModelSelect.value;
    if (!selectedModelId) { alert("Please select a Gemini model."); return; }

    const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
    const originalContent = getContentForEditingOrAI(isJournal); // Get combined or single

    const fileCheckboxes = contextTreeRootUl.querySelectorAll('input[type="checkbox"][data-type="file"]:checked');
    const selectedPaths = Array.from(fileCheckboxes).map(cb => cb.dataset.path);

    if (!originalContent) { alert("Cannot get original content."); return; }

    showModalLoading("Fetching context...");
    let contextText = "";
    let actualContextTokens = 0;
    let failedFetches = 0;

    try { // Wrap fetch operations
        const contextFetchPromises = selectedPaths.map(async (path) => {
            try {
                const result = await fetchFileContent(path, true);
                if (result && result.jsonData) {
                    const entryText = result.jsonData?.entity?.entry ?? result.jsonData?.entry ?? "";
                    const entryName = result.jsonData?.name || path.split("/").pop();
                    const extractedText = `\n\n--- Context Entry: ${entryName} ---\n${entryText}`;
                    contextText += extractedText;
                    actualContextTokens += estimateTokens(extractedText);
                    return true;
                } else { failedFetches++; return false; }
            } catch (e) { console.error(`Failed fetching context for ${path}: ${e}`); failedFetches++; return false; }
        });
        await Promise.all(contextFetchPromises);
    } catch(fetchError) {
         console.error("Error during context fetching for improvement:", fetchError);
         // Continue with whatever context was fetched
    } finally {
         hideModalLoading(); // Hide after fetching context
    }


    if (failedFetches > 0) {
      alert(`${failedFetches} context entries failed to load. Proceeding with available context.`);
    }
    console.log(`Actual Context Tokens fetched: ${actualContextTokens}`);
    contextTokenEstimateSpan.textContent = estimateTokens(originalContent) + actualContextTokens; // Update estimate

    showModalLoading(`Asking ${selectedModelId} to improve...`);

    const fullPrompt = `${PROMPT_IMPROVE_BASE}\n${PROMPT_IMPROVE_CAMPAIGN}`
        + `${PROMPT_IMPROVE_MAIN_HEADER}\n${originalContent}`
        + `${PROMPT_IMPROVE_CONTEXT_HEADER}${contextText}${PROMPT_IMPROVE_CONTEXT_FOOTER}`;

    try {
        const resultText = await callGeminiApi(fullPrompt, selectedModelId);
        // Extract code block more reliably
        const match = resultText.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
        const improvedHtml = match ? match[1].trim() : resultText.trim(); // Fallback to trimmed text

        // Update editor and switch view
        htmlEditorTextarea.value = improvedHtml;
        editingFileNameH2.textContent = `Editing Improved: ${currentJsonData?.name || currentFilePath.split("/").pop()}`;
        if (isJournal) editingFileNameH2.textContent += " (Journal - Combined View)";
        improveModal.style.display = "none"; // Close modal
        switchToEditMode();
        alert("Gemini improvement complete. Review & save.");

    } catch (error) {
        console.error("Gemini improvement error:", error);
        alert(`Gemini improvement failed.\n${error.message}`);
    } finally {
        hideModalLoading(); // Hide loading indicator
    }
  }

  // Fetches context, builds the prompt, and copies it to the clipboard
  async function handleCopyPromptClick() {
      console.log("[COPY PROMPT] Button clicked.");
      if (!currentJsonData || !currentFilePath) { alert("Current entry data missing."); console.error("[COPY PROMPT] Missing current entry data."); return; }
      const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
      const originalContent = getContentForEditingOrAI(isJournal);

      const fileCheckboxes = contextTreeRootUl.querySelectorAll('input[type="checkbox"][data-type="file"]:checked');
      const selectedPaths = Array.from(fileCheckboxes).map(cb => cb.dataset.path);
      console.log(`[COPY PROMPT] Selected context paths: ${selectedPaths.length}`);

      if (!originalContent && selectedPaths.length === 0) { alert("No content to improve and no context selected."); console.warn("[COPY PROMPT] No base content or context."); return; }

      showModalLoading("Fetching context for prompt...");
      let contextText = "";
      let failedFetches = 0;

      try {
          const contextFetchPromises = selectedPaths.map(async (path) => {
              try {
                  const result = await fetchFileContent(path, true);
                  if (result && result.jsonData) {
                      const entryText = result.jsonData?.entity?.entry ?? result.jsonData?.entry ?? "";
                      const entryName = result.jsonData?.name || path.split("/").pop();
                      contextText += `\n\n--- Context Entry: ${entryName} ---\n${entryText}`;
                      return true;
                  } else { failedFetches++; return false; }
              } catch (e) { console.error(`[COPY PROMPT] Failed fetching context for ${path}: ${e}`); failedFetches++; return false; }
          });
          await Promise.all(contextFetchPromises);
      } catch (fetchError) {
          console.error("[COPY PROMPT] Error during context fetching:", fetchError);
      } finally {
          hideModalLoading();
      }

      if (failedFetches > 0) { alert(`${failedFetches} context entries failed to load. Prompt will be copied with available context.`); }

      const fullPrompt = `${PROMPT_IMPROVE_BASE}\n${PROMPT_IMPROVE_CAMPAIGN}`
          + `${PROMPT_IMPROVE_MAIN_HEADER}\n${originalContent || '(No base content provided)'}`
          + `${PROMPT_IMPROVE_CONTEXT_HEADER}${contextText}${PROMPT_IMPROVE_CONTEXT_FOOTER}`;
      console.log(`[COPY PROMPT] Final prompt length: ${fullPrompt.length}`);

      try {
          if (!navigator.clipboard || !navigator.clipboard.writeText) { throw new Error("Clipboard API not available in this context (requires HTTPS or localhost)."); }
          await navigator.clipboard.writeText(fullPrompt);
          console.log("[COPY PROMPT] Prompt successfully copied to clipboard.");
          alert("Full prompt copied to clipboard!");
      } catch (err) {
          console.error('[COPY PROMPT] Failed to copy prompt: ', err);
          alert(`Failed to copy prompt to clipboard. Error: ${err.message}\n\nYou might need to copy it manually from the browser console.`);
          console.log("--- PROMPT FOR MANUAL COPY ---:\n", fullPrompt);
      }
  }


  // --- PDF Generation using jsPDF direct HTML rendering with await ---
  async function generatePdf() {
    if (!currentFilePath || !currentJsonData) { alert("Please load an entry first."); return; }
    if (typeof window.jspdf === 'undefined') { alert("Error: jsPDF library not found."); return; }
    const { jsPDF } = window.jspdf;

    showLoading("Generating PDF...");
    const entryName = currentJsonData.name || currentFilePath.split('/').pop().replace(/\.json$/, '');
    const filename = `${entryName}.pdf`;
    let contentHtml = "";
    const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));

    if (isJournal) {
        console.log("Generating PDF content for Journal");
        const sortedPosts = (currentJsonData.entity.posts || []).sort((a, b) => (a.position || 0) - (b.position || 0));
        sortedPosts.forEach(post => {
            contentHtml += `<h3>${post.name || 'Untitled Post'}</h3>`;
            contentHtml += post.entry || '<p><em>(Empty post)</em></p>';
            contentHtml += '<hr style="border: none; border-top: 1px solid #eee; margin: 4mm 0;">';
        });
         if (!contentHtml) contentHtml = '<p><em>Journal has no posts.</em></p>';
    } else {
        console.log("Generating PDF content for Standard Entry");
        contentHtml = currentJsonData?.entity?.entry ?? currentJsonData?.entry ?? "<p><em>(Entry content is empty)</em></p>";
    }

    // --- Fetch and Convert Images to Data URLs ---
    const imageUUIDs = currentJsonData.entity?.image_uuids || [];
    const imageDataUrls = [];
    let imageFetchErrors = 0;
    console.log(`Found ${imageUUIDs.length} images to process for PDF.`);
    if (Array.isArray(imageUUIDs) && imageUUIDs.length > 0) {
         showLoading(`Loading ${imageUUIDs.length} images for PDF...`);
         const imagePromises = imageUUIDs.map(async (uuid) => {
            const imageData = imageFileMap[uuid];
            if (imageData && imageData.download_url && imageData.sha) {
                try {
                    const cacheBustedUrl = `${imageData.download_url}?v=${imageData.sha}`;
                    const response = await fetch(cacheBustedUrl);
                    if (!response.ok) throw new Error(`Failed to fetch image ${imageData.name}: ${response.statusText}`);
                    const blob = await response.blob();
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve({ uuid, dataUrl: reader.result });
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error(`Error fetching/converting image ${uuid} (${imageData.name}):`, error);
                    imageFetchErrors++;
                    return null; // Indicate failure for this image
                }
            } else {
                console.warn(`Skipping image ${uuid} for PDF: Missing data.`);
                imageFetchErrors++;
                return null;
            }
        });
        const results = await Promise.all(imagePromises);
        results.forEach(result => { if (result && result.dataUrl) { imageDataUrls.push(result.dataUrl); } });
        console.log(`Successfully converted ${imageDataUrls.length} images to Data URLs for PDF.`);
        if (imageFetchErrors > 0) { alert(`Warning: Failed to load ${imageFetchErrors} image(s) for the PDF.`); }
    }
    // --- End Image Fetching ---

    showLoading("Preparing PDF structure...");

    const pdfHtmlString = `
        <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>PDF Source - ${entryName}</title>
        <style>/* ... (Keep your existing PDF styles) ... */</style></head>
        <body><h1>${entryName}</h1>${contentHtml}
            ${imageDataUrls.length > 0 ? `<div class="image-section"><h2>Images</h2>
            ${imageDataUrls.map(dataUrl => `<img class="pdf-image" src="${dataUrl}" alt="Entry Image">`).join('')}</div>` : ''}
        </body></html>`;

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const baseFontSizePt = 8; pdf.setFontSize(baseFontSizePt);
    const margins = { top: 25, bottom: 25, left: 25, right: 25 };
    const widthInPt = (210 - margins.left - margins.right) * 2.8346;
    const pdfOptions = { margin: [margins.top, margins.left, margins.bottom, margins.right], autoPaging: 'text', width: widthInPt, windowWidth: widthInPt, x: margins.left, y: margins.top, html2canvas: { scale: 2, useCORS: true, logging: false }, dompurify: { USE_PROFILES: { html: true } } }; // Enabled dompurify just in case

    // Dummy DOMPurify if needed
    if (typeof window.DOMPurify === 'undefined') { window.DOMPurify = { sanitize: (html) => { console.log("Dummy DOMPurify: Bypassing sanitization."); return html; } }; }

    try {
         showLoading("Rendering HTML to PDF...");
         const tempIframe = document.createElement('iframe');
         tempIframe.style.position = 'absolute'; tempIframe.style.left = '-9999px'; tempIframe.style.border = 'none';
         tempIframe.style.width = `${210 - margins.left - margins.right}mm`;
         document.body.appendChild(tempIframe);
         tempIframe.contentWindow.document.open(); tempIframe.contentWindow.document.write(pdfHtmlString); tempIframe.contentWindow.document.close();
         await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render
         const elementToRender = tempIframe.contentWindow.document.body;
         if (!elementToRender) { throw new Error("Could not find body element in iframe."); }
         await pdf.html(elementToRender, pdfOptions);
         console.log("pdf.html() processing finished.");
         showLoading("Saving PDF...");
         pdf.save(filename); console.log("PDF save initiated.");
         document.body.removeChild(tempIframe);
    } catch (error) {
         console.error("Error during PDF generation with pdf.html():", error);
         alert(`PDF Generation Error: ${error.message}\nCheck console for details.`);
         const tempIframeOnError = document.querySelector('iframe[style*="-9999px"]');
         if (tempIframeOnError) document.body.removeChild(tempIframeOnError);
    } finally {
         hideLoading();
    }
  }


  // --- Resizable Sidebar ---
  function makeResizable(element, resizerElement) {
    let isResizing = false;
    let startX, startWidth;
    if (!element || !resizerElement) return; // Add null check

    resizerElement.addEventListener("mousedown", (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = parseInt(window.getComputedStyle(element).width, 10);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    });

    function handleMouseMove(e) {
      if (!isResizing) return;
      const deltaX = e.clientX - startX;
      let newWidth = startWidth + deltaX;
      const minW = 200;
      const maxW = window.innerWidth - 150; // Leave space for main content + resizer
      newWidth = Math.max(minW, Math.min(newWidth, maxW));
      element.style.width = `${newWidth}px`;
    }

    function handleMouseUp() {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      }
    }
  }


  // --- Event Listeners Setup ---
  function setupEventListeners() {
      console.log("[SETUP] Setting up event listeners...");
      if(refreshFileListBtn) refreshFileListBtn.addEventListener("click", fetchFileList);
      if(createNewFileBtn) createNewFileBtn.addEventListener("click", () => {
          const newFileNameBase = prompt("Enter name for new entry (creates file in root):");
          if (newFileNameBase && newFileNameBase.trim()) { handleCreateNewEntry(newFileNameBase.trim(), GITHUB_DATA_PATH); }
      });
      if(editBtn) editBtn.addEventListener("click", () => {
          if (!currentJsonData || !currentFilePath) return;
          const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
          const contentToEdit = getContentForEditingOrAI(isJournal);
          htmlEditorTextarea.value = contentToEdit; htmlEditorTextarea.disabled = false;
          editingFileNameH2.textContent = `Editing: ${currentJsonData?.name || currentFilePath.split("/").pop()}`;
          if (isJournal) editingFileNameH2.textContent += " (Journal - Combined View)";
          switchToEditMode();
      });
      if(deleteEntryBtn) deleteEntryBtn.addEventListener("click", handleDeleteEntryClick);
      if(generatePdfBtn) generatePdfBtn.addEventListener("click", generatePdf);
      if(formatBtn) formatBtn.addEventListener("click", async () => {
          if (!currentFilePath || !currentJsonData) { alert("Load an entry first."); return; }
          const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
          const originalHtml = getContentForEditingOrAI(isJournal);
          if (!originalHtml) { alert("Cannot get content to format."); return; }
          const formattedHtml = await formatHtmlWithGemini(originalHtml);
          if (formattedHtml !== null) {
              htmlEditorTextarea.value = formattedHtml;
              editingFileNameH2.textContent = `Editing Formatted: ${currentJsonData?.name || currentFilePath.split("/").pop()}`;
              if (isJournal) editingFileNameH2.textContent += " (Journal - Combined View)";
              switchToEditMode(); alert("Gemini formatting complete. Review & save.");
          }
      });
      if(improveBtn) improveBtn.addEventListener("click", openImproveModal);
      if(saveBtn) saveBtn.addEventListener("click", async () => {
            if (!currentJsonData || !currentFilePath || !currentFileSha) { alert("No file loaded/SHA missing."); return; }
            const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
            const editedContent = htmlEditorTextarea.value;
            const modifiedJsonData = JSON.parse(JSON.stringify(currentJsonData));
            const now = new Date().toISOString().replace("Z", ".000000Z");
            modifiedJsonData.updated_at = now; if (modifiedJsonData.entity) { modifiedJsonData.entity.updated_at = now; }
            if (isJournal) {
                console.log("Saving combined content to Journal's first post");
                if (!modifiedJsonData.entity) modifiedJsonData.entity = {};
                if (!Array.isArray(modifiedJsonData.entity.posts)) modifiedJsonData.entity.posts = [];
                if (modifiedJsonData.entity.posts.length === 0) {
                    console.log("Journal was empty, creating first post.");
                    modifiedJsonData.entity.posts.push({ id: null, name: "Combined Content", entry: editedContent, created_at: now, updated_at: now, is_private: modifiedJsonData.is_private || 0, entity_id: modifiedJsonData.entity.id, created_by: modifiedJsonData.entity.created_by, visibility_id: 1, is_pinned: 0, position: 1, settings: null });
                } else { modifiedJsonData.entity.posts[0].entry = editedContent; modifiedJsonData.entity.posts[0].updated_at = now; }
            } else {
                console.log("Saving content to standard entry");
                if (modifiedJsonData?.entity && typeof modifiedJsonData.entity.entry !== "undefined") { modifiedJsonData.entity.entry = editedContent; }
                else if (typeof modifiedJsonData.entry !== "undefined") { modifiedJsonData.entry = editedContent; }
                else { modifiedJsonData.entry = editedContent; }
            }
            const updatedJsonString = JSON.stringify(modifiedJsonData, null, 2);
            const commitMessage = `Update entry: ${modifiedJsonData.name || currentFilePath.split("/").pop()}`;
            const commitResult = await commitFileToGitHub(currentFilePath, updatedJsonString, commitMessage, currentFileSha);
            if (commitResult) {
                currentFileSha = commitResult.sha; currentJsonData = modifiedJsonData; contextCache[currentFilePath] = modifiedJsonData;
                if (isJournal) {
                    const separator = "\n<hr />\n";
                    const updatedConcatenatedHtml = (modifiedJsonData.entity.posts || []).map(p => p.entry || '').join(separator);
                    htmlEditorTextarea.dataset.concatenatedJournalHtml = updatedConcatenatedHtml; renderJournalContent(modifiedJsonData.entity.posts || []);
                } else { htmlEditorTextarea.dataset.rawHtmlEntry = editedContent; renderHtmlEntry(editedContent); }
                const fileIndex = flatJsonData.findIndex(item => item.path === currentFilePath);
                if (fileIndex !== -1) { flatJsonData[fileIndex].sha = commitResult.sha; /* update name? */ }
                switchToViewMode(); alert(`Saved '${modifiedJsonData.name}' to GitHub.`);
            }
      });
      if(cancelBtn) cancelBtn.addEventListener("click", () => {
          if (!currentJsonData) { switchToViewMode(); return; }
          const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
          if (isJournal) { renderJournalContent(currentJsonData.entity.posts || []); }
          else { const rawHtmlEntry = htmlEditorTextarea.dataset.rawHtmlEntry || ""; renderHtmlEntry(rawHtmlEntry); }
          switchToViewMode();
      });
      if(addImageBtn) addImageBtn.addEventListener("click", handleAddImageClick);
      if(imageUploadInput) imageUploadInput.addEventListener("change", handleImageUploadInputChange);

      // Improve Modal Listeners
      if(closeImproveModalBtn) closeImproveModalBtn.onclick = () => improveModal.style.display = "none";
      if(cancelImprovementBtn) cancelImprovementBtn.onclick = () => improveModal.style.display = "none";
      if(selectAllContextBtn) selectAllContextBtn.onclick = () => { contextTreeRootUl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true); updateTokenEstimate(); };
      if(deselectAllContextBtn) deselectAllContextBtn.onclick = () => { contextTreeRootUl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false); updateTokenEstimate(); };
      if(proceedWithImprovementBtn) proceedWithImprovementBtn.onclick = improveHtmlWithGeminiContext;
      if(copyPromptBtn) { copyPromptBtn.onclick = handleCopyPromptClick; console.log("[SETUP] Attached listener to copyPromptBtn."); }
      else { console.error("[SETUP] copyPromptBtn element not found!"); }

      // Image Lightbox Listeners
      if(closeLightboxBtn) closeLightboxBtn.onclick = closeImageLightbox;
      if(imageLightboxModal) imageLightboxModal.onclick = (event) => { if (event.target === imageLightboxModal) { closeImageLightbox(); } };

      // Editor Autocomplete Listeners
      if(htmlEditorTextarea) {
          htmlEditorTextarea.addEventListener("input", handleEditorInput);
          htmlEditorTextarea.addEventListener("keydown", handleEditorKeyDown);
          htmlEditorTextarea.addEventListener("blur", () => setTimeout(hideAutocomplete, 150)); // Delay hide on blur
      }

      // Global click listener (Optional: Add logic if needed for closing popups/modals on outside clicks)
      // window.addEventListener('click', (event) => { /* ... */ });

      console.log("[SETUP] Event listener setup complete.");
  }

  // --- Start Application ---
  initialize();

}); // End DOMContentLoaded