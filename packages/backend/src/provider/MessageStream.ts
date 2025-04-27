import {ChatMessage} from "../../../../share/type.ts";


class MessageStream extends ReadableStream {
  constructor(private messages: ChatMessage[]) {
    super();
  }

  async start(controller: ReadableStreamDefaultController) {
    for (const message of this.messages) {
      const content = message.content || '';
      if (content) {
        controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
  }
}