// const redisClient = require("../server");

// const cache = async (req, res, next) => {
//   const { id } = req.params;
//unique key based on user for authorized data
//   const cacheKey = req.user ? `user_${req.user.userId}_${id}` : id;

//   try {
//     const data = await redisClient.get(cacheKey);
//     if (data) return res.json(JSON.parse(data));
//     next();
//   } catch (err) {
//     console.error("Redis error:", err);
//     next();
//   }
// };

// module.exports = cache;
