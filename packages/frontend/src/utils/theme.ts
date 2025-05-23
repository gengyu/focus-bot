type Theme = 'light' | 'dark';

class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme;

  private constructor() {
    // 初始化主题，优先使用本地存储的主题设置
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }

  public setTheme(theme: Theme): void {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  public toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export const themeManager = ThemeManager.getInstance();