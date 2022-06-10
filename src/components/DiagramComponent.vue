<template>

    <div id="diagramHost" class="vis">
      <canvas height="50vw" tabindex="0" width="100%">This text is displayed if your browser does not support the Canvas HTML element.</canvas>
      <div style="overflow: auto; width: 800px; height: 600px; z-index: 1">
        <div style="width: 1px; height: 1px"></div>
      </div>
    </div>

</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import * as go from "gojs";

const $ = go.GraphObject.make;

class ContinuousForceDirectedLayout extends go.ForceDirectedLayout {
  private _isObserving: Boolean = false;

  isFixed(v) {
    return v.node.isSelected;
  }

  // optimization: reuse the ForceDirectedNetwork rather than re-create it each time
  doLayout(coll) {
    if (!this._isObserving) {
      this._isObserving = true;
      // cacheing the network means we need to recreate it if nodes or links have been added or removed or relinked,
      // so we need to track structural model changes to discard the saved network.
      this.diagram.addModelChangedListener((e) => {
        // modelChanges include a few cases that we don't actually care about, such as
        // "nodeCategory" or "linkToPortId", but we'll go ahead and recreate the network anyway.
        // Also clear the network when replacing the model.
        if (e.modelChange !== "" || (e.change === go.ChangedEvent.Transaction && e.propertyName === "StartingFirstTransaction")) {
          this.network = null;
        }
      });
    }
    let net = this.network;
    if (net === null) {
      // the first time, just create the network as normal
      this.network = net = this.makeNetwork(coll);
    } else {
      // but on reuse we need to update the LayoutVertex.bounds for selected nodes
      this.diagram.nodes.each((n) => {
        const v = net.findVertex(n);
        if (v !== null) v.bounds = n.actualBounds;
      });
    }
    // now perform the normal layout
    super.doLayout(coll);
    // doLayout normally discards the LayoutNetwork by setting Layout.network to null;
    // here we remember it for next time
    this.network = net;
  }


}

@Component({})
export default class DiagramView extends Vue {
  private diagram: go.Diagram;
  @Prop() graphModel: any;

  @Watch("graphModel")
  onDataChanged() {
    console.log("new model");
    this.createGraphModel();
  }

  mounted() {
    this.createDiagram();
  }

  createDiagram() {
    /**
     * The main options of the diagram control.
     */
    const options = {
      initialAutoScale: go.Diagram.Uniform,
      contentAlignment: go.Spot.Center,
      "undoManager.isEnabled": false,
      "draggingTool.dragsLink": false,

      layout: $(
          ContinuousForceDirectedLayout, // automatically spread nodes apart while dragging
          {defaultSpringLength: 40, defaultElectricalCharge: 40}
      ),
      SelectionMoved: (e) => e.diagram.layout.invalidateLayout()
    };
    this.diagram = $(go.Diagram, document.getElementById("diagramHost") as HTMLDivElement, options);
    this.diagram.undoManager.isEnabled = true;
    this.diagram.maxScale = 3;
    this.diagram.minScale = 0.3;

    this.createNodeTemplate();
    this.createLinkTemplate();
    this.createGraphModel();
    this.createInteractions();
  }


  createInteractions() {
  }

  async createGraphModel() {
    if (!this.graphModel) {
      return;
    }
    this.diagram.clear()
    const nodeData = this.graphModel.nodes.map((n) => {
      return {
        key: n.id,
        name: n.name
      };
    });
    const linkData = this.graphModel.edges.map((e) => {
      return {
        from: e.sourceId,
        to: e.targetId,
        name: e.name
      };
    });
    this.diagram.model = new go.GraphLinksModel({
      // copiesArrays: true,
      // copiesArrayObjects: true,
      nodeDataArray: nodeData,
      linkDataArray: linkData
    });
    // console.log("nodes: ", nodeData.length, "edges: ", linkData.length);
    window["model"] = this.diagram.model;
  }

  createLinkTemplate() {
    this.diagram.linkTemplate = $(
        go.Link,
        {curve: go.Link.Bezier, toShortLength: 2},
        $(
            go.Shape, // the link shape
            {strokeWidth: 1.0, stroke: "#3e5d8c"}
        ),
        $(
            go.Shape, // the arrowhead
            {toArrow: "Standard", stroke: null, fill: "#3e5d8c"}
        ),
        $(
            go.Panel,
            "Auto",
            $(
                go.Shape,
                {
                  name: "LinkBackground",
                  figure: "RoundedRectangle",
                  fill: "#fff",
                  stroke:"#3e5d8c",
                  parameter1: 5,
                  visible: false,
                },

                new go.Binding("visible", "name", (s) => {
                  return !!s;
                }),
            ),
            $(
                go.TextBlock,
                "",
                {
                  name: "LinkText",
                  textAlign: "center",
                  font: "10px Roboto, sans-serif",
                  stroke: "#3e5d8c",
                  margin: new go.Margin(0, 2, 0, 2),
                  editable: true,
                },
                new go.Binding("text", "name") ,
            ),
        ),
    );
  }

  createNodeTemplate() {
    this.diagram.nodeTemplate = $(go.Node, go.Panel.Auto,
        {locationSpot: go.Spot.Center}, new go.Binding("location", "loc", go.Point.parse),
        $(go.Shape, {figure: "Circle", stroke: "#3e5d8c", fill: "#6781FF"}, new go.Binding("fill", "color")),
        $(go.TextBlock, {font: "bold 10pt Roboto, Arial, sans-serif", stroke: "rgb(255,255,255)"}, new go.Binding("text", "name")));
  }
}

</script>

<style scoped>

</style>
