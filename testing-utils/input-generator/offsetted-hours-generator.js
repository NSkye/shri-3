const normalizeHours = require('../../utils/normalize-hours');
module.exports = function generateOffsettedHours(start) {
    return Array(23).fill(1).reduce(ac => ac.push(normalizeHours(ac[ac.length - 1] + 1)) && ac, [start])
}