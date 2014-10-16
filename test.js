var test = require('tape');
var solver = require('./solver');

test('it solves for one square video', function (t) {
    solver([500, 500], 1, 1, function (err, result) {
        t.deepEqual([[[500,500]]], result);
        t.end();
    });
});

test('it solves for non square video', function (t) {
    solver([600, 600], 6/4, 1, function (err, result) {
        t.deepEqual([[[600,400]]], result);
        t.end();
    });
});

test('it solves for non square video', function (t) {
    solver([600, 600], 4/6, 1, function (err, result) {
        t.deepEqual([[[400,600]]], result);
        t.end();
    });
});


//2 videos
test('it solves for two videos', function (t) {
    t.plan(2);

    solver([1200, 600], 1, 2, function (err, result) {
        t.deepEqual([[ [600,600], [600,600] ]], result);
    });

    solver([600, 1200], 1, 2, function (err, result) {
        t.deepEqual([[ [600,600] ], [ [600,600] ]], result);
    });
});
