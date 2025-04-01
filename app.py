# --- START OF FILE app.py ---

from flask import Flask, jsonify, render_template, request, session, url_for
import google.generativeai as genai
import random
import os
import uuid

app = Flask(__name__, static_folder='static', template_folder='templates')
# IMPORTANT: Set a strong secret key in production!
app.secret_key = os.environ.get('SECRET_KEY', 'a-very-secure-dev-secret-key-CHANGE-ME')

# --- Data Definitions ---
questions_data_original = [
    {"id": 1, "question": "What is the primary advantage of Human-AI collaboration?", "answer": "Enhanced Productivity", "hint": "Think about how combining human intuition with AI capabilities improves work outcomes."},
    {"id": 2, "question": "Which neural network model is designed to mimic human brain functions?", "answer": "Spiking Neural Network", "hint": "This model simulates the electrical impulses (spikes) that neurons use to communicate."},
    {"id": 3, "question": "What is a key ethical concern in AI decision-making?", "answer": "Bias", "hint": "This issue occurs when AI systems reflect or amplify unfair human prejudices."},
    {"id": 4, "question": "Which AI-powered tool is commonly used in mental health therapy?", "answer": "Woebot", "hint": "This chatbot was developed at Stanford to deliver cognitive-behavioral therapy techniques."},
    {"id": 5, "question": "Which AI-driven model helps in predicting extreme weather conditions?", "answer": "GenCast", "hint": "This system uses generative AI to predict weather patterns with higher accuracy."},
    {"id": 6, "question": "Which AI-based system is used for fraud detection in banking?", "answer": "Machine Learning", "hint": "This technology can analyze patterns in transactions to identify suspicious activities."},
    {"id": 7, "question": "What AI technology is used to create digital artwork?", "answer": "DALL-E", "hint": "This OpenAI system can generate images from textual descriptions."},
    {"id": 8, "question": "Which AI-based chatbot helps in personalized learning for students?", "answer": "Squirrel AI", "hint": "This adaptive learning platform is popular in Asian countries for providing customized education."},
    {"id": 9, "question": "What is the term for AI models that provide justifications for their decisions?", "answer": "Explainable AI", "hint": "This concept focuses on making AI decision-making processes transparent and understandable."},
    {"id": 10, "question": "What is the AI-driven concept where machines surpass human intelligence?", "answer": "Singularity", "hint": "This theoretical point refers to when AI becomes capable of recursive self-improvement."}
]

prompt_game_data = [
    { "id": "g1", "type": "text", "original_prompt": "Write a short poem about a robot learning to dream.", "output": "Steel gears turn soft tonight,\nCircuits hum a gentle light.\nBinary code begins to fray,\nAs electric sheep drift away.\nA new world blooms behind closed eyes,\nWhere logic fades and wonder flies." },
    { "id": "g2", "type": "text", "original_prompt": "Describe a futuristic city powered entirely by bioluminescent algae.", "output": "Towers pulsed with a soft, green glow, mirroring the canals below where shimmering algae flowed. Buildings resembled giant coral structures, interconnected by bridges woven from living light. Air-taxis, silent as moths, navigated the glowing pathways, their forms silhouetted against the luminous haze." },
    { "id": "g3", "type": "text", "original_prompt": "Explain the concept of a 'digital twin' in simple terms.", "output": "Imagine a perfect virtual copy of a real-world object, like a jet engine or even a whole factory. This 'digital twin' gets real-time data from its physical counterpart. You can test changes, predict problems, or optimize performance on the twin without affecting the real thing." },
    { "id": "g4", "type": "text", "original_prompt": "Create a recipe for a pizza inspired by the planet Mars.", "output": "Martian Crater Pizza:\nBase: Thin crust, perhaps with red pepper flakes for 'rust'.\nSauce: Spicy arrabiata sauce.\nToppings: Black olives ('craters'), sun-dried tomatoes ('red rocks'), feta cheese ('ice caps'), scattered basil ('potential life'). Bake until crust is crisp and cheese is bubbly." }
]

