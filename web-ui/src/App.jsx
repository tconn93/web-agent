import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/agents')
      .then(response => response.json())
      .then(data => setAgents(data))
      .catch(error => console.error('Error fetching agents:', error));
  }, []);

  const deployAgent = (id) => {
    fetch(`http://localhost:3000/api/agents/${id}/deploy`, {
      method: 'POST',
    })
      .then(response => response.json())
      .then(data => console.log(data.message))
      .catch(error => console.error('Error deploying agent:', error));
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <h2>Agents</h2>
        <ul>
          {agents.map(agent => (
            <li key={agent.id}>
              {agent.name}
              <button onClick={() => deployAgent(agent.id)}>Deploy</button>
            </li>
          ))}
        </ul>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;

