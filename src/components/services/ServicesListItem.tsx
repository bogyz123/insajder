export default function ServicesListItem({
  children,
  bg,
  tier,
}: {
  children: React.ReactNode;
  bg: string;
  tier: string;
}): React.ReactNode {
  return (
    <div
      className={`${bg} border border-blue-800 p-2 rounded-sm ${
        tier === "lite" ? "bg-amber-200" : "bg-amber-500"
      } cursor-pointer grow transition-all duration-300 ease hover:scale-[1.01] hover:contrast-105`}
    >
      {children}
    </div>
  );
}
