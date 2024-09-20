import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

const App = ()=> {

  return (
    <div className='flex flex-col w-full items-center justify-center'>
      <Routes>
        <Route path="/" element={<Navigate to="/game" replace />} />
        <Route path='/game/:id?' element={<Home/>}/>
        <Route path='*' element={<NotFound/>}/>
      </Routes>
    </div>
  )
}

export default App
