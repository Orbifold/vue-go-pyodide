import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        graphModel: null,
        chartData: null,
        chartOptions: null,
        log: null,
        error: null,
        isBusy: false,
        busyMessage: null,
        visualization: "graph"
    },
    mutations: {
        setGraphModel(state, model) {
            state.graphModel = model;
        },
        setLog(state, log) {
            state.log = log;
        },
        appendToLog(state, msg) {
            state.log += `\n${msg}`;
        },
        setError(state, err) {
            state.error = err;
        },
        appendToError(state, err) {
            err = err.replaceAll("\n", "<br>");
            state.error += `<br>${err}`;
        },
        setIsBusy(state, msg) {
            state.busyMessage = msg;
            state.isBusy = !!msg;
        },
        setVisualization(state, name) {
            state.visualization = name;
            state.chartData = null;
            state.chartOptions = null;
            state.graphModel = null;
        }
    },
    actions: {},
    modules: {}
});
