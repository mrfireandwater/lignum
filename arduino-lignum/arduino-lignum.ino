/*
 * Project Lignum
 * Project : IOT sensor that connect tells you through facebook messenger when to water your plant. 
 *           you can discuss a biz with your plant too. In the arduino part, we mesure and send data
 *           to the cloud on Heroku.
 * Author : Loïc Rochat
 * Contact : loic.rochat@gmail.com
 * Date : November 2017
 * 
 */

#include <WiFi.h>
#include <HTTPClient.h>
 
const char* ssid = "thisisit";
const char* password =  "23456789";
String state;
 
void setup() {
 
  Serial.begin(115200);
  delay(4000);   //Delay needed before calling the WiFi.begin
 
  WiFi.begin(ssid, password); 
  delay(2000);
  while (WiFi.status() != WL_CONNECTED) { //Check for the connection
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }
 
  Serial.println("Connected to the WiFi network");
 
}
 
void loop() {
 sendHumidity(30);
 
}

/*
 * FUNCTION : transmit data to the cloud on heroku
 * INPUT : data to be transmited : int humidity (soil humidity)
 * OUTPUT : serial log
 */ 
void sendHumidity(int humidity){
  if(WiFi.status()== WL_CONNECTED){   //Check WiFi connection status
   
   HTTPClient http; //declare http object 
   http.begin("http://lignum.herokuapp.com/senddata/");  //Specify destination for HTTP request
   http.addHeader("Content-Type", "application/json");             //Specify content-type header

  if(humidity <= 30){
    state = "soif";
  }
  else{
    state = "ok";
  }
   
   /* TRANSMIT HUMIDITY AND STATE (SOIF = WATER THE PLANT, OK = OK)
    * We have to send a json file to the web server/client because nodeJS is using express which uses json.
    * We have the first part(begin) containing the category and the second (end) and we put the data in between.
    * WARNING : NODEJS CASE SENSITIVE, DO NOT FORGET TO REMOVE USELESSES SPACES.
    */
   String jsonTextBegin = "{\"Body\":\"";
   String jsonTextEnd = "\",";
   String jsonTextBegin2 = "\"State\":\"";
   String jsonTextEnd2 = "\"} ";
   
   int httpResponseCode = http.POST(jsonTextBegin+String(humidity)+jsonTextEnd+jsonTextBegin2+state+jsonTextEnd2);   //Send the actual POST request
 
   if(httpResponseCode>0){
 
    String response = http.getString(); //Get the response to the request
    Serial.println(httpResponseCode);   //Print return code
    Serial.println(response);           //Print request answer
   }
   else{
    
    Serial.print("Error on sending POST: ");
    Serial.println(httpResponseCode);
   }
   http.end();  //Free resources
 
 }
 else{
    Serial.println("Error in WiFi connection");   
 }
  delay(10000);  //Send a request every 10 seconds
 
}


