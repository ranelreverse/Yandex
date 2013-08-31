/**
 * Created with JetBrains WebStorm.
 * User: lenar s
 * Date: 15.08.13
 * Time: 12:04
 * To change this template use File | Settings | File Templates.
 */

var Game = {};
Game.context = {};

Game.CARD_W = 40;
Game.CARD_H = 65;

Game.status = {
    GAME : 0,
    DISPUT : 1,
    WIN : 2
};

Game.cardSuits = {
    SPADE : 0,
    HEART : 1,
    CLUB : 2,
    DIAMOND : 3
};

Game.intervalTimeout;
Game.needShowPlayerNumber;
Game.needShowStatusGameMessage;
Game.needShowPlayerCardsCount;

Game.write = {};
Game.draw = {};

Game.reset = function(){
    Game.players = [];
    Game.cardsDeck = [];
    Game.move.status = Game.status.GAME;
    Game.cardsOnTheTable = [];
    clearInterval(Game.processId);
};

Game.players = [];
Game.cardsValueType = [2,3,4,5,6,7,8,9,10,"В","Д","К","T"];
Game.cardsDeck = [];

Game.generateDeck = function(){
    for(var i = 0; i < Game.cardsValueType.length; i++){

        Game.cardsDeck.push({ internalValue: i, showValue: Game.cardsValueType[i], suits: Game.cardSuits.CLUB});
        Game.cardsDeck.push({ internalValue: i, showValue: Game.cardsValueType[i], suits: Game.cardSuits.DIAMOND});
        Game.cardsDeck.push({ internalValue: i, showValue: Game.cardsValueType[i], suits: Game.cardSuits.HEART});
        Game.cardsDeck.push({ internalValue: i, showValue: Game.cardsValueType[i], suits: Game.cardSuits.SPADE});

    }
};

Game.setPlayers = function(count) {

    for(var i = 0; i < count; i++){
        Game.players[i] = {
            name : "player" + i,
            cards: [],
            active: true
        }
    }
    Game.draw.drawPlayersDeck();
};

Game.draw.drawPlayersDeck = function(){
    Game.context.save();
    for(var i = 0; i < Game.players.length; i++){
        Game.context.fillStyle = "pink";
        Game.context.fillRect( Game.CARD_W*(3*i+2),110,Game.CARD_W,Game.CARD_H);

        Game.draw.drawShirt( Game.CARD_W*(3*i+2),110);
    }

    if(Game.needShowPlayerNumber)
        Game.write.showPlayerNumber();

    Game.context.restore();
};

Game.write.showPlayerNumber = function(){
    Game.context.save();
    for(var i = 0; i < Game.players.length; i++){
        Game.context.fillStyle = 'white';
        Game.context.font = 'italic 13px sans-serif';
        Game.context.textBaseline = 'top';
        Game.context.fillText ( "№" + (i + 1), Game.CARD_W*(3*i+2),200);
    }
    Game.context.restore();
};



Game.draw.drawShirt = function( x, y){

    var h = Game.CARD_H;
    var w = Game.CARD_W;

    Game.context.strokeRect(x + 5, y + 5, w - 10, h - 10);
    Game.context.strokeRect(x + 10, y + 10, w - 20, h - 20);
    Game.context.strokeRect(x + 15, y + 15, w - 30, h - 30);
    Game.context.strokeRect(x + 20, y + 20, w - 40, h - 40);
};

Game.reshuffleCardsDeck = function (){
    var i1, i2, card;
    for (var i = 0; i < 1000; i++){
        i1 = Utilities.random() % 52;
        i2 = Utilities.random() % 52;
        card = Game.cardsDeck[i1];
        Game.cardsDeck[i1] = Game.cardsDeck[i2];
        Game.cardsDeck[i2] = card;
    }
};

Game.giveCards = function(){

    var playersCount = Game.players.length;
    var playerCardsCount = 52 / playersCount;
    var indx = 0;
    var indx1 = playerCardsCount;
    for(var i = 0; i < playersCount; i++){
        Game.players[i].cards = Game.cardsDeck.slice(indx, indx1);
        indx = indx1;
        indx1 += playerCardsCount;
    }
};


Game.cardsOnTheTable = [];

