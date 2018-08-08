'use strict';

const createSchedule = require('./index.js');
const generateInput = require('./testing-utils/input-generator');
const fs = require('fs');

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
        'push-to-limit-7.json',
        'push-to-limit-8.json',
        'push-to-limit-9.json',
        'push-to-limit-10.json',
    ].map(filename => {
        const path = './data/' + filename;
        const input = require(path);
        test(filename, () => {
            let schedule;
            expect(() => schedule = createSchedule(input)).not.toThrowError();
            expect(input.devices.length).toBe(Object.keys(schedule.consumedEnergy.devices).length);
        });
    });
});

describe('monkey testing', () => {
    const inputs = generateInput(100, 4, 0);
    inputs.map(inputWrapper => {
        const { name, input } = inputWrapper;
        const log = JSON.stringify(input, null, 2);
        test(name, () => {
            try {
                const schedule = createSchedule(input);
                expect(input.devices.length).toBe(Object.keys(schedule.consumedEnergy.devices).length);
            } catch(e) {
                fs.appendFile(`./output/failed_tests/${name}.json`, log, e => {if (e) console.log(e.message)});
                expect(e.message).toBe('no errors');
            }
        });
    });
});