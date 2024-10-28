import { faCircleCheck, faCircleInfo, faFaceSadTear, faFaceSmile } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './styles.css'
import React from 'react'

const GameResultModal = ({status, header, description, handleButtonClick, buttonText}) => {
  return (
    <div className='fixed top-0 left-0 w-full h-screen bg-black bg-opacity-50 flex items-center justify-center z-50'>
    <div className='relative flex flex-col px-6 py-4 bg-white w-11/12 sm:w-4/5 md:w-1/2 h-auto gap-10 rounded-md shadow-inner shadow-lg'>
        <FontAwesomeIcon
         icon={status == 'WON' ? faFaceSmile : faFaceSadTear}
         className={`absolute border-2 bg-white rounded-full top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[100px] ${status == 'WON' && 'text-lime-600 border-lime-600'} ${status == 'LOST' && 'text-red-600 border-red-600'}}`}/>

        <div className='flex flex-col gap-3 w-full items-center mt-14'>
            <h1 className='result-hdr'>{header}</h1>
            <p className='result-desc'>{description}</p>
        </div>

        <button
         className='new-game-btn'
         onClick={handleButtonClick}>{buttonText}</button>
    </div>
</div>
  )
}

export default GameResultModal