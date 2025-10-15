

// #AE Expressions

// Bounce movement:
///////////////// Elastic Bounce
var elasticity = 0.8;     // Range: 0-1 (bounce damping)
var gravity = 9800;       // Gravity strength (higher = faster bounces)
var maxBounces = 5;       // Maximum number of bounces

// Core bounce logic (based on reference)
var n = 0;
if (numKeys > 0) {
    n = nearestKey(time).index;
    if (key(n).time > time) n--;
}

if (n > 0) {
    var t = time - key(n).time;
    var v = -velocityAtTime(key(n).time - 0.001) * elasticity;
    var vl = value instanceof Array ? length(v) : Math.abs(v);

    var vu;
    if (value instanceof Array) {
        vu = (vl > 0) ? normalize(v) : [0, 0, 0];
    } else {
        vu = (v < 0) ? -1 : 1;
    }

    var tCur = 0;
    var segDur = 2 * vl / gravity;
    var tNext = segDur;
    var bounceCount = 1;

    while (tNext < t && bounceCount <= maxBounces) {
        vl *= elasticity;
        segDur *= elasticity;
        tCur = tNext;
        tNext += segDur;
        bounceCount++;
    }

    if (bounceCount <= maxBounces) {
        var delta = t - tCur;
        value + vu * delta * (vl - gravity * delta / 2);
    } else {
        value;
    }
} else {
    value;
}


/////////////elastic overshoot
freq = 3;
decay = 5;
amplitude = 1.5;

n = 0;
if (numKeys > 0) {
    n = nearestKey(time).index;
    if (key(n).time > time) n--;
}
if (n > 0) {
    t = time - key(n).time;
    amp = velocityAtTime(key(n).time - .001) * amplitude;
    w = freq * Math.PI * 2;
    value + amp * (Math.sin(t * w) / Math.exp(decay * t) / w);
} else
    value


/////////////// elastic overshoot
amp = 0.1;     // Amplitude
freq = 3;   // Frequency
decay = 2.3;   // Decay

n = 0;
if (numKeys > 0) {
    n = nearestKey(time).index;
    if (key(n).time > time) {
        n--;
    }
}

if (n == 0) {
    t = 0;
} else {
    t = time - key(n).time;
}

if (n > 0 && t > 0) {
    v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
    value + v * amp * Math.sin(freq * t * 2 * Math.PI / 2) / Math.exp(decay * t);
} else {
    value;
}





/////////////// Text typing Animation


cursor = "|";
blinkTime = 1;
charMod = 1;
num = effect("Progress")("Slider");
toggle = effect("Cursor")("Checkbox");
if (toggle == 1) {
    t = ((time - inPoint) / blinkTime) % 1;
    if (num.numKeys > 2) { n = 0 } else { n = 1 }
    ux = Math.abs(num.speedAtTime(time + thisComp.frameDuration * n));
    blink = Math.round(ux + t);
    if (blink == 0) {
        cursor = " ";
    }
} else {
    cursor = " ";
}
if (charMod == 0) {
    textAnim = num * text.sourceText.length / 100;
} else {
    textAnim = num;
}
text.sourceText.substr(0, textAnim) + cursor



/////////// Opacity auto fade
transition = 20;       // transition time in frames
if (marker.numKeys < 2) {
    tSecs = transition / (1 / thisComp.frameDuration); // convert to seconds
    linear(time, inPoint, inPoint + tSecs, 0, 100) - linear(time, outPoint - tSecs, outPoint, 0, 100)
} else {
    linear(time, inPoint, marker.key(1).time, 0, 100) - linear(time, marker.key(2).time, outPoint, 0, 100)
}

/////////////Snap Zoom In/Out

snapScale = 300; //percent of scale to zoom
trans = 4; //  transition time in frames
trans = trans * thisComp.frameDuration;
inTrans = easeOut(time, inPoint, inPoint + trans, [snapScale, snapScale], [0, 0]);
outTrans = easeIn(time, outPoint, outPoint - trans, [0, 0], [snapScale, snapScale]);
value + inTrans + outTrans


