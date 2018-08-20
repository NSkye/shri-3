'use strict';

const verifyObject = require('./verify-object');
const { one, all } = verifyObject;

/**
 * Проверяет корректность объекта ввода с сигнатурой указанной в задании.  
 * Учитывает наличие необходимых данных и их корректность.  
 * Не учитывает конфликтующие или недостающие тарифы. Это проверяется уже внутри ScheduleModel.  
 * При некорректных данных сразу выбрасывает ошибку.
 * @param {Object} input входной объект
 */
function verifyInput(input) {
    
    let checkInput = verifyObject(input, {
        devices: Array,
        rates: Array,
        maxPower: Number
    });
    if (!checkInput) {
        throw Error('Incorrect input.')
    }
    const { maxPower } = input;
    
    const deviceDescriptor = {
        id: String,
        name: one(String, undefined),
        power: all(Number, p => p <= maxPower),
        duration: all(Number, d => d <= 24),
        mode: one(undefined, all(String, m => /^(night|day)$/.test(m)))
    }

    const rateDescriptor = {
        from: all(Number, f => f < 24 && f >= 0),
        to: all(Number, t => t < 24 && t >= 0),
        value: Number
    }

    const checkDevices = input.devices.every(device => verifyObject(device, deviceDescriptor));
    const checkRates = input.rates.every(rate => verifyObject(rate, rateDescriptor));

    if (!checkDevices) {
        throw Error('Incorrect input, check devices.')
    } else if (!checkRates) {
        throw Error('Incorrect input, check rates.')
    }

    const combinedMaxPower = maxPower * 24;
    const combinedDevicePower = input.devices.reduce((ac, cv) => ac+=cv.power*cv.duration, 0);
    if (combinedDevicePower > combinedMaxPower) {
        throw Error('Incorrect input, will be impossible to place all devices.')
    }

    return input;
}

module.exports = verifyInput;