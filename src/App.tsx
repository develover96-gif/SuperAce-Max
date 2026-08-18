import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeaderBar } from './components/HeaderBar';
import { MultiplierBar } from './components/MultiplierBar';
import { ReelGrid } from './components/ReelGrid';
import { ControlBar } from './components/ControlBar';
import { FooterBar } from './components/FooterBar';
import { NavigationDrawer } from './components/NavigationDrawer';
import { VaultCoinFlyingCanvas } from './components/VaultCoinFlyingCanvas';
import { CardDefs } from './components/CardDefs';

// Modals
import { BuyBonusModal } from './components/modals/BuyBonusModal';
import { FreeSpinsIntroModal, FreeSpinsSummaryModal } from './components/modals/FreeSpinsCelebrationModal';
import { BigWinCelebration } from './components/modals/BigWinCelebration';
import { PaytableModal } from './components/modals/PaytableModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { BetSelectorModal } from './components/modals/BetSelectorModal';
import { AutoplayModal } from './components/modals/AutoplayModal';
import { VaultModal } from './components/modals/VaultModal';
import { TournamentModal } from './components/modals/TournamentModal';
import { VIPClubModal } from './components/modals/VIPClubModal';
import { WithdrawalInterceptModal } from './components/modals/WithdrawalInterceptModal';
import { JackpotModal } from './components/modals/JackpotModal';
import { DailyRewardModal } from './components/modals/DailyRewardModal';

// Utilities & Engines
import { executeSpin, generateInitialGrid } from './utils/mathEngine';
import { sound } from './utils/soundEngine';
import {
  BeginnerBoostData,
  GameMode,
  GridCell,
  SpinHistoryItem,
  TournamentData,
  VaultData,
  WaysHit,
} from './types';
import { BUY_BONUS_COST_CLASSIC, BUY_BONUS_COST_DELUXE } from './utils/symbols';

// Configurable timing parameters for game rhythm
const MULTIPLIER_STEP_DELAY_NORMAL = 1000;
const MULTIPLIER_STEP_DELAY_TURBO = 450;

