// Guardian Trading blog post index — mirrors the categories and posts published
// on the production WordPress blog (guardiantrading.com/blog). Only the DAS
// Trader Pro hotkeys-scripting guide has a fully rebuilt article page in this
// app; every other post links out to its live production URL.

export interface BlogCategory {
  name: string;
  slug: string;
  href: string;
}

export const CATEGORIES: BlogCategory[] = [
  { name: "All Blogs", slug: "all", href: "/blog" },
  { name: "DAS Hotkeys", slug: "das-hotkeys", href: "/category/das-hotkeys" },
  { name: "Margin", slug: "margin", href: "/category/margin" },
  { name: "Risk Management", slug: "risk-management", href: "/category/risk-management" },
  { name: "Short Selling", slug: "short-selling", href: "/category/short-selling" },
  { name: "Tools", slug: "tools", href: "/category/tools" },
];

export interface BlogPost {
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  date: string;
  readTime?: string;
  excerpt: string;
  /** true if this post has a fully rebuilt internal route in this app */
  internal?: boolean;
}

/** Internal route for posts that have been fully rebuilt in this app. */
export const INTERNAL_ROUTES: Record<string, string> = {
  "how-to-prepare-your-das-trader-pro-for-advanced-hotkeys-scripting":
    "/how-to-prepare-your-das-trader-pro-for-advanced-hotkeys-scripting",
};

export function getPostHref(post: BlogPost): { href: string; external: boolean } {
  const internalRoute = INTERNAL_ROUTES[post.slug];
  if (internalRoute) return { href: internalRoute, external: false };
  return { href: `https://www.guardiantrading.com/${post.slug}/`, external: true };
}

