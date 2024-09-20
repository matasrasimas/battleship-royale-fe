import React, { useContext } from 'react'
import './styles.css'
import {useParams} from 'react-router-dom'
import { faCircle, faX } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import GameContext from '../../GameContext'

const BoardCell = ({rowIndex, colIndex, cell}) => {

  const {setGame} = useContext(GameContext)
  const {id} = useParams()

  const handleShot = async()=> {
    try {
      const requestBody = {
          row: rowIndex,
          col: colIndex,
      }
      const response = await fetch(`http://localhost:5285/api/Games/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    })
      const data = await response.json()
      setGame(data)

    }catch(error) {
      console.error('An error occurred: ', error)
    }
  }

  return (
    <div
     onClick={handleShot}
     className={`flex items-center justify-center block w-full h-full border border-black bg-gray-200 ${!cell.isHit && 'hover:bg-gray-400 cursor-pointer'}`}>
        {(cell.isHit && !cell.isShip) && (
          <FontAwesomeIcon icon={faCircle} />
        )}

       {(cell.isHit && cell.isShip) && (
          <FontAwesomeIcon icon={faX} className='text-red-500 font-bold' />
        )}


    </div>
  )
}

export default BoardCell