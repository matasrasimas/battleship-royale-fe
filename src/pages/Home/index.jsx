import React, { useEffect, useState } from 'react';
import './styles.css';
import { useParams, useNavigate } from 'react-router-dom';
import GameBoard from '../../components/GameBoard';
import GameContext from '../../GameContext';
import GameResultModal from '../../components/GameResultModal';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const Home = () => {
    const apiUrl = 'http://localhost:5285/api/games';

    const [game, setGame] = useState(null);
    const [connectionId, setConnectionId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [conn, setConnection] = useState(null);
    const [timeLeft, setTimeLeft] = useState(3600);
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedShots, setSelectedShots] = useState(1); // Initialize with a default value

    // New state for hit/miss messages
    const [hitMessage, setHitMessage] = useState('');
    const [missMessage, setMissMessage] = useState('');
    const [showHitPopup, setShowHitPopup] = useState(false);
    const [showMissPopup, setShowMissPopup] = useState(false);

    useEffect(() => {
        const getCurrentGame = async () => {
            setIsLoading(true);
            if (!id) {
                await createNewGame();
            } else {
                await joinGame(id);
            }
        };

        getCurrentGame();

        return () => {
            if (conn) {
                conn.stop();
                conn.invoke('LeaveSpecificGame');
            }
        };
    }, [id]);

    const createNewGame = async () => {
        try {
            const response = await fetch(apiUrl, { method: 'POST', credentials: 'include' });
            if (!response.ok) {
                const data = await response.json();
                setShowErrorMessage(true);
                setErrorMessage(data.message);
                return;
            }
            const gameId = await response.json();
            setShowErrorMessage(false);
            navigate(`/game/${gameId}`);
        } catch (error) {
            console.error('An error occurred: ', error);
            setShowErrorMessage(true);
            setErrorMessage('Failed to create or fetch the game.');
        }
    };

    const joinGame = async (gameId) => {
        try {
            const newConn = new HubConnectionBuilder()
                .withUrl('http://localhost:5285/game')
                .configureLogging(LogLevel.Information)
                .build();

            newConn.on('GetYourConnectionId', (username, connId) => setConnectionId(connId));
            newConn.on('JoinSpecificGame', (username, joinedGame) => handleGameJoin(joinedGame));
            newConn.on('ReceiveGameAfterShot', (username, gameAfterShot, shotResult) => {
                setGame(gameAfterShot);
                setSelectedShots(1); // Reset selected shots after making a shot
                
                // Determine if hit or miss
                if (shotResult === 'hit') {
                    setHitMessage('Hit!');
                    setShowHitPopup(true);
                } else if (shotResult === 'miss') {
                    setMissMessage('Miss!');
                    setShowMissPopup(true);
                }
            });

            // Integrate additional listener for going to next level
            newConn.on('ReceiveGameAfterGoToNextLevel', (username, gameAfterGoToNextLevel) => {
                setGame(gameAfterGoToNextLevel);
            });

            newConn.on('ReceiveGameAfterSurrender', (username, gameAfterSurrender) => setGame(gameAfterSurrender));
            newConn.on('JoinSpecificGameError', (username, errorMessage) => handleError(errorMessage));
            newConn.on('ReceiveTimeUpdate', (timeRemaining) => handleTimeUpdate(timeRemaining));

            await newConn.start();
            await newConn.invoke('GetConnectionId');
            await newConn.invoke('JoinSpecificGame', { connectionId: undefined, gameId });

            setConnection(newConn);
        } catch (e) {
            console.error('Connection error: ', e);
        }
    };

    const handleGameJoin = (joinedGame) => {
        setShowErrorMessage(false);
        setGame(joinedGame);
        setTimeLeft(joinedGame.timeRemaining || 3600);
        setIsLoading(joinedGame.players.length < 2);
    };

    const handleError = (errorMessage) => {
        setShowErrorMessage(true);
        setErrorMessage(errorMessage);
        setIsLoading(true);
    };

    const handleTimeUpdate = (timeRemaining) => {
        if (typeof timeRemaining === 'number' && timeRemaining >= 0) {
            setTimeLeft(timeRemaining);
            if (timeRemaining === 0) {
                endGameDueToTimeOut();
            }
        }
    };

    const endGameDueToTimeOut = () => {
        setGame(prevGame => ({ ...prevGame, gameStatus: 'TIME_OUT' }));
        setIsLoading(false);
    };

    const handleShot = async (shotCoords) => {
        // Ensure that selected shots is valid before proceeding
        if (selectedShots <= 0) {
            console.warn("No shots selected. Please select a valid number of shots before firing.");
            return;
        }
    
        // Ensure connection is established
        if (!conn) {
            console.error("No active connection. Unable to make a shot.");
            setErrorMessage("Connection to the game server is missing.");
            setShowErrorMessage(true);
            return;
        }
    
        try {
            console.info(`Attempting to make a shot with coordinates: ${JSON.stringify(shotCoords)} and selectedShots: ${selectedShots}`);
            
            // Invoke the MakeShot method on the server
            await conn.invoke('MakeShot', shotCoords, selectedShots);
    
            console.info("Shot was successfully sent to the server.");
        } catch (e) {
            console.error("Error making shot: ", e);
            setErrorMessage("Failed to make the shot. Please try again.");
            setShowErrorMessage(true);
        }
    };
    
    const handleSurrender = async () => {
        try {
            await conn.invoke('HandleSurrender');
        } catch (e) {
            console.error('Error handling surrender: ', e);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleRestart = () => {
        navigate('/game');
    };

    const handleGoToNextLevel = async () => {
        try {
            await conn.invoke('GoToNextLevel', { connectionId: undefined, gameId: id });
        } catch (e) {
            console.log(e);
        }
    }

    useEffect(() => {
        let timerInterval;
        if (game) {
            timerInterval = setInterval(() => {
                setTimeLeft(prevTimeLeft => {
                    if (prevTimeLeft <= 1) {
                        clearInterval(timerInterval);
                        endGameDueToTimeOut();
                        return 0;
                    }
                    const newTimeLeft = prevTimeLeft - 1;
                    conn?.invoke('UpdateTimeRemaining', newTimeLeft);
                    return newTimeLeft;
                });
            }, 1000);
        }
        return () => clearInterval(timerInterval);
    }, [game, conn]);

    const calculateAvailableShots = () => {
        if (!game || !connectionId) return 0;

        const player = game.players.find(p => p.connectionId === connectionId);
        if (!player) return 0;

        const shipsHitPoints = player.ships.map(ship => ship.hitPoints);
        const maxHitPoints = Math.max(...shipsHitPoints);

        if (maxHitPoints === 5) return 3;
        if (maxHitPoints === 4) return 3;
        if (maxHitPoints === 3) return 2;
        if (maxHitPoints === 2) return 1; 
        if (maxHitPoints === 1) return 1; 
        return 0;
    };

    const availableShots = calculateAvailableShots();

    // Helper to render error messages
    const renderErrorMessage = () => (
        <div className='flex flex-col w-full items-center gap-5'>
            <h1 className='game-hdr'>{errorMessage}</h1>
            <button onClick={handleRestart} className='restart-btn'>Find new game</button>
        </div>
    );

    // Helper to render shot selection buttons
    const renderShotSelection = () => {
        if (!game || !connectionId || !game.players.find(p => p.connectionId === connectionId)?.isYourTurn) {
            return null;
        }

        return (
            <div className='shot-selection'>
                {availableShots >= 1 && (
                    <button 
                        className={`shot-icon ${selectedShots === 1 ? 'selected' : ''}`}
                        onClick={() => setSelectedShots(1)}
                    >
                        Singleshot
                    </button>
                )}
                {availableShots >= 2 && (
                    <button 
                        className={`shot-icon ${selectedShots === 2 ? 'selected' : ''}`}
                        onClick={() => setSelectedShots(2)}
                    >
                        Double shot
                    </button>
                )}
                {availableShots >= 3 && (
                    <button 
                        className={`shot-icon ${selectedShots === 3 ? 'selected' : ''}`}
                        onClick={() => setSelectedShots(3)}
                    >
                        Triple shot
                    </button>
                )}
            </div>
        );
    };

    // Conditional rendering for error messages
    if (showErrorMessage) {
        return renderErrorMessage();
    }

    return (
        <div className='game-container'>
            {isLoading ? (
                <h1 className='loading-text'>Loading...</h1>
            ) : (
                <GameContext.Provider value={{ game, connectionId }}>
                    <GameBoard 
                        onShot={handleShot} 
                        onSurrender={handleSurrender} 
                        selectedShots={selectedShots}
                    />
                    {renderShotSelection()}
                    <h1 className='time-remaining'>{formatTime(timeLeft)}</h1>
                    <button onClick={handleGoToNextLevel} className='next-level-btn'>Go to Next Level</button>
                    <GameResultModal 
                        show={showHitPopup} 
                        message={hitMessage} 
                        onClose={() => setShowHitPopup(false)} 
                    />
                    <GameResultModal 
                        show={showMissPopup} 
                        message={missMessage} 
                        onClose={() => setShowMissPopup(false)} 
                    />
                </GameContext.Provider>
            )}
        </div>
    );
};

export default Home;
