<template>
  <div class="vis" v-if="series && options && options.chart && options.chart.type">
    <Chart ref="chart" :options="options" :series="series"></Chart>
    <!--    <div style="background-color: #929292; border-radius: 5px;"></div>-->
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {identity} from "lodash";


// ===================================================================
// See the Apexchart docs
// https://apexcharts.com/docs/series/
// ===================================================================
@Component({
  components: {}
})
export default class ChartComponent extends Vue {
  @Prop() series: any;
  @Prop() options: any;
  chartData: any = [];
  chartOptions: any = null;

  mounted() {
    this.refresh();
  }

  refresh() {
    this.onNewData();
    this.onNewOptions();
  }

  @Watch("series")
  onNewData() {
    this.chartData = this.series || [];
  }

  @Watch("options")
  onNewOptions() {
    if (!this.options) {
      return;
    }
    this.chartOptions = this.options;
  }

  async getChartImageData() {
    const chart = (this.$refs.chart as any).chart;
    return await chart.dataURI();
    // const ctx = chart.ctx;
    // debugger
    // ctx.exports.exportToSVG(ctx);
  }
}
</script>

<style scoped></style>
