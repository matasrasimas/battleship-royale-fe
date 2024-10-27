import React from 'react';
import BoardRow from '../BoardRow';

const GameBoard = ({ cells, canShoot, handleShot, isYourBoard}) => {

  const letters = cells.length == 225
            ? ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']
            : ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
  const totalRows = cells.length == 225 ? 15 : 10

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${totalRows+1}, minmax(0, 1fr))`
      }}
      className={`grid border-2 border-black w-[98%] h-96 mb-5 w-11/12 sm:w-4/5 md:w-1/2 lg:w-1/3}`}>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${totalRows+1}, minmax(0, 1fr))`
      }}>
        {letters.map((letter, index) => {
         return <div
            key={index}
            className='flex items-center justify-center block w-full h-full border border-black bg-gray-400 font-bold'>
            {letter}
          </div>
        })}
      </div>

      {[...Array(totalRows)].map((_, rowIndex) => {
        const rowCells = cells.filter(cell => cell.row === rowIndex);
        
        return (
          <BoardRow key={rowIndex} rowIndex={rowIndex} rowCells={rowCells} handleShot={handleShot} canShoot={canShoot} isYourBoard={isYourBoard}/>
        );
      })}
    </div>
  );
};

export default GameBoard;