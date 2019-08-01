import {Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {select} from "d3-selection";
import {ScaleBand, scaleBand, ScaleLinear, scaleLinear} from "d3-scale";
import {ChartCommons} from "../../../../enums/chart-commons.enum";
import {max} from "d3-array";
import {AggregationChartDataService} from "../../services/aggregation-chart-data.service";

@Component({
  selector: 'osm-aggregation-chart',
  templateUrl: './aggregation-chart.component.html',
  styleUrls: ['./aggregation-chart.component.scss']
})
export class AggregationChartComponent implements OnChanges {

  @ViewChild('svg') svgElement: ElementRef;
  @Input() barchartAverageData;
  @Input() barchartMedianData;

  data = {
    filterRules: {},
    hasComparativeData: false,
    i18nMap: {},
    series: []
  };


  margin = {top: 0, right: 0, bottom: 0, left: 0};
  svgWidth: number;
  svgHeight: number;
  private xScale: ScaleLinear<number, number>;
  private yScale: ScaleBand<string>;

  private sideLabelWidth: number;
  private barsWidth: number;
  private barsHeight: number;

  private headerHeight: number;
  private barScorePosY: number;
  private barScoreHeight: number;
  private legendPosY: number;
  private legendHeight: number;
  private minValue: number;
  private maxValue: number;

  private dataForBarScore = [];
  private dataForLegend = [];
  private dataForBarsAndLabels = {};
  private dataForBars = {};
  private dataForHeader = "";
  private sideLabels = [];
  private anyHighlighted = false;
  private anySelected = false;
  private clickedMeasurand = '';

  constructor(private aggregationChartDataService: AggregationChartDataService) {
  }


  redraw() {
    if (this.barchartAverageData.length < 1 || this.barchartMedianData.length < 1) {
      return;
    }

    this.data = this.barchartAverageData;
    // this.data.series = this.data.series.sort((a, b) => (a.value > b.value) ? -1 : ((b.value > a.value) ? 1 : 0));
    this.aggregationChartDataService.setData(this.data);
    this.dataForBarsAndLabels = this.aggregationChartDataService.allMeasurandDataMap;
    this.dataForBarScore = this.aggregationChartDataService.getDataForScoreBar().barsToRender;
    this.maxValue = this.aggregationChartDataService.getDataForScoreBar().max;
    this.minValue = this.aggregationChartDataService.getDataForScoreBar().min;
    this.dataForLegend = this.aggregationChartDataService.getDataForLegend();
    this.dataForHeader = this.aggregationChartDataService.getDataForHeader();
    this.sideLabels = this.aggregationChartDataService.getUniqueSideLabels();

    this.dataForBars = this.aggregationChartDataService.createEmptyBarsForMissingData(this.dataForBarsAndLabels);

    this.svgWidth = this.svgElement.nativeElement.getBoundingClientRect().width;
    this.svgHeight = this.svgElement.nativeElement.parentElement.offsetHeight;

    this.sideLabelWidth = max(this.getTextWidths(this.svgElement.nativeElement, this.sideLabels));
    this.barsWidth = this.svgWidth - 2 * ChartCommons.COMPONENT_MARGIN - this.sideLabelWidth;
    this.barsHeight = this.calculateChartBarsHeight();

    this.headerHeight = ChartCommons.CHART_HEADER_HEIGHT + ChartCommons.COMPONENT_MARGIN;
    this.barScorePosY = this.barsHeight + ChartCommons.COMPONENT_MARGIN;
    this.barScoreHeight = ChartCommons.BAR_BAND + ChartCommons.COMPONENT_MARGIN;
    this.legendPosY = this.barScorePosY + this.barScoreHeight + ChartCommons.COMPONENT_MARGIN;
    this.legendHeight = this.estimateHeight(this.svgElement.nativeElement) + ChartCommons.COMPONENT_MARGIN;

    this.svgHeight = this.legendPosY + this.legendHeight + this.headerHeight;
    this.svgElement.nativeElement.setAttribute('height', this.svgHeight);

    this.xScale = scaleLinear()
      .domain([0, max(this.data.series.map(it => it.value))])
      .range([0, this.barsWidth]);

    this.yScale = scaleBand()
      .domain(this.sideLabels)
      .range([0, this.barsHeight]);

    this.render();
  }


  render() {
    const svgElement: SVGElement = this.svgElement.nativeElement;

    this.renderHeader(svgElement);
    this.renderSideLabels(svgElement);
    this.renderBarsContent(svgElement);
  }

  private renderHeader(svgElement: SVGElement) {
    const header = select(svgElement).selectAll('.header-group').data([this.dataForHeader]);
    header.join(
      enter => enter
        .append('g')
        .attr('class', 'header-group'),
      update => update,
      exit => exit.remove()
    );

    const headerText = select('.header-group').selectAll('.header-text').data([this.dataForHeader], (data: any) => data);
    headerText.join(
      enter => enter
        .append('text')
        .attr('class', 'header-text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'alphabetic')
        .style('opacity', 0),
      update => update,
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    )
      .attr('x', this.svgWidth / 2)
      .attr('y', ChartCommons.CHART_HEADER_HEIGHT)
      .transition()
      .duration(ChartCommons.TRANSITION_DURATION)
      .text(datum => datum)
      .style('opacity', 1);
  }

  private renderSideLabels(svgElement: SVGElement) {
    const sideLabelGroup = select(svgElement).selectAll('.side-labels-group').data(this.sideLabels);
    sideLabelGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'side-labels-group'),
      update => update,
      exit => exit.remove()
    )
      .attr('transform', `translate(0, ${this.headerHeight})`);

    const sideLabels = select('.side-labels-group').selectAll('.side-label').data(this.sideLabels);
    sideLabels.join(
      enter => enter
        .append('text')
        .attr('class', 'side-label')
        .attr('dominant-baseline', 'middle')
        .attr('x', 0)
        .style('opacity', 0),
      update => update,
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    )
      .text(datum => datum)
      .transition()
      .duration(ChartCommons.TRANSITION_DURATION)
      .style('opacity', 1)
      .attr('y', datum => this.yScale(datum) + this.yScale.bandwidth() / 2)
  }

  private renderBarsContent(svgElement: SVGElement) {
    const contentGroup = select(svgElement).selectAll('.bars-content-group').data([1]);
    contentGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'bars-content-group'),
      update => update,
      exit => exit.remove()
    )
      .attr('transform', `translate(${this.sideLabelWidth + ChartCommons.COMPONENT_MARGIN}, ${ChartCommons.CHART_HEADER_HEIGHT + ChartCommons.COMPONENT_MARGIN})`);

    const contentGroupSelector: string = '.bars-content-group';

    this.renderBarGroup(contentGroupSelector);
    this.renderChartScoreGroup(contentGroupSelector);
    this.renderLegendGroup(contentGroupSelector);
  }

  private renderBarGroup(contentGroupSelector: string) {
    const barGroup = select(contentGroupSelector).selectAll('.chart-bar-group').data([1]);
    barGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'chart-bar-group'),
      update => update,
      exit => exit.remove()
    );

    const chartBars = select('.chart-bar-group').selectAll('.chart-bars').data(Object.keys(this.dataForBarsAndLabels));
    chartBars.join(
      enter => enter
        .append('g')
        .attr('class', 'chart-bars'),
      update => update,
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .attr('transform', 'translate(0, 0)')
        .style('opacity', 0)
        .remove()
    )
      .transition()
      .duration(ChartCommons.TRANSITION_DURATION)
      .attr('transform', (datum, index) => `translate(0, ${index * ChartCommons.BAR_BAND})`)
      .each((datum, index, groups) => this.renderBar(select(groups[index]), datum));

    //TODO stacked bars
  }

  private renderBar(chartBarSelection, measurand: string) {
    const bar = chartBarSelection.selectAll('.bar').data(this.dataForBarsAndLabels[measurand].series);
    bar.join(
      enter => {
        const barElement = enter
          .append('g')
          .attr('class', 'bar')
          .style('opacity', () => {return ((this.anyHighlighted && !this.dataForBarsAndLabels[measurand].highlighted) || (this.anySelected && !this.dataForBarsAndLabels[measurand].selected)) ? 0.2 : 1});
        barElement
          .append('rect')
          .attr('class', 'bar-rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', ChartCommons.BAR_BAND)
          .attr('fill', this.dataForBarsAndLabels[measurand].color)
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .attr('x', datum => this.barStart(this.xScale, datum.value))
          .attr('y', datum => this.yScale(datum.sideLabel))
          .attr('width', datum => this.barWidth(this.xScale, datum.value));
        barElement
          .append('text')
          .attr('class', 'bar-value')
          .attr('dominant-baseline', 'middle')
          .style('fill', 'white')
          .style('font-weight', 'bold')
          .style('opacity', 0)
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .text(datum => `${this.formatBarValue(datum.value)} ${datum.unit}`)
          .attr('x', datum => (datum.value < 0) ? (this.barStart(this.xScale, datum.value) + 10) : (this.barEnd(this.xScale, datum.value) - 10))
          .attr('y', datum =>{ return (this.yScale(datum.sideLabel) + ChartCommons.BAR_BAND / 2)})
          .attr('text-anchor', datum => (datum.value < 0) ? 'start' : 'end')
          .style('opacity', (datum, index, groups) => ((groups[index].getComputedTextLength() + 2 * 10) > this.barWidth(this.xScale, datum.value)) ? 0 : 1);
        return barElement;
      },
      update => {
        update
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .style('opacity', () => {return ((this.anyHighlighted && !this.dataForBarsAndLabels[measurand].highlighted) || (this.anySelected && !this.dataForBarsAndLabels[measurand].selected)) ? 0.2 : 1});

        update.select('.bar-rect')
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .attr('x', datum => this.barStart(this.xScale, datum.value))
          .attr('y', datum => this.yScale(datum.sideLabel))
          .attr('width', datum => this.barWidth(this.xScale, datum.value))
          .attr('fill', this.dataForBarsAndLabels[measurand].color);
        update.select('.bar-value')
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .text(datum => `${this.formatBarValue(datum.value)} ${datum.unit}`)
          .attr('x', datum => (datum.value < 0) ? (this.barStart(this.xScale, datum.value) + 10) : (this.barEnd(this.xScale, datum.value) - 10))
          .attr('y', datum => (this.yScale(datum.sideLabel) + ChartCommons.BAR_BAND / 2))
          .attr('text-anchor', datum => (datum.value < 0) ? 'start' : 'end')
          .style('opacity', (datum, index, groups) => ((groups[index].getComputedTextLength() + 2 * 10) > this.barWidth(this.xScale, datum.value)) ? 0 : 1);
        return update;
      },
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    );
      //.on('click', () => this.onMouseClick(measurand));
  }

  private renderChartScoreGroup(contentGroupSelector: string) {
    const scoreGroup = select(contentGroupSelector).selectAll('.chart-score-group').data([1]);
    scoreGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'chart-score-group'),
      update => update,
      exit => exit.remove()
    )
      .attr('transform', `translate(0, ${this.barScorePosY})`);

    const scoreBars = select('.chart-score-group').selectAll('.score-bar').data(this.dataForBarScore);
    const scaleForScoreBar = scaleLinear().rangeRound([0, this.barsWidth]).domain([this.minValue, this.maxValue]);

    scoreBars.join(
      enter => {
        const scoreBarElement = enter
          .append('g')
          .attr('class', 'score-bar');
        scoreBarElement
          .append('rect')
          .attr('class', 'score-rect')
          .attr('height', ChartCommons.BAR_BAND)
          .attr('width', 0)
          .attr('x', 0)
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .attr('fill', datum => datum.fill)
          .attr('width', datum => scaleForScoreBar(datum.end) - scaleForScoreBar(datum.start))
          .attr('x', datum => scaleForScoreBar(datum.start));
        scoreBarElement
          .append('text')
          .attr('class', 'score-value')
          .attr('dominant-baseline', 'middle')
          .attr('text-anchor', "middle")
          .attr('x', 0)
          .attr('y', ChartCommons.BAR_BAND / 2)
          .style('opacity', 0)
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .text(datum => datum.label)
          .style('opacity', (datum, index, groups) => groups[index].getComputedTextLength() + 20 > (scaleForScoreBar(datum.end) - scaleForScoreBar(datum.start)) / 2 ? 0 : 1)
          .attr('x', datum => (scaleForScoreBar(datum.end) + scaleForScoreBar(datum.start)) / 2);
        return scoreBarElement;
      },
      update => {
        update.select('.score-rect')
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .attr('fill', datum => datum.fill)
          .attr('width', datum => scaleForScoreBar(datum.end) - scaleForScoreBar(datum.start))
          .attr('x', datum => scaleForScoreBar(datum.start));
        update.select<SVGTextElement>('.score-value')
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .text(datum => datum.label)
          .style('opacity', (datum, index, groups) => groups[index].getComputedTextLength() + 20 > (scaleForScoreBar(datum.end) - scaleForScoreBar(datum.start)) / 2 ? 0 : 1)
          .attr('x', datum => (scaleForScoreBar(datum.end) + scaleForScoreBar(datum.start)) / 2);
        return update;
      },
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    );
  }

  private renderLegendGroup(contentGroupSelector: string) {
    const legendGroup = select(contentGroupSelector).selectAll('.chart-legend-group').data([1]);
    legendGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'chart-legend-group'),
      update => update,
      exit => exit.remove()
    )
      .attr('transform', `translate(0, ${this.legendPosY})`);

    const legendEntry = select('.chart-legend-group').selectAll('.legend-entry').data(this.dataForLegend);
    const maxEntryGroupSize = this.calculateMaxEntryGroupWidth(this.svgElement.nativeElement);
    const maxEntriesInRow = Math.floor(this.svgWidth / maxEntryGroupSize);

    legendEntry.join(
      enter => {
        const legendElement = enter
          .append('g')
          .attr('class', 'legend-entry')
          .style('opacity', 0);
        legendElement
          .append('rect')
          .attr('class', 'legend-rect')
          .attr('height', ChartCommons.COLOR_PREVIEW_SIZE)
          .attr('width', ChartCommons.COLOR_PREVIEW_SIZE)
          .attr("rx", 2)
          .attr("ry", 2)
          .attr('fill', datum => datum.color);
        legendElement
          .append('text')
          .attr('class', 'legend-text')
          .attr('x', ChartCommons.COLOR_PREVIEW_SIZE + ChartCommons.COLOR_PREVIEW_MARGIN)
          .attr('y', ChartCommons.COLOR_PREVIEW_SIZE)
          .text(datum => datum.label);
        return legendElement;
      },
      update => {
        update.select('.legend-rect')
          .attr('fill', datum => datum.color);
        update.select('.legend-text')
          .text(datum => datum.label);
        return update;
      },
        exit => exit
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .style('opacity', 0)
          .remove()
    )
      .attr('transform', (datum, index) => `translate(${maxEntryGroupSize * (index % maxEntriesInRow)}, 0)`)
      .style('opacity', 1);
  }


  formatBarValue(value): string {
    const precision = this.maxValue >= 1000 || this.minValue <= -1000 ? 0 : 2;
    return parseFloat(value).toFixed(precision).toString();
  }

  estimateHeight(svgForEstimation) {
    const maxEntryGroupSize = this.calculateMaxEntryGroupWidth(svgForEstimation);
    const maxEntriesInRow = Math.floor(this.svgWidth / maxEntryGroupSize);
    return Math.floor(this.data.series.length / maxEntriesInRow) * 20;
  };

  calculateMaxEntryGroupWidth(svgForEstimation) {
    let dataMap = this.aggregationChartDataService.allMeasurandDataMap;
    const labels = Object.keys(dataMap).map(measurand => dataMap[measurand].label);
    const labelWidths = this.getTextWidths(svgForEstimation, labels);
    return max(labelWidths) + 10 + 20 + 5;
  };

  getTextWidths(svgForEstimation, texts) {
    const widths = [];
    select(svgForEstimation).selectAll('.invisible-text-to-measure')
      .data(texts)
      .enter()
      .append("text")
      .attr("opacity", 0)
      .text((d) =>  d.toString())
      .each(function () {
        widths.push(this.getComputedTextLength());
        this.remove();
      });
    return widths;
  };

  barWidth(xScale, value) {
    return value === null ? 0 : (this.barEnd(xScale, value) - this.barStart(xScale, value));
  };

  barEnd(xScale, value) {
    return (value < 0) ? xScale(0) : xScale(value);
  };

  barStart(xScale, value) {
    return (value < 0) ? xScale(value) : xScale(0);
  };

  calculateChartBarsHeight() {
    const barBand = ChartCommons.BAR_BAND;
    const barGap = ChartCommons.BAR_GAP;
    const numberOfMeasurands = Object.keys(this.dataForBarsAndLabels).length;
    let numberOfBars = 0;
    Object.keys(this.dataForBarsAndLabels).forEach((k) => {
      numberOfBars = numberOfBars + this.dataForBarsAndLabels[k].series.length;
    });
    const gapSize = barGap * ((numberOfMeasurands < 2) ? 1 : 2);
    return ((numberOfBars / numberOfMeasurands - 1) * gapSize) + numberOfBars * barBand;
  }

  private onMouseOver(data){
    //data.highlighted = true;
    this.anyHighlighted = true;
    this.dataForBarsAndLabels[data].highlighted = true;
    this.renderBarGroup('.bars-content-group');
    this.renderLegendGroup('.legend-content-group');
  }


  private onMouseOut(data){
    //data.highlighted = false;
    this.anyHighlighted = false;
    this.dataForBarsAndLabels[data].highlighted = false;
    this.renderBarGroup('.bars-content-group');
    this.renderLegendGroup('.legend-content-group');
  }

  private onMouseClick(measurand){
    if(this.anySelected == false){
      this.dataForBarsAndLabels[measurand].selected = true;
      this.clickedMeasurand = measurand;
      this.anySelected = true;
    }else if(this.anySelected == true && this.clickedMeasurand !== measurand){
      this.dataForBarsAndLabels[this.clickedMeasurand].selected = false;
      this.dataForBarsAndLabels[measurand].selected = true;
      this.clickedMeasurand = measurand;
    }
    else{
      this.anySelected = false;
      this.dataForBarsAndLabels[measurand].selected = false;
    }
    this.renderBarGroup('.bars-content-group');
    this.renderLegendGroup('.legend-content-group');
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.redraw();
  }

}
