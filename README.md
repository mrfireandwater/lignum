# lignum
IOT device that plugs into a plant and tells you all about it through Facebook messenger.

I built a device that plugs into your plant's pot and measures the soil moisture. The lignum bot on facebook tells you when to water your plant.
You can also talk a bit with the plant and it react with jokes sometimes.

The server/webhook is hosted on heroku and is written in nodeJS. It interracts with facebook and with the device itself.
The lignum device is based on ESP32 and run an arduino code. It simply send a POST request to informs the servers about the soil's moisture
