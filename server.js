const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const { connectDB } = require("./src/config/dbConnection.js");
const cors = require("cors");
const routes = require("./src/routes/index.js");
const app = express();
const port = process.env.PORT || 2000;
const server = http.createServer(app);

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
  res.send('Hello World! Project is running');
});

connectDB()
  .catch(() => {
    console.error('Failed to connect to database. Exiting.');
  });
routes(app);

server.listen(port, async () => {
  console.log(`Access your API at: http://localhost:${port}`);
});