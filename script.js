document.addEventListener("DOMContentLoaded", async () => {
  let appConfig = null;

  // --- DOM Element References ---
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
  const renameEntryBtn = document.getElementById("renameEntryBtn"); // Added
  const generatePdfBtn = document.getElementById("generatePdfBtn");
  const formatBtn = document.getElementById("formatBtn");
  const improveBtn = document.getElementById("improveBtn");
  const saveBtn = document.getElementById("saveBtn"); // Editor Save
  const cancelBtn = document.getElementById("cancelBtn"); // Editor Cancel
  const createNewFileBtn = document.getElementById("createNewFileBtn"); // Root file
  const createNewFolderBtn = document.getElementById("createNewFolderBtn"); // Root folder - Added
      

    
  const reorganizeEntriesBtn = document.getElementById('reorganizeEntriesBtn');
  const reorganizeModal = document.getElementById('reorganizeModal');
  const closeReorganizeModalBtn = document.getElementById('closeReorganizeModalBtn');
  const cancelReorganizationBtn = document.getElementById('cancelReorganizationBtn');
  const reorganizeTargetFolderSelectorDiv = document.getElementById('reorganizeTargetFolderSelector');
  const selectedTargetFolderPathDisplaySpan = document.getElementById('selectedTargetFolderPathDisplay');
  const reorganizeSourceItemsSelectorDiv = document.getElementById('reorganizeSourceItemsSelector');
  const selectAllReorganizeBtn = document.getElementById('selectAllReorganizeBtn');
  const deselectAllReorganizeBtn = document.getElementById('deselectAllReorganizeBtn');
  const proceedWithReorganizationBtn = document.getElementById('proceedWithReorganizationBtn');
  const reorganizeModalLoadingIndicator = document.getElementById('reorganizeModalLoadingIndicator');
  const reorganizeStatusMessage = document.getElementById('reorganizeStatusMessage');

  const fileCountSpan = document.getElementById("fileCount");
  const loadingIndicator = document.getElementById("loadingIndicator"); // Main loading
  const repoNameSpan = document.getElementById("repoName");
  const repoPathSpan = document.getElementById("repoPath");
  const refreshFileListBtn = document.getElementById("refreshFileListBtn");

  const imagePreviewSidebar = document.getElementById("imagePreviewSidebar");
  const imageListContainer = document.getElementById("imageListContainer");
  const noImageTextElement = document.getElementById("noImageText");
  const addImageBtn = document.getElementById("addImageBtn");
  const imageUploadInput = document.getElementById("imageUploadInput");

  const apiKeyModal = document.getElementById('apiKeyModal');
  const githubTokenInput = document.getElementById('githubTokenInput');
  const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
  const saveApiKeysBtn = document.getElementById('saveApiKeysBtn'); // Modal Save
  const clearKeysBtn = document.getElementById('clearKeysBtn');

  const improveModal = document.getElementById("improveModal");
  const closeImproveModalBtnElem = document.getElementById("closeImproveModalBtn"); // Renamed to avoid conflict
  const contextSelectionListDiv = document.getElementById("contextSelectionList"); // Used?
  const contextTreeRootUl = document.getElementById("contextTreeRoot");
  const selectAllContextBtn = document.getElementById("selectAllContextBtn");
  const deselectAllContextBtn = document.getElementById("deselectAllContextBtn");
  const contextTokenEstimateSpan = document.getElementById("contextTokenEstimate");
  const proceedWithImprovementBtn = document.getElementById("proceedWithImprovementBtn");
  const cancelImprovementBtn = document.getElementById("cancelImprovementBtn"); // Modal Cancel
  const copyPromptBtn = document.getElementById("copyPromptBtn");
  const improveModalEntryNameSpan = document.getElementById("improveModalEntryName");
  const modalLoadingIndicator = document.getElementById("modalLoadingIndicator"); // Modal loading

  const geminiModelSelect = document.getElementById("geminiModelSelect");
  const imageLightboxModal = document.getElementById("imageLightboxModal");
  const lightboxImage = document.getElementById("lightboxImage");
  const closeLightboxBtn = document.getElementById("closeLightboxBtn");


  // --- State Variables ---
  let allFetchedFiles = [];
  let flatJsonData = [];
  let imageFileMap = {};
  let fileTree = [];
  let currentFilePath = null;
  let currentFileSha = null;
  let currentJsonData = null;
  let activeLinkElement = null;
  let contextCache = {};
  let selectedTargetFolderForReorg = null; // Added

  // --- Constants (populated from config and user input) ---
  let GITHUB_USERNAME, GITHUB_REPO, GITHUB_DATA_PATH, GITHUB_BRANCH, GITHUB_TOKEN, GALLERY_FOLDER;
  let GEMINI_API_KEY, GEMINI_API_BASE_URL, GEMINI_MODELS = [];
  let API_BASE_URL, RAW_CONTENT_BASE;
  let PROMPT_FORMAT, PROMPT_IMPROVE_BASE, PROMPT_IMPROVE_CAMPAIGN, PROMPT_IMPROVE_CONTEXT_HEADER, PROMPT_IMPROVE_CONTEXT_FOOTER, PROMPT_IMPROVE_MAIN_HEADER;
  const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

  // --- CORE CONTROLS SETUP (API Modal, Clear Keys) ---
  function setupCoreControls() {
    console.log("[SETUP_CORE] Setting up core controls...");
    if (saveApiKeysBtn) {
      saveApiKeysBtn.addEventListener('click', async () => {
        const ghToken = githubTokenInput.value.trim();
        const gemKey = geminiApiKeyInput.value.trim();

        if (!ghToken) {
          alert("GitHub Token is required.");
          return;
        }
        sessionStorage.setItem('kankaEditor_githubToken', ghToken);
        GITHUB_TOKEN = ghToken;

        if (gemKey) {
          sessionStorage.setItem('kankaEditor_geminiApiKey', gemKey);
          GEMINI_API_KEY = gemKey;
        } else {
          sessionStorage.removeItem('kankaEditor_geminiApiKey');
          GEMINI_API_KEY = null;
        }
        console.log("[KEYS] API Keys saved to sessionStorage.");
        hideApiKeyModal();
        await proceedWithAppInitialization();
      });
    } else { console.warn("Save API Keys button (saveApiKeysBtn) not found."); }

  if (clearKeysBtn) { // This check is good
        console.log("[SETUP_CORE] clearKeysBtn found, attaching listener."); // DEBUG
        clearKeysBtn.addEventListener('click', () => {
            console.log("[ClearKeys_Handler] Clear API Keys button was clicked!"); // DEBUG - VERY FIRST LINE
            if (confirm("Are you sure you want to clear your API keys from this session? You will be prompted for them again.")) {
                console.log("[ClearKeys_Handler] User confirmed. Clearing session storage.");
                sessionStorage.removeItem('kankaEditor_githubToken');
                sessionStorage.removeItem('kankaEditor_geminiApiKey');
                GITHUB_TOKEN = null;
                GEMINI_API_KEY = null;
                if (githubTokenInput) githubTokenInput.value = "";
                if (geminiApiKeyInput) geminiApiKeyInput.value = "";
                alert("API Keys cleared from this session. The application will now reload.");
                location.reload();
            } else {
                console.log("[ClearKeys_Handler] User cancelled clearing.");
            }
        });
    } else {
        console.warn("[SETUP_CORE] Clear API Keys button (clearKeysBtn) NOT found during setup."); // DEBUG
    }
  }

  // --- APP FEATURE EVENT LISTENERS SETUP ---
  function setupAppEventListeners() {
    console.log("[SETUP_APP] Setting up application-specific event listeners...");

    if (refreshFileListBtn) {
      refreshFileListBtn.addEventListener("click", async () => {
        if (!GITHUB_TOKEN) {
          alert("API Keys are required to refresh the list. Please provide them.");
          showApiKeyModal();
          return;
        }
        await fetchFileList();
      });
    }

    if (createNewFileBtn) {
      createNewFileBtn.addEventListener("click", () => {
        if (!GITHUB_TOKEN) { showApiKeyModal(); return; }
        const newFileNameBase = prompt("Enter name for new entry (creates file in root of data path):");
        if (newFileNameBase && newFileNameBase.trim()) {
          handleCreateNewEntry(newFileNameBase.trim(), GITHUB_DATA_PATH);
        }
      });
    }

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        if (!currentJsonData || !currentFilePath) return;
        const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
        const contentToEdit = getContentForEditingOrAI(isJournal);
        htmlEditorTextarea.value = contentToEdit;
        htmlEditorTextarea.disabled = false;
        editingFileNameH2.textContent = `Editing: ${currentJsonData?.name || currentFilePath.split("/").pop()}`;
        if (isJournal) editingFileNameH2.textContent += " (Journal - Combined View)";
        switchToEditMode();
      });
    }

    if (deleteEntryBtn) {
      deleteEntryBtn.addEventListener("click", handleDeleteEntryClick);
    }

    if (generatePdfBtn) {
      generatePdfBtn.addEventListener("click", generatePdf);
    }

    if (formatBtn) {
      formatBtn.addEventListener("click", async () => {
        if (!GEMINI_API_KEY) {
          alert("Gemini API Key is required for AI formatting. Please provide it.");
          return;
        }
        if (!currentFilePath || !currentJsonData) {
          alert("Load an entry first.");
          return;
        }
        const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
        const originalHtml = getContentForEditingOrAI(isJournal);
        if (originalHtml === null || typeof originalHtml === 'undefined') {
          alert("Cannot get content to format. Content might be empty or not loaded.");
          return;
        }
        const formattedHtml = await formatHtmlWithGemini(originalHtml);
        if (formattedHtml !== null) {
          htmlEditorTextarea.value = formattedHtml;
          editingFileNameH2.textContent = `Editing Formatted: ${currentJsonData?.name || currentFilePath.split("/").pop()}`;
          if (isJournal) editingFileNameH2.textContent += " (Journal - Combined View)";
          switchToEditMode();
          alert("Gemini formatting complete. Review & save.");
        }
      });
    }

    if (improveBtn) {
      improveBtn.addEventListener("click", () => {
        if (!GEMINI_API_KEY) {
          alert("Gemini API Key is required for AI improvement. Please provide it.");
          return;
        }
        openImproveModal();
      });
    }

    if (saveBtn) { // Editor Save
      saveBtn.addEventListener("click", async () => {
        if (!currentJsonData || !currentFilePath || !currentFileSha) {
          alert("No file loaded/SHA missing. Cannot save.");
          return;
        }
        const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
        const editedContent = htmlEditorTextarea.value;
        const modifiedJsonData = JSON.parse(JSON.stringify(currentJsonData));
        const now = new Date().toISOString().replace("Z", ".000000Z");
        modifiedJsonData.updated_at = now;
        if (modifiedJsonData.entity) modifiedJsonData.entity.updated_at = now;

        if (isJournal) {
          if (!modifiedJsonData.entity) modifiedJsonData.entity = {};
          if (!Array.isArray(modifiedJsonData.entity.posts)) modifiedJsonData.entity.posts = [];
          if (modifiedJsonData.entity.posts.length === 0) {
            modifiedJsonData.entity.posts.push({
              id: null, name: "Combined Content", entry: editedContent, created_at: now, updated_at: now,
              is_private: modifiedJsonData.is_private || 0, entity_id: modifiedJsonData.entity.id,
              created_by: modifiedJsonData.entity.created_by, visibility_id: 1, is_pinned: 0, position: 1, settings: null,
            });
          } else {
            modifiedJsonData.entity.posts[0].entry = editedContent;
            modifiedJsonData.entity.posts[0].updated_at = now;
          }
        } else {
          if (modifiedJsonData?.entity && typeof modifiedJsonData.entity.entry !== "undefined") {
            modifiedJsonData.entity.entry = editedContent;
          } else if (typeof modifiedJsonData.entry !== "undefined") {
            modifiedJsonData.entry = editedContent;
          } else {
            modifiedJsonData.entry = editedContent;
          }
        }
        const updatedJsonString = JSON.stringify(modifiedJsonData, null, 2);
        const commitMessage = `Update entry: ${modifiedJsonData.name || currentFilePath.split("/").pop()}`;
        const commitResult = await commitFileToGitHub(currentFilePath, updatedJsonString, commitMessage, currentFileSha);
        if (commitResult) {
          currentFileSha = commitResult.sha;
          currentJsonData = modifiedJsonData;
          contextCache[currentFilePath] = modifiedJsonData;
          if (isJournal) {
            const separator = "\n<hr />\n";
            const updatedConcatenatedHtml = (modifiedJsonData.entity.posts || []).map((p) => p.entry || "").join(separator);
            htmlEditorTextarea.dataset.concatenatedJournalHtml = updatedConcatenatedHtml;
            renderJournalContent(modifiedJsonData.entity.posts || []);
          } else {
            htmlEditorTextarea.dataset.rawHtmlEntry = editedContent;
            renderHtmlEntry(editedContent);
          }
          const fileIndex = flatJsonData.findIndex((item) => item.path === currentFilePath);
          if (fileIndex !== -1) flatJsonData[fileIndex].sha = commitResult.sha;
          switchToViewMode();
          alert(`Saved '${modifiedJsonData.name}' to GitHub.`);
        }
      });
    }

    if (cancelBtn) { // Editor Cancel
      cancelBtn.addEventListener("click", () => {
        if (!currentJsonData) { switchToViewMode(); return; }
        const isJournal = !!(currentJsonData.entity && Array.isArray(currentJsonData.entity.posts));
        if (isJournal) {
          renderJournalContent(currentJsonData.entity.posts || []);
        } else {
          const rawHtmlEntry = htmlEditorTextarea.dataset.rawHtmlEntry || currentJsonData?.entity?.entry || currentJsonData?.entry || "";
          renderHtmlEntry(rawHtmlEntry);
        }
        switchToViewMode();
      });
    }

    if (addImageBtn) addImageBtn.addEventListener("click", handleAddImageClick);
    if (imageUploadInput) imageUploadInput.addEventListener("change", handleImageUploadInputChange);

    if (closeImproveModalBtnElem) closeImproveModalBtnElem.onclick = () => { if (improveModal) improveModal.style.display = "none"; };
    if (cancelImprovementBtn) cancelImprovementBtn.onclick = () => { if (improveModal) improveModal.style.display = "none"; };
    
    if (selectAllContextBtn) {
      selectAllContextBtn.onclick = () => {
        if (contextTreeRootUl) contextTreeRootUl.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = true));
        updateTokenEstimate();
      };
    }
    if (deselectAllContextBtn) {
      deselectAllContextBtn.onclick = () => {
        if (contextTreeRootUl) contextTreeRootUl.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));
        updateTokenEstimate();
      };
    }
    if (proceedWithImprovementBtn) proceedWithImprovementBtn.onclick = improveHtmlWithGeminiContext;
    if (copyPromptBtn) copyPromptBtn.onclick = handleCopyPromptClick;

    if (closeLightboxBtn) closeLightboxBtn.onclick = closeImageLightbox;
    if (imageLightboxModal) imageLightboxModal.onclick = (event) => { if (event.target === imageLightboxModal) closeImageLightbox(); };

    // Calls to setup more complex listener groups
    setupCreateNewFolderListener();
    setupRenameEntryListener();
    setupReorganizeModalListeners();

    console.log("[SETUP_APP] Application-specific event listeners setup complete.");
  }

  // --- INITIALIZATION FLOW ---
  async function initialize() {
    console.log("[INIT] Starting initialization...");
    setupCoreControls();

    try {
      await loadConfig();
      console.log("[INIT] Base config loaded.");

      GITHUB_TOKEN = sessionStorage.getItem('kankaEditor_githubToken');
      GEMINI_API_KEY = sessionStorage.getItem('kankaEditor_geminiApiKey');

      if (GITHUB_TOKEN) {
        console.log("[INIT] GitHub Token found in sessionStorage.");
        await proceedWithAppInitialization();
      } else {
        console.log("[INIT] GitHub Token not found. Showing API key input modal.");
        if (geminiApiKeyInput && GEMINI_API_KEY) geminiApiKeyInput.value = GEMINI_API_KEY;
        showApiKeyModal();
      }
    } catch (error) {
      console.error("[INIT] Initialization failed:", error);
      showError(`Initialization failed: ${error.message}.`);
      disableAppControls();
      if(clearKeysBtn) clearKeysBtn.disabled = false; // Ensure clear keys is always usable
    }
  }

  async function proceedWithAppInitialization() {
    console.log("[PROCEED_INIT] Proceeding with app initialization...");
    if (!GITHUB_TOKEN || GITHUB_TOKEN.length < 20) {
      showError("ERROR: GitHub Token is missing or invalid.");
      sessionStorage.removeItem('kankaEditor_githubToken');
      showApiKeyModal();
      return;
    }
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
      console.warn("[INIT] Gemini API Key missing or invalid. AI features will be disabled or prompt for key.");
    }

    API_BASE_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents`;
    RAW_CONTENT_BASE = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${GITHUB_BRANCH}`;
    if (repoNameSpan) repoNameSpan.textContent = `${GITHUB_USERNAME}/${GITHUB_REPO}`;
    if (repoPathSpan) repoPathSpan.textContent = `/${GITHUB_DATA_PATH}`;

    setupAppEventListeners();
    if (sidebar && resizer) makeResizable(sidebar, resizer);

    console.log("[PROCEED_INIT] Fetching initial file list...");
    await fetchFileList(); // This will also call hideLoading which re-evaluates button states
    console.log("[PROCEED_INIT] Application initialization complete.");
    if (clearKeysBtn) clearKeysBtn.disabled = false;
  }

  // --- Configuration Loading ---
  async function loadConfig() {
    try {
      console.log("[CONFIG] Fetching config.json...");
      const response = await fetch("config.json");
      if (!response.ok) throw new Error(`Failed to fetch config.json: ${response.status} ${response.statusText}`);
      appConfig = await response.json();
      if (!appConfig.github || !appConfig.gemini || !appConfig.prompts) throw new Error("config.json is missing required top-level keys.");
      console.log("[CONFIG] config.json loaded successfully.");

      GITHUB_USERNAME = appConfig.github.USERNAME;
      GITHUB_REPO = appConfig.github.REPO;
      GITHUB_DATA_PATH = appConfig.github.DATA_PATH;
      GITHUB_BRANCH = appConfig.github.BRANCH;
      GALLERY_FOLDER = appConfig.github.GALLERY_FOLDER;

      GEMINI_API_BASE_URL = appConfig.gemini.API_BASE_URL;
      GEMINI_MODELS = Array.isArray(appConfig.gemini.MODELS) ? appConfig.gemini.MODELS : [];
      
      PROMPT_FORMAT = appConfig.prompts.format;
      PROMPT_IMPROVE_BASE = appConfig.prompts.improve_base;
      PROMPT_IMPROVE_CAMPAIGN = appConfig.prompts.improve_campaign_context;
      PROMPT_IMPROVE_CONTEXT_HEADER = appConfig.prompts.improve_context_header;
      PROMPT_IMPROVE_CONTEXT_FOOTER = appConfig.prompts.improve_context_footer;
      PROMPT_IMPROVE_MAIN_HEADER = appConfig.prompts.improve_main_content_header;
    } catch (error) {
      console.error("[CONFIG] Error loading or parsing config.json:", error);
      throw error;
    }
  }

  // --- API Key Modal Logic ---
  function showApiKeyModal() {
    if (apiKeyModal) apiKeyModal.style.display = 'block';
    disableAppControls();
    if (refreshFileListBtn) refreshFileListBtn.disabled = true; // Specifically ensure this one
    if (clearKeysBtn) clearKeysBtn.disabled = false; // Ensure clear keys is enabled
    if (githubTokenInput) githubTokenInput.disabled = false;
    if (geminiApiKeyInput) geminiApiKeyInput.disabled = false;
    if (saveApiKeysBtn) saveApiKeysBtn.disabled = false;
  }

  function hideApiKeyModal() {
    if (apiKeyModal) apiKeyModal.style.display = 'none';
  }

  function disableAppControls() {
    console.warn("Disabling main app controls.");
    // Disable all buttons that are part of the main application UI,
    // but not part of the API key modal itself or the clear keys button.
    const controlsToDisable = [
        refreshFileListBtn, createNewFileBtn, createNewFolderBtn, editBtn, deleteEntryBtn,
        renameEntryBtn, generatePdfBtn, formatBtn, improveBtn, saveBtn, cancelBtn,
        addImageBtn, reorganizeEntriesBtn, selectAllContextBtn, deselectAllContextBtn,
        proceedWithImprovementBtn, copyPromptBtn, proceedWithReorganizationBtn
        // Add any other app-specific controls here
    ];
    controlsToDisable.forEach(control => {
        if (control) control.disabled = true;
    });
    if (htmlEditorTextarea) htmlEditorTextarea.disabled = true;
    if (geminiModelSelect) geminiModelSelect.disabled = true;
  }


  // --- Utility, GitHub, and Feature Functions ---

  function estimateTokens(text) { /* ... (from your original code) ... */ 
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
  function showModalLoading(message = "Processing...") { /* ... (from your original code) ... */ 
    if (modalLoadingIndicator) {
      const textElement = modalLoadingIndicator.querySelector(".loading-text");
      if (textElement) textElement.textContent = message;
      modalLoadingIndicator.style.display = "flex";
    } else {
      console.warn("Modal loading indicator element not found for general modal.");
    }
  }
  function hideModalLoading() { /* ... (from your original code) ... */ 
    if (modalLoadingIndicator) {
      modalLoadingIndicator.style.display = "none";
    }
  }
  
  function showLoading(message = "Loading...") { /* ... (from your original code, but ensure createNewFolderBtn is referenced correctly if used here) ... */ 
    if (loadingIndicator) {
      const textElement = loadingIndicator.querySelector(".loading-text");
      if (textElement) textElement.textContent = message;
      loadingIndicator.style.display = "flex";
    }
    // Disable buttons during general loading
    if (refreshFileListBtn) refreshFileListBtn.disabled = true;
    if (createNewFileBtn) createNewFileBtn.disabled = true;
    if (createNewFolderBtn) createNewFolderBtn.disabled = true; // Added check
    if (editBtn) editBtn.disabled = true;
    if (deleteEntryBtn) deleteEntryBtn.disabled = true;
    if (renameEntryBtn) renameEntryBtn.disabled = true;
    if (generatePdfBtn) generatePdfBtn.disabled = true;
    if (formatBtn) formatBtn.disabled = true;
    if (improveBtn) improveBtn.disabled = true;
    if (addImageBtn) addImageBtn.disabled = true;
    if (reorganizeEntriesBtn) reorganizeEntriesBtn.disabled = true;
  }

  function hideLoading() { /* ... (from your original code - this is crucial for re-enabling buttons) ... */
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
    if (!appConfig) return; // Config must be loaded

    const githubReady = !!(GITHUB_TOKEN && GITHUB_TOKEN.length > 20);
    const geminiReady = !!(GEMINI_API_KEY && GEMINI_API_KEY.length > 20 && GEMINI_MODELS.length > 0);
    const isFileLoaded = !!currentFilePath;

    if (refreshFileListBtn) refreshFileListBtn.disabled = !githubReady;
    if (createNewFileBtn) createNewFileBtn.disabled = !githubReady;
    if (createNewFolderBtn) createNewFolderBtn.disabled = !githubReady; // Added check
    if (reorganizeEntriesBtn) reorganizeEntriesBtn.disabled = !githubReady || !fileTree || fileTree.length === 0;


    if (editBtn) editBtn.disabled = !isFileLoaded || !githubReady;
    if (deleteEntryBtn) deleteEntryBtn.disabled = !isFileLoaded || !githubReady;
    if (renameEntryBtn) renameEntryBtn.disabled = !isFileLoaded || !githubReady;
    if (generatePdfBtn) generatePdfBtn.disabled = !isFileLoaded || !githubReady;
    
    if (formatBtn) formatBtn.disabled = !isFileLoaded || !geminiReady || !githubReady;
    if (improveBtn) improveBtn.disabled = !isFileLoaded || !geminiReady || !githubReady;
    
    if (addImageBtn) {
      addImageBtn.disabled = !isFileLoaded || !githubReady;
      addImageBtn.style.display = (isFileLoaded && githubReady) ? "block" : "none";
    }
    if(clearKeysBtn) clearKeysBtn.disabled = false; // Always ensure clear keys is enabled if present
  }

  function showError(message) { /* ... (from your original code) ... */ 
    if (jsonEntryContentDiv) {
      jsonEntryContentDiv.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
    } else {
      console.error("Error display area (jsonEntryContentDiv) not found. Error was:", message);
      alert("Error: " + message);
    }
    if (currentFileNameH2) {
      currentFileNameH2.textContent = "Error";
    }
  }
  
  // switchToViewMode and switchToEditMode also manage button states based on context
  function switchToViewMode() { /* ... (from your original code, ensure GITHUB_TOKEN/GEMINI_API_KEY checks are robust) ... */
    if (editorDiv) editorDiv.style.display = "none";
    if (viewerDiv) viewerDiv.style.display = "block";

    const githubReady = !!(GITHUB_TOKEN && GITHUB_TOKEN.length > 20);
    const geminiReady = !!(GEMINI_API_KEY && GEMINI_API_KEY.length > 20 && GEMINI_MODELS.length > 0);
    const isFileLoaded = !!currentFilePath;

    if (editBtn) editBtn.disabled = !isFileLoaded || !githubReady;
    if (deleteEntryBtn) deleteEntryBtn.disabled = !isFileLoaded || !githubReady;
    if (renameEntryBtn) renameEntryBtn.disabled = !isFileLoaded || !githubReady;
    if (generatePdfBtn) generatePdfBtn.disabled = !isFileLoaded || !githubReady;
    if (formatBtn) formatBtn.disabled = !isFileLoaded || !geminiReady || !githubReady;
    if (improveBtn) improveBtn.disabled = !isFileLoaded || !geminiReady || !githubReady;
    if (addImageBtn) {
      addImageBtn.disabled = !isFileLoaded || !githubReady;
      // addImageBtn visibility is usually handled in loadFileContentAndDisplay
    }
    if (saveBtn) saveBtn.disabled = true; // Editor save
    if (cancelBtn) cancelBtn.disabled = true; // Editor cancel
  }

  function switchToEditMode() { /* ... (from your original code) ... */ 
    if (viewerDiv) viewerDiv.style.display = "none";
    if (editorDiv) editorDiv.style.display = "block";
    if (htmlEditorTextarea) {
      htmlEditorTextarea.disabled = false;
      htmlEditorTextarea.focus();
    }
    // Disable view mode buttons
    if (editBtn) editBtn.disabled = true;
    if (deleteEntryBtn) deleteEntryBtn.disabled = true;
    if (renameEntryBtn) renameEntryBtn.disabled = true;
    if (generatePdfBtn) generatePdfBtn.disabled = true;
    if (formatBtn) formatBtn.disabled = true;
    if (improveBtn) improveBtn.disabled = true;
    if (addImageBtn) addImageBtn.disabled = true;
    // Enable edit mode buttons
    if (saveBtn) saveBtn.disabled = false;
    if (cancelBtn) cancelBtn.disabled = false;
  }
  
  function getGitHubHeaders() { /* ... (from your original code, relies on GITHUB_TOKEN) ... */ 
    if (!GITHUB_TOKEN || GITHUB_TOKEN.length < 20 ) { // Basic check
      console.error("CRITICAL: GitHub Token is missing or invalid when trying to make API call.");
      // Optionally, re-trigger API key modal or show a persistent error.
      // For now, throwing an error will stop the operation.
      showApiKeyModal();
      throw new Error("GitHub Token is missing or invalid. Please provide it.");
    }
    return {
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${GITHUB_TOKEN}`,
    };
  }

 async function fetchDirectoryContentsRecursive(directoryPath) {
    const url = `${API_BASE_URL}/${directoryPath}?ref=${GITHUB_BRANCH}`;
    console.log(`[FETCH] Fetching directory contents from: ${url}`);
    let filesFound = [];
    try {
      const response = await fetch(url, { headers: getGitHubHeaders() }); // getGitHubHeaders will now handle token check
      console.log(`[FETCH] Response status for ${directoryPath}: ${response.status}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[FETCH] Directory not found: ${directoryPath}`);
          return []; // Return empty, not an error for a 404 on a dir.
        }
        let errorMsg = `Error fetching directory '${directoryPath}': ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMsg += ` - ${errorData.message || 'No specific message.'}`;
        } catch(e){ /* no json body */ }

        if (response.status === 403) errorMsg += ` (Rate limit/token permissions issue?)`;
        if (response.status === 401) errorMsg += ` (Invalid token?)`;
        console.error(`[FETCH] API Error details: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      const items = await response.json();
      if (!Array.isArray(items)) {
        console.warn(`[FETCH] Expected array but got ${typeof items} for ${directoryPath}. Assuming empty or error.`);
        return []; // Or handle as error if appropriate
      }
      console.log(`[FETCH] Found ${items.length} items in ${directoryPath}`);
      const promises = items.map(async (item) => {
        if (item.type === "file") {
          const lowerName = item.name.toLowerCase();
          let fileType = "other";
          if (lowerName.endsWith(".json")) fileType = "json";
          else if (IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) fileType = "image";
          
          if (fileType === "json" || fileType === "image") {
            return {
              name: item.name,
              path: item.path,
              sha: item.sha,
              download_url: item.download_url,
              type: fileType,
            };
          } else return null; 
        } else if (item.type === "dir") {
          return await fetchDirectoryContentsRecursive(item.path);
        } else return null;
      });
      const results = await Promise.all(promises);
      filesFound = results.flat().filter((file) => file !== null);
    } catch (error) {
      console.error(`[FETCH] Error in fetchDirectoryContentsRecursive for ${directoryPath}:`, error);
      // Propagate error to allow fetchFileList to handle it with showError
      throw error; 
    }
    return filesFound;
  }
  async function fetchFileContent(filePath, useCache = true) {
    console.log(
      `[CONTENT] Attempting to fetch content for: ${filePath}, UseCache: ${useCache}`
    );

    if (useCache && contextCache[filePath]) {
      console.log(`[CONTENT] Using cached content for: ${filePath}`);
      const latestSha = flatJsonData.find((f) => f.path === filePath)?.sha;
      return { jsonData: contextCache[filePath], sha: latestSha || null };
    }

    const fileEntry = flatJsonData.find((item) => item.path === filePath);
    if (!fileEntry) {
      console.error(
        `[CONTENT] ERROR: File metadata not found in flatJsonData for path: ${filePath}`
      );
      return null;
    }
    if (!fileEntry.download_url) {
      console.error(
        `[CONTENT] ERROR: Missing download_url for file: ${filePath}`,
        fileEntry
      );
      return null;
    }

    const downloadUrl = fileEntry.download_url;
    console.log(
      `[CONTENT] Found file entry. Fetching from download_url: ${downloadUrl}`
    );
    showLoading(`Loading ${filePath.split("/").pop()}...`);

    try {
      const response = await fetch(downloadUrl, { cache: "no-cache" });
      console.log(
        `[CONTENT] Fetch response status for ${filePath}: ${response.status}`
      );
      if (!response.ok) {
        let errorText = await response.text();
        console.error(
          `[CONTENT] Fetch error (${response.status}) for ${filePath}. Response text: ${errorText}`
        );
        throw new Error(
          `Fetch error (${response.status}): ${response.statusText}`
        );
      }
      const jsonString = await response.text();
      console.log(
        `[CONTENT] Successfully fetched raw text for ${filePath}. Length: ${jsonString.length}`
      );
      let jsonData;
      try {
        jsonData = JSON.parse(jsonString);
        console.log(`[CONTENT] Successfully parsed JSON for ${filePath}.`);
      } catch (parseError) {
        console.error(
          `[CONTENT] !!! JSON Parsing Error for ${filePath}:`,
          parseError
        );
        console.error(
          `[CONTENT] Raw text that failed parsing (first 1000 chars):\n`,
          jsonString.substring(0, 1000)
        );
        throw new Error(
          `Invalid JSON content in file ${filePath}. Check file syntax. Original error: ${parseError.message}`
        );
      }
      fileEntry.kankaName =
        jsonData?.name || fileEntry.name.replace(/\.json$/, "");
      contextCache[filePath] = jsonData;
      const linkElement = fileTreeRootUl?.querySelector(
        `a[data-file-path="${CSS.escape(filePath)}"]`
      );
      if (linkElement) {
        const currentText = linkElement.textContent;
        const baseName = fileEntry.name.replace(/\.json$/, "");
        if (
          fileEntry.kankaName &&
          fileEntry.kankaName !== currentText &&
          fileEntry.kankaName !== baseName
        ) {
          linkElement.textContent = fileEntry.kankaName;
        }
        linkElement.title = `Entry: ${fileEntry.kankaName || baseName}`;
      }
      return { jsonData, sha: fileEntry.sha };
    } catch (error) {
      console.error(`[CONTENT] Error loading/parsing file ${filePath}:`, error);
      return null;
    } finally {
      console.log(`[CONTENT] fetchFileContent finished for ${filePath}.`);
    }
  }

  async function commitFileToGitHub(
    filePath,
    content,
    commitMessage,
    sha = null,
    isBinary = false
  ) {
    console.log(
      `[COMMIT] Attempting to ${sha ? "update" : "create"} file: ${filePath}`
    );
    showLoading(sha ? "Saving changes..." : "Creating file...");
    const url = `${API_BASE_URL}/${filePath}`;
    let base64Content;

    if (!isBinary) {
      try {
        const utf8Bytes = new TextEncoder().encode(content);
        let binaryString = "";
        utf8Bytes.forEach((byte) => {
          binaryString += String.fromCharCode(byte);
        });
        base64Content = btoa(binaryString);
      } catch (e) {
        console.error("[COMMIT] Base64 Text Encoding Error:", e);
        alert("Text Encoding Error. Could not save file.");
        hideLoading();
        return null;
      }
    } else {
      base64Content = content;
    }

    const body = {
      message: commitMessage,
      content: base64Content,
      branch: GITHUB_BRANCH,
    };
    if (sha) {
      body.sha = sha;
      console.log(`[COMMIT] Providing SHA for update: ${sha}`);
    } else {
      console.log(`[COMMIT] No SHA provided (creating new file).`);
    }

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: getGitHubHeaders(),
        body: JSON.stringify(body),
      });
      const resultData = await response.json().catch((e) => {
        console.warn("[COMMIT] Failed to parse JSON response body.", e);
        return null;
      });
      if (!response.ok) {
        console.error(
          `[COMMIT] GitHub API Error (${response.status}) for ${filePath}:`,
          resultData || response.statusText
        );
        let errorMsg = `GitHub API Error (${response.status}): ${
          resultData?.message || response.statusText
        }`;
        if (response.status === 409) {
          errorMsg += "\nConflict detected (SHA mismatch?). Refresh & retry.";
        } else if (response.status === 422 && !sha) {
          errorMsg += ` File may already exist or path is invalid.`;
        } else if (response.status === 422 && sha) {
          errorMsg += ` File update failed (validation error?).`;
        } else if (response.status === 403) {
          errorMsg += ` Rate limit/token permissions issue?`;
        } else if (response.status === 401) {
          errorMsg += ` Invalid token?`;
        } else if (response.status === 404 && sha) {
          errorMsg += ` File not found for update (SHA: ${sha}). Has it been deleted?`;
        }
        throw new Error(errorMsg);
      }
      console.log(
        "[COMMIT] GitHub Commit successful:",
        resultData?.commit?.message,
        resultData?.content?.path
      );
      return resultData?.content;
    } catch (error) {
      console.error("[COMMIT] Error committing file to GitHub:", error);
      alert(`Failed to save to GitHub: ${filePath}\nError: ${error.message}`);
      return null;
    }
  }

  async function deleteFileFromGitHub(filePath, sha, commitMessage) {
    console.log(
      `[DELETE] Attempting to delete file: ${filePath} with SHA: ${sha}`
    );
    showLoading(`Deleting ${filePath.split("/").pop()}...`);
    const url = `${API_BASE_URL}/${filePath}`;
    const body = { message: commitMessage, sha: sha, branch: GITHUB_BRANCH };
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: getGitHubHeaders(),
        body: JSON.stringify(body),
      });
      console.log(
        `[DELETE] Response status for ${filePath}: ${response.status}`
      );
      if (!response.ok) {
        let errorMsg = `GitHub API Error (${response.status}): ${response.statusText}`;
        let errorData = null;
        try {
          errorData = await response.json();
          errorMsg += ` - ${errorData.message || "No specific message."}`;
          console.error(
            `[DELETE] API Error details for ${filePath}:`,
            errorData
          );
        } catch (e) {
          console.warn(
            `[DELETE] Could not parse error response body for ${filePath}.`
          );
        }
        if (response.status === 404)
          errorMsg += " File not found or already deleted?";
        if (response.status === 409)
          errorMsg += " Conflict - SHA mismatch? Refresh needed.";
        if (response.status === 401) errorMsg += " Invalid token?";
        if (response.status === 403) errorMsg += " Token permissions issue?";
        if (response.status === 422)
          errorMsg += " Validation failed (e.g., missing SHA).";
        throw new Error(errorMsg);
      }
      console.log(
        `[DELETE] Successfully deleted ${filePath} (Status: ${response.status})`
      );
      return true;
    } catch (error) {
      console.error(
        `[DELETE] Error deleting file ${filePath} from GitHub:`,
        error
      );
      alert(
        `Failed to delete file from GitHub: ${filePath}\nError: ${error.message}`
      );
      return false;
    } finally {
      hideLoading();
    }
  }

  async function fetchFileList() {
    console.log("[FETCH] Starting fetchFileList...");
    showLoading("Fetching file list...");
    fileTreeRootUl.innerHTML = "";
    allFetchedFiles = [];
    flatJsonData = [];
    imageFileMap = {};
    fileTree = [];
    contextCache = {};
    editBtn.disabled = true;
    deleteEntryBtn.disabled = true;
    if (document.getElementById("renameEntryBtn"))
      document.getElementById("renameEntryBtn").disabled = true;
    generatePdfBtn.disabled = true;
    formatBtn.disabled = true;
    improveBtn.disabled = true;
    addImageBtn.disabled = true;
    addImageBtn.style.display = "none";
    fileCountSpan.textContent = "";
    currentFilePath = null;
    currentJsonData = null;
    currentFileSha = null;
    currentFileNameH2.textContent = "Select an entry";
    jsonEntryContentDiv.innerHTML = "<p>Fetching all files...</p>";
    imagePreviewSidebar.style.display = "none";
    imageListContainer.innerHTML = "";
    noImageTextElement.style.display = "block";

    try {
      console.log(
        `[FETCH] Calling fetchDirectoryContentsRecursive for base path: ${GITHUB_DATA_PATH}`
      );
      allFetchedFiles = await fetchDirectoryContentsRecursive(GITHUB_DATA_PATH);
      console.log(
        `[FETCH] fetchDirectoryContentsRecursive completed. Found ${
          allFetchedFiles ? allFetchedFiles.length : "null"
        } total items.`
      );
      if (allFetchedFiles && allFetchedFiles.length > 0) {
        console.log("[FETCH] Processing fetched files...");
        flatJsonData = [];
        imageFileMap = {};
        let jsonFileCount = 0;
        const galleryPathPrefix = `${GITHUB_DATA_PATH}/${GALLERY_FOLDER}/`;
        allFetchedFiles.forEach((file) => {
          const isGalleryFile = file.path.startsWith(galleryPathPrefix);
          if (file.type === "json") {
            if (!isGalleryFile) {
              let relativePath = file.path;
              const dataPathPrefix = GITHUB_DATA_PATH + "/";
              if (relativePath.startsWith(dataPathPrefix)) {
                relativePath = relativePath.substring(dataPathPrefix.length);
              }
              flatJsonData.push({
                ...file,
                kankaName: null,
                displayPath: relativePath,
              });
              jsonFileCount++;
            }
          } else if (file.type === "image" && isGalleryFile) {
            const imageId = file.name.substring(0, file.name.lastIndexOf("."));
            if (imageId) {
              imageFileMap[imageId] = file;
            }
          }
        });
        console.log(
          `[FETCH] Processed files: ${jsonFileCount} JSON entries, ${
            Object.keys(imageFileMap).length
          } images mapped.`
        );
        flatJsonData.sort((a, b) => a.displayPath.localeCompare(b.displayPath));
        console.log("[FETCH] Building file tree...");
        fileTree = buildFileTree(flatJsonData, GITHUB_DATA_PATH);
        console.log("[FETCH] Rendering file tree...");
        renderFileTree(fileTree, fileTreeRootUl);
        console.log("[FETCH] File tree rendered.");
        fileCountSpan.textContent = `${jsonFileCount} JSON entries found.`;
        if (jsonFileCount === 0) {
          jsonEntryContentDiv.innerHTML = `<p>No JSON entries found in '/${GITHUB_DATA_PATH}'.</p>`;
        } else {
          jsonEntryContentDiv.innerHTML =
            "<p>Select an entry from the tree.</p>";
        }
        createNewFileBtn.disabled = false;
      } else {
        console.warn("[FETCH] No files found or fetch result was empty/null.");
        fileCountSpan.textContent = `0 files found.`;
        jsonEntryContentDiv.innerHTML = `<p>No files found in '/${GITHUB_DATA_PATH}'. Check path in config.json and repository contents.</p>`;
        createNewFileBtn.disabled = true;
      }
    } catch (error) {
      console.error("[FETCH] Error processing file list:", error);
      showError(
        `Failed to load file tree. Error: ${
          error.message || "Unknown error"
        }. Check console and GitHub details.`
      );
      fileCountSpan.textContent = "Error loading files.";
    } finally {
      hideLoading();
      console.log("[FETCH] fetchFileList finished.");
    }
  }

function buildFileTree(jsonData, basePath) {
    console.log("[BUILD_TREE] Starting buildFileTree with jsonData count:", jsonData.length, "basePath:", basePath);
    const tree = [];
    const map = {}; // Maps folder paths to their node in the tree
    jsonData.forEach((file) => {
        console.log("[BUILD_TREE] Processing file:", file.path, "DisplayPath:", file.displayPath);
        const relativePath = file.displayPath || file.name; // Use displayPath if available
        const parts = relativePath.split("/");
        let currentLevel = tree;
        let currentFolderPathForMap = ""; // Path used as key in 'map'

        // Iterate through path parts to create/find folders
        for (let i = 0; i < parts.length - 1; i++) { // -1 because last part is the filename
            const part = parts[i];
            // Construct the cumulative path for the map key
            currentFolderPathForMap = currentFolderPathForMap ? `${currentFolderPathForMap}/${part}` : part;
            
            let folderNode = map[currentFolderPathForMap];
            if (!folderNode) {
                const fullGitHubPath = basePath ? `${basePath}/${currentFolderPathForMap}` : currentFolderPathForMap;
                console.log(`[BUILD_TREE] Creating new folder node: ${part} at path: ${fullGitHubPath} (map key: ${currentFolderPathForMap})`);
                folderNode = {
                    name: part,
                    path: fullGitHubPath, // This should be the full path from GitHub repo root
                    type: "dir",
                    children: [],
                    // kankaName for folders is usually just the name, or derived if you have a convention
                };
                map[currentFolderPathForMap] = folderNode;
                currentLevel.push(folderNode);
                // Sort currentLevel folders alphabetically (optional, but good for consistency)
                currentLevel.sort((a, b) => a.name.localeCompare(b.name));
            }
            currentLevel = folderNode.children;
        }

        // Add the file node
        const fileName = parts[parts.length - 1];
        console.log(`[BUILD_TREE] Adding file node: ${fileName} to folder: ${currentFolderPathForMap || 'root'}`);
        const fileNode = { ...file, name: fileName, type: "file" }; // file already contains path, sha, kankaName (once loaded)
        currentLevel.push(fileNode);

        // Sort files and folders within the current level (folders first, then alpha)
        currentLevel.sort((a, b) => {
            if (a.type === "dir" && b.type === "file") return -1;
            if (a.type === "file" && b.type === "dir") return 1;
            return (a.kankaName || a.name).localeCompare(b.kankaName || b.name);
        });
    });

    // Sort root level
    tree.sort((a, b) => {
        if (a.type === "dir" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "dir") return 1;
        return (a.kankaName || a.name).localeCompare(b.kankaName || b.name);
    });
    console.log("[BUILD_TREE] Finished building tree. Root nodes:", tree.length);
    return tree;
}

// Inside script.js

function renderFileTree(nodes, parentUlElement) {
    console.log("[RENDER_TREE] Starting renderFileTree for parent:", parentUlElement, "with nodes count:", nodes ? nodes.length : 0);
    if (!parentUlElement) {
        console.error("[RENDER_TREE] Parent UL element is null! Cannot render.");
        return;
    }
    if (!nodes || nodes.length === 0) {
        console.log("[RENDER_TREE] No nodes to render for this level.");
        // You might want to add a "No entries in this folder" message if parentUlElement is not the root
        // and it's for a specific folder's children list.
        // For the root, fetchFileList handles the "No JSON entries found" message.
        return;
    }



  parentUlElement.innerHTML = ""; // Clear previous tree
  nodes.forEach((node) => {
      const li = document.createElement("li");
      const nodeContentWrapper = document.createElement("div");
      nodeContentWrapper.classList.add('node-content');

      const nodeDisplayElement = document.createElement(node.type === "file" ? "a" : "span");
      nodeDisplayElement.classList.add("node-text");
      nodeDisplayElement.textContent = node.name.replace(/\.json$/i, "");

      if (node.type === "dir") {
          li.classList.add("folder", "collapsed");
          nodeDisplayElement.title = `Folder: ${node.name}`;
          nodeDisplayElement.addEventListener("click", (e) => {
              // Allow click on text to expand/collapse only if not clicking a button inside
              if (e.target === nodeDisplayElement || e.target.classList.contains('node-text')) {
                  li.classList.toggle("collapsed");
              }
          });
          nodeContentWrapper.style.cursor = 'pointer';

          nodeContentWrapper.appendChild(nodeDisplayElement); // Add text first

          // Button to create a NEW ENTRY (FILE) inside this folder
          const addFileBtn = document.createElement("button");
          addFileBtn.textContent = "⊕"; // File plus icon (or use text like "+ Entry")
          addFileBtn.classList.add("add-in-folder-btn"); // Existing class for adding files
          addFileBtn.title = `Create new entry in ${node.name}`;
          addFileBtn.dataset.folderPath = node.path;
          addFileBtn.addEventListener("click", handleCreateInFolderClick); // Existing handler
          nodeContentWrapper.appendChild(addFileBtn);

          // *** NEW: Button to create a NEW SUBFOLDER inside this folder ***
          const addSubfolderBtn = document.createElement("button");
          addSubfolderBtn.textContent = "📁+"; // Folder plus icon (or use text like "+ Folder")
          addSubfolderBtn.classList.add("create-subfolder-btn"); // New class for this button
          addSubfolderBtn.title = `Create new subfolder in ${node.name}`;
          addSubfolderBtn.dataset.parentFolderPath = node.path; // Store the parent folder's path
          addSubfolderBtn.addEventListener("click", handleCreateSubfolderClick); // New handler
          nodeContentWrapper.appendChild(addSubfolderBtn);
          // *** END NEW BUTTON ***

          li.appendChild(nodeContentWrapper);
          const childrenUl = document.createElement("ul");
          if (node.children && node.children.length > 0) {
              renderFileTree(node.children, childrenUl);
          }
          li.appendChild(childrenUl);
      } else { // It's a file
          li.classList.add("file");
          nodeDisplayElement.href = "#";
          const displayName = node.kankaName || node.name.replace(/\.json$/i, "");
          nodeDisplayElement.textContent = displayName;
          nodeDisplayElement.title = `Entry: ${displayName}`;
          nodeDisplayElement.dataset.filePath = node.path;
          nodeDisplayElement.addEventListener("click", (event) => {
              event.preventDefault();
              handleFileLinkClick(node.path, nodeDisplayElement);
          });
          nodeContentWrapper.appendChild(nodeDisplayElement);
          li.appendChild(nodeContentWrapper);
      }
      parentUlElement.appendChild(li);
  });
}

// *** NEW Handler for creating SUBFOLDERS ***
async function handleCreateSubfolderClick(event) {
  event.stopPropagation(); // Prevent folder toggle & creating an entry
  const parentFolderPath = event.target.dataset.parentFolderPath; // Path of the folder where we want to create a subfolder
  const parentFolderName = parentFolderPath.split("/").pop();

  const subfolderName = prompt(`Enter name for new SUBFOLDER inside "${parentFolderName}":`);
  if (subfolderName && subfolderName.trim() !== "") {
      const newSubfolderName = subfolderName.trim();

      // Basic validation for the subfolder name
      if (newSubfolderName.includes('/') || newSubfolderName.includes('.')) {
          alert("Invalid subfolder name. Do not use '/' or '.' in the folder name.");
          return;
      }

      const newFullSubfolderPath = `${parentFolderPath}/${newSubfolderName}`;

      // Check if a folder or file with this name already exists within the parent
      // We need to check `allFetchedFiles` for paths that start with `newFullSubfolderPath`
      // or are exactly `newFullSubfolderPath` (if it was a file mistaken for a folder name)
      const pathExists = allFetchedFiles.some(item =>
          item.path === newFullSubfolderPath || // Exact match (e.g. if a file has this name)
          item.path.startsWith(newFullSubfolderPath + '/') // If it's already a folder with contents
      );

      if (pathExists) {
          alert(`A folder or file named "${newSubfolderName}" already exists inside "${parentFolderName}".`);
          return;
      }

      showLoading(`Creating subfolder ${newSubfolderName}...`);
      try {
          // Create a .gitkeep file to make the folder appear in Git
          const gitkeepPath = `${newFullSubfolderPath}/.gitkeep`;
          const commitResult = await commitFileToGitHub(gitkeepPath, "", `feat: Create subfolder ${newSubfolderName} in ${parentFolderName}`);

          if (commitResult) {
              alert(`Subfolder "${newSubfolderName}" created successfully inside "${parentFolderName}".`);
              // Expand the parent folder in the tree after creation
              const parentLi = event.target.closest('li.folder');
              if (parentLi) {
                  parentLi.classList.remove('collapsed');
              }
              await fetchFileList(); // Refresh the entire file list
          } else {
              console.warn("Subfolder creation might have failed as commitResult was null.");
          }
      } catch (error) {
          console.error("Error creating subfolder:", error);
          alert(`Error creating subfolder: ${error.message}`);
      } finally {
          hideLoading();
      }
  }
}

  function handleFileLinkClick(filePath, linkElement) {
    loadFileContentAndDisplay(filePath, linkElement);
  }

  function handleCreateInFolderClick(event) {
    event.stopPropagation();
    const folderPath = event.target.dataset.folderPath;
    console.log(
      "+ Clicked for creating file in folder! Folder path:",
      folderPath
    );
    const folderName = folderPath.split("/").pop();
    const newFileNameBase = prompt(
      `Enter name for new entry in folder "${folderName}":`
    );
    if (newFileNameBase && newFileNameBase.trim()) {
      handleCreateNewEntry(newFileNameBase.trim(), folderPath);
    }
  }

  async function handleCreateNewEntry(name, targetFolderPath) {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const safeFilename =
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9\-_]+/g, "-")
        .replace(/^-+|-+$/g, "") + ".json";
    if (!safeFilename || safeFilename === ".json") {
      alert("Invalid entry name after sanitization.");
      return;
    }
    const newFilePathInRepo = `${targetFolderPath}/${safeFilename}`;
    const nameExists = flatJsonData.some(
      (item) =>
        item.kankaName &&
        item.kankaName.toLowerCase() === trimmedName.toLowerCase()
    );
    const pathExists = flatJsonData.some(
      (item) => item.path === newFilePathInRepo
    );
    if (nameExists) {
      alert(
        `An entry with the name '${trimmedName}' may already exist. Please choose a unique name.`
      );
      return;
    }
    if (pathExists) {
      alert(
        `A file with the calculated path '${newFilePathInRepo}' already exists. Please choose a different name.`
      );
      return;
    }
    const now = new Date().toISOString().replace("Z", ".000000Z");
    const campaignId = currentJsonData?.campaign_id || null;
    const newJsonData = {
      id: null,
      name: trimmedName,
      campaign_id: campaignId,
      entry: `<p>New entry: ${trimmedName}.</p>`,
      created_at: now,
      updated_at: now,
      is_private: 0,
      tags: [],
      entity: {
        id: null,
        entity_id: null,
        parent_id: null,
        type_id: null,
        name: trimmedName,
        type: null,
        entry: `<p>New entry: ${trimmedName}.</p>`,
        is_private: 0,
        is_template: null,
        is_attributes_private: 0,
        focus_x: null,
        focus_y: null,
        created_at: now,
        updated_at: now,
        created_by: null,
        updated_by: null,
        image_uuids: [],
        header_uuid: null,
        image_path: null,
        header_image: null,
        marketplace_uuid: null,
        tooltip: null,
      },
    };
    const jsonString = JSON.stringify(newJsonData, null, 2);
    const commitMessage = `Create entry: ${trimmedName} in ${
      targetFolderPath === GITHUB_DATA_PATH
        ? "root"
        : targetFolderPath.split("/").pop()
    }`;
    const commitResult = await commitFileToGitHub(
      newFilePathInRepo,
      jsonString,
      commitMessage
    );
    if (commitResult) {
      alert(`Created entry '${trimmedName}'. Refreshing file list to see it.`);
      await fetchFileList();
    }
  }

  function renderHtmlEntry(htmlContent, targetDiv = jsonEntryContentDiv) {
    // Regex to find @Links - THIS IS NO LONGER NEEDED
    // The original feature of finding `@Entry Name` to create links is removed.
    // If you still want *existing* HTML <a> tags to work or be styled, that's fine,
    // but the automatic creation of links from `@text` is gone.

    // For now, just set the HTML directly.
    // If you had specific styling for `data-internal-link` before, that styling won't apply
    // unless the HTML content already contains such attributes.
    targetDiv.innerHTML = htmlContent;

    // If you still have a use case for `data-internal-link` attributes created *manually*
    // in your HTML content, you can keep this part. Otherwise, it can be removed too.
    targetDiv.querySelectorAll("a[data-internal-link]").forEach((link) => {
      link.addEventListener("click", handleInternalLinkClick);
    });
  }

  function renderJournalContent(posts, targetDiv = jsonEntryContentDiv) {
    targetDiv.innerHTML = "";
    if (!posts || posts.length === 0) {
      targetDiv.innerHTML = "<p><em>Journal contains no posts.</em></p>";
      return;
    }
    const sortedPosts = posts.sort(
      (a, b) => (a.position || 0) - (b.position || 0)
    );
    sortedPosts.forEach((post, index) => {
      const postHeader = document.createElement("h3");
      postHeader.textContent = post.name || `Post ${index + 1}`;
      postHeader.id = `post-${post.id || index}`;
      targetDiv.appendChild(postHeader);
      const postContentDiv = document.createElement("div");
      postContentDiv.classList.add("journal-post-content");
      renderHtmlEntry(
        post.entry || "<p><em>(Post content is empty)</em></p>",
        postContentDiv
      ); // renderHtmlEntry will now just set innerHTML
      targetDiv.appendChild(postContentDiv);
      if (index < sortedPosts.length - 1) {
        const hr = document.createElement("hr");
        hr.style.borderTop = "1px dotted #c8b8a8";
        hr.style.margin = "1em 0";
        targetDiv.appendChild(hr);
      }
    });
  }

  function getContentForEditingOrAI(isJournal) {
    if (isJournal) {
      return htmlEditorTextarea.dataset.concatenatedJournalHtml || "";
    } else {
      return htmlEditorTextarea.dataset.rawHtmlEntry || "";
    }
  }

  async function loadFileContentAndDisplay(filePath, linkElement = null) {
    console.log(`[LOAD] Attempting to load: ${filePath}`);
    if (
      editorDiv.style.display !== "none" &&
      !confirm("Discard current editor changes?")
    ) {
      return;
    }
    let result = null;
    let isJournal = false;
    imagePreviewSidebar.style.display = "block";
    imageListContainer.innerHTML = "";
    noImageTextElement.style.display = "block";
    noImageTextElement.textContent = "Loading image info...";
    addImageBtn.style.display = "none";
    addImageBtn.disabled = true;
    currentFileNameH2.textContent = "Loading...";
    jsonEntryContentDiv.innerHTML = "<p>Loading content...</p>";
    htmlEditorTextarea.value = "";
    htmlEditorTextarea.dataset.rawHtmlEntry = "";
    htmlEditorTextarea.dataset.concatenatedJournalHtml = "";
    htmlEditorTextarea.disabled = true;

    try {
      result = await fetchFileContent(filePath, false);
      console.log(
        `[LOAD] fetchFileContent result for ${filePath}:`,
        result ? "Success" : "Failure/Null",
        result?.sha
      );
      if (result && result.jsonData) {
        currentFilePath = filePath;
        currentJsonData = result.jsonData;
        currentFileSha = result.sha;
        console.log(
          `[LOAD] Successfully fetched data for ${filePath} with SHA: ${currentFileSha}`
        );
        isJournal = !!(
          currentJsonData.entity &&
          Array.isArray(currentJsonData.entity.posts) &&
          currentJsonData.entity.posts.length >= 0
        );
        console.log(
          `[LOAD] File Type Detected: ${
            isJournal ? "Journal" : "Standard Entry"
          }`
        );
        if (activeLinkElement && activeLinkElement !== linkElement) {
          activeLinkElement.classList.remove("active");
        }
        if (linkElement) {
          linkElement.classList.add("active");
          activeLinkElement = linkElement;
        } else {
          activeLinkElement = null;
        }
        if (linkElement) {
          let parentLi = linkElement.closest("li.folder");
          while (parentLi) {
            parentLi.classList.remove("collapsed");
            const grandParentUl = parentLi.parentElement;
            if (grandParentUl && grandParentUl.id !== "fileTreeRoot") {
              parentLi = grandParentUl.closest("li.folder");
            } else {
              parentLi = null;
            }
          }
        }
        currentFileNameH2.textContent =
          currentJsonData?.name ||
          filePath
            .split("/")
            .pop()
            .replace(/\.json$/, "");
        console.log(`[LOAD] Set header to: ${currentFileNameH2.textContent}`);
        if (isJournal) {
          console.log("[LOAD] Processing as Journal...");
          const posts = currentJsonData.entity.posts || [];
          const separator = "\n<hr />\n";
          const concatenatedHtml = posts
            .map((p) => p.entry || "")
            .join(separator);
          htmlEditorTextarea.dataset.concatenatedJournalHtml = concatenatedHtml;
          try {
            console.log(
              `[LOAD] Rendering Journal structured view for ${filePath}`
            );
            renderJournalContent(posts);
            console.log(
              `[LOAD] Finished rendering Journal structured view for ${filePath}`
            );
          } catch (renderError) {
            console.error(
              `[LOAD] Error during renderJournalContent for ${filePath}:`,
              renderError
            );
            jsonEntryContentDiv.innerHTML = `<p style="color: red;">Error rendering journal content. Check console.</p>`;
          }
          htmlEditorTextarea.disabled = false;
        } else {
          console.log("[LOAD] Processing as Standard Entry...");
          const entryHtml =
            currentJsonData?.entity?.entry ?? currentJsonData?.entry ?? "";
          console.log(`[LOAD] Standard Entry HTML length: ${entryHtml.length}`);
          htmlEditorTextarea.dataset.rawHtmlEntry = entryHtml;
          htmlEditorTextarea.disabled = false;
          try {
            console.log(
              `[LOAD] Rendering standard entry content for ${filePath}...`
            );
            renderHtmlEntry(
              entryHtml || "<p><em>(Entry content is empty)</em></p>",
              jsonEntryContentDiv
            );
            console.log(
              `[LOAD] Finished rendering standard entry content for ${filePath}`
            );
          } catch (renderError) {
            console.error(
              `[LOAD] Error during renderHtmlEntry for ${filePath}:`,
              renderError
            );
            jsonEntryContentDiv.innerHTML = `<p style="color: red;">Error rendering standard content. Check console.</p>`;
          }
        }
        console.log(`[LOAD] Starting image handling for ${filePath}`);
        let imageUUIDs = currentJsonData?.entity?.image_uuids;
        if (!Array.isArray(imageUUIDs) && currentJsonData?.entity?.image_uuid) {
          imageUUIDs = [currentJsonData.entity.image_uuid];
        }
        if (Array.isArray(imageUUIDs) && imageUUIDs.length > 0) {
          console.log(`[LOAD] Found ${imageUUIDs.length} linked image UUIDs.`);
          let imagesFoundCount = 0;
          imageListContainer.innerHTML = "";
          const imageLoadPromises = imageUUIDs.map(async (uuid) => {
            const imageData = imageFileMap[uuid];
            if (imageData && imageData.download_url && imageData.sha) {
              imagesFoundCount++;
              const cacheBustedUrl = `${imageData.download_url}?v=${imageData.sha}`;
              console.log(
                `[LOAD] - Loading image: UUID=${uuid}, Name=${imageData.name}, URL=${cacheBustedUrl}`
              );
              const imageContainerDiv = document.createElement("div");
              imageContainerDiv.style.position = "relative";
              imageContainerDiv.style.marginBottom = "15px";
              const imgElement = document.createElement("img");
              let loadedSuccessfully = false;
              await new Promise((resolve) => {
                imgElement.onload = () => {
                  console.log(`[LOAD] Image loaded: ${cacheBustedUrl}`);
                  loadedSuccessfully = true;
                  resolve();
                };
                imgElement.onerror = () => {
                  console.error(
                    `[LOAD] Failed to load image: ${cacheBustedUrl}`
                  );
                  imgElement.style.display = "none";
                  const errorText = document.createElement("p");
                  errorText.textContent = `[Failed: ${imageData.name || uuid}]`;
                  errorText.style.cssText =
                    "color: red; font-size: 0.8em; text-align: center;";
                  imageContainerDiv.insertBefore(errorText, imgElement);
                  resolve();
                };
                imgElement.src = cacheBustedUrl;
                imgElement.alt = `Linked image ${uuid}`;
                imgElement.title = `${imageData.name} (UUID: ${uuid}) - Click to enlarge`;
                imgElement.style.cssText = `display: block; max-width: 100%; height: auto; border: 1px solid #d4c8b8; border-radius: 3px; background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 0 auto; cursor: pointer;`;
                imgElement.addEventListener("click", () =>
                  openImageLightbox(cacheBustedUrl)
                );
              });
              if (loadedSuccessfully) {
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "×";
                deleteBtn.title = `Delete image: ${imageData.name}`;
                deleteBtn.style.cssText = `position: absolute; top: 2px; right: 2px; background-color: rgba(200, 0, 0, 0.7); color: white; border: 1px solid rgba(100, 0, 0, 0.8); border-radius: 50%; width: 20px; height: 20px; line-height: 18px; text-align: center; font-size: 14px; font-weight: bold; cursor: pointer; padding: 0; z-index: 10;`;
                deleteBtn.dataset.uuid = uuid;
                deleteBtn.dataset.filename = imageData.name;
                deleteBtn.addEventListener("click", handleDeleteImageClick);
                imageContainerDiv.appendChild(deleteBtn);
              }
              imageContainerDiv.appendChild(imgElement);
              imageListContainer.appendChild(imageContainerDiv);
            } else {
              console.warn(
                `[LOAD] Image data not found or incomplete for UUID: ${uuid}.`
              );
              const errorP = document.createElement("p");
              errorP.textContent = `[Data missing: ${uuid}]`;
              errorP.style.cssText =
                "font-size: 0.8em; color: orange; text-align: center; margin-bottom: 10px;";
              imageListContainer.appendChild(errorP);
            }
          });
          await Promise.all(imageLoadPromises);
          const actualRenderedImages = imageListContainer.querySelectorAll(
            'img:not([style*="display: none"])'
          ).length;
          if (actualRenderedImages > 0) {
            noImageTextElement.style.display = "none";
          } else if (imageUUIDs.length > 0) {
            noImageTextElement.textContent =
              "Linked images found, but failed to load.";
            noImageTextElement.style.display = "block";
          } else {
            noImageTextElement.textContent = "No images linked.";
            noImageTextElement.style.display = "block";
          }
        } else {
          console.log("[LOAD] No image UUIDs found for this entry.");
          imageListContainer.innerHTML = "";
          noImageTextElement.textContent = "No images linked.";
          noImageTextElement.style.display = "block";
        }
        console.log(`[LOAD] Finished image handling for ${filePath}`);
      } else {
        console.error(
          `[LOAD] fetchFileContent failed or returned no JSON data for ${filePath}.`
        );
        result = null;
        showError(`Failed to load entry content for ${filePath}.`);
        if (activeLinkElement) {
          activeLinkElement.classList.remove("active");
          activeLinkElement = null;
        }
        imagePreviewSidebar.style.display = "none";
      }
    } catch (error) {
      console.error(
        `[LOAD] Critical error loading/displaying file ${filePath}:`,
        error
      );
      result = null;
      showError(
        `Critical error processing entry: ${error.message}. Check console.`
      );
      if (activeLinkElement) {
        activeLinkElement.classList.remove("active");
        activeLinkElement = null;
      }
      imagePreviewSidebar.style.display = "none";
    } finally {
      console.log(
        `[LOAD] Finally block for ${filePath}. Result status: ${!!result}`
      );
      const enableButtons = !!result;
      if (result) {
        addImageBtn.style.display = "block";
        addImageBtn.disabled = false;
      } else {
        addImageBtn.style.display = "none";
        addImageBtn.disabled = true;
      }
      editBtn.disabled = !enableButtons;
      deleteEntryBtn.disabled = !enableButtons;
      generatePdfBtn.disabled = !enableButtons;
      if (document.getElementById("renameEntryBtn"))
        document.getElementById("renameEntryBtn").disabled = !enableButtons;
      formatBtn.disabled =
        !enableButtons ||
        !GEMINI_API_KEY ||
        GEMINI_API_KEY.startsWith("YOUR_") ||
        GEMINI_MODELS.length === 0;
      improveBtn.disabled =
        !enableButtons ||
        !GEMINI_API_KEY ||
        GEMINI_API_KEY.startsWith("YOUR_") ||
        GEMINI_MODELS.length === 0;
      editBtn.title = "";
      formatBtn.title = "";
      improveBtn.title = "";
      htmlEditorTextarea.disabled = !enableButtons;
      switchToViewMode();
      if (!result) {
        imagePreviewSidebar.style.display = "none";
      }
      console.log(`[LOAD] Load process finished for ${filePath}`);
    }
  }

  function handleInternalLinkClick(event) {
    event.preventDefault();
    const targetPath = decodeURIComponent(event.target.dataset.internalLink);
    const targetFileEntry = flatJsonData.find(
      (item) => item.path === targetPath
    );
    if (targetFileEntry) {
      const linkElement = fileTreeRootUl.querySelector(
        `a[data-file-path="${CSS.escape(targetPath)}"]`
      );
      loadFileContentAndDisplay(targetPath, linkElement);
      const viewEditArea = document.querySelector(".entry-view-edit-area");
      if (viewEditArea) viewEditArea.scrollTop = 0;
    } else {
      alert(
        `Link target "${targetPath}" not found in the current file list. Refresh list?`
      );
    }
  }

  function findFileByKankaName(kankaName) {
    if (!kankaName) return null;
    const lowerKankaName = kankaName.toLowerCase();
    return flatJsonData.find(
      (item) =>
        item.kankaName && item.kankaName.toLowerCase() === lowerKankaName
    );
  }

  function handleAddImageClick() {
    console.log("Add Image button clicked, triggering input...");
    if (imageUploadInput) imageUploadInput.click();
    else console.error("Image upload input element not found.");
  }

