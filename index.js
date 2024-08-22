const axios = require('axios');
const { EmailClient } = require('@azure/communication-email');

module.exports = async function (context, myTimer) {
    const connectionString = process.env.ACS_CONNECTION_STRING;
    const emailClient = new EmailClient(connectionString);

    const weatherApiKey = process.env.WEATHER_API_KEY;
    const city = 'Bokaro'; // Change to your desired city
    const currentWeatherUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;
    const forecastUrl = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${weatherApiKey}&units=metric`;

    try {
        // Fetch current weather
        const weatherResponse = await axios.get(currentWeatherUrl);
        const weatherDescription = weatherResponse.data.weather[0].description;
        const temperature = weatherResponse.data.main.temp;
        const weatherCondition = `Current weather in ${city}: ${weatherDescription}. Temperature: ${temperature}°C.`;

        // Fetch weather forecast
        const forecastResponse = await axios.get(forecastUrl);
        const forecastList = forecastResponse.data.list;

        let severeWeatherAlert = '';
        let forecastDetails = '';

        // Check forecast for severe weather and compile forecast details
        for (let i = 0; i < forecastList.length; i++) {
            const forecast = forecastList[i];
            const forecastDescription = forecast.weather[0].description;
            const forecastTime = forecast.dt_txt;

            if (forecastDescription.includes('storm') || forecastDescription.includes('heavy rain') || forecastDescription.includes('snow')) {
                severeWeatherAlert = `\n\nAlert: Severe weather conditions expected on ${forecastTime} in ${city}: ${forecastDescription}. Please take necessary precautions.`;
                break;
            }

            // Add forecast details for the next 24 hours
            if (new Date(forecast.dt_txt).getHours() % 5 === 0) { // Every 3 hours
                forecastDetails += `\nForecast for ${forecastTime}: ${forecastDescription}. Temperature: ${forecast.main.temp}°C.`;
            }
        }

        let emailSubject = 'Weather Update';
        let emailBody = `${weatherCondition}${forecastDetails}`;

        if (severeWeatherAlert) {
            emailSubject = 'Severe Weather Alert!';
            emailBody += severeWeatherAlert;
        }

        const emailMessage = {
            senderAddress: 'DoNotReply@84f0d0c2-2a14-4735-9ee0-bbc287109127.azurecomm.net', // Your verified email
            content: {
                subject: emailSubject,
                plainText: emailBody
            },
            recipients: {
                to: [
                    {
                        address: 'ammanfarooque@gmail.com', // The email to send notifications to
                        displayName: 'Amman Farooque'
                    }
                ]
            }
        };

        const emailResponse = await emailClient.beginSend(emailMessage);
        await emailResponse.pollUntilDone();

        context.log('Email sent successfully with current weather and forecast information.');
    } catch (error) {
        context.log('Error fetching weather data or sending email:', error);
    }
};
