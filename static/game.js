// --- START OF FILE static/game.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const getContentButton = document.getElementById('get-content-button');
    const aiContentDisplay = document.getElementById('ai-content-display');
    const gameInputArea = document.getElementById('game-input-area');
    const promptGuessInput = document.getElementById('prompt-guess-input');
    const submitGuessButton = document.getElementById('submit-guess-button');
    const gameFeedbackArea = document.getElementById('game-feedback-area');
    const loadingSpinner = document.getElementById('loading-spinner');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const sunIcon = document.getElementById('dark-mode-icon-sun');
    const moonIcon = document.getElementById('dark-mode-icon-moon');
    const htmlElement = document.documentElement;

    // --- State Variables ---
    let currentGameContentId = null;
    let isGameInputActive = false; // To control enabling/disabling game inputs

     // --- Helper: Loading Spinner ---
    const showLoading = (show) => {
        if (!loadingSpinner) return;
        if (show) {
            loadingSpinner.classList.remove('hidden');
             requestAnimationFrame(() => { loadingSpinner.style.opacity = '1'; });
        } else {
            loadingSpinner.style.opacity = '0';
            setTimeout(() => { loadingSpinner.classList.add('hidden'); }, 300);
        }
    };

    // --- Helper: Dark Mode ---
    const applyDarkMode = (isDark) => {
        if (!htmlElement || !sunIcon || !moonIcon) return;
        htmlElement.classList.toggle('dark', isDark);
        sunIcon.classList.toggle('hidden', !isDark);
        moonIcon.classList.toggle('hidden', isDark);
    };
    const initializeDarkMode = () => {
        const savedMode = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedMode === 'true' || (savedMode === null && prefersDark);
        applyDarkMode(isDark);
    };
     if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const isDark = htmlElement.classList.toggle('dark');
            localStorage.setItem('darkMode', isDark);
            applyDarkMode(isDark);
        });
    }

    // --- Helper: API Request ---
     const apiRequest = async (endpoint, options = {}) => {
        showLoading(true);
        try {
            const response = await fetch(endpoint, options);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP error ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        } finally {
            showLoading(false);
        }
    };

    // --- Helper: Game Controls ---
     const setGameInputEnabled = (enabled) => {
         isGameInputActive = enabled;
         const elements = [promptGuessInput, submitGuessButton];
          elements.forEach(el => {
             if (el) {
                 el.disabled = !enabled;
                 el.classList.toggle('opacity-50', !enabled);
                 el.classList.toggle('cursor-not-allowed', !enabled);
             }
         });
         if (enabled && gameInputArea) gameInputArea.classList.remove('hidden');
         else if(gameInputArea) gameInputArea.classList.add('hidden');
     };

    // --- Helper: Display Game Feedback ---
     const displayGameFeedback = (message, similarity = null, originalPrompt = null, isError = false) => {
         if (!gameFeedbackArea) return;
         gameFeedbackArea.innerHTML = ''; // Clear previous
         gameFeedbackArea.className = 'p-4 rounded-lg shadow-md-elevation-1 text-base min-h-[50px] border-l-4 animate-slide-in-up'; // Base classes

         const baseTextClass = 'text-md-dark-text-secondary';
         const ratingClassMap = {
             "Very Similar": "text-green-400", // Bright green
             "Somewhat Similar": "text-yellow-400", // Yellow
             "Not Similar": "text-md-dark-error", // Red/Error color
         };
         const borderClassMap = {
            "Very Similar": "border-green-400 bg-green-900 bg-opacity-10",
            "Somewhat Similar": "border-yellow-400 bg-yellow-900 bg-opacity-10",
            "Not Similar": "border-md-dark-error bg-red-900 bg-opacity-10",
         };
         const errorClasses = 'border-md-dark-error bg-md-dark-error text-white';
         const neutralClasses = 'border-feedback-neutral-border bg-feedback-neutral-bg text-md-dark-text-secondary';


        // Create Rating Element (if applicable)
        if (similarity && similarity !== "N/A" && similarity !== "Error") {
             const ratingPara = document.createElement('p');
             const ratingColor = ratingClassMap[similarity] || 'text-md-dark-secondary'; // Default color
             ratingPara.innerHTML = `<strong class="${ratingColor}">Rating:</strong> ${similarity}`;
             gameFeedbackArea.appendChild(ratingPara);
         }

         // Create Explanation Element
         const explanationPara = document.createElement('p');
         explanationPara.textContent = message || (isError ? "An error occurred." : "Feedback processing issue.");
         explanationPara.classList.add(baseTextClass); // Apply base text color
         gameFeedbackArea.appendChild(explanationPara);

        // Create Original Prompt Element (if applicable)
         if (originalPrompt) {
            const promptPara = document.createElement('p');
            promptPara.classList.add('mt-2', 'text-sm'); // Smaller text for original prompt
            promptPara.innerHTML = `<strong class="text-md-dark-secondary">Original Prompt:</strong> <span class="text-md-dark-text-secondary italic">${originalPrompt}</span>`;
            gameFeedbackArea.appendChild(promptPara);
        }

         // Apply Border/Background Styling
         if(isError) {
            gameFeedbackArea.classList.add(...errorClasses.split(' '));
         } else if (similarity && borderClassMap[similarity]) {
             gameFeedbackArea.classList.add(...borderClassMap[similarity].split(' '));
         } else {
             gameFeedbackArea.classList.add(...neutralClasses.split(' '));
         }

         gameFeedbackArea.classList.remove('hidden'); // Ensure it's visible
     };

    // --- Game Functions ---
    const fetchGameContent = async () => {
        if(!aiContentDisplay || !gameInputArea) return;
        setGameInputEnabled(false); // Disable input while loading
        displayGameFeedback('Loading new AI content...', null);
        aiContentDisplay.innerHTML = '<p class="text-md-dark-text-secondary">Loading...</p>'; // Placeholder

        try {
            const data = await apiRequest('/api/generated_content');
            currentGameContentId = data.id;
            aiContentDisplay.innerHTML = ''; // Clear loading text

            if (data.type === 'text') {
                const p = document.createElement('p');
                p.textContent = data.output;
                p.classList.add('whitespace-pre-wrap'); // Preserve formatting
                aiContentDisplay.appendChild(p);
            } else if (data.type === 'image') {
                const img = document.createElement('img');
                img.src = data.output;
                img.alt = "AI Generated Image";
                img.classList.add('max-w-full', 'h-auto', 'rounded-lg', 'mx-auto', 'shadow-md');
                aiContentDisplay.appendChild(img);
                 const cap = document.createElement('p'); cap.textContent = "AI-generated image."; cap.classList.add('text-center','text-sm','mt-2', 'text-md-dark-text-secondary'); aiContentDisplay.appendChild(cap);
            } else {
                 throw new Error("Unsupported content type");
            }

            if(promptGuessInput) promptGuessInput.value = ''; // Clear previous guess
            setGameInputEnabled(true); // Enable input area
            displayGameFeedback('Content loaded! What prompt was used?', null);
            if(promptGuessInput) promptGuessInput.focus();

        } catch (error) {
            aiContentDisplay.innerHTML = `<p class="text-md-dark-error">Error loading content: ${error.message}</p>`;
            displayGameFeedback(''); // Clear feedback area
            currentGameContentId = null;
             setGameInputEnabled(false); // Keep disabled on error
        }
    };

    const submitGuess = async () => {
        if (!isGameInputActive || !promptGuessInput || !currentGameContentId) return;
        const userGuess = promptGuessInput.value.trim();
        if (!userGuess) { displayGameFeedback('Please enter your guess.', null, null, true); return; }

        setGameInputEnabled(false); // Disable during submission
        displayGameFeedback('Evaluating your guess...', null);

        try {
            const data = await apiRequest('/api/submit_prompt_guess', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content_id: currentGameContentId, user_guess: userGuess })
            });
            displayGameFeedback(data.feedback, data.similarity, data.original_prompt);
            // Keep input enabled after guess to allow another guess or loading new content? Yes.
            setGameInputEnabled(true);


        } catch (error) {
            displayGameFeedback(`Evaluation error: ${error.message}`, null, null, true);
             setGameInputEnabled(true); // Re-enable on error
        }
    };

    // --- Event Listeners Setup ---
    const setupEventListeners = () => {
        if (getContentButton) getContentButton.addEventListener('click', fetchGameContent);
        if (submitGuessButton) submitGuessButton.addEventListener('click', submitGuess);
        if (promptGuessInput) promptGuessInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitGuess(); } });
    };

    // --- Initial Load ---
    const initializeApp = () => {
        console.log("Initializing Game Page...");
        initializeDarkMode();
        setupEventListeners();
        setGameInputEnabled(false); // Input disabled until content loaded
        displayGameFeedback('Click "Load AI Content" to begin.', null);
        console.log("Game Page Initialized.");
    };

    initializeApp();
});
// --- END OF FILE static/game.js ---