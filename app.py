from flask import Flask, jsonify, render_template, request
import google.generativeai as genai  
import random 
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

questions_data_original = [
    {"id": 1, "question": "What is the primary advantage of combining human judgment with AI capabilities?", "answer": "Enhanced Decision-Making"},
    {"id": 2, "question": "Which ethical issue arises due to biased training data in AI systems?", "answer": "Algorithmic Bias"},
    {"id": 3, "question": "What unique human trait complements AI’s computational power in creative tasks?", "answer": "Imagination"},
    {"id": 4, "question": "Which technology allows AI systems to interpret and generate human language effectively?", "answer": "Natural Language Processing"},
    {"id": 5, "question": "What principle ensures that AI systems are understandable and trustworthy to users?", "answer": "Explainability"},
]
questions_data = questions_data_original.copy() 
random.shuffle(questions_data) 

current_question_index = 0 

genai.configure(api_key=os.environ.get('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-pro-exp-02-05')  

@app.route('/api/question', methods=['GET'])
def get_question():
    global current_question_index 
    if current_question_index >= len(questions_data): 
        current_question_index = 0 
        random.shuffle(questions_data) 

    question = questions_data[current_question_index] 
    current_question_index += 1 
    return jsonify(question)

@app.route('/api/submit_answer', methods=['POST'])
def submit_answer():
    data = request.get_json()
    print(f"Backend received data: {data}")

    if not data:
        return jsonify({"error": "No data received"}), 400

    user_answer = data.get('user_answer')
    question_id = data.get('question_id')

    question_obj = next((q for q in questions_data if q["id"] == int(question_id)), None)
    if not question_obj:
        return jsonify({"error": "Question not found"}), 400

    correct_answer = question_obj["answer"]
    question_text = question_obj["question"]

    print(f"Checking answer for question ID: {question_id}, User answer: {user_answer}, Correct answer: {correct_answer}")

    prompt_content = f"""
        Task: Check if the user's answer to the question is correct or incorrect. Be strict and precise.

        Question: {question_text}
        User's answer: {user_answer}
        Correct answer: {correct_answer}

        Instructions:
        1. Compare the user's answer to the correct answer to see if they are semantically equivalent and address the question accurately. Do not just look for keyword matches. Consider the meaning.
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

    return jsonify({"chatbot_feedback": chatbot_response_text})

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

@app.route('/')
def index():
    return render_template('index.html')
      
if __name__ == '__main__':
    app.run(debug=True)