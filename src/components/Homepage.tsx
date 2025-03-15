import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";

export default function Homepage(): React.ReactNode {
  useEffect(() => {
    document.title = "Insajder | Početna";
  }, []);
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(
    (state: RootState) => state.user.isAuthenticated
  );

  const userData = useSelector((state: RootState) => state.user);
  if (isLoggedIn) {
    return (
      <div className="flex w-full flex-col">
        <div className="text-md mx-auto mt-2.5 text-lg md:text-xl lg:text-3xl">
          Dobrodosao nazad, {userData?.username}.
        </div>
      </div>
    );
  } else {
    return <div>Called homepage but not logged in.</div>;
  }
}
