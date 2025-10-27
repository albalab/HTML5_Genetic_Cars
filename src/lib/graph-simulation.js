var worldRun = require("../world/run.js");
var generationConfig = require("../generation-config");

var manageRound = {
  genetic: require("../machine-learning/genetic-algorithm/manage-round.js"),
  annealing: require("../machine-learning/simulated-annealing/manage-round.js"),
};

function buildWorldDefinition(overrides) {
  overrides = overrides || {};
  var box2dfps = overrides.box2dfps || 60;
  var maxCarHealth = overrides.max_car_health || box2dfps * 10;
  return Object.assign({
    gravity: new b2Vec2(0.0, -9.81),
    doSleep: true,
    floorseed: overrides.floorseed || btoa(Math.seedrandom()),
    tileDimensions: overrides.tileDimensions || new b2Vec2(1.5, 0.15),
    maxFloorTiles: overrides.maxFloorTiles || 200,
    mutable_floor: overrides.mutable_floor || false,
    box2dfps: box2dfps,
    motorSpeed: overrides.motorSpeed || 20,
    max_car_health: maxCarHealth,
    schema: overrides.schema || generationConfig.constants.schema,
  }, overrides);
}

function sortScoresDescending(scores) {
  return scores.slice().sort(function (a, b) {
    if (a.score.v > b.score.v) {
      return -1;
    }
    return 1;
  });
}

function createGraphSimulation(options) {
  options = options || {};
  var onGenerationEnd = options.onGenerationEnd || function () {};
  var onReset = options.onReset || function () {};
  var worldOverrides = Object.assign({}, options.worldOverrides || {});
  var roundKeys = Object.keys(manageRound);

  var states = {};
  var runners = {};
  var results = {};
  var graphState = {};
  var worldDef = buildWorldDefinition(worldOverrides);

  function resetGraphState() {
    graphState = roundKeys.reduce(function (acc, key) {
      acc[key] = {};
      return acc;
    }, {});
  }

  function resetResultState() {
    results = roundKeys.reduce(function (acc, key) {
      acc[key] = [];
      return acc;
    }, {});
  }

  function createListeners(key) {
    return {
      preCarStep: function () {},
      carStep: function () {},
      carDeath: function (carInfo) {
        carInfo.score.i = states[key].counter;
      },
      generationEnd: function (generationResults) {
        handleRoundEnd(key, generationResults);
      },
    };
  }

  function generationZero() {
    var config = generationConfig();
    states = {};
    runners = {};
    resetResultState();
    roundKeys.forEach(function (key) {
      states[key] = manageRound[key].generationZero(config);
      runners[key] = worldRun(worldDef, states[key].generation, createListeners(key));
    });
  }

  function handleGenerationEnd(key) {
    var scores = sortScoresDescending(results[key]);
    var nextGraphState = onGenerationEnd({
      key: key,
      scores: scores,
      previousGraphState: graphState[key],
    });
    if (typeof nextGraphState !== "undefined") {
      graphState[key] = nextGraphState;
    }
    results[key] = [];
  }

  function handleRoundEnd(key, scores) {
    var previousCounter = states[key].counter;
    results[key] = results[key].concat(scores);
    states[key] = manageRound[key].nextGeneration(
      states[key],
      scores,
      generationConfig()
    );
    runners[key] = worldRun(
      worldDef,
      states[key].generation,
      createListeners(key)
    );
    if (states[key].counter !== previousCounter) {
      handleGenerationEnd(key);
    }
  }

  function runRound() {
    var toRun = new Map();
    roundKeys.forEach(function (key) {
      toRun.set(key, states[key].counter);
    });
    while (toRun.size) {
      Array.from(toRun.keys()).forEach(function (key) {
        if (states[key].counter === toRun.get(key)) {
          runners[key].step();
        } else {
          toRun.delete(key);
        }
      });
    }
  }

  function resetWorld(overrides) {
    if (overrides) {
      worldOverrides = Object.assign({}, worldOverrides, overrides);
    }
    worldDef = buildWorldDefinition(worldOverrides);
    resetGraphState();
    onReset({
      worldDef: worldDef,
      roundKeys: roundKeys.slice(),
    });
    generationZero();
  }

  function setWorldOptions(partialOverrides) {
    worldOverrides = Object.assign({}, worldOverrides, partialOverrides || {});
  }

  resetGraphState();

  return {
    getRoundKeys: function () {
      return roundKeys.slice();
    },
    getWorldDefinition: function () {
      return Object.assign({}, worldDef);
    },
    getGraphState: function () {
      return Object.assign({}, graphState);
    },
    resetWorld: resetWorld,
    runRound: runRound,
    setWorldOptions: setWorldOptions,
  };
}

module.exports = {
  createGraphSimulation: createGraphSimulation,
};
