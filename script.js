// Questions data is now fetched dynamically from the backend to protect answers.

// State variables
let currentQuestionIndex = 0;
let score = 0;
let hasAnswered = false;
let participantName = "";
let participantEmail = "";
let currentQuizData = [];
let currentTopic = "";
let allTopics = []; // cache of loaded topics
let timerInterval = null;
let timeLeft = 15;
const timerDuration = 15;

// Audio & Streak gamification variables
let isMuted = false;
let currentStreak = 0;
let quizHistory = []; // Tracks { questionText, questionType, userAnswer, correctAnswer, isCorrect, points }

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const clearLeaderboardBtn = document.getElementById('clear-leaderboard-btn');

const nameInput = document.getElementById('participant-name');
const emailInput = document.getElementById('participant-email');
const resultNameEl = document.getElementById('result-name');

// Dashboard DOM Elements
const quizCardsGrid = document.getElementById('quiz-cards-grid');
const quizSearchInput = document.getElementById('quiz-search');
const participantModal = document.getElementById('participant-modal');
const confirmPlayBtn = document.getElementById('confirm-play-btn');
const cancelPlayBtn = document.getElementById('cancel-play-btn');

const questionText = document.getElementById('question-text');
const questionImageContainer = document.getElementById('question-image-container');
const questionImage = document.getElementById('question-image');
const optionsContainer = document.getElementById('options-container');
const textInputContainer = document.getElementById('text-input-container');
const textAnswerInput = document.getElementById('text-answer-input');
const submitAnswerBtn = document.getElementById('submit-answer-btn');
const textFeedback = document.getElementById('text-feedback');
const progressText = document.getElementById('question-progress');
const progressBar = document.getElementById('progress-bar');
const currentScoreEl = document.getElementById('current-score');

const finalScoreEl = document.getElementById('final-score');
const totalQuestionsEl = document.getElementById('total-questions');
const correctCountEl = document.getElementById('correct-count');
const feedbackMessageEl = document.getElementById('feedback-message');
const leaderboardList = document.getElementById('leaderboard-list');
const levelPill = document.getElementById('level-pill');

// Timer & Reaction elements
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');
const reactionOverlay = document.getElementById('reaction-overlay');
const reactionEmoji = document.getElementById('reaction-emoji');
const reactionTitle = document.getElementById('reaction-title');
const reactionSubtitle = document.getElementById('reaction-subtitle');
const reactionCloseBtn = document.getElementById('reaction-close-btn');

// Gamified elements
const streakPill = document.getElementById('streak-pill');
const muteBtn = document.getElementById('mute-btn');
const reviewList = document.getElementById('review-list');
const appContainer = document.querySelector('.app-container');

// Creator DOM Elements
const creatorScreen = document.getElementById('creator-screen');
const openCreatorBtn = document.getElementById('open-creator-btn');
const cancelCreatorBtn = document.getElementById('cancel-creator-btn');
const saveQuizBtn = document.getElementById('save-quiz-btn');
const addQuestionBtn = document.getElementById('add-question-btn');
const creatorTitle = document.getElementById('creator-title');
const creatorQuestionsList = document.getElementById('creator-questions-list');

// Event Listeners
nextBtn.addEventListener('click', handleNextButton);
submitAnswerBtn.addEventListener('click', submitTextAnswer);
restartBtn.addEventListener('click', restartQuiz);
clearLeaderboardBtn.addEventListener('click', clearLeaderboard);
reactionCloseBtn.addEventListener('click', dismissReactionAndContinue);
muteBtn.addEventListener('click', toggleMute);
openCreatorBtn.addEventListener('click', openCreator);
cancelCreatorBtn.addEventListener('click', closeCreator);
saveQuizBtn.addEventListener('click', saveCustomQuiz);
addQuestionBtn.addEventListener('click', () => addQuestionToCreator());

// Modal event listeners
confirmPlayBtn.addEventListener('click', startQuizFromModal);
cancelPlayBtn.addEventListener('click', closeParticipantModal);

// Search event listener
quizSearchInput.addEventListener('input', () => filterQuizCards(quizSearchInput.value));

