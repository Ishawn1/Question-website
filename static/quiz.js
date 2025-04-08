// --- START OF FILE static/quiz.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const questionTextElement = document.getElementById('question-text');
    const answerInputElement = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const chatbotOutputElement = document.getElementById('chatbot-output');
    const askChatbotButton = document.getElementById('ask-chatbot-button');
    const helpQuestionInputElement = document.getElementById('help-question-input');
    const nextQuestionButton = document.getElementById('next-question-button');
    const hintButton = document.getElementById('hint-button');
    const hintTextElement = document.getElementById('hint-text');
    const resetButton = document.getElementById('reset-quiz-button');
    const scoreDisplayElement = document.getElementById('score-display');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressPercentage = document.getElementById('progress-percentage');
    // const loadingSpinner = document.getElementById('loading-spinner'); // Removed reference
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const sunIcon = document.getElementById('dark-mode-icon-sun');
    const moonIcon = document.getElementById('dark-mode-icon-moon');
    const htmlElement = document.documentElement;

    // --- State Variables ---
    let currentQuestionId = null;
    let currentQuestionNumber = 0; // Updated by fetchQuestion
    let totalQuestions = 10;       // Updated by fetchQuestion
    let completedQuestionsCount = 0; // Updated by API responses
    let correctAnswersCount = 0;     // Updated by API responses
    let totalAttemptsCount = 0;      // Updated by API responses
    let isQuizActive = false;       // Controls if inputs should be generally enabled
    let buttonOriginalContent = new Map(); // Store original button content during loading

    // --- Helper: Button Loading State ---
    const spinnerSVG = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>`;

    const showButtonLoading = (button) => {
        if (!button) return;
        buttonOriginalContent.set(button, button.innerHTML); // Store original content
        button.disabled = true;
        button.innerHTML = `<div class="flex items-center justify-center">${spinnerSVG}<span>Processing...</span></div>`;
        button.classList.add('opacity-75', 'cursor-wait');
    };

    const hideButtonLoading = (button) => {
        if (!button || !buttonOriginalContent.has(button)) return;
        button.innerHTML = buttonOriginalContent.get(button); // Restore original content
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-wait');
        buttonOriginalContent.delete(button); // Clean up map
    };


    // --- Helper: Dark Mode ---
    const applyDarkMode = (isDark) => {
        if (!htmlElement || !sunIcon || !moonIcon) return;
        htmlElement.classList.toggle('dark', isDark);
        sunIcon.classList.toggle('hidden', isDark); // Sun hidden when dark
        moonIcon.classList.toggle('hidden', !isDark); // Moon visible when light
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

    // --- Helper: API Request (No longer controls global spinner) ---
     const apiRequest = async (endpoint, options = {}) => {
        // showLoading(true); // Removed global spinner control
        try {
            const response = await fetch(endpoint, options);
            const data = await response.json(); // Try to parse JSON regardless of status code
            if (!response.ok) {
                // Throw an error with the message from backend if available
                throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
            }
            return data; // Return parsed data on success
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error; // Re-throw the error to be caught by the caller
        } finally {
            // showLoading(false); // Removed global spinner control
        }
    };

    // --- Helper: Set Control States ---
    const setQuizControlsEnabled = (enabled) => {
         isQuizActive = enabled;
         const elements = [answerInputElement, submitButton, hintButton, helpQuestionInputElement, askChatbotButton];
         elements.forEach(el => {
             if (el) {
                 el.disabled = !enabled;
                 el.classList.toggle('opacity-50', !enabled);
                 el.classList.toggle('cursor-not-allowed', !enabled);
             }
         });
          // Special handling for hint text visibility on disable
         if (!enabled && hintTextElement) {
            hintTextElement.classList.add('hidden');
             // Also reset hint button text if needed
             if(hintButton && hintButton.querySelector('span')) {
                hintButton.querySelector('span').textContent = 'Need a hint?';
             }
         }
    };

    // Helper to enable/disable only Help controls
    const setHelpControlsEnabled = (enabled) => {
        const helpElements = [helpQuestionInputElement, askChatbotButton];
        helpElements.forEach(el => {
            if (el) {
                 el.disabled = !enabled;
                 el.classList.toggle('opacity-50', !enabled);
                 el.classList.toggle('cursor-not-allowed', !enabled);
            }
        });
    }


    // --- Helper: Display Feedback ---
    const displayQuizFeedback = (message, isCorrect = null, isError = false) => {
        if (!chatbotOutputElement) return;
        chatbotOutputElement.innerHTML = ''; // Clear previous content
        const p = document.createElement('p');
        p.textContent = message;
        chatbotOutputElement.appendChild(p);

        // Define class sets (using Tailwind classes from config)
        const baseClasses = ['p-4', 'rounded-lg', 'shadow-md-elevation-1', 'text-base', 'min-h-[50px]', 'border-l-4', 'animate-slide-in-up'];
        const correctClasses = ['bg-feedback-correct-bg', 'border-feedback-correct-border', 'text-md-dark-secondary'];
        const incorrectClasses = ['bg-feedback-incorrect-bg', 'border-feedback-incorrect-border', 'text-md-dark-error'];
        const errorClasses = ['bg-md-dark-error', 'border-md-dark-error', 'text-white']; // Distinct error style
        const neutralClasses = ['bg-feedback-neutral-bg', 'border-feedback-neutral-border', 'text-md-dark-text-secondary'];

        chatbotOutputElement.className = baseClasses.join(' '); // Reset to base, apply common styles

        // Apply specific feedback styles
        if (isError) chatbotOutputElement.classList.add(...errorClasses);
        else if (isCorrect === true) chatbotOutputElement.classList.add(...correctClasses);
        else if (isCorrect === false) chatbotOutputElement.classList.add(...incorrectClasses);
        else chatbotOutputElement.classList.add(...neutralClasses); // Default/neutral
    };


    // --- Score and Progress ---
    const updateScoreDisplay = () => {
        if (!scoreDisplayElement) return;
        const percentage = totalAttemptsCount > 0 ? Math.round((correctAnswersCount / totalAttemptsCount) * 100) : 0;
        scoreDisplayElement.textContent = `Quiz Score: ${correctAnswersCount}/${totalAttemptsCount} (${percentage}%)`;
        // Reset and apply score color
        scoreDisplayElement.classList.remove('text-green-400', 'text-yellow-400', 'text-md-dark-primary', 'text-md-dark-error');
        if (percentage >= 75) scoreDisplayElement.classList.add('text-green-400');
        else if (percentage >= 50) scoreDisplayElement.classList.add('text-yellow-400');
        else if (totalAttemptsCount > 0) scoreDisplayElement.classList.add('text-md-dark-error');
        else scoreDisplayElement.classList.add('text-md-dark-primary');
    };

     const updateProgressDisplay = () => {
         if (!progressBar || !progressText || !progressPercentage) return;
         console.log(`Updating Progress Display: Q#${currentQuestionNumber}, TotalQ:${totalQuestions}, Completed:${completedQuestionsCount}`); // Debug log
        const safeTotal = totalQuestions > 0 ? totalQuestions : 1;
        const percentage = Math.round((completedQuestionsCount / safeTotal) * 100);
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `Quiz ${currentQuestionNumber} of ${totalQuestions}`;
        progressPercentage.textContent = `${percentage}%`;

        // Show completion message only if feedback area is neutral/empty
        if (completedQuestionsCount >= totalQuestions && totalQuestions > 0) {
            const isNeutral = !chatbotOutputElement.classList.contains('bg-feedback-correct-bg') &&
                              !chatbotOutputElement.classList.contains('bg-feedback-incorrect-bg') &&
                              !chatbotOutputElement.classList.contains('bg-md-dark-error');
            if (!chatbotOutputElement.textContent || isNeutral) {
                displayQuizFeedback("Congratulations! You've completed this round. Reset to play again.", null);
            }
        }
    };

    // --- Quiz Functions ---
    const resetQuiz = async () => {
        console.log("Attempting to reset quiz...");
        showButtonLoading(resetButton); // Show loading on reset button
        try {
            const data = await apiRequest('/api/reset', { method: 'POST' });
            if (data.success) {
                totalQuestions = data.total_questions || 10;
                completedQuestionsCount = 0; correctAnswersCount = 0; totalAttemptsCount = 0; currentQuestionNumber = 0; // Reset state
                updateProgressDisplay(); updateScoreDisplay(); // Update UI
                if(hintTextElement) hintTextElement.classList.add('hidden');
                if(nextQuestionButton) nextQuestionButton.classList.add('hidden');
                displayQuizFeedback('Quiz reset. Loading first question...', null);
                await fetchQuestion(false); // Fetch first question (not 'next')
            } else { throw new Error(data.message || 'Reset failed.'); }
        } catch (error) {
            console.error('Error resetting quiz:', error);
            displayQuizFeedback(`Failed to reset quiz: ${error.message}`, null, true);
        } finally {
            hideButtonLoading(resetButton); // Hide loading on reset button
        }
    };

    const getHint = async () => {
        if (!currentQuestionId || !isQuizActive || !hintButton || !hintTextElement) return;
        // hintButton.disabled = true; // Disable button while fetching - Handled by showButtonLoading
        showButtonLoading(hintButton);
        try {
            const data = await apiRequest('/api/hint', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question_id: currentQuestionId })
            });
            hintTextElement.textContent = data.hint;
            hintTextElement.classList.remove('hidden');
            if(hintButton.querySelector('span')) {
                hintButton.querySelector('span').textContent = 'Hide hint';
            }
        } catch (error) {
             console.error('Error getting hint:', error);
             hintTextElement.textContent = `Unable to load hint: ${error.message}`;
             hintTextElement.classList.remove('hidden');
             if(hintButton.querySelector('span')) {
                 hintButton.querySelector('span').textContent = 'Hint Error';
              }
         } finally {
             // Re-enable button after fetch attempt - Handled by hideButtonLoading
             // if(hintButton) hintButton.disabled = false;
             hideButtonLoading(hintButton);
         }
      };

     const toggleHint = () => {
         if (!isQuizActive || !hintButton || !hintTextElement) return;
         if (hintTextElement.classList.contains('hidden')) {
             getHint(); // Fetch and show
         } else {
             hintTextElement.classList.add('hidden'); // Just hide
             if(hintButton.querySelector('span')) {
                 hintButton.querySelector('span').textContent = 'Need a hint?';
             }
         }
     };

    // Fetch question, accepts flag to indicate if it's the "next" question
    const fetchQuestion = async (isNext = false) => {
        if (!questionTextElement) return; // Ensure element exists
        setQuizControlsEnabled(false); // Disable controls while loading
        if(nextQuestionButton) nextQuestionButton.classList.add('hidden');
        displayQuizFeedback("Loading question...", null);
        questionTextElement.textContent = 'Loading...'; // Placeholder text

        // Determine API endpoint based on isNext flag
        const apiUrl = isNext ? '/api/question?next=true' : '/api/question';
         console.log(`Fetching question from: ${apiUrl}`);
         // No specific button for initial fetch, maybe indicate loading in question area?
         questionTextElement.innerHTML = `<div class="flex items-center justify-center text-md-dark-text-secondary">${spinnerSVG} Loading question...</div>`;

         try {
             const data = await apiRequest(apiUrl); // Call API

             // Update state variables from the backend response FIRST
            questionTextElement.textContent = data.question;
            currentQuestionId = data.id;
            currentQuestionNumber = data.question_number || 1;
            totalQuestions = data.total_questions || 10;
            correctAnswersCount = data.correct_answers || 0;
            totalAttemptsCount = data.total_attempts || 0;
            completedQuestionsCount = data.completed_questions || 0;

            // Update the UI based on the new state
            updateProgressDisplay();
            updateScoreDisplay();

            // Reset UI elements for the new question
            if(hintTextElement) hintTextElement.classList.add('hidden');
            if(hintButton && hintButton.querySelector('span')) hintButton.querySelector('span').textContent = 'Need a hint?';
            if(answerInputElement) answerInputElement.value = '';
            if(helpQuestionInputElement) helpQuestionInputElement.value = '';
            displayQuizFeedback('', null); // Clear loading message

            setQuizControlsEnabled(true); // Enable controls now that question is loaded
            if(answerInputElement) answerInputElement.focus(); // Focus input for user

         } catch (error) {
             console.error('Error fetching question:', error);
             questionTextElement.textContent = 'Error loading question.';
             displayQuizFeedback(`Could not load question: ${error.message}`, null, true);
             setQuizControlsEnabled(false); // Keep controls disabled on critical error
         } finally {
             // Ensure loading indicator is removed even if there was an error during fetch
             if (questionTextElement.innerHTML.includes('Loading question...')) {
                 // If it still shows loading, clear it or show error text
                 // This case is handled by the error block setting textContent
             }
         }
     };

    const submitAnswer = async () => {
        if (!isQuizActive || !answerInputElement || !currentQuestionId) return;
        const userAnswer = answerInputElement.value.trim();
        if (!userAnswer) {
            displayQuizFeedback("Please enter an answer before submitting.", null, true); // Treat empty as error
            return;
        }

         // Disable all controls during submission process
         setQuizControlsEnabled(false);
         if(nextQuestionButton) nextQuestionButton.classList.add('hidden');
         showButtonLoading(submitButton); // Show loading on submit button

         try {
             const data = await apiRequest('/api/submit_answer', {
                 method: 'POST', headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ question_id: currentQuestionId, user_answer: userAnswer })
            });

            // Update state counts from the reliable backend response
            correctAnswersCount = data.correct_answers;
            totalAttemptsCount = data.total_attempts;
            completedQuestionsCount = data.completed_questions;

            // Display the feedback from the AI check
            displayQuizFeedback(data.chatbot_feedback, data.is_correct);

             // Update progress/score display based on the new counts
             // (currentQuestionNumber remains the same until 'Next' is clicked)
            updateProgressDisplay();
            updateScoreDisplay();

            // Show the 'Next Question' button
            if(nextQuestionButton) {
                 nextQuestionButton.classList.remove('hidden');
                 nextQuestionButton.focus(); // Focus for keyboard nav
            }

            // IMPORTANT FIX: Re-enable ONLY the help controls after submission
            setHelpControlsEnabled(true);
            // Answer/Submit/Hint remain disabled until 'Next' clicked

        } catch (error) {
            console.error('Error submitting answer:', error);
             displayQuizFeedback(`Error submitting answer: ${error.message}`, null, true);
             // Re-enable ALL controls if submission itself fails, allowing retry/help
             setQuizControlsEnabled(true);
         } finally {
             hideButtonLoading(submitButton); // Hide loading on submit button
         }
     };

    const askForHelp = async () => {
        // Check if help controls are enabled and we have a question context
        if (!helpQuestionInputElement || !askChatbotButton || helpQuestionInputElement.disabled) return;
        if (!currentQuestionId) {
            displayQuizFeedback("Cannot ask for help without an active quiz question.", null, true);
            return;
        }
        const helpQuestion = helpQuestionInputElement.value.trim();
        if (!helpQuestion) {
            displayQuizFeedback("Please type your help question first.", null); // Neutral feedback, not error
             return;
         }

         // setHelpControlsEnabled(false); // Disable only help controls during the API call - Handled by showButtonLoading
         showButtonLoading(askChatbotButton);
         // Optional: Indicate help is being fetched without clearing main feedback - Handled by showButtonLoading text


         try {
             const data = await apiRequest('/api/ask_chatbot', {
                 method: 'POST', headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ question_id: currentQuestionId, help_question: helpQuestion })
             });

             // Display the help response in a distinct block
             const helpResponseContainer = document.createElement('div');
             helpResponseContainer.classList.add(
                 'mt-4', 'pt-4', 'border-t', 'border-md-dark-divider', // Separator line
                 'p-3', 'bg-md-dark-surface', 'rounded', // Background and padding
                 'text-sm' // Font size
             );
             helpResponseContainer.innerHTML = `
                 <strong class="text-md-dark-primary block mb-2">AI Helper Response:</strong>
                 <p class="text-md-dark-text-secondary leading-relaxed">${data.chatbot_response || 'No response received.'}</p>
             `;

             // Append the new container to the main feedback area
             if (chatbotOutputElement) {
                 chatbotOutputElement.appendChild(helpResponseContainer);
                 // Optionally scroll to the bottom of the feedback area
                 chatbotOutputElement.scrollTop = chatbotOutputElement.scrollHeight;
             }


         } catch (error) {
             console.error('Error asking for help:', error);
             // Display error distinctly, maybe temporarily replacing main feedback
             // Or append an error message in the same styled block?
             const errorContainer = document.createElement('div');
             errorContainer.classList.add('mt-4', 'pt-4', 'border-t', 'border-md-dark-divider', 'p-3', 'bg-red-900', 'bg-opacity-20', 'rounded', 'text-sm');
             errorContainer.innerHTML = `<strong class="text-md-dark-error block mb-2">AI Helper Error:</strong><p class="text-red-300">${error.message}</p>`;
             if (chatbotOutputElement) {
                 chatbotOutputElement.appendChild(errorContainer);
                 chatbotOutputElement.scrollTop = chatbotOutputElement.scrollHeight;
             }
             // displayQuizFeedback(`Sorry, couldn't get help: ${error.message}`, null, true); // Old way
         } finally {
             // setHelpControlsEnabled(true); // Re-enable help controls - Handled by hideButtonLoading
             hideButtonLoading(askChatbotButton);
         }
     };

    // --- Event Listeners Setup ---
    const setupEventListeners = () => {
        if (submitButton) submitButton.addEventListener('click', submitAnswer);
        if (answerInputElement) answerInputElement.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); } });
        // MODIFIED: Next button listener calls fetchQuestion(true)
        if (nextQuestionButton) {
            nextQuestionButton.addEventListener('click', () => fetchQuestion(true));
        }
        if (askChatbotButton) askChatbotButton.addEventListener('click', askForHelp);
        if (helpQuestionInputElement) helpQuestionInputElement.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askForHelp(); } });
        if (hintButton) hintButton.addEventListener('click', toggleHint);
        if (resetButton) resetButton.addEventListener('click', resetQuiz);
    };

    // --- Initial Load ---
    const initializeApp = () => {
        console.log("Initializing Quiz Page...");
        initializeDarkMode(); // Set dark mode based on preference/storage
        setupEventListeners(); // Attach all event listeners
        updateScoreDisplay();    // Initialize score display (likely 0/0)
        updateProgressDisplay(); // Initialize progress display (likely 0 of 10)
        fetchQuestion(false);    // Fetch the very first question (isNext = false)
        console.log("Quiz Page Initialized.");
    };

    // Start the application logic when the DOM is ready
    initializeApp();
});
// --- END OF FILE static/quiz.js ---
