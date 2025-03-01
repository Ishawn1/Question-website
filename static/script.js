document.addEventListener('DOMContentLoaded', () => {
    // Element references
    const questionTextElement = document.getElementById('question-text');
    const answerInputElement = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const chatbotOutputElement = document.getElementById('chatbot-output');
    const askChatbotButton = document.getElementById('ask-chatbot-button');
    const helpQuestionInputElement = document.getElementById('help-question-input');
    const nextQuestionButton = document.getElementById('next-question-button');
    
    // Progress bar elements
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressPercentage = document.getElementById('progress-percentage');

    let currentQuestionId = null;
    let currentQuestionNumber = 1; // Start at question 1
    let totalQuestions = 5; // Default to 5 questions
    let completedQuestions = 0;
    let answeredQuestionIds = new Set(); // Track unique answered questions by ID

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

    // Function to fetch and display a question
    const fetchQuestion = async () => {
        try {
            // No longer showing loading spinner
            const response = await fetch('/api/question');
            if (!response.ok) {
                throw new Error('Failed to fetch question');
            }
            const data = await response.json();
            questionTextElement.textContent = data.question;
            currentQuestionId = data.id;
            
            // Set the current question number from the backend, but don't increment it here
            // Backend already provides the correct question number (1-based)
            if (data.question_number) {
                currentQuestionNumber = data.question_number;
            }
            
            if (data.total_questions) {
                totalQuestions = data.total_questions;
            }
            
            // Update UI with current progress
            updateProgress();
            
            answerInputElement.value = ''; // Clear answer input
            chatbotOutputElement.textContent = ''; // Clear feedback
            chatbotOutputElement.classList.remove('bg-md-dark-primary', 'bg-opacity-20'); // Reset styling
            nextQuestionButton.classList.add('hidden'); // Hide next question button
        } catch (error) {
            console.error(error);
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
            chatbotOutputElement.textContent = data.chatbot_feedback || 'Error checking answer.';
            nextQuestionButton.classList.remove('hidden'); // Show next question button
            
            // Only increment completed questions if this is the first time answering this question
            if (!answeredQuestionIds.has(currentQuestionId)) {
                answeredQuestionIds.add(currentQuestionId);
                completedQuestions = Math.min(completedQuestions + 1, totalQuestions);
                updateProgress();
            }
        } catch (error) {
            console.error(error);
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
            helpQuestionInputElement.value = ''; // Clear help question input
        } catch (error) {
            console.error(error);
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
        fetchQuestion(); // Don't manually increment currentQuestionNumber here
    });
    
    askChatbotButton.addEventListener('click', askForHelp);
    
    // Allow submitting help question with Enter key
    helpQuestionInputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            askForHelp();
        }
    });

    // Initial question load and progress update
    updateProgress();
    fetchQuestion();
});