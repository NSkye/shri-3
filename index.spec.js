'use strict';

const createSchedule = require('./index.js');

describe('static testing', () => {
    test('original.json', () => {
        expect(createSchedule(require('./data/original.json')).consumedEnergy).toEqual({
            value: 38.939,
            devices: {
                '02DDD23A85DADDD71198305330CC386D': 5.398,
                '1E6276CC231716FE8EE8BC908486D41E': 5.398,
                'F972B82BA56A70CC579945773B6866FB': 5.1015,
                '7D9DC84AD110500D284B33C82FE6E85E': 1.5215,
                'C515D887EDBBE669B2FDAC62F571E9E9': 21.52
            }
        });
    });
    const testData = [
        'push-to-limit-1.json',
        'push-to-limit-2.json',
        'push-to-limit-3.json',
        'push-to-limit-4.json',
        'push-to-limit-5.json',
        'push-to-limit-6.json',
    ].map(filename => {
        const path = './data/' + filename;

        test(filename, () => {
            expect(() => createSchedule(require(path))).not.toThrowError();
        });
    });
});