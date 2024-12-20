import React, { useEffect, useState } from "react";
import "./styles.css";
import { useParams, useNavigate } from "react-router-dom";
import GameBoard from "../../components/GameBoard";
import GameContext from "../../GameContext";
import GameResultModal from "../../components/GameResultModal";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import Chat from "../../components/ChatBox";
import { text } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleInfo,
  faCirclePause,
  faFaceSadTear,
  faFaceSmile,
  faSmile,
} from "@fortawesome/free-solid-svg-icons";

const Home = () => {
  const apiUrl = "http://localhost:5285/api/games";
  const { id } = useParams();
  const navigate = useNavigate();

    const [game, setGame] = useState(null);
    const [connectionId, setConnectionId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [conn, setConnection] = useState();
    const [gameSaveMsg, setGameSaveMsg] = useState("false");
    const [gameSaveCode, setgameSaveCode] = useState(0);
    const [gameBackup, setGameBackup] = useState();

  const [timeLeft, setTimeLeft] = useState(3600);

  const [messages, setMessages] = useState([]);
  const [selectedShots, setSelectedShots] = useState(1); // State for selected shot count
  const [selectedHitPoints, setSelectedHitPoints] = useState(1); // Default to 1 hit point

    useEffect(() => {
        const getCurrentGame = async () => {
            setIsLoading(true);
            setgameSaveCode(0);
            if (typeof id === 'undefined') {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        credentials: 'include',
                    });
                    const data = await response.json();
                    if (response.status === 500) {
                        setShowErrorMessage(true);
                        setErrorMessage(data.message);
                    } else {
                        setShowErrorMessage(false);
                        navigate(`/game/${data}`);
                    }
                } catch (error) {
                    console.error('An error occurred: ', error);
                }
            }

      if (typeof id !== "undefined") {
        try {
          await joinGame(id);
        } catch (error) {
          console.error("An error occurred: ", error);
        }
      }
    };

    getCurrentGame();

    return () => {
      if (conn) {
        conn.stop();
        conn.invoke("LeaveSpecificGame");
      }
    };
  }, [id]);

  const joinGame = async (gameId) => {
    try {
      const newConn = new HubConnectionBuilder()
        .withUrl("http://localhost:5285/game")
        .configureLogging(LogLevel.Information)
        .build();

      newConn.on("GetYourConnectionId", (username, connId) => {
        setConnectionId(connId);
      });

      newConn.on("ReceiveTimeUpdate", (timeRemaining) => {
        if (typeof timeRemaining === "number" && timeRemaining >= 0) {
          setTimeLeft(timeRemaining);
          if (timeRemaining === 0) {
            endGameDueToTimeOut();
          }
        }
      });

      newConn.on("ReceiveGameAfterShipMove", (username, gameAfterShipMove) => {
        setGame(gameAfterShipMove);
      });

      newConn.on("JoinSpecificGame", (username, joinedGame) => {
        setShowErrorMessage(false);
        setGame(joinedGame);
        const initialTimeRemaining =
          typeof joinedGame.timeRemaining === "number" &&
          joinedGame.timeRemaining > 0
            ? joinedGame.timeRemaining
            : 3600;

        setTimeLeft(initialTimeRemaining);
        setIsLoading(joinedGame.players.length < 2);
      });

      newConn.on("ReceiveGameAfterShot", (username, gameAfterShot) => {
        setGame(gameAfterShot);
      });

      newConn.on("AppliedSkin", (game) => {
        console.log(game);
        setGame(game);
      });

      newConn.on(
        "ReceiveGameAfterSurrender",
        (username, gameAfterSurrender) => {
          setGame(gameAfterSurrender);
        }
      );

            newConn.on('ReceiveGameAfterGoToNextLevel', (username, gameAfterGoToNextLevel) => {
                setGame(gameAfterGoToNextLevel);
            });

            newConn.on('ReceiveGameAfterUndoWithSnapshot', (gameAfterUndo, msg) => {
                if(gameSaveCode === 1){
                    setGameSaveMsg(msg);
                }
                setGame(gameAfterUndo);
            });

            newConn.on('SnapshotSaved', (msg) => {
                setGameSaveMsg(msg);
                setGameBackup(game);
            });

      newConn.on("ReceiveMessage", (username, message) => {
        console.log("Received Message:", username, message);
        setMessages((prevMessages) => [...prevMessages, { username, message }]);
      });

      newConn.on("JoinSpecificGameError", (username, errorMessage) => {
        setShowErrorMessage(true);
        setErrorMessage(errorMessage);
        setIsLoading(true);
      });

      newConn.on("ReceiveTimeUpdate", (timeRemaining) => {
        if (typeof timeRemaining === "number" && timeRemaining >= 0) {
          setTimeLeft(timeRemaining);
          if (timeRemaining === 0) {
            endGameDueToTimeOut();
          }
        }
      });

      newConn.on("ReceiveGameAfterCommand", (gameAfterCommand) => {
        setGame(gameAfterCommand);
      });

      await newConn.start();
      await newConn.invoke("GetConnectionId");
      await newConn.invoke("JoinSpecificGame", {
        connectionId: undefined,
        gameId,
      });

      setConnection(newConn);
    } catch (e) {
      console.log(e);
    }
  };

  const handleMoveFleet = async () => {
    try {
        console.log("You have chosen this many hitpoints:")
        console.log(selectedHitPoints);
      await conn.invoke("MoveShipsByHitPoints", selectedHitPoints);
    } catch (e) {
      console.error("Error moving fleet:", e);
    }
  };

  const handleShot = async (shotCoords) => {
    try {
      await conn.invoke("MakeShot", shotCoords, selectedShots);
    } catch (e) {
      console.log(e);
    }
  };

  const handleSurrender = async () => {
    try {
      await conn.invoke("HandleSurrender");
    } catch (e) {
      console.log(e);
    }
  };

  const handleSkinChange = async (skinType) => {
    try {
      console.log(skinType)
      console.log(game);
      await conn.invoke("ChangeShipSkin", skinType);
    } catch (e) {
      console.log(e);
    }
  };

    const handleMessage = message => () => {
        try {
            conn.invoke('SendMessage', message);
        } catch (e) {
            console.log(e);
        }
    };

    const handleSaveGame = async () => {
        try {
            await conn.invoke('SnapshotGame');
            console.log(game);
            setGameBackup(game);
            setgameSaveCode(1);
        } catch (e) {
            console.log(e);
        }
    };

    const handleLoadSaveGame = async () => {
        try {
            await conn.invoke('UndoWithSnapshotGame', gameBackup);
            setgameSaveCode(2);
        } catch (e) {
            console.log(e);
        }
    };

  const endGameDueToTimeOut = () => {
    setGame((prevGame) => ({
      ...prevGame,
      gameStatus: "TIME_OUT",
    }));
    setIsLoading(false);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleRestart = () => {
    navigate("/game");
  };

  const handleGoToNextLevel = async () => {
    try {
      await conn.invoke("GoToNextLevel", {
        connectionId: undefined,
        gameId: id,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleResume = async () => {
    try {
      await conn.invoke("SendMessage", "/undo");
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (game) {
      const timerInterval = setInterval(() => {
        setTimeLeft((prevTimeLeft) => {
          if (prevTimeLeft <= 1) {
            clearInterval(timerInterval);
            endGameDueToTimeOut();
            return 0;
          }
          const newTimeLeft = prevTimeLeft - 1;
          conn?.invoke("UpdateTimeRemaining", newTimeLeft);
          return newTimeLeft;
        });
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [game, conn]);

  // Function to calculate available shots based on game state
  const calculateAvailableShots = () => {
    if (!game || !connectionId) return 0;

    const player = game.players.find((p) => p.connectionId === connectionId);
    if (!player) return 0;

    const maxHitPoints = Math.max(
      ...player.ships.map((ship) => ship.hitPoints)
    );
    return maxHitPoints <= 1 ? 1 : maxHitPoints <= 3 ? 2 : 3;
  };

  const availableShots = calculateAvailableShots();

    return (
        <GameContext.Provider value={{ setGame }}>
            {isLoading ? (
                <div className='flex flex-col gap-5 m-5'>
                    {showErrorMessage ? (
                        <div className='flex flex-col w-full items-center gap-5'>
                            <h1 className='game-hdr'>{errorMessage}</h1>
                            <button onClick={handleRestart} className='restart-btn'>
                                Find new game
                            </button>
                        </div>
                    ) : (
                        <h1 className='game-hdr'>Finding Opponent...</h1>
                    )}
                </div>
            ) : (
                <div className='flex flex-col gap-5 m-5 w-full items-center content-center'>
                    <div className='flex flex-col w-full items-center justify-center'>
                        <h1 className='game-hdr'>Battleship Game</h1>
                        <h2 className='game-subhdr'>
                            {game?.players.find(p => p.connectionId === connectionId).isYourTurn
                                ? 'Your turn'
                                : "Opponent's turn"}
                        </h2>
                        <h2>Your Points: {game?.players.find(p => p.connectionId === connectionId).points}</h2>
                        <h2 className='game-timer'>Time left: {formatTime(timeLeft)}</h2>
                        <div className="flex justify-center gap-4 mt-10">
                        {/* Skin 1 Button with Blue Background */}
                        <button
                          className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
                          onClick={() => handleSkinChange(1)}
                        >
                          Skin 1
                        </button>

                        {/* Skin 2 Button with Green Background */}
                        <button
                          className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
                          onClick={() => handleSkinChange(2)}
                        >
                          Skin 2
                        </button>

                        {/* Skin 3 Button with Red Background */}
                        <button
                          className="px-6 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600"
                          onClick={() => handleSkinChange(3)}
                        >
                          Skin 3
                        </button>
                      </div>
                    </div>
                    <div className='flex flex-col items-center w-full'>
                        <GameBoard
                            cells={game?.players.find(p => p.connectionId === connectionId).cells}
                            canShoot={false}
                            handleShot={handleShot}
                            isYourBoard={true}
                        />
                        <GameBoard
                            cells={game?.players.find(p => p.connectionId !== connectionId).cells}
                            canShoot={game?.players.find(p => p.connectionId === connectionId).isYourTurn}
                            handleShot={handleShot}
                            isYourBoard={false}
                        />
                        <button className='new-game-btn' onClick={handleSurrender}>
                            Surrender
                        </button>
                         {gameSaveCode === 0 &&
                         (<button className='bg-green-500 text-white mt-4 py-2 px-4 rounded' onClick={handleSaveGame}>
                            Save Game (One time use)
                        </button>)
                        }  
                        {gameSaveCode === 1 && 
                         (<button className='bg-green-500 text-white mt-4 py-2 px-4 rounded' onClick={handleLoadSaveGame}>
                            Load saved game
                        </button>)
                        }  
                        {/* Shot Count Selection */}
                        {game?.players.find(p => p.connectionId === connectionId).isYourTurn && (
                            <div className='shot-selection'>
                                {[1, 2, 3].map(numShots => (
                                    availableShots >= numShots && (
                                        <button
                                            key={numShots}
                                            className={`shot-icon ${selectedShots === numShots ? 'selected' : ''}`}
                                            onClick={() => setSelectedShots(numShots)}
                                        >
                                            {numShots === 1 ? 'Single Shot' : numShots === 2 ? 'Double Shot' : 'Triple Shot'}
                                        </button>
                                    )
                                ))}
                            </div>
                        )}
                        {game.players.find((p) => p.connectionId === connectionId)
              .isYourTurn && (
              <div className="hitpoint-selection">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    className={`hitpoint-button ${
                      selectedHitPoints === num ? "selected" : ""
                    }`}
                    onClick={() => setSelectedHitPoints(num)}
                  >
                    {num} Hit Points
                  </button>
                ))}
              </div>
            )}

                  {game.players.find((p) => p.connectionId === connectionId)
                  .isYourTurn && (
                  <button className="move-fleet-btn" onClick={handleMoveFleet}>
                  Move Fleet with {selectedHitPoints} Hit Points
                  </button>)}
                        </div>

                        <div>
                            <h2 className='game-subhdr'>Chat</h2>
                            <Chat handleMessage={handleMessage} text={messages}/>
                        </div>
                    {game?.players.find(p => p.connectionId === connectionId).gameStatus === 'WON' && (
                        <GameResultModal
                            iconName={faFaceSmile}
                            iconColor='text-lime-600 border-lime-600'
                            header='You won!'
                            description={
                                game?.players.find(p => p.connectionId !== connectionId).ships.length > 0
                                    ? 'Opponent surrendered!'
                                    : "You have destroyed all opponent's ships!"
                            }
                            buttonText={game.players.find(p => p.connectionId === connectionId).cells.length === 100 ? 'Next Level' : 'New Game'}
                            handleButtonClick={game.players.find(p => p.connectionId === connectionId).cells.length === 100 ? handleGoToNextLevel : handleRestart}
                        />
                    )}
                    {game?.players.find(p => p.connectionId === connectionId).gameStatus === 'LOST' && (
                        <GameResultModal
                            iconName={faFaceSadTear}
                            iconColor='text-red-600 border-red-600'
                            header='You lost!'
                            description={
                                game?.players.find(p => p.connectionId !== connectionId).ships.length > 0
                                    ? 'You surrendered!'
                                    : 'All of your ships have been destroyed!'
                            }
                            buttonText={game.players.find(p => p.connectionId === connectionId).cells.length === 100 ? 'Next Level' : 'New Game'}
                            handleButtonClick={game.players.find(p => p.connectionId === connectionId).cells.length === 100 ? handleGoToNextLevel : handleRestart}
                        />
                    )}
                    {game?.gameStatus === 'TIME_OUT' && (
                        <GameResultModal
                            iconName={faFaceSadTear}
                            iconColor='text-black'
                            header='Time Up!'
                            description='The game ended due to the time limit being reached.'
                            buttonText={game.players.find(p => p.connectionId === connectionId).cells.length === 100 ? 'Next Level' : 'New Game'}
                            handleButtonClick={handleRestart}
                        />
                    )}
                    {game?.players.find(p => p.connectionId === connectionId).gameStatus ===  'PAUSED_HOST' && (
                        <GameResultModal
                            iconName={faCirclePause}
                            iconColor='text-cyan-600 border-cyan-600'
                            header='Game Paused'
                            description='The game has been paused by you.'
                            buttonText='Resume'
                            handleButtonClick={handleResume}
                        />
                    )}
                    {game?.players.find(p => p.connectionId === connectionId).gameStatus ===  'PAUSED' && (
                        <GameResultModal
                            iconName={faCirclePause}
                            iconColor='text-cyan-600 border-cyan-600'
                            header='Game Paused'
                            description='The game has been paused by your opponent.'
                            buttonText='Wait'
                            handleButtonClick={() => {}}
                        />
                    )}
                </div>
            )}
        </GameContext.Provider>
    );
};

export default Home;