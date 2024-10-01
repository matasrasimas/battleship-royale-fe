import React, { useContext } from 'react'
import './styles.css'
import {useParams} from 'react-router-dom'
import { faCircle, faX } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import GameContext from '../../GameContext'

const BoardCell = ({rowIndex, colIndex, cell, handleShot, canShoot, isYourBoard}) => {

  const {setGame} = useContext(GameContext)
  const {id} = useParams()

  const handleClick = (e) => {
    e.preventDefault();
    
    const shotCoords = {
      row: rowIndex,
      col: colIndex,
    };

    handleShot(shotCoords);
  };

  return (
    <div
     onClick={canShoot ? handleClick : null}
     className={`flex items-center justify-center block w-full h-full border border-black ${!cell.isHit && canShoot && 'hover:bg-gray-400 cursor-pointer'} ${(cell.isShip && isYourBoard) ? 'bg-blue-500' : 'bg-gray-200'}`}
     >
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