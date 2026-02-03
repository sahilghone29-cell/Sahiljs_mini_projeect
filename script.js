// State Management
let quizzes = []; // Array of quiz objects
let currentQuiz = null; // Reference to the active quiz object
let currentQuestionIndex = 0;
let userAnswers = []; // Stores user selected option indexes
let timerInterval = null;
let timeLeft = 0; // In seconds

// DOM Elements
const views = {
    creator: document.getElementById('creator-view'),
    dashboard: document.getElementById('dashboard-view'),
    setup: document.getElementById('setup-view'),
    quiz: document.getElementById('quiz-view'),
    result: document.getElementById('result-view')
};

// Creator Elements
const questionsContainer = document.getElementById('questions-container');
const quizTitleInput = document.getElementById('quiz-title');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initial Render
    showView('dashboard');
    renderQuizList();

    // Event Listeners
    document.getElementById('create-new-btn').addEventListener('click', () => {
        resetCreatorForm();
        showView('creator');
    });

    document.getElementById('add-question-btn').addEventListener('click', addQuestionInput);
    document.getElementById('save-quiz-btn').addEventListener('click', saveQuiz);
    document.getElementById('cancel-creation-btn').addEventListener('click', () => showView('dashboard'));

    document.getElementById('start-quiz-btn').addEventListener('click', beginQuiz);
    document.getElementById('back-to-dashboard-btn').addEventListener('click', () => showView('dashboard'));

    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);
    document.getElementById('home-btn').addEventListener('click', () => showView('dashboard'));
});

// Navigation / View Management
function showView(viewId) {
    // Hide all views
    Object.values(views).forEach(section => section.classList.add('hidden'));
    // Show requested view
    views[viewId].classList.remove('hidden');
}

// ---------------------------------------------------------
// 1. Quiz Creation Logic
// ---------------------------------------------------------

function resetCreatorForm() {
    quizTitleInput.value = '';
    questionsContainer.innerHTML = '';
    // Add one default empty question to start with
    addQuestionInput();
}

function addQuestionInput() {
    const questionIndex = questionsContainer.children.length;
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-block';

    questionDiv.innerHTML = `
        <div class="question-header">
            <label>Question ${questionIndex + 1}</label>
            <button type="button" class="delete-question-btn" aria-label="Delete question">Delete</button>
        </div>
        <div class="form-group">
            <input type="text" class="q-text" placeholder="Type your question here...">
        </div>
        <div class="options-group">
            <label>Options (Select correct answer)</label>
            ${// Create 4 option inputs with radio buttons for correct answer selection
        [0, 1, 2, 3].map(i => `
                <div class="option-group">
                    <input type="radio" name="correct-${questionIndex}" value="${i}" ${i === 0 ? 'checked' : ''}>
                    <input type="text" class="o-text" placeholder="Option ${i + 1}">
                </div>
            `).join('')}
        </div>
    `;

    const deleteBtn = questionDiv.querySelector('.delete-question-btn');
    deleteBtn.addEventListener('click', () => {
        if (questionsContainer.children.length <= 1) {
            alert('You must keep at least one question.');
            return;
        }
        questionDiv.remove();
        reindexQuestionBlocks();
    });

    questionsContainer.appendChild(questionDiv);
}

function reindexQuestionBlocks() {
    const blocks = questionsContainer.querySelectorAll('.question-block');
    blocks.forEach((block, index) => {
        const label = block.querySelector('.question-header label');
        if (label) label.textContent = `Question ${index + 1}`;

        const radios = block.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.name = `correct-${index}`;
        });
    });
}

function saveQuiz() {
    const title = quizTitleInput.value.trim();
    if (!title) {
        alert('Please enter a quiz title.');
        return;
    }

    const questionBlocks = document.querySelectorAll('.question-block');
    const newQuestions = [];

    // Validate and Extract Data
    for (let i = 0; i < questionBlocks.length; i++) {
        const block = questionBlocks[i];
        const qText = block.querySelector('.q-text').value.trim();
        const optionInputs = block.querySelectorAll('.o-text');
        const correctRadio = block.querySelector(`input[name="correct-${i}"]:checked`); // Find checked radio

        // Basic validation: Check empty fields
        if (!qText) {
            alert(`Question ${i + 1} is empty.`);
            return;
        }

        const options = [];
        let optionsValid = true;
        optionInputs.forEach(opt => {
            if (!opt.value.trim()) optionsValid = false;
            options.push(opt.value.trim());
        });

        if (!optionsValid) {
            alert(`Please fill all options for Question ${i + 1}.`);
            return;
        }

        newQuestions.push({
            text: qText,
            options: options,
            correctIndex: parseInt(correctRadio.value)
        });
    }

    if (newQuestions.length === 0) {
        alert('Please add at least one question.');
        return;
    }

    // Save to State
    const newQuiz = {
        id: Date.now(),
        title: title,
        questions: newQuestions
    };

    quizzes.push(newQuiz);
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    alert('Quiz saved successfully!');
    renderQuizList();
    showView('dashboard');
}

