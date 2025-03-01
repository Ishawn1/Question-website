from flask import Flask, jsonify, render_template, request
import google.generativeai as genai  
import random 
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

questions_data_original = [
    {"id": 1, "question": "What is the primary advantage of Human-AI collaboration?", "answer": "Enhanced Productivity"},
    {"id": 2, "question": "Which neural network model is designed to mimic human brain functions?", "answer": "Spiking Neural Network"},
    {"id": 3, "question": "What is a key ethical concern in AI decision-making?", "answer": "Bias"},
    {"id": 4, "question": "Which AI-powered tool is commonly used in mental health therapy?", "answer": "Woebot"},
    {"id": 5, "question": "Which AI-driven model helps in predicting extreme weather conditions?", "answer": "GenCast"},
    {"id": 6, "question": "Which AI-based system is used for fraud detection in banking?", "answer": "Machine Learning"},
    {"id": 7, "question": "What AI technology is used to create digital artwork?", "answer": "DALL-E"},
    {"id": 8, "question": "Which AI-based chatbot helps in personalized learning for students?", "answer": "Squirrel AI"},
    {"id": 9, "question": "What is the term for AI models that provide justifications for their decisions?", "answer": "Explainable AI"},
    {"id": 10, "question": "What is the AI-driven concept where machines surpass human intelligence?", "answer": "Singularity"}
    ]
questions_data = questions_data_original.copy() 
random.shuffle(questions_data) 

# Track the current question index (0-based)
current_question_index = 0 

# Track which questions have been answered (by their IDs)
answered_questions = set()

# Configure the AI model
genai.configure(api_key=os.environ.get('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-pro-exp-02-05')  

@app.route('/api/question', methods=['GET'])
def get_question():
    global current_question_index 
    if current_question_index >= len(questions_data): 
        current_question_index = 0 
        random.shuffle(questions_data) 

    question = questions_data[current_question_index]
    
    # Add metadata for frontend progress tracking
    # The question_number starts at 1 (not 0) for user-friendly display
    question_with_meta = {
        **question,
        "question_number": current_question_index + 1,
        "total_questions": len(questions_data),
        "completed_questions": len(answered_questions)
    }
    
    # Only increment after sending the response
    current_question_index += 1 
    return jsonify(question_with_meta)

@app.route('/api/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    print(f"Backend received data: {data}")

    if not data:
        return jsonify({"error": "No data received"}), 400

    user_answer = data.get('user_answer')
    question_id = data.get('question_id')

    # Find the question by ID
    question_obj = next((q for q in questions_data if q["id"] == int(question_id)), None)
    if not question_obj:
        return jsonify({"error": "Question not found"}), 400

    correct_answer = question_obj["answer"]
    question_text = question_obj["question"]

    print(f"Checking answer for question ID: {question_id}, User answer: {user_answer}, Correct answer: {correct_answer}")

    # Add this question ID to answered questions set
    answered_questions.add(int(question_id))

    prompt_content = f"""
        Task: Check if the user's answer to the question is correct or incorrect. Be strict and precise.

        Question: {question_text}
        User's answer: {user_answer}
        Correct answer: {correct_answer}

        Instructions:
        1. Compare the user's answer to the correct answer to see if they are semantically equivalent and address the question accurately. Do not just look for keyword matches. Consider the meaning. If user has given empty answer give reply "Empty"
        2. If the user's answer is essentially the same as the correct answer in meaning and accurately answers the question, respond with ONLY the word: "Correct!".
        3. If the user's answer is incorrect, or does not answer the question, or is irrelevant, respond with: "Incorrect. The correct answer is: '{correct_answer}'. [Concise explanation of why the user was wrong and what the correct concept is, focusing on the key concept]."
        4. Keep all explanations very concise and directly related to the question and answer. Do not engage in general conversation or provide extra details.

        Response:
        """

    try:
        response = model.generate_content(prompt_content)  # Use Gemini API
        chatbot_response_text = response.text.strip()  # Extract text response and strip whitespace
        print(f"Gemini API Response: {chatbot_response_text}")

    except Exception as e:
        print(f"Error using Gemini API: {e}")
        return jsonify({"error": "Error checking answer with AI (Gemini)"}), 500

    return jsonify({
        "chatbot_feedback": chatbot_response_text,
        "correct_answer": correct_answer,
        "is_correct": chatbot_response_text.startswith("Correct"),
        "completed_questions": len(answered_questions),
        "total_questions": len(questions_data)
    })

@app.route('/api/ask_chatbot', methods=['POST'])  # New API endpoint for help questions
def ask_chatbot():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data received for help question"}), 400

    help_question = data.get('help_question')
    question_id = data.get('question_id')

    if not help_question or not help_question.strip(): # Check for empty help question on backend too
        return jsonify({"error": "Help question cannot be empty"}), 400

    question_obj = next((q for q in questions_data if q["id"] == int(question_id)), None)
    if not question_obj:
        return jsonify({"error": "Question not found"}), 400

    question_text = question_obj["question"]
    correct_answer = question_obj["answer"] # We can include correct answer in context for chatbot

    print(f"Received help question for question ID: {question_id}, Help question: {help_question}")

    # --- Gemini Help Chatbot Prompt ---
    help_prompt_content = f"""
        Original Question: {question_text}
        Correct Answer: {correct_answer}
        User's Help Question: {help_question}

        Task: Answer the user's help question clearly and concisely. Focus on providing helpful clarification and guidance related to the original question and its topic.

        Instructions:
        1. Understand the user's help question in the context of the original question and the correct answer.
        2. Provide a helpful and concise answer that directly addresses the user's help question.
        3. Focus on clarifying concepts, providing hints, or explaining aspects related to the original question.
        4. Keep your response strictly related to the topic of the original question. Do not go off-topic or engage in general conversation.
        5. Be encouraging and helpful in your tone.

        Response:
        """

    try:
        response = model.generate_content(help_prompt_content) # Use Gemini API to answer help question
        chatbot_response_text = response.text.strip()
        print(f"Gemini Help Chatbot Response: {chatbot_response_text}")
    except Exception as e:
        print(f"Error using Gemini API for help question: {e}")
        return jsonify({"error": "Error getting chatbot help from AI (Gemini)"}), 500

    return jsonify({"chatbot_response": chatbot_response_text}) # Return help response to frontend

@app.route('/api/progress', methods=['GET'])
def get_progress():
    """Return total number of questions available"""
    return jsonify({
        "total_questions": len(questions_data),
        "current_index": current_question_index
    })

@app.route('/')
def index():
    return render_template('index.html')
      
if __name__ == '__main__':
    app.run(debug=True)