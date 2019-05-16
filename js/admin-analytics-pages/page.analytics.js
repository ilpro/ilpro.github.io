/** Created by alex on 29.04.2017 **/
'use strict';
var pageAnalytics = {
  socket: {},
  isFirstLoad: true,

  init(socket) {
    var self = this;

    if (self.isFirstLoad) {
      self.socket = socket;
      self.initSocketHandlers();
      self.initEventHandlers();
      self.isFirstLoad = false;
    }

    self.insertDayHtml();
    $('.filter-item.active').click();
  },

  /** Get registers **/
  getRegisterByDay() {
    var self = this;
    self.socket.emit('getRegisterByDay');
  },

  getRegisterByWeek() {
    var self = this;
    self.socket.emit('getRegisterByWeek');
  },

  getRegisterByMonth() {
    var self = this;
    self.socket.emit('getRegisterByMonth');
  },

  /** Get comments **/
  getCommentsByDay() {
    var self = this;
    self.socket.emit('getCommentsByDay');
  },

  getCommentsByWeek() {
    var self = this;
    self.socket.emit('getCommentsByWeek');
  },

  getCommentsByMonth() {
    var self = this;
    self.socket.emit('getCommentsByMonth');
  },

  /** Get messages **/
  getMessagesByDay() {
    var self = this;
    self.socket.emit('getMessagesByDay');
  },

  getMessagesByWeek() {
    var self = this;
    self.socket.emit('getMessagesByWeek');
  },

  getMessagesByMonth() {
    var self = this;
    self.socket.emit('getMessagesByMonth');
  },


  /** Listeners **/
  initSocketHandlers() {
    var self = this;

    // handle register
    self.socket.on('registerByDay', function (data) {
      data = JSON.parse(data);
      self.handleParamsBeforeInitCharts({byDay: data, type: 'регистраций'});
    });
    self.socket.on('registerByWeek', function (data) {
      data = JSON.parse(data);
      self.handleParamsBeforeInitCharts({byWeek: data, type: 'регистраций'});
    });
    self.socket.on('registerByMonth', function (data) {
      data = JSON.parse(data);
      self.handleParamsBeforeInitCharts({byMonth: data, type: 'регистраций'});
    });

    // handle messages
    self.socket.on('messagesByDay', function (data) {
      data = JSON.parse(data);
      self.handleParamsBeforeInitCharts({byDay: data, type: 'сообщений'});
    });
    self.socket.on('messagesByWeek', function (data) {
      data = JSON.parse(data);
      self.handleParamsBeforeInitCharts({byWeek: data, type: 'сообщений'});
    });
    self.socket.on('messagesByMonth', function (data) {
      data = JSON.parse(data);
      self.handleParamsBeforeInitCharts({byMonth: data, type: 'сообщений'});
    });

    // handle comments
    self.socket.on('commentsByDay', function (data) {
      data = JSON.parse(data);
      self.handleParamsBeforeInitCharts({byDay: data, type: 'комментариев'});
    });
    self.socket.on('commentsByWeek', function (data) {
      data = JSON.parse(data);
      self.handleParamsBeforeInitCharts({byWeek: data, type: 'комментариев'});
    });
    self.socket.on('commentsByMonth', function (data) {
      data = JSON.parse(data);
      self.handleParamsBeforeInitCharts({byMonth: data, type: 'комментариев'});
    });
  },

  initEventHandlers () {
    var self = this;

    $(".toggler").click(function () {
      $(this).toggleClass('on');
    });

    // get register by day
    $(document).on('click', '.filter-item', function () {
      var filter = $(this).attr('data-filter');

      if ($('.classic-tab.active', '#type-filter').attr('data-type') === 'register') {
        if (filter === 'day') {
          self.getRegisterByDay();
        }
        if (filter === 'week') {
          self.getRegisterByWeek();
        }
        if (filter === 'month') {
          self.getRegisterByMonth();
        }
      }

      if ($('.classic-tab.active', '#type-filter').attr('data-type') === 'comments') {
        if (filter === 'day') {
          self.getCommentsByDay();
        }
        if (filter === 'week') {
          self.getCommentsByWeek();
        }
        if (filter === 'month') {
          self.getCommentsByMonth();
        }
      }

      if ($('.classic-tab.active', '#type-filter').attr('data-type') === 'messages') {
        if (filter === 'day') {
          self.getMessagesByDay();
        }
        if (filter === 'week') {
          self.getMessagesByWeek();
        }
        if (filter === 'month') {
          self.getMessagesByMonth();
        }
      }


      $('.filter-item').removeClass('active').filter($(this)).addClass('active');
    })
  },

  handleParamsBeforeInitCharts(incomingData) {
    var self = this;

    var chartsParams = {
      htmlWord: incomingData.type,
      dataArr: []
    };


    // handle by day
    if (incomingData.byDay) {
      chartsParams.dataArr = [
        [getDateTime(0), 0],
        [getDateTime(1), 0],
        [getDateTime(2), 0],
        [getDateTime(3), 0],
        [getDateTime(4), 0],
        [getDateTime(5), 0],
        [getDateTime(6), 0],
        [getDateTime(7), 0],
        [getDateTime(8), 0],
        [getDateTime(9), 0],
        [getDateTime(10), 0],
        [getDateTime(11), 0],
        [getDateTime(12), 0],
        [getDateTime(13), 0],
        [getDateTime(14), 0],
        [getDateTime(15), 0],
        [getDateTime(16), 0],
        [getDateTime(17), 0],
        [getDateTime(18), 0],
        [getDateTime(19), 0],
        [getDateTime(20), 0],
        [getDateTime(21), 0],
        [getDateTime(22), 0],
        [getDateTime(23), 0],
        [getDateTime(24), 0]
      ];

      for (var i = 0; i < incomingData.byDay.length; i++) {
        var hour = new Date(incomingData.byDay[i].hour).getHours();
        var total = incomingData.byDay[i].total;

        chartsParams.dataArr[hour] = [getDateTime(hour), total];
      }
    }

    // handle by week or mouth
    if (incomingData.byWeek || incomingData.byMonth) {
      console.log(incomingData);
      var incomingArr = incomingData.byWeek ? incomingData.byWeek : incomingData.byMonth;

      incomingArr.sort(function(a, b) {
        return  Date.parse(a.date) - Date.parse(b.date);
      });

      for (var y = 0; y < incomingArr.length; y++) {
        // date in ms + 3 hours in ms (our time)
        var date = Date.parse(incomingArr[y].date) + (3 * 60 * 60 * 1000);
        var total = incomingArr[y].total;
        chartsParams.dataArr.push([date, total]);
      }
    }

    function getDateTime(num) {
      var date = new Date();
      date.setHours(num + 3, 0, 0, 0);
      return Date.parse(date);
    }

    self.initCharts(chartsParams)
  },

  /** Insert day name and date into HTML **/
  insertDayHtml(hour) {
    var date = new Date();
    var days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

    if (hour) {
      date.setHours(hour, 0, 0, 0);
    }

    var dayName = days[date.getDay()];
    var dateHtml = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`;

    $('.text-day', '.filter-item[data-filter="day"]').html(dayName);
    $('.num-day', '.filter-item[data-filter="day"]').html(dateHtml);
  },

  initCharts(params){


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
          style: {fontFamily: 'PT Sans', fontSize: '14px'}
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
          style: {fontFamily: 'PT Sans', fontSize: '14px'}
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
        style: {fontFamily: 'PT Sans', fontSize: '12px'},
        pointFormat: '<strong> {point.y} ' + params.htmlWord + '</strong> <br>  {point.x:%A, %b %e, %H:%M}',
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
        data: params.dataArr
      }],
      legend: {
        enabled: false
      }
    };

    var hcTheme = {
      colors: ["#313133", "#DEB000", "#f45b5b", "#7798BF", "#e6c12e", "#ff0066", "#eeaaee",
        "#55BF3B", "#DF5353", "#7798BF", "#aaeeee"],
      chart: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
            fontSize: '1px',
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
        loading: 'Загрузка...',
        months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        weekdays: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
        shortMonths: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сент', 'окт', 'нояб', 'дек'],
        exportButtonTitle: "Экспорт",
        printButtonTitle: "Печать",
        rangeSelectorFrom: "С",
        rangeSelectorTo: "По",
        rangeSelectorZoom: "Период",
        downloadPNG: 'Скачать PNG',
        downloadJPEG: 'Скачать JPEG',
        downloadPDF: 'Скачать PDF',
        downloadSVG: 'Скачать SVG',
        printChart: 'Напечатать график'
      }
    });

    jQuery.extend(true, hcOptions, hcTheme);
    var chart = new Highcharts.Chart(hcOptions);
  },
};