// ---------------------------------------------------------
// 2. Dashboard Logic
// ---------------------------------------------------------

function renderQuizList() {

    quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    const listContainer = document.getElementById('quiz-list');
    listContainer.innerHTML = '';

    if (quizzes.length === 0) {
        listContainer.innerHTML = '<p class="empty-state" style="padding-bottom: 20px;">No quizzes available. Create one to get started!</p>';
        return;
    }

    quizzes.forEach(quiz => {
        const item = document.createElement('div');
        item.className = 'quiz-item';
        item.innerHTML = `
            <h3>${quiz.title}</h3>
            <button class="primary-btn" style="width: auto;">Start Quiz</button>
        `;
        // Bind click event directly
        item.querySelector('button').addEventListener('click', () => startQuizSetup(quiz));
        listContainer.appendChild(item);
    });
}

// ---------------------------------------------------------
// 3. Quiz Setup & Timer Logic
// ---------------------------------------------------------

function startQuizSetup(quiz) {
    currentQuiz = quiz; // Set reference
    document.getElementById('setup-quiz-title').textContent = quiz.title;
    document.getElementById('quiz-time').value = 10; // Default Reset
    showView('setup');
}

function beginQuiz() {
    const minutes = parseInt(document.getElementById('quiz-time').value);
    if (!minutes || minutes <= 0) {
        alert('Please enter a valid time limit.');
        return;
    }

    // Initialize Quiz State
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuiz.questions.length).fill(null);
    timeLeft = minutes * 60;

    // Start Timer
    startTimer();

    // Render First Question
    renderQuestion();
    showView('quiz');
}

function startTimer() {
    updateTimerDisplay(); // Show initial time immediately

    if (timerInterval) clearInterval(timerInterval);

    // Store original time for percentage calculation
    const totalTime = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(totalTime);

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endQuiz(true); // true = forced submission by timer
        }
    }, 1000);
}

function updateTimerDisplay(totalTime) {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const timerEl = document.getElementById('timer-display');

    timerEl.textContent = `Time Remaining: ${m}:${s < 10 ? '0' : ''}${s}`;

    // Warning logic: Red if < 15% time remains
    if (totalTime && timeLeft < (totalTime * 0.15)) {
        timerEl.classList.add('warning');
    } else {
        timerEl.classList.remove('warning');
    }
}

// ---------------------------------------------------------
// 4. Quiz Taking Logic
// ---------------------------------------------------------

