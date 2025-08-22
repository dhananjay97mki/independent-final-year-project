const authRoutes = require('../routes/auth.routes');
const usersRoutes = require('../routes/users.routes');
const companiesRoutes = require('../routes/companies.routes');
const citiesRoutes = require('../routes/cities.routes');
const cityIntelRoutes = require('../routes/cityIntel.routes');
const postsRoutes = require('../routes/posts.routes');
const chatRoutes = require('../routes/chat.routes');
const mapRoutes = require('../routes/map.routes');
const notificationsRoutes = require('../routes/notifications.routes');

module.exports = function mountRoutes(app) {
  // API base prefix
  const API_PREFIX = '/api';

  // Mount all routes
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, usersRoutes);
  app.use(`${API_PREFIX}/companies`, companiesRoutes);
  app.use(`${API_PREFIX}/cities`, citiesRoutes);
  app.use(`${API_PREFIX}/city-intel`, cityIntelRoutes);
  app.use(`${API_PREFIX}/posts`, postsRoutes);
  app.use(`${API_PREFIX}/chat`, chatRoutes);
  app.use(`${API_PREFIX}/map`, mapRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationsRoutes);

  // Log mounted routes
  console.log('API Routes mounted:');
  console.log(`${API_PREFIX}/auth - Authentication routes`);
  console.log(`${API_PREFIX}/users - User management routes`);
  console.log(`${API_PREFIX}/companies - Company routes`);
  console.log(`${API_PREFIX}/cities - City routes`);
  console.log(`${API_PREFIX}/city-intel - City intelligence routes`);
  console.log(`${API_PREFIX}/posts - Post routes`);
  console.log(`${API_PREFIX}/chat - Chat routes`);
  console.log(`${API_PREFIX}/map - Map routes`);
  console.log(`${API_PREFIX}/notifications - Notification routes`);
};