Game.move = function(){
    var cardsOnTheTable = [];

    for(var i = 0; i < Game.players.length; i++){

        if(Game.players[i].active)
            if(Game.move.status == Game.status.GAME)
            {
                cardsOnTheTable[i] = Game.players[i].cards.pop();
            }
            else
            {
                Game.cardsOnTheTable.push(Game.players[i].cards.pop()); //при споре одну выкладываем рубашкой верх

                if(Game.players[i].cards.length != 0)
                    cardsOnTheTable[i] =(Game.players[i].cards.pop());
                else
                    Game.players[i].active = false;
            }
    }

    Game.draw.showCards(cardsOnTheTable);
    var moveEnablePlayers = Game.cardsCompare(cardsOnTheTable);


    cardsOnTheTable.forEach(function(x){
        if(x != undefined)
            Game.cardsOnTheTable.push(x);
    });

    if(moveEnablePlayers.length > 1){

        Game.move.status = Game.status.DISPUT;
        Game.playersTempDeactivate(moveEnablePlayers);
    }else{
        //определен победитель хода
        Game.cardsOnTheTable.forEach(function(x){
            var l = Game.players[moveEnablePlayers[0]].cards.length;
            //добавляем карты в перемешку, дабы исключить зацикливания
            if( l != 0){
                var randomIndx = Utilities.random() % l;
                var card = Game.players[moveEnablePlayers[0]].cards[randomIndx];
                Game.players[moveEnablePlayers[0]].cards[randomIndx] = x;
                Game.players[moveEnablePlayers[0]].cards.push(card);
            }else{
                Game.players[moveEnablePlayers[0]].cards.push(x);
            }
        });

        Game.cardsOnTheTable = [];
        Game.move.status = Game.status.GAME;
        Game.playersActivate();
    }

    return moveEnablePlayers;
};

Game.move.status = Game.status.GAME;

Game.checkTheStatusOfPlayers = function(){

    //проверяем количество карт у всех игроков
    //если остались только у одного - игра окончена, закидываем ему все карты и
    //убиваем таймер

    var validPlayers = [];
    for(var i = 0; i < Game.players.length; i++){
        if(Game.players[i].cards.length == 0){
            Game.players[i].active = false;
            Game.hidePlayer(i);
        }else{
            validPlayers.push(i);
        };
    }

    if(validPlayers.length == 1){
        clearInterval(Game.processId);
        var winnerIndx = validPlayers[0];
        Game.cardsOnTheTable.forEach(function(x){
            Game.players[ winnerIndx ].cards.push(x);
        });

        if( Game.players[ winnerIndx ].cards.length != 52)
            throw new Error();

        Game.write.showMessage(Game.status.WIN, validPlayers);

        Game.draw.hideOpenCard(Game.CARD_W * (3 * winnerIndx + 2), 25);
    }
};


Game.hidePlayer = function(playerN){
    Game.context.fillRect(Game.CARD_W*(3*playerN + 2),25, Game.CARD_W, 220);
};

Game.playersTempDeactivate = function(disputePlayers){

  for(var i = 0; i < Game.players.length; i++){
      if(Utilities.find(disputePlayers, i) == -1)
          Game.players[i].active = false;
  }
};


Game.playersActivate = function(){

    for(var i = 0; i < Game.players.length; i++){
        if(Game.players[i].cards.length > 0)
            Game.players[i].active = true;
    }
};


Game.cardsCompare = function (res) {
    var moveEnablePlayers = [];
    var maxValue = -1;

    for(var i = 0; i < res.length; i++){

        if(!Game.players[i].active) continue;

        if(res[i].internalValue > maxValue){
            maxValue = res[i].internalValue;
            moveEnablePlayers = [];
            moveEnablePlayers[0] = i;
        }
        else if(res[i].internalValue == maxValue){
            moveEnablePlayers.push(i);
        }
    }

    return moveEnablePlayers;
};



Game.processId;
Game.start = function( ctx, playersCount, intervTimeout, needShowPlayerNumber, needShowStatusGameMessage, needShowPlayerCardsCount){

    try{
        if(ctx.canvas.width < 570 || ctx.canvas.height < 300)
            throw new Error("Ошибка: canvas-элемент должен иметь ширину не менее 570px, высоту не менее 300px");
    }catch(ex){
        throw new Error("Ошибка: контекст не обнаружен");
    }

    if((52 % playersCount) != 0){
        throw new Error("Ошибка: число игроков должно быть кратно 52");
    }

    Game.reset();

    Game.intervalTimeout = intervTimeout || 1000;
    Game.needShowPlayerNumber = needShowPlayerNumber || false;
    Game.needShowStatusGameMessage = needShowStatusGameMessage || false;
    Game.needShowPlayerCardsCount =  needShowPlayerCardsCount || false;
    Game.context = ctx;
    Game.generateDeck();
    Game.reshuffleCardsDeck();
    Game.setPlayers(playersCount);
    Game.giveCards();

    Game.processId = setInterval(function(){
        Game.process();
    }, Game.intervalTimeout);
};

