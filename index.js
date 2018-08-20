'use strict';

const ScheduleBuilder = require('./schedule-builder');

/**
 * Принимает на вход объект ввода с сигнатурой, указанной в задании, возвращает объект вывода с сигнатурой из задания.
 * @param {Object} data 
 * @returns {Object}
 */
function createSchedule(data) {
    const builder = new ScheduleBuilder(data, 7, 21);
    return builder.placeDevices();
}

module.exports = createSchedule;