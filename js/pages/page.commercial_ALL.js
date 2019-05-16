/**
 * Created by Creator on 13.04.2017.
 */

$(".toggler").click(function () {
    $(this).toggleClass('on');
});

var hcOptions = {
    chart: {
        renderTo: 'container',
        defaultSeriesType: 'area'
    },
    title: {
        text: null
    },

    xAxis: {
        type: 'datetime',
        gridLineWidth: 1,
        lineWidth: 0,
        minorGridLineWidth: 0,
        labels: {
            style: {fontFamily: 'PT Sans', fontSize: '14px' }
        },
        dateTimeLabelFormats: { // don't display the dummy year
            month: '%b',
            year: '%b'
        },
        title: {
            text: null
        }
    },
    yAxis: {
        lineWidth: 0,
        gridLineWidth: 1,
        minorGridLineWidth: 0,
        labels: {
            style: {fontFamily: 'PT Sans', fontSize: '14px' }
//                    enabled: false
        },
        title: {
            text: null
        }
    },
    tooltip: {
        shared: false,
        valueSuffix: ' ',
        headerFormat: ' ',
        shadow: true,
        borderWidth: 0,
        shape: "square",
        style: {fontFamily: 'PT Sans', fontSize: '12px' },
        pointFormat: '<strong> {point.y} просмотров</strong> <br>  {point.x:%A, %b %e, %H:%M}',
        positioner: function (labelWidth, labelHeight, point) {
            var tooltipX, tooltipY;

            if (point.plotY + labelHeight - 5 > this.chart.plotHeight) {
                tooltipY = point.plotY + this.chart.plotTop - labelHeight;
            } else {
                tooltipY = point.plotY + this.chart.plotTop + 10;
            }

            if (point.plotX + labelWidth > this.chart.plotWidth) {
                tooltipX = point.plotX + this.chart.plotLeft - labelWidth;
            } else {
                tooltipX = point.plotX + this.chart.plotLeft + 10;
            }

            return {
                x: tooltipX,
                y: tooltipY
            };
        }
    },
    credits: {
        enabled: false
    },
    plotOptions: {
        line: {
            lineWidth: 1,
            dataLabels: {
                enabled: false
            },
            enableMouseTracking: true
        }
    },
    series: [{
        name: ' ',
        data: [[0,200],[2,400],[4,400],[6,600],[8,600],[10,200],[13,400],[16,400],[20,400],[22,400],[23,1000],[24,400],[30,800],[36,400],[39,400],[40,800],[41,800],[42,1000]]
    }],
    legend: {
        enabled: false
    }
};
var hcTheme = {
    colors: ["#313133", "#DEB000", "#f45b5b", "#7798BF", "#e6c12e", "#ff0066", "#eeaaee",
        "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
    chart: {
        backgroundColor:'rgba(255, 255, 255, 0.1)',
        style: {
            fontFamily: "'Open Sans', sans-serif"
        },
        plotBorderColor: '#606063'
    },
    title: {
        style: {
            color: '#E0E0E3',
            textTransform: 'uppercase',
            fontSize: '20px'
        }
    },
    subtitle: {
        style: {
            color: '#E0E0E3',
            textTransform: 'uppercase'
        }
    },
    xAxis: {
        gridLineDashStyle: 'Dash',
        gridLineColor: '#cccccc',
        endOnTick: false,
        startOnTick: false,
        labels: {
            style: {
                color: '#868789',
                padding: 5
            }
        },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        tickWidth: 0,
        title: {
            style: {
                color: '#000',
                fontWeight: 'bold',
                fontSize:'1px',
                margin: '0px'
            }
        }
    },
    yAxis: {
        gridLineDashStyle: 'Dash',
        gridLineColor: '#cccccc',
        labels: {
            style: {
                color: '#868789',
                padding: 5
            }
        },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        tickWidth: 0,
        title: {
            style: {
                color: '#000'
            }
        }
    },
    tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        style: {
            color: '#6F7072',
            padding: 0,
            background: 'white'
        }
    },
    plotOptions: {
        series: {
            fillColor: {
                linearGradient: [0, 0, 0, 100],
                stops: [
                    [0, 'rgba(230, 193, 46, 1)'],
                    [1, 'rgba(230, 193, 46, 0.01)']
//                                Green
//                            [0, Highcharts.getOptions().colors[2]],
//                            [1, Highcharts.Color(Highcharts.getOptions().colors[2]).setOpacity(0).get('rgba')]
                ]
            },
            fillOpacity: '0.25',
            dataLabels: {
                color: '#2A214B'
            },
            marker: {
                lineColor: '#e6c12e',
                fillColor: '#e6c12e',
                radius: 3,
                lineWidth: 0,
                symbol: 'circle',
                enabled: true,
                radiusPlus: 1,
                states: {
                    hover: {
                        enabled: true
                    }
                }
            }
        },
        boxplot: {
            fillColor: '#505053'
        },
        candlestick: {
            lineColor: 'white'
        },
        errorbar: {
            color: 'white'
        }
    },
    legend: {
        itemStyle: {
            color: '#000000'
        },
        itemHoverStyle: {
            color: '#E0E0E3'
        },
        itemHiddenStyle: {
            color: '#606063'
        }
    },
    credits: {
        style: {
            color: '#666'
        }
    },
    labels: {
        style: {
            color: '#707073'
        }
    },

    drilldown: {
        activeAxisLabelStyle: {
            color: '#F0F0F3'
        },
        activeDataLabelStyle: {
            color: '#F0F0F3'
        }
    },

    navigation: {
        buttonOptions: {
            symbolStroke: '#DDDDDD',
            theme: {
                fill: '#505053'
            }
        }
    },

    // scroll charts
    rangeSelector: {
        buttonTheme: {
            fill: '#505053',
            stroke: '#000000',
            style: {
                color: '#CCC'
            },
            states: {
                hover: {
                    fill: '#707073',
                    stroke: '#000000',
                    style: {
                        color: 'white'
                    }
                },
                select: {
                    fill: '#000003',
                    stroke: '#000000',
                    style: {
                        color: 'white'
                    }
                }
            }
        },
        inputBoxBorderColor: '#505053',
        inputStyle: {
            backgroundColor: '#333',
            color: 'silver'
        },
        labelStyle: {
            color: 'silver'
        }
    },

    navigator: {
        handles: {
            backgroundColor: '#666',
            borderColor: '#AAA'
        },
        outlineColor: '#CCC',
        maskFill: 'rgba(255,255,255,0.1)',
        series: {
            color: '#7798BF',
            lineColor: '#A6C7ED'
        },
        xAxis: {
            gridLineColor: '#505053'
        }
    },

    scrollbar: {
        barBackgroundColor: '#808083',
        barBorderColor: '#808083',
        buttonArrowColor: '#CCC',
        buttonBackgroundColor: '#606063',
        buttonBorderColor: '#606063',
        rifleColor: '#FFF',
        trackBackgroundColor: '#404043',
        trackBorderColor: '#404043'
    },

    // special colors for some of the
    legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
    background2: '#505053',
    dataLabelsColor: '#B0B0B3',
    textColor: '#C0C0C0',
    contrastTextColor: '#F0F0F3',
    maskColor: 'rgba(255,255,255,0.3)'
};

Highcharts.setOptions({
    lang: {
        loading: lang.lHCLoading,
        months: lang.lHCMonths,
        weekdays: lang.lHCDays,
        shortMonths: lang.lHCShortMonths,
        exportButtonTitle: lang.lHCExportBtn,
        printButtonTitle: lang.lHCPrint,
        rangeSelectorFrom: lang.lHCFrom,
        rangeSelectorTo: lang.lHCTo,
        rangeSelectorZoom: lang.lHCZoom,
        downloadPNG: lang.lHCSavePNG,
        downloadJPEG: lang.lHCSaveJPEG,
        downloadPDF: lang.lHCSavePDF,
        downloadSVG: lang.lHCSaveSVG,
        printChart: lang.lHCPrintGraph
    }
});

jQuery.extend(true, hcOptions, hcTheme);
var chart = new Highcharts.Chart(hcOptions);
