import {KnowledgeBase, KnowledgeBaseStats} from "./knowledge";
import {ProviderConfig, SearchEngineConfig} from "./type";


export interface AppSettings {
	providers: ProviderConfig[];
	searchEngines: SearchEngineConfig[];
	knowledgeBases: KnowledgeBaseStats[];
}