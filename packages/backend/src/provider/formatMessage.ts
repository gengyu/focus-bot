import type {Message} from "ollama";
import {type ChatMessage} from "../../../../share/type";

export const formatMessage = (messages: ChatMessage[]) => {
  return messages.map((chatMessage) => {
    // if(msg.role === 'system')
    if (typeof chatMessage.content === 'string') {
      return {
        role: chatMessage.role,
        content: chatMessage.content
      }
    }

    // msg.role === 'user' #todo 处理大模型返回的images
    // 处理img
    const images = chatMessage.content
      ?.filter(messageContent => messageContent.type === 'image')
      .map(messageContent => messageContent.images)
      .flat().filter(Boolean).map(image => image.url?.split(',')[1]);

    const textContent = chatMessage.content.map(messageContent => {
      if (messageContent.type === 'file') {
        const files = Array.isArray(messageContent.files) ? messageContent.files : [messageContent.files]
        return files.map(messageFile => {
          if (messageFile.content) {
            return (messageFile.metadata.originalname ?? '') + '\n' + messageFile.content;
          }
          return ''
        }).filter(Boolean).join('\n')
      }
      if (messageContent.type === 'text') {
        return messageContent.text
      }
    }).filter(Boolean).join('\n');


    return {
      role: chatMessage.role,
      content: textContent,
      images,
    } as Message
  });
};


export default formatMessage;