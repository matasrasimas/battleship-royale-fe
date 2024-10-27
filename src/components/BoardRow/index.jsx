import React from 'react'
import './styles.css'
import BoardCell from '../BoardCell'

const BoardRow = ({rowIndex, rowCells, handleShot, canShoot, isYourBoard}) => {
  return (
    <div  style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${rowCells.length+1}, minmax(0, 1fr))`
  }}>
      <div
        className='flex items-center justify-center block w-full h-full border border-black bg-gray-400 font-bold'>
          {rowIndex+1}
      </div>
    {rowCells.map((cell, colIndex) => (
      <BoardCell
        key={colIndex}
        rowIndex={rowIndex}
        colIndex={colIndex}
        cell={cell}
        handleShot={handleShot}
        canShoot={canShoot}
        isYourBoard={isYourBoard}/>
    ))}
  </div>
  )
}

export default BoardRow