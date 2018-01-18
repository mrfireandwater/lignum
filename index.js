'use strict'

/*
* FUNCTION : 	Server that handle HTTP request from Facebook Messenger and an IOT device.
				It analyse the data and responds accordingly.
				Written in NodeJS. Hosted on Heroku
* AUTHOR   :	Loïc Rochat
* CONTACT  : 	loic.rochat@gmail.com%2FlignumLabs%2Fvideos%2F329335957535056%2F
* DATE 	   :    November 2017 to January 2018
*
*/


const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
var fs = require("fs")
const app = express()

// loic constants
let loicsender

var humidity
var state
var content //used to read json file

/*store data into Json file when the server automatically shut down
 * Humidity from 0 to 100%, Thirst : soif or else
 */
var data = '{"Humidity": "0","Thirst": "ok"}'
var json = JSON.parse(data);

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
 * FONCTION : Read Json file
 * INPUT : what to read
 * OUTPUT : content
 */
 function readJson(){
	fs.readFile('json.json', function read(err, data2) {
		if (err) {
			throw err;
		}
		content = data2;
		console.log("readJson says: "+content);   // Put all of the code here (not the best solution)
	});
 }
 
 /*
 * FONCTION : Write Json file
 * INPUT : what to write
 * OUTPUT : nothing
 */
 function writeJson(jsondata){
	fs.writeFile("./json.json", JSON.stringify(jsondata), function (err) {
		if (err) return console.log(err);		
		console.log('File written!');
	});
 }
 writeJson() //called once on startup
 
/*
 * FONCTION : Modify Json
 * INPUT : id, newEntry
 * OUTPUT : nothing
 */
function modJson(id, newEntry) {
  json.id = newEntry
}
 
 /*
 * FONCTION : Read Json file
 * INPUT : what to read
 * OUTPUT : content
 */
 function SendHumidityRead(sender){
	fs.readFile('./json.json', function read(err, data) {
		if (err) {
			throw err;
		}
		content = JSON.parse(data);
		console.log("content read"+content);   // Put all of the code here (not the best solution)
		sendHumidity(sender)
	});
 }
 
 /*
 * FONCTION : Select a message to be sent to user
 * INPUT : user ID
 * OUTPUT : -
 */
function sendHumidity(sender) {
	console.log("humidité: "+content.Humidity)
	if (content.Humidity === '0'){
		sendTextMessage(sender, "mmh")
		sendTextMessage(sender, "mmh mmh")
		sendTextMessage(sender, "Je crois que tu as oublié d'allumer l'appareil ou alors c'est vraiment sec haha")
		sendTextMessage(sender, "O:)")
	}
	else if(content.Thirst === 'soif'){
		sendTextMessage(sender, "Pss, la plante d'à côté est un vrai trou!")
		sendTextMessage(sender, "Humidité "+content.Humidity+"%, vite de l'eau, de l'eau! :) :beer:")
	}
	else if(content.Thirst === 'ok'){
		sendTextMessage(sender, "tout coule...euh tout roule pour moi ;)")
		sendTextMessage(sender, "Humidité "+content.Humidity+"%, j'ai pas encore soif!")
	}
	else{
		sendTextMessage(sender, "erreur dans le json, Thirst vaut: "+content.Thirst)
	}
}

// 
/*
 * FONCTION : Receive the data from arduino and call sendHumidity
 * INPUT : -
 * OUTPUT : -
 */
app.post('/senddata/', function (req, res) {
	
	//store request data into variables
	humidity = req.body.Humidity
	modJson('Humidity', humidity) //insert data into Json file
	state = req.body.Thirst
	modJson('Thirst', state) //insert data into Json file
	
	writeJson(req.body) //write Json file
	
	console.log("got from esp32: %j", req.body);
	
	//activate for debug
	//SendHumidityRead(loicsender) //alert user if plant require watering
    
	//respond to post request from arduino by a post request.
	res.set('Content-Type', 'text/plain')
    res.send("received: "+req.body.Humidity)

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

/*
 * FONCTION : Receive message from facebook and select answer to give
 * INPUT : -
 * OUTPUT : -
 * OTHER : launch automatically when called
 */
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
			if (text === 'allo' || text === 'Allo') {
			    sendTextMessage(sender, "à l'huile")
		    	continue
		    }
			if (text === 'merci' || text === 'Merci') {
			    sendTextMessage(sender, "De rien")
				sendTextMessage(sender, ":)")
		    	continue
		    }
			if (text === 'Blague' || text === 'blague') {
			    sendTextMessage(sender, "C'est l'histoire d'une plante qui se balade tête en l'air comme elle est. Sans le voir venir, elle s'encouble et se plante.")
		    	continue
		    }
			if (text === 'Humidité' || text === 'humidité') {
				SendHumidityRead(loicsender)
				continue
		    }
			//Default message
		    sendTextMessage(sender, "Mon cerveau végétal répond à ces quelques mots clés : \nBlague \nGeneric \nHumidité")
	    }
		else{ // If the event is a postback and has a payload equals USER_DEFINED_PAYLOAD 
			if(event.postback && event.postback.payload === 'Payload for first element in a generic bubble' ){
                //present user with some greeting or call to action
                var msg = "Ce bouton postback ne sert à rien"
                sendTextMessage(sender, msg)      
			}
			//postback response to get started :
			if(event.postback && event.postback.payload === 'get-started-payload' ){
                //present user with some greeting or call to action
                var msg = "Salut! Tape n'importe quoi pour voir ce que je peux faire :)"
                sendTextMessage(sender, msg)      
			}
		}
    }
    res.sendStatus(200)
})

/*
 * FONCTION : Send a message to facebook
 * INPUT : recipient, text message
 * OUTPUT : console log
 */
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
/*
 * FONCTION : send a picture
 * INPUT : -
 * OUTPUT : -
 * OTHER : -
 */
function sendMedia(sender) {
    let messageData = {
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

/*
 * FONCTION : send a Generic message
 * INPUT : user ID
 * OUTPUT : -
 * OTHER : -
 */
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

/*
 * FONCTION : Get startet button appearing on facebook messenger
 * INPUT : data
 * OUTPUT : -
 * OTHER : -
 */
function setupGetStartedButton(res){
        var messageData = {
                "get_started":[
                {
                    "payload":"get-started-payload"
                    }
                ]
        };

        // Start the request
        request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ token,
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            form: messageData
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                res.send(body);

            } else { 
                // TODO: Handle errors
                res.send(body);
            }
        });
    } 
//postback response to get started
app.get('/setup',function(req,res){
    setupGetStartedButton(res);
});

//indentifying token for facebook
const token = "EAAcAbgtQhBcBAOY15fGXJH3FTocuzhDwZA8RJZCpuTPjoZCzFfDHZAtgzAfxaAxGVLyirj7W05ELfmYe7Qfkk9i7WZALWZB67YCi9ZCs74JzvBQqOGWB0C2lx3HKsD8JCMfzVIcxFHrMqWFtStyxuZCV7Q3rQ0ZB4BXhwWiXt8T3HngCfeFkLZBECH"