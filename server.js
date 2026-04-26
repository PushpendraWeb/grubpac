const express = require("express");
const http = require("http");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

(function warnIfS3UploadEnvIncomplete() {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || process.env.S3_REGION;
  if (!bucket || !region) {
    console.warn(
      "[S3] Set S3_BUCKET_NAME and AWS_REGION (or S3_REGION) in config.env for file uploads."
    );
  }
})();

const { connectDB } = require("./src/config/dbConnection.js");
const cors = require("cors");
const routes = require("./src/routes/index.js");
const path = require("path");
const { ensureUploadDir } = require("./src/utils/localUpload.util");
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

// Body parsers for JSON and URL-encoded forms
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
  res.send('Hello World! Project is running');
});

// Local uploads (required by assignment)
ensureUploadDir();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB()
  .catch(() => {
    // connectDB already logs and exits on failure
    console.error('Failed to connect to database. Exiting.');
  });
routes(app);

server.listen(port, async () => {
  console.log(`Access your API at: http://localhost:${port}`);
});