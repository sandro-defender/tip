const CONFIG = {
    REPO: 'sandro-defender/tip',
    TOKEN: process.env.GITHUB_TOKEN || '', // Будет заполняться через переменные окружения
    TIMEZONE_OFFSET: 4,
    PASSWORD: process.env.STATS_PASSWORD || '4545' // Будет заполняться через переменные окружения
};

export default CONFIG; 