// Allow pressing Enter to submit text answers or continue from overlay
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (reactionOverlay && !reactionOverlay.classList.contains('hidden')) {
            dismissReactionAndContinue();
            return;
        }
        const textContainer = document.getElementById('text-input-container');
        if (textContainer && !textContainer.classList.contains('hidden') && !hasAnswered) {
            submitTextAnswer();
        }
    }
});

// Functions

function openParticipantModal(topicValue) {
    currentTopic = topicValue;
    participantModal.classList.remove('hidden');
    if (nameInput) nameInput.focus();
}

function closeParticipantModal() {
    participantModal.classList.add('hidden');
    currentTopic = '';
}

async function startQuizFromModal() {
    const nameVal = nameInput ? nameInput.value.trim() : '';
    const emailVal = emailInput ? emailInput.value.trim() : '';
    const topicVal = currentTopic;

    if (!nameVal || !emailVal) {
        alert('Please fill in your Name and Email to start the quiz!');
        return;
    }
    if (!topicVal) {
        alert('No topic selected. Please choose a quiz to play.');
        return;
    }

    participantName = nameVal;
    participantEmail = emailVal;

    closeParticipantModal();
    await startQuiz(topicVal);
}

async function startQuiz(topicVal) {
    try {
        const response = await fetch(`/api/questions?topic=${topicVal}`);
        if (!response.ok) throw new Error('Failed to fetch questions');
        
        currentQuizData = await response.json();

        if (!currentQuizData || currentQuizData.length === 0) {
            alert('This quiz has no questions yet. Try another topic or add questions via Quiz Creator!');
            return;
        }

        currentTopic = topicVal;
        currentQuestionIndex = 0;
        score = 0;
        currentStreak = 0;
        quizHistory = [];
        if (streakPill) {
            streakPill.classList.add('hidden');
            streakPill.textContent = '🔥 Streak: 0';
        }
        if (appContainer) {
            appContainer.classList.remove('on-fire');
            appContainer.classList.remove('dashboard-mode');
        }

        updateScoreDisplay();
        totalQuestionsEl.textContent = currentQuizData.length;

        startScreen.classList.remove('active');
        quizScreen.classList.add('active');

        loadQuestion();
    } catch (error) {
        console.error(error);
        alert('Error starting quiz. Please check if backend is running.');
    }
}

