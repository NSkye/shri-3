const typeVerifiers = new Map(
    [
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
    ]
);

/**
 * Производит верификацию значения по указанному сценарию, либо с помощью кастомной функции
 * @param {*} value проверяемое значение
 * @param {*} typeOrFunc ключ для верификации либо кастомная функция. Возможные значения: undefined, null, Number, String, Boolean, Symbol, Function, Object, NaN, [callback]
 * @returns {Boolean}
 */
function verify(value, typeOrFunc) {
    if (typeof typeOrFunc === 'undefined') { return typeof value === 'undefined'; }
    if (typeOrFunc === null) { return value === null; }
    if (!typeVerifiers.has(typeOrFunc)) {
        return typeOrFunc(value);
    }
    const verFunc = typeVerifiers.get(typeOrFunc);
    return verFunc(value);
}

/**
 * Имплементация логического ИЛИ для функции верификации
 * @param {*} a ключи или функции  
 * @returns {Boolean}
 */
function one(...a) {
    return function(value) {
        return [...a].some(arg => verify(value, arg));
    }
}

/**
 * Имплементация логического И для функции верификации
 * @param {*} a клюи или функции  
 * @returns {Boolean}
 */
function all(...a) {
    return function(value) {
        return [...a].every(arg => verify(value, arg));
    }
}

module.exports = { verify, one, all };