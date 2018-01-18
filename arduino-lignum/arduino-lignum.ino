/*
 * Project Lignum
 * Project : IOT sensor that connect tells you through facebook messenger when to water your plant. 
 *           you can discuss a bit with your plant too. In the arduino part, we mesure and send data
 *           to the cloud on the Heroku server.
 * Author : Loïc Rochat
 * Contact : loic.rochat@gmail.com
 * Date : November 2017 - January 2018
 * 
 */

#include <WiFi.h>
#include <HTTPClient.h>

#define numberMeasurements 10 //number of measurement to do for one result (more precision)

//wifi
const char* ssid = "ThinkDifferent";
const char* password =  "Caudron-C.460";

//data sent
String thirst;
int humidity = 0;

//measurements
const byte interruptPin = 34; //interrupt pin on esp-32 = P34 on board layout
int interval = 0; //interval in second in the capacitive oscilliator
int prev_time = 0; //used to store time to compute interval

int waiting = 120; //number of seconds between two measurements
 
void setup() {
 
  Serial.begin(115200);
  pinMode(interruptPin, INPUT_PULLUP); //interrupt for the sensor
  delay(4000);   //Delay needed before calling the WiFi.begin

 //try to connect to the wifi
  WiFi.begin(ssid, password); 
  delay(2000);
  while (WiFi.status() != WL_CONNECTED) { //Check for the connection
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }
 
  Serial.println("Connected to the WiFi network");
 
}
 
void loop() {
 sendHumidity(readHumidity()); //read and send the data
 delay(waiting*1000);  //delay between two call to sendHumidity()
 
 Serial.print("soil's humidity : "); //debug
 Serial.print(readHumidity()); //debug
 Serial.println("%");
 
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
    thirst = "soif";
  }
  else{
    thirst = "ok";
  }
   
   /* TRANSMIT HUMIDITY AND STATE (SOIF = WATER THE PLANT, OK = OK)
    * We have to send a json file to the web server/client because nodeJS is using express which uses json.
    * We have the first part(begin) containing the category and the second (end) and we put the data in between.
    * WARNING : NODEJS CASE SENSITIVE, DO NOT FORGET TO REMOVE USELESSES SPACES.
    */
   String jsonTextBegin = "{\"Humidity\":\"";
   String jsonTextEnd = "\",";
   String jsonTextBegin2 = "\"Thirst\":\"";
   String jsonTextEnd2 = "\"} ";
   
   int httpResponseCode = http.POST(jsonTextBegin+String(humidity)+jsonTextEnd+jsonTextBegin2+thirst+jsonTextEnd2);   //Send the actual POST request
 
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
 }//end if wifi connected
 else{
    Serial.println("Error in WiFi connection");   
 } 
}

/*
 * FUNCTION   : RETURN THE % OF HUMIDITY IN THE SOIL
 * INPUT      : -
 * OUTPUT     : SOIL % OF HUMIDITY
 */
int readHumidity(){
  int sumInterval = 0;
  int counter = 0;
  /*
   * The loop activate the interrupt that will perform the measure.
   * It will loop numberMeasurements times
   */
  for(counter = 0; counter < numberMeasurements; counter++){
    do{
      attachInterrupt(digitalPinToInterrupt(interruptPin), rising, RISING);
      delay(5);
    }while(interval > 100);
    sumInterval += interval;
  }
  //function calculated based on maximum interval 34 us corresponding to 80% of humidity
  // and 23 us corresponding to 20% of humidity
  int finalResult = (60/11)*(sumInterval/numberMeasurements) - 86;
  
  //in case the humidity if a little bit above 100% which may happens depending on the soil's type.
  if(finalResult > 100)
    finalResult = 100;
  else;
  
  return finalResult;
}

/*
 * FUNCTION   : detect when the signal in the oscilliator rises (interrupt)
 *              and attach the interrupt to detect the fall
 * INPUT      : 
 * OUTPUT     : 
 * OTHER      : called by interrupt
 */
void rising() {
  attachInterrupt(digitalPinToInterrupt(interruptPin), falling, FALLING);
  prev_time = micros();
}

/*
 * FUNCTION   : detect when the signal in the oscilliator falls (interrupt),
 *              disables the interrupt and compute the high period of the signal.
 * INPUT      : 
 * OUTPUT     : 
 * OTHER      : called by interrupt
 */
void falling() {
  interval = micros()-prev_time;
  detachInterrupt(digitalPinToInterrupt(interruptPin));
}


