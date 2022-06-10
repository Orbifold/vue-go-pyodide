<template>
  <div>
    <PrismEditor class="editor" v-model="snippet" :highlight="highlighter" line-numbers @keydown.ctrl.enter="$event.preventDefault(); execute(null)"></PrismEditor>
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

/*
* Errors and log:
* they are committed to the store.
* Events:
* - python-ready
* - output-changed
* */
@Component({components: {DiagramView, PrismEditor}})
export default class PythonEditorComponent extends VueBase {
  /**
   * Sets the code of the editor.
   * @type {string}
   */
  @Prop() code: string;
  /**
   * The editor's content.
   */
  snippet: string = null;
  /**
   * The pyodide space wherein Python is executed.
   */
  pyodide: any;
  /**
   * The context given to Python and which the user can use to get/set data.
   * @type {any}
   */
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
          // this redirects things like print to our logging
          this.appendToLog(msg);
        }, stderr: (e) => {
          // same with errors, we send it to our error output
          this.appendToError(e.message);
        }
      });
      // note that you can add packages to Pyodide but make sure that the package.json in the Pyodide directory knows about it
      const preloadedPackages = ["faker", "networkx"];
      for (const name of preloadedPackages) {
        await this.pyodide.loadPackage(name, (msg) => {
          this.setBusy(msg);
        }, (e) => this.appendToError(e));
      }
      // clear the log and error output
      this.resetOutput();
      this.$emit("python-ready");
    } catch (e: any) {
      this.appendToError(e.message);
    }
  }


  /**
   * Executes the given code or, if none given, the current editor content.
   * @param code
   * @returns {null | {nodes: any, edges: any}}
   */
  execute(code = null) {
    if (_.isNil(code)) {
      code = this.snippet;
    } else {
      // set the editor's content to the given code
      this.snippet = code;
    }
    if (_.isNil(code)) {
      return null;
    }
    if (code.toString().trim().length === 0) {
      return null;
    }
    this.setBusy("Executing Python");

    this.resetOutput();
    try {
      const out = this.pyodide.runPython(code);
      // the globals set can be accessed but the user really should use the ctx instead
      // const x = this.pyodide.globals.get("x");
      // if (x) {
      //   console.log("x: ", x);
      // }

      const serializedContext = this.serializeContext(this.ctx);
      this.$emit("output-changed", {ctx: serializedContext, code: this.snippet});
      return serializedContext;
    } catch (e) {
      this.appendToError(e);
    } finally {
      this.setBusy(null);
    }
  }

  /**
   * Getting rid of the Pyodide Proxy
   * @param obj Something coming out of the Pyodide context.
   */
  serializeContext(obj) {
    if (obj instanceof Object) {
      if (obj instanceof Map) {
        const a = Array.from(obj);
        // return a.map(u => this.serializeContext(u));
        const d = {};
        for (let u of a) {
          d[u[0]] = this.serializeContext(u[1]);
        }
        return d;
      } else if (obj instanceof Array) {
        return obj.map(u => this.serializeContext(u));
      } else if (obj.constructor.name === "PyProxyClass") {
        const ojs = obj.toJs();
        if (ojs instanceof Map) {
          const ajs = Array.from(ojs);
          const d = {};
          for (let u of ajs) {
            d[u[0]] = this.serializeContext(u[1]);
          }
          return d;
        } else {
          return this.serializeContext(ojs);
        }
      } else {
        const d = {};
        for (let e in obj) {
          d[e] = this.serializeContext(obj[e]);
        }
        return d;
      }
    } else {
      return obj;
    }
  }

  /**
   * Code coloring for the given code.
   */
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
    // give moment to show the spinner
    await new Promise(r => setTimeout(r, 500));
    // init Python
    await this.initializePyodide();
    // set the Python context
    this.ctx = this.getPythonContext();
    // give it to Python
    this.pyodide.registerJsModule("ctx", this.ctx);
    // predefined functions
    const predefined = `from networkx.readwrite import json_graph

def serialize_graph(g):
   return json_graph.node_link_data(g,  {'link': 'edges', 'source': 'sourceId', 'target': 'targetId'})
`;
    this.pyodide.runPython(predefined);
    this.setBusy(null);

  }

  /**
   * Returns the Python context which can be used in the code to get/set data.
   */
  getPythonContext() {
    const randomRange = _.range(20).map(i => Math.round(Math.random() * 100));
    return {
      graph: null,
      chart: {
        series: [{
          name: "Random Data",
          data: randomRange
        }],
        options: {
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
        }
      }
    };
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
// function unloadScript(src) {
//   return new Promise(function (resolve, reject) {
//     const el = document.querySelector("script[src=\"" + src + "\"]");
//
//     if (!el) {
//       reject();
//       return;
//     }
//
//     document.head.removeChild(el);
//
//     resolve(null);
//   });
// }

</script>
