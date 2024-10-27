import React, { useState } from 'react';
import './styles.css';

const Chat = ({ handleMessage, text }) => {
    const [message, setMessage] = useState('');

    const handleButtonClick = () => {
        if (message !== '') {
            handleMessage(message)();
            setMessage('');
        }
    };

    return (
        <div>
            <div className='text-box'>
                {text.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.username}: </strong>
                        {msg.message}
                    </div>
                ))}
            </div>
            <div>
                <input
                    type="text"
                    className='input-box'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button
                    onClick={handleButtonClick}
                    className='send-button'
                >
                    Send
                </button>
            </div>
        </div>
    );
};


export default Chat;
