'use strict';

const ScheduleModel = require('./models/schedule-model');
const VirtualScheduleBuilder = require('./virtual-schedule-builder');
const verifyInput = require('./verify-input');

class ScheduleBuilder extends ScheduleModel {
    constructor(inputs, dayStart, nightStart) {
        verifyInput(inputs);
        super(inputs, dayStart, nightStart);
        this._assignRatesAndPower(inputs.rates, this.maxPower);
        this.addDevices(inputs.devices);
        this.notPlacedDevices = this.devices.slice(0);
        this.setHoursEfficency();
        this.lastSafeBuild = null;
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
                const isSafe = this.deadlockCheck(device, hour.number);
                if (!isSafe) { continue; }
                device.place(hour.number);
                if (typeof this.firstPlacedDevice !== 'number') {
                    this.firstPlacedDevice = hour.number;
                }
                return;
            }
            if (this.lastSafeBuild !== null) {
                return this.lastSafeBuild.renderResults();
            }
            throw Error('Impossible to place all devices.');
        });
        return this.renderResults();
    }

    deadlockCheck(device, hourNumber) {
        const virtualBuilder = new VirtualScheduleBuilder(this);
        virtualBuilder.placeDevices(device, hourNumber);
        const isSafe = virtualBuilder.deadlockState === false;
        if (isSafe) {
            this.lastSafeBuild = virtualBuilder;
        }
        return isSafe;
    }
}

module.exports = ScheduleBuilder;