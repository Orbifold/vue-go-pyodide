import {Component, Vue} from "vue-property-decorator";

export default class VueBase extends Vue {
    clearLog() {
        this.$store.commit("setLog", "");
    }

    clearErrors() {
        this.$store.commit("setError", "");
    }

    setLog(msg) {
        this.$store.commit("setLog", msg);
    }

    appendToLog(msg) {
        this.$store.commit("appendToLog", msg);
    }

    setError(msg) {
        this.$store.commit("setError", msg);
    }

    appendToError(msg) {
        if (msg instanceof Error) {
            msg = msg.message;
        }
        this.$store.commit("appendToError", msg);
    }

    resetOutput() {
        this.clearErrors();
        this.clearLog();
    }

    setBusy(message = null) {
        this.$store.commit("setIsBusy", message);
    }

    setGraphModel(model = null) {
        this.$store.commit("setGraphModel", model);
    }

    setVisualization(name = "graph") {
        this.$store.commit("setVisualization", name);
    }


}
