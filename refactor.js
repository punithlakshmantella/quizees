const fs = require('fs');

let script = fs.readFileSync('script.js', 'utf-8');

// 1. replace startQuiz
script = script.replace(/async function startQuiz\(topicVal\) \{[\s\S]*?function loadQuestion\(\) \{/, `async function startQuiz(topicVal) {
    try {
        const response = await fetch('./questions.json');
        const allQuestions = await response.json();
        
        const customQuestions = JSON.parse(localStorage.getItem('customQuestions') || '{}');
        const mergedQuestions = { ...allQuestions, ...customQuestions };

        currentQuizData = mergedQuestions[topicVal];

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
        alert('Error starting quiz. Please check if questions.json exists.');
    }
}

function loadQuestion() {`);

// 2. replace saveScoreToAPI
script = script.replace(/async function saveScoreToAPI\(\) \{[\s\S]*?async function displayLeaderboard\(\) \{/, `async function saveScoreToAPI() {
    try {
        const newScore = {
            id: Date.now(),
            name: participantName,
            email: participantEmail,
            score: score,
            total: currentQuizData.length,
            topic: currentTopic,
            created_at: new Date().toISOString()
        };
        
        let scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        scores.push(newScore);
        localStorage.setItem('quizScores', JSON.stringify(scores));
        console.log('Score saved locally.');
    } catch (err) {
        console.error('Error saving score:', err);
    }
}

async function displayLeaderboard() {`);

// 3. replace displayLeaderboard and clearLeaderboard
script = script.replace(/async function displayLeaderboard\(\) \{[\s\S]*?async function clearLeaderboard\(\) \{[\s\S]*?function openCreator\(\) \{/, `async function displayLeaderboard() {
    try {
        let scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        const sortedScores = scores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.created_at) - new Date(a.created_at);
        }).slice(0, 5);

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
    if (pwd === 'admin123') {
        localStorage.removeItem('quizScores');
        alert('Leaderboard cleared.');
        displayLeaderboard();
    } else {
        alert('Incorrect password.');
    }
}

function openCreator() {`);


// 4. replace loadDashboardTopics
script = script.replace(/async function loadDashboardTopics\(\) \{[\s\S]*?function filterQuizCards\(searchTerm\) \{/, `async function loadDashboardTopics() {
    try {
        const response = await fetch('./questions.json');
        const defaultQuestions = await response.json();
        
        // Hardcode some default topic names since we removed backend
        const allTopics = [
            { id: 'history.easy', name: 'History (Easy)', icon: '🏛️', count: defaultQuestions['history.easy']?.length || 0 },
            { id: 'history.medium', name: 'History (Medium)', icon: '🏛️', count: defaultQuestions['history.medium']?.length || 0 },
            { id: 'tech.easy', name: 'Tech (Easy)', icon: '💻', count: defaultQuestions['tech.easy']?.length || 0 },
            { id: 'tech.medium', name: 'Tech (Medium)', icon: '💻', count: defaultQuestions['tech.medium']?.length || 0 },
            { id: 'space.easy', name: 'Space (Easy)', icon: '🚀', count: defaultQuestions['space.easy']?.length || 0 },
            { id: 'space.medium', name: 'Space (Medium)', icon: '🚀', count: defaultQuestions['space.medium']?.length || 0 }
        ];

        const customTopics = JSON.parse(localStorage.getItem('customTopics') || '[]');
        const customQuestions = JSON.parse(localStorage.getItem('customQuestions') || '{}');
        
        customTopics.forEach(ct => {
            ct.count = customQuestions[ct.id]?.length || 0;
            allTopics.push(ct);
        });

        renderQuizCards(allTopics);
    } catch (error) {
        console.error('Error loading topics:', error);
        quizCardsGrid.innerHTML = '<p style="color:red; text-align:center; grid-column: 1/-1;">Failed to load quizzes. Ensure questions.json is available.</p>';
    }
}

function filterQuizCards(searchTerm) {`);


// 5. replace deleteTopicFromCard
script = script.replace(/async function deleteTopicFromCard\(topicVal, topicLabel\) \{[\s\S]*?\}\s*\}\s*function populateCreatorTopics\(\) \{/, `async function deleteTopicFromCard(topicVal, topicLabel) {
    const pwd = prompt(\`Enter admin password to delete '\${topicLabel}':\`);
    if (pwd !== 'admin123') {
        alert('Unauthorized.');
        return;
    }

    let customTopics = JSON.parse(localStorage.getItem('customTopics') || '[]');
    let customQuestions = JSON.parse(localStorage.getItem('customQuestions') || '{}');
    
    customTopics = customTopics.filter(t => t.id !== topicVal);
    delete customQuestions[topicVal];
    
    localStorage.setItem('customTopics', JSON.stringify(customTopics));
    localStorage.setItem('customQuestions', JSON.stringify(customQuestions));
    
    alert('Topic deleted successfully.');
    loadDashboardTopics();
}

function populateCreatorTopics() {`);

// 6. replace saveCustomQuiz logic (this might be tricky via regex, let's just write the whole function replacement)
script = script.replace(/async function saveCustomQuiz\(\) \{[\s\S]*?async function loadDashboardTopics\(\) \{/, `async function saveCustomQuiz() {
    const topicId = document.getElementById('creator-topic-id').value.trim();
    const topicName = document.getElementById('creator-topic-name').value.trim();
    const topicIcon = document.getElementById('creator-topic-icon').value.trim();

    if (!topicId || !topicName || !topicIcon) {
        alert("Please fill in Topic ID, Name, and Icon.");
        return;
    }

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
            newQuestions.push({
                type: 'text',
                question: text,
                correctAnswer: correctAnswer
            });
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
            newQuestions.push({
                type: 'multiple-choice',
                question: text,
                options: options,
                correctAnswer: correctIdx
            });
        }
    });

    if (hasError) return;

    // Save to localStorage
    try {
        let customTopics = JSON.parse(localStorage.getItem('customTopics') || '[]');
        let customQuestions = JSON.parse(localStorage.getItem('customQuestions') || '{}');

        // Update or Add Topic
        const existingTopicIndex = customTopics.findIndex(t => t.id === topicId);
        if (existingTopicIndex >= 0) {
            customTopics[existingTopicIndex] = { id: topicId, name: topicName, icon: topicIcon };
        } else {
            customTopics.push({ id: topicId, name: topicName, icon: topicIcon });
        }

        // Add questions
        customQuestions[topicId] = (customQuestions[topicId] || []).concat(newQuestions);

        localStorage.setItem('customTopics', JSON.stringify(customTopics));
        localStorage.setItem('customQuestions', JSON.stringify(customQuestions));

        alert(\`Success! Added \${newQuestions.length} questions to '\${topicName}'.\`);
        closeCreator();
        loadDashboardTopics(); // Refresh dashboard
    } catch (err) {
        console.error('Error saving quiz:', err);
        alert('Failed to save quiz locally.');
    }
}

async function loadDashboardTopics() {`);

fs.writeFileSync('script.js', script);
console.log('Refactoring complete.');
