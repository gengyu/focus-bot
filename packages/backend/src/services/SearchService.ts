import axios from 'axios';
import {ChatMessage} from '../../../../share/type';
import {v4 as uuidv4} from 'uuid';
import {AppSettingService} from './AppSettingService';
import {SearchEngineConfig} from '../../../../share/type';

export interface SearchResult {
	title: string;
	snippet: string;
	link: string;
	source: string;
}

export class SearchService {
	private readonly appSettingService: AppSettingService;
	private readonly searchEngines: Map<string, SearchEngineConfig>;

	constructor() {
		this.appSettingService = new AppSettingService();
		this.searchEngines = new Map();
		this.initializeSearchEngines();
	}

	private async initializeSearchEngines() {
		const settings = await this.appSettingService.getAppSetting();
		if (settings.searchEngines) {
			settings.searchEngines.forEach(engine => {
				this.searchEngines.set(engine.id, engine);
			});
		}
	}

	private getSearchEnginePrompt(engineId: string): string {
		const prompts: Record<string, string> = {
			'google': '请基于以下Google搜索结果，提供准确、全面的回答。注意区分事实和观点，并注明信息来源。',
			'bing': '请基于以下Bing搜索结果，提供详细的分析和见解。重点关注最新的信息和权威来源。',
			'scholar': '请基于以下学术搜索结果，提供专业的学术观点和研究成果。注意引用相关文献和研究成果。',
			'arxiv': '请基于以下arXiv论文搜索结果，提供最新的研究进展和技术分析。重点关注论文的创新点和实验结论。',
			'semantic': '请基于以下Semantic Scholar的学术搜索结果，提供深入的学术分析和研究趋势。注意引用相关文献和作者观点。',
			'ieee': '请基于以下IEEE搜索结果，提供专业的技术分析和工程应用见解。重点关注技术实现和工程实践。',
			'springer': '请基于以下Springer搜索结果，提供学术研究和出版物的分析。注意引用相关期刊和书籍内容。',
			'sciencedirect': '请基于以下ScienceDirect搜索结果，提供科学研究和学术文献的分析。重点关注研究方法和实验数据。',
			'wikipedia': '请基于以下维基百科搜索结果，提供客观的事实信息和历史背景。注意区分事实和观点。',
			'baidu': '请基于以下百度搜索结果，提供本地化的信息和见解。注意筛选可靠的信息来源。'
		};
		return prompts[engineId] || '请基于以下搜索结果提供相关信息：';
	}

	private async searchGoogle(query: string, config: SearchEngineConfig): Promise<SearchResult[]> {
		try {
			const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
				params: {
					key: config.apiKey,
					cx: config.engineId,
					q: query,
					num: 5
				}
			});

			return (response.data.items || []).map((item: any) => ({
				title: item.title,
				snippet: item.snippet,
				link: item.link,
				source: 'Google'
			}));
		} catch (error) {
			console.error('Google搜索失败:', error);
			return [];
		}
	}

	private async searchBing(query: string, config: SearchEngineConfig): Promise<SearchResult[]> {
		try {
			// const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        const response = await axios.get('https://cn.bing.com/search?q=' + query, {

				headers: {
					'Ocp-Apim-Subscription-Key': config.apiKey
				},
				params: {
					q: query,
					count: 5
				}
			});

			return (response.data.webPages?.value || []).map((item: any) => ({
				title: item.name,
				snippet: item.snippet,
				link: item.url,
				source: 'Bing'
			}));
		} catch (error) {
			console.error('Bing搜索失败:', error);
			return [];
		}
	}

	private async searchScholar(query: string, config: SearchEngineConfig): Promise<SearchResult[]> {
		try {
			const response = await axios.get('https://scholar.google.com/scholar', {
				params: {
					q: query,
					hl: 'en',
					num: 5
				}
			});

			// 解析Google Scholar的HTML响应
			// 注意：这需要额外的HTML解析库，这里只是示例
			return [];
		} catch (error) {
			console.error('Google Scholar搜索失败:', error);
			return [];
		}
	}

	async search(query: string, engineIds?: string[]): Promise<SearchResult[]> {
		engineIds = ['bing'];
		const results: SearchResult[] = [];
		const enginesToSearch = engineIds || Array.from(this.searchEngines.keys());

		for (const engineId of enginesToSearch) {
			const engine: any = this.searchEngines.get(engineId) || {enabled: true};
			if (!engine || !engine.enabled) continue;

			let engineResults: SearchResult[] = [];
			switch (engineId) {
				case 'google':
					engineResults = await this.searchGoogle(query, engine);
					break;
				case 'bing':
					engineResults = await this.searchBing(query, engine);
					break;
				case 'scholar':
					engineResults = await this.searchScholar(query, engine);
					break;
				// 可以添加更多搜索引擎的实现
			}

			results.push(...engineResults);
		}

		return results;
	}

	async enhanceWithSearch(query: string, messages: ChatMessage[], engineIds?: string[]): Promise<ChatMessage[]> {
		const searchResults = await this.search(query, engineIds);

		if (searchResults.length > 0) {
			const searchContext = `以下是相关的搜索结果，请参考这些信息来回答问题：\n\n${
				searchResults.map(result =>
					`来源: ${result.source}\n标题: ${result.title}\n摘要: ${result.snippet}\n链接: ${result.link}\n\n`
				).join('\n')
			}`;

			const enhancedMessages: ChatMessage[] = [
				{
					id: uuidv4(),
					role: 'system',
					content: searchContext,
					timestamp: Date.now(),
					type: 'text'
				},
				...messages
			];

			return enhancedMessages;
		}

		return messages;
	}
} 