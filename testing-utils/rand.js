module.exports = function rand(min, max) {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}