//= require_self

/*
 * OpenSpeedMonitor (OSM)
 * Copyright 2014 iteratec GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * 	http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

var OpenSpeedMonitor = OpenSpeedMonitor || {};

OpenSpeedMonitor.PageComparisonSelection = (function () {
    var init = function () {
        $(".addMeasurandButton").click(addPageComparisonRow);
        $("#firstJobGroupSelect").on("change", selectionChangeListener);
        $("#pageComparisonSelectionCard select option[value='']").attr("disabled", true);
        $("#pageComparisonSelectionCard select").on("change", enabaleOrDisableShowButton)
        enabaleOrDisableShowButton()
    };

    var enabaleOrDisableShowButton = function () {
        var notAllOptionsSelected = $("#pageComparisonSelectionCard select option:selected").filter(function () {
                return !$(this).val();
            }).length > 0;
        $("#graphButtonHtmlId").attr("disabled", notAllOptionsSelected)
    };

    var addPageComparisonRow = function (event) {
        var clone = $("#measurandSeries-clone").clone();
        clone.find(".removeMeasurandButton").removeClass("hidden");
        clone.find(".removeMeasurandButton").click(removeComparisonRow);
        clone.find(".addMeasurandButton").click(addPageComparisonRow);
        clone.find("#firstJobGroupSelect").on("change", selectionChangeListener);
        clone.removeAttr("id");
        if (event) {
            clone.insertAfter($(event.target).closest(".addPageComparisonRow"));
        } else {
            clone.insertAfter("#measurandSeries-clone")
        }
    };

    var removeComparisonRow = function (event) {
        $(event.target).closest(".addPageComparisonRow").remove();
    };

    var selectionChangeListener = function (event) {
        $(event.target).closest(".addPageComparisonRow").find("#secondJobGroupSelect").val($(event.target).val())
    };

    var getValues = function () {
        var result = [];

        $(".addPageComparisonRow").each(function () {
            var currentRow = $(this);
            var currentComparision = {};

            currentComparision['jobGroupId1'] = currentRow.find("#firstJobGroupSelect").val();
            currentComparision['jobGroupId2'] = currentRow.find("#secondJobGroupSelect").val();
            currentComparision['pageId1'] = currentRow.find("#firstPageSelect").val();
            currentComparision['pageId2'] = currentRow.find("#secondPageSelect").val();

            result.push(currentComparision);
        });

        return result;
    };

    var setValues = function (values) {
        for (var i = 1; i < values.length; i++) {
            addPageComparisonRow(null)
        }
        var comparisonRows = $(".addPageComparisonRow");
        values.forEach(function (currentComparison, index) {
            var currentRow = $(comparisonRows[index]);
            currentRow.find("#firstJobGroupSelect").val(currentComparison['jobGroupId1']);
            currentRow.find("#firstPageSelect").val(currentComparison['pageId1']);
            currentRow.find("#secondJobGroupSelect").val(currentComparison['jobGroupId2']);
            currentRow.find("#secondPageSelect").val(currentComparison['pageId2']);
        })
    };

    var getJobGroups = function () {
        var result = [];
        $(".addPageComparisonRow").each(function () {
            var currentRow = $(this);
            result.push(currentRow.find("#firstJobGroupSelect").val());
            result.push(currentRow.find("#secondJobGroupSelect").val());
        });
        return result.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        })
    };

    var getPages = function () {
        var result = [];
        $(".addPageComparisonRow").each(function () {
            var currentRow = $(this);
            result.push(currentRow.find("#firstPageSelect").val());
            result.push(currentRow.find("#secondPageSelect").val());
        });
        return result.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        })
    };

    init();
    return {
        getValues: getValues,
        setValues: setValues,
        getPages: getPages,
        getJobGroups: getJobGroups
    };
})();
