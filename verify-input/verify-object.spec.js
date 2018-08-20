const verifyObject = require('./verify-object');
const { all, one } = verifyObject;

test('successful verification and wrong arguments', () => {
    
    const descriptor = {
        arrayField: Array,
        objectField: Object,
        numberField: Number,
        stringField: String,
        booleanField: Boolean,
        symbolField: Symbol,
        functionField: Function,
        NaNField: NaN,
        nullField: null,
        undefinedField: undefined,
        customCheckField: a => a >= 4,
        numberOrString1: one(Number, String),
        numberOrString2: one(Number, String),
        nonEmptyArray: all(Array, a => !!a.length)
    }

    const object = {
        arrayField: [1, 2, 3],
        objectField: {},
        numberField: 5,
        stringField: 'this is string',
        booleanField: true,
        symbolField: Symbol(),
        functionField: function func() {
            return 'i am function';
        },
        NaNField: NaN,
        nullField: null,
        customCheckField: 4,
        numberOrString1: 'two',
        numberOrString2: 2,
        nonEmptyArray: [1, 2, 3]
    }
    
    expect(verifyObject(object, descriptor)).toBe(true);
    expect(verifyObject(null, descriptor)).toBe(false);
});