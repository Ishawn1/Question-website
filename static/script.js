document.addEventListener('DOMContentLoaded', () => {
    // Element references
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
    
    // Progress bar elements
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressPercentage = document.getElementById('progress-percentage');

    // Quiz state variables
    let currentQuestionId = null;
    let currentQuestionNumber = 1;
    let totalQuestions = 10;
    let completedQuestions = 0;
    let answeredQuestionIds = new Set();
    let correctAnswers = 0;
    let totalAttempts = 0;
    
    // Function to update score display
    const updateScore = () => {
        const percentage = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
        scoreDisplayElement.textContent = `Score: ${correctAnswers}/${totalAttempts} (${percentage}%)`;
        
        // Change color based on score percentage
        if (percentage >= 80) {
            scoreDisplayElement.classList.remove('text-md-dark-primary', 'text-yellow-400');
            scoreDisplayElement.classList.add('text-green-400');
        } else if (percentage >= 50) {
            scoreDisplayElement.classList.remove('text-md-dark-primary', 'text-green-400');
            scoreDisplayElement.classList.add('text-yellow-400');
        } else {
            scoreDisplayElement.classList.remove('text-yellow-400', 'text-green-400');
            scoreDisplayElement.classList.add('text-md-dark-primary');
        }
    };

    // Function to reset quiz state
    const resetQuiz = async () => {
        try {
            // Call the backend reset endpoint
            const response = await fetch('/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to reset quiz');
            }
            
            // Reset client-side state
            currentQuestionNumber = 1;
            completedQuestions = 0;
            answeredQuestionIds.clear();
            correctAnswers = 0;
            totalAttempts = 0;
            
            // Update UI
            updateProgress();
            updateScore();
            hintTextElement.classList.add('hidden');
            hintTextElement.textContent = '';
            
            chatbotOutputElement.textContent = 'Quiz has been reset. Starting new questions!';
            chatbotOutputElement.classList.remove('bg-md-dark-primary', 'bg-opacity-20');
            
            // Remove any success/error styling
            if (chatbotOutputElement.classList.contains('bg-green-900')) {
                chatbotOutputElement.classList.remove('bg-green-900', 'bg-opacity-20', 'border-l-4', 'border-green-500');
            }
            if (chatbotOutputElement.classList.contains('bg-red-900')) {
                chatbotOutputElement.classList.remove('bg-red-900', 'bg-opacity-20', 'border-l-4', 'border-red-500');
            }
            
            // Get first question
            await fetchQuestion();
            
        } catch (error) {
            console.error('Error resetting quiz:', error);
            chatbotOutputElement.textContent = 'Failed to reset quiz. Please try again.';
        }
    };

    // Function to update progress UI
    const updateProgress = () => {
        const percentage = Math.round((completedQuestions / totalQuestions) * 100);
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `Question ${currentQuestionNumber} of ${totalQuestions}`;
        progressPercentage.textContent = `${percentage}%`;
        
        // If all questions are completed, show a congratulations message
        if (completedQuestions >= totalQuestions) {
            chatbotOutputElement.textContent = "Congratulations! You've completed all questions. You can continue for more practice.";
            chatbotOutputElement.classList.add('bg-md-dark-primary', 'bg-opacity-20');
        }
    };

    // Function to get a hint for the current question
    const getHint = async () => {
        if (!currentQuestionId) {
            return;
        }
        
        try {
            const response = await fetch('/api/hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_id: currentQuestionId
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get hint');
            }
            
            const data = await response.json();
            
            // Show the hint
            hintTextElement.textContent = data.hint;
            hintTextElement.classList.remove('hidden');
            
            // Change hint button text
            hintButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
                Hide hint
            `;
            
        } catch (error) {
            console.error('Error getting hint:', error);
            hintTextElement.textContent = 'Unable to load hint. Please try again.';
            hintTextElement.classList.remove('hidden');
        }
    };

    // Function to toggle hint visibility
    const toggleHint = async () => {
        if (hintTextElement.classList.contains('hidden')) {
            // If hint is hidden, we should fetch and show it
            await getHint();
        } else {
            // If hint is visible, hide it
            hintTextElement.classList.add('hidden');
            hintButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
                Need a hint?
            `;
        }
    };

    // Function to fetch and display a question
    const fetchQuestion = async () => {
        try {
            const response = await fetch('/api/question');
            if (!response.ok) {
                throw new Error('Failed to fetch question');
            }
            
            const data = await response.json();
            questionTextElement.textContent = data.question;
            currentQuestionId = data.id;
            
            // Set the current question number from the backend
            if (data.question_number) {
                currentQuestionNumber = data.question_number;
            }
            
            if (data.total_questions) {
                totalQuestions = data.total_questions;
            }
            
            // Update score from backend if available
            if (data.correct_answers !== undefined) {
                correctAnswers = data.correct_answers;
            }
            
            if (data.total_attempts !== undefined) {
                totalAttempts = data.total_attempts;
            }
            
            if (data.completed_questions !== undefined) {
                completedQuestions = data.completed_questions;
            }
            
            // Update UI with current progress and score
            updateProgress();
            updateScore();
            
            // Reset the hint
            hintTextElement.classList.add('hidden');
            hintTextElement.textContent = '';
            hintButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
                Need a hint?
            `;
            
            // Reset other UI elements
            answerInputElement.value = ''; 
            chatbotOutputElement.textContent = '';
            chatbotOutputElement.classList.remove(
                'bg-md-dark-primary', 'bg-opacity-20', 
                'bg-green-900', 'bg-red-900',
                'border-l-4', 'border-green-500', 'border-red-500'
            );
            nextQuestionButton.classList.add('hidden');
            
        } catch (error) {
            console.error('Error fetching question:', error);
            questionTextElement.textContent = 'Error loading question. Please refresh the page.';
        }
    };

    // Function to handle answer submission
    const submitAnswer = async () => {
        if (!answerInputElement.value.trim()) {
            chatbotOutputElement.textContent = "Please enter an answer before submitting.";
            return;
        }
        
        try {
            chatbotOutputElement.textContent = 'Checking answer...';
            const response = await fetch('/api/submit_answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_id: currentQuestionId,
                    user_answer: answerInputElement.value
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit answer');
            }
            
            const data = await response.json();
            
            // Style feedback based on correctness
            chatbotOutputElement.textContent = data.chatbot_feedback || 'Error checking answer.';
            
            if (data.is_correct) {
                chatbotOutputElement.classList.add('bg-green-900', 'bg-opacity-20', 'border-l-4', 'border-green-500');
                chatbotOutputElement.classList.remove('bg-red-900', 'border-red-500');
            } else {
                chatbotOutputElement.classList.add('bg-red-900', 'bg-opacity-20', 'border-l-4', 'border-red-500');
                chatbotOutputElement.classList.remove('bg-green-900', 'border-green-500');
            }
            
            nextQuestionButton.classList.remove('hidden');
            
            // Update score and progress trackers from backend data
            if (data.correct_answers !== undefined) {
                correctAnswers = data.correct_answers;
            }
            
            if (data.total_attempts !== undefined) {
                totalAttempts = data.total_attempts;
            }
            
            if (data.completed_questions !== undefined) {
                completedQuestions = data.completed_questions;
            }
            
            // Track answers locally as well
            if (!answeredQuestionIds.has(currentQuestionId)) {
                answeredQuestionIds.add(currentQuestionId);
            }
            
            // Update UI
            updateProgress();
            updateScore();
            
        } catch (error) {
            console.error('Error submitting answer:', error);
            chatbotOutputElement.textContent = 'Error submitting answer. Please try again.';
        }
    };

    // Function to handle help question submission
    const askForHelp = async () => {
        if (!helpQuestionInputElement.value.trim()) {
            chatbotOutputElement.textContent = "Please enter a help question first.";
            return;
        }
        
        try {
            chatbotOutputElement.textContent = 'Thinking...';
            const response = await fetch('/api/ask_chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_id: currentQuestionId,
                    help_question: helpQuestionInputElement.value
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to ask for help');
            }
            
            const data = await response.json();
            chatbotOutputElement.textContent = data.chatbot_response || 'Error getting help.';
            
            // Reset styling that might have been applied from answer submission
            chatbotOutputElement.classList.remove(
                'bg-green-900', 'bg-red-900', 
                'border-l-4', 'border-green-500', 'border-red-500'
            );
            chatbotOutputElement.classList.add('bg-md-dark-surface');
            
            helpQuestionInputElement.value = ''; // Clear help question input
            
        } catch (error) {
            console.error('Error asking for help:', error);
            chatbotOutputElement.textContent = 'Error asking for help. Please try again.';
        }
    };

    // Event listeners
    submitButton.addEventListener('click', submitAnswer);
    
    // Allow submitting with Enter key in answer input
    answerInputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });
    
    nextQuestionButton.addEventListener('click', () => {
        fetchQuestion();
    });
    
    askChatbotButton.addEventListener('click', askForHelp);
    
    // Allow submitting help question with Enter key
    helpQuestionInputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            askForHelp();
        }
    });
    
    // Hint button event listener
    hintButton.addEventListener('click', toggleHint);
    
    // Reset button event listener
    resetButton.addEventListener('click', resetQuiz);

    // Initialize dark mode toggle if available
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        const sunIcon = document.getElementById('dark-mode-icon-sun');
        const moonIcon = document.getElementById('dark-mode-icon-moon');
        const html = document.documentElement;

        darkModeToggle.addEventListener('click', () => {
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
                localStorage.setItem('darkMode', 'false');
            } else {
                html.classList.add('dark');
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
                localStorage.setItem('darkMode', 'true');
            }
        });
    }

    // Initial question load and progress update
    updateScore();
    updateProgress();
    fetchQuestion();
});