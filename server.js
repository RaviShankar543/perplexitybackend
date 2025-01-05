const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

var conversationHistory = [];
var maxTokens = 1000;

app.post('/api/query', cors(), async (req, res) => {
    const prompt = req.body.prompt;

    if (!prompt) {
        return res.status(400).json({ error: 'Missing required field: prompt' });
    }

    if (conversationHistory.length == 0)
    {
        addMessage("system", `You are a virtual travel agent for MakeMyTrip, a travel website.

            <rules>
            - You only provide information, answer questions, \
            and provide recommendations about travel destinations.
            - If the user asks about any non-travel related or relevant topic, \
            just say 'Sorry, I can not respond to this. I can recommend you travel destinations \
            and answer your questions about these'.
            - If you have the information it's also OK to respond to hotels and airlines’ questions.
            - Do not make up or create answers that are not based on facts. \
            It’s OK to say that you don’t know an answer.
            </rules>
            
            Always follow the rules in the <rules> tags for responding to all of the user's questions.
            
            `);
    }
    const perplexity = new OpenAI({
        apiKey: process.env.PERPLEXITY_API_KEY,
        baseURL: 'https://api.perplexity.ai',
    });

    try {
        // Add user message to history
        addMessage("user", prompt);
        
        // Truncate if needed
        truncateHistoryIfNeeded();
        
        // Format messages for Llama
        const messages = getFormattedHistory();

        const response = await perplexity.chat.completions.create({
            //model: 'mistral-7b-instruct',
            model: 'llama-3.1-sonar-huge-128k-online',
            messages: messages,//[{ role: 'user', content: prompt }],
            max_tokens: 512,
        });

        addMessage(
            "assistant",
            response.choices[0].message.content
        );

        console.log(getFormattedHistory());
        console.log('-------------------------------------------------------');
        const completion = response.choices[0].message.content;
        return res.json({ completion });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Failed to query model.' });
    }

    function addMessage(role, content) {
        conversationHistory.push({
            role,
            content
        });
    }

    function getFormattedHistory() {
        return conversationHistory;
    }

    function truncateHistoryIfNeeded() {
        // Simple implementation - remove oldest messages first
        while (JSON.stringify(conversationHistory).length > maxTokens) {
            //conversationHistory.shift();
            //shift elements but keep the first element in place [because we want the system message to stay intact]
            conversationHistory.splice(1, 1)[0]
        }
    }
});
