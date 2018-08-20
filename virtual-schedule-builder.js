'use strict';

const ScheduleModel = require('./models/schedule-model');
const Hour = require('./models/hour-model');
const normalizeHours = require('./utils/normalize-hours');
const sortDevices = require('./utils/sort-devices');

class VirtualScheduleBuilder extends ScheduleModel {
    constructor(parent) {
        const { maxPower, dayStart, nightStart } = parent;
        super({ maxPower }, dayStart, nightStart);
        this.hours = parent.hours.map(h => {
            let clonedHour = new Hour(h.number, h.mode, this);
            clonedHour.devices = h.devices.slice(0);
            clonedHour.remainingPower = h.remainingPower;
            clonedHour.rate = h._hourRate;
            return clonedHour;
        });
        this.devices = parent.devices.map(device => device.clone(this));
        this.notPlacedDevices = this.devices.filter(device => !device.placed.is);
        this.deadlockState = null;
        this.firstPlacedDevice = parent.firstPlacedDevice;
        this.devicesByDuration = this.devices.sort(sortDevices.byDuration);
    }

    placeDevices(device, hourNumber) {
        if (device) {
            device = this.devices.find(d => d.original === device);
            if (!device.checkBasicSafety(hourNumber)) {
                this.deadlockState = true;
                return this.deadlockState;
            }
            device.place(hourNumber);
        }
        this.floorCeilDayNight();
        this.bestFit();
        if (!this.notPlacedDevices.length) {
            this.deadlockState = false;
            return this.deadlockState;
        }
        this.deadlockState = true;
        return this.deadlockState;
    }

    floorCeilDayNight() {
        let day = this.createInitialLevel('day');
        let night = this.createInitialLevel('night');
        if (!night.devices.length && !day.devices.length) { return; }

        while(true) {
            [ day.devices, night.devices ] = day.devices.concat(night.devices).reduce((ac, device) => {
                if (device.mode === 'day') {
                    (this.placeOnFloor(device, day.floor) || this.placeOnCeiling(device, day.ceiling)) || ac[0].push(device);
                } else if (device.mode === 'night') {
                    (this.placeOnCeiling(device, night.ceiling) || this.placeOnFloor(device, night.floor)) || ac[1].push(device);
                }
                return ac;
            }, [ [], [] ])

            day = this.createNextLevel(day);
            night = this.createNextLevel(night);

            if (!day.devices.length && !night.devices.length) { break; }
        }
    }

    createNextLevel({ floor, ceiling, devices }) {
        if (!devices.length) { return { devices: [] }; }
        const mode = devices[0].mode;
        floor = mode == 'day' ? normalizeHours(ceiling + 1) : null;
        ceiling = mode == 'day' ? null : normalizeHours(floor - 1);
        
        switch (mode) {
            case 'day':
            for (let i = 0; i < devices.length; i++) {
                const device = devices[i];
                if (!device.checkBasicSafety(floor)) { continue; }
                ceiling = normalizeHours(floor + device.duration);
                break;
            }
            break;

            case 'night':
            for (let i = 0; i < devices.length; i++) {
                const device = devices[i];
                if (!device.checkBasicSafety(ceiling - device.duration + 1)) { continue; }
                floor = normalizeHours(ceiling - device.duration + 1);
                break;
            }
            break;
        }

        return !(floor === null || ceiling === null) ? { floor, ceiling, devices } : { devices: [] };
    }

    createInitialLevel(mode) {
        let devices = this.notPlacedDevices.filter(device => device.mode === mode);
        if (!devices.length) { return { devices }; }
        let floor, ceiling;
        if (mode === 'day') {
            floor = this.dayStart;
            ceiling = normalizeHours(this.dayStart + devices[0].duration);
        } else if (mode === 'night') {
            ceiling = normalizeHours(this.dayStart - 1);
            floor = normalizeHours(ceiling - devices[0].duration + 1);
        } else { return { devices }; }

        return { floor, ceiling, devices }
    }

    placeOnFloor(device, floor) {
        if (!device.checkBasicSafety(floor)) {
            return false;
        }
        device.place(floor);
        
        return this.floorCeilSafetyMeasures(device, floor);
    }

    placeOnCeiling(device, ceiling) {
        const hour = normalizeHours(ceiling - device.duration + 1);
        if (!device.checkBasicSafety(hour)) {
            return false;
        }
        device.place(hour);

        return this.floorCeilSafetyMeasures(device, hour); 
    }

    floorCeilSafetyMeasures(placedDevice, placedHourNumber) {
        const device = this.notPlacedDevices.filter(device => !device.mode)[0];
        if (!device) { return true; }
        device.setHoursPriorityNoRates();
        if (device.bestHoursNoRates.length) { return true; }
        placedDevice.remove();
        device.setHoursPriorityNoRates();
        if (device.bestHoursNoRates.length) {
            device.place(device.bestHoursNoRates[0].number);
            return false;
        }
        placedDevice.place(placedHourNumber);
        return true;
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