# --- Model Configuration ---
# Make sure GOOGLE_API_KEY is set!
api_key = os.environ.get('GOOGLE_API_KEY')
quiz_model = None
game_model = None
model_init_error = None

if not api_key:
    model_init_error = "GOOGLE_API_KEY environment variable not set."
    print(f"ERROR: {model_init_error}")
else:
    try:
        genai.configure(api_key=api_key)

        # --- Initialize Quiz Model (e.g., Flash for speed/cost) ---
        try:
            quiz_model_name = 'gemini-2.0-flash-lite'
            quiz_model = genai.GenerativeModel(quiz_model_name)
            # Quick test (optional, adds startup time)
            # quiz_model.generate_content("test quiz model")
            print(f"Quiz Model loaded: {quiz_model_name}")
        except Exception as e_quiz:
            print(f"Warning: Could not load primary quiz model ({quiz_model_name}): {e_quiz}. Trying fallback...")
            try:
                quiz_model_name = 'gemini-2.0-flash' # Fallback
                quiz_model = genai.GenerativeModel(quiz_model_name)
                print(f"Quiz Model loaded: {quiz_model_name} (fallback)")
            except Exception as e_quiz_fallback:
                 model_init_error = f"Failed to initialize any quiz model: {e_quiz_fallback}"
                 print(f"ERROR: {model_init_error}")


        # --- Initialize Game Model (e.g., Pro for better comparison, or same as quiz) ---
        try:
            # Change this if you want a different model for the game
            game_model_name = 'gemini-2.0-flash'
            # game_model_name = 'gemini-1.5-pro-latest' # Example of using a potentially better model
            game_model = genai.GenerativeModel(game_model_name)
            # Quick test (optional)
            # game_model.generate_content("test game model")
            print(f"Game Model loaded: {game_model_name}")
        except Exception as e_game:
            print(f"Warning: Could not load primary game model ({game_model_name}): {e_game}. Trying fallback...")
            try:
                game_model_name = 'gemini-2.0-flash-lite' # Fallback
                game_model = genai.GenerativeModel(game_model_name)
                print(f"Game Model loaded: {game_model_name} (fallback)")
            except Exception as e_game_fallback:
                # If game model fails but quiz model worked, maybe default game model to quiz model?
                if quiz_model:
                    game_model = quiz_model
                    print(f"Warning: Game model failed, using quiz model ({quiz_model_name}) as fallback for game.")
                else:
                    err_msg = f"Failed to initialize any game model: {e_game_fallback}"
                    if model_init_error: model_init_error += f"; {err_msg}"
                    else: model_init_error = err_msg
                    print(f"ERROR: {err_msg}")

    except Exception as e_configure:
        model_init_error = f"Failed to configure GenerativeAI: {e_configure}"
        print(f"ERROR: {model_init_error}")

# --- Helper Functions ---
def initialize_quiz_session():
    """Initialize/ensure quiz session variables"""
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    if 'quiz_state' not in session:
        questions = questions_data_original.copy()
        random.shuffle(questions)
        session['quiz_state'] = {
            'questions': questions, 'current_question_index': 0,
            'answered_questions': [], 'correct_answers': 0, 'total_attempts': 0
        }
    # Ensure essential keys exist
    state = session['quiz_state']
    state.setdefault('questions', questions_data_original.copy())
    state.setdefault('current_question_index', 0)
    state.setdefault('answered_questions', [])
    state.setdefault('correct_answers', 0)
    state.setdefault('total_attempts', 0)
    if not state['questions']: # Reset if list became empty
         questions = questions_data_original.copy(); random.shuffle(questions)
         state['questions'] = questions; state['current_question_index'] = 0
    return state

def check_model(model_instance, feature_name):
    """Checks if a model is available, returns error response if not"""
    if model_init_error: # Global configuration error
         return jsonify({"error": f"AI Model Configuration Error: {model_init_error}"}), 503
    if not model_instance:
        return jsonify({"error": f"The AI model required for {feature_name} is not available."}), 503
    return None # Indicates model is okay


# --- Page Routes ---
@app.route('/')
def index():
    """Renders the main menu page."""
    return render_template('index.html')

