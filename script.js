document.addEventListener("DOMContentLoaded", async () => {
  let appConfig = null;

  // --- DOM Element References ---
  const sidebar = document.getElementById("sidebar");
  const resizer = document.getElementById("resizer");
  const mainContent = document.getElementById("mainContent");
  const containerDiv = document.querySelector(".container"); // Added
  const collapseSidebarBtn = document.getElementById("collapseSidebarBtn"); // Added
  const collapseImagePreviewBtn = document.getElementById("collapseImagePreviewBtn"); // Added
  // imagePreviewSidebar is already defined further down, ensure it's used correctly.
  // sidebar and resizer are defined above.

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
  // Add to your DOM Element References section
  const tokenStatusIndicatorDiv = document.getElementById(
    "tokenStatusIndicator"
  );
  const addEditTokensBtn = document.getElementById("addEditTokensBtn");
  const reorganizeEntriesBtn = document.getElementById("reorganizeEntriesBtn");
  const reorganizeModal = document.getElementById("reorganizeModal");
  const createImagePromptBtn = document.getElementById("createImagePromptBtn");
  const closeReorganizeModalBtn = document.getElementById(
    "closeReorganizeModalBtn"
  );
  const cancelReorganizationBtn = document.getElementById(
    "cancelReorganizationBtn"
  );
  const reorganizeTargetFolderSelectorDiv = document.getElementById(
    "reorganizeTargetFolderSelector"
  );
  const selectedTargetFolderPathDisplaySpan = document.getElementById(
    "selectedTargetFolderPathDisplay"
  );
  const reorganizeSourceItemsSelectorDiv = document.getElementById(
    "reorganizeSourceItemsSelector"
  );
  const selectAllReorganizeBtn = document.getElementById(
    "selectAllReorganizeBtn"
  );
  const deselectAllReorganizeBtn = document.getElementById(
    "deselectAllReorganizeBtn"
  );
  const proceedWithReorganizationBtn = document.getElementById(
    "proceedWithReorganizationBtn"
  );
  const reorganizeModalLoadingIndicator = document.getElementById(
    "reorganizeModalLoadingIndicator"
  );
  const reorganizeStatusMessage = document.getElementById(
    "reorganizeStatusMessage"
  );

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

  const apiKeyModal = document.getElementById("apiKeyModal");
  const githubTokenInput = document.getElementById("githubTokenInput");
  const geminiApiKeyInput = document.getElementById("geminiApiKeyInput");
  const saveApiKeysBtn = document.getElementById("saveApiKeysBtn"); // Modal Save
  const clearKeysBtn = document.getElementById("clearKeysBtn");

  const improveModal = document.getElementById("improveModal");
  const closeImproveModalBtnElem = document.getElementById(
    "closeImproveModalBtn"
  ); // Renamed to avoid conflict
  const contextSelectionListDiv = document.getElementById(
    "contextSelectionList"
  ); // Used?
  const contextTreeRootUl = document.getElementById("contextTreeRoot");
  const selectAllContextBtn = document.getElementById("selectAllContextBtn");
  const deselectAllContextBtn = document.getElementById(
    "deselectAllContextBtn"
  );
  const contextTokenEstimateSpan = document.getElementById(
    "contextTokenEstimate"
  );
  const proceedWithImprovementBtn = document.getElementById(
    "proceedWithImprovementBtn"
  );
  const cancelImprovementBtn = document.getElementById("cancelImprovementBtn"); // Modal Cancel
  const copyPromptBtn = document.getElementById("copyPromptBtn");
  const improveModalEntryNameSpan = document.getElementById(
    "improveModalEntryName"
  );
  const modalLoadingIndicator = document.getElementById(
    "modalLoadingIndicator"
  ); // Modal loading

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

  // ...
  let GITHUB_READ_TOKEN = null; // For the default or initial read token
  let GITHUB_WRITE_TOKEN = null; // For user-provided write token (from sessionStorage)
  let GEMINI_API_KEY = null; // From sessionStorage

  // --- Constants (populated from config) ---
  const MOBILE_BREAKPOINT = 768; // Added
  let GITHUB_USERNAME,
    GITHUB_REPO,
    GITHUB_DATA_PATH,
    GITHUB_BRANCH,
    GALLERY_FOLDER;
  let GEMINI_API_BASE_URL,
    GEMINI_MODELS = [];

  let API_BASE_URL, RAW_CONTENT_BASE;
  let PROMPT_FORMAT,
    PROMPT_IMPROVE_BASE,
    PROMPT_IMPROVE_CAMPAIGN,
    PROMPT_IMPROVE_CONTEXT_HEADER,
    PROMPT_IMPROVE_CONTEXT_FOOTER,
    PROMPT_IMPROVE_MAIN_HEADER;
  const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

  // --- Sidebar Collapse Functions ---
  function toggleMainSidebar(collapse, isInitialLoad = false) {
    if (!sidebar || !containerDiv || !resizer || !collapseSidebarBtn) {
      console.error("Error: Main sidebar toggle components not found.");
      return;
    }

    const screenWidth = window.innerWidth;

    if (screenWidth <= MOBILE_BREAKPOINT) {
      // Mobile behavior
      let actuallyCollapsingMobile;
      if (typeof collapse === 'boolean') {
        actuallyCollapsingMobile = collapse;
      } else {
        actuallyCollapsingMobile = !sidebar.classList.contains("mobile-collapsed");
      }

      if (!isInitialLoad) console.log(`[SIDEBAR_MOBILE] Toggling main sidebar. Collapsing: ${actuallyCollapsingMobile}`);

      sidebar.classList.toggle("mobile-collapsed", actuallyCollapsingMobile);
      // Ensure desktop classes are removed on mobile
      sidebar.classList.remove("sidebar-is-collapsed");
      containerDiv.classList.remove("sidebar-is-collapsed");
      if (resizer) resizer.style.display = "none"; // Resizer typically hidden on mobile by CSS

      localStorage.setItem("sidebarMobileCollapsed", actuallyCollapsingMobile ? "true" : "false");
      // Clear desktop local storage if we are on mobile to avoid confusion on resize
      // localStorage.removeItem("sidebarCollapsed");
      collapseSidebarBtn.textContent = actuallyCollapsingMobile ? "☰" : "✕"; // Hamburger/Close icons

    } else {
      // Desktop behavior
      let actuallyCollapsingDesktop;
      if (typeof collapse === 'boolean') {
        actuallyCollapsingDesktop = collapse;
      } else {
        actuallyCollapsingDesktop = !sidebar.classList.contains("sidebar-is-collapsed");
      }

      if (!isInitialLoad) console.log(`[SIDEBAR_DESKTOP] Toggling main sidebar. Collapsing: ${actuallyCollapsingDesktop}`);

      sidebar.classList.toggle("sidebar-is-collapsed", actuallyCollapsingDesktop);
      containerDiv.classList.toggle("sidebar-is-collapsed", actuallyCollapsingDesktop);
      if (resizer) resizer.style.display = actuallyCollapsingDesktop ? "none" : "flex";

      localStorage.setItem("sidebarCollapsed", actuallyCollapsingDesktop ? "true" : "false");
      // Ensure mobile class is removed on desktop
      sidebar.classList.remove("mobile-collapsed");
      // Clear mobile local storage if we are on desktop
      // localStorage.removeItem("sidebarMobileCollapsed");
      collapseSidebarBtn.textContent = actuallyCollapsingDesktop ? "»" : "«"; // Arrows for desktop
    }
  }

  function toggleImagePreviewSidebar(collapse, isInitialLoad = false) {
    if (!imagePreviewSidebar || !collapseImagePreviewBtn) {
        console.error("Error: Image preview sidebar toggle components not found.");
        return;
    }
    // Ensure imagePreviewSidebar is defined (it's declared later in the original script)
    // For safety, could re-get it here if there's doubt:
    // const imagePreviewSidebar = document.getElementById("imagePreviewSidebar");
    // const collapseImagePreviewBtn = document.getElementById("collapseImagePreviewBtn");

    const actuallyCollapsing = typeof collapse === 'boolean' ? collapse : !imagePreviewSidebar.classList.contains("collapsed");

    if (!isInitialLoad) console.log(`[SIDEBAR] Toggling image preview. Collapsing: ${actuallyCollapsing}`);
    
    imagePreviewSidebar.classList.toggle("collapsed", actuallyCollapsing);
    // Optional: Add class to mainContentWrapper if specific styling needed beyond flex auto-adjust
    // const mainContentWrapper = document.querySelector('.main-content-wrapper');
    // if (mainContentWrapper) mainContentWrapper.classList.toggle("image-sidebar-collapsed", actuallyCollapsing);
    localStorage.setItem("imagePreviewSidebarCollapsed", actuallyCollapsing ? "true" : "false");
    collapseImagePreviewBtn.textContent = actuallyCollapsing ? "«" : "»";
  }

  // --- CORE CONTROLS SETUP (API Modal, Clear Keys) ---
  function setupCoreControls() {
    if (saveApiKeysBtn) {
      saveApiKeysBtn.addEventListener("click", async () => {
        const ghWriteToken = githubTokenInput.value.trim();
        const gemKey = geminiApiKeyInput.value.trim();

        // --- MODIFIED SECTION for sessionStorage ---
        if (ghWriteToken) {
          sessionStorage.setItem("kankaEditor_githubWriteToken", ghWriteToken);
          GITHUB_WRITE_TOKEN = ghWriteToken; // Update global variable
          console.log("[KEYS] GitHub Write Token saved to sessionStorage.");
        } else {
          // If input is empty, remove it from session storage if it was there
          if (sessionStorage.getItem("kankaEditor_githubWriteToken")) {
            sessionStorage.removeItem("kankaEditor_githubWriteToken");
            GITHUB_WRITE_TOKEN = null; // Clear global variable
            console.log("[KEYS] GitHub Write Token cleared from sessionStorage by user.");
          }
        }

        if (gemKey) {
          sessionStorage.setItem("kankaEditor_geminiApiKey", gemKey);
          GEMINI_API_KEY = gemKey; // Update global variable
          console.log("[KEYS] Gemini API Key saved to sessionStorage.");
        } else {
          // If input is empty, remove it from session storage if it was there
          if (sessionStorage.getItem("kankaEditor_geminiApiKey")) {
            sessionStorage.removeItem("kankaEditor_geminiApiKey");
            GEMINI_API_KEY = null; // Clear global variable
            console.log("[KEYS] Gemini API Key cleared from sessionStorage by user.");
          }
        }
        // --- END MODIFIED SECTION ---

        hideApiKeyModal();
        updateTokenStatusDisplay(); 
        updateButtonStatesBasedOnTokens();
        
        // If app hasn't fully initialized (no data) and we now have a token, proceed
        if (!flatJsonData.length && (GITHUB_READ_TOKEN || GITHUB_WRITE_TOKEN)) {
            await proceedWithAppInitialization(false); 
        }
      });
    }
    
    if (clearKeysBtn) {
      clearKeysBtn.addEventListener("click", () => {
        if (
          confirm(
            "Clear all API keys (Write GitHub, Gemini) from this session?"
          )
        ) {
          // --- MODIFIED SECTION for sessionStorage ---
          sessionStorage.removeItem("kankaEditor_githubWriteToken");
          sessionStorage.removeItem("kankaEditor_geminiApiKey");
          // --- END MODIFIED SECTION ---

          GITHUB_WRITE_TOKEN = null;
          GEMINI_API_KEY = null;
          // GITHUB_READ_TOKEN (from config) is not cleared from session, it's part of appConfig
          if (githubTokenInput) githubTokenInput.value = "";
          if (geminiApiKeyInput) geminiApiKeyInput.value = "";
          alert(
            "User-provided API Keys cleared from session. Default read token (if any) still active. Reloading."
          );
          location.reload(); // Reload to ensure state is clean
        }
      });
    }

    if (addEditTokensBtn) {
      addEditTokensBtn.addEventListener("click", () => {
        // When this button is clicked, we always want to prompt for both,
        // focusing on the GitHub write token.
        // The showApiKeyModal logic will pre-fill if values exist.
        showApiKeyModal(true, false, "write_action"); // true for GitHub (write), false for Gemini, context
      });
    }
  }

  // --- APP FEATURE EVENT LISTENERS SETUP ---
  function setupAppEventListeners() {
    console.log(
      "[SETUP_APP] Setting up application-specific event listeners..."
    );

    // Inside setupAppEventListeners()

    if (refreshFileListBtn) {
      refreshFileListBtn.addEventListener("click", async () => {
        // Check if ANY GitHub token is available for reading
        if (!GITHUB_READ_TOKEN && !GITHUB_WRITE_TOKEN) {
          alert(
            "A GitHub API Token is required to refresh the list. Please provide one."
          );
          // true for GitHub required (could be read or write), false for Gemini, general context
          showApiKeyModal(true, false, "general");
          return;
        }
        // fetchFileList will internally use getGitHubHeaders(false) which prioritizes write token then read token
        await fetchFileList();
      });
    }

    if (createNewFileBtn) {
      createNewFileBtn.addEventListener("click", () => {
        // Creating a new file is a WRITE operation, requires GITHUB_WRITE_TOKEN
        if (!GITHUB_WRITE_TOKEN) {
          alert(
            "A GitHub token with write permissions is required to create a new entry. Please provide one."
          );
          // true for GitHub (write) required, false for Gemini, context for write action
          showApiKeyModal(true, false, "write_action");
          return;
        }
        const newFileNameBase = prompt(
          "Enter name for new entry (creates file in root of data path):"
        );
        if (newFileNameBase && newFileNameBase.trim() !== "") {
          // Check for non-empty after trim
          // handleCreateNewEntry will call commitFileToGitHub, which uses getGitHubHeaders(true)
          handleCreateNewEntry(newFileNameBase.trim(), GITHUB_DATA_PATH);
        }
      });
    }

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        if (!currentJsonData || !currentFilePath) return;
        const isJournal = !!(
          currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
        );
        const contentToEdit = getContentForEditingOrAI(isJournal);
        htmlEditorTextarea.value = contentToEdit;
        htmlEditorTextarea.disabled = false;
        editingFileNameH2.textContent = `Editing: ${
          currentJsonData?.name || currentFilePath.split("/").pop()
        }`;
        if (isJournal)
          editingFileNameH2.textContent += " (Journal - Combined View)";
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
          alert(
            "Gemini API Key is required for AI formatting. Please provide it."
          );
          return;
        }
        if (!currentFilePath || !currentJsonData) {
          alert("Load an entry first.");
          return;
        }
        const isJournal = !!(
          currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
        );
        const originalHtml = getContentForEditingOrAI(isJournal);
        if (originalHtml === null || typeof originalHtml === "undefined") {
          alert(
            "Cannot get content to format. Content might be empty or not loaded."
          );
          return;
        }
        const formattedHtml = await formatHtmlWithGemini(originalHtml);
        if (formattedHtml !== null) {
          htmlEditorTextarea.value = formattedHtml;
          editingFileNameH2.textContent = `Editing Formatted: ${
            currentJsonData?.name || currentFilePath.split("/").pop()
          }`;
          if (isJournal)
            editingFileNameH2.textContent += " (Journal - Combined View)";
          switchToEditMode();
          alert("Gemini formatting complete. Review & save.");
        }
      });
    }

    // Inside setupAppEventListeners()

    if (createImagePromptBtn) {
      createImagePromptBtn.addEventListener(
        "click",
        generateImagePromptWithGemini
      );
    }

    if (improveBtn) {
      improveBtn.addEventListener("click", () => {
        if (!GEMINI_API_KEY) {
          alert(
            "Gemini API Key is required for AI improvement. Please provide it."
          );
          return;
        }
        openImproveModal();
      });
    }

    if (saveBtn) {
      // Editor Save
      saveBtn.addEventListener("click", async () => {
        if (!currentJsonData || !currentFilePath || !currentFileSha) {
          alert("No file loaded/SHA missing. Cannot save.");
          return;
        }
        const isJournal = !!(
          currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
        );
        const editedContent = htmlEditorTextarea.value;
        const modifiedJsonData = JSON.parse(JSON.stringify(currentJsonData));
        const now = new Date().toISOString().replace("Z", ".000000Z");
        modifiedJsonData.updated_at = now;
        if (modifiedJsonData.entity) modifiedJsonData.entity.updated_at = now;

        if (isJournal) {
          if (!modifiedJsonData.entity) modifiedJsonData.entity = {};
          if (!Array.isArray(modifiedJsonData.entity.posts))
            modifiedJsonData.entity.posts = [];
          if (modifiedJsonData.entity.posts.length === 0) {
            modifiedJsonData.entity.posts.push({
              id: null,
              name: "Combined Content",
              entry: editedContent,
              created_at: now,
              updated_at: now,
              is_private: modifiedJsonData.is_private || 0,
              entity_id: modifiedJsonData.entity.id,
              created_by: modifiedJsonData.entity.created_by,
              visibility_id: 1,
              is_pinned: 0,
              position: 1,
              settings: null,
            });
          } else {
            modifiedJsonData.entity.posts[0].entry = editedContent;
            modifiedJsonData.entity.posts[0].updated_at = now;
          }
        } else {
          if (
            modifiedJsonData?.entity &&
            typeof modifiedJsonData.entity.entry !== "undefined"
          ) {
            modifiedJsonData.entity.entry = editedContent;
          } else if (typeof modifiedJsonData.entry !== "undefined") {
            modifiedJsonData.entry = editedContent;
          } else {
            modifiedJsonData.entry = editedContent;
          }
        }
        const updatedJsonString = JSON.stringify(modifiedJsonData, null, 2);
        const commitMessage = `Update entry: ${
          modifiedJsonData.name || currentFilePath.split("/").pop()
        }`;
        const commitResult = await commitFileToGitHub(
          currentFilePath,
          updatedJsonString,
          commitMessage,
          currentFileSha
        );
        if (commitResult) {
          currentFileSha = commitResult.sha;
          currentJsonData = modifiedJsonData;
          contextCache[currentFilePath] = modifiedJsonData;
          if (isJournal) {
            const separator = "\n<hr />\n";
            const updatedConcatenatedHtml = (
              modifiedJsonData.entity.posts || []
            )
              .map((p) => p.entry || "")
              .join(separator);
            htmlEditorTextarea.dataset.concatenatedJournalHtml =
              updatedConcatenatedHtml;
            renderJournalContent(modifiedJsonData.entity.posts || []);
          } else {
            htmlEditorTextarea.dataset.rawHtmlEntry = editedContent;
            renderHtmlEntry(editedContent);
          }
          const fileIndex = flatJsonData.findIndex(
            (item) => item.path === currentFilePath
          );
          if (fileIndex !== -1) flatJsonData[fileIndex].sha = commitResult.sha;
          switchToViewMode();
          alert(`Saved '${modifiedJsonData.name}' to GitHub.`);
        }
      });
    }

    if (cancelBtn) {
      // Editor Cancel
      cancelBtn.addEventListener("click", () => {
        if (!currentJsonData) {
          switchToViewMode();
          return;
        }
        const isJournal = !!(
          currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
        );
        if (isJournal) {
          renderJournalContent(currentJsonData.entity.posts || []);
        } else {
          const rawHtmlEntry =
            htmlEditorTextarea.dataset.rawHtmlEntry ||
            currentJsonData?.entity?.entry ||
            currentJsonData?.entry ||
            "";
          renderHtmlEntry(rawHtmlEntry);
        }
        switchToViewMode();
      });
    }

    if (addImageBtn) addImageBtn.addEventListener("click", handleAddImageClick);
    if (imageUploadInput)
      imageUploadInput.addEventListener("change", handleImageUploadInputChange);

    if (closeImproveModalBtnElem)
      closeImproveModalBtnElem.onclick = () => {
        if (improveModal) improveModal.style.display = "none";
      };
    if (cancelImprovementBtn)
      cancelImprovementBtn.onclick = () => {
        if (improveModal) improveModal.style.display = "none";
      };

    if (selectAllContextBtn) {
      selectAllContextBtn.onclick = () => {
        if (contextTreeRootUl)
          contextTreeRootUl
            .querySelectorAll('input[type="checkbox"]')
            .forEach((cb) => (cb.checked = true));
        updateTokenEstimate();
      };
    }
    if (deselectAllContextBtn) {
      deselectAllContextBtn.onclick = () => {
        if (contextTreeRootUl)
          contextTreeRootUl
            .querySelectorAll('input[type="checkbox"]')
            .forEach((cb) => (cb.checked = false));
        updateTokenEstimate();
      };
    }
    if (proceedWithImprovementBtn)
      proceedWithImprovementBtn.onclick = improveHtmlWithGeminiContext;
    if (copyPromptBtn) copyPromptBtn.onclick = handleCopyPromptClick;

    if (closeLightboxBtn) closeLightboxBtn.onclick = closeImageLightbox;
    if (imageLightboxModal)
      imageLightboxModal.onclick = (event) => {
        if (event.target === imageLightboxModal) closeImageLightbox();
      };

    // Calls to setup more complex listener groups
    setupCreateNewFolderListener();
    setupRenameEntryListener();
    setupReorganizeModalListeners();

    // Add sidebar collapse button listeners
    if (collapseSidebarBtn) {
        collapseSidebarBtn.addEventListener("click", () => toggleMainSidebar());
    } else {
        console.warn("collapseSidebarBtn not found during setupAppEventListeners.");
    }

    if (collapseImagePreviewBtn) {
        collapseImagePreviewBtn.addEventListener("click", () => toggleImagePreviewSidebar());
    } else {
        console.warn("collapseImagePreviewBtn not found during setupAppEventListeners.");
    }

    console.log(
      "[SETUP_APP] Application-specific event listeners setup complete."
    );
  }

  // --- INITIALIZATION FLOW ---
  // --- INITIALIZATION FLOW ---
  async function initialize() {
    console.log("[INIT] Starting initialization...");
    setupCoreControls(); // Setup modal buttons, clear keys

    try {
      await loadConfig(); // Load base config (this might set GITHUB_READ_TOKEN)
      console.log("[INIT] Base config loaded into appConfig.");

      // --- MODIFIED PART (loading from config) ---
      // (Your existing logic for GITHUB_READ_TOKEN from config parts or single field)
      // ... (this part remains the same as you provided)

      // --- NEW: Load GITHUB_WRITE_TOKEN and GEMINI_API_KEY from sessionStorage ---
      const sessionWriteToken = sessionStorage.getItem("kankaEditor_githubWriteToken");
      if (sessionWriteToken) {
          GITHUB_WRITE_TOKEN = sessionWriteToken;
          console.log("[INIT] GitHub Write Token loaded from sessionStorage.");
      }
      const sessionGeminiKey = sessionStorage.getItem("kankaEditor_geminiApiKey");
      if (sessionGeminiKey) {
          GEMINI_API_KEY = sessionGeminiKey;
          console.log("[INIT] Gemini API Key loaded from sessionStorage.");
      }
      // --- END NEW ---

      updateTokenStatusDisplay(); // Initial display based on what was loaded

      // Determine if we can proceed with initial (read-only) load
      if (GITHUB_READ_TOKEN || GITHUB_WRITE_TOKEN) {
        await proceedWithAppInitialization(true); // true for initial read-only load
      } else {
        // No default read token and no user-provided write token in session.
        console.log("[INIT] No GitHub token available. Prompting for a token.");
        showApiKeyModal(true, false, "general"); // Prompt for GitHub token (true), Gemini optional (false initially)
      }
    } catch (error) {
      console.error("[INIT] Initialization failed:", error);
      showError(`Initialization failed: ${error.message}.`);
      disableAppControls();
      if (clearKeysBtn) clearKeysBtn.disabled = false;
      updateTokenStatusDisplay(); // Final update of status
    }
  }
  async function proceedWithAppInitialization(isReadOnlyLoad = false) {
    console.log(`[PROCEED_INIT] Proceeding. Read-only load: ${isReadOnlyLoad}`);

    // Set API URLs (these depend on config, not tokens directly)
    API_BASE_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents`;
    RAW_CONTENT_BASE = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${GITHUB_BRANCH}`;
    if (repoNameSpan)
      repoNameSpan.textContent = `${GITHUB_USERNAME}/${GITHUB_REPO}`;
    if (repoPathSpan) repoPathSpan.textContent = `/${GITHUB_DATA_PATH}`;

    // Setup listeners and resizer functionality before trying to load states
    setupAppEventListeners();
    if (sidebar && resizer) makeResizable(sidebar, resizer);

    // Load sidebar states from localStorage
    const screenWidthInitial = window.innerWidth;
    if (screenWidthInitial <= MOBILE_BREAKPOINT) {
      const mobileCollapsed = localStorage.getItem("sidebarMobileCollapsed") === "true";
      toggleMainSidebar(mobileCollapsed, true);
      // Optional: Default to expanded on mobile initial load, regardless of storage
      // toggleMainSidebar(false, true);
      // localStorage.setItem("sidebarMobileCollapsed", "false");
    } else {
      const desktopCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
      // Default to expanded on desktop initial load if nothing is stored
      // toggleMainSidebar(desktopCollapsed || false, true);
      // Forcing expanded on initial desktop load for now, as per original logic for desktop:
      toggleMainSidebar(false, true);
      localStorage.setItem("sidebarCollapsed", "false");
    }

    // Image preview sidebar can still respect localStorage
    if (localStorage.getItem('imagePreviewSidebarCollapsed') === 'true') {
        toggleImagePreviewSidebar(true, true);
    }
    // Ensure button text is correct after initial load based on state - toggleMainSidebar now handles this.
    // if (collapseSidebarBtn && sidebar) collapseSidebarBtn.textContent = sidebar.classList.contains("collapsed") ? "»" : "«";
    // if (collapseImagePreviewBtn && imagePreviewSidebar) collapseImagePreviewBtn.textContent = imagePreviewSidebar.classList.contains("collapsed") ? "«" : "»";


    if (isReadOnlyLoad) {
        // setupAppEventListeners(); // Moved up
        // if (sidebar && resizer) makeResizable(sidebar, resizer); // Moved up
        console.log("[PROCEED_INIT] Fetching initial file list...");
        await fetchFileList(); // This populates flatJsonData

        // After file list is loaded, try to load from URL and set up listener
        await loadEntryFromURL(); // Load entry based on initial URL hash
        window.addEventListener('hashchange', loadEntryFromURL);

    } else {
        console.log("[PROCEED_INIT] API keys possibly updated. Re-evaluating UI and fetching list.");
        updateButtonStatesBasedOnTokens();
        await fetchFileList();
        
        // Also handle URL loading and listener if not already done
        if (!window.onhashchange) { // Simple check if listener already added
             await loadEntryFromURL();
             window.addEventListener('hashchange', loadEntryFromURL);
        }
    }
    console.log("[PROCEED_INIT] Application initialization/update complete.");
    if (clearKeysBtn) clearKeysBtn.disabled = false;
}

  let PROMPT_IMAGE_GENERATION; // Declare it with other prompt variables

  // --- Configuration Loading ---
  async function loadConfig() {
    try {
      console.log("[CONFIG] Fetching config.json...");
      const response = await fetch("config.json");
      if (!response.ok)
        throw new Error(
          `Failed to fetch config.json: ${response.status} ${response.statusText}`
        );
      appConfig = await response.json();
      if (!appConfig.github || !appConfig.gemini || !appConfig.prompts)
        throw new Error("config.json is missing required top-level keys.");
      console.log("[CONFIG] config.json loaded successfully.");

      GITHUB_USERNAME = appConfig.github.USERNAME;
      GITHUB_REPO = appConfig.github.REPO;
      GITHUB_DATA_PATH = appConfig.github.DATA_PATH;
      GITHUB_BRANCH = appConfig.github.BRANCH;
      GALLERY_FOLDER = appConfig.github.GALLERY_FOLDER;
      // DEFAULT_READ_TOKEN is read in initialize() directly from appConfig
      // User-provided tokens (write, gemini) come from sessionStorage

      GEMINI_API_BASE_URL = appConfig.gemini.API_BASE_URL;
      GEMINI_MODELS = Array.isArray(appConfig.gemini.MODELS)
        ? appConfig.gemini.MODELS
        : [];

      PROMPT_FORMAT = appConfig.prompts.format;
      PROMPT_IMPROVE_BASE = appConfig.prompts.improve_base;
      PROMPT_IMPROVE_CAMPAIGN = appConfig.prompts.improve_campaign_context;
      PROMPT_IMPROVE_CONTEXT_HEADER = appConfig.prompts.improve_context_header;
      PROMPT_IMPROVE_CONTEXT_FOOTER = appConfig.prompts.improve_context_footer;
      PROMPT_IMPROVE_MAIN_HEADER =
        appConfig.prompts.improve_main_content_header;
      PROMPT_IMAGE_GENERATION = appConfig.prompts.image_generation; // <-- ADD THIS

      if (!PROMPT_IMAGE_GENERATION) {
        console.warn(
          "[CONFIG] 'image_generation' prompt is missing from config.json. Using a default."
        );
        PROMPT_IMAGE_GENERATION =
          "Based on the following article content, create a concise yet detailed prompt suitable for an AI image generation model. The prompt should capture the essence of the article, focusing on visual elements, atmosphere, key subjects, and artistic style if applicable. Aim for a prompt that an AI can use to generate a compelling and representative image. Output ONLY the image prompt itself, without any introductory text or explanations.";
      }
    } catch (error) {
      console.error("[CONFIG] Error loading or parsing config.json:", error);
      throw error;
    }
  }

  async function generateImagePromptWithGemini() {
    if (!GEMINI_API_KEY) {
      alert(
        "Gemini API Key is required to generate an image prompt. Please provide it."
      );
      showApiKeyModal(false, true, "ai_action"); // Gemini required
      return;
    }
    if (!currentFilePath || !currentJsonData) {
      alert("Please load an entry first.");
      return;
    }

    const isJournal = !!(
      currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
    );
    const articleContent = getContentForEditingOrAI(isJournal);

    if (!articleContent || articleContent.trim() === "") {
      alert(
        "The current entry content is empty. Cannot generate an image prompt."
      );
      return;
    }

    // Use a suitable model, preferably one good for creative text generation.
    // Gemini 2.0 Flash might be okay, or a more general model if available in your config.
    const modelForPrompting =
      GEMINI_MODELS.find(
        (m) =>
          m.id &&
          (m.id.includes("gemini-2.0-flash") ||
            m.id.includes("gemini-1.5-flash"))
      )?.id || GEMINI_MODELS[0]?.id;

    if (!modelForPrompting) {
      alert(
        "No suitable Gemini model found for image prompt generation. Check config.json."
      );
      return;
    }

    showLoading(
      `Asking Gemini (${modelForPrompting
        .split("/")
        .pop()}) for an image prompt...`
    );

    const fullPrompt = `${PROMPT_IMAGE_GENERATION}\n\n--- Article Content Start ---\n${articleContent}\n--- Article Content End ---`;

    try {
      const generatedPrompt = await callGeminiApi(
        fullPrompt,
        modelForPrompting
      );

      // Attempt to display it nicely
      const modalContent = `
            <div style="margin-bottom: 15px;">
                <strong>Suggested Image Prompt:</strong>
                <textarea id="generatedImagePromptTextarea" style="width: 98%; height: 150px; margin-top: 5px; padding: 5px; font-family: monospace; border: 1px solid #ccc; border-radius: 3px;" readonly>${generatedPrompt.trim()}</textarea>
            </div>
            <div style="text-align: right;">
                <button id="copyGeneratedPromptBtn" style="padding: 8px 15px; background-color: #8c4b31; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 10px;">Copy Prompt</button>
                <button id="closePromptModalBtn" style="padding: 8px 15px;">Close</button>
            </div>
        `;

      // Create a simple modal for this
      const promptModal = document.createElement("div");
      promptModal.id = "imagePromptDisplayModal";
      promptModal.classList.add("modal");
      promptModal.style.display = "block"; // Show it

      const promptModalContent = document.createElement("div");
      promptModalContent.classList.add("modal-content");
      promptModalContent.innerHTML = `<h2>Generated Image Prompt</h2>${modalContent}`;
      promptModal.appendChild(promptModalContent);
      document.body.appendChild(promptModal);

      document
        .getElementById("copyGeneratedPromptBtn")
        .addEventListener("click", () => {
          const textarea = document.getElementById(
            "generatedImagePromptTextarea"
          );
          textarea.select();
          document.execCommand("copy");
          alert("Prompt copied to clipboard!");
        });
      document
        .getElementById("closePromptModalBtn")
        .addEventListener("click", () => {
          document.body.removeChild(promptModal);
        });
    } catch (error) {
      alert(`Failed to generate image prompt: ${error.message}`);
    } finally {
      hideLoading();
    }
  }

  // --- API Key Modal Logic ---
 function showApiKeyModal(
    isGitHubRequired = true,
    isGeminiRequired = false,
    actionContext = "general"
  ) {
    console.log(
      `[API_MODAL] Showing. GitHub Required: ${isGitHubRequired}, Gemini Required: ${isGeminiRequired}, Context: ${actionContext}`
    );
    if (!apiKeyModal) return;

    const ghLabel = apiKeyModal.querySelector('label[for="githubTokenInput"]');
    const gemLabel = apiKeyModal.querySelector(
      'label[for="geminiApiKeyInput"]'
    );
    const ghInput = githubTokenInput; 
    const gemInput = geminiApiKeyInput; 


    // Update modal text based on context
    let title = "Enter API Keys";
    let mainMessage =
      "Please provide API keys to use all features. Keys are stored in session storage.";
    if (actionContext === "write_action") {
      title = "Write Access Required";
      mainMessage =
        "A GitHub token with write permissions is needed for this action (e.g., saving, deleting, creating files/folders).";
    } else if (actionContext === "ai_action") {
      title = "Gemini API Key Required";
      mainMessage =
        "A Google Gemini API Key is needed for AI features (Format, Improve).";
    }
    apiKeyModal.querySelector("h2").textContent = title;
    apiKeyModal.querySelector("p").textContent = mainMessage;


    if (ghLabel && ghInput) {
      ghLabel.style.fontWeight = isGitHubRequired ? "bold" : "normal";
      ghLabel.textContent = `GitHub Personal Access Token${
        isGitHubRequired && actionContext !== 'general' ? " (Required for this action)" : " (Write Access, Optional for Read-Only)"
      }:`;
      // --- MODIFIED TO PRE-FILL FROM GLOBAL VARS (sourced from session) ---
      ghInput.value = GITHUB_WRITE_TOKEN || ""; 
      ghInput.placeholder = GITHUB_WRITE_TOKEN ? "Token set (in session)" : (appConfig?.github?.TOKEN_PLACEHOLDER_MESSAGE || "Enter GitHub write token");
      // --- END MODIFIED ---
    }
    if (gemLabel && gemInput) {
      gemLabel.style.fontWeight = isGeminiRequired ? "bold" : "normal";
      gemLabel.textContent = `Google Gemini API Key${
        isGeminiRequired && actionContext !== 'general' ? " (Required for this action)" : " (Optional for AI features)"
      }:`;
      // --- MODIFIED TO PRE-FILL FROM GLOBAL VARS (sourced from session) ---
      gemInput.value = GEMINI_API_KEY || ""; 
      gemInput.placeholder = GEMINI_API_KEY ? "Key set (in session)" : (appConfig?.gemini?.API_KEY_PLACEHOLDER_MESSAGE || "Enter Gemini API key");
      // --- END MODIFIED ---
    }

    apiKeyModal.style.display = "block";
    disableAppControls(); 
    if (clearKeysBtn) clearKeysBtn.disabled = false;
    if (ghInput) ghInput.disabled = false;
    if (gemInput) gemInput.disabled = false;
    if (saveApiKeysBtn) saveApiKeysBtn.disabled = false;
  }

  function hideApiKeyModal() {
    if (apiKeyModal) apiKeyModal.style.display = "none";
    updateButtonStatesBasedOnTokens(); // Re-enable app controls based on current token status
    updateTokenStatusDisplay(); // <--- ADD THIS LINE
  }

  // --- Update Button States ---
  // This function should be called after keys are loaded/changed, or after actions complete.
  function updateButtonStatesBasedOnTokens() {
    const hasReadAccess = !!(GITHUB_READ_TOKEN || GITHUB_WRITE_TOKEN);
    const hasWriteAccess = !!GITHUB_WRITE_TOKEN;
    // Ensure GEMINI_MODELS is checked for actual content, not just if the array exists
    const hasGeminiAccess = !!(GEMINI_API_KEY && Array.isArray(GEMINI_MODELS) && GEMINI_MODELS.length > 0);
    const isFileLoaded = !!currentFilePath;
    // Define isInEditMode based on the current display style of the editorDiv
    const isInEditMode = editorDiv && editorDiv.style.display !== 'none';

    console.log(`[BTN_UPDATE] Read: ${hasReadAccess}, Write: ${hasWriteAccess}, Gemini: ${hasGeminiAccess}, FileLoaded: ${isFileLoaded}, EditMode: ${isInEditMode}`);


    if (refreshFileListBtn) refreshFileListBtn.disabled = !hasReadAccess || isInEditMode;
    if (createNewFileBtn) createNewFileBtn.disabled = !hasWriteAccess || isInEditMode;
    if (createNewFolderBtn) createNewFolderBtn.disabled = !hasWriteAccess || isInEditMode;
    if (reorganizeEntriesBtn) {
         reorganizeEntriesBtn.disabled = !hasWriteAccess || !fileTree || fileTree.length === 0 || isInEditMode;
    }
    if (clearKeysBtn) clearKeysBtn.disabled = false; // Always enabled if element exists

    // Viewer Header Buttons (only enabled if NOT in edit mode)
    if (editBtn) editBtn.disabled = !isFileLoaded || !hasWriteAccess || isInEditMode;
    if (deleteEntryBtn) deleteEntryBtn.disabled = !isFileLoaded || !hasWriteAccess || isInEditMode;
    if (renameEntryBtn) renameEntryBtn.disabled = !isFileLoaded || !hasWriteAccess || isInEditMode;
    if (generatePdfBtn) generatePdfBtn.disabled = !isFileLoaded || !hasReadAccess || isInEditMode;
    
    if (formatBtn) formatBtn.disabled = !isFileLoaded || !hasGeminiAccess || !hasWriteAccess || isInEditMode;
    
    // CORRECTED for createImagePromptBtn:
    if (createImagePromptBtn) {
        createImagePromptBtn.disabled = !isFileLoaded || !hasGeminiAccess || isInEditMode;
    }

    if (improveBtn) improveBtn.disabled = !isFileLoaded || !hasGeminiAccess || !hasWriteAccess || isInEditMode;
    
    if (addImageBtn) {
        const canAddImage = isFileLoaded && hasWriteAccess && !isInEditMode;
        addImageBtn.disabled = !canAddImage;
        addImageBtn.style.display = canAddImage ? "block" : "none";
    }

    // Editor Header Buttons (only enabled if IN edit mode)
    if (saveBtn) saveBtn.disabled = !isInEditMode || !hasWriteAccess;
    if (cancelBtn) cancelBtn.disabled = !isInEditMode;
}

