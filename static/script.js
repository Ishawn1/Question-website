document.addEventListener('DOMContentLoaded', () => {
    const questionTextElement = document.getElementById('question-text');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const chatbotOutput = document.getElementById('chatbot-output');
    const askChatbotButton = document.getElementById('ask-chatbot-button');
    const helpQuestionInput = document.getElementById('help-question-input');
    const nextQuestionButtonContainer = document.getElementById('next-question-button-container'); // Get next question button container
    const nextQuestionButton = document.getElementById('next-question-button'); // Get next question button
    nextQuestionButtonContainer.classList.add('hidden');
    // --- Fetch Question on page load ---
    fetch('/api/question')
        .then(response => response.json())
        .then(data => {
            questionTextElement.textContent = data.question;
            questionTextElement.dataset.questionId = data.id;
        })
        .catch(error => {
            console.error("Error fetching question:", error);
            questionTextElement.textContent = "Failed to load question.";
        });

    // --- Event listener for Submit Button (Answer Submission) ---
    submitButton.addEventListener('click', () => {
        const userAnswer = answerInput.value;
        const questionId = questionTextElement.dataset.questionId;
        
        chatbotOutput.textContent = ""; // Clear previous output
        
        // --- Debugging console logs (optional, for now) ---
        console.log("Question ID being sent:", questionId);
        console.log("User Answer being sent:", userAnswer);
        const requestBody = JSON.stringify({
            question_id: questionId,
            user_answer: userAnswer
        });
        console.log("Request Body (JSON):", requestBody);
        // --- End debugging console logs ---

        fetch('/api/submit_answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: requestBody
        })
        .then(response => response.json())
        .then(data => {
            console.log("Backend response:", data); // Keep logging backend response
            if (data.chatbot_feedback) {
                chatbotOutput.textContent = data.chatbot_feedback;
            } else if (data.error) {
                chatbotOutput.textContent = "Error from backend: " + data.error;
            } else {
                chatbotOutput.textContent = "Something went wrong checking the answer.";
            }
            nextQuestionButtonContainer.classList.remove('hidden'); // Make button visible!
        })
        .catch(error => {
            console.error("Error sending answer to backend:", error);
            chatbotOutput.textContent = "Error checking answer. Please try again.";
        });
    });
    nextQuestionButton.addEventListener('click', () => {
        questionTextElement.textContent = "Loading question..."; // Reset question text
        answerInput.value = ""; // Clear answer input
        chatbotOutput.textContent = ""; // Clear chatbot output
        nextQuestionButtonContainer.classList.add('hidden'); // Hide next question button again

        // --- Fetch a new question from backend API --- (Same as on initial page load)
        fetch('/api/question')
            .then(response => response.json())
            .then(data => {
                questionTextElement.textContent = data.question;
                questionTextElement.dataset.questionId = data.id;
            })
            .catch(error => {
                console.error("Error fetching question:", error);
                questionTextElement.textContent = "Failed to load question.";
            });
    });
    // --- Event listener for "Ask Chatbot" Button (Help Question) ---
    askChatbotButton.addEventListener('click', () => {
        const helpQuestion = helpQuestionInput.value;
        const questionId = questionTextElement.dataset.questionId;

        chatbotOutput.textContent = ""; // Clear previous output

        if (!helpQuestion.trim()) { // Basic check for empty question
            chatbotOutput.textContent = "Please type a question before asking the chatbot.";
            return; // Stop if question is empty
        }

        // --- Send help question to backend API endpoint ---
        fetch('/api/ask_chatbot', { // New API endpoint URL (we'll create this in Flask)
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question_id: questionId,
                help_question: helpQuestion // Send the user's help question
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Chatbot help response:", data); // Log response
            if (data.chatbot_response) {
                chatbotOutput.textContent = "Chatbot Help: " + data.chatbot_response; // Display chatbot help response
            } else if (data.error) {
                chatbotOutput.textContent = "Chatbot Help Error: " + data.error;
            } else {
                chatbotOutput.textContent = "Error getting chatbot help.";
            }
        })
        .catch(error => {
            console.error("Error asking chatbot for help:", error);
            chatbotOutput.textContent = "Error asking chatbot for help. Please try again.";
        });

        helpQuestionInput.value = ""; // Clear the help question input after sending
    });

    // --- Dark Mode Toggle --- (Removed or Commented Out)
    // const darkModeToggle = document.getElementById('darkModeToggle');
    // darkModeToggle.addEventListener('change', () => {
    //     document.documentElement.classList.toggle('dark');
    // });

});