function loadQuestion() {
    hasAnswered = false;
    nextBtn.classList.add('hidden');
    textFeedback.classList.add('hidden');
    
    const currentQuestion = currentQuizData[currentQuestionIndex];
    questionText.textContent = currentQuestion.question;
    
    // Update Progress
    progressText.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuizData.length}`;
    const progressPercentage = ((currentQuestionIndex) / currentQuizData.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;

    // Update Level Pill + show level-up notification on transitions
    const easyCount = currentQuizData.filter(q => q.type === 'multiple-choice').length;
    const mediumCount = currentQuizData.filter(q => q.type === 'text').length;
    let newLevel = '';
    if (currentQuestionIndex < easyCount) {
        newLevel = '🟢 Level 1 — Easy';
    } else if (currentQuestionIndex < easyCount + mediumCount) {
        newLevel = '🟡 Level 2 — Medium';
    } else {
        newLevel = '🔴 Level 3 — Hard';
    }
    // Flash the level pill on level changes
    if (levelPill.textContent !== newLevel) {
        levelPill.textContent = newLevel;
        levelPill.style.transform = 'scale(1.25)';
        setTimeout(() => { levelPill.style.transform = 'scale(1)'; }, 400);
        // Show a brief level-up toast if transitioning to a new level (not on first question)
        if (currentQuestionIndex > 0) {
            showLevelToast(newLevel);
        }
    }
    
    // Reset UI visibility
    optionsContainer.innerHTML = '';
    optionsContainer.classList.add('hidden');
    textInputContainer.classList.add('hidden');
    questionImageContainer.classList.add('hidden');
    textAnswerInput.value = '';
    textAnswerInput.disabled = false;
    submitAnswerBtn.disabled = false;

    // Configure UI based on question type
    if (currentQuestion.type === 'multiple-choice') {
        optionsContainer.classList.remove('hidden');
        currentQuestion.options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = `option option-${index}`;
            optionEl.style.animationDelay = `${index * 80}ms`;
            
            const shapes = ['▲', '◆', '●', '■'];
            const shapeEl = document.createElement('span');
            shapeEl.className = 'option-shape';
            shapeEl.textContent = shapes[index] || '●';
            
            const textEl = document.createElement('span');
            textEl.textContent = option;
            
            optionEl.appendChild(shapeEl);
            optionEl.appendChild(textEl);
            
            optionEl.addEventListener('click', () => selectOption(index, optionEl));
            optionsContainer.appendChild(optionEl);
        });
    } else if (currentQuestion.type === 'text') {
        textInputContainer.classList.remove('hidden');
        textAnswerInput.focus();
    } else if (currentQuestion.type === 'picture') {
        questionImageContainer.classList.remove('hidden');
        questionImage.src = currentQuestion.imageUrl;
        textInputContainer.classList.remove('hidden');
        textAnswerInput.focus();
    }

    // Reset and start countdown timer
    resetTimer();
    startTimer();
}

async function selectOption(selectedIndex, optionEl) {
    if (hasAnswered) return;
    hasAnswered = true;

    // Clear timer
    clearInterval(timerInterval);

    const allOptions = optionsContainer.children;

    // Disable all options immediately to prevent double clicking
    Array.from(allOptions).forEach(opt => opt.classList.add('disabled'));

    const currentQuestion = currentQuizData[currentQuestionIndex];
    // Instant local verification — correctAnswer is already in the question data
    const correctIndex = currentQuestion.correctAnswer;
    const isCorrect = selectedIndex === correctIndex;
    let pointsGained = 0;

    if (isCorrect) {
        optionEl.classList.add('correct', 'pulse-correct');
        pointsGained = Math.round(500 + 500 * (timeLeft / timerDuration));
        score += pointsGained;
        currentStreak++;
        updateScoreDisplay();
        updateStreakDisplay();
        playSound('correct');
    } else {
        optionEl.classList.add('incorrect', 'shake');
        if (correctIndex !== undefined && allOptions[correctIndex]) {
            allOptions[correctIndex].classList.add('correct', 'pulse-correct');
        }
        currentStreak = 0;
        updateStreakDisplay();
        playSound('incorrect');
    }

    // Log history
    quizHistory.push({
        questionText: currentQuestion.question,
        questionType: currentQuestion.type,
        userAnswer: currentQuestion.options[selectedIndex],
        correctAnswer: currentQuestion.options[correctIndex] || '',
        isCorrect: isCorrect,
        points: pointsGained
    });

    if (currentQuestionIndex === currentQuizData.length - 1) {
        reactionCloseBtn.innerHTML = 'Finish Quiz <span class="arrow">→</span>';
    } else {
        reactionCloseBtn.innerHTML = 'Continue <span class="arrow">→</span>';
    }

    setTimeout(() => {
        showReactionCard(isCorrect, false, correctIndex, pointsGained);
    }, 1000);
}

async function submitTextAnswer() {
    if (hasAnswered) return;

    const userAnswer = textAnswerInput.value.trim();
    if (userAnswer === "") {
        alert("Please type an answer first!");
        return;
    }

    hasAnswered = true;

    // Clear timer
    clearInterval(timerInterval);

    textAnswerInput.disabled = true;
    submitAnswerBtn.disabled = true;
    textFeedback.classList.remove('hidden');
    textFeedback.className = "text-feedback";

    const currentQuestion = currentQuizData[currentQuestionIndex];
    // Instant local verification — case-insensitive trim comparison
    const correctAnswer = currentQuestion.correctAnswer || '';
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toString().toLowerCase();
    let pointsGained = 0;

    if (isCorrect) {
        textFeedback.textContent = "✅ Correct!";
        textFeedback.className = "text-feedback correct";
        pointsGained = Math.round(500 + 500 * (timeLeft / timerDuration));
        score += pointsGained;
        currentStreak++;
        updateScoreDisplay();
        updateStreakDisplay();
        playSound('correct');
    } else {
        textFeedback.textContent = `❌ Incorrect. The correct answer was: ${correctAnswer}`;
        textFeedback.className = "text-feedback incorrect";
        currentStreak = 0;
        updateStreakDisplay();
        playSound('incorrect');
    }

    // Log history
    quizHistory.push({
        questionText: currentQuestion.question,
        questionType: currentQuestion.type,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        points: pointsGained
    });

    if (currentQuestionIndex === currentQuizData.length - 1) {
        reactionCloseBtn.innerHTML = 'Finish Quiz <span class="arrow">→</span>';
    } else {
        reactionCloseBtn.innerHTML = 'Continue <span class="arrow">→</span>';
    }

    setTimeout(() => {
        showReactionCard(isCorrect, false, correctAnswer, pointsGained);
    }, 1200);
}

function showLevelToast(levelText) {
    const existing = document.getElementById('level-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'level-toast';
    toast.className = 'level-toast';
    toast.textContent = `🚀 Level Up! ${levelText}`;
    
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 50);
    setTimeout(() => { toast.classList.remove('show'); }, 2000);
    setTimeout(() => { toast.remove(); }, 2600);
}

function showNextButton() {
    nextBtn.classList.remove('hidden');
    if (currentQuestionIndex === currentQuizData.length - 1) {
        nextBtn.textContent = 'Finish Quiz';
    } else {
        nextBtn.textContent = 'Next Question';
    }
}

function handleNextButton() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    progressBar.style.width = '100%';
    
    // Stop fire pulsers
    if (appContainer) {
        appContainer.classList.remove('on-fire');
    }
    
    // Calculate correct answers count
    const correctCount = quizHistory.filter(h => h.isCorrect).length;
    
    finalScoreEl.textContent = score; // points
    correctCountEl.textContent = correctCount; // correct count
    totalQuestionsEl.textContent = currentQuizData.length;
    resultNameEl.textContent = participantName;
    
    const percentage = correctCount / currentQuizData.length;
    if (percentage === 1) {
        feedbackMessageEl.textContent = "Perfect score! You're a genius! 🌟";
    } else if (percentage >= 0.6) {
        feedbackMessageEl.textContent = "Great job! You know your stuff! 👍";
    } else {
        feedbackMessageEl.textContent = "Good effort! Keep learning and try again! 📚";
    }

    // Play victory sound
    playSound('victory');

    // Confetti celebration
    if (typeof confetti === 'function') {
        if (percentage === 1) {
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 }
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 }
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        } else if (percentage >= 0.6) {
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 }
            });
        }
    }

    // Render summary cards list
    populateReviewList();

    saveScoreAndDisplay();
}

function restartQuiz() {
    clearInterval(timerInterval);
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
    if (appContainer) appContainer.classList.add('dashboard-mode');
    loadTopics();
}

function updateScoreDisplay() {
    currentScoreEl.textContent = score;
}

// ─────────────────────────────────────────
// Leaderboard Functions (Backend API)
// ─────────────────────────────────────────

async function saveScoreAndDisplay() {
    leaderboardList.innerHTML = '<li>Saving score...</li>';
    await saveScoreToAPI();
    await displayLeaderboard();
}

async function saveScoreToAPI() {
    try {
        await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: participantName,
                email: participantEmail,
                score: score,
                total: currentQuizData.length,
                topic: currentTopic
            })
        });
    } catch (err) {
        console.error('Error saving score:', err);
    }
}

async function displayLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        const sortedScores = await response.json();

        leaderboardList.innerHTML = '';
        if (sortedScores.length === 0) {
            leaderboardList.innerHTML = '<li>No scores yet. Be the first!</li>';
            return;
        }

        sortedScores.forEach((entry, idx) => {
            const li = document.createElement('li');
            let badge = '';
            if (idx === 0) badge = '🥇 ';
            else if (idx === 1) badge = '🥈 ';
            else if (idx === 2) badge = '🥉 ';
            li.textContent = `${badge}${entry.name} (${entry.topic}) - ${entry.score}/${entry.total}`;
            leaderboardList.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        leaderboardList.innerHTML = '<li>Error loading leaderboard.</li>';
    }
}

async function clearLeaderboard() {
    const pwd = prompt("Enter admin password to clear leaderboard:");
    if (!pwd) return;
    try {
        const response = await fetch('/api/leaderboard', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message || 'Leaderboard cleared.');
            displayLeaderboard();
        } else {
            alert(data.error || 'Failed to clear.');
        }
    } catch (e) {
        alert('Error clearing leaderboard.');
    }
}

function openCreator() {
    if (appContainer) appContainer.classList.remove('dashboard-mode');
    startScreen.classList.remove('active');
    creatorScreen.classList.add('active');
    
    // Clear inputs
    creatorTitle.value = '';
    creatorQuestionsList.innerHTML = '';
    creatorQuestionCount = 0;
    
    // Add one question by default
    addQuestionToCreator();
}

function closeCreator() {
    creatorScreen.classList.remove('active');
    startScreen.classList.add('active');
    if (appContainer) appContainer.classList.add('dashboard-mode');
}

function addQuestionToCreator() {
    creatorQuestionCount++;
    const cardId = `creator-card-${creatorQuestionCount}`;
    
    const card = document.createElement('div');
    card.id = cardId;
    card.className = 'creator-card creator-question-card';
    card.style.opacity = '0';
    card.style.animation = 'optionReveal 0.4s ease-out forwards';
    
    card.innerHTML = `
        <div class="creator-question-header">
            <span class="creator-question-number">Question #${creatorQuestionCount}</span>
            <button type="button" class="delete-question-btn" title="Delete Question">🗑️</button>
        </div>
        
        <div style="display:flex; gap:15px; flex-direction:column;">
            <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:5px;">Question Type</label>
                <select class="question-type-select">
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="text">Text Answer</option>
                    <option value="picture">Picture Guess</option>
                </select>
            </div>
            
            <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:5px;">Question Text</label>
                <input type="text" class="question-text-input" placeholder="Type the question..." required autocomplete="off">
            </div>
            
            <div class="dynamic-inputs-container">
                <!-- MCQ inputs initially -->
            </div>
        </div>
    `;
    
    const typeSelect = card.querySelector('.question-type-select');
    const dynamicContainer = card.querySelector('.dynamic-inputs-container');
    const deleteBtn = card.querySelector('.delete-question-btn');
    
    const renderTypeFields = () => {
        const type = typeSelect.value;
        dynamicContainer.innerHTML = '';
        
        if (type === 'multiple-choice') {
            dynamicContainer.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <label style="font-size:0.85rem; color:var(--text-muted); display:block;">Options</label>
                    <div class="mcq-options-grid">
                        <input type="text" class="mcq-option-0" placeholder="Option A" required autocomplete="off">
                        <input type="text" class="mcq-option-1" placeholder="Option B" required autocomplete="off">
                        <input type="text" class="mcq-option-2" placeholder="Option C" required autocomplete="off">
                        <input type="text" class="mcq-option-3" placeholder="Option D" required autocomplete="off">
                    </div>
                    <div style="margin-top:5px;">
                        <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:5px;">Correct Answer</label>
                        <select class="mcq-correct-select">
                            <option value="0">Option A</option>
                            <option value="1">Option B</option>
                            <option value="2">Option C</option>
                            <option value="3">Option D</option>
                        </select>
                    </div>
                </div>
            `;
        } else if (type === 'text') {
            dynamicContainer.innerHTML = `
                <div>
                    <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:5px;">Correct Answer</label>
                    <input type="text" class="text-answer-correct" placeholder="Type correct answer..." required autocomplete="off">
                </div>
            `;
        } else if (type === 'picture') {
            dynamicContainer.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div>
                        <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:5px;">Image URL</label>
                        <input type="url" class="picture-url-input" placeholder="Paste image URL (e.g. Unsplash)..." required autocomplete="off">
                    </div>
                    <div>
                        <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:5px;">Correct Answer</label>
                        <input type="text" class="picture-answer-correct" placeholder="Type correct answer..." required autocomplete="off">
                    </div>
                </div>
            `;
        }
    };
    
    typeSelect.addEventListener('change', renderTypeFields);
    renderTypeFields();
    
    deleteBtn.addEventListener('click', () => {
        if (creatorQuestionsList.children.length <= 1) {
            alert('Your quiz must have at least one question!');
            return;
        }
        card.remove();
        renumberQuestions();
    });
    
    creatorQuestionsList.appendChild(card);
    creatorQuestionsList.scrollTop = creatorQuestionsList.scrollHeight;
}

function renumberQuestions() {
    const cards = creatorQuestionsList.querySelectorAll('.creator-question-card');
    creatorQuestionCount = cards.length;
    cards.forEach((card, index) => {
        const numSpan = card.querySelector('.creator-question-number');
        numSpan.textContent = `Question #${index + 1}`;
    });
}

