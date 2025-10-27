/* globals document confirm btoa */
/* globals b2Vec2 */
var graphFns = require("./draw/plot-graphs.js");
var simulationFactory = require("./lib/graph-simulation.js");

// ======= WORLD STATE ======

var $graphList = document.querySelector("#graph-list");
var $graphTemplate = document.querySelector("#graph-template");
var $seedInput = document.querySelector("#newseed");

function stringToHTML(s) {
  var temp = document.createElement("div");
  temp.innerHTML = s;
  return temp.children[0];
}

var graphElements = new Map();

function ensureGraph(key) {
  var refs = graphElements.get(key);
  if (refs) {
    return refs;
  }
  var $graph = stringToHTML($graphTemplate.innerHTML);
  $graph.id = "graph-" + key;
  $graphList.appendChild($graph);
  refs = {
    root: $graph,
    canvas: $graph.querySelector(".graphcanvas"),
    topScores: $graph.querySelector(".topscores"),
    scatter: $graph.querySelector(".scatterplot"),
  };
  graphElements.set(key, refs);
  return refs;
}

function clearGraphs() {
  graphElements.forEach(function (refs) {
    graphFns.clearGraphics(refs.canvas);
    refs.topScores.innerHTML = "";
    if (refs.scatter) {
      refs.scatter.innerHTML = "";
    }
  });
  $graphList.innerHTML = "";
  graphElements.clear();
}

var simulation = simulationFactory.createGraphSimulation({
  onGenerationEnd: function (payload) {
    var key = payload.key;
    var refs = ensureGraph(key);
    return graphFns.plotGraphs(
      refs.canvas,
      refs.topScores,
      refs.scatter,
      payload.previousGraphState,
      payload.scores,
      {}
    );
  },
  onReset: function () {
    clearGraphs();
  },
});

document.querySelector("#new-population").addEventListener("click", function () {
  simulation.resetWorld();
});

document.querySelector("#confirm-reset").addEventListener("click", function () {
  if (confirm("Really reset world?")) {
    var seed = ($seedInput && $seedInput.value || "").trim();
    var overrides = {};
    if (seed) {
      overrides.floorseed = btoa(seed);
    }
    simulation.resetWorld(overrides);
  }
});

document.querySelector("#fast-forward").addEventListener("click", function () {
  simulation.runRound();
});

simulation.resetWorld();
