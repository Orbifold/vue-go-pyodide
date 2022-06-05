import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        graphModel: null,
        chartSeries: [],
        chartOptions: null,
        log: null,
        error: null,
        isBusy: false,
        busyMessage: null,
        visualization: "graph",
        pythonReady: false,
        widgetId:null
    },
    mutations: {

        clearVisualizationData(state) {
            state.graphModel = {
                nodes: [],
                edges: []
            };
            state.chartOptions = {
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
            state.chartSeries = [];
        },
        setPythonReady(state) {
            state.pythonReady = true;
        },
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
            state.chartSeries = null;
            state.chartOptions = null;
            state.graphModel = null;
        },
        setChartModel(state, obj) {
            const {options, series} = obj;
            state.chartSeries = series;
            state.chartOptions = options;
        },
        setWidgetIt(state,id){
            state.widgetId = id;
        }
    },
    actions: {},
    modules: {}
});
