const typeVerifiers = new Map(
    [ Array,
        v => Array.isArray(v)
    ],
    [ Number,
        v => (typeof v == 'number') && !isNaN(v) 
    ],
    [ String,
        v => typeof v == 'string'
    ],
    [ Boolean,
        v => typeof v == 'boolean'
    ],
    [ Symbol,
        v => typeof v == 'symbol'
    ],
    [ Function,
        v => typeof v == 'function'
    ],
    [ Object,
        v => typeof v == 'object' && v !== null
    ],
    [ NaN,
        v => isNaN(v)
    ]
);

function verify(value, typeOrFunc) {
    if (typeof typeOrFunc === 'undefined') { return typeof value === 'undefined'; }
    if (typeOrFunc === null) { return value === null; }
    if (!typeVerifiers.has(typeOrFunc)) {
        return typeOrFunc(value);
    }
    const verFunc = typeVerifiers.get(typeOrFunc);
    console.log('func:', verFunc)
    return verFunc(value);
}

function one(...a) {
    return function(value) {
        return [...a].some(arg => verify(value, arg));
    }
}

function all(...a) {
    return function(value) {
        return [...a].every(arg => verify(value, arg));
    }
}

module.exports = { verify, one, all };