import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

export default function TipsViews(): React.ReactNode {
  const tier = useSelector((state: RootState) => state.user?.tier);
  return <div>TipsView {tier}</div>;
}
