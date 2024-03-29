const { Router } = require("express");
const facebookAuth = require("./facebookAuth");
const googleAuth = require("./googleAuth");
const router = Router();

router.use("/facebook", facebookAuth);
router.use("/google", googleAuth);

module.exports = router;
