# Interactive Question Website with AI Chatbot Feedback

## Description

This is a simple yet modern website designed for interactive learning and knowledge testing. Users are presented with questions, provide answers, and receive instant feedback from an AI chatbot. The chatbot intelligently checks the user's answers, provides corrections if needed, and can answer user questions related to the topic of the current question.

**Key Features:**

*   **Clean and Modern Interface:**  A user-friendly and visually appealing website design.
*   **Interactive Questions:** Presents questions to the user for knowledge testing.
*   **AI-Powered Answer Checking:** Uses a chatbot (powered by Google Gemini API) to automatically check user answers.
*   **Intelligent Feedback:** Provides "Correct!" or "Incorrect" feedback, with helpful corrections and explanations for incorrect answers.
*   **Question-Related Help:** Users can ask the chatbot for clarification or hints related to the current question.
*   **Focused Learning:** Chatbot responses are strictly limited to the topic of the current question, avoiding off-topic conversations.
*   **Randomized Questions:** Questions are presented in a random order each time the website is loaded.
*   **"Next Question" Button:** Allows users to proceed to the next question at their own pace.

## Live Demo

The application is hosted and accessible at: [https://question-website-e71d4de4c10a.herokuapp.com/](https://question-website-e71d4de4c10a.herokuapp.com/)

## Technologies Used

*   **Frontend:**
    *   HTML, CSS, JavaScript
    *   Tailwind CSS (for modern and responsive styling)
*   **Backend:**
    *   Python (Flask framework)
    *   Gunicorn (WSGI server for production deployment)
*   **AI Chatbot:**
    *   Google Gemini API (for answer checking and question-related help)
*   **Deployment:**
    *   Heroku (cloud platform for hosting the application)

## Setup Instructions (Local Development)

1.  **Prerequisites:**
    *   Python 3.x installed on your system ([https://www.python.org/](https://www.python.org/))

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Ishawn1/Question-website
    cd question-website
    ```

3.  **Create a Virtual Environment (Recommended):**
    ```bash
    python -m venv venv
    ```

4.  **Activate the Virtual Environment:**
    *   **On Windows:**
        ```bash
        venv\Scripts\activate
        ```
    *   **On macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```

5.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

6.  **Set up Google Gemini API Key (Environment Variable):**
    *   You need a Google AI Studio API key to use the chatbot functionality. Get your API key from [https://aistudio.google.com/](https://aistudio.google.com/).
    *   **Important: Do NOT hardcode your API key directly in `app.py`.**
    *   Set the API key as an environment variable named `GOOGLE_API_KEY` on your system.
        *   **For temporary use in your current terminal session (replace `YOUR_API_KEY` with your actual key):**
            ```bash
            export GOOGLE_API_KEY=YOUR_API_KEY  # macOS/Linux
            set GOOGLE_API_KEY=YOUR_API_KEY     # Windows Command Prompt
            ```
        *   **For persistent system-wide environment variables:** Refer to your operating system's documentation on how to set environment variables (e.g., System Environment Variables in Windows, `.bashrc` or `.zshrc` on macOS/Linux).

7.  **Run the Flask Application:**
    ```bash
    python app.py
    ```

8.  **Access the Website:** Open your web browser and go to `http://127.0.0.1:5000/`.

## Deployment Instructions (Heroku)

1. **Create a Heroku Account:**
   * Sign up at [https://signup.heroku.com/](https://signup.heroku.com/) if you don't have an account.

2. **Install Heroku CLI:**
   * Download and install the Heroku CLI from [https://devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli).

3. **Login to Heroku from CLI:**
   ```bash
   heroku login
   ```

4. **Prepare Required Files:**
   * Ensure you have a `requirements.txt` file listing all dependencies.
   * Create a `Procfile` (no extension) with the following content:
     ```
     web: gunicorn app:app
     ```

5. **Create a Heroku App:**
   ```bash
   heroku create your-app-name
   ```
   * Note: Replace `your-app-name` with a unique name for your application.

6. **Set Environment Variables:**
   ```bash
   heroku config:set GOOGLE_API_KEY=your_api_key_here
   heroku config:set SECRET_KEY=your_secret_key_here
   ```

7. **Deploy Your Application:**
   ```bash
   git push heroku main
   ```
   * Use `git push heroku master` if you're using the master branch.

8. **Open Your App:**
   ```bash
   heroku open
   ```
   * This will open your app in the default browser.

## Usage Instructions

1.  **Visit the website URL** in your browser (either local or [https://question-website-e71d4de4c10a.herokuapp.com/](https://question-website-e71d4de4c10a.herokuapp.com/)).
2.  **A question will be displayed.** Read the question carefully.
3.  **Type your answer** in the "Your Answer" text area.
4.  **Click "Submit Answer"**. The AI chatbot will check your answer and provide feedback in the "Chatbot Output" area below.
    *   "Correct!" will be displayed for correct answers.
    *   "Incorrect..." will be displayed for incorrect answers, along with the correct answer and a brief explanation.
5.  **If you need help with the question,** type your question in the "Ask a question about this topic..." text area in the "Need Help with this Question?" section and click "Ask Chatbot". The chatbot will provide helpful clarification related to the question topic.
6.  **To proceed to the next question,** click the "Next Question" button. A new random question will be loaded.

## Further Development Ideas 

*   Add more questions and organize them by topic/category.
*   Implement user accounts to track progress and scores.
*   Enhance the UI further with more styling and responsiveness improvements.
*   Explore different question types (multiple choice, true/false, etc.).
*   Integrate a database for more scalable question management.
*   Add a leaderboard to show top performers.
*   Implement a difficulty progression system.
*   Create a mobile app version.

## Contact

For questions or feedback, please contact: ishawn23@protonmail.com