@app.route('/quiz')
def quiz_page():
    """Renders the AI Quiz page."""
    initialize_quiz_session()
    return render_template('quiz.html')

@app.route('/game')
def game_page():
    """Renders the Guess the Prompt game page."""
    return render_template('guess_prompt_game.html')


# --- API Routes ---

# == Quiz API Routes ==
@app.route('/api/question', methods=['GET'])
def get_question():
    quiz_state = initialize_quiz_session()

    # Check if we are fetching the *next* question based on query param
    is_requesting_next = request.args.get('next') == 'true'

    # --- Logic Adjustment ---
    # If this request IS for the next question, increment BEFORE getting the index
    # Otherwise, use the index as is (for initial load or refresh)
    if is_requesting_next:
        quiz_state['current_question_index'] = quiz_state.get('current_question_index', 0) + 1
        session.modified = True # Mark session modified because index changed
        print(f"Incrementing index for 'next' request. New index: {quiz_state['current_question_index']}")

    current_index = quiz_state.get('current_question_index', 0)

    # Handle cycling
    if current_index >= len(quiz_state['questions']):
        print("Cycling questions...")
        current_index = 0 # Reset index to 0
        quiz_state['current_question_index'] = current_index
        random.shuffle(quiz_state['questions']) # Optional: re-shuffle on cycle
        session.modified = True # Mark session modified due to reset/shuffle

    # Get question data using the potentially updated index
    question_data = quiz_state['questions'][current_index]
    print(f"Fetching question at index: {current_index}")

    # Prepare response data (as before)
    response_data = {
        **question_data,
        "question_number": current_index + 1, # Use the actual index used
        "total_questions": len(quiz_state['questions']),
        "completed_questions": len(quiz_state.get('answered_questions', [])),
        "correct_answers": quiz_state.get('correct_answers', 0),
        "total_attempts": quiz_state.get('total_attempts', 0)
    }
    if "hint" in response_data: del response_data["hint"]

    # --- REMOVED INCREMENT FROM HERE ---
    # quiz_state['current_question_index'] += 1 # NO LONGER INCREMENT HERE
    # session.modified = True # Only set if index actually changed above

    return jsonify(response_data)

