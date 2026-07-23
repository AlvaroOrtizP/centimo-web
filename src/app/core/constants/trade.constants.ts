export interface AssetSuggestion {
  ticker: string;
  name: string;
}

/** Catálogo de activos populares para autocompletar en el formulario de trades. */
export const ASSET_SUGGESTIONS: Record<string, AssetSuggestion[]> = {
  crypto: [
    { ticker: 'BTC', name: 'Bitcoin' },
    { ticker: 'ETH', name: 'Ethereum' },
    { ticker: 'SOL', name: 'Solana' },
    { ticker: 'ADA', name: 'Cardano' },
    { ticker: 'DOT', name: 'Polkadot' },
  ],
  stock: [
    { ticker: 'AAPL', name: 'Apple' },
    { ticker: 'MSFT', name: 'Microsoft' },
    { ticker: 'GOOGL', name: 'Alphabet' },
    { ticker: 'AMZN', name: 'Amazon' },
    { ticker: 'NVDA', name: 'NVIDIA' },
  ],
  etf: [
    { ticker: 'VWCE', name: 'Vanguard FTSE All-World' },
    { ticker: 'VUSA', name: 'Vanguard S&P 500' },
    { ticker: 'CSPX', name: 'iShares S&P 500' },
    { ticker: 'IUSA', name: 'iShares Euro Stoxx 50' },
  ],
  index_fund: [],
};
