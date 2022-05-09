<template>
  <v-container>
    <v-overlay :value="isBusy">
     <div style="max-width: 500px; margin: 0px auto; overflow-wrap: break-word"> {{busyMessage}}</div>
    </v-overlay>
    <PrismEditor class="editor" v-model="code" :highlight="highlighter" line-numbers @keydown.ctrl.enter="execute"></PrismEditor>
    <div class="error-box" v-html="error" v-if="error && error.trim().length>0"></div>
    <DiagramView :data="data" class="mt-2"></DiagramView>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import DiagramView from "@/components/DiagramView.vue";
import * as _ from "lodash";
import {PrismEditor} from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css";
import {highlight, languages} from "prismjs/components/prism-core";
import "prismjs/components/prism-clike.min";
import "prismjs/components/prism-python.min";
import "prismjs/themes/prism-coy.min.css";

function loadScript(src) {
  // eslint-disable-line no-param-reassign
  return new Promise(function (resolve, reject) {
    let shouldAppend = false;
    let el: any = document.querySelector("script[src=\"" + src + "\"]");
    if (!el) {
      el = document.createElement("script");
      el.type = "text/javascript";
      el.async = true;
      el.src = src;
      shouldAppend = true;
    } else if (el.hasAttribute("data-loaded")) {
      resolve(el);
      return;
    }

    el.addEventListener("error", reject);
    el.addEventListener("abort", reject);
    el.addEventListener("load", function loadScriptHandler() {
      el.setAttribute("data-loaded", true);
      resolve(el);
    });

    if (shouldAppend) document.head.appendChild(el);
  });
}

function unloadScript(src) {
  return new Promise(function (resolve, reject) {
    const el = document.querySelector("script[src=\"" + src + "\"]");

    if (!el) {
      reject();
      return;
    }

    document.head.removeChild(el);

    resolve(null);
  });
}

@Component({components: {DiagramView, PrismEditor}})
export default class PythonView extends Vue {
  private error: string = null;
  private pyodideLoaded: boolean = false;
  data: any = null;
  code: string = null;
  busyMessage: string = null;
  isBusy: boolean = false;
  pyodide: any;
  ctx: any;

  async initializePyodide() {
    try {
      this.busyMessage = "Loading Python"
      //@ts-ignore
      await loadScript("http://localhost:8080/pyodide/pyodide.js");
    } catch (e: any) {
      this.error = e.message;
    }
  }

  execute() {
    event.preventDefault();
    this.busyMessage = "Executing Python"
    this.isBusy = true;
    this.error=null
    try {
      const out = this.pyodide.runPython(this.code);
      // console.log(ctx.data.toString());
      if (this.ctx.graph) {

        //@ts-ignore
        let nodes = JSON.parse(this.ctx.graph.get("nodes").toString().replaceAll("'", "\""));
        //@ts-ignore
        let edges = JSON.parse(this.ctx.graph.get("edges").toString().replaceAll("'", "\""));
        nodes = nodes.map(n => {
          n.name = n.id;
          return n;
        });
        edges = edges.map(e => {
          e.name = Math.random() > 0.5 ? "A" : null;
          return e;
        });
        this.data = {nodes, edges};
      }
    } catch (e) {
      this.error = e.message.replaceAll("\n","<br>");
    }
    this.isBusy = false;

  }

  highlighter(code) {
    // const lang = "js";
    // if (prism.languages[lang]) {
    //   return prism.highlight(code, prism.languages[lang], lang);
    // } else {
    //   return code;
    // }
    return highlight(code, languages.python);
  }

  async mounted() {
    this.busyMessage = "Downloading modules"
    this.isBusy=true;
    await new Promise(r => setTimeout(r, 800));
    this.code = `#----------------------------------------
# Use CTRL+Enter to execute the snippet
#----------------------------------------
import networkx as nx
import ctx

g = nx.watts_strogatz_graph(50, 4, .42)
ctx.graph = serialize_graph(g)
    `;

    await new Promise(r => setTimeout(r, 2000));
    await this.initializePyodide();
    //@ts-ignore
    this.pyodide = await loadPyodide();
    // await pyodide.loadPackage("numpy",(e)=>console.log(e),(e)=>console.error(e));
    await this.pyodide.loadPackage("networkx", (e) =>{this.busyMessage = e}, (e) => console.error(e));
    this.ctx = {
      graph: {nodes:[], edges:[]}
    };
    this.pyodide.registerJsModule("ctx", this.ctx);
    // predefine functions
    this.pyodide.runPython(`
    from networkx.readwrite import json_graph
    def serialize_graph(g):
       return json_graph.node_link_data(g,  {'link': 'edges', 'source': 'sourceId', 'target': 'targetId'})
    `)
    this.isBusy = false;

  }

}
</script>
