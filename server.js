const express = require("express");
const app = express();
const PORT = process.env.PORT || 12000;
const apiRoutes = require("./API/index");
const cors = require("cors");

//data caching
// const redis = require("redis");
// const redisClient = redis.createClient({ url: "redis://127.0.0.1:6379" });

// redisClient.on("error", (err) => console.log("Redis Client Error", err));
// redisClient.connect();

// module.exports = redisClient;

//middleware
app.use(express.json());
app.use(require("morgan")("dev"));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

//API routes
app.use("/api", apiRoutes);

//error handling
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).send({
    error: error.name,
    message: error.message,
    detail: error.detail || "An error occurred",
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
