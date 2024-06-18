import React from 'react';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

export default function DeviceListMenu({ devices, selectedDeviceId, setSelectedDeviceId, casting }) {
    const handleSelectedDeviceChange = (event) => {
        setSelectedDeviceId(event.target.value);
    };

    const buildDeviceListMenu = () => {
        const menuItems = [];
        if (devices && devices.length) {
            devices.map(device => {
                menuItems.push(<MenuItem key={device.txt.id} value={device.txt.id}>{device.txt.fn}</MenuItem>);
                return true;
            });
        }
        return menuItems;
    }

    return (
        <FormControl sx={{ m: 1, width: 300, mt: 3 }}>
            <InputLabel id="chromecast-device-select-label">Available Chromecast devices...</InputLabel>
            <Select
                labelId="chromecast-device-label"
                id="chromecast-device-select"
                value={ selectedDeviceId }
                disabled={ casting }
                onChange={ handleSelectedDeviceChange }
            >
                { buildDeviceListMenu().map(item => item) }
            </Select>
        </FormControl>
    );
}