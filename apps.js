const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let db = null;

const initializer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializer();

const convertStateObjectToResponseObject = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

const convertDistrictObjectToResponseObject = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

//Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getAllStates = `
    SELECT *
    FROM state;`;
  const stateTable = await db.all(getAllStates);
  response.send(
    stateTable.map((each) => convertStateObjectToResponseObject(each))
  );
});

//Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * 
    FROM state
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertStateObjectToResponseObject(state));
});

//Create a district in the district table, `district_id` is auto-incremented
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDetailsQuery = `
  INSERT INTO
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(postDetailsQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT *
    FROM district 
    WHERE district_id = ${districtId};`;
  const district = await dp.get(getDistrictQuery);
  response.send(convertDistrictObjectToResponseObject(district));
});

//Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDeleteQuery = `DELETE FROM district
    WHERE district_id = ${districtId};`;
  await db.run(getDeleteQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putDetailsQuery = `
  UPDATE
  district
  SET district_name = '${districtName}',
      state_id = ${stateId}, 
      cases= ${cases}, 
      cured = ${cured}, 
      active = ${active}, 
      deaths = ${deaths}
  WHERE district_id = ${districtId};`;
  await db.run(putDetailsQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalQuery = `SELECT SUM(cases) AS totalCases, SUM(cured) AS totalCured, SUM(active) AS totalActive, SUM(deaths) AS totalDeaths
    FROM district 
    WHERE state_id = ${stateId};`;
  const total = await db.get(getTotalQuery);
  response.send(total);
});

//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `SELECT state_id FROM district WHERE district_id = ${districtId}`;
  const getDistrictQuery = await db.get(districtQuery);

  const stateNameQuery = `SELECT state_name as stateName FROM state
    WHERE state_id = ${getDistrictQuery};`;
  const state = await db.get(stateNameQuery);
  response.send(state);
});

module.exports = app;
