// Configuration for map tiles and geospatial services
const tilesConfig = {
  // OpenStreetMap tile servers
  osm: {
    primary: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    alternatives: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },

  // Alternative tile providers (for fallback)
  cartodb: {
    primary: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20
  },

  // Tile cache settings
  cache: {
    enabled: process.env.TILE_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.TILE_CACHE_TTL) || 86400, // 24 hours
    maxSize: parseInt(process.env.TILE_CACHE_MAX_SIZE) || 1000 // number of tiles
  },

  // Rate limiting for tile requests
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // limit each IP to 1000 tile requests per windowMs
    skipSuccessfulRequests: false
  },

  // CORS settings for tile proxy
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Proxy settings (if using tile proxy)
  proxy: {
    enabled: process.env.TILE_PROXY_ENABLED === 'true',
    timeout: 5000,
    retries: 3
  }
};

// Middleware to handle tile requests with caching and CORS
const tileMiddleware = (req, res, next) => {
  // Set CORS headers for tile requests
  res.header('Access-Control-Allow-Origin', tilesConfig.cors.origin);
  res.header('Access-Control-Allow-Methods', tilesConfig.cors.methods.join(', '));
  res.header('Access-Control-Allow-Headers', tilesConfig.cors.allowedHeaders.join(', '));
  
  // Set cache headers for tiles
  if (req.path.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
    res.header('Cache-Control', `public, max-age=${tilesConfig.cache.ttl}`);
    res.header('Expires', new Date(Date.now() + tilesConfig.cache.ttl * 1000).toUTCString());
  }

  next();
};

// Utility function to get tile URL
const getTileUrl = (provider = 'osm', x, y, z, s = 'a') => {
  const config = tilesConfig[provider];
  if (!config) return null;
  
  return config.primary
    .replace('{s}', s)
    .replace('{x}', x)
    .replace('{y}', y)
    .replace('{z}', z)
    .replace('{r}', '@2x'); // for retina displays
};

// Validate tile coordinates
const isValidTileCoord = (x, y, z) => {
  const maxTile = Math.pow(2, z) - 1;
  return z >= 0 && z <= 20 && 
         x >= 0 && x <= maxTile && 
         y >= 0 && y <= maxTile;
};

module.exports = {
  tilesConfig,
  tileMiddleware,
  getTileUrl,
  isValidTileCoord
};
