require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2/promise');
const { sequelize } = require('./src/config/database');
const http = require('http');
const { Server } = require('socket.io');

// register models
const User = require('./src/models/User');
const Credential = require('./src/models/Credential');
const Assignment = require('./src/models/Assignment');
const ActionLog = require('./src/models/ActionLog');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });
app.set('io', io);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5051;
(async () => {
  try {
    // Ensure database exists before Sequelize connects
    const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;
    const connection = await mysql.createConnection({ host: DB_HOST || 'localhost', user: DB_USER || 'root', password: DB_PASS || '' });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME || 'credentials_dashboard'}\``);
    await connection.end();

    // Sync database and ensure models are properly associated
    await sequelize.sync();
    
    // Now load routes after models are initialized
    const authRoutes = require('./src/routes/auth');
    const credentialRoutes = require('./src/routes/credentials');
    const adminRoutes = require('./src/routes/admin');
    const reportsRoutes = require('./src/routes/reports');

    app.use('/api/auth', authRoutes);
    app.use('/api/credentials', credentialRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/reports', reportsRoutes);

    server.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error('DB connection failed', err);
    process.exit(1);
  }
})();

