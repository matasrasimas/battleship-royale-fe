import React, { useEffect, useState } from 'react';

const Chat = ({ handleMessage, text }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);  // assume messages update through SignalR

    return (
        <div>
            <div style={{border: '1px solid black', marginBottom: '10px', padding: '5px'}}>
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
                    style={{ border: '1px solid black', padding: '5px'}}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button
                    onClick={handleMessage(message)}
                    style={{    border: '1px solid black', backgroundColor: 'green', marginLeft: '5px', padding: '5px'}}
                >
                    Send
                </button>
            </div>
        </div>
    );
};


export default Chat;
