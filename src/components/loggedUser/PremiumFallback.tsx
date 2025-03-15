import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

export default function PremiumFallback({
  premiumType,
}: {
  premiumType: string;
}): React.ReactNode {
  const currentUser = useSelector((state: RootState) => state.user);
  return (
    <div className=" h-full w-full flex justify-center items-center">
      <>
        <div className="flex flex-col text-center">
          Pozdrav, {currentUser.username}, ova usluga je namenjena samo za{" "}
          <span className="text-gold">
            {premiumType === "both" ? " Premium i Lite" : premiumType}{" "}
            korisnike.
          </span>
          <button className="text-center bg-orange-600 p-1.5 rounded-sm cursor-pointer">
            Kupi Premium danas.
          </button>
        </div>
      </>
    </div>
  );
}
