import React, { useEffect, useState } from 'react';

import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';

import DeviceListMenu from './DeviceListMenu.js';

import { channels } from './electron/channels.js';


function App() {
  const [castDevices, setCastDevices] = useState([]);
  const [scanDevices, setScanDevices] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(''); // The selected device ID
  const [casting, setCasting] = useState(false);

  useEffect(() => {
    return function cleanup() {
      window.api.deregisterFetchedDevices();
      window.api.deregisterNoOp();
    }
  }, []);


  const fetchDevices = () => {
    // Ask the main process to fetch available Chromecast devices.
    if (!scanDevices) {
      console.log('Asking for devices from main process...');
      window.api.fetchDevices();
    }
  };

  window.api.onFetchedDevices((_event, chromecastDevices) => {
    // Update with the list of fetched Chromecast devices.
    console.log(`Got ${chromecastDevices.length} devices.`);
    setCastDevices(chromecastDevices.sort());
    setScanDevices(false);
    _event.sender.send(channels.DELIVERED_MESSAGE, true);
    window.api.deregisterFetchedDevices();
  });

  const notifySelectedDevice = (chromecastDeviceId) => {
    window.api.selectedDevice(chromecastDeviceId);
    setSelectedDeviceId(chromecastDeviceId);
  }

  window.api.onNoop((_event, value) => {
    console.log('Got event with nothing to do.');
    _event.sender.send(channels.DELIVERED_MESSAGE, true);
    window.api.deregisterNoOp();
  });

  const clearDeviceList = () => {
    setSelectedDeviceId('');
    setCasting(false);
    setCastDevices([]);
    setScanDevices(true);
    fetchDevices();
  }

  const startCast = () => {
    if (selectedDeviceId !== '') {
      window.api.startChromecast("go");
      setCasting(true);
    }
  };

  const endCast = () => {
    if (casting) {
      window.api.stopChromecast("done");
      setCasting(false);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar >
          <DeviceListMenu devices={castDevices} selectedDeviceId={selectedDeviceId} setSelectedDeviceId={ notifySelectedDevice } casting={casting} />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" disabled={!selectedDeviceId || casting} disableElevation onClick={ startCast }>Cast</Button>
            <Button variant="contained" disabled={!selectedDeviceId || !casting} disableElevation onClick={ endCast }>End Cast</Button>
            <Button variant="contained" disabled={scanDevices} disableElevation onClick={ clearDeviceList }>Refresh Chromecast Device List</Button>
          </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default App;
