'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

// loic constants
let loicsender

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// loic test requests and anwsers
app.get('/loic', function (req, res) {
	res.send('loic here')
	sendTextMessage(loicsender, "loic here")
})
/*
// Route that receives a POST request to /senddata
app.get('/senddata/', function (req, res) {
	const body = req.body.Body
	res.send("senddata here")
	console.log(body)
	forwardMessageToFacebook(loicsender, "forwardMessageToFacebook")
	sendTextMessage(loicsender, "msg from esp32")
})
*/
function forwardMessageToFacebook(sender, text) {
	sendTextMessage(sender, text)
}

// Route that receives a POST request to /sms
app.post('/senddata/', function (req, res) {
	const body = req.body.Body
	console.log("Session: %j", req.body);
	sendTextMessage(loicsender, "msg " + req.body.Body)
	sendTextMessage(loicsender, "msg from esp32")
    res.set('Content-Type', 'text/plain')
    res.send('received')

})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
	    let event = req.body.entry[0].messaging[i]
	    let sender = event.sender.id
		loicsender = sender
	    if (event.message && event.message.text) {
		    let text = event.message.text
		    if (text === 'Generic') {
			    sendGenericMessage(sender)
		    	continue
		    }
			if (text === 'GIF') {
			    sendMedia(sender)
		    	continue
		    }
			if (text === 'Blague') {
			    sendTextMessage(sender, "C'est l'histoire d'une plante qui se balade tête en l'air comme elle est. Sans le voir venir, elle s'encouble et se plante.")
		    	continue
		    }
			if (text === 'Humidité') {
			    sendTextMessage(sender, "Humidité 47%, j'ai pas encore soif!")
		    	continue
		    }
			//Default message
		    sendTextMessage(sender, "Simple lignum responds to simple messages :) Here they are : \nBlague \nGeneric \nHumidité")
	    }
    }
    res.sendStatus(200)
})

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
		json: {
		    recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

function sendMedia(sender) {
    let messageData = {
		  "message":{
			"attachment": {
			  "type": "template",
			  "payload": {
				 "template_type": "media",
				 "elements": [
					{
					   "media_type": "<image|video>",
					   "url": "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FlignumLabs%2Fvideos%2F329335957535056%2F"
					}
				 ]
			  }
			}    
		  }
    }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
	    json: {
		    recipient: {id:sender},
		    message: messageData,
	    }
    }, function(error, response, body) {
	    if (error) {
		    console.log('Error sending messages: ', error)
	    } else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

function sendGenericMessage(sender) {
    let messageData = {
	    "attachment": {
		    "type": "template",
		    "payload": {
				"template_type": "generic",
			    "elements": [{
					"title": "First card",
				    "subtitle": "Element #1 of an hscroll",
				    "image_url": "http://ouay.ch/img/logo.png",
				    "buttons": [{
					    "type": "web_url",
					    "url": "https://www.ouay.ch",
					    "title": "ouay website"
				    }, {
					    "type": "postback",
					    "title": "Postback",
					    "payload": "Payload for first element in a generic bubble",
				    }],
			    }, {
				    "title": "Second card",
				    "subtitle": "Element #2 of an hscroll",
				    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
				    "buttons": [{
					    "type": "postback",
					    "title": "Postback",
					    "payload": "Payload for second element in a generic bubble",
				    }],
			    }]
		    }
	    }
    }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
	    json: {
		    recipient: {id:sender},
		    message: messageData,
	    }
    }, function(error, response, body) {
	    if (error) {
		    console.log('Error sending messages: ', error)
	    } else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

const token = "EAAcAbgtQhBcBAOY15fGXJH3FTocuzhDwZA8RJZCpuTPjoZCzFfDHZAtgzAfxaAxGVLyirj7W05ELfmYe7Qfkk9i7WZALWZB67YCi9ZCs74JzvBQqOGWB0C2lx3HKsD8JCMfzVIcxFHrMqWFtStyxuZCV7Q3rQ0ZB4BXhwWiXt8T3HngCfeFkLZBECH"