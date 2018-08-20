'use strict';

const normalizeHours = require('../utils/normalize-hours');
const sortDevices = require('../utils/sort-devices');

class Device {
    constructor(deviceData, environment) {
        this.environment = environment;

        const { id, name, power, duration } = deviceData;
        this.id = id;
        this.name = name;
        this.power = power;
        this.duration = duration;
        if (deviceData.mode) { this.mode = deviceData.mode };

        this.placed = {
            is: false,
            start: null,
            end: null
        };

        this.bestHours = [];
        this.cloned = false;
    }

    clone(environment) {
        const cloneInstance = new Device({
            id: this.id,
            name: this.name,
            power: this.power,
            duration: this.duration,
        }, environment);
        if (this.mode) {
            cloneInstance.mode = this.mode;
        }
        cloneInstance.cloned = true;
        cloneInstance.placed = {
            is: this.placed.is,
            start: this.placed.start,
            end: this.placed.end
        }
        cloneInstance.original = this;
        cloneInstance.bestHours = this.bestHours.slice(0);
        return cloneInstance;
    }

    checkBasicSafety(hourNumber) {
        const environment = this.environment;
        let isSafe = true;
        environment.iterateHours({ from: hourNumber, times: this.duration }, h => {
            if (this.mode && h.mode !== this.mode) {
                isSafe = false;
                return 1;
            }
            if (this.power > h.remainingPower) {
                isSafe = false;
                return 1;
            }
        });

        return isSafe;
    }
    
    place(hourNumber) {
        const environment = this.environment;
        if (this.placed.is) { throw Error('Device is already placed.') }
        environment.iterateHours({ from: hourNumber, times: this.duration }, h => {
            h.devices.push(this);
            h.remainingPower -= this.power;
        });
        this.placed.is = true;
        this.placed.start = hourNumber;
        this.placed.end = normalizeHours(hourNumber + this.duration - 1);

        const myIndex = environment.notPlacedDevices.indexOf(this);
        environment.notPlacedDevices.splice(myIndex, 1);
    }

    remove(recentlyPlaced = true) {
        const environment = this.environment;
        if (!this.placed.is) { throw Error('Can not remove device, it was not placed yet.') }
        environment.iterateHours({ from: this.placed.start, to: this.placed.end }, h => {
            const myIndex = h.devices.indexOf(this);
            h.devices.splice(myIndex, 1);
            h.remainingPower += this.power;
        });
        this.placed.is = false;
        this.placed.start = null;
        this.placed.end = null;

        environment.notPlacedDevices.unshift(this);
        if (!recentlyPlaced) {
            environment.notPlacedDevices = environment.notPlacedDevices.sort(sortDevices.byPriority);
        }
    }

    setHoursPriority() {
        const environment = this.environment;
        this.bestHours = environment.hours
            .slice(0)
            .filter(h => this.checkBasicSafety(h.number))
            .sort((a, b) => {
                if (a.getEfficency(this) == b.getEfficency(this)) {
                    return a.getCombinedPower(this.duration) - b.getCombinedPower(this.duration);
                }
                return a.getEfficency(this) - b.getEfficency(this)
            });
    }

    setHoursPriorityNoRates() {
        const environment = this.environment;
        this.bestHoursNoRates = environment.hours
            .slice(0)
            .filter(h => this.checkBasicSafety(h.number))
            .sort((a, b) => {
                return a.getCombinedPower(this.duration) - b.getCombinedPower(this.duration);
            });
    }

    get isPlaced() {
        return this.placed.is;
    }

    get info() {
        const { id, name, power, duration } = this;
        const info = { id, name, power, duration };
        if (this.mode) {
            info.mode = this.mode;
        }
        return info;
    }

    get extendedInfo() {
        const info = this.info;
        info.placed = {
            is: this.placed.is,
            start: this.placed.start,
            end: this.placed.end
        }
        info.bestHours = this.bestHours.map(h => h.number);
        info.cloned = this.cloned;

        return info;
    }
}

module.exports = Device;
