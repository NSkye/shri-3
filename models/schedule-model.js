'use strict';

const DayModel = require('./day-model');
const normalizeHours = require('../utils/normalize-hours');
const Device = require('./device-model');

/**
 * Модель расписания, содержит вспомогательную логику для работы с расписанием
 */
class ScheduleModel extends DayModel {
    /**
     * Конструктор
     * @param {Object} inputs изначальные данные ввода
     * @param {Number} dayStart час с которого начинается день
     * @param {Number} nightStart час с которого начинается ночь
     */
    constructor(inputs, dayStart, nightStart) {
        super(dayStart, nightStart);
        this.maxPower = inputs.maxPower;
        this.devices = [];
    }
    /**
     * Назначает часам оставшуюся мощность и тариф, который на них действует
     * @param {Array} rates массив тарифов
     * @param {Number} maxPower максимальная мощность
     */
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
    /**
     * Конвертирует устройства из входных данных в инстансы класса Device
     * @param {Array} devices 
     * @returns {Array}
     */
    addDevices(devices) {
        devices.map(device => {
            const newDevice = new Device(device, this);
            this.devices.push(newDevice);
        });
        return this.devices;
    }
    /**
     * Устанавливает стоимость размещения устройств с различным показателем duration
     */
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
    /**
     * Формирует объект расписание в соответствии с сигнатурой, указанной в задании.
     * @returns {Object}
     */
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