import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/UserSlice";
import { useNavigate } from "react-router";
import { RootState } from "../../redux/store";

export default function MyAccount(): React.ReactNode {
  const [newUsername, setNewUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useSelector((state: RootState) => state.user);
  const nav = useNavigate();
  const dispatch = useDispatch();
  const LogOff = () => {
    dispatch(logout());
    nav("/");
  };
  const saveChanges = () => {
    if (!newUsername || newUsername.length < 4) {
      setError("Ime mora biti duze od 3 karaktera.");
    } else {
      if (error) {
        setError(null);
      }
    }
  };
  return (
    <div className="w-[80%] my-auto flex flex-col mx-auto h-max md:w-[60%] p-4 rounded-md main-gradient shadow-lg shadow-blue-950">
      <div className="main-gradient p-4 rounded-md flex flex-col gap-x-2 border border-blue-950">
        <div className="w-24 h-24 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="white"
            className="size-24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder={currentUser?.username}
          className="border-b p-1.5 h-max w-full"
          onChange={(e) => setNewUsername(e.target.value)}
        ></input>
        <div>
          Vi ste <span>{currentUser.tier}</span> korisnik.
        </div>
        <div>{currentUser.email}</div>
      </div>
      {newUsername != null && (
        <>
          <button
            className="bg-blue-800 p-1.5 rounded-md my-2 cursor-pointer"
            onClick={() => saveChanges()}
          >
            Sacuvaj promene
          </button>
        </>
      )}
      <button
        onClick={LogOff}
        className="bg-red-500 p-1.5 rounded-sm cursor-pointer hover:bg-red-600 transition-colors duration-350"
      >
        Izloguj se
      </button>
      {error && <p className="text-red-500 font-bold">{error}</p>}
    </div>
  );
}
