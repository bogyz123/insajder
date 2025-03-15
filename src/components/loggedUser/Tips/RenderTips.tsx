import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import PremiumFallback from "../PremiumFallback";

interface RenderTipsProps {
  tier: "free" | "premium";
}

interface Tip {
  tip: string;
  type: string;
  tipTitle: string;
  analysis: string;
  date: String;
}

const RenderTips: React.FC<RenderTipsProps> = ({ tier }) => {
  // State management
  const [tips, setTips] = useState<Tip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const JWT = localStorage.getItem("insajder_token");
  const currentUser = useSelector((state: RootState) => state.user);

  const fetchTips = async () => {
    if (!JWT) {
      setError("Doslo je do greske. Molimo da se relogujete.");
      return;
    }

    setLoading(true);

    try {
      // Fetches the tips free or premium, dynamically, server checks JWT to make sure the user has that role.
      const response = await fetch(`http://localhost:1337/tips/${tier}/2`, {
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
      });

      if (!response.ok && response.status === 403) {
        setError("Nemate pristup Premium tipovima.");
        return;
      }

      const json = await response.json();
      console.log(json);
      setTips(json);
      setError(null);
    } catch (error) {
      setError("Došlo je do greške prilikom učitavanja podataka.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // On initial render, fetch the tips.
    fetchTips();
  }, []);

  if (!currentUser.isAuthenticated) {
    return <div>NoAuth</div>;
  } else {
    return (
      <div className="bg-gray-950 shadow-xl p-6 w-full min-h-screen flex justify-center items-center py-10">
        {loading ? (
          <div className="text-xl text-gray-300">Učitavanje...</div> // Loading message
        ) : error ? (
          <div className="flex flex-col items-center text-center max-w-[80%] md:max-w-[60%] bg-gray-800 p-6 rounded-lg shadow-lg  m-auto">
            <div className=" text-white p-4 rounded-lg shadow-md mb-4 w-full">
              <PremiumFallback premiumType="Premium" />
            </div>

            <div className="font-bold text-xl text-white mb-4">
              Premium tipovi su ekskluzivni sportski tipovi koje pružaju naši
              stručnjaci na platformi Insajder. Ovi tipovi su pažljivo
              analizirani, bazirani na dubokim statistikama i predviđanjima, što
              vam omogućava da ostvarite bolje rezultate i veći profit u
              klađenju.
            </div>
          </div>
        ) : tips.length === 0 ? (
          <p className="text-xl text-gray-300">
            Trenutno nema tipova u ponudi.
          </p>
        ) : (
          <div className="space-y-6 w-full max-w-4xl">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="flex flex-col relative bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <span
                  className={`${
                    tip.type === "free" ? "bg-gray-600" : "bg-orange-500"
                  } w-fit p-1 rounded-sm`}
                >
                  {tip.type} tip
                </span>
                <div className="text-xl font-semibold text-blue-400">
                  {tip.tipTitle}
                </div>
                <div className="text-md text-gray-200 mt-2">
                  Mi tipujemo:{" "}
                  <span className="font-medium text-blue-300">{tip.tip}</span>
                </div>
                <div className="text-md text-gray-400 mt-2">
                  <strong>Analiza:</strong>{" "}
                  <span className="text-gray-200">{tip.analysis}</span>
                </div>
                <div className="absolute top-2 right-2 font-bold">
                  {tip?.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
};

export default RenderTips;
