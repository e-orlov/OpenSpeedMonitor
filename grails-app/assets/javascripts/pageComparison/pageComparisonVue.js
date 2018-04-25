"use strict";

//= require node_modules/jquery/jquery.min.js
//= require pageComparison/pageComparisonRowComponentVue.js

var OpenSpeedMonitor = OpenSpeedMonitor || {};
OpenSpeedMonitor.ChartModules = OpenSpeedMonitor.ChartModules || {};
OpenSpeedMonitor.ChartModules.GuiHandling = OpenSpeedMonitor.ChartModules.GuiHandling || {};
OpenSpeedMonitor.ChartModules.GuiHandling.PageComparison = OpenSpeedMonitor.ChartModules.GuiHandling.PageComparison || {};


OpenSpeedMonitor.ChartModules.GuiHandling.PageComparison.Comparisons = (function () {
    var pageComparisonVue = new Vue({
        el: '#pageComparisonCard',
        data: {
            jobGroups: [],
            groupToPagesMap: {},
            comparisons: [],
            showButtonCallback: function () {
            }
        },
        created: function () {
            this.addComparisonRow();
            var that = this;
            $(window).on("selectIntervalTimeframeCardLoaded", function () {
                that.loadJobGroupMap();
                that.addListener();
                var timeFrameChangedFunction = function () {
                    that.loadJobGroupMap();
                };
                $("#select-interval-timeframe-card").on("timeFrameChanged", timeFrameChangedFunction);
            })

        },
        watch: {
            comparisons: function () {
                var cp = this.comparisons[0];
                var state = cp.jobGroupId1 > 0 && cp.jobGroupId2 > 0 && cp.pageId1 > 0 && cp.pageId2 > 0;
                console.log(state);
                this.showButtonCallback(!state);
            }
        },
        methods: {
            loadJobGroupMap: function () {
                var that = this;
                var url = OpenSpeedMonitor.urls.pageComparisonGetJobGroupToPagesMap;
                var selectedTimeframe = OpenSpeedMonitor.selectIntervalTimeframeCard.getTimeFrame();
                var queryArgs = {
                    'from': selectedTimeframe[0].toISOString(),
                    'to': selectedTimeframe[1].toISOString(),
                    'caller': null
                };
                $.ajax({
                    url: url,
                    type: 'GET',
                    data: queryArgs,
                    dataType: "json",
                    success: function (data) {
                        that.filterData(data);
                    },
                    error: function (e, statusText) {
                        if (statusText != "abort") {
                            throw e;
                        }
                    },
                    traditional: true // grails compatible parameter array encoding
                });
            },
            filterData: function (response) {
                var newJobGroupMap = {};
                var newJobGroups = [];
                for (var property in response) {
                    if (response.hasOwnProperty(property)) {
                        var current = response[property];
                        newJobGroups.push({name: current.name, id: property});
                        newJobGroupMap[property] = current.pages
                    }
                }
                newJobGroups.sort(function (a, b) {
                    return a.name > b.name
                });
                this.jobGroups = newJobGroups;
                this.groupToPagesMap = newJobGroupMap;
            },
            addComparisonRow: function () {
                this.comparisons.push({jobGroupId1: -1, pageId1: -1, jobGroupId2: -1, pageId2: -1});
            },
            removeComparisonRow: function (index) {
                this.comparisons.splice(index,1)
            },
            getComparisons: function () {
                return this.comparisons
            },
            setComparisons: function (comparisons) {
                this.comparisons = comparisons;
            },
            getPageIds: function () {
                var ids = [];
                this.comparisons.forEach(function (comparison) {
                    ids.push(comparison['pageId1']);
                    ids.push(comparison['pageId2']);
                });
                return ids;
            },
            getJobGroupIds: function () {
                var ids = [];
                this.comparisons.forEach(function (comparison) {
                    ids.push(comparison['jobGroupId1']);
                    ids.push(comparison['jobGroupId2']);
                });
                return ids;

            },
            setShowButtonCallback: function (callback) {
                this.setShowButtonCallback = callback;
            },
            addListener: function () {
                var that = this;
                $('#addComparison').on('click', function () {
                    that.addComparisonRow()
                })
            }
        }
    });
    return {
        getComparisons: pageComparisonVue.getComparisons,
        setComparisons: pageComparisonVue.setComparisons,
        getPageIds: pageComparisonVue.getPageIds,
        getJobGroupIds: pageComparisonVue.getJobGroupIds,
        setShowButtonCallback: pageComparisonVue.setShowButtonCallback
    }
});

OpenSpeedMonitor.ChartModules.GuiHandling.PageComparison.Comparisons = OpenSpeedMonitor.ChartModules.GuiHandling.PageComparison.Comparisons();
