import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router";
import logo from "../assets/insider_logo.png";
import { logout } from "../redux/slices/UserSlice";
import useraccount from "../assets/account.png";
import { RootState } from "../redux/store";

export default function Navbar(): React.ReactNode {
  const navItems = [
    { text: "Početna", url: "/" },
    { text: "O nama", url: "/onama" },
    { text: "Kupi Premium", url: "/kupi" },
    { text: "Login", url: "/login" },
  ];

  const location = useLocation();
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const nav = useNavigate();
  const userData = useSelector((state: RootState) => state.user);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const dispatch = useDispatch();

  const LogOff = () => {
    setIsMenuOpen(false);
    dispatch(logout());
  };

  useEffect(() => {
    setSelectedUrl(location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex w-full">
      <div onClick={() => nav("/")}>
        <img src={logo} className="w-14 h-14 md:w-24 md:h-24 cursor-pointer" />
      </div>
      <div className="flex w-full justify-center items-center gap-4 md:gap-8 relative ">
        {navItems.map((navItem, index) => (
          <Link
            to={navItem.url}
            key={navItem.url}
            className={`text-base md:text-lg ${
              selectedUrl === navItem.url ? "text-blue-500" : ""
            } ${
              index === navItems.length - 1 &&
              `bg-blue-900 rounded-sm p-1.5 hover:bg-blue-950 text-white transition-colors duration-150 absolute right-4 hidden md:${
                userData.username === null && "block"
              } ${userData.username != null && "hidden"}`
            }`}
          >
            {navItem.text}
          </Link>
        ))}

        <div className="absolute md:hidden right-4">
          {userData.username ? (
            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="gold"
                className="size-7"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <div
                className={`fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center transition-all duration-500 ease-in-out ${
                  isMenuOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg z-50 flex flex-col w-[90%]">
                  <span className="text-gold text-center">
                    {userData.username}
                  </span>
                  <p>Vi ste {userData.tier} korisnik.</p>
                  <span className="text-xs text-blue-300">
                    {userData.tier !== "Free" &&
                      "*Hvala Vam sto koristite nase usluge."}
                  </span>
                  <div className="my-3 border-t">
                    {userData.tier === "Free" ? (
                      <>
                        <div>Besplatni Tipovi</div>
                        <span>
                          Sa besplatnim planom nemate mnogo mogucnosti,{" "}
                          <span className="text-gold">
                            pogledajte ostale planove
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <div>Premium Tipovi</div>
                        <div>Pracenje profita</div>
                      </>
                    )}
                  </div>
                  <button
                    className="bg-red-800 rounded-sm p-1.5"
                    onClick={LogOff}
                  >
                    Izlogujte se
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => nav("/login")}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6 cursor-pointer ml-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                />
              </svg>
            </div>
          )}
        </div>
        {userData.username != null && (
          <div
            className="hidden md:block w-8 h-8 bg-cyan-500 rounded-full cursor-pointer absolute right-4"
            onClick={() => nav("/my-account")}
          >
            <img src={useraccount} className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}
