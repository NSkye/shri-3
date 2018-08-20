'use strict';

const ScheduleModel = require('./models/schedule-model');
const VirtualScheduleBuilder = require('./virtual-schedule-builder');
const verifyInput = require('./verify-input');
const sortDevices = require('./utils/sort-devices');

/**
 * Содержит основную логику для размещения устройств
 */
class ScheduleBuilder extends ScheduleModel {
    /**
     * Конструктор
     * @param {Object} inputs исходные данные
     * @param {Number} dayStart время начала дня
     * @param {Number} nightStart время начала ночи
     */
    constructor(inputs, dayStart, nightStart) {
        verifyInput(inputs); // верификация ввода
        super(inputs, dayStart, nightStart); // вызов конструктора ScheduleModel
        this._assignRatesAndPower(inputs.rates, this.maxPower); // добавление тарифов и оставшейся энергии часам
        this.addDevices(inputs.devices); // конвертация устройств
        this.notPlacedDevices = this.devices.slice(0); // массив неразмещенных устройств
        this.setHoursEfficency(); // определение стоимости размещения каждого устройства для каждого часа
        this.lastSafeBuild = null; // последний успешный VirtualSchedule
        this.firstFailedBuild = null; // первый проваленный VirtualSchedule (для отладки)
        this.lastFailedBuild = null; // последний проваленный VirtualSchedule (для отладки)
    }

    /**
     * Размещает устройства и возвращает объект с сигнатурой, указанной в задании
     * @returns {Object}
     */
    placeDevices() {
        this.devices = this.devices.sort(sortDevices.byPriority); // Сортировка устройств по приоритету
        this.deadlockCheck(); // Первая проверка на наличие тупиковых состояний, чтоб иметь дополнительный фоллбэк в lastSafeBuild
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

    /**
     * Проверка на наличие тупиковых состояний путем создания виртуального расписания и размещения в нем устройств
     * @param {[Object]} device устройство, которое мы собираемся разместить
     * @param {[Number]} hourNumber час, на котором мы его собираемся разместить
     */
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