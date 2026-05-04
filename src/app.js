import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import errorHandler from './middleware/errorHandler.js';
import Database from './config/Database.js';
import authRoutes from './modules/auth/auth.routes.js';
import medicineRoutes from './modules/medicine/medicine.routes.js';
import alertsRoutes from './modules/alerts/alerts.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://my-medicine-tracker.netlify.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// app.use(limiter);
if (NODE_ENV !== 'test') {
  app.use(limiter);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Medicine Tracker API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`[${NODE_ENV}] Medicine Tracker API listening on port ${PORT}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected to Local DB' : 'No database URL'}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await Database.close();
    console.log('HTTP server closed');
  });
});

export default app;
