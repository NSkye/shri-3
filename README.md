# Задание на JS для Школы Разработки Интерфейсов
Основная функция находится в корне, в файле index.js и уже экспортирована.  
Как обычно:
```
npm i
npm run test
```
## Table of contents
[Использованные сторонние пакеты](#thirdparty)  
[Основной алгоритм](#main)  
[Алгоритм проверки на наличие тупиковых состояний](#deadlocks)  
[Верификация ввода](#verification)  
[Тестирование](#testing)  
[Подробное описание основных модулей](#wouldyouliketoknowmore)  

## <a name='thirdparty'></a>Сторонние пакеты
#### [Jest](https://jestjs.io/)
Тестовый фреймворк. Задействован с целью упростить процесс тестирования и не писать самостоятельно тестраннер с обработкой ошибок, выбрасываемых assert'ом при тестировании нативными средствами. Также возможность собирать coverage весьма удобна при отладке и отслеживании лишнего кода. Почему именно он? Потому что zero-configuration, удобный API и я с ним уже работал раньше.
#### [fs-extra](https://github.com/jprichardson/node-fs-extra)
Библиотека для работы с файлами, обладающая большим функционалом, чем нативная fs. При тестировании на случайных значениях нужно как-то сохранять выборки, на которых программа полегла. Эта библиотека просто делает этот процесс чуточку удобнее, так как в ней присутствует поддержка промисов и расширенные методы для работы с папками (например, можно очистить папку или удалить папку вместе с файлами), которых с нативной fs пришлось бы реализовывать самому. 
## <a name='main'></a> Основной алгоритм
В упрощенном виде алгоритм можно свести к следующему:  
1. Устройства сортируются по **приоритету [1]**
2. Каждому устройству вычисляется **наиболее выгодная позиция [2]**
3. Производится проверка на наличие **тупикового состояния [3]** при размещении устройства на этой позиции
4. Если проверка прошла успешно, то устройство размещается, если нет - то то же самое повторяется для следующей по выгодности позиции
5. Повторяем пока не будут размещены все устройства или пока для одного из устройств не закончатся возможные позиции для размещения

*подробный алгоритм и разбор кода можно найти в последнем разделе*  

#### [1] Приоритет устройств
Вычисляется по следующим првилам
1. Устройство с mode ВСЕГДА приоритетнее устройства без mode
2. Устройство с большим показателем duration всегда приоритетнее устройства с меньшимм показателем duration (кроме случая из п.1)
3. При прочих равных устройство с большим показателем power приоритетнее устройства с меньшим показателем power  

Также предусмотрена альтернативная приоритизация для специфичных выборок устройств, где в первую очередь приоретизация происходит по power, а уже потом по duration.  

#### [2] Наиболие выгодная позиция
Такая позиция, на которой устройство будет размещаться преимущественно на часах с минимальным значением тарифа. Вычисляется следующим образом:
1. Берем один из часов, зная duration, находим сумму тарифа на каждом часу на протяжении duration, начиная с указанного часа
2. Часы с получившимся значениями сортируем по возрастанию (первый - наиболее выгодный, последний - наименее выгодный)

#### [3] Тупиковое состояние 
Это такое состояние, при котором невозможно разместить в расписании все оставшиеся устройства так, чтобы каждое устройство отработало полный цикл.

## <a name='deadlocks'></a> Алгоритм проверки на наличие тупиковых состояний
Собственно, алгоритм проверки на наличие тупиковых состояний можно упростить до следующего:
1. Создаем копию расписания и дальше работаем с ней
2. Размещаем устройство на заданной позиции
3. Пытаемся максимально компактно разместить все остальные устройства
4. Возвращаем ответ получилось ли разместить устройства, если получилось, то указанное устройство будет размещено на указанной позиции, если нет, то размещение будет отклонено

*разбор кода можно найти в последнем разделе*

Как и в основном алгоритме, в первую очередь размещаются устройства зависимые от времени суток, но процесс более комплексный. В первую очередь выделяются устройства, зависимые от времени суток и разделяются на дневные и ночные. После этого обе эти группы сортируются по убыванию duration и каждая из них размещается в расписании по модифицированному алгоритму floor ceiling decreasing. Причем это делается так, чтоб между дневными и ночными устройствами оставалось как можно больше непрерывного свободного места. Модификация алгоритма заключается в том, что на каждой итерации производится мини-проверка на потенциальные тупики: мы находим независимое от времени суток устройство с самым большим показателем duration среди неразмещенных и проверяем будет ли возможность его разместить после этой итерации, если нет, то на этой итерации мы разместим его, а не устройство зависимое от времени суток. В остальном алгоритм работает как обычный floor ceiling decreasing, за исключением того, что он по сути выполняется в двух экземплярах -- для дневных и ночных устройств.  
После того как мы разместили зависимые от времени устройства (либо у нас больше нет возможности создавать новые уровни), мы размещаем оставшиеся устройства с помощью модифицированного варианта алгоритма best fit decreasing: нет никаких уровней, устройства приоретизируются уже описанным способом, каждое устройство размещается туда, где оно сможет забрать наибольшую долю от оставшейся энергии. 
## <a name='verification'></a> Верификация ввода
Верификация ввода проводится на двух этапах.
1. Явная верификация ввода с помощью специально написанного модуля.
2. На этапе назначения каждому часу тарифа, согласно введеным данным. Если было проитерировано ровно 24 часа, значит у нас заданы все нужные тарифы, если нет, значит во вводе либо были не указаны тарифы для всех часов, либо у нас есть конфликтующие тарифы.  
(рассмотрим начиная с последнего)
### Верификация на этапе назначения тарифов
`./models/schedule-model.js:22`
```javascript
/**
 * Назначает часам оставшуюся мощность и тариф, который на них действует
 * @param {Array} rates массив тарифов
 * @param {Number} maxPower максимальная мощность
*/
_assignRatesAndPower(rates, maxPower) {
    let ratesPlaced = 0; // считаем сколько раз был назначен тариф для часа
    rates.map(rate => { // для каждого тарифа итерируем часы и на каждый назначаем тариф
        const { from } = rate;
        const to = normalizeHours(rate.to - 1);
        this.iterateHours({from, to}, h => {
            h.rate = rate;
            h.remainingPower = maxPower;
            ratesPlaced++;
        });
    });
    // если мы назначили тарифов больше или меньше, чем у нас есть часов, значит ввод был неверный
    if (ratesPlaced!=24) throw Error('Incorrect input, should be exactly one rate per hour.');
}
```
### Явная верификация
Для явной верификации была написана функция, выполняющая поверхностную (нерекурсивную) проверку на соответствие объекта объекту-дескриптору. Чтоб много не расписывать, вот пример работы взятый из тестов:  

`./verify-input/verify-object.spec.js:0`
```javascript
const verifyObject = require('./verify-object');
const { all, one } = verifyObject;

test('successful verification and wrong arguments', () => {
    
    const descriptor = {
        arrayField: Array,
        objectField: Object,
        numberField: Number,
        stringField: String,
        booleanField: Boolean,
        symbolField: Symbol,
        functionField: Function,
        NaNField: NaN,
        nullField: null,
        undefinedField: undefined,
        customCheckField: a => a >= 4,
        numberOrString1: one(Number, String),
        numberOrString2: one(Number, String),
        nonEmptyArray: all(Array, a => !!a.length)
    }

    const object = {
        arrayField: [1, 2, 3],
        objectField: {},
        numberField: 5,
        stringField: 'this is string',
        booleanField: true,
        symbolField: Symbol(),
        functionField: function func() {
            return 'i am function';
        },
        NaNField: NaN,
        nullField: null,
        customCheckField: 4,
        numberOrString1: 'two',
        numberOrString2: 2,
        nonEmptyArray: [1, 2, 3]
    }
    
    expect(verifyObject(object, descriptor)).toBe(true);
    expect(verifyObject(null, descriptor)).toBe(false);
});
```
#### Принцип работы
Дескриптор должен содержать поля, соответствующие полям ожидаемого объекта, но в каждом поле вместо самого значения указывается либо тип значения (на данный момент можно указывать Array, Object, Number, String, Boolean, Symbol, Function, NaN, null, undefined, причем Number не соответствует NaN, а null не соответствует Object), либо функция, которая должна быть использована для проверки. Методы All и One предназначены для объединения нескольких условий и работают как логические И и ИЛИ соответственно. Сам алгоритм весьма прост:  
  
0 У нас есть несколько заготовленных функций для проверки.  
1 Итерируем через поля дескриптора и проверяемого объекта.  
2 Если значение в поле дескриптора является ключем, то проверяем значение в таком же поле объекта с помощью соответствующей ему функции, если нет, то значение в дескрипторе это функция, которую используем для проверки.  
  
С исходным кодом верификатора можно ознакомиться в `./verify-input`.  
Соответственно, при несоответствии объекта дескриптору, программа будет выбрасывать ошибку (фрагмент):
`./verify-input/index.js:15`
```javascript
let checkInput = verifyObject(input, {
        devices: Array,
        rates: Array,
        maxPower: Number
    });
    if (!checkInput) {
        throw Error('Incorrect input.')
    }
```
## <a name='testing'></a> Тестирование
Тесты писались таким образом, чтобы была возможность проверить как можно большее вариантов различных выборок. Применялись как статичные данные, так и случайно сгенерированные. Все основные тесты можно посмотреть в `./index.spec.js` и остальные тесты в файлах, оканчивающихся на .spec.js.
### Статичные тесты
#### Тестирование с оригинальными данными, предоставленными в задании
`./index.spec.js:10`
```javascript
test('original.json', () => {
        expect(createSchedule(require('./data/original.json')).consumedEnergy).toEqual({
            value: 38.939,
            devices: {
                '02DDD23A85DADDD71198305330CC386D': 5.398,
                '1E6276CC231716FE8EE8BC908486D41E': 5.398,
                'F972B82BA56A70CC579945773B6866FB': 5.1015,
                '7D9DC84AD110500D284B33C82FE6E85E': 1.5215,
                'C515D887EDBBE669B2FDAC62F571E9E9': 21.52
            }
        });
    });
```
#### Тестирование с крайними случаями (неверный ввод и отсутствие устройств)
`./index.spec.js:23`
```javascript
test('no-devices.json', () => {
    // нет устройств, не должно быть никаких проблем, должно просто сформировать пустое расписание
    expect(createSchedule(require('./data/no-devices.json')).consumedEnergy).toEqual({
        value: 0,
        devices: { }
    });
});

const wrongRateInput = [
    'conflicting-rates.json',
    'not-enough-rates.json'
].map(filename => {
    const path = './data/' + filename;
    const input = require(path);
    // при конфликтующих тарифах или их недостатке должна быть одна и та же ошибка
    test(filename, () => {
        expect(() => createSchedule(input)).toThrowError('Incorrect input, should be exactly one rate per hour.');
    });
})
```
#### Тестирование со случайными данными
Для тестирования со случайными данными был создан отдельный модуль, который генерирует случайные, но корректные данные, причем таким образом, что при размещении всех устройств из сгенерированной выборки, на каждом часу не останется свободной энергии. То есть, всё тестирование производится "на пределе". К сожалению, не удалось сделать так, чтоб программа работала в 100% случаев, но в большинстве случаев (>80%) всё же все устройства будут размещены, на обычных выборках, схожих с оригинальной (где не так много устройств и они не занимают всё место в расписании), проблем не будет. Генератор случайных данных предусматривает возможность генерации выборок как без устройств, зависимых от времени (с такими практически никогда не бывает проблем), так и с определенной долей устройств, зависимых от него (большинство проблем именно на таких выборках). Ознакомиться с генератором данных можно в `./testing-utils/input-generator`.   
Само тестирование с комментариями:  
`./index.spec.js:63`
```javascript
describe('monkey testing', () => {
    // очищаем папку, в которой хранятся выборки, на которых выскочила ошибка
    fsExtra.emptyDirSync('./output/failed_tests'); 
    // генерируем 99 различных выборок
    const differentInputs = [
        // 33 выборки без устройств зависимых от времени суток
        generateInput(33, 4, 0),
        // 33 выборки, где половина устройств зависит от времени суток
        generateInput(33, 4, 0.5),
        // 33 выборки, где все устройства зависят от времени суток
        generateInput(33, 4, 1)
    ].map(inputs => {
        inputs.map(inputWrapper => {
            // разворачиваем обертку выборки для получения данных о ней
            const { name, input, modeP } = inputWrapper;
            // конвертируем данные в JSON для возможности последующей записи в файл
            const log = JSON.stringify(input, null, 2);
            test(name, () => { // присваиваем тесту имя выборки
                try {
                    const schedule = createSchedule(input);
                    // если не было ошибок, то в выводе должно быть столько же устройств, сколько было при вводе
                    expect(Object.keys(schedule.consumedEnergy.devices).length).toBe(input.devices.length);
                } catch(e) {
                    // если не удалось разместить устройства в выборке, то сохраним её
                    Promise.resolve()
                    .then(() => fsExtra.ensureDir(`./output/failed_tests/mp${modeP}`))
                    .then(() => fs.appendFile(`./output/failed_tests/mp${modeP}/${name}.json`, log, e => { if (e) { console.log(e.message) } }))
                    .catch(e => console.log(e.message));
                    // если и была ошибка, то она должна быть связана с невозможностью разместить устройства
                    expect(e.message).toBe('Impossible to place all devices.');
                }
            });
        });
    });
});
```
## <a name='wouldyouliketoknowmore'></a> Подробное описание основных модулей
[Модели](#models)  
[Основная логика](#core)
### <a name='models'></a>Модели
[Device](#device)  
[Hour](#hour)  
[DayModel](#daymodel)  
[ScheduleModel](#schedulemodel)  
#### <a name='device'></a>Device `./models/device-model.js`
Класс устройства, содержит атрибуты и методы для манипулирования устройствами в расписании.
##### Конструктор
```javascript
new Device(deviceData, environment);
```
- deviceData -- оригинальный объект устройства из входных данных  
- environment -- ссылка на окружение, в котором будет располагаться инстанс класса (ScheduleBuilder или VirtualScheduleBuilder)
##### `.id`, `.name`, `.power`, `.duration`, `.mode`
Полностью повторяют данные из deviceData
##### `.placed`
Объект содержащий информацию о расположении устройства в расписании.
- .placed.is -- `Boolean` факт размещения устройства. true - размещено, false - не размещено
- .placed.start -- `Number` номер часа, в котором устройство начнет работать
- .placed.end -- `Number` номер последнего часа работы устройства (включительно, то есть, если устройство работает с 1 до 3, то тут будет 2)
##### `.bestHours`
Массив инстансов класса Hour, содержит все часы, в которые может быть размещено устройство, начиная с самого экономичного варианта, заканчивая самым неэкономичным
##### `.cloned`
`boolean`, указывает является ли это устройство копией.
##### `.checkBasicSafety(hourNumber)`
Проверяет возможность размещения устройства на указанном часу. В соответствии с duration проверяется нужное количество часов следующих за указанным часом, у каждого часа должен быть соответствующий mode и достаточное количество оставшейся энергии. Возвращает `boolean`.
##### `.place(hourNumber)`
Размещает устройство на заданном часу. В соответствии с duration, начиная от указанного часа, записывает в массив устройств каждого часа себя, а также убирает себя из массива неразмещенных устройств.
##### `.remove([recentlyPlaced])`
То же самое, что place, но в обратном порядке. Убирает устройство с часа на котором оно расположено. Добавляет его обратно в массив неразмещенных устройств. Если устройство размещено было только что (опциональный аргумент, по умолчанию true), то устройство добавит себя в начало массива неразмещенных устройств, если нет, то ещё и отсортирует его по новой.
##### `.setHoursPriority()`
Находит все часы, на которых можно разместить устройство. Сортирует их от наиболее выгодных к наименее выгодным. Сохраняет в атрибуте .bestHours.
##### `.setHoursPriorityNoRates()`
То же самое, что setHoursPriority, только вместо учитывания тарифов и сортировки часов по более выгодным, учитывает где устройство займет наибольшую долю от оставшейся энергии и в соответствии с этим сортирует. Сохраняет в атрибуте .bestHoursNoRates.

#### <a name='hour'></a>Hour `./models/hour-model.js`  
Модель часа, содержит атрибуты и методы для манипулирования часами в расписании. Для составления расписания требуется 24 инстанса класса Hour.
##### Конструктор
```javascript
new Hour(number, mode, environment);
```
- number -- какой час в суточном цикле будет представлять создаваемый инстанс, устанавливает атрибут number
- mode -- к какому времени суток будет отнесен созданный час, устанавливает атрибут mode
- environment -- окружение, в котором будет этот инстанс располагаться (ScheduleBuilder или VirtualScheduleBuilder), устанавливает атрибут environment
##### `get rate()`, `set rate()`
Каждому часу можно устанавливать тариф, действующий на нем. Ссылка на объект тарифа хранится в в атрибуте `._hourRate`.
Сеттер устанавливает значение этого атрибута, геттер возвращает только атрибут value из него.

##### `setEfficency(duration, value)`, `getEfficency(device)`
Каждому часу можно установить значение того, насколько экономично будет расположить устройство с определенным значением duration на нем. Меньше - лучше. setEfficency устанавливает атрибут efficency, getEfficency возвращает соответствующий устройству показатель.

##### `getCombinedPower(duration)`
Возвращает суммарную оставшуюся энергию начиная с этого часа и на протяжении duration.

#### <a name='daymodel'></a>DayModel `./models/day-model.js`
Моделирует суточный цикл. Содержит в себе 24 инстанса класса Hour и методы для итерации через них.  
Основная задача -- предоставить возможность непрерывно итерировать через часы, то есть, если мы хотим проитерировать от 22 часа до 1, у нас должна быть такая возможность, иначе не получится размещать устройства на стыке суток.
##### Конструктор
```javascript
new DayModel(dayStart, nightStart)
```
- dayStart -- час, с которого начинается день
- nightStart -- час, с которого начинается ночь
##### `.hours`
Массив инстансов класса Hour, наш суточный цикл
##### `_addHours()`
Вызывается только внутри конструктора, создает массив инстансов класса Hour, присваивая каждому время суток к которому он относится.
##### `* _iterateFromTo(from, to)`
Функция-генератор, итерирует от заданного часа до заданного часа включительно. То есть, если указать в аргументах (23, 3), то будут выведены часы 23, 0, 1, 2, 3. Не предназначена для вызова извне.
- from -- номер часа с которого итерировать
- to -- номер часа до которого итерировать
##### `* _iterateTimes(from, times)`
Функция-генератор, аналогична предыдущей, только итерирует не до заданного часа, а указанное количество раз. То есть, если указать в аргументах (23, 3), будут выведены часы 23, 0, 1. Также не предназначена для вызова извне.
- from -- номер часа с которого итерировать
- times -- количество итераций
##### `iterateHours({ from, [to|times]}, cb)`
Синтаксический сахар, объединяет предыдущие два итератора и включает в себя проверки на правильность переданных аргументов, предназаначена для вызова извне. Принимает на вход час с которого итерировать и час до которого итерировать | количество итераций, а также коллбэк, который будет вызван на каждой итерации. Если коллбэк возвращает truthy значение, то итерация прекращается.  
Пример использования:
```javascript
dayModelInstance.iterateHours({ from: 23, to: 3 }, h => console.log(h.number)) // -> 23, 0, 1, 2, 3
dayModelInstance.iterateHours({ from: 23, times: 3 }, h => console.log(h.number)) // -> 23, 0, 1
```
#### <a name='schedulemodel'></a>ScheduleModel `./models/schedule-model.js`
Наследуется от класса DayModel и содержит вспомогательную логику для манипулирования расписанием.
##### Конструктор
```
new ScheduleModel(inputs, dayStart, nightStart);
```
- inputs -- исходные данные, в соответствии с сигнатурой указанной в задании
- dayStart -- время начала дня
- nightStart -- время начала ночи
##### `.maxPower`
Максимальная мощность, заданная во входных данных.
##### `.devices`
Массив инстансов класса Device
##### `_assignRatesAndPower(rates, maxPower)`
Метод предназначен для вызова из дочерних классов. Назначает каждому часу соответствующий тариф и оставшуюся энергию. А также выбрасывает ошибку при конфликтующих или недостающих тарифах.
- rates -- массив тарифов
- maxPower -- максимальная энергия
##### `addDevices(devices)`
Заполняет атрибут .devices заданными устройствами, попутно конвертируя их в инстансы класса Device.
##### `setHoursEfficency()`
Устанавливает для каждого часа стоимость размещения на нем устройства с определенным показателем duration. (см. setEfficency/getEfficency в Hour).
##### `renderResults()`
Формирует и возвращает объект расписания, оформленный в соответствии с сигнатурой указанной в задании. 
### <a name='core'></a>Модули с основной логикой
Тут всё будет сильно подробнее.
[ScheduleBuilder](#schedulebuilder)  
[VirtualScheduleBuilder](#virualschedulebuilder)
[Приоретизация устройств](#devicesorting)
#### <a name='schedulebuilder'></a>ScheduleBuilder `./schedule-builder.js`
[Конструктор](#schedulebuilderconstructor)
[.lastSafeBuild, .firstFailedBuild, .lastFailedBuild](#builds)
[placeDevices()](#schedulebuilderplacedevices)
[tryToPlaceDevice()](#trytoplacedevice)
[deadlockCheck()](#deadlockcheck)
##### <a name='schedulebuilderconstructor'></a>Конструктор
```javascript
new ScheduleBuilder(input, dayStart, nightStart);
```
- inputs -- входные данные в соответствии с сигнатурой, указанной в задании
- dayStart -- час в который начинается день
- nightStart -- час, в который начинается ночь
При вызове конструктор в первую очередь [проверяет правильность входных данных](#verification), затем вызывает методы `_assignRatesAndPower`, `addDevices` и `setHoursEfficency`, унаследованные от [ScheduleModel](#schedulemodel). После этого создает массив неразмещенных устройств `.notPlacedDevices`. Таким образом, мы готовы к составлению расписания.
##### <a name='builds'></a>`.lastSafeBuild`, `.firstFailedBuild`, `.lastFailedBuild`
Инстансы [VirtualScheduleBuilder](#virtualschedulebuilder).  
lastSafeBuild -- последний инстанс [VirtualScheduleBuilder](#virtualschedulebuilder), в котором удалось разместить все устройства  
firstFailedBuild, lastFailedBuild -- первый и последние инстансы [VirtualScheduleBuilder](#virtualschedulebuilder), в которых не получилось разместить все устройства, требуются только для отладки  
##### <a name='schedulebuilderplacedevices'></a>`placeDevices()`
Основная логика для размещения устройств. Разбор кода с объяснениями:  
`./schedule-builder.js:30`
```javascript
/**
     * Размещает устройства и возвращает объект с сигнатурой, указанной в задании
     * @returns {Object}
     */
    placeDevices() {
        this.devices = this.devices.sort(sortDevices.byPriority); // Сортировка устройств по приоритету
        let devices = this.devices.slice(0); // Копируем себе устройства, так как возможно их порядок придется изменить и мы не хотим мутировать основной массив
        this.deadlockCheck(); // Первая проверка на наличие тупиковых состояний, чтоб иметь дополнительный фоллбэк в lastSafeBuild
        
        let i = 0;
        let triedToStartFromEveryDevice = false;
        let triedPowerBias = false;
        // итерируем через все устройства
        while(this.notPlacedDevices.length) {
            const device = devices[i];
            // пробуем разместить устройство
            let success = this.tryToPlaceDevice(device); 
            // если получилось, то продолжаем дальше итерировать через устройства
            if (success) {
                // мы могли начать размещать не с первого (будет ниже), поэтому i будет циклическим
                i = i + 1 == devices.length ? 
                0 : 
                i + 1 ;
                continue; 
            }
            // если не получилось разместить устройство, то проверяем получалось ли разместить что-то на прошлой итерации
            if (this.lastSafeBuild !== null) { 
                // если получалось, то рендерим данные из последнего успешного инстанса VirtualScheduleBuilder и завершаемся
                return this.lastSafeBuild.renderResults();
            }
            // если не было размещения на прошлой итерации, то проверяем пробовали ли мы отсортировать устройства альтернативным способом
            if (!triedPowerBias) {
                // если нет, то сортируем наши устройства альтернативным способом и начинаем с первого устройства
                // (добавление этого условия помогло избавиться от сильных проседаний производительности на определенных выборках)
                devices = devices.sort(sortDevices.byPriorityPowerBias);
                i = 0;
                triedPowerBias = true;
                continue;
            }
            // если мы уже пробовали альтернативную сортировку, то просто пробуем начать с каждого устройства
            if (!triedToStartFromEveryDevice) {
                i = i + 1 == devices.length ?
                ~(triedToStartFromEveryDevice = true) && 0 :
                i + 1 ;
                continue;
            }
            // если мы пробовали начать с каждого устройства и это не дало результатов, значит скорее всего устройства нельзя разместить, выбрасываем ошибку
            throw Error('Impossible to place all devices.');
        }
        // если ошибок не было и мы успешно прошли до конца цикла, значит выводим результаты
        return this.renderResults();
    }
```
