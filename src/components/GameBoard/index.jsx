import React from 'react';
import BoardRow from '../BoardRow';

const GameBoard = ({ cells }) => {

  const letters = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const totalRows = 10;

  return (
    <div className='grid grid-rows-11 border-2 border-black w-[98%] h-96 mb-5 w-11/12 sm:w-4/5 md:w-1/2 lg:w-1/3'>

      <div className='grid grid-cols-11'>
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
          <BoardRow key={rowIndex} rowIndex={rowIndex} rowCells={rowCells} />
        );
      })}
    </div>
  );
};

export default GameBoard;