export default function App() {
  // Mode Selection: 'classic' vs 'deluxe'
  const [gameMode, setGameMode] = useState<GameMode>('deluxe');

  // Game Balances & Bets
  const [balance, setBalance] = useState<number>(1000.0);
  const [level] = useState<number>(1);
  const [betAmount, setBetAmount] = useState<number>(1.0);
  const [currentWin, setCurrentWin] = useState<number>(0.0);
  const [displayedWin, setDisplayedWin] = useState<number>(0.0);
  const [isBalancePulsing, setIsBalancePulsing] = useState<boolean>(false);
  const [lastAddedWin, setLastAddedWin] = useState<number>(0);
  const [lastSpinWin, setLastSpinWin] = useState<number>(0);

  // 5-Column Grid State
  const [grid, setGrid] = useState<GridCell[][]>(() => generateInitialGrid('deluxe').grid);
  const [spinningColumns, setSpinningColumns] = useState<boolean[]>([false, false, false, false, false]);

  // Spin & Cascade Flow State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  const [spinCount, setSpinCount] = useState<number>(0);
  const [cascadeDepth, setCascadeDepth] = useState<number>(0);
  const [currentWaysHits, setCurrentWaysHits] = useState<WaysHit[]>([]);
  const [scattersCount, setScattersCount] = useState<number>(0);
  const [screenShakeClass, setScreenShakeClass] = useState<string>('');
  const [activeRippleColumns, setActiveRippleColumns] = useState<number[]>([]);
  const [activeRippleCells, setActiveRippleCells] = useState<{ col: number; row: number }[]>([]);
  const [rippleTriggerKey, setRippleTriggerKey] = useState<number>(0);
  const [isOverdriveActive, setIsOverdriveActive] = useState<boolean>(false);

  // Quick Stop & Promise tracking
  const quickStopRef = useRef<boolean>(false);
  const activeDelaysRef = useRef<(() => void)[]>([]);

  // Free Spins State
  const [isFreeSpinsActive, setIsFreeSpinsActive] = useState<boolean>(false);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
  const [freeSpinsTotal, setFreeSpinsTotal] = useState<number>(0);
  const [freeSpinsAccumulatedWin, setFreeSpinsAccumulatedWin] = useState<number>(0);

  // Settings & Toggles
  const [isTurbo, setIsTurbo] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoSpinsRemaining, setAutoSpinsRemaining] = useState<number>(0);

  // RH-1: Deluxe Vault State (Persistent Profit Locker)
  const [vaultData, setVaultData] = useState<VaultData>({
    balance: 42.5,
    totalDeposited: 42.5,
    totalHarvested: 0,
    nextUnlockTimestamp: Date.now() + 14 * 3600 * 1000,
    lockedProfitRate: 0.05,
    transactions: [
      {
        id: 'tx_init_1',
        timestamp: Date.now() - 3600 * 1000,
        amount: 25.0,
        type: 'DEPOSIT_BIG_WIN',
      },
      {
        id: 'tx_init_2',
        timestamp: Date.now() - 7200 * 1000,
        amount: 17.5,
        type: 'DEPOSIT_BIG_WIN',
      },
    ],
  });
  const [vaultDepositAnimKey, setVaultDepositAnimKey] = useState<number>(0);

  // RH-2: Real-Time Tournament State
  const [tournamentData, setTournamentData] = useState<TournamentData>({
    id: 'tourney_superace_deluxe',
    title: '৳50K High Roller Series',
    prizePool: 50000,
    firstPrize: 12500,
    endsInSeconds: 14200,
    playerRank: 3,
    playerScore: 4250,
    activeParticipants: 1842,
    entries: [
      { rank: 1, name: 'VegasViper99', score: 8400, prize: 12500, avatar: '👑' },
      { rank: 2, name: 'DiamondHands88', score: 6200, prize: 7500, avatar: '💎' },
      { rank: 3, name: 'You (Player)', score: 4250, prize: 5000, isPlayer: true, avatar: '⭐' },
      { rank: 4, name: 'ApexKing_SG', score: 3980, prize: 3500, avatar: '🔥' },
      { rank: 5, name: 'CyberAce77', score: 3410, prize: 2500, avatar: '⚡' },
      { rank: 6, name: 'LuckyDragon', score: 2850, prize: 1500, avatar: '🐉' },
      { rank: 7, name: 'GoldenFalcon', score: 2200, prize: 1000, avatar: '🦅' },
    ],
  });
  const [recentOvertakeMessage, setRecentOvertakeMessage] = useState<string | null>(null);

  // RH-4: Beginner Boost & VIP Club State
  const [boostData, setBoostData] = useState<BeginnerBoostData>({
    isActive: true,
    daysRemaining: 6,
    hoursRemaining: 18,
    pointsMultiplier: 2.0,
    loyaltyPoints: 3450,
    nextTierPoints: 5000,
    vipTier: 'Gold',
  });

  // Progressive Jackpot State
  const [jackpotValue, setJackpotValue] = useState<number>(128450.0);
  const [totalBetsPlaced, setTotalBetsPlaced] = useState<number>(0);
  const [hasJackpotIncrement, setHasJackpotIncrement] = useState<boolean>(false);
  const [isJackpotOpen, setIsJackpotOpen] = useState<boolean>(false);

  // Daily Reward State
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState<boolean>(false);
  const [dailyRewardAmount, setDailyRewardAmount] = useState<number>(0);
  const [dailyStreak, setDailyStreak] = useState<number>(1);

  // Modals Visibility
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isBuyBonusOpen, setIsBuyBonusOpen] = useState<boolean>(false);
  const [isFreeSpinsIntroOpen, setIsFreeSpinsIntroOpen] = useState<boolean>(false);
  const [awardedSpinsCount, setAwardedSpinsCount] = useState<number>(10);
  const [isFreeSpinsSummaryOpen, setIsFreeSpinsSummaryOpen] = useState<boolean>(false);
  const [isPaytableOpen, setIsPaytableOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBetSelectorOpen, setIsBetSelectorOpen] = useState<boolean>(false);
  const [isAutoplayModalOpen, setIsAutoplayModalOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isTournamentOpen, setIsTournamentOpen] = useState<boolean>(false);
  const [isVIPClubOpen, setIsVIPClubOpen] = useState<boolean>(false);
  const [isWithdrawalInterceptOpen, setIsWithdrawalInterceptOpen] = useState<boolean>(false);

  // Big Win Celebration Modal
  const [celebrationWinAmount, setCelebrationWinAmount] = useState<number>(0);

  // Spin History
  const [history, setHistory] = useState<SpinHistoryItem[]>([]);

  const isSpinningRef = useRef(isSpinning);
  isSpinningRef.current = isSpinning;

  // Sound sync
  useEffect(() => {
    sound.setMuted(isMuted);
  }, [isMuted]);

  // Ambient Progressive Jackpot Live Network Bets Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const microIncrement = Math.random() * 0.08 + 0.02;
      setJackpotValue((prev) => Number((prev + microIncrement).toFixed(2)));
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  // Rolling Win Display Counter optimized with requestAnimationFrame
  useEffect(() => {
    if (displayedWin === currentWin) return;
    
    let rafId: number;
    const startTime = performance.now();
    const startValue = displayedWin;
    const targetValue = currentWin;
    const duration = 600; // Total duration for rolling win increment

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Linear interpolation for smoother counter roll
      const nextValue = Number((startValue + (targetValue - startValue) * progress).toFixed(2));
      
      setDisplayedWin(nextValue);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [currentWin, displayedWin]);

  // RH-4 Init: Beginner Boost Countdown & Daily Reward Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setBoostData(prev => {
        if (!prev.isActive) return prev;
        let h = prev.hoursRemaining - 1;
        let d = prev.daysRemaining;
        if (h < 0) {
          h = 23;
          d = Math.max(0, d - 1);
        }
        return { ...prev, daysRemaining: d, hoursRemaining: h, isActive: d > 0 || h > 0 };
      });
    }, 3600000);

    const checkDailyReward = () => {
      const lastCollect = localStorage.getItem('superace_last_reward_time');
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (!lastCollect || now - parseInt(lastCollect) > oneDay) {
        const savedStreak = parseInt(localStorage.getItem('superace_daily_streak') || '0');
        const lastCollectTime = parseInt(lastCollect || '0');
        
        let newStreak = 1;
        if (lastCollectTime && now - lastCollectTime < oneDay * 2) {
          newStreak = Math.min(30, savedStreak + 1);
        }
        
        const baseReward = 50.0;
        const streakBonus = Math.min(5, 1 + (newStreak - 1) * 0.1);
        const finalAmount = baseReward * streakBonus;
        
        setDailyRewardAmount(finalAmount);
        setDailyStreak(newStreak);
        // Delay slightly for better UX on initial load
        setTimeout(() => setIsDailyRewardOpen(true), 2000);
      }
    };

    checkDailyReward();
    return () => clearInterval(timer);
  }, []);

  const handleCollectDailyReward = () => {
    setBalance(prev => Number((prev + dailyRewardAmount).toFixed(2)));
    localStorage.setItem('superace_last_reward_time', Date.now().toString());
    localStorage.setItem('superace_daily_streak', dailyStreak.toString());
    setIsDailyRewardOpen(false);
    sound.winChime(true);
    setVaultDepositAnimKey(Date.now());
  };

  // Quick Stop Handler
  const handleQuickStop = useCallback(() => {
    if (!isSpinningRef.current || quickStopRef.current) return;
    quickStopRef.current = true;
    sound.reelStop(4);
    if (activeDelaysRef.current.length > 0) {
      activeDelaysRef.current.forEach((resolveFn) => resolveFn());
      activeDelaysRef.current = [];
    }
    setSpinningColumns([false, false, false, false, false]);
  }, []);

  // Interruptible high-precision timer using requestAnimationFrame
  const waitDelay = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      if (quickStopRef.current) {
        resolve();
        return;
      }
      
      const startTime = performance.now();
      let resolved = false;

      const tick = (now: number) => {
        if (resolved) return;
        
        // Check if elapsed time met or quick stop triggered
        if (now - startTime >= ms || quickStopRef.current) {
          resolved = true;
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };
      
      requestAnimationFrame(tick);

      const canceler = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      activeDelaysRef.current.push(canceler);
    });
  }, []);

  // Mode Switcher Handler
  const handleToggleGameMode = (mode: GameMode) => {
    if (isSpinning) return;
    setGameMode(mode);
    sound.buttonClick();
    const { grid: newGrid } = generateInitialGrid(mode);
    setGrid(newGrid);
  };

  // Main Spin Execution Loop
  const handleSpin = useCallback(
    async (isBonusBuy = false, isDeluxeBonusBuy = false) => {
      if (isSpinningRef.current) return;

      const bonusBuyCost = isDeluxeBonusBuy
        ? betAmount * BUY_BONUS_COST_DELUXE
        : betAmount * BUY_BONUS_COST_CLASSIC;
      const spinCost = isBonusBuy ? bonusBuyCost : isFreeSpinsActive ? 0 : betAmount;

      if (!isFreeSpinsActive && balance < spinCost) {
        setAutoSpinsRemaining(0);
        setIsSettingsOpen(true);
        return;
      }

      // Deduct balance & contribute to progressive jackpot
      if (!isFreeSpinsActive) {
        setBalance((prev) => Number((prev - spinCost).toFixed(2)));
        if (spinCost > 0) {
          setTotalBetsPlaced((prev) => Number((prev + spinCost).toFixed(2)));
          const jackpotContrib = spinCost * 0.025;
          setJackpotValue((prev) => Number((prev + jackpotContrib).toFixed(2)));
          setHasJackpotIncrement(true);
          setTimeout(() => setHasJackpotIncrement(false), 700);
        }
      }

      quickStopRef.current = false;
      activeDelaysRef.current = [];
      const currentSpinIdx = spinCount + 1;
      setSpinCount(currentSpinIdx);
      setCascadeDepth(0);
      setCurrentWaysHits([]);
      setIsSpinning(true);
      setCurrentWin(0);
      setIsOverdriveActive(false);
      setComboMultiplier(isFreeSpinsActive ? (gameMode === 'deluxe' ? 2 : 2) : 1);
      sound.spinStart();

      // Start all 5 columns spinning
      setSpinningColumns([true, true, true, true, true]);

      // Calculate Math Engine Results
      const effectiveMode: GameMode = isDeluxeBonusBuy ? 'deluxe' : gameMode;
      const spinResult = executeSpin(
        betAmount,
        isFreeSpinsActive,
        isBonusBuy ? 3 : 0,
        effectiveMode,
        isDeluxeBonusBuy,
        currentSpinIdx
      );

      const delayPerCol = isTurbo ? 80 : 180;
      const initialSpinDuration = isTurbo ? 220 : 500;

      // Reel stop sequence: reveal each column's new symbols smoothly as it lands
      await waitDelay(initialSpinDuration);

      if (!quickStopRef.current) {
        for (let c = 0; c < 5; c++) {
          if (quickStopRef.current) {
            setGrid(spinResult.initialGrid);
            setSpinningColumns([false, false, false, false, false]);
            break;
          }
          await waitDelay(delayPerCol);
          setGrid((prevGrid) => {
            const next = [...prevGrid];
            next[c] = spinResult.initialGrid[c];
            return next;
          });
          setSpinningColumns((prev) => {
            const next = [...prev];
            next[c] = false;
            return next;
          });
          sound.reelStop(c);
        }
      } else {
        setGrid(spinResult.initialGrid);
        setSpinningColumns([false, false, false, false, false]);
      }

      // Ensure full initial grid is set and count scatters
      setGrid(spinResult.initialGrid);
      setScattersCount(spinResult.scattersCount);

      if (spinResult.scattersCount > 0) {
        sound.scatterLand(spinResult.scattersCount);
      }

      // Step-by-Step Cascades Execution
      let accumulatedWinThisSpin = 0;
      let maxMultiplierReached = isFreeSpinsActive ? 2 : 1;
      let hadExpandedJoker = false;

      if (spinResult.cascades.length > 0) {
        for (let stepIdx = 0; stepIdx < spinResult.cascades.length; stepIdx++) {
          const step = spinResult.cascades[stepIdx];

          // 1. Highlight winning payways (batched update)
          requestAnimationFrame(() => {
            setCascadeDepth(stepIdx + 1);
            setGrid(step.grid);
            setCurrentWaysHits(step.waysHits || []);
          });

          // Subtle delay before updating the multiplier to create a better progression rhythm
          await waitDelay(isTurbo ? MULTIPLIER_STEP_DELAY_TURBO : MULTIPLIER_STEP_DELAY_NORMAL);
          setComboMultiplier(step.comboMultiplier);
          maxMultiplierReached = Math.max(maxMultiplierReached, step.comboMultiplier);

          if (step.isOverdrive) {
            setIsOverdriveActive(true);
            sound.overdriveSurge(step.comboMultiplier);
          }

          accumulatedWinThisSpin += step.winAmount;
          setCurrentWin(Number(accumulatedWinThisSpin.toFixed(2)));

          // Check Golden Joker expansion in Deluxe mode
          if (
            step.expandedJokerCols &&
            step.expandedJokerCols.length > 0 &&
            effectiveMode === 'deluxe'
          ) {
            hadExpandedJoker = true;
            sound.goldenJokerExpand();
            setScreenShakeClass('animate-shake-big');
            setTimeout(() => setScreenShakeClass(''), 400);
          } else if (step.conversions.length > 0) {
            sound.goldWildMagicChime();
          }

          sound.winChime(step.winAmount >= betAmount * 2);

          const stepPause = quickStopRef.current ? 80 : isTurbo ? 220 : 650;
          await waitDelay(stepPause);

          // 2. Cascade explosion
          sound.cascadeExplode();
          setCurrentWaysHits([]);
          await waitDelay(quickStopRef.current ? 70 : isTurbo ? 160 : 350);

          // 3. Energy Ripple: new symbols drop into columns (batched update)
          if (step.nextGrid && step.droppedColumns && step.droppedColumns.length > 0) {
            requestAnimationFrame(() => {
              setGrid(step.nextGrid);
              setActiveRippleColumns(step.droppedColumns);
              setActiveRippleCells(step.droppedCells || []);
              setRippleTriggerKey(Date.now() + stepIdx);
            });
            sound.energyRipple(stepIdx + 1);

            const dropPause = quickStopRef.current ? 140 : isTurbo ? 280 : 680;
            await waitDelay(dropPause);
          }
        }
      }

      // Settle grid after all cascades finish
      if (spinResult.finalGrid) {
        setGrid(spinResult.finalGrid);
      }
      setCurrentWaysHits([]);
      setActiveRippleColumns([]);
      setActiveRippleCells([]);

      // Progressive Jackpot Teaser Shower
      if (spinResult.jackpotTeaserTriggered) {
        sound.jackpotTeaserDrop();
        setScreenShakeClass('animate-shake-mega');
        setTimeout(() => setScreenShakeClass(''), 800);
      }

      // Update last spin win
      setLastSpinWin(spinResult.totalWin);

      // Add total win to balance with gold glow pulse
      if (spinResult.totalWin > 0) {
        setBalance((prev) => Number((prev + spinResult.totalWin).toFixed(2)));
        setLastAddedWin(spinResult.totalWin);
        setIsBalancePulsing(true);
        setTimeout(() => {
          setIsBalancePulsing(false);
        }, 1500);

        if (isFreeSpinsActive) {
          setFreeSpinsAccumulatedWin((prev) => Number((prev + spinResult.totalWin).toFixed(2)));
        }

        // RH-1: Vault Lock (5% of Big Wins >= 20x bet)
        if (spinResult.totalWin >= betAmount * 20 && effectiveMode === 'deluxe') {
          const vaultDeposit = Number((spinResult.totalWin * 0.05).toFixed(2));
          setVaultData((prev) => ({
            ...prev,
            balance: Number((prev.balance + vaultDeposit).toFixed(2)),
            totalDeposited: Number((prev.totalDeposited + vaultDeposit).toFixed(2)),
            transactions: [
              {
                id: `tx_${Date.now()}`,
                timestamp: Date.now(),
                amount: vaultDeposit,
                type: 'DEPOSIT_BIG_WIN',
              },
              ...prev.transactions,
            ],
          }));
          setVaultDepositAnimKey(Date.now());
          sound.vaultDepositCoin();
        }

        // RH-2: Tournament Points Progression
        const earnedPoints = Math.round(
          10 + spinResult.cascades.length * 50 + (spinResult.totalWin >= betAmount * 20 ? 500 : 0)
        );
        setTournamentData((prev) => {
          const newScore = prev.playerScore + earnedPoints;
          let newRank = prev.playerRank;
          if (newScore > 6200 && prev.playerRank > 1) {
            newRank = 1;
            setRecentOvertakeMessage('🔥 You took 1st Place from VegasViper99 (+450 pts)!');
            sound.tournamentOvertake();
            setTimeout(() => setRecentOvertakeMessage(null), 4000);
          } else if (newScore > 5000 && prev.playerRank > 2) {
            newRank = 2;
            setRecentOvertakeMessage('⚡ You took 2nd Place (+350 pts)!');
            sound.tournamentOvertake();
            setTimeout(() => setRecentOvertakeMessage(null), 4000);
          }
          return {
            ...prev,
            playerScore: newScore,
            playerRank: newRank,
          };
        });

        // RH-4: VIP Loyalty Points Progression
        const earnedLoyalty = Math.round(earnedPoints * boostData.pointsMultiplier);
        setBoostData((prev) => {
          const newPoints = prev.loyaltyPoints + earnedLoyalty;
          let newTier = prev.vipTier;
          if (newPoints >= 5000) newTier = 'Platinum';
          else if (newPoints >= 1000) newTier = 'Gold';
          return {
            ...prev,
            loyaltyPoints: newPoints,
            vipTier: newTier,
          };
        });
      }

      // Record History
      setHistory((prev) => [
        {
          id: spinResult.spinId,
          timestamp: Date.now(),
          gameMode: effectiveMode,
          bet: betAmount,
          win: spinResult.totalWin,
          ways: 1024,
          cascadesCount: spinResult.cascades.length,
          maxMultiplier: maxMultiplierReached,
          isFreeSpin: isFreeSpinsActive,
          freeSpinsAwarded: spinResult.freeSpinsAwarded,
          isBonusBuy,
          hasExpandedJoker: hadExpandedJoker,
          hasMegaSymbol: spinResult.megaSymbols && spinResult.megaSymbols.length > 0,
        },
        ...prev.slice(0, 49),
      ]);

      // Check Big Win celebration
      const winMultiple = spinResult.totalWin / betAmount;
      if (winMultiple >= 15) {
        setCelebrationWinAmount(spinResult.totalWin);
        setScreenShakeClass('animate-shake-mega');
        setTimeout(() => setScreenShakeClass(''), 800);
      } else if (winMultiple >= 5) {
        setScreenShakeClass('animate-shake-big');
        setTimeout(() => setScreenShakeClass(''), 600);
      }

      // Free Rounds Awarded
      if (spinResult.freeSpinsAwarded > 0) {
        if (!isFreeSpinsActive) {
          setAwardedSpinsCount(spinResult.freeSpinsAwarded);
          setIsFreeSpinsIntroOpen(true);
          setAutoSpinsRemaining(0);
        } else {
          setFreeSpinsRemaining((prev) => prev + spinResult.freeSpinsAwarded);
          setFreeSpinsTotal((prev) => prev + spinResult.freeSpinsAwarded);
        }
      }

      if (isFreeSpinsActive) {
        const nextFsRemaining = freeSpinsRemaining - 1;
        setFreeSpinsRemaining(nextFsRemaining);

        if (nextFsRemaining <= 0) {
          setIsFreeSpinsActive(false);
          setTimeout(() => {
            setIsFreeSpinsSummaryOpen(true);
          }, 500);
        }
      } else if (autoSpinsRemaining > 0) {
        setAutoSpinsRemaining((prev) => prev - 1);
      }

      setIsSpinning(false);
    },
    [
      balance,
      betAmount,
      boostData.pointsMultiplier,
      freeSpinsRemaining,
      gameMode,
      isFreeSpinsActive,
      isTurbo,
      autoSpinsRemaining,
      spinCount,
      waitDelay,
    ]
  );

  // Autoplay Trigger
  useEffect(() => {
    if (
      isSpinning ||
      celebrationWinAmount > 0 ||
      isFreeSpinsIntroOpen ||
      isFreeSpinsSummaryOpen ||
      isBuyBonusOpen ||
      isVaultOpen ||
      isTournamentOpen ||
      isVIPClubOpen ||
      isWithdrawalInterceptOpen ||
      isJackpotOpen ||
      isBetSelectorOpen ||
      isAutoplayModalOpen ||
      isSettingsOpen ||
      isHistoryOpen ||
      isPaytableOpen ||
      isDailyRewardOpen
    )
      return;

    if (isFreeSpinsActive && freeSpinsRemaining > 0) {
      const timer = setTimeout(() => {
        handleSpin();
      }, isTurbo ? 600 : 1500);
      return () => clearTimeout(timer);
    }

    if (autoSpinsRemaining > 0) {
      const timer = setTimeout(() => {
        handleSpin();
      }, isTurbo ? 600 : 1500);
      return () => clearTimeout(timer);
    }
  }, [
    autoSpinsRemaining,
    freeSpinsRemaining,
    handleSpin,
    isBuyBonusOpen,
    isFreeSpinsActive,
    isFreeSpinsIntroOpen,
    isFreeSpinsSummaryOpen,
    isSpinning,
    isTournamentOpen,
    isTurbo,
    isVIPClubOpen,
    isVaultOpen,
    isWithdrawalInterceptOpen,
    isDailyRewardOpen,
  ]);

  const handleStartFreeSpins = () => {
    setIsFreeSpinsIntroOpen(false);
    setIsFreeSpinsActive(true);
    setFreeSpinsRemaining(awardedSpinsCount);
    setFreeSpinsTotal(awardedSpinsCount);
    setFreeSpinsAccumulatedWin(0);
    sound.buttonClick();
  };

  const handleConfirmBuyBonus = (isDeluxe: boolean) => {
    setIsBuyBonusOpen(false);
    sound.buttonClick();
    handleSpin(true, isDeluxe);
  };

  // Harvest Vault Dividend
  const handleHarvestVault = () => {
    if (vaultData.balance <= 0) return;
    const harvestAmount = vaultData.balance;
    setBalance((prev) => Number((prev + harvestAmount).toFixed(2)));
    setVaultData((prev) => ({
      ...prev,
      balance: 0,
      totalHarvested: Number((prev.totalHarvested + harvestAmount).toFixed(2)),
      transactions: [
        {
          id: `tx_${Date.now()}`,
          timestamp: Date.now(),
          amount: harvestAmount,
          type: 'DIVIDEND_HARVEST',
        },
        ...prev.transactions,
      ],
    }));
    sound.orchestralBigWinFanfare('big');
    setIsVaultOpen(false);
  };

  // Accept 50% Withdrawal Intercept Bonus
  const handleAcceptWithdrawalBonus = (bonusCredits: number) => {
    setBalance((prev) => Number((prev + bonusCredits).toFixed(2)));
    setIsWithdrawalInterceptOpen(false);
    sound.orchestralBigWinFanfare('mega');
  };

  return (
    <div
      className={`relative w-full h-[100dvh] max-w-[440px] mx-auto flex flex-col justify-between overflow-hidden text-[#fff6d8] font-['Georgia'] select-none ${screenShakeClass}`}
      style={{
        background:
          isFreeSpinsActive
            ? gameMode === 'deluxe'
              ? 'radial-gradient(ellipse at 50% 30%, #4a0720 0%, #150209 100%)'
              : 'radial-gradient(ellipse at 50% 30%, #3b0710 0%, #150205 100%)'
            : gameMode === 'deluxe'
            ? 'radial-gradient(ellipse at 50% 30%, #1a081a 0%, #060209 100%)'
            : 'radial-gradient(ellipse at 50% 30%, #12233c 0%, #071019 100%)',
        transition: 'background 1.2s ease-in-out',
      }}
    >
      {/* SVG Definitions for Royal Card Artwork */}
      <CardDefs />

      {/* Animated Coin Flight from Big Wins to Vault */}
      <VaultCoinFlyingCanvas triggerKey={vaultDepositAnimKey} />

      {/* Background Royal Damask Filigree with Animated Deluxe Glow */}
      <motion.div
        animate={
          isFreeSpinsActive
            ? {
                scale: [1.08, 1.13, 1.08],
                y: [-4, 3, -4],
                filter: 'saturate(1.35) brightness(1.1)',
              }
            : {
                scale: 1,
                y: 0,
                filter: 'saturate(1) brightness(1)',
              }
        }
        transition={{
          scale: { repeat: Infinity, duration: 6.5, ease: 'easeInOut' },
          y: { repeat: Infinity, duration: 5, ease: 'easeInOut' },
          filter: { duration: 1.2, ease: 'easeInOut' },
          default: { duration: 1.2, ease: 'easeInOut' },
        }}
        className="absolute inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      >
        {/* Animated Dynamic Image Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay filter blur-[1px] scale-105 animate-[bgZoomPan_25s_ease-in-out_infinite]"
          style={{ backgroundImage: `url('/src/assets/images/golden_empire_bg_1786913063676.jpg')` }}
        />
        {/* Pattern Layer */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              gameMode === 'deluxe'
                ? `radial-gradient(circle at 25px 25px, rgba(244,114,182,0.5) 2.5px, transparent 0)`
                : `radial-gradient(circle at 25px 25px, rgba(246,212,120,0.4) 2px, transparent 0)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b18]/85 via-[#04070d]/65 to-[#04070d]/95 shadow-[inset_0_0_150px_rgba(0,0,0,0.95)]" />
      </motion.div>

      {/* 1. Header Bar with Mode Switcher, Vault Button, Jackpot & Tournament Tickers */}
      <HeaderBar
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenBuyBonus={() => setIsBuyBonusOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenVIP={() => setIsVIPClubOpen(true)}
        gameMode={gameMode}
        onToggleGameMode={handleToggleGameMode}
        vaultBalance={vaultData.balance}
        vipTier={boostData.vipTier}
        isFreeSpinsActive={isFreeSpinsActive}
        hasVaultDepositAnim={vaultDepositAnimKey > 0}
      />

      {/* Overtake Toast alert if player just climbed rank */}
      <AnimatePresence>
        {recentOvertakeMessage && (
          <motion.div
            initial={{ y: -10, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 py-1 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 border border-emerald-300 rounded-full text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.6)] z-50 pointer-events-none whitespace-nowrap"
          >
            <div className="w-3 h-3 text-yellow-300 animate-bounce">🔥</div>
            <span>{recentOvertakeMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Multiplier Bar with Overdrive Support */}
      <MultiplierBar
        currentMultiplier={comboMultiplier}
        isFreeSpinsActive={isFreeSpinsActive}
        freeSpinsRemaining={freeSpinsRemaining}
        scattersCount={scattersCount}
        gameMode={gameMode}
        isOverdriveActive={isOverdriveActive}
      />

      {/* 4. 5x4 Reel Grid with Expanding Jokers & Cascades */}
      <ReelGrid
        grid={grid}
        spinningColumns={spinningColumns}
        waysHits={currentWaysHits}
        isSpinning={isSpinning}
        spinCount={spinCount}
        cascadeDepth={cascadeDepth}
        comboMultiplier={comboMultiplier}
        isFreeSpinsActive={isFreeSpinsActive}
        activeRippleColumns={activeRippleColumns}
        activeRippleCells={activeRippleCells}
        rippleTriggerKey={rippleTriggerKey}
        lastSpinWin={lastSpinWin}
        gameMode={gameMode}
        onQuickStop={handleQuickStop}
      />

      {/* 6. Control Bar */}
      <ControlBar
        balance={balance}
        bet={betAmount}
        win={currentWin}
        displayedWin={displayedWin}
        isBalancePulsing={isBalancePulsing}
        isSpinning={isSpinning}
        isTurbo={isTurbo}
        autoSpinsRemaining={autoSpinsRemaining}
        isFreeSpinsActive={isFreeSpinsActive}
        freeSpinsRemaining={freeSpinsRemaining}
        freeSpinsTotal={freeSpinsTotal}
        onSpin={() => handleSpin(false)}
        onBetChange={(b) => {
          setBetAmount(b);
          sound.buttonClick();
        }}
        onToggleTurbo={() => {
          setIsTurbo((prev) => !prev);
          sound.buttonClick();
        }}
        onOpenBetSelector={() => {
          if (!isSpinning && !isFreeSpinsActive) {
            setIsBetSelectorOpen(true);
            sound.buttonClick();
          }
        }}
        onOpenAutoplay={() => {
          if (!isSpinning && !isFreeSpinsActive) {
            setIsAutoplayModalOpen(true);
            sound.buttonClick();
          }
        }}
        onStopAutoplay={() => {
          setAutoSpinsRemaining(0);
          sound.buttonClick();
        }}
      />

      {/* 7. Footer Bar */}
      <FooterBar
        balance={balance}
        level={level}
        isBalancePulsing={isBalancePulsing}
        lastAddedWin={lastAddedWin}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        jackpotValue={jackpotValue}
        tournament={tournamentData}
        onOpenTournament={() => setIsTournamentOpen(true)}
        onTopUpBalance={() => {
          setBalance((prev) => Number((prev + 1000).toFixed(2)));
          sound.winChime(true);
        }}
      />

      {/* MODALS */}
      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenPaytable={() => setIsPaytableOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBuyBonus={() => setIsBuyBonusOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenTournament={() => setIsTournamentOpen(true)}
        onOpenVIP={() => setIsVIPClubOpen(true)}
        onOpenWithdrawal={() => setIsWithdrawalInterceptOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        onTopUpBalance={() => {
          setBalance((prev) => Number((prev + 1000).toFixed(2)));
          sound.winChime(true);
        }}
      />

      {/* Buy Bonus Modal */}
      <BuyBonusModal
        isOpen={isBuyBonusOpen}
        bet={betAmount}
        balance={balance}
        onClose={() => setIsBuyBonusOpen(false)}
        onConfirmBuy={handleConfirmBuyBonus}
      />

      {/* Free Spins Intro Modal */}
      <FreeSpinsIntroModal
        isOpen={isFreeSpinsIntroOpen}
        freeSpinsCount={awardedSpinsCount}
        onStartFreeSpins={handleStartFreeSpins}
      />

      {/* Free Spins Summary Modal */}
      <FreeSpinsSummaryModal
        isOpen={isFreeSpinsSummaryOpen}
        totalWin={freeSpinsAccumulatedWin}
        bet={betAmount}
        totalSpins={freeSpinsTotal}
        onClose={() => setIsFreeSpinsSummaryOpen(false)}
      />

      {/* Big Win Celebration */}
      <BigWinCelebration
        isOpen={celebrationWinAmount > 0}
        winAmount={celebrationWinAmount}
        bet={betAmount}
        onClose={() => setCelebrationWinAmount(0)}
        onComplete={() => setCelebrationWinAmount(0)}
      />

      {/* Paytable & Rules Modal */}
      <PaytableModal isOpen={isPaytableOpen} onClose={() => setIsPaytableOpen(false)} />

      {/* Spin History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        isTurbo={isTurbo}
        onToggleTurbo={() => setIsTurbo((prev) => !prev)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        onTopUpBalance={() => {
          setBalance((prev) => Number((prev + 1000).toFixed(2)));
          sound.winChime(true);
        }}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Bet Selector Modal */}
      <BetSelectorModal
        isOpen={isBetSelectorOpen}
        currentBet={betAmount}
        balance={balance}
        onSelectBet={(b) => setBetAmount(b)}
        onClose={() => setIsBetSelectorOpen(false)}
      />

      {/* Autoplay Modal */}
      <AutoplayModal
        isOpen={isAutoplayModalOpen}
        onSelectAutoSpins={(count) => setAutoSpinsRemaining(count)}
        onClose={() => setIsAutoplayModalOpen(false)}
      />

      {/* Deluxe Vault Modal (RH-1) */}
      <VaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        vaultData={vaultData}
        onHarvestDividend={handleHarvestVault}
      />

      {/* Live Tournament Modal (RH-2) */}
      <TournamentModal
        isOpen={isTournamentOpen}
        onClose={() => setIsTournamentOpen(false)}
        tournament={tournamentData}
      />

      {/* VIP Club Modal (RH-4) */}
      <VIPClubModal
        isOpen={isVIPClubOpen}
        onClose={() => setIsVIPClubOpen(false)}
        boostData={boostData}
      />

      {/* Progressive Jackpot Modal */}
      <JackpotModal
        isOpen={isJackpotOpen}
        onClose={() => setIsJackpotOpen(false)}
        jackpotValue={jackpotValue}
        totalBetsPlaced={totalBetsPlaced}
        betAmount={betAmount}
      />

      {/* Withdrawal Intercept Modal (RH-3) */}
      <WithdrawalInterceptModal
        isOpen={isWithdrawalInterceptOpen}
        withdrawalAmount={500}
        onClose={() => setIsWithdrawalInterceptOpen(false)}
        onAcceptBonusMatch={handleAcceptWithdrawalBonus}
        onConfirmWithdrawal={() => {
          setIsWithdrawalInterceptOpen(false);
          alert('Withdrawal request of ৳500.00 processed to your linked payment method.');
        }}
      />

      {/* Daily Reward Modal */}
      <DailyRewardModal
        isOpen={isDailyRewardOpen}
        onClose={() => setIsDailyRewardOpen(false)}
        rewardAmount={dailyRewardAmount}
        streakDays={dailyStreak}
        onCollect={handleCollectDailyReward}
      />
    </div>
  );
}
