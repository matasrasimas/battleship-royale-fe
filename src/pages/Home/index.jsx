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
                     const response = await fetch(`${apiUrl}/${id}`, {
                                method: 'GET',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                            })
                       const data = await response.json()
                       if(response.status == 404) {
                         navigate('/notfound')
                       } else if(response.status == 500) {
                         setShowErrorMessage(true)
                         setErrorMessage(data.message)
                       } else {
                          await joinGame(id)
                          setGame(data)
                          setIsLoading(false)
                          setShowErrorMessage(false)
                       }

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

        conn.on('JoinSpecificGame', (username, msg) => {
            console.log('msg: ', msg);
        });

        conn.on('ReceiveGameAfterShot', (username, gameAfterShot) => {
            setGame(gameAfterShot)
        })

        await conn.start();
        
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
                                    Retry
                            </button>

                        </div>
                    ) : (
                        <h1 className='game-hdr'>Loading...</h1>

                    )}
              </div>
        ) : (
            <div className='flex flex-col gap-5 m-5 w-full items-center content-center'>
                <div className='flex flex-col w-full items-center justify-center'>
                    <h1 className='game-hdr'>Battleship Game</h1>
                    <h2 className='game-subhdr'>Ships remaining: {game && game.ships.length}</h2>
                    <h2 className={`game-subhdr text-blue-800`}>
                        {(game && game.shotResultMessage !== '') ? game.shotResultMessage : <span className='invisible'>invisible text placeholder</span>}
                    </h2>
                </div>
                <div className='flex flex-col items-center w-full'>
                  <GameBoard cells={game.cells} handleShot={handleShot}/>
                  
                  

                  <button
                   onClick={handleRestart}
                   className='restart-btn'>Restart Game</button>
                </div>
                {game.status == 'WON' && (
                    <GameResultModal
                    status='WON'
                    header='You won!'
                    description='You have destroyed all ships!'
                    handleButtonClick={() => handleRestart()}/>
                    )}

            {game.status == 'LOST' && (
                <GameResultModal
                status='LOST'
                header='You lost!'
                description='You have ran out of shoots!'
                handleButtonClick={() => handleRestart()}/>
                )}   
            </div>
        )}


        

    </GameContext.Provider>

  )
}

export default Home