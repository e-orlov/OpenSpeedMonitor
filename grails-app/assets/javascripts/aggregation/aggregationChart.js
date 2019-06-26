//= require /node_modules/d3/d3.min.js
//= require /chartComponents/chartBars.js
//= require /chartComponents/chartBarScore.js
//= require /d3/chartColorProvider.js
//= require /chartComponents/chartLegend.js
//= require /chartComponents/chartSideLabels.js
//= require /chartComponents/chartHeader.js
//= require /chartComponents/common.js
//= require /d3/chartLabelUtil.js
//= require /aggregation/aggregationChartData.js
//= require_self

"use strict";

var OpenSpeedMonitor = OpenSpeedMonitor || {};
OpenSpeedMonitor.ChartModules = OpenSpeedMonitor.ChartModules || {};

OpenSpeedMonitor.ChartModules.Aggregation = (function (selector) {
    var svg = d3.select(selector);
    var chartBarsComponents = {};
    var chartLegendComponent = OpenSpeedMonitor.ChartComponents.ChartLegend();
    var chartBarScoreComponent = OpenSpeedMonitor.ChartComponents.ChartBarScore();
    var chartSideLabelsComponent = OpenSpeedMonitor.ChartComponents.ChartSideLabels();
    var chartHeaderComponent = OpenSpeedMonitor.ChartComponents.ChartHeader();
    var data = OpenSpeedMonitor.ChartModules.AggregationData(svg);
    var transitionDuration = OpenSpeedMonitor.ChartComponents.common.transitionDuration;

    chartLegendComponent.on("select", function (selectEvent) {
        toggleBarComponentHighlight(selectEvent.id, selectEvent.anySelected, selectEvent.selected);
    });

    chartLegendComponent.on("highlight", function (highlightEvent) {
        toggleBarComponentHighlight(highlightEvent.id, highlightEvent.anyHighlighted, highlightEvent.highlighted);
    });

    var resetData = function () {
        data.resetData();
    };

    var setData = function (inputData) {
        // data.setData(inputData);
        OpenSpeedMonitor.ChartModules.AggregationData.setData(inputData);
        chartHeaderComponent.setData(data.getDataForHeader());
        chartBarScoreComponent.setData(data.getDataForBarScore());
        chartLegendComponent.setData(data.getDataForLegend());
        chartSideLabelsComponent.setData(data.getDataForSideLabels());
        setDataForBars();
    };

    var setDataForBars = function () {
        var componentsToRender = {};
        data.getAllMeasurands().forEach(function (measurand) {
            if (!chartBarsComponents[measurand]) {
                var component = OpenSpeedMonitor.ChartComponents.ChartBars();
                component.on("click", function () {
                    chartLegendComponent.clickEntry({id: measurand});
                });
                chartBarsComponents[measurand] = component;
            }
            componentsToRender[measurand] = chartBarsComponents[measurand];
            componentsToRender[measurand].setData(data.getDataForBars(measurand));
        });
        chartBarsComponents = componentsToRender;
    };

    var render = function (isAggregationValueChange) {
        var shouldShowScore = data.hasLoadTimes();
        var componentMargin = OpenSpeedMonitor.ChartComponents.common.ComponentMargin;
        var headerHeight = OpenSpeedMonitor.ChartComponents.ChartHeader.Height + componentMargin;
        var barScorePosY = data.getChartBarsHeight() + componentMargin;
        var barScoreHeight = shouldShowScore ? OpenSpeedMonitor.ChartComponents.common.barBand + componentMargin : 0;
        var legendPosY = barScorePosY + barScoreHeight;
        var legendHeight = chartLegendComponent.estimateHeight(svg) + componentMargin;
        var chartHeight = legendPosY + legendHeight + headerHeight;

        var svgName = selector.substr(1);
        document.getElementById(svgName).setAttribute("height",chartHeight);

        renderHeader(svg);
        renderSideLabels(svg, headerHeight);

        var contentGroup = svg.selectAll(".bars-content-group").data([1]);
        contentGroup.enter()
            .append("g")
            .classed("bars-content-group", true);
        contentGroup.attr("transform",
            "translate(" + (data.getChartSideLabelsWidth() + componentMargin) + ", " + headerHeight + ")");
        renderBars(contentGroup, isAggregationValueChange);
        renderBarScore(contentGroup, shouldShowScore, barScorePosY, isAggregationValueChange);
        renderLegend(contentGroup, legendPosY);
    };

    var renderHeader = function (svg) {
        var header = svg.selectAll(".header-group").data([chartHeaderComponent]);
        header.exit()
            .remove();
        header.enter()
            .append("g")
            .classed("header-group", true);
        header.call(chartHeaderComponent.render);
    };

    var renderSideLabels = function (svg, posY) {
        var sideLabels = svg.selectAll(".side-labels-group").data([chartSideLabelsComponent]);
        sideLabels.exit()
            .remove();
        sideLabels.enter()
            .append("g")
            .classed("side-labels-group", true);
        sideLabels
            .attr("transform", "translate(0, " + posY + ")")
            .call(chartSideLabelsComponent.render)
    };

    var renderBarScore = function (svg, shouldShowScore, posY, isAggregationValueChange) {
        var barScore = svg.selectAll(".chart-score-group").data([chartBarScoreComponent]);
        barScore.exit()
            .remove();
        barScore.enter()
            .append("g")
            .attr("class", "chart-score-group")
            .attr("transform", "translate(0, " + posY + ")");
        barScore
            .call(chartBarScoreComponent.render, isAggregationValueChange)
            .transition()
            .style("opacity", shouldShowScore ? 1 : 0)
            .duration(transitionDuration)
            .attr("transform", "translate(0, " + posY + ")");
    };

    var renderLegend = function (svg, posY) {
        var legend = svg.selectAll(".chart-legend-group").data([chartLegendComponent]);
        legend.exit()
            .remove();
        legend.enter()
            .append("g")
            .attr("class", "chart-legend-group")
            .attr("transform", "translate(0, " + posY + ")");
        legend.call(chartLegendComponent.render)
            .transition()
            .duration(transitionDuration)
            .attr("transform", "translate(0, " + posY + ")");
    };

    var renderBars = function (svg, isAggregationValueChange) {
        var chartBarsGroup = svg.selectAll(".chart-bar-group").data([1]);
        chartBarsGroup.enter()
            .append("g")
            .attr("class", "chart-bar-group");
        var barsOffset = data.hasStackedBars() ? 0 : OpenSpeedMonitor.ChartComponents.common.barBand;
        var chartBars = chartBarsGroup.selectAll(".chart-bars").data(getSortedChartBarsComponents());
        chartBars.exit()
            .transition()
            .duration(transitionDuration)
            .attr("transform", "translate(0, 0)")
            .style("opacity", 0)
            .remove();
        chartBars.enter()
            .append("g")
            .attr("class", "chart-bars");
        chartBars
            .transition()
            .duration(transitionDuration)
            .attr("transform", function (_, i) {
                return "translate(0, " + (i * barsOffset) + ")";
            })
            .each(function (chartBarsComponent) {
                chartBarsComponent.render(d3.select(this), isAggregationValueChange);
            });
    };

    var getSortedChartBarsComponents = function () {
        var measurands = data.sortByMeasurandOrder(Object.keys(chartBarsComponents));
        return measurands.map(function (measurand) {
            return chartBarsComponents[measurand]
        });
    };

    var toggleBarComponentHighlight = function (measurandToHighlight, anyHighlighted, doHighlight) {
        Object.keys(chartBarsComponents).forEach(function (measurand) {
            var isRestrained = anyHighlighted && !(doHighlight && measurand === measurandToHighlight);
            chartBarsComponents[measurand].setData({isRestrained: isRestrained});
        });
        render();
    };

    var isDataAvailable = function () {
        return data.isDataAvailable();
    };

    return {
        render: render,
        setData: setData,
        resetData: resetData,
        isDataAvailable: isDataAvailable
    };

});