Game.process = function(){

    var moveEnablePlayers = Game.move();

    if(Game.needShowStatusGameMessage)
        Game.write.showMessage(Game.move.status, moveEnablePlayers);

    Game.checkTheStatusOfPlayers();


    if(Game.needShowPlayerCardsCount)
        Game.write.showCardsCount();
};



Game.write.showMessage = function(status, players){
    Game.context.save();

    //очистим поле от предыдущего сообщения
    Game.context.fillRect(0, 260, 600, 20);

    var msg;
    players.forEach(function(val, indx){
            players[indx] = val + 1;
        }
    );

    switch (status) {
        case Game.status.GAME:
            msg = "Карты достаются игроку под номером " + players[0];
            break;
        case Game.status.DISPUT:
            msg = "Спорят игроки " + players.join();
            break;
        case Game.status.WIN:
            msg = "Игра окончена. Победитель - игрок по номером " + players[0];
            break;
        default:
    }

    Game.context.fillStyle = 'white';
    Game.context.font = 'italic 15px sans-serif';
    Game.context.textBaseline = 'top';
    Game.context.fillText ( msg, 70, 260);

    Game.context.restore();
};

Game.write.showCardsCount = function(){
    Game.context.save();

    //очистим поле от предыдущего сообщения
    Game.context.fillRect(0, 230, 600, 20);

    Game.context.fillStyle = 'white';
    Game.context.font = 'italic 13px sans-serif';
    Game.context.textBaseline = 'top';
    for(var i = 0; i < Game.players.length; i++){
        if(Game.players[i].cards.length > 0)
        Game.context.fillText( Game.players[i].cards.length.toString(), Game.CARD_W*(3*i+2),230);
    }
    Game.context.restore();
};

Game.draw.showCards = function(cardsArray){
    Game.context.save();

    for(var i = 0; i < cardsArray.length; i++){
        if(Game.players[i].active)
        {
            Game.context.fillStyle = 'white';
            Game.context.fillRect( Game.CARD_W*(3*i+2),25,Game.CARD_W,Game.CARD_H);

            Game.context.font = 'italic 15px sans-serif';
            Game.context.textBaseline = 'top';
            Game.context.fillStyle = 'black';
            Game.context.fillText ( cardsArray[i].showValue, Game.CARD_W*(3*i+2) + 5, 30);

            Game.drawSuit( cardsArray[i].suits, i);
        }
        else
        {
            Game.context.restore();
            Game.draw.hideOpenCard(Game.CARD_W*(3*i+2), 25);
            Game.context.save();
        }

    }
    Game.context.restore();
};

Game.draw.hideOpenCard = function( x, y){
    Game.context.fillRect( x, y, Game.CARD_W,Game.CARD_H);
};

Game.drawSuit = function( suit, playerNum){

    switch (suit) {
        case Game.cardSuits.CLUB:
            Game.draw.drawClub( Game.CARD_W*(3*playerNum+2) + 25, 65);
            break;
        case Game.cardSuits.DIAMOND:
            Game.draw.drawDiamond(  Game.CARD_W*(3*playerNum+2) + 25, 65);
            break;
        case Game.cardSuits.HEART:
            Game.draw.drawHeart( Game.CARD_W*(3*playerNum+2) + 25, 70);
            break;
        case Game.cardSuits.SPADE:
            Game.draw.drawSpade( Game.CARD_W*(3*playerNum+2) + 25, 65);
            break;
        default:
    }
};


Game.draw.suitsSize = {
    H : 20,
    W : 20
};

Game.draw.drawClub = function ( x, y) {
    //трефы
    //порядок прорисовки и заливки: верхняя дуга, правая дуга, левая дуга, центр, основание
    Game.context.save();
    var radius = Game.draw.suitsSize.W * 0.25;

    Game.context.fillStyle = "black";

    Game.context.beginPath();
    Game.context.arc(
        x, y + radius + (Game.draw.suitsSize.H * 0.05),
        radius, 0, 2 * Math.PI, false
    );
    Game.context.fill();

    Game.context.beginPath();
    Game.context.arc(
        x + radius, y + (Game.draw.suitsSize.H * 0.6),
        radius, 0, 2 * Math.PI, false
    );
    Game.context.fill();

    Game.context.beginPath();
    Game.context.arc(
        x - radius, y + (Game.draw.suitsSize.H * 0.6),
        radius, 0, 2 * Math.PI, false
    );
    Game.context.fill();

    Game.context.beginPath();
    Game.context.fillRect( x - 2, y + (Game.draw.suitsSize.H * 0.5),
        radius, 10);
    Game.context.fill();

    //нижняя часть
    Game.context.moveTo(x, y + (Game.draw.suitsSize.H * 0.6));
    var bottomW = Game.draw.suitsSize.W * 0.5;
    Game.context.lineTo( x - bottomW / 2, y + Game.draw.suitsSize.H);
    Game.context.lineTo(x + bottomW / 2,  y + Game.draw.suitsSize.H);
    Game.context.closePath();
    Game.context.fill();
    Game.context.restore();
};

