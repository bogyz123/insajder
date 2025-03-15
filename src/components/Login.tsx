import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import yamal from "../assets/yamal_login.jpg";
import { setUser } from "../redux/slices/UserSlice";
import "../index.css";

export default function Login({ mode }: { mode: string }): React.ReactNode {
  const [currentView, setCurrentView] = useState<string>(mode);
  interface FormData {
    email: string; // Used for both login and register.
    username?: string; // Used only by register.
    defaultCurrency?: string;
    password: string;
    errorMessage: string | null;
  }
  const [formData, setFormData] = useState<FormData>({
    password: "",
    email: "",
    errorMessage: null,
  });
  const nav = useNavigate();
  const dispatch = useDispatch();
  const dispatchAction = (action: string): void => {
    if (!areAllConditionsMet) {
      setFormData((prev) => ({
        ...prev,
        errorMessage: "Morate popuniti sva polja.",
      }));
      return;
    }

    if (action === "login") {
      fetch("http://localhost:1337/login", {
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json();
            setFormData((prev) => ({
              ...prev,
              errorMessage: errData.message || "Neuspela prijava",
            }));
            return;
          }

          const data = await res.json();
          const token = data.token;
          localStorage.setItem("insajder_token", token);

          fetch("http://localhost:1337/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Neuspelo dobavljanje korisničkih podataka");
              }
              return response.json();
            })
            .then((user) => {
              dispatch(
                setUser({
                  _id: user.user._id,
                  email: user.user.email,
                  tier: user.user.tier,
                  username: user.user.username,
                  isAuthenticated: true,
                  defaultCurrency: user.user.defaultCurrency,
                })
              );
              nav("/");
            })
            .catch((error) => {
              console.error(error);
              localStorage.removeItem("insajder_token");
              setFormData((prev) => ({
                ...prev,
                errorMessage: "Sesija je istekla. Prijavite se ponovo.",
              }));
            });
        })
        .catch((error) => {
          console.error(error);
          setFormData((prev) => ({
            ...prev,
            errorMessage: "Problem sa serverom. Pokušajte ponovo kasnije.",
          }));
        });
    } else if (action === "register") {
      if (
        !formData.defaultCurrency ||
        formData.defaultCurrency === "Izaberite vasu valutu" ||
        !formData.email.includes("@") ||
        !formData.email.includes(".")
      ) {
        setFormData((prev) => ({
          ...prev,
          errorMessage:
            "Molimo, izaberite Vašu valutu i popunite svako polje kao i validan e-mail.",
        }));
        return;
      }

      if (formData.password.length < 5) {
        setFormData((prev) => ({
          ...prev,
          errorMessage: "Molimo, unesite šifru dužu od 5 karaktera.",
        }));
        return; // Added missing return
      }

      fetch("http://localhost:1337/register", {
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          defaultCurrency: formData.defaultCurrency,
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json();
            setFormData((prev) => ({
              ...prev,
              errorMessage: errData.message || "Registracija nije uspela",
            }));
            return;
          }
          setCurrentView("login");
        })
        .catch((error) => {
          console.error(error);
          setFormData((prev) => ({
            ...prev,
            errorMessage: "Problem sa serverom. Pokušajte ponovo kasnije.",
          }));
        });
    }
  };
  const areAllConditionsMet = () => {
    return [...Object.values(formData)].every(
      (item) => item != null && item != ""
    );
  };
  return (
    <div className="max-w-[90%] flex mx-auto h-full p-2 justify-center items-center">
      <>
        <div className="w-full p-4 flex flex-col md:flex-row md:gap-x-4 bg-black/20 h-max">
          <div className=" w-full mb-4 bg-black/20 p-4">
            <img
              src={yamal}
              className="starting:-translate-x-[50px] starting:scale-90 transition-all duration-1000 ease-in-out starting:opacity-0 w-full h-auto max-h-[300px] max-w-fit  md:max-h-[450px] object-cover rounded-md min-w-full"
            />
          </div>
          <div className="w-full relative flex flex-col overflow-hidden">
            {currentView === "register" && (
              <div className="flex flex-col">
                <span>Valuta</span>
                <select
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      defaultCurrency: e.target.value,
                    }))
                  }
                  className="rounded-sm p-2 focus:ring-1 border  main-gradient cursor-pointer border-gray-600 focus:outline-2 focus:outline-blue-500"
                >
                  <option selected className="bg-card">
                    Izaberite vasu valutu
                  </option>
                  <option className="bg-card" value="rsd">
                    RSD
                  </option>
                  <option className="bg-card" value="eur">
                    EUR
                  </option>
                </select>

                <span className="starting:-translate-x-[10px] starting:opacity-0 transition-all duration-500">
                  Korisnicko ime
                </span>
                <input
                  type="text"
                  placeholder="Ime na sajtu"
                  className=" rounded-sm p-2 focus:ring-1 border border-gray-600 focus:outline-2 "
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />
              </div>
            )}
            <div className="flex flex-col  px-2">
              <span className="starting:-translate-x-[10px] starting:opacity-0 transition-all duration-500">
                Email adresa
              </span>
              <input
                type="email"
                placeholder="Vasa e-mail adresa"
                className=" rounded-sm p-2 focus:ring-1 border border-gray-600 hover:scale-[1.01] transition-transform duration-350 ease"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col px-2">
              <span className="starting:-translate-x-[10px] starting:opacity-0 transition-all duration-500">
                Vasa Lozinka
              </span>
              <input
                type="text"
                placeholder="Lozinka"
                className=" rounded-sm p-2 focus:ring-1 border border-gray-600 hover:scale-[1.01] transition-transform duration-350 ease"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              <div className="flex place-items-center gap-x-2">
                <span>Zapamti me</span>
                <input
                  type="checkbox"
                  className="rounded-sm accent-cyan-500 size-4"
                />
              </div>
            </div>
            <p className="text-red-500 font-bold flex gap-x-2">
              {formData.errorMessage}{" "}
              {formData.errorMessage && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              )}
            </p>
            <button
              onClick={() =>
                dispatchAction(currentView === "login" ? "login" : "register")
              }
              className="w-full bg-cyan-800 hover:bg-cyan-600 shadow-lg mb-2 shadow-blue-950 rounded-sm p-1.5 starting:translate-y-[20px] transition-all duration-500 ease starting:opacity-0 cursor-pointer"
            >
              {currentView === "login" ? "Ulogujte se" : "Registrujte se"}
            </button>
            <p
              onClick={() =>
                setCurrentView((prev) =>
                  prev === "login" ? "register" : "login"
                )
              }
              className="text-cyan-500 cursor-pointer select-none mx-auto"
            >
              {currentView === "login"
                ? "Nemate nalog? Registrujte se."
                : "Imate nalog? Ulogujte se."}
            </p>
            <div className="testFont flex md:text-2xl xl:text-4xl  h-full justify-center items-center starting:translate-y-full  starting:opacity-0 transition-all duration-1000 ease">
              INSAJDER.TIPS
            </div>
          </div>
        </div>
      </>
    </div>
  );
}