async function handleImageUploadInputChange(event) {
    const files = event.target.files; // Allow multiple files
    if (!files || files.length === 0) return;

    if (!currentFilePath || !currentJsonData || !currentFileSha) {
        alert("Please load or select an entry before adding images.");
        if (imageUploadInput) imageUploadInput.value = ""; // Clear input
        return;
    }

    const entryName = currentJsonData.name || "this entry";
    const confirmUpload = confirm(
        `Add ${files.length} image(s) to entry "${entryName}"?`
    );

    if (confirmUpload) {
        // Disable add image button during upload sequence to prevent concurrent complex ops
        if (addImageBtn) addImageBtn.disabled = true;
        if (imageUploadInput) imageUploadInput.disabled = true;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const imageIdForPlaceholder = `pending-${Date.now()}-${i}`; // Unique ID for placeholder

            // 1. Add a placeholder immediately
            const placeholderDiv = createImagePlaceholder(file.name, imageIdForPlaceholder);
            if (imageListContainer && noImageTextElement && placeholderDiv) {
                noImageTextElement.style.display = "none";
                imageListContainer.appendChild(placeholderDiv);
                placeholderDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // 2. Process the upload for this file
            // Pass the placeholder ID so it can be updated
            await uploadImageAndLink(file, imageIdForPlaceholder);
        }

        // Re-enable add image button after all selected files are processed
        if (addImageBtn) addImageBtn.disabled = false;
        if (imageUploadInput) imageUploadInput.disabled = false;
    }
    if (imageUploadInput) imageUploadInput.value = ""; // Clear input after processing or cancellation
}

