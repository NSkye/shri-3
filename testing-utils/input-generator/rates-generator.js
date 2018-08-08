const generateOffsettedHours = require('./offsetted-hours-generator');
const rand = require('../rand');

function generateRates() {
    const rates = [];
    let from, to;
    generateOffsettedHours(rand(0,23)).map((h, i, ar) => {
        if (typeof from !=='number') {
            from = h;
            return;
        }
        if ((Math.random() <= 0.1 || i == (ar.length - 1)) && typeof from === 'number') {
            to = i != ar.length - 1 ? h : ar[0];
            rates.push(
                { from, to, value: +(Math.random() * 10).toFixed(2) }
            )
            from = h;
            return;
        }
    });
    return rates;
}

module.exports = generateRates;