export const ALL_POSTS: BlogPost[] = [
  // DAS Hotkeys
  {
    title: "DAS Trader Pro – button types explained",
    slug: "das-trader-pro-button-types-explained",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "06/22/2026",
    readTime: "4m",
    excerpt:
      "If you're trying to speed up your trading, mastering how you cycle through tickers is a game-changer. Fumbling with your keyboard or clicking around too much can be frustrating. Here are 6 different ways to get the right symbol onto your charts, ranging from basic mouse clicks to advanced hotkeys. 1. Grab it from the history...",
  },
  {
    title: "DAS Trader Pro – Entry hotkey with multiple profit targets for all trading hours",
    slug: "das-trader-pro-entry-hotkey-with-mutliple-profit-targets-for-all-trading-hours",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "05/21/2026",
    excerpt:
      "Many traders scale-in and scale-out of their positions. Here are some scripting techniques on how to achieve multiple targets. Just split the orders — this is the simplest solution. Place 2 range orders (because stop-loss orders are good to have) instead of just one. Here is the hotkey for a LONG position with the 1st target...",
  },
  {
    title: "DAS Trader Pro – How to scan through watchlist",
    slug: "das-trader-pro-how-to-scan-through-watchlist",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "05/18/2026",
    excerpt:
      "Objective — let's say you have 108 symbols in your watchlist and want to find out if a certain condition is met on the 5-minute chart. Instead of clicking 108 rows (or using hotkeys to move up and down) and waiting for the chart to load and then checking the chart situation with your own eyes, we can...",
  },
  {
    title: "DAS Trader Pro – How to Exit All Positions at Once",
    slug: "das-trader-pro-how-to-exit-all-positions-at-once",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "04/21/2026",
    excerpt:
      "Sometimes the unpredicted is happening, and we need to act before we understand what is going on. In those cases, many traders want to close all the positions quickly. Regular Hours — for regular hours there is one simple command, which is called PANIC. Its usage is simple: PANIC; It can be a hotkey, a hot button, a window button,...",
  },
  {
    title: "DAS Trader Pro – how to backup and transfer the configuration",
    slug: "das-trader-pro-how-to-backup-and-transfer-the-configuration",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "04/17/2026",
    excerpt:
      "Sometimes your PC crashes, maybe you bought a new PC, or perhaps you did a mistake and need to revert back to the old settings. There are multiple ways of how to backup the configuration in DAS Trader Pro. Use the native backup feature — go to Tools > Back Up Settings. Then, to restore, go to Tools > Restore...",
  },
  {
    title: "DAS Trader Pro – A simple green light for entries",
    slug: "das-trader-pro-a-simple-green-light-for-entries",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "04/13/2026",
    excerpt:
      "I used to struggle with forgetting some of the rules for my entries. I was able to get around it with the help of a simple solution - a green light button for entries. It is working in a few steps: check if my condition is met, change the color of the button to green if yes or...",
  },
  {
    title: "DAS Trader Pro – symbol notes",
    slug: "das-trader-pro-symbol-notes",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "04/07/2026",
    excerpt:
      "Often we need to put some notes on the symbols, being either warnings, whole trade plans, or just any other note. 3 types of notes — there are 3 types of notes as of today, if I do not count any text you can write into a button by editing it. Although it is a valid way, there...",
  },
  {
    title: "DAS Trader Pro – how to save the stop loss price value for later",
    slug: "das-trader-pro-how-to-save-the-stop-loss-price-value-for-later",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "03/23/2026",
    excerpt:
      "Everybody has experienced it. You enter a trade having automated stop loss or update the stop loss to the value you like, but then you mis-click in the orders window and lose the stop loss. Now you are pressured to retrieve it back to stay protected. Here is the solution for such cases. setvar() and getvar() functions as...",
  },
  {
    title: "DAS Trader Pro – Where to run the scripts code",
    slug: "das-trader-pro-where-to-run-the-scripts-code",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "03/09/2026",
    excerpt:
      "The stock market is a dynamic and constantly changing environment, and sometimes we might need to act differently in different situations and set some variable to a user defined value. This is where the input() function comes into play. To simply prompt the user for an input, we can call $Value=Input(\"Give me the value\",Value,1); Which...",
  },
  {
    title: "DAS Trader Pro – How to prompt for user input",
    slug: "das-trader-pro-how-to-prompt-for-user-input",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "03/02/2026",
    excerpt:
      "The stock market is a dynamic and constantly changing environment, and sometimes we might need to act differently in different situations and set some variable to a user defined value. This is where the input() function comes into play. To simply prompt the user for an input, we can call $Value=Input(\"Give me the value\",Value,1); Which gives us a prompt...",
  },
  {
    title: "DAS Trader Pro – Rounding",
    slug: "das-trader-pro-rounding",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "02/24/2026",
    excerpt:
      "Rounding function is a crucial part of the scripting in DAS Trader Pro because various technological rules apply: for symbols below $1 price, rounding to 3(4) decimals is required; for symbols above $1 price, rounding to 2 decimals is required; for options below $3, rounding to nearest 0.05 is required; for options above $3, rounding...",
  },
  {
    title: "DAS Trader Pro – universal exit hotkey function for all market hours",
    slug: "das-trader-pro-universal-exit-hotkey-function-for-all-market-hours",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "02/24/2026",
    excerpt:
      "This hotkey is useful for anyone exiting positions manually or just to have it at hand when things are going south or for advanced scripting when calling an Exit is needed at a specific situation or a specific price. The features of the universal Exit hotkey: one hotkey for seamless long and short execution. Intelligent detection and rounding...",
  },
  {
    title: "DAS Trader Pro – how to read the symbol properties",
    slug: "das-trader-pro-how-to-read-the-symbol-properties",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "02/24/2026",
    excerpt:
      "Symbol properties — sometimes we need to use a different approach for symbols that are on SSR or that are hard to borrow. For this purpose, the getquoteobj() function will retrieve all the information about the symbol. Note: the properties are being added with each version of DAS Trader Pro, so make sure you use the latest one...",
  },
  {
    title: "DAS Trader Pro – A universal entry hotkey with static risk",
    slug: "universal-entry-hotkey-with-static-risk-and-stop-loss-for-all-market-hours",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "01/26/2026",
    excerpt:
      "Imagine being able to handle trade entries without worrying about whether you're going long or short, trading during regular hours or extended sessions, or even the exact price of the stock. All you do is define your risk and hit the entry hotkey. For brokers like Guardian Trading, who support the LimitP stop route, that's...",
  },
  {
    title: "DAS Trader Pro – How to create alerts with hotkeys",
    slug: "das-trader-pro-how-to-create-alerts-with-hotkeys",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "01/05/2026",
    excerpt:
      "Adding a price alert quickly — if you need to add a price alert from the chart, the most efficient way is to do it with a script like this: $MYSYMB=$MONTAGE.SYMB; $MYALERT=NewAlertObj(); ... It can be a hotkey, a hot button or...",
  },
  {
    title: "DAS Trader Pro Autolocate with hotkeys",
    slug: "das-trader-pro-autolocate-with-hotkeys-2",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "12/04/2025",
    excerpt:
      "Since a few versions back, we have the possibility to use hotkey scripts to autolocate shares and submit the located shares to the orders. In this post, I will try to explain some of the techniques on how to make things easier. Let me describe the autolocate process a bit first. What is \"locate\"? To...",
  },
  {
    title: "DAS Trader Pro Stop loss orders",
    slug: "das-trader-pro-stop-loss-orders",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "12/01/2025",
    excerpt:
      "In the previous post, I showed how an automatic stop loss is placed after an entry. There are other situations when you might need to update the current stop loss, and there are different stop loss types too. Stop types — these are the stop types available in DAS Trader Pro with Guardian Trading: Market, Limit...",
  },
  {
    title: "Basic set of hotkeys for DAS Trader pro",
    slug: "basic-set-of-hotkeys-for-das-trader-pro",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "11/18/2025",
    excerpt:
      "Now that we have our DAS Trader Pro application prepared for advanced scripting, let's use it for some automated calculations and placing orders. Entry hotkeys — for simplicity, the following hotkeys use rounding to 2 decimals, which means that they are meant for symbols priced over $1. For sub-dollar symbols, rounding to 4 decimals is needed....",
  },
  {
    title: "How to prepare your DAS Trader Pro for advanced hotkeys scripting",
    slug: "how-to-prepare-your-das-trader-pro-for-advanced-hotkeys-scripting",
    category: "DAS Hotkeys",
    categorySlug: "das-hotkeys",
    date: "11/10/2025",
    excerpt:
      "DAS Trader Pro is a trading platform in constant development, while the documentation of the new features is often lagging behind, the new features exist and can make traders lives much easier. There are many reasons to chose DAS Trader Pro for your trading. The Risk controls feature is probably the most important one. The...",
    internal: true,
  },
  // Margin
  {
    title: "Regulation T – Reg T Margin",
    slug: "regulation-t-reg-t-margin",
    category: "Margin",
    categorySlug: "margin",
    date: "04/18/2023",
    readTime: "2m",
    excerpt:
      "Regulation T, or Reg T for short, is the Federal Reserve Board regulation governing the extension of credit from brokerage firms to investors. Also, financial regulators like the SEC and FINRA have also established rules regulating the extension of credit to investors. Brokerage firms can establish their own requirements as long as they are at...",
  },
  // Risk Management
  {
    title: "Risk vs. Reward",
    slug: "risk-vs-reward",
    category: "Risk Management",
    categorySlug: "risk-management",
    date: "03/17/2025",
    readTime: "3m",
    excerpt:
      "Traders spend a great deal of time building systems and strategies to gain an edge in the market. While finding the best entries and exits are an important part of trading and system building, it sometimes overshadows the more important element of risk vs. reward. The most successful long-time traders will tell you that what...",
  },
  // Short Selling
  {
    title: "Introduction to Short Sales Trading Scenarios",
    slug: "introduction-to-short-sales-trading-scenarios",
    category: "Short Selling",
    categorySlug: "short-selling",
    date: "11/19/2024",
    readTime: "5m",
    excerpt:
      "Below we will help you to identify different possible short sale scenarios. 1. Selling a Pullback in a Downtrend — this strategy involves short selling a stock after it has experienced a temporary rebound or pullback within an overall downward trend. The expectation is that the stock will resume its decline, allowing the trader to profit...",
  },
  // Tools
  {
    title: "Utilizing a Trading Simulator to Test Your Strategies in a Trading Desk Environment",
    slug: "utilizing-a-trading-simulator-to-test-your-strategies-in-a-trading-desk-environment",
    category: "Tools",
    categorySlug: "tools",
    date: "10/07/2025",
    readTime: "4m",
    excerpt:
      "Being part of a trading desk team demands a high level of understanding, quick decision-making ability and refined trading strategies. The financial market can often be unpredictable, with sudden fluctuations making it challenging for traders to consistently make profitable trades. This is where the concept of a trading simulator or back testing comes in handy....",
  },
  {
    title: "Uncovering the Prism of Fundamental Indicators",
    slug: "uncovering-the-prism-of-fundamental-indicators",
    category: "Tools",
    categorySlug: "tools",
    date: "12/10/2024",
    excerpt:
      "Cracking the Code of Fundamental Indicators — fundamental indicators refer to economic factors used to evaluate a business's health and its potential for long-term growth. These include revenues, earnings, future growth, return on equity, profit margins, and market share, among others. Analyzing these elements helps investors identify companies that are undervalued or overvalued, assisting them in...",
  },
  {
    title: "Leveraging Technical Indicators for Strategic Day Trading: Part 2",
    slug: "leveraging-technical-indicators-for-strategic-day-trading-part-2",
    category: "Tools",
    categorySlug: "tools",
    date: "12/03/2024",
    excerpt:
      "Technical indicators are mathematical calculations based on historic trading activity, such as price and volume. When applied to stock charts, these indicators can help to pinpoint potential market trends and patterns, offering insights into trading decisions. Besides, they give a numerical representation of various market aspects - momentum, trends, volatility, and market strength. For advanced...",
  },
  {
    title: "Leveraging Technical Indicators for Strategic Day Trading: A Guide for Advanced Traders",
    slug: "leveraging-technical-indicators-for-strategic-day-trading-a-guide-for-advanced-traders",
    category: "Tools",
    categorySlug: "tools",
    date: "11/26/2024",
    excerpt:
      "As you continue to broaden your trading portfolio, understanding and leveraging technical indicators becomes a crucial task. For day traders, in particular, the potency of these markers' application can make all the difference between a smart investment and a risky gamble. But what exactly are these indicators, and how can they be employed to maximum...",
  },
];

function toTimestamp(date: string): number {
  const [m, d, y] = date.split("/").map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function getPostsByCategory(categorySlug?: string): BlogPost[] {
  const filtered = categorySlug
    ? ALL_POSTS.filter((p) => p.categorySlug === categorySlug)
    : ALL_POSTS;
  return [...filtered].sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
}

export const POSTS_PER_PAGE = 4;

export interface PaginatedResult {
  posts: BlogPost[];
  totalPages: number;
  totalPosts: number;
  currentPage: number;
}

export function getPaginatedPosts(
  categorySlug?: string,
  page = 1
): PaginatedResult {
  const sorted = getPostsByCategory(categorySlug);
  const totalPosts = sorted.length;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const start = (safePage - 1) * POSTS_PER_PAGE;
  const posts = sorted.slice(start, start + POSTS_PER_PAGE);
  return { posts, totalPages, totalPosts, currentPage: safePage };
}

export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