// Helper to create a placeholder UI element
function createImagePlaceholder(fileName, placeholderId) {
    if (!imageListContainer) return null;

    const container = document.createElement("div");
    container.id = `placeholder-${placeholderId}`;
    container.classList.add('image-placeholder-item'); // Add a class for styling
    container.style.cssText = `
        border: 1px dashed #ccc; 
        padding: 10px; 
        margin-bottom: 15px; 
        background-color: #f9f9f9;
        border-radius: 3px;
        text-align: center;
    `;

    const nameP = document.createElement("p");
    nameP.textContent = fileName;
    nameP.style.fontWeight = "bold";
    nameP.style.margin = "0 0 5px 0";
    nameP.style.wordBreak = "break-all";

    const statusP = document.createElement("p");
    statusP.id = `status-${placeholderId}`;
    statusP.textContent = "Pending upload...";
    statusP.style.fontSize = "0.9em";
    statusP.style.color = "#666";
    statusP.style.margin = "0";

    const spinner = document.createElement('div');
    spinner.classList.add('spinner'); // Use your existing spinner style
    spinner.style.width = '16px';
    spinner.style.height = '16px';
    spinner.style.margin = '5px auto';
    spinner.style.borderWidth = '2px';


    container.appendChild(nameP);
    container.appendChild(spinner);
    container.appendChild(statusP);
    return container;
}



