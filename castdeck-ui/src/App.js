import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { channels } from './electron/channels.js';

function App() {
  const { ipcRenderer } = window.require('electron');
  const [ castDevices, setCastDevices ] = useState([]);

  useEffect(() => {
    // Listen for the event
    ipcRenderer.on(channels.GET_DEVICES, (event, arg) => {
      // Find the device in the list
      // If it's not there, add it
      console.log(`Notified about: ${JSON.stringify(arg, null, 4)}`);
      if (!castDevices.find(device => device.txt.id === arg.txt.id)) {
        setCastDevices([...castDevices, arg]);
      }
    });
    // Clean the listener after the component is dismounted
    // return () => {
    //   ipcRenderer.removeAllListeners();
    // };
  }, []);

  const getDevices = () => {
    ipcRenderer.send(channels.FETCH_DEVICES, 'dammit');
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p>
          <code>{castDevices && castDevices.length ? JSON.stringify(castDevices[0], null, 4) : 'Nuthin'}</code>
        </p>
        <p>
          <button onClick={getDevices}>Reload</button>
        </p>
      </header>
    </div>
  );
}

export default App;
