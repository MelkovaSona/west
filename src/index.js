import Card from "./Card.js";
import Game from "./Game.js";
import TaskQueue from "./TaskQueue.js";
import SpeedRate from "./SpeedRate.js";


function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}


class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
        this._currentPower = maxPower;
    }

    get currentPower() {
        return this._currentPower || 0;
    }

    set currentPower(value) {
        this._currentPower = Math.min(this.maxPower, value);
    }

    getDescriptions() {
        return [
            getCreatureDescription(this),
            ...super.getDescriptions()
        ];
    }
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return "Утка-Собака";
    }
    if (isDuck(card)) {
        return "Утка";
    }
    if (isDog(card)) {
        return "Собака";
    }
    return "Существо";
}


class Duck extends Creature {
    constructor(name, maxPower, image) {
        const nameCorrect = name || "Мирная утка";
        const maxPowerCorrect = maxPower || 2;
        const imageCorrect = image || "/duck.png";

        super(nameCorrect, maxPowerCorrect, imageCorrect);
    }

    quacks() {
        console.log("quack");
    };

    swims() {
        console.log("float: both;");
    };
}

class Dog extends Creature {
    constructor(name, maxPower, image) {
        const nameCorrect = name || "Пес-бандит";
        const maxPowerCorrect = maxPower || 3;
        const imageCorrect = image || "/dog.png";

        super(nameCorrect, maxPowerCorrect, imageCorrect);
    }
}

class Trasher extends Dog {
    constructor(name, maxPower, image) {
        const nameCorrect = name || "Громила";
        const maxPowerCorrect = maxPower || 5;
        const imageCorrect = image || "/trasher.png";

        super(nameCorrect, maxPowerCorrect, imageCorrect);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        super.modifyTakenDamage(value - 1, fromCard, gameContext, continuation);
    }

    takeDamage(value, fromCard, gameContext, continuation) {
        if (value === 2) {
            this.view.signalAbility(() => {
                super.takeDamage(value, fromCard, gameContext, continuation);
            });
        } else {
            super.takeDamage(value, fromCard, gameContext, continuation);
        }
    }

    getDescriptions() {
        return [
            "Получает на 1 урон меньше",
            ...super.getDescriptions()
        ];
    }
}

class Gatling extends Creature {
    constructor(name, maxPower, image) {
        const nameCorrect = name || "Гатлинг";
        const maxPowerCorrect = maxPower || 6;
        const imageCorrect = image || "/gatling.png";

        super(nameCorrect, maxPowerCorrect, imageCorrect);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        for (let i = 0; i < oppositePlayer.table.length; i++) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                const oppositeCard = oppositePlayer.table[i];

                if (oppositeCard) {
                    this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
                } else {
                    this.dealDamageToPlayer(1, gameContext, onDone);
                }
            });
        }

        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor(name, maxPower, image) {
        const nameCorrect = name || "Браток";
        const maxPowerCorrect = maxPower || 2;
        const imageCorrect = image || "/lad.jpeg";

        super(nameCorrect, maxPowerCorrect, imageCorrect);
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        const ladsInGame = Lad.getInGameCount();
        Lad.setInGameCount(ladsInGame + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }

    doBeforeRemoving(continuation) {
        const ladsInGame = Lad.getInGameCount();
        Lad.setInGameCount(ladsInGame - 1);
        super.doBeforeRemoving(continuation);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        super.modifyTakenDamage(value - Lad.getBonus(), fromCard, gameContext, continuation);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        super.modifyDealedDamageToCreature(value + Lad.getBonus(), toCard, gameContext, continuation);
    }

    getDescriptions() {
        if (Lad.prototype.hasOwnProperty("modifyDealedDamageToCreature") || Lad.prototype.hasOwnProperty("modifyTakenDamage")) {
            return [
                "Чем их больше, тем они сильнее",
                ...super.getDescriptions()
            ];
        }

        return [
            ...super.getDescriptions()
        ];
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const currentInGameCount = this.getInGameCount();
        return currentInGameCount * (currentInGameCount + 1) / 2;
    }
}

class Brewer extends Duck {
    constructor(name, maxPower, image) {
        const nameCorrect = name || "Пивовар";
        const maxPowerCorrect = maxPower || 2;
        const imageCorrect = image || "/brewer.jpg";

        super(nameCorrect, maxPowerCorrect, imageCorrect);
    }

    attack(gameContext, continuation) {
        const allCards = gameContext.currentPlayer.table.concat(gameContext.oppositePlayer.table);

        for (const card of allCards) {
            if (!isDuck(card)) continue;

            card.maxPower++;
            card.currentPower += 2;
            card.view.signalHeal(() => card.updateView());
        }

        super.attack(gameContext, continuation);
    }
}

class PseudoDuck extends Dog {
    constructor(name, maxPower, image) {
        const nameCorrect = name || "Псевдо-утка";
        const maxPowerCorrect = maxPower || 3;
        const imageCorrect = image || null;

        super(nameCorrect, maxPowerCorrect, imageCorrect);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}


class Rogue extends Creature {
    constructor(name, maxPower, image) {
        const nameCorrect = name || "Изгой";
        const maxPowerCorrect = maxPower || 2;
        const imageCorrect = image || "/rogue.png";

        super(nameCorrect, maxPowerCorrect, imageCorrect);
    }

    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const oppositeCard = oppositePlayer.table[position];
        if (oppositeCard) {
            const cardProto = Object.getPrototypeOf(oppositeCard);
            if (cardProto.hasOwnProperty('modifyDealedDamageToCreature')) {
                this.modifyDealedDamageToCreature = cardProto.modifyDealedDamageToCreature;
                delete cardProto['modifyDealedDamageToCreature'];
            }
            if (cardProto.hasOwnProperty('modifyDealedDamageToPlayer')) {
                this.modifyDealedDamageToPlayer = cardProto.modifyDealedDamageToPlayer;
                delete cardProto['modifyDealedDamageToPlayer'];
            }
            if (cardProto.hasOwnProperty('modifyTakenDamage')) {
                this.modifyTakenDamage = cardProto.modifyTakenDamage;
                delete cardProto['modifyTakenDamage'];
            }
            gameContext.updateView();
        }
        continuation();
    }
}
export default Rogue;

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Rogue(),
];
const banditStartDeck = [
    new Lad(),
    new Lad(),
    new Lad(),
];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert("Победил " + winner.name);
});