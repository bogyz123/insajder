import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function UserBets({
  bets,
  readOnly,
  userStats,
}: {
  bets: any;
  readOnly: boolean;
  userStats: any;
}): React.ReactNode {
  // This component renders the <bets> inside of a table that also has Editor built in.

  const [openParlayIndex, setOpenParlayIndex] = useState<number | null>(null);
  const [editor, setEditor] = useState({
    visible: false,
    parlay: false,
    bet: null,
    newStatus: "active",
    editorStatus: null,
  });

  const JWT = localStorage.getItem("insajder_token") || "";

  const toggleParlay = (index: number) => {
    setOpenParlayIndex(openParlayIndex === index ? null : index);
  };
  const openEditor = (bet) => {
    // Opens the bet editor
    setEditor((prev) => ({
      ...prev,
      visible: true,
      bet: bet,
      parlay: Array.isArray(bet),
      newStatus: Array.isArray(bet) ? bet[0].status : bet.status,
    }));
  };
  const closeEditor = () => {
    setEditor((prev) => ({ ...prev, bet: null, visible: false }));
  };
  const saveChanges = () => {
    // Saves the bet editor data to the server (updates it)
    const previousStatus = editor.parlay
      ? editor.bet[0].status
      : editor.bet.status;
    if (editor.newStatus && editor.newStatus != previousStatus) {
      var updates = [];
      const stake = editor.parlay ? editor.bet[0].stake : editor.bet.stake;
      const odds = editor.parlay ? editor.bet[0].totalOdds : editor.bet.odds;
      const [month, day] = editor.parlay
        ? editor.bet[0].date.split("/")
        : editor.bet.date.split("/");
      // Above, we got all the data we need, if we are editing a parlay, the info is stored in the first object of the array of bets.
      // If we are editing a single, it's directly in the object.

      var updates = [];

      // Check all possible scenarios
      if (previousStatus === "active" && editor.newStatus === "win") {
        updates.push({
          updatePath: `statistics.initialInvestment`,
          newValue: stake * odds,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.totalWins`,
          newValue: 1,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.monthlyStats.${month - 1}.totalWins`,
          newValue: 1,
          increment: true,
          push: false,
        });
      } else if (previousStatus === "active" && editor.newStatus === "loss") {
        updates.push({
          updatePath: `statistics.totalLosses`,
          newValue: 1,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.monthlyStats.${month - 1}.totalLosses`,
          newValue: 1,
          increment: true,
          push: false,
        });
      } else if (previousStatus === "win" && editor.newStatus === "active") {
        updates.push({
          updatePath: `statistics.initialInvestment`,
          newValue: -stake * odds,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.totalWins`,
          newValue: -1,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.monthlyStats.${month - 1}.totalWins`,
          newValue: -1,
          increment: true,
          push: false,
        });
      } else if (previousStatus === "win" && editor.newStatus === "loss") {
        updates.push({
          updatePath: `statistics.initialInvestment`,
          newValue: -stake * odds,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.monthlyStats.${month - 1}.totalWins`,
          newValue: -1,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.totalWins`,
          newValue: -1,
          increment: true,
          push: false,
        });

        updates.push({
          updatePath: `statistics.totalLosses`,
          newValue: 1,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.monthlyStats.${month - 1}.totalLosses`,
          newValue: 1,
          increment: true,
          push: false,
        });
      } else if (previousStatus === "loss" && editor.newStatus === "active") {
        updates.push({
          updatePath: `statistics.totalLosses`,
          newValue: -1,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.monthlyStats.${month - 1}.totalLosses`,
          newValue: -1,
          increment: true,
          push: false,
        });
      } else if (previousStatus === "loss" && editor.newStatus === "win") {
        updates.push({
          updatePath: `statistics.initialInvestment`,
          newValue: stake * odds,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.totalLosses`,
          newValue: -1,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.totalWins`,
          newValue: 1,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.monthlyStats.${month - 1}.totalWins`,
          newValue: 1,
          increment: true,
          push: false,
        });
        updates.push({
          updatePath: `statistics.monthlyStats.${month - 1}.totalLosses`,
          newValue: -1,
          increment: true,
          push: false,
        });
      }

      fetch("http://localhost:1337/updateStatistics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + JWT,
        },
        body: JSON.stringify({
          updates: updates,
        }),
      })
        .then(() => {
          fetch("http://localhost:1337/updateBet", {
            // Update the actual bet status on the server
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + JWT,
            },
            body: JSON.stringify({
              bet: {
                betId: editor.parlay
                  ? editor.bet[0].parlayId
                  : editor.bet.betId,
                date: editor.parlay ? editor.bet[0].date : editor.bet.date,
                newStatus: editor.newStatus,
                isParlay: editor.parlay,
              },
            }),
          })
            .then((response) => {
              if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status}`);
                return Promise.reject(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {})
            .catch((error) => {
              console.error("Error updating bet:", error);
            });
        })
        .then((res) => {
          userStats.statistics.initialInvestment = 0;
        });
    } else {
      setEditor((prev: any) => ({
        ...prev,
        editorStatus: "Ovaj status je trenutni status.",
      }));
    }
  };

  return (
    <div className="overflow-x-auto px-4 py-6 select-none">
      <table className="w-full min-w-max bg-gray-800 shadow-md rounded-lg overflow-hidden max-h-[400px]">
        <thead className="bg-gray-800 text-white sticky z-10 top-0">
          <tr className="text-sm md:text-base">
            <th className="px-4 py-2 text-left">Meč</th>
            <th className="px-4 py-2 text-left">Kvota</th>
            <th className="px-4 py-2 text-left">Ulog</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Azuriraj</th>
          </tr>
        </thead>
        <tbody>
          {bets?.map((bet, index) =>
            !Array.isArray(bet) ? (
              <tr
                key={index}
                className={`border-b text-sm md:text-base after:content-[''] after:absolute relative after:left-0 after:h-full after:w-2 ${
                  bet.status === "win"
                    ? "after:bg-green-500"
                    : "after:bg-red-500"
                }`}
              >
                <td className="px-4 py-2 whitespace-nowrap">{bet.match}</td>
                <td className="px-4 py-2 whitespace-nowrap">{bet.odds}</td>
                <td className="px-4 py-2 whitespace-nowrap">{bet.stake}</td>
                <td className="px-4 py-2 whitespace-nowrap">{bet.status}</td>
                <td className="px-4 py-2">
                  {!readOnly && (
                    <button onClick={() => openEditor(bet)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="gold"
                        className="size-5 md:size-6 cursor-pointer"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              bet[0] && (
                <React.Fragment key={index}>
                  <tr
                    key={index}
                    className={`border-b bg-gray-800 text-sm md:text-base cursor-pointer after:absolute relative after:left-0 after:h-full after:w-2 ${
                      bet[0].status === "win"
                        ? "after:bg-green-500"
                        : "after:bg-red-500"
                    }`}
                    onClick={() => toggleParlay(index)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-cyan-500">
                      [Sistem {bet.length - 1} meča]
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {bet[0].totalOdds}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {bet[0].stake}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {bet[0].status}
                    </td>
                    <td className="px-4 py-2" onClick={() => openEditor(bet)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="orange"
                        className="size-5 md:size-6 cursor-pointer"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                    </td>
                  </tr>

                  {openParlayIndex === index &&
                    bet.map(
                      (parlayGame, parlayIndex) =>
                        parlayIndex > 0 && (
                          <tr
                            key={parlayIndex}
                            className="border-b text-sm md:text-base"
                          >
                            <td className="px-4 py-2 whitespace-nowrap">
                              {parlayGame.match}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              Opklada iz sistema.
                            </td>
                          </tr>
                        )
                    )}
                </React.Fragment>
              )
            )
          )}
        </tbody>
      </table>

      {editor.visible &&
        createPortal(
          <div className="z-50 absolute left-1/2 top-1/2 transform w-full -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg p-6 flex flex-col max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow-2xl  transition-all duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-semibold text-lg">
                Promeni status opklade (Trenutno je {` `}
                {editor.parlay ? (
                  <span
                    className={`${
                      editor.bet[0].status === "win"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {editor.bet[0].status}
                  </span>
                ) : (
                  <span>{editor.bet.status}</span>
                )}
                )
              </span>
              <div
                className="text-white text-2xl cursor-pointer hover:text-red-400"
                onClick={closeEditor}
              >
                X
              </div>
            </div>
            <select
              className={`bg-gray-800  p-2 rounded-md border-2 border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 ${
                editor.newStatus === "win" ? "text-green-500" : "text-red-500"
              }`}
              defaultValue={editor.newStatus}
              onChange={(e) =>
                setEditor((prev) => ({ ...prev, newStatus: e.target.value }))
              }
            >
              <option value="win" className="text-green-500">
                Dobitan
              </option>
              <option value="loss" className="text-red-500">
                Gubitan
              </option>
            </select>
            <button
              className="bg-green-500 mt-4 rounded-md p-3 hover:bg-green-600 text-white font-semibold transition-colors duration-300 cursor-pointer"
              onClick={saveChanges}
            >
              Sacuvaj
            </button>
            <div className="mt-2">
              {editor.editorStatus && editor.editorStatus}
            </div>
          </div>,
          document.getElementById("modal-root")
        )}
    </div>
  );
}
