const fs = require("fs");
const levelIndeces   = require("../model/levelIndeces");
const fileController = require("./fileController");

function getMazePath(req, res, next) {
    const levelFileName = levelIndeces.indeces[req.params.id - 1];
    res.status(200).send({mazePath: "http://localhost:3001/levels/" + levelFileName + ".png"});
}

function getParticipantList(req, res, next) {
    const participantList = fs.readdirSync("public/out");
    res.status(200).send({list: participantList});
}

function getPlayedLevels(req, res, next) {
    const participantId = req.params.id;
    const levelData = fileController.getLevelCSVData(res, participantId);

    res.status(200).send(levelData);    
}

function getLevelCount(req, res, next) {
    const levelCount = fs.readdir("public/out", (err, files) => {
        if (err) {
            res.status(500).send({msg: "Could not determine level count!"});
        }

        files.length;
    });

    res.status(200).send({count: levelCount});
}

function getLevelMousePositions(req, res, next) {
    const participantId = req.params.id;
    const levelId       = req.params.level;

    const mouseData = fileController.getMouseCSVData(res, participantId, levelId);

    res.status(200).send(mouseData);
}

module.exports = { getMazePath, getParticipantList, getPlayedLevels, getLevelCount, getLevelMousePositions };