require('dotenv').config();
const { startWebSocketServer } = require('./server');

const PORT = process.env.PORT || 8080;

startWebSocketServer(PORT);


