'use strict';

const ScheduleBuilder = require('./schedule-builder');
function createSchedule(data) {
    const builder = new ScheduleBuilder(data, 7, 21);
    return builder.placeDevices();
}

module.exports = createSchedule;