Game.draw.drawHeart = function(  x, y){
    //червы
    //порядок прорисовки и заливки: верхняя левая часть, нижняя левая часть, нижняя правая часть, верхняя правая часть
    Game.context.save();
    Game.context.beginPath();


    var topQuarterH = Game.draw.suitsSize.H * 0.3;
    y = y - 3;

    Game.context.moveTo(x , y + topQuarterH);
    Game.context.quadraticCurveTo(
        x - Game.draw.suitsSize.W / 4, y,
        x - Game.draw.suitsSize.W / 2, y + topQuarterH
    );

    Game.context.bezierCurveTo(
        x - Game.draw.suitsSize.W / 2, y + (Game.draw.suitsSize.H + topQuarterH) / 2,
        x, y + (Game.draw.suitsSize.H + topQuarterH) / 2,
        x, y + Game.draw.suitsSize.H
    );

    Game.context.bezierCurveTo(
     x, y + (Game.draw.suitsSize.H + topQuarterH) / 2,
     x + Game.draw.suitsSize.W / 2, y + (Game.draw.suitsSize.H + topQuarterH) / 2,
     x + Game.draw.suitsSize.W / 2, y + topQuarterH
     );

    Game.context.quadraticCurveTo(
     x + Game.draw.suitsSize.W / 4, y,
     x, y + topQuarterH
     );

    Game.context.closePath();
    Game.context.fillStyle = "red";
    Game.context.fill();
    Game.context.restore();
};

Game.draw.drawDiamond = function( x, y ){
    //бубны
    Game.context.save();

    Game.context.beginPath();
    Game.context.moveTo(x, y);
    Game.context.lineTo(x - Game.draw.suitsSize.W / 2, y + Game.draw.suitsSize.H / 2);
    Game.context.lineTo(x, y + Game.draw.suitsSize.H);
    Game.context.lineTo(x + Game.draw.suitsSize.W / 2, y + Game.draw.suitsSize.H / 2);
    Game.context.closePath();
    Game.context.fillStyle = "red";
    Game.context.fill();

    Game.context.restore();
}


Game.draw.drawSpade = function( x, y){
    //пики
    //порядок прорисовки и заливки: верхняя левая часть, нижняя левая часть, нижняя правая часть, верхняя правая часть, основание
    Game.context.save();

    var topH = Game.draw.suitsSize.H * 0.7;
    var bottomH = Game.draw.suitsSize.H * 0.3;

    Game.context.beginPath();
    Game.context.moveTo(x, y);

    Game.context.bezierCurveTo(
        x, y + topH / 2,
        x - Game.draw.suitsSize.W / 2, y + topH / 2,
        x - Game.draw.suitsSize.W / 2, y + topH
    );

    Game.context.quadraticCurveTo(
        x - Game.draw.suitsSize.W / 4, y + topH * 1.3,
        x, y + topH
    );

    Game.context.quadraticCurveTo(
        x + Game.draw.suitsSize.W / 4, y + topH * 1.3,
        x + Game.draw.suitsSize.W / 2, y + topH
    );

    Game.context.bezierCurveTo(
        x + Game.draw.suitsSize.W / 2, y + topH / 2,
        x, y + topH / 2,
        x, y
    );

    Game.context.moveTo(x, y + topH);
    var bottomW = Game.draw.suitsSize.W * 0.7;
    Game.context.lineTo( x - bottomW / 2, y + topH + bottomH);
    Game.context.lineTo(x + bottomW / 2, y + topH + bottomH);

    Game.context.closePath();
    Game.context.fillStyle = "black";
    Game.context.fill();
    Game.context.restore();
}

var Utilities = {};

Utilities.random = function(){
    return Math.floor(Math.random( ) * (1000));
};

Utilities.find = function(array, value) {
    if ( [].indexOf ) {

        return array.indexOf(value);

    } else {

        for(var i=0; i<array.length; i++) {
            if (array[i] === value) return i;
        }
        return -1;
    }
};

