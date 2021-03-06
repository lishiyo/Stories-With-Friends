angular.module("sf.services.game", [
    'sf.constants',
    'sf.services.compass'
  ])

  .service("Game", function($firebase, baseFbUrl, Compass) {
    var gameModel = this;

    var gamesRef = new Firebase(baseFbUrl + "/games");

    gameModel.get = function(id) {
      return $firebase(gamesRef).$child(id);
    };

    gameModel.getGameByUser = function(User) {
      var currentUser = User.currentUser;
      var game = gameModel.get(currentUser.sid);
      var gameUsers = game.$child("users");
      gameUsers.$on('loaded', function() {
        var length = gameUsers.$getIndex().length;
        if (length < 2) {
          currentUser.name = "Player " + String(length + 1);
          currentUser.isTheirTurn = currentUser.name === "Player 1";
          User.localUser = currentUser.name;
          gameUsers.$add(currentUser);
        }
        Compass.initializeGame(game, gameUsers, currentUser);
      });
      game.wordsUsed = game.$child("wordsUsed");
      game.wordsUsedLength = game.$child("wordsUsedLength");
      return game;
    };

    gameModel.closeGame = function(gameId) {
      var currentGame = $firebase(gameModel.get(gameId));
      currentGame.$update({status: 'ended'});
    };

    gameModel.sendSentence = function(gameId, sentence) {
      var game = gameModel.get(gameId);
      var sentences = game.$child("sentences");
      sentences.$add(sentence);
    };

    gameModel.takeTurns = function(gameId) {
      var game = gameModel.get(gameId);
      var users = game.$child("users");
      var keys = users.$getIndex();
      angular.forEach(keys, function(key) {
        var userRef = users.$child(key);
        userRef.$update({isTheirTurn: !userRef.isTheirTurn});
      });
    }

    gameModel.logWords = function(gameId, currentGame, sentence) {
      var game = gameModel.get(gameId);
      var wordsUsed = game.$child("wordsUsed");
      var wordsToUse = currentGame.wordList;
      var wordsInSentence = sentence.split(" ");
      wordsInSentence.forEach(function(cased_word) {
        var word = cased_word.toLowerCase();
        for (var i = 0; i < wordsToUse.length; i++) {
          var wordToLookAt = wordsToUse[i].word.toLowerCase();
          if (word === wordToLookAt || word.indexOf(wordToLookAt) !== -1) {
            wordsUsed.$add(wordsToUse[i].word);
          }
        }
      });
    }
  })

;

