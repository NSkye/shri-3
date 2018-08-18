'use strict';

const ScheduleModel = require('./models/schedule-model');
const VirtualScheduleBuilder = require('./virtual-schedule-builder');
const verifyInput = require('./verify-input');
const sortDevices = require('./utils/sort-devices');

class ScheduleBuilder extends ScheduleModel {
    constructor(inputs, dayStart, nightStart) {
        verifyInput(inputs);
        super(inputs, dayStart, nightStart);
        this._assignRatesAndPower(inputs.rates, this.maxPower);
        this.addDevices(inputs.devices);
        this.notPlacedDevices = this.devices.slice(0);
        this.setHoursEfficency();
        this.lastSafeBuild = null;
        this.firstFailedBuild = null;
        this.lastFailedBuild = null;
    }

    placeDevices() {
        // сортируем устройства по приоритету
        this.devices = this.devices.sort(sortDevices.byPriority);
        this.deadlockCheck();
        let i = 0;
        let triedToStartFromEveryDevice = false;
        while(this.notPlacedDevices.length) {
            const device = this.devices[i];
            if (!device.placed.is) {
                device.setHoursPriority();
            }
            let success = false;
            while (device.bestHours.length && !device.placed.is) {
                const hour = device.bestHours.shift();
                const isSafe = this.deadlockCheck(device, hour.number);
                if (!isSafe) { continue; }
                device.place(hour.number);
                if (typeof this.firstPlacedDevice !== 'number') {
                    this.firstPlacedDevice = hour.number;
                }
                success = true;
                break;
            }
            if (success || device.placed.is) { 
                i = i + 1 == this.devices.length ? 0 : i + 1;
                continue; 
            }
            if (this.lastSafeBuild !== null) {
                return this.lastSafeBuild.renderResults();
            }
            if (!triedToStartFromEveryDevice) {
                i = i + 1 == this.devices.length ? (~(triedToStartFromEveryDevice = true) && 0) : i + 1;
                continue;
            }  
            throw Error('Impossible to place all devices.');
        }
        return this.renderResults();
    }

    deadlockCheck(device, hourNumber) {
        const virtualBuilder = new VirtualScheduleBuilder(this);
        virtualBuilder.placeDevices(device, hourNumber);
        const isSafe = virtualBuilder.deadlockState === false;
        if (isSafe) {
            this.lastSafeBuild = virtualBuilder;
        } else {
            this.firstFailedBuild = this.firstFailedBuild === null ? this.firstFailedBuild = virtualBuilder : this.firstFailedBuild;
            this.lastFailedBuild = virtualBuilder;
        }
        return isSafe;
    }
}

module.exports = ScheduleBuilder;