'use strict';

const verifyInput = require('./index');

test('incorrect input', () => {
    expect(() => verifyInput({
        "devices": [
            {
                "id": "F972B82BA56A70CC579945773B6866FB",
                "name": "Посудомоечная машина",
                "power": 950,
                "duration": 3,
                "mode": "night"
            }
        ],
        "rates": [
            {
                "from": 7,
                "to": 7,
                "value": 6.46
            }
        ],
        "maxPower": 'not a number'
    })).toThrowError('Incorrect input.');
});

test('incorrect input (devices)', () => {
    expect(() => verifyInput({
        "devices": [
            {
                "id": "F972B82BA56A70CC579945773B6866FB",
                "name": "Посудомоечная машина",
                "duration": 3,
                "mode": "night"
            }
        ],
        "rates": [
            {
                "from": 7,
                "to": 7,
                "value": 6.46
            }
        ],
        "maxPower": 2100
    })).toThrowError('Incorrect input, check devices.');
});

test('incorrect input (rates)', () => {
    expect(() => verifyInput({
        "devices": [
            {
                "id": "F972B82BA56A70CC579945773B6866FB",
                "name": "Посудомоечная машина",
                "power": 950,
                "duration": 3,
                "mode": "night"
            }
        ],
        "rates": [
            {
                "from": 7,
                "to": 24,
                "value": 6.46
            }
        ],
        "maxPower": 2100
    })).toThrowError('Incorrect input, check rates.');
});

test('incorrect input (impossible to place)', () => {
    expect(() => verifyInput({
        "devices": [
            {
                "id": "F972B82BA56A70CC579945773B6866FB",
                "name": "Посудомоечная машина",
                "power": 2100,
                "duration": 12
            },
            {
                "id": "C515D887EDBBE669B2FDAC62F571E9E9",
                "name": "Духовка",
                "power": 2100,
                "duration": 13
            }
        ],
        "rates": [
            {
                "from": 7,
                "to": 7,
                "value": 6.46
            }
        ],
        "maxPower": 2100
      })).toThrowError('Incorrect input, will be impossible to place all devices.')
});