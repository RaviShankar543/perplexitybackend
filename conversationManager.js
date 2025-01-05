class ConversationManager {
    constructor() {
        this.conversationHistory = [];
        this.maxTokens = 4000; // Adjust based on model's context window
    }

    addMessage(role, content) {
        this.conversationHistory.push({
            role,
            content
        });
    }

    getFormattedHistory() {
        return this.conversationHistory;
    }

    truncateHistoryIfNeeded() {
        // Simple implementation - remove oldest messages first
        while (JSON.stringify(this.conversationHistory).length > this.maxTokens) {
            this.conversationHistory.shift();
        }
    }
}

class LLMClient {
    constructor() {
        this.conversationManager = new ConversationManager();
    }

    async callLlama(prompt) {
        // Add user message to history
        this.conversationManager.addMessage("user", prompt);
        
        // Truncate if needed
        this.conversationManager.truncateHistoryIfNeeded();
        
        // Format messages for Llama
        const messages = this.conversationManager.getFormattedHistory();
        
        try {
            // Example API call (replace with actual Llama API)
            const response = await this.makeAPICall(messages);
            
            // Add assistant's response to history
            this.conversationManager.addMessage(
                response.role,
                response.content
            );
            
            return response.content;
            
        } catch (error) {
            console.error('Error calling LLM API:', error);
            throw error;
        }
    }

    async makeAPICall(messages) {
        // Replace this with actual API implementation
        // This is just a mock example
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    role: "assistant",
                    content: "Sample response"
                });
            }, 1000);
        });
    }
}

// Example usage
async function main() {
    try {
        const llmClient = new LLMClient();
        
        // First interaction
        console.log("Sending first message...");
        const response1 = await llmClient.callLlama("What is the capital of France?");
        console.log("Response 1:", response1);
        
        // Second interaction (with context from first)
        console.log("Sending second message...");
        const response2 = await llmClient.callLlama("What is its population?");
        console.log("Response 2:", response2);
        
    } catch (error) {
        console.error("Error in main:", error);
    }
}

// Example with real API integration (using fetch)
class LlamaAPIClient extends LLMClient {
    constructor(apiKey, apiEndpoint) {
        super();
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
    }

    async makeAPICall(messages) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            role: "assistant",
            content: data.choices[0].message.content
        };
    }
}

// Example usage with real API
async function mainWithRealAPI() {
    const client = new LlamaAPIClient(
        'your-api-key',
        'https://api.example.com/v1/chat/completions'
    );

    try {
        const response = await client.callLlama("What is the capital of France?");
        console.log("API Response:", response);
    } catch (error) {
        console.error("API Error:", error);
    }
}