const fs = require('fs');
let script = fs.readFileSync('script.js', 'utf-8');

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

    try {
        let customTopics = JSON.parse(localStorage.getItem('customTopics') || '[]');
        let customQuestions = JSON.parse(localStorage.getItem('customQuestions') || '{}');

        customTopics.push({ id: topicId, name: topicName, icon: '🌟' });
        customQuestions[topicId] = newQuestions;

        localStorage.setItem('customTopics', JSON.stringify(customTopics));
        localStorage.setItem('customQuestions', JSON.stringify(customQuestions));

        alert(\`Success! Saved '\${topicName}'.\`);
        closeCreator();
        loadDashboardTopics();
    } catch (err) {
        console.error('Error saving quiz:', err);
    }
}

async function loadDashboardTopics() {`);

// Also fix the loadTopics / deleteTopic if they still exist.
script = script.replace(/const response = await fetch\('\/api\/topics'\);[\s\S]*?async function deleteTopicFromCard/, `
async function deleteTopicFromCard`);

fs.writeFileSync('script.js', script);
console.log('Refactoring 2 complete.');
