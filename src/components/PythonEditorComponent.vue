<template>
  <div>

    <PrismEditor class="editor" v-model="snippet" :highlight="highlighter" line-numbers @keydown.ctrl.enter="execute($event)"></PrismEditor>


  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import DiagramView from "@/components/DiagramComponent.vue";
import * as _ from "lodash";
import {PrismEditor} from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css";
import {highlight, languages} from "prismjs/components/prism-core";
import "prismjs/components/prism-clike.min";
import "prismjs/components/prism-python.min";
import "prismjs/themes/prism-coy.min.css";
import VueBase from "@/components/VueBase";



@Component({components: {DiagramView, PrismEditor}})
export default class PythonEditorComponent extends VueBase {
  @Prop() code: string;

  data: any = null;
  snippet: string = null;
  busyMessage: string = null;
  isBusy: boolean = false;
  pyodide: any;
  ctx: any;

  @Watch("code")
  onCodeChanged() {
    this.snippet = this.code;
  }

  /**
   * Setup of Pyodide.
   * @returns {Promise<void>}
   */
  async initializePyodide() {
    try {
      this.setBusy("Loading Python");
      //@ts-ignore
      await loadScript("http://localhost:8080/pyodide/pyodide.js");
      //@ts-ignore
      this.pyodide = await loadPyodide({
        stdin: null,
        stdout: (msg) => {
          this.appendToLog(msg);
        }, stderr: (e) => {
          this.appendToError(e.message);
        }
      });
      // await pyodide.loadPackage("numpy",(e)=>console.log(e),(e)=>console.error(e));
      // await this.pyodide.loadPackage("micropip", (e) =>{this.busyMessage = e}, (e) => console.error(e));
      await this.pyodide.loadPackage("faker", (msg) => {
        this.setBusy(msg);
      }, (e) => this.appendToError(e));
      await this.pyodide.loadPackage("networkx", (msg) => {
        this.setBusy(msg);
      }, (e) => this.appendToError(e));
      this.resetOutput();
    } catch (e: any) {
      this.appendToError(e.message);
    }
  }


  execute(event = null) {
    if (event) {
      event.preventDefault();
    }
    this.setBusy("Executing Python");
    this.resetOutput();
    try {
      const out = this.pyodide.runPython(this.snippet);
      // const x = this.pyodide.globals.get("x");
      // if (x) {
      //   console.log("x: ", x);
      // }

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
        this.setGraphModel({nodes, edges});
      }

    } catch (e) {
      this.appendToError(e);
    }
    this.setBusy(null);

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
    this.setBusy("Downloading modules");
    await new Promise(r => setTimeout(r, 500));


    // await new Promise(r => setTimeout(r, 2000));
    await this.initializePyodide();

    // await this.pyodide.loadPackage("graphminer", (e) =>{this.busyMessage = e}, (e) => console.error(e));
    this.ctx = {
      graph: {nodes: [], edges: []},
      aha: () => {
        return {a: 1, b: 2};
      }
    };
    this.pyodide.registerJsModule("ctx", this.ctx);
    // predefined functions
    this.pyodide.runPython(`
    from networkx.readwrite import json_graph
    def serialize_graph(g):
       return json_graph.node_link_data(g,  {'link': 'edges', 'source': 'sourceId', 'target': 'targetId'})
    `);
    this.setBusy(null);

  }

}

/**
 * Dynamically loads the specified js script file.
 * @param src
 * @returns {Promise<unknown>}
 */
function loadScript(src) {

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

/**
 * Dynamically removes the specified js script file.
 * @param src
 * @returns {Promise<unknown>}
 */
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

</script>
