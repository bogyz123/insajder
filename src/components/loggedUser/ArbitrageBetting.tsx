import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import PremiumFallback from "./PremiumFallback";

export default function ArbitrageBetting(): React.ReactNode {
  const currentUser = useSelector((state: RootState) => state?.user);
  return (
    <div className="flex flex-col h-full   w-[85%] mx-auto">
      {!currentUser.isAuthenticated && <p>No auth</p>}
      {currentUser.tier === "free" ? (
        <div className="flex flex-col items-center text-center max-w-[80%] md:max-w-[60%] bg-gray-800 p-6 rounded-lg shadow-lg  m-auto">
          <div className=" text-white p-4 rounded-lg shadow-md mb-4 w-full">
            <PremiumFallback premiumType="Premium" />
          </div>

          <div className="font-bold text-xl text-white mb-4">
            Arbitražno klađenje, ili sure betting, je strategija koja omogućava
            igračima da ostvaruju siguran profit iskorišćavanjem razlika u
            kvotama između različitih kladionica za isti događaj. Ova tehnika
            omogućava postavljanje opklada na sve moguće ishode jednog događaja
            u različitim kladionicama, garantujući profit bez obzira na krajnji
            ishod meča.
          </div>
        </div>
      ) : (
        <p>paid</p>
      )}
    </div>
  );
}
