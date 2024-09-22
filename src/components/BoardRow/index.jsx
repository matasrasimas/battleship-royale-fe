import React from 'react'
import './styles.css'
import BoardCell from '../BoardCell'

const BoardRow = ({rowIndex, rowCells, handleShot}) => {
  return (
    <div className='grid grid-cols-11'>
      <div
        className='flex items-center justify-center block w-full h-full border border-black bg-gray-400 font-bold'>
          {rowIndex+1}
      </div>
    {rowCells.map((cell, colIndex) => (
      <BoardCell key={colIndex} rowIndex={rowIndex} colIndex={colIndex} cell={cell} handleShot={handleShot}/>
    ))}
  </div>
  )
}

export default BoardRow