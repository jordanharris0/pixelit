const router = require("express").Router();
module.exports = router;

router.use("/auth", require("./auth"));
router.use("/admin", require("./admin"));
router.use("/projects", require("./projects"));
router.use("/users", require("./users"));
router.use("/discover", require("./discover"));
