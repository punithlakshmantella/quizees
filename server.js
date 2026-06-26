import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import os from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { saveScore, getLeaderboard, clearAllScores, getAllScores, getArchivedScores, connectDB, saveCustomQuizModel, getCustomQuizzes, deleteCustomQuiz } from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname)));

async function loadQuestions() {
    const data = await readFile(join(__dirname, 'questions.json'), 'utf-8');
    return JSON.parse(data);
}

// Get all topics
app.get('/api/topics', async (req, res) => {
    try {
        const questionsData = await loadQuestions();
        let topics = [];
        for (const key of Object.keys(questionsData)) {
            let name = key.replace('.', ' ');
            name = name.charAt(0).toUpperCase() + name.slice(1);
            let icon = key.includes('space') ? '🚀' : key.includes('tech') ? '💻' : '🏛️';
            topics.push({ id: key, name: name, icon: icon, count: questionsData[key].length });
        }
        
        const customQuizzes = await getCustomQuizzes();
        for (const cq of customQuizzes) {
            topics.push({ id: cq.id, name: cq.name, icon: cq.icon, count: cq.questions.length });
        }
        res.json(topics);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load topics.' });
    }
});

// Delete topic
app.delete('/api/topics/:topicVal', async (req, res) => {
    const { topicVal } = req.params;
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        await deleteCustomQuiz(topicVal);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// Get questions for a topic
app.get('/api/questions', async (req, res) => {
    const { topic } = req.query;
    if (!topic) return res.status(400).json({ error: 'Missing topic' });

    try {
        let questions = [];
        if (topic.startsWith('custom_')) {
            const quizzes = await getCustomQuizzes();
            const quiz = quizzes.find(q => q.id === topic);
            if (quiz) questions = quiz.questions;
        } else {
            const data = await loadQuestions();
            questions = data[topic] || [];
        }
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Save custom quiz
app.post('/api/questions', async (req, res) => {
    const { id, name, icon, questions } = req.body;
    try {
        await saveCustomQuizModel(id, name, icon, questions);
        res.json({ message: 'Saved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const scores = await getLeaderboard();
        res.json(scores);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Save score
app.post('/api/scores', async (req, res) => {
    const { name, email, score, total, topic } = req.body;
    try {
        await saveScore({ name, email, score, total, topic });
        res.json({ message: 'Score saved' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Clear leaderboard
app.delete('/api/leaderboard', async (req, res) => {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const deleted = await clearAllScores();
        res.json({ message: \`Leaderboard cleared. \${deleted} record(s) deleted.\` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear leaderboard' });
    }
});

function getLanIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return 'localhost';
}

if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is not defined in .env! The server will not start without a database connection.");
    process.exit(1);
}

connectDB(MONGODB_URI).then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        const lanIp = getLanIp();
        console.log(\`\n✨ Quizes App is running!\n\`);
        console.log(\`   💻 Local (this PC):     http://localhost:\${PORT}\`);
        console.log(\`   📱 Android / Mobile:    http://\${lanIp}:\${PORT}\n\`);
    });
});
