import React from 'react'
import './styles.css'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className='flex flex-col w-full items-center gap-5'>
      <h1 className='game-hdr'>Page not found.</h1>
      <Link to='/game'>
        <button
          className='restart-btn'>
          Go Back
        </button>
      </Link>

    </div>
  )
}

export default NotFound