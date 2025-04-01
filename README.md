# Interactive AI Quiz & Games Website

## Description

This project is a web application featuring interactive learning modules powered by AI. It provides a clean interface where users can select different activities from a main menu, currently including an "AI Quiz Challenge" and a "Guess the Prompt" game. The application leverages Google Gemini AI models to provide intelligent feedback, answer checking, and contextual help.

**Key Features:**

*   **Main Menu:** Simple navigation to choose between different activities.
*   **AI Quiz Challenge:**
    *   Presents questions on AI topics.
    *   Uses a configurable AI model (e.g., Gemini Flash) to check user answers for semantic correctness.
    *   Provides instant feedback ("Correct!", "Incorrect...") with explanations for wrong answers.
    *   Offers optional hints for questions.
    *   Allows users to ask for topic clarification via an AI helper, even after submitting an answer.
    *   Tracks basic progress (score, completion) within a session.
    *   Randomizes question order per session/reset.
*   **"Guess the Prompt" Game:**
    *   Displays AI-generated text content.
    *   Challenges users to guess the original prompt used to create the content.
    *   Uses a configurable AI model (potentially different from the quiz, e.g., Gemini Pro for better evaluation) to assess the similarity between the user's guess and the original prompt.
    *   Reveals the original prompt after evaluation.
*   **Configurable AI Models:** Allows setting potentially different Google Gemini models for the quiz functions and the game evaluation via `app.py`.
*   **Clean & Responsive UI:** Uses Tailwind CSS for a modern, dark-themed interface.
*   **Session Management:** Uses Flask sessions to maintain quiz state for individual users.

## Live Demo

