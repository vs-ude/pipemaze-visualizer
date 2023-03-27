# Pipe Maze Visualizer
This tool was developed for the Paper _Revising Poor Man's Eye Tracker for Crowd-Sourced Studies_ by the [Distributed Systems Group](https://vs-uni-due.de/) of University Duisburg-Essen.

Before the development, an online-based crowd study was carried out in which test persons had to solve a maze.
Since the use of classic eye-tracking methods (such as the use of infrared hardware) is not possible, the interface for the study participants was adapted in such a way that we were able to implement a "poor man's eye tracker" using only mouse movements.
The recorded mouse data points are visualized with this tool.

Furthermore, our tool supports the evaluators in identifying potential solution strategies and patterns of the test persons.

## Setup
We are using React.js for the frontend and Express.js with a REST API as our backend.<br>
Therefore, you need to have Node.js installed (+ a package manager like npm) to be able to run this project.

When first opening the project, make sure to install all packages by navigating into `backend/` and `client/` respectively and executing `npm install`.

### Data input
Our tool depends on previously collected data.<br>
Thus, you need to make some changes and input data in different places.<br>
For a better understanding, we assume that you have three levels and two participants.

#### Level images
Insert all level images (in .png format) into `backend/public/levels/`.<br>
It should look like the following:
```
pipe-visualizer
|- backend
   |- public
      |- levels
         |- level1.png
         |- level2.png
         |- level3.png
```

 To be able to connect each level image file to its corresponding level index, go to `backend/model/levelIndeces.js` and enter all level image file names into the JavaScript array so that their _array index + 1 = level index_.<br>
 In our example it should look like this:

 ``` javascript
// levelIndeces.js
    const indeces = [
        'level1.png',   // array index = 0, level index = 1
        'level2.png',   // array index = 1, level index = 2
        'level3.png',   // array index = 2, level index = 3
    ]

    module.exports =  { indeces };
 ```

#### Mouse Data
When importing the recorded mouse movements from our study website, every participant gets a folder with an unique name.<br>
These folders need to be copied into `backend/public/out/`, which should yield:
```
pipe-visualizer
|- backend
   |- public
      |- out
         |- 000000000001
            |- YYYY-MM-DD_Level.csv
            |- YYYY-MM-DD_Mouse.csv
         |- 000000000002
            |- YYYY-MM-DD_Level.csv
            |- YYYY-MM-DD_Mouse.csv
```

Each folder contains two files, one for the level data (_...Level.csv_) and one for the recorded mouse movements (_...Mouse.csv_).<br>
The preceeding date depicts the date of the study.

The level data consists out of three data points: _Timestamp_, _Level_, and _Score_.<br>
For the mouse movements we have the mouse postitions _Mouse\_X_ and _Mouse\_Y_, and the _Timestamp_ and _Level_ to give context to the positions.

## Usage
To start and use the tool, you need to start both frontend and backend.

Navigate into `client/` and run `npm start` to start the frontend.<br>
To start the backend server, go into `backend/` and run `npm run start`.

After executing both commands, you can access the tool's interface from your browser at `localhost:3000`.

## Contact
If you have any questions, suggestions or just want to get in touch, please contact
* Eileen Becks (eileen.becks@uni-due.de)
* Malte Josten (malte.josten@uni-due.de)

or visit our chair's website at https://vs.uni-due.de/.
