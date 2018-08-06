'use strict';

const DayModel = require('./day-model');
const normalizeHours = require('../utils/normalize-hours');
const Device = require('./device-model');
const verifyInput = require('./verify-input');

class ScheduleModel extends DayModel {
    constructor(inputs, dayStart, nightStart) {
        super(dayStart, nightStart);
        verifyInput(inputs);
        this.maxPower = inputs.maxPower;
        this.devices = [];
        this._assignRatesAndPower(inputs.rates, this.maxPower);
    }

    _assignRatesAndPower(rates, maxPower) {
        let ratesPlaced = 0;
        rates.map(rate => {
            const { from } = rate;
            const to = normalizeHours(rate.to - 1);
            this.iterateHours({from, to}, h => {
                h.rate = rate;
                h.remainingPower = maxPower;
                ratesPlaced++;
            });
        });
        if (ratesPlaced!=24) throw Error('Incorrect input, should be exactly one rate per hour.');
    }

    addDevices(devices) {
        devices.map(device => {
            const newDevice = new Device(device, this);
            this.devices.push(newDevice);
        });
        return this.devices;
    }

    setHoursEfficency() {
        this.hours.map(h => {
            this.devices.map(device => {
                if (h.efficency.hasOwnProperty(device.duration)) { return; }
                let efficency = 0;
                this.iterateHours({ from: h.number, times: device.duration }, hh => {
                    efficency += hh.rate;
                });
                h.setEfficency(device.duration, efficency);
            });
        });
    }

    renderResults() {
        let schedule = {};
        let devices = {};
        let value = 0;

        this.hours.map(h => {
            schedule[h.number] = h.devices.map(d => d.id);
            value += (this.maxPower - h.remainingPower) * h.rate;
            h.devices.map(d => {
                devices[d.id] = +(!devices[d.id] ?
                (d.power * h.rate) / 1000 : devices[d.id] + d.power * h.rate / 1000).toFixed(10);
            });
        });

        return { schedule, consumedEnergy: { value: value / 1000, devices } };
    }
}

module.exports = ScheduleModel;