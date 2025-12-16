'use client';

import { FormEvent, useState } from "react";

type ValuationResult = {
  ticker: string;
  shares: number;
  receiptDate: string;
  saleDate: string;
  prices: {
    receipt: { open: number; close: number; avg: number };
    sale: { open: number; close: number; avg: number };
  };
  values: {
    fairMarketValuePerShareOnReceipt: number;
    totalGiftValue: number;
    salePricePerShare: number;
    totalProceeds: number;
    gainOrLoss: number;
  };
};

export default function HomePage() {
  const [ticker, setTicker] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValuationResult | null>(null);


 async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/gift-valuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(),
          receiptDate,
          saleDate,
          shares: parseFloat(shares),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-6 bg-slate-50">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-xl p-6 mt-8">
        <h1 className="text-2xl font-semibold mb-4">
          Stock Gift Valuation
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter a stock symbol, the date of receipt, the date of sale, and the
          number of shares. The app will calculate fair market value on the
          receipt date (average of open and close), actual gift value, and
          gain/loss at sale.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Stock symbol
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="AAPL"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Date of receipt
              </label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Date of sale
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Number of shares
            </label>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white disabled:opacity-60"
          >
            {loading ? 'Calculating…' : 'Calculate'}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Results</h2>
            <p className="text-sm mb-2">
              <strong>{result.ticker}</strong> · {result.shares} shares
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium mb-1">Receipt ({result.receiptDate})</h3>
                <p>Open: ${result.prices.receipt.open.toFixed(2)}</p>
                <p>Close: ${result.prices.receipt.close.toFixed(2)}</p>
                <p>
                  Avg (FMV per share): $
                  {result.values.fairMarketValuePerShareOnReceipt.toFixed(2)}
                </p>
                <p>
                  Total gift value: ${result.values.totalGiftValue.toFixed(2)}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Sale ({result.saleDate})</h3>
                <p>Open: ${result.prices.sale.open.toFixed(2)}</p>
                <p>Close: ${result.prices.sale.close.toFixed(2)}</p>
                <p>
                  Avg sale price per share: $
                  {result.values.salePricePerShare.toFixed(2)}
                </p>
                <p>
                  Total proceeds: ${result.values.totalProceeds.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 text-sm">
              <p>
                <strong>
                  {result.values.gainOrLoss >= 0 ? 'Net gain' : 'Net loss'}:
                </strong>{' '}
                ${Math.abs(result.values.gainOrLoss).toFixed(2)}
              </p>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              This tool provides an informational valuation based on historical
              price data (average of open and close). For tax reporting, confirm
              methodology with your accountant or legal advisor.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}