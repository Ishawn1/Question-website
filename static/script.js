document.addEventListener('DOMContentLoaded', () => {
    // Element references
    const questionTextElement = document.getElementById('question-text');
    const answerInputElement = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const chatbotOutputElement = document.getElementById('chatbot-output');
    const askChatbotButton = document.getElementById('ask-chatbot-button');
    const helpQuestionInputElement = document.getElementById('help-question-input');
    const nextQuestionButton = document.getElementById('next-question-button');

    let currentQuestionId = null;

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
            answerInputElement.value = ''; // Clear answer input
            chatbotOutputElement.textContent = ''; // Clear feedback
            nextQuestionButton.classList.add('hidden'); // Hide next question button
        } catch (error) {
            console.error(error);
            questionTextElement.textContent = 'Error loading question. Please refresh the page.';
        }
    };

    // Function to handle answer submission
    const submitAnswer = async () => {
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
        } catch (error) {
            console.error(error);
            chatbotOutputElement.textContent = 'Error submitting answer. Please try again.';
        }
    };

    // Function to handle help question submission
    const askForHelp = async () => {
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
    nextQuestionButton.addEventListener('click', fetchQuestion);
    askChatbotButton.addEventListener('click', askForHelp);

    // Initial question load
    fetchQuestion();
});