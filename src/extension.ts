import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
    // Comando para abrir o WebView
    const disposable = vscode.commands.registerCommand('deepSeek.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'deepChat',
            'Deep Seek Chat',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        // Comunicação do WebView com a extensão
        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                let responseText = '';
        
                try {
                    const streamResponse = await ollama.chat({
                        model: 'deepseek-r1:1.5b',
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true
                    });
        
                    for await (const part of streamResponse) {
                        responseText += part.message.content;
        
                        panel.webview.postMessage({
                            command: 'chatResponse',
                            text: responseText,
                        });
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        vscode.window.showErrorMessage('Error: ' + err.message);
                    } else {
                        vscode.window.showErrorMessage('An unknown error occurred.');
                    }
                }
            }
        });        

        // Definir o conteúdo HTML do WebView
        panel.webview.html = getWebviewContent();
    });

    context.subscriptions.push(disposable);
}

// Simulação de API com streaming de resposta
async function* simulateChatAPI(userPrompt: string) {
    const responses = [
        { message: { content: 'Processing...' } },
        { message: { content: 'Analyzing your input...' } },
        { message: { content: `You said: ${userPrompt}` } },
    ];
    for (const response of responses) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        yield response;
    }
}

// Conteúdo HTML do WebView
function getWebviewContent(): string {
    return /*html*/`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deep Seek Chat</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 1rem;
                max-width: 600px;
                margin: auto;
            }
            h2 {
                color: #007acc;
            }
            #prompt {
                width: 100%;
                padding: 0.5rem;
                margin-bottom: 1rem;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            button {
                background-color: #007acc;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                cursor: pointer;
                border-radius: 4px;
                transition: background-color 0.3s;
            }
            button:hover {
                background-color: #005f99;
            }
            #response {
                margin-top: 1rem;
                padding: 1rem;
                border: 1px solid #ccc;
                border-radius: 4px;
                background-color: #000000;
            }
        </style>
    </head>
    <body>
        <h2>Deep Seek Chat</h2>
        <textarea id="prompt" rows="3" placeholder="Type your message..."></textarea><br />
        <button id="askBtn">Send</button>
        <div id="response">Your response will appear here...</div>

        <script>
            const vscode = acquireVsCodeApi();

            // Enviar mensagem para a extensão ao clicar no botão
            document.getElementById('askBtn').addEventListener('click', () => {
                const text = document.getElementById('prompt').value;
                vscode.postMessage({ command: 'chat', text });
            });

            // Receber mensagens da extensão
            window.addEventListener('message', (event) => {
                const { command, text } = event.data;
                if (command === 'chatResponse') {
                    document.getElementById('response').innerText = text;
                }
            });
        </script>
    </body>
    </html>
    `;
}

// Método chamado ao desativar a extensão
export function deactivate() {}
