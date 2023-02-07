var Bonjour = require('bonjour-service');

class BonjourClient {
  constructor() {
    this.client = new Bonjour.Bonjour();
    this.devices = [];
  }

  find() {
    this.client.find({ type: 'googlecast' }, (service) => {
      // console.log(`${JSON.stringify(service, null, 4)}`);
      let device = {
        address: service.addresses[0],
        txt: service.txt,
        name: service.name,
        port: service.port,
      };
      console.log(JSON.stringify(device, null, 4));
      this.devices.push(device);
    });
  }

  destroy() {
    this.client.destroy();
  }
}

module.exports = BonjourClient;