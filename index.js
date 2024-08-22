const axios = require('axios');
const { EmailClient } = require('@azure/communication-email');

module.exports = async function (context, myTimer) {
    const connectionString = process.env.ACS_CONNECTION_STRING;
    const emailClient = new EmailClient(connectionString);

    const weatherApiKey = process.env.WEATHER_API_KEY;
    const city = 'Bokaro'; // Change to your desired city
    const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;

    try {
        const weatherResponse = await axios.get(weatherUrl); // Renamed to avoid conflict
        const weatherDescription = weatherResponse.data.weather[0].description;
        const temperature = weatherResponse.data.main.temp; 
        const weatherCondition = `Current weather in ${city}: ${weatherDescription}. Temperature: ${temperature}°C.`;

        let emailSubject = 'Current Weather Update';
        let emailBody = weatherCondition;

        if (weatherDescription.includes('storm')) {
            emailSubject = 'Severe Weather Alert!';
            emailBody += `\n\nAlert: Severe weather condition detected in ${city}. Please take necessary precautions.`;
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

        const emailResponse = await emailClient.beginSend(emailMessage); // Renamed to avoid conflict
        await emailResponse.pollUntilDone();

        context.log('Email sent successfully with current weather information.');
    } catch (error) {
        context.log('Error fetching weather data or sending email:', error);
    }
};
