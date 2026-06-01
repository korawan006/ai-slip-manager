import http from 'http';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { extractSlipData } from './services/gemini.service.js';
import { insertTransaction, getTransactionsFromSupabase, checkDuplicateReference } from './services/supabase.service.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('slip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mimeType = req.file.mimetype;
    const base64Data = req.file.buffer.toString('base64');
    const userId = req.body.user_id || null;

    const slipData = await extractSlipData(mimeType, base64Data);

    // Check for duplicate reference number
    const referenceNo = slipData.referenceNo || slipData.refNo || '-';
    const isDuplicate = await checkDuplicateReference(referenceNo);
    if (isDuplicate) {
      return res.status(409).json({ error: 'Duplicate slip detected. This transaction has already been registered.' });
    }

    // Save to Supabase
    await insertTransaction(slipData, userId);
    console.log('Successfully saved to Supabase');

    res.json({ success: true, data: slipData });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process slip' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await getTransactionsFromSupabase();
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const transactions = await getTransactionsFromSupabase();
    
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTransactions = transactions.length;
    
    const revenueByDate = transactions.reduce((acc, t) => {
      const date = t.date;
      if (date) {
        acc[date] = (acc[date] || 0) + (t.amount || 0);
      }
      return acc;
    }, {});

    const chartData = Object.keys(revenueByDate).sort().map(date => ({
      name: date,
      revenue: revenueByDate[date]
    }));

    res.json({ 
      success: true, 
      data: {
        totalRevenue,
        totalTransactions,
        chartData
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