The application is hosted and accessible at: [https://question-website-e71d4de4c10a.herokuapp.com/](https://question-website-e71d4de4c10a.herokuapp.com/)
*(Note: Live demo link may reflect the latest deployed version, which could differ slightly from local code)*

## Technologies Used

*   **Frontend:**
    *   HTML, CSS, JavaScript
    *   Tailwind CSS (via CDN or Build Process)
*   **Backend:**
    *   Python (Flask framework)
    *   Gunicorn (WSGI server for production deployment)
*   **AI Chatbot & Evaluation:**
    *   Google Gemini API (Configurable models per section)
*   **Deployment:**
    *   Heroku (cloud platform for hosting the application)

## Setup Instructions (Local Development)

1.  **Prerequisites:**
    *   Python 3.x installed ([https://www.python.org/](https://www.python.org/))
    *   Git installed ([https://git-scm.com/](https://git-scm.com/))

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
    *   **Windows:** `venv\Scripts\activate`
    *   **macOS/Linux:** `source venv/bin/activate`

5.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

6.  **Set up Environment Variables:**
    *   **`GOOGLE_API_KEY`:** You need a Google AI Studio API key. Get one from [https://aistudio.google.com/](https://aistudio.google.com/).
    *   **`SECRET_KEY`:** A secret key is needed for Flask session security. You can generate a strong one using Python:
        ```bash
        python -c "import secrets; print(secrets.token_hex(24))"
        ```
    *   **Set the variables** (replace `YOUR_API_KEY` and `YOUR_SECRET_KEY`):
        *   **macOS/Linux (temporary):**
            ```bash
            export GOOGLE_API_KEY='YOUR_API_KEY'
            export SECRET_KEY='YOUR_SECRET_KEY'
            ```
        *   **Windows CMD (temporary):**
            ```bash
            set GOOGLE_API_KEY=YOUR_API_KEY
            set SECRET_KEY=YOUR_SECRET_KEY
            ```
        *   **Windows PowerShell (temporary):**
            ```powershell
            $env:GOOGLE_API_KEY='YOUR_API_KEY'
            $env:SECRET_KEY='YOUR_SECRET_KEY'
            ```
        *   **Persistent / `.env` file:** For persistent setup, consult your OS documentation or use a `.env` file (requires `pip install python-dotenv` and adding `from dotenv import load_dotenv; load_dotenv()` at the top of `app.py`). Create a `.env` file in the root directory with:
            ```
            GOOGLE_API_KEY=YOUR_API_KEY
            SECRET_KEY=YOUR_SECRET_KEY
            ```

7.  **Configure AI Models (Optional):**
    *   Open `app.py`. You can change the `quiz_model_name` and `game_model_name` variables near the top if you want to use different Gemini models (ensure your API key has access).

8.  **Run the Flask Application:**
    ```bash
    python app.py
    ```

9.  **Access the Website:** Open your web browser and go to `http://127.0.0.1:5000/` (or the port specified in the output).

## Deployment Instructions (Heroku)

1.  **Heroku Account & CLI:** Ensure you have a Heroku account and the Heroku CLI installed and logged in (`heroku login`).
2.  **Prepare Files:**
    *   `requirements.txt`: Must list all dependencies (`Flask`, `google-generativeai`, `gunicorn`, optionally `python-dotenv`).
    *   `Procfile`: (No extension) Should contain `web: gunicorn app:app`.
    *   Ensure your `.gitignore` excludes `venv/` and `.env` files.
3.  **Create Heroku App:**
    ```bash
    heroku create your-unique-app-name
    ```
4.  **Set Environment Variables on Heroku:**
    ```bash
    # Replace with your actual values!
    heroku config:set GOOGLE_API_KEY=YOUR_API_KEY_HERE
    heroku config:set SECRET_KEY=YOUR_STRONG_RANDOM_SECRET_KEY_HERE
    ```
    *   **CRITICAL:** Use a strong, unique `SECRET_KEY` for production.
5.  **Deploy:**
    ```bash
    git push heroku main  # Or your deployment branch (e.g., master)
    ```
6.  **Open App:**
    ```bash
    heroku open
    ```

## Usage Instructions

1.  **Navigate to the root URL** (e.g., `http://127.0.0.1:5000/` or the Heroku URL). You will see the main menu.
2.  **Select an Activity:**
    *   Click **"Start AI Quiz Challenge"** to go to the quiz page.
    *   Click **"Play 'Guess the Prompt'"** to go to the game page.

3.  **Using the AI Quiz Challenge:**
    *   A question is displayed. Read it and type your answer in the input box.
    *   Click **"Submit Quiz Answer"**. Feedback (Correct/Incorrect with explanation) appears below. The main answer input is disabled.
    *   **Optional:** Click **"Need a hint?"** before or after answering.
    *   **Optional:** Type a question about the *topic* (even after seeing the correct answer) in the **"Need Help..."** section and click **"Ask AI Helper"** for clarification.
    *   Click **"Next Quiz Question"** to advance.
    *   Click **"Reset Quiz"** to start over with a fresh set of shuffled questions and zero score.

4.  **Using the "Guess the Prompt" Game:**
    *   Click **"Load AI Content"**. AI-generated text will appear.
    *   Read the content and think about what prompt might have created it.
    *   Type your guess into the **"What prompt created this?"** input box.
    *   Click **"Submit Guess"**.
    *   The AI evaluation (Similarity rating, Explanation) and the **Original Prompt** will be displayed below.
    *   Click **"Load AI Content"** again to play with a new piece of content.

5.  **Navigation:** Use the **"← Back to Menu"** link on the quiz and game pages to return to the main selection screen.

## Further Development Ideas

*   **More Games:** Add different AI-related games (Ethics Dilemmas, Concept Connection, Pictionary/Description).
*   **Game Scoring:** Implement scoring and tracking for the "Guess the Prompt" game.
*   **Quiz Enhancements:** Organize quiz questions by category/difficulty, add multiple-choice options.
*   **User Accounts:** Allow users to register/login to track long-term progress across sessions and games.
*   **Database Integration:** Store questions, game content, and user progress in a database (like PostgreSQL or SQLite) instead of in-memory lists.
*   **UI/UX Improvements:** Enhance visual styling, animations, and mobile responsiveness.
*   **Model Selection:** Allow users to select different AI models if multiple are configured and available.

## Contact

For questions or feedback, please contact: ishawn23@protonmail.com