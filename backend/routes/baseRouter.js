const express = require('express');
const router = express.Router();

const baseController = require("../controllers/baseController");

router.get("/getMazePath/:id",                   baseController.getMazePath);
router.get("/getParticipantList",                baseController.getParticipantList);
router.get("/getPlayedLevels/:id",               baseController.getPlayedLevels);
router.get("/getLevelCount",                     baseController.getLevelCount);
router.get("/getLevelMousePositions/:id/:level", baseController.getLevelMousePositions);


module.exports = router;
