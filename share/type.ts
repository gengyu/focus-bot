export interface Model {
  id: string;
  name: string;
  description: string;
  size: string;
  enabled: boolean;
}
export interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  models: Model[];
}

export interface ModelConfig {
  providers?: Provider[];
}
