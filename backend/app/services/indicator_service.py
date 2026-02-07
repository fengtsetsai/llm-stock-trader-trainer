"""
Technical indicator calculation service using ta library.
"""

import logging
from typing import List, Optional

import pandas as pd
from ta.trend import SMAIndicator, MACD
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands

logger = logging.getLogger(__name__)


class IndicatorService:
    """Calculate technical indicators on OHLCV data."""

    def calculate_all_indicators(
        self,
        df: pd.DataFrame,
        ma_periods: Optional[List[int]] = None,
        rsi_period: int = 14,
        macd_fast: int = 12,
        macd_slow: int = 26,
        macd_signal: int = 9,
        bb_period: int = 20,
        bb_std: float = 2.0,
    ) -> pd.DataFrame:
        """
        Calculate all indicators on DataFrame with OHLCV columns.

        Args:
            df: DataFrame with columns: Open, High, Low, Close, Volume
            ma_periods: List of MA periods to calculate (default: [10, 20, 50])
            rsi_period: RSI period (default: 14)
            macd_fast: MACD fast period (default: 12)
            macd_slow: MACD slow period (default: 26)
            macd_signal: MACD signal period (default: 9)
            bb_period: Bollinger Bands period (default: 20)
            bb_std: Bollinger Bands standard deviation (default: 2.0)

        Returns:
            DataFrame with added indicator columns:
                - ma_10, ma_20, ma_50, etc.
                - rsi
                - macd, macd_signal, macd_histogram
                - bb_upper, bb_middle, bb_lower
        """
        if ma_periods is None:
            ma_periods = [10, 20, 50]

        # Create a copy to avoid modifying the original
        df = df.copy()

        try:
            # Moving Averages
            for period in ma_periods:
                sma_indicator = SMAIndicator(close=df["Close"], window=period)
                df[f"ma_{period}"] = sma_indicator.sma_indicator()

            # RSI
            rsi_indicator = RSIIndicator(close=df["Close"], window=rsi_period)
            df["rsi"] = rsi_indicator.rsi()

            # MACD
            macd_indicator = MACD(
                close=df["Close"],
                window_fast=macd_fast,
                window_slow=macd_slow,
                window_sign=macd_signal,
            )
            df["macd"] = macd_indicator.macd()
            df["macd_signal"] = macd_indicator.macd_signal()
            df["macd_histogram"] = macd_indicator.macd_diff()

            # Bollinger Bands
            bb_indicator = BollingerBands(
                close=df["Close"], window=bb_period, window_dev=bb_std
            )
            df["bb_upper"] = bb_indicator.bollinger_hband()
            df["bb_middle"] = bb_indicator.bollinger_mavg()
            df["bb_lower"] = bb_indicator.bollinger_lband()

            logger.info(
                f"Calculated indicators for {len(df)} rows: "
                f"MA{ma_periods}, RSI({rsi_period}), "
                f"MACD({macd_fast},{macd_slow},{macd_signal}), "
                f"BB({bb_period},{bb_std})"
            )

        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            # Return df as-is if calculation fails
            return df

        return df


# Global instance
indicator_service = IndicatorService()
