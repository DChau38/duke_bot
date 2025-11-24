import { Ollama } from 'ollama';

const ollama = new Ollama({
  host: 'http://127.0.0.1:11434'
});

async function chatExample() {
  const response = await ollama.chat({
    model: 'llama3.2:3b',
    messages: [
      { role: 'user', content: 'Explain gravity simply.' }
    ]
  });

  console.log(response);
}

chatExample();
