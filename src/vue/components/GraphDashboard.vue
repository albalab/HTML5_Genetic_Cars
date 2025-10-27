<template>
  <div class="graph-dashboard">
    <div class="controls">
      <div class="buttons">
        <button type="button" class="button" @click="createNewPopulation">
          New Population
        </button>
        <button type="button" class="button" @click="runNextGeneration">
          Next Generation
        </button>
        <button type="button" class="button" @click="confirmWorldReset">
          Reset World
        </button>
      </div>
      <div class="seed-input">
        <label>Create new world with seed</label><br />
        <input
          v-model="seed"
          type="text"
          placeholder="Enter any string"
          class="seed-field"
        />
      </div>
    </div>

    <div class="graph-list">
      <div
        v-for="entry in graphEntries"
        :key="entry.key"
        class="graph-entry"
      >
        <h3 class="graph-title">{{ entry.title }}</h3>
        <div class="graph-panels">
          <div class="graph-holder">
            <canvas
              class="graphcanvas"
              width="400"
              height="250"
              :ref="el => setCanvasRef(entry.key, el)"
            ></canvas>
            <div class="scale" id="s100">250</div>
            <div class="scale" id="s75">187</div>
            <div class="scale" id="s50">125</div>
            <div class="scale" id="s25">62</div>
            <div class="scale" id="s0">0</div>
          </div>
          <div class="topscoreholder">
            <div
              class="topscores"
              :ref="el => setTopScoresRef(entry.key, el)"
            ></div>
          </div>
        </div>
        <div
          class="scatterplot"
          :ref="el => setScatterRef(entry.key, el)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, ref } from "vue";

const graphFns = require("../../draw/plot-graphs.js");
const simulationFactory = require("../../lib/graph-simulation.js");

function titleFromKey(key) {
  if (!key) {
    return "";
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export default defineComponent({
  name: "GraphDashboard",
  setup() {
    const seed = ref("");
    const graphEntries = reactive([]);
    const graphMap = new Map();

    const simulation = simulationFactory.createGraphSimulation({
      onGenerationEnd({ key, scores, previousGraphState }) {
        const entry = graphMap.get(key);
        if (!entry) {
          return previousGraphState;
        }
        entry.scores = scores;
        if (entry.canvasEl && entry.topScoresEl) {
          entry.graphState = graphFns.plotGraphs(
            entry.canvasEl,
            entry.topScoresEl,
            entry.scatterEl,
            entry.graphState,
            scores,
            {}
          );
        }
        return entry.graphState;
      },
      onReset() {
        graphEntries.forEach(entry => {
          entry.scores = [];
          entry.graphState = {};
          if (entry.canvasEl) {
            graphFns.clearGraphics(entry.canvasEl);
          }
          if (entry.topScoresEl) {
            entry.topScoresEl.innerHTML = "";
          }
          if (entry.scatterEl) {
            entry.scatterEl.innerHTML = "";
          }
        });
      },
    });

    const roundKeys = simulation.getRoundKeys();

    roundKeys.forEach(key => {
      const entry = reactive({
        key,
        title: titleFromKey(key),
        scores: [],
        graphState: {},
        canvasEl: null,
        topScoresEl: null,
        scatterEl: null,
      });
      graphEntries.push(entry);
      graphMap.set(key, entry);
    });

    function setCanvasRef(key, el) {
      const entry = graphMap.get(key);
      if (!entry) {
        return;
      }
      entry.canvasEl = el;
      if (el) {
        graphFns.clearGraphics(el);
      }
    }

    function setTopScoresRef(key, el) {
      const entry = graphMap.get(key);
      if (!entry) {
        return;
      }
      entry.topScoresEl = el;
      if (el) {
        el.innerHTML = "";
      }
    }

    function setScatterRef(key, el) {
      const entry = graphMap.get(key);
      if (!entry) {
        return;
      }
      entry.scatterEl = el;
      if (el) {
        el.innerHTML = "";
      }
    }

    function createNewPopulation() {
      simulation.resetWorld();
    }

    function runNextGeneration() {
      simulation.runRound();
    }

    function confirmWorldReset() {
      if (confirm("Really reset world?")) {
        const overrides = {};
        const trimmedSeed = seed.value.trim();
        if (trimmedSeed) {
          overrides.floorseed = btoa(trimmedSeed);
        }
        simulation.resetWorld(overrides);
      }
    }

    onMounted(() => {
      simulation.resetWorld();
    });

    return {
      seed,
      graphEntries,
      setCanvasRef,
      setTopScoresRef,
      setScatterRef,
      createNewPopulation,
      runNextGeneration,
      confirmWorldReset,
    };
  },
});
</script>

<style scoped>
.graph-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.button {
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
}

.seed-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.seed-field {
  padding: 6px 10px;
  font-size: 14px;
  width: 200px;
}

.graph-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.graph-entry {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.graph-title {
  margin: 0;
  font-size: 18px;
}

.graph-panels {
  display: flex;
  gap: 16px;
}

.graph-holder {
  position: relative;
}

.graph-holder .scale {
  position: absolute;
  left: 410px;
  font-size: 12px;
}

.graph-holder #s100 {
  top: 0;
}

.graph-holder #s75 {
  top: 40px;
}

.graph-holder #s50 {
  top: 80px;
}

.graph-holder #s25 {
  top: 120px;
}

.graph-holder #s0 {
  top: 160px;
}

.topscoreholder {
  min-width: 180px;
}

.scatterplot {
  min-height: 200px;
}
</style>
