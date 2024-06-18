var Bonjour = require('bonjour-service');

class BonjourClient {
  constructor() {
    this.client = new Bonjour.Bonjour();
    this.devices = [];
  }

  destroy() {
    this.client.destroy();
  }
}

module.exports = BonjourClient;