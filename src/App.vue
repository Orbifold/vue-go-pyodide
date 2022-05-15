<template>
  <v-app>
    <v-app-bar
        app
        color="primary"
        dark
    >
      <img src="network.png" alt="Icon" style="height: 40px; margin: 0 15px 0 0;">
      <h1>Pyodide</h1>
    </v-app-bar>

    <v-main>
      <v-overlay :value="isBusy">
        <div style="max-width: 500px; margin: 0px auto; overflow-wrap: break-word"> {{ busyMessage }}</div>
      </v-overlay>
      <v-container>
        <v-row>
          <v-col cols="10">
            <PythonEditorComponent :code="code" ref="py"/>
            <div class="log-box" v-html="log" v-if="log && log.trim().length>0"></div>
            <div class="error-box" v-html="error" v-if="error && error.trim().length>0"></div>
            <v-divider></v-divider>
            <div class="mt-2">
              <DiagramComponent v-if="selectedVisualization==='graph'" :graphModel="graphModel"></DiagramComponent>
              <ChartComponent v-else :data="chartData" :options="chartOptions"></ChartComponent>
            </div>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid silver;">
            <v-btn depressed color="success" style="width:100%" title="Use CTRL+Enter to execute the script" @click="execute">Execute</v-btn>
            <div><p style="font-size: 10px; margin: 5px 0">Use CTRL+Enter to execute the script.</p></div>
            <v-divider class="mb-3 mt-3"></v-divider>
            <h3>Settings</h3>
            <v-select class="my-4" :items="chartTypes" v-model="selectedVisualization" dense label="Visualization" outlined></v-select>
            <v-divider class="my-1"></v-divider>
            <h3>Examples</h3>
            <v-select :items="examples" v-model="selectedExample" dense outlined class="my-4"></v-select>
            <div><p>{{ exampleDescription }}</p></div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import PythonEditorComponent from "./components/PythonEditorComponent.vue";
import DiagramComponent from "@/components/DiagramComponent.vue";

import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import ChartComponent from "@/components/ChartComponent.vue";
import * as _ from "lodash";

@Component({
  components: {
    PythonEditorComponent,
    DiagramComponent,
    ChartComponent
  }
})
export default class App extends Vue {
  code: string = null;
  chartData: any = null;
  chartOptions: any = null;

  selectedExample: string = "graph1";
  exampleDescription: string = null;
  chartTypes: any[] = [
    {text: "Bar Chart", value: "barchart"},
    {text: "Graph", value: "graph"}
  ];
  examples: any[] = [
    {
      text: "Graph 1",
      value: "graph1",
      description: "Basic script showing how to output a graph.",
      visualization: "graph",
      code: `import networkx as nx
import ctx

g = nx.watts_strogatz_graph(50, 4, .42)
ctx.graph = serialize_graph(g)`
    },
    {
      text: "Graph 2",
      value: "graph2",
      visualization: "graph",
      description: "Another one",
      code: `import ctx`
    },
    {
      text: "Bar Chart",
      value: "barchart",
      visualization: "barchart",
      description: "",
      code: ``
    }
  ];

  get selectedVisualization() {
    return this.$store.state.visualization;
  }

  set selectedVisualization(v) {
    this.$store.commit("setVisualization", v);
  }

  get isBusy() {
    return this.$store.state.isBusy;
  }

  get busyMessage() {
    return this.$store.state.busyMessage;
  }

  @Watch("selectedChart")
  onChartChanged() {

  }

  get graphModel() {
    return this.$store.state.graphModel;
  }

  get log() {
    return this.$store.state.log;
  }

  get error() {
    return this.$store.state.error;
  }

  @Watch("selectedExample")
  onExampleChanged() {
    const found = _.find(this.examples, e => e.value === this.selectedExample);
    if (!found) {
      return alert("The example was not found.");
    }
    this.exampleDescription = found.description;
    this.selectedVisualization = found.visualization;
    this.code = found.code;
  }

  execute() {
    (this.$refs.py as any).execute();
  }

  mounted() {
    this.onExampleChanged();
    this.chartData = [
      {
        name: "Sample",
        data: [1, 3, 12, 4, 2, 3, 1, 4, 15]
      }
    ];
    this.chartOptions = {
      chart: {
        height: "100%",
        width: "100%",
        type: "bar"
      },
      xaxis: {
        type: "numeric"
      },
      title: {
        text: "Test Widget"
      },
      theme: {
        palette: "palette6" // upto palette10
      }
    };
  }

}
</script>

<style>
html {
  font-family: "Roboto,Tahoma,Arial", sans-serif;
  font-size: 12px;
  color: #696969;
}

.editor {
  border-radius: 5px;
  border: 1px solid silver;
  background: #fff;
  min-height: 30vh;
  font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 5px;
}

.prism-editor__textarea:focus {
  outline: none;
}

.error-box {
  font-family: "Courier";
  font-size: 12px;
  border: 1px solid silver;
  border-radius: 5px;
  padding: 10px;
  overflow: auto;
  color: orangered;
  margin: 10px 0;
}

.log-box {
  font-family: "Courier";
  font-size: 12px;
  border: 1px solid silver;
  border-radius: 5px;
  padding: 10px;
  overflow: auto;
  color: silver;
  margin: 10px 0;
}

.vis {
  z-index: 2;
  border: 1px solid silver;
  border-radius: 5px;
  width: 100%;
  height: 50vh;
  cursor: auto;
  background-color: rgba(255, 255, 255, 0.9)
}
</style>
