/**
 * Генерирует псевдослучайное число в указанном диапазоне
 * @param {Number} min минимальное число
 * @param {Number} max максимальное число
 */
module.exports = function rand(min, max) {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}