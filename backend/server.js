import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');

// Get data file path for a specific language
function getDataFile(language) {
  return path.join(DATA_DIR, `flashcards-${language}.json`);
}

// Ensure data directory and file exist for a language
async function initializeData(language = 'de') {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const dataFile = getDataFile(language);
    try {
      await fs.access(dataFile);
    } catch {
      await fs.writeFile(dataFile, JSON.stringify({ flashcards: [] }, null, 2));
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Read flashcards for a specific language
async function readFlashcards(language) {
  try {
    await initializeData(language);
    const data = await fs.readFile(getDataFile(language), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { flashcards: [] };
  }
}

// Write flashcards for a specific language
async function writeFlashcards(language, data) {
  await fs.writeFile(getDataFile(language), JSON.stringify(data, null, 2));
}

// GET all flashcards for a language
app.get('/api/flashcards', async (req, res) => {
  try {
    const language = req.query.language || 'de';
    const data = await readFlashcards(language);
    res.json(data.flashcards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read flashcards' });
  }
});

// GET flashcard by ID
app.get('/api/flashcards/:id', async (req, res) => {
  try {
    const language = req.query.language || 'de';
    const data = await readFlashcards(language);
    const flashcard = data.flashcards.find(f => f.id === req.params.id);
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }
    res.json(flashcard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read flashcard' });
  }
});

// POST create new flashcard
app.post('/api/flashcards', async (req, res) => {
  try {
    const { front, back, language, category, difficulty } = req.body;
    
    if (!front || !back) {
      return res.status(400).json({ error: 'Front and back are required' });
    }

    const lang = language || 'de';
    const data = await readFlashcards(lang);
    const newFlashcard = {
      id: Date.now().toString(),
      front,
      back,
      language: lang,
      category: category || 'general',
      difficulty: difficulty || 'medium',
      createdAt: new Date().toISOString(),
      lastReviewed: null,
      correctCount: 0,
      incorrectCount: 0
    };

    data.flashcards.push(newFlashcard);
    await writeFlashcards(lang, data);
    res.status(201).json(newFlashcard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create flashcard' });
  }
});

// PUT update flashcard
app.put('/api/flashcards/:id', async (req, res) => {
  try {
    const language = req.query.language || req.body.language || 'de';
    const data = await readFlashcards(language);
    const index = data.flashcards.findIndex(f => f.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    data.flashcards[index] = {
      ...data.flashcards[index],
      ...req.body,
      id: req.params.id // Prevent ID change
    };

    await writeFlashcards(language, data);
    res.json(data.flashcards[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update flashcard' });
  }
});

// POST record flashcard review
app.post('/api/flashcards/:id/review', async (req, res) => {
  try {
    const { correct } = req.body;
    const language = req.query.language || 'de';
    const data = await readFlashcards(language);
    const index = data.flashcards.findIndex(f => f.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    data.flashcards[index].lastReviewed = new Date().toISOString();
    if (correct) {
      data.flashcards[index].correctCount++;
    } else {
      data.flashcards[index].incorrectCount++;
    }

    await writeFlashcards(language, data);
    res.json(data.flashcards[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record review' });
  }
});

// DELETE flashcard
app.delete('/api/flashcards/:id', async (req, res) => {
  try {
    const language = req.query.language || 'de';
    const data = await readFlashcards(language);
    const index = data.flashcards.findIndex(f => f.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    data.flashcards.splice(index, 1);
    await writeFlashcards(language, data);
    res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete flashcard' });
  }
});

// Initialize and start server
Promise.all([
  initializeData('de'),
  initializeData('en')
]).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  });
});