function renderQuestion() {
    const questionObj = currentQuiz.questions[currentQuestionIndex];

    // Update Progress
    document.getElementById('progress-text').textContent =
        `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;

    // Update Content
    document.getElementById('current-question-text').textContent = questionObj.text;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    questionObj.options.forEach((optText, index) => {
        const label = document.createElement('label');

        // Restore previous answer if exists
        const isChecked = userAnswers[currentQuestionIndex] === index;

        label.innerHTML = `
            <input type="radio" name="quiz-option" value="${index}" ${isChecked ? 'checked' : ''}>
            ${optText}
        `;

        // Add click listener for UI highlight
        label.addEventListener('click', () => {
            // Remove selected class from all siblings
            optionsContainer.querySelectorAll('label').forEach(l => l.classList.remove('selected'));
            label.classList.add('selected');
        });

        if (isChecked) label.classList.add('selected');

        optionsContainer.appendChild(label);
    });
}

function nextQuestion() {
    // 1. Validation: Check if option is selected
    const selectedOption = document.querySelector('input[name="quiz-option"]:checked');

    if (!selectedOption) {
        alert('Please select an answer before continuing.'); // Inline message preferred but alert requested in loose constraints, sticking to alert for simplicity or small inline text? Plan said small inline message.
        // Let's stick to alert as per "Keep logic minimal", but user asked for "inline message". 
        // To properly do inline message requires a new DOM element. Let's use a cleaner alert for now unless strict requirements. 
        // User PROMPT: "Show a small inline message". Okay, I will add it dynamically.
        let msg = document.getElementById('validation-msg');
        if (!msg) {
            msg = document.createElement('p');
            msg.id = 'validation-msg';
            msg.style.color = '#EF4444';
            msg.style.marginTop = '0.5rem';
            msg.style.fontSize = '0.9rem';
            document.getElementById('question-display').appendChild(msg);
        }
        msg.textContent = 'Please select an answer before continuing.';
        return;
    }

    // Clear validation msg if exists
    const existingMsg = document.getElementById('validation-msg');
    if (existingMsg) existingMsg.textContent = '';

    // Save Answer
    userAnswers[currentQuestionIndex] = parseInt(selectedOption.value);

    // 2. Increment & Check Status
    currentQuestionIndex++;

    if (currentQuestionIndex < currentQuiz.questions.length) {
        renderQuestion();
    } else {
        endQuiz(false); // Normal finish
    }
}

function endQuiz(isTimeOut) {
    clearInterval(timerInterval);

    if (isTimeOut) {
        alert('Time is up! Submitting your quiz.');
    }

    calculateResults();
    showView('result');
}

// ---------------------------------------------------------
// 5. Results & Scoring Logic
// ---------------------------------------------------------

function calculateResults() {
    let score = 0;
    const questions = currentQuiz.questions;
    const reviewContainer = document.getElementById('answers-review');
    reviewContainer.innerHTML = '';

    // 1. Calculate Score & Generate Review Items
    questions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === q.correctIndex;

        if (isCorrect) score++;

        // Render Review Item
        const reviewDiv = document.createElement('div');
        reviewDiv.className = `review-item ${isCorrect ? 'correct' : 'wrong'}`;

        const userText = userAnswer !== null ? q.options[userAnswer] : 'No Answer';
        const correctText = q.options[q.correctIndex];

        reviewDiv.innerHTML = `
            <div class="review-question">${index + 1}. ${q.text}</div>
            <div class="review-answer"><strong>Your Answer:</strong> ${userText}</div>
            <div class="review-answer" style="color: var(--text-muted)"><strong>Correct Answer:</strong> ${correctText}</div>
        `;
        reviewContainer.appendChild(reviewDiv);
    });

    // 2. Update Score Display
    document.getElementById('final-score').textContent = `${score} / ${questions.length}`;
    const percentage = Math.round((score / questions.length) * 100);
    document.getElementById('score-percentage').textContent = `${percentage}%`;

    // 2.5 Store result for this quiz
    persistQuizResult(score, questions.length, percentage);
    renderResultsHistory();

    // 3. Add Summary Sentence
    const scoreCard = document.querySelector('.score-card');

    // Remove old summary if exists
    const oldSummary = document.getElementById('summary-text');
    if (oldSummary) oldSummary.remove();

    const summaryP = document.createElement('p');
    summaryP.id = 'summary-text';
    summaryP.textContent = `You answered ${score} out of ${questions.length} questions correctly.`;
    scoreCard.appendChild(summaryP);
}

function renderResultsHistory() {
    const container = document.getElementById('results-history');
    if (!container) return;

    const results = currentQuiz && Array.isArray(currentQuiz.results) ? currentQuiz.results : [];

    if (results.length === 0) {
        container.innerHTML = '<p class="empty-state">No attempts yet.</p>';
        return;
    }

    container.innerHTML = results
        .slice()
        .reverse()
        .map(result => {
            const date = new Date(result.timestamp);
            const formattedDate = isNaN(date.getTime())
                ? result.timestamp
                : date.toLocaleString();

            return `
                <div class="result-item">
                    <span class="result-score">${result.score} / ${result.total}</span>
                    <span class="result-meta">${result.percentage}% • ${formattedDate}</span>
                </div>
            `;
        })
        .join('');
}

function persistQuizResult(score, total, percentage) {
    if (!currentQuiz) return;

    const resultsEntry = {
        score,
        total,
        percentage,
        timestamp: new Date().toISOString()
    };

    const storedQuizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    const quizIndex = storedQuizzes.findIndex(q => q.id === currentQuiz.id);

    if (quizIndex === -1) return;

    if (!Array.isArray(storedQuizzes[quizIndex].results)) {
        storedQuizzes[quizIndex].results = [];
    }

    storedQuizzes[quizIndex].results.push(resultsEntry);
    localStorage.setItem('quizzes', JSON.stringify(storedQuizzes));

    quizzes = storedQuizzes;
    currentQuiz = storedQuizzes[quizIndex];
}
