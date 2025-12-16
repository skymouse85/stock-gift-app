import { NextResponse } from "next/server";
import {
    restClient,
    GetStocksAggregatesTimespanEnum,
} from '@massive.com/client-js'
import { error } from "console";

const apiKey = process.env.Massive_API_Key;

if (!apiKey) {
    throw new Error('MASSIVE_API_KEY is not set in environemnt Variable. Get your shit together.');
}

const rest = restClient(apiKey);

//fetch 1D OHLC bar for a given date
async function getDailyBar(ticker:string, date: string) {
    const response = await rest.getStocksAggregates(
        ticker,
        1,
        GetStocksAggregatesTimespanEnum.Day,
        date,
        date
    );

    const data: any = (response as any).data ?? response;
    const results = data.results ?? [];

    if (!results.length) {
        throw new Error (
            `No Trading data for ${ticker} on ${date} (possible weekend or holiday).`
        );
    }

    const bar = results[0];

    return {
        open: bar.o,
        close: bar.c,
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {ticker, receiptDate, saleDate, shares} = body;

        if (!ticker || !receiptDate || !saleDate || !shares) {
            return NextResponse.json(
                {error: 'shares must be a positive number'},
                {status: 400}
            );
        }

    const sharesNum = Number(shares);
    if (Number.isNaN(sharesNum) || sharesNum <= 0) {
      return NextResponse.json(
        { error: 'shares must be a positive number.' },
        { status: 400 }
      );
    }
        const [receiptBar, saleBar] = await Promise.all([
            getDailyBar(ticker, receiptDate),
            getDailyBar(ticker, saleDate),
        ]);

        const avgReceipt = (receiptBar.open + receiptBar.close) / 2;
        const avgSale = (saleBar.open + saleBar.close) / 2;

        const round2 = (x: number) => Math.round(x * 100) / 100

        const fairMarketValuePerShareOnReceipt = round2(avgReceipt);
        const totalGiftValue = round2(avgReceipt * sharesNum);
        const salePricePerShare = round2(avgSale);
        const totalProceeds = round2(avgSale * sharesNum);
        const gainOrLoss = round2(totalProceeds - totalGiftValue);

       return NextResponse.json({
        ticker,
        shares: sharesNum,
        receiptDate,
        saleDate,
        prices: {
            receipt: {
                open: receiptBar.open,
                close: receiptBar.close,
                avg: fairMarketValuePerShareOnReceipt,
            },
            sale: {
                open: saleBar.open,
                close: saleBar.close,
                avg: salePricePerShare,
            },
        },
        values: {
            fairMarketValuePerShareOnReceipt,
            totalGiftValue,
            salePricePerShare,
            totalProceeds,
            gainOrLoss,
        },
       }); 
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            {error: err.message ?? 'Unexpected server error.'},
            { status: 500}
        );
    }
}