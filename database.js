import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    topic: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const archiveSchema = new mongoose.Schema({
    archived_at: { type: Date, default: Date.now },
    scores: [scoreSchema]
});

const customQuizSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    questions: { type: Array, required: true }
});

export const Score = mongoose.model('Score', scoreSchema);
export const Archive = mongoose.model('Archive', archiveSchema);
export const CustomQuiz = mongoose.model('CustomQuiz', customQuizSchema);

export async function connectDB(uri) {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

export async function saveScore({ name, email, score, total, topic }) {
    const newEntry = new Score({
        id: Date.now(),
        name,
        email,
        score,
        total,
        topic,
        created_at: new Date()
    });
    await newEntry.save();
    return newEntry.id;
}

export async function getLeaderboard(limit = 5) {
    return await Score.find().sort({ score: -1, created_at: -1 }).limit(limit).lean();
}

export async function getAllScores() {
    return await Score.find().sort({ created_at: -1 }).lean();
}

export async function clearAllScores() {
    const scores = await Score.find().lean();
    const count = scores.length;
    if (count > 0) {
        const archive = new Archive({ archived_at: new Date(), scores: scores });
        await archive.save();
        await Score.deleteMany({});
    }
    return count;
}

export async function getArchivedScores() {
    return await Archive.find().sort({ archived_at: -1 }).lean();
}

export async function saveCustomQuizModel(id, name, icon, questions) {
    const quiz = await CustomQuiz.findOne({ id });
    if (quiz) {
        quiz.name = name;
        quiz.icon = icon;
        quiz.questions = questions;
        await quiz.save();
    } else {
        const newQuiz = new CustomQuiz({ id, name, icon, questions });
        await newQuiz.save();
    }
}

export async function getCustomQuizzes() {
    return await CustomQuiz.find().lean();
}

export async function deleteCustomQuiz(id) {
    await CustomQuiz.deleteOne({ id });
}
