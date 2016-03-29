/*
 * Author Qi
 */
var events_count = [];
var outliers_count = [];
var scores = [];
var km = null;
var canvas = null;
var ctx = null;
var blockSize = 4; //shall be 2, 4 is to amplify for visualization
var oldId = 0;
//images, initialize canvas
var img = new Image();
img.src = 'image/base2.bmp';

$(document).ready(function() {
    /*parse data from local json file, json file has to be saved as js data file to be accessed
    parse to get total events from each year*/
    img.onload = function() {
        draw(this);
    };

}); //document ready

//all functions
function daydiff(first, second) {
    return Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)); //ms
};

function draw(img) {
    canvas = document.getElementById('base');
    ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    img.style.display = 'none';
};

function clearOldLocs() {
    //clear first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //redraw image
    draw(img);
};

function drawNewLocs(eventID) {
    //draw locations of outliers
    var locs = km[eventID].locations;
    for (var j = 0; j < locs.length; j++) {
        var loc = locs[j];
        if (typeof loc != 'undefined') {
            var nloc = (loc.replace('(', '')).replace(')', '').split(',');
            //draw location one by one
            ctx.beginPath();
            ctx.rect(parseInt(nloc[1]), parseInt(nloc[0]), blockSize, blockSize); //col-first, then row
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = 'blue';
            ctx.stroke();
        }
    }
};

function showResult(fileId) {
    switch (parseInt(fileId)) {
        case 1:
            km = km1;
            break;
        case 2:
            km = km2;
            break;
        case 3:
            km = em1;
            break;
        case 4:
            km = kmall;
            break;
        case 5:
            km = emall;
            break;
        case 6:
            km = dball;
            break;
        case 7:
            km = dbgl;
            break;
        case 8:
            km = dbnoise;
            break;
        default:
            km = null;
    };

    var events_stat = {};
    var outliers_stat = {};
    scores = [];
    //clear selection box
    $('#rank').empty();
    for (var i = 0; i < km.length; i++) {
        //extract score and year
        var dateBegin = new Date(km[i].dateBegin);
        var dateEnd = new Date(km[i].dataEnd);
        var yr = dateBegin.getFullYear();
        if (!(yr in events_stat)) {
            events_stat[yr] = 1;
            outliers_stat[yr] = km[i].score;
        } else {
            events_stat[yr] += 1;
            outliers_stat[yr] += km[i].score;
        };
        //extract events info for ranking list
        var event_desp = "Score: " + km[i].score + "   " + "Duration: " + dateBegin.toISOString().substr(0, 10) + "--" + dateEnd.toISOString().substr(0, 10);
        $('#rank').append(new Option(event_desp, i));
        scores.push(km[i].score);
    };

    //clear buffer
    events_count = [];
    outliers_count = [];
    var sumOutliers = 0;
    var sumEvents = 0;

    for (var yr = 1987; yr < 2016; yr++) {
        if (events_stat.hasOwnProperty(yr)) {
            events_count.push(events_stat[yr]);
            outliers_count.push(outliers_stat[yr]);
            sumOutliers += outliers_stat[yr];
            sumEvents += events_stat[yr];
        } else {
            events_count.push(0);
            outliers_count.push(0);
        }
    };

    //sum of events count and outliers count for display
    var info = "Total Number of Outliers: " + sumOutliers + "   " + "Total Number of Events: " + sumEvents;
    $("#info").text(info);
} //show result

function loadChart() {
    $('#distribution').highcharts({
        chart: {
            zoomType: 'xy'
        },
        title: {
            text: 'Events Temporal Distribution'
        },
        xAxis: [{
            type: 'datetime',
            dateTimeLabelFormats: {
                year: '%Y'
            }
        }],
        yAxis: [{ // Primary yAxis
            labels: {
                format: '{value}',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            title: {
                text: 'Number of Events',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            }
        }, { // Secondary yAxis
            title: {
                text: 'Number of Outliers',
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            },
            labels: {
                format: '{value}',
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            },
            opposite: true
        }],

        tooltip: {
            shared: true
        },

        series: [{
            name: 'Events Count',
            type: 'column',
            yAxis: 0,
            data: events_count,
            pointStart: Date.UTC(1987, 1, 1),
            pointInterval: 24 * 60 * 60 * 1000 * 365, // one day

        }, {
            name: 'Outliers Count',
            type: 'line',
            yAxis: 1,
            data: outliers_count,
            pointStart: Date.UTC(1987, 1, 1),
            pointInterval: 24 * 60 * 60 * 1000 * 365, // one day

        }]
    }); //distribution chart

    //ranking chart
    $('#rankhist').highcharts({
        chart: {
            zoomType: 'xy'
        },
        title: {
            text: 'Rank Distribution'
        },
        xAxis: [{
            tickInterval: 1
        }],
        yAxis: [{ // Primary yAxis
            type: 'logarithmic',
            minorTickInterval: 0.1,
            labels: {
                format: '{value}',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            title: {
                text: 'Counts of Each Rank Level',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            }
        }],

        tooltip: {
            shared: true
        },

        series: [{
            name: 'Rank Score',
            type: 'line',
            yAxis: 0,
            data: scores,
            pointStart: 1

        }]
    });
}; //

//show results based on user selection
$('#resultlist')
    .change(function() {
        var fid = 0;
        $("select option:selected").each(function() {
            fid = $(this).val() + " "; //get index of selected event
        });

        if (fid != " ") {
            showResult(fid);
            loadChart();
        }
    })
    .trigger("change");

/*parse to draw an selected top events on an image*/
$('#rank')
    .change(function() {
        var id = 0;
        $("select option:selected").each(function() {
            id = $(this).val() + " "; //get index of selected event
        });

        if (id != " ") {
            //clear old rects
            clearOldLocs(oldId);
            //get locations and draw new rects
            drawNewLocs(parseInt(id));
            //update id
            oldId = id;
        }
    })
    .trigger("change");
