const fs = require('fs');
let script = fs.readFileSync('script.js', 'utf-8');

script = script.replace(/async function startQuiz\(topicVal\) \{[\s\S]*?function loadQuestion\(\) \{/, `async function startQuiz(topicVal) {
    try {
        const response = await fetch(\`/api/questions?topic=\${topicVal}\`);
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

function loadQuestion() {`);


script = script.replace(/async function saveScoreToAPI\(\) \{[\s\S]*?async function displayLeaderboard\(\) \{/, `async function saveScoreToAPI() {
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

async function displayLeaderboard() {`);

script = script.replace(/async function displayLeaderboard\(\) \{[\s\S]*?function openCreator\(\) \{/, `async function displayLeaderboard() {
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
            li.textContent = \`\${badge}\${entry.name} (\${entry.topic}) - \${entry.score}/\${entry.total}\`;
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

function openCreator() {`);


script = script.replace(/async function saveCustomQuiz\(\) \{[\s\S]*?async function loadDashboardTopics\(\) \{/, `async function saveCustomQuiz() {
    const topicId = 'custom_' + Date.now();
    const topicName = prompt('Enter a name for your custom quiz:');
    if (!topicName) return;

    const questionCards = document.querySelectorAll('.creator-question-card');
    if (questionCards.length === 0) {
        alert("Please add at least one question.");
        return;
    }

    let newQuestions = [];
    let hasError = false;

    questionCards.forEach((card, index) => {
        if (hasError) return;
        const type = card.querySelector('.q-type').value;
        const text = card.querySelector('.q-text').value.trim();
        const correctAnswer = card.querySelector('.q-correct').value.trim();

        if (!text || !correctAnswer) {
            alert(\`Question #\${index + 1} is missing text or correct answer.\`);
            hasError = true;
            return;
        }

        if (type === 'text') {
            newQuestions.push({ type: 'text', question: text, correctAnswer: correctAnswer });
        } else {
            const options = [
                card.querySelector('.q-opt1').value.trim(),
                card.querySelector('.q-opt2').value.trim(),
                card.querySelector('.q-opt3').value.trim(),
                card.querySelector('.q-opt4').value.trim()
            ];
            if (options.some(opt => !opt)) {
                alert(\`Question #\${index + 1} is missing some multiple-choice options.\`);
                hasError = true;
                return;
            }
            const correctIdx = parseInt(correctAnswer) - 1;
            if (isNaN(correctIdx) || correctIdx < 0 || correctIdx > 3) {
                alert(\`Question #\${index + 1}: Correct Answer must be 1, 2, 3, or 4.\`);
                hasError = true;
                return;
            }
            newQuestions.push({ type: 'multiple-choice', question: text, options: options, correctAnswer: correctIdx });
        }
    });

    if (hasError) return;

    try {
        const response = await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: topicId, name: topicName, icon: '🌟', questions: newQuestions })
        });
        if (response.ok) {
            alert(\`Success! Saved '\${topicName}'.\`);
            closeCreator();
            loadDashboardTopics();
        } else {
            alert('Failed to save quiz.');
        }
    } catch (err) {
        console.error('Error saving quiz:', err);
    }
}

async function loadDashboardTopics() {`);

script = script.replace(/async function loadDashboardTopics\(\) \{[\s\S]*?function filterQuizCards\(searchTerm\) \{/, `async function loadDashboardTopics() {
    try {
        const response = await fetch('/api/topics');
        const topics = await response.json();
        renderQuizCards(topics);
    } catch (error) {
        console.error('Error loading topics:', error);
        quizCardsGrid.innerHTML = '<p style="color:red; text-align:center; grid-column: 1/-1;">Failed to load quizzes. Ensure backend is running.</p>';
    }
}

function filterQuizCards(searchTerm) {`);

script = script.replace(/async function deleteTopicFromCard\(topicVal, topicLabel\) \{[\s\S]*?function populateCreatorTopics\(\) \{/, `async function deleteTopicFromCard(topicVal, topicLabel) {
    const pwd = prompt(\`Enter admin password to delete '\${topicLabel}':\`);
    if (!pwd) return;

    try {
        const response = await fetch(\`/api/topics/\${topicVal}\`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        if (response.ok) {
            alert('Topic deleted successfully.');
            loadDashboardTopics();
        } else {
            alert('Failed to delete topic. Unauthorized?');
        }
    } catch(err) {
        console.error(err);
    }
}

function populateCreatorTopics() {`);

fs.writeFileSync('script.js', script);