async function saveCustomQuiz() {
    const title = creatorTitle.value.trim();
    if (!title) {
        alert('Please enter a Quiz Title!');
        creatorTitle.focus();
        return;
    }
    
    const cards = creatorQuestionsList.querySelectorAll('.creator-question-card');
    if (cards.length === 0) {
        alert('Please add at least one question!');
        return;
    }
    
    const questions = [];
    let isValid = true;
    
    cards.forEach((card, index) => {
        if (!isValid) return;
        
        const type = card.querySelector('.question-type-select').value;
        const questionText = card.querySelector('.question-text-input').value.trim();
        
        if (!questionText) {
            alert(`Please fill in the Question Text for Question #${index + 1}!`);
            card.querySelector('.question-text-input').focus();
            isValid = false;
            return;
        }
        
        if (type === 'multiple-choice') {
            const opt0 = card.querySelector('.mcq-option-0').value.trim();
            const opt1 = card.querySelector('.mcq-option-1').value.trim();
            const opt2 = card.querySelector('.mcq-option-2').value.trim();
            const opt3 = card.querySelector('.mcq-option-3').value.trim();
            const correctVal = Number(card.querySelector('.mcq-correct-select').value);
            
            if (!opt0 || !opt1 || !opt2 || !opt3) {
                alert(`Please fill in all 4 Options for Question #${index + 1}!`);
                isValid = false;
                return;
            }
            
            questions.push({
                type,
                question: questionText,
                options: [opt0, opt1, opt2, opt3],
                correctAnswer: correctVal
            });
        } else if (type === 'text') {
            const correctAns = card.querySelector('.text-answer-correct').value.trim();
            if (!correctAns) {
                alert(`Please enter the Correct Answer for Question #${index + 1}!`);
                isValid = false;
                return;
            }
            questions.push({
                type,
                question: questionText,
                correctAnswer: correctAns
            });
        } else if (type === 'picture') {
            const imgUrl = card.querySelector('.picture-url-input').value.trim();
            const correctAns = card.querySelector('.picture-answer-correct').value.trim();
            
            if (!imgUrl || !correctAns) {
                alert(`Please fill in the Image URL and Correct Answer for Question #${index + 1}!`);
                isValid = false;
                return;
            }
            
            questions.push({
                type,
                question: questionText,
                imageUrl: imgUrl,
                correctAnswer: correctAns
            });
        }
    });
    
    if (!isValid) return;
    
    try {
        saveQuizBtn.disabled = true;
        saveQuizBtn.textContent = 'Saving...';
        
        
    // Bypassed fetch

        if (response.ok) {
            // Animate card out
            const card = quizCardsGrid.querySelector(`[data-topic="${topicVal}"]`);
            if (card) {
                card.style.transition = 'all 0.35s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.85)';
                setTimeout(() => card.remove(), 350);
            }
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        console.error('Network error deleting topic:', err);
        alert('Could not connect to the server.');
    }
}

// Initial load
if (appContainer) appContainer.classList.add('dashboard-mode');
loadTopics();
