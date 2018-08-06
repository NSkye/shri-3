'use strict';

const ScheduleModel = require('./models/schedule-model');
const normalizeHours = require('./utils/normalize-hours');

class ScheduleBuilder extends ScheduleModel {
    constructor(inputs, dayStart, nightStart) {
        super(inputs, dayStart, nightStart);
        this.addDevices(inputs.devices);
        this.notPlacedDevices = this.devices.slice(0);
        this.setHoursEfficency();
    }

    placeDevices() {
        // сортируем устройства по duration
        this.devices = this.devices.sort((a, b) => {
            if (a.mode && !b.mode) {
                return -1;
            } else if (b.mode && !a.mode) {
                return 1;
            }
            if (b.duration == a.duration) {
                return b.power - a.power;
            }
            return b.duration - a.duration;
        });

        this.devices.map(device => {
            device.setHoursPriority();
            while (device.bestHours.length) {
                const hour = device.bestHours.shift();
                const isSafe = true;//this.deadlockCheck(device, hour);
                if (!isSafe) { continue; }
                device.place(hour.number);
                return;
            }
            throw Error('Impossible to place all devices.');
        });

        return this.renderResults();
    }
}

module.exports = ScheduleBuilder;