function switchToViewMode() {
    if (editorDiv) editorDiv.style.display = "none";
    if (viewerDiv) viewerDiv.style.display = "block";
    updateButtonStatesBasedOnTokens(); // This will now correctly handle createImagePromptBtn
}

function switchToEditMode() {
    if (!GITHUB_WRITE_TOKEN) {
        showApiKeyModal(true, false, "write_action");
        alert("A GitHub token with write permissions is required to edit entries.");
        return;
    }
    if (viewerDiv) viewerDiv.style.display = "none";
    if (editorDiv) editorDiv.style.display = "block";
    if (htmlEditorTextarea) {
        htmlEditorTextarea.disabled = false;
        htmlEditorTextarea.focus();
    }
    updateButtonStatesBasedOnTokens(); // This will correctly disable viewer buttons when isInEditMode is true
}

  function disableAppControls() {
    console.warn("Disabling main app controls.");
    const controlsToDisable = [
      refreshFileListBtn,
      createNewFileBtn,
      createNewFolderBtn,
      editBtn,
      deleteEntryBtn,
      renameEntryBtn,
      generatePdfBtn,
      formatBtn,
      improveBtn,
      saveBtn, // Editor save
      cancelBtn, // Editor cancel
      addImageBtn,
      reorganizeEntriesBtn,
      // REMOVE THESE TWO:
      // selectAllContextBtn,
      // deselectAllContextBtn,
      proceedWithImprovementBtn, // This IS an AI modal button, but handled in openImproveModal
      copyPromptBtn, // This IS an AI modal button, but handled in openImproveModal
      proceedWithReorganizationBtn, // Reorg modal button
      // Add any other app-specific controls here
    ];
    controlsToDisable.forEach((control) => {
      if (control) control.disabled = true;
    });
    if (htmlEditorTextarea) htmlEditorTextarea.disabled = true;
    if (geminiModelSelect) geminiModelSelect.disabled = true; // This IS in the AI modal, disable it if general controls are off
  }

  // --- Utility, GitHub, and Feature Functions ---

  function estimateTokens(text) {
    /* ... (from your original code) ... */
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
  function showModalLoading(message = "Processing...") {
    /* ... (from your original code) ... */
    if (modalLoadingIndicator) {
      const textElement = modalLoadingIndicator.querySelector(".loading-text");
      if (textElement) textElement.textContent = message;
      modalLoadingIndicator.style.display = "flex";
    } else {
      console.warn(
        "Modal loading indicator element not found for general modal."
      );
    }
  }


function hideModalLoading() {
    if (modalLoadingIndicator) {
        modalLoadingIndicator.style.display = "none";
    }
    updateButtonStatesBasedOnTokens(); // CRUCIAL: Ensure this is called
}

  function showLoading(message = "Loading...") {
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

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = "none";
    }
    if (!appConfig) {
        if (clearKeysBtn) clearKeysBtn.disabled = false;
        return;
    }
    updateButtonStatesBasedOnTokens(); // CRUCIAL: Ensure this is called
    console.log(`[hideLoading] Button states updated.`);
  }

  function showError(message) {
    if (jsonEntryContentDiv) {
      jsonEntryContentDiv.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
    } else {
      console.error(
        "Error display area (jsonEntryContentDiv) not found. Error was:",
        message
      );
      alert("Error: " + message);
    }
    if (currentFileNameH2) {
      currentFileNameH2.textContent = "Error";
    }
  }

  // switchToViewMode and switchToEditMode also manage button states based on context
  function switchToViewMode() {
    if (editorDiv) editorDiv.style.display = "none";
    if (viewerDiv) viewerDiv.style.display = "block";

    const githubReady = !!(
      GITHUB_WRITE_TOKEN && GITHUB_WRITE_TOKEN.length > 20
    );
    const geminiReady = !!(
      GEMINI_API_KEY &&
      GEMINI_API_KEY.length > 20 &&
      GEMINI_MODELS.length > 0
    );
    const isFileLoaded = !!currentFilePath;

    if (editBtn) editBtn.disabled = !isFileLoaded || !githubReady;
    if (deleteEntryBtn) deleteEntryBtn.disabled = !isFileLoaded || !githubReady;
    if (renameEntryBtn) renameEntryBtn.disabled = !isFileLoaded || !githubReady;
    if (generatePdfBtn) generatePdfBtn.disabled = !isFileLoaded || !githubReady;
    if (formatBtn)
      formatBtn.disabled = !isFileLoaded || !geminiReady || !githubReady;
    if (improveBtn)
      improveBtn.disabled = !isFileLoaded || !geminiReady || !githubReady;
    if (addImageBtn) {
      addImageBtn.disabled = !isFileLoaded || !githubReady;
      // addImageBtn visibility is usually handled in loadFileContentAndDisplay
    }
    if (saveBtn) saveBtn.disabled = true; // Editor save
    if (cancelBtn) cancelBtn.disabled = true; // Editor cancel
  }

  function switchToEditMode() {
    /* ... (from your original code) ... */
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

  function getGitHubHeaders(forWriteOperation = false) {
    let tokenToUse = null;

    if (forWriteOperation) {
      if (GITHUB_WRITE_TOKEN) {
        tokenToUse = GITHUB_WRITE_TOKEN;
      } else {
        // Prompt for write token
        console.warn(
          "[HEADERS] Write operation attempted without a write token."
        );
        showApiKeyModal(true, false, "write_action"); // true for GH required, false for Gemini, context
        throw new Error(
          "GitHub write token is required for this operation. Please provide it."
        );
      }
    } else {
      // For read operations
      tokenToUse = GITHUB_WRITE_TOKEN || GITHUB_READ_TOKEN;
    }

    if (!tokenToUse) {
      console.error("[HEADERS] No GitHub token available for API call.");
      showApiKeyModal(true, false, "general"); // Prompt if no token at all
      throw new Error(
        "GitHub token is required to access repository data. Please provide one."
      );
    }
    return {
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${tokenToUse}`,
    };
  }

  async function fetchDirectoryContentsRecursive(directoryPath) {
    const url = `${API_BASE_URL}/${directoryPath}?ref=${GITHUB_BRANCH}`;
    console.log(`[FETCH] Fetching directory contents from: ${url}`);
    let filesFound = [];
    try {
      const response = await fetch(url, { headers: getGitHubHeaders() }); // getGitHubHeaders will now handle token check
      console.log(
        `[FETCH] Response status for ${directoryPath}: ${response.status}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`[FETCH] Directory not found: ${directoryPath}`);
          return []; // Return empty, not an error for a 404 on a dir.
        }
        let errorMsg = `Error fetching directory '${directoryPath}': ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg += ` - ${errorData.message || "No specific message."}`;
        } catch (e) {
          /* no json body */
        }

        if (response.status === 403)
          errorMsg += ` (Rate limit/token permissions issue?)`;
        if (response.status === 401) errorMsg += ` (Invalid token?)`;
        console.error(`[FETCH] API Error details: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      const items = await response.json();
      if (!Array.isArray(items)) {
        console.warn(
          `[FETCH] Expected array but got ${typeof items} for ${directoryPath}. Assuming empty or error.`
        );
        return []; // Or handle as error if appropriate
      }
      console.log(`[FETCH] Found ${items.length} items in ${directoryPath}`);
      const promises = items.map(async (item) => {
        if (item.type === "file") {
          const lowerName = item.name.toLowerCase();
          let fileType = "other";
          if (lowerName.endsWith(".json")) fileType = "json";
          else if (IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext)))
            fileType = "image";

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
      console.error(
        `[FETCH] Error in fetchDirectoryContentsRecursive for ${directoryPath}:`,
        error
      );
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
    // Get headers FOR A WRITE OPERATION.
    // getGitHubHeaders(true) will throw an error and show the API key modal
    // if a suitable write token is not available.
    let headers; // Declare headers here
    try {
      headers = getGitHubHeaders(true); // true indicates a write operation
    } catch (error) {
      // Error already handled by getGitHubHeaders (alert/modal shown, error thrown)
      // We just need to stop execution of this function.
      console.error(
        "[COMMIT] Could not get GitHub headers for write operation:",
        error.message
      );
      // hideLoading(); // Ensure loading is hidden if shown before this point for this specific action
      return null; // Indicate failure
    }

    console.log(
      `[COMMIT] Attempting to ${
        sha ? "update" : "create"
      } file: ${filePath} (SHA: ${sha || "new"})`
    );
    showLoading(sha ? "Saving changes..." : "Creating file..."); // This is fine
    const url = `${API_BASE_URL}/${filePath}`; // API_BASE_URL should be set
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
      branch: GITHUB_BRANCH, // GITHUB_BRANCH should be set
    };
    if (sha) {
      body.sha = sha;
    }

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: headers, // <<< CORRECTED: Use the 'headers' variable obtained from getGitHubHeaders(true)
        body: JSON.stringify(body),
      });

      // Try to parse JSON regardless of status, as GitHub often returns error details in JSON
      let resultData = null;
      try {
        resultData = await response.json();
      } catch (e) {
        console.warn(
          "[COMMIT] Failed to parse JSON response body, or no JSON body present. Status:",
          response.status,
          response.statusText
        );
        // If it's not JSON, but response was not ok, we still want to report the statusText
        if (!response.ok) {
          throw new Error(
            `GitHub API Error (${response.status}): ${response.statusText} (No JSON error details)`
          );
        }
        // If response was ok but no JSON (e.g. 204 No Content on successful delete, though PUT usually returns content)
        // this might be fine depending on the specific API endpoint. For PUT content, we expect JSON.
      }

      if (!response.ok) {
        console.error(
          `[COMMIT] GitHub API Error (${response.status}) for ${filePath}:`,
          resultData || response.statusText // Show parsed JSON error or status text
        );
        let errorMsg = `GitHub API Error (${response.status}): ${
          resultData?.message || response.statusText
        }`;
        // Specific error messages based on status codes
        if (response.status === 401)
          errorMsg =
            "GitHub API Error (401): Unauthorized. Your GitHub token may be invalid or lack permissions.";
        else if (response.status === 403)
          errorMsg =
            "GitHub API Error (403): Forbidden. Your token might lack necessary scopes, or you've hit a rate limit.";
        else if (response.status === 404 && sha)
          errorMsg = `GitHub API Error (404): File not found for update (SHA: ${sha}). Has it been deleted or path incorrect?`;
        else if (response.status === 404 && !sha)
          errorMsg = `GitHub API Error (404): The repository path or branch might be incorrect for creating the file.`;
        else if (response.status === 409)
          errorMsg =
            "GitHub API Error (409): Conflict detected. The file may have been updated since you loaded it (SHA mismatch). Please refresh and try again.";
        else if (response.status === 422) {
          // Unprocessable Entity
          if (!sha)
            errorMsg = `GitHub API Error (422): Could not create file. The path might be invalid, or the file already exists and you are not providing a SHA for update. Server message: ${
              resultData?.message || ""
            }`;
          else
            errorMsg = `GitHub API Error (422): Could not update file. There might be a validation error. Server message: ${
              resultData?.message || ""
            }`;
        }
        // Add more specific messages as needed

        throw new Error(errorMsg);
      }

      // Ensure we actually got content back on a successful create/update
      if (!resultData || !resultData.content) {
        console.warn(
          "[COMMIT] GitHub commit reported OK, but no content object returned. This is unexpected for a PUT. Response:",
          resultData
        );
        // Depending on strictness, you might throw an error here or just log and return null.
        // For now, let's assume if it's OK, it's mostly fine.
        // throw new Error("GitHub commit OK, but no content object returned.");
      }

      console.log(
        "[COMMIT] GitHub Commit successful:",
        resultData?.commit?.message || "No commit message in response",
        resultData?.content?.path || filePath
      );
      return resultData?.content; // Return the content object from GitHub's response
    } catch (error) {
      // Catches errors from fetch, JSON parsing, or explicitly thrown !response.ok errors
      console.error(
        "[COMMIT] Error during commitFileToGitHub execution:",
        error
      );
      // The error message might already be user-friendly from the !response.ok block
      alert(`Failed to save to GitHub: ${filePath}\nError: ${error.message}`);
      return null; // Indicate failure
    } finally {
      hideLoading(); // Ensure loading indicator is hidden
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
    console.log(
      "[BUILD_TREE] Starting buildFileTree with jsonData count:",
      jsonData.length,
      "basePath:",
      basePath
    );
    const tree = [];
    const map = {}; // Maps folder paths to their node in the tree
    jsonData.forEach((file) => {
      console.log(
        "[BUILD_TREE] Processing file:",
        file.path,
        "DisplayPath:",
        file.displayPath
      );
      const relativePath = file.displayPath || file.name; // Use displayPath if available
      const parts = relativePath.split("/");
      let currentLevel = tree;
      let currentFolderPathForMap = ""; // Path used as key in 'map'

      // Iterate through path parts to create/find folders
      for (let i = 0; i < parts.length - 1; i++) {
        // -1 because last part is the filename
        const part = parts[i];
        // Construct the cumulative path for the map key
        currentFolderPathForMap = currentFolderPathForMap
          ? `${currentFolderPathForMap}/${part}`
          : part;

        let folderNode = map[currentFolderPathForMap];
        if (!folderNode) {
          const fullGitHubPath = basePath
            ? `${basePath}/${currentFolderPathForMap}`
            : currentFolderPathForMap;
          console.log(
            `[BUILD_TREE] Creating new folder node: ${part} at path: ${fullGitHubPath} (map key: ${currentFolderPathForMap})`
          );
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
      console.log(
        `[BUILD_TREE] Adding file node: ${fileName} to folder: ${
          currentFolderPathForMap || "root"
        }`
      );
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
    console.log(
      "[BUILD_TREE] Finished building tree. Root nodes:",
      tree.length
    );
    return tree;
  }

  // Inside script.js

  function renderFileTree(nodes, parentUlElement) {
    console.log(
      "[RENDER_TREE] Starting renderFileTree for parent:",
      parentUlElement,
      "with nodes count:",
      nodes ? nodes.length : 0
    );
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
      nodeContentWrapper.classList.add("node-content");

      const nodeDisplayElement = document.createElement(
        node.type === "file" ? "a" : "span"
      );
      nodeDisplayElement.classList.add("node-text");
      nodeDisplayElement.textContent = node.name.replace(/\.json$/i, "");

      if (node.type === "dir") {
        li.classList.add("folder", "node-is-collapsed");
        nodeDisplayElement.title = `Folder: ${node.name}`;
        nodeDisplayElement.addEventListener("click", (e) => {
          // Allow click on text to expand/collapse only if not clicking a button inside
          if (
            e.target === nodeDisplayElement ||
            e.target.classList.contains("node-text")
          ) {
            li.classList.toggle("node-is-collapsed");
          }
        });
        nodeContentWrapper.style.cursor = "pointer";

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
      } else {
        // It's a file
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

    const subfolderName = prompt(
      `Enter name for new SUBFOLDER inside "${parentFolderName}":`
    );
    if (subfolderName && subfolderName.trim() !== "") {
      const newSubfolderName = subfolderName.trim();

      // Basic validation for the subfolder name
      if (newSubfolderName.includes("/") || newSubfolderName.includes(".")) {
        alert(
          "Invalid subfolder name. Do not use '/' or '.' in the folder name."
        );
        return;
      }

      const newFullSubfolderPath = `${parentFolderPath}/${newSubfolderName}`;

      // Check if a folder or file with this name already exists within the parent
      // We need to check `allFetchedFiles` for paths that start with `newFullSubfolderPath`
      // or are exactly `newFullSubfolderPath` (if it was a file mistaken for a folder name)
      const pathExists = allFetchedFiles.some(
        (item) =>
          item.path === newFullSubfolderPath || // Exact match (e.g. if a file has this name)
          item.path.startsWith(newFullSubfolderPath + "/") // If it's already a folder with contents
      );

      if (pathExists) {
        alert(
          `A folder or file named "${newSubfolderName}" already exists inside "${parentFolderName}".`
        );
        return;
      }

      showLoading(`Creating subfolder ${newSubfolderName}...`);
      try {
        // Create a .gitkeep file to make the folder appear in Git
        const gitkeepPath = `${newFullSubfolderPath}/.gitkeep`;
        const commitResult = await commitFileToGitHub(
          gitkeepPath,
          "",
          `feat: Create subfolder ${newSubfolderName} in ${parentFolderName}`
        );

        if (commitResult) {
          alert(
            `Subfolder "${newSubfolderName}" created successfully inside "${parentFolderName}".`
          );
          // Expand the parent folder in the tree after creation
          const parentLi = event.target.closest("li.folder");
          if (parentLi) {
            parentLi.classList.remove("collapsed");
          }
          await fetchFileList(); // Refresh the entire file list
        } else {
          console.warn(
            "Subfolder creation might have failed as commitResult was null."
          );
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
    // Create a slug from the path relative to GITHUB_DATA_PATH
    let relativePathForSlug = filePath;
    if (GITHUB_DATA_PATH && filePath.startsWith(GITHUB_DATA_PATH + '/')) {
        relativePathForSlug = filePath.substring(GITHUB_DATA_PATH.length + 1);
    } else if (filePath.startsWith(GITHUB_DATA_PATH)) { // Is a root file in data_path
        relativePathForSlug = filePath.substring(GITHUB_DATA_PATH.length);
        if (relativePathForSlug.startsWith('/')) relativePathForSlug = relativePathForSlug.substring(1);
    }
    // else, filePath might already be relative or an issue with GITHUB_DATA_PATH

    const slug = getSlug(relativePathForSlug);
    const newHash = `#${slug}`;

    // Only push to history if the hash is actually changing
    if (window.location.hash !== newHash) {
        window.location.hash = newHash; // This will trigger the 'hashchange' event
    } else {
        // If hash is the same (e.g., user clicked the same link again, or initial load matched),
        // and not currently editing, just load the content directly.
        if (editorDiv.style.display !== 'none') {
            if (!confirm("Discard current editor changes?")) {
                return;
            }
        }
        loadFileContentAndDisplay(filePath, linkElement);
    }
}

async function loadEntryFromURL() {
    const hash = window.location.hash.substring(1); // Remove #
    console.log("[URL] Hash change or initial load. Hash:", hash);

    if (!hash) { // No hash, default view
        if (currentFilePath) { // If a file was loaded, clear it
            currentFilePath = null;
            currentJsonData = null;
            currentFileSha = null;
            if(activeLinkElement) activeLinkElement.classList.remove("active");
            activeLinkElement = null;
            if (currentFileNameH2) currentFileNameH2.textContent = "Select an entry";
            if (jsonEntryContentDiv) jsonEntryContentDiv.innerHTML = "<p>Select an entry from the tree.</p>";
            if (imagePreviewSidebar) imagePreviewSidebar.style.display = "none";
            updateButtonStatesBasedOnTokens();
        }
        // If flatJsonData is empty, fetchFileList will handle initial message.
        return;
    }

    if (flatJsonData.length === 0) {
        console.log("[URL] flatJsonData is empty. Waiting for fetchFileList to complete and re-trigger.");
        // fetchFileList will call this again after populating data if there's a hash.
        return;
    }

    const targetFile = flatJsonData.find(file => {
        let relativePathForSlug = file.path;
        if (GITHUB_DATA_PATH && file.path.startsWith(GITHUB_DATA_PATH + '/')) {
            relativePathForSlug = file.path.substring(GITHUB_DATA_PATH.length + 1);
        } else if (file.path.startsWith(GITHUB_DATA_PATH)) {
            relativePathForSlug = file.path.substring(GITHUB_DATA_PATH.length);
            if(relativePathForSlug.startsWith('/')) relativePathForSlug = relativePathForSlug.substring(1);
        }
        return getSlug(relativePathForSlug) === hash;
    });

    if (targetFile) {
        console.log("[URL] Found matching file for hash:", targetFile.path);
        // Find the corresponding link element in the tree to highlight it
        const linkElement = fileTreeRootUl ? fileTreeRootUl.querySelector(`a[data-file-path="${CSS.escape(targetFile.path)}"]`) : null;
        
        // Before loading, check if we are in edit mode for a *different* file
        if (currentFilePath && currentFilePath !== targetFile.path && editorDiv.style.display !== 'none') {
            if (!confirm("You have unsaved changes in the current entry. Discard them and load the new entry?")) {
                // User cancelled, revert hash to previous file if possible, or to root
                const previousSlug = currentFilePath ? getSlug(currentFilePath.substring(GITHUB_DATA_PATH.length + 1)) : '';
                window.location.hash = `#${previousSlug}`; // This might re-trigger loadEntryFromURL
                return;
            }
        }
        await loadFileContentAndDisplay(targetFile.path, linkElement);
    } else {
        console.warn("[URL] No file found matching hash:", hash);
        if (jsonEntryContentDiv) jsonEntryContentDiv.innerHTML = `<p>Entry for URL path "${hash}" not found.</p>`;
        if (currentFileNameH2) currentFileNameH2.textContent = "Entry not found";
        if (activeLinkElement) activeLinkElement.classList.remove("active");
        activeLinkElement = null;
        currentFilePath = null; // Clear current file if hash is invalid
        updateButtonStatesBasedOnTokens();
    }
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

  async function loadFileContentAndDisplay(
    filePath,
    linkElement = null,
    isReloadAfterStaleLinkRemoval = false
  ) {
    // <-- NEW PARAMETER    console.log(`[LOAD] Attempting to load: ${filePath}`);
    if (editorDiv.style.display !== "none") {
      if (
        !confirm(
          "You have unsaved changes. Discard them and load the new entry?"
        )
      ) {
        // Revert hash if user cancels
        if (currentFilePath && filePath !== currentFilePath) {
          // Only if loading a *different* file
          let oldRelativePath = currentFilePath;
          if (
            GITHUB_DATA_PATH &&
            currentFilePath.startsWith(GITHUB_DATA_PATH + "/")
          ) {
            oldRelativePath = currentFilePath.substring(
              GITHUB_DATA_PATH.length + 1
            );
          } else if (currentFilePath.startsWith(GITHUB_DATA_PATH)) {
            oldRelativePath = currentFilePath.substring(
              GITHUB_DATA_PATH.length
            );
            if (oldRelativePath.startsWith("/"))
              oldRelativePath = oldRelativePath.substring(1);
          }
          window.location.hash = `#${getSlug(oldRelativePath)}`;
        }
        return;
      }
    }

    showLoading(`Loading ${filePath.split("/").pop()}...`);

    if (currentFileNameH2) currentFileNameH2.textContent = "Loading...";

currentFileNameH2.textContent = currentJsonData?.name || filePath.split("/").pop().replace(/\.json$/, "");
document.title = `${currentJsonData?.name || "Entry"} - Globeseekers`; // Update browser tab title



    if (jsonEntryContentDiv)
      jsonEntryContentDiv.innerHTML = "<p>Loading content...</p>";
    if (htmlEditorTextarea) {
      htmlEditorTextarea.value = "";
      htmlEditorTextarea.dataset.rawHtmlEntry = "";
      htmlEditorTextarea.dataset.concatenatedJournalHtml = "";
      htmlEditorTextarea.disabled = true;
    }
    if (imagePreviewSidebar) imagePreviewSidebar.style.display = "block"; // Show it, text will indicate loading
    if (imageListContainer) imageListContainer.innerHTML = "";
    if (noImageTextElement) {
      noImageTextElement.textContent = "Loading image info...";
      noImageTextElement.style.display = "block";
    }
    if (addImageBtn) {
      addImageBtn.style.display = "none"; // Hide until file loaded and write access confirmed
      addImageBtn.disabled = true;
    }

    let entrySuccessfullyLoaded = false; // Flag to track overall success of this function call

    let staleImageUUIDs = isReloadAfterStaleLinkRemoval ? [] : []; // <-- MODIFIED INITIALIZATION

    try {
      const result = await fetchFileContent(filePath, false); // false to force fetch
      console.log(
        `[LOAD] fetchFileContent result for ${filePath}:`,
        result ? "Success" : "Failure/Null",
        result?.sha
      );

      if (result && result.jsonData) {
        currentFilePath = filePath;
        currentJsonData = result.jsonData; // Store the pristine, unmodified data
        currentFileSha = result.sha;
        entrySuccessfullyLoaded = true;
        console.log(
          `[LOAD] Successfully fetched data for ${filePath} with SHA: ${currentFileSha}`
        );

        // E. Automatic Main Sidebar Collapse on File Open (Desktop only for this behavior)
        // if (window.innerWidth > MOBILE_BREAKPOINT && sidebar && !sidebar.classList.contains('sidebar-is-collapsed') && !sidebar.classList.contains('mobile-collapsed')) {
        //     console.log("[AUTO-COLLAPSE] File opened on desktop, collapsing main sidebar.");
        //     toggleMainSidebar(true); // Explicitly collapse
        // }

        if (activeLinkElement && activeLinkElement !== linkElement) {
          activeLinkElement.classList.remove("active");
        }
        if (linkElement) {
          linkElement.classList.add("active");
          activeLinkElement = linkElement;
          // Expand parent folders
          let parentLi = linkElement.closest("li.folder");
          while (parentLi) {
            parentLi.classList.remove("node-is-collapsed");
            const grandParentUl = parentLi.parentElement;
            if (grandParentUl && grandParentUl.id !== "fileTreeRoot") {
              parentLi = grandParentUl.closest("li.folder");
            } else {
              parentLi = null;
            }
          }
        } else {
          activeLinkElement = null;
        }

        const entryDisplayName =
          currentJsonData?.name ||
          filePath
            .split("/")
            .pop()
            .replace(/\.json$/, "");
        if (currentFileNameH2) currentFileNameH2.textContent = entryDisplayName;
        document.title = `${entryDisplayName} - Kanka Editor`;
        console.log(`[LOAD] Set header to: ${entryDisplayName}`);

        const isJournal = !!(
          currentJsonData.entity &&
          Array.isArray(currentJsonData.entity.posts) &&
          currentJsonData.entity.posts.length >= 0
        );
        console.log(
          `[LOAD] File Type Detected: ${
            isJournal ? "Journal" : "Standard Entry"
          }`
        );

        if (isJournal) {
          console.log("[LOAD] Processing as Journal...");
          const posts = currentJsonData.entity.posts || [];
          const separator = "\n<hr />\n";
          const concatenatedHtml = posts
            .map((p) => p.entry || "")
            .join(separator);
          if (htmlEditorTextarea)
            htmlEditorTextarea.dataset.concatenatedJournalHtml =
              concatenatedHtml;
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
            if (jsonEntryContentDiv)
              jsonEntryContentDiv.innerHTML = `<p style="color: red;">Error rendering journal content. Check console.</p>`;
          }
        } else {
          console.log("[LOAD] Processing as Standard Entry...");
          const entryHtml =
            currentJsonData?.entity?.entry ?? currentJsonData?.entry ?? "";
          console.log(`[LOAD] Standard Entry HTML length: ${entryHtml.length}`);
          if (htmlEditorTextarea)
            htmlEditorTextarea.dataset.rawHtmlEntry = entryHtml;
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
            if (jsonEntryContentDiv)
              jsonEntryContentDiv.innerHTML = `<p style="color: red;">Error rendering standard content. Check console.</p>`;
          }
        }
        if (htmlEditorTextarea) htmlEditorTextarea.disabled = false;

        // --- Image Handling with Stale Link Detection ---
        console.log(`[LOAD] Starting image handling for ${filePath}`);
        let imageUUIDs = currentJsonData.entity?.image_uuids;
        if (!Array.isArray(imageUUIDs) && currentJsonData.entity?.image_uuid) {
          // Handle legacy single image_uuid
          imageUUIDs = [currentJsonData.entity.image_uuid];
        }

        if (Array.isArray(imageUUIDs) && imageUUIDs.length > 0) {
          console.log(`[LOAD] Found ${imageUUIDs.length} linked image UUIDs.`);
          if (imageListContainer) imageListContainer.innerHTML = ""; // Clear previous images
          let validImagesAttempted = 0;

          const imageLoadPromises = imageUUIDs.map(async (uuid) => {
            const imageData = imageFileMap[uuid];
            const imageContainerDiv = document.createElement("div");
            imageContainerDiv.style.position = "relative";
            imageContainerDiv.style.marginBottom = "15px";

            if (imageData && imageData.download_url && imageData.sha) {
              validImagesAttempted++;
              const imgElement = document.createElement("img");
              const cacheBustedUrl = `${imageData.download_url}?v=${imageData.sha}`;
              let imageLoadedSuccessfully = false;

              await new Promise((resolve) => {
                imgElement.onload = () => {
                  console.log(
                    `[LOAD] Image loaded successfully: ${cacheBustedUrl}`
                  );
                  imageLoadedSuccessfully = true;
                  resolve();
                };
                imgElement.onerror = () => {
                  console.error(
                    `[LOAD] Failed to load image: ${cacheBustedUrl}. Marking UUID ${uuid} as stale.`
                  );
                  staleImageUUIDs.push(uuid);
                  const errorText = document.createElement("p");
                  errorText.textContent = `[Image data for ${uuid} failed to load. Possible stale link.]`;
                  errorText.style.cssText =
                    "color: red; font-size: 0.8em; text-align: center;";
                  imageContainerDiv.innerHTML = ""; // Clear previous attempts
                  imageContainerDiv.appendChild(errorText);
                  resolve(); // Resolve even on error to not block Promise.all
                };
                imgElement.src = cacheBustedUrl;
                imgElement.alt = `Linked image ${uuid}`;
                imgElement.title = `${imageData.name} (UUID: ${uuid}) - Click to enlarge`;
                imgElement.style.cssText = `display: block; max-width: 100%; height: auto; border: 1px solid #d4c8b8; border-radius: 3px; background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 0 auto; cursor: pointer;`;
                imgElement.addEventListener("click", () =>
                  openImageLightbox(cacheBustedUrl)
                );
              });

              if (imageLoadedSuccessfully) {
                imageContainerDiv.appendChild(imgElement); // Add image first
                if (GITHUB_WRITE_TOKEN) {
                  // Only add delete button if write token exists
                  const deleteBtn = document.createElement("button");
                  deleteBtn.textContent = "×";
                  deleteBtn.title = `Delete image: ${imageData.name}`;
                  deleteBtn.style.cssText = `position: absolute; top: 2px; right: 2px; background-color: rgba(200, 0, 0, 0.7); color: white; border: 1px solid rgba(100, 0, 0, 0.8); border-radius: 50%; width: 20px; height: 20px; line-height: 18px; text-align: center; font-size: 14px; font-weight: bold; cursor: pointer; padding: 0; z-index: 10;`;
                  deleteBtn.dataset.uuid = uuid;
                  deleteBtn.dataset.filename = imageData.name;
                  deleteBtn.addEventListener("click", handleDeleteImageClick);
                  imageContainerDiv.appendChild(deleteBtn);
                }
              }
              if (
                imageListContainer &&
                (imageContainerDiv.querySelector("img") ||
                  imageContainerDiv.querySelector('p[style*="color: red"]'))
              ) {
                imageListContainer.appendChild(imageContainerDiv);
              }
            } else {
              console.warn(
                `[LOAD] Image data or essential properties missing for UUID: ${uuid} in imageFileMap. Marking as stale.`
              );
              staleImageUUIDs.push(uuid);
              const errorP = document.createElement("p");
              errorP.textContent = `[Image data for ${uuid} is missing or invalid. Possible stale link.]`;
              errorP.style.cssText =
                "color: orange; font-size: 0.8em; text-align: center; margin-bottom: 10px;";
              if (imageListContainer) imageListContainer.appendChild(errorP);
            }
          });

          await Promise.all(imageLoadPromises);

          if (noImageTextElement) {
            if (imageListContainer && imageListContainer.children.length > 0) {
              noImageTextElement.style.display = "none";
            } else {
              noImageTextElement.textContent =
                "No images linked or all linked images are invalid/missing.";
              noImageTextElement.style.display = "block";
            }
          }
        } else {
          console.log("[LOAD] No image UUIDs found for this entry.");
          if (imageListContainer) imageListContainer.innerHTML = "";
          if (noImageTextElement) {
            noImageTextElement.textContent = "No images linked.";
            noImageTextElement.style.display = "block";
          }
        }
        console.log(`[LOAD] Finished image handling for ${filePath}`);

        // --- Handle Stale Links ---
        if (
          staleImageUUIDs.length > 0 &&
          GITHUB_WRITE_TOKEN &&
          !isReloadAfterStaleLinkRemoval
        ) {
          const changesMade = await handleStaleImageLinks(
            staleImageUUIDs,
            filePath,
            linkElement
          );
          if (changesMade) {
            // If changes were made and saved, handleStaleImageLinks already re-triggered
            // loadFileContentAndDisplay. We should return here to prevent this instance
            // from continuing to the finally block and potentially messing with UI states
            // that the re-triggered call will handle.
            console.log(
              "[LOAD] Stale links handled and entry reloaded. Exiting current load cycle."
            );
            return; // Important to prevent double UI updates from 'finally'
          }
        } else if (staleImageUUIDs.length > 0 && !GITHUB_WRITE_TOKEN) {
          console.log(
            "[LOAD] Stale image links detected, but no write token. Cannot offer to remove them."
          );
        } else if (
          staleImageUUIDs.length > 0 &&
          isReloadAfterStaleLinkRemoval
        ) {
          console.log(
            "[LOAD] Stale links were detected on a reload after removal attempt. Ignoring to prevent loop. User may need to refresh if GitHub sync was slow."
          );
        }
      } else {
        // if (!result || !result.jsonData)
        entrySuccessfullyLoaded = false;
        console.error(
          `[LOAD] fetchFileContent failed or returned no JSON data for ${filePath}.`
        );
        showError(`Failed to load entry content for ${filePath}.`);
        if (activeLinkElement) {
          activeLinkElement.classList.remove("active");
          activeLinkElement = null;
        }
        if (currentFileNameH2)
          currentFileNameH2.textContent = "Error loading entry";
        if (imagePreviewSidebar) imagePreviewSidebar.style.display = "none";
        currentFilePath = null; // Clear current file if load fails
        currentJsonData = null;
        currentFileSha = null;
      }
    } catch (error) {
      entrySuccessfullyLoaded = false;
      console.error(
        `[LOAD] Critical error loading/displaying file ${filePath}:`,
        error
      );
      showError(
        `Critical error processing entry: ${error.message}. Check console.`
      );
      if (activeLinkElement) {
        activeLinkElement.classList.remove("active");
        activeLinkElement = null;
      }
      if (currentFileNameH2) currentFileNameH2.textContent = "Error";
      if (imagePreviewSidebar) imagePreviewSidebar.style.display = "none";
      currentFilePath = null;
      currentJsonData = null;
      currentFileSha = null;
    } finally {
      // This block will execute even if `handleStaleImageLinks` causes a reload,
      // UNLESS we explicitly returned from within the try block.
      // If `entrySuccessfullyLoaded` is true, but `handleStaleImageLinks` didn't make changes or wasn't called,
      // we still need to update button states.
      // If `entrySuccessfullyLoaded` is false, it means the initial load failed, so buttons should reflect that.

      if (addImageBtn) {
        if (entrySuccessfullyLoaded && GITHUB_WRITE_TOKEN) {
          addImageBtn.style.display = "block";
          addImageBtn.disabled = false;
        } else {
          addImageBtn.style.display = "none";
          addImageBtn.disabled = true;
        }
      }

      switchToViewMode(); // This calls updateButtonStatesBasedOnTokens which is aware of currentFilePath etc.
      if (!entrySuccessfullyLoaded && imagePreviewSidebar) {
        // Hide image sidebar if the main entry load failed
        imagePreviewSidebar.style.display = "none";
      }
      hideLoading();
      console.log(
        `[LOAD] Load process finished for ${filePath}. Success: ${entrySuccessfullyLoaded}`
      );
    }
  }

  // Ensure these are accessible or passed as parameters if needed:
  // GITHUB_WRITE_TOKEN, currentJsonData, currentFilePath, currentFileSha,
  // showLoading, hideLoading, commitFileToGitHub, flatJsonData, contextCache,
  // loadFileContentAndDisplay (and its signature is updated to accept the third param)

  async function handleStaleImageLinks(
    staleUUIDs,
    entryPathToUpdate,
    linkElementForReload
  ) {
    if (
      !currentJsonData ||
      entryPathToUpdate !== currentFilePath ||
      !currentFileSha ||
      !GITHUB_WRITE_TOKEN
    ) {
      console.warn(
        "[STALE_LINKS] Pre-conditions not met for handling stale links:",
        {
          currentJsonDataExists: !!currentJsonData,
          pathMatch: entryPathToUpdate === currentFilePath,
          shaExists: !!currentFileSha,
          writeTokenExists: !!GITHUB_WRITE_TOKEN,
        }
      );
      // Do not alert here, as this function is called internally.
      // The calling function (loadFileContentAndDisplay) should handle UI if these pre-conditions fail.
      return false; // Indicate no action taken or failed pre-check
    }

    const entryName =
      currentJsonData.name || entryPathToUpdate.split("/").pop();
    const confirmMessage = `The entry "${entryName}" contains ${
      staleUUIDs.length
    } image link(s) that appear to be stale or broken (image data not found/loadable):\n\n${staleUUIDs.join(
      "\n"
    )}\n\nDo you want to PERMANENTLY REMOVE these broken links from this entry's data? This action cannot be undone. (This will not delete any actual image files from the gallery, only the references in this entry).`;

    if (confirm(confirmMessage)) {
      showLoading(
        `Removing ${staleUUIDs.length} stale image link(s) from "${entryName}"...`
      );
      try {
        const modifiedJsonData = JSON.parse(JSON.stringify(currentJsonData)); // Deep copy

        // Ensure entity object and image_uuids array exist and are correctly formatted
        if (!modifiedJsonData.entity) {
          console.log(
            "[STALE_LINKS] Entry was missing 'entity' object. Creating it for consistency, though no image_uuids to remove if it was missing."
          );
          modifiedJsonData.entity = { image_uuids: [] }; // Initialize with image_uuids array
        }
        if (!Array.isArray(modifiedJsonData.entity.image_uuids)) {
          if (typeof modifiedJsonData.entity.image_uuid === "string") {
            console.log(
              "[STALE_LINKS] Found legacy 'image_uuid' string. Converting to 'image_uuids' array."
            );
            modifiedJsonData.entity.image_uuids = [
              modifiedJsonData.entity.image_uuid,
            ];
            delete modifiedJsonData.entity.image_uuid;
          } else {
            console.log(
              "[STALE_LINKS] 'entity.image_uuids' was not an array and no legacy string found. Initializing as empty array."
            );
            modifiedJsonData.entity.image_uuids = [];
          }
        }

        const originalUUIDs = [...modifiedJsonData.entity.image_uuids];
        modifiedJsonData.entity.image_uuids =
          modifiedJsonData.entity.image_uuids.filter(
            (uuid) => !staleUUIDs.includes(uuid)
          );
        const removedCount =
          originalUUIDs.length - modifiedJsonData.entity.image_uuids.length;

        console.log(
          `[STALE_LINKS] Original UUIDs: ${originalUUIDs.join(
            ", "
          )}. Filtered UUIDs: ${modifiedJsonData.entity.image_uuids.join(
            ", "
          )}. Removed: ${removedCount}`
        );

        if (removedCount > 0) {
          const now = new Date().toISOString().replace("Z", ".000000Z");
          modifiedJsonData.updated_at = now;
          if (modifiedJsonData.entity) modifiedJsonData.entity.updated_at = now;

          const updatedJsonString = JSON.stringify(modifiedJsonData, null, 2);
          const commitMessage = `fix: Remove ${removedCount} stale image link(s) from entry: ${entryName}`;

          // Use currentFileSha for the update commit of the entry itself
          const commitResult = await commitFileToGitHub(
            entryPathToUpdate, // This should be currentFilePath
            updatedJsonString,
            commitMessage,
            currentFileSha
          );

          if (commitResult && commitResult.sha) {
            console.log(
              "[STALE_LINKS] Entry updated successfully on GitHub after removing stale links. New SHA:",
              commitResult.sha
            );
            // Update global state with the new SHA and modified data
            currentFileSha = commitResult.sha;
            currentJsonData = modifiedJsonData;
            contextCache[entryPathToUpdate] = modifiedJsonData;

            const fileIndex = flatJsonData.findIndex(
              (item) => item.path === entryPathToUpdate
            );
            if (fileIndex !== -1) {
              flatJsonData[fileIndex].sha = commitResult.sha;
              // If the kankaName was based on the jsonData, update it too (though unlikely needed here)
              flatJsonData[fileIndex].kankaName =
                modifiedJsonData.name ||
                flatJsonData[fileIndex].name.replace(/\.json$/, "");
            }

            alert(
              `${removedCount} stale image link(s) removed successfully from "${entryName}". Reloading entry view.`
            );
            hideLoading(); // Hide loading *before* the recursive call
            // Call loadFileContentAndDisplay with the flag to prevent immediate re-prompting
            await loadFileContentAndDisplay(
              entryPathToUpdate,
              linkElementForReload,
              true
            );
            return true; // Indicate changes were made and successfully saved
          } else {
            // commitFileToGitHub would have shown an alert
            console.error(
              "[STALE_LINKS] Failed to save updated entry JSON to GitHub after attempting to remove stale links. Commit result:",
              commitResult
            );
            // No throw here, allow finally to hide loading
            hideLoading();
            return false; // Indicate save failure
          }
        } else {
          console.log(
            "[STALE_LINKS] No UUIDs were actually removed from the array. This might happen if staleUUIDs list was empty or didn't match existing UUIDs in the entry."
          );
          alert(
            "No stale links found in the entry's list to remove, or an issue occurred matching them."
          );
          hideLoading();
          return false; // No changes made to the file
        }
      } catch (error) {
        console.error(
          "[STALE_LINKS] Error during stale image link handling:",
          error
        );
        alert(`Failed to remove stale image links: ${error.message}`);
        hideLoading();
        return false; // Indicate error
      }
    } else {
      // User cancelled the confirm dialog
      console.log("[STALE_LINKS] User chose not to remove stale image links.");
      alert(
        "Stale image links will remain. You can manually edit the entry or GitHub JSON if needed."
      );
      // No need to call hideLoading() here as it wasn't shown for the confirm dialog itself
      return false; // Indicate no action taken by user
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
        const placeholderDiv = createImagePlaceholder(
          file.name,
          imageIdForPlaceholder
        );
        if (imageListContainer && noImageTextElement && placeholderDiv) {
          noImageTextElement.style.display = "none";
          imageListContainer.appendChild(placeholderDiv);
          placeholderDiv.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
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
    container.classList.add("image-placeholder-item"); // Add a class for styling
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

    const spinner = document.createElement("div");
    spinner.classList.add("spinner"); // Use your existing spinner style
    spinner.style.width = "16px";
    spinner.style.height = "16px";
    spinner.style.margin = "5px auto";
    spinner.style.borderWidth = "2px";

    container.appendChild(nameP);
    container.appendChild(spinner);
    container.appendChild(statusP);
    return container;
  }

  // Helper to update placeholder status
  function updatePlaceholderStatus(
    placeholderId,
    message,
    isSuccess,
    imageUUID = null,
    newImageDataForMap = null
  ) {
    const placeholderDiv = document.getElementById(
      `placeholder-${placeholderId}`
    );
    const statusP = document.getElementById(`status-${placeholderId}`);
    if (!statusP || !placeholderDiv) return;

    const spinner = placeholderDiv.querySelector(".spinner");
    if (spinner) spinner.style.display = "none"; // Hide spinner once done

    statusP.textContent = message;
    if (isSuccess === true) {
      statusP.style.color = "green";
      placeholderDiv.style.borderColor = "green";
      // If successful and we have the final image data, replace placeholder with actual image display
      if (imageUUID && newImageDataForMap && currentJsonData) {
        // Ensure currentJsonData is available
        // Remove the placeholder content except its main div
        while (placeholderDiv.firstChild) {
          placeholderDiv.removeChild(placeholderDiv.firstChild);
        }
        placeholderDiv.id = `image-container-${imageUUID}`; // Update ID to reflect actual
        placeholderDiv.classList.remove("image-placeholder-item");
        placeholderDiv.classList.add("image-display-item"); // New class for styling final image
        placeholderDiv.style.cssText = `position: relative; margin-bottom: 15px; border: 1px solid #d4c8b8;`; // Reset style

        const imgElement = document.createElement("img");
        const cacheBustedUrl = `${newImageDataForMap.download_url}?v=${newImageDataForMap.sha}`;
        imgElement.src = cacheBustedUrl;
        imgElement.alt = `Linked image ${newImageDataForMap.name}`;
        imgElement.title = `${newImageDataForMap.name} (UUID: ${imageUUID}) - Click to enlarge`;
        imgElement.style.cssText = `display: block; max-width: 100%; height: auto; border-radius: 3px; background-color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 0 auto; cursor: pointer;`;
        imgElement.addEventListener("click", () =>
          openImageLightbox(cacheBustedUrl)
        );

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
    } else {
      // Neutral / In progress
      statusP.style.color = "#666";
      if (spinner) spinner.style.display = "inline-block"; // Show spinner if in progress
    }
  }

  async function uploadImageAndLink(imageFile, placeholderId) {
    // Ensure current entry context is still valid
    if (!currentFilePath || !currentJsonData || !currentFileSha) {
      updatePlaceholderStatus(
        placeholderId,
        "Error: No active entry to link image to.",
        false
      );
      return;
    }

    updatePlaceholderStatus(
      placeholderId,
      `Reading ${imageFile.name}...`,
      null
    ); // null for in-progress

    const sanitizedFilenameBase = imageFile.name
      .substring(0, imageFile.name.lastIndexOf("."))
      .replace(/[^a-z0-9\-_]/gi, "_")
      .replace(/_+/g, "_");
    const fileExt = imageFile.name
      .substring(imageFile.name.lastIndexOf(".") + 1)
      .toLowerCase();

    if (!IMAGE_EXTENSIONS.includes(`.${fileExt}`)) {
      updatePlaceholderStatus(
        placeholderId,
        `Invalid file type: .${fileExt}`,
        false
      );
      return;
    }

    const imageId = crypto.randomUUID
      ? crypto.randomUUID()
      : `img-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`;
    const imageFileNameWithId = `${imageId}.${fileExt}`;
    const imageFilePathInRepo = `${GITHUB_DATA_PATH}/${GALLERY_FOLDER}/${imageFileNameWithId}`; // Path from repo root
    const metadataFilePathInRepo = `${GITHUB_DATA_PATH}/${GALLERY_FOLDER}/${imageId}.json`; // Path from repo root

    // Check for conflicts (optional, commitFileToGitHub might handle some cases but good to pre-check)
    const conflictingImage = allFetchedFiles.find(
      (f) => f.path === imageFilePathInRepo
    );
    const conflictingMeta = allFetchedFiles.find(
      (f) => f.path === metadataFilePathInRepo
    );
    if (conflictingImage || conflictingMeta) {
      updatePlaceholderStatus(
        placeholderId,
        `Filename conflict for ID ${imageId}. Try again.`,
        false
      );
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile); // Start reading

      await new Promise((resolve, reject) => {
        // Wait for reader to load
        reader.onload = async (e) => {
          const dataUrl = e.target.result;
          const base64Content = dataUrl.split(",")[1];
          if (!base64Content) {
            updatePlaceholderStatus(
              placeholderId,
              "Error reading image data.",
              false
            );
            reject(new Error("Could not read image data as Base64."));
            return;
          }

          const now = new Date().toISOString().replace("Z", ".000000Z");

          // --- Step 1: Upload Image File ---
          updatePlaceholderStatus(
            placeholderId,
            `Uploading image file ${imageFileNameWithId}...`,
            null
          );
          const imageUploadResult = await commitFileToGitHub(
            imageFilePathInRepo,
            base64Content,
            `feat: Upload gallery image - ${imageFileNameWithId}`,
            null, // No SHA for new file
            true // isBinary
          );
          if (!imageUploadResult || !imageUploadResult.sha) {
            updatePlaceholderStatus(
              placeholderId,
              `Failed to upload image file to GitHub.`,
              false
            );
            reject(new Error("Image file upload to GitHub failed."));
            return;
          }
          console.log(
            "[UPLOAD] Image File Upload Successful:",
            imageUploadResult.path
          );
          updatePlaceholderStatus(
            placeholderId,
            `Image file uploaded. Creating metadata...`,
            null
          );

          // --- Step 2: Create and Upload Metadata File ---
          const imageMetadata = {
            id: imageId,
            campaign_id: currentJsonData?.campaign_id || null,
            name: imageFile.name,
            ext: fileExt,
            size: imageFile.size,
            created_by:
              currentJsonData?.entity?.created_by ||
              currentJsonData?.created_by ||
              null,
            created_at: now,
            updated_at: now,
            is_default: 0,
            folder_id: null,
            is_folder: 0,
            visibility_id: 1,
            focus_x: null,
            focus_y: null,
            image_folder: null,
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
            updatePlaceholderStatus(
              placeholderId,
              `Failed to upload metadata file to GitHub.`,
              false
            );
            // Consider if you need to delete the already uploaded image file here (cleanup)
            reject(new Error("Metadata file upload to GitHub failed."));
            return;
          }
          console.log(
            "[UPLOAD] Metadata Upload Successful:",
            metadataUploadResult.path
          );
          updatePlaceholderStatus(
            placeholderId,
            `Metadata uploaded. Linking to entry...`,
            null
          );

          // --- Update local maps immediately after successful GitHub commits ---
          const newImageDataForMap = {
            name: imageUploadResult.name,
            path: imageUploadResult.path,
            sha: imageUploadResult.sha,
            download_url:
              imageUploadResult.download_url ||
              `${RAW_CONTENT_BASE}/${imageUploadResult.path}`,
            type: "image",
          };
          imageFileMap[imageId] = newImageDataForMap;
          allFetchedFiles.push(newImageDataForMap);
          allFetchedFiles.push({
            name: metadataUploadResult.name,
            path: metadataUploadResult.path,
            sha: metadataUploadResult.sha,
            download_url:
              metadataUploadResult.download_url ||
              `${RAW_CONTENT_BASE}/${metadataUploadResult.path}`,
            type: "json",
          });

          // --- Step 3: Link Image to Entry by Updating Entry JSON ---
          const modifiedJsonData = JSON.parse(JSON.stringify(currentJsonData)); // Deep copy
          if (!modifiedJsonData.entity) modifiedJsonData.entity = {};
          if (!Array.isArray(modifiedJsonData.entity.image_uuids)) {
            modifiedJsonData.entity.image_uuids = modifiedJsonData.entity
              .image_uuid
              ? [modifiedJsonData.entity.image_uuid]
              : [];
            delete modifiedJsonData.entity.image_uuid; // Clean up old single field if present
          }
          modifiedJsonData.entity.image_uuids.push(imageId);
          modifiedJsonData.updated_at = now;
          if (modifiedJsonData.entity) modifiedJsonData.entity.updated_at = now;

          const updatedJsonString = JSON.stringify(modifiedJsonData, null, 2);
          const linkCommitMessage = `feat: Link image ${
            newImageDataForMap.name
          } to entry - ${
            modifiedJsonData.name || currentFilePath.split("/").pop()
          }`;

          const linkCommitResult = await commitFileToGitHub(
            currentFilePath, // Path of the entry being updated
            updatedJsonString,
            linkCommitMessage,
            currentFileSha // SHA of the current version of the entry
          );

          if (linkCommitResult && linkCommitResult.sha) {
            console.log(
              "[UPLOAD] Entry updated successfully with new image link."
            );
            // IMPORTANT: Update the current entry's state in memory
            currentFileSha = linkCommitResult.sha;
            currentJsonData = modifiedJsonData;
            contextCache[currentFilePath] = modifiedJsonData; // Update cache

            // Update SHA in flatJsonData for the main entry file
            const fileIndex = flatJsonData.findIndex(
              (item) => item.path === currentFilePath
            );
            if (fileIndex !== -1) {
              flatJsonData[fileIndex].sha = linkCommitResult.sha;
            }

            updatePlaceholderStatus(
              placeholderId,
              `Image "${imageFile.name}" added and linked successfully!`,
              true,
              imageId,
              newImageDataForMap
            );
            resolve(); // Resolve the promise from reader.onload
          } else {
            updatePlaceholderStatus(
              placeholderId,
              `Image & metadata uploaded, but linking to entry failed.`,
              false
            );
            // More complex: Offer to retry linking, or inform user to manually link.
            // Potentially delete uploaded image/metadata if linking is critical.
            reject(new Error("Linking image to entry failed."));
          }
        }; // end of reader.onload

        reader.onerror = (e) => {
          updatePlaceholderStatus(
            placeholderId,
            "Error reading file with FileReader.",
            false
          );
          reject(new Error("Failed to read image file using FileReader."));
        };
      }); // end of new Promise for reader
    } catch (error) {
      // Catch errors from the promise chain or other synchronous parts
      console.error(
        "[UPLOAD] Error during image add/link process for file:",
        imageFile.name,
        error
      );
      // The placeholder status might have already been set by a failing step.
      // If not, set a generic error.
      const statusElem = document.getElementById(`status-${placeholderId}`);
      if (
        statusElem &&
        !statusElem.style.color.includes("red") &&
        !statusElem.style.color.includes("green")
      ) {
        updatePlaceholderStatus(
          placeholderId,
          `Operation failed: ${error.message}`,
          false
        );
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

      if (imageData && imageFileMap[uuid]) {
        delete imageFileMap[uuid];
        console.log(`[DELETE] Removed ${uuid} from local imageFileMap.`);
      }
      if (imageData && metadataFile) {
        allFetchedFiles = allFetchedFiles.filter(
          (f) => f.path !== imageData.path && f.path !== metadataFile.path
        );
        console.log(
          `[DELETE] Removed image and metadata files for ${uuid} from allFetchedFiles.`
        );
      } else {
        console.warn(
          `[DELETE] Could not fully clean up ${uuid} from local caches due to missing imageData or metadataFile entry.`
        );
      }

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

 let lightboxTransitionEndHandler = null;

  function openImageLightbox(imageUrl) {
    if (lightboxImage && imageLightboxModal) {
      console.log("Opening lightbox for:", imageUrl);
      lightboxImage.src = imageUrl;
      imageLightboxModal.style.display = "flex"; // Use flex to center content via CSS
      document.body.style.overflow = 'hidden'; // Prevent background scrolling

      // Ensure any previous transitionend listener is removed if close was interrupted
      if (lightboxTransitionEndHandler) {
          imageLightboxModal.removeEventListener("transitionend", lightboxTransitionEndHandler);
          lightboxTransitionEndHandler = null;
      }

      // Force reflow/repaint to ensure transition starts from opacity:0 after display change
      // Accessing offsetHeight is a common way to trigger reflow.
      void imageLightboxModal.offsetHeight; // Or imageLightboxModal.getBoundingClientRect();

      imageLightboxModal.classList.add("show");
    } else {
      console.error("Lightbox elements not found.");
    }
  }

  function closeImageLightbox() {
    if (imageLightboxModal && imageLightboxModal.classList.contains("show")) { // Only if it's shown
      imageLightboxModal.classList.remove("show");
      document.body.style.overflow = ''; // Restore background scrolling

      // Define the handler
      lightboxTransitionEndHandler = (event) => {
          // Make sure the transitionend is for the opacity property and the target is the modal itself
          if (event.propertyName === 'opacity' && imageLightboxModal === event.target) {
              imageLightboxModal.style.display = "none";
              if (lightboxImage) lightboxImage.src = ""; // Clear src after it's hidden
              imageLightboxModal.removeEventListener("transitionend", lightboxTransitionEndHandler);
              lightboxTransitionEndHandler = null; // Clear the stored handler
          }
      };
      imageLightboxModal.addEventListener("transitionend", lightboxTransitionEndHandler);
    } else if (imageLightboxModal && imageLightboxModal.style.display !== 'none' && imageLightboxModal.style.display !== '') {
      // Fallback if .show was not present but modal is somehow still displayed
      // (and not already display: none or empty string which implies not explicitly set)
      console.warn("Closing lightbox via fallback - .show class was not present.");
      imageLightboxModal.style.display = 'none';
      if (lightboxImage) lightboxImage.src = "";
      document.body.style.overflow = '';
      if (lightboxTransitionEndHandler) { // Clean up listener if somehow set without .show
          imageLightboxModal.removeEventListener("transitionend", lightboxTransitionEndHandler);
          lightboxTransitionEndHandler = null;
      }
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
      // Check if it's a placeholder
      alert(
        "A valid Gemini API Key is required for AI features. Please provide one."
      );
      showApiKeyModal(false, true, "ai_action"); // Gemini required, GH not for this specific prompt
      return;
    }
    if (!Array.isArray(GEMINI_MODELS) || GEMINI_MODELS.length === 0) {
      alert("No Gemini models loaded from config. AI features unavailable.");
      console.error(
        "[IMPROVE MODAL] GEMINI_MODELS array is empty or not loaded."
      );
      return;
    }

    const isJournal = !!(
      currentJsonData.entity && Array.isArray(currentJsonData.entity.posts)
    );
    const contentForImprovement = getContentForEditingOrAI(isJournal);
    if (contextTreeRootUl) contextTreeRootUl.innerHTML = ""; // Check if exists

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
      if (proceedWithImprovementBtn) proceedWithImprovementBtn.disabled = true;
      if (copyPromptBtn) copyPromptBtn.disabled = true;
      if (selectAllContextBtn) selectAllContextBtn.disabled = true; // Disable if no models
      if (deselectAllContextBtn) deselectAllContextBtn.disabled = true; // Disable if no models
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
      if (proceedWithImprovementBtn) proceedWithImprovementBtn.disabled = false;
      if (copyPromptBtn) copyPromptBtn.disabled = false;
      if (selectAllContextBtn) selectAllContextBtn.disabled = false; // Enable if models available
      if (deselectAllContextBtn) deselectAllContextBtn.disabled = false; // Enable if models available
    }

    const contextTreeWithoutCurrent = filterTree(fileTree, currentFilePath);
    if (contextTreeRootUl)
      renderContextTree(contextTreeWithoutCurrent, contextTreeRootUl); // Check if exists

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
        li.classList.add("node-is-collapsed");
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
            li.classList.toggle("node-is-collapsed");
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

    if (contextTreeRootUl) {
      // Check if the element exists
      const checkboxes = contextTreeRootUl.querySelectorAll(
        'input[type="checkbox"][data-type="file"]:checked'
      );
      checkboxes.forEach((cb) => {
        totalEstimate += parseInt(cb.dataset.baseTokens || "0", 10);
      });
    } else {
      console.warn(
        "[Token Estimate] contextTreeRootUl not found. Cannot estimate context tokens."
      );
    }
    if (contextTokenEstimateSpan)
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
      console.log(`[LOAD] Found ${imageUUIDs.length} linked image UUIDs.`);
      let successfullyRenderedImagesCount = 0; // Track successfully rendered images
      imageListContainer.innerHTML = ""; // Clear previous images

      const imageLoadPromises = imageUUIDs.map(async (uuid) => {
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

  function getSlug(inputString) {
    if (!inputString) return "unknown-entry";
    // Remove .json, then basic slugification
    let base = inputString.replace(/\.json$/i, '');
    // Remove GITHUB_DATA_PATH prefix if present for a cleaner slug
    if (GITHUB_DATA_PATH && base.startsWith(GITHUB_DATA_PATH)) {
        base = base.substring(GITHUB_DATA_PATH.length);
        if (base.startsWith('/')) base = base.substring(1);
    }
    return base
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^a-z0-9\-_/]+/g, '') // Allow slashes for path structure in slug
        .replace(/\/+/g, '/') // Normalize multiple slashes
        .replace(/^-+|-+$/g, '') // Trim - from start/end
        .replace(/^\/+|\/+$/g, ''); // Trim / from start/end
}

  function makeResizable(element, resizerElement) {
    let isResizing = false;
    let startX, startWidth;
    if (!element || !resizerElement) return;

    // Disable resizer on mobile explicitly if not already handled by CSS
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
        if(resizerElement) resizerElement.style.display = 'none';
        return;
    } else {
        if(resizerElement) resizerElement.style.display = 'flex'; // Or original display type
    }

    resizerElement.addEventListener("mousedown", (e) => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) return; // Extra check
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
      const maxW = window.innerWidth - 150; // Ensure main content has some space
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

  // --- Resize Handler for Sidebar State ---
  function handleResizeForSidebarState() {
    if (!sidebar || !containerDiv || !resizer || !collapseSidebarBtn) return;

    const screenWidth = window.innerWidth;
    const isCurrentlyMobile = sidebar.classList.contains("mobile-collapsed") || (localStorage.getItem("sidebarMobileCollapsed") === "true" && screenWidth <= MOBILE_BREAKPOINT);
    const isCurrentlyDesktopCollapsed = sidebar.classList.contains("collapsed");

    // Call toggleMainSidebar with null to make it re-evaluate based on current classes and new width
    // The `true` for isInitialLoad prevents console logs and ensures it behaves like a state refresh.
    toggleMainSidebar(null, true);

    // Additional logic for resizer visibility if not covered by toggleMainSidebar
    if (screenWidth <= MOBILE_BREAKPOINT) {
        if (resizer) resizer.style.display = 'none';
    } else {
        // If switching to desktop, and sidebar is not collapsed, show resizer.
        // toggleMainSidebar should handle this, but as a fallback:
        if (resizer && !sidebar.classList.contains("collapsed")) {
            resizer.style.display = 'flex'; // Or original display type
        } else if (resizer && sidebar.classList.contains("collapsed")) {
            resizer.style.display = 'none';
        }
    }
  }
  window.addEventListener('resize', handleResizeForSidebarState);


  function setupCreateNewFolderListener() {
    if (createNewFolderBtn) {
      createNewFolderBtn.addEventListener("click", async () => {
        // Check for GITHUB_WRITE_TOKEN because creating a folder is a write operation
        if (!GITHUB_WRITE_TOKEN) {
          showApiKeyModal(true, false, "write_action"); // true for GitHub (write) required
          alert(
            "A GitHub token with write permissions is required to create a new folder."
          );
          return;
        }
        if (!appConfig || !GITHUB_DATA_PATH) {
          alert("Configuration not loaded or base path is missing.");
          return;
        }
        const folderName = prompt(
          "Enter new folder name (at root of data path):"
        );
        if (folderName && folderName.trim() !== "") {
          const newFolderName = folderName.trim();
          if (newFolderName.includes("/") || newFolderName.includes(".")) {
            alert(
              "Invalid folder name. Do not use '/' or '.' in the folder name."
            );
            return;
          }
          const newFolderPathInRepo = `${GITHUB_DATA_PATH}/${newFolderName}`;
          const pathExists = allFetchedFiles.some(
            (item) =>
              item.path === newFolderPathInRepo ||
              item.path === `${newFolderPathInRepo}/.gitkeep`
          );
          if (pathExists) {
            alert(
              `A folder or file named "${newFolderName}" already exists at the root of your data path.`
            );
            return;
          }
          showLoading(`Creating folder ${newFolderName}...`);
          try {
            const gitkeepPath = `${newFolderPathInRepo}/.gitkeep`;
            // commitFileToGitHub will internally call getGitHubHeaders(true) for write token
            const commitResult = await commitFileToGitHub(
              gitkeepPath,
              "", // Empty content for .gitkeep
              `feat: Create folder ${newFolderName}`
            );
            if (commitResult) {
              alert(
                `Folder "${newFolderName}" created successfully in '${GITHUB_DATA_PATH}'.`
              );
              await fetchFileList();
            } else {
              // commitFileToGitHub should have handled its own error display
              console.warn(
                "Folder creation might have failed as commitFileToGitHub returned null/false."
              );
            }
          } catch (error) {
            // Catch errors from commitFileToGitHub if it re-throws
            console.error("Error creating folder:", error);
            alert(`Error creating folder: ${error.message}`);
          } finally {
            hideLoading();
          }
        }
      });
    } else {
      console.warn(
        "Create New Folder (Root) button (createNewFolderBtn) not found."
      );
    }
  }

  function setupRenameEntryListener() {
    if (renameEntryBtn) {
      renameEntryBtn.addEventListener("click", async () => {
        // Check for GITHUB_WRITE_TOKEN because renaming is a write operation (create new, delete old)
        if (!GITHUB_WRITE_TOKEN) {
          showApiKeyModal(true, false, "write_action"); // true for GitHub (write) required
          alert(
            "A GitHub token with write permissions is required to rename an entry."
          );
          return;
        }
        if (!currentFilePath || !currentJsonData || !currentFileSha) {
          alert(
            "Cannot rename: No file selected or essential data is missing."
          );
          return;
        }
        const oldPath = currentFilePath;
        const oldNameWithExt = oldPath.substring(oldPath.lastIndexOf("/") + 1);
        const oldNameWithoutExt = oldNameWithExt.replace(/\.json$/i, "");
        const directory = oldPath.substring(0, oldPath.lastIndexOf("/"));

        let newNameWithoutExt = prompt(
          `Enter new name for "${oldNameWithoutExt}":`,
          oldNameWithoutExt
        );
        if (!newNameWithoutExt || newNameWithoutExt.trim() === "") {
          // User cancelled prompt or entered empty
          return;
        }
        newNameWithoutExt = newNameWithoutExt.trim();
        const sanitizedNewNameBase = newNameWithoutExt
          .toLowerCase()
          .replace(/[^a-z0-9\-_]+/g, "-")
          .replace(/^-+|-+$/g, "");
        if (!sanitizedNewNameBase) {
          alert(
            "Invalid new name after sanitization. Please use letters, numbers, hyphens, or underscores."
          );
          return;
        }
        const newNameWithExt = `${sanitizedNewNameBase}.json`;
        if (newNameWithExt.toLowerCase() === oldNameWithExt.toLowerCase()) {
          // alert("New name is the same as the old name."); // Optional: could allow if user wants to "resave" with sanitization
          return;
        }
        const newPath = directory
          ? `${directory}/${newNameWithExt}`
          : newNameWithExt;
        const targetPathExists = flatJsonData.some(
          (item) => item.path.toLowerCase() === newPath.toLowerCase()
        );
        if (targetPathExists) {
          alert(
            `A file named "${newNameWithExt}" already exists in this location. Please choose a different name.`
          );
          return;
        }

        if (
          confirm(
            `Are you sure you want to rename "${oldNameWithoutExt}" to "${sanitizedNewNameBase}"?\nFile will be: ${newNameWithExt}\n\nWarning: This action might not update internal links in other entries.`
          )
        ) {
          showLoading(`Renaming ${oldNameWithExt} to ${newNameWithExt}...`);
          try {
            const oldContentString = JSON.stringify(currentJsonData, null, 2);
            // commitFileToGitHub for createNewResult will call getGitHubHeaders(true)
            const createNewResult = await commitFileToGitHub(
              newPath,
              oldContentString,
              `feat: Rename - Create new file ${newNameWithExt} from ${oldNameWithExt}`
            );
            if (!createNewResult || !createNewResult.sha) {
              throw new Error(
                "Failed to create the new file during rename operation."
              );
            }

            // deleteFileFromGitHub will also call getGitHubHeaders(true)
            const deleteOldResult = await deleteFileFromGitHub(
              oldPath,
              currentFileSha,
              `feat: Rename - Delete old file ${oldNameWithExt}`
            );

            if (!deleteOldResult) {
              alert(
                `CRITICAL: Renamed file to "${newNameWithExt}", but FAILED to delete the old file "${oldNameWithExt}". You now have a duplicate. Please resolve this manually in your GitHub repository.`
              );
            } else {
              alert(`File renamed successfully to "${newNameWithExt}".`);
            }

            currentFilePath = newPath;
            currentFileSha = createNewResult.sha;
            if (
              currentJsonData.name &&
              currentJsonData.name === oldNameWithoutExt
            ) {
              currentJsonData.name = sanitizedNewNameBase;
              // Also update the name within the entity object if it exists and matches
              if (
                currentJsonData.entity &&
                currentJsonData.entity.name === oldNameWithoutExt
              ) {
                currentJsonData.entity.name = sanitizedNewNameBase;
              }
            }
            // The content in currentJsonData is from the *old* file.
            // For consistency, after rename, we might want to re-fetch the *new* file's content,
            // or ensure currentJsonData accurately reflects the (now potentially renamed) content.
            // For now, fetchFileList will refresh everything.

            await fetchFileList(); // Refresh the entire file list

            // Attempt to re-select the renamed file in the new tree
            const newFileLi = findFileInTreeByPath(newPath);
            if (newFileLi) {
              const linkElement = newFileLi.querySelector("a.node-text");
              if (linkElement) {
                // Since fetchFileList was called, loadFileContentAndDisplay will get fresh data
                await loadFileContentAndDisplay(newPath, linkElement);
              }
            } else {
              // If not found (should be rare after fetchFileList), clear view
              if (currentFileNameH2)
                currentFileNameH2.textContent = "Select an entry";
              if (jsonEntryContentDiv)
                jsonEntryContentDiv.innerHTML =
                  "<p>Select an entry from the tree.</p>";
              updateButtonStatesBasedOnTokens(); // Reset button states
            }
          } catch (error) {
            console.error("Error renaming file:", error);
            alert(
              `Error renaming file: ${error.message}\nThe repository might be in an inconsistent state (e.g., duplicated file or old file not deleted). Please check your repository and the console.`
            );
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
    const links = fileTreeRootUl.querySelectorAll(
      "li.file > .node-content > a.node-text"
    );
    for (const link of links) {
      if (link.dataset.filePath === filePathToFind) {
        return link.closest("li.file");
      }
    }
    return null;
  }

  function setupReorganizeModalListeners() {
    if (reorganizeEntriesBtn)
      reorganizeEntriesBtn.addEventListener("click", openReorganizeModal);
    if (closeReorganizeModalBtn)
      closeReorganizeModalBtn.addEventListener("click", closeReorganizeModal);
    if (cancelReorganizationBtn)
      cancelReorganizationBtn.addEventListener("click", closeReorganizeModal);
    if (proceedWithReorganizationBtn)
      proceedWithReorganizationBtn.addEventListener(
        "click",
        handleProceedWithReorganization
      );
    if (selectAllReorganizeBtn)
      selectAllReorganizeBtn.addEventListener("click", () => {
        if (reorganizeSourceItemsSelectorDiv)
          reorganizeSourceItemsSelectorDiv
            .querySelectorAll('input[type="checkbox"]')
            .forEach((cb) => (cb.checked = true));
      });
    if (deselectAllReorganizeBtn)
      deselectAllReorganizeBtn.addEventListener("click", () => {
        if (reorganizeSourceItemsSelectorDiv)
          reorganizeSourceItemsSelectorDiv
            .querySelectorAll('input[type="checkbox"]')
            .forEach((cb) => (cb.checked = false));
      });
  }
  function openReorganizeModal() {
    // Reorganizing files requires write access
    if (!GITHUB_WRITE_TOKEN) {
      showApiKeyModal(true, false, "write_action"); // true for GitHub (write) required
      alert(
        "A GitHub token with write permissions is required to reorganize entries."
      );
      return;
    }

    if (!fileTree || fileTree.length === 0) {
      alert("File list not loaded. Cannot reorganize entries yet.");
      return;
    }
    if (!reorganizeModal) {
      console.error("Reorganize modal element not found!");
      return;
    }

    reorganizeModal.style.display = "block";
    if (reorganizeStatusMessage) {
      reorganizeStatusMessage.textContent = ""; // Clear any previous status
      reorganizeStatusMessage.style.color = "red"; // Default to red for errors, or set to neutral
    }

    selectedTargetFolderForReorg = GITHUB_DATA_PATH; // Default to the root of your data path

    if (selectedTargetFolderPathDisplaySpan) {
      selectedTargetFolderPathDisplaySpan.textContent = "Root"; // Display 'Root' for the base data path
    }

    populateTargetFolderSelector(); // Populates target folder choices
    populateSourceItemsSelectorForReorg(); // Populates items to move

    // Enable the "Move Selected Items" button. It will be disabled if no items are selected later.
    // Or, you might want to disable it initially until a target AND source items are selected.
    // For now, enabling it as the modal is open.
    if (proceedWithReorganizationBtn) {
      proceedWithReorganizationBtn.disabled = false;
    }
  }

  function updateTokenStatusDisplay() {
    if (!tokenStatusIndicatorDiv || !addEditTokensBtn) return;

    if (GITHUB_WRITE_TOKEN) {
      tokenStatusIndicatorDiv.textContent =
        "Edit Mode: ENABLED (Write Token Present)";
      tokenStatusIndicatorDiv.className = "write-token-present";
      addEditTokensBtn.textContent = "Update Edit Tokens"; // Or "Change Edit Tokens"
    } else {
      tokenStatusIndicatorDiv.textContent =
        "Edit Mode: DISABLED (No Write Token)";
      tokenStatusIndicatorDiv.className = "no-write-token";
      addEditTokensBtn.textContent = "Add Edit Tokens to Enable Editing";
    }

    // Also update display for Gemini key (optional, but good to show status)
    let geminiStatus = "";
    if (GEMINI_API_KEY && GEMINI_MODELS && GEMINI_MODELS.length > 0) {
      geminiStatus = "AI Features: ENABLED";
      // (Optionally add a class for styling)
    } else if (
      GEMINI_API_KEY &&
      (!GEMINI_MODELS || GEMINI_MODELS.length === 0)
    ) {
      geminiStatus =
        "AI Features: API Key Present, Models Missing (Check Config)";
    } else {
      geminiStatus = "AI Features: DISABLED (No Gemini Key)";
    }
    // You can append this to tokenStatusIndicatorDiv or create a new element for it
    // For simplicity, appending here:
    const geminiP = document.createElement("p");
    geminiP.textContent = geminiStatus;
    geminiP.style.fontSize = "0.8em";
    geminiP.style.marginTop = "5px";
    geminiP.style.textAlign = "center";

    // Clear previous Gemini status if it exists
    const existingGeminiP =
      tokenStatusIndicatorDiv.querySelector(".gemini-status");
    if (existingGeminiP) existingGeminiP.remove();
    geminiP.classList.add("gemini-status"); // For potential removal
    tokenStatusIndicatorDiv.appendChild(geminiP);
  }

  // No changes needed for closeReorganizeModal based on token:
  function closeReorganizeModal() {
    if (!reorganizeModal) return;
    reorganizeModal.style.display = "none";
    if (reorganizeTargetFolderSelectorDiv) {
      const currentSelected =
        reorganizeTargetFolderSelectorDiv.querySelector(".selected-target");
      if (currentSelected) currentSelected.classList.remove("selected-target");
    }
    selectedTargetFolderForReorg = null; // Reset selected target
    // Optionally, clear selected source items checkboxes as well
  }

  function populateTargetFolderSelector() {
    if (!reorganizeTargetFolderSelectorDiv) return;
    reorganizeTargetFolderSelectorDiv.innerHTML = "";
    const ul = document.createElement("ul");
    const rootLi = document.createElement("li");
    const rootDiv = document.createElement("div");
    rootDiv.textContent = "Root (Top Level of Data Path)";
    rootDiv.classList.add("folder-target-item");
    rootDiv.dataset.path = GITHUB_DATA_PATH;
    if (GITHUB_DATA_PATH === selectedTargetFolderForReorg) {
      rootDiv.classList.add("selected-target");
    }
    rootDiv.addEventListener("click", (e) =>
      handleTargetFolderSelect(e.currentTarget)
    );
    rootLi.appendChild(rootDiv);
    ul.appendChild(rootLi);

    function renderFolderTreeForTarget(nodes, parentUl) {
      // Renamed for clarity
      nodes.forEach((node) => {
        if (node.type === "dir") {
          const li = document.createElement("li");
          const div = document.createElement("div");
          let displayFolderName = node.path;
          if (node.path.startsWith(GITHUB_DATA_PATH + "/")) {
            displayFolderName = node.path.substring(
              GITHUB_DATA_PATH.length + 1
            );
          } else if (node.path === GITHUB_DATA_PATH) {
            return;
          }
          div.textContent = displayFolderName || node.name;
          div.title = `Target: ${node.path}`;
          div.classList.add("folder-target-item");
          div.dataset.path = node.path;
          if (node.path === selectedTargetFolderForReorg) {
            div.classList.add("selected-target");
          }
          div.addEventListener("click", (e) =>
            handleTargetFolderSelect(e.currentTarget)
          );
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
    if (
      ul.children.length <= 1 &&
      !ul.querySelector(
        '.folder-target-item[data-path!="' + GITHUB_DATA_PATH + '"]'
      )
    ) {
      const p = document.createElement("p");
      p.textContent = "No sub-folders found. You can move items to the Root.";
      if (ul.children.length === 0) {
        // If even root wasn't added
        const fallbackUl = document.createElement("ul");
        fallbackUl.appendChild(rootLi.cloneNode(true)); // Re-add root if cleared
        reorganizeTargetFolderSelectorDiv.appendChild(fallbackUl);
      }
      reorganizeTargetFolderSelectorDiv.appendChild(p);
    }
  }

  function handleTargetFolderSelect(selectedDiv) {
    if (
      !reorganizeTargetFolderSelectorDiv ||
      !selectedTargetFolderPathDisplaySpan ||
      !proceedWithReorganizationBtn
    )
      return;
    const currentSelected =
      reorganizeTargetFolderSelectorDiv.querySelector(".selected-target");
    if (currentSelected) currentSelected.classList.remove("selected-target");
    selectedDiv.classList.add("selected-target");
    selectedTargetFolderForReorg = selectedDiv.dataset.path;
    let displayPath = selectedTargetFolderForReorg;
    if (displayPath === GITHUB_DATA_PATH) displayPath = "Root";
    else if (displayPath.startsWith(GITHUB_DATA_PATH + "/"))
      displayPath = displayPath.substring(GITHUB_DATA_PATH.length + 1);
    selectedTargetFolderPathDisplaySpan.textContent = displayPath;
    proceedWithReorganizationBtn.disabled = false;
  }
  function populateSourceItemsSelectorForReorg() {
    /* ... (Your existing function, ensure GITHUB_DATA_PATH is used correctly) ... */
    if (!reorganizeSourceItemsSelectorDiv) return;
    reorganizeSourceItemsSelectorDiv.innerHTML = "";
    const ul = document.createElement("ul");
    ul.id = "reorganizeSourceTreeRoot";

    function renderReorgSourceTree(nodes, parentUlElement) {
      nodes.forEach((node) => {
        const li = document.createElement("li");
        li.classList.add(node.type === "dir" ? "folder" : "file");
        const nodeContent = document.createElement("div");
        nodeContent.classList.add("context-node-content");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `reorg-source-${node.type}-${node.path.replace(
          /[^a-zA-Z0-9]/g,
          "-"
        )}`;
        checkbox.dataset.path = node.path;
        checkbox.dataset.type = node.type;
        if (node.type === "file" && node.sha) checkbox.dataset.sha = node.sha;
        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        let displayName = node.kankaName || node.name.replace(/\.json$/i, "");
        if (
          node.type === "file" &&
          node.path.startsWith(GITHUB_DATA_PATH + "/") &&
          node.path !== `${GITHUB_DATA_PATH}/${node.name}`
        ) {
          let parentFolderPath = node.path.substring(
            GITHUB_DATA_PATH.length + 1,
            node.path.lastIndexOf("/")
          );
          if (parentFolderPath)
            displayName = `${parentFolderPath} / ${displayName}`;
        } else if (
          node.type === "dir" &&
          node.path.startsWith(GITHUB_DATA_PATH + "/") &&
          node.path !== `${GITHUB_DATA_PATH}/${node.name}`
        ) {
          let parentFolderPath = node.path.substring(
            GITHUB_DATA_PATH.length + 1,
            node.path.lastIndexOf("/")
          );
          if (parentFolderPath)
            displayName = `${parentFolderPath} / ${node.name}`;
          else displayName = node.name;
        }
        label.textContent = displayName;
        label.title = `Item: ${node.path}`;
        if (node.type === "dir") {
          li.classList.add("node-is-collapsed");
          checkbox.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            const childCheckboxes = li.querySelectorAll(
              ':scope > ul input[type="checkbox"]'
            );
            childCheckboxes.forEach((cb) => (cb.checked = isChecked));
          });
          nodeContent.appendChild(checkbox);
          nodeContent.appendChild(label);
          nodeContent.addEventListener("click", (e) => {
            if (e.target !== checkbox) {
              li.classList.toggle("node-is-collapsed");
            }
          });
          li.appendChild(nodeContent);
          const childrenUl = document.createElement("ul");
          if (node.children && node.children.length > 0)
            renderReorgSourceTree(node.children, childrenUl);
          li.appendChild(childrenUl);
        } else {
          nodeContent.appendChild(checkbox);
          nodeContent.appendChild(label);
          li.appendChild(nodeContent);
        }
        parentUlElement.appendChild(li);
      });
    }
    if (fileTree) renderReorgSourceTree(fileTree, ul);
    reorganizeSourceItemsSelectorDiv.appendChild(ul);
    if (ul.children.length === 0)
      reorganizeSourceItemsSelectorDiv.innerHTML =
        "<p>No items found to move.</p>";
  }
  async function handleProceedWithReorganization() {
    /* ... (Your existing function) ... */
    if (!reorganizeStatusMessage) return;
    if (!selectedTargetFolderForReorg) {
      reorganizeStatusMessage.textContent = "Error: No target folder selected.";
      return;
    }
    const selectedItemsToMove = [];
    if (reorganizeSourceItemsSelectorDiv) {
      reorganizeSourceItemsSelectorDiv
        .querySelectorAll('input[type="checkbox"]:checked')
        .forEach((cb) => {
          selectedItemsToMove.push({
            path: cb.dataset.path,
            type: cb.dataset.type,
            sha: cb.dataset.sha,
          });
        });
    }
    if (selectedItemsToMove.length === 0) {
      reorganizeStatusMessage.textContent =
        "Error: No files or folders selected to move.";
      return;
    }
    for (const item of selectedItemsToMove) {
      if (
        item.type === "dir" &&
        selectedTargetFolderForReorg.startsWith(item.path)
      ) {
        reorganizeStatusMessage.textContent = `Error: Cannot move folder "${item.path
          .split("/")
          .pop()}" into itself or a subdirectory.`;
        return;
      }
      if (item.path === selectedTargetFolderForReorg) {
        reorganizeStatusMessage.textContent = `Error: Cannot move an item into the same folder it's already in.`;
        return;
      }
    }
    console.log("Selected Target:", selectedTargetFolderForReorg);
    console.log("Items to Move:", selectedItemsToMove);
    reorganizeStatusMessage.textContent = `Moving ${selectedItemsToMove.length} item(s)... (Move logic not yet implemented).`;
    alert(
      "Reorganization (actual file moving) is not yet fully implemented. Selected items and target are logged."
    );
    // if (reorganizeModalLoadingIndicator) reorganizeModalLoadingIndicator.style.display = 'flex';
    // ...
    // if (reorganizeModalLoadingIndicator) reorganizeModalLoadingIndicator.style.display = 'none';
  }

  initialize();
});
