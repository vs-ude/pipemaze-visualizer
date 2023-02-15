import { Box, FormGroup, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Slider, Stack, Switch, Typography, Avatar } from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";
import './App.css';
import { grey } from "@mui/material/colors";

const originalMazeDimensions = {x: 1024, y: 820};
const updatedMazeDimensions  = {x: 1580, y: 1264};
const scaleFactor            = updatedMazeDimensions.x / originalMazeDimensions.x;

const pathThickness     = 5;
const pointerRadius     = 80 * scaleFactor;
const mousePosRadius    = 5;
const mouseKeyPosRadius = mousePosRadius * 2;
const startPointColor   = "#00FF00";
const endPointColor     = "#FF0000";
const defaultPathColor  = "#000000";
const fogPathColor      = "#FFFFFF";


function App() {
  const [participantList, setParticipantList] = useState([]);
  const [participantName, setParticipantName] = useState("");

  const [levels,       setLevels]       = useState([]);
  const [currentLevel, setCurrentLevel] = useState({
    Level:     "",
    Score:     "",
    Timestamp: "",
    mazePath:  "",
    nudge:     "",
  });

  const [mousePositions, setMousePositions]     = useState([]);
  // vectorProps[i] contains vector properties with starting point mousePositions[i-1] and end point mousePositions[i]
  // vectorProps.length = mousePositions.length - 1
  const [vectorProps, setVectorProps]           = useState([1,2,3]);
  const [currentMouseData, setCurrentMouseData] = useState({
    index: 0,
    date: new Date(""),
    dateString: "",
    position: {
      x: "",
      y: "",
    },
  });

  const [drawPath,       setDrawPath]       = useState(true);
  const [drawPoints,     setDrawPoints]     = useState(false);
  const [drawKeyPoints,  setDrawKeyPoints]  = useState(false);
  const [drawVecSpeed,   setDrawVecSpeed]   = useState(false);
  const [drawFogOverlay, setDrawFogOverlay] = useState(false);
  const [sliderValue,   setSliderValue]     = useState(0);

  const [vecSpeeds, setVecSpeeds] = useState({
    min: -1,
    max: -1,
  });

  let canvas  = null;
  let context = null;

  useEffect(() => {
    axios
      .get("http://localhost:3001/getParticipantList")
      .then((response) => {
        setParticipantList(response.data.list);
      })
      .catch((error) => {
        if (error) {
          console.log("Couldn't fetch participant list!");
        }
      });
  }, []);

  useEffect(() => {
    if (participantName !== "") {
      axios
        .get("http://localhost:3001/getPlayedLevels/" + participantName)
        .then((response) => {
          setLevels(response.data);    
          setCurrentLevel({
            Level:     "",
            Score:     "",
            Timestamp: "",
            mazePath:  "",
            nudge:     "",
          });
        })
        .catch((error) => {
          if (error) {
            console.log("Couldn't fetch played levels for participant: ", participantName);
          }
        });
    }
  }, [participantName]);

  useEffect(() => {
    if (currentLevel.Level !== "") {
      axios
        .get("http://localhost:3001/getLevelMousePositions/" + participantName + "/" + currentLevel.Level)
        .then((response) => {
          setSliderValue(0); 
          setMousePositions(response.data);
        })
        .catch((error) => {
          console.log("Couldn't fetch mouse positions for " + participantName + ", Level: " + currentLevel.Level);
          console.error(error);
        });

    }
  }, [currentLevel, participantName]);

  useEffect(() => {
    if(mousePositions[0] !== undefined) {
      const dateData         = generateDates(mousePositions[0].Timestamp);
      const mousePos         = generatePositions(mousePositions[0]);
      const vectorProperties = generateVectorProperties();
      
      setVectorProps(vectorProperties);
      setCurrentMouseData({
        index:      0,
        date:       dateData.date,
        dateString: dateData.dateString,
        position:   mousePos,
      });
    }
  }, [mousePositions]);

  useEffect(() => {
    if (!context) {
      canvas = document.getElementById("maze-canvas");
      if (canvas) {
        draw();
      }
    }
  }, [currentMouseData, drawPoints, drawVecSpeed, drawKeyPoints, drawFogOverlay, drawPath]);

  const draw = () => {
    context = canvas.getContext("2d");
    context.clearRect(0, 0, updatedMazeDimensions.x, updatedMazeDimensions.y);

    drawFog();
    drawMousePath();
    drawMousePoints();
    drawKeyMousePoints()
  }

  const drawFog = () => {
    if (drawFogOverlay) {
      let fogFill = context.createLinearGradient(0, 0, 0, canvas.height);
      fogFill.addColorStop(0,   "transparent");
      fogFill.addColorStop(.05, "rgba(0, 0, 0, 0.5)");
      fogFill.addColorStop(.07, "rgba(0, 0, 0, 0.8)");
      fogFill.addColorStop(.1,  "rgba(0, 0, 0, 1)");


      let radGrad = context.createRadialGradient(
        currentMouseData.position.x * scaleFactor,
        currentMouseData.position.y * scaleFactor,
        20 * scaleFactor,
        currentMouseData.position.x * scaleFactor,
        currentMouseData.position.y * scaleFactor,
        80 * scaleFactor
      );
      radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      radGrad.addColorStop(0, "rgba(255, 255, 255, 1)");

      context.globalCompositeOperation = "source-over";

      context.fillStyle = fogFill;
      context.fillRect(0, 0, updatedMazeDimensions.x, updatedMazeDimensions.y * 0.85);
      
      context.globalCompositeOperation = "xor";

      context.fillStyle = radGrad;
      context.fillRect(
        (currentMouseData.position.x - 80) * scaleFactor,
        (currentMouseData.position.y - 80) * scaleFactor,
        80 * scaleFactor * 2,
        80 * scaleFactor * 2
      );

      context.globalCompositeOperation = "source-over";
    }
  }

  const drawMousePath = () => {
    if (drawPath) {
      for (let index = 0; index < mousePositions.length; index++) {
        context.beginPath();
        context.lineWidth = pathThickness;

        if(index === 0) {
          context.moveTo(mousePositions[index].Mouse_X * scaleFactor, mousePositions[index].Mouse_Y * scaleFactor);
        } else {
          context.moveTo(mousePositions[index-1].Mouse_X * scaleFactor, mousePositions[index-1].Mouse_Y * scaleFactor);

          if(index <= currentMouseData.index) {
            if(drawVecSpeed) {
              context.strokeStyle = HSLtoRGB(vectorProps[index-1].color);
            } else {
              if (drawFogOverlay) {
                context.strokeStyle = fogPathColor;
              } else {
                context.strokeStyle = defaultPathColor;
              }
            }

            context.lineTo(mousePositions[index].Mouse_X * scaleFactor, mousePositions[index].Mouse_Y * scaleFactor);
            context.stroke();
          }
        }
      }
    }
  }

  const drawMousePoints = () => {
    if (drawPoints) {
      for (let index = 0; index <= currentMouseData.index; index++) {
        context.beginPath();

        if (drawFogOverlay) {
          context.fillStyle = fogPathColor;
        } else {
          context.fillStyle = defaultPathColor;
        }

        context.arc(mousePositions[index].Mouse_X * scaleFactor, mousePositions[index].Mouse_Y * scaleFactor, mousePosRadius, 0, 2 * Math.PI, false);
        context.fill();
      }
    }
  }

  const drawKeyMousePoints = () => {
    if (drawKeyPoints) {
      context.beginPath();
      context.fillStyle = startPointColor;
      context.arc(mousePositions[0].Mouse_X * scaleFactor, mousePositions[0].Mouse_Y * scaleFactor, mouseKeyPosRadius, 0, 2 * Math.PI, false);
      context.fill();

        if (currentMouseData.index !== 0) {
          context.beginPath();
          context.fillStyle = endPointColor;
          context.arc(mousePositions[currentMouseData.index].Mouse_X * scaleFactor, mousePositions[currentMouseData.index].Mouse_Y * scaleFactor, mouseKeyPosRadius, 0, 2 * Math.PI, false);
          context.fill();
        }
    }
  }


  const handleParticipantChange = (event) => {
    setParticipantName(event.target.value);
  }

  const handleLevelChange = (event) => {
    const levelListEntry = levels[event.target.value-1];
    axios
      .get("http://localhost:3001/getLevelData/" + levelListEntry.Level)
      .then((response) => {
        setCurrentLevel({
          Level:     levelListEntry.Level,
          Score:     levelListEntry.Score,
          Timestamp: levelListEntry.Timestamp,
          mazePath:  response.data.mazePath,
          nudge:     response.data.nudge,
        });
      })
      .catch((error) => {
        console.log("Couldn't fetch level image!");
        console.error(error);
      });
  }

  const handleSliderChange = (event) => {
    setSliderValue(event.target.value);

    const dateData = generateDates(mousePositions[event.target.value].Timestamp);
    const mousePos = generatePositions(mousePositions[event.target.value]);

    setCurrentMouseData({
      index:      event.target.value,
      date:       dateData.date,
      dateString: dateData.dateString,
      position:   mousePos,
    });
  }

  const handleIndivPositionChange = (event) => {
    setDrawPoints(event.target.checked);
  }

  const handleColorVecChange = (event) => {
    setDrawVecSpeed(event.target.checked);

    if (event.target.checked) {
      setDrawPath(true);
    }
  }

  const handleKeyPositionChange = (event) =>  {
    setDrawKeyPoints(event.target.checked);
  }

  const handleFogChange = (event) => {
    setDrawFogOverlay(event.target.checked);
  }

  const handlePathChange = (event) => {
    setDrawPath(event.target.checked);

    if (!event.target.checked) {
      setDrawVecSpeed(false);
    }
  }

  const generateDates = (timestamp) => {
    const date = new Date(parseInt(timestamp) - parseInt(mousePositions[0].Timestamp));
    const dateString = ('0' + (date.getHours()-1)).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2) + ":" + ('0' + date.getSeconds()).slice(-2);

    return {
      date:       date,  
      dateString: dateString,
    }
  }

  const generatePositions = (positionData) => {
    const mousePos = {
      x: positionData.Mouse_X,
      y: positionData.Mouse_Y,
    }

    return mousePos;
  }

  const generateVectorProperties = () => {
    let vec_props = []

    for (let index = 1; index < mousePositions.length; index++) {
      const pos1 = {
        x: mousePositions[index-1].Mouse_X,
        y: mousePositions[index-1].Mouse_Y,
      };
      const pos2 = {
        x: mousePositions[index].Mouse_X, 
        y: mousePositions[index].Mouse_Y,
      };

      const vec_dist  = Math.sqrt((Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)));
      const vec_time  = mousePositions[index].Timestamp - mousePositions[index-1].Timestamp;
      const vec_speed = vec_dist / vec_time;

      vec_props.push({
        distance: vec_dist,
        time:     vec_time,
        speed:    vec_speed,
        color:    {h: 0, s: 100, l: 50},
      });
    }

    let min = vec_props[0].speed;
    let max = vec_props[0].speed;

    vec_props.forEach(prop => {
      if (prop.speed < min) {
        min = prop.speed;
      }

      if (prop.speed > max) {
        max = prop.speed;
      }
    });

    setVecSpeeds({min: min, max: max});

    for (let index = 0; index < vec_props.length; index++) {
      const h_value = ((vec_props[index].speed - min) / (max - min)) * 256 + 30;
      vec_props[index] = {
        ...vec_props[index],
        color: {h: h_value, s: 100, l: 50},
      };
    }

    return vec_props;
  }
  
  const HSLtoRGB = (hslColor) =>  {
    let h = hslColor.h;
    let s = hslColor.s;
    let l = hslColor.l;

    s /= 100;
    l /= 100;

    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const rgb = "#" +
      (Math.floor(255 * f(0)).toString(16) + "0").slice(0,2) +
      (Math.floor(255 * f(8)).toString(16) + "0").slice(0,2) +
      (Math.floor(255 * f(4)).toString(16) + "0").slice(0,2);
    return rgb;
  }

  return (
    <Stack
      spacing={5}
      alignItems="center"
      justifyContent="center">
        <Stack 
          sx={{ margin: "20px", width: "100%" }}
          spacing={2}
          alignItems="center"
          >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-start"
            spacing={10}
            >
            <Stack direction="row" alignItems="center" justifyContent="flex-start" spacing={5}>
              <FormControl>
                <InputLabel id="participant-label">Participant</InputLabel>
                <Select
                  sx={{width: "175px"}}
                  labelId="participant-label"
                  id="participant-selector"
                  value={participantName}
                  label="Participant"
                  onChange={handleParticipantChange}
                >
                  {
                    participantList.map((entry) => (
                      <MenuItem key={entry} value={entry}>{entry}</MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel id="level-label">Level</InputLabel>
                <Select
                  sx={{width: "85px"}}
                  labelId="level-label"
                  id="level-selector"
                  value={currentLevel.Level}
                  label="Level"
                  onChange={handleLevelChange}
                >
                  { 
                  levels.map((entry) => (
                      <MenuItem key={entry.Level} value={entry.Level}>{entry.Level}</MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Stack>
            <Stack
              direction="row"
              alignItems="top"
              spacing={3}>
                <Stack>
                  <FormGroup>
                    <FormControlLabel control={<Switch onChange={handleIndivPositionChange} checked={drawPoints} disabled={mousePositions.length === 0 || currentLevel.Level === ""}/>} label="Show Points" />
                  </FormGroup>
                  <FormGroup>
                    <FormControlLabel control={<Switch onChange={handleKeyPositionChange} checked={drawKeyPoints} disabled={mousePositions.length === 0 || currentLevel.Level === ""}/>} label="Show Start-/End-Point" />
                  </FormGroup>
                  <Stack direction="row" spacing={2}>
                    <Stack direction="row" spacing={1}>
                      { drawKeyPoints ? (
                        <Avatar sx={{ bgcolor: `${startPointColor}`, width: 24, height: 24 }}> </Avatar>
                      ) : (
                        <Avatar sx={{ bgcolor: grey, width: 24, height: 24 }}> </Avatar>
                      )}
                        <Typography>Start Point</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      { drawKeyPoints ? (
                        <Avatar sx={{ bgcolor: `${endPointColor}`, width: 24, height: 24 }}> </Avatar>
                      ) : (
                        <Avatar sx={{ bgcolor: grey, width: 24, height: 24 }}> </Avatar>
                      )}
                      <Typography>End Point</Typography>
                    </Stack>
                  </Stack>

                </Stack>
                <Stack>
                  <Grid container width="300px">
                    <Grid item xs={12}>
                      <FormGroup>
                        <FormControlLabel control={<Switch onChange={handleColorVecChange} checked={drawVecSpeed} disabled={mousePositions.length === 0 || currentLevel.Level === ""} />} label="Show Vector Speed [px/ms]" /> 
                      </FormGroup>
                    </Grid>
                    <Grid item xs={6} display="flex" justifyContent="flex-start">
                      { drawVecSpeed ? (
                        <Typography textAlign="center">Min<br/>{vecSpeeds.min.toFixed(2)}</Typography>      
                      ) : (
                        <Typography textAlign="center">Min<br/>-</Typography>      
                      )}
                    </Grid>
                    <Grid item xs={6} display="flex" justifyContent="flex-end">
                      { drawVecSpeed ? (
                        <Typography textAlign="center">Max<br/>{vecSpeeds.max.toFixed(2)}</Typography>      
                      ) : (
                        <Typography textAlign="center">Max<br/>-</Typography>      
                      )}
                    </Grid>
                    <Grid item xs={12} alignItems="center" justifyContent="center">
                      { drawVecSpeed ? (
                        <Box width="100%" component="img" src="speed_indicator.png"/>
                      ) : (
                        <Box width="100%" component="img" src="speed_indicator_disabled.png"/>
                      )}
                    </Grid>      
                  </Grid>
                </Stack>
                <Stack>
                  <FormGroup>
                    <FormControlLabel control={<Switch onChange={handlePathChange} checked={drawPath} disabled={mousePositions.length === 0 || currentLevel.Level === ""} />} label="Show Path" /> 
                  </FormGroup>
                  <FormGroup>
                    <FormControlLabel control={<Switch onChange={handleFogChange} checked={drawFogOverlay} disabled={mousePositions.length === 0 || currentLevel.Level === ""} />} label="Show Fog" /> 
                  </FormGroup>
                  { currentLevel.Score !== "" ? (
                    <>
                      <Typography>Score: {currentLevel.Score}</Typography>
                      <Typography>AI Nudge(s): {currentLevel.nudge.toString()}</Typography> 
                    </>
                  ) : (
                    <>
                      <Typography>Score: -</Typography>
                      <Typography>AI Nudge(s): -</Typography>
                    </>
                  )}
                </Stack>
            </Stack>
          </Stack>
          { currentLevel.Level !== "" ? (
            <>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              width={updatedMazeDimensions.x}>
              { mousePositions.length !== 0 ? (
                <>
                <Typography>{currentMouseData.dateString}</Typography>
                <Slider
                  id="slider"
                  sx={{width: "100%"}}
                  defaultValue={0}
                  value={sliderValue}
                  step={1}
                  min={0}
                  max={mousePositions.length-1}
                  onChange={handleSliderChange} />
                </>
              ) : (
                <Typography 
                  sx={{width: "100%"}}
                  textAlign="center">
                  No Mouse Movements!
                </Typography>
              )}
            </Stack>
            </>
          ) : (
            <></>
          )}
        </Stack>
        { currentLevel.Level !== "" ? (
          <Box sx={{position: "relative"}}>
            <Box
              sx={{height: "100%", width: "100%", position: "relative"}}
              component="img"
              alignItems="center"
              justifyContent="center"
              alt="Pipe Maze"
              src={currentLevel.mazePath}
            />
            { mousePositions.length !== 0 ? (
              <>
                <canvas 
                  id="maze-canvas"
                  height="1264" 
                  width="1580" 
                  style={{position: "absolute", left: 0, top: 0}}>
                </canvas>
                { drawFogOverlay ? (
                  <></>
                ):(
                  <Box
                    sx={{height: `${pointerRadius*2}px`, width: `${pointerRadius*2}px`, position: "absolute",
                    left: `${currentMouseData.position.x*scaleFactor-pointerRadius}px`, top: `${currentMouseData.position.y*scaleFactor-pointerRadius}px`}}
                    border="2px solid black"
                    borderRadius="50%"
                  />
                )}
              </>
            ) : (<></>)}
          </Box>
          ) : (<></>) }
    </Stack>
  );
}

export default App;