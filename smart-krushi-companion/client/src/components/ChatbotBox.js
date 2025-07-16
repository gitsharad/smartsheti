import React, { useState } from 'react';
import apiRoutes from '../services/apiRoutes';

const placeholderBotReply = (msg) => {
  if (msg.includes('पाणी')) {
    return 'हो, जमिनीतील ओलावा कमी आहे.';
  }
  return 'माफ करा, मला समजले नाही.';
};

const ChatbotBox = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'नमस्कार! मी तुमचा कृषी सहाय्यक आहे.' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { from: 'user', text: input }]);
    try {
      const res = await apiRoutes.getChatbot({ message: input });
      console.log(res);
      setMessages((msgs) => [...msgs, { from: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { from: 'bot', text: 'AI सेवा उपलब्ध नाही.' }]);
    }
    setInput('');
  };

  return (
    <div className="bg-white rounded shadow p-4 mt-4">
      <h2 className="font-bold mb-2">कृषी चॅटबॉट</h2>
      <div className="h-32 overflow-y-auto mb-2 border p-2 rounded bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={msg.from === 'bot' ? 'text-green-700' : 'text-blue-700 text-right'}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="आपला प्रश्न टाइप करा..."
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button className="bg-green-500 text-white px-4 py-1 rounded" onClick={sendMessage}>पाठवा</button>
      </div>
    </div>
  );
};

export default ChatbotBox; 