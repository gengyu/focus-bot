import {type DialogId,type Model} from "./type";

export interface ChatOptions {
  useKnowledgeBase?: boolean;
  useSearchEngine?: boolean;
  knowledgeBaseId?: string;
  dialogId?: DialogId;
  model: Model;
  stream?: boolean
}
