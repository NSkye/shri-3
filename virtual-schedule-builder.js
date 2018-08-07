'use strict';

const ScheduleModel = require('./models/schedule-model');
const Hour = require('./models/hour-model');
const normalizeHours = require('./utils/normalize-hours');

class VirtualScheduleBuilder extends ScheduleModel {
    constructor(parent) {
        super({ maxPower: parent.maxPower }, parent.dayStart, parent.nightStart);
        this.hours = parent.hours.map(h => {
            let cloneHour = new Hour(h.number, h.mode, this);
            cloneHour.devices = h.devices.slice(0);
            cloneHour.remainingPower = h.remainingPower;
            cloneHour.rate = h._hourRate;
            return cloneHour;
        })
        this.devices = parent.devices.map(device => device.clone(this));
        this.notPlacedDevices = this.devices.filter(device => !device.placed.is);
        this.deadlockState = null;
        this.levels = [];
        this.firstLevelStart = null;
        this.lastLevelEnd = null;
        this.firstPlacedDevice = parent.firstPlacedDevice;
        this.devicesByDuration = this.devices.sort((a, b) => {
            if (b.duration == a.duration) {
                return b.power - a.power;
            }
            return b.duration - a.duration;
        });
    }

    placeDevices(device, hourNumber) {
        device = this.devices.find(d => d.original === device);
        if (!device.checkBasicSafety(hourNumber)) {
            this.deadlockState = true;
            return this.deadlockState;
        }
        device.place(hourNumber);
        this.bestFit();
        if (!this.notPlacedDevices.length) {
            this.deadlockState = false;
            return this.deadlockState;
        }
        this.floorCeil(hourNumber);
        if (!this.notPlacedDevices.length) {
            this.deadlockState = false;
            return this.deadlockState;
        }
        this.deadlockState = true;
        return this.deadlockState;
    }

    floorCeil(hourNumber) {
        let level = this.addFirstLevel(hourNumber);
        while(true) {
            level = this.normalizeLevel(level);
            if (level === null) { this.normalizeLevel(this.addAnotherLevel()); }

            const filled = this.fillLevel(level);
            if (!filled) {
                level = this.normalizeLevel(this.addAnotherLevel());
            }
            if (level === null) { break; }
        }
    }

    createLevelFromPlacedDevice(device) {
        const level = {
            from: device.placed.start,
            to: device.placed.end,
            duration: device.duration
        }
        this.levels.push(level);
        this.lastLevelEnd = device.placed.end;
        return level;
    }

    addFirstLevel(hourNumber) {
        const device = this.devicesByDuration[0];
        hourNumber = typeof this.firstPlacedDevice === 'number' ? this.firstPlacedDevice : hourNumber;

        if (device.placed.is) {
            this.firstLevelStart = device.placed.start;
            return this.createLevelFromPlacedDevice(device);
        }

        let placement;
        this.iterateHours({ from: hourNumber, times: 24 }, (h, i) => {
            if (device.checkBasicSafety(h.number)) {
                placement = h.number;
                return 1;
            }
            if (i === 23) {
                this.deadlockState = true;
                throw Error('Impossible to place all devices.');
            }
        });

        device.place(placement);
        this.firstLevelStart = device.placed.start;
        return this.createLevelFromPlacedDevice(device);
    }

    addAnotherLevel() {
        const offsettedHours = this.offsetHours(this.firstLevelStart);
        const nextLevelMaxDuration = 24 - offsettedHours.indexOf(this.lastLevelEnd);
        const devices = this.devicesByDuration.filter(d => !d.placed.is && d.duration <= nextLevelMaxDuration);
        const hourNumber = normalizeHours(this.lastLevelEnd + 1);
        while (devices.length) {
            const device = devices.shift();
            if (!device.checkBasicSafety(hourNumber)) {
                continue;
            }
            device.place(hourNumber);
            return this.createLevelFromPlacedDevice(device);
        }
        return null;
    }

    fillLevel(level) {
        if (level === null) { return false; }
        let filled = false;
        const devices = this.notPlacedDevices.filter(d => d.duration <= level.duration);
        let i = 0;
        while(i < devices.length) {
            const device = devices[i];
            if (!device.checkBasicSafety(level.from)) {
                i++;
                continue;
            }
            device.place(level.from);
            filled = true;
            i++;
        }
        i = 0;
        while(i < devices.length) {
            const device = devices[i];
            if (device.placed.is) { i++; continue; }
            const placement = normalizeHours(level.to - device.duration + 1);
            if (!device.checkBasicSafety(placement)) { i++; continue; }
            device.place(placement);
            filled = true;
            i++;
        }
        return filled;
    }

    normalizeLevel(level) {
        if (level === null) { return null; }
        let { duration, from, to } = level;
        let newFrom, newTo;
        this.iterateHours({ from, to }, h => {
            if (h.remainingPower === 0) {
                duration--;
                return;
            } else if (typeof newFrom !== 'number') {
                newFrom = h.number;
                return 1;
            }
        });
        if (typeof newFrom !=='number') {
            newFrom = from;
        }
        this.iterateHours({ from: newFrom, to }, h => {
            if (typeof newTo !== 'number' && h.remainingPower === 0) {
                newTo = normalizeHours(h.number - 1);
            }
            if (typeof newTo === 'number' && h.remainingPower > 0) {
                newTo = h.number;
            }
        });
        if (typeof newTo !== 'number') { newTo = to; }
        this.iterateHours({ from: newTo, to }, (h, i) => {
            if (!i || h.remainingPower > 0) { return; }
            duration--;
        });

        if (duration <= 0) {
            this.levels.splice(this.levels.indexOf(level), 1);
            return null;
        }

        level.duration = duration;
        level.from = newFrom;
        level.to = newTo;
        return level;
    }

    bestFit() {
        const devices = this.devices.filter(device => !device.placed.is);
        let i = 0;
        while (i < devices.length) {
            const device = devices[i];
            device.setHoursPriorityNoRates();
            const bestHour = device.bestHoursNoRates[0];
            if (bestHour) {
                device.place(bestHour.number);
            }
            i++;
        }
    }
}

module.exports = VirtualScheduleBuilder;