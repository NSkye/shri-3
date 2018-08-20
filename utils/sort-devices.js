'use strict';

/**
 * Коллбэк для функции Array.prototype.sort  
 * Сортировка устройств по приоритету:  
 * Устройство с mode всегда приоритетнее устройства без mode  
 * Устройство с наибольшим duration приоритетнее (кроме как когда есть mode)  
 * Устройство с наибольшим power приоритетнее (когда у обоих есть/нет mode и равная duration)  
 */
function byPriority(a, b) {
    if (a.mode && !b.mode) {
        return -1;
    } else if (b.mode && !a.mode) {
        return 1;
    }
    if (b.duration == a.duration) {
        return b.power - a.power;
    }
    return b.duration - a.duration;
}

/**
 * Коллбэк для функции Array.prototype.sort  
 * Альтернативная сортировка устройств по приоритету (то же самое, только power и duration поменялись местами):  
 * Устройство с mode всегда приоритетнее устройства без mode  
 * Устройство с наибольшим power приоритетнее (кроме как когда есть mode)  
 * Устройство с наибольшим duration приоритетнее (когда у обоих есть/нет mode и равная power)  
 */
function byPriorityPowerBias(a, b) {
    if (a.mode && !b.mode) {
        return -1;
    } else if (b.mode && !a.mode) {
        return 1;
    }
    if (b.power == a.power) {
        return b.duration - a.duration;
    }
    return b.power - a.power;
}

/**
 * Сортировка в первую очередь по duration, во вторую очередь по power
 */
function byDuration(a, b) {
    if (b.duration == a.duration) {
        return b.power - a.power;
    }
    return b.duration - a.duration;
}

module.exports = {
    byPriority,
    byPriorityPowerBias,
    byDuration
}