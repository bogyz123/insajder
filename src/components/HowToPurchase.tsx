import { useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useNavigation,
  useOutlet,
  useParams,
} from "react-router";

export default function HowToPurchase() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const paymentData = [
    {
      title: "PayPal",
      description:
        "Proces je brz i jednostavan. Potrebno je da pratite nekoliko koraka na sajtu i odmah ćete dobiti pristup premium sadržaju nakon potvrde uplate.",
      url: "/kupi/paypal",
    },
    {
      title: "Uplatnica",
      description:
        "Ako se odlučite za uplatu putem uplatnice, potrebno je da izvršite uplatu i zatim uploadujete sliku uplatnice na naš sajt. Nakon što primimo sliku, naši administratori će u što kraćem roku ažurirati vaš nalog i omogućiti vam pristup svim premium funkcijama.",
      url: "/kupi/uplatnica",
    },
    {
      title: "Kartica",
      description:
        "Kupovina karticom se vrsi preko Stripe sigurne platforme. Nakon uspesne transakcije Premium pretplata ce automatski biti aktivirana.",
      url: "/kupi/kartica",
    },
  ];
  const outlet = useOutlet();
  const nav = useNavigate();
  return (
    <div className="w-full min-h-screen bg-inherit p-6 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full bg-gray-800 p-8 rounded-lg shadow-lg text-white">
        {outlet ? (
          outlet
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-6 text-center">
              Kako mogu da kupim članstvo na Insajder platformi?
            </h2>
            <p className="text-lg mb-4">
              Za kupovinu Premium članstva, možete koristiti nekoliko opcija
              plačanja:
            </p>

            {paymentData.map((paymentMethod, index) => (
              <div
                className={`bg-gray-900 p-4 rounded-md mb-6 border-l-4  hover:scale-105 transition-[transform, colors] duration-500 cursor-pointer hover:bg-gray-900/50 ${
                  selectedOption === index
                    ? "border-green-500"
                    : "border-blue-500"
                }`}
                onClick={() => setSelectedOption(index)}
              >
                <h3 className="text-xl font-semibold mb-2">
                  {paymentMethod.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {paymentMethod.description}
                </p>
              </div>
            ))}

            <div className="text-center">
              <p className="text-sm text-gray-500">
                <strong>Napomena:</strong> Kliknite na jedan od nacina placanja
                da biste nastavili dalje.
              </p>
              <button
                className={`w-full  rounded-md p-1.5  my-1.5 ${
                  selectedOption === null
                    ? "bg-gray-700/50"
                    : "bg-blue-800/40 cursor-pointer"
                }`}
                onClick={() =>
                  nav(`${paymentData[selectedOption].url}`, {
                    state: { selectedOption: selectedOption },
                  })
                }
              >
                Dalje
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export function StepTwo() {
  const { paymentOption } = useParams();
  if (
    paymentOption !== "paypal" &&
    paymentOption !== "kartica" &&
    paymentOption !== "uplatnica"
  ) {
    return <div>Izabrali ste nepostojeci nacin placanja.</div>;
  }

  return <div>Izabrali ste {paymentOption}</div>;
}