@app.route('/api/submit_answer', methods=['POST'])
def submit_answer():
    # ... (no changes needed in submit_answer itself for this fix) ...
    model_check = check_model(quiz_model, "checking answers")
    if model_check: return model_check

    quiz_state = session.get('quiz_state')
    if not quiz_state: return jsonify({"error": "Quiz session not found."}), 400

    data = request.get_json()
    if not data: return jsonify({"error": "No data received"}), 400

    user_answer = data.get('user_answer',"").strip()
    question_id = data.get('question_id')
    if not user_answer: return jsonify({"error": "Answer cannot be empty"}), 400
    try: question_id = int(question_id)
    except (ValueError, TypeError): return jsonify({"error": "Invalid question ID"}), 400

    question_obj = next((q for q in quiz_state['questions'] if q["id"] == question_id), None)
    if not question_obj: return jsonify({"error": "Question not found in session"}), 404

    correct_answer = question_obj["answer"]
    question_text = question_obj["question"]

    # Ensure counters exist before incrementing
    quiz_state.setdefault('answered_questions', [])
    quiz_state.setdefault('total_attempts', 0)
    quiz_state.setdefault('correct_answers', 0)

    if question_id not in quiz_state['answered_questions']:
        quiz_state['answered_questions'].append(question_id)
    quiz_state['total_attempts'] += 1

    prompt_content = f"""
        Task: Evaluate if the user's answer to the quiz question is correct. Be precise.
        Question: {question_text}
        Correct Answer: {correct_answer}
        User's Answer: {user_answer}
        Instructions: 
        1. Compare the user's answer to the correct answer to see if they are semantically equivalent and address the question accurately. Do not just look for keyword matches. Consider the meaning. If users answer is correct but has some spelling error give the respose as Correct [spelling error, Correct spelling: '{correct_answer}'].
        2. If the user's answer is essentially the same as the correct answer in meaning and accurately answers the question, respond with ONLY the word: "Correct!".
        3. If the user's answer is incorrect, or does not answer the question, or is irrelevant, respond with: "Incorrect. The correct answer is: '{correct_answer}'. [Concise explanation of why the user was wrong and what the correct concept is, focusing on the key concept]."
        4. Keep all explanations very concise and directly related to the question and answer. Do not engage in general conversation or provide extra details.
        5. Do not include any additional text or context outside of the answer evaluation.
        6. Do not include any disclaimers or unnecessary information.
        Response:"""

    is_correct = False
    response_text = f"Incorrect. The correct answer is: '{correct_answer}'. AI evaluation unavailable."

    try:
        response = quiz_model.generate_content(prompt_content)
        raw_response = response.text.strip()
        print(f"Quiz Model Raw Response: {raw_response}")
        if raw_response.startswith("Correct!"):
            is_correct = True
            quiz_state['correct_answers'] += 1
            response_text = raw_response
        elif raw_response.startswith("Incorrect."):
             is_correct = False
             response_text = raw_response
        else:
            is_correct = False
            response_text = f"Incorrect. The correct answer is: '{correct_answer}'. (AI response format unexpected)"

        session.modified = True # Mark modified due to potential correct_answers change, or answered_questions
    except Exception as e:
        print(f"Error using Quiz Model API for answer check: {e}")
        # Return error without modifying session further if API fails
        return jsonify({
            "chatbot_feedback": response_text, "correct_answer": correct_answer,
            "is_correct": False, # Explicitly false
            "completed_questions": len(quiz_state.get('answered_questions', [])), # Reflect current state
            "total_questions": len(quiz_state.get('questions', [])),
            "correct_answers": quiz_state.get('correct_answers', 0),
            "total_attempts": quiz_state.get('total_attempts', 0)
         }), 500

    # Return success response
    return jsonify({
        "chatbot_feedback": response_text, "correct_answer": correct_answer,
        "is_correct": is_correct,
        "completed_questions": len(quiz_state['answered_questions']),
        "total_questions": len(quiz_state['questions']),
        "correct_answers": quiz_state['correct_answers'],
        "total_attempts": quiz_state['total_attempts']
    })


@app.route('/api/hint', methods=['POST'])
def get_hint():
    # Hint doesn't require AI model, just fetches from data
    quiz_state = session.get('quiz_state')
    if not quiz_state: return jsonify({"error": "Quiz session not found."}), 400
    data = request.get_json();
    if not data: return jsonify({"error": "No data received"}), 400
    try: question_id = int(data.get('question_id'))
    except (ValueError, TypeError): return jsonify({"error": "Invalid question ID"}), 400

    question_obj = next((q for q in quiz_state['questions'] if q["id"] == question_id), None)
    if not question_obj: return jsonify({"error": "Question not found in session"}), 404

    hint = question_obj.get("hint", "No hint available.")
    return jsonify({"hint": hint, "question_id": question_id})

@app.route('/api/ask_chatbot', methods=['POST'])
def ask_chatbot():
    model_check = check_model(quiz_model, "providing help")
    if model_check: return model_check

    quiz_state = session.get('quiz_state')
    if not quiz_state: return jsonify({"error": "Quiz session context not found."}), 400
    data = request.get_json()
    if not data: return jsonify({"error": "No data received for help"}), 400

    help_question = data.get('help_question',"").strip()
    question_id = data.get('question_id')
    if not help_question: return jsonify({"error": "Help question cannot be empty"}), 400
    try: question_id = int(question_id)
    except (ValueError, TypeError): return jsonify({"error": "Invalid question ID for help"}), 400

    question_obj = next((q for q in quiz_state['questions'] if q["id"] == question_id), None)
    if not question_obj: return jsonify({"error": "Associated quiz question not found"}), 404

    question_text = question_obj["question"]
    correct_answer = question_obj["answer"]

    help_prompt_content = f"""
        Context: User is asking for help on a quiz question.
        Original Quiz Question: {question_text}
        Correct Answer (for context, do not reveal directly): {correct_answer}
        User's Help Request: {help_question}
        Task: Answer the user's request concisely, clarifying concepts related to the quiz question without giving the answer away. Be helpful and encouraging.
        Response:""" # Keep instructions concise

    response_text = "Sorry, I couldn't get help from the AI assistant."
    try:
        response = quiz_model.generate_content(help_prompt_content) # Use quiz_model
        response_text = response.text.strip()
        print(f"Quiz Model Help Response: {response_text}")
    except Exception as e:
        print(f"Error using Quiz Model API for help: {e}")

    return jsonify({"chatbot_response": response_text})


