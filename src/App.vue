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
            <PythonEditorComponent :code="code" ref="py" @output-changed="onPythonOutput" @python-ready="onPythonReady"/>
            <div class="log-box" v-html="log" v-if="log && log.trim().length>0"></div>
            <div class="error-box" v-html="error" v-if="error && error.trim().length>0"></div>
            <v-divider></v-divider>
            <div class="mt-2">
              <DiagramComponent v-if="selectedVisualization==='graph'" :graphModel="graphModel"></DiagramComponent>
              <ChartComponent v-else :series="chartSeries" :options="chartOptions"></ChartComponent>
            </div>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid silver;">

            <v-btn depressed color="success" style="width:100%" title="Use CTRL+Enter to execute the script" @click="execute(null)">Execute</v-btn>
            <div><p style="font-size: 10px; margin: 5px 0">Use CTRL+Enter to execute the script.</p></div>
            <v-divider class="my-1"></v-divider>
            <h3>Snippets</h3>
            <v-select :items="presetList" item-value="id" item-text="text" v-model="selectedWidgetId" dense outlined class="my-4"></v-select>
            <v-btn depressed color="success" style="width:100%" title="Adds a new snippet" @click="addSnippet()">New Snippet</v-btn>
            <v-btn depressed color="warning" class="mt-1" style="width:100%" title="Reloads the predefined snippets" @click="resetSnippets()">Reset Snippets</v-btn>
            <v-divider class="mb-3 mt-3"></v-divider>
            <h3>Properties</h3>
            <v-select class="my-4" :items="chartTypes" v-model="selectedVisualization" dense label="Visualization Type" outlined></v-select>
            <v-text-field v-model="snippetName" dense outlined label="Snippet Name"></v-text-field>
            <v-textarea v-model="snippetDescription" label="Snippet Description" outlined auto-grow></v-textarea>
            <v-btn depressed color="success" style="width:100%" title="Saves the widget" @click="saveWidget()">Save</v-btn>
            <v-divider class="my-1"></v-divider>

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
import LocalStore, {Widget} from "@/localStore";
import presets from "@/assets/presets.json";
import Utils from "@/utils";

@Component({
  components: {
    PythonEditorComponent,
    DiagramComponent,
    ChartComponent
  }
})
export default class App extends Vue {
  code: string = null;

  localStore: LocalStore = null;
  selectedWidgetId: string = "graph1";
  exampleDescription: string = null;
  snippetName: string = null;
  snippetDescription: string = null;
  chartTypes: any[] = [
    {text: "Bar Chart", value: "barchart"},
    {text: "Graph", value: "graph"}
  ];

  presetList: any[] = [];

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

  /**
   * Returns the current widgetId.
   * @returns {null}
   */
  get widgetId() {
    return this.$store.state.widgetId;
  }

  @Watch("selectedChart")
  onChartChanged() {

  }

  get graphModel() {
    return this.$store.state.graphModel;
  }

  get chartSeries() {
    return this.$store.state.chartSeries;
  }

  get chartOptions() {
    return this.$store.state.chartOptions;
  }

  get log() {
    return this.$store.state.log;
  }

  get error() {
    return this.$store.state.error;
  }

  @Watch("selectedWidgetId")
  onWidgetChanged() {
    this.$store.commit("setWidgetIt", this.selectedWidgetId);
    const widget = this.localStore.getItemById(this.selectedWidgetId);
    if (!widget) {
      return alert("The widget was not found.");
    }
    this.exampleDescription = widget.description;
    this.selectedVisualization = widget.visualization;
    this.code = widget.code;
    this.snippetName = widget.text;
    this.snippetDescription = widget.description;
    this.updateVisualization();
  }

  updatePresetList() {
    this.presetList = this.localStore.getWidgetList();
    console.log(this.presetList.map(u => u.text));
  }

  async updateVisualization() {
    this.$store.commit("clearVisualizationData");
    const widget = this.localStore.getItemById(this.selectedWidgetId);
    if (_.isNil(widget.data)) {
      this.execute(widget.code);
    } else {
      switch (widget.visualization) {
        case "graph":
          this.$store.commit("setGraphModel", widget.data);
          break;
        case "barchart":
          this.$store.commit("setChartModel", widget.data);
      }
    }
  }

  execute(code = null) {
    return (this.$refs.py as any).execute(code);
  }

  async initLocalStore() {
    this.localStore = new LocalStore();
    await this.localStore.init();
  }

  async pythonReady() {
    if (this.$store.state.pythonReady) {
      return;
    }
    while (!this.$store.state.pythonReady) {
      await new Promise(r => setTimeout(r, 300));
    }
    return;
  }

  addSnippet() {
    const w = {
      id: Utils.id(),
      text: "New Snippet",
      description: "",
      visualization: "graph",
      code: "import networkx as nx\nimport ctx\n\ng = nx. balanced_tree(5, 3)\nctx.graph = serialize_graph(g)",
      data: null
    };
    this.localStore.addItem(w);
    this.updatePresetList();
    this.selectedWidgetId = w.id;

  }

  async mounted() {
    await this.reset();
  }

  onPythonOutput(obj) {
    const {ctx, code} = obj;
    if (!_.isNil(ctx)) {
      const widget = this.localStore.getItemById(this.selectedWidgetId);
      switch (widget.visualization) {
        case "graph":
          widget.data = ctx.graph;
          break;
        case "barchart":
          widget.data = ctx.chart;
          break;

      }
      widget.code = code;
      this.code = code;
      console.log(widget.code);
      this.localStore.upsertItem(widget);

      this.updateVisualization();
    }
  }

  saveWidget() {
    const widget = this.localStore.getItemById(this.selectedWidgetId);
    widget.visualization = this.selectedVisualization;
    widget.code = this.code;
    widget.text = this.snippetName;
    widget.description = this.snippetDescription;
    this.localStore.upsertItem(widget);
    this.updatePresetList();
  }

  onPythonReady() {
    this.$store.commit("setPythonReady");
  }

  async resetSnippets() {
    localStorage.clear();
    await this.reset();
  }

  async reset() {
    await this.initLocalStore();
    await this.ensurePresetsInLocalStore();
    this.updatePresetList();
    await this.pythonReady();
    this.onWidgetChanged();
  }

  /**
   * Ensures that all the presets are in the local store.
   * @returns {Promise<void>}
   */
  async ensurePresetsInLocalStore() {
    for (const preset of presets) {
      if (!this.localStore.idExists(preset.id)) {
        this.localStore.addItem(_.clone(preset));
      }
    }
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