// Helper to update placeholder status
function updatePlaceholderStatus(placeholderId, message, isSuccess, imageUUID = null, newImageDataForMap = null) {
    const placeholderDiv = document.getElementById(`placeholder-${placeholderId}`);
    const statusP = document.getElementById(`status-${placeholderId}`);
    if (!statusP || !placeholderDiv) return;

    const spinner = placeholderDiv.querySelector('.spinner');
    if(spinner) spinner.style.display = 'none'; // Hide spinner once done

    statusP.textContent = message;
    if (isSuccess === true) {
        statusP.style.color = "green";
        placeholderDiv.style.borderColor = "green";
        // If successful and we have the final image data, replace placeholder with actual image display
        if (imageUUID && newImageDataForMap && currentJsonData) { // Ensure currentJsonData is available
            // Remove the placeholder content except its main div
            while (placeholderDiv.firstChild) {
                placeholderDiv.removeChild(placeholderDiv.firstChild);
            }
            placeholderDiv.id = `image-container-${imageUUID}`; // Update ID to reflect actual
            placeholderDiv.classList.remove('image-placeholder-item');
            placeholderDiv.classList.add('image-display-item'); // New class for styling final image
            placeholderDiv.style.cssText = `position: relative; margin-bottom: 15px; border: 1px solid #d4c8b8;`; // Reset style


            const imgElement = document.createElement("img");
            const cacheBustedUrl = `${newImageDataForMap.download_url}?v=${newImageDataForMap.sha}`;
            imgElement.src = cacheBustedUrl;
            imgElement.alt = `Linked image ${newImageDataForMap.name}`;
            imgElement.title = `${newImageDataForMap.name} (UUID: ${imageUUID}) - Click to enlarge`;
            imgElement.style.cssText = `display: block; max-width: 100%; height: auto; border-radius: 3px; background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 0 auto; cursor: pointer;`;
            imgElement.addEventListener("click", () => openImageLightbox(cacheBustedUrl));
            
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "×";
            deleteBtn.title = `Delete image: ${newImageDataForMap.name}`;
            deleteBtn.style.cssText = `position: absolute; top: 2px; right: 2px; background-color: rgba(200, 0, 0, 0.7); color: white; border: 1px solid rgba(100, 0, 0, 0.8); border-radius: 50%; width: 20px; height: 20px; line-height: 18px; text-align: center; font-size: 14px; font-weight: bold; cursor: pointer; padding: 0; z-index: 10;`;
            deleteBtn.dataset.uuid = imageUUID;
            deleteBtn.dataset.filename = newImageDataForMap.name;
            deleteBtn.addEventListener("click", handleDeleteImageClick);

            placeholderDiv.appendChild(deleteBtn);
            placeholderDiv.appendChild(imgElement);
        }

    } else if (isSuccess === false) {
        statusP.style.color = "red";
        placeholderDiv.style.borderColor = "red";
    } else { // Neutral / In progress
        statusP.style.color = "#666";
        if(spinner) spinner.style.display = 'inline-block'; // Show spinner if in progress
    }
}


