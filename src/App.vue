<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
Pyodide
    </v-app-bar>

    <v-main>
      <PythonView/>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import PythonView from './components/PythonView.vue';
import DiagramView from "@/components/DiagramView.vue";

export default Vue.extend({
  name: 'App',

  components: {
    PythonView,
    DiagramView
  },

});
</script>

<style>
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
.error-box{
  font-family: "Courier";
  font-size: 12px;
  border: 1px solid silver;
  border-radius: 5px;
  padding: 10px;
  overflow: auto;
  color: orangered;
  margin: 10px 0;
}
</style>
