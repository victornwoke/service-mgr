require('dotenv').config();
const { app, sequelize } = require('./app');

const PORT = process.env.PORT || 8081;
const HOST = process.env.HOST || '0.0.0.0';

// In development, automatically sync (not in production/migrations)
if (process.env.NODE_ENV !== 'production') {
  sequelize.sync({ alter: true })
    .then(() => {
      console.log('Database synchronized (dev mode)');
    })
    .catch(err => {
      console.error('Failed to sync database:', err);
    });
}

app.listen(PORT, HOST, () => {
  console.log(`API running on http://${HOST}:${PORT}`);
  console.log(`Health: http://${HOST}:${PORT}/healthz`);
  console.log(`Ready: http://${HOST}:${PORT}/readyz`);
});