async function uploadImageAndLink(imageFile, placeholderId) {
    // Ensure current entry context is still valid
    if (!currentFilePath || !currentJsonData || !currentFileSha) {
        updatePlaceholderStatus(placeholderId, "Error: No active entry to link image to.", false);
        return;
    }

    updatePlaceholderStatus(placeholderId, `Reading ${imageFile.name}...`, null); // null for in-progress

    const sanitizedFilenameBase = imageFile.name
        .substring(0, imageFile.name.lastIndexOf("."))
        .replace(/[^a-z0-9\-_]/gi, "_")
        .replace(/_+/g, "_");
    const fileExt = imageFile.name
        .substring(imageFile.name.lastIndexOf(".") + 1)
        .toLowerCase();

    if (!IMAGE_EXTENSIONS.includes(`.${fileExt}`)) {
        updatePlaceholderStatus(placeholderId, `Invalid file type: .${fileExt}`, false);
        return;
    }

    const imageId = crypto.randomUUID ? crypto.randomUUID() : `img-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;
    const imageFileNameWithId = `${imageId}.${fileExt}`;
    const imageFilePathInRepo = `${GITHUB_DATA_PATH}/${GALLERY_FOLDER}/${imageFileNameWithId}`; // Path from repo root
    const metadataFilePathInRepo = `${GITHUB_DATA_PATH}/${GALLERY_FOLDER}/${imageId}.json`;   // Path from repo root

    // Check for conflicts (optional, commitFileToGitHub might handle some cases but good to pre-check)
    const conflictingImage = allFetchedFiles.find(f => f.path === imageFilePathInRepo);
    const conflictingMeta = allFetchedFiles.find(f => f.path === metadataFilePathInRepo);
    if (conflictingImage || conflictingMeta) {
        updatePlaceholderStatus(placeholderId, `Filename conflict for ID ${imageId}. Try again.`, false);
        return;
    }

    try {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile); // Start reading

        await new Promise((resolve, reject) => { // Wait for reader to load
            reader.onload = async (e) => {
                const dataUrl = e.target.result;
                const base64Content = dataUrl.split(",")[1];
                if (!base64Content) {
                    updatePlaceholderStatus(placeholderId, "Error reading image data.", false);
                    reject(new Error("Could not read image data as Base64."));
                    return;
                }

                const now = new Date().toISOString().replace("Z", ".000000Z");

                // --- Step 1: Upload Image File ---
                updatePlaceholderStatus(placeholderId, `Uploading image file ${imageFileNameWithId}...`, null);
                const imageUploadResult = await commitFileToGitHub(
                    imageFilePathInRepo,
                    base64Content,
                    `feat: Upload gallery image - ${imageFileNameWithId}`,
                    null, // No SHA for new file
                    true  // isBinary
                );
                if (!imageUploadResult || !imageUploadResult.sha) {
                    updatePlaceholderStatus(placeholderId, `Failed to upload image file to GitHub.`, false);
                    reject(new Error("Image file upload to GitHub failed."));
                    return;
                }
                console.log("[UPLOAD] Image File Upload Successful:", imageUploadResult.path);
                updatePlaceholderStatus(placeholderId, `Image file uploaded. Creating metadata...`, null);

                // --- Step 2: Create and Upload Metadata File ---
                const imageMetadata = {
                    id: imageId, campaign_id: currentJsonData?.campaign_id || null, name: imageFile.name,
                    ext: fileExt, size: imageFile.size,
                    created_by: currentJsonData?.entity?.created_by || currentJsonData?.created_by || null,
                    created_at: now, updated_at: now, is_default: 0, folder_id: null, is_folder: 0,
                    visibility_id: 1, focus_x: null, focus_y: null, image_folder: null,
                };
                const metadataString = JSON.stringify(imageMetadata, null, 2);
                const metadataUploadResult = await commitFileToGitHub(
                    metadataFilePathInRepo,
                    metadataString,
                    `feat: Create metadata for image - ${imageFileNameWithId}`,
                    null, // No SHA for new file
                    false // not binary
                );
                if (!metadataUploadResult || !metadataUploadResult.sha) {
                    updatePlaceholderStatus(placeholderId, `Failed to upload metadata file to GitHub.`, false);
                    // Consider if you need to delete the already uploaded image file here (cleanup)
                    reject(new Error("Metadata file upload to GitHub failed."));
                    return;
                }
                console.log("[UPLOAD] Metadata Upload Successful:", metadataUploadResult.path);
                updatePlaceholderStatus(placeholderId, `Metadata uploaded. Linking to entry...`, null);

                // --- Update local maps immediately after successful GitHub commits ---
                const newImageDataForMap = {
                    name: imageUploadResult.name, path: imageUploadResult.path, sha: imageUploadResult.sha,
                    download_url: imageUploadResult.download_url || `${RAW_CONTENT_BASE}/${imageUploadResult.path}`, type: "image",
                };
                imageFileMap[imageId] = newImageDataForMap;
                allFetchedFiles.push(newImageDataForMap);
                allFetchedFiles.push({
                    name: metadataUploadResult.name, path: metadataUploadResult.path, sha: metadataUploadResult.sha,
                    download_url: metadataUploadResult.download_url || `${RAW_CONTENT_BASE}/${metadataUploadResult.path}`, type: "json",
                });

                // --- Step 3: Link Image to Entry by Updating Entry JSON ---
                const modifiedJsonData = JSON.parse(JSON.stringify(currentJsonData)); // Deep copy
                if (!modifiedJsonData.entity) modifiedJsonData.entity = {};
                if (!Array.isArray(modifiedJsonData.entity.image_uuids)) {
                    modifiedJsonData.entity.image_uuids = modifiedJsonData.entity.image_uuid ? [modifiedJsonData.entity.image_uuid] : [];
                    delete modifiedJsonData.entity.image_uuid; // Clean up old single field if present
                }
                modifiedJsonData.entity.image_uuids.push(imageId);
                modifiedJsonData.updated_at = now;
                if (modifiedJsonData.entity) modifiedJsonData.entity.updated_at = now;

                const updatedJsonString = JSON.stringify(modifiedJsonData, null, 2);
                const linkCommitMessage = `feat: Link image ${newImageDataForMap.name} to entry - ${modifiedJsonData.name || currentFilePath.split("/").pop()}`;
                
                const linkCommitResult = await commitFileToGitHub(
                    currentFilePath,      // Path of the entry being updated
                    updatedJsonString,
                    linkCommitMessage,
                    currentFileSha        // SHA of the current version of the entry
                );

                if (linkCommitResult && linkCommitResult.sha) {
                    console.log("[UPLOAD] Entry updated successfully with new image link.");
                    // IMPORTANT: Update the current entry's state in memory
                    currentFileSha = linkCommitResult.sha;
                    currentJsonData = modifiedJsonData;
                    contextCache[currentFilePath] = modifiedJsonData; // Update cache

                    // Update SHA in flatJsonData for the main entry file
                    const fileIndex = flatJsonData.findIndex(item => item.path === currentFilePath);
                    if (fileIndex !== -1) {
                        flatJsonData[fileIndex].sha = linkCommitResult.sha;
                    }
                    
                    updatePlaceholderStatus(placeholderId, `Image "${imageFile.name}" added and linked successfully!`, true, imageId, newImageDataForMap);
                    resolve(); // Resolve the promise from reader.onload
                } else {
                    updatePlaceholderStatus(placeholderId, `Image & metadata uploaded, but linking to entry failed.`, false);
                    // More complex: Offer to retry linking, or inform user to manually link.
                    // Potentially delete uploaded image/metadata if linking is critical.
                    reject(new Error("Linking image to entry failed."));
                }
            }; // end of reader.onload

            reader.onerror = (e) => {
                updatePlaceholderStatus(placeholderId, "Error reading file with FileReader.", false);
                reject(new Error("Failed to read image file using FileReader."));
            };
        }); // end of new Promise for reader

    } catch (error) { // Catch errors from the promise chain or other synchronous parts
        console.error("[UPLOAD] Error during image add/link process for file:", imageFile.name, error);
        // The placeholder status might have already been set by a failing step.
        // If not, set a generic error.
        const statusElem = document.getElementById(`status-${placeholderId}`);
        if (statusElem && !statusElem.style.color.includes("red") && !statusElem.style.color.includes("green")) {
             updatePlaceholderStatus(placeholderId, `Operation failed: ${error.message}`, false);
        }
    }
}


  function handleDeleteImageClick(event) {
    const button = event.currentTarget;
    const uuid = button.dataset.uuid;
    const filename = button.dataset.filename || "this image";
    if (!uuid) {
      console.error("Delete button missing UUID.");
      alert("Error: Cannot determine which image to delete.");
      return;
    }
    if (!currentFilePath || !currentJsonData || !currentFileSha) {
      alert("Error: Current entry data not loaded.");
      return;
    }
    const confirmDelete = confirm(
      `DELETE Image?\n\nAre you sure you want to permanently delete the image "${filename}" and remove it from the entry "${
        currentJsonData.name || "current entry"
      }"?\n\nThis cannot be undone.`
    );
    if (confirmDelete) {
      deleteImageFromGitHubAndEntry(uuid);
    }
  }

  async function deleteImageFromGitHubAndEntry(uuid) {
    showLoading(`Deleting image ${uuid}...`);
    const imageData = imageFileMap[uuid];
    const metadataFile = allFetchedFiles.find(
      (f) =>
        f.path &&
        f.path.includes(`/${GALLERY_FOLDER}/`) &&
        f.path.endsWith(`/${uuid}.json`)
    );
    if (!imageData || !imageData.path || !imageData.sha) {
      alert(`Error: Could not find image file data locally for UUID ${uuid}.`);
      hideLoading();
      return;
    }
    if (!metadataFile || !metadataFile.path || !metadataFile.sha) {
      alert(
        `Error: Could not find metadata file data locally for UUID ${uuid}.`
      );
      hideLoading();
      return;
    }
    let imageDeleted = false;
    let metadataDeleted = false;
    try {
      console.log(
        `Attempting to delete image file: ${imageData.path} (SHA: ${imageData.sha})`
      );
      imageDeleted = await deleteFileFromGitHub(
        imageData.path,
        imageData.sha,
        `Delete gallery image: ${imageData.name} (UUID: ${uuid})`
      );
      if (!imageDeleted)
        throw new Error(`Failed to delete image file ${imageData.path}`);
      console.log("Image file deleted successfully.");
      console.log(
        `Attempting to delete metadata file: ${metadataFile.path} (SHA: ${metadataFile.sha})`
      );
      metadataDeleted = await deleteFileFromGitHub(
        metadataFile.path,
        metadataFile.sha,
        `Delete metadata for image: ${imageData.name} (UUID: ${uuid})`
      );
      if (!metadataDeleted)
        throw new Error(`Failed to delete metadata file ${metadataFile.path}`);
      console.log("Metadata file deleted successfully.");
      showLoading(`Updating entry: ${currentJsonData.name}...`);
      const modifiedJsonData = JSON.parse(JSON.stringify(currentJsonData));
      if (
        modifiedJsonData.entity &&
        Array.isArray(modifiedJsonData.entity.image_uuids)
      ) {
        const initialLength = modifiedJsonData.entity.image_uuids.length;
        modifiedJsonData.entity.image_uuids =
          modifiedJsonData.entity.image_uuids.filter((id) => id !== uuid);
        if (modifiedJsonData.entity.image_uuids.length === initialLength) {
          console.warn(`UUID ${uuid} not found in entry's image_uuids array.`);
        }
        const now = new Date().toISOString().replace("Z", ".000000Z");
        modifiedJsonData.updated_at = now;
        if (modifiedJsonData.entity) {
          modifiedJsonData.entity.updated_at = now;
        }
        const updatedJsonString = JSON.stringify(modifiedJsonData, null, 2);
        const linkCommitMessage = `Unlink deleted image (UUID: ${uuid}) from entry: ${
          modifiedJsonData.name || currentFilePath.split("/").pop()
        }`;
        const linkCommitResult = await commitFileToGitHub(
          currentFilePath,
          updatedJsonString,
          linkCommitMessage,
          currentFileSha
        );
        if (linkCommitResult) {
          console.log("Entry updated successfully.");
          currentFileSha = linkCommitResult.sha;
          currentJsonData = modifiedJsonData;
          contextCache[currentFilePath] = modifiedJsonData;
          const isJournal = !!(
            modifiedJsonData.entity &&
            Array.isArray(modifiedJsonData.entity.posts)
          );
          if (isJournal) {
            const separator = "\n<hr />\n";
            htmlEditorTextarea.dataset.concatenatedJournalHtml = (
              modifiedJsonData.entity.posts || []
            )
              .map((p) => p.entry || "")
              .join(separator);
          } else {
            htmlEditorTextarea.dataset.rawHtmlEntry =
              modifiedJsonData.entity?.entry || modifiedJsonData.entry || "";
          }
          const fileIndex = flatJsonData.findIndex(
            (item) => item.path === currentFilePath
          );
          if (fileIndex !== -1) {
            flatJsonData[fileIndex].sha = linkCommitResult.sha;
          }
        } else {
          throw new Error("Failed to save updated entry JSON.");
        }
      } else {
        console.warn(
          "Entry data missing image_uuids array or entity structure."
        );
      }
      delete imageFileMap[uuid];
      allFetchedFiles = allFetchedFiles.filter(
        (f) => f.path !== imageData.path && f.path !== metadataFile.path
      );
      console.log("Local maps and file lists updated.");
      alert(`Image "${imageData.name}" deleted successfully.`);
    } catch (error) {
      console.error("Error during image deletion:", error);
      alert(
        `Image deletion failed: ${error.message}\n\nGitHub state might be inconsistent. Check console and consider refreshing.`
      );
    } finally {
      hideLoading();
      if (currentFilePath) {
        console.log("Reloading current entry view after deletion attempt...");
        loadFileContentAndDisplay(currentFilePath, activeLinkElement);
      }
    }
  }

  function openImageLightbox(imageUrl) {
    if (lightboxImage && imageLightboxModal) {
      console.log("Opening lightbox for:", imageUrl);
      lightboxImage.src = imageUrl;
      imageLightboxModal.style.display = "flex";
    } else {
      console.error("Lightbox elements not found.");
    }
  }

  function closeImageLightbox() {
    if (imageLightboxModal) {
      imageLightboxModal.style.display = "none";
      if (lightboxImage) lightboxImage.src = "";
    }
  }

  async function handleDeleteEntryClick() {
    if (!currentFilePath || !currentJsonData || !currentFileSha) {
      alert("No entry selected to delete.");
      return;
    }
    const entryName = currentJsonData.name || currentFilePath.split("/").pop();
    const imageUUIDs = currentJsonData.entity?.image_uuids || [];
    const imageCount = Array.isArray(imageUUIDs) ? imageUUIDs.length : 0;
    const confirmMessage =
      `DELETE ENTRY AND LINKED IMAGES?\n\n` +
      `Entry: "${entryName}" (${currentFilePath})\n` +
      `This will also attempt to delete ${imageCount} linked image file(s) and their metadata from the gallery.\n\n` +
      `THIS ACTION IS PERMANENT AND CANNOT BE UNDONE.\n\n` +
      `Are you absolutely sure?`;
    if (!confirm(confirmMessage)) {
      return;
    }
    showLoading(`Deleting entry ${entryName} and ${imageCount} images...`);
    let allImagesDeleted = true;
    let imageDeleteErrors = [];
    if (imageCount > 0) {
      console.log(`Starting deletion of ${imageCount} linked images...`);
      for (const uuid of imageUUIDs) {
        const imageData = imageFileMap[uuid];
        const metadataFile = allFetchedFiles.find(
          (f) =>
            f.path &&
            f.path.includes(`/${GALLERY_FOLDER}/`) &&
            f.path.endsWith(`/${uuid}.json`)
        );
        let imgDel = false;
        let metaDel = false;
        if (imageData?.path && imageData?.sha) {
          console.log(`Deleting image file for ${uuid}: ${imageData.path}`);
          imgDel = await deleteFileFromGitHub(
            imageData.path,
            imageData.sha,
            `Delete image (part of entry delete): ${imageData.name}`
          );
          if (!imgDel)
            imageDeleteErrors.push(
              `Failed to delete image file: ${imageData.path}`
            );
        } else {
          console.warn(`Skipping image file delete for ${uuid}: Data missing.`);
        }
        if (metadataFile?.path && metadataFile?.sha) {
          console.log(
            `Deleting metadata file for ${uuid}: ${metadataFile.path}`
          );
          metaDel = await deleteFileFromGitHub(
            metadataFile.path,
            metadataFile.sha,
            `Delete metadata (part of entry delete): ${imageData?.name || uuid}`
          );
          if (!metaDel)
            imageDeleteErrors.push(
              `Failed to delete metadata file: ${metadataFile.path}`
            );
        } else {
          console.warn(
            `Skipping metadata file delete for ${uuid}: Data missing.`
          );
        }
        if (!imgDel || !metaDel) {
          allImagesDeleted = false;
        }
      }
      console.log("Finished image deletion phase.");
    }
    if (!allImagesDeleted) {
      alert(
        "Warning: Some linked images or metadata files could not be deleted. See console for details. Proceeding to delete entry file anyway..."
      );
    }
    console.log(
      `Attempting to delete entry file: ${currentFilePath} (SHA: ${currentFileSha})`
    );
    const entryDeleted = await deleteFileFromGitHub(
      currentFilePath,
      currentFileSha,
      `Delete entry: ${entryName}`
    );
    hideLoading();
    if (entryDeleted) {
      alert(
        `Entry "${entryName}" and associated images (if any) deleted successfully. Refreshing list...`
      );
      if (document.getElementById("renameEntryBtn"))
        document.getElementById("renameEntryBtn").disabled = true;
      currentFilePath = null;
      currentJsonData = null;
      currentFileSha = null;
      activeLinkElement = null;
      currentFileNameH2.textContent = "Select an entry";
      jsonEntryContentDiv.innerHTML = `<p>Entry deleted. Select another entry or refresh.</p>`;
      editorDiv.style.display = "none";
      viewerDiv.style.display = "block";
      imagePreviewSidebar.style.display = "none";
      imageListContainer.innerHTML = "";
      disableAllControls();
      await fetchFileList();
    } else {
      alert(
        `Failed to delete the main entry file "${entryName}". Associated images may or may not have been deleted. Check GitHub and the console. Refresh recommended.`
      );
    }
  }

  // --- Editor and Autocomplete ---
  // All autocomplete functions (handleEditorInput, handleEditorKeyDown, updateAutocompleteSelection,
  // showAutocomplete, positionAutocompletePopup, hideAutocomplete, handleSuggestionClick,
  // handleCreateNewSuggestionClick, replaceMention) have been REMOVED.

  // --- Gemini AI Functions ---
  async function callGeminiApi(prompt, modelId) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR_")) {
      throw new Error("Gemini API Key is missing or invalid.");
    }
    if (!modelId) {
      throw new Error("Gemini model ID not provided.");
    }
    const apiUrl = `${GEMINI_API_BASE_URL}${modelId}:generateContent?key=${GEMINI_API_KEY}`;
    console.log(`Calling Gemini API: ${modelId}`);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        console.error("Gemini API Error Response:", responseData);
        const errorMsg =
          responseData?.error?.message ||
          response.statusText ||
          "Unknown API error";
        throw new Error(`Gemini API Error (${response.status}): ${errorMsg}`);
      }
      if (responseData.candidates && responseData.candidates.length > 0) {
        const candidate = responseData.candidates[0];
        if (candidate.finishReason && candidate.finishReason !== "STOP") {
          console.warn(
            `Gemini candidate finished with reason: ${candidate.finishReason}`
          );
          if (candidate.finishReason === "SAFETY") {
            console.error(
              "Gemini response blocked due to safety settings:",
              candidate.safetyRatings
            );
            throw new Error(
              "Gemini response blocked due to safety settings. Check content/API console."
            );
          }
          if (candidate.finishReason === "MAX_TOKENS") {
            console.warn(
              "Gemini response truncated due to maximum token limit."
            );
          }
        }
        const text = candidate?.content?.parts?.[0]?.text;
        if (typeof text === "string") {
          return text;
        } else {
          console.error(
            "No valid text content found in Gemini candidate:",
            candidate
          );
        }
      }
      console.error(
        "No valid text content found in Gemini response:",
        responseData
      );
      throw new Error("No text content received from Gemini.");
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  }

  async function formatHtmlWithGemini(htmlContent) {
    showLoading("Asking Gemini to format...");
    const formatModel =
      GEMINI_MODELS.find((m) => m.id && m.id.includes("flash"))?.id ||
      GEMINI_MODELS[0]?.id;
    if (!formatModel) {
      alert("No suitable Gemini model found for formatting.");
      hideLoading();
      return null;
    }
    const prompt = `${PROMPT_FORMAT}\n\nHTML:\n${htmlContent}`;
    try {
      const resultText = await callGeminiApi(prompt, formatModel);
      const match = resultText.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
      const formatted = match ? match[1].trim() : resultText.trim();
      hideLoading();
      return formatted;
    } catch (error) {
      alert(`Gemini formatting failed.\n${error.message}`);
      hideLoading();
      return null;
    }
  }

  function openImproveModal() {
    console.log("[IMPROVE MODAL] Opening modal...");
    if (!currentJsonData || !currentFilePath || !fileTree) {
      console.error("[IMPROVE MODAL] Missing current data or file tree.");
      return;
    }
    if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("YOUR_")) {
      alert("Gemini API Key invalid.");
      return;
    }
    if (!Array.isArray(GEMINI_MODELS) || GEMINI_MODELS.length === 0) {
      alert("No Gemini models loaded.");
      console.error("[IMPROVE MODAL] GEMINI_MODELS empty.");
      return;
    }
    const isJournal = !!(
      currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
    );
    const contentForImprovement = getContentForEditingOrAI(isJournal);
    contextTreeRootUl.innerHTML = "";
    improveModalEntryNameSpan.textContent =
      currentJsonData.name || currentFilePath.split("/").pop();
    if (isJournal)
      improveModalEntryNameSpan.textContent += " (Journal - Combined)";
    console.log(
      `[IMPROVE MODAL] Entry: ${improveModalEntryNameSpan.textContent}`
    );
    geminiModelSelect.innerHTML = "";
    console.log("[IMPROVE MODAL] Populating AI models:", GEMINI_MODELS);
    let modelsAdded = 0;
    GEMINI_MODELS.forEach((model) => {
      if (model && model.id && model.name) {
        const option = document.createElement("option");
        option.value = model.id;
        option.textContent = model.name;
        geminiModelSelect.appendChild(option);
        modelsAdded++;
      } else {
        console.warn("[IMPROVE MODAL] Skipping invalid model data:", model);
      }
    });
    console.log(`[IMPROVE MODAL] Added ${modelsAdded} models to dropdown.`);
    if (modelsAdded === 0) {
      console.error("[IMPROVE MODAL] No valid models found!");
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No models available";
      option.disabled = true;
      geminiModelSelect.appendChild(option);
      geminiModelSelect.disabled = true;
      proceedWithImprovementBtn.disabled = true;
      copyPromptBtn.disabled = true;
    } else {
      const defaultModel =
        GEMINI_MODELS.find((m) => m.id && m.id.includes("flash")) ||
        GEMINI_MODELS[0];
      if (defaultModel && defaultModel.id) {
        geminiModelSelect.value = defaultModel.id;
        console.log(
          `[IMPROVE MODAL] Default model selected: ${defaultModel.id}`
        );
      }
      geminiModelSelect.disabled = false;
      proceedWithImprovementBtn.disabled = false;
      copyPromptBtn.disabled = false;
    }
    const contextTreeWithoutCurrent = filterTree(fileTree, currentFilePath);
    renderContextTree(contextTreeWithoutCurrent, contextTreeRootUl);
    updateTokenEstimate(contentForImprovement);
    improveModal.style.display = "block";
    console.log("[IMPROVE MODAL] Modal displayed.");
  }

  function filterTree(nodes, excludePath) {
    return nodes
      .filter((node) => node.path !== excludePath)
      .map((node) => {
        if (node.type === "dir" && node.children) {
          const filteredChildren = filterTree(node.children, excludePath);
          return filteredChildren.length > 0
            ? { ...node, children: filteredChildren }
            : null;
        }
        return node;
      })
      .filter((node) => node !== null);
  }

  function renderContextTree(nodes, parentUlElement) {
    parentUlElement.innerHTML = "";
    nodes.forEach((node) => {
      const li = document.createElement("li");
      li.classList.add(node.type === "dir" ? "folder" : "file");
      const nodeContent = document.createElement("div");
      nodeContent.classList.add("context-node-content");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = false;
      checkbox.id = `context-${node.type}-${node.path.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}`;
      checkbox.dataset.path = node.path;
      checkbox.dataset.type = node.type;
      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = node.name.replace(/\.json$/i, "");
      label.title = node.path;
      if (node.type === "file") {
        const baseTokens = estimateTokens(node.kankaName || node.name);
        checkbox.dataset.baseTokens = baseTokens;
        checkbox.addEventListener("change", updateTokenEstimate);
        nodeContent.appendChild(checkbox);
        nodeContent.appendChild(label);
        li.appendChild(nodeContent);
      } else {
        li.classList.add("collapsed");
        checkbox.addEventListener("change", (e) => {
          const isChecked = e.target.checked;
          const childCheckboxes = li.querySelectorAll(
            ':scope > ul input[type="checkbox"]'
          );
          childCheckboxes.forEach((cb) => (cb.checked = isChecked));
          updateTokenEstimate();
        });
        nodeContent.appendChild(checkbox);
        nodeContent.appendChild(label);
        nodeContent.addEventListener("click", (e) => {
          if (e.target !== checkbox) {
            li.classList.toggle("collapsed");
          }
        });
        li.appendChild(nodeContent);
        const childrenUl = document.createElement("ul");
        if (node.children && node.children.length > 0) {
          renderContextTree(node.children, childrenUl);
        }
        li.appendChild(childrenUl);
      }
      parentUlElement.appendChild(li);
    });
  }

  function updateTokenEstimate(baseContent = null) {
    const isJournal = !!(
      currentJsonData?.entity && Array.isArray(currentJsonData.entity.posts)
    );
    const contentToEstimate =
      baseContent ?? getContentForEditingOrAI(isJournal);
    let totalEstimate = estimateTokens(contentToEstimate);
    const checkboxes = contextTreeRootUl.querySelectorAll(
      'input[type="checkbox"][data-type="file"]:checked'
    );
    checkboxes.forEach((cb) => {
      totalEstimate += parseInt(cb.dataset.baseTokens || "0", 10);
    });
    contextTokenEstimateSpan.textContent = totalEstimate;
  }

  async function improveHtmlWithGeminiContext() {
    if (!currentJsonData || !currentFilePath) {
      alert("Current entry data missing.");
      return;
    }
    const selectedModelId = geminiModelSelect.value;
    if (!selectedModelId) {
      alert("Please select a Gemini model.");
      return;
    }
    const isJournal = !!(
      currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
    );
    const originalContent = getContentForEditingOrAI(isJournal);
    const fileCheckboxes = contextTreeRootUl.querySelectorAll(
      'input[type="checkbox"][data-type="file"]:checked'
    );
    const selectedPaths = Array.from(fileCheckboxes).map(
      (cb) => cb.dataset.path
    );
    if (!originalContent) {
      alert("Cannot get original content.");
      return;
    }
    showModalLoading("Fetching context...");
    let contextText = "";
    let actualContextTokens = 0;
    let failedFetches = 0;
    try {
      const contextFetchPromises = selectedPaths.map(async (path) => {
        try {
          const result = await fetchFileContent(path, true);
          if (result && result.jsonData) {
            const entryText =
              result.jsonData?.entity?.entry ?? result.jsonData?.entry ?? "";
            const entryName = result.jsonData?.name || path.split("/").pop();
            const extractedText = `\n\n--- Context Entry: ${entryName} ---\n${entryText}`;
            contextText += extractedText;
            actualContextTokens += estimateTokens(extractedText);
            return true;
          } else {
            failedFetches++;
            return false;
          }
        } catch (e) {
          console.error(`Failed fetching context for ${path}: ${e}`);
          failedFetches++;
          return false;
        }
      });
      await Promise.all(contextFetchPromises);
    } catch (fetchError) {
      console.error(
        "Error during context fetching for improvement:",
        fetchError
      );
    } finally {
      hideModalLoading();
    }
    if (failedFetches > 0) {
      alert(
        `${failedFetches} context entries failed to load. Proceeding with available context.`
      );
    }
    console.log(`Actual Context Tokens fetched: ${actualContextTokens}`);
    contextTokenEstimateSpan.textContent =
      estimateTokens(originalContent) + actualContextTokens;
    showModalLoading(`Asking ${selectedModelId} to improve...`);
    const fullPrompt = `${PROMPT_IMPROVE_BASE}\n${PROMPT_IMPROVE_CAMPAIGN}${PROMPT_IMPROVE_MAIN_HEADER}\n${originalContent}${PROMPT_IMPROVE_CONTEXT_HEADER}${contextText}${PROMPT_IMPROVE_CONTEXT_FOOTER}`;
    try {
      const resultText = await callGeminiApi(fullPrompt, selectedModelId);
      const match = resultText.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
      const improvedHtml = match ? match[1].trim() : resultText.trim();
      htmlEditorTextarea.value = improvedHtml;
      editingFileNameH2.textContent = `Editing Improved: ${
        currentJsonData?.name || currentFilePath.split("/").pop()
      }`;
      if (isJournal)
        editingFileNameH2.textContent += " (Journal - Combined View)";
      improveModal.style.display = "none";
      switchToEditMode();
      alert("Gemini improvement complete. Review & save.");
    } catch (error) {
      console.error("Gemini improvement error:", error);
      alert(`Gemini improvement failed.\n${error.message}`);
    } finally {
      hideModalLoading();
    }
  }

  async function handleCopyPromptClick() {
    console.log("[COPY PROMPT] Button clicked.");
    if (!currentJsonData || !currentFilePath) {
      alert("Current entry data missing.");
      console.error("[COPY PROMPT] Missing current entry data.");
      return;
    }
    const isJournal = !!(
      currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
    );
    const originalContent = getContentForEditingOrAI(isJournal);
    const fileCheckboxes = contextTreeRootUl.querySelectorAll(
      'input[type="checkbox"][data-type="file"]:checked'
    );
    const selectedPaths = Array.from(fileCheckboxes).map(
      (cb) => cb.dataset.path
    );
    console.log(
      `[COPY PROMPT] Selected context paths: ${selectedPaths.length}`
    );
    if (!originalContent && selectedPaths.length === 0) {
      alert("No content to improve and no context selected.");
      console.warn("[COPY PROMPT] No base content or context.");
      return;
    }
    showModalLoading("Fetching context for prompt...");
    let contextText = "";
    let failedFetches = 0;
    try {
      const contextFetchPromises = selectedPaths.map(async (path) => {
        try {
          const result = await fetchFileContent(path, true);
          if (result && result.jsonData) {
            const entryText =
              result.jsonData?.entity?.entry ?? result.jsonData?.entry ?? "";
            const entryName = result.jsonData?.name || path.split("/").pop();
            contextText += `\n\n--- Context Entry: ${entryName} ---\n${entryText}`;
            return true;
          } else {
            failedFetches++;
            return false;
          }
        } catch (e) {
          console.error(
            `[COPY PROMPT] Failed fetching context for ${path}: ${e}`
          );
          failedFetches++;
          return false;
        }
      });
      await Promise.all(contextFetchPromises);
    } catch (fetchError) {
      console.error("[COPY PROMPT] Error during context fetching:", fetchError);
    } finally {
      hideModalLoading();
    }
    if (failedFetches > 0) {
      alert(
        `${failedFetches} context entries failed to load. Prompt will be copied with available context.`
      );
    }
    const fullPrompt = `${PROMPT_IMPROVE_BASE}\n${PROMPT_IMPROVE_CAMPAIGN}${PROMPT_IMPROVE_MAIN_HEADER}\n${
      originalContent || "(No base content provided)"
    }${PROMPT_IMPROVE_CONTEXT_HEADER}${contextText}${PROMPT_IMPROVE_CONTEXT_FOOTER}`;
    console.log(`[COPY PROMPT] Final prompt length: ${fullPrompt.length}`);
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error(
          "Clipboard API not available in this context (requires HTTPS or localhost)."
        );
      }
      await navigator.clipboard.writeText(fullPrompt);
      console.log("[COPY PROMPT] Prompt successfully copied to clipboard.");
      alert("Full prompt copied to clipboard!");
    } catch (err) {
      console.error("[COPY PROMPT] Failed to copy prompt: ", err);
      alert(
        `Failed to copy prompt to clipboard. Error: ${err.message}\n\nYou might need to copy it manually from the browser console.`
      );
      console.log("--- PROMPT FOR MANUAL COPY ---:\n", fullPrompt);
    }
  }

  async function generatePdf() {
    if (!currentFilePath || !currentJsonData) {
      alert("Please load an entry first.");
      return;
    }
    if (typeof window.jspdf === "undefined") {
      alert("Error: jsPDF library not found.");
      return;
    }
    const { jsPDF } = window.jspdf;
    showLoading("Generating PDF...");
    const entryName =
      currentJsonData.name ||
      currentFilePath
        .split("/")
        .pop()
        .replace(/\.json$/, "");
    const filename = `${entryName}.pdf`;
    let contentHtml = "";
    const isJournal = !!(
      currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
    );
    if (isJournal) {
      console.log("Generating PDF content for Journal");
      const sortedPosts = (currentJsonData.entity.posts || []).sort(
        (a, b) => (a.position || 0) - (b.position || 0)
      );
      sortedPosts.forEach((post) => {
        contentHtml += `<h3>${post.name || "Untitled Post"}</h3>`;
        contentHtml += post.entry || "<p><em>(Empty post)</em></p>";
        contentHtml +=
          '<hr style="border: none; border-top: 1px solid #eee; margin: 4mm 0;">';
      });
      if (!contentHtml) contentHtml = "<p><em>Journal has no posts.</em></p>";
    } else {
      console.log("Generating PDF content for Standard Entry");
      contentHtml =
        currentJsonData?.entity?.entry ??
        currentJsonData?.entry ??
        "<p><em>(Entry content is empty)</em></p>";
    }
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
            if (!response.ok)
              throw new Error(
                `Failed to fetch image ${imageData.name}: ${response.statusText}`
              );
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve({ uuid, dataUrl: reader.result });
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error(
              `Error fetching/converting image ${uuid} (${imageData.name}):`,
              error
            );
            imageFetchErrors++;
            return null;
          }
        } else {
          console.warn(`Skipping image ${uuid} for PDF: Missing data.`);
          imageFetchErrors++;
          return null;
        }
      });
      const results = await Promise.all(imagePromises);
      results.forEach((result) => {
        if (result && result.dataUrl) {
          imageDataUrls.push(result.dataUrl);
        }
      });
      console.log(
        `Successfully converted ${imageDataUrls.length} images to Data URLs for PDF.`
      );
      if (imageFetchErrors > 0) {
        alert(
          `Warning: Failed to load ${imageFetchErrors} image(s) for the PDF.`
        );
      }
    }
    showLoading("Preparing PDF structure...");
    const pdfHtmlString = `
        <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>PDF Source - ${entryName}</title>
        <style>/* ... (Keep your existing PDF styles) ... */</style></head>
        <body><h1>${entryName}</h1>${contentHtml}
            ${
              imageDataUrls.length > 0
                ? `<div class="image-section"><h2>Images</h2>${imageDataUrls
                    .map(
                      (dataUrl) =>
                        `<img class="pdf-image" src="${dataUrl}" alt="Entry Image">`
                    )
                    .join("")}</div>`
                : ""
            }
        </body></html>`;
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const baseFontSizePt = 8;
    pdf.setFontSize(baseFontSizePt);
    const margins = { top: 25, bottom: 25, left: 25, right: 25 };
    const widthInPt = (210 - margins.left - margins.right) * 2.8346;
    const pdfOptions = {
      margin: [margins.top, margins.left, margins.bottom, margins.right],
      autoPaging: "text",
      width: widthInPt,
      windowWidth: widthInPt,
      x: margins.left,
      y: margins.top,
      html2canvas: { scale: 2, useCORS: true, logging: false },
      dompurify: { USE_PROFILES: { html: true } },
    };
    if (typeof window.DOMPurify === "undefined") {
      window.DOMPurify = {
        sanitize: (html) => {
          console.log("Dummy DOMPurify: Bypassing sanitization.");
          return html;
        },
      };
    }
    try {
      showLoading("Rendering HTML to PDF...");
      const tempIframe = document.createElement("iframe");
      tempIframe.style.position = "absolute";
      tempIframe.style.left = "-9999px";
      tempIframe.style.border = "none";
      tempIframe.style.width = `${210 - margins.left - margins.right}mm`;
      document.body.appendChild(tempIframe);
      tempIframe.contentWindow.document.open();
      tempIframe.contentWindow.document.write(pdfHtmlString);
      tempIframe.contentWindow.document.close();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const elementToRender = tempIframe.contentWindow.document.body;
      if (!elementToRender) {
        throw new Error("Could not find body element in iframe.");
      }
      await pdf.html(elementToRender, pdfOptions);
      console.log("pdf.html() processing finished.");
      showLoading("Saving PDF...");
      pdf.save(filename);
      console.log("PDF save initiated.");
      document.body.removeChild(tempIframe);
    } catch (error) {
      console.error("Error during PDF generation with pdf.html():", error);
      alert(
        `PDF Generation Error: ${error.message}\nCheck console for details.`
      );
      const tempIframeOnError = document.querySelector(
        'iframe[style*="-9999px"]'
      );
      if (tempIframeOnError) document.body.removeChild(tempIframeOnError);
    } finally {
      hideLoading();
    }
  }

  function makeResizable(element, resizerElement) {
    let isResizing = false;
    let startX, startWidth;
    if (!element || !resizerElement) return;
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
      const maxW = window.innerWidth - 150;
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

  function setupCreateNewFolderListener() {
  if (createNewFolderBtn) { // createNewFolderBtn is for root folder
      createNewFolderBtn.addEventListener('click', async () => {
          if (!GITHUB_TOKEN) { showApiKeyModal(); return; }
          if (!appConfig || !GITHUB_DATA_PATH) {
              alert("Configuration not loaded or base path is missing.");
              return;
          }
          const folderName = prompt("Enter new folder name (at root of data path):");
          if (folderName && folderName.trim() !== "") {
              const newFolderName = folderName.trim();
              if (newFolderName.includes('/') || newFolderName.includes('.')) {
                  alert("Invalid folder name. Do not use '/' or '.' in the folder name.");
                  return;
              }
              const newFolderPathInRepo = `${GITHUB_DATA_PATH}/${newFolderName}`; // Relative to repo root
              const pathExists = allFetchedFiles.some(item => item.path === newFolderPathInRepo || item.path === `${newFolderPathInRepo}/.gitkeep`);
               if (pathExists) {
                  alert(`A folder or file named "${newFolderName}" already exists at the root of your data path.`);
                  return;
              }
              showLoading(`Creating folder ${newFolderName}...`);
              try {
                  const gitkeepPath = `${newFolderPathInRepo}/.gitkeep`; // Full path from repo root
                  const commitResult = await commitFileToGitHub(gitkeepPath, "", `feat: Create folder ${newFolderName}`);
                  if (commitResult) {
                      alert(`Folder "${newFolderName}" created successfully in '${GITHUB_DATA_PATH}'.`);
                      await fetchFileList();
                  }
              } catch (error) {
                  console.error("Error creating folder:", error);
                  alert(`Error creating folder: ${error.message}`);
              } finally {
                  hideLoading();
              }
          }
      });
  } else {
      console.warn("Create New Folder (Root) button (createNewFolderBtn) not found.");
  }
}

function setupRenameEntryListener() {
  if (renameEntryBtn) {
      renameEntryBtn.addEventListener('click', async () => {
          if (!GITHUB_TOKEN) { showApiKeyModal(); return; }
          if (!currentFilePath || !currentJsonData || !currentFileSha) {
              alert("Cannot rename: No file selected or essential data is missing.");
              return;
          }
          const oldPath = currentFilePath;
          const oldNameWithExt = oldPath.substring(oldPath.lastIndexOf('/') + 1);
          const oldNameWithoutExt = oldNameWithExt.replace(/\.json$/i, '');
          const directory = oldPath.substring(0, oldPath.lastIndexOf('/'));

          let newNameWithoutExt = prompt(`Enter new name for "${oldNameWithoutExt}":`, oldNameWithoutExt);
          if (!newNameWithoutExt || newNameWithoutExt.trim() === "") {
              alert("New name cannot be empty."); return;
          }
          newNameWithoutExt = newNameWithoutExt.trim();
          const sanitizedNewNameBase = newNameWithoutExt.toLowerCase().replace(/[^a-z0-9\-_]+/g, "-").replace(/^-+|-+$/g, "");
          if (!sanitizedNewNameBase) {
              alert("Invalid new name after sanitization."); return;
          }
          const newNameWithExt = `${sanitizedNewNameBase}.json`;
          if (newNameWithExt.toLowerCase() === oldNameWithExt.toLowerCase()) {
              alert("New name is the same as the old name."); return;
          }
          const newPath = directory ? `${directory}/${newNameWithExt}` : newNameWithExt;
          const targetPathExists = flatJsonData.some(item => item.path.toLowerCase() === newPath.toLowerCase());
          if (targetPathExists) {
              alert(`A file named "${newNameWithExt}" already exists. Choose a different name.`); return;
          }

          if (confirm(`Rename "${oldNameWithoutExt}" to "${sanitizedNewNameBase}"?\nWarning: May not update internal links.`)) {
              showLoading(`Renaming ${oldNameWithExt} to ${newNameWithExt}...`);
              try {
                  const oldContentString = JSON.stringify(currentJsonData, null, 2);
                  const createNewResult = await commitFileToGitHub(newPath, oldContentString, `feat: Rename - Create ${newNameWithExt} from ${oldNameWithExt}`);
                  if (!createNewResult || !createNewResult.sha) throw new Error("Failed to create the new file during rename.");
                  
                  const deleteOldResult = await deleteFileFromGitHub(oldPath, currentFileSha, `feat: Rename - Delete old ${oldNameWithExt}`);
                  if (!deleteOldResult) {
                      alert(`CRITICAL: Renamed to "${newNameWithExt}", but FAILED to delete old file "${oldNameWithExt}". Manual cleanup needed.`);
                  } else {
                      alert(`File renamed successfully to "${newNameWithExt}".`);
                  }
                  
                  currentFilePath = newPath;
                  currentFileSha = createNewResult.sha;
                  if (currentJsonData.name && currentJsonData.name === oldNameWithoutExt) {
                      currentJsonData.name = sanitizedNewNameBase;
                  }
                  await fetchFileList();
                  const newFileLi = findFileInTreeByPath(newPath);
                  if (newFileLi) {
                      const linkElement = newFileLi.querySelector('a.node-text');
                      if (linkElement) await loadFileContentAndDisplay(newPath, linkElement);
                  } else {
                      currentFileNameH2.textContent = "Select an entry";
                      jsonEntryContentDiv.innerHTML = "<p>Select an entry.</p>";
                      // disableAppControls might be too broad, consider more specific disabling
                  }
              } catch (error) {
                  console.error("Error renaming file:", error);
                  alert(`Error renaming file: ${error.message}\nCheck repository and console.`);
              } finally {
                  hideLoading();
              }
          }
      });
  } else {
      console.warn("Rename Entry button (renameEntryBtn) not found.");
  }
}

function findFileInTreeByPath(filePathToFind) {
  if (!fileTreeRootUl) return null;
  const links = fileTreeRootUl.querySelectorAll('li.file > .node-content > a.node-text');
  for (const link of links) {
      if (link.dataset.filePath === filePathToFind) {
          return link.closest('li.file');
      }
  }
  return null;
}

function setupReorganizeModalListeners() {
  if (reorganizeEntriesBtn) reorganizeEntriesBtn.addEventListener('click', openReorganizeModal);
  if (closeReorganizeModalBtn) closeReorganizeModalBtn.addEventListener('click', closeReorganizeModal);
  if (cancelReorganizationBtn) cancelReorganizationBtn.addEventListener('click', closeReorganizeModal);
  if (proceedWithReorganizationBtn) proceedWithReorganizationBtn.addEventListener('click', handleProceedWithReorganization);
  if (selectAllReorganizeBtn) selectAllReorganizeBtn.addEventListener('click', () => {
      if(reorganizeSourceItemsSelectorDiv) reorganizeSourceItemsSelectorDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
  });
  if (deselectAllReorganizeBtn) deselectAllReorganizeBtn.addEventListener('click', () => {
      if(reorganizeSourceItemsSelectorDiv) reorganizeSourceItemsSelectorDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  });
}
function openReorganizeModal() { /* ... (Your existing function) ... */ 
    if (!GITHUB_TOKEN) { showApiKeyModal(); return; }
    if (!fileTree || fileTree.length === 0) {
        alert("File list not loaded. Cannot reorganize."); return;
    }
    if (!reorganizeModal) return;
    reorganizeModal.style.display = 'block';
    if(reorganizeStatusMessage) reorganizeStatusMessage.textContent = '';
    selectedTargetFolderForReorg = GITHUB_DATA_PATH; 
    if(selectedTargetFolderPathDisplaySpan) selectedTargetFolderPathDisplaySpan.textContent = 'Root'; 
    populateTargetFolderSelector();
    populateSourceItemsSelectorForReorg();
    if(proceedWithReorganizationBtn) proceedWithReorganizationBtn.disabled = false;
}
function closeReorganizeModal() { /* ... (Your existing function) ... */ 
    if (!reorganizeModal) return;
    reorganizeModal.style.display = 'none';
    if (reorganizeTargetFolderSelectorDiv) {
        const currentSelected = reorganizeTargetFolderSelectorDiv.querySelector('.selected-target');
        if (currentSelected) currentSelected.classList.remove('selected-target');
    }
    selectedTargetFolderForReorg = null;
}
function populateTargetFolderSelector() { /* ... (Your existing function, ensure GITHUB_DATA_PATH is used correctly) ... */ 
    if (!reorganizeTargetFolderSelectorDiv) return;
    reorganizeTargetFolderSelectorDiv.innerHTML = ''; 
    const ul = document.createElement('ul');
    const rootLi = document.createElement('li');
    const rootDiv = document.createElement('div');
    rootDiv.textContent = 'Root (Top Level of Data Path)';
    rootDiv.classList.add('folder-target-item');
    rootDiv.dataset.path = GITHUB_DATA_PATH; 
    if (GITHUB_DATA_PATH === selectedTargetFolderForReorg) { 
        rootDiv.classList.add('selected-target');
    }
    rootDiv.addEventListener('click', (e) => handleTargetFolderSelect(e.currentTarget));
    rootLi.appendChild(rootDiv);
    ul.appendChild(rootLi);

    function renderFolderTreeForTarget(nodes, parentUl) { // Renamed for clarity
        nodes.forEach(node => {
            if (node.type === 'dir') {
                const li = document.createElement('li');
                const div = document.createElement('div');
                let displayFolderName = node.path;
                if (node.path.startsWith(GITHUB_DATA_PATH + '/')) {
                    displayFolderName = node.path.substring(GITHUB_DATA_PATH.length + 1);
                } else if (node.path === GITHUB_DATA_PATH) {
                    return; 
                }
                div.textContent = displayFolderName || node.name; 
                div.title = `Target: ${node.path}`;
                div.classList.add('folder-target-item');
                div.dataset.path = node.path; 
                if (node.path === selectedTargetFolderForReorg) {
                    div.classList.add('selected-target');
                }
                div.addEventListener('click', (e) => handleTargetFolderSelect(e.currentTarget));
                li.appendChild(div);
                parentUl.appendChild(li); 
                if (node.children && node.children.length > 0) {
                    renderFolderTreeForTarget(node.children, parentUl); // Recursive call
                }
            }
        });
    }
    if (fileTree) renderFolderTreeForTarget(fileTree, ul);
    reorganizeTargetFolderSelectorDiv.appendChild(ul);
    // Fallback if no folders found
    if (ul.children.length <= 1 && !ul.querySelector('.folder-target-item[data-path!="' + GITHUB_DATA_PATH + '"]')) { 
        const p = document.createElement('p');
        p.textContent = 'No sub-folders found. You can move items to the Root.';
        if (ul.children.length === 0) { // If even root wasn't added
            const fallbackUl = document.createElement('ul');
            fallbackUl.appendChild(rootLi.cloneNode(true)); // Re-add root if cleared
            reorganizeTargetFolderSelectorDiv.appendChild(fallbackUl);
        }
        reorganizeTargetFolderSelectorDiv.appendChild(p);
    }
}
function handleTargetFolderSelect(selectedDiv) { /* ... (Your existing function) ... */ 
    if (!reorganizeTargetFolderSelectorDiv || !selectedTargetFolderPathDisplaySpan || !proceedWithReorganizationBtn) return;
    const currentSelected = reorganizeTargetFolderSelectorDiv.querySelector('.selected-target');
    if (currentSelected) currentSelected.classList.remove('selected-target');
    selectedDiv.classList.add('selected-target');
    selectedTargetFolderForReorg = selectedDiv.dataset.path;
    let displayPath = selectedTargetFolderForReorg;
    if (displayPath === GITHUB_DATA_PATH) displayPath = "Root";
    else if (displayPath.startsWith(GITHUB_DATA_PATH + '/')) displayPath = displayPath.substring(GITHUB_DATA_PATH.length + 1);
    selectedTargetFolderPathDisplaySpan.textContent = displayPath;
    proceedWithReorganizationBtn.disabled = false;
}
function populateSourceItemsSelectorForReorg() { /* ... (Your existing function, ensure GITHUB_DATA_PATH is used correctly) ... */ 
    if (!reorganizeSourceItemsSelectorDiv) return;
    reorganizeSourceItemsSelectorDiv.innerHTML = '';
    const ul = document.createElement('ul');
    ul.id = 'reorganizeSourceTreeRoot';

    function renderReorgSourceTree(nodes, parentUlElement) {
        nodes.forEach((node) => {
            const li = document.createElement("li");
            li.classList.add(node.type === "dir" ? "folder" : "file");
            const nodeContent = document.createElement("div");
            nodeContent.classList.add("context-node-content");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `reorg-source-${node.type}-${node.path.replace(/[^a-zA-Z0-9]/g, "-")}`;
            checkbox.dataset.path = node.path;
            checkbox.dataset.type = node.type;
            if (node.type === 'file' && node.sha) checkbox.dataset.sha = node.sha;
            const label = document.createElement("label");
            label.htmlFor = checkbox.id;
            let displayName = node.kankaName || node.name.replace(/\.json$/i, "");
            if (node.type === 'file' && node.path.startsWith(GITHUB_DATA_PATH + '/') && node.path !== `${GITHUB_DATA_PATH}/${node.name}`) {
                let parentFolderPath = node.path.substring(GITHUB_DATA_PATH.length + 1, node.path.lastIndexOf('/'));
                if (parentFolderPath) displayName = `${parentFolderPath} / ${displayName}`;
            } else if (node.type === 'dir' && node.path.startsWith(GITHUB_DATA_PATH + '/') && node.path !== `${GITHUB_DATA_PATH}/${node.name}`) {
                let parentFolderPath = node.path.substring(GITHUB_DATA_PATH.length + 1, node.path.lastIndexOf('/'));
                if (parentFolderPath) displayName = `${parentFolderPath} / ${node.name}`; else displayName = node.name;
            }
            label.textContent = displayName;
            label.title = `Item: ${node.path}`;
            if (node.type === "dir") {
                li.classList.add("collapsed");
                checkbox.addEventListener("change", (e) => {
                    const isChecked = e.target.checked;
                    const childCheckboxes = li.querySelectorAll(':scope > ul input[type="checkbox"]');
                    childCheckboxes.forEach((cb) => (cb.checked = isChecked));
                });
                nodeContent.appendChild(checkbox);
                nodeContent.appendChild(label);
                nodeContent.addEventListener("click", (e) => { if (e.target !== checkbox) { li.classList.toggle("collapsed"); } });
                li.appendChild(nodeContent);
                const childrenUl = document.createElement("ul");
                if (node.children && node.children.length > 0) renderReorgSourceTree(node.children, childrenUl);
                li.appendChild(childrenUl);
            } else {
                nodeContent.appendChild(checkbox);
                nodeContent.appendChild(label);
                li.appendChild(nodeContent);
            }
            parentUlElement.appendChild(li);
        });
    }
    if(fileTree) renderReorgSourceTree(fileTree, ul);
    reorganizeSourceItemsSelectorDiv.appendChild(ul);
    if (ul.children.length === 0) reorganizeSourceItemsSelectorDiv.innerHTML = '<p>No items found to move.</p>';
}
async function handleProceedWithReorganization() { /* ... (Your existing function) ... */ 
    if(!reorganizeStatusMessage) return;
    if (!selectedTargetFolderForReorg) {
        reorganizeStatusMessage.textContent = "Error: No target folder selected."; return;
    }
    const selectedItemsToMove = [];
    if(reorganizeSourceItemsSelectorDiv) {
        reorganizeSourceItemsSelectorDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            selectedItemsToMove.push({ path: cb.dataset.path, type: cb.dataset.type, sha: cb.dataset.sha });
        });
    }
    if (selectedItemsToMove.length === 0) {
        reorganizeStatusMessage.textContent = "Error: No files or folders selected to move."; return;
    }
    for (const item of selectedItemsToMove) {
        if (item.type === 'dir' && selectedTargetFolderForReorg.startsWith(item.path)) {
            reorganizeStatusMessage.textContent = `Error: Cannot move folder "${item.path.split('/').pop()}" into itself or a subdirectory.`; return;
        }
        if (item.path === selectedTargetFolderForReorg) {
            reorganizeStatusMessage.textContent = `Error: Cannot move an item into the same folder it's already in.`; return;
        }
    }
    console.log("Selected Target:", selectedTargetFolderForReorg);
    console.log("Items to Move:", selectedItemsToMove);
    reorganizeStatusMessage.textContent = `Moving ${selectedItemsToMove.length} item(s)... (Move logic not yet implemented).`;
    alert("Reorganization (actual file moving) is not yet fully implemented. Selected items and target are logged.");
    // if (reorganizeModalLoadingIndicator) reorganizeModalLoadingIndicator.style.display = 'flex';
    // ...
    // if (reorganizeModalLoadingIndicator) reorganizeModalLoadingIndicator.style.display = 'none';
}


  initialize();
});
