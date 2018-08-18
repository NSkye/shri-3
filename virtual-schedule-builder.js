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
        /*console.log('VIRTUAL SCHEDULE:', this.renderResults());
        console.log('NOT PLACED DEVICES:', this.notPlacedDevices.map(device => device.name));
        console.log('REMAINING POWER: ');
        this.hours.map(h => { console.log(`${h.number}: ${h.remainingPower}`)});
        throw Error(' - ');*/
        return this.deadlockState;
    }

    floorCeilDayNight() {
        this.floorCeilDayDevices();
        this.floorCeilNightDevices();
    }

    floorCeilDayDevices() {
        let devices = this.notPlacedDevices.filter(device => device.mode === 'day').sort(sortDevices.byDuration);
        if (!devices.length) { return; }
        let floor = this.dayStart;
        let ceiling = normalizeHours(this.dayStart + devices[0].duration);

        while(true) {
            devices = devices.reduce((ac, device) => 
                (this.placeOnFloor(device, floor) || this.placeOnCeiling(device, ceiling)) ? ac : ac.push(device) && ac, []
            );
            if (!devices.length) { break; }
            floor = normalizeHours(ceiling + 1);
            ceiling = null;
            for (let i = 0; i < devices.length; i++) {
                const device = devices[i];
                if (!device.checkBasicSafety(floor)) { continue; }
                ceiling = normalizeHours(floor + device.duration);
                break;
            }
            if (ceiling === null) { break; }
        }
    }

    floorCeilNightDevices() {
        let devices = this.notPlacedDevices.filter(device => device.mode === 'night').sort(sortDevices.byDuration);
        if (!devices.length) { return; }
        let ceiling = normalizeHours(this.dayStart - 1);
        let floor = normalizeHours(ceiling - devices[0].duration + 1);

        while(true) {
            devices = devices.reduce((ac, device) => 
                (this.placeOnCeiling(device, ceiling) || this.placeOnFloor(device, floor)) ? ac : ac.push(device) && ac, []
            );
            if (!devices.length) { break; }
            ceiling = normalizeHours(floor - 1);
            floor = null;
            for (let i = 0; i < devices.length; i++) {
                const device = devices[i];
                if (!device.checkBasicSafety(ceiling - device.duration + 1)) { continue; }
                floor = normalizeHours(ceiling - device.duration + 1);
                break;
            }
            if (floor === null) { break; }
        }
    }

    placeOnFloor(device, floor) {
        if (!device.checkBasicSafety(floor)) {
            return false;
        }
        device.place(floor);
        return true;
    }

    placeOnCeiling(device, ceiling) {
        const hour = normalizeHours(ceiling - device.duration + 1);
        if (!device.checkBasicSafety(hour)) {
            return false;
        }
        device.place(hour);
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