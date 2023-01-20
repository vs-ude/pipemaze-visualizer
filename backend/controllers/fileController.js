const fs        = require("fs");
const path      = require("path");
const { parse } = require("csv-parse/sync");


function getLevelCSVData(res, participantId) {
    if (fs.existsSync("public/out/" + participantId)) {
        const levelFiles = fs.readdirSync("public/out/" + participantId);
        let levelData = "";

        levelFiles.every((file) => {
            if (file.includes("Level")) {
                levelData = fs.readFileSync(path.join("public/out/", participantId, file), {encoding: 'utf-8'});
                return false;
            }     

            return true;
        });

        const entries = parse(levelData, {
            columns: true,
            skip_empty_lines: true
        });

        return entries;
    } else {
        res.status(400).send({msg: "Could not find leveld data for participant-ID: " + participantId});
    }
}

function getMouseCSVData(res, participantId, levelId) {
    if (fs.existsSync("public/out/" + participantId)) {
        const runFiles = fs.readdirSync(path.join("public/out", participantId));
        let mouseData = "";

        runFiles.every((file) => {
            if (file.includes("Mouse")) {
                mouseData = fs.readFileSync(path.join("public/out/", participantId, file), {encoding: 'utf-8'});
                return false;
            }

            return true;
        });

        const allEntries = parse(mouseData, {
            columns: true,
            skip_empty_lines: true,
        });

        let levelEntries = [];
        let currentLevel = false;

        allEntries.every((entry) => {
            if(entry.Level == levelId) {
                currentLevel = true;
                levelEntries.push(entry);
                return true;
            } else {
                if (currentLevel) {
                    return false;
                } else {
                    return true;
                }
            }
        });

        return levelEntries;
    } else {
        res.status(400).send({msg: "Could not find mouse data for participant-ID: " + participantId});
    }
}

module.exports = { getLevelCSVData, getMouseCSVData };