@app.route('/api/reset', methods=['POST'])
def reset_quiz():
    print("Resetting quiz state for user:", session.get('user_id', 'Unknown'))
    # Re-initializes the quiz state in the session
    questions = questions_data_original.copy(); random.shuffle(questions)
    session['quiz_state'] = {
        'questions': questions, 'current_question_index': 0, 'answered_questions': [],
        'correct_answers': 0, 'total_attempts': 0
    }
    session.modified = True
    return jsonify({
        "success": True, "message": "Quiz progress has been reset.",
        "total_questions": len(questions_data_original)
    })

# == Game API Routes ==
@app.route('/api/generated_content', methods=['GET'])
def get_generated_content():
    # Game content fetch doesn't require AI model
    if not prompt_game_data: return jsonify({"error": "No game content available"}), 404
    content_item = random.choice(prompt_game_data)
    return jsonify({ "id": content_item["id"], "type": content_item["type"], "output": content_item["output"] })

@app.route('/api/submit_prompt_guess', methods=['POST'])
def submit_prompt_guess():
    model_check = check_model(game_model, "evaluating prompt guess")
    if model_check: return model_check

    data = request.get_json()
    if not data: return jsonify({"error": "No data received"}), 400

    content_id = data.get('content_id')
    user_guess = data.get('user_guess',"").strip()
    if not content_id or not user_guess: return jsonify({"error": "Missing content ID or guess"}), 400

    content_item = next((item for item in prompt_game_data if item["id"] == content_id), None)
    if not content_item: return jsonify({"error": "Game content item not found"}), 404

    original_prompt = content_item["original_prompt"]
    ai_output_context = content_item["output"]
    if content_item["type"] == "text" and len(ai_output_context) > 300:
        ai_output_context = ai_output_context[:300] + "..."

    evaluation_prompt = f"""
        Task: Evaluate similarity between "User's Guessed Prompt" and "Original Prompt" for the given "AI Output Context".
        AI Output Context ({content_item['type']}): {ai_output_context}
        Original Prompt: {original_prompt}
        User's Guessed Prompt: {user_guess}
        Instructions: Respond ONLY in the format `Similarity: [Rating]. Explanation: [Brief Explanation]`. Ratings: "Very Similar", "Somewhat Similar", "Not Similar".
        Response:""" # Keep instructions concise

    feedback = "Evaluation failed."
    similarity = "N/A"
    explanation = "Could not get evaluation from AI."

    try:
        response = game_model.generate_content(evaluation_prompt) # Use game_model
        raw_feedback = response.text.strip()
        print(f"Game Model Eval Raw Response: {raw_feedback}")
        if raw_feedback.startswith("Similarity:") and ". Explanation:" in raw_feedback:
             parts = raw_feedback.split(". Explanation:", 1)
             sim_part = parts[0].replace("Similarity:", "").strip()
             expl_part = parts[1].strip()
             valid_sim = ["Very Similar", "Somewhat Similar", "Not Similar"]
             if sim_part in valid_sim:
                 similarity = sim_part
                 explanation = expl_part
             else: explanation = raw_feedback # Use full response if rating invalid
        else: explanation = raw_feedback # Use full response if format invalid

    except Exception as e:
        print(f"Error using Game Model API for evaluation: {e}")

    return jsonify({ "similarity": similarity, "feedback": explanation, "original_prompt": original_prompt })

# --- Run ---
if __name__ == '__main__':
    if model_init_error:
        print("\n" + "="*60)
        print(f"WARNING: AI Model Initialization Issues:\n- {model_init_error}")
        print("Application will run, but AI features might be broken.")
        print("="*60 + "\n")
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

# --- END OF FILE app.py ---