/////////////    Y Axis Jitter
// Y Axis Jitter
probability = 8;  //higher is less likely
pos = 50;
val = random(-probability - 2, 1);
m = clamp(val, 0, 1);
y = wiggle(10, pos * m) - position;
value + [0, y[1]]



///////// 3D layer position to 2D
layer = thisComp.layer("Null 1")
layer.toComp([0, 0, 0])





/////Easing animation

function easeInSine(x) {
    return 1 - Math.cos((x * Math.PI) / 2);
}

function easeOutSine(x) {
    return Math.sin((x * Math.PI) / 2);
}

function easeInOutSine(x) {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}
function easeInQuad(x) {
    return x * x;
}

function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
}

function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function easeInCubic(x) {
    return x * x * x;
}

function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeInQuart(x) {
    return x * x * x * x;
}
function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}
function easeInOutQuart(x) {
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}
function easeInQuint(x) {
    return x * x * x * x * x;
}
function easeOutQuint(x) {
    return 1 - Math.pow(1 - x, 5);
}
function easeInOutQuint(x) {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}
function easeInExpo(x) {
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}
function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}
function easeInOutExpo(x) {
    return x === 0
        ? 0
        : x === 1
            ? 1
            : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
                : (2 - Math.pow(2, -20 * x + 10)) / 2;
}
function easeInCirc(x) {
    return 1 - Math.sqrt(1 - Math.pow(x, 2));
}
function easeOutCirc(x) {
    return Math.sqrt(1 - Math.pow(x - 1, 2));
}
function easeInOutCirc(x) {
    return x < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}


function easeInBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
}

function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;

    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeInOutBack(x) {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;

    return x < 0.5
        ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
        : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}
function easeInElastic(x) {
    const c4 = (2 * Math.PI) / 3;

    return x === 0
        ? 0
        : x === 1
            ? 1
            : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

function easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}
function easeInOutElastic(x) {
    const c5 = (2 * Math.PI) / 4.5;

    return x === 0
        ? 0
        : x === 1
            ? 1
            : x < 0.5
                ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
                : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}
function easeInBounce(x) {
    return 1 - easeOutBounce(1 - x);
}
function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}
function easeInOutBounce(x) {
    return x < 0.5
        ? (1 - easeOutBounce(1 - 2 * x)) / 2
        : (1 + easeOutBounce(2 * x - 1)) / 2;
}


function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}
function easeInOutBounce(x) {
    return x < 0.5
        ? (1 - easeOutBounce(1 - 2 * x)) / 2
        : (1 + easeOutBounce(2 * x - 1)) / 2;
}

function blend(functionA, functionB, x) {
    return x * functionB(x) + (1 - x) * functionA(x);
}

// Main function
function applyEasing(easeFn) {
    if (numKeys > 1) {
        // Find keyframe before or at current time
        var n = nearestKey(time).index;
        if (key(n).time > time) {
            n--;
        }
        // Ensure valid range
        if (n > 0 && n < numKeys) {
            var t0 = key(n).time;
            var t1 = key(n + 1).time;
            if (time >= t0 && time <= t1) {
                // Linear progress
                var linearProgress = (time - t0) / (t1 - t0);
                // Apply easing function
                var easedProgress = easeFn(linearProgress);
                //    var easedProgress = blend(easeInOutBounce,easeInOutCirc, easeInOutQuart(linearProgress));
                // Get values
                var v0 = key(n).value;
                var v1 = key(n + 1).value;
                // Interpolate
                if (typeof v0 === "number") {
                    return v0 + (v1 - v0) * easedProgress;
                } else {
                    var result = [];
                    for (var i = 0; i < v0.length; i++) {
                        result[i] = v0[i] + (v1[i] - v0[i]) * easedProgress;
                    }
                    return result;
                }
            }
        }
    }
    return value;
}

applyEasing(easeOutBounce);