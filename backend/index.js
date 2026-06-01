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

app.post('/api/upload', upload.array('slips', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = req.body.user_id || null;
    const successful = [];
    const duplicates = [];
    const errors = [];

    // Process files sequentially to avoid Gemini API rate limits
    for (const file of req.files) {
      const fileName = file.originalname;

      try {
        const mimeType = file.mimetype;
        const base64Data = file.buffer.toString('base64');

        const slipData = await extractSlipData(mimeType, base64Data);

        // Check for duplicate reference number
        const referenceNo = slipData.referenceNo || slipData.refNo || '-';
        const isDuplicate = await checkDuplicateReference(referenceNo);

        if (isDuplicate) {
          duplicates.push({
            fileName,
            message: 'Duplicate slip detected. This transaction has already been registered.'
          });
          continue;
        }

        // Save to Supabase
        await insertTransaction(slipData, userId);
        console.log(`Successfully saved ${fileName} to Supabase`);

        successful.push({ fileName, data: slipData });
      } catch (fileError) {
        console.error(`Error processing ${fileName}:`, fileError);
        errors.push({ fileName, message: fileError.message || 'Failed to process slip' });
      }
    }

    res.json({ success: true, successful, duplicates, errors });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process slips' });
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
