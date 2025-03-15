import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import "../../index.css";
import { RootState } from "../../redux/store";
import PremiumFallback from "./PremiumFallback";
import UserBets from "./UserBets";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface Statistics {
  _id: string;
  email: string;
  password: string;
  tier: string;
  username: string;
  statistics: {
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    totalProfit: number;
    initialInvestment: number;
    monthlyStats: MonthlyStat[];
    avgBetAmount: number;
    averageReturnOnInvestment: number;
  };
  updatedAt: string;
  defaultCurrency: string;
}

interface CurrentBet {
  match: String | null;
  tip: String | null;
  stake: number | null;
  odds: number | null;
  status: String;
}
interface MonthlyStat {
  month: string;
  profit: number;
  loss: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  avgBetAmount: number;
  bets: [];
}
enum Month {
  Januar = 0,
  Februar = 1,
  Mart = 2,
  April = 3,
  Maj = 4,
  Jun = 5,
  Jul = 6,
  Avgust = 7,
  Septembar = 8,
  Oktobar = 9,
  Novembar = 10,
  Decembar = 11,
}

export default function Statistics(): React.ReactNode {
  const currentUser = useSelector((state: RootState) => state.user); // The user, used to check if premium on the client.
  const [error, setError] = useState<{ message: string } | null>(null);
  const [bankCapital, setBankCapital] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentBet, setCurrentBet] = useState<CurrentBet | CurrentBet[]>({
    // Current bet the user is creating.
    match: null,
    tip: null,
    stake: null,
    odds: null,
    status: "active",
  });
  const [userStats, setUserStats] = useState<Statistics>(); // Statistics of the user account.
  const [betBuilder, setBetBuilder] = useState({
    // BetBuilder UI.
    status: "",
    visible: false,
    mode: "single",
  });

  const currentMonth = new Date().getMonth();
  const today = new Date().getDate();
  const currentMonthStats = userStats?.statistics?.monthlyStats[currentMonth];
  const JWT = localStorage.getItem("insajder_token");
  const defaultCurrency = userStats?.defaultCurrency;
  const [doughMode, setDoughMode] = useState<"monthly" | "all">("monthly");
  const [lineMode, setLineMode] = useState({ month: currentMonth, day: 0 }); // Main statistic you see, tracks when user switches to a specific day, 0 = whole month
  const [parlay, setParlay] = useState<CurrentBet[]>([]); // BetBuilder parlay mode items
  const [parlayStatus, setParlayStatus] = useState("active");
  const [areTodayBetsVisible, setAreTodayBetsVisible] = useState(false);

  const addToParlay = () => {
    // Adds an item to a parlay bet.
    if (!currentBet.tip || !currentBet.odds || !currentBet.match) {
      console.error("Invalid bet data. Cannot add to parlay.");
      return;
    }

    setParlay((prevParlay: any) => {
      const updatedParlay = [
        ...prevParlay,
        {
          tip: currentBet.tip,
          odds: currentBet.odds,
          match: currentBet.match,
        },
      ];

      return updatedParlay;
    });
  };
  const removeParlayItem = (index: number) => {
    // Removes an item from the parlay bet.
    setParlay((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index)
    );
  };
  const getDailyStats = () => {
    // Get statistics for the day chosen by the user and return as object.
    let winCount = 0;
    let lossCount = 0;
    let totalActives = 0;
    let profit = 0;

    const data =
      userStats?.statistics?.monthlyStats?.[lineMode?.month]?.bets?.[
        lineMode?.day
      ];

    // Return early if `data` doesn't exist
    if (!data) {
      return {
        totalWins: 0,
        totalLosses: 0,
        winPercentage: "0.00",
        profit: 0,
        totalActives: 0,
      };
    }

    if (Array.isArray(data)) {
      // If bet is a parlay bet
      data.forEach((bet) => {
        if (Array.isArray(bet)) {
          const status = bet[0]?.status;
          const stake = bet[0]?.stake;
          const totalOdds = bet[0]?.totalOdds;

          if (status === "win") {
            winCount += 1;
            profit += Number(((stake * totalOdds - stake) * 100) / 100);
          } else if (status === "loss") {
            lossCount += 1;
            profit -= stake;
          } else {
            totalActives += 1; // Active bet
          }
        } else {
          const status = bet?.status;
          const stake = bet?.stake;
          const odds = bet?.odds;

          if (status === "win") {
            winCount += 1;
            profit += Number(((stake * odds - stake) * 100) / 100);
          } else if (status === "loss") {
            lossCount += 1;
            profit -= stake;
          } else {
            totalActives += 1; // Active bet
          }
        }
      });
    }

    const totalBets = winCount + lossCount;

    const winPercentage =
      totalBets > 0 ? ((winCount / totalBets) * 100).toFixed(2) : "0.00";

    return {
      totalWins: winCount,
      totalLosses: lossCount,
      winPercentage,
      profit: Number(profit).toFixed(2),
      totalActives,
    };
  };

  const dailyStats = getDailyStats();

  const saveCurrentBet = async () => {
    // Saves the bet to the server
    if (
      !currentBet ||
      Object.values(currentBet).some((val) => val == null || val === "")
    ) {
      setBetBuilder((prev) => ({
        ...prev,
        status: "Došlo je do greške. Molimo popunite svako polje.",
      }));
      return;
    }

    if (parlay.length <= 1) {
      setBetBuilder((prev) => ({
        ...prev,
        status: "Molimo unesite barem 2 meča.",
      }));
      return;
    }
    const stake = Number(currentBet.stake);
    const odds = Number(currentBet.odds);
    if (stake >= 100000000 || odds >= 50000) {
      setBetBuilder((prev) => ({
        ...prev,
        status: "Došlo je do greške.",
      }));
      return;
    }

    setBetBuilder((prev) => ({ ...prev, status: "Azuriranje..." }));

    if (!currentBet || !currentBet.stake) {
      console.error("Invalid bet or stake.");
      return;
    }
    currentMonthStats.totalBets += 1; // Update the client
    userStats.statistics.totalBets += 1;
    if (betBuilder.mode === "single") {
      if (currentBet.status === "active" || currentBet.status === "loss") {
        userStats.statistics.initialInvestment -= currentBet.stake;
      } else {
        userStats.statistics.initialInvestment +=
          currentBet.stake * currentBet.odds - currentBet.stake;
      }
    }
    try {
      const uuid = uuidv4();
      const response = await fetch("http://localhost:1337/updateStatistics", {
        // Update the server
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body:
          betBuilder.mode === "single"
            ? JSON.stringify({
                // if we are saving a single bet
                updates: [
                  {
                    updatePath: "statistics.totalBets",
                    newValue: 1,
                    increment: true,
                    push: false,
                  },
                  {
                    updatePath: "statistics.initialInvestment",
                    newValue:
                      currentBet.status === "active" ||
                      currentBet.status === "loss"
                        ? -Number(currentBet.stake)
                        : Number(currentBet.stake) *
                          (Number(currentBet.odds) - 1),
                    increment: true,
                    push: false,
                  },
                  {
                    updatePath: `statistics.monthlyStats.${currentMonth}.bets.${today}`,
                    newValue: {
                      match: currentBet.match,
                      tip: currentBet.tip,
                      stake: currentBet.stake,
                      odds: currentBet.odds,
                      date: new Date().toLocaleDateString("en-us"),
                      status: currentBet.status,
                      betId: uuid,
                    },
                    increment: false,
                    push: true,
                  },
                  {
                    updatePath: `statistics.monthlyStats.${currentMonth}.totalBets`,
                    newValue: 1,
                    increment: true,
                    push: false,
                  },
                  ...(currentBet.status === "win"
                    ? [
                        {
                          updatePath: `statistics.monthlyStats.${currentMonth}.totalWins`,
                          newValue: 1,
                          increment: true,
                          push: false,
                        },
                      ]
                    : currentBet.status === "loss"
                    ? [
                        {
                          updatePath: `statistics.monthlyStats.${currentMonth}.totalLosses`,
                          newValue: 1,
                          increment: true,
                          push: false,
                        },
                      ]
                    : []),
                ],
              })
            : JSON.stringify({
                // if we are saving a parlay bet
                updates: [
                  {
                    updatePath: "statistics.totalBets",
                    newValue: 1,
                    increment: true,
                    push: false,
                  },
                  {
                    updatePath: "statistics.initialInvestment",
                    newValue:
                      parlayStatus === "active"
                        ? -Number(currentBet.stake)
                        : parlayStatus === "loss"
                        ? -Number(currentBet.stake)
                        : Number(currentBet.stake) *
                            parlay.reduce((t, e) => t * e.odds, 1) -
                          Number(currentBet.stake),
                    increment: true,
                    push: false,
                  },
                  {
                    updatePath: `statistics.monthlyStats.${currentMonth}.bets.${today}`,
                    newValue: [
                      {
                        parlayId: uuid,
                        stake: currentBet.stake,
                        status: parlayStatus,
                        infoObj: true,
                        date: new Date().toLocaleDateString("en-us"),
                        totalOdds: Math.ceil(
                          parlay.reduce((total, el) => total * el.odds, 1)
                        ),
                      },
                      ...parlay,
                    ],
                    increment: false,
                    push: true,
                  },
                  {
                    updatePath: `statistics.monthlyStats.${currentMonth}.totalBets`,
                    newValue: 1,
                    increment: true,
                    push: false,
                  },
                  ...(parlayStatus === "win"
                    ? [
                        {
                          updatePath: `statistics.monthlyStats.${currentMonth}.totalWins`,
                          newValue: 1,
                          increment: true,
                          push: false,
                        },
                      ]
                    : parlayStatus === "loss"
                    ? [
                        {
                          updatePath: `statistics.monthlyStats.${currentMonth}.totalLosses`,
                          newValue: 1,
                          increment: true,
                          push: false,
                        },
                      ]
                    : []),
                ],
              }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);
      setBetBuilder((prev) => ({
        ...prev,
        status: "Vasa opklada je uspesno sacuvana!",
      }));
    } catch (error) {
      console.error(error);
      setError({ message: "Doslo je do greske." });
    }
  };

  const getBets = (month: string, day: string, all: boolean) => {
    // Gets the bets used for UserBets component to show in a table.
    // All = get all user bets ever
    // Month + Day = specific date for the bet list
    // Month = monthly bets
    if (all) {
      let bets: any[] = [];

      userStats?.statistics?.monthlyStats?.forEach((month) => {
        if (Array.isArray(month?.bets)) {
          bets.push(...month.bets.flat().filter((bet) => bet));
        }
      });

      return bets;
    }

    if (month && day) {
      return userStats?.statistics.monthlyStats[month].bets[day];
    } else if (month) {
      return (
        userStats?.statistics?.monthlyStats[month].bets?.flatMap(
          (day) => day || []
        ) || []
      );
    }
  };
  const labels = Array.from({ length: 31 }, (_, index) => index);
  const getWinLossForGraph = () => {
    if (lineMode.day === 0) {
      // all

      const days = userStats?.statistics?.monthlyStats[lineMode.month].bets;
      var data = [];
      days?.map((day) => {
        if (!day) {
          data.push(0);
        } else {
          let winCount = 0;
          let lossCount = 0;

          day.map((bet) => {
            if (Array.isArray(bet)) {
              // parlay
              if (bet[0].status === "win") {
                winCount++;
              } else if (bet[0].status === "loss") {
                lossCount++;
              }
            } else {
              if (bet.status === "win") {
                winCount++;
              } else if (bet.status === "loss") {
                lossCount++;
              }
            }
          });

          const totalBets = winCount + lossCount;
          const percentage =
            totalBets > 0 ? Math.ceil((winCount / totalBets) * 100) : 0;
          data.push(percentage);
          console.log(percentage);
        }
      });
      return data;
    } else {
      // If user selected a specific day

      const dailyBets =
        userStats?.statistics?.monthlyStats[lineMode.month]?.bets[lineMode.day];
      if (!dailyBets)
        return {
          winCount: 0,
          lossCount: 0,
          totalBets: 0,
          winPercentage: 0,
          profit: 0,
        };

      let winCount = 0;
      let lossCount = 0;
      let totalBets = 0;
      let profit = 0;

      dailyBets.forEach((bet) => {
        if (!bet) return;

        if (Array.isArray(bet)) {
          // Handling parlays
          const allWon = bet.every((game) => game.status === "win");
          const anyLost = bet.some((game) => game.status === "loss");

          if (allWon) {
            winCount++;
            profit += bet.reduce(
              (acc, game) => acc + (game.stake * game.odds - game.stake),
              0
            );
          } else if (anyLost) {
            lossCount++;
            profit -= bet.reduce((acc, game) => acc + game.stake, 0);
          }

          totalBets++;
        } else {
          if (bet.status === "win") {
            winCount++;
            profit += bet.stake * bet.odds - bet.stake;
          } else if (bet.status === "loss") {
            lossCount++;
            profit -= bet.stake;
          }
          totalBets++;
        }
      });

      const winPercentage = totalBets > 0 ? (winCount / totalBets) * 100 : 0;
      return { winCount, lossCount, totalBets, winPercentage, profit };
    }
  };

  const winLossData = useMemo(
    () => getWinLossForGraph(),
    [userStats, lineMode.day, lineMode.month]
  );

  const chartData = {
    // Chart.js object data
    labels: lineMode.day ? [""] : labels, // Single day will use an empty label
    datasets: [
      {
        label: "% Pobede po danu",
        data: Array.isArray(winLossData)
          ? winLossData
          : [winLossData.totalBets],
        borderColor: "blue",
        backgroundColor: "rgba(0, 0, 255, 0.1)",
      },
    ],
  };

  const doughAllTime = {
    labels: ["Prolaznost", "Padovi"],
    datasets: [
      {
        data: [
          userStats?.statistics?.totalWins,
          userStats?.statistics?.totalLosses,
        ],
        backgroundColor: ["#4CAF50", "crimson"],
        borderWidth: 0,
      },
    ],
  };
  const doughMonthly = {
    labels: ["Prolaznost", "Padovi"],
    datasets: [
      {
        data: [currentMonthStats?.totalWins, currentMonthStats?.totalLosses],
        backgroundColor: ["#4CAF50", "crimson"],
        borderWidth: 0,
      },
    ],
  };
  const updateCapital = (val: number) => {
    if (val >= 20000000) {
      return;
    }
    setBankCapital(val);
  };

  const updateInitialCapital = () => {
    // If the user has just bought a premium, his money is at 0. when user chooses initial capital, we save the capital to the server.
    if (bankCapital) {
      fetch("http://localhost:1337/updateCapital", {
        headers: {
          Authorization: "Bearer " + JWT,
          "Content-Type": "application/json",
        },
        method: "PUT",
        body: JSON.stringify({
          initialInvestment: bankCapital,
        }),
      }).then((res) => {
        if (!res.ok) {
          setError({ message: "Doslo je do greske sa serverom." });
          return;
        }

        setError({
          message: `Vas pocetni kapital od ${bankCapital} ${defaultCurrency?.toUpperCase()} je uspesno sacuvan.`,
        });
      });
    }
  };
  useEffect(() => {
    document.title = "InsajderTips | Statistike";

    if (!currentUser.username || !JWT) {
      setError({
        message: "Doslo je do greske. Molimo da se ulogujete ponovo.",
      });
      return;
    }
    const { username } = currentUser;
    // Fetch statistics
    fetch("http://localhost:1337/statistics/" + username, {
      headers: { Authorization: "Bearer " + JWT },
    }).then((res) => {
      if (!res.ok) {
        setLoading(false);
        return;
      }
      res.json().then((json) => {
        setUserStats(json);

        setLoading(false);
      });
    });
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full justify-center items-center flex text-center">
        <span className="text-xl">Ucitavanje...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex justify-center items-center">
      {currentUser.tier === "free" ? (
        <div className="flex flex-col items-center text-center max-w-[80%] md:max-w-[60%] bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className=" text-white p-4 rounded-lg shadow-md mb-4 w-full">
            <PremiumFallback premiumType="Premium" />
          </div>

          <div className="font-bold text-xl text-white mb-4">
            Ova usluga Vam omogućava da pratite Vašu istoriju klađenja,
            analizirate statistiku uspešnosti Vaših tipova, i dobijete uvid u
            mesečni profit i gubitke. Pristupite detaljnim podacima koji će Vam
            pomoći da unapredite svoje klađenje!
          </div>
        </div>
      ) : (
        <div className="h-full w-[100%]  flex ml-auto md:mx-auto">
          <div className="my-2 w-full flex flex-col  ">
            {!userStats?.statistics?.initialInvestment ? (
              <div className="h-full w-full flex flex-col justify-center items-center p-6">
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] shadow-2xl border border-gray-700 rounded-2xl p-8 max-w-lg text-center">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Početni kapital nije postavljen
                  </h2>
                  <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    Da biste pravilno pratili svoju investiciju i ostvareni
                    profit, potrebno je da unesete svoj početni kapital.
                  </p>

                  <div className="w-full">
                    <input
                      type="number"
                      onChange={(e) => updateCapital(Number(e.target.value))}
                      placeholder={`Unesite kapital (${defaultCurrency?.toUpperCase()})`}
                      className="w-full border border-gray-600 bg-gray-800 text-white text-center text-lg p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] transition"
                    />
                    {bankCapital && bankCapital > 0 && (
                      <button
                        onClick={() => updateInitialCapital()}
                        className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold mt-4 rounded-lg py-3 transition-all"
                      >
                        Sačuvaj kapital
                      </button>
                    )}
                    {error && (
                      <p
                        className={`mt-4 text-sm p-3 rounded-lg ${
                          error.message.startsWith("Vas")
                            ? "bg-[#10b981] text-white"
                            : "bg-[#ef4444] text-white"
                        }`}
                      >
                        {error.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center relative">
                  <span className="testFont text-xl">
                    Moje Statistike kladjenja
                  </span>
                </div>
                <div className="max-w-full  px-4 gap-2 flex flex-col my-4 ">
                  <div className="flex gap-2 flex-col  min-[1000px]:flex-row">
                    {" "}
                    <div className="stat flex gap-x-2 bg-gray-800 px-4 py-2 rounded-sm grow ">
                      <div className="my-auto bg-blue-900/50 p-4 text-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                      </div>
                      <div className="flex flex-col justify-center bg-gray-800 p-2 rounded-md shadow-lg w-full">
                        <span className="font-bold text-2xl text-white">
                          {userStats?.statistics?.totalBets}
                        </span>
                        <span className="font-light text-sm text-gray-400">
                          Ukupno opklada
                        </span>
                      </div>
                    </div>
                    <div className="stat flex gap-x-2 bg-gray-800 px-4 py-2 rounded-sm grow">
                      <div className="my-auto bg-blue-900/50 p-4 text-md">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                      </div>
                      <div className="flex flex-col justify-center bg-gray-800 p-2 rounded-md shadow-lg w-full">
                        <span
                          className={`font-bold text-2xl  ${
                            userStats?.statistics?.initialInvestment > 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {Math.round(userStats?.statistics?.initialInvestment)}{" "}
                          {defaultCurrency}
                        </span>
                        <span className="font-light text-sm text-gray-400">
                          Ukupno Stanje
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-[95%] mx-auto  gap-2 0 p-4 ">
                  <div className="w-full h-fit flex gap-2  flex-col min-[1230px]:flex-row">
                    <div className="h-full w-full flex flex-col bg-gray-900 p-4 rounded-sm ">
                      <div className="flex justify-between items-center ">
                        <div className="font-bold text-sm md:text-md lg:text-xl w-full flex gap-x-4 flex-col md:flex-row md:justify-center  items-center md:w-max">
                          <span className="text-center">
                            Statistike meseca&nbsp;
                          </span>
                          <div className="w-full flex justify-around p-2">
                            <select
                              className="bg-gray-900 border-b w-max p-4"
                              onChange={(e: any) =>
                                setLineMode((prev) => ({
                                  ...prev,
                                  month: e.target.value,
                                }))
                              }
                            >
                              <option value={currentMonth}>
                                {Month[currentMonth]}
                              </option>{" "}
                              {Array.from(
                                { length: currentMonth },
                                (_, index) => (
                                  <option key={index} value={index}>
                                    {Month[index]}{" "}
                                  </option>
                                )
                              )}
                            </select>
                            <select
                              className="bg-gray-900 border-b w-max p-4"
                              value={lineMode.day}
                              onChange={(e: any) => {
                                const newDay = parseInt(e.target.value, 10);
                                setLineMode((prev) => ({
                                  ...prev,
                                  day: newDay,
                                }));
                              }}
                            >
                              <option value={0}>Ceo mesec</option>
                              {Array.from({ length: 31 }).map((_, index) => (
                                <option key={index} value={index + 1}>
                                  {index + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="h-full w-full ">
                        {userStats?.statistics?.monthlyStats[lineMode.month]
                          .totalBets <= 0 ? (
                          <div className="w-full h-full flex justify-center items-center bg-gray-900">
                            <div className="transform  text-xl font-semibold text-gray-300 bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-gray-600">
                              NEMATE OPKLADA ZA OVAJ MESEC.
                            </div>
                          </div>
                        ) : lineMode.day === 0 ? (
                          <div className="min-h-[500px]">
                            <Line
                              data={chartData}
                              options={{
                                maintainAspectRatio: false,

                                responsive: true,

                                scales: {
                                  x: {
                                    grid: {
                                      color: "rgba(255, 255, 255, 0.1)",
                                    },
                                    ticks: {
                                      color: "rgba(255, 255, 255, 0.8)",
                                      font: {
                                        size: 12,
                                        weight: "bold",
                                      },
                                    },
                                  },
                                  y: {
                                    grid: {
                                      color: "rgba(255, 255, 255, 0.1)",
                                    },
                                    ticks: {
                                      color: "rgba(255, 255, 255, 0.8)",
                                      font: {
                                        size: 12,
                                        weight: "bold",
                                      },
                                      callback: function (value) {
                                        return value + "%";
                                      },
                                    },
                                  },
                                },
                                plugins: {
                                  legend: {
                                    display: true,
                                    labels: {
                                      color: "rgba(255, 255, 255, 0.9)",
                                      font: {
                                        size: 14,
                                        weight: "bold",
                                      },
                                    },
                                  },
                                  tooltip: {
                                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                                    titleColor: "rgba(255, 255, 255, 0.9)",
                                    bodyColor: "rgba(255, 255, 255, 0.8)",
                                    borderColor: "rgba(255, 255, 255, 0.2)",
                                    borderWidth: 1,
                                    callbacks: {
                                      label: (tooltipItem) =>
                                        `${
                                          tooltipItem.label
                                        }: ${tooltipItem.raw.toFixed(2)}%`,
                                      title: function (tooltipItems, data) {
                                        return data;
                                      },
                                    },
                                  },
                                },
                                elements: {
                                  line: {
                                    tension: 0.3,
                                    borderWidth: 2,
                                  },
                                  point: {
                                    radius: 5,
                                    backgroundColor: "rgba(255, 255, 255, 1)",
                                    borderWidth: 2,
                                    borderColor: "rgba(0, 0, 0, 0.6)",
                                  },
                                },
                                layout: {
                                  padding: 20,
                                },
                                animations: {
                                  tension: {
                                    duration: 1000,
                                    easing: "easeOutQuad",
                                  },
                                },
                              }}
                            />
                          </div>
                        ) : chartData.datasets[0].data[0] > 0 ? (
                          chartData.datasets && (
                            <div className="flex flex-col w-full h-full  p-2">
                              <div className="flex items-center justify-center flex-col">
                                <div className="w-full h-full">
                                  <Bar
                                    data={{
                                      labels: [""],
                                      datasets: [
                                        {
                                          label: "Dobitni",
                                          data: [dailyStats.totalWins],
                                          backgroundColor: "green",
                                        },
                                        {
                                          label: "Aktivni",
                                          data: [dailyStats.totalActives],
                                          backgroundColor: "gray",
                                        },
                                        {
                                          label: "Gubitni",

                                          data: [dailyStats.totalLosses],

                                          backgroundColor: "red",
                                        },
                                      ],
                                    }}
                                    options={{
                                      scales: {
                                        y: {
                                          beginAtZero: true,
                                        },
                                      },
                                      responsive: true,
                                      maintainAspectRatio: false,
                                    }}
                                    className="w-full h-80 rounded-lg shadow-lg"
                                  />
                                </div>
                                <div className="w-full ">
                                  <div className="overflow-x-auto bg-bg-blue-900 rounded-lg shadow-lg">
                                    <table className="min-w-full table-auto text-sm border-2 rounded-lg mt-4">
                                      <thead className="bg-gray-800 text-white rounded-lg">
                                        <tr>
                                          <th className="py-2 px-4 text-left">
                                            <span>
                                              {`Statistike za ${lineMode.day} ${
                                                Month[lineMode.month]
                                              }`}
                                            </span>
                                          </th>
                                          <th className="py-2 px-4 text-left">
                                            Vrednost
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {/* Total Bets Row */}
                                        <tr>
                                          <td className="py-2 px-4 font-semibold">
                                            Ukupno opklada
                                          </td>
                                          <td className="py-2 px-4">
                                            {
                                              userStats?.statistics
                                                ?.monthlyStats[lineMode?.month]
                                                .bets[lineMode?.day].length
                                            }
                                          </td>
                                        </tr>
                                        {/* Win Percentage Row */}
                                        <tr>
                                          <td className="py-2 px-4 font-semibold">
                                            Dobitnih opklada
                                          </td>
                                          <td className="py-2 px-4">
                                            {dailyStats.totalWins}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="py-2 px-4 font-semibold">
                                            Gubitnih opklada
                                          </td>

                                          <td className="py-2 px-4">
                                            {dailyStats.totalLosses}
                                          </td>
                                        </tr>

                                        <tr>
                                          <td className="py-2 px-4 font-semibold">
                                            Ostvaren profit
                                          </td>

                                          <td
                                            className={`py-2 px-4 ${
                                              dailyStats.profit <= 0
                                                ? "text-red-500"
                                                : "text-green-500"
                                            }`}
                                          >
                                            {dailyStats.profit}{" "}
                                            {defaultCurrency}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td className="py-2 px-4 font-semibold">
                                            Procenat prolaza
                                          </td>
                                          <td className="py-2 px-4">
                                            {dailyStats.winPercentage}%
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>

                              <div className="overflow-x-auto max-h-[400px] flex flex-col w-full mt-3  relative">
                                <span
                                  className="text-xl font-bold cursor-pointer bg-gray-800 p-2 rounded-md hover:bg-gray-700 transition-colors duration-300 ease  flex justify-between text-gray-200 tracking-wide ml-3 py-3 sticky top-0 z-10"
                                  onClick={() =>
                                    setAreTodayBetsVisible(!areTodayBetsVisible)
                                  }
                                >
                                  Opklade ovog dana
                                  <span
                                    className={`${
                                      areTodayBetsVisible
                                        ? "rotate-90"
                                        : "rotate-0"
                                    } transition-transform duration-300 ease`}
                                  >{`<`}</span>
                                </span>

                                <div
                                  className={`overflow-y-auto transition-[max-height] duration-500 ease ${
                                    areTodayBetsVisible
                                      ? "max-h-[500px]"
                                      : "max-h-0"
                                  }`}
                                >
                                  <UserBets
                                    bets={getBets(
                                      lineMode.month,
                                      lineMode.day,
                                      null
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="flex font-bold text-xl justify-center items-center w-full h-full  min-h-[200px]">
                            <span className=" shadow-md ">
                              Nemate opklada za ovaj dan.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex bg-gray-900 p-4 rounded-lg flex-col h-full ">
                      <div className="bg-gray-900 rounded-md p-4 flex flex-col h-max">
                        <div className="flex justify-between items-center mb-4 h-max">
                          {/* Title */}
                          <div className="font-bold text-xl">
                            {doughMode === "all"
                              ? "Celokupne statistike"
                              : "Statistike ovog meseca"}
                          </div>
                        </div>

                        {doughMode === "all" ? (
                          <div>
                            <div className="w-full flex justify-center">
                              <Doughnut
                                data={doughAllTime}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                }}
                              />
                            </div>

                            <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
                              <div className="bg-gray-700 p-4 rounded-lg mb-4 hover:bg-gray-600 transition-colors duration-300">
                                <p className="text-lg font-semibold">
                                  {currentMonthStats?.totalBets} opklada.
                                </p>
                              </div>
                              <div className="bg-green-700 p-4 rounded-lg mb-4 hover:bg-green-600 transition-colors duration-300">
                                <p className="text-sm">
                                  {currentMonthStats?.totalWins} dobitnih
                                  opklada.
                                </p>
                              </div>
                              <div className="p-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors duration-300">
                                <p className="text-sm">
                                  {currentMonthStats?.totalLosses} gubitnih
                                  opklada.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="w-full p-4 ">
                              <Doughnut
                                data={doughMonthly}
                                options={{
                                  maintainAspectRatio: false,
                                  responsive: true,
                                }}
                              />
                            </div>

                            <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
                              <div className="bg-gray-700 p-4 rounded-lg mb-4 hover:bg-gray-600 transition-colors duration-300">
                                <p className="text-lg font-semibold">
                                  {currentMonthStats?.totalBets} opklada.
                                </p>
                              </div>

                              <div className="bg-green-700 p-4 rounded-lg mb-4 hover:bg-green-600 transition-colors duration-300">
                                <p className="text-sm">
                                  {currentMonthStats?.totalWins} dobitnih
                                  opklada.
                                </p>
                              </div>

                              <div className="p-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors duration-300">
                                <p className="text-sm">
                                  {currentMonthStats?.totalLosses} gubitnih
                                  opklada.
                                </p>
                              </div>
                              <div></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[400px] w-full relative">
                    {/* Sticky Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-700 shadow-md rounded-t-lg z-10 flex justify-center items-center py-4">
                      <span className="text-xl font-bold text-gray-200 tracking-wide ">
                        Poslednje opklade
                      </span>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto max-h-[360px]">
                      <UserBets
                        bets={getBets(lineMode.month, lineMode.day, null)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            className="cursor-pointer absolute bottom-4 right-4 flex items-center gap-2 rounded-lg px-4 py-2 bg-blue-500/80 hover:bg-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 group z-50"
            onClick={() =>
              !betBuilder.visible &&
              setBetBuilder((prev) => ({ ...prev, visible: true }))
            }
          >
            <span className="transition-all duration-300 group-hover:mr-1">
              Dodaj Opkladu
            </span>
            <div className="w-6 h-6 flex items-center justify-center bg-white/20 rounded-full text-lg group-hover:bg-white/30 transition-all duration-300">
              ➕
            </div>
          </button>

          {betBuilder.visible && (
            <div className="z-50 starting:-translate-x-[100vw] transition-transform duration-500  absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 p-6 rounded-xl shadow-xl shadow-black/60 w-[90%] md:w-[70%]">
              <div className="text-center text-white font-semibold text-2xl mb-5">
                Kreiraj opkladu
              </div>
              <div className="w-full justify-center my-4 items-center flex gap-x-4">
                <span
                  onClick={() =>
                    betBuilder.mode != "single" &&
                    setBetBuilder((prev) => ({ ...prev, mode: "single" }))
                  }
                  className={`rounded-full bg-gray-800 p-3 cursor-pointer ${
                    betBuilder.mode === "single" && "bg-green-900"
                  }`}
                >
                  Singl
                </span>
                <span
                  onClick={() =>
                    betBuilder.mode != "parlay" &&
                    setBetBuilder((prev) => ({ ...prev, mode: "parlay" }))
                  }
                  className={`rounded-full  p-3 cursor-pointer ${
                    betBuilder.mode === "parlay" && "bg-blue-500"
                  }`}
                >
                  Sistem
                </span>
              </div>
              <div>
                <div className="flex gap-x-3 items-center mb-4">
                  <span className="text-white w-20">Meč: </span>{" "}
                  <input
                    onChange={(e) =>
                      setCurrentBet((prev: any) => ({
                        ...prev,
                        match: e.target?.value,
                      }))
                    }
                    type="text"
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
                    placeholder="Unesite meč"
                  />
                </div>

                {/* Tip Input */}
                <div className="flex gap-x-3 items-center mb-4">
                  <span className="text-white w-20">Tip: </span>{" "}
                  <input
                    onChange={(e) =>
                      setCurrentBet((prev: any) => ({
                        ...prev,
                        tip: e.target?.value,
                      }))
                    }
                    type="text"
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
                    placeholder="Unesite tip"
                  />
                </div>

                {/* Odds Input */}
                <div className="flex gap-x-3 items-center mb-4">
                  <span className="text-white w-20">Kvota: </span>{" "}
                  <input
                    type="number"
                    onChange={(e) =>
                      setCurrentBet((prev: any) => ({
                        ...prev,
                        odds: e.target?.value,
                      }))
                    }
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
                    placeholder="Unesite kvotu"
                  />
                </div>

                <div className="flex gap-x-3 items-center mb-4">
                  {betBuilder.mode === "single" && (
                    <>
                      {" "}
                      <span className="text-white w-20">Ulog: </span>{" "}
                      <input
                        type="number"
                        onChange={(e) =>
                          setCurrentBet((prev: any) => ({
                            ...prev,
                            stake: e.target?.value,
                          }))
                        }
                        className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
                        placeholder="Unesite ulog"
                      />
                    </>
                  )}
                </div>
                {betBuilder.mode === "parlay" && <hr />}
                <div className="flex flex-col items-center space-y-4">
                  {betBuilder.mode === "single" && (
                    <div className="flex items-center gap-4 w-full justify-center">
                      <span className="text-white font-bold w-24 text-right">
                        Status:
                      </span>

                      <select
                        className={`bg-gray-900 p-2 rounded-md font-bold ${
                          currentBet?.status === "win"
                            ? "text-green-500"
                            : currentBet?.status === "loss"
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                        value={currentBet?.status}
                        onChange={(e) =>
                          setCurrentBet((prev: any) => ({
                            ...prev,
                            status: e?.target?.value,
                          }))
                        }
                      >
                        <option
                          className="text-gray-500 font-bold"
                          value="active"
                        >
                          Aktivan
                        </option>
                        <option
                          className="text-green-500 font-bold"
                          value="win"
                        >
                          Dobitan
                        </option>
                        <option className="text-red-500 font-bold" value="loss">
                          Gubitan
                        </option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-x-4 flex-col">
                  {betBuilder.status != "" && (
                    <span
                      className={`${
                        betBuilder.status.startsWith("V")
                          ? "text-green-500"
                          : "text-red-500"
                      } font-bold`}
                    >
                      {betBuilder.status}
                    </span>
                  )}
                  <div className="flex justify-center gap-x-4 my-4">
                    {betBuilder.mode === "single" ? (
                      <button
                        className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 transition duration-200 cursor-pointer"
                        onClick={saveCurrentBet}
                      >
                        Kreiraj
                      </button>
                    ) : (
                      <button
                        onClick={() => addToParlay()}
                        className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer"
                      >
                        Dodaj
                      </button>
                    )}

                    <button
                      className="bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition duration-200 cursor-pointer"
                      onClick={() => {
                        setCurrentBet(null);
                        setBetBuilder((prev) => ({ ...prev, visible: false }));
                      }}
                    >
                      Otkazati
                    </button>
                  </div>
                  {betBuilder.mode === "parlay" && parlay.length > 0 && (
                    <>
                      <table className="min-w-full table-auto text-sm border-2 rounded-lg my-4">
                        <thead className="bg-gray-800 text-white rounded-lg">
                          <tr>
                            <th className="py-2 px-4 text-left">
                              <span>
                                {`Sistem ${parlay.length}/` + parlay.length}
                              </span>
                            </th>
                            <th className="py-2 px-4 text-left">Tip</th>
                            <th className="py-2 px-4 text-left">Kvota</th>
                            <th
                              onClick={() => setParlay([])}
                              className="flex justify-end pr-4 pt-2 cursor-pointer"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="crimson"
                                className="size-6 cursor-pointer"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                              <span>Sve</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {parlay.map((bet, index) => (
                            <tr key={index}>
                              <td className="py-2 px-4">{bet.match}</td>
                              <td className="py-2 px-4">{bet.tip}</td>
                              <td className="py-2 px-4">{bet.odds}</td>
                              <td
                                className="flex justify-end pr-2"
                                onClick={() => removeParlayItem(index)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="1.5"
                                  stroke="crimson"
                                  className="size-6 cursor-pointer"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                  />
                                </svg>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div>
                        {betBuilder.mode === "parlay" && (
                          <div className=" flex justify-center items-center gap-x-2 h-full text-center flex-col">
                            <div className=" w-[100%] flex my-2 ml-6">
                              Ukupna kvota:{" "}
                              {parlay
                                .reduce((total, el) => total * el.odds, 1)
                                .toFixed(2)}
                            </div>
                            <select
                              onChange={(e) => {
                                setParlayStatus(e.target.value);
                              }}
                              className={`bg-gray-900 p-2 font-bold flex w-max   ${
                                parlayStatus === "win"
                                  ? "text-green-500"
                                  : parlayStatus === "loss"
                                  ? "text-red-500"
                                  : "text-gray-500"
                              }`}
                            >
                              <option
                                className="text-gray-500 font-bold"
                                value="active"
                              >
                                Aktivan
                              </option>
                              <option
                                className="text-green-500 font-bold"
                                value="win"
                              >
                                Dobitan
                              </option>
                              <option
                                className="text-red-500 font-bold"
                                value="loss"
                              >
                                Gubitan
                              </option>
                            </select>
                            <div className=" w-full flex items-center gap-x-2">
                              <span className="text-white w-20">Ulog </span>{" "}
                              <input
                                type="number"
                                onChange={(e) =>
                                  setCurrentBet((prev: any) => ({
                                    ...prev,
                                    stake: e.target?.value,
                                  }))
                                }
                                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
                                placeholder="Unesite ukupan ulog"
                              />
                              {parlay.length >= 1 && (
                                <button
                                  className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 transition duration-200 cursor-pointer"
                                  onClick={saveCurrentBet}
                                >
                                  Kreiraj
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
