import React, { useEffect, useState } from 'react'
import './styles.css'
import {useParams, useNavigate} from 'react-router-dom'
import GameBoard from '../../components/GameBoard'
import GameContext from '../../GameContext'
import GameResultModal from '../../components/GameResultModal'
import {HubConnectionBuilder, LogLevel} from '@microsoft/signalr'

const Home = () => {

  const apiUrl = 'http://localhost:5285/api/games'

  const [game, setGame] = useState(null)
  const [connectionId, setConnectionId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorMessage, setShowErrorMessage] = useState(false)

  const [conn, setConnection] = useState()

  const {id} = useParams()
  const navigate = useNavigate()


  useEffect(() => {

    const getCurrentGame = async() => {
        setIsLoading(true)
        if(typeof id === 'undefined') {
           try {
              const response = await fetch(apiUrl, {
                        method: 'POST',
                        credentials: 'include',
                    })
                    const data = await response.json()
                    if(response.status == 500) {
                    setShowErrorMessage(true)
                    setErrorMessage(data.message)
                    } else {
                        setShowErrorMessage(false)
                        navigate(`/game/${data}`)
                    }

           } catch(error) {
                    console.error('An error occurred: ', error)
           }
        }

        if(typeof id !== 'undefined') {
                try {
                      await joinGame(id)
                    } catch(error) {
                            console.error('An error occurred: ', error)
                        }
        }
    }

    getCurrentGame()

    return () => {
        if (conn) {
          conn.stop();
          conn.invoke('LeaveSpecificGame');
        }
      };

  }, [id])


  const handleRestart = async() => {
    navigate('/game')
  }

  const joinGame = async(gameId) => {
    try {
        // Initiate connection
        const conn = new HubConnectionBuilder()
                        .withUrl('http://localhost:5285/game')
                        .configureLogging(LogLevel.Information)
                        .build();

        conn.on('GetYourConnectionId', (username, connId) => {
            setConnectionId(connId)
        })

        conn.on('JoinSpecificGame', (username, joinedGame) => {
            setShowErrorMessage(false);
            setGame(joinedGame);
            if(joinedGame.players.length < 2)
                setIsLoading(true);
            else
                setIsLoading(false);
        });

        conn.on('ReceiveGameAfterShot', (username, gameAfterShot) => {
            setGame(gameAfterShot)
        })

        conn.on('ReceiveGameAfterSurrender', (username, gameAfterSurrender) => {
            setGame(gameAfterSurrender)
        })

        conn.on('JoinSpecificGameError', (username, errorMessage) => {
            setIsLoading(true)
            setShowErrorMessage(true);
            setErrorMessage(errorMessage); 
          });

        await conn.start();
        
        await conn.invoke('GetConnectionId');
        await conn.invoke('JoinSpecificGame', {connectionId: undefined, gameId});
        
        setConnection(conn);

    } catch(e) {
        console.log(e)
    }
  }

  const handleShot = async(shotCoords) => {
    try {
        await conn.invoke('MakeShot', shotCoords);
    } catch(e) {
        console.log(e)
    }
  }

  const handleSurrender = async() => {
    try {
        await conn.invoke('HandleSurrender');
    } catch(e) {
        console.log(e)
    }
  }

  return (

    <GameContext.Provider value={{setGame}}>
        {isLoading ? (
                <div className='flex flex-col gap-5 m-5'>
                    {showErrorMessage ? (
                        <div className='flex flex-col w-full items-center gap-5'>
                            <h1 className='game-hdr'>{errorMessage}</h1>
                            <button
                                onClick={handleRestart}
                                className='restart-btn'>
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
                    { <h2 className='game-subhdr'>{game.players.find(p => p.connectionId == connectionId).isYourTurn ? 'Your turn' : 'Opponent\'s turn'}</h2> }
                </div>
                <div className='flex flex-col items-center w-full'>
                  <GameBoard cells={game.players.find(p => p.connectionId == connectionId).cells}
                             canShoot={false}
                             handleShot={handleShot}
                             isYourBoard={true}
                  />  
                  <GameBoard cells={game.players.find(p => p.connectionId != connectionId).cells}
                             canShoot={game.players.find(p => p.connectionId == connectionId).isYourTurn}
                             handleShot={handleShot}
                             isYourBoard={false}/> 

                  <button
                    className='new-game-btn'
                    onClick={handleSurrender}>Surrender</button>

                </div>
                {game.players.find(p => p.connectionId == connectionId).gameStatus == 'WON' && (
                    <GameResultModal
                    status='WON'
                    header='You won!'
                    description={game.players.find(p => p.connectionId != connectionId).ships.length > 0 ? 'Opponent surrendered!' : 'You have destroyed all opponent\'s ships!'}   
                    handleButtonClick={() => handleRestart()}/>
                    )}

            {game.players.find(p => p.connectionId == connectionId).gameStatus == 'LOST' && (
                <GameResultModal
                status='LOST'
                header='You lost!'
                description={game.players.find(p => p.connectionId == connectionId).ships.length > 0 ? 'You surrendered!' : 'All of your ships have been destroyed!'}
                handleButtonClick={() => handleRestart()}/>
                )}   
            </div>
        )}


        

    </GameContext.Provider